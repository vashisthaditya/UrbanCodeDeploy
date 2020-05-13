/*
* Licensed Materials - Property of IBM* and/or HCL**
* UrbanCode Deploy
* (c) Copyright IBM Corporation 2011, 2017. All Rights Reserved.
* (c) Copyright HCL Technologies Ltd. 2018. All Rights Reserved.
*
* U.S. Government Users Restricted Rights - Use, duplication or disclosure restricted by
* GSA ADP Schedule Contract with IBM Corp.
*
* * Trademark of International Business Machines
* ** Trademark of HCL Technologies Limited
*/
/*global define, i18n */
define([
        "dojo/_base/declare",
        "dijit/_Widget",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dojo/_base/array",
        "dojo/dom-class",
        "dojo/dom-style",
        "dojo/dom-construct",
        "dojo/_base/lang",
        "dojo/_base/xhr",
        "dojo/window",
        "dojo/on"
        ],
function(
        declare,
        _Widget,
        _WidgetBase,
        _TemplatedMixin,
        array,
        domClass,
        domStyle,
        domConstruct,
        lang,
        baseXhr,
        win,
        on
) {

    var BLOCK_COOKIE_KEY_PREFIX = "_BLOCK_ALERT_";

    return declare(
        [_WidgetBase, _TemplatedMixin],
        {
            templateString: '<div class="pageAlerts">' +
                                '<div data-dojo-attach-point="alertAttach"></div>' +
                            '</div>',

            /**
             *
             */
            postCreate: function() {
                this.inherited(arguments);
                var self = this;

                array.forEach(this.alerts, function(item) {
                    if (!self.isAlertBlocked(item)) {
                        self.addAlert(item);
                    }
                });
            },

            addAlert: function(item) {
                if (!item.userCanDismiss || !this.isAlertBlocked(item)) {
                    var self = this;
                    var alert;
                    // Container to hold alert info
                    var containerDiv = domConstruct.create('div', {
                        'class': 'pageAlert'
                    }, self.alertAttach);

                    var alertDiv = domConstruct.create('div', {});

                    if (item.text) {
                        alertDiv.innerHTML = item.text.escape();
                    }
                    else if (item.html) {
                        if (typeof item.html === "object") {
                            domConstruct.place(item.html, alertDiv);
                        }
                        else {
                            alertDiv.innerHTML = item.html;
                        }
                    }
                    else if (item.messageId) {
                        alert = self.getAlert(item.messageId);
                        alertDiv = alert.getDisplay(item);
                    }
                    containerDiv.appendChild(alertDiv);

                    // allow user to dismiss and block this message
                    // unless message specifically says not to dismiss
                    if (item.userCanDismiss) {
                        var closeDiv = domConstruct.create('div', {
                            "title": i18n("Dismiss"),
                            'class': 'dismiss'
                        }, containerDiv);

                        on (closeDiv, 'click', function() {
                            // give user option of undoing, or reminding them of alert
                            self.blockAlert(item, alertDiv, closeDiv, containerDiv, function(){
                                if (item.messageId && alert && alert.dismiss) {
                                    alert.dismiss(item);
                                }
                                domConstruct.destroy(containerDiv);
                            });
                        });
                    }

                    // Any optional classes to add to the alert
                    if (item.className) {
                        domClass.add(containerDiv, item.className);
                    }
                }
            },

            getAlert: function(alertId, args) {
                var result;
                if (config && config.data && config.data.alerts) {
                    result = config.data.alerts[alertId];
                }
                return result;
            },

            isAlertBlocked: function(item) {
                return util.getCookie(this.getCookieKey(item)) === "true";
            },

            blockAlert: function(item, alertDiv, closeDiv, containerDiv, callback) {
                var self = this;

                // hide alert
                domClass.add(alertDiv, "hidden");
                domClass.add(closeDiv, "hidden");
                if (item.className) {
                    domClass.remove(containerDiv, item.className);
                }

                // show dismiss message
                domClass.add(containerDiv, "dismissMessage");
                var dismissDiv = domConstruct.create('div', {});
                containerDiv.appendChild(dismissDiv);
                domConstruct.create('span', {
                    innerHTML: i18n("Alert dismissed!")
                }, dismissDiv);

                // Undo
                var undo = domConstruct.create('span', {
                    innerHTML: i18n("Undo"),
                    "class": "link"
                }, dismissDiv);
                on (undo, 'click', function() {
                    if (self.docClick) {
                        self.docClick.remove();
                    }
                    // reshow alert
                    domClass.remove(alertDiv, "hidden");
                    domClass.remove(closeDiv, "hidden");
                    domClass.remove(containerDiv, "dismissMessage");
                    if (item.className) {
                        domClass.add(containerDiv, item.className);
                    }
                    domConstruct.destroy(dismissDiv);
                });

                // add reminders
                var remindMe = domConstruct.create('span', {
                    innerHTML: i18n("Remind me:"),
                    style: {
                        marginLeft: "5px"
                    }
                }, dismissDiv);
                self.addReminder(item, dismissDiv, i18n("tomorrow"), "1", true, callback);
                self.addReminder(item, dismissDiv, i18n("next week"), "7", true, callback);
                self.addReminder(item, dismissDiv, i18n("never"), "99999", false, callback);

                // if they click anywhere else, we set expiration to decades
                setTimeout(function(){
                    self.docClick = on.once(document, "click", function(){
                        util.setCookie(self.getCookieKey(item), "true", "9000");
                        callback();
                     });
                });
            },

            addReminder: function(item, dismissDiv, when, expiration, more, callback) {
                var self = this;
                var reminder = domConstruct.create('span', {
                    innerHTML: when,
                    "class": "link"
                }, dismissDiv);
                on (reminder, 'click', function() {
                    if (self.docClick) {
                        self.docClick.remove();
                    }
                    util.setCookie(self.getCookieKey(item), "true", Number(expiration));
                    callback();
                });
                if (more) {
                    var comma = domConstruct.create('span', {
                        innerHTML: ",",
                        style: {
                            marginRight: "3px"
                        }
                    }, dismissDiv);
                }
            },

            cleanAlertBlocks: function(alerts) {
                // build list of cookies that can potentially be used to block alerts
                var self = this;
                var blockers = [];
                array.forEach(alerts, function(alert) {
                    blockers.push(self.getCookieKey(alert));
                });

                // loop through all cookies:
                //  if it begins with block prefix but isn't
                //   a current alert, clean it up
                var i;
                var allCookies = document.cookie.split(';');
                for (i=0; i <= allCookies.length; i++) {
                    var cookiePair = (allCookies[i]||"").trim();
                    if (cookiePair && cookiePair.indexOf(BLOCK_COOKIE_KEY_PREFIX) === 0 ) {
                        var cookieKey = (cookiePair.split('=')[0]||"").trim();
                        if (blockers.indexOf(cookieKey) === -1) {
                            util.clearCookie(cookieKey);
                        }
                    }
                }
            },

            getCookieKey: function(item) {
                var d = item.data || item;
                return BLOCK_COOKIE_KEY_PREFIX + d.priority +
                  (d.dismissId || d.messageId || d.message.substr(16));
            }

        }
    );
});

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
/*global define, require */
define(['dojo/_base/declare',
        'dijit/_WidgetBase',
        'dojo/on',
        'dojo/dom-class',
        'dojo/dom-construct',
        'dijit/focus',
        'js/webext/widgets/Dialog'],
        function (
            declare,
            _WidgetBase,
            on,
            domClass,
            domConstruct,
            focusUtil,
            Dialog) {
    /**
     *
     * Supported public properties/functions:
     *  name / String                   (required) The name of the alert. The name is important for determining user
     *                                  preference of when to show or not show the popup. It is saved in the backend.
     *
     *  open / Function                 Function to show the popup
     *
     *  close / Function                Function to hide the popup
     *
     */
    return declare('deploy.widgets.GetStartedPopup',
            [_WidgetBase], {

        name: undefined,
        alertName: undefined,
        links: {},

        /**
         * create dialog
         * check backend to determine whether to automatically show the get-started dialog
         * @private
         */
        postCreate: function() {
            var self = this;

            this.createDialog();
        },

        /**
         * @private
         */
        createDialog: function() {
            var self = this;
            this.gsDialog = new Dialog({
                className: 'get-started-popup'
            });

            var getStartedCloseButton = domConstruct.create('div', {
                className: 'close-popup-button',
                title: i18n('Close')
            }, this.gsDialog.titleNode);
            on(getStartedCloseButton, 'click', function() {
                self.close();
            });

            domConstruct.create('div', {
               innerHTML: '<h1 class="title">' + i18n("Getting started") + '</h1>' +
                          '<div class="content">' +
                            '<div class="message">' + i18n("Access this anytime from the banner help menu.") + '</div>' +
                            '<div class="bottomrow">' +
                              '<div class="badgecontainer tutorial-container" tabindex="1">' +
                                '<div class="secondarytaskbadges tutorial"></div>' +
                                '<div class="secondarytasklbl">' + i18n("Tutorials") + '</div>' +
                              '</div>' +
                              '<div class="badgecontainer videos-container" tabindex="2">' +
                                '<div class="secondarytaskbadges videos"></div>' +
                                '<div class="secondarytasklbl">' + i18n("Instructional Videos") + '</div>' +
                              '</div>' +
                              '<div class="badgecontainer questions-container" tabindex="3">' +
                                '<div class="secondarytaskbadges questions"></div>' +
                                '<div class="secondarytasklbl">' + i18n("Questions") + '</div>' +
                              '</div>' +
                              '<div class="badgecontainer documentation-container" tabindex="4">' +
                                '<div class="secondarytaskbadges documentation"></div>' +
                                '<div class="secondarytasklbl">' + i18n("Documentation") + '</div>' +
                              '</div>' +
                            '</div>' +
                          '</div>'
            }, this.gsDialog.containerNode);

            var clickables = dojo.query('.get-started-popup .badgecontainer');
            dojo.forEach(clickables, function(el) {
                if (domClass.contains(el, 'tutorial-container')) {
                    on(el, 'click, keypress', function(evt) {self.launch(evt, 'tutorial');});
                }
                else if (domClass.contains(el, 'videos-container')) {
                    on(el, 'click, keypress', function(evt) {self.launch(evt, 'video');});
                }
                else if (domClass.contains(el, 'questions-container')) {
                    on(el, 'click, keypress', function(evt) {self.launch(evt, 'question');});
                }
                else if (domClass.contains(el, 'documentation-container')) {
                    on(el, 'click, keypress', function(evt) {self.launch(evt, 'documentation');});
                }
            });
        },

        /**
         * @private
         */
        a11yClick: function(event) {
            if (event.type === 'click') {
                return true;
            }
            if (event.type === 'keypress') {
                var code = event.charCode || event.keyCode;
                if ((code === 32) || (code === 13)) {
                    return true;
                }
            }
            return false;
        },

        /**
         * @private
         */
        launch: function(evt, target) {
            if (this.a11yClick(evt) && config.docLinks[target + 'Url']) {
                window.open(config.docLinks[target + 'Url'], '_blank');
            }
        },

        /**
         * @public
         */
        open: function() {
            if (this.gsDialog) {
                this.gsDialog.show();
            }
        },

        /**
         * @public
         */
        close: function() {
            if (this.gsDialog) {
               this.gsDialog.hide();
            }
        }

    });
});

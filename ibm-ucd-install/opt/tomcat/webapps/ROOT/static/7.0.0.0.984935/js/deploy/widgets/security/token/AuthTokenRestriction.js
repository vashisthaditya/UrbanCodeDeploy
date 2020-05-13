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

define([
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dijit/form/Button",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/dom-construct",
        'dojo/dom-style',
        "dojo/on",
        "js/webext/widgets/Alert",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/FormDelegates",
        "js/webext/widgets/RestSelect"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        declare,
        xhr,
        domConstruct,
        domStyle,
        on,
        Alert,
        ColumnForm,
        FormDelegates,
        RestSelect
) {
    return declare('deploy.widgets.security.token.AuthTokenRestriction',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="authTokenRestriction">'+
            '  <div class="authTokenRestriction-mode" data-dojo-attach-point="modeAttach"></div>'+
            '  <div class="authTokenRestriction-url" data-dojo-attach-point="textAttach"></div>'+
            '  <div class="removeIcon" data-dojo-attach-point="closeAttach"></div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            var self = this;
            var delegates = new FormDelegates();

            this.select = delegates.getDelegate("SELECT")({
                allowedValues: [
                    {value: "ALL", label: i18n("ALL")},
                    {value: "DELETE", label: "DELETE"},
                    {value: "GET", label: "GET"},
                    {value: "POST", label: "POST"},
                    {value: "PUT", label: "PUT"}
                ],
                readOnly: self.readOnly
            });
            this.select.placeAt(this.modeAttach);

            this.textbox = delegates.getDelegate("TEXT")({
                placeHolder: i18n("/rest/deploy/components"),
                readOnly: self.readOnly
            });
            this.textbox.placeAt(this.textAttach);

            if (!!this.restriction) {
                this.select.set('value', this.restriction.verb);
                this.textbox.set('value', this.restriction.url);
            }

            if (this.firstInList) {
                // Not allowed to delete all restrictions.
                domConstruct.destroy(this.closeAttach);
            }
            else {
                on(this.closeAttach, 'click', function() {
                    self.onDestroy();
                });
            }
        },

        getMode: function() {
            return this.select.get('value');
        },

        getURI: function() {
            return this.textbox.get('value');
        },

        getValue: function() {
            return {
                verb: this.getMode(),
                url: this.getURI()
            };
        },

        validateURI: function() {
            var value = this.textbox.get('value');
            var index = value.indexOf("*");
            if (index !== -1 && index < value.length - 1) {
                return i18n("Error: URIs cannot use the wildcard character '*' except as the final character");
            }

            var firstChar = value.substring(0,1);
            if (firstChar !== '/') {
                return i18n("Error: URIs must start with a '/'");
            }
            return null;
        }
    });
});
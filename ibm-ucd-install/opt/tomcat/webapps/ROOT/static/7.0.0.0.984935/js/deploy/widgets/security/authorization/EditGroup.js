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
        "dojo/_base/declare",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/RestSelect"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        ColumnForm,
        RestSelect
) {
    return declare('deploy.widgets.security.authorization.EditGroup',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="editGroup">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        /**
         * 
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            this.existingValues = {};
            if (this.group) {
                this.existingValues = this.group;
                this.submitMethod = "PUT";
                this.submitUrl = bootstrap.baseUrl + "security/group/" + this.group.id;
            }
            else {
                this.submitMethod = "POST";
                this.submitUrl = bootstrap.baseUrl + "security/group";
            }
            
            this.form = new ColumnForm({
                submitUrl: this.submitUrl,
                submitMethod: this.submitMethod,
                postSubmit: function(data) {
                    if (self.callback !== undefined) {
                        self.callback(true);
                    }
                },
                addData: function(data) {
                    if (self.group) {
                        data.existingId = self.group.id;
                    }
                },
                onCancel: function() {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                }
            });
            
            this.form.addField({
                name: "name",
                label: i18n("Name"),
                required: true,
                type: "Text",
                value: this.existingValues.name
            });
            
            if (!this.group) {
                var authorizationRealmSelect = new RestSelect({
                    restUrl: "security/authorizationRealm",
                    allowNone: false,
                    isValid: function(item) {
                        return (item.authorizationModuleClassName === 
                            "com.urbancode.security.authorization.internal.InternalAuthorizationModule");
                    },
                    value: this.existingValues.authorizationRealmId
                });
                this.form.addField({
                    name: "authorizationRealm",
                    label: i18n("Authorization Realm"),
                    required: true,
                    widget: authorizationRealmSelect
                });
            }

            this.form.placeAt(this.formAttach);
        }
    });
});
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
        "js/webext/widgets/ColumnForm"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        ColumnForm
) {
    return declare('deploy.widgets.security.EditUser',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="editUser">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        /**
         * 
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            this.existingValues = {};
            if (this.user) {
                this.existingValues = this.user;
            }
            
            var submitLoc = bootstrap.baseUrl+"security/user";
            if (this.user) {
                submitLoc += "/"+this.user.id;
            }
            
            this.form = new ColumnForm({
                submitUrl: submitLoc,
                submitMethod: this.user ? "PUT" : "POST",
                addData: function(data) {
                    data.authenticationRealm = self.realmId;
                },
                postSubmit: function(data) {
                    if (self.callback !== undefined) {
                        self.callback(true);
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
                label: i18n("Username"),
                required: true,
                type: "Text",
                readOnly: !!this.user,
                value: this.existingValues.name
            });
            
            if (!this.importOnly) {
                if (!this.user) {
                    this.form.addField({
                        name: "password",
                        label: i18n("Password"),
                            required: true,
                        type: "Secure",
                        value: ""
                    });
                }
            }
            
            if (this.user || !this.importOnly) {
                this.form.addField({
                    name: "actualName",
                    label: i18n("Name"),
                    required: false,
                    type: "Text",
                    value: this.existingValues.actualName
                });
            
                this.form.addField({
                    name: "email",
                    label: i18n("Email"),
                    required: false,
                    type: "Text",
                    textDir: "ltr",
                    value: this.existingValues.email
                });
            }

            this.form.placeAt(this.formAttach);
        }
    });
});
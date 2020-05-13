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
    return declare('deploy.widgets.security.SetUserPassword',  [_Widget, _TemplatedMixin], {
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
            
            this.form = new ColumnForm({
                submitUrl: bootstrap.baseUrl+"security/user/"+this.user.id+"/setPassword",
                submitMethod: "PUT",
                postSubmit: function(data) {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                
                onCancel: function() {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },

                validateFields: function(data) {
                    var result = [];
                    if (data.password !== data.passwordAgain) {
                        result.push(i18n("Passwords do not match"));
                    }
                    delete data.passwordAgain;
                    return result;
                }
            });
            
            this.form.addField({
                name: "password",
                label: i18n("Password"),
                required: true,
                type: "Secure",
                value: ""
            });
            
            this.form.addField({
                name: "passwordAgain",
                label: i18n("Re-enter"),
                required: true,
                type: "Secure",
                value: ""
            });

            this.form.placeAt(this.formAttach);
        }
    });
});
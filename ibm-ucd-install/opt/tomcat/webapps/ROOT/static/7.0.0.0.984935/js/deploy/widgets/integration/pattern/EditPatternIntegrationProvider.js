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
    "dijit/form/CheckBox",
    "dijit/form/Button",
    "dijit/form/RadioButton",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/on",
    "dojo/_base/xhr",
    "dojo/_base/declare",
    "js/webext/widgets/ColumnForm",
    "js/webext/widgets/Dialog",
    "js/webext/widgets/RestSelect"],

function (_TemplatedMixin,
        _Widget,
        CheckBox,
        Button,
        RadioButton,
        domClass,
        domConstruct,
        on,
        xhr,
        declare,
        ColumnForm,
        Dialog,
        RestSelect) {
    return declare('deploy.widgets.integration.pattern.EditPatternIntegrationProvider', [_Widget, _TemplatedMixin], {
        templateString: '<div class="editIntegrationProvider">' + 
                            '  <div data-dojo-attach-point="formAttach"></div>' + 
                        '</div>',

        /**
         *
         */
        postCreate: function () {
            this.inherited(arguments);
            var self = this;

            var existingValues = {
                properties: {}
            };
            this.existingValues = existingValues;
            
            if (this.integrationProvider) {
                existingValues.id = this.integrationProvider.id;
                existingValues.name = this.integrationProvider.name;
                existingValues.description = this.integrationProvider.description;
                existingValues.integrationTypeName = this.integrationProvider.integrationTypeName;
                existingValues.integrationType = this.integrationProvider.integrationType;
                existingValues.properties = this.integrationProvider.properties;
            }

            this.form = new ColumnForm({
                submitUrl: bootstrap.restUrl + "integration/pattern",
                postSubmit: function (data) {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                addData: function (data) {
                    if (self.integrationProvider) {
                        data.existingId = existingValues.id;
                    }
                    var dataProperties = {};
                    var fieldName;
                    var propertyName;
                    for (fieldName in data) {
                        if (data.hasOwnProperty(fieldName)) {
                            if (fieldName.indexOf("property/") === 0) {
                                propertyName = fieldName.substring("property/".length);
                                dataProperties[propertyName] = data[fieldName];
                                delete data[fieldName];
                            }  else if (fieldName === "realmOrUserCreds"){
                                dataProperties.useAdminCredentials = data[fieldName] === "userCreds" ? true : false;
                                delete data[fieldName];
                            }
                        }
                    }
                    data.properties = dataProperties;
                },
                onCancel: function () {
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
                value: existingValues.name
            });

            this.form.addField({
                name: "description",
                label: i18n("Description"),
                type: "Text",
                value: existingValues.description
            });

            this.form.addField({
                name: "property/landscaperUrl",
                label: i18n("URL"),
                description: i18n("Base URL for the blueprint designer"),
                type: "Text",
                bidiDynamicURL: "URL",
                required: true,
                value: util.getNamedPropertyValue(existingValues.properties, "landscaperUrl")
            });

            var radioButtonValue = "userCreds";
            var useAdminCredentials = util.getNamedPropertyValue(existingValues.properties, "useAdminCredentials");
            if (useAdminCredentials === "false"){
                radioButtonValue = "realm";
            } 
            var userCredChange =  function(value) {
                self.removeUserNameField();
                self.removeUserPassField();
                self.removeRealmUserTextField();
                self.removeManualUserTextField();

                if (value === "userCreds") {
                    self.addRealmUserTextField();
                    self.addUserNameField();
                    self.addUserPassField();
                } else {
                    self.addManualUserTextField();
                }
            };
            this.form.addField({
                name: "realmOrUserCreds",
                type: "Radio",
                label: i18n("Response"),
                required: true,
                value: radioButtonValue,
                allowedValues: [{
                    label: i18n("Automatically authenticate for each UrbanCode Deploy user."),
                    value: "realm"
                },{
                    label: i18n("Always authenticate with one blueprint designer user name."),
                    value: "userCreds"
                }],
                onChange : userCredChange
            });
            userCredChange(radioButtonValue);
            this.form.testConnectionButton = new Button({
                label: i18n("Test Connection")
            });
            this.form.testConnectionButton.placeAt(this.form.buttonsAttach);

            on(this.form.testConnectionButton, "click", function (event) {
                self.checkConnection();
            });

            this.form.placeAt(this.formAttach);
        },

        addUserNameField: function() {
            var self = this;
            if (!this.form.hasField("property/landscaperUser")) {
                this.form.addField({
                    name: "property/landscaperUser", 
                    label: i18n("Username"),
                    description: i18n("Username for the account to use when authenticating to the blueprint designer"),
                    type: "Text",
                    required: true,
                    value: util.getNamedPropertyValue(this.existingValues.properties, "landscaperUser")
                });
            }
        },

        removeUserNameField: function() {
            var self = this;
            if (this.form.hasField("property/landscaperUser")) {
                this.form.removeField("property/landscaperUser");
            }
        },

        addUserPassField: function() {
            var self = this;
            var password = "admin";
            if (!this.form.hasField("property/landscaperPassword")) {
	            this.form.addField({
	                    name: "property/landscaperPassword",
	                    label: i18n("Password"),
	                    description: i18n("Password for the account to use when authenticating to the blueprint designer"),
	                    type: "Secure",
	                    required: true,
	                    value: util.getNamedPropertyValue(this.existingValues.properties, "landscaperPassword")
	            });
            }
            return password;
        },
        
        removeUserPassField: function() {
            var self = this;
            if (this.form.hasField("property/landscaperPassword")) {
                this.form.removeField("property/landscaperPassword");
            }
        },

        addRealmUserTextField: function() {
            var self = this;
            if (!this.form.hasField("_realmUserNote")) {
            this.form.addField({
                    name: "_realmUserNote",
                    type: "Label",
                    label: "",
                    value: i18n("Ensure that blueprint designer user name that you enter has " +
                                "permissions to access the cloud platforms where you provision " +
                                "cloud environments. The default administrative account for the " +
                                "blueprint design server, ucdpadmin, might not have access to the " +
                                "required resources on the target cloud platforms.  ")
                });
            }
        },

        removeRealmUserTextField: function() {
            var self = this;
            if (this.form.hasField("_realmUserNote")) {
                this.form.removeField("_realmUserNote");
            }
        },

        addManualUserTextField: function() {
            var self = this;
            if (!this.form.hasField("_manualUserNote")) {
            this.form.addField({
                    name: "_manualUserNote",
                    type: "Label",
                    label: "",
                    value: i18n("On the blueprint designer, you must create an authentication " +
                                " realm for this UrbanCode Deploy server. To see the instructions " +
                                "for creating the authentication realm, open the documentation, " +
                                "and search for \"Importing user accounts from UrbanCode Deploy " +
                                "to the blueprint design server.\"")
                });
            }
        },

        removeManualUserTextField: function() {
            var self = this;
            if (this.form.hasField("_manualUserNote")) {
                this.form.removeField("_manualUserNote");
            }
        },

        checkConnection: function () {
            var self = this;
            
            // Validate that the form is all filled out - spoof the onSubmit function so that we
            // track whether validation passed.
            var oldPostSubmit = this.form.postSubmit;
            delete this.form.postSubmit;
            
            var formIsValid = false;
            this.form.onSubmit = function() {
                formIsValid = true;
            };
            this.form.submitForm();

            delete this.form.onSubmit;
            this.form.postSubmit = oldPostSubmit;

            if (formIsValid) {
                var submitData = self.form.getData();
                var data = self.form.formatData(submitData);
                var header = {"Content-Type": "application/json"};
    
                self.form.block();
                var ioArgs = {
                    "url": bootstrap.restUrl + "integration/pattern/testConnection",
                    "handleAs": "json",
                    "putData": data,
                    "headers": header,
                    "load": function (result, ioArgs) {
                        var dialog = new Dialog();
                        if (!result.error) {
                            domConstruct.create("div", {
                                innerHTML: i18n("Connection Successful")
                            }, dialog.titleNode);
    
                            domConstruct.create("div", {
                                innerHTML: i18n("Connection Successful")
                            }, dialog.containerNode);
                        }
                        else {
                            var errorMessage = result.error;
                            domConstruct.create("div", {
                                innerHTML: i18n("Connection Failed")
                            }, dialog.titleNode);
    
                            domConstruct.create("div", {
                                innerHTML: errorMessage
                            }, dialog.containerNode);
                        }
    
                        var closeButton = new Button({
                            label: i18n("Close"),
                            onClick: function () {
                                this.parentWidget.destroy();
                            }
                        });
                        domClass.add(closeButton.domNode, "underField");
                        closeButton.parentWidget = dialog;
                        closeButton.placeAt(dialog.containerNode);
                        dialog.show();
                        self.form.unblock();
                    }
                };
                xhr.post(ioArgs);
            }
        }
    });
});

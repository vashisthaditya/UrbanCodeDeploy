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
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/on",
        "dojo/store/Memory",
        "deploy/widgets/workflow/activity/BaseActivity",
        "js/webext/widgets/RestSelect",
        "js/webext/widgets/select/WebextSelect",
        "js/webext/widgets/Alert"
        ],
function(
        array,
        declare,
        lang,
        on,
        Memory,
        BaseActivity,
        RestSelect,
        WebextSelect,
        Alert
) {
    return declare('deploy.widgets.workflow.activity.ComponentRunComponentProcessActivity',  [BaseActivity], {
        postCreate: function() {
            this.inherited(arguments);

            if (!this.initialized) {
                this.editProperties();
            }
        },

        getLabel: function() {
            var result = "";

            if (!this.initialized) {
                result += i18n("Run Another Process");
            }
            else {
                result += this.getDisplayName(this.data.name, this.data.componentProcessName, i18n("Run"));
            }

            return result;
        },

        /**
         *
         */
        editProperties: function(callback) {
            var self = this;

            var propertyDialog = self.createPropertyDialog();
            var propertyForm = self.createPropertyForm({
                dialog: propertyDialog,
                validateFields: function(data) {
                    return self.validateName(data.name);
                },
                onSubmit: function(data) {
                    if (callback) {
                        callback();
                    }
                    self.initialized = true;

                    self.data.type = "componentProcess";
                    self.data.name = data.name;
                    self.data.allowFailure = data.allowFailure;
                    if (self.graphEditor.component) {
                        self.data.componentName = self.graphEditor.component.name;
                    }
                    else if (self.graphEditor.componentTemplate) {
                        self.data.componentTemplateName = self.graphEditor.componentTemplate.name;
                    }
                    self.data.componentProcessName = data.componentProcessName;

                    var componentProcessProperties = {};
                    array.forEach(self.extraPropertyNames, function(propertyName) {
                        var realPropertyName = propertyName.substring(2);
                        componentProcessProperties[realPropertyName] = data[propertyName];
                    });
                    self.data.properties = componentProcessProperties;

                    self.updateLabel();

                    propertyDialog.hide();
                    propertyForm.destroy();
                    propertyDialog.destroy();
                },
                readOnly: self.readOnly
            });

            propertyForm.addField({
                name: "name",
                label: i18n("Name"),
                type: "Text",
                required: true,
                value: self.data.name
            });

            var restUrl = null;
            if (self.graphEditor.component) {
                restUrl = bootstrap.restUrl+"deploy/component/"+self.graphEditor.component.id+"/fullProcesses/false";
            }
            else if (self.graphEditor.componentTemplate) {
                restUrl = bootstrap.restUrl+"deploy/componentTemplate/"+self.graphEditor.componentTemplate.id+"/-1/fullProcesses/false";
            }
            var componentProcessSelect;
            if (self.graphEditor.mode === "firstDayWizard") {
                componentProcessSelect = new WebextSelect({
                    store: new Memory({data: self.graphEditor.firstDayWizardModel.getComponentProcesses(self.graphEditor.component),
                                       idProperty: "name"}),
                    searchAttr: "name",
                    autoComplete: false,
                    selectOnClick: true,
                    allowNone: false,
                    value: self.data.componentProcessName,
                    onSetItem: function(value, item) {
                        if (item.name===self.graphEditor.componentProcess.name) {
                            var recursiveAlert = new Alert({
                                message: i18n("This will call the current process and risk the creation of an" +
                                              " infinite loop. Are you sure you want this process to run itself?")
                            });
                        } else {
                            self.setDefaultNameValue(propertyForm, item.name);
                        }
                    }
                });
            } else {
                componentProcessSelect = new RestSelect({
                    restUrl: restUrl,
                    getLabel: function(item) {
                        var result = item.name;
                        if (item.componentTemplate) {
                            result += i18n(" (Template)");
                        }
                        return result;
                    },
                    autoSelectFirst: false,
                    getValue: function(item) {
                        return item.name;
                    },
                    onChange: function(value, item) {
                        array.forEach(self.extraPropertyNames, function(name) {
                            self.removePropertyField(propertyForm, name);
                        });
                        self.extraPropertyNames = [];

                        if (item) {
                            if (item.name===self.graphEditor.componentProcess.name) {
                                var recursiveAlert = new Alert({
                                    message: i18n("This will call the current process and risk the creation of an" +
                                                  " infinite loop. Are you sure you want this process to run itself?")
                                });
                            } else {
                                self.setDefaultNameValue(propertyForm, item.name);
                            }

                            // Add all properties which are set to take a value at runtime.
                            array.forEach(item.unfilledProperties, function(unfilledProperty) {
                                var propertyName = "p_"+unfilledProperty.name;
                                var propValue = unfilledProperty.value;
                                var configModeOn = false;

                                if (self.data.properties && self.data.properties[unfilledProperty.name]) {
                                    propValue = self.data.properties[unfilledProperty.name];
                                    configModeOn = true;
                                }

                                /*
                                 * The variable propertyFieldData needs to contain all of the relevant information for
                                 * an unfilledProperty and some properties require different information (eg. HttpProperties
                                 * require 6 additional values). So lang.clone was used to ensure that all required values are
                                 * put into propertyFieldData. The clone function is safe here because unfilledProperty is a flat
                                 * object containing only property values and therefore clone will not explode.
                                 */
                                var propertyFieldData = lang.clone(unfilledProperty);
                                propertyFieldData.name = propertyName;
                                propertyFieldData.value = propValue;
                                if (unfilledProperty.description) {
                                    propertyFieldData.description = unfilledProperty.description.escape();
                                }

                                self.extraPropertyNames.push(propertyName);
                                self.addPropertyField(propertyForm, propertyFieldData, configModeOn, "allowFailure");
                            });
                        }
                    },
                    allowNone: false,
                    value: self.data.componentProcessName,
                    disabled: self.readOnly
                });
            }
            propertyForm.addField({
                name: "componentProcessName",
                label: i18n("Component Process"),
                required: true,
                description: i18n("The process to run."),
                widget: componentProcessSelect
            }, "allowFailure");

            if (config.data.systemConfiguration.enableAllowFailure || self.data.allowFailure) {
                propertyForm.addField({
                    name: "allowFailure",
                    label: i18n("Ignore Failure"),
                    description: i18n("When checked, this step will always be considered successful."),
                    type: "Checkbox",
                    value: self.data.allowFailure
                });
            }

            propertyForm.placeAt(propertyDialog.containerNode);
            propertyDialog.show();
        },

        getDefaultName: function(processName) {
            return i18n("Run: \"%s\"", processName);
        }
    });
});

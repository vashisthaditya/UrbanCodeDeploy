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
        "dojo/on",
        "dojo/store/Memory",
        "js/webext/widgets/select/WebextSelect",
        "deploy/widgets/workflow/activity/BaseActivity",
        "js/webext/widgets/RestSelect"
        ],
function(
        array,
        declare,
        on,
        Memory,
        WebextSelect,
        BaseActivity,
        RestSelect
) {
    return declare('deploy.widgets.workflow.activity.ApplyConfigurationActivity',  [BaseActivity], {
        postCreate: function() {
            this.inherited(arguments);

            if (!this.initialized) {
                this.data.name = util.randomString(30);
                this.editProperties();
            }
        },

        getLabel: function() {
            var result = "";

            if (!this.initialized) {
                result += i18n("Apply Configuration");
            }
            else {
                var childChildData = this.getChildChildData();
                if (childChildData.component && childChildData.component.deleted) {
                    result += childChildData.name+"\n"+i18n("(Deleted Component)")+")";
                }
                else {
                    var defaultLabel = i18n("Apply Config (%s)", childChildData.componentName);
                    result += childChildData.name;
                    if (result !== defaultLabel) {
                        result += "\n"+defaultLabel;
                    }
                }
            }

            return result;
        },

        /**
         *
         */
        editProperties: function(callback) {
            var self = this;

            var childData = this.getChildData();
            var childChildData = this.getChildChildData();

            // component select used by submit
            var componentSelect;

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

                    self.data = {
                        "name": self.data.name,
                        "type": "componentEnvironmentIterator"
                    };

                    self.data.component = componentSelect.get("item");
                    self.data.componentName = self.data.component.name;
                    if (data.tagId && data.tagId !== "") {
                        self.data.tagId = data.tagId;
                    }
                    else if (self.data.tagId) {
                        self.data.tag = undefined;
                        self.data.tagId = undefined;
                    }

                    self.data.maxIteration = data.maxIteration;
                    self.data.failFast = data.failFast;
                    self.data.preconditionScript = data.preconditionScript;

                    var componentProcessProperties = {};
                    array.forEach(self.extraPropertyNames, function(propertyName) {
                        var realPropertyName = propertyName.substring(2);
                        componentProcessProperties[realPropertyName] = data[propertyName];
                    });

                    self.data.children = [{
                        "name": util.randomString(30),
                        "type": "configurationDiff",
                        "componentName": self.data.component.name,
                        "children": [{
                            "name": data.name,
                            "type": "componentProcess",
                            "componentName": self.data.component.name,
                            "componentProcessName": data.componentProcessName,
                            "allowFailure": data.allowFailure,
                            "properties": componentProcessProperties
                        }]
                    }];

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
                value: childChildData.name
            });

            if (self.graphEditor.mode === "firstDayWizard") {
                var compSelect = new WebextSelect({
                    store: self.graphEditor.firstDayWizardModel.components,
                    searchAttr: "name",
                    value: !self.data.component ? undefined : self.data.component.id,
                    noDataMessage: i18n("No components found."),
                    autoComplete: false,
                    selectOnClick: true,
                    onSetItem: function(value, item) {
                        self.fdwShowFieldsForComponent(propertyForm, item);
                    }
                });
                var fdwComponentSelectField = propertyForm.addField({
                    name: "component",
                    label: i18n("Component"),
                    required: true,
                    widget: compSelect
                });
                componentSelect = fdwComponentSelectField.widget;
            } else {
                var componentSelectField = propertyForm.addField({
                    name: "component",
                    label: i18n("Component"),
                    required: true,
                    type: "ApplicationComponentSelect",
                    applicationId: self.graphEditor.application.id,
                    value: !self.data.component ? undefined : self.data.component.id,
                    readOnly: self.readOnly,
                    onSetItem: function(value, item) {
                        self.showFieldsForComponent(propertyForm, item);
                    }
                });
                componentSelect = componentSelectField.widget;
            }

            // -- Resource tag
            propertyForm.addField({
                name: "tagId",
                label: i18n("Limit to Resource Tag"),
                type: "TagDropDown",
                objectType: "Resource",
                value: self.data.tagId,
                readOnly: self.readOnly
            });

            propertyForm.addField({
                name: "maxIteration",
                label: i18n("Maximum number of concurrent jobs"),
                type: "Text",
                textDir: "ltr",
                required: true,
                value: self.data.maxIteration || -1 ,
                description: i18n("The maximum number component instances to apply the new " +
                        "configuration to simultaneously. For example, if you set the maximum number " +
                        "of concurrent processes to 2, the server applies the configuration to only " +
                        "two instances of a component at a time, even if many instances of the " +
                        "component are installed. Use -1 for unlimited.")
            });

            propertyForm.addField({
                name: "failFast",
                label: i18n("Fail Fast"),
                type: "Checkbox",
                description: i18n("When this is checked, this step will not start any more component processes if one fails."),
                value: self.data.failFast
            });

            propertyForm.addField({
                name: "preconditionScript",
                label: i18n("Precondition"),
                type: "Text Area",
                textDir: "ltr",
                description: i18n("A script to determine whether this step should run. Must evaluate to true or false if not left blank."),
                value: self.data.preconditionScript
            });

            propertyForm.placeAt(propertyDialog.containerNode);
            propertyDialog.show();
        },

        showFieldsForComponent: function(propertyForm, component) {
            var self = this;

            propertyForm.removeField("componentProcessName");
            propertyForm.removeField("allowFailure");
            propertyForm.removeField("componentProcessLabel");


            if (component) {
                var childData = this.getChildData();
                var childChildData = this.getChildChildData();

                var existingName = propertyForm.getValue("name");
                if (!existingName || (this.selectedComponent &&
                                existingName === i18n("Apply Config (%s)", this.selectedComponent.name))) {
                    propertyForm.setValue("name", i18n("Apply Config (%s)", component.name));
                }
                this.selectedComponent = component;

                array.forEach(this.extraPropertyNames, function(name) {
                    self.removePropertyField(propertyForm, name);
                });
                this.extraPropertyNames = [];

                var initialComponentProcess;
                if (!!self.data.component && (self.data.component.id === component.id)) {
                    initialComponentProcess = childChildData.componentProcessName;
                }

                var componentProcessSelect = new RestSelect({
                    restUrl: bootstrap.restUrl+"deploy/component/"+component.id+"/fullProcesses/false",
                    getLabel: function(item) {
                        var result = item.name;
                        if (item.componentTemplate) {
                            result += i18n(" (Template)");
                        }
                        return result;
                    },
                    isValid: function(item) {
                        return !item.takesVersion;
                    },
                    getValue: function(item) {
                        return item.name;
                    },
                    onChange: function(value, item) {
                        array.forEach(self.extraPropertyNames, function(name) {
                            self.removePropertyField(propertyForm, name);
                        });
                        self.extraPropertyNames = [];

                        if (item) {
                            // Add all properties which are set to take a value at runtime.
                            array.forEach(item.unfilledProperties, function(unfilledProperty) {
                                var propertyName = "p_"+unfilledProperty.name;
                                var propValue = unfilledProperty.value;
                                var configModeOn = false;

                                if (childChildData.properties && childChildData.properties[unfilledProperty.name]) {
                                    propValue = childChildData.properties[unfilledProperty.name];
                                    configModeOn = true;
                                }

                                var propertyFieldData = {
                                    name: propertyName,
                                    type: unfilledProperty.type,
                                    description: (unfilledProperty.description ? unfilledProperty.description.escape() : unfilledProperty.description),
                                    required: unfilledProperty.required,
                                    value: propValue,
                                    label: unfilledProperty.label,
                                    allowedValues: unfilledProperty.allowedValues
                                };

                                self.extraPropertyNames.push(propertyName);
                                self.addPropertyField(propertyForm, propertyFieldData, configModeOn, "allowFailure");
                            });
                        }
                    },
                    allowNone: false,
                    value: initialComponentProcess,
                    disabled: self.readOnly
                });
                propertyForm.addField({
                    name: "componentProcessName",
                    label: i18n("Component Process"),
                    required: true,
                    description: i18n("The process to run."),
                    widget: componentProcessSelect
                }, "tagId");

                propertyForm.addField({
                    name: "componentProcessLabel",
                    label: "",
                    type: "Label",
                    value: i18n("Note: Only processes set as Operational (No Version Needed) or Configuration Deployment can be used here.")
                }, "tagId");

                if (config.data.systemConfiguration.enableAllowFailure || childChildData.allowFailure) {
                    propertyForm.addField({
                        name: "allowFailure",
                        label: i18n("Ignore Failure"),
                        description: i18n("When checked, this step will always be considered successful."),
                        type: "Checkbox",
                        value: childChildData.allowFailure
                    }, "tagId");
                }
            }
        },

        fdwShowFieldsForComponent: function(propertyForm, component) {
            var self = this;

            if (component) {
                propertyForm.removeField("componentProcessName");
                propertyForm.removeField("allowFailure");
                propertyForm.removeField("componentProcessLabel");

                var childData = this.getChildData();
                var childChildData = this.getChildChildData();

                var existingName = propertyForm.getValue("name");
                if (!existingName || (this.selectedComponent &&
                                existingName === i18n("Apply Config (%s)", this.selectedComponent.name))) {
                    propertyForm.setValue("name", i18n("Apply Config (%s)", component.name));
                }
                this.selectedComponent = component;

                array.forEach(this.extraPropertyNames, function(name) {
                    self.removePropertyField(propertyForm, name);
                });
                this.extraPropertyNames = [];

                var initialComponentProcess;
                if (!!self.data.component && (self.data.component.id === component.id)) {
                    initialComponentProcess = childChildData.componentProcessName;
                }

                var componentProcessSelect = new WebextSelect({
                    store: new Memory({data: self.graphEditor.firstDayWizardModel.getComponentProcesses(component),
                                       idProperty: "name"}),
                    searchAttr: "name",
                    autoComplete: false,
                    selectOnClick: true,
                    allowNone: false,
                    value: initialComponentProcess
                });
                propertyForm.addField({
                    name: "componentProcessName",
                    label: i18n("Component Process"),
                    required: true,
                    description: i18n("The process to run."),
                    widget: componentProcessSelect
                }, "tagId");

                propertyForm.addField({
                    name: "componentProcessLabel",
                    label: "",
                    type: "Label",
                    value: i18n("Note: Only processes set as Operational (No Version Needed) or Configuration Deployment can be used here.")
                }, "tagId");

                if (config.data.systemConfiguration.enableAllowFailure || childChildData.allowFailure) {
                    propertyForm.addField({
                        name: "allowFailure",
                        label: i18n("Ignore Failure"),
                        description: i18n("When checked, this step will always be considered successful."),
                        type: "Checkbox",
                        value: childChildData.allowFailure
                    }, "tagId");
                }
            }
        }
    });
});

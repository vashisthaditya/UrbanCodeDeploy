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
        "js/webext/widgets/select/WebextSelect",
        "deploy/widgets/workflow/activity/BaseActivity",
        "js/webext/widgets/RestSelect",
        "deploy/widgets/property/PropertyTextareaBox"
        ],
function(
        array,
        declare,
        lang,
        on,
        Memory,
        WebextSelect,
        BaseActivity,
        RestSelect,
        PropertyArea
) {
    return declare('deploy.widgets.workflow.activity.RollbackComponentActivity',  [BaseActivity], {
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
                result += i18n("Rollback Component");
            }
            else {
                var childChildData = this.getChildChildData();
                if (childChildData.component && childChildData.component.deleted) {
                    result += childChildData.name+"\n"+i18n("(Deleted Component)");
                }
                else {
                    result += this.getDisplayName(childChildData.name, childChildData.componentName,
                            i18n("Rollback"), i18n("Rollback %s", childChildData.componentName));

                    if (childChildData.componentProcessName) {
                        result += "\n"+i18n("Process: %s", childChildData.componentProcessName);
                    } else {
                        result += "\n"+i18n("Process Deleted");
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
                        "type": "uninstallVersionDiff",
                        "componentName": self.data.component.name,
                        "selectionType": data.selectionType,
                        "status": data.status,
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

            // -- Component
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
                    autoSelectFirst: true,
                    type: "ApplicationComponentSelect",
                    applicationId: self.graphEditor.application.id,
                    value: !self.data.component ? undefined : self.data.component.id,
                    disabled: self.readOnly,
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
                name: "selectionType",
                label: i18n("Rollback Type"),
                type: "Select",
                required: true,
                value: childData.selectionType,
                allowedValues: [{
                    label: i18n("Remove Undesired Incremental Versions"),
                    value: "UNDESIRED"
                },{
                    label: i18n("Replace with Last Deployed"),
                    value: "LAST_DEPLOYED"
                }]
            });

            propertyForm.addField({
                name: "maxIteration",
                label: i18n("Maximum number of concurrent processes"),
                type: "Text",
                textDir: "ltr",
                required: true,
                value: self.data.maxIteration || -1 ,
                description: i18n("The maximum number of concurrent processes to run, " +
                        "per component. This setting limits the number of processes that run " +
                        "simultaneously to roll back each component. For example, if you set " +
                        "the maximum number of concurrent processes to 2, only two instances of " +
                        "a component are rolled back at a time, even if there are many instances " +
                        "of the component. Use -1 for unlimited.")
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
                type: "PropertyArea",
                description: i18n("A script to determine whether this step should run. Must evaluate to true or false if not left blank."),
                value: self.data.preconditionScript,
                cache: self.graphEditor.cache
            });

            propertyForm.placeAt(propertyDialog.containerNode);
            propertyDialog.show();
        },

        showFieldsForComponent: function(propertyForm, component) {
            var self = this;

            propertyForm.removeField("status");
            propertyForm.removeField("componentProcessName");
            propertyForm.removeField("allowFailure");

            if (component) {
                var childData = this.getChildData();
                var childChildData = this.getChildChildData();

                this.setDefaultNameValue(propertyForm, component.name);

                var statusSelect = new RestSelect({
                    restUrl: bootstrap.restUrl+"deploy/status/inventoryStatuses",
                    getValue: function(item) {
                        return item.name;
                    },
                    getStyle: function(item) {
                        var result = {
                            backgroundColor: item.color
                        };
                        return result;
                    },
                    value: childData.status,
                    allowNone: false
                });

                propertyForm.addField({
                    name: "status",
                    label: i18n("Remove Versions With Status"),
                    required: true,
                    widget: statusSelect
                }, "tagId");

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
                propertyForm.removeField("status");
                propertyForm.removeField("componentProcessName");
                propertyForm.removeField("allowFailure");

                var childData = this.getChildData();
                var childChildData = this.getChildChildData();

                this.setDefaultNameValue(propertyForm, component.name);

                var statusSelect = new RestSelect({
                    restUrl: bootstrap.restUrl+"deploy/status/inventoryStatuses",
                    getValue: function(item) {
                        return item.name;
                    },
                    getStyle: function(item) {
                        var result = {
                            backgroundColor: item.color
                        };
                        return result;
                    },
                    value: childData.status,
                    allowNone: false
                });

                propertyForm.addField({
                    name: "status",
                    label: i18n("Remove Versions With Status"),
                    required: true,
                    widget: statusSelect
                }, "tagId");

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

        getDefaultName: function(componentName) {
            return i18n("Rollback: \"%s\"", componentName);
        }
    });
});

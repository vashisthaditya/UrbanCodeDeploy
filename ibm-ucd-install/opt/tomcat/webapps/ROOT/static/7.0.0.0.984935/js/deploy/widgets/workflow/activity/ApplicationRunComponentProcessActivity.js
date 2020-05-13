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
        "deploy/widgets/workflow/activity/BaseActivity",
        "js/webext/widgets/select/WebextMultiSelect",
        "js/webext/widgets/DialogMultiSelect",
        "js/webext/widgets/RestSelect"
        ],
function(
        array,
        declare,
        lang,
        on,
        BaseActivity,
        WebextMultiSelect,
        DialogMultiSelect,
        RestSelect
) {
    return declare('deploy.widgets.workflow.activity.ApplicationRunComponentProcessActivity',  [BaseActivity], {
        postCreate: function() {
            this.inherited(arguments);

            if (this.data && this.data.componentIds) {
                this.data.componentIds = this.data.componentIds.split(',');
            }

            if (!this.initialized) {
                this.data.name = util.randomString(30);
                this.editProperties();
            }
        },

        getLabel: function() {
            var childData = this.getChildData();
            var result = "";

            if (this.initialized) {
                result += childData.name + "\n";
            }

            if (this.data.component) {
                if (this.data.component.deleted) {
                    result += i18n("Component: %s [Deleted]", childData.componentName);
                }
                else {
                    result += i18n("Component: \"%s\"", childData.componentName);
                }
                if (this.uiData.componentProcess.deleted) {
                    result += "\n" + i18n("Process: %s [Deleted]", childData.componentProcessName);
                }
                else {
                    result += "\n" + i18n("Process: %s", childData.componentProcessName);
                }
            }
            else {
                result += i18n("Component: \"%s\"", childData.componentName) +'\n' +
                      i18n("Process: %s", childData.componentProcessName);
            }

            return result;
        },

        /**
         *
         */
        editProperties: function(callback) {
            var self = this;

            var childData = this.getChildData();

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

                    if (data.ifComponentChanges === "true") {
                        self.data.type = "changedResourceIterator";
                        self.data.componentIds = data.componentIds;
                        self.data.resourceSelectionMode = data.resourceSelectionMode;
                    }
                    else {
                        self.data.type = "componentEnvironmentIterator";
                    }

                    if (data.tagId && data.tagId !== "") {
                        self.data.tagId = data.tagId;
                    }
                    else if (self.data.tagId) {
                        self.data.tag = undefined;
                        self.data.tagId = undefined;
                    }

                    self.data.runOnlyOnFirst = data.runOnlyOnFirst;
                    self.data.maxIteration = data.maxIteration;
                    self.data.failFast = data.failFast;
                    self.data.preconditionScript = data.preconditionScript;

                    var componentProcessProperties = {};
                    array.forEach(self.extraPropertyNames, function(propertyName) {
                        var realPropertyName = propertyName.substring(2);
                        componentProcessProperties[realPropertyName] = data[propertyName];
                    });

                    self.data.children = [{
                        "id": childData.id,
                        "name": data.name,
                        "type": "componentProcess",
                        "componentName": childData.componentName,
                        "componentProcessName": childData.componentProcessName,
                        "allowFailure": data.allowFailure,
                        "properties": componentProcessProperties
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
                value: childData.name
            });

            this.extraPropertyNames = [];

            array.forEach(self.extraPropertyNames, function(name) {
                self.removePropertyField(propertyForm, name);
            });
            self.extraPropertyNames = [];

            // Add all properties which are set to take a value at runtime.
            if (this.uiData.componentProcess) {
                array.forEach(this.uiData.componentProcess.unfilledProperties, function(unfilledProperty) {
                    var propertyName = "p_"+unfilledProperty.name;
                    var propValue = unfilledProperty.value;
                    var configModeOn = false;

                    if (childData.properties && childData.properties[unfilledProperty.name]) {
                        propValue = childData.properties[unfilledProperty.name];
                        configModeOn = true;
                    }

                    var propertyFieldData = lang.clone(unfilledProperty);
                    propertyFieldData.name = propertyName;
                    propertyFieldData.value = propValue;
                    if (unfilledProperty.description) {
                        propertyFieldData.description = unfilledProperty.description.escape();
                    }
                    else {
                        propertyFieldData.description = unfilledProperty.description;
                    }

                    self.extraPropertyNames.push(propertyName);
                    self.addPropertyField(propertyForm, propertyFieldData, configModeOn, "allowFailure");
                });
            }


            if (config.data.systemConfiguration.enableAllowFailure || childData.allowFailure) {
                propertyForm.addField({
                    name: "allowFailure",
                    label: i18n("Ignore Failure"),
                    description: i18n("When checked, this step will always be considered successful."),
                    type: "Checkbox",
                    value: childData.allowFailure
                }, "tagId");
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
                label: i18n("Maximum number of concurrent processes"),
                type: "Text",
                textDir: "ltr",
                required: true,
                value: self.data.maxIteration || -1 ,
                description: i18n("The maximum number of concurrent processes to run, per component. " +
                        "This setting limits the number of processes that run simultaneously. " +
                        "For example, if you set the maximum number of concurrent processes to 2, " +
                        "the component process runs on only two instances of the component at a time, " +
                        "even if many instances of the component are installed. " +
                        "Use -1 for unlimited.")
            });

            propertyForm.addField({
                name: "failFast",
                label: i18n("Fail Fast"),
                type: "Checkbox",
                description: i18n("When this is checked, this step will not start any more component processes if one fails."),
                value: self.data.failFast
            });

            propertyForm.addField({
                name: "runOnlyOnFirst",
                label: i18n("Run on First Online Resource Only"),
                type: "Checkbox",
                description: i18n("When this is checked, this step will only use one resource. It will not run on all resources."),
                value: self.data.runOnlyOnFirst
            });

            propertyForm.addField({
                name: "preconditionScript",
                label: i18n("Precondition"),
                type: "Text Area",
                description: i18n("A script to determine whether this step should run. Must evaluate to true or false if not left blank."),
                value: self.data.preconditionScript
            });

            propertyForm.addField({
                name: "ifComponentChanges",
                label: i18n("Run if Components Change"),
                type: "Checkbox",
                description: i18n("When this is checked, this step will only run if certain components will cause inventory changes on a given resource."),
                value: self.data.type === "changedResourceIterator",
                onChange: function(value) {
                    self.showComponentSelection(value, propertyForm);
                }
            });
            self.showComponentSelection((self.data.type === "changedResourceIterator"), propertyForm);

            propertyForm.placeAt(propertyDialog.containerNode);
            propertyDialog.show();
        },

        showComponentSelection: function(show, form) {
            var self = this;

            if (form.hasField("componentIds")) {
                form.removeField("componentIds");
                form.removeField("resourceSelectionMode");
            }

            if (show) {
                var values;
                if (self.data.componentIds) {
                    values = [];
                    array.forEach(self.data.componentIds, function(componentId) {
                        var componentName = self.data.componentNames ? self.data.componentNames[componentId] : componentId;
                        values.push({
                            id: componentId,
                            name: componentName || componentId
                        });
                    });
                }
                if (self.graphEditor.mode === "firstDayWizard") {
                    var compSelect = new WebextMultiSelect({
                        store: self.graphEditor.firstDayWizardModel.components,
                        searchAttr: "name",
                        value: values,
                        noDataMessage: i18n("No components found."),
                        onAdd: function(item) {
                            // Track selected id/name so the widget doesn't show the IDs
                            if (!self.data.componentNames) {
                                self.data.componentNames = {};
                            }
                            self.data.componentNames[item.id] = item.name;
                        }
                    });
                    var fdwComponentSelectField = form.addField({
                        name: "componentIds",
                        label: i18n("Components"),
                        widget: compSelect
                    });
                } else {
                    form.addField({
                        name: "componentIds",
                        label: i18n("Components"),
                        multi: true,
                        type: "ApplicationComponentSelect",
                        applicationId: self.graphEditor.application.id,
                        value: values,
                        idAttribute: "id",
                        onAdd: function(item) {
                            // Track selected id/name so the widget doesn't show the IDs
                            if (!self.data.componentNames) {
                                self.data.componentNames = {};
                            }
                            self.data.componentNames[item.id] = item.name;
                        }
                    });
                }

                form.addField({
                    name: "resourceSelectionMode",
                    label: i18n("Resource Selection Mode"),
                    type: "Radio",
                    allowedValues: [{
                        label: i18n("Only resources where selected components are changed"),
                        value: "ONLY_WHERE_COMPONENTS_CHANGED"
                    },{
                        label: i18n("All resources mapped to this process's component"),
                        value: "ALL_MAPPED_RESOURCES"
                    }],
                    description: i18n("This option determines which resources the process will " +
                            "execute on if one of the selected components has a change " +
                            "detected. If the first option is selected, the operational process " +
                            "will only run on resources where both the operational process's " +
                            "component is mapped and one of the watched components is changed. " +
                            "If the second option is selected, the operational process will " +
                            "run everywhere its component is mapped if any of the watched " +
                            "components is changed anywhere."),
                    value: this.data.resourceSelectionMode || "ONLY_WHERE_COMPONENTS_CHANGED"
                });
            }
        }
    });
});

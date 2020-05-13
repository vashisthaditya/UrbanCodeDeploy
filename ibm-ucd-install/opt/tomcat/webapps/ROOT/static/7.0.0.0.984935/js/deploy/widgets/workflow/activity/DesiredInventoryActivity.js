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
        "dojo/_base/declare",
        "dojo/on",
        "dojo/store/Memory",
        "js/webext/widgets/select/WebextSelect",
        "deploy/widgets/workflow/activity/BaseActivity",
        "js/webext/widgets/RestSelect"
        ],
function(
        declare,
        on,
        Memory,
        WebextSelect,
        BaseActivity,
        RestSelect
) {
    return declare('deploy.widgets.workflow.activity.DesiredInventoryActivity',  [BaseActivity], {
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
                result += i18n("Component Inventory Update");
            }
            else {
                if (this.data.children && this.data.children.length === 1) {
                    var child = this.data.children[0];

                    if (child.type === "addDesiredInventory") {
                        result += i18n("Inventory: Add Versions");
                    }
                    else if (child.type === "removeDesiredInventory") {
                        if (this.data.type === "uninstallAllVersionsIterator") {
                            if (this.data.selectionType === "ALL_EXISTING") {
                                result += i18n("Inventory: Remove All Existing");
                            }
                            else if (this.data.selectionType === "SELECTED") {
                                result += i18n("Inventory: Remove Selected");
                            }
                        }
                        else if (this.data.type === "uninstallVersionDiff") {
                            result += i18n("Inventory: Remove Undesired");
                        }
                    }

                    result += "\n"+i18n("%s on %s", child.status, child.component.name);
                }
            }

            return result;
        },

        /**
         *
         */
        editProperties: function(callback) {
            var self = this;

            var componentSelect;

            var propertyDialog = self.createPropertyDialog();
            var propertyForm = self.createPropertyForm({
                dialog: propertyDialog,
                onSubmit: function(data) {
                    if (callback) {
                        callback();
                    }
                    self.initialized = true;

                    self.data = {
                        "name": self.data.name
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

                    if (data.type === "addDesiredInventory") {
                        self.data.type = "allVersionsIterator";

                        self.data.children = [{
                            "type": "addDesiredInventory",
                            "name": util.randomString(30),
                            "status": data.status,
                            "componentName": self.data.component.name,
                            "component": componentSelect.get("item")
                        }];
                    }
                    else if (data.type === "removeDesiredInventory") {
                        self.data.status = data.status;
                        if (data.iteratorType === "uninstallAll") {
                            self.data.type = "uninstallAllVersionsIterator";
                            self.data.selectionType = "ALL_EXISTING";
                        }
                        else if (data.iteratorType === "uninstallSelected") {
                            self.data.type = "uninstallAllVersionsIterator";
                            self.data.selectionType = "SELECTED";
                        }
                        else if (data.iteratorType === "rollback") {
                            self.data.type = "uninstallVersionDiff";
                            self.data.selectionType = "UNDESIRED";
                        }

                        self.data.children = [{
                            "type": "removeDesiredInventory",
                            "name": util.randomString(30),
                            "status": data.status,
                            "componentName": self.data.component.name,
                            "component": componentSelect.get("item")
                        }];
                    }

                    self.updateLabel();

                    propertyDialog.hide();
                    propertyForm.destroy();
                    propertyDialog.destroy();
                },
                readOnly: self.readOnly
            });

            // -- Component
            self.selectedComponent = self.data.component;
            if (self.graphEditor.mode === "firstDayWizard") {
                var compSelect = new WebextSelect({
                    store: self.graphEditor.firstDayWizardModel.components,
                    searchAttr: "name",
                    value: !self.data.component ? undefined : self.data.component.id,
                    noDataMessage: i18n("No components found."),
                    autoComplete: false,
                    selectOnClick: true,
                    onSetItem: function(value, item) {
                        self.selectedComponent = item;
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
                    disabled: self.readOnly,
                    onSetItem: function(value, item) {
                        self.selectedComponent = item;
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

            var child = {};
            if (self.data.children && self.data.children.length === 1) {
                child = self.data.children[0];
            }

            propertyForm.addField({
                name: "type",
                label: i18n("Action"),
                type: "Select",
                required: true,
                value: child.type,
                allowedValues: [{
                    label: i18n("Add Desired Inventory"),
                    value: "addDesiredInventory"
                },{
                    label: i18n("Remove Desired Inventory"),
                    value: "removeDesiredInventory"
                }],
                onChange: function(value) {
                    self.showTypeFields(value, propertyForm);
                }
            });

            if (child.type) {
                self.showTypeFields(child.type, propertyForm);
            }

            propertyForm.placeAt(propertyDialog.containerNode);
            propertyDialog.show();
        },

        showTypeFields: function(value, propertyForm) {
            var self = this;

            var child = {};
            if (self.data.children && self.data.children.length === 1) {
                child = self.data;
            }

            propertyForm.removeField("iteratorType");
            propertyForm.removeField("status");

            if (value === "removeDesiredInventory") {
                var iteratorType;
                if (child.type === "uninstallAllVersionsIterator"
                        && child.selectionType === "ALL_EXISTING") {
                    iteratorType = "uninstallAll";
                }
                else if (child.type === "uninstallAllVersionsIterator"
                        && child.selectionType === "SELECTED") {
                    iteratorType = "uninstallSelected";
                }
                else if (child.type === "uninstallVersionDiff"
                        && child.selectionType === "UNDESIRED") {
                    iteratorType = "rollback";
                }

                propertyForm.addField({
                    name: "iteratorType",
                    label: i18n("For Which Versions?"),
                    type: "Select",
                    required: true,
                    value: iteratorType,
                    allowedValues: [{
                        label: i18n("All Existing (Complete Uninstall)"),
                        value: "uninstallAll"
                    },{
                        label: i18n("All Selected (Manual Uninstall)"),
                        value: "uninstallSelected"
                    },{
                        label: i18n("All Not in Snapshot (Rollback)"),
                        value: "rollback"
                    }]
                });
            }

            if (value === "addDesiredInventory" || value === "removeDesiredInventory") {
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
                    value: child.status,
                    allowNone: false
                });
                propertyForm.addField({
                    name: "status",
                    label: i18n("Status"),
                    required: true,
                    widget: statusSelect
                });
            }
        }
    });
});

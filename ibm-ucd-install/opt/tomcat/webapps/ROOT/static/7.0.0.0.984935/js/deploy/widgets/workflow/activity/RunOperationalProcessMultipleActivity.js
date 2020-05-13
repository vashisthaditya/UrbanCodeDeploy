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
        "deploy/widgets/workflow/activity/MultipleComponentsActivity"
        ],
function(
        declare,
        MultipleComponentsActivity
) {
    return declare('deploy.widgets.workflow.activity.RunOperationalProcessMultipleActivity',
            [MultipleComponentsActivity], {

        disableStatusSelect : true,

        /**
         * Get the label to be shown by the UI.
         */
        getLabel: function() {
            var result = "";

            if (!this.initialized) {
                result += i18n("Run Operational Process for Multiple Components");
            }
            else {
                var childChildData = this.getChildChildData();
                var childChildChildData;
                if (childChildData && childChildData.children) {
                    childChildChildData = childChildData.children[0];
                }

                result = childChildChildData.name;
                // if the name doesn't mention something about Run, add description
                if (result.indexOf(i18n("Run"))===-1 && result.indexOf(i18n("All"))===-1) {
                    result += "\n"+i18n("Run Operational Process for Multiple Components");
                }
                if (childChildChildData.componentProcessName) {
                    result += "\n"+i18n("Run Generic: %s", childChildChildData.componentProcessName);
                }
            }

            return result;
        },

        showComponentTagSelection: function(show, form, data) {
            var self = this;

            if (form.hasField("monitorTag")) {
                form.removeField("monitorTag");
                form.removeField("resourceSelectionMode");
            }

            if (show) {
                form.addField({
                    name: "monitorTag",
                    label: i18n("Limit Monitoring to Components with This Tag"),
                    description: i18n("If you select a tag, this step runs only if another " +
                        "step in the application process changes the inventory of components " +
                        "that contain the tag. If you do not select a tag, this step runs if " +
                        "another step in the application process changes the inventory " +
                        "of any component."),
                    multi: true,
                    type: "TagDropDown",
                    objectType : "Component",
                    value: data.monitorTag
                });

                form.addField({
                    name: "resourceSelectionMode",
                    label: i18n("Resources to Run On"),
                    type: "Radio",
                    allowedValues: [{
                        label: i18n("Run this step only on resources where component inventory changes"),
                        value: "ONLY_WHERE_COMPONENTS_CHANGED"
                    },{
                        label: i18n("Run this step on all possible resources"),
                        value: "ALL_MAPPED_RESOURCES"
                    }],
                    value: data.resourceSelectionMode || "ONLY_WHERE_COMPONENTS_CHANGED"
                });

            }
        },

        addExtraFields: function(form, insertLocation, data) {
            var self = this;
            // The data passed in by default is the childChildData. We want the childData.
            var childData = this.getChildData();
            form.addField({
                name: "runOnlyOnFirst",
                label: i18n("Run on First Online Resource Only"),
                type: "Checkbox",
                description: i18n("When this is checked, this step will only use one resource. It will not run on all resources."),
                value: childData.runOnlyOnFirst
            });
            var ifComponentTagChanges = (!!childData &&
                    childData.type === "changedResourceIterator");
            form.addField({
                name: "ifComponentTagChanges",
                label: i18n("Run Only If Component Inventory Changes"),
                type: "Checkbox",
                description: i18n("Select this option to run the component process only if " +
                        "inventory was changed elsewhere in the application process. You may limit " +
                        "inventory-change monitoring to components with a specific tag."),
                value: ifComponentTagChanges,
                onChange: function(value) {
                    self.showComponentTagSelection(value, form, childData);
                }
            });
            this.showComponentTagSelection(ifComponentTagChanges, form, childData);
        },

        /**
         * Get the child data for the runMultipleOperationalProcessesActivity object.
         */
        getSelfChildData: function(data, componentProcessProperties) {
            var type;
            if (data.ifComponentTagChanges === "true") {
                type = "changedResourceIterator";
            }
            else {
                type = "componentEnvironmentIterator";
            }
            return [{
                   "name": util.randomString(30),
                   "type": type,
                   "tagId": data.tagId,
                   "runOnlyOnFirst": data.runOnlyOnFirst,
                   "resourceSelectionMode": data.resourceSelectionMode,
                   "monitorTag": data.monitorTag,
                   "children": [{
                                    "name": util.randomString(30),
                                    "type": "operationalProcessFilter",
                                    "status": data.status,
                                    "children": [{
                                                    "name": data.name,
                                                    "type": "componentProcess",
                                                    "componentProcessName": data.componentProcessName,
                                                    "allowFailure": data.allowFailure,
                                                    "properties": componentProcessProperties
                                                }]
                               }]
                    }];
        },

        getDefaultName: function(tagName) {
            return i18n("All Tagged: \"%s\"", tagName);
        }
    });
});

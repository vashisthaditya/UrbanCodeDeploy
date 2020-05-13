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
    "dojo/_base/declare"],

function(
    declare) {

    return declare('deploy.widgets.workflow.GraphTooltips', [], {

        utility: {
            // component
            "finish":       i18n("Ends processing. A process can have more than one Finish step. All processes must reach a Finish step to complete successfully."),
            "acquireLock":  i18n("This step acquires a lock on a specified string value. You can use locks to prevent concurrent modification of resources."),
            "addResourceInventory": i18n("With this process step, the component resource that the process is running against will have an inventory entry created for it with the specified status."),
            "join":         i18n("The Join step waits until all incoming steps finish. If any incoming step fails or does not run, the Join step causes the process to fail."),
            "note":         i18n("Add a note to the diagram."),
            "manualTask":   i18n("A manual task interrupts a process until manual intervention is done. A task-interrupted process remains suspended until the targeted user or users respond. Typically, manual tasks are removed after the process is tested or automated."),
            "applicationManualTask": i18n("A manual task interrupts an application process until manual intervention is done. A task-interrupted process remains suspended until the targeted user or users respond. Typically, manual tasks are removed after the process is tested or automated."),
            "componentManualTask": i18n("A manual task interrupts a component process until manual intervention is done. A task-interrupted process remains suspended until the targeted user or users respond. Typically, manual tasks are removed after the process is tested or automated."),
            "releaseLock":  i18n("This step releases a lock on a specified string value."),
            "removeResourceInventory": i18n("With this process step, the component resource that the process is running against will have an inventory entry removed from it."),
            "componentProcess": i18n("With this step, you can run another process belonging to this component."),
            "runProcess":   i18n("This step runs a generic process as a step in an application process."),
            "setStatus":    i18n("This step sets the ending status of the process. The step can specify that the process is completed or failed."),
            "switch":       i18n("Use this step to create branches in the process that are based on the value of a property."),

            // application
            "applyConfiguration": i18n("Runs a component process of the type Operational (No Version Needed) or Configuration Deployment."),
            "installComponent": i18n("This step installs the selected component with one of the processes that are defined for the component."),
            "installMultipleComponents": i18n("Install multiple components that are based on component tags or resource tags."),
            "rollbackComponent": i18n("Use this process step to roll back a component version to the version in a snapshot or to the version that was deployed when the process began."),
            "rollbackMultipleComponents": i18n("Use this step to roll back multiple component versions to versions in a snapshot or to versions that were deployed when the process began. The multiple components are based on component tags or resource tags."),
            "forEachTouchedResourceContainer": i18n("Runs the specified generic process on each resource that is affected by the application process."),
            "runMultipleOperational": i18n("Runs the operational (no version needed) process for multiple components."),
            "forEachVersionContainer": i18n("Use this step to run the specified process once for each version of the specified component."),
            "uninstallComponent": i18n("Use this step to uninstall the selected component."),
            "uninstallMultipleComponents": i18n("Use this step to uninstall multiple components that are based on component tags or resource tags."),
            "eachAgentIterator": i18n("Run sub process for each agent"),
            "eachTagIterator": i18n("Run sub process for each tag, on resources with the specified tag."),
            "folder": i18n("Run one of this component's processes."),

            // approval
            "applicationApprovalTask": i18n("A manual task which requests approval for an application."),
            "componentApprovalIterator": i18n("A manual task which requests approval for a component."),
            "environmentApprovalTask": i18n("A manual task which requests approval for an environment.")
        },

        utilityID: {
            "ApplyConfigurationActivity" : "applyConfiguration",
            "InstallComponentActivity" : "installComponent",
            "InstallMultipleComponentsActivity" : "installMultipleComponents",
            "RollbackComponentActivity" : "rollbackComponent",
            "RollbackMultipleComponentsActivity" : "rollbackMultipleComponents",
            "EachTouchedResourceActivity" : "forEachTouchedResourceContainer",
            "RunOperationalProcessMultipleActivity" : "runMultipleOperational",
            "EachVersionComponentActivity" : "forEachVersionContainer",
            "UninstallComponentActivity" : "uninstallComponent",
            "UninstallMultipleComponentsActivity" : "uninstallMultipleComponents",
            "EachAgentIteratorActivity" : "eachAgentIterator",
            "EachTagIteratorActivity" : "eachTagIterator",
            "ApplicationRunComponentProcessActivity" : "folder",
            "ComponentRunComponentProcessActivity": "componentProcess"
        },

        plugin: {},

        drawerTip: {},

        get: function(data, state, node) {
            var tooltip = null;

            // hovering on overlay?
            if (state && state.overlays) {
                var overlay=null;
                for (overlay in state.overlays.map) {
                    if (state.overlays.map.hasOwnProperty(overlay)) {
                        if (node === state.overlays.map[overlay].node.firstChild) {
                            var img = state.overlays.map[overlay].image;
                            if (img.indexOf("step_copy")!==-1) {
                                tooltip = i18n("Copy this step to the Clipboard drawer");
                            } else if (img.indexOf("close_step")!==-1) {
                                tooltip = i18n("Delete this step");
                            } else if (img.indexOf("step_edit")!==-1) {
                                tooltip = i18n("Edit this step's properties");
                            } else if (img.indexOf("step_info")!==-1 || img.indexOf("step_error")!==-1) {
                                tooltip = i18n("Not all of this step's required properties have been set");
                            }
                            break;
                        }
                    }
                }
            }

            if (!tooltip) {
                data = data.activity || data;
                data = data.command || data;
                var idx = null;

                // try using activity class id first
                var activityId = data.activityId ? data.activityId.split("_") : [];
                if (activityId.length>4 && this.utilityID[activityId[4]]) {
                    idx = this.utilityID[activityId[4]];
                    tooltip = this.utility[idx];
                // then try precanned utility descriptions
                } else if (data.type && data.type!=="plugin") {
                    idx = data.type;
                    tooltip = this.utility[idx];
                // then just use the name/description from the palette step
                } else {
                    idx = data.id;
                    tooltip = this.plugin[idx];
                    if (tooltip) {
                        tooltip = i18n(tooltip);
                    } else {
                        tooltip = this.plugin[data.id] = data.description || data.name;
                    }
                }
                var drawerTip = this.drawerTip[idx];
                if (!drawerTip && data.drawerTip) {
                    this.drawerTip[idx] = {
                         drawer: data.drawerTip,
                         step: data.name,
                         plugin: data.plugin && data.plugin.name ? data.plugin.name : null
                    };
                } else if (state && drawerTip) {
                    var tp = [];
                    if (idx!=="folder") {
                        tp.push(i18n("Step: %s", i18n(drawerTip.step)));
                    }
                    tp.push(i18n("Description: %s", i18n(tooltip)));
                    tp.push(i18n("Drawer: %s", drawerTip.drawer));
                    if (drawerTip.plugin) {
                        tp.push(i18n("Plugin: %s", drawerTip.plugin));
                    }
                    tooltip = tp.join('\n');
                }
            }
            // remove any &quot; etc.
            if (tooltip) {
                var xlate = document.createElement('div');
                xlate.innerHTML = tooltip;
                tooltip = xlate.childNodes[0].nodeValue;
            }
            return tooltip || "";
        },

        getStepName: function(cell) {
            var data = cell.activity.data;

            // get name from command
            if (data.command) {
                return data.command.name;
            }

            // get name from activity
            var idx = null;
            var activityId = data.activityId ? data.activityId.split("_") : [];
            if (activityId.length>4 && this.utilityID[activityId[4]]) {
                idx = this.utilityID[activityId[4]];
            } else if (data.type && data.type!=="plugin") {
                idx = data.type;
            } else {
                idx = data.id;
            }
            var drawerTip = this.drawerTip[idx];
            if (drawerTip) {
                return i18n(drawerTip.step);
            }
            return null;
        }

    });
});

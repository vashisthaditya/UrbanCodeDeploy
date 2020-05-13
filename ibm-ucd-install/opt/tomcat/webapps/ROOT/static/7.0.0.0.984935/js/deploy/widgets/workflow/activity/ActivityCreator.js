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
        "dijit/_Widget",
        "dojo/_base/array",
        "dojo/_base/declare",
        "deploy/widgets/workflow/activity/AcquireLockActivity",
        "deploy/widgets/workflow/activity/ApplicationApprovalTaskActivity",
        "deploy/widgets/workflow/activity/ApplicationManualTaskActivity",
        "deploy/widgets/workflow/activity/ApplicationRunComponentProcessActivity",
        "deploy/widgets/workflow/activity/ApplyConfigurationActivity",
        "deploy/widgets/workflow/activity/ComponentApprovalTaskActivity",
        "deploy/widgets/workflow/activity/ComponentManualTaskActivity",
        "deploy/widgets/workflow/activity/ComponentRunComponentProcessActivity",
        "deploy/widgets/workflow/activity/DesiredInventoryActivity",
        "deploy/widgets/workflow/activity/DesiredSnapshotInventoryActivity",
        "deploy/widgets/workflow/activity/EachAgentIteratorActivity",
        "deploy/widgets/workflow/activity/EachTagIteratorActivity",
        "deploy/widgets/workflow/activity/EachVersionComponentActivity",
        "deploy/widgets/workflow/activity/EnvironmentApprovalTaskActivity",
        "deploy/widgets/workflow/activity/FinishActivity",
        "deploy/widgets/workflow/activity/InstallComponentActivity",
        "deploy/widgets/workflow/activity/InstallMultipleComponentsActivity",
        "deploy/widgets/workflow/activity/JoinActivity",
        "deploy/widgets/workflow/activity/ManualTaskActivity",
        "deploy/widgets/workflow/activity/NoteActivity",
        "deploy/widgets/workflow/activity/PluginActivity",
        "deploy/widgets/workflow/activity/ReleaseLockActivity",
        "deploy/widgets/workflow/activity/ResourceInventoryActivity",
        "deploy/widgets/workflow/activity/RollbackComponentActivity",
        "deploy/widgets/workflow/activity/RollbackMultipleComponentsActivity",
        "deploy/widgets/workflow/activity/RunProcessActivity",
        "deploy/widgets/workflow/activity/SetStatusActivity",
        "deploy/widgets/workflow/activity/StartActivity",
        "deploy/widgets/workflow/activity/SwitchActivity",
        "deploy/widgets/workflow/activity/UninstallComponentActivity",
        "deploy/widgets/workflow/activity/UninstallMultipleComponentsActivity",
        "deploy/widgets/workflow/activity/EachTouchedResourceActivity",
        "deploy/widgets/workflow/activity/ResourceDiscoveryActivity",
        "deploy/widgets/workflow/activity/PatternDeploymentActivity",
        "deploy/widgets/workflow/activity/PatternStackExecutionActivity",
        "deploy/widgets/workflow/activity/RunOperationalProcessMultipleActivity",
        "js/webext/widgets/Alert"
        ],
function(
        _Widget,
        array,
        declare,
        AcquireLockActivity,
        ApplicationApprovalTaskActivity,
        ApplicationManualTaskActivity,
        ApplicationRunComponentProcessActivity,
        ApplyConfigurationActivity,
        ComponentApprovalTaskActivity,
        ComponentManualTaskActivity,
        ComponentRunComponentProcessActivity,
        DesiredInventoryActivity,
        DesiredSnapshotInventoryActivity,
        EachAgentIteratorActivity,
        EachTagIteratorActivity,
        EachVersionComponentActivity,
        EnvironmentApprovalTaskActivity,
        FinishActivity,
        InstallComponentActivity,
        InstallMultipleComponentsActivity,
        JoinActivity,
        ManualTaskActivity,
        NoteActivity,
        PluginActivity,
        ReleaseLockActivity,
        ResourceInventoryActivity,
        RollbackComponentActivity,
        RollbackMultipleComponentsActivity,
        RunProcessActivity,
        SetStatusActivity,
        StartActivity,
        SwitchActivity,
        UninstallComponentActivity,
        UninstallMultipleComponentsActivity,
        EachTouchedResourceActivity,
        ResourceDiscoveryActivity,
        PatternDeploymentActivity,
        PatternStackExecutionActivity,
        RunOperationalProcessMultipleActivity,
        Alert
) {
    /**
     * This widget deals with how to create activities - the mapping between type names and activity
     * widget "classes", primarily. It can handle creation of brand new activities from the palette,
     * or creation of an activity based on saved data.
     *
     * Properties:
     *  graphEditor / Object (BaseGraph)    The editor this activity has been added to. Required at
     *                                      creation time.
     *
     */
    return declare('deploy.widgets.workflow.activity.ActivityCreator',  [_Widget], {
        graphEditor: null,

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);

            if (!this.graphEditor) {
                throw "Unable to create an ActivityCreator without a graphEditor specified.";
            }
        },

        addSavedActivity: function(data, x, y, parent, h, w) {
            var self = this;
            var newCell;
            var alert;

            var createData = {
                data: data,
                initialized: true,
                graphEditor: this.graphEditor,
                parent: parent,
                graphHasChanges: this.graphHasChanges
            };

            if (data.copy) {
                createData.initialized = false;
            }

            if (!!this.graphEditor && this.graphEditor.readOnly) {
                createData.readOnly = true;
            }

            if (data.type === "start") {
                newCell = new StartActivity(createData);
            }
            else if (data.type === "finish") {
                newCell = new FinishActivity(createData);
            }
            else if (data.type === "acquireLock") {
                newCell = new AcquireLockActivity(createData);
            }
            else if (data.type === "releaseLock") {
                newCell = new ReleaseLockActivity(createData);
            }
            else if (data.type === "setStatus") {
                newCell = new SetStatusActivity(createData);
            }
            else if (data.type === "plugin") {
                newCell = new PluginActivity(createData);
            }
            else if (data.type === "addResourceInventory"
                    || data.type === "removeResourceInventory") {
                newCell = new ResourceInventoryActivity(createData);
            }
            else if (data.type === "applicationManualTask") {
                newCell = new ApplicationManualTaskActivity(createData);
            }
            else if (data.type === "componentManualTask") {
                newCell = new ComponentManualTaskActivity(createData);
            }
            else if (data.type === "manualTask") {
                newCell = new ManualTaskActivity(createData);
            }
            else if (data.type === "runProcess") {
                newCell = new RunProcessActivity(createData);
            }
            else if (data.type === "touchedResourceIterator") {
                newCell = new EachTouchedResourceActivity(createData);
            }
            else if (data.type === "componentProcess") {
                var component = this.graphEditor.component;
                var compTemplate = this.graphEditor.componentTemplate;
                if (this.graphEditor.application) {
                    createData.uiData = {
                        componentProcess: {
                            unfilledProperties: data.unfilledProperties
                        }
                    };
                    newCell = new ApplicationRunComponentProcessActivity(createData);
                }
                else if (component || compTemplate){
                    var componentProcess = this.graphEditor.componentProcess;
                    var compLabel = "componentName";
                    if (compTemplate){
                        component = compTemplate;
                        compLabel = "componentTemplateName";
                    }
                    createData.data = {
                        componentProcessName: data.componentProcessName,
                        name: data.name,
                        type: data.type,
                        properties: data.properties
                    };
                    createData.data[compLabel] = component.name;
                    newCell = new ComponentRunComponentProcessActivity(createData);
                }
            }
            else if (data.type === "switch") {
                newCell = new SwitchActivity(createData);
            }
            else if (data.type === "join") {
                newCell = new JoinActivity(createData);
            }
            else if (data.type === "note") {
                newCell = new NoteActivity(createData);
            }
            else if (data.type === "applicationApprovalTask") {
                newCell = new ApplicationApprovalTaskActivity(createData);
            }
            else if (data.type === "componentApprovalIterator") {
                newCell = new ComponentApprovalTaskActivity(createData);
            }
            else if (data.type === "environmentApprovalTask") {
                newCell = new EnvironmentApprovalTaskActivity(createData);
            }
            else if (data.type ==="resourceDiscovery") {
                newCell = new ResourceDiscoveryActivity(createData);
            }
            else if (data.type === "patternStackExecution") {
                newCell = new PatternStackExecutionActivity(createData);
            }
            else if (data.type === "patternDeployment") {
                newCell = new PatternDeploymentActivity(createData);
            }
            else if (data.type === "addDesiredSnapshotInventory"
                || data.type === "removeDesiredSnapshotInventory") {
                newCell = new DesiredSnapshotInventoryActivity(createData);
            }
            else if (data.children && data.children.length > 0) {
                var child = data.children[0];
                if (child.type === "addDesiredInventory" || child.type === "removeDesiredInventory") {
                    newCell = new DesiredInventoryActivity(createData);
                }
                else if (data.type === "componentEnvironmentIterator") {
                    if (child.type === "inventoryVersionDiff") {
                        newCell = new InstallComponentActivity(createData);
                    }
                    else if (child.type === "allVersionsIterator") {
                        newCell = new EachVersionComponentActivity(createData);
                    }
                    else if (child.type === "uninstallAllVersionsIterator") {
                        newCell = new UninstallComponentActivity(createData);
                    }
                    else if (child.type === "uninstallVersionDiff") {
                        newCell = new RollbackComponentActivity(createData);
                    }
                    else if (child.type === "configurationDiff") {
                        newCell = new ApplyConfigurationActivity(createData);
                    }
                    else if (child.type === "componentProcess") {
                        createData.uiData = {
                            componentProcess: child.componentProcess
                        };
                        child.componentProcess = undefined;

                        newCell = new ApplicationRunComponentProcessActivity(createData);
                    }
                }
                else if (data.type === "changedResourceIterator") {
                    createData.uiData = {
                        componentProcess: child.componentProcess
                    };
                    child.componentProcess = undefined;

                    newCell = new ApplicationRunComponentProcessActivity(createData);
                }
                else if (data.type === "multiComponentEnvironmentIterator") {
                    if (child.type ==="changedResourceIterator") {
                        newCell = new RunOperationalProcessMultipleActivity(createData);
                    }
                    else {
                        var childChild = child.children[0];
                        if (childChild.type === "inventoryVersionDiff") {
                            newCell = new InstallMultipleComponentsActivity(createData);
                        }
                        else if (childChild.type === "uninstallAllVersionsIterator") {
                            newCell = new UninstallMultipleComponentsActivity(createData);
                        }
                        else if (childChild.type === "uninstallVersionDiff") {
                            newCell = new RollbackMultipleComponentsActivity(createData);
                        }
                        else if (childChild.type === "operationalProcessFilter") {
                            newCell = new RunOperationalProcessMultipleActivity(createData);
                        }
                    }
                }
                else if (data.type === "eachAgentIterator") {
                    newCell = new EachAgentIteratorActivity(createData);
                    if(parent && parent.activity && parent.activity.isContainer) {
                        alert = new Alert({
                            message: i18n("Nested containers are not supported, you cannot save this process until the design is fixed.")
                        });
                    }
                }
                else if (data.type === "eachTagIterator") {
                    newCell = new EachTagIteratorActivity(createData);
                    if(parent && parent.activity && parent.activity.isContainer) {
                        alert = new Alert({
                            message: i18n("Nested containers are not supported, you cannot save this process until the design is fixed.")
                        });
                    }
                }
            }

            if (newCell) {
                newCell.createCell(x, y, h, w);
                newCell.data.activityId = newCell.id;

                if (newCell.isContainer) {
                    array.forEach(createData.data.children, function(child) {
                        self.addSavedActivity(child, 0, 0, newCell.cell);
                    });
                }
            }
            else if (parent && data.type === "graph") {
                var startX = data.startX;
                if (startX === undefined) {
                    startX = 35;
                }
                var startY = data.startY;
                if (startY === undefined) {
                    startY = 20;
                }

                this.addNewActivity({
                    "type": "start"
                }, startX, startY, parent);

                array.forEach(createData.data.children, function(child) {
                    var x = 0;
                    var y = 0;
                    var h;
                    var w;

                    var offset = util.getNamedProperty(createData.data.offsets, child.name);
                    if (offset) {
                        x = offset.x;
                        y = offset.y;
                        h = offset.h;
                        w = offset.w;
                    }

                    self.addSavedActivity(child, x, y, parent, h, w);
                });

                var graph = self.graphEditor.graph;
                var model = graph.getModel();
                var startCell = self.graphEditor.getStartCell(parent);

                array.forEach(createData.data.edges, function(edge) {
                    var from;
                    if (edge.from) {
                        from = model.filterCells(parent.children, function(cell) {
                            return (cell.activity && cell.activity.getName() === edge.from);
                        })[0];
                    }
                    else {
                        from = startCell;
                    }

                    var to;
                    if (edge.to) {
                        to = model.filterCells(parent.children, function(cell) {
                            return (cell.activity && cell.activity.getName() === edge.to);
                        })[0];
                    }

                    if (from && to) {
                        self.graphEditor.restoreEdge({
                            from: from,
                            to: to,
                            type: edge.type,
                            value: edge.value
                        });
                    }
                });
            }
            else {
                console.log("Invalid data to create a new cell");
            }
            if (data.copy) {
                if (this.graphHasChanges){
                    this.graphHasChanges();
                }
                else {
                    document.hasChanges = true;
                }
            }
        },

        addNewActivity: function(data, x, y, parent) {
            var newCell;
            var alert;

            var createData = {
                data: {},
                graphEditor: this.graphEditor,
                parent: parent
            };

            if (!!this.graphEditor && this.graphEditor.readOnly) {
                createData.readOnly = true;
            }

            if (data.plugin) {
                createData.data = {
                    type: "plugin",
                    id: data.id,
                    name: i18n(data.name),
                    commandName: data.name,
                    pluginName: data.plugin.name,
                    pluginVersion: data.plugin.versionNumber
                };

                newCell = new PluginActivity(createData);
            }
            else if (data.type === "addResourceInventory"
                    || data.type === "removeResourceInventory") {
                createData.data = {
                    type: data.type
                };

                newCell = new ResourceInventoryActivity(createData);
            }
            else if (data.type === "inventoryUpdate") {
                newCell = new DesiredInventoryActivity(createData);
            }
            else if (data.type === "snapshotInventoryUpdate") {
                newCell = new DesiredSnapshotInventoryActivity(createData);
            }
            else if (data.type === "acquireLock") {
                createData.data = {
                    type: data.type
                };
                newCell = new AcquireLockActivity(createData);
            }
            else if (data.type === "releaseLock") {
                createData.data = {
                    type: data.type
                };
                newCell = new ReleaseLockActivity(createData);
            }
            else if (data.type === "applicationManualTask") {
                createData.data = {
                    type: data.type
                };

                newCell = new ApplicationManualTaskActivity(createData);
            }
            else if (data.type === "componentManualTask") {
                createData.data = {
                    type: data.type
                };

                newCell = new ComponentManualTaskActivity(createData);
            }
            else if (data.type === "manualTask") {
                createData.data = {
                    type: data.type
                };

                newCell = new ManualTaskActivity(createData);
            }
            else if (data.type === "runProcess") {
                createData.data = {
                    type: data.type
                };

                newCell = new RunProcessActivity(createData);
            }
            else if (data.type === "installComponent") {
                newCell = new InstallComponentActivity(createData);
            }
            else if (data.type === "uninstallComponent") {
                newCell = new UninstallComponentActivity(createData);
            }
            else if (data.type === "rollbackComponent") {
                newCell = new RollbackComponentActivity(createData);
            }
            else if (data.type === "forEachVersionContainer") {
                newCell = new EachVersionComponentActivity(createData);
            }
            else if (data.type === "forEachTouchedResourceContainer") {
                newCell = new EachTouchedResourceActivity(createData);
            }
            else if (data.type === "applyConfiguration") {
                newCell = new ApplyConfigurationActivity(createData);
            }
            else if (data.type === "installMultipleComponents") {
                newCell = new InstallMultipleComponentsActivity(createData);
            }
            else if (data.type === "uninstallMultipleComponents") {
                newCell = new UninstallMultipleComponentsActivity(createData);
            }
            else if (data.type === "rollbackMultipleComponents") {
                newCell = new RollbackMultipleComponentsActivity(createData);
            }
            else if (data.type === "runMultipleOperational") {
                newCell = new RunOperationalProcessMultipleActivity(createData);
            }
            else if (data.type === "switch") {
                createData.data = {
                    type: data.type
                };

                newCell = new SwitchActivity(createData);
            }
            else if (data.type === "join") {
                createData.data = {
                    type: data.type
                };

                newCell = new JoinActivity(createData);
            }
            else if (data.type === "start") {
                createData.data = {
                    type: data.type
                };

                newCell = new StartActivity(createData);
            }
            else if (data.type === "note") {
                createData.data = {
                    type: data.type
                };

                newCell = new NoteActivity(createData);
            }
            else if (data.type === "finish") {
                createData.data = {
                    type: data.type
                };

                newCell = new FinishActivity(createData);
            }
            else if (data.type === "setStatus") {
                createData.data = {
                    type: data.type
                };

                newCell = new SetStatusActivity(createData);
            }
            else if (data.type === "componentProcess") {
                if (this.graphEditor.application) {
                    createData.data = {
                        componentName: data.component.name,
                        children: [{
                            componentName: data.component.name,
                            componentProcessName: data.name
                        }]
                    };
                    createData.uiData = {
                        componentProcess: {
                            unfilledProperties: data.unfilledProperties
                        }
                    };

                    newCell = new ApplicationRunComponentProcessActivity(createData);
                }
                else if (this.graphEditor.component) {
                    createData.data = {
                        componentName: this.graphEditor.component.name
                    };
                    newCell = new ComponentRunComponentProcessActivity(createData);
                }
                else if (this.graphEditor.componentTemplate) {
                    createData.data = {
                        componentTemplateName: this.graphEditor.componentTemplate.name
                    };
                    newCell = new ComponentRunComponentProcessActivity(createData);
                }
            }
            else if (data.type === "applicationApprovalTask") {
                createData.data = {
                    type: data.type,
                    commentRequired: false,
                    commentPrompt: ""
                };
                newCell = new ApplicationApprovalTaskActivity(createData);
            }
            else if (data.type === "componentApprovalIterator") {
                createData.data = {
                    type: data.type,
                    children: [{
                        type: "componentApprovalTask",
                        role: data.role,
                        roleRestrictionData: data.roleRestrictionData,
                        commentRequired: false,
                        commentPrompt: ""
                    }]
                };
                newCell = new ComponentApprovalTaskActivity(createData);
            }
            else if (data.type === "environmentApprovalTask") {
                createData.data = {
                    type: data.type,
                    commentRequired: false,
                    commentPrompt: ""
                };
                newCell = new EnvironmentApprovalTaskActivity(createData);
            }
            else if (data.type === "multiComponentEnvironmentIterator") {
                createData.data = {
                        type: data.type,
                        commentRequired: false,
                        commentPrompt: ""
                };
            }
            else if (data.type === "eachAgentIterator") {
                //check to make sure we are not nesting containers
                if(!(parent && parent.activity && parent.activity.isContainer)) {
                    createData.data = {
                        type: data.type
                    };
                    newCell = new EachAgentIteratorActivity(createData);
                } else {
                    alert = new Alert({
                        message: i18n("You cannot nest containers!")
                    });
                }
            }
            else if (data.type === "eachTagIterator") {
              //check to make sure we are not nesting containers
                if(!(parent && parent.activity && parent.activity.isContainer)) {
                    createData.data = {
                        type: data.type
                    };
                    newCell = new EachTagIteratorActivity(createData);
                } else {
                    alert = new Alert({
                        message: i18n("You cannot nest containers!")
                    });
                }
            }
            else if (data.type === "resourceDiscovery") {
                createData.data = {
                    name: data.name,
                    type: data.type,
                    commandType: data.commandType,
                    actionType: data.actionType
                };
                newCell = new ResourceDiscoveryActivity(createData);
            }
            else if (data.type === "patternStackExecution") {
                createData.data = {
                        name: data.name,
                        type: data.type
                    };
                    newCell = new PatternStackExecutionActivity(createData);
            }
            else if (data.type === "patternDeployment") {
                createData.data = {
                        name: data.name,
                        type: data.type
                    };
                    newCell = new PatternDeploymentActivity(createData);
            }
            if (newCell) {
                newCell.createCell(x, y);
                newCell.data.activityId = newCell.id;

                if (newCell.isContainer) {
                    this.addNewActivity({
                        "type": "start"
                    }, 35, 20, newCell.cell);

                    this.addNewActivity({
                        "type": "finish"
                    }, 30, 300, newCell.cell);
                }

                if (this.graphHasChanges){
                    this.graphHasChanges();
                }
                else {
                    document.hasChanges = true;
                }
            }
            else {
                console.log("Invalid data to create a new cell");
            }
        }
    });
});

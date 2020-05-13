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
    "dojo/request/xhr",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/json",
    "deploy/widgets/workflow/BaseGraph"],

function(
    declare,
    xhr,
    domClass,
    domConstruct,
    JSON,
    BaseGraph) {
    return declare('deploy.widgets.applicationProcess.ApplicationProcessActivities', [BaseGraph], {
        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            if (!mxClient.isBrowserSupported()) {
                mxUtils.error(i18n("This browser is not compatible with the rich workflow editor."), 200, false);
            } else {
                if (this.applicationProcess !== undefined) {
                    this.processId = this.applicationProcessId = this.applicationProcess.id;
                }

                if (this.mode === "firstDayWizard") {
                    this.readOnly = false;
                    if (self.applicationProcess.rootActivity !== undefined) {
                        self.graphStartup(self.applicationProcess.rootActivity);
                    } else {
                        self.graphStartup(null);
                    }
                } else {
                    // Always load the graph using IDs to support sending either objects or IDs as arguments.
                    xhr(bootstrap.restUrl + "deploy/applicationProcess/" + this.applicationProcessId + "/" + this.applicationProcessVersion, {
                        handleAs: "json"
                    }).then(function(data) {
                        self.application = data.application;
                        self.applicationTemplate = data.applicationTemplate;
                        self.applicationProcess = data;
                        if (self.application) {
                            self.exploreUrl = "#application/"+self.application.id;
                        } else {
                            self.exploreUrl = "#applicationTemplate/"+self.applicationTemplate.id+"/-1";
                        }

                        if (!self.hasManageProcessesPermission() || data.versionCount !== data.version) {
                            self.readOnly = true;
                        } else {
                            self.readOnly = false;
                        }

                        if (self.applicationProcess.rootActivity !== undefined) {
                            self.graphStartup(self.applicationProcess.rootActivity);
                        } else {
                            self.graphStartup(null);
                        }
                    });
                }
            }
        },

        /**
         *
         */
        graphStartup: function(data) {
            this.inherited(arguments);
            var self = this;

            self.buildToolbar({
                latest: self.applicationProcess.version===self.applicationProcess.versionCount,
                label: i18n("Version %s of %s", self.applicationProcess.version, self.applicationProcess.versionCount),
                controls: util.vc.generateVersionControls(self.applicationProcess, function(version) {
                    return "applicationProcess/" + self.applicationProcess.id + "/" + version;
                })
            });

            var activityTreeUrl;
            if (this.mode === "firstDayWizard") {
                activityTreeUrl = "deploy/applicationProcess/activityTree";
            } else {
                activityTreeUrl = "deploy/applicationProcess/" + self.applicationProcess.id + "/activityTree";
            }

            if (!this.readOnly) {

                self.refreshStepPalette({
                    process: self.applicationProcess,
                    url: bootstrap.restUrl + activityTreeUrl,
                    topStepDrawerLabel: i18n("Application Steps"),
                    lazyChildrenDrawer: {
                        label: i18n("Component Process Steps"),
                        getUrl: function(item) {
                            // Lazy-load entries underneath components. We assume anything we're calling
                            // getChildUrl on is a component.
                            return bootstrap.restUrl + "deploy/component/" + item.id + "/processesForStepPalette";
                        }
                    }
                });
            }
        },
        saveProcessDesign: function(comment) {
            var self = this;
            var json = self.getWorkflowJson();
            if (comment) {
                json.comment = comment;
            }

            if (self.mode === "firstDayWizard") {
                self.firstDayWizardModel.saveProcessDesign("application", self.applicationProcess, json);
                dijit.byId("fdw-designer-dialog").destroy();
            } else {
                xhr.put(bootstrap.restUrl + "deploy/applicationProcess/" + self.applicationProcess.id + "/saveActivities", {
                    data: JSON.stringify(json),
                    handleAs: "json",
                    headers: {
                        'applicationProcessVersion': self.applicationProcess.version,
                        'Content-Type': 'application/json'
                    }
                }).then(function(data) {
                    self.showSavePopup(i18n("Process design saved successfully."));
                    document.hasChanges = false;
                    self.clearChangedActivities();
                    navBar.setHash("applicationProcess/" + self.applicationProcess.id + "/-1", false, true);
                }, function(error) {
                    self.showSaveErrorPopup(error);
                });
            }
        },

        hasManageProcessesPermission: function() {
            var self = this;
            var result = false;

            if (self.application) {
                result = self.application.security["Manage Processes"];
            } else if (self.applicationTemplate) {
                result = self.applicationTemplate.security["Manage Processes"];
            }

            return result;
        }
    });
});

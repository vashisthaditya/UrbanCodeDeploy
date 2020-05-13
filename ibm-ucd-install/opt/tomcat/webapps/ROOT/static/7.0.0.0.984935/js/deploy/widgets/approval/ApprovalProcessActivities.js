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
    /*globals mxClient, mxUtils, mxToolbar, mxPrintPreview, mxWindow, mxCellOverlay, mxCellOverlay, mxImage, mxPoint,
     mxConstants, mxEvent
     */
    return declare('deploy.widgets.approval.ApprovalProcessActivities', [BaseGraph], {
        /**
         * Requires that this object has an "approvalProcessId" property set.
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            if (appState.environment) {
                self.approvalParent = appState.environment;
            }
            if (appState.environmentTemplate) {
                self.approvalParent = appState.environmentTemplate;
            }

            if (!mxClient.isBrowserSupported()) {
                mxUtils.error(i18n("This browser is not compatible with the rich workflow editor."), 200, false);
            } else {
                var envTempVersion;

                // If approval process parent is an environment template,
                // we want to retrieve approval process from a specific version of the template
                if(self.approvalParent.version) {
                    envTempVersion = "/" + self.approvalParent.version;
                } else {
                    envTempVersion = "";
                }

                // Always load the graph using IDs to support sending either objects or IDs as arguments.
                xhr.get(bootstrap.restUrl + "approval/approvalProcess/" + self.approvalParent.id + envTempVersion, {
                    handleAs: "json"
                }).then(function(data) {
                    self.approvalProcess = data;
                    self.exploreUrl = "#environment/";
                    self.processId = self.approvalProcess.id;

                    if (data.environment) {
                        self.environment = data.environment;
                        self.readOnly = (!self.environment.security["Manage Approval Processes"]);
                        self.exploreUrl+=self.environment.id;
                    }

                    if (data.environmentTemplate) {
                        self.environmentTemplate = data.environmentTemplate;
                        self.readOnly = (!self.environmentTemplate.security["Manage Approval Processes"]);
                        self.exploreUrl+=self.environmentTemplate.id;
                    }

                    if (self.approvalProcess.rootActivity !== undefined) {
                        self.graphStartup(self.approvalProcess.rootActivity);
                    } else {
                        self.graphStartup(null);
                    }
                });
            }
        },

        /**
         *
         */
        graphStartup: function(data) {
            this.inherited(arguments);

            var self = this;

            self.buildToolbar();

            if (!self.readOnly) {
                self.refreshStepPalette({
                    process: self.approvalProcess,
                    url: bootstrap.restUrl + "approval/approvalProcess/approvalTypeTree",
                    topStepDrawerLabel: i18n("Approval Steps")
                });
            }
        },

        saveProcessDesign: function(comment) {
            var self = this;

            xhr.put(bootstrap.restUrl + "approval/approvalProcess/" + self.approvalParent.id + "/saveActivities", {
                data: JSON.stringify(self.getWorkflowJson())
            }).then(function(data) {
                self.showSavePopup(i18n("Process design saved successfully."));
                self.clearHasChanges();
                self.clearChangedActivities();
                navBar.setHash("environment/"+self.approvalParent.id+"/approvals/-1", false, true);
            }, function(error) {
                self.showSaveErrorPopup(error);
            });
        }
    });
});

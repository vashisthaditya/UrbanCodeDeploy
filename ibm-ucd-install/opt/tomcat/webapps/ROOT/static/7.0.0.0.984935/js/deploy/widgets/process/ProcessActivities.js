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
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/request/xhr",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/json",
    "deploy/widgets/workflow/BaseGraph"],

function(
    declare,
    array,
    lang,
    xhr,
    domClass,
    domConstruct,
    JSON,
    BaseGraph) {
    return declare('deploy.widgets.process.ProcessActivities', [BaseGraph], {
        processId: null,
        processVersion: null,
        readOnly: false,

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            if (!mxClient.isBrowserSupported()) {
                mxUtils.error(i18n("This browser is not compatible with the rich workflow editor."), 200, false);
            } else {
                if (this.process !== undefined) {
                    this.processId = this.process.id;
                    this.processVersion = this.process.version;
                }

                // Always load the graph using IDs to support sending either objects or IDs as arguments.
                xhr(bootstrap.restUrl + "process/" + this.processId + "/" + this.processVersion, {
                    handleAs: "json"
                }).then(function(data) {
                    self.process = data;
                    self.exploreUrl = "#main/processes";

                    self.readOnly = false;
                    if (data.versionCount !== data.version) {
                        self.readOnly = true;
                    } else if (!self.process.security["Edit Basic Settings"]) {
                        self.readOnly = true;
                    }

                    if (self.process.rootActivity !== undefined) {
                        self.graphStartup(self.process.rootActivity);
                    } else {
                        self.graphStartup(null);
                    }
                });
            }
        },

        /**`
         *
         */
        graphStartup: function(data) {
            this.inherited(arguments);

            var self = this;

            // make the design tab the default tab so that clicking
            // the version buttons will open the design tab
            var i;
            var processTabs;
            for (i = 0; i < config.data.tabSets.length; i++) {
                if (config.data.tabSets[i].id === "process") {
                    config.data.tabSets[i].defaultTab = "design";
                    break;
                }
            }

            self.buildToolbar({
                latest: self.process.version===self.process.versionCount,
                label: i18n("Version %s of %s", self.process.version, self.process.versionCount),
                controls: util.vc.generateVersionControls(self.process, function(version) {
                    return "process/" + self.process.id + "/" + version;
                })
            });

            if (!this.readOnly) {
                self.refreshStepPalette({
                    favoriteCookie: "process",
                    favoriteDrawers: [i18n("Utility Steps")],
                    process: self.process,
                    url: bootstrap.restUrl + "process/activityTree"
                });
            }
        },

        saveProcessDesign: function(comment) {
            var self = this;
            var json = self.getWorkflowJson();
            if (comment) {
                json.comment = comment;
            }

            xhr.put(bootstrap.restUrl + "process/" + self.process.id + "/activities", {
                data: JSON.stringify(json),
                headers: {
                    'processVersion': self.process.version,
                    'Content-Type': 'application/json'
                }
            }).then(function(data) {
                self.showSavePopup(i18n("Process design saved successfully."));
                document.hasChanges = false;
                self.clearChangedActivities();
                navBar.setHash("process/" + self.process.id + "/-1/design", false, true);
            }, function(error) {
                self.showSaveErrorPopup(error);
            });
        }
    });
});

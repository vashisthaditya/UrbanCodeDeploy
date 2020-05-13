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
    "dojo/on",
    "dojo/json",
    "js/webext/widgets/Dialog",
    "js/webext/widgets/GenericConfirm",
    "js/webext/widgets/Alert",
    "deploy/widgets/process/RequiredCommentForm",
    "deploy/widgets/workflow/BaseGraph"],

function(
    declare,
    xhr,
    domClass,
    domConstruct,
    on,
    JSON,
    Dialog,
    GenericConfirm,
    Alert,
    RequiredCommentForm,
    BaseGraph) {
    return declare('deploy.widgets.componentProcess.ComponentProcessActivities', [BaseGraph], {
        componentId: null,
        componentTemplateId: null,
        componentProcessId: null,
        componentProcessVersion: null,
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
                if (this.componentProcess !== undefined) {
                    this.processId = this.componentProcessId = this.componentProcess.id;
                    this.componentProcessVersion = this.componentProcess.version;
                }
                if (this.mode === "firstDayWizard") {
                    self.readOnly = false;
                    self.callGraphStartup();
                } else {
                    // Always load the graph using IDs to support sending either objects or IDs as arguments.
                    xhr(self.getProcessUrl(), {
                        handleAs: "json"
                    }).then(function(data) {
                        self.component = data.component;
                        self.componentTemplate = data.componentTemplate;
                        self.componentProcess = data;
                        if (self.component) {
                            self.exploreUrl = "#component/"+self.component.id;
                        } else {
                            self.exploreUrl = "#componentTemplate/"+self.componentTemplate.id+"/-1";
                        }

                        if (data.versionCount !== data.version) {
                            self.readOnly = true;
                        } else if (self.componentTemplate && !self.componentTemplate.security["Manage Processes"]) {
                            self.readOnly = true;
                        } else if (self.component && !self.component.security["Manage Processes"]) {
                            self.readOnly = true;
                        }

                        self.callGraphStartup();
                    });
                }
            }
        },

        getProcessUrl: function() {
            if (this.isDraft && config.data.systemConfiguration.safeEditFeatureEnabled) {
                return bootstrap.restUrl + "deploy/componentProcess/draft/" + this.componentProcessId + "/" + this.componentProcessVersion;
            }
            return bootstrap.restUrl + "deploy/componentProcess/" + this.componentProcessId + "/" + this.componentProcessVersion;
        },

        callGraphStartup: function() {
            if (this.componentProcess.rootActivity !== undefined) {
                this.graphStartup(this.componentProcess.rootActivity);
            } else {
                this.graphStartup(null);
            }
        },

        createToolbar: function(changed, lock) {
            var self = this;
            if (changed) {
                self.componentProcess.locked = lock;
                self.componentProcess.currentUserIsLockOwner = lock;
            }
            self.buildToolbar({
                latest: self.componentProcess.version===self.componentProcess.versionCount,
                label: self.getVersionToggleLabel(),
                isDraft: self.isDraft && config.data.systemConfiguration.safeEditFeatureEnabled,
                locked: self.componentProcess.locked && config.data.systemConfiguration.safeEditFeatureEnabled,
                lockOwned: self.componentProcess.currentUserIsLockOwner && config.data.systemConfiguration.safeEditFeatureEnabled,
                lockFunction: function() {
                    self.lockProcess(self.componentProcess);
                },
                unlockFunction: function() {
                    self.unlockProcess(self.componentProcess, self.componentProcess.currentUserIsLockOwner);
                },
                promoteFunction: function(hasChanges) {
                    var promoteSuccessMessage = "";
                    if (!hasChanges) {
                        if (config.data.systemConfiguration.requireProcessPromotionApproval) {
                            promoteSuccessMessage = i18n("Draft Process Submitted for Promotion.");
                        }
                        else {
                            promoteSuccessMessage = i18n("Draft Process Successfully Promoted.");
                        }
                        xhr.put(
                            bootstrap.restUrl + "deploy/componentProcess/promote/" + self.componentProcess.id + "/" + self.componentProcess.version
                        ).then(function(data) {
                            self.showSavePopup(promoteSuccessMessage);
                        }, function(error) {
                            self.showSaveErrorPopup(error);
                        });
                    }
                },
                promotionPending: self.componentProcess.promotionPending,
                controls: self.generateVersionControls(self.componentProcess)
            });

        },

        /**
         *
         */
        graphStartup: function(data) {
            this.inherited(arguments);

            var self = this;

            self.createToolbar();

            var activityTreeUrl;
            if (self.mode === "firstDayWizard") {
                activityTreeUrl = "deploy/componentProcess/activityTree";
            } else {
                activityTreeUrl = "deploy/componentProcess/" + this.componentProcess.id + "/activityTree";
            }

            if (!this.readOnly) {
                self.refreshStepPalette({
                    favoriteCookie: "component",
                    favoriteDrawers: [i18n("Utility Steps")],
                    process: self.componentProcess,
                    url: bootstrap.restUrl + activityTreeUrl
                });

            }
        },

        lockProcess: function(item) {
            var self = this;
            dojo.xhrPut({
                url: bootstrap.restUrl+"deploy/componentProcess/lock/"+item.id,
                handleAs: "json",
                load: function(data) {
                    self.destroyToolbar();
                    self.createToolbar(true, true);
                },
                error: function(error) {
                    var alert = new Alert({
                        messages: [i18n("Error locking process:"),
                                   "",
                                   util.escape(error.responseText)]
                    });
                    alert.startup();
                }
            });
        },

        unlockProcess: function(item, reloadToolbar) {
            var self = this;
            dojo.xhrPut({
                url: bootstrap.restUrl+"deploy/componentProcess/unlock/"+item.id,
                handleAs: "json",
                load: function(data) {
                    if (reloadToolbar) {
                        self.destroyToolbar();
                        self.createToolbar(true, false);
                    }
                    else {
                        navBar.setHash("draftComponentProcess/" + self.componentProcessId + "/-1", false, true);
                    }
                },
                error: function(error) {
                    var alert = new Alert({
                        messages: [i18n("Error unlocking process:"),
                                   "",
                                   util.escape(error.responseText)]
                    });
                    alert.startup();
                }
            });
        },

        getVersionToggleLabel: function() {
            if (this.isDraft && config.data.systemConfiguration.safeEditFeatureEnabled) {
                return i18n("Draft %s of %s", this.componentProcess.version, this.componentProcess.versionCount);
            }
            return i18n("Version %s of %s", this.componentProcess.version, this.componentProcess.versionCount);
        },

        getHashForSpecificVersion: function(version) {
            if (this.isDraft && config.data.systemConfiguration.safeEditFeatureEnabled) {
                return "draftComponentProcess/" + this.componentProcess.id + "/" + version;
            }
            return "componentProcess/" + this.componentProcess.id + "/" + version;
        },

        saveProcessDesign: function(comment) {
            var self = this;
            var json = self.getWorkflowJson();
            if (comment) {
                json.comment = comment;
            }

            if (self.mode === "firstDayWizard") {
                self.firstDayWizardModel.saveProcessDesign("component", self.componentProcess, json);
                dijit.byId("fdw-designer-dialog").destroy();
            } else {
                xhr.put(bootstrap.restUrl + "deploy/componentProcess/" + self.componentProcess.id + "/saveActivities", {
                    data: JSON.stringify(json),
                    headers: {
                        'componentProcessVersion': self.componentProcess.version,
                        'Content-Type': 'application/json'
                    }
                }).then(function(data) {
                    self.showSavePopup(i18n("Process design saved successfully."));
                    document.hasChanges = false;
                    self.clearChangedActivities();
                    navBar.setHash(self.getHashForSpecificVersion("-1"), false, true);
                }, function(error) {
                    self.showSaveErrorPopup(error);
                });
            }
        },

        createDivWithClass: function(divClassName, location) {
            domConstruct.create("div", {
                className: divClassName
            }, location);
        },

        generateVersionControls: function(persistent) {
            var self = this;

            if (!config.data.systemConfiguration.safeEditFeatureEnabled) {
                return util.vc.generateVersionControls(self.componentProcess, function(version) {
                    return self.getHashForSpecificVersion(version);
                });
            }

            var result = domConstruct.create("div", {});

            if (persistent.version > 1) {
                var backLink = domConstruct.create("a", {
                    "href": "#" + self.getHashForSpecificVersion(persistent.version - 1)
                }, result);
                self.createDivWithClass("arrow_backwards inlineBlock", backLink);
            }
            else {
                self.createDivWithClass("arrow_backwards_grey inlineBlock", result);
            }

            domConstruct.create("span", {
                "innerHTML": "&nbsp;&nbsp;&nbsp;"
            }, result);

            if (persistent.version < persistent.versionCount) {
                var forwardLink = domConstruct.create("a", {
                    "href": "#" + self.getHashForSpecificVersion(persistent.version + 1)
                }, result);
                domConstruct.create("span", {
                    "innerHTML": "&nbsp;&nbsp;"
                }, result);
                var fastForwardLink = domConstruct.create("a", {
                    "href": "#" + self.getHashForSpecificVersion(persistent.versionCount)
                }, result);

                self.createDivWithClass("arrow_forward inlineBlock", forwardLink);
                self.createDivWithClass("arrow_fastForward inlineBlock", fastForwardLink);

                if ((!!persistent.component && persistent.component.security["Manage Processes"]) ||
                        (!!persistent.componentTemplate && persistent.componentTemplate.security["Manage Processes"])) {
                    var linkContainer = domConstruct.create("div", {
                        style: {
                            paddingTop: "5px"
                        }
                    }, result);
                    var resetLink = domConstruct.create("a", {
                        "class": "linkPointer",
                        "innerHTML": i18n("Copy as Latest Draft")
                    }, linkContainer);
                    on(resetLink, "click", function() {
                        var resetConfirm = new GenericConfirm({
                            "message": i18n("Are you sure you want to reset the draft process to version %s of this process?",
                                    persistent.version),
                            "action": function() {
                                if (config.data.systemConfiguration.requiresCommitComment) {
                                    var commentDialog = new Dialog({
                                        title: i18n("Process Change Comment"),
                                        closable: true
                                    });
                                    var commentForm = new RequiredCommentForm({
                                        callback: function(data) {
                                            var json = {};
                                            if (data.comment) {
                                                json.comment = data.comment;
                                            }
                                            if (data) {
                                                xhr.put(bootstrap.restUrl+"vc/persistent/"+util.vc.encodeVersionedPath(persistent.path)+"."+persistent.version+"/setAsLatestWithComment", {
                                                    data: JSON.stringify(json),
                                                    headers: {
                                                        'Content-Type': 'application/json'
                                                    }
                                                }).then(function(data) {
                                                    if (config.data.systemConfiguration.safeEditFeatureEnabled) {
                                                        navBar.setHash("draftComponentProcess/" + self.componentProcessId + "/-1", false, true);
                                                    }
                                                    else {
                                                        navBar.setHash("componentProcess/" + self.componentProcessId + "/-1", false, true);
                                                    }
                                                }, function(error) {
                                                    var errorAlert = new Alert({
                                                        message: i18n("Error: %s",util.escape(data.responseText))
                                                    });
                                                });
                                            }
                                            commentDialog.hide();
                                            commentDialog.destroy();
                                        }
                                    });
                                    commentForm.placeAt(commentDialog);
                                    commentDialog.show();
                                }
                                else {
                                    dojo.xhrPut({
                                        url: bootstrap.restUrl+"vc/persistent/"+util.vc.encodeVersionedPath(persistent.path)+"."+persistent.version+"/setAsLatest",
                                        load: function() {
                                            if (config.data.systemConfiguration.safeEditFeatureEnabled) {
                                                navBar.setHash("draftComponentProcess/" + self.componentProcessId + "/-1", false, true);
                                            }
                                            else {
                                                navBar.setHash("componentProcess/" + self.componentProcessId + "/-1", false, true);
                                            }
                                        },
                                        error: function(data) {
                                            var errorAlert = new Alert({
                                                message: i18n("Error: %s",util.escape(data.responseText))
                                            });
                                        }
                                    });
                                }
                            }
                        });
                    });
                }
            }
            else {
                self.createDivWithClass("arrow_forward_grey inlineBlock", result);
                domConstruct.create("span", {
                    "innerHTML": "&nbsp;&nbsp;"
                }, result);
                self.createDivWithClass("arrow_fastForward_grey inlineBlock", result);
            }
            return result;
        }
    });
});

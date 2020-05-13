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
define(["dojo/dom-construct",
        "dojo/_base/kernel",
        "dojo/_base/xhr",
        "dojox/html/entities"],
function(domConstruct,
         dojo,
         xhr,
         entities) {
    dojo.provide("deploy.widgets.navigation.Applications");

    config.data.tabSets.push({
       id: "applications",
       hashPattern: ["tab"],
       breadcrumbs: ["home", "topLevelTab"],
       selectedTopLevelTab: "applications",

       defaultTab:"applications",
       tabs: [{
           id: "applications",
           label: i18n("Applications"),
           view: "deploy/views/application/applicationList"
       },{
           id: "templates",
           label: i18n("Templates"),
           view: "deploy/views/applicationTemplate/applicationTemplateList"
       }]
    });

    config.data.tabSets.push({
        id: "application",
        hashPattern: ["application", "tab"],
        breadcrumbs: ["home", "topLevelTab", "application"],
        selectedTopLevelTab: "applications",

        getDetailTitle: function() {
            return entities.encode(i18n("Application: %s", util.applyBTD(appState.application.name)));
        },

        getDetailFields: function() {
            var detailProperties = [{
                label: i18n("Created By"),
                value: entities.encode(appState.application.user)
            },{
                label: i18n("Created On"),
                value: util.dateFormatShort(appState.application.created)
            }];

            var template = appState.application.template;
            if (template) {
                detailProperties.push({
                    label: i18n("Template"),
                    value: "<a href=\"#applicationTemplate/" + template.id + "/" + template.version
                            + "\">" + entities.encode(template.name) + "</a>"
                });
            }

            return detailProperties;
        },
        getDetailDescription: function() {
            return entities.encode(appState.application.description);
        },

        stateCalls: [{
            targetAppStateEntry: "application",
            getUrl: function(appStateTargets, newAppState) {
                return bootstrap.restUrl+"deploy/application/"+appStateTargets.application;
            }
        }],

        defaultTab: "environments",
        tabs: [{
            id: "environments",
            label: i18n("Environments"),
            view: "deploy/views/application/applicationEnvironments"
        },{
            id: "history",
            label: i18n("History"),
            view: "deploy/views/application/applicationHistory"
        },{
            id: "configuration",
            label: i18n("Configuration"),
            className: "configurationTab",
            view: "deploy/views/application/applicationConfiguration"
        },{
            id: "components",
            label: i18n("Components"),
            view: "deploy/views/application/applicationComponents"
        },{
            id: "blueprints",
            label: i18n("Blueprints"),
            view: "deploy/views/application/applicationBlueprints"
        },{
            id: "snapshots",
            label: i18n("Snapshots"),
            view: "deploy/views/application/applicationSnapshots"
        },{
            id: "processes",
            label: i18n("Processes"),
            view: "deploy/views/application/applicationProcesses"
        },{
            id: "calendar",
            label: i18n("Calendar"),
            view: "deploy/views/application/applicationCalendar"
        },{
            id: "changes",
            label: i18n("Changes"),
            view: "deploy/views/application/applicationChangelog"
        },{
            id: "newSnapshot",
            label: "",
            view: "deploy/views/snapshot/editSnapshot",
            isVisible: function() {
                return false;
            }
        }]
    });

    config.data.tabSets.push({
        id: "applicationTemplate",
        hashPattern: ["applicationTemplate", "applicationTemplateVersion", "tab", "navData"],
        breadcrumbs: ["home", "applicationTemplates", "applicationTemplate"],
        selectedTopLevelTab: "applications",

        getDetailTitle: function() {
            return i18n("Application Template: %s", appState.applicationTemplate.name.escape());
        },

        getDetailFields: function() {
            var detailFields = [];

            detailFields.push({
                label: i18n("Version"),
                value: entities.encode(i18n("%s of %s", appState.applicationTemplate.version, appState.applicationTemplate.versionCount))
            });

            detailFields.push({
                label: "",
                value: util.vc.generateVersionControls(appState.applicationTemplate, function(version) {
                    return "applicationTemplate/" + appState.applicationTemplate.id + "/" + version;
                })
            });

            return detailFields;
        },

        getDetailDescription: function() {
            return entities.encode(appState.applicationTemplate.description);
        },

        stateCalls: [{
            targetAppStateEntry: "applicationTemplate",
            getUrl: function(appStateTargets, newAppState) {
                newAppState.applicationTemplateVersion = {
                        id: appStateTargets.applicationTemplateVersion
                };

                return bootstrap.restUrl + "deploy/applicationTemplate/"
                        + appStateTargets.applicationTemplate + "/"
                        + appStateTargets.applicationTemplateVersion;
            }
        },{
            getUrl: function(appStateTargets, newAppState) {
                newAppState.goBack = {
                    id: appStateTargets.navData
                };
            }
        }],

        getPageAlerts: function() {
            var alerts = [];
            var postAlert = false;
            var parentNode = domConstruct .create("div");

            domConstruct.create("div", {
                innerHTML: i18n("You can take more steps to enhance this application template and guide users through the application creation process:")
            }, parentNode);

            var listNode = domConstruct.create("ul", {}, parentNode);

            if (appState.applicationTemplate.tagRequirements.length === 0){
                domConstruct.create("li",{
                    innerHTML: i18n("Select component tags to require users to assign components to their applications.")
                }, listNode);
                postAlert = true;
            }

            if (appState.applicationTemplate.hasProcess === false) {
                domConstruct.create("li", {
                    innerHTML: i18n("Create an application process to deploy components or run other processes.")
                }, listNode);
                postAlert = true;
            }

            if (appState.applicationTemplate.environmentTemplates.length === 0) {
                domConstruct.create("li", {
                    innerHTML: i18n("Create environment templates to define the resource tree and allow users to add agents to it.")
                }, listNode);
                postAlert = true;
            }

            if (postAlert) {
                alerts.push({
                    className: "lowPriority",
                    html: parentNode
                });
            }

            domConstruct.create("div", {
                innerHTML: i18n('Confirm that the permissions are correctly set for the roles that are used to create applications from this template. For more information about these permissions, open the documentation and search for "Permissions reference for using application templates."')
            }, parentNode);

            return alerts;
        },

        defaultTab: "applications",
        tabs: [{
            id: "applications",
            label: i18n("Applications"),
            view: "deploy/views/applicationTemplate/applicationTemplateApplications"
        },{
            id: "configuration",
            label: i18n("Configuration"),
            view: "deploy/views/applicationTemplate/applicationTemplateConfiguration"
        },{
            id: "processes",
            label: i18n("Processes"),
            view: "deploy/views/applicationTemplate/applicationTemplateProcesses"
        },{
            id: "environmentTemplates",
            label: i18n("Environment Templates"),
            view: "deploy/views/applicationTemplate/applicationTemplateEnvironmentTemplates"
        },{
            id: "changes",
            label: i18n("Changes"),
            view: "deploy/views/applicationTemplate/applicationTemplateChangeLog"
        }]
    });

    config.data.breadcrumbItems.push({
        id: "appOrTmpl",
        getHash: function() {
            var result = "";
            if (appState.application) {
                result = "applications";
            }
            else if (appState.applicationTemplate) {
                result = "applications/templates";
            }
            return result;
        },
        getLabel: function() {
            var result = "";
            if (appState.application) {
                result = i18n("Applications");
            }
            else if (appState.applicationTemplate) {
                result = i18n("Application Templates");
            }
            return result;
        }
    });

    config.data.tabSets.push({
        id: "applicationProcess",
        hashPattern: ["applicationProcess", "applicationProcessVersion", "tab", "navData"],
        breadcrumbs: ["home", "appOrTmpl", "applicationOrTemplate", "applicationProcesses", "applicationProcess"],
        selectedTopLevelTab: "applications",

        // details moved into editor

        stateCalls: [{
            targetAppStateEntry: "applicationProcess",
            getUrl: function(appStateTargets, newAppState) {
                newAppState.applicationProcessVersion = {
                    id: appStateTargets.applicationProcessVersion
                };
                return bootstrap.restUrl+"deploy/applicationProcess/"+appStateTargets.applicationProcess+"/"+appStateTargets.applicationProcessVersion;
            },
            postGet: function(data, newAppState) {
                newAppState.application = data.application;
                newAppState.applicationTemplate = data.applicationTemplate;
            }
        },{
            getUrl: function(appStateTargets, newAppState) {
                newAppState.goBack = {
                    id: appStateTargets.navData
                };
            }
        }],

        defaultTab: "activities",
        tabs: [{
            id: "activities",
            label: i18n("Design"),
            view: "deploy/views/applicationProcess/applicationProcessActivities"
        },{
            id: "configuration",
            label: i18n("Configuration"),
            className: "configurationTab",
            view: "deploy/views/applicationProcess/applicationProcessConfiguration"
        },{
            id: "inventoryChanges",
            label: i18n("Inventory Changes"),
            view: "deploy/views/applicationProcess/applicationProcessInventoryChanges",
            isVisible: function() {
                var result = false;
                if (appState.application) {
                    result = (appState.application.security["Edit Basic Settings"] &&
                            appState.applicationProcess.inventoryManagementType !== "ADVANCED");
                }
                return result;
            }
        },{
            id: "changes",
            label: i18n("Changes"),
            view: "deploy/views/applicationProcess/applicationProcessChangelog"
        }]
    });

    config.data.tabSets.push({
        id: "environment",
        hashPattern: ["environment", "tab"],
        breadcrumbs: ["home", "topLevelTab", "application", "environments", "environment"],
        selectedTopLevelTab: "applications",

        getDetailTitle: function() {
            return i18n("Environment: %s for %s", entities.encode(appState.environment.name),
                    entities.encode(appState.application.name));
        },
        getDetailDescription: function() {
            return entities.encode(appState.environment.description);
        },
        getDetailFields: function() {
            var detailProperties = [];
            if (appState.environment.blueprint) {
                var envTemplateLink;
                if (appState.environment.blueprint.deleted) {
                    envTemplateLink = domConstruct.create("div", {
                        innerHTML: i18n("%s [Deleted]", appState.environment.blueprint.name.escape()),
                        className: "no-link"
                    });
                } else {
                    envTemplateLink = domConstruct.create("a", {
                        innerHTML: appState.environment.blueprint.name.escape(),
                        href: "#resourceTemplate/" + appState.environment.blueprint.id
                    });
                }
                detailProperties.push({
                    label: i18n("Template"),
                    value: envTemplateLink
                });
            }
            return detailProperties;
        },

        stateCalls: [{
            targetAppStateEntry: "environment",
            getUrl: function(appStateTargets, newAppState) {
                return bootstrap.restUrl + "deploy/environment/" + appStateTargets.environment;
            },
            postGet: function(data, newAppState) {
                newAppState.application = data.application;
            }
        }],

        defaultTab: "main",
        tabs: [{
            id: "main",
            label: i18n("Resources"),
            view: "deploy/views/environment/environmentMain"
        },{
            id: "history",
            label: i18n("History"),
            view: "deploy/views/environment/environmentHistory"
        },{
            id: "calendar",
            label: i18n("Calendar"),
            view: "deploy/views/environment/environmentCalendar"
        },{
            id: "configuration",
            label: i18n("Configuration"),
            className: "configurationTab",
            view: "deploy/views/environment/environmentConfiguration"
        },{
            id: "approvals",
            label: i18n("Approval Process"),
            view: "deploy/views/environment/editEnvironmentApprovalProcess",
            isVisible: function() {
                return appState.environment.requireApprovals;
            }
        },{
            id: "changes",
            label: i18n("Changes"),
            view: "deploy/views/environment/environmentChangelog"
        }]
    });

    config.data.tabSets.push({
        id: "environmentTemplate",
        hashPattern: ["environmentTemplate", "environmentTemplateVersion", "tab", "navData"],
        breadcrumbs: ["home", "applicationTemplates", "applicationTemplate", "environmentTemplates", "environmentTemplate"],
        selectedTopLevelTab: "applications",

        getDetailTitle: function() {
            return i18n("Environment Template: %s for %s", entities.encode(appState.environmentTemplate.name),
                    entities.encode(appState.applicationTemplate.name));
        },
        getDetailFields: function() {
            var detailFields = [];

            detailFields.push({
                label: i18n("Version"),
                value: entities.encode(i18n("%s of %s", appState.environmentTemplate.version, appState.environmentTemplate.versionCount))
            });

            detailFields.push({
                label: "",
                value: util.vc.generateVersionControls(appState.environmentTemplate, function(version) {
                    return "environmentTemplate/" + appState.environmentTemplate.id + "/" + version;
                })
            });

            return detailFields;
        },

        getDetailDescription: function() {
            return entities.encode(appState.environmentTemplate.description);
        },

        stateCalls: [{
            targetAppStateEntry: "environmentTemplate",
            getUrl: function(appStateTargets, newAppState) {
                newAppState.environmentTemplateVersion = {
                        id: appStateTargets.environmentTemplateVersion
                };

                return bootstrap.restUrl + "deploy/environmentTemplate/"
                        + appStateTargets.environmentTemplate + "/"
                        + appStateTargets.environmentTemplateVersion;
            },
            postGet: function(data, newAppState) {
                newAppState.applicationTemplate = data.applicationTemplate;
            }
        },{
            getUrl: function(appStateTargets, newAppState) {
                newAppState.goBack = {
                    id: appStateTargets.navData
                };
            }
        }],

        defaultTab: "configuration",
        tabs: [{
            id: "configuration",
            label: i18n("Configuration"),
            view: "deploy/views/environmentTemplate/environmentTemplateConfiguration"
        },{
            id: "resourceTemplate",
            label: i18n("Resource Template"),
            view: "deploy/views/environmentTemplate/environmentTemplateResourceTemplate"
        },{
            id: "approvalProcess",
            label: i18n("Approval Process"),
            view: "deploy/views/environmentTemplate/editEnvironmentTemplateApprovalProcess",
            isVisible: function() {
                return appState.environmentTemplate.requireApprovals;
            }
        },{
            id: "changes",
            label: i18n("Changes"),
            view: "deploy/views/environmentTemplate/environmentTemplateChangeLog"
        }]
    });

    config.data.tabSets.push({
        id: "environmentPropSheet",
        hashPattern: ["environment", "component", "environmentPropSheetVersion", "tab"],
        breadcrumbs: ["home", "topLevelTab", "application", "environments", "environment"],
        selectedTopLevelTab: "applications",

        getDetailTitle: function() {
            return i18n("Historical Properties for %s", entities.encode(appState.environment.name));
        },
        getDetailFields: function() {
            var detailProperties = [];

            detailProperties.push({
                label: i18n("Version"),
                value: i18n("%s of %s", appState.environmentPropSheet.version, appState.environmentPropSheet.versionCount)
            });

            detailProperties.push({
                label: "",
                value: util.vc.generateVersionControls(appState.environmentPropSheet, function(version) {
                    return "environmentPropSheet/"+appState.environment.id+"/"+appState.component.id+"/"+version;
                })
            });

            return detailProperties;
        },

        stateCalls: [{
            targetAppStateEntry: "environmentPropSheet",
            getUrl: function(appStateTargets, newAppState) {
                newAppState.environmentPropSheetVersion = {
                    id: appStateTargets.environmentPropSheetVersion
                };
                return bootstrap.restUrl+"deploy/environmentPropSheet/"+appStateTargets.environment+"/"+appStateTargets.component+"/"+appStateTargets.environmentPropSheetVersion;
            }
        },{
            targetAppStateEntry: "environment",
            getUrl: function(appStateTargets, newAppState) {
                newAppState.environmentPropSheetVersion = {
                    id: appStateTargets.environmentPropSheetVersion
                };
                return bootstrap.restUrl+"deploy/environment/"+appStateTargets.environment;
            },
            postGet: function(data, newAppState) {
                newAppState.application = data.application;
            }
        },{
            targetAppStateEntry: "component",
            getUrl: function(appStateTargets, newAppState) {
                newAppState.environmentPropSheetVersion = {
                    id: appStateTargets.environmentPropSheetVersion
                };
                return bootstrap.restUrl+"deploy/component/"+appStateTargets.component;
            }
        }],

        defaultTab: "properties",
        tabs: [{
            id: "properties",
            label: i18n("Properties"),
            view: "deploy/views/environmentPropSheet/environmentPropSheet"
        }]
    });

    config.data.tabSets.push({
        id: "environmentComparison",
        hashPattern: ["environment", "compareEnvironment", "tab"],
        breadcrumbs: ["home", "topLevelTab", "application", "environments"],
        selectedTopLevelTab: "applications",

        getDetailTitle: function() {
            return i18n("Environment Comparison: %s and %s", entities.encode(appState.environment.name), entities.encode(appState.compareEnvironment.name));
        },

        stateCalls: [{
            targetAppStateEntry: "environment",
            getUrl: function(appStateTargets, newAppState) {
                return bootstrap.restUrl+"deploy/environment/"+appStateTargets.environment;
            },
            postGet: function(data, newAppState) {
                newAppState.application = data.application;
            }
        },{
            targetAppStateEntry: "compareEnvironment",
            getUrl: function(appStateTargets, newAppState) {
                return bootstrap.restUrl+"deploy/environment/"+appStateTargets.compareEnvironment;
            }
        }],

        defaultTab: "versions",
        tabs: [{
            id: "versions",
            label: i18n("Versions"),
            view: "deploy/views/environmentComparison/environmentVersionComparison"
        },{
            id: "files",
            label: i18n("Files"),
            view: "deploy/views/environmentComparison/environmentFileComparison"
        },{
            id: "configuration",
            label: i18n("Configuration"),
            view: "deploy/views/environmentComparison/environmentConfigComparison"
        }]
    });

    config.data.tabSets.push({
        id: "multiEnvironmentComparison",
        hashPattern: ["application", "tab"],
        breadcrumbs: ["home", "topLevelTab", "application", "environments"],
        selectedTopLevelTab: "applications",

        getDetailTitle: function() {
            return i18n("%s: Environment Comparison", entities.encode(appState.application.name));
        },

        stateCalls: [{
            targetAppStateEntry: "application",
            getUrl: function(appStateTargets, newAppState) {
                return bootstrap.restUrl+"deploy/application/"+appStateTargets.application;
            }
        }],

        defaultTab: "configuration",
        tabs: [{
            id: "configuration",
            label: i18n("Configuration"),
            view: "deploy/views/multiEnvironmentComparison/multiEnvironmentConfigComparison"
        }]
    });

    config.data.tabSets.push({
        id: "snapshot",
        hashPattern: ["snapshot", "tab"],
        breadcrumbs: ["home", "topLevelTab", "application", "snapshots", "snapshot"],
        selectedTopLevelTab: "applications",

        getDetailTitle: function() {
            return i18n("Snapshot: %s", entities.encode(appState.snapshot.name));
        },
        getDetailFields: function() {
            var detailFields = [];

            detailFields.push({
                label: i18n("Versions Locked"),
                value: !!appState.snapshot.versionsLocked ? i18n("Yes") : i18n("No")
            });

            detailFields.push({
                label: i18n("Configuration Locked"),
                value: !!appState.snapshot.configLocked ? i18n("Yes") : i18n("No")
            });

            return detailFields;
        },
        getDetailDescription: function() {
            return entities.encode(appState.snapshot.description);
        },

        stateCalls: [{
            targetAppStateEntry: "snapshot",
            getUrl: function(appStateTargets, newAppState) {
                return bootstrap.restUrl+"deploy/snapshot/"+appStateTargets.snapshot;
            },
            postGet: function(data, newAppState) {
                newAppState.application = data.application;
            }
        }],

        defaultTab: "dashboard",
        tabs: [{
            id: "dashboard",
            label: i18n("Dashboard"),
            view: "deploy/views/snapshot/snapshotDashboard"
        },{
            id: "versions",
            label: i18n("Component Versions"),
            view: "deploy/views/snapshot/snapshotVersions"
        },{
            id: "configuration",
            label: i18n("Configuration"),
            className: "configurationTab",
            view: "deploy/views/snapshot/snapshotConfiguration"
        },{
            id: "calendar",
            label: i18n("Calendar"),
            view: "deploy/views/snapshot/snapshotCalendar"
        }]
    });

    config.data.tabSets.push({
        id: "snapshotComparison",
        hashPattern: ["snapshot", "compareSnapshot", "tab"],
        breadcrumbs: ["home", "topLevelTab", "application", "snapshots"],
        selectedTopLevelTab: "applications",

        getDetailTitle: function() {
            return i18n("Snapshot Comparison: %s %s and %s", entities.encode(appState.application.name),
                    entities.encode(appState.snapshot.name), entities.encode(appState.compareSnapshot.name));
        },

        stateCalls: [{
            targetAppStateEntry: "snapshot",
            getUrl: function(appStateTargets, newAppState) {
                return bootstrap.restUrl+"deploy/snapshot/"+appStateTargets.snapshot;
            },
            postGet: function(data, newAppState) {
                newAppState.application = data.application;
            }
        },{
            targetAppStateEntry: "compareSnapshot",
            getUrl: function(appStateTargets, newAppState) {
                return bootstrap.restUrl+"deploy/snapshot/"+appStateTargets.compareSnapshot;
            }
        }],

        defaultTab: "versions",
        tabs: [{
            id: "versions",
            label: i18n("Versions"),
            view: "deploy/views/snapshotComparison/snapshotVersionComparison"
        },{
            id: "configuration",
            label: i18n("Configuration"),
            view: "deploy/views/snapshotComparison/snapshotConfigComparison"
        },{
            id: "properties",
            label: i18n("Properties"),
            view: "deploy/views/snapshotComparison/snapshotPropertyComparison"
        },{
            id: "files",
            label: i18n("Compare Files"),
            view: "deploy/views/snapshotComparison/snapshotFileComparison"
        }]

    });



    config.data.breadcrumbItems.push({
        id: "application",
        getHash: function() {
            return "application/"+appState.application.id;
        },
        isUserData: true,
        getLabel: function() {
            return entities.encode(appState.application.name);
        }
    });

    config.data.breadcrumbItems.push({
        id: "applicationTemplates",
        getHash: function() {
            return "applications/templates";
        },
        isUserData: false,
        getLabel:function() {
            return i18n("Application Templates");
        }
    });

    config.data.breadcrumbItems.push({
        id: "applicationTemplate",
        getHash: function() {
            return "applicationTemplate/" + appState.applicationTemplate.id + "/-1";
        },
        isUserData: true,
        getLabel: function() {
            return entities.encode(appState.applicationTemplate.name);
        }
    });

    config.data.breadcrumbItems.push({
        id: "applicationOrTemplate",
        getHash: function() {
            var result = "";
            if (appState.application) {
                result = "application/" + appState.application.id;
            }
            else if (appState.applicationTemplate) {
                result = "applicationTemplate/" + appState.applicationTemplate.id + "/-1";
            }
            return result;
        },
        isUserDate: true,
        getLabel: function() {
            var result = "";
            if (appState.application) {
                result = entities.encode(appState.application.name);
            }
            else if (appState.applicationTemplate) {
                result = entities.encode(appState.applicationTemplate.name);
            }
            return result;
        }
    });

    config.data.breadcrumbItems.push({
        id: "applicationProcesses",
        getHash: function() {
            var result = "";
            if (appState.application) {
                result = "application/" + appState.application.id + "/processes";
            }
            else if (appState.applicationTemplate) {
                result = "applicationTemplate/" + appState.applicationTemplate.id + "/-1/processes";
            }
            return result;
        },
        isUserData: false,
        getLabel: function() {
            return i18n("Processes");
        }
    });

    config.data.breadcrumbItems.push({
        id: "environments",
        getHash: function() {
            return "application/"+appState.application.id+"/environments";
        },
        isUserData: false,
        getLabel: function() {
            return i18n("Environments");
        }
    });

    config.data.breadcrumbItems.push({
        id: "environmentTemplates",
        getHash: function() {
            return "applicationTemplate/" + appState.applicationTemplate.id + "/-1/environmentTemplates";
        },
        isUserData: false,
        getLabel:function() {
            return i18n("Environment Templates");
        }
    });

    config.data.breadcrumbItems.push({
        id: "environmentTemplate",
        getHash: function() {
            return "environmentTemplate/" + appState.environmentTemplate.id + "/-1";
        },
        isUserData: true,
        getLabel: function() {
            return entities.encode(appState.environmentTemplate.name);
        }
    });

    config.data.breadcrumbItems.push({
        id: "snapshots",
        getHash: function() {
            return "application/"+appState.application.id+"/snapshots";
        },
        isUserData: false,
        getLabel: function() {
            return i18n("Snapshots");
        }
    });

    config.data.breadcrumbItems.push({
        id: "applicationProcess",
        getHash: function() {
            return "applicationProcess/"+appState.applicationProcess.id;
        },
        isUserData: false,
        getLabel: function() {
            return i18n("Process: %s", appState.applicationProcess.name.escape());
        }
    });

    config.data.breadcrumbItems.push({
        id: "environment",
        getHash: function() {
            return "environment/"+appState.environment.id;
        },
        isUserData: false,
        getLabel: function() {
            return i18n("Environment: %s", appState.environment.name.escape());
        }
    });

    config.data.breadcrumbItems.push({
        id: "snapshot",
        getHash: function() {
            return "snapshot/"+appState.snapshot.id;
        },
        isUserData: false,
        getLabel: function() {
            return i18n("Snapshot: %s", appState.snapshot.name.escape());
        }
    });
});

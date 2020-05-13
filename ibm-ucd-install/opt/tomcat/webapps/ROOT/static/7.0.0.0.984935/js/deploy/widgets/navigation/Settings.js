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
define(["dojo",
        "dojo/_base/xhr",
        "dojo/dom-construct",
        "dojox/html/entities",
        "js/webext/widgets/Alert"],
function(dojo,
         xhr,
         domConstruct,
         entities,
         Alert) {
    dojo.provide("deploy.widgets.navigation.Settings");

    config.data.tabSets.push({
        id: "settings",
        hashPattern: ["tab"],
        breadcrumbs: ["home", "topLevelTab"],
        selectedTopLevelTab: "settings",

        defaultTab: "main",
        tabs: [{
            id: "main",
            label: i18n("Settings"),
            view: "deploy/views/settings/settingsIndex"
        }]
    });

    config.data.tabSets.push({
        id: "automation",
        hashPattern: ["tab"],
        breadcrumbs: ["home", "topLevelTab", "automation"],
        selectedTopLevelTab: "settings",

        defaultTab: "automationPlugins",
        tabs: [{
            id: "automationPlugins",
            label: i18n("Automation Plugins"),
            view: "deploy/views/plugin/pluginList"
        },{
            id: "sourceConfigPlugins",
            label: i18n("Source Configuration Plugins"),
            view: "deploy/views/plugin/sourceConfigList"
        },{
            id: "runningSourceConfigs",
            label: i18n("Running Version Imports"),
            view: "deploy/views/version/runningVersionImports"
        },{
            id: "locks",
            label: i18n("Locks"),
            view: "deploy/views/lock/lockList",
            isVisible: function() {
                return config.data.permissions[security.system.viewLocks];
            }
        },{
            id: "blueprintdesignerIntegrations",
            label: i18n("Blueprint Designer Integrations"),
            view: "deploy/views/settings/blueprintdesignerIntegrations",
            isVisible: function() {
                return config.data.permissions[security.system.manageBlueprintDesignIntegrations];
            }
        },{
            id: "postProcessingScripts",
            label: i18n("Post Processing Scripts"),
            view: "deploy/views/scripts/postProcessingList"
        },{
            id: "statuses",
            label: i18n("Statuses"),
            view: "deploy/views/status/statusList"
        }]
    });

    config.data.tabSets.push({
        id: "system",
        hashPattern: ["tab"],
        breadcrumbs: ["home", "topLevelTab", "system"],
        selectedTopLevelTab: "settings",

        defaultTab: "properties",
        tabs: [{
            id: "logging",
            label: i18n("Logging"),
            view: "deploy/views/settings/logging",
            isVisible: function() {
                return config.data.permissions[security.system.manageLogging];
            }
        },{
            id: "network",
            label: i18n("Network"),
            view: "deploy/views/network/networkRelayList",
            isVisible: function() {
                return config.data.permissions[security.system.viewNetworkSettings];
            }
        },{
            id: "notification",
            label: i18n("Notifications"),
            view: "deploy/views/notification/notificationSchemeList"
        },{
            id: "auditLog",
            label: i18n("Audit Log"),
            view: "deploy/views/settings/auditlog",
            isVisible: function() {
                return config.data.permissions[security.system.viewAuditLog];
            }
        },{
            id: "patches",
            label: i18n("Patches"),
            view: "deploy/views/settings/patches"
        },{
            id: "properties",
            label: i18n("Properties"),
            view: "deploy/views/settings/systemProperties"
        },{
            id: "artifactRepo",
            label: i18n("CodeStation"),
            view: "deploy/views/settings/artifactRepo"
        },{
            id: "settings",
            label: i18n("System Settings"),
            view: "deploy/views/settings/systemSettings",
            isVisible: function() {
                return config.data.permissions[security.system.viewBasicSystemSettings];
            }
        }]
    });

    config.data.tabSets.push({
        id: "notificationScheme",
        hashPattern: ["notificationScheme", "tab"],
        breadcrumbs: ["home", "topLevelTab", "notificationSchemes", "notificationScheme"],
        selectedTopLevelTab: "settings",

        getDetailTitle: function() {
            return i18n("Notification Scheme: %s", entities.encode(appState.notificationScheme.name));
        },
        getDetailDescription: function() {
            return entities.encode(appState.notificationScheme.description);
        },

        stateCalls: [{
            targetAppStateEntry: "notificationScheme",
            getUrl: function(appStateTargets, newAppState) {
                return bootstrap.restUrl+"notification/notificationScheme/"+appStateTargets.notificationScheme;
            }
        }],

        defaultTab: "main",
        tabs: [{
            id: "main",
            label: i18n("Main"),
            view: "deploy/views/notification/notificationSchemeMain"
        }]
    });

    var canManageNotificationSchemes = config.data.permissions[security.system.manageNotificationSchemes];
    if (canManageNotificationSchemes) {
        var notificationSchemeTab = config.data.tabSets[config.data.tabSets.length - 1];
        notificationSchemeTab.tabs.push({
            id: "edit",
            label: i18n("Edit"),
            view: "deploy/views/notification/editNotificationScheme"
        });
    }

    config.data.tabSets.push({
        id: "automationPlugin",
        hashPattern: ["automationPlugin", "tab"],
        breadcrumbs: ["home", "topLevelTab", "automation", "automationPlugin"],
        selectedTopLevelTab: "settings",

        getDetailTitle: function() {
            return i18n("Automation Plugin: %s", entities.encode(i18n(appState.automationPlugin.name)));
        },
        getDetailDescription: function() {
            return entities.encode(i18n(appState.automationPlugin.description));
        },

        stateCalls: [{
            targetAppStateEntry: "automationPlugin",
            getUrl: function(appStateTargets, newAppState) {
                return bootstrap.restUrl+"plugin/automationPlugin/"+appStateTargets.automationPlugin;
            }
        }],

        defaultTab: "main",
        tabs: [{
            id: "main",
            label: i18n("Main"),
            view: "deploy/views/automationPlugin/automationPluginMain"
        }]
    });

    config.data.tabSets.push({
        id: "license",
        hashPattern: ["license", "tab"],
        breadcrumbs: ["home", "topLevelTab", "licenses", "license"],
        selectedTopLevelTab: "settings",

        getDetailTitle: function() {
            return i18n("License %s", appState.license.licenseId);
        },
        getDetailFields: function() {
            var detailFields = [{
                label: i18n("Description"),
                value: entities.encode(appState.license.description)
            }];
            return detailFields;
        },

        stateCalls: [{
            targetAppStateEntry: "license",
            getUrl: function(appStateTargets, newAppState) {
                return bootstrap.restUrl+"license/"+appStateTargets.license;
            }
        }],

        defaultTab: "edit",
        tabs: [{
            id: "edit",
            label: i18n("Edit"),
            view: "deploy/views/license/editLicense"
        }]
    });

    var canManageDiagnostics = config.data.permissions[security.system.manageDiagnostics];
    if (canManageDiagnostics) {
        config.data.tabSets.push({
            id: "diagnostics",
            hashPattern: ["tab"],
            breadcrumbs: ["home", "topLevelTab", "diagnostics"],
            selectedTopLevelTab: "settings",

            defaultTab: "threadDumps",
            tabs: [{
                id: "threadDumps",
                label: i18n("Java Thread Dumps"),
                view: "deploy/views/settings/diagnostics/threadDumps"
            },{
                id: "restCallLog",
                label: i18n("REST Call Log"),
                view: "deploy/views/settings/diagnostics/restCallLog"
            },{
                id: "metadataIndexing",
                label: i18n("Metadata Indexing"),
                view: "deploy/views/settings/diagnostics/metadataIndexing"
            }]
        });
    }





    config.data.breadcrumbItems.push({
        id: "system",
        getHash: function() {
            return "system";
        },
        isUserData: false,
        getLabel: function() {
            return i18n("System");
        }
    });

    config.data.breadcrumbItems.push({
        id: "automation",
        getHash: function() {
            return "automation/automationPlugins";
        },
        isUserData: false,
        getLabel: function() {
            return i18n("Automation");
        }
    });

    config.data.breadcrumbItems.push({
        id: "automationPlugin",
        getHash: function() {
            return "automationPlugin/"+appState.automationPlugin.id;
        },
        isUserData: false,
        getLabel: function() {
            return entities.encode(i18n(appState.automationPlugin.name));
        }
    });

    config.data.breadcrumbItems.push({
        id: "notificationSchemes",
        getHash: function() {
            return "system/notification";
        },
        isUserData: false,
        getLabel: function() {
            return i18n("Notifications");
        }
    });

    config.data.breadcrumbItems.push({
        id: "notificationScheme",
        getHash: function() {
            return "notificationScheme/"+appState.notificationScheme.id;
        },
        isUserData: true,
        getLabel: function() {
            return entities.encode(appState.notificationScheme.name);
        }
    });

    config.data.breadcrumbItems.push({
        id: "diagnostics",
        getHash: function() {
            return "system/diagnostics";
        },
        isUserData: true,
        getLabel: function() {
            return i18n("Diagnostics");
        },
        isVisible: function() {
            return canManageDiagnostics;
        }
    });

    config.data.tabSets.push({
        id: "noPermissions",
        hashPattern: ["noPermissions"],
        breadcrumbs: ["home"],
        selectedTopLevelTab: "noPermissions",

        defaultTab: "noPermissions",
        tabs: [{
            id: "noPermissions",
            label: i18n("No Permissions"),
            view: "deploy/views/noPermissions"
        }]
    });

    config.data.alerts = {
        /*
         * Alert Item Format
         *
         * 'alertName': {
         *     getDisplay: function() { returns the DOM of what should be displayed in the alert }
         *     dismiss: function() { called when a user clicks the X to dismiss an alert }
         * }
         *
         */
        'ALERT_LICENSE_LOG_ENTRIES': {
            getDisplay: function() {
                var container = domConstruct.create('div', {
                    innerHTML: i18n("A license could not be " +
                            "obtained for a server or agent. Please check your license log for " +
                            "more information.")
                });

                return container;
            },
            dismiss: function() {
                xhr.del({
                    url: bootstrap.restUrl+'license/dismiss',
                    load: function() {
                    },
                    error: function(error) {
                        var alert = new Alert({
                            messages: [i18n("An error occurred while dismissing the alert."),
                                       "",
                                       util.escape(error.responseText)]
                        });
                    }
                });
            }
        },

        'ALERT_PROCESS_INDEXING': {
            getDisplay: function(item) {
                var container = domConstruct.create('div', {
                    innerHTML: i18n("Processes are currently being indexed. Navigating to a " +
                            "process may fail until this is complete. Current completion: %s%",
                            item.data.completionPercent)
                });

                if (canManageDiagnostics) {
                    var linkContainer = domConstruct.create("div", {}, container);
                    domConstruct.create("a", {
                        href: "#diagnostics/metadataIndexing",
                        innerHTML: i18n("View detailed status...")
                    }, linkContainer);
                }

                return container;
            }
        }
    };
});

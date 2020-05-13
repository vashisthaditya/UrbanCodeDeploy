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
define(["dojo/_base/kernel",
        "dojox/html/entities"],
function(dojo,
         entities) {
    dojo.provide("deploy.widgets.Security");

    security = {
        general: {
            editBasicSettings: "Edit Basic Settings"
        },
        agent: {
            addToAgentPool: "Add to Agent Pool",
            createResources: "Create Resources",
            manageVersionImports: "Manage Version Imports",
            upgradeAgent: "Upgrade Agents",
            installRemoteAgents: "Install Remote Agents"
        },
        application: {
            runComponentProcesses: "Run Component Processes",
            manageSnapshots: "Manage Snapshots",
            deleteSnapshots: "Delete Snapshots"
        },
        component: {
            manageVersions: "Manage Versions"
        },
        resource: {
            mapToEnvironments: "Map to Environments",
            resourceBasicSettings: "Basic Settings (Resources)",
            resourceProperties: "Manage Properties (Resources)",
            resourceTeams: "Manage Teams (Resources)",
            manageImpersonation: "Manage Impersonation",
            resourceManageChildren: "Manage Resource Children"
        },
        system: {
            createComponents: "Create Components",
            createComponentsFromTemplate: "Create Components From Template",
            createComponentTemplates: "Create Component Templates",
            createApplications: "Create Applications",
            createApplicationsFromTemplate: "Create Applications From Template",
            createApplicationTemplates: "Create Application Templates",
            createEnvironments: "Create Environments",
            createEnvironmentsFromTemplate: "Create Environments From Template",
            createEnvironmentTemplates: "Create Environment Templates",
            createResources: "Create Resources",
            createResourceTemplates: "Create Resource Templates",
            createAgentPools: "Create Agent Pools",
            createProcess: "Create Processes",
            createManageResourceRoles: "Manage Resource Roles",
            manageSecurity: "Manage Security",
            managePlugins: "Manage Plugins",
            manageAuthTokenRestrictions: "Manage Auth Token Restrictions",
            managePostProcessingScripts: "Manage Post Processing Scripts",
            viewBasicSystemSettings: "View Basic System Settings",
            editBasicSystemSettings: "Edit Basic System Settings",
            viewLocks: "View Locks",
            releaseLocks: "Release Locks",
            manageDiagnostics: "Manage Diagnostics",
            manageNotificationSchemes: "Manage Notification Schemes",
            manageStatuses: "Manage Statuses",
            viewNetworkSettings: "View Network Settings",
            editNetworkSettings: "Edit Network Settings",
            manageAuditLog: "Manage Audit Log",
            viewAuditLog: "View Audit Log",
            viewOutputLog: "View Output Log",
            manageBlueprintDesignIntegrations: "Manage Blueprint Designer Integrations",
            manageLogging: "Manage Logging Settings",
            manageSystemProperties: "Manage System Properties"
        },
        resourceTypes: {
            ui: "20000000000000000000000000000200",
            system: "20000000000000000000000000000201"
        }
    };
});

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
/*global security*/
define([
    "dojo/_base/kernel",
    "dojox/html/entities",
    "deploy/widgets/Security"
], function(
    dojo,
    entities,
    Security) {
    dojo.provide("deploy.widgets.navigation.Security");

    config.data.breadcrumbItems.push({
        id: "user",
        getHash: function() {
            return "user";
        },
        isUserData: false,
        getLabel: function() {
            return i18n("My Profile");
        }
    });

    config.data.tabSets.push({
        id: "user",
        hashPattern: ["tab"],
        breadcrumbs: ["home", "user"],
        selectedTopLevelTab: "root",

        defaultTab: "teamManager",
        tabs: [{
            id: "teamManager",
            label: i18n("Team Manager"),
            view: "deploy/views/security/teamManager"
        }, {
            id: "userManager",
            label: i18n("User Manager"),
            view: "deploy/views/security/userManager"
        }, {
            id: "preferences",
            label: i18n("Preferences"),
            view: "deploy/views/security/userPreferences"
        }]
    });

    config.data.tabSets.push({
        id: "welcome",
        hashPattern: ["tab"],
        breadcrumbs: [],
        hideGlobalMsgs: true,
        selectedTopLevelTab: "welcome",

        defaultTab: "main",
        tabs: [{
            id: "main",
            label: i18n("Welcome"),
            view: "deploy/views/welcome/main"
        }]
    });

    config.data.tabSets.push({
        id: "tools",
        hashPattern: ["tab"],
        breadcrumbs: ["tab"],
        selectedTopLevelTab: "root",

        defaultTab: "main",
        tabs: [{
            id: "main",
            label: i18n("Tools"),
            view: "deploy/views/tools/Main"
        }]
    });

    config.data.tabSets.push({
        id: "security",
        hashPattern: ["tab"],
        breadcrumbs: ["home", "topLevelTab", "security"],
        selectedTopLevelTab: "settings",

        defaultTab: "authentication",
        tabs: [{
            id: "authentication",
            label: i18n("Authentication"),
            view: "deploy/views/security/authenticationRealmManager",
            isVisible: function() {
                return config.data.permissions[security.system.manageSecurity];
            }
        }, {
            id: "authorization",
            label: i18n("Authorization"),
            view: "deploy/views/security/authorizationRealmManager",
            isVisible: function() {
                return config.data.permissions[security.system.manageSecurity];
            }
        }, {
            id: "teams",
            label: i18n("Teams"),
            view: "deploy/views/security/teamManager",
            isVisible: function() {
                return config.data.permissions[security.system.manageSecurity];
            }
        }, {
            id: "tokens",
            label: i18n("Tokens"),
            view: "deploy/views/security/tokens",
            isVisible: function() {
                return config.data.permissions[security.system.manageSecurity];
            }
        }, {
            id: "authTokenRestrictions",
            label: i18n("Token Restrictions"),
            view: "deploy/views/settings/authTokenRestrictions",
            isVisible: function() {
                return config.data.permissions[security.system.manageAuthTokenRestrictions]
                    || config.data.permissions[security.system.deleteAuthTokenRestrictions];
            }
        }, {
            id: "roles",
            label: i18n("Role Configuration"),
            view: "deploy/views/security/roleManager",
            isVisible: function() {
                return config.data.permissions[security.system.manageSecurity];
            }
        }, {
            id: "keys",
            label: i18n("API Keys"),
            view: "deploy/views/security/keyManager",
            isVisible: function() {
                return config.data.permissions[security.system.manageSecurity];
            }
        }, {
            id: "types",
            label: i18n("Type Configuration"),
            view: "deploy/views/security/resourceRoleManager",
            isVisible: function() {
                return config.data.permissions[security.system.manageSecurity];
            }
        }]
    });

    config.data.breadcrumbItems.push({
        id: "security",
        getHash: function() {
            return "security";
        },
        isUserData: false,
        getLabel: function() {
            return i18n("Security");
        }
    });
});

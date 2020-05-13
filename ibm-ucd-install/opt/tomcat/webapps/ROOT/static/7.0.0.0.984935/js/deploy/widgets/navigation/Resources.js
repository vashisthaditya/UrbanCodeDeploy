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
define(["dojo/_base/kernel",
        "dojox/html/entities"],
function(dojo,
         entities) {
    dojo.provide("deploy.widgets.navigation.Resources");

    var resourcesTabs = [{
            id: "resources",
            label: i18n("Resource Tree"),
            view: "deploy/views/resource/resourceList"
        },{
            id: "resourceTemplates",
            label: i18n("Resource Templates"),
            view: "deploy/views/resourceTemplate/resourceTemplateList"
        },{
            id: "agents",
            label: i18n("Agents"),
            view: "deploy/views/agent/agentList"
        },{
            id: "agentRelays",
            label: i18n("Agent Relays"),
            view: "deploy/views/agentRelay/agentRelayList"
        },{
            id: "agentPools",
            label: i18n("Agent Pools"),
            view: "deploy/views/agentPool/agentPoolList"
        },{
            id: "cloud",
            label: i18n("Cloud Connections"),
            view: "deploy/views/settings/cloudConnections"
        }
    ];

    if (config.data.systemConfiguration.enableConfigurationDriftTab) {
        resourcesTabs.push({
            id: "variance",
            label: i18n("Configuration"),
            view: "deploy/views/resource/variance"
        });
    }

    config.data.tabSets.push({
        id: "resources",
        hashPattern: ["tab"],
        breadcrumbs: ["home", "topLevelTab"],
        selectedTopLevelTab: "resources",

        defaultTab: "resources",
        tabs: resourcesTabs
    });

    config.data.tabSets.push({
        id: "resource",
        hashPattern: ["resource", "tab"],
        breadcrumbs: ["home", "topLevelTab", "resourceTemplatesIfOnResource", "resourceTemplateLinkIfResourceHasTemplate", "resource"],
        selectedTopLevelTab: "resources",

        getDetailTitle: function() {
            return i18n("Resource: %s", entities.encode(appState.resource.name));
        },
        getDetailFields: function() {
            var detailFields = [];

            if (appState.resource.agent) {
                detailFields.push({
                    label: i18n("Agent"),
                    value: "<a href=\"#agent/"+appState.resource.agent.id+"\">"+entities.encode(appState.resource.agent.name)+"</a>"
                });
            }
            if (appState.resource.relay) {
                detailFields.push({
                    label: i18n("Relay"),
                    value: "<a href=\"#relay"+appState.resource.relay.id+"\">"+entities.encode(appState.resource.relay.name)+"</a>"
                });
            }
            if (appState.resource.agentPool) {
                detailFields.push({
                    label: i18n("Agent Pool"),
                    value: "<a href=\"#agentPool/"+appState.resource.agentPool.id+"\">"+entities.encode(appState.resource.agentPool.name)+"</a>"
                });
            }
            if (appState.resource.parent) {
                detailFields.push({
                    label: i18n("Parent Resource"),
                    value: "<a href=\"#resource/"+appState.resource.parent.id+"\">"+entities.encode(appState.resource.parent.path.replace(/\//g, " / "))+"</a>"
                });
            }

            return detailFields;
        },
        getDetailDescription: function() {
            return entities.encode(appState.resource.description);
        },

        stateCalls: [{
            targetAppStateEntry: "resource",
            getUrl: function(appStateTargets, newAppState) {
                return bootstrap.restUrl+"resource/resource/"+appStateTargets.resource;
            }
        }],

        defaultTab: "main",
        tabs: [{
            id: "main",
            label: i18n("Main"),
            view: "deploy/views/resource/resourceMain"
        },{
            id: "inventory",
            label: i18n("Inventory"),
            view: "deploy/views/resource/resourceInventory"
        },{
            id: "discovery",
            label: i18n("History"),
            view: "deploy/views/resource/resourceHistory"
        },{
            id: "configuration",
            label: i18n("Configuration"),
            className: "configurationTab",
            view: "deploy/views/resource/resourceConfiguration"
        },{
            id: "changes",
            label: i18n("Changes"),
            view: "deploy/views/resource/resourceChangelog"
        }]
    });

    config.data.tabSets.push({
        id: "resourceTemplate",
        hashPattern: ["resourceTemplate", "tab"],
        breadcrumbs: ["home", "topLevelTab", "resourceTemplates", "resourceTemplate"],
        selectedTopLevelTab: "resources",

        getDetailTitle: function() {
            return i18n("Resource Template: %s", entities.encode(appState.resourceTemplate.name));
        },
        getDetailDescription: function() {
            return entities.encode(appState.resourceTemplate.description);
        },
        getDetailFields: function() {
            var detailFields = [];

            if (appState.resourceTemplate.parent) {
                detailFields.push({
                    label: i18n("Parent Template"),
                    value: "<a href=\"#resourceTemplate/"+appState.resourceTemplate.parent.id+"\">"+entities.encode(appState.resourceTemplate.parent.name)+"</a>"
                });
            }

            return detailFields;
        },

        stateCalls: [{
            targetAppStateEntry: "resourceTemplate",
            getUrl: function(appStateTargets, newAppState) {
                return bootstrap.restUrl+"resource/resourceTemplate/"+appStateTargets.resourceTemplate;
            }
        }],

        defaultTab: "configuration",
        tabs: [{
            id: "configuration",
            label: i18n("Configuration"),
            view: "deploy/views/resourceTemplate/resourceTemplateConfiguration"
        }]
    });

    config.data.tabSets.push({
        id: "agent",
        hashPattern: ["agent", "tab"],
        breadcrumbs: ["home", "topLevelTab", "agents", "agent"],
        selectedTopLevelTab: "resources",

        getDetailTitle: function() {
            return i18n("Agent: %s", entities.encode(appState.agent.name));
        },
        getDetailDescription: function() {
            return entities.encode(appState.agent.description);
        },

        stateCalls: [{
            targetAppStateEntry: "agent",
            getUrl: function(appStateTargets, newAppState) {
                return bootstrap.restUrl+"agent/"+appStateTargets.agent;
            }
        }],

        defaultTab: "main",
        tabs: [{
            id: "main",
            label: i18n("Main"),
            view: "deploy/views/agent/agentMain"
        },{
            id: "configuration",
            label: i18n("Configuration"),
            className: "configurationTab",
            view: "deploy/views/agent/agentConfiguration"
        }]
    });

    config.data.tabSets.push({
        id: "relay",
        hashPattern: ["relay", "tab"],
        breadcrumbs: ["home", "topLevelTab", "relays", "relay"],
        selectedTopLevelTab: "resources",

        getDetailTitle: function() {
            return i18n("Agent Relays: %s", entities.encode(appState.relay.name));
        },

        stateCalls: [{
            targetAppStateEntry: "relay",
            getUrl: function(appStateTargets, newAppState) {
                return bootstrap.restUrl + "relay/"+appStateTargets.relay;
            }
        }],

        defaultTab: "main",
        tabs: [{
            id: "main",
            label: i18n("Main"),
            view: "deploy/views/agentRelay/relayMain"
        },{
            id: "configuration",
            label: i18n("Configuration"),
            className: "configurationTab",
            view: "deploy/views/agentRelay/relayConfiguration"
        }]
    });

    config.data.tabSets.push({
        id: "agentPool",
        hashPattern: ["agentPool", "tab"],
        breadcrumbs: ["home", "topLevelTab", "agentPools", "agentPool"],
        selectedTopLevelTab: "resources",

        getDetailTitle: function() {
            return i18n("Agent Pool: %s", entities.encode(appState.agentPool.name));
        },
        getDetailDescription: function() {
            return entities.encode(appState.agentPool.description);
        },

        stateCalls: [{
            targetAppStateEntry: "agentPool",
            getUrl: function(appStateTargets, newAppState) {
                return bootstrap.restUrl+"agent/pool/"+appStateTargets.agentPool;
            }
        }],

        defaultTab: "main",
        tabs: [{
            id: "main",
            label: i18n("Main"),
            view: "deploy/views/agentPool/agentPoolMain"
        },{
            id: "configuration",
            label: i18n("Configuration"),
            className: "configurationTab",
            view: "deploy/views/agentPool/agentPoolConfiguration"
        }]
    });


    config.data.tabSets.push({
        id: "resourceComparison",
        hashPattern: ["leftSideType", "leftSide", "rightSideType", "rightSide", "tab"],
        breadcrumbs: ["home", "topLevelTab"],
        selectedTopLevelTab: "resources",

        getDetailTitle: function() {
            return i18n("Resource Comparison");
        },

        getDetailFields: function() {
            var detailFields = [];

            detailFields.push({
                label: i18n("Left-Hand Resource"),
                value: "<a href=\"#resource/"+appState.leftResource.id+"\">"+entities.encode(appState.leftResource.path)+"</a>"
            });
            detailFields.push({
                label: i18n("Right-Hand Resource"),
                value: "<a href=\"#resource/"+appState.rightResource.id+"\">"+entities.encode(appState.rightResource.path)+"</a>"
            });

            return detailFields;
        },

        stateCalls: [{
            targetAppStateEntry: "leftId",
            getUrl: function(appStateTargets, newAppState) {
                newAppState.leftId = appStateTargets.leftSide;
                return '';
            }
        },{
            targetAppStateEntry: "rightId",
            getUrl: function(appStateTargets, newAppState) {
                newAppState.rightId = appStateTargets.rightSide;
                return '';
            }
        },{
            targetAppStateEntry: "leftResource",
            getUrl: function(appStateTargets, newAppState) {
                var url = '';
                if (appStateTargets.leftSideType === "resourceTemplate") {
                    url = bootstrap.restUrl+"resource/resourceTemplate/"+appStateTargets.leftSide+"/root";
                }
                else if (appStateTargets.leftSideType === "resource") {
                    url = bootstrap.restUrl+"resource/resource/"+appStateTargets.leftSide;
                }
                return url;
            }
        },{
            targetAppStateEntry: "rightResource",
            getUrl: function(appStateTargets, newAppState) {
                var url = '';
                if (appStateTargets.rightSideType === "resourceTemplate") {
                    url = bootstrap.restUrl+"resource/resourceTemplate/"+appStateTargets.rightSide+"/root";
                }
                else if (appStateTargets.rightSideType === "resource") {
                    url = bootstrap.restUrl+"resource/resource/"+appStateTargets.rightSide;
                }
                return url;
            }
        }],

        defaultTab: "main",
        tabs: [{
            id: "main",
            label: i18n("Main"),
            view: "deploy/views/resource/resourceComparison"
        }]
    });


    config.data.breadcrumbItems.push({
        id: "resource",
        getHash: function() {
            return "resource/"+appState.resource.id;
        },
        isUserData: true,
        getLabel: function() {
            return entities.encode(appState.resource.name);
        }
    });

    config.data.breadcrumbItems.push({
        id: "resourceTemplatesIfOnResource",
        getHash: function() {
            return "resources/resourceTemplates";
        },
        isUserData: true,
        getLabel: function() {
            var result;
            if (!!appState.resource.resourceTemplate) {
                result = i18n("Resource Templates");
            }
            return result;
        }
    });
    config.data.breadcrumbItems.push({
        id: "resourceTemplateLinkIfResourceHasTemplate",
        getHash: function() {
            return "resourceTemplate/"+appState.resource.resourceTemplate.id;
        },
        isUserData: true,
        getLabel: function() {
            var result;
            if (!!appState.resource.resourceTemplate) {
                result = entities.encode(appState.resource.resourceTemplate.name);
            }
            return result;
        }
    });

    config.data.breadcrumbItems.push({
        id: "resourceTemplates",
        getHash: function() {
            return "resources/resourceTemplates";
        },
        isUserData: false,
        getLabel: function() {
            return i18n("Resource Templates");
        }
    });

    config.data.breadcrumbItems.push({
        id: "resourceTemplate",
        getHash: function() {
            return "resourceTemplate/"+appState.resourceTemplate.id;
        },
        isUserData: true,
        getLabel: function() {
            return entities.encode(appState.resourceTemplate.name);
        }
    });

    config.data.breadcrumbItems.push({
        id: "resourceRoles",
        getHash: function() {
            return "resources/roles";
        },
        isUserData: false,
        getLabel: function() {
            return i18n("Roles");
        }
    });

    config.data.breadcrumbItems.push({
        id: "resourceRole",
        getHash: function() {
            return "resourceRole/"+appState.resourceRole.id;
        },
        isUserData: true,
        getLabel: function() {
            return entities.encode(appState.resourceRole.name);
        }
    });

    config.data.breadcrumbItems.push({
        id: "agent",
        getHash: function() {
            return "agent/"+appState.agent.id;
        },
        isUserData: true,
        getLabel: function() {
            return entities.encode(appState.agent.name);
        }
    });

    config.data.breadcrumbItems.push({
        id: "agents",
        getHash: function() {
            return "resources/agents";
        },
        isUserData: false,
        getLabel: function() {
            return i18n("Agents");
        }
    });

    config.data.breadcrumbItems.push({
        id: "relay",
        getHash: function() {
            return "relay/"+appState.relay.id;
        },
        isUserData: true,
        getLabel: function() {
            return entities.encode(appState.relay.name);
        }
    });

    config.data.breadcrumbItems.push({
        id: "relays",
        getHash: function() {
            return "resources/agentRelays";
        },
        isUserData: false,
        getLabel: function() {
            return i18n("Agent Relays");
        }
    });

    config.data.breadcrumbItems.push({
        id: "agentPool",
        getHash: function() {
            return "agentPool/"+appState.agentPool.id;
        },
        isUserData: true,
        getLabel: function() {
            return entities.encode(appState.agentPool.name);
        }
    });

    config.data.breadcrumbItems.push({
        id: "agentPools",
        getHash: function() {
            return "resources/agentPools";
        },
        isUserData: false,
        getLabel: function() {
            return i18n("Agent Pools");
        }
    });
});
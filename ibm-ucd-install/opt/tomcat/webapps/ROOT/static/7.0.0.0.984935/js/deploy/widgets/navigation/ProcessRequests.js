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
        "dojox/html/entities",
        "dojo/_base/array",
        "dojo/_base/url",
        "dojo/dom-construct",
        "dojo/topic",
        "dojo/hash",
        "deploy/util/ErrorUtil"],
function(dojo,
         entities,
         array,
         url,
         domConstruct,
         topic,
         hash,
         ErrorUtil) {
    dojo.provide("deploy.widgets.navigation.ProcessRequests");

    config.data.tabSets.push({
        id: "deploymentPreview",
        hashPattern: ["snapshot", "environment", "applicationProcess", "tab"],
        breadcrumbs: ["home", "topLevelTab", "application", "snapshot"],
        selectedTopLevelTab: "applications",

        getDetailTitle: function() {
            return i18n("Deployment Preview");
        },
        getDetailFields: function() {
            var detailProperties = [{
                label: i18n("Application"),
                value: "<a href=\"#application/"+appState.application.id+"\">"+entities.encode(appState.application.name)+"</a>"
            },{
                label: i18n("Snapshot"),
                value: "<a href=\"#snapshot/"+appState.snapshot.id+"\">"+entities.encode(appState.snapshot.name)+"</a>"
            },{
                label: i18n("Environment"),
                value: "<a href=\"#environment/"+appState.environment.id+"\">"+entities.encode(appState.environment.name)+"</a>"
            },{
                label: i18n("Process"),
                value: "<a href=\"#applicationProcess/"+appState.applicationProcess.id+"/-1\">"+entities.encode(appState.applicationProcess.name)+"</a>"
            }];
            return detailProperties;
        },

        stateCalls: [{
            targetAppStateEntry: "snapshot",
            getUrl: function(appStateTargets, newAppState) {
                return bootstrap.restUrl+"deploy/snapshot/"+appStateTargets.snapshot;
            },
            postGet: function(data, newAppState) {
                newAppState.application = data.application;
            },
            stateCalls: [{
                targetAppStateEntry: "applicationProcess",
                getUrl: function(appStateTargets, newAppState) {
                    return bootstrap.restUrl+"deploy/applicationProcess/"+appStateTargets.applicationProcess+"/-1";
                }
            }]
        },{
            targetAppStateEntry: "environment",
            getUrl: function(appStateTargets, newAppState) {
                return bootstrap.restUrl+"deploy/environment/"+appStateTargets.environment;
            }
        }],

        defaultTab: "summary",
        tabs: [{
            id: "summary",
            label: i18n("Summary"),
            view: "deploy/views/deploymentPreview/deploymentPreviewMain"
        },{
            id: "configuration",
            label: i18n("Configuration Changes"),
            view: "deploy/views/deploymentPreview/deploymentPreviewConfiguration"
        }]
    });

    config.data.tabSets.push({
        id: "componentProcessRequest",
        hashPattern: ["componentProcessRequest", "tab"],
        breadcrumbs: ["home", "topLevelTab", "component", "componentProcessRequest"],
        selectedTopLevelTab: "components",

        getDetailTitle: function() {
            return i18n("Deployment of Component: %s", entities.encode(appState.component.name));
        },
        getDetailFields: function() {
            var detailProperties = [];
            var parentRequestId = appState.componentProcessRequest.parentRequestId;
            if (parentRequestId) {
                var linkContainer = domConstruct.create("div");
                var componentRequestId = appState.componentProcessRequest.parentComponentProcessRequestId;
                var deploymentRequestId = appState.componentProcessRequest.deploymentRequestId;
                if (deploymentRequestId){
                    var deploymentRequest = domConstruct.create("a", {
                        className: "inline-block",
                        href: "#deploymentRequest/" + deploymentRequestId
                    }, linkContainer);
                    var deploymentRequestContainer = domConstruct.create("div", {}, deploymentRequest);
                    domConstruct.create("div", {
                        className: "inline-block general-icon origProcessIcon"
                    }, deploymentRequestContainer);
                    domConstruct.create("span", {
                        innerHTML: i18n("View Deployment Request")
                    }, deploymentRequestContainer);
                }

                var applicationRequest = domConstruct.create("a", {
                    className: "inline-block has-arrow",
                    href: "#applicationProcessRequest/" + parentRequestId
                }, linkContainer);
                var applicationRequestContainer = domConstruct.create("div", {}, applicationRequest);
                domConstruct.create("div", {
                    className: "inline-block general-icon origProcessIcon"
                }, applicationRequestContainer);
                domConstruct.create("span", {
                    innerHTML: i18n("View Application Process Execution")
                }, applicationRequestContainer);

                if (componentRequestId) {
                    var componentRequest = domConstruct.create("a", {
                        className: "inline-block has-arrow",
                        href: "#componentProcessRequest/" + componentRequestId
                    }, linkContainer);
                    var componentRequestContainer = domConstruct.create("div", {}, componentRequest);
                    domConstruct.create("div", {
                        className: "inline-block general-icon origProcessIcon"
                    }, componentRequestContainer);
                    domConstruct.create("span", {
                        innerHTML: i18n("View Component Process Execution")
                    }, componentRequestContainer);
                }
                var processRequest = domConstruct.create("a", {
                    className: "inline-block has-arrow no-link"
                }, linkContainer);
                var processRequestContainer = domConstruct.create("div", {}, processRequest);
                domConstruct.create("div", {
                    className: "inline-block blank-icon"
                }, processRequestContainer);
                domConstruct.create("span", {
                    innerHTML: i18n("Process Request")
                }, processRequestContainer);
                detailProperties.push({
                    label: "",
                    value: linkContainer,
                    containerClassName: "back-navigation-link",
                    placeBelow: true
                });
            }
            detailProperties.push({
                label: i18n("Process"),
                value: "<a href=\"#"+i18n("componentProcess")+"/"+appState.componentProcess.id+"/"+appState.componentProcess.version+"\">"+
                    i18n("%s (Version %s)", entities.encode(appState.componentProcess.name), appState.componentProcess.version)+"</a>"
            });

            if (appState.version !== undefined) {
                detailProperties.push({
                    label: i18n("Version"),
                    value: "<a href=\"#version/"+appState.version.id+"\">"+entities.encode(appState.version.name)+"</a>"
                });
            }

            detailProperties.push({
                label: i18n("Resource"),
                value: "<a href=\"#resource/"+appState.resource.id+"\">"+entities.encode(appState.resource.name)+"</a>"
            });
            if (appState.agent) {
                detailProperties.push({
                    label: i18n("Agent"),
                    value: "<a href=\"#agent/"+appState.agent.id+"\">"+entities.encode(appState.agent.name)+"</a>"
                });
            }
            detailProperties.push({
                label: i18n("Date"),
                value: util.dateFormatShort(appState.componentProcessRequest.submittedTime)
            });
            detailProperties.push({
                label: i18n("Requested By"),
                value: entities.encode(appState.componentProcessRequest.userName)
            });
            array.forEach(appState.componentProcessRequest.contextProperties, function(property) {
                if (property.name.indexOf("link:") === 0) {
                    var linkTitle = property.name.substring("link:".length);
                    var linkUrl = property.value;

                    // if link does not contain a scheme then we need to default to http
                    // otherwise the link we put into the page will resolve as a relative link
                    var scheme = (new url(linkUrl)).scheme;
                    if (!scheme) {
                        linkUrl = "http://" + linkUrl;
                    }

                    var linkDom = domConstruct.create("a", {
                        innerHTML: linkTitle.escape(),
                        href: linkUrl,
                        target: "_blank"
                    });
                    detailProperties.push({
                        value: linkDom
                    });
                }
            });

            return detailProperties;
        },

        stateCalls: [{
            targetAppStateEntry: "componentProcessRequest",
            getUrl: function(appStateTargets, newAppState) {
                return bootstrap.restUrl + "deploy/componentProcessRequest/" + appStateTargets.componentProcessRequest;
            },
            postGet: function(data, newAppState) {
                newAppState.component = data.component;
                newAppState.componentProcess = data.componentProcess;
                newAppState.application = data.application;
                newAppState.environment = data.environment;
                newAppState.resource = data.resource;
                newAppState.agent = data.agent;
                if (data.version) {
                    newAppState.version = data.version;
                }
            }
        }],

        defaultTab: "log",
        tabs: [{
            id: "log",
            label: i18n("Log"),
            view: "deploy/views/componentProcessRequest/executionLog"
        },{
            id: "properties",
            label: i18n("Properties"),
            view: "deploy/views/componentProcessRequest/requestProperties"
        }]
    });

    config.data.tabSets.push({
        id: "applicationProcessRequest",
        hashPattern: ["applicationProcessRequest", "tab"],
        breadcrumbs: ["home", "topLevelTab", "application", "applicationProcessRequest"],
        selectedTopLevelTab: "applications",

        getDetailTitle: function() {
            return i18n("Application Process Request: %s", entities.encode(appState.application.name));
        },
        getDetailFields: function() {
            var detailProperties = [];

            if (appState.applicationProcessRequest.deploymentRequestId) {
                var linkContainer = domConstruct.create("div");
                var deploymentRequest = domConstruct.create("a", {
                    className: "inline-block",
                    href: "#deploymentRequest/" + appState.applicationProcessRequest.deploymentRequestId
                }, linkContainer);
                var deploymentRequestContainer = domConstruct.create("div", {}, deploymentRequest);
                domConstruct.create("div", {
                    className: "inline-block general-icon origProcessIcon"
                }, deploymentRequestContainer);
                domConstruct.create("span", {
                    innerHTML: i18n("View Deployment Request")
                }, deploymentRequestContainer);
                var processRequest = domConstruct.create("a", {
                    className: "inline-block has-arrow no-link"
                }, linkContainer);
                var processRequestContainer = domConstruct.create("div", {}, processRequest);
                domConstruct.create("div", {
                    className: "inline-block blank-icon"
                }, processRequestContainer);
                domConstruct.create("span", {
                    innerHTML: i18n("Process Request")
                }, processRequestContainer);
                detailProperties.push({
                    label: "",
                    value: linkContainer,
                    containerClassName: "back-navigation-link",
                    placeBelow: true
                });
            }

            if (appState.snapshot) {
                detailProperties.push({
                    label: i18n("Snapshot"),
                    value: "<a href=\"#snapshot/"+appState.snapshot.id+"\">"+entities.encode(appState.snapshot.name)+"</a>"
                });
            }

            detailProperties.push({
                label: i18n("Process"),
                value: "<a href=\"#applicationProcess/"+appState.applicationProcess.id+"/"+appState.applicationProcess.version+"\">"+
                        i18n("%s (Version %s)", entities.encode(appState.applicationProcess.name), appState.applicationProcess.version)+"</a>"
            });

            detailProperties.push({
                label: i18n("Environment"),
                value: "<a href=\"#environment/"+appState.environment.id+"\">"+entities.encode(appState.environment.name)+"</a>"
            });

            detailProperties.push({
                label: i18n("Only Changed Versions"),
                value: entities.encode(appState.applicationProcessRequest.onlyChanged.toString())
            });

            detailProperties.push({
                label: i18n("Date Requested"),
                value: util.dateFormatShort(appState.applicationProcessRequest.submittedTime)
            });
            detailProperties.push({
                label: i18n("Requested By"),
                value: entities.encode(appState.applicationProcessRequest.userName)
            });

            if (appState.applicationProcessRequest.entry) {
                detailProperties.push({
                    label: i18n("Scheduled For"),
                    value: util.dateFormatShort(appState.applicationProcessRequest.entry.scheduledDate)
                });
            }

            array.forEach(appState.applicationProcessRequest.contextProperties, function(property) {
                if (property.name.indexOf("link:") === 0) {
                    var linkTitle = property.name.substring("link:".length);
                    var linkUrl = property.value;

                    // if link does not contain a scheme then we need to default to http
                    // otherwise the link we put into the page will resolve as a relative link
                    var scheme = (new url(linkUrl)).scheme;
                    if (!scheme) {
                        linkUrl = "http://" + linkUrl;
                    }

                    var linkDom = domConstruct.create("a", {
                        innerHTML: linkTitle.escape(),
                        href: linkUrl,
                        target: "_blank"
                    });
                    detailProperties.push({
                        value: linkDom
                    });
                }
            });

            return detailProperties;
        },
        getDetailDescription: function() {
            return entities.encode(appState.applicationProcessRequest.description);
        },

        stateCalls: [{
            targetAppStateEntry: "applicationProcessRequest",
            getUrl: function(appStateTargets, newAppState) {
                return bootstrap.restUrl + "deploy/applicationProcessRequest/" + appStateTargets.applicationProcessRequest;
            },
            postGet: function(data, newAppState) {
                newAppState.application = data.application;
                newAppState.applicationProcess = data.applicationProcess;
                newAppState.environment = data.environment;
                if (data.snapshot) {
                    newAppState.snapshot = data.snapshot;
                }
            }
        }],

        defaultTab: "log",
        tabs: [{
            id: "log",
            label: i18n("Log"),
            view: "deploy/views/applicationProcessRequest/executionLog"
        },{
            id: "properties",
            label: i18n("Properties"),
            view: "deploy/views/applicationProcessRequest/requestProperties"
        },{
            id: "manifest",
            label: i18n("Manifest"),
            view: "deploy/views/applicationProcessRequest/requestManifest"
        },{
            id: "configurationChanges",
            label: i18n("Configuration Changes"),
            view: "deploy/views/applicationProcessRequest/requestConfigurationChanges"
        },{
            id: "inventoryChanges",
            label: i18n("Inventory Changes"),
            view: "deploy/views/applicationProcessRequest/requestInventoryChanges"
        }]
    });

    topic.subscribe("navigationError", function(error){
        if (error.status === 404 &&
            navBar.lastNotFoundAppReqHash !== hash() &&
            error.response.url.indexOf(bootstrap.restUrl + "deploy/applicationProcessRequest/") === 0)
        {
            navBar.lastNotFoundAppReqHash = hash();
            ErrorUtil.showErrorDialog(
                i18n("Deployment history details were deleted"),
                i18n("No deployment history is available for this application process request, " +
                    "because daily cleanup removed all the details."));
        }
    });

    config.data.tabSets.push({
        id: "deploymentRequest",
        hashPattern: ["deploymentRequest", "tab"],
        breadcrumbs: ["home", "topLevelTab", "application", "deploymentRequest"],
        selectedTopLevelTab: "applications",

        getDetailTitle: function() {
            return i18n("Deployment Request: %s", entities.encode(appState.application.name));
        },
        getDetailFields: function() {
            var detailProperties = [];

            if (appState.snapshot) {
                detailProperties.push({
                    label: i18n("Snapshot"),
                    value: "<a href=\"#snapshot/"+appState.snapshot.id+"\">"+entities.encode(appState.snapshot.name)+"</a>"
                });
            }

            detailProperties.push({
                label: i18n("Process"),
                value: "<a href=\"#applicationProcess/"+appState.applicationProcess.id+"\">"+entities.encode(appState.applicationProcess.name)+"</a>"
            });

            detailProperties.push({
                label: i18n("Environment"),
                value: "<a href=\"#environment/"+appState.environment.id+"\">"+entities.encode(appState.environment.name)+"</a>"
            });

            detailProperties.push({
                label: i18n("Date"),
                value: util.dateFormatShort(appState.applicationProcessRequest.submittedTime)
            });
            detailProperties.push({
                label: i18n("Requested By"),
                value: entities.encode(appState.applicationProcessRequest.userName)
            });
            return detailProperties;
        },

        stateCalls: [{
            targetAppStateEntry: "deploymentRequest",
            getUrl: function(appStateTargets, newAppState) {
                return bootstrap.restUrl + "deploy/deploymentRequest/" + appStateTargets.deploymentRequest;
            },
            postGet: function(data, newAppState) {
                newAppState.applicationProcessRequest = data.rootRequest;
                newAppState.application = data.rootRequest.application;
                newAppState.applicationProcess = data.rootRequest.applicationProcess;
                newAppState.environment = data.rootRequest.environment;
                if (data.rootRequest.snapshot) {
                    newAppState.snapshot = data.rootRequest.snapshot;
                }
            }
        }],

        defaultTab: "main",
        tabs: [{
            id: "main",
            label: i18n("Main"),
            view: "deploy/views/deploymentRequest/deploymentRequestMain"
        },{
            id: "properties",
            label: i18n("Properties"),
            view: "deploy/views/applicationProcessRequest/requestProperties"
        },{
            id: "manifest",
            label: i18n("Manifest"),
            view: "deploy/views/deploymentRequest/deploymentManifest"
        }]
    });


    config.data.breadcrumbItems.push({
        id: "deploymentRequest",
        getHash: function() {
            return "deploymentRequest/"+appState.deploymentRequest.id;
        },
        isUserData: false,
        getLabel: function() {
            return i18n("Deployment Request");
        }
    });

    config.data.breadcrumbItems.push({
        id: "applicationProcessRequest",
        getHash: function() {
            return "applicationProcessRequest/"+appState.applicationProcessRequest.id;
        },
        isUserData: false,
        getLabel: function() {
            return i18n("Process Request");
        }
    });

    config.data.breadcrumbItems.push({
        id: "componentProcessRequest",
        getHash: function() {
            return "componentProcessRequest/"+appState.componentProcessRequest.id;
        },
        isUserData: false,
        getLabel: function() {
            return i18n("Process Request on %s", entities.encode(appState.resource.name));
        }
    });
});

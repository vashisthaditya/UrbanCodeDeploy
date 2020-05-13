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
/*global security */
define(["dojo/_base/kernel",
        "dojox/html/entities"],
function(dojo,
         entities) {
    dojo.provide("deploy.widgets.navigation.Processes");

    config.data.tabSets.push({
        id: "process",
        hashPattern: ["process", "processVersion", "tab", "navData"],
        breadcrumbs: ["home", "topLevelTab", "process"],
        selectedTopLevelTab: "processes",

        // details moved into editor

        stateCalls: [{
            targetAppStateEntry: "process",
            getUrl: function(appStateTargets, newAppState) {
                newAppState.processVersion = {
                    id: appStateTargets.processVersion
                };

                return bootstrap.restUrl+"process/"+appStateTargets.process+"/"+appStateTargets.processVersion;
            }
        },{
            getUrl: function(appStateTargets, newAppState) {
                newAppState.goBack = {
                    id: appStateTargets.navData
                };
            }

         }],


        defaultTab: "dashboard",
        tabs: [{
            id: "dashboard",
            label: i18n("Dashboard"),
            view: "deploy/views/process/processDashboard"
        },{
            id: "design",
            label: i18n("Design"),
            view: "deploy/views/process/processActivities"
        },{
            id: "configuration",
            label: i18n("Configuration"),
            className: "configurationTab",
            view: "deploy/views/process/processConfiguration"
        },{
            id: "changelog",
            label: i18n("Changelog"),
            view: "deploy/views/process/processChangelog"
        }]
    });

    require(["dojo/_base/array", "dojo/_base/url", "dojo/dom-construct"],
        function(array, url, domConstruct) {
            config.data.tabSets.push({
                id: "processRequest",
                hashPattern: ["processRequest", "tab"],
                breadcrumbs: ["home", "topLevelTab", "process", "processRequest"],
                selectedTopLevelTab: "processes",

                getDetailTitle: function() {
                    return i18n("Execution of %s", entities.encode(appState.process.name));
                },
                getDetailFields: function() {
                    var detailProperties = [];

                    detailProperties.push({
                        label: i18n("Date"),
                        value: util.dateFormatShort(appState.processRequest.submittedTime)
                    });
                    detailProperties.push({
                        label: i18n("Requested By"),
                        value: entities.encode(appState.processRequest.userName)
                    });

                    var parentRequestId = util.getNamedPropertyValue(appState.processRequest.contextProperties,
                            "parentRequestId");
                    if (parentRequestId) {
                        detailProperties.push({
                            label: "",
                            value: "<a href=\"#processRequest/"+parentRequestId+"\">"+i18n("View Parent Request")+"</a>"
                        });
                    }

                    array.forEach(appState.processRequest.contextProperties, function(property) {
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
                    targetAppStateEntry: "processRequest",
                    getUrl: function(appStateTargets, newAppState) {
                        return bootstrap.restUrl + "process/request/" + appStateTargets.processRequest;
                    },
                    postGet: function(data, newAppState) {
                        newAppState.process = data.process;
                    }
                }],

                defaultTab: "log",
                tabs: [{
                    id: "log",
                    label: i18n("Log"),
                    view: "deploy/views/process/request/executionLog"
                },{
                    id: "properties",
                    label: i18n("Properties"),
                    view: "deploy/views/process/request/requestProperties"
                }]
            });
        }
    );


    config.data.breadcrumbItems.push({
        id: "process",
        getHash: function() {
            return "process/"+appState.process.id+"/"+appState.process.version;
        },
        isUserData: true,
        getLabel: function() {
            return entities.encode(appState.process.name);
        }
    });

    config.data.breadcrumbItems.push({
        id: "processRequest",
        getHash: function() {
            return "processRequest/"+appState.process.id;
        },
        isUserData: false,
        getLabel: function() {
            return i18n("Process Request");
        }
    });
});
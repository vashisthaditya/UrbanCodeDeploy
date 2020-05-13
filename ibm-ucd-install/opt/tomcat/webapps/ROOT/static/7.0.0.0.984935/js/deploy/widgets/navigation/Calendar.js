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
    dojo.provide("deploy.widgets.navigation.Calendar");

    config.data.tabSets.push({
        id: "calendarEntry",
        hashPattern: ["calendarEntry", "tab"],
        breadcrumbs: ["home", "topLevelTab", "application"],
        selectedTopLevelTab: "calendar",
        
        getDetailTitle: function() {
            return i18n("Scheduled Deployment Record");
        },
        getDetailFields: function() {
            var detailProperties = [{
                label: i18n("Application"),
                value: "<a href=\"#application/"+appState.application.id+"\">"+entities.encode(appState.application.name)+"</a>"
            },{
                label: i18n("Process"),
                value: "<a href=\"#applicationProcess/"+appState.applicationProcess.id+"\">"+entities.encode(appState.applicationProcess.name)+"</a>"
            }];
            
            if (appState.snapshot) {
                detailProperties.push({
                    label: i18n("Snapshot"),
                    value: "<a href=\"#snapshot/"+appState.snapshot.id+"\">"+entities.encode(appState.snapshot.name)+"</a>"
                });
            }
            
            detailProperties.push({
                label: i18n("Environment"),
                value: "<a href=\"#environment/"+appState.environment.id+"\">"+entities.encode(appState.environment.name)+"</a>"
            });
            detailProperties.push({
                label: i18n("Scheduled For"),
                value: util.dateFormatShort(appState.calendarEntry.scheduledDate)
            });
            return detailProperties;
        },
    
        stateCalls: [{
            targetAppStateEntry: "calendarEntry",
            getUrl: function(appStateTargets, newAppState) {
                return bootstrap.restUrl+"calendar/entry/"+appStateTargets.calendarEntry;
            },
            postGet: function(data, newAppState) {
                newAppState.application = data.application;
                newAppState.applicationProcess = data.applicationProcess;
                newAppState.snapshot = data.snapshot;
                newAppState.environment = data.environment;
            }
        }],
    
        defaultTab: "main",
        tabs: [{
            id: "main",
            label: i18n("Main"),
            view: "deploy/views/calendar/calendarEntryMain"
        },{
            id: "edit",
            label: i18n("Edit"),
            view: "deploy/views/calendar/editEntry"
        }]
    });
});

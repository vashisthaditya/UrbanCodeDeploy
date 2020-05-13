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
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/on",
        "dojo/dom-construct",
        "js/webext/widgets/TwoPaneListManager",
        "deploy/widgets/componentProcess/EditComponentProcess",
        "deploy/widgets/property/PropDefs"
        ],
function(
        array,
        declare,
        xhr,
        on,
        domConstruct,
        TwoPaneListManager,
        EditComponentProcess,
        PropDefs
) {
    /**
     *
     */
    return declare([TwoPaneListManager], {
        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            this.showList();
            if (appState.goBack.id !== undefined) {
                self.selectEntryById(appState.goBack.id);
            }
        },
        
        /**
         * 
         */
        showList: function(selectedId) {
            var self = this;

            self.addEntry({
                id: "basic",
                label: i18n("Basic Settings"),
                action: function() {
                    self.addHeading(i18n("Basic Settings"));
                    self.showBasicSettings();
                }
            });
            
            self.addEntry({
                id: "properties",
                label: i18n("Component Process Properties"),
                action: function() {
                    self.addHeading(i18n("Component Process Properties"));
                    self.showProperties();
                }
            });
        },
        
        addHeading: function(heading) {
            domConstruct.create("div", {
                innerHTML: heading,
                "class": "containerLabel"
            }, this.detailAttach);
        },
        
        addDescription: function(description) {
            domConstruct.create("div", {
                innerHTML: description,
                style: {
                    marginBottom: "10px"
                }
            }, this.detailAttach);
        },
        
        showBasicSettings: function() {
            var readOnly = true;
            if (appState.component) {
                readOnly = (!appState.component.security["Manage Processes"] || appState.componentProcess.version !== appState.componentProcess.versionCount);
            }
            else if (appState.componentTemplate) {
                readOnly = (!appState.componentTemplate.security["Manage Processes"] || appState.componentProcess.version !== appState.componentProcess.versionCount);
            }
            var editComponentProcess = new EditComponentProcess({
                showCancel: false,
                readOnly: readOnly,
                isDraft: this.isDraft && config.data.systemConfiguration.safeEditFeatureEnabled,
                component: appState.component,
                componentTemplate: appState.componentTemplate,
                componentProcess: appState.componentProcess
            });
            editComponentProcess.placeAt(this.detailAttach);
        },
        
        showProperties: function() {
            var self = this;
            
            var readOnly = true;
            if (appState.component) {
                readOnly = (!appState.component.security["Manage Processes"] || appState.componentProcess.version !== appState.componentProcess.versionCount);
            }
            else if (appState.componentTemplate) {
                readOnly = (!appState.componentTemplate.security["Manage Processes"] || appState.componentProcess.version !== appState.componentProcess.versionCount);
            }

            if (!readOnly) {
                readOnly = !this.isDraft && config.data.systemConfiguration.safeEditFeatureEnabled;
            }

            var propDefs = new PropDefs({
                getUrl: bootstrap.restUrl+"deploy/componentProcess/"+appState.componentProcess.id+"/"+appState.componentProcess.version+"/propDefs",
                deleteUrl: bootstrap.restUrl+"deploy/componentProcess/"+appState.componentProcess.id+"/deletePropDef/{propertyName}",
                saveUrl: bootstrap.restUrl+"deploy/componentProcess/"+appState.componentProcess.id+"/savePropDef",
                "readOnly" :readOnly,
                refreshHash: "componentProcess/" + appState.componentProcess.id + "/-1/configuration/properties",
                propSheetDef: appState.componentProcess.propSheetDef,
                deleteHeaders: {
                    componentProcessVersion: appState.componentProcess.version                
                },
                addData: function(data) {
                    data.componentProcessVersion = appState.componentProcess.version;
                }
            });
            propDefs.placeAt(self.detailAttach);
        }
    });
});
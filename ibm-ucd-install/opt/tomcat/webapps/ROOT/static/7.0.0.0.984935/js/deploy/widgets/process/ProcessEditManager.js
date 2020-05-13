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
        "deploy/widgets/process/EditProcess",
        "deploy/widgets/property/PropDefs"
        ],
function(
        array,
        declare,
        xhr,
        on,
        domConstruct,
        TwoPaneListManager,
        EditProcess,
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
                label: i18n("Process Properties"),
                action: function() {
                    self.addHeading(i18n("Process Properties"));
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
            var editProcess = new EditProcess({
                process: appState.process,
                readOnly: !appState.process.security["Edit Basic Settings"]
            });
            editProcess.placeAt(this.detailAttach);
        },
        
        showProperties: function() {
            var self = this;
            
            var propDefs = new PropDefs({
                readOnly: !appState.process.security["Manage Properties"] || appState.process.version !== appState.process.versionCount,
                getUrl: bootstrap.restUrl+"process/"+appState.process.id+"/"+appState.process.version+"/propDefs",
                deleteUrl: bootstrap.restUrl+"process/"+appState.process.id+"/propDefs/{propertyName}",
                saveUrl: bootstrap.restUrl+"process/"+appState.process.id+"/propDefs",
                refreshHash: "process/" + appState.process.id + "/-1/configuration/properties",
                propSheetDef: appState.process.propSheetDef,
                deleteHeaders: {
                    processVersion: appState.process.version
                },
                addData: function(data) {
                    data.processVersion = appState.process.version;
                }
            });
            propDefs.placeAt(self.detailAttach);
        }
    });
});
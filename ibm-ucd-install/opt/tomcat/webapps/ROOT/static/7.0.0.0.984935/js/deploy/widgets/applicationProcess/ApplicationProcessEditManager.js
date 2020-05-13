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
        "deploy/widgets/applicationProcess/EditApplicationProcess",
        "deploy/widgets/property/PropDefs"
        ],
function(
        array,
        declare,
        xhr,
        on,
        domConstruct,
        TwoPaneListManager,
        EditApplicationProcess,
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
                label: i18n("Application Process Properties"),
                action: function() {
                    self.addHeading(i18n("Application Process Properties"));
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
            var self = this;
            var editApplicationProcess = new EditApplicationProcess({
                showCancel: false,
                readOnly: (!self.hasManageProcessesPermission() || !self.hasLatestVersion()),
                application: appState.application,
                applicationTemplate: self.applicationTemplate,
                applicationProcess: appState.applicationProcess
            });
            editApplicationProcess.placeAt(this.detailAttach);
        },

        showProperties: function() {
            var self = this;

            var propDefs = new PropDefs({
                getUrl: bootstrap.restUrl+"deploy/applicationProcess/"+appState.applicationProcess.id+"/"+appState.applicationProcess.version+"/propDefs",
                deleteUrl: bootstrap.restUrl+"deploy/applicationProcess/"+appState.applicationProcess.id+"/deletePropDef/{propertyName}",
                saveUrl: bootstrap.restUrl+"deploy/applicationProcess/"+appState.applicationProcess.id+"/savePropDef",
                readOnly: (!self.hasManageProcessesPermission() || !self.hasLatestVersion()),
                refreshHash: "applicationProcess/" + appState.applicationProcess.id + "/-1/configuration/properties",
                propSheetDef: appState.applicationProcess.propSheetDef,
                deleteHeaders: {
                    applicationProcessVersion: appState.applicationProcess.version
                },
                addData: function(data) {
                    data.applicationProcessVersion = appState.applicationProcess.version;
                }
            });
            propDefs.placeAt(self.detailAttach);
        },

        hasManageProcessesPermission: function() {
            var self = this;
            var result = false;

            if (self.application) {
                result = self.application.security["Manage Processes"];
            }
            else if (self.applicationTemplate) {
                result = self.applicationTemplate.security["Manage Processes"];
            }
            return result;
        },

        hasLatestVersion: function() {
            return appState.applicationProcess.version === appState.applicationProcess.versionCount;
        }
    });
});
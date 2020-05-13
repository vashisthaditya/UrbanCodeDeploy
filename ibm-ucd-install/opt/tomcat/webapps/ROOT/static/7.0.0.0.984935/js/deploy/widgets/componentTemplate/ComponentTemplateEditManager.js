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
        "deploy/widgets/componentTemplate/EditComponentTemplate",
        "deploy/widgets/property/PropValues",
        "deploy/widgets/property/PropDefs"
        ],
function(
        array,
        declare,
        xhr,
        on,
        domConstruct,
        TwoPaneListManager,
        EditComponentTemplate,
        PropValues,
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
                label: i18n("Properties"),
                action: function() {
                    self.addHeading(i18n("Properties"));
                    self.showProperties();
                }
            });
            

            self.addEntry({
                id: "componentProperties",
                label: i18n("Component Property Definitions"),
                action: function() {
                    self.addHeading(i18n("Component Property Definitions"));
                    self.showComponentProperties();
                }
            });

            self.addEntry({
                id: "environmentProperties",
                label: i18n("Environment Property Definitions"),
                action: function() {
                    self.addHeading(i18n("Environment Property Definitions"));
                    self.showEnvironmentProperties();
                }
            });

            self.addEntry({
                id: "resourceProperties",
                label: i18n("Resource Property Definitions"),
                action: function() {
                    self.addHeading(i18n("Resource Property Definitions"));
                    self.showResourceProperties();
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
            var editComponentTemplate = new EditComponentTemplate({
                showCancel: false,
                componentTemplate: appState.componentTemplate,
                readOnly: !appState.componentTemplate.security.write
            });
            editComponentTemplate.placeAt(this.detailAttach);
        },
        
        showProperties: function() {
            var self = this;
            var isMaxVersion = appState.componentTemplate.version !== appState.componentTemplate.versionCount;

            this.addDescription(i18n("Set custom properties here. These will be available as standard component properties to any component using this template."));

            var propValues = new PropValues({
                propValues: appState.componentTemplate.propValues,
                propSheetPath: "componentTemplates/" + appState.componentTemplate.id + "/propSheet",
                refreshHash: "componentTemplate/" + appState.componentTemplate.id + "/-1/configuration/properties",
                readOnly: !appState.componentTemplate.security["Manage Properties"] || isMaxVersion,
                headers: {
                    componentTemplateVersion: appState.componentTemplate.version
                }
            });
            propValues.placeAt(self.detailAttach);
        },
        
        showEnvironmentProperties: function() {
            var self = this;
            var propName = "envPropDefs";
            var message = i18n("Define properties here to be given values on each environment the component is used in.");
            var propSheetDefPath = "componentTemplates/" + appState.componentTemplate.id + "/envPropSheetDef";
            var refreshHash = "componentTemplate/" + appState.componentTemplate.id + "/-1/configuration/environmentProperties";
            var attachPoint = self.detailAttach;
            self._showPropSheetDefTable(propName, message, propSheetDefPath, refreshHash, attachPoint);
        },

        showResourceProperties: function() {
            var self = this;
            var propName = "resPropDefs";
            var message = i18n("Define properties here to be given values on each component resource.");
            var propSheetDefPath = "componentTemplates/" + appState.componentTemplate.id + "/resPropSheetDef";
            var refreshHash = "componentTemplate/" + appState.componentTemplate.id + "/-1/configuration/resourceProperties";
            var attachPoint = self.detailAttach;
            self._showPropSheetDefTable(propName, message, propSheetDefPath, refreshHash, attachPoint);
        },
        
        _showPropSheetDefTable: function(propDefsPropName, message, propSheetDefPath, refreshHashLoc, attachPoint) {
            var isMaxVersion = appState.componentTemplate.version !== appState.componentTemplate.versionCount;
            var propDefs = null;
            var curPropSheetDefPath = null;

            if (isMaxVersion) {
                // This has all propDefs related to current template version
                propDefs = appState.componentTemplate[propDefsPropName];
            }
            else {
                // This will always pass back the most recent information. If this value is not set
                // then we cannot save new propDefs. Although we only care about that for the newest version.
                curPropSheetDefPath = propSheetDefPath;
            }
            
            this.addDescription(message);
            var envPropDefs = new PropDefs({
                propDefs: propDefs,
                propSheetDefPath: propSheetDefPath,
                readOnly: !appState.componentTemplate.security["Manage Properties"] || isMaxVersion,
                refreshHash: refreshHashLoc,
                headers: {
                    componentTemplateVersion: appState.componentTemplate.version
                }
            });
            envPropDefs.placeAt(attachPoint);
        },

        showComponentProperties: function() {
            var self = this;
            var isMaxVersion = appState.componentTemplate.version !== appState.componentTemplate.versionCount;
            var propDefValues = null;
            var propSheetDefPath = null;

            if (isMaxVersion) {
                // This has all propDefs related to current template version
                propDefValues = appState.componentTemplate.propDefs;
            }
            else {
                // This will always pass back the most recent information. If this value is not set
                // then we cannot save new propDefs. Although we only care about that for the newest version.
                propSheetDefPath = "componentTemplates/" + appState.componentTemplate.id + "/propSheetDef";
            }

            this.addDescription(i18n("Define properties here to be given values on each component using this template."));

            var propDefs = new PropDefs({
                propDefs: propDefValues,
                propSheetDefPath: propSheetDefPath,
                readOnly: !appState.componentTemplate.security["Manage Properties"] || isMaxVersion,
                refreshHash: "componentTemplate/" + appState.componentTemplate.id + "/-1/configuration/componentProperties",
                headers: {
                    componentTemplateVersion: appState.componentTemplate.version
                }
            });
            propDefs.placeAt(self.detailAttach);
        }
    });
});
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
        "dojo/on",
        "dojo/dom-construct",
        "js/webext/widgets/TwoPaneListManager",
        "deploy/widgets/application/ApplicationEnvironmentConditions",
        "deploy/widgets/applicationTemplate/EditApplicationTemplate",
        "deploy/widgets/property/PropDefs"
        ],
function(
        array,
        declare,
        on,
        domConstruct,
        TwoPaneListManager,
        ApplicationEnvironmentConditions,
        EditApplicationTemplate,
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
                label: i18n("Application Property Definitions"),
                action: function() {
                    self.addHeading(i18n("Application Property Definitions"));
                    self.showProperties();
                }
            });

            self.addEntry({
                id: "gates",
                label: i18n("Environment Gates"),
                action: function() {
                    self.addHeading(i18n("Environment Gates"));
                    self.showGates();
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
            var editApplicationTemplate = new EditApplicationTemplate({
                showCancel: false,
                applicationTemplate: self.applicationTemplate,
                readOnly: !self.applicationTemplate.security["Edit Basic Settings"] || !self.isMaxVersion()
            });
            editApplicationTemplate.placeAt(this.detailAttach);
        },

        showProperties: function() {
            var self = this;
            var isMaxVersion = self.isMaxVersion();
            var propDefValues = null;
            var propSheetDefPath = null;

            if (!isMaxVersion) {
                // This has all propDefs related to current template version
                propDefValues = self.applicationTemplate.propDefs;
            }
            else {
                // This will always pass back the most recent information. If this value is set
                // then we cannot save new propDefs. Although we only care about that for the newest version.
                propSheetDefPath = "applicationTemplates/" + self.applicationTemplate.id + "/propSheetDef";
            }

            this.addDescription(i18n("Define properties here to be given values on each application using this template."));

            var propDefs = new PropDefs({
                propDefs: propDefValues,
                propSheetDefPath: propSheetDefPath,
                readOnly: !self.applicationTemplate.security["Manage Properties"] || !isMaxVersion,
                refreshHash: "applicationTemplate/" + self.applicationTemplate.id + "/-1/configuration/properties",
                headers: {
                    applicationTemplateVersion: self.applicationTemplate.version
                }
            });
            propDefs.placeAt(self.detailAttach);
        },

        showGates: function() {
            var gates = new ApplicationEnvironmentConditions({
                applicationTemplate: appState.applicationTemplate
            });
            gates.placeAt(this.detailAttach);
        },

        /**
         * Helper to decide if we're at the most recent version.
         */
        isMaxVersion: function() {
            return this.applicationTemplate.version === this.applicationTemplate.versionCount;
        }
    });
});

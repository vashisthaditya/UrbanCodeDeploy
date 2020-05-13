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
        "deploy/widgets/environmentTemplate/EditEnvironmentTemplate",
        "deploy/widgets/property/PropDefs"
        ],
function(
        array,
        declare,
        on,
        domConstruct,
        TwoPaneListManager,
        EditEnvironmentTemplate,
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
                label: i18n("Environment Properties"),
                action: function() {
                    self.addHeading(i18n("Environment Properties"));
                    self.showProperties();
                }
            });
        },

        /**
         *
         */
        addHeading: function(heading) {
            domConstruct.create("div", {
                innerHTML: heading,
                "class": "containerLabel"
            }, this.detailAttach);
        },

        /**
         *
         */
        addDescription: function(description) {
            domConstruct.create("div", {
                innerHTML: description,
                style: {
                    marginBottom: "10px"
                }
            }, this.detailAttach);
        },

        /**
         *
         */
        showBasicSettings: function() {
            var self = this;
            var editEnvironmentTemplate = new EditEnvironmentTemplate({
                environmentTemplate: appState.environmentTemplate,
                applicationTemplate: appState.applicationTemplate,
                readOnly: !appState.environmentTemplate.security["Edit Basic Settings"] || !self.isMaxVersion(),
                callback: function() {
                    navBar.setHash("#environmentTemplate/" + appState.environmentTemplate.id + "/-1", false, true);
                }
            });
            editEnvironmentTemplate.placeAt(this.detailAttach);
        },

        /**
         *
         */
        showProperties: function() {
            var self = this;
            var isMaxVersion = self.isMaxVersion();
            var propDefValues = null;
            var propSheetDefPath = null;

            if (!isMaxVersion) {
                // This has all propDefs related to current template version
                propDefValues = appState.environmentTemplate.propDefs;
            }
            else {
                // This will always pass back the most recent information. If this value is not set
                // then we cannot save new propDefs. Although we only care about that for the newest version.
                propSheetDefPath = "applicationTemplates/" + appState.applicationTemplate.id
                        + "/environmentTemplates/" + appState.environmentTemplate.id + "/propSheetDef";
            }

            this.addDescription(i18n("Define properties here to be given values on each environment using this template."));

            var propDefs = new PropDefs({
                propDefs: propDefValues,
                propSheetDefPath: propSheetDefPath,
                readOnly: !appState.environmentTemplate.security["Manage Properties"] || !isMaxVersion,
                refreshHash: "environmentTemplate/" + appState.environmentTemplate.id + "/-1/configuration/properties",
                headers: {
                    environmentTemplateVersion: appState.environmentTemplate.version
                }
            });
            propDefs.placeAt(self.detailAttach);
        },

        isMaxVersion: function() {
            return appState.environmentTemplate.version === appState.environmentTemplate.versionCount;
        }
    });
});
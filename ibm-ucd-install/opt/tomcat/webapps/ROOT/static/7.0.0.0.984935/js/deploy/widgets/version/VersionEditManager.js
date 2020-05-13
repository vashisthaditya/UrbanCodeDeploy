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
        "js/webext/widgets/Alert",
        "js/webext/widgets/TwoPaneListManager",
        "deploy/widgets/version/EditVersion",
        "deploy/widgets/property/PropSheetDefValues"
        ],
function(
        array,
        declare,
        on,
        domConstruct,
        Alert,
        TwoPaneListManager,
        EditVersion,
        PropSheetDefValues
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
                label: i18n("Version Properties"),
                action: function() {
                    self.addHeading(i18n("Version Properties"));
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
            var editVersion = new EditVersion({
                component: appState.component,
                version: appState.version,
                readOnly: !appState.component.extendedSecurity[security.component.manageVersions],
                callback: function() {
                    if (appState.component) {
                        navBar.setHash("component/"+appState.component.id+"/versions");
                    }
                }
            });
            editVersion.placeAt(this.detailAttach);
        },

        showProperties: function() {
            var self = this;

            var componentPropSheet = util.getNamedProperty(appState.version.propSheets, undefined);
            var componentPropSheetForm = new PropSheetDefValues({
                propSheetDefPath: componentPropSheet.propSheetDef.path,
                propSheetDefVersion: componentPropSheet.propSheetDef.version,
                propSheetPath: componentPropSheet.path,
                noPropertiesMessage: i18n("No version properties have been defined by this component."),
                readOnly: !appState.component.extendedSecurity[security.component.manageVersions],
                onError: function(response) {
                    var message = i18n("An error occurred while saving the properties.");
                    if (response.status === 409) {
                        message = i18n("Modifications have occured since you loaded this page, please refresh.");
                    }
                    else if (response.status === 500) {
                        message = i18n(response.response.text);
                    }
                    var alert = new Alert({
                        message: message
                    });
                }
            });
            componentPropSheetForm.placeAt(self.detailAttach);
        }
    });
});

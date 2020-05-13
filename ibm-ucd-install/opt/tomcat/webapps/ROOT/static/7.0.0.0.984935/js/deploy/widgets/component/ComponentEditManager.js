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
        "deploy/widgets/component/EditComponent",
        "deploy/widgets/property/PropValues",
        "deploy/widgets/property/PropDefs",
        "deploy/widgets/component/ComponentConfigTemplates",
        "deploy/widgets/component/ComponentImportFailureIcon",
        "deploy/widgets/component/ComponentSourceConfigHistory"
        ],
function(
        array,
        declare,
        xhr,
        on,
        domConstruct,
        TwoPaneListManager,
        EditComponent,
        PropValues,
        PropDefs,
        ComponentConfigTemplates,
        ComponentImportFailureIcon,
        ComponentSourceConfigHistory
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
                id: "componentProperties",
                label: i18n("Component Properties"),
                action: function() {
                    self.addHeading(i18n("Component Properties"));
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

            self.addEntry({
                id: "versionProperties",
                label: i18n("Version Property Definitions"),
                action: function() {
                    self.addHeading(i18n("Version Property Definitions"));
                    self.showVersionProperties();
                }
            });

            self.addEntry({
                id: "configTemplates",
                label: i18n("Configuration File Templates"),
                action: function() {
                    self.addHeading(i18n("Configuration File Templates"));
                    self.showConfigTemplates();
                }
            });

            self.addEntry({
                id: "versionImportHistory",
                domNode: self.formatVersionImportHistory(),
                action: function() {
                    self.addHeading(i18n("Version Import History"));
                    self.showVersionImportHistory();
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
            var editComponent = new EditComponent({
                showCancel:false,
                component: appState.component,
                readOnly: !appState.component.security["Edit Basic Settings"]
            });
            editComponent.placeAt(this.detailAttach);
        },

        showComponentProperties: function() {
            var self = this;

            xhr.get({
                url: bootstrap.restUrl+"deploy/component/"+appState.component.id,
                handleAs: "json",
                load: function(component) {
                    var propValues = new PropValues({
                        propSheet: component.propSheet,
                        readOnly: !component.security["Manage Properties"]
                    });
                    propValues.placeAt(self.detailAttach);
                }
            });
        },

        showEnvironmentProperties: function() {
            var self = this;

            this.addDescription(i18n("Define properties here to be given values on each environment the component is used in."));

            xhr.get({
                url: bootstrap.restUrl+"deploy/component/"+appState.component.id,
                handleAs: "json",
                load: function(component) {
                    var environmentPropDefs = new PropDefs({
                        propSheetDef: component.environmentPropSheetDef,
                        readOnly: !component.security["Manage Properties"]
                    });
                    environmentPropDefs.placeAt(self.detailAttach);
                }
            });
        },

        showResourceProperties: function() {
            var self = this;

            this.addDescription(i18n("Define properties here to be given values on any resource this component will be deployed to."));

            xhr.get({
                url: bootstrap.restUrl+"deploy/component/"+appState.component.id,
                handleAs: "json",
                load: function(component) {
                    var propDefs = new PropDefs({
                        propSheetDefId: component.resourceRole.propSheetDef.id,
                        propSheetDef: component.resourceRole.propSheetDef,
                        readOnly: !component.security["Manage Properties"]
                    });
                    propDefs.placeAt(self.detailAttach);
                }
            });
        },

        showVersionProperties: function() {
            var self = this;

            this.addDescription(i18n("Define properties here to be given values on each of the component's versions."));

            xhr.get({
                url: bootstrap.restUrl+"deploy/component/"+appState.component.id,
                handleAs: "json",
                load: function(component) {
                    var versionPropDefs = new PropDefs({
                        propSheetDef: component.versionPropSheetDef,
                        readOnly: !component.security["Manage Properties"]
                    });
                    versionPropDefs.placeAt(self.detailAttach);
                }
            });
        },

        showConfigTemplates: function() {
            this.addDescription(i18n("Configuration file templates can be used to store template configuration files to be written and token-replaced during deployments."));

            var configTemplates = new ComponentConfigTemplates({
                component: appState.component
            });
            configTemplates.placeAt(this.detailAttach);
        },

        showVersionImportHistory: function() {
            var componentSourceConfigHistory = new ComponentSourceConfigHistory();
            componentSourceConfigHistory.placeAt(this.detailAttach);
        },

        formatVersionImportHistory: function () {
            var result = domConstruct.create("div", {
                innerHTML: i18n("Version Import History")
            });
            if (appState.component.integrationFailed) {
                var importFailureIcon = new ComponentImportFailureIcon({
                    label: i18n("A version import failed. Check here for more details or use the Actions menu on the Components page to dismiss this error.")
                });

                domConstruct.place(importFailureIcon.domNode, result);
            }
            return result;
        }
    });
});
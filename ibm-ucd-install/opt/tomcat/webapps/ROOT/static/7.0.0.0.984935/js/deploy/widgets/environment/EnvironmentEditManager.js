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
        "deploy/widgets/environment/EditEnvironment",
        "deploy/widgets/property/PropValues",
        "deploy/widgets/environment/EnvironmentComponentProperties"
        ],
function(
        array,
        declare,
        on,
        domConstruct,
        TwoPaneListManager,
        EditEnvironment,
        PropValues,
        EnvironmentComponentProperties
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
                label: i18n("Environment Properties"),
                action: function() {
                    self.addHeading(i18n("Environment Properties"));
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
            var editEnvironment = new EditEnvironment({
                showCancel: false,
                environment: appState.environment,
                application: appState.application,
                readOnly: !appState.environment.security["Edit Basic Settings"],
                callback: function() {
                    navBar.setHash("#environment/"+appState.environment.id, false, true);
                }
            });
            editEnvironment.placeAt(this.detailAttach);
        },
        
        showProperties: function() {
            var self = this;

            var propValues = new PropValues({
                propSheet: appState.environment.propSheet,
                readOnly: !appState.environment.security["Manage Properties"]
            });
            propValues.placeAt(self.detailAttach);
            self.addHeading(i18n("Component Environment Properties"));
            var environmentComponentProperties = new EnvironmentComponentProperties({
                environment: appState.environment
            });
            environmentComponentProperties.placeAt(self.detailAttach);
        }
    });
});
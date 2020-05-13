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
        "deploy/widgets/resource/EditResource",
        "deploy/widgets/property/PropDefs",
        "deploy/widgets/property/PropValues"
        ],
function(
        array,
        declare,
        on,
        domConstruct,
        TwoPaneListManager,
        EditResource,
        PropDefs,
        PropValues
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
                label: i18n("Resource Properties"),
                action: function() {
                    self.addHeading(i18n("Resource Properties"));
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
            var editResource = new EditResource({
                showCancel: false,
                resource: appState.resource,
                readOnly: !appState.resource.security["Edit Basic Settings"]
            });
            editResource.placeAt(this.detailAttach);
        },
        
        showProperties: function() {
            var self = this;
            
            if (appState.resource.propSheetDef) {
                var propDefs = new PropDefs({
                    propSheetDef: appState.resource.propSheetDef,
                    readOnly: !appState.resource.security["Manage Properties"],
                    onlyValueChange: true
                });
                propDefs.placeAt(self.detailAttach);
            }
            else {
                var propValues = new PropValues({
                    propSheet: appState.resource.propSheet,
                    readOnly: !appState.resource.security["Manage Properties"]
                });
                propValues.placeAt(self.detailAttach);
            }
        }
    });
});

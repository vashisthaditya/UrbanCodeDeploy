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
        "deploy/widgets/resourceRole/EditResourceRole",
        "deploy/widgets/property/PropDefs"
        ],
function(
        array,
        declare,
        on,
        domConstruct,
        TwoPaneListManager,
        EditResourceRole,
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
                label: i18n("Role Properties"),
                action: function() {
                    self.addHeading(i18n("Role Properties"));
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
            var editResourceRole = new EditResourceRole({
                resourceRole: appState.resourceRole
            });
            editResourceRole.placeAt(this.detailAttach);
        },
        
        showProperties: function() {
            var self = this;
            
            var propDefs = new PropDefs({
                readOnly: !config.data.permissions[security.system.createManageResourceRoles],
                propSheetDefId: appState.resourceRole.propSheetDef.id,
                propSheetDef: appState.resourceRole.propSheetDef
            });
            propDefs.placeAt(self.detailAttach);
        }
    });
});
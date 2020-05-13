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
        "dijit/Tooltip",
        "js/webext/widgets/TwoPaneListManager",
        "deploy/widgets/resourceTemplate/EditResourceTemplate",
        "deploy/widgets/resourceTemplate/ResourceTemplateResourceTree",
        "deploy/widgets/property/PropDefs"
        ],
function(
        array,
        declare,
        xhr,
        on,
        domConstruct,
        Tooltip,
        TwoPaneListManager,
        EditResourceTemplate,
        ResourceTemplateResourceTree,
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
                id: "resources",
                label: i18n("Resources"),
                action: function() {
                    self.addHeading(i18n("Resources"));
                    self.showResourceTree();
                }
            });

            self.addEntry({
                id: "basic",
                label: i18n("Basic Settings"),
                action: function() {
                    self.addHeading(i18n("Basic Settings"));
                    self.showBasicSettings();
                }
            });

            self.addEntry({
                id: "basic",
                label: i18n("Property Definitions"),
                action: function() {
                    self.addHeading(i18n("Property Definitions"));
                    self.showPropertyDefinitions();
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
            var editResourceTemplate = new EditResourceTemplate({
                showCancel: false,
                resourceTemplate: self.resourceTemplate,
                readOnly: !self.resourceTemplate.security["Edit Basic Settings"],
                callback: function(data) {
                    if (data) {
                        navBar.setHash("#resourceTemplate/"+data.id, false, true);
                    }
                }
            });
            editResourceTemplate.placeAt(this.detailAttach);
        },

        showResourceTree: function() {
            var self = this;
            var resourceTemplateResources = new ResourceTemplateResourceTree({
                resourceTemplate: self.resourceTemplate
            });
            resourceTemplateResources.placeAt(this.detailAttach);
        },

        showPropertyDefinitions: function() {
            var self = this;
            var propertyDefinitions = new PropDefs({
                propSheetDefId: self.resourceTemplate.propSheetDef.id
            });
            propertyDefinitions.placeAt(this.detailAttach);
        }
    });
});
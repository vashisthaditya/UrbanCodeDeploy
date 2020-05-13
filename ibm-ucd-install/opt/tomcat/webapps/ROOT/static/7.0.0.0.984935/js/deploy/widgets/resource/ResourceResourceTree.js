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
        "dojo/_base/declare",
        "dojo/dom-class",
        "js/webext/widgets/form/MenuButton",
        "deploy/widgets/resource/ResourceTree"
        ],
function(
        declare,
        domClass,
        MenuButton,
        ResourceTree
) {
    /**
     *
     */
    return declare([ResourceTree], {
        /**
         * Generate any buttons to be shown to the left of the bulk operations buttons
         */
        addTopButtons: function() {
            var self = this;

            if (config.data.permissions[security.system.createResources]) {
                var createOptions = this.getCreateOptions();
                var createButton = new MenuButton({
                    label: i18n("Create ..."),
                    options: createOptions
                });
                domClass.add(createButton.domNode, "idxButtonSpecial");
                createButton.placeAt(this.buttonAttach);
            }
        },
        
        getCreateOptions: function() {
            var self = this;
            var results = [];
            var resource = this.resource;
            
            if (resource) {
                //all resources can create group resources
                var groupResource = {
                     label: i18n("Group Resource"),
                     onClick: function() {
                            self.showNewResourceDialog(resource);
                    }
                };
                results.push(groupResource);
                
                //if a group resource, can create agents and agent pools
                if (!(resource.type && (resource.type.toLowerCase() === "agent" ||
                resource.type.toLowerCase() === "agent pool")) &&
                !resource.role) {
                    var agentResource = {
                            label: i18n("Agent"),
                            onClick: function () {
                                self.showNewResourceDialog(resource, "agent");
                            }
                    };
                    results.push(agentResource);
                    
                    var agentPoolResource = {
                            label: i18n("Agent Pool"),
                            onClick: function() {
                                self.showNewResourceDialog(resource, "agentPool");
                            }
                    };
                    results.push(agentPoolResource);
                }
                //everything else adds component resources
                else {
                    var componentResource = {
                            label: i18n("Component"),
                            onClick: function() {
                                self.showNewResourceDialog(resource, "component");
                            }
                    };
                    results.push(componentResource);
                }
            }
            
            return results;
        }
    });
});
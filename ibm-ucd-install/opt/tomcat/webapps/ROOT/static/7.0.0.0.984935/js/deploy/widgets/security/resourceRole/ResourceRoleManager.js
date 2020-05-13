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
        "dojo/_base/xhr",
        "dojo/_base/array",
        "dojo/dom-construct",
        "dojo/on",
        "deploy/widgets/security/resourceRole/ResourceRoleList",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/PopDown",
        "js/webext/widgets/TwoPaneListManager",
        "deploy/widgets/TooltipTitle"
        ],
function(
        declare,
        xhr,
        array,
        domConstruct,
        on,
        ResourceRoleList,
        GenericConfirm,
        PopDown,
        TwoPaneListManager,
        TooltipTitle
) {
    /**
     *
     */
    return declare('deploy.widgets.security.resourceRole.ResourceRoleManager',  [TwoPaneListManager], {
        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            xhr.get({
                url: bootstrap.baseUrl+"security/resourceType",
                handleAs: "json",
                load: function(data) {
                    var filteredData = array.filter(data, function(item) {
                        return (item.name !== "Server Configuration" && item.name !== "Web UI");
                    });
                    array.forEach(filteredData, function(entry) {
                        self.addEntry({
                            id: entry.id,
                            label: i18n(entry.name),
                            action: function() {
                                self.showResourceRoles(entry);
                            }
                        });
                    });
                }
            });
        },
        
        /**
         * 
         */
        showResourceRoles: function(type) {
            var self = this;
            
            var title = new TooltipTitle({
                titleText : i18n("%s Types", i18n(type.name)),
                tooltipText : i18n("The Standard %s type is provided by default. " +
                        "Configuring multiple %s types allows a role to have " +
                        "different security permissions for different %ss.",
                        i18n(type.name), i18n(type.name.toLowerCase()), i18n(type.name.toLowerCase()))
            });
            title.placeAt(this.detailAttach);

            var resourceRoleList = new ResourceRoleList({resourceType: type});
            resourceRoleList.placeAt(this.detailAttach);
            
            this.registerDetailWidget(resourceRoleList);
        }
    });
});

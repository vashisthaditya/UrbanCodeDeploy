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
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dojo/_base/declare",
        "deploy/widgets/Formatters",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        Formatters,
        TreeTable
) {
    /**
     *
     */
    return declare('deploy.widgets.applicationProcess.ApplicationProcessInventoryChanges',  [_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="applicationProcessInventoryChanges">' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            var gridRestUrl = bootstrap.restUrl+"deploy/applicationProcess/"+this.applicationProcess.id+"/"+this.applicationProcessVersion+"/inventoryChanges";
            var gridLayout = [{
                name: i18n("Component"),
                formatter: function(item, value, cell) {
                    return Formatters.componentLinkFormatter(item.component, value, cell);
                }
            },{
                name: i18n("Change Type"),
                formatter: function(item, value, cell) {
                    cell.style.textAlign = "center";
                    
                    var icon = document.createElement("img");
                    if (item.changeType === "ADD") {
                        icon.src = bootstrap.webextUrl+"images/webext/icons/icon_plus.gif";
                    }
                    else {
                        icon.src = bootstrap.webextUrl+"images/webext/icons/icon_minus.gif";
                    }
                    return icon;
                }
            },{
                name: i18n("Status"),
                formatter: function(item, value, cell) {
                    return Formatters.statusFormatter(item.status, value, cell);
                }
            },{
                name: i18n("Selection"),
                formatter: function(item, value, cell) {
                    var result = "";
                    if (item.changeSelection === "ALL_WITHOUT_STATUS") {
                        result = i18n("All Without Status (Install/Upgrade)");
                    }
                    else if (item.changeSelection === "ALL_WITH_STATUS") {
                        result = i18n("All With Status (Complete Uninstall)");
                    }
                    else if (item.changeSelection === "ALL_SELECTED") {
                        result = i18n("All Selected Versions (Manual Install)");
                    }
                    else if (item.changeSelection === "ALL_SELECTED_WITH_STATUS") {
                        result = i18n("All Selected Versions With Status (Manual Uninstall)");
                    }
                    else if (item.changeSelection === "ALL_NOT_IN_SNAPSHOT") {
                        result = i18n("All Not in Snapshot (Rollback)");
                    }
                    return result;
                }
            },{
                name: i18n("Resource Role"),
                formatter: function(item, value, cell) {
                    return Formatters.resourceRoleFormatter(item.resourceRole, value, cell);
                }
            }];

            this.grid = new TreeTable({
                url: gridRestUrl,
                serverSideProcessing: false,
                columns: gridLayout,
                hideExpandCollapse: true,
                hidePagination: false
            });
            this.grid.placeAt(this.gridAttach);
        },

        /**
         * 
         */
        destroy: function() {
            this.inherited(arguments);
            this.grid.destroy();
        }
    });
});
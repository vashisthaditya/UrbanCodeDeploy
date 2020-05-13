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
        Table
) {
    return declare('deploy.widgets.resource.ResourceInventory',  [_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="resourceInventory">' + 
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',

        /**
         * 
         */
        postCreate: function() {
            this.inherited(arguments);

            var gridLayout = [{
                name: i18n("Component"),
                formatter: function(item) {
                    return Formatters.componentLinkFormatter(item.component);
                }
            },{
                name: i18n("Version"),
                formatter: function(item) {
                    return Formatters.versionLinkFormatter(item.version);
                }
            },{
                name: i18n("Date"),
                field: "date",
                formatter: util.tableDateFormatter,
                orderField: "dateCreated",
                getRawValue: function(item) {
                    return new Date(item.date);
                }
            },{
                name: i18n("Status"),
                formatter: function(item, value, cell) {
                    return Formatters.statusFormatter(item.status, value, cell);
                }
            },{
                name: i18n("Actions")
            }];

            var gridRestUrl = bootstrap.restUrl+"inventory/resourceInventory/table";
            this.grid = new Table({
                url: gridRestUrl,
                columns: gridLayout,
                baseFilters: [{
                    name: "resourceId",
                    type: "eq",
                    values: [appState.resource.id]
                },
                {
                    name: "ghostedDate",
                    className: "Long",
                    type: "eq",
                    values: [0]
                }],
                orderField: "dateCreated",
                sortType: "desc",
                tableConfigKey: "resourceInventoryList",
                noDataMessage: i18n("No components have been installed to this resource."),
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
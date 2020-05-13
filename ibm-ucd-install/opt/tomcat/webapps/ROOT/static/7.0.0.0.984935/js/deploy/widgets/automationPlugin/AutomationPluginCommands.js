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
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        TreeTable
) {
    /**
     *
     */
    return declare('deploy.widgets.automationPlugin.AutomationPluginCommands',  [_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="automationPluginCommands">' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            var gridRestUrl = bootstrap.restUrl+"plugin/automationPlugin/"+this.automationPlugin.id+"/commands";
            var gridLayout = [{
                name: i18n("Command"),
                formatter: function(item) {
                    return i18n(item.name);
                },
                orderField: "name",
                filterField: "name",
                filterType: "text",
                getRawValue: function(item) {
                    return item.name;
                }
            },{
                name: i18n("Description"),
                formatter: function(item) {
                    return i18n(item.description);
                }
            }];

            this.grid = new TreeTable({
                url: gridRestUrl,
                serverSideProcessing: true,
                hideExpandCollapse: true,
                hidePagination: false,
                columns: gridLayout,
                tableConfigKey: "pluginCommandList",
                noDataMessage: i18n("This plugin has no commands."),
                baseFilters: [{
                    name:"automationPlugin.id",
                    type:"eq",
                    className: "UUID",
                    values: [this.automationPlugin.id]
                }]
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
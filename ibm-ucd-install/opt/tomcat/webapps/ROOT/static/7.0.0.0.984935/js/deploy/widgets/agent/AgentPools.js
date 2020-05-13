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
    return declare('deploy.widgets.agent.AgentPools',  [_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="agentPools">'+
                '<div data-dojo-attach-point="tableAttach"></div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            var gridRestUrl = bootstrap.restUrl+"agent/pool";
            var gridLayout = [{
                    name: i18n("Name"),
                    formatter: Formatters.agentPoolLinkFormatter,
                    orderField: "name",
                    getRawValue: function(item) {
                        return item.name;
                    }
                },{
                    name: i18n("Description"),
                    field: "description"
                }];

            this.grid = new TreeTable({
                url: gridRestUrl,
                serverSideProcessing: true,
                orderField: "name",
                tableConfigKey: "agentPoolAgentIncludeList",
                noDataMessage: i18n("No agent pools include this agent."),
                columns: gridLayout,
                hidePagination: false,
                hideExpandCollapse: true,
                baseFilters: [{
                    name: "agents.id",
                    type: "eq",
                    values: [self.agent.id],
                    className: "UUID"
                }],
                queryData: {outputType: ["BASIC", "SECURITY"]}
            });
            this.grid.placeAt(this.tableAttach);
        }
    });
});
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
        "dojo/dom-class",
        "deploy/widgets/Formatters",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        domClass,
        Formatters,
        TreeTable
) {
    return declare('deploy.widgets.deploymentRequest.DeploymentRequestCompliancy',  [_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="deploymentRequestCompliancy">' + 
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
                formatter: util.tableDateFormatter
            },{
                name: i18n("Status"),
                formatter: function(item, value, cell) {
                    return Formatters.statusFormatter(item.status, value, cell);
                }
            },{
                name: i18n("Compliancy"),
                field: "status",
                style: {
                    textAlign: "center"
                },
                formatter: function(item, value, cell) {
                    var result = "";
                    var desired = item.compliancy.desiredCount;
                    var missing = item.compliancy.missingCount;
                    var correct = item.compliancy.correctCount;
                    
                    if (desired === correct) {
                        result = i18n("Compliant (%s/%s)", String(correct), String(desired));
                        domClass.add(cell, "success-state-color");
                    }
                    else {
                        result = i18n("Noncompliant (%s/%s)", String(correct), String(desired));
                        domClass.add(cell, "failed-state-color");
                    }

                    return result;
                }
            }];

            console.log(this.deploymentRequest);

            var gridRestUrl = bootstrap.restUrl+"deploy/environment/"+this.deploymentRequest.rootRequest.environment.id+"/latestDesiredInventory/true";
            this.grid = new TreeTable({
                url: gridRestUrl,
                columns: gridLayout,
                hideExpandCollapse: true,
                hidePagination: false,
                orderField: "dateCreated",
                sortType: "desc",
                tableConfigKey: "compliancyInventoryList",
                noDataMessage: i18n("No desired inventory entries have been created for this deployment.")
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
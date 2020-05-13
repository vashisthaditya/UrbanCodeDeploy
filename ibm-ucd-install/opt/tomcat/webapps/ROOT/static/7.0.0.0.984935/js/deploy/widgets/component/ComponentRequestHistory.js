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
        "dojo/dom-construct",
        "dojo/on",
        "deploy/widgets/Formatters",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        domConstruct,
        on,
        Formatters,
        TreeTable
) {
    return declare('deploy.widgets.component.ComponentRequestHistory',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="componentRequestHistory">' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            var gridLayout = [{
                name: i18n("Process"),
                formatter: function(item) {
                    item.componentProcess.component = item.component;
                    return Formatters.componentProcessLinkFormatter(item.componentProcess);
                }
            },{
                name: i18n("Resource"),
                formatter: function(item) {
                    return Formatters.resourcePathFormatter(item.resource);
                }
            },{
                name: i18n("Version"),
                formatter: function(item) {
                    return Formatters.versionLinkFormatter(item.version);
                }
            },{
                name: i18n("Application"),
                formatter: function(item) {
                    return Formatters.applicationLinkFormatter(item.application);
                }
            },{
                name: i18n("Environment"),
                formatter: function(item) {
                    return Formatters.environmentLinkFormatter(item.environment);
                }
            },{
                name: i18n("Scheduled For"),
                field: "calendarEntry.scheduledDate",
                formatter: function(item) {
                    return util.dateFormatShort(item.entry.scheduledDate);
                },
                orderField: "calendarEntry.scheduledDate"
            },{
                name: i18n("By"),
                field: "userName"
            },{
                name: i18n("Status"),
                formatter: function(item, value, cell) {
                    var result = Formatters.requestStatusFormatter(item, value, cell);
                    return result;
                }
            },{
                name: i18n("Actions"),
                formatter: function(item) {
                    var result = document.createElement("div");

                    var viewLink = document.createElement("a");
                    viewLink.className = "actionsLink";
                    viewLink.innerHTML = i18n("View Request");
                    viewLink.href = "#componentProcessRequest/"+item.id;
                    result.appendChild(viewLink);

                    return result;
                }
            }];

            var gridRestUrl = bootstrap.restUrl+"deploy/componentProcessRequest/table";
            this.grid = new TreeTable({
                url: gridRestUrl,
                baseFilters: [{
                    name: "component.id",
                    type: "eq",
                    className: "UUID",
                    values: [appState.component.id]
                }],
                columns: gridLayout,
                orderField: "calendarEntry.scheduledDate",
                sortType: "desc",
                tableConfigKey: "componentRequestHistory"+appState.component.id,
                noDataMessage: i18n("No process history found for this component."),
                hideExpandCollapse: true,
                hidePagination: false,
                queryData: {outputType: ["BASIC", "LINKED"]}
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
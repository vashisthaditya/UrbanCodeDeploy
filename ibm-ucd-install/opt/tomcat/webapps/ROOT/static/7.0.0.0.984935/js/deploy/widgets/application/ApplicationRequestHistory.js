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
    return declare('deploy.widgets.application.ApplicationRequestHistory',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="applicationRequestHistory">' +
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
                    item.applicationProcess.application = item.application;
                    return Formatters.applicationProcessLinkFormatter(item.applicationProcess);
                }
            },{
                name: i18n("Environment"),
                formatter: function(item) {
                    return Formatters.environmentLinkFormatter(item.environment);
                }
            },{
                name: i18n("Snapshot"),
                formatter: function(item) {
                    return Formatters.snapshotLinkFormatter(item.snapshot);
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

                    var environmentSecurity = item.environment.security;
                    if (!environmentSecurity || environmentSecurity.read) {
                        var viewLink = document.createElement("a");
                        viewLink.className = "actionsLink";
                        viewLink.innerHTML = i18n("View Request");
                        viewLink.href = "#applicationProcessRequest/"+item.id;
                        result.appendChild(viewLink);
                    }

                    return result;
                }
            }];

            var gridRestUrl = bootstrap.restUrl+"deploy/applicationProcessRequest/table";
            this.grid = new TreeTable({
                url: gridRestUrl,
                baseFilters: [{
                    name: "application.id",
                    type: "eq",
                    className: "UUID",
                    values: [appState.application.id]
                }],
                columns: gridLayout,
                orderField: "calendarEntry.scheduledDate",
                sortType: "desc",
                tableConfigKey: "applicationProcessHistory"+appState.application.id,
                noDataMessage: i18n("No process history found for this application."),
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
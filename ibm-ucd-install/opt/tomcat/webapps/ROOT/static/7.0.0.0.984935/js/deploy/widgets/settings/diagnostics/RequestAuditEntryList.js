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
define([
        "dojo/_base/declare",
        "dijit/_Widget",
        "dijit/_TemplatedMixin",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/on",
        "dojo/_base/xhr",
        "dijit/form/Button",
        "deploy/widgets/Formatters",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        declare,
        _Widget,
        _TemplatedMixin,
        domClass,
        domConstruct,
        on,
        xhr,
        Button,
        Formatters,
        TreeTable
) {
    
/**
 *
 */
    return declare(
        [_Widget, _TemplatedMixin],
        {
            templateString: 
                '<div class="requestList">' +
                    '<div data-dojo-attach-point="gridAttach"></div>' +
                '</div>',
    
            /**
             *
             */
            postCreate: function() {
                this.inherited(arguments);
                var self = this;
                
                var gridRestUrl = bootstrap.restUrl+"audit/request";
                var gridLayout = [{
                    name: i18n("User"),
                    orderField: "user.name",
                    filterField: "user.name",
                    field: "user.name",
                    formatter: function(item) {
                        var result = "Anonymous";
                        if (item.user) {
                            result = item.user.name;
                        }
                        return result;
                    },
                    filterType: "text"
                },{
                    name: i18n("Date"),
                    field: "date",
                    formatter: util.tableDateFormatter,
                    orderField: "date",
                    getRawValue: function(item) {
                        return new Date(item.date);
                    }
                },{
                    name: i18n("Duration"),
                    field: "duration",
                    orderField: "duration",
                    formatter: function(item, value) {
                        return util.formatDuration(value, {"roundToNearestSecond":true});
                    }
                },{
                    name: i18n("Method"),
                    orderField: "method",
                    filterField: "method",
                    field: "method",
                    filterType: "text"
                },{
                    name: i18n("URL"),
                    orderField: "shortUrl",
                    filterField: "shortUrl",
                    field: "shortUrl",
                    filterType: "text"
                }];
    
                this.grid = new TreeTable({
                    url: gridRestUrl,
                    noDataMessage: i18n("No Entries Found."),
                    tableConfigKey: "requestAuditEntryTable",
                    orderField: "date",
                    hidePagination: false, 
                    hideExpandCollapse: true,
                    columns: gridLayout
                });
                this.grid.placeAt(this.gridAttach);
    
                    
                var cleanupLogButton = {
                    "label": i18n("Cleanup Log"),
                    "showTitle": false,
                    "onClick": function() {
                        self.showCleanupLogDialog();
                    }
                };
            },
    
            /**
             * 
             */
            destroy: function() {
                this.inherited(arguments);
                this.grid.destroy();
            }
        }
    );
});

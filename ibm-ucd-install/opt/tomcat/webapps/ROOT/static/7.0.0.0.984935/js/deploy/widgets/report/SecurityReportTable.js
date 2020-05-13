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
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/on",
        "dojox/html/entities",
        "deploy/widgets/report/ReportTable",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        array,
        declare,
        xhr,
        domConstruct,
        domClass,
        on,
        entities,
        ReportTable,
        TreeTable
) {
    /**
     *
     */
    return declare('deploy.widgets.report.SecurityReportTable',  [ReportTable], {

        systemReportBase: null,
        selectableColumns: true,
        reportMetadata: null,
        activeColumns: [],

        constructor: function() {
            // All security reports are system reports
            this.systemReportBase = bootstrap.restUrl + "report/system/";
        },

        renderReport: function(resultsUrl) {
            this.loadMetadata();
            this.cleanupReport();
            this.determineActiveColumns();
            this.createTable();
            this.displayTable();
        },

        loadMetadata: function() {
            var self = this;
            xhr.get({
                url: self.systemReportBase + util.encodeIgnoringSlash(self.reportName),
                handleAs: "json",
                sync: true, // Not ideal, but everything else will rely on this.
                load: function(data) {
                    self.reportMetadata = data;
                },
                error: function() {
                    self.showError();
                }
            });
        },

        cleanupReport: function() {
            if (this.reportTable) {
                this.reportTable.destroy();
            }
        },

        determineActiveColumns: function() {
            var self = this;
            //loop through reportResultLayout, tag hidden columns
            if (this.getReportResultLayout().length !== 0) {
                this.reportResultLayout = this.getReportResultLayout();
            }
            array.forEach(this.reportResultLayout, function(column, index){
                if((self.reportMetadata.hiddenColumns &&
                        self.reportMetadata.hiddenColumns.indexOf(column.field) > -1) || column.hidden) {
                    column.enabled = false;
                } else {
                    column.enabled = true;
                    self.activeColumns.push(column);
                }
            });
        },

        createTable: function(reportMetadata) {
            var self = this;
            var properties = this.reportMetadata.properties;
            var orderField;
            var sortType;
            var activeColumns = [];
            var filterTypes = {
                    date: "dateRange"
            };

            array.forEach(self.reportResultLayout, function(column, index){
                if (column.enabled) {
                    activeColumns.push(column);
                    array.forEach(properties, function(property,index) {
                        if (property.name === "orderField") {
                            orderField = property.value;
                        } else if (property.name === "sortType") {
                            sortType = property.value;
                        }
                    });
                }
            });

            this.reportTable = new TreeTable({
                url: this.systemReportBase + util.encodeIgnoringSlash(this.reportName) + "/results",
                columns: activeColumns,
                orderField: orderField || undefined,
                sortType: sortType,
                noDataMessage: i18n("No results found"),
                hideFooterLinks: true,
                serverSideProcessing: true,
                style: "overflow-x: auto; padding-bottom: 40px;",
                baseTextDir: util.getBaseTextDir(),
                hidePagination: false,
                processXhrResponse: function(data) {
                    if (self.nonEmptyCallback) { // Because this is not an inherited function...
                        var linksInformation = {
                            reportLength: data.length,
                            csvUrl: self.reportRestUrlBase + "adHoc/csv?" + self.adHocQuery,
                            printReport: function() {
                                if (self.reportChart){
                                    // Store chart dimensions.
                                    var chartWidth = self.reportChart.chartWidth;
                                    var chartHeight = self.reportChart.chartHeight;
                                    domClass.add(self.domNode, "print-view");
                                    // Resize chart to fit for printing view.
                                    self.reportChart.setSize(600, 300, false);
                                    setTimeout(function(){
                                        self.reportTable.print();
                                        domClass.remove(self.domNode, "print-view");
                                        setTimeout(function(){
                                            // Return chart size back to original dimensions.
                                            self.reportChart.setSize(chartWidth, chartHeight, false);
                                        }, 100);
                                    }, 100);
                                }
                                else {
                                    self.reportTable.print();
                                }
                            }
                        };

                        self.nonEmptyCallback(linksInformation);
                    }
                }
            });
        },

        displayTable: function() {
            var self = this;
            this.reportTable.drawHeadings();
            this.reportTable.placeAt(this.domNode);

            if (this.selectableColumns) {
                var columnSelectorButtonContainer = domConstruct.create("td", {
                    colspan: this.activeColumns.length
                }, this.reportTable.filterAttach);
                var columnSelectorButton = domConstruct.create("a", {
                    innerHTML: i18n("Select Columns"),
                    className: 'report-column-edit-button linkPointer'
                }, columnSelectorButtonContainer);
                on(columnSelectorButton, "click", function(){
                    self.showTableDialog();
                });
            }
        },

        reRenderReport: function() {
            this.cleanupReport();
            this.determineActiveColumns();
            this.createTable();
            this.displayTable();
        }
    });
});

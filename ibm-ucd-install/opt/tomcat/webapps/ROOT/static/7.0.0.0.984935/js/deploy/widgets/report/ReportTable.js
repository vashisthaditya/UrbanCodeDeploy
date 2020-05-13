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
/*global define, require, Highcharts */

define([
        "dijit/_Widget",
        "dijit/form/Button",
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/dom-geometry",
        "dojo/io-query",
        "dojo/on",
        "js/util/blocker/BlockingContainer",
        "js/util/blocker/_BlockerMixin",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _Widget,
        Button,
        array,
        declare,
        xhr,
        domConstruct,
        domClass,
        geo,
        ioQuery,
        on,
        BlockingContainer,
        _BlockerMixin,
        ColumnForm,
        Dialog,
        Table
) {
    /**
     *
     */
    return declare('deploy.widgets.report.ReportTable',  [_Widget, _BlockerMixin], {
        reportRestUrlBase: null,
        reportTable: null, // Table.js
        reportChart: null, // HiChart instance
        nonEmptyCallback: null,

        //Defaults for ReportTable type:
        requiredFields: [],
        reportType: null,
        columnFormatters: null,
        reportResultLayout: null,
        reportProperties: null,

        resultsUrl: null,
        reportResults: null,
        reportMetadata: null,

        /**
        *
        */
        constructor: function(args) {
            var t = this;
            t.reportRestUrlBase = bootstrap.restUrl + "report/";
            if (args) {
                t.nonEmptyCallback = args.nonEmptyCallback;
            }
        },

        /**
         *
         */
        destroy: function() {
            this.inherited(arguments);
            var t = this;
            if (t.reportTable) {
                t.reportTable.destroy();
            }
            if (t.reportChart) {
                t.reportChart.destroy();
                t.reportChart = null;
            }
        },

        /**
         *
         */
        showReport: function(args) {
            var t = this;
            if (t.reportTable) {
                t.reportTable.destroy();
            }

            if (!args || !args.empty) {
                domConstruct.empty(t.domNode);
            }

            t.reportProperties = t.reportMetadata.properties;

            var activeColumns = [];
            //loop through reportResultLayout, tag hidden columns
            if (t.getReportResultLayout().length !== 0) {
                t.reportResultLayout = t.getReportResultLayout();
            }
            array.forEach(t.reportResultLayout, function(column, index){
                if((t.reportMetadata.hiddenColumns && t.reportMetadata.hiddenColumns.indexOf(column.field) > -1) || column.hidden) {
                    column.enabled = false;
                } else {
                    column.enabled = true;
                    activeColumns.push(column);
                }
            });

            if (!args || !args.refresh) {
                t.reportTable = t.createTable();
            } else {
                t.reportTable.columns = activeColumns;
            }

            t.reportTable.drawHeadings();
            t.reportTable.placeAt(t.domNode);
            t.reportTable.showTable(t.reportResults);

            if (t.selectableColumns) {
                var columnSelectorButtonContainer = domConstruct.create("td", {
                    colspan: activeColumns.length
                }, t.reportTable.filterAttach);
                var columnSelectorButton = domConstruct.create("a", {
                    innerHTML: i18n("Select Columns"),
                    className: 'report-column-edit-button linkPointer'
                }, columnSelectorButtonContainer);
                on(columnSelectorButton, "click", function(){
                    t.showTableDialog();
                });
            }
        },

        /**
         *
         */
        showTableDialog: function() {
            var t = this;

            t.tableDisplayDialog = new Dialog({
                title: i18n("Select Columns"),
                closeable: true,
                draggable: true
            });

            var tableDisplayForm = new ColumnForm({
                saveLabel: i18n("OK"),
                onSubmit: function(data) {
                    t.reportMetadata.hiddenColumns = [];

                    var reportResultLayout = t.getReportResultLayout();
                    array.forEach(reportResultLayout, function(column, index) {
                        if (data[column.field] === "false" || column.hidden) {
                            t.reportMetadata.hiddenColumns.push(column.field);
                        }
                    });

                    if (t.isInstanceOf(deploy.widgets.report.SecurityReportTable)) {
                        t.reRenderReport();
                    } else {
                        //Preserve order unless order field is now hidden
                        var displayConfig = t.getDisplayConfig();
                        var orderField = displayConfig.orderField;
                        var sortType = displayConfig.sortType;

                        if (t.reportMetadata.hiddenColumns.indexOf(orderField) < 0) {
                            var found = false;

                            array.forEach(t.reportMetadata.properties, function(prop, index) {
                                if (prop.name === "orderField") {
                                    prop.value = orderField;
                                    found = true;
                                } else if (prop.name === "sortType") {
                                    prop.value = sortType;
                                    found = true;
                                }
                            });

                            if (!found) { //no orderField was previously set
                                t.reportMetadata.properties.push({
                                    name: "orderField",
                                    value: orderField
                                });
                                t.reportMetadata.properties.push({
                                    name: "sortType",
                                    value: sortType
                                });
                            }
                        }

                        t.showReport({refreshDisplay: true});
                    }

                    t.tableDisplayDialog.hide();
                    t.tableDisplayDialog.destroy();
                },
                onCancel: function() {
                    t.tableDisplayDialog.hide();
                    t.tableDisplayDialog.destroy();
                }
            });

            array.forEach(t.reportResultLayout, function(column, index) {
                if (!column.hidden){
                    tableDisplayForm.addField({
                        name: column.field,
                        label: column.name,
                        required: false,
                        type: "Checkbox",
                        value: column.enabled
                    });
                }
            });

            tableDisplayForm.placeAt(t.tableDisplayDialog.containerNode);

            t.tableDisplayDialog.show();

        },

        /**
         *
         */
        renderReport: function(/*String*/ url) {
            var t = this;
            t.resultsUrl = url;

            if (t.reportType === 'com.urbancode.ds.subsys.report.domain.deployment_count.DeploymentCountReport' ||
                t.reportType === 'com.urbancode.ds.subsys.report.domain.deployment_count.DeploymentDurationSumReport' ||
                t.reportType === 'com.urbancode.ds.subsys.report.domain.deployment_count.DeploymentDurationAverageReport') {
                t.loadCountReport(function() {
                    t.showReport({empty: true});
                });
            }
            else {
                t.loadReport(function() {
                    t.showReport();
                });
            }
        },

        /**
         *
         */
        loadCountReport: function(/*function*/ callback) {
            var t = this;

            domConstruct.empty(t.domNode);
            var b = new BlockingContainer();
            b.placeAt(t.domNode);

            domConstruct.create("div", {"style":"width:100%;height:10em"}, b.domNode);
            b.block();

            var formatHeader = function(header) {
                var re = /[0-9]{4}-/;
                var result;
                if (header.search(re) === 0) {
                    result = header.replace(re, "");
                } else {
                    result = i18n(header);
                }
                return i18n(result);
            };

            xhr.get({
                url: t.resultsUrl,
                handleAs: "json",
                load: function(data) {
                    t.reportResultLayout = [];
                    t.reportMetadata = data.report[0];

                    var aggType;
                    if (t.reportType === 'com.urbancode.ds.subsys.report.domain.deployment_count.DeploymentCountReport') {
                        aggType = "COUNT";
                    }
                    else if (t.reportType === 'com.urbancode.ds.subsys.report.domain.deployment_count.DeploymentDurationSumReport') {
                        aggType = "DURATION_SUM";
                    }
                    else if (t.reportType === 'com.urbancode.ds.subsys.report.domain.deployment_count.DeploymentDurationAverageReport') {
                        aggType = "DURATION_AVERAGE";
                    }
                    var series = data.items[0][0];
                    var columnHeader;
                    for (columnHeader in series) {
                        if (series.hasOwnProperty(columnHeader)){
                            var column = {
                                field: columnHeader,
                                name: formatHeader(columnHeader)
                            };

                            //Apply nowrap on month-date strings
                            if (column.field !== column.name) {
                                column.styleHeading = {"white-space":"nowrap"};
                            }

                            if (aggType !== "COUNT" && columnHeader !== i18n("Application") && columnHeader !== i18n("Environment")) {
                                column.formatter = util.durationFormatter;
                            }
                            if (!column.hidden){
                                t.reportResultLayout.push(column);
                            }
                        }
                    }
                    t.reportResults = data.items[0];

                    t.reportMetadata.properties.push({
                        name: "orderField",
                        value: "Application"
                    });

                    b.unblock();
                    domConstruct.empty(b.domNode);

                    var aggregationType;
                    array.forEach(t.reportMetadata.properties, function(property, index) {
                        if (property.name === "aggregation") {
                            aggregationType = property.value;
                        }
                    });

                    if(data.items[0].length) {
                        Highcharts.setOptions({
                            lang: {
                                resetZoom: i18n("Reset Zoom"),
                                resetZoomTitle:  i18n("Reset Zoom")
                            }
                        });
                        t.createChart(data.items[0], aggregationType, b.domNode);
                    }
                    callback();
                },
                error: function() {
                    b.unblock();
                    domConstruct.empty(b.domNode);
                    t.showError();
                }
            });
        },

        showError: function(message) {
            this.inherited(arguments);
            var t = this;
            var errorSpan = domConstruct.create("span", {"style":"fontSize:medium"}, t.domNode);
            if (message) {
                errorSpan.innerHTML = "<br>" + message;
            } else {
                errorSpan.innerHTML = "<br>"+i18n("An error has occurred.");
            }
        },

        /**
         *
         */
        loadReport: function(/*function*/ callback) {
            var t = this;

            var b = new BlockingContainer();
            b.placeAt(t.domNode);

            domConstruct.create("div", {"style":"width:100%;height:10em"}, b.domNode);
            b.block();

            xhr.get({
                url: t.resultsUrl,
                handleAs: "json",
                load: function(data) {
                    b.unblock();
                    t.reportResults = data.items[0];
                    t.reportMetadata = data.report[0];
                    callback();
                },
                error: function() {
                    b.unblock();
                    domConstruct.empty(b.domNode);
                    t.showError();
                }
            });

        },

        /**
         *
         */
        getDisplayConfig: function() {
            var t = this;
            var result = null;
            if (t.reportMetadata && t.reportResults && t.reportTable) {
                result = {
                    hiddenColumns: t.reportMetadata.hiddenColumns,
                    orderField: t.reportTable.orderField,
                    sortType: t.reportTable.sortType
                };
            }
            return result;
        },


        /**
         *  Uses current state of t.reportResultLayout to render table
         */
        createTable: function() {
            var t = this;
            var items = t.reportResults;
            var properties = t.reportMetadata.properties;
            var orderField;
            var sortType;
            var activeColumns = [];
            var filterTypes = {
                date: "dateRange"
            };

            //var reportResultLayout = t.getReportResultLayout();
            array.forEach(t.reportResultLayout, function(column, index){
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

            var firstActiveColumn = activeColumns.length ? activeColumns[0].field : null;

            var result = new Table({
                data: items,
                columns: activeColumns,
                orderField: orderField || firstActiveColumn || undefined,
                sortType: sortType,
                noDataMessage: i18n("No results found"),
                hideFooterLinks: true,
                serverSideProcessing: false,
                style: "overflow-x: auto; padding-bottom: 40px;",
                baseTextDir: util.getBaseTextDir(),
                hideExpandCollapse: true,
                hidePagination: false
            });

            if (t.nonEmptyCallback) {
                t.nonEmptyCallback({
                    reportLength: t.reportResults.length,
                    csvUrl: t.reportRestUrlBase + "adHoc/csv?" + t.adHocQuery,
                    printReport: function() {
                        if (t.reportChart){
                            // Store chart dimensions.
                            var chartWidth = t.reportChart.chartWidth;
                            var chartHeight = t.reportChart.chartHeight;
                            domClass.add(t.domNode, "print-view");
                            // Resize chart to fit for printing view.
                            t.reportChart.setSize(600, 300, false);
                            setTimeout(function(){
                                result.print();
                                domClass.remove(t.domNode, "print-view");
                                setTimeout(function(){
                                    // Return chart size back to original dimensions.
                                    t.reportChart.setSize(chartWidth, chartHeight, false);
                                }, 100);
                            }, 100);
                        }
                        else {
                            result.print();
                        }
                    }
                });
            }
            return result;
        },

        /**
         *
         */
        refresh: function() {
            var t = this;

            var refreshData = t.loadReport(function() {
                t.reportTable.showTable(t.reportResults);
            });

        },


        /**
         * Checks whether required fields are defined; generates url and calls renderReport on success,
         * executes errorCallback on failure
         * args.report: report metadata
         * args.errorCallback(*Array* offendingFields) function to execute if field validation fails
         */
        renderAdHocReport: function(/*Object*/ args) {
            var t = this;
            if (t.reportTable) {

                t.reportTable.destroy();
            }

            domConstruct.empty(t.domNode);
            var report = args.report;

            var reportObject = {};
            var offendingFields = [];
            array.forEach(t.requiredFields, function(field, index) {
                var found = false;
                array.forEach( report.properties, function(property, propIndex) {
                    if (property.name === field
                            && property.value !== undefined
                            && property.value !== null){
                                found = true;
                            }
                });
                if (!found) {
                    offendingFields.push(field);
                }
            });

            if (offendingFields.length) {
                args.errorCallback(offendingFields);

            } else {
                array.forEach(report.properties, function(property, index) {
                    reportObject[property.name] = property.value;
                });
                reportObject.type = t.reportType;

                reportObject.hiddenColumns = report.hiddenColumns || [];


                var query = ioQuery.objectToQuery(reportObject);
                t.adHocQuery = query;
                t.renderReport(t.reportRestUrlBase + "adHoc?" + query);
            }
        },

        /**
         *
         */
        setColumnFormatters: function(/*Object*/ functions) {
            var t = this;
            t.columnFormatters = functions;
        },

        /**
         *
         */
        setRequiredFields: function(/*Array*/ requiredFields) {
            var t = this;
            t.requiredFields = requiredFields;
        },

        /**
         *  Returns an array containing properties of rendered report
         *  Used by *ReportForm.js to set selectors
         */
        getCurrentReportProperties: function() {
            var t = this;
            return t.reportProperties;
        },

        /**
         *
         */
        renderChart: function() {
            var t = this;
        },

        /**
         *
         */
        actionsFormatter: function(item) {
            var t = this;
            var a = document.createElement("a");
            a.href="#applicationProcessRequest/" + item.applicationRequestId;
            a.innerHTML = i18n("View Request");
            return a;
        },

        /**
         *
         */
        multiNameFormatter: function() {
            var t = this;
        }
    });
});

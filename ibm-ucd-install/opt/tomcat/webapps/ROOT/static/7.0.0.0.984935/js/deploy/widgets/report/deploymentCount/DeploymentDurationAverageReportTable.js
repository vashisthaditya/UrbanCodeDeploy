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
        "dojo/_base/declare",
        "dojo/dom-construct",
        "deploy/widgets/report/ReportTable"
        ],
function(
        declare,
        domConstruct,
        ReportTable
) {
    /**
     *
     */
    return declare('deploy.widgets.report.deploymentCount.DeploymentDurationAverageReportTable',  [ReportTable], {
        reportRestUrlBase: null,
        reportTable: null, // Table.js
        reportChart: null, // HiChart instance

        requiredFields: [       // Array of field names for ad-hoc report
           "time_unit"
        ],


        constructor: function() {
            this.inherited(arguments);
            this.reportRestUrlBase = bootstrap.restUrl + "report/";
        },

        reportType : 'com.urbancode.ds.subsys.report.domain.deployment_count.DeploymentDurationAverageReport',

        //
        // Chart
        //

        destroyChart: function() {
            var t = this;
            if (t.reportChart) {
                t.reportChart.destroy();
                t.reportChart = null;
            }
        },

        getReportResultLayout: function() {
            return [];
        },

        /**
         *
         */
        createChart : function(data, aggregationType, domNode){
            var t = this;
            var seriesSet = [];
            var categories = [];
            var applicationName;
            var maxDeployments = 0;
            var yAxisOptions;
            var subtitleOptions = {};
            var xAxisStep;
            var staggerLines;

            yAxisOptions = {
                type: 'datetime',
                allowDecimals: false,
                min: 0,
                gridLineColor:'#cfcdcc',
                gridLineDashStyle:'ShortDash',
                gridLineWidth: 1,
                labels: {
                    formatter: function() {
                        return util.formatDuration(this.value + 1, {"roundToNearestSecond":true});
                    }
                },
                title: {
                    text: i18n("Duration")
                }
            };
            var timeValues = true;
            subtitleOptions.text = i18n("Average Deployment Duration");

            var application;
            for (application in data){
                if(data.hasOwnProperty(application) && data[application]){
                    var rowData = data[application];
                    //construct a series
                    var series = {};
                    series.name = rowData[i18n("Environment")];
                    series.type = "line";
                    //construct data array
                    var dataset = [];
                    var month;
                    for (month in rowData){
                        if (rowData.hasOwnProperty(month)) {
                            if (month !== i18n("Application") && month !== i18n("Environment")){
                                if (parseInt(application, 10) === 0){
                                    categories.push(month);
                                }
                                var yValue = Number(rowData[month]);
                                dataset.push({
                                    name: month,
                                    y: yValue
                                });
                            }
                        }
                    }
                    series.data = dataset;
                    //add to seriesSet
                    seriesSet.push(series);
                    if(!applicationName){
                        applicationName = data[application][i18n("Application")];
                    }
                    else {
                        if(applicationName !== data[application][i18n("Application")]) {
                            applicationName = i18n("Multiple Applications");
                        }
                    }
                }
            }

            if (categories.length < 5) {
                xAxisStep = null;
                staggerLines = 1;
                if (categories.length === 4) {
                    staggerLines = 2;
                }
            } else {
                xAxisStep = Math.ceil(categories.length / 5);
                staggerLines = Math.min(2, Math.ceil(categories.length / (2 * xAxisStep)));
            }

            var chartOuterContainer = domConstruct.create("div", {
                className: "chart-outer-container"
                }, domNode);
            domConstruct.create("div", {
                className: "description-text chart-help-link-container",
                innerHTML: i18n("Click and drag to select an area to zoom in")
            }, domNode);
            var chartNode = domConstruct.create("div", {
                className: "highcharts-outer-container"
            }, chartOuterContainer);

            t.reportChart = new Highcharts.Chart({
                chart: {
                    height: 300,
                    renderTo: chartNode,
                    zoomType: 'xy'
                },

                colors: [
                    '#53ABCC',
                    '#6ECFC7',
                    '#86B347',
                    '#F0CC00',
                    '#E6944A',
                    '#E2515B',
                    '#C767AE',
                    '#9169BF',
                    '#53ABCC',
                    '#6ECFC7',
                    '#86B347',
                    '#F0CC00',
                    '#E6944A',
                    '#E2515B',
                    '#C767AE',
                    '#9169BF'
                ],
                labels: {
                    style: {
                        color:'#8a8989'
                    }
                },
                credits : {enabled: false},
                title: {
                    text: applicationName,
                    x: -20 //center
                },
                subtitle: subtitleOptions,
                xAxis: {
                    type: 'line',
                    categories: categories,
                    minorTickWidth:2,
                    tickmarkPlacement: "on",
                    tickInterval: xAxisStep,
                    labels: {
                        staggerLines: staggerLines,
                        style: {
                            color:'#8a8989'
                        }
                    },

                    dateTimeLabelFormats: {
                        month: '%e. %b',
                        year: '%b'
                    }
                },
                yAxis: yAxisOptions,
                plotOptions: {
                    line: {
                        visible: true,
                        dashStyle: "solid",
                        connectNulls: true,
                        shadow: false,
                        dataLabels: {
                            color:'#0000ff'
                        }
                    }
                },
                tooltip: {
                    formatter: function() {
                        //var this = this;
                        var message = '<b>';
                        if (this.points && this.points[0] && this.points[0].point){
                            message += this.points[0].point.name;
                        }
                        message += '</b>';

                        var textEntries = [];

                        dojo.forEach(this.points, function(point, i) {
                            var dateFormatY = util.formatDuration(point.y, {"roundToNearestSecond":true});
                            textEntries.push({
                                deployments: point.y,
                                tooltipText:
                                    '<br/>' + '<span style=\"color:' + point.series.color
                                    +  ';\">'+ point.series.name +'</span>: '
                                    + dateFormatY
                            });
                        });
                        textEntries.sort( function(a,b){
                            return b.deployments - a.deployments;
                        });

                        var entry;
                        for (entry in textEntries){
                            if (textEntries.hasOwnProperty(entry)) {
                                message += textEntries[entry].tooltipText;
                            }
                        }
                        return message;
                    },
                    crosshairs: true,
                    shared: true
                },
                legend: {
                    layout: 'vertical',
                    borderWidth:0,
                    lineHeight:34,
                    align: 'right',
                    verticalAlign: 'top',
                    style: {
                        color:'#ff0000',
                        fontSize:'11px'
                    }
                },
                series: seriesSet
            });
        }
    });
});

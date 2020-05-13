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
        "dojo/_base/declare",
        "deploy/widgets/report/ReportTable"
        ],
function(
        declare,
        ReportTable
) {
    /**
     *
     */
    return declare('deploy.widgets.report.deploymentReport.DeploymentReportTable',  [ReportTable], {

        /**
        *
        */
        constructor: function() {
            var t = this;
            t.reportRestUrlBase = bootstrap.restUrl + "report/";
        },

        reportType: 'com.urbancode.ds.subsys.report.domain.deployment_report.DeploymentReport',
        reportRestUrlBase: null,
        reportResultTable: null, // Table.js of current report results

        selectableColumns: true,
        getReportResultLayout: function() {
            var self = this;
            var reportResultLayout = [{
                    name: i18n("Application"),
                        field:"application",
                        getRawValue:function(item) {
                            return item.application;
                        },
                        orderField:"application"
                    },{
                        name: i18n("Environment"),
                        field:"environment",
                        getRawValue:function(item) {
                            return item.environment;
                        },
                        orderField:"environment"
                    },{
                        formatter: util.tableDateFormatter,
                        name: i18n("Date Scheduled"),
                        field:"dateScheduled",
                        getRawValue:function(item) {
                            return item.dateScheduled.toString();
                        },
                        orderField:"dateScheduled"
                    },{
                        formatter: util.tableDateFormatter,
                        name: i18n("Date Started"),
                        field:"dateStarted",
                        getRawValue:function(item) {
                            var result = "";
                            if (item.dateStarted) {
                                result = item.dateStarted.toString();
                            }
                            return result;
                        },
                        orderField:"dateStarted"
                    },{
                        name: i18n("User"),
                        field:"user",
                        getRawValue:function(item) {
                            return item.user;
                        },
                        orderField:"user"
                    },{
                        name: i18n("Status"),
                        field:"status",
                        getRawValue:function(item) {
                            return item.status;
                        },
                        orderField:"status"
                    },{
                        name: i18n("Duration"),
                        field: "duration",
                        formatter: util.durationFormatter,
                        getRawValue:function(item) {
                            return Number(item.duration);
                        },
                        orderField:"duration"
                    },{
                        name: i18n("Actions"),
                        field:"applicationRequestId",
                        'class': 'noPrint',
                        formatter: function(item) {
                            var a = document.createElement("a");
                            a.href="#applicationProcessRequest/" + item.applicationRequestId;
                            a.innerHTML= i18n("View Request");
                            return a;
    
                        }
                    }];
            return reportResultLayout;
        }
    });
});
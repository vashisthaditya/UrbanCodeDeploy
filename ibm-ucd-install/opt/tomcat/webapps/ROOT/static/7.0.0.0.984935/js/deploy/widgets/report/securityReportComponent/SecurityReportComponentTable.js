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
        "dojo/dom-construct",
        "dojox/html/entities",
        "deploy/widgets/report/SecurityReportTable"
        ],
function(
        array,
        declare,
        domConstruct,
        entities,
        SecurityReportTable
) {
    /**
     *
     */
    return declare('deploy.widgets.report.securityReportComponent.SecurityReportComponentTable',  [SecurityReportTable], {

        reportRestUrlBase: null,
        reportResultTable: null, // Table.js of current report results
        reportName: "Component Security",

        selectableColumns: true,

        constructor: function() {
            var t = this;
            this.reportRestUrlBase = bootstrap.restUrl + "report/";
        },

        reportType: 'com.urbancode.ds.subsys.report.domain.security_report.environment.SecurityReportComponent',
        formatters: {
            multiNameFormatter: function(item, value) {
                var div = domConstruct.create("div");
                var values = value ? value.split(",") :  null;

                array.forEach(values, function(it, index) {
                    if (index !== 0) {
                        domConstruct.create('br', {}, div);
                    }
                    domConstruct.create('span', {innerHTML:entities.encode(it)}, div);
                });
                        return div;
            }
        },

        getReportResultLayout: function() {
            var self = this;
            var reportResultLayout = [{
                        name: i18n("Component"),
                        field:"name",
                        orderField:"name",
                        formatter: function(item) {
                            return item.component;
                        }
                    },{
                        formatter: self.formatters.multiNameFormatter,
                        name: i18n("Create"),
                        field:"Create Components"
                    },{
                        formatter: self.formatters.multiNameFormatter,
                        name: i18n("Delete"),
                        field:"Delete"
                    },{
                        formatter: self.formatters.multiNameFormatter,
                        name: i18n("Edit Basic Settings"),
                        field:"Edit Basic Settings"
                    },{
                        formatter: self.formatters.multiNameFormatter,
                        name: i18n("Edit Components"),
                        field:"Edit Components",
                        hidden: true
                    },{
                        formatter: self.formatters.multiNameFormatter,
                        name: i18n("Manage Configuration Templates"),
                        field: "Manage Configuration Templates"
                    },{
                        formatter: self.formatters.multiNameFormatter,
                        name: i18n("Manage Processes"),
                        field: "Manage Processes"
                    },{
                        formatter: self.formatters.multiNameFormatter,
                        name: i18n("Manage Properties"),
                        field: "Manage Properties"
                    },{
                        formatter: self.formatters.multiNameFormatter,
                        name: i18n("Manage Teams"),
                        field: "Manage Teams"
                    },{
                        formatter: self.formatters.multiNameFormatter,
                        name: i18n("Manage Versions"),
                        field:"Manage Versions"
                    },{
                        formatter: self.formatters.multiNameFormatter,
                        name: i18n("View"),
                        field:"View Components"
            }];
            return reportResultLayout;
        }
    });
});
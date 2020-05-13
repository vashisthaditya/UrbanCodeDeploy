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
    return declare('deploy.widgets.report.securityReportResource.SecurityReportResourceTable',  [SecurityReportTable], {

        reportRestUrlBase: null,
        reportResultTable: null, // Table.js of current report results
        reportName: "Resource Security",

        selectableColumns: true,

        constructor: function() {
            var t = this;
            this.reportRestUrlBase = bootstrap.restUrl + "report/";
        },

        reportType : 'com.urbancode.ds.subsys.report.domain.security_report.environment.SecurityReportResource',

        formatters: {
            multiNameFormatter : function(item, value) {
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
            var reportResultLayout = [
                {
                    name: i18n("Resource"),
                    field:"path",
                    orderField:"path",
                    formatter: function(item) {
                        return item.resource;
                    }
                },{
                    formatter: self.formatters.multiNameFormatter,
                    name: i18n("Create"),
                    field:"Create Resources"
                },{
                    formatter: self.formatters.multiNameFormatter,
                    name: i18n("View"),
                    field:"View Resources"
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
                    name: i18n("Map to Environments"),
                    field:"Map to Environments"
                },{
                    formatter: self.formatters.multiNameFormatter,
                    name: i18n("Manage Children"),
                    field:"Manage Children"
                },{
                    formatter: self.formatters.multiNameFormatter,
                    name: i18n("Manage Properties"),
                    field:"Manage Properties"
                },{
                    formatter: self.formatters.multiNameFormatter,
                    name: i18n("Manage Teams"),
                    field:"Manage Teams"
                },{
                    formatter: self.formatters.multiNameFormatter,
                    name: i18n("Manage Impersonation"),
                    field:"Manage Impersonation"
                }
            ];
            return reportResultLayout;
        }
    });
});
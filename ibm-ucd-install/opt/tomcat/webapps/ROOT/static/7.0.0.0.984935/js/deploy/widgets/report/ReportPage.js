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
        "deploy/widgets/report/ReportFormTable",
        "deploy/widgets/report/ReportSidebar"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        domConstruct,
        ReportFormTable,
        ReportSidebar
) {
    /**
     *
     */
    return declare('deploy.widgets.report.ReportPage',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="report-definition-list">' +
                '<div data-dojo-attach-point="headingSectionAttach" class="noPrint"></div>' +
                '<div class="report-page-container">' +
                  '<div data-dojo-attach-point="sidebarAttach" class="report-sidebar noPrint"></div>' +
                  '<div data-dojo-attach-point="tableContainer" class="report-main">' +
                  '</div>' +
                '</div>' +
                '<br/><br/>' +
            '</div>',

        reportRestUrlBase: null,
        reportHashBase: null,

        headingSectionAttach: null,
        gridAttach: null,
        tableContainer: null,
        csvLinkAttach: null,
        sidebarAttach: null,
        listsAttach: null,

        saveFilterButton: null,
        previewButton: null,
        reportLists: null,
        reportSidebar: null,
        report: null,     // currently selected report
        reportType: null,
        resultWidget: null, // widget which displays report results

        constructor: function() {
            var t = this;
            t.reportRestUrlBase = bootstrap.restUrl + "report/";
            t.reportHashBase = "reports/" ;
        },

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var t = this;

            t.reportSidebar = new ReportSidebar({
                report:t.report, 
                reload:function() {
                    t.reloadReport();
                }
            });
            t.reportSidebar.placeAt(t.sidebarAttach);

            t.reportFormTable = new ReportFormTable({report:t.report});
            t.reportFormTable.placeAt(t.tableContainer);
        },



        /**
         *
         */
        destroy: function() {
            if (this.reportLists) {
                this.reportLists.destroy();
            }
            if (this.reportSidebar) {
                this.reportSidebar.destroy();
            }
            if (this.resultWidget) {
                this.resultWidget.destroy();
                this.resultWidget = null;
            }
            this.inherited(arguments);
        },

        refresh: function() {
            this.reportLists.refresh();
        },
        
        reloadReport: function() {
            var t = this;
            domConstruct.empty(t.tableContainer);
            
            t.reportFormTable = new ReportFormTable({report:t.report});
            t.reportFormTable.placeAt(t.tableContainer);
        }
    });
});
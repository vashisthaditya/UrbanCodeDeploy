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
        "dojo/dom-geometry",
        "dojo/dom-style",
        "dojo/on",
        "dojo/_base/xhr",
        "dijit/form/Button",
        "dijit/ProgressBar",
        "deploy/widgets/Formatters",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        declare,
        _Widget,
        _TemplatedMixin,
        domClass,
        domConstruct,
        domGeometry,
        domStyle,
        on,
        xhr,
        Button,
        ProgressBar,
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
                
                var gridRestUrl = bootstrap.restUrl+"vc/metadataGeneratorState";
                var gridLayout = [{
                    name: i18n("Generator"),
                    orderField: "displayName",
                    field: "displayName"
                },{
                    name: i18n("Total Commits to Scan"),
                    field: "scanEndCommit",
                    orderField: "duration"
                },{
                    name: i18n("Commit Scans Completed"),
                    field: "newestScannedCommit",
                    orderField: "duration"
                },{
                    name: i18n("Progress"),
                    formatter: function(item, value, cell) {
                        // Wipe out any content wrapper DOM nodes in the cell
                        domConstruct.empty(cell);
                        // Create progress bar and add appropriate cell class
                        var progressBarValue;
                        if(item.scanEndCommit === 0){
                            progressBarValue = 100;
                        }
                        else {
                            progressBarValue = (item.newestScannedCommit / item.scanEndCommit) * 100;
                        }
                        domClass.add(cell, "progressCell");
                        var progressBar = new ProgressBar({
                            value: progressBarValue
                        });
                        progressBar.placeAt(cell);

                        // Hack to set the cell's height so the progress bar takes up 100% of it
                        setTimeout(function() {
                            var box = domGeometry.getContentBox(cell);
                            domStyle.set(cell, "height", box.h+"px");
                        }, 0);
                    }
                }];
    
                this.grid = new TreeTable({
                    url: gridRestUrl,
                    noDataMessage: i18n("No Entries Found."),
                    serverSideProcessing: false,
                    orderField: "displayName",
                    hidePagination: false, 
                    hideExpandCollapse: true,
                    columns: gridLayout
                });
                this.grid.placeAt(this.gridAttach);
            }
        }
    );
});

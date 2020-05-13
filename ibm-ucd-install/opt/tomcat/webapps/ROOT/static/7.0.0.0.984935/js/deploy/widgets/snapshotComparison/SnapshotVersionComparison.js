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
        "deploy/widgets/Formatters",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        Formatters,
        TreeTable
) {
    return declare('deploy.widgets.snapshotComparison.SnapshotVersionComparison',  [_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="snapshotVersionComparison" style="width: 700px">' + 
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',

        /**
         * 
         */
        postCreate: function() {
            this.inherited(arguments);

            var gridLayout = [{
                name: i18n("Component"),
                formatter: function(item) {
                    return Formatters.componentLinkFormatter(item.component);
                }
            },{
                name: i18n("Version"),
                formatter: function(item) {
                    return Formatters.versionLinkFormatter(item);
                }
            },{
                name: this.snapshot1.name,  //gets escaped by table widget
                style: {
                    paddingTop: "2px",
                    paddingBottom: "3px",
                    textAlign: "center"
                },
                formatter: function(item) {
                    var result = "";
                    if (item.snapshot1) {
                        result = document.createElement("img");
                        result.src = bootstrap.webextUrl+"images/webext/icons/icon_check_green.png";
                    }
                    return result;
                }
            },{
                name: this.snapshot2.name,
                style: {
                    paddingTop: "2px",
                    paddingBottom: "3px",
                    textAlign: "center"
                },
                formatter: function(item) {
                    var result = "";
                    if (item.snapshot2) {
                        result = document.createElement("img");
                        result.src = bootstrap.webextUrl+"images/webext/icons/icon_check_green.png";
                    }
                    return result;
                }
            }];

            var gridRestUrl = bootstrap.restUrl+"deploy/snapshot/"+this.snapshot1.id+"/compareVersions/"+this.snapshot2.id;
            this.grid = new TreeTable({
                url: gridRestUrl,
                serverSideProcessing: false,
                columns: gridLayout,
                tableConfigKey: "snapshotVersionComparisonList",
                noDataMessage: i18n("No versions found for either snapshot.")
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

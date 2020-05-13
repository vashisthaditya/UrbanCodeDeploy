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
        "dojo/dom-class",
        "dojo/_base/declare",
        "dojo/dom-construct",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        domClass,
        declare,
        domConstruct,
        TreeTable
) {
    /**
     *
     */
    return declare('deploy.widgets.snapshotComparison.SnapshotZOSFileTable', [_Widget, _TemplatedMixin], {
        templateString:
            '<div>'+
            '<div class="containerLabel" data-dojo-attach-point="labelAttach"></div>'+
            '<div class="innerContainer">'+
                '<div data-dojo-attach-point="gridAttach"></div>'+
            '</div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            this.labelAttach.innerHTML = i18n("Data Set and File Difference Report for %s", this.componentName.escape());
            var gridLayout = this.createZOSFileCompareTableLayOut(this.snapshotName, this.otherSnapshotName);
            this.grid = new TreeTable({
                data: this.artifacts,
                serverSideProcessing: false,
                noDataMessage: i18n("No difference between the two snapshots"),
                columns: gridLayout,
                orderField: "name",
                hidePagination: false,
                hideFooterLinks: true,
                hideExpandCollapse: true
              });
            this.grid.placeAt(this.gridAttach);
        },

        /**
        *
        */
        createZOSFileCompareTableLayOut: function(snapshotName, otherSnapshotName) {
            var layout = [    {
                name: i18n("Name"),
                field: "name",
                orderField: "name",
                getRawValue: function(item) {
                    return item.name;
                }
            },
            {
                name: i18n("Artifact Type"),
                field: "artifactType",
                formatter: function(item, value) {
                    return "["+value+"]";
                }
            },
            {
                name: i18n("Snapshot: %s(Versions)", snapshotName),
                field: "versions1",
                getRawValue: function(item) {
                    return item.versions1;
                }
            },
            {
                name: i18n("Snapshot: %s(Versions)", otherSnapshotName),
                field: "versions2",
                getRawValue: function(item) {
                    return item.versions2;
                }
            }];

            return layout;
        },

        /**
         *
         */
        destroy: function () {
            this.inherited(arguments);
            this.grid.destroy();
        }
    });
});

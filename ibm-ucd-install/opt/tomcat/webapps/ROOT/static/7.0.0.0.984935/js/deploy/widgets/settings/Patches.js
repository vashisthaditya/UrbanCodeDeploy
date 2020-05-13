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
        "dojo/dom-style",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        domStyle,
        TreeTable
) {
    return declare('deploy.widgets.settings.Patches',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="logging">'+
            '  <div data-dojo-attach-point="gridAttach"></div>'+
            '  <div data-dojo-attach-point="jsPatchTitleAttach" class="containerLabel"></div>' +
            '  <div data-dojo-attach-point="jsPatchGridAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            this.existingValues = {};
            if (this.version) {
                this.existingValues = this.version;
            }

            var gridLayout = [{
               name: i18n("Name"),
               field: "name"
            },{
               name: i18n("Last Modified"),
               field: "time",
               formatter: util.tableDateFormatter
            }];
            this.grid = new TreeTable({
                url: bootstrap.restUrl+"system/configuration/patches",
                serverSideProcessing: false,
                noDataMessage: i18n("No patches have been installed on your server"),
                tableConfigKey: "patches",
                hidePagination:true,
                columns: gridLayout
            });

            this.grid.placeAt(this.gridAttach);

/*            this.jsPatchTitleAttach.innerHTML = i18n("Javascript Patches");
            domStyle.set(this.jsPatchTitleAttach, {
                "padding-left": "5px"
            });
            var columnLabels = [{
               name: i18n("Name"),
               field: "name"
            },{
               name: i18n("Last Modified"),
               field: "modified"
            }];
            var javascriptItems = [{
                name: "ucd-6.2.4.1-party-parrots-removed",
                modified: "25 October 2017"
            }];
            this.jsPatchGrid = new TreeTable({
                data: javascriptItems,
                columns: columnLabels,
                hideExpandCollapse: true,
                hideFooterLinks: true
            })
            this.jsPatchGrid.placeAt(this.jsPatchGridAttach);*/
        }
    });
});
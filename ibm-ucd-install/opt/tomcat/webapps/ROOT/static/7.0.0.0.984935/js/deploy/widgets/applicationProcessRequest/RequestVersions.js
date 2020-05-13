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
        "js/webext/widgets/table/TreeTable",
        "dojo/_base/xhr"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        Formatters,
        Table,
        baseXhr
) {
    /**
     *
     */
    return declare('deploy.widgets.applicationProcessRequest.RequestVersions',  [_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="requestVersions">' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            
            var gridRestUrl = bootstrap.restUrl+"deploy/applicationProcessRequest/"+appState.applicationProcessRequest.id+"/versions";
            var self = this;
            
            var gridLayout = [{
                name: i18n("Component"),
                formatter: function(item) {
                    return Formatters.componentLinkFormatter(item.component);
                }
            },{
                name: i18n("Version for Request"),
                formatter: Formatters.versionLinkFormatter
            },{
                name: i18n("Role"),
                formatter: function(item, value, cell) {
                    return Formatters.resourceRoleFormatter(item.role, value, cell);
                }
            },{
                name: i18n("Type"),
                formatter: this.typeFormatter
            },{
                name: i18n("Description"),
                field: "description"
            }];

            baseXhr.get({
                url: gridRestUrl,
                handleAs: "json",
                load: function(data) {
                    self.grid = new Table({
                        url: gridRestUrl,
                        serverSideProcessing: false,
                        data: data.versions,
                        columns: gridLayout,
                        tableConfigKey: "componentVersionRequestList",
                        noDataMessage: i18n("No component versions found."),
                        hideExpandCollapse: true,
                        hidePagination: false
                    });
                    self.grid.placeAt(self.gridAttach);
                    if (data.futureRequest) {
                        dojo.byId("versionWarning").innerHTML = i18n("* These versions may change before the process executes.");
                    }
                }
            });
        },

        /**
         * 
         */
        destroy: function() {
            this.inherited(arguments);
            this.grid.destroy();
        },
        
        /**
         * 
         */
        typeFormatter: function(item) {
            var result = "";
            if (item.type === "FULL") {
                result = i18n("Full");
            }
            else if (item.type === "INCREMENTAL") {
                result = i18n("Incremental");
            }

            return result;
        },

        /**
         * 
         */
        componentLinkFormatter: function(item) {
            return Formatters.componentLinkFormatter(item.component);
        }
    });
});
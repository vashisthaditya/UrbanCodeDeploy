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
        Table
) {
    /**
     *
     */
    return declare('deploy.widgets.applicationProcessRequest.RequestResourceChanges',  [_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="requestResourceChanges">' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            
            var gridLayout = [{
                name: "&nbsp;",
                orderField: "changeType",
                getRawValue: function(item) {
                    return item.type;
                },
                style: {
                    paddingTop: "2px",
                    paddingBottom: "3px",
                    textAlign: "center",
                    width: "20px"
                },
                formatter: function(item) {
                    var result = document.createElement("img");
                    if (item.type === "ADDED") {
                        result.src = bootstrap.webextUrl+"images/webext/icons/icon_plus.gif";
                    }
                    else {
                        result.src = bootstrap.webextUrl+"images/webext/icons/icon_minus.gif";
                    }
                    return result;
                }
            },{
                name: i18n("Resource"),
                orderField: "resource",
                getRawValue: function(item) {
                    var result = null;
                    var resource = item.resourceInventoryEntry.resource;
                    if (resource) {
                        result = resource.name;
                    }
                    return result;
                },
                formatter: function(item) {
                    return Formatters.resourcePathFormatter(
                            item.resourceInventoryEntry.resource);
                }
            },{
                name: i18n("Component"),
                orderField: "component",
                getRawValue: function(item) {
                    var result = null;
                    var component = item.resourceInventoryEntry.component;
                    if (component) {
                        result = component.name;
                    }
                    return result;
                },
                formatter: function(item) {
                    return Formatters.componentLinkFormatter(
                            item.resourceInventoryEntry.component);
                }
            },{
                name: i18n("Version"),
                orderField: "version",
                getRawValue: function(item) {
                    var result = null;
                    var version = item.resourceInventoryEntry.version;
                    if (version) {
                        result = version.name;
                    }
                    return result;
                },
                formatter: function(item) {
                    return Formatters.versionLinkFormatter(
                            item.resourceInventoryEntry.version);
                }
            },{
                name: i18n("Date"),
                orderField: "date",
                getRawValue: function(item) {
                    return new Date(item.resourceInventoryEntry.date);
                },
                formatter: function(item) {
                    return util.tableDateFormatter(item, item.resourceInventoryEntry.date);
                }
            },{
                name: i18n("Actions"),
                formatter: function(item) {
                    var result = document.createElement("a");
                    result.innerHTML = i18n("Details");
                    result.href = "#childComponentProcess/"+appState.applicationProcessRequest.id+"/"+item.activityTraceId+"/"+item.workflowTraceId;
                    return result;
                }
            }];

            var gridRestUrl = bootstrap.restUrl+"deploy/applicationProcessRequest/"+appState.applicationProcessRequest.id+"/changes";
            this.grid = new Table({
                url: gridRestUrl,
                serverSideProcessing: false,
                columns: gridLayout,
                tableConfigKey: "requestResourceChangeList",
                noDataMessage: i18n("No component version found."),
                hideExpandCollapse: true,
                hidePagination: false
            });
            this.grid.placeAt(this.gridAttach);
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
            if (item.type === "INSTALL") {
                result = i18n("Installed");
            }
            else if (item.type === "UNINSTALL") {
                result = i18n("Uninstalled");
            }

            return result;
        }
    });
});
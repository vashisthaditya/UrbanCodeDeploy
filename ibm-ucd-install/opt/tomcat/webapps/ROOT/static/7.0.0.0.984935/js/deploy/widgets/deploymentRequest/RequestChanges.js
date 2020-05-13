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
    return declare('deploy.widgets.deploymentRequest.RequestChanges',  [_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="requestChanges" style="width: 700px">' +
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
                name: i18n("Environment"),
                orderField: "environment",
                getRawValue: function(item) {
                    var result = null;
                    var environment = item.deploymentRequest.rootRequest.environment;
                    if (environment) {
                        result = environment.name;
                    }
                    return result;
                },
                formatter: function(item) {
                    return Formatters.environmentLinkFormatter(
                            item.deploymentRequest.rootRequest.environment);
                }
            },{
                name: i18n("Snapshot"),
                orderField: "snapshot",
                getRawValue: function(item) {
                    var result = null;
                    var snapshot = item.deploymentRequest.rootRequest.snapshot;
                    if (snapshot) {
                        result = snapshot.name;
                    }
                    return result;
                },
                formatter: function(item) {
                    return Formatters.snapshotLinkFormatter(
                            item.deploymentRequest.rootRequest.snapshot);
                }
            },{
                name: i18n("Component"),
                orderField: "component",
                getRawValue: function(item) {
                    var result = null;
                    var component = item.deploymentRequest.rootRequest.component;
                    if (component) {
                        result = component.name;
                    }
                    return result;
                },
                formatter: function(item) {
                    return Formatters.componentLinkFormatter(
                            item.deploymentRequest.rootRequest.component);
                }
            },{
                name: i18n("Version"),
                orderField: "version",
                getRawValue: function(item) {
                    var result = null;
                    var version = item.deploymentRequest.rootRequest.version;
                    if (version) {
                        result = version.name;
                    }
                    return result;
                },
                formatter: function(item) {
                    return Formatters.versionLinkFormatter(
                            item.deploymentRequest.rootRequest.version);
                }
            }];

            var gridRestUrl = bootstrap.restUrl+"deploy/deploymentRequest/"+appState.deploymentRequest.id+"/changes";
            this.grid = new Table({
                url: gridRestUrl,
                serverSideProcessing: false,
                hidePagination: true,
                hideExpandCollapse: true,
                columns: gridLayout,
                tableConfigKey: "deploymentRequestChange",
                noDataMessage: i18n("No changes found.")
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
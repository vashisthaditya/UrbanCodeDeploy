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
        "dojo/_base/xhr",
        "dojo/dom-construct",
        "dojo/on",
        "dojo/_base/array",
        "deploy/widgets/Formatters",
        "deploy/widgets/log/LiveLogViewer",
        "deploy/widgets/resource/TransientResourceCompareTree",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        xhr,
        domConstruct,
        on,
        array,
        Formatters,
        LiveLogViewer,
        TransientResourceCompareTree,
        Dialog,
        TreeTable
) {
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="resourceConfigurationExecutionList">' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            var gridLayout = [{
                name: i18n("Command"),
                formatter: function(item) {
                    return i18n(item.command.name).escape();
                }
            },{
                name: i18n("Type"),
                formatter: function(item) {
                    var result = "";
                    if (item.actionType) {
                        if (item.actionType === "COMPARE") {
                            result = i18n("Comparison");
                        }
                        if (item.actionType === "CONFIGURE") {
                            result = i18n("Configuration");
                        }
                        if (item.actionType === "APPLY") {
                            result = i18n("Apply ");
                        }
                    }
                    return result;
                }
            },{
                name: i18n("Start"),
                formatter: function(item) {
                    return util.dateFormatShort(item.startTime);
                }
            },{
                name: i18n("End"),
                formatter: function(item) {
                    if (item.endTime !== 0){
                        return util.dateFormatShort(item.endTime);
                    }
                }
            },{
                name: i18n("Status"),
                formatter: function(item, value, cell) {
                    var result = Formatters.sourceConfigStatusFormatter(item, value, cell);
                    return result;
                }
            },{
                name: i18n("Actions"),
                formatter: function(item) {
                    var activityActionsCell = domConstruct.create("div");

                    var outLogLink = domConstruct.create("a", {
                        "class": "linkPointer"
                    }, activityActionsCell);
                    on(outLogLink, "click", function() {
                        var logViewer = new LiveLogViewer({
                            url: bootstrap.restUrl+"logView/resourceDiscovery/"+item.id+"/stdOut.txt",
                            title: i18n("Output Log"),
                            autoRefresh: item.status === "EXECUTING",
                            paddingTop: "0px"
                        });
                        logViewer.show();
                    });

                    var outLogImage = domConstruct.create("div", {
                        className: "general-icon consoleIcon inline-block",
                        title: i18n("Output Log")
                    }, outLogLink);
                    
                    array.forEach(item.extraFiles, function(fileName) {
                        var extLogLink = domConstruct.create("a", {
                            "class":"linkPointer"
                        }, activityActionsCell);

                        on(extLogLink, "click", function() {
                          var logViewer = new LiveLogViewer({
                              url: bootstrap.restUrl+"logView/resourceDiscovery/"+item.id+"/" + fileName,
                              title: fileName,
                              autoRefresh: item.status === "EXECUTING",
                              paddingTop: "0px"
                          });
                          logViewer.show();
                        });
                        
                        var extLogImage = domConstruct.create("div", {
                            className: "general-icon extraLogIcon inline-block",
                            title: fileName 
                        }, extLogLink);
                    });


                    if (item.compareAllowed) {
                        var compareLink = domConstruct.create("a", {
                            "class": "linkPointer"
                        }, activityActionsCell);
                        on(compareLink, "click", function() {
                            var dialog = new Dialog({
                                title: i18n("Compare with Live Cell"),
                                closable: true,
                                draggable: false,
                                width: -50
                            });
    
                            var resourceCompareTree = new TransientResourceCompareTree({
                                readOnly: true,
                                url: bootstrap.restUrl + "resource/resource/transientCompare/" + appState.resource.id + "/" + item.id
                            });
                            resourceCompareTree.placeAt(dialog.containerNode);
                            dialog.show();
                        });

                        var compare = domConstruct.create("div", {
                            className: "general-icon compareIcon inline-block",
                            title: i18n("Compare")
                        }, compareLink);
                    }

                    return activityActionsCell;
                }
            }];

            var gridRestUrl = bootstrap.restUrl+"resource/resourceDiscoveryExecution";
            this.grid = new TreeTable({
                url: gridRestUrl,
                baseFilters: [{
                    name: "resource.id",
                    type: "eq",
                    className: "UUID",
                    values: [appState.resource.id]
                }],
                columns: gridLayout,
                orderField: "startTime",
                sortType: "desc",
                tableConfigKey: "resourceConfigurationHistory",
                noDataMessage: i18n("No configuration task history found for this resource."),
                hideExpandCollapse: true,
                hidePagination: false,
                queryData: {outputType: ["BASIC", "LINKED"]}
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
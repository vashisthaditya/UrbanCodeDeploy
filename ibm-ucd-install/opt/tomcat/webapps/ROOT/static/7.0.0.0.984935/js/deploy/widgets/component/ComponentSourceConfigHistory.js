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
        "dojo/_base/array",
        "dojo/dom-construct",
        "dojo/on",
        "deploy/widgets/Formatters",
        "deploy/widgets/log/LiveLogViewer",
        "js/webext/widgets/table/TreeTable",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/Alert"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        xhr,
        array,
        domConstruct,
        on,
        Formatters,
        LiveLogViewer,
        TreeTable,
        Dialog,
        Alert
) {
    return declare([_Widget, _TemplatedMixin], {
        showComponentField: false,
        oldestFirst: false,

        templateString:
            '<div class="componentSourceConfigHistory">' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            var gridLayout = [{
                name: i18n("Import Type"),
                formatter: function(item) {
                    return i18n(item.taskInfo);
                }
            },{
                name: i18n("Agent"),
                formatter: function(item) {
                    return Formatters.agentLinkFormatter(item.agent);
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

                    if (item.status !== "WAITING") {
                        var outLogLink = domConstruct.create("a", {
                            "class": "linkPointer"
                        }, activityActionsCell);
                        on(outLogLink, "click", function() {
                            var logViewer = new LiveLogViewer({
                                url: bootstrap.restUrl+"logView/sourceConfigExecution/"+item.id+"/stdOut.txt",
                                completedUrl: bootstrap.restUrl + "sourceConfigExecutionRecord/"
                                    + item.id + "/completed",
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

                        if (item.errorLogExists) {
                            var errLogLink = domConstruct.create("a", {
                                "class": "linkPointer"
                            }, activityActionsCell);
                            on(errLogLink, "click", function() {
                                var logViewer = new LiveLogViewer({
                                    url: bootstrap.restUrl+"logView/sourceConfigExecution/"+item.id+"/log.txt",
                                    completedUrl: bootstrap.restUrl + "sourceConfigExecutionRecord/"
                                            + item.id + "/completed",
                                    title: i18n("Error Log"),
                                    autoRefresh: item.status === "EXECUTING"
                                });
                                logViewer.show();
                            });

                            var errLogImage = domConstruct.create("div", {
                                className: "general-icon pageIconRed inline-block",
                                title: i18n("Error Log")
                            }, errLogLink);
                        }

                        var propertiesDialogLink = domConstruct.create("a", {
                            "class": "linkPointer"
                        }, activityActionsCell);
                        on(propertiesDialogLink, "click", function() {
                            self.showPropertiesDialog(item);
                        });

                        var propertiesDialogImage = domConstruct.create("div", {
                            className: "general-icon pageIcon inline-block",
                            title: i18n("Input Properties")
                        }, propertiesDialogLink);

                    }

                    if (item.status === "EXECUTING" || item.status === "WAITING") {
                        var cancelLink = domConstruct.create("a", {
                            "class": "linkPointer",
                            "innerHTML": i18n("Cancel"),
                            "style" : {"paddingLeft": "10px"}
                        }, activityActionsCell);
                        on(cancelLink, "click", function() {
                            xhr.put({
                                url: bootstrap.restUrl+"sourceConfigExecutionRecord/" + item.id + "/cancel",
                                handleAs: "json",
                                load: function(response) {
                                    self.refresh();
                                },
                                error: function(error) {
                                    var alert = new Alert({
                                        message: util.escape(error.responseText)
                                    });
                                    self.refresh();
                                }
                            });
                        });
                    }

                    return activityActionsCell;
                }
            }];

            if (this.showComponentField) {
                gridLayout.unshift({
                    name: i18n("Component"),
                    formatter: function(item) {
                        var result = Formatters.componentLinkFormatter(item.component);
                        return result;
                    }
                });
            }

            if (!self.gridRestUrl) {
                self.gridRestUrl = bootstrap.restUrl+"sourceConfigExecutionRecord/" + appState.component.id + "/table";
            }
            if (!self.tableConfigKey) {
                self.tableConfigKey = "componentSourceConfigHistory"+appState.component.id;
            }

            this.grid = new TreeTable({
                url: self.gridRestUrl,
                columns: gridLayout,
                serverSideProcessing: true,
                orderField: "startTime",
                sortType: this.oldestFirst ? "asc" : "desc",
                tableConfigKey: self.tableConfigKey,
                noDataMessage: i18n("No executing version imports found."),
                hidePagination: false,
                hideExpandCollapse: true
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
        showPropertiesDialog: function(item) {
            var self = this;
            var itemId = item.id;
            var propertiesDialog = new Dialog();

            var inputContainer = document.createElement("div");

            var currentViewSpan = document.createElement("span");
            currentViewSpan.innerHTML = i18n("Input Properties");

            var containerLabelDiv = document.createElement("div");
            containerLabelDiv.className = "containerLabel";
            containerLabelDiv.appendChild(currentViewSpan);

            var innerContainerDiv = document.createElement("div");
            innerContainerDiv.className = "innerContainer";

            innerContainerDiv.appendChild(inputContainer);

            var propertiesDialogScroller = document.createElement("div");
            propertiesDialogScroller.style.maxWidth = "700px";
            propertiesDialogScroller.style.maxHeight = "500px";
            propertiesDialogScroller.style.overflow = "auto";

            propertiesDialogScroller.appendChild(containerLabelDiv);
            propertiesDialogScroller.appendChild(innerContainerDiv);

            propertiesDialog.containerNode.appendChild(propertiesDialogScroller);

            propertiesDialog.show();

            xhr.get({
                url: bootstrap.restUrl+"sourceConfigExecutionRecord/" + item.id + "/properties",
                handleAs: "json",
                load: function(props) {
                    if (props) {
                        var inputPropertiesTable = new TreeTable({
                            data: props,
                            serverSideProcessing: false,
                            columns: [{
                                name: i18n("Name"),
                                field: "name"
                            },{
                                name: i18n("Value"),
                                field: "value",
                                formatter: function(item, value) {
                                    var result = domConstruct.create("div");
                                    if (value) {
                                        array.forEach(value.split("\n"), function(line) {
                                            domConstruct.create("div", {
                                                innerHTML: line.escape()
                                            }, result);
                                        });
                                    }
                                    return result;
                                }
                            }],
                            hidePagination: true,
                            hideExpandCollapse: true,
                            hideFooter: true
                        });
                        inputPropertiesTable.placeAt(inputContainer);
                    }
                }
            });
        },

        /**
         *
         */
        refresh: function() {
            this.grid.refresh();
        }
    });
});
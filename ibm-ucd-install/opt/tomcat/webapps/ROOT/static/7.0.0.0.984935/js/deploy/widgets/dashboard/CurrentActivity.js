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
        "dojo/aspect",
        "dojo/dom-construct",
        "dojo/on",
        "dojo/_base/xhr",
        "js/webext/widgets/table/TreeTable",
        "js/webext/widgets/Alert",
        "js/webext/widgets/GenericConfirm",
        "deploy/widgets/Formatters"
        ],
function(
        declare,
        _Widget,
        _TemplatedMixin,
        aspect,
        domConstruct,
        on,
        xhr,
        TreeTable,
        Alert,
        GenericConfirm,
        Formatters
) {
/**
 * Supported properties:
 *  activityCountNode:          A DOM node where the table will insert the number of records shown
 */
    return declare(
        [_Widget, _TemplatedMixin],
        {
            templateString: 
                '<div class="currentActivity with-description-text">' +
                    '<div data-dojo-attach-point="gridAttach"></div>' +
                '</div>',
    
            /**
             *
             */
            postCreate: function() {
                this.inherited(arguments);
                var self = this;
                
                var gridRestUrl = bootstrap.restUrl+"workflow/currentActivity";
                var gridLayout = [{
                    name: i18n("Type"),
                    formatter: function(item) {
                        var result = "";
                        if (item.processRequestType === "application") {
                            result = i18n("Application");
                        }
                        else if (item.processRequestType === "component") {
                            result = i18n("Component");
                        }
                        else if (item.processRequestType === "generic") {
                            result = i18n("Generic");
                        }
                        return result;
                    },
                    orderField: "type",
                    filterField: "status",
                    filterType: "select",
                    filterOptions: [{
                        label: i18n("Application"),
                        value: "Application"
                    },{
                        label: i18n("Component"),
                        value: "Component"
                    },{
                        label: i18n("Generic"),
                        value: "Generic"
                    }],
                    getRawValue: function(item) {
                        var result = "";
                        if (item.processRequestType === "application") {
                            result = i18n("Application");
                        }
                        else if (item.processRequestType === "component") {
                            result = i18n("Component");
                        }
                        else if (item.processRequestType === "generic") {
                            result = i18n("Generic");
                        }
                        return result;
                    }
                },{
                    name: i18n("Component, Application, or Generic"),
                    formatter: function(item) {
                        var result = "";
                        
                        if (item.processRequestType === "application") {
                            result = Formatters.applicationLinkFormatter(item.application);
                        }
                        else if (item.processRequestType === "component") {
                            result = Formatters.componentLinkFormatter(item.component);
                        }
                        else if (item.processRequestType === "generic") {
                            result = Formatters.genericProcessLinkFormatter(item.process);
                        }
    
                        return result;
                    },
                    orderField: "componentApplication",
                    filterField: "componentApplication",
                    filterType: "text",
                    getRawValue: function(item) {
                        var result = "";
                        
                        if (item.processRequestType === "application") {
                            result = item.application.name;
                        }
                        else if (item.processRequestType === "component") {
                            result = item.component.name;
                        }
                        else if (item.processRequestType === "generic") {
                            result = item.process.name;
                        }
                        return result;
                    }
                },{
                    name: i18n("Resource or Environment"),
                    formatter: function(item) {
                        var result = "";
                        
                        if (item.processRequestType === "application") {
                            result = Formatters.environmentLinkFormatter(item.environment);
                        }
                        else if (item.processRequestType === "component" || item.processRequestType === "generic") {
                            result = Formatters.resourcePathFormatter(item.resource);
                        }
    
                        return result;
                    },
                    orderField: "resourceEnvironment",
                    filterField: "resourceEnvironment",
                    filterType: "text",
                    getRawValue: function(item) {
                        var result = "";
                        
                        if (item.processRequestType === "application") {
                            result = item.environment.name;
                        }
                        else if (item.processRequestType === "component" || item.processRequestType === "generic") {
                            result = item.resource.name;
                        }
                        return result;
                    }
                },{
                    name: i18n("Process"),
                    formatter: function(item) {
                        var result = "";
                        
                        if (item.processRequestType === "application") {
                            result = Formatters.applicationProcessLinkFormatter(item.applicationProcess);
                        }
                        else if (item.processRequestType === "component") {
                            result = Formatters.componentProcessLinkFormatter(item.componentProcess);
                        }
                        else if (item.processRequestType === "generic") {
                            result = Formatters.genericProcessLinkFormatter(item.process);
                        }
    
                        return result;
                    },
                    orderField: "process",
                    filterField: "process",
                    filterType: "text",
                    getRawValue: function(item) {
                        var result = "";
                        
                        if (item.processRequestType === "application") {
                            result = item.applicationProcess.name;
                        }
                        else if (item.processRequestType === "component") {
                            result = item.componentProcess.name;
                        }
                        else if (item.processRequestType === "generic") {
                            result = item.process.name;
                        }
                        return result;
                    }
                },{
                    name: i18n("Started On"),
                    field: "startTime",
                    formatter: util.tableDateFormatter,
                    orderField: "startTime",
                    getRawValue: function(item) {
                        return new Date(item.startTime);
                    }
                },{
                    name: i18n("By"),
                    field: "userName",
                    orderField: "userName"
                },{
                    name: i18n("Status"),
                    formatter: function(item, value, cell) {
                        return Formatters.activityStatusFormatter(item, value, cell);
                    }
                },{
                    name: i18n("Actions"),
                    parentWidget: this,
                    formatter: this.actionsFormatter
                }];
    
                this.grid = new TreeTable({
                    url: gridRestUrl,
                    serverSideProcessing: false,
                    hideFooter: false,
                    hidePagination: true,
                    noDataMessage: i18n("No activity found."),
                    tableConfigKey: "currentActivity",
                    orderField: "startDate",
                    sortType: "desc",
                    columns: gridLayout,
                    getChildUrl: function(item) {
                        return bootstrap.restUrl+"workflow/currentActivity?parentRequestId="+item.id;
                    },
                    hasChildren: function(item) {
                        return (item.processRequestType === "application");
                    }
                });
                this.grid.placeAt(this.gridAttach);
                
                // Whenever we load table data, show the total number of top-level workflows in the
                // provided activityCountNode
                aspect.after(this.grid, "showTable", function(tableData) {
                    if (self.activityCountNode) {
                        self.activityCountNode.innerHTML = "("+tableData.length+")";
                    }
                }, true);
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
            actionsFormatter: function(item, value, cell) {
                var result = document.createElement("div");
                
                var self = this.parentWidget;
                
                if (item.processRequestType === "component") {
                    domConstruct.create("a", {
                        "href": "#componentProcessRequest/"+item.id,
                        "innerHTML": i18n("Details"),
                        "class": "actionsLink"
                    }, result);
                }
                else if (item.processRequestType === "application") {
                    domConstruct.create("a", {
                        "href": "#applicationProcessRequest/"+item.id,
                        "innerHTML": i18n("Details"),
                        "class": "actionsLink"
                    }, result);
                }
                else if (item.processRequestType === "generic") {
                    domConstruct.create("a", {
                       "href": "#processRequest/"+item.id,
                       "innerHTML": i18n("Details"),
                       "class": "actionsLink"
                    }, result);
                }

                if (item.executable) {
                    if (item.paused) {
                        var resumeLink = domConstruct.create("a", {
                            "innerHTML": i18n("Resume"),
                            "class": "actionsLink linkPointer"
                        }, result);
                        on(resumeLink, "click", function() {
                            self.grid.block();
                            xhr.put({
                                url: bootstrap.restUrl+"workflow/"+(item.traceId || item.workflowTraceId)+"/resume",
                                handleAs: "json",
                                load: function() {
                                    self.grid.unblock();
                                    self.grid.refresh();
                                },
                                error: function(data) {
                                    var errorAlert = new Alert({
                                        message: i18n("Could not resume the process.")
                                    });
                                    self.grid.unblock();
                                    self.grid.refresh();
                                }
                            });
                        });
                    }
                    else {
                        var pauseLink = domConstruct.create("a", {
                            "innerHTML": i18n("Pause"),
                            "class": "actionsLink linkPointer"
                        }, result);
                        on(pauseLink, "click", function() {
                            self.grid.block();
                            xhr.put({
                                url: bootstrap.restUrl+"workflow/"+(item.traceId || item.workflowTraceId)+"/pause",
                                handleAs: "json",
                                load: function() {
                                    self.grid.unblock();
                                    self.grid.refresh();
                                },
                                error: function(data) {
                                    var errorAlert = new Alert({
                                        message: i18n("Could not pause the process.")
                                    });
                                    self.grid.unblock();
                                    self.grid.refresh();
                                }
                            });
                        });
                    }

                    if (item.state === "EXECUTING") {
                        var cancelLink = domConstruct.create("a", {
                            "innerHTML": i18n("Cancel"),
                            "class": "actionsLink linkPointer"
                        }, result);
                        on(cancelLink, "click", function() {
                            var confirm = new GenericConfirm({
                                message: i18n("Are you sure you want to cancel this process request?"),
                                action: function() {
                                    self.grid.block();
                                    xhr.put({
                                        url: bootstrap.restUrl+"workflow/"+(item.traceId || item.workflowTraceId)+"/cancel",
                                        handleAs: "json",
                                        load: function() {
                                            self.grid.unblock();
                                            self.grid.refresh();
                                        },
                                        error: function(data) {
                                            var errorAlert = new Alert({
                                                message: i18n("Could not cancel the process.")
                                            });
                                            self.grid.unblock();
                                            self.grid.refresh();
                                        }
                                    });
                                }
                            });
                        });
                    }
                }
    
                return result;
            }
        }
    );
});
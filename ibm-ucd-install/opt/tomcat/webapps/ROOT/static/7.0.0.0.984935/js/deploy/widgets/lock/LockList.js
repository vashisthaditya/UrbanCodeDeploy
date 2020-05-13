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
        "deploy/widgets/Formatters",
        "js/webext/widgets/Alert",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        xhr,
        domConstruct,
        on,
        Formatters,
        Alert,
        GenericConfirm,
        TreeTable
) {
    /**
     *
     */
    return declare('deploy.widgets.lock.LockList',  [_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="lockList">' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            var gridRestUrl = bootstrap.restUrl+"lock/lock";
            var gridLayout = [{
                name: i18n("Name"),
                formatter: function(item) {
                    return item.lockName;
                },
                orderField: "name",
                filterField: "name",
                filterType: "text",
                getRawValue: function(item) {
                    return item.lockName;
                }
            },{
                name: i18n("Type"),
                formatter: function(item) {
                    var result = "";
                    
                    if (item.applicationProcessRequest) {
                        result = i18n("Application");
                    }
                    else if (item.componentProcessRequest) {
                        result = i18n("Component");
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
                }],
                getRawValue: function(item) {
                    var result = "";
                    
                    if (item.applicationProcessRequest) {
                        result = i18n("Application");
                    }
                    else if (item.componentProcessRequest) {
                        result = i18n("Component");
                    }
                    return result;
                }
            },{
                name: i18n("Component/Application"),
                formatter: function(item) {
                    var result = "";
                    
                    if (item.applicationProcessRequest) {
                        result = Formatters.applicationLinkFormatter(item.applicationProcessRequest.application);
                    }
                    else if (item.componentProcessRequest) {
                        result = Formatters.componentLinkFormatter(item.componentProcessRequest.component);
                    }

                    return result;
                },
                orderField: "componentApplication",
                filterField: "componentApplication",
                filterType: "text",
                getRawValue: function(item) {
                    var result = "";
                    
                    if (item.applicationProcessRequest) {
                        result = item.applicationProcessRequest.application.name;
                    }
                    else if (item.componentProcessRequest) {
                        result = item.componentProcessRequest.component.name;
                    }
                    return result;
                }
            },{
                name: i18n("Resource/Environment"),
                formatter: function(item) {
                    var result = "";
                    
                    if (item.applicationProcessRequest) {
                        result = Formatters.environmentLinkFormatter(item.applicationProcessRequest.environment);
                    }
                    else if (item.componentProcessRequest) {
                        result = Formatters.resourcePathFormatter(item.componentProcessRequest.resource);
                    }

                    return result;
                },
                orderField: "resourceEnvironment",
                filterField: "resourceEnvironment",
                filterType: "text",
                getRawValue: function(item) {
                    var result = "";
                    
                    if (item.applicationProcessRequest) {
                        result = item.applicationProcessRequest.environment.name;
                    }
                    else if (item.componentProcessRequest) {
                        result = item.componentProcessRequest.resource.name;
                    }
                    return result;
                }
            },{
                name: i18n("Process"),
                formatter: function(item) {
                    var result = "";
                    
                    if (item.applicationProcessRequest) {
                        result = Formatters.applicationProcessLinkFormatter(item.applicationProcessRequest.applicationProcess);
                    }
                    else if (item.componentProcessRequest) {
                        result = Formatters.componentProcessLinkFormatter(item.componentProcessRequest.componentProcess);
                    }

                    return result;
                },
                orderField: "process",
                filterField: "process",
                filterType: "text",
                getRawValue: function(item) {
                    var result = "";
                    
                    if (item.applicationProcessRequest) {
                        result = item.applicationProcessRequest.applicationProcess.name;
                    }
                    else if (item.componentProcessRequest) {
                        result = item.componentProcessRequest.componentProcess.name;
                    }
                    return result;
                }
            },{
                name: i18n("Actions"),
                formatter: function(item) {
                    var result = domConstruct.create("div");
                    
                    var requestHref = "";
                    if (item.applicationProcessRequest) {
                        requestHref = "#applicationProcessRequest/"+item.applicationProcessRequest.id;
                    }
                    else if (item.componentProcessRequest) {
                        requestHref = "#componentProcessRequest/"+item.componentProcessRequest.id;
                    }
                    var requestLink = domConstruct.create("a", {
                        "innerHTML": i18n("View Request"),
                        "class": "actionsLink",
                        "href": requestHref
                    }, result);

                    if (config.data.permissions[security.system.releaseLocks]) {
                        var releaseLink = domConstruct.create("a", {
                            "innerHTML": i18n("Release"),
                            "class": "actionsLink linkPointer"
                        }, result);
                        on(releaseLink, "click", function() {
                            self.confirmRelease(item);
                        });
                    }
                    
                    return result;
                }
            }];

            this.grid = new TreeTable({
                url: gridRestUrl,
                serverSideProcessing: false,
                columns: gridLayout,
                tableConfigKey: "lockList",
                noDataMessage: i18n("No locks are currently in use."),
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
        confirmRelease: function(target) {
            var self = this;
            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to release this lock?"),
                action: function() {
                    self.grid.block();
                    xhr.del({
                        url: bootstrap.restUrl+"lock/lock/"+target.id,
                        handleAs: "json",
                        load: function(data) {
                            self.grid.unblock();
                            self.grid.refresh();
                        },
                        error: function(error) {
                            var alert = new Alert({
                                messages: [i18n("Error releasing lock:"),
                                           "",
                                           util.escape(error.responseText)]
                            });
                            self.grid.unblock();
                            self.grid.refresh();
                        }
                    });
                }
            });
        }
    });
});
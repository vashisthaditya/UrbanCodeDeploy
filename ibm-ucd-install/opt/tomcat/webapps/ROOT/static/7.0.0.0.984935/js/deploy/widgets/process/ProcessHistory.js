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
        "dijit/Tooltip",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/query",
        "dojo/dom-construct",
        "dojo/on",
        "dojo/topic",
        "deploy/widgets/Formatters",
        "js/webext/widgets/table/TreeTable",
        "js/webext/widgets/Alert"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Tooltip,
        declare,
        xhr,
        query,
        domConstruct,
        on,
        topic,
        Formatters,
        TreeTable,
        Alert
) {
    /**
     *
     */
    return declare('deploy.widgets.process.ProcessHistory',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="processHistory">' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;


            // make the dashboard tab the default tab in case
            // the design tab set it to the design tab
            var i;
            var processTabs;
            for (i = 0; i < config.data.tabSets.length; i++) {
                if (config.data.tabSets[i].id === "process") {
                    config.data.tabSets[i].defaultTab = "dashboard";
                    break;
                }
            }

            var gridRestUrl = bootstrap.restUrl+"process/request";
            var gridLayout = [{
                name: i18n("Process Version"),
                field: "processVersion",
                orderField: "processVersion",
                filterField: "processVersion",
                filterClass: "Integer",
                filterType: "textExact"
            },{
                name: i18n("Scheduled For"),
                formatter: function(item) {
                    return util.dateFormatShort(item.submittedTime);
                },
                orderField: "submittedTime"
            },{
                name: i18n("By"),
                field: "userName",
                orderField: "user.name",
                filterField: "user.name",
                filterType: "text"
            },{
                name: i18n("Status"),
                formatter: function(item, value, cell) {
                    var result = "";
                    if (item) {
                        result = Formatters.activityStatusFormatter(item, value, cell);
                    }
                    return result;
                }
            },{
                name: i18n("Actions"),
                formatter: function(item) {
                    var result = document.createElement("div");

                    domConstruct.create("a", {
                        "class": "actionsLink",
                        "innerHTML": i18n("View Request"),
                        "href": "#processRequest/"+item.id
                    }, result);

                    if (self.process.security.execute) {
                        if (item && item.state === "EXECUTING") {
                            if (item.paused) {
                                var resumeLink = domConstruct.create("a", {
                                    "innerHTML": i18n("Resume"),
                                    "class": "actionsLink linkPointer"
                                }, result);
                                on(resumeLink, "click", function() {
                                    self.grid.block();
                                    xhr.put({
                                        url: bootstrap.restUrl+"workflow/"+item.workflowTraceId+"/resume",
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
                                        url: bootstrap.restUrl+"workflow/"+item.workflowTraceId+"/pause",
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
                                });
                            }

                            var cancelLink = domConstruct.create("a", {
                                "innerHTML": i18n("Cancel"),
                                "class": "actionsLink linkPointer"
                            }, result);
                            on(cancelLink, "click", function() {
                                self.grid.block();
                                xhr.put({
                                    url: bootstrap.restUrl+"workflow/"+item.workflowTraceId+"/cancel",
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
                            });
                        }
                    }

                    return result;
                }
            }];

            topic.subscribe("navigationError", function(response, ioArgs){
                var splitURL = response.response.url.split("/");
                var triggeredID = splitURL[splitURL.length - 1];
                var attachNode = query("a[href*=\"" + triggeredID + "\"]")[0].parentNode;

                //make sure we don't place a second failure icon if another exists
                if (attachNode.children.length === 1){
                    var failureIcon = domConstruct.create("div", {
                        className: "general-icon failed-icon inlineBlock"
                    });

                    var helpTip = new Tooltip({
                        connectId: [failureIcon],
                        label: i18n(util.escape(response.responseText)),
                        showDelay: 100,
                        position: ["after", "above", "below", "before"]
                    });

                    domConstruct.place(failureIcon, attachNode);
                }
            });

            this.grid = new TreeTable({
                url: gridRestUrl,
                orderField: "submittedTime",
                sortType: "desc",
                columns: gridLayout,
                hidePagination: false,
                hideExpandCollapse: true,
                queryData: {
                    outputType: ["BASIC"]
                },
                baseFilters: [{
                    name: "processPath",
                    type: "eq",
                    values: [self.process.path]
                }]
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
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
        "dijit/form/Button",
        "dijit/form/CheckBox",
        "dijit/form/TextBox",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/_base/array",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/on",
        "deploy/widgets/Formatters",
        "deploy/widgets/agentPool/EditAgentPool",
        "js/webext/widgets/Alert",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/form/MenuButton",
        "js/webext/widgets/table/TreeTable",
        "dijit/Tooltip"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        CheckBox,
        TextBox,
        declare,
        xhr,
        array,
        domClass,
        domConstruct,
        on,
        Formatters,
        EditAgentPool,
        Alert,
        Dialog,
        GenericConfirm,
        MenuButton,
        TreeTable,
        Tooltip
) {
    /**
     *
     */
    return declare('deploy.widgets.agentPool.AgentRelayList',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="relay-list">'+
                '<div class="listTopButtons" data-dojo-attach-point="buttonAttach" style="position:relative; z-index=1;"></div>' +
                '<div data-dojo-attach-point="tableAttach"></div>'+
                '<div data-dojo-attach-point="activeBoxAttach" style="margin: 2px;"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            var gridRestUrl = bootstrap.restUrl+ "relay/";

            var requiredContainer = domConstruct.create("div", {
                className: "relay-version-container warning-state-color"
            }, this.buttonAttach);
            domConstruct.create("div", {
                innerHTML: i18n("Min. Required")
            }, requiredContainer);
            domConstruct.create("div", {
                innerHTML: config.data.systemConfiguration.relayMinimumRequiredVersion
            }, requiredContainer);

            var recommendedContainer = domConstruct.create("div", {
                className: "relay-version-container running-state-color"
            }, this.buttonAttach);
            domConstruct.create("div", {
                innerHTML: i18n("Min. Recommended")
            }, recommendedContainer);
            domConstruct.create("div", {
                innerHTML: config.data.systemConfiguration.relayMinimumRecommendedVersion
            }, recommendedContainer);

            self.largest = 0;

            this.getLargest(gridRestUrl, function(largest) {
                self.largest = largest;

                var gridLayout = [
                    self.getNameColumn(),
                    {
                        name: i18n("Description"),
                        field: "description"
                    },
                    {
                        name: i18n("Status"),
                        field: "status",
                        orderField:"status",
                        filterField:"status",
                        filterType:"select",
                        filterClass:"Enum",
                        filterOptions:[{
                            label: i18n("Online"),
                            value: "ONLINE"
                        },{
                            label: i18n("Offline"),
                            value: "OFFLINE"
                        }],
                        formatter: Formatters.agentStatusFormatter
                    },
                    {
                        name: i18n("Last Contact"),
                        field: "lastContact",
                        orderField:"lastContact",
                        filterField:"lastContact",
                        filterType:"date",
                        filterClass:"Long",
                        formatter: function(item) {
                            return util.dateFormatShort(item.lastContact);
                        }
                    },
                    {
                        name: i18n("Version"),
                        field: "version",
                        filterField:"relayVersion",
                        filterType:"text",
                        filterClass:"String",
                        orderField:"relayVersion"
                    }
                ];

                if(self.agent) {
                    gridLayout.push({
                        name: i18n("Host") + ':' + i18n("Port"),
                        formatter: function(item) {
                            return item.relayHostname + ':' + item.jmsPort;
                        }
                    });
                }

                gridLayout.push({
                    name: i18n("Agent Status"),
                    field: "activeAgents",
                    formatter: self.activeAgentsFormatter,
                    parentWidget: self
                });

                if(!self.agent) {
                    gridLayout.push({
                        name: i18n("Total Agents"),
                        field: "totalAgents",
                        formatter: self.agentsFormatter,
                        parentWidget: self
                    });
                }

                var tableObject = {
                    url: gridRestUrl,
                    serverSideProcessing: true,
                    orderField: "name",
                    selectorField: "id",
                    sortType: "asc",
                    columns: gridLayout,
                    hidePagination: false,
                    hideExpandCollapse: true,
                    selectable: function(item) { return !item.isRoot; },
                    isSelectable: function(item) { return self.isSelectable(item); },
                    queryData: {outputType: ["BASIC", "SECURITY"]}
                };

                var relayId = '';
                if (self && self.agent && self.agent.relayId) {
                    relayId = self.agent.relayId;
                }

                if(self.agent) {
                    tableObject.tableConfigKey = "agentRelayAgentIncludeList";
                    tableObject.noDataMessage = i18n("No agent relays include this agent.");
                    tableObject.baseFilters = [{
                        name: "endpointId",
                        type: "eq",
                        values: [relayId],
                        className: "String"
                    }];
                }
                else {
                    tableObject.tableConfigKey = "agentRelayList";
                    tableObject.noDataMessage = i18n("No agent relays have been added yet.");
                }

                self.grid = new TreeTable(tableObject);
                self.grid.placeAt(self.tableAttach);

                //Add "Actions..." button
                var bulkOptions = [];

                array.forEach(self.getBulkWriteActions(), function(action) {
                    bulkOptions.push(action);
                });

                if (bulkOptions && bulkOptions.length > 0) {
                    var actionsButton = new MenuButton({
                        options: bulkOptions,
                        label: i18n("Actions...")
                    });
                    actionsButton.placeAt(self.buttonAttach);

                    var onSelectChange = function() {
                        var selectCount = self.grid.getSelectedItems().length;
                        if (selectCount === 0) {
                            actionsButton.set("label", i18n("Actions..."));
                            actionsButton.set("disabled", true);
                        }
                        else {
                            actionsButton.set("label", i18n("Actions... (%s)", selectCount));
                            actionsButton.set("disabled", false);
                        }
                    };

                    self.grid.on("selectItem",   onSelectChange);
                    self.grid.on("deselectItem", onSelectChange);
                    self.grid.on("displayTable", onSelectChange);
                }
            });
        },

        /**
         * Calculate the largest value to be able to get the percentage to use in the bar
         */
        getLargest: function(gridRestUrl, cb) {
            var largest = 0;

            dojo.xhrGet({
                url: gridRestUrl,
                handleAs: "json",
                load: function(jsonData) {
                    array.forEach(jsonData,function(relay) {
                        if(relay.totalAgents > largest) {
                            largest = relay.totalAgents;
                        }
                    });
                    if(typeof cb === 'function') {
                        cb(largest);
                    }
                }
            });
        },

        /***********************************************************************
         * COLUMNS
         **********************************************************************/

        /**
         *
         */
        getNameColumn: function() {
            var self = this;
            return {
                name: i18n("Name"),
                orderField: "name",
                filterField: "name",
                filterType: "custom",
                formatter: function(item, value, cell) {
                    cell.style.position = "relative";

                    var result = domConstruct.create("div", {
                        "class": "inlineBlock",
                        "style": "margin-right:30px;"
                    });

                    var agentLink = Formatters.relayLinkFormatter(item);
                    domClass.add(agentLink, "inlineBlock");
                    domConstruct.place(agentLink, result);

                    domConstruct.place(self.actionsFormatter(item), result);

                    return result;
                },
                getRawValue: function(item) {
                    return item.name;
                },
                getFilterFields: function() {
                    var result = [];

                    result.push(new TextBox({
                        name: "name",
                        "class": "filter",
                        style: { "width": "45%" },
                        placeHolder: self.currentView === "basic" ? i18n("Agent Name") : i18n("Name"),
                        type: "like"
                    }));

                    return result;
                }
            };
        },

        /***********************************************************************
         * FORMATTERS
         **********************************************************************/

        /**
         * Add the action menu for each row
         */
        actionsFormatter: function(item) {
            var self = this;

            var result =  domConstruct.create("div", {
                "dir": util.getUIDir(),
                "align": util.getUIDirAlign(),
                "class": "tableHoverActions"
            });

            var menuActions = [];

            array.forEach(self._getRelayActions(item), function(action) {
                menuActions.push(action);
            });

            if (menuActions.length) {
                var actionsButton = new MenuButton({
                    options: menuActions,
                    label: i18n("Actions...")
                });
                actionsButton.placeAt(result);
            }

            return result;
        },

        /**
         * Render the horizontal bar for all agents relative to the largest
         */
        agentsFormatter: function(item, value, cell) {
            var self = this.parentWidget;

            var percentage = (value * 100) / self.largest;

            var result = domConstruct.create("div", {
                "class": "grid-cell-bar-agents"
            });

            var count = domConstruct.create("div");
            count.innerHTML = value;
            domConstruct.place(count, result);

            var bar = domConstruct.create("div", {
                "class": "meter"
            });

            var fill = domConstruct.create("span", {
                "style": "width:" + percentage + "%;"
            });
            domConstruct.place(fill, bar);

            var helpTip = new Tooltip({
                connectId: [result],
                label: (value === 0 || value ==='0') ? i18n("No agents.") : i18n("Total agents:" + value),
                showDelay: 100,
                position: ["above"]
            });

            domConstruct.place(bar, result);

            return result;
        },

        /**
         * Render the horizontal bar for active (online) agents / offline agents
         */
        activeAgentsFormatter: function(item, value, cell) {
            var self = this.parentWidget;

            var result = domConstruct.create("div", {
                "class": "grid-cell-bar-active-agents"
            });

            if(item.totalAgents > 0) {

                if(item.totalAgents < item.activeAgents) {
                    value = item.activeAgents = item.totalAgents;
                }

                var percentage = (value * 100) / item.totalAgents;
                var counts = domConstruct.create("div");

                var online = domConstruct.create("span");
                online.innerHTML = item.activeAgents;

                var offline = domConstruct.create("span", {
                    "style": "float:right;"
                });
                offline.innerHTML = item.totalAgents - item.activeAgents;

                domConstruct.place(online, counts);
                domConstruct.place(offline, counts);
                domConstruct.place(counts, result);

                var bar = domConstruct.create("div", {
                    "class": "meter"
                });

                var fill = domConstruct.create("span", {
                    "style": "width:" + percentage + "%;"
                });
                domConstruct.place(fill, bar);

                var helpTip = new Tooltip({
                    connectId: [result],
                    label: i18n("Online agents:") + item.activeAgents + ", " + i18n("Offline agents:" + (item.totalAgents - item.activeAgents)),
                    showDelay: 100,
                    position: ["above"]
                });

                domConstruct.place(bar, result);
            }

            return result;
        },

        /**
         * Bulk actions needing write permission
         */
        getBulkWriteActions: function() {
            var self = this;
            return [{
                label: i18n("Delete"),
                onClick: function() {
                    var ids = self._getSelected();
                    self.confirmDeletes(ids, ids.length);
                }
            }];
        },

        /***********************************************************************
         * ACTIONS
         **********************************************************************/

        /**
         * Bulk actions needing write permission
         */
        _getRelayActions: function(item) {
            var self = this;
            return [{
                label: i18n("Delete"),
                onClick: function() {
                    self.confirmDeletes([item.id], 1);
                }
            }];
        },

        /**
         * Determine whether the given resource can be selected or not for bulk operations
         */
        isSelectable: function(item) {
            return true;
        },

        /**
         *
         */
        _getSelected: function() {
            return array.map(this.grid.getSelectedItems(), function(item) {
                return item.id;
            });
        },

        /***********************************************************************
         * BULK OPERATIONS
         **********************************************************************/

        /**
         * Bulk - Deletes many Agent Relays
         */
        confirmDeletes: function(items, length, callback) {
            var self = this;

            if (length < 1) {
                var alert = new Alert({
                    message: i18n("Please select at least one agent relay to delete")
                });
                alert.startup();
            }
            else {
                var confirm = new GenericConfirm({
                    message: i18n("Are you sure you want to delete %s agent relays?", length),
                    action: function() {
                        xhr.del({
                            url: bootstrap.restUrl + "relay",
                            headers: { "Content-Type": "application/json" },
                            putData: JSON.stringify({relayIds: items}),
                            load: function() {
                                if (callback) {
                                    callback();
                                }
                                self.grid.block();
                                setTimeout(function() {
                                    self.grid.unblock();
                                    self.grid.refresh();
                                }, 1000);
                            },
                            error: function(error) {
                                var alert = new Alert({
                                    messages: [i18n("Error deleting relays:"), "", util.escape(error.responseText)]
                                });
                                alert.startup();
                                self.grid.unblock();
                            }
                        });
                    }
                });
            }
        }
    });
});
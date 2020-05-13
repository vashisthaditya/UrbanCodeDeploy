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
        "dijit/form/Textarea",
        "dijit/form/TextBox",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/_base/array",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/json",
        "dojo/on",
        "deploy/widgets/Formatters",
        "deploy/widgets/agent/SshInstallAgent",
        "deploy/widgets/tag/Tagger",
        "deploy/widgets/filter/TagFilter",
        "deploy/widgets/agent/EditAgent",
        "js/util/blocker/BlockingContainer",
        "js/webext/widgets/Alert",
        "js/webext/widgets/RadioButtonGroup",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/form/MenuButton",
        "dojo/store/Memory",
        "dijit/form/Select",
        "dojo/data/ObjectStore",
        "deploy/widgets/tag/TagDisplay",
        "js/webext/widgets/table/TreeTable",
        "js/webext/widgets/ColumnForm"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        CheckBox,
        Textarea,
        TextBox,
        declare,
        xhr,
        array,
        domClass,
        domConstruct,
        JSON,
        on,
        Formatters,
        SshInstallAgent,
        Tagger,
        TagFilter,
        EditAgent,
        BlockingContainer,
        Alert,
        RadioButtonGroup,
        Dialog,
        GenericConfirm,
        MenuButton,
        Memory,
        Select,
        ObjectStore,
        TagDisplay,
        TreeTable,
        ColumnForm
) {
    /**
     *
     */
    return declare(
        'deploy.widgets.agent.AgentList',
        [_Widget, _TemplatedMixin],
        {
        templateString:
            '<div class="agent-list">'+
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
            this.currentView = "agent";

            // If this agent list is in the relay detail page, don't include some buttons
            // and the filter for the relay column
            if(!self.relay) {
                self.selectStore = domConstruct.create("div");

                dojo.xhrGet({
                    url: bootstrap.restUrl+ "relay/",
                    handleAs: "json",
                    load: function(jsonData) {
                        var arr = [];

                        array.forEach(jsonData, function(relay) {
                            arr.push({
                                label: relay.name,
                                value: relay.endpointId
                            });
                        });

                        self.viewSelect = new Select({
                            options: [{
                                label: i18n("Flat list"),
                                value: "agent",
                                selected: true
                            },{
                                label: i18n("By Tag"),
                                value: "agent/all/sort/tags"
                            },{
                                label: i18n("By Team"),
                                value: "agent/all/sort/teams"
                            }],
                            sortByLabel: false,
                            style: {
                                display: "inline-block"
                            }
                        });

                        self.viewSelect.on("change", function(item){
                            if (self.currentView !== this.value) {
                                self.currentView = this.value;
                                self.viewSelect.placeAt(self.selectStore);
                                self.grid.destroy();
                                var active = (self.currentView !== "agent");
                                self.makeTable(self.currentView, self.getColumns(arr), active);
                            }
                        });

                        self.makeTable(self.currentView, self.getColumns(arr));
                    }
                });
            }
            else {
                self.makeTable(self.currentView, self.getColumns());
            }

            var requiredContainer = domConstruct.create("div", {
                className: "agent-version-container warning-state-color"
            }, this.buttonAttach);
            domConstruct.create("div", {
                innerHTML: i18n("Min. Required")
            }, requiredContainer);
            domConstruct.create("div", {
                innerHTML: config.data.systemConfiguration.agentMinimumRequiredVersion
            }, requiredContainer);

            var recommendedContainer = domConstruct.create("div", {
                className: "agent-version-container running-state-color"
            }, this.buttonAttach);
            domConstruct.create("div", {
                innerHTML: i18n("Min. Recommended")
            }, recommendedContainer);
            domConstruct.create("div", {
                innerHTML: config.data.systemConfiguration.agentMinimumRecommendedVersion
            }, recommendedContainer);

            // -------------------------------------------------
            // New strings to be translated for scratch/topology

            // /views/agent/AgentMain.html
            var a01 = i18n("Relays Used By This Agent");

            // /views/agentRelay/RelayMain.html
            var a02 = i18n("Agents Using This Relay");

            // /widgets/agent/AgentList.js
            var a03 = i18n("Relay");

            // /widgets/agent/AgentListForRelay.js
            var a04 = i18n("Agent Name");
            var a05 = i18n("Agents without Relay");
            var a06 = i18n("Agents in ");
            var a07 = i18n("Show");
            var a08 = i18n("Show agent:");
            var a09 = i18n("Show agent without relay.");

            // /widgets/agent/AgentRelays.js
            var a10 = i18n("Host");
            var a11 = i18n("Port");
            var a12 = i18n("No agent relays include this agent.");
            var a13 = i18n("Relay Name");
            var a14 = i18n("Please select at least one agent relay to restart");
            var a15 = i18n("Are you sure you want to restart %s agent relays?", "0");
            var a16 = i18n("Error restarting relays:");
            var a17 = i18n("Please select at least one agent relay to delete");
            var a18 = i18n("Are you sure you want to delete %s agent relays?", "0");
            var a19 = i18n("Error deleting relays:");

            // /widgets/agent/AgentRelayList.js
            var a20 = i18n("Failover Relays");
            var a21 = i18n("Total Agents");
            var a22 = i18n("Agent Status");
            var a23 = i18n("No agent relays have been added yet.");
            var a24 = i18n("No agents.");
            var a25 = i18n("Total agents:");
            var a26 = i18n("Online agents:");
            var a27 = i18n("Offline agents:");

            // /widgets/agent/EditRelay.js
            var a28 = i18n("Add Agents");
            var a29 = i18n("Select the agent or agents to add to the relay.");

            // /widgets/navigation/Resources.js
            var a30 = i18n("Agent Relays");
            var a31 = i18n("Agent Relays: %s", "A");
            // -------------------------------------------------
        },

        /**
         *
         */
        makeTable: function(tableUrl, layout, activeOnly) {
            var self = this;
            var hideExpandCollapse = (tableUrl === "agent");
            var serverSideProcessing = (tableUrl === "agent");

            var gridObj = {
                'serverSideProcessing': serverSideProcessing,
                url: bootstrap.restUrl + tableUrl,
                orderField: "name",
                tableConfigKey: "agentList",
                selectorField: "id",
                columns: layout,
                hidePagination: false,
                hideExpandCollapse: hideExpandCollapse,
                expandCollapseAllLinkClass: "linkPointer expand-collapse-all-link",
                selectable: function(item) { return !item.isRoot; },
                isSelectable: function(item) { return !item.isRoot; },
                hasChildren: function(item) { return !!item.isRoot; },
                getChildUrl: function(item) {
                    return bootstrap.restUrl + "agent/all/" + item.type + "/" + item.id;
                }
            };

            if(self.relay) {
                gridObj.baseFilters = [{
                    name: "relayId",
                    type: "eq",
                    values: [self.relay.endpointId],
                    className: "String"
                }];
            }

            this.grid = new TreeTable(gridObj);

            this.grid.placeAt(this.tableAttach);

            this.buttonAttach = this.grid.buttonAttach;

            this.addTopButtons();

            if(!self.relay) {
                // Add "Select All..." button
                var selectOptions = this.getSelectOptions();
                if (selectOptions && selectOptions.length > 0) {
                    var selectButton = new MenuButton({
                        options: selectOptions,
                        label: i18n("Select All...")
                    });
                    selectButton.placeAt(this.buttonAttach);
                }
            }

            // Add "Actions..." button
            var bulkOptions = [];

            array.forEach(self.getBulkWriteActions(), function(action) {
                bulkOptions.push(action);
            });

            if (bulkOptions && bulkOptions.length > 0) {
                var actionsButton = new MenuButton({
                    options: bulkOptions,
                    label: i18n("Actions...")
                });
                actionsButton.placeAt(this.buttonAttach);

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

            if (config.data.systemConfiguration.enableInactiveLinks) {
                if (!activeOnly) {
                    var activeBox = new CheckBox({
                        checked: false,
                        value: 'true',
                        onChange: function(value) {
                            if (value) {
                                self.grid.url = bootstrap.restUrl+"agent?inactive=true";
                            }
                            else {
                                self.grid.url = bootstrap.restUrl+"agent";
                            }
                            self.grid.refresh();
                        }
                    });

                    activeBox.placeAt(this.activeBoxAttach);

                    var activeLabel = document.createElement("div");
                    domClass.add(activeLabel, "inlineBlock");
                    activeLabel.style.position = "relative";
                    activeLabel.style.top = "2px";
                    activeLabel.style.left = "2px";
                    activeLabel.innerHTML = i18n("Show Inactive Agents");
                    this.activeBoxAttach.appendChild(activeLabel);
                }
                else {
                    domConstruct.empty(this.activeBoxAttach);
                }
            }
            if(this.viewSelect) {
                this.viewSelect.placeAt(this.buttonAttach);
            }
        },


        /***********************************************************************
         * COLUMNS
         **********************************************************************/

        /**
         *
         */
        getColumns: function(relayFilterOptions) {
            var gridLayout = [];
            gridLayout.push(this.getNameColumn());
            array.forEach(this.getOtherColumns(relayFilterOptions), function(column) {
                gridLayout.push(column);
            });
            return gridLayout;
        },

        /**
         *
         */
        getNameColumn: function() {
            var self = this;
            return {
                name: i18n("Name"),
                formatter: function(item, value, cell) {
                    cell.style.position = "relative";

                    var result = domConstruct.create("div", {
                        "class": "inlineBlock",
                        "style": "margin-right:78px;"
                    });
                    if (item.isRoot) {
                        if (item.color) {
                            var tag = [];
                            tag.push(item);
                            var labelTag = new TagDisplay({
                                readOnly: true,
                                tags: tag
                            });
                            labelTag.placeAt(result);
                        }
                        else {
                            return item.name;
                        }
                    }
                    else {
                        if (item.status === "ERROR") {
                            var integrationIcon = domConstruct.create("div", {
                                className: "general-icon failed-icon inlineBlock",
                                style: {
                                    "cursor": "pointer"
                                }
                            }, result);

                            on(integrationIcon, "click", function() {
                                self.showAgentErrors(item);
                            });
                        }

                        var agentLink = Formatters.agentLinkFormatter(item);
                        domClass.add(agentLink, "inlineBlock");
                        domConstruct.place(agentLink, result);
                        if (!item.status) {
                            var waitingNotice = domConstruct.create("div", {
                                "class": "inlineBlock description-text",
                                "style": "margin-left:5px"
                            });
                            waitingNotice.innerHTML = i18n("(Waiting for provisioned node)");
                            domConstruct.place(waitingNotice, result);
                        }

                        self.tagger = new Tagger({
                            objectType: "Agent",
                            item: item,
                            callback: function() {
                                self.grid.refresh();
                            }
                        });
                        self.tagger.placeAt(result);

                        domConstruct.place(self.actionsFormatter(item), result);
                    }
                    return result;
                },
                orderField: "name",
                filterField: "name",
                filterType: "custom",
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

                    if (self.currentView === "agent") {
                        result.push(new TagFilter({
                            name: "tags",
                            "class": "filter",
                            style: { width: "45%" },
                            placeHolder: i18n("Tags"),
                            type: "like"
                        }));
                    }

                    return result;
                }
            };
        },

        /**
         *
         */
        getOtherColumns: function(relayFilterOptions) {
            var self = this;

            var otherColumns = [{
                name: i18n("Description"),
                field: "description",
                filterField: "description",
                filterType: "text",
                filterClass: "String"
            },{
                name: i18n("Status"),
                orderField: "status",
                filterField: "status",
                filterType: "select",
                filterClass: "Enum",
                filterOptions: [{
                    label: i18n("Online"),
                    value: "ONLINE"
                },{
                    label: i18n("Offline"),
                    value: "OFFLINE"
                },{
                    label: i18n("Connecting"),
                    value: "CONNECTING"
                },{
                    label: i18n("Error"),
                    value: "ERROR"
                },{
                    label: i18n("Upgrade Recommended"),
                    value: "UPGRADE_RECOMMND"
                },{
                    label: i18n("Upgrade Required"),
                    value: "UPGRADE_REQUIRED"
                },{
                    label: i18n("Installable"),
                    value: "INSTALLABLE"
                }],
                getRawValue: function(item) {
                    return item.status;
                },
                formatter: function(item, value, cell) {
                    if (!item.isRoot) {
                        return Formatters.agentStatusFormatter(item, value, cell);
                    }
                }
            },{
                name: i18n("Date Created"),
                field: "dateCreated",
                filterField: "dateCreated",
                filterType: "date",
                filterClass: "Long",
                orderField: "dateCreated",
                formatter: function(item) {
                    var value = i18n("Not Available");
                    //dateCreated is defaulted to be 0, show Not Available as default
                    if (item.dateCreated) {
                        value = util.dateFormatShort(item.dateCreated);
                    }
                    return value;
                }
            },{
                name: i18n("Last Contact"),
                field: "lastContact",
                filterField: "lastContact",
                filterType: "date",
                filterClass: "Long",
                orderField: "lastContact",
                formatter: function(item) {
                    return util.dateFormatShort(item.lastContact);
                }
            },{
                name: i18n("License"),
                orderField: "licenseType",
                filterField: "licenseType",
                filterType: "select",
                filterClass: "Enum",
                filterOptions: [{
                    label: i18n("Floating"),
                    value: "FLOATING"
                },{
                    label: i18n("Authorized"),
                    value: "AUTHORIZED"
                },{
                    label: i18n("Authorized"),
                    value: "HCL_AUTHORIZED"
                },{
                    label: i18n("zOS Floating"),
                    value: "ZOS_FLOATING"
                },{
                    label: i18n("zOS Authorized"),
                    value: "ZOS_AUTHORIZED"
                },{
                    label: i18n("Provisioned"),
                    value: "PROVISIONED"
                },{
                    label: i18n("Unlicensed"),
                    value: "NONE"
                }],
                getRawValue: function(item) {
                    return item.licenseType;
                },
                formatter: function(item, value, cell) {
                    var result = "";

                    if (bootstrap.serverLicenseType === "SERVER_PVU") {
                        result = i18n("N/A");
                    }
                    else if (item.licenseType === "FLOATING") {
                        result = i18n("Floating");
                    }
                    else if (item.licenseType === "HCL_AUTHORIZED") {
                        result = i18n("Authorized");
                    }
                    else if (item.licenseType === "AUTHORIZED") {
                        result = i18n("Authorized");
                    }
                    else if (item.licenseType === "PROVISIONED") {
                        result = i18n("Provisioned");
                    }
                    else if (item.licenseType === "NONE") {
                        result = i18n("Unlicensed");
                    }
                    else if (item.licenseType === "ZOS_FLOATING") {
                        result = i18n("zOS Floating");
                    }
                    else if (item.licenseType === "ZOS_AUTHORIZED") {
                        result = i18n("zOS Authorized");
                    }
                    else {
                        result = i18n(item.licenseType);
                    }

                    return i18n(result);
                }
            },{
                name: i18n("Type"),
                field: "communicationVersion",
                orderField: "communicationVersion",
                filterField: "communicationVersion",
                filterType: "select",
                filterClass: "Enum",
                filterOptions: [{
                    label: i18n("JMS"),
                    value: "JMS"
                },{
                    label: i18n("Web"),
                    value: "Web"
                }],
                formatter: function(item) {
                    return i18n(item.communicationVersion);
                }
            },{
                name: i18n("Version"),
                field: "version",
                orderField: "agentVersion",
                filterField: "agentVersion",
                filterType: "text"
            }];

            //Add filter to the last column (relay) if the filter options exist
            if(relayFilterOptions) {
                otherColumns.push({
                    name: i18n("Relay"),
                    field: "relay",
                    filterField: "relayId",
                    filterType: "select",
                    filterClass: "String",
                    filterOptions: relayFilterOptions,
                    getRawValue: function(item) {
                        return item.relay;
                    },
                    formatter: function(item, value, cell) {
                        if(value) {
                            var statusCls = value.status === 'ONLINE' ? 'online' : 'offline';
                            var result =  domConstruct.create("div");
                            var status =  domConstruct.create("div", {
                                "class": "grid-cell-status"
                            });

                            var name = domConstruct.create("a", {
                                "class": "name"
                            });
                            name.innerHTML = value.name.escape();
                            name.href = "#relay/" + value.id;

                            var stat = domConstruct.create("span", {
                                "class": statusCls
                            });

                            domConstruct.place(name, status);
                            domConstruct.place(stat, status);

                            domConstruct.place(status, result);

                            return result;
                        }
                    }
                });
            }
            return otherColumns;
        },

        /***********************************************************************
         * TOP BUTTONS
         **********************************************************************/

        /**
         *
         */
        makeSelect: function(data, gridLayout, self) {

        },

        /**
         * Generate any buttons to be shown to the left of the bulk operations buttons
         */
        addTopButtons: function() {
            var self = this;
            if(!self.relay) {
                if(config.data.permissions["Install Remote Agents"]) {
                    var installAgentButton = {
                        label: i18n("Install New Agent"),
                        showTitle: false,
                        onClick: function() {
                            self.showInstallAgentDialog();
                        }
                    };

                    var topInstallButton = new Button(installAgentButton);
                    domClass.add(topInstallButton.domNode, "idxButtonSpecial");
                    topInstallButton.placeAt(this.buttonAttach);
                }
                var hostDiscoveryButton = {
                        label: i18n("Discover Available Network Hosts"),
                        showTitle: false,
                        onClick: function() {
                            self.showHostDiscoveryDialog();
                        }
                };
                var topHostDiscoveryButton = new Button(hostDiscoveryButton);
                topHostDiscoveryButton.placeAt(this.buttonAttach);
            }
        },

        /**
         *
         */
        getSelectOptions: function() {
            var self = this;

            return [{
                label: i18n("All"),
                onClick: function() {
                    var checkItems = [];
                    array.forEach(self.grid.getItems(), function(item) {
                        checkItems.push(item);
                    });

                    self.grid.deselectAll();
                    self.grid.selectItems(checkItems);
                }
            }, {
                label: i18n("Online"),
                onClick: function() {
                    self._selectWithStatus("online");
                }
            }, {
                label: i18n("Connected"),
                onClick: function() {
                    self._selectWithStatus("connected");
                }
            }, {
                label: i18n("Offline"),
                onClick: function() {
                    self._selectWithStatus("offline");
                }
            }, {
                label: i18n("Installable"),
                onClick: function() {
                    self._selectWithStatus("installable");
                }
            }];
        },

        /**
         *
         */
        _selectWithStatus: function(status) {
            var checkItems = [];
            array.forEach(this.grid.getItems(), function(item) {
                if (item.status && item.status.toLowerCase() === status) {
                    checkItems.push(item);
                }
            });

            this.grid.deselectAll();
            this.grid.selectItems(checkItems);
        },

        /**
         * Bulk actions needing write permission
         */
        getBulkWriteActions: function() {
            var self = this;
            return [{
                label: i18n("Restart"),
                onClick: function() {
                    var ids = self._getSelected();
                    self.confirmRestarts(ids);
                }
            }, {
                label: i18n("Upgrade"),
                onClick: function() {
                    var ids = self._getSelected();
                    self.confirmUpgrades(ids);
                }
            }, {
                label: i18n("Add Tag"),
                onClick: function() {
                    var ids = self._getSelected();
                    self.tagger.showAddTagDialog(ids);
                }
            }, {
                label: i18n("Remove Tag"),
                onClick: function() {
                    var ids = self._getSelected();
                    self.tagger.showRemoveTagDialog(ids);
                }
            }, {
                label: i18n("Delete"),
                onClick: function() {
                    var ids = self._getSelected();
                    self.confirmDeletes(ids);
                }
            }];
        },


        /***********************************************************************
         * HOVER ACTIONS
         **********************************************************************/

        /**
         * This is responsible for creating the icons in the row hover actions
         * relating to editing the row
         */
        addEditActions: function(item, result) {
            var self = this;

            var editButton = new Button({
                showTitle: false,
                iconClass: "editIcon",
                title: i18n("Edit"),
                onClick: function() {
                    self.editAgent(item);
                }
            });
            editButton.placeAt(result);
        },

        /**
         * Creates row hover objects relating to installation of agents
         *
         */
        getInstallActions: function(item) {
            var self = this;
            var result = [
                {
                    label: i18n("Install Agent"),
                    onClick: function() {
                        self.showInstallAgentDialog(item);
                    }
                }
            ];

            return result;
        },
        /**
         * Creates row hover objects relating to creation of agents
         *
         */
        getCreateActions: function(item) {
            var self = this;
            var result = [
                {
                    label: i18n("Restart"),
                    onClick: function() {
                        self.confirmRestart(item);
                    }
                }];
            if (
                    !!bootstrap.serverLicense &&
                    (bootstrap.serverLicense.agentAuthLicense || (!!bootstrap.backupServerLicense && bootstrap.backupServerLicense.agentAuthLicense)) &&
                    item.licenseType === 'NONE' &&
                    !item.licensed
            ) {
                result.push(self._getLicenseActions(item));
            }

            return result;
        },

        _getLicenseActions: function(item) {
            var self = this;
            var result = {
                label: i18n("License"),
                onClick: function() {
                    self._license(item);
                }
            };
            return result;
        },

        /**
         * Creates row hover objects relating to deletion of the row
         *
         */
        getDeleteActions: function(item) {
            var self = this;
            return [{
                label: i18n("Delete"),
                onClick: function() {
                    self.confirmDelete(item);
                }
            }];
        },

        /**
         * Creates row hover objects relating to upgrade of a row
         *
         */
        getUpgradeActions: function(item) {
            var self = this;
            return [{
                label: i18n("Upgrade"),
                onClick: function() {
                    self.confirmUpgrade(item);
                }
            }];
        },

        /**
         * Creates row hover objects for running things
         *
         */
        getRunnableActions: function(item) {
            var self = this;
            return [{
                    label: i18n("Test"),
                    onClick: function() {
                        self.showConnectionTest(item);
                    }
                }
            ];
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
         * FOMATTERS
         **********************************************************************/

        /**
         *
         */
        actionsFormatter: function(item) {
            var self = this;

            var result =  domConstruct.create("div", {
                "dir": util.getUIDir(),
                "align": util.getUIDirAlign(),
                "class": "tableHoverActions"
            });

            var menuActions = [];
            if (item.status === "INSTALLABLE" && item.security["Edit Basic Settings"]) {
                array.forEach(self.getInstallActions(item), function(action) {
                    menuActions.push(action);
                });
            }
            else if (item.security["Edit Basic Settings"]) {
                self.addEditActions(item, result);
                // Null status means the agent hasn't yet contacted the server.
                // This entry is devoid of information until the agent populates it.
                // (This will occur when agent is provisioned via blueprints)
                if (item.status) {
                    array.forEach(self.getCreateActions(item), function(action) {
                        menuActions.push(action);
                    });
                    array.forEach(self.getRunnableActions(item), function(action) {
                        menuActions.push(action);
                    });
                }
            }

            if (item.security.Delete) {
                array.forEach(self.getDeleteActions(item), function(action) {
                    menuActions.push(action);
                });
            }

            if (item.security["Upgrade Agents"]) {
                array.forEach(self.getUpgradeActions(item), function(action) {
                    menuActions.push(action);
                });
            }

            if (menuActions.length) {
                var actionsButton = new MenuButton({
                    options: menuActions,
                    label: i18n("Actions...")
                });
                actionsButton.placeAt(result);
            }

            return result;
        },


        /***********************************************************************
         * BULK OPERATIONS
         **********************************************************************/

        confirmLicense: function(items, value) {
            var self = this;

            if (!items.length) {
                var alert = new Alert({
                    message: i18n("Please select at least one agent.")
                });
                alert.startup();
            }

            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to license %s agents? This will license all selected Agents with Authorized licenses.", items.length),
                action: function() {
                    self.grid.block();
                    xhr.put({
                        url: bootstrap.restUrl + "agent/license",
                        putData: JSON.stringify({"licensed": value, "agentIds": items}),
                        load: function() {
                            self.grid.refresh();
                            self.grid.unblock();
                        },
                        error: function(error) {
                            var alert = new Alert({
                                messages: [i18n("Error licensing agents:"),
                                           "",
                                           util.escape(error.responseText)]
                            });
                            self.grid.refresh();
                            self.grid.unblock();
                        }
                    });
                }
            });
        },

        /**
         * Bulk - Restarts many Agents
         */
        confirmRestarts: function(items, callback) {
            var self = this;

            if (!items.length) {
                var alert = new Alert({
                    message: i18n("Please select at least one agent to restart")
                });
                alert.startup();
            }
            else {
                var confirm = new GenericConfirm({
                    message: i18n("Are you sure you want to restart %s agents?", items.length),
                    action: function() {
                        xhr.put({
                            url: bootstrap.restUrl + "agent/restart",
                            putData: JSON.stringify({agentIds: items}),
                            load: function() {
                                if (callback) {
                                    callback();
                                }
                                self.grid.refresh();
                            },
                            error: function(error) {
                                var alert = new Alert({
                                    messages: [i18n("Error restarting agents:"),
                                               "",
                                               util.escape(error.responseText)]
                                });
                                self.grid.refresh();
                                self.grid.unblock();
                            }
                        });
                    }
                });
            }
        },

        /**
         * Bulk - Upgrades many Agents
         */
        confirmUpgrades: function(items, callback) {
            var self = this;

            if (!items.length) {
                var alert = new Alert({
                    message: i18n("Please select at least one agent to upgrade")
                });
                alert.startup();
            }
            else {
                var confirm = new GenericConfirm({
                    message: i18n("Are you sure you want to upgrade %s agents?", items.length),
                    action: function() {
                        xhr.put({
                            url: bootstrap.restUrl + "agent/upgrade",
                            putData: JSON.stringify({agentIds: items}),
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
                                    messages: [i18n("Error upgrading agents:"),
                                               "",
                                               util.escape(error.responseText)]
                                });
                                self.grid.refresh();
                                self.grid.unblock();
                            }
                        });
                    }
                });
            }
        },

        /**
         * Bulk - Deletes many Agents
         */
        confirmDeletes: function(items, callback) {
            var self = this;

            if (!items.length) {
                var alert = new Alert({
                    message: i18n("Please select at least one agent to delete")
                });
                alert.startup();
            }
            else {
                var confirm = new GenericConfirm({
                    message: i18n("Are you sure you want to delete %s agents?", items.length),
                    action: function() {
                        xhr.del({
                            url: bootstrap.restUrl + "agent/delete",
                            headers: { "Content-Type": "application/json" },
                            putData: JSON.stringify({agentIds: items}),
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
                                    messages: [i18n("Error deleting agents:"),
                                               "",
                                               util.escape(error.responseText)]
                                });
                                alert.startup();
                                self.grid.unblock();
                            }
                        });
                    }
                });
            }
        },


        /***********************************************************************
         * SINGLE OPERATIONS
         **********************************************************************/

        /**
         *
         */
        _license: function(item) {
            var self = this;
            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to attempt to license the Agent %s? This will license the Agent with an Authorized license.", item.name.escape()),
                action: function() {
                    self.grid.block();
                    xhr.put({
                        url: bootstrap.restUrl + "agent/"+item.id+"/license",
                        load: function() {
                            self.grid.refresh();
                            self.grid.unblock();
                        },
                        error: function(error) {
                            var alert = new Alert({
                                messages: [i18n("Error licensing agent:"),
                                           "",
                                           util.escape(error.responseText)]
                            });
                            self.grid.refresh();
                            self.grid.unblock();
                        }
                    });
                }
            });
        },

        /**
         *
         */
        editAgent: function(item) {
            var self = this;
            xhr.get({
                url: bootstrap.restUrl + "agent/" + item.id,
                handleAs: "json",
                load: function(response) {
                    var editAgentDialog = new Dialog({
                        title: i18n("Edit Agent"),
                        closable: true,
                        draggable: true
                    });

                    var editAgent = new EditAgent({
                        agent: response,
                        readOnly: !response.security["Edit Basic Settings"],
                        noRedirect: true,
                        callback: function() {
                            editAgentDialog.hide();
                            editAgentDialog.destroy();
                            self.grid.refresh();
                        }
                    });
                    editAgent.placeAt(editAgentDialog);
                    editAgentDialog.show();
                },
                error: function(error) {

                }
            });
        },

        /**
         *
         */
        confirmRestart: function(item) {
            var self = this;

            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to restart '%s'?", item.name),
                action: function() {
                    xhr.get({
                        url: bootstrap.restUrl + "agent/" + item.id + "/restart",
                        load: function() {
                            self.grid.block();
                            setTimeout(function() {
                                self.grid.unblock();
                                self.grid.refresh();
                            }, 1000);
                        }
                    });
                }
            });
        },

        /**
         * Upgrades a single Agent
         */
        confirmUpgrade: function(item) {
            var self = this;

            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to upgrade '%s'?", item.name),
                action: function() {
                    xhr.get({
                        url: bootstrap.restUrl + "agent/" + item.id + "/upgrade",
                        load: function() {
                            self.grid.block();
                            setTimeout(function() {
                                self.grid.unblock();
                                self.grid.refresh();
                            }, 1000);
                        },
                        error: function(error) {
                            var alert = new Alert({
                                messages: [i18n("Error upgrading agent:"),
                                           "",
                                           util.escape(error.responseText)]
                            });
                            alert.startup();
                            self.grid.unblock();
                        }
                    });
                }
            });
        },

        /**
         * Deletes a single Agent
         */
        confirmDelete: function(target) {
            var self = this;

            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to delete %s? This will permanently delete it from the system.", target.name.escape()),
                action: function() {
                    self.grid.block();
                    xhr.del({
                        url: bootstrap.restUrl+"agent/"+target.id,
                        handleAs: "json",
                        load: function(data) {
                            self.grid.unblock();
                            self.grid.refresh();
                        },
                        error: function(error) {
                            var alert = new Alert({
                                messages: [i18n("Error deleting agent:"),
                                           "",
                                           util.escape(error.responseText)]
                            });
                            alert.startup();
                            self.grid.unblock();
                        }
                    });
                }
            });
        },

        /**
         * Displays the host discovery dialog
         */
        showHostDiscoveryDialog: function() {
            var self = this;

            var discoveryDialog = new Dialog({
                title: i18n("Discover Available Network Hosts"),
                closable: true,
                draggable:true
            });

            var discoverHostsForm = new ColumnForm({
                submitUrl: bootstrap.restUrl+"agent/discover",
                postSubmit: function(data) {
                    discoveryDialog.hide();
                    discoveryDialog.destroy();
                    self.grid.refresh();
                },
                addData: function(data) {

                },
                onCancel: function() {
                    discoveryDialog.hide();
                    discoveryDialog.destroy();
                }
            });

            discoverHostsForm.addField({
                "name":"hosts",
                "label":i18n("Subnets"),
                "type": "Text Area",
                "required":true,
                "placeholder":"10.10.10.10/24",
                "description": i18n("Specify subnets to be searched, one subnet per line.<br/> " +
                        "Format: xxx.xxx.xxx.xxx/nn, where xxx.xxx.xxx.xxx forms an IP address "+
                        "and nn is the network prefix length.<br/><br/>"+
                        "Discovery may take a long time if a large network search is done, so<br/>"+
                        "it is ideal to limit the scope of each search to 255 or fewer addresses.")
            });

            discoverHostsForm.placeAt(discoveryDialog.containerNode);
            discoveryDialog.show();
        },

        /**
         * Installs a single agent
         */
        showInstallAgentDialog: function(agentJson) {
            var self = this;

            var installAgentDialog = new Dialog({
                title: i18n("Install New Agent"),
                closable: true,
                draggable:true,
                description: i18n("You can install agents only on computers that are running UNIX or Windows. " +
                        "If the target system is UNIX, select SSH. Otherwise select WinRS. For more " +
                        "information on system requirements, or for other systems, including z/OS®, consult the help."),
                extraClasses: ["installNewAgentTypeSelector"]
            });

            var installAgentForm;
            if (agentJson) {
                var id = agentJson.id;
                xhr.get({
                    url: bootstrap.restUrl + "agent/" + agentJson.id + "/properties/discoveredPort",
                    handleAs: "text",
                    load: function(response) {
                        if (response === "22") {
                            installAgentForm = new SshInstallAgent({
                                type:"ssh",
                                agent: agentJson,
                                callback: function() {
                                    installAgentDialog.hide();
                                    installAgentDialog.destroy();
                                    self.grid.refresh();
                                }
                            });
                        }
                        else if (response === "135") {
                            installAgentForm = new SshInstallAgent({
                                type:"winrs",
                                agent: agentJson,
                                callback: function() {
                                    installAgentDialog.hide();
                                    installAgentDialog.destroy();
                                    self.grid.refresh();
                                }
                            });
                        }

                        installAgentForm.placeAt(installAgentDialog.containerNode);
                        installAgentDialog.show();
                    },
                    error: function(error) {

                    }
                });
            }
            else {
                var remoteType = "ssh";
                var radioButtonGroup = new RadioButtonGroup({
                    name:"remoteTypeGroup",
                    options: [
                        {
                            label:i18n("SSH"),
                            value:"ssh"
                        },{
                            label:i18n("WinRS"),
                            value:"winrs"
                        }
                    ],
                    disabled:false,
                    enabled:true,
                    onChange: function(value) {
                        self.remoteType = value;
                        installAgentDialog.hide();
                        installAgentDialog.destroy();
                        radioButtonGroup.destroy();

                        //create a new dialog to avoid it picking up on extraClasses added to the prior dialog
                        installAgentDialog = new Dialog({
                            title: i18n("Install New Agent"),
                            closable: true,
                            draggable:true
                        });

                        installAgentForm = new SshInstallAgent({
                            type:self.remoteType,
                            callback: function() {
                                installAgentDialog.hide();
                                installAgentDialog.destroy();
                                self.grid.refresh();
                            }
                        });
                        installAgentForm.placeAt(installAgentDialog.containerNode);
                        installAgentDialog.show();
                    }
                });
                radioButtonGroup.placeAt(installAgentDialog.containerNode);
                installAgentDialog.show();
            }

        },

        /**
         * Displays the connectivity test dialog for a single Agent
         */
        showConnectionTest: function(target) {
            var self = this;
            var blocker = new BlockingContainer();
            var connectionTestDialog = new Dialog({
                title: i18n("Connection Test"),
                closable: true,
                draggable:true
            });

            var resultBox = new Textarea({});
            resultBox.set('disabled', true);
            domClass.add(resultBox.domNode, "connectionResults");

            var runTestButton = {
                label: i18n("Run Connectivity Test"),
                showTitle: false,
                onClick: function() {
                    self.runConnectivityTest(resultBox, target,blocker);
                }
            };

            var testButton = new Button(runTestButton);
            domClass.add(testButton.domNode, "idxButtonSpecial");
            domClass.add(testButton.domNode, "connectionTestButton");

            blocker.placeAt(connectionTestDialog.containerNode);

            resultBox.placeAt(blocker.domNode);
            testButton.placeAt(blocker.domNode);

            connectionTestDialog.show();
        },

        /**
         * Runs the connectivity test for a single Agent
         */
        runConnectivityTest: function(responseBox/*textarea*/, target/*agent*/, blocker/*blocker*/) {
            var self = this;
            responseBox.set('value', i18n("Running test..."));
            blocker.block();
            xhr.put({
                url: bootstrap.restUrl+"agent/" + target.id + "/connectivity",
                handleAs: "json",
                load: function(data) {
                    responseBox.set('value', data.log);
                    blocker.unblock();
                }
            });
        },

        showAgentErrors: function(item) {
            var errorDialog = new Dialog();
            var errorDialogScroller = domConstruct.create("div", {
                style: {
                    maxWidth: "700px",
                    maxHeight: "500px",
                    overflow: "auto"
                }
            }, errorDialog.containerNode);

            domConstruct.create("div", {
                innerHTML: i18n("Error")
            }, errorDialog.titleNode);

            var inputContainer = domConstruct.create("div", {}, errorDialogScroller);
            var key;
            for (key in item.errors) {
                if (item.errors.hasOwnProperty(key)) {
                    if (key === "ERROR_HTTP_CONNECT") {
                        domConstruct.create("div", {
                            innerHTML: i18n("The agent could not connect to the server or relay using HTTP. " +
                                    "Ensure that the external URL is set correctly on the System Settings page " +
                                    "and that there are no firewalls blocking HTTP communication from the agent."),
                            className: "bold"
                        }, inputContainer);
                    }
                    else {
                        domConstruct.create("div", {
                            innerHTML: i18n("An error occurred while the agent was connecting to the server:")
                        }, inputContainer);
                    }

                    domConstruct.create("div", {
                        innerHTML: i18n("Full error trace:"),
                        className: "bold",
                        style: {
                            paddingLeft: "15px",
                            paddingTop: "8px"
                        }
                    }, inputContainer);
                    domConstruct.create("div", {
                        innerHTML: item.errors[key].escape(),
                        style: {
                            paddingLeft: "15px",
                            paddingTop: "3px",
                            paddingBottom: "5px"
                        }
                    }, inputContainer);

                    domConstruct.create("div", {
                        innerHTML: i18n("Once the problem has been corrected, please restart either the agent or the server."),
                        className: "bold",
                        style: {
                            paddingTop: "15px"
                        }
                    }, inputContainer);
                }
            }

            errorDialog.show();
        }
    });
});

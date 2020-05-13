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
/*global define*/

define([
        "dojo/_base/declare",
        "dojo/_base/connect",
        "dijit/_Widget",
        "dijit/_TemplatedMixin",
        "dojo/dom-class",
        "dojo/dom-geometry",
        "dojo/dom-construct",
        "dojo/on",
        "dojo/_base/xhr",
        "dojo/_base/array",
        "dojo/topic",
        "dojo/Deferred",
        "dijit/form/Button",
        "dijit/form/CheckBox",
        "dijit/form/Select",
        "dijit/form/TextBox",
        "deploy/widgets/component/EditComponent",
        "deploy/widgets/component/ComponentImportFailureIcon",
        "deploy/widgets/Formatters",
        "deploy/widgets/tag/Tagger",
        "deploy/widgets/filter/TagFilter",
        "js/webext/widgets/Alert",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/form/MenuButton",
        "dojo/store/Memory",
        "js/webext/widgets/table/TreeTable",
        "dojo/data/ObjectStore",
        "deploy/widgets/tag/TagDisplay",
        "dojo/io/iframe"
        ],
function(
        declare,
        connect,
        _Widget,
        _TemplatedMixin,
        domClass,
        domGeom,
        domConstruct,
        on,
        xhr,
        array,
        topic,
        Deferred,
        Button,
        CheckBox,
        Select,
        TextBox,
        EditComponent,
        ComponentImportFailureIcon,
        Formatters,
        Tagger,
        TagFilter,
        Alert,
        Dialog,
        GenericConfirm,
        MenuButton,
        Memory,
        TreeTable,
        ObjectStore,
        TagDisplay,
        ioIframe
) {

/**
 *
 */
    return declare('deploy.widgets.application.ComponentList',
        [_Widget, _TemplatedMixin],
        {
            templateString:
                '<div class="componentList">' +
                    '<div data-dojo-attach-point="buttonAttach" style="position:relative; z-index=1;"></div>' +
                    '<div data-dojo-attach-point="statAttach" class="statAttach">' +
                    '  <div class="tile tile-border">' +
                    '    <div class="stat-tile-label">' + i18n("Failed Version Import") + '</div>' +
                    '    <div class="stat-tile-number" data-dojo-attach-point="failedStatAttach"></div>' +
                    '  </div>' +
                    '  <div class="tile tile-border">' +
                    '    <div class="stat-tile-label">' + i18n("Importing Version") + '</div>' +
                    '    <div class="stat-tile-number" data-dojo-attach-point="importingStatAttach"></div>' +
                    '  </div>' +
                    '  <div class="tile tile-border">' +
                    '    <div class="stat-tile-label">' + i18n("No Version") + '</div>' +
                    '    <div class="stat-tile-number" data-dojo-attach-point="noVersionStatAttach"></div>' +
                    '  </div>' +
                    '  <div class="tile tile-border">' +
                    '    <div class="stat-tile-label">' + i18n("Successful") + '</div>' +
                    '    <div class="stat-tile-number" data-dojo-attach-point="successStatAttach"></div>' +
                    '  </div>' +
                    '  <div class="tile">' +
                    '    <div class="stat-tile-label">' + i18n("No Artifact") + '</div>' +
                    '    <div class="stat-tile-number" data-dojo-attach-point="noArtifactStatAttach"></div>' +
                    '  </div>' +
                    '</div>' +
                    '<div data-dojo-attach-point="gridAttach">' +
                    '</div>' +
                    '<div data-dojo-attach-point="activeBoxAttach" style="margin: 2px;"></div>' +
                '</div>',

            activeOnly: true,

            // The three possible views, we use this to map to the view configuration below
            BASIC_VIEW: "basic",
            TAG_VIEW: "tag",
            TEAM_VIEW: "team",

            // The configurations for each view
            _views: {
                // Basic view is just a list of Components with no children
                basic: {
                    url: bootstrap.restUrl + "deploy/component/details",
                    baseFilters: [{
                        name: "active",
                        type: "eq",
                        values: [ true ],
                        className: "Boolean"
                    }]
                },
                // Tag view: each parent is a Component tag, with the children being
                // components that have that tag.
                tag: {
                    url: bootstrap.restUrl + "tag",
                    getChildUrl: function (tag) {
                        return bootstrap.restUrl + "deploy/component/details";
                    },
                    getChildOutputType: function() {
                        return { outputType: [ "BASIC", "SECURITY" ] };
                    },
                    baseFilters: [{
                        name: "objectType",
                        type: "eq",
                        values: [ "Component" ],
                        className: "String"
                    }],
                    getChildFilters: function(tag) {
                        return [{
                                 name: "tags",
                                 type: "eq",
                                 values: [ tag.name ],
                                 className: "String"
                             },{
                                 name: "active",
                                 type: "eq",
                                 values: [ true ],
                                 className: "Boolean"
                        }];
                    }
                },
                // Team view: each parent is a Team, with the children being components
                // belonging to that team.
                team: {
                    url: bootstrap.baseUrl + "security/team",
                    getChildUrl: function(team) {
                        return bootstrap.restUrl + "deploy/component/team/details/" + team.id;
                    },
                    baseFilters: [],
                    getChildFilters: function() {
                        return [{
                            name: "active",
                            type: "eq",
                            values: [ true ],
                            className: "Boolean"
                        }];
                    }
                }
            },

            /**
             * Given a one of the views above (BASIC_VIEW, TAG_VIEW, TEAM_VIEW)
             * returns true if the current view is that view.
             */
            isView: function(expected) {
                return this.currentView === expected;
            },

            /**
             *
             */
            postCreate: function() {
                this.inherited(arguments);
                var self = this;

                if (!config.data.permissions[security.system.manageSecurity]) {
                    self._views.team.baseFilters = [{
                        name: "username",
                        type: "eq",
                        values: [ bootstrap.username ],
                        className: "String"
                    }];
                }

                this.currentView = self.BASIC_VIEW;
                self.selectStore = domConstruct.create("div");

                self.viewSelect = new Select({
                    options: [{
                        label: i18n("Flat list"),
                        value: self.BASIC_VIEW,
                        selected: true
                    },{
                        label: i18n("By Tag"),
                        value: self.TAG_VIEW
                    },{
                        label: i18n("By Team"),
                        value: self.TEAM_VIEW
                    }],
                    sortByLabel: false,
                    style: {
                        display: "inline-block"
                    }
                });
                util.setTestId(self.viewSelect, "view-select");

                on(self.viewSelect, "change", function(item) {
                    if (self.currentView !== item) {
                        self.currentView = item;
                        self.viewSelect.placeAt(self.selectStore);
                        self.grid.destroy();
                        var active = !self.isView(self.BASIC_VIEW);
                        self._clearOrderField();
                        self.makeTable(self._views[self.currentView].url, self.getColumns(), active);
                    }
                });
                self.makeTable(self._views[self.currentView].url, self.getColumns());
                self.showStats();
            },

            /**
             * Clears out the order field from the cookie that holds the table config
             */
            _clearOrderField: function() {
                var tableConfig = this.grid.getStoredConfig();
                // This will prevent bad ordering params in the request when changing views.
                tableConfig.orderField = undefined;
                this.grid.storeConfig(tableConfig);
            },

            /*
             *
             */
            makeTable: function (tableUrl, layout, activeOnly) {
                var self = this;

                // We define a wrapper function to filter children on 'active'
                // This wrapper function will allow us to filter children on 'active'
                // depending on whether or not the 'show inactive' box is marked.
                //
                // This also will allow TreeTable to fall back to using baseFilters
                // when filtering children since this function will be undefined in
                // that case.
                var childFiltersWrapper;
                if (self._views[self.currentView].getChildFilters) {
                    childFiltersWrapper = function(item) {
                        var result = self._views[self.currentView].getChildFilters(item);
                        if (!self.activeOnly) {
                            result = array.filter(result, function(filter) {
                                return filter.name !== "active";
                            });
                        }
                        return result;
                    };
                }
                this.grid = new TreeTable({
                    url: tableUrl,
                    serverSideProcessing: true,
                    orderField: "name",
                    queryData: {
                        outputType: [
                            "BASIC",
                            "SECURITY",
                            "LINKED"
                        ]
                    },
                    baseFilters: self._views[self.currentView].baseFilters || [],
                    tableTitle: i18n("Components"),
                    noDataMessage: i18n("No components found."),
                    tableConfigKey: "componentList",
                    selectorField: "id",
                    hidePagination: false,
                    hideExpandCollapse: self.isView(self.BASIC_VIEW),
                    selectable: function(item) {
                        return !item.objectType;
                    },
                    columns: layout,
                    isSelectable: function(item) {
                        return !item.objectType && (item.isDeletable === undefined);
                    },
                    hasChildren: function(item) {
                        return !!item.objectType || (item.isDeletable !== undefined);
                    },
                    getChildUrl: function(item) {
                        if (self._views[self.currentView].getChildUrl) {
                            return self._views[self.currentView].getChildUrl(item, !self.activeOnly);
                        }
                    },
                    getChildFilters: childFiltersWrapper,
                    getChildOutputType: self._views[self.currentView].getChildOutputType
                });
                this.grid.placeAt(this.gridAttach);
                this.buttonAttach = this.grid.buttonAttach;

                this.addTopButtons();

                var bulkOptions = [];

                array.forEach(this.getBulkReadOptions(), function(action) {
                    bulkOptions.push(action);
                });
                array.forEach(this.getBulkWriteOptions(), function(action) {
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

                if (config.data.systemConfiguration.enableInactiveLinks && !activeOnly) {
                    if (!this.activeBox && !this.activeLabel) {
                        this.activeBox = new CheckBox({
                            checked: false,
                            value: 'true',
                            onChange: function(value) {
                                self.activeOnly = !value;
                                // We need to update the table's baseFilters based on this value
                                if (!value && self.isView(self.BASIC_VIEW)) {
                                    // If we say to show only active, we need to make sure the filter is there
                                    // This filter is only applicable in the BASIC_VIEW
                                    self.grid.baseFilters.push({
                                        name: "active",
                                        type: "eq",
                                        values: [ true ],
                                        className: "Boolean"
                                    });
                                }
                                else {
                                    // Otherwise, if we say to show inactive, we need to remove the 'active' filter
                                    self.grid.baseFilters = array.filter(self.grid.baseFilters, function (filter) {
                                        return filter.name !== "active";
                                    });

                                }
                                self.grid.refresh();
                            }
                        });
                        this.activeBox.placeAt(this.activeBoxAttach);

                        this.activeLabel = document.createElement("div");
                        domClass.add(this.activeLabel, "inlineBlock");
                        this.activeLabel.style.position = "relative";
                        this.activeLabel.style.top = "2px";
                        this.activeLabel.style.left = "2px";
                        this.activeLabel.innerHTML = i18n("Show Inactive Components");
                        this.activeBoxAttach.appendChild(this.activeLabel);
                    }
                    else {
                        // reset the checkbox
                        this.activeBox.set('checked', false);
                    }
                }
                self.viewSelect.placeAt(self.buttonAttach);
            },


            /***********************************************************************
             * COLUMNS
             **********************************************************************/

            /**
             *
             */
            getColumns: function() {
                var gridLayout = [];
                gridLayout.push(this.getNameColumn());
                array.forEach(this.getOtherColumns(), function(column) {
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
                            "style": "margin-" + (domGeom.isBodyLtr()?"right":"left") + ":78px;"
                        });
                        var itemWrapper = domConstruct.create("div", {
                            "class": "inlineBlock"
                        });
                        domConstruct.place(itemWrapper, result);
                        if (item.objectType) {
                            if (item.color) {
                                var tag = [];
                                tag.push(item);
                                var labelTag = new TagDisplay({
                                    readOnly: true,
                                    tags: tag
                                });
                                labelTag.placeAt(result);
                            }
                        }
                        else if (item.componentType) {
                            if (item.integrationFailed) {
                                var importFailureIcon = new ComponentImportFailureIcon({
                                    label: i18n("A version import failed. Check the component's configuration for more details or use the Actions menu to dismiss this error.")
                                });

                                domConstruct.place(importFailureIcon.domNode, itemWrapper);
                            }
                            var link = Formatters.componentLinkFormatter(item);
                            var linkDiv = domConstruct.create('div', { "class" : 'inlineBlock'});
                            linkDiv.appendChild(link);
                            domConstruct.place(linkDiv, itemWrapper);

                            if (item.templateTags) {
                                item.disabledTags = item.templateTags;
                            }

                            self.tagger = new Tagger({
                                objectType: "Component",
                                item: item,
                                callback: function() {
                                    self.grid.refresh();
                                }
                            });
                            self.tagger.placeAt(result);

                            domConstruct.place(self.actionsFormatter(item), result);
                        }
                        else {
                            // is Team view - item is TeamSpace
                            var teamName = item.name.escape();
                            if (teamName === "System Team") {
                                teamName = i18n("System Team");
                                item.description = i18n(item.description);
                            }

                            var teamDiv = domConstruct.create("div", {
                                "class": "inline-block",
                                "innerHTML": teamName
                             }, result);
                        }
                        if (item.importing) {
                            var importingDiv = domConstruct.create("div", {
                                "class": "inline-block component-importing-text",
                                "innerHTML": "Importing..."
                             }, result);
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
                            placeHolder: i18n("Name"),
                            type: "like"
                        }));

                        if (self.currentView === "basic") {
                            result.push(new TagFilter({
                                name: "tags",
                                "class": "filter",
                                placeHolder: i18n("Tags"),
                                type: "like"
                            }));
                        }

                        return result;
                    }
                };
            },

            /**
             * Returns an array of other columns that should be included in the
             * ComponentList table.
             */
            getOtherColumns: function() {
                var self = this;
                var result = [];

                //last import status
                result.push({
                    name: i18n("Latest Import"),
                    field: "status",
                    formatter: function(item) {
                        var result;
                        if (item.status === "SUCCESS") {
                            result = i18n("Successful");
                        }
                        else if (item.status === "FAILURE") {
                            result = i18n("Failed Import");
                        }
                        else if(!item.hasArtifact && item.versionName) {
                            result = i18n("No Artifact");
                        }
                        return result;
                    }
                });

                //last import status
                result.push({
                    name: i18n("Latest Version"),
                    field: "versionName",
                    formatter: function(item) {
                        if (!item.objectType) {
                            if ((!item.versionName || (item.versionName === "null")) && item.componentType) {
                                return i18n("NO VERSION");
                            }
                        }
                      return item.versionName;
                    }
                });

                // Template
                result.push({
                    name: i18n("Template"),
                    field: "template",
                    formatter: function(item) {
                        var result = "";
                        if (item.template) {
                            result = item.template.name;
                        }
                        return result;
                    }
                });

                // Description
                result.push({
                    name: i18n("Description"),
                    field: "description",
                    orderField: "description",
                    filterField: "description",
                    filterType: "text",
                    getRawValue: function(item) {
                        return item.description;
                    }
                });

                // Created
                var createdCol = {
                    name: i18n("Created"),
                    field: "created",
                    formatter: util.tableDateFormatter,
                    getRawValue: function(item) {
                        return new Date(item.created);
                    }
                };
                // Only allow sorting by dateCreated in the basic view
                if (self.isView(self.BASIC_VIEW)) {
                    createdCol.orderField = "dateCreated";
                }
                result.push(createdCol);

                // By
                result.push({
                    name: i18n("By"),
                    field: "user",
                    getRawValue: function(item) {
                        return item.user;
                    }
                });

                return result;
            },


            /***********************************************************************
             * TOP BUTTONS
             **********************************************************************/

            /**
             * Adds Buttons at the top of the table
             */
            addTopButtons: function() {
                var self = this;

                // Boolean values for below logic
                var canCreate = config.data.permissions[security.system.createComponents];
                var canCreateFromTemplate =
                    config.data.permissions[security.system.createComponentsFromTemplate];

                if (canCreate || canCreateFromTemplate) {
                    var newComponentButton = {
                        label: i18n("Create Component"),
                        showTitle: false,
                        onClick: function() {
                            self.showNewComponentDialog();
                        }
                    };
                    var componentButton = new Button(newComponentButton).placeAt(this.buttonAttach);
                    domClass.add(componentButton.domNode, "idxButtonSpecial");
                }

                if (canCreate) {
                    var importComponentButton = {
                        "label": i18n("Import Components"),
                        "showTitle": false,
                        "onClick": function() {
                            self.showImportComponentDialog();
                        }
                    };

                    new Button(importComponentButton).placeAt(this.buttonAttach);
                }
            },

            /**
             * This return the options for the "Actions..." select
             * These are all bulk operations
             */
            getBulkWriteOptions: function() {
                var self = this;
                return [{
                    label: i18n("Add Tag"),
                    onClick: function() {
                        var ids = self._getSelected();
                        self.tagger.showAddTagDialog(ids);
                    }
                }, {
                    label:i18n("Remove Tag"),
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
                }, {
                    label: i18n("Clear Version Import Errors"),
                    onClick: function() {
                        var ids = self._getSelected();
                        self.confirmClearIntegrationErrors(ids);
                    }
                }];
            },

            /**
             *
             */
            getBulkReadOptions: function() {
                var self = this;
                return [{
                    label: i18n("Export"),
                    onClick: function() {
                        var ids = self._getSelected();
                        self.multipleExports(ids);
                    }
                 }
                ];
            },


            /***********************************************************************
             * HOVER ACTIONS
             **********************************************************************/

            /**
             * This is responsible for creating the edit icon for row hover actions
             */
            addEditActions: function(item, result) {
                var self = this;
                var editButton = new Button({
                    showTitle: false,
                    iconClass: "editIcon",
                    title: i18n("Edit"),
                    onClick: function() {
                        self.editComponent(item);
                    }
                });
                editButton.placeAt(result);
            },

            /**
             * Returns the options for the Actions select on row hover that need
             * write permission.
             */
            getRowWriteActions: function(item) {
                var self = this;
                return [{
                    label: i18n("Delete"),
                    onClick: function() {
                        self.confirmDelete(item);
                    }
                },{
                    label: i18n("Clear Version Import Errors"),
                    onClick: function() {
                        self.confirmClearIntegrationError(item);
                    }
                }];
            },

            /**
             * Returns the options for the Actions select on row hover that need
             * create permission.
             */
            getRowCopyActions: function(item) {
                var self = this;
                return [{
                    label: i18n("Copy"),
                    onClick: function() {
                        if (!!item.template) {
                            xhr.get({
                                "url": bootstrap.restUrl+"deploy/componentTemplate/" + item.template.id + "/" + item.template.version,
                                "handleAs": "json",
                                "load": function(data) {
                                    self.showNewComponentDialog(item);
                                },
                                "error": function(resp, ioArgs) {
                                    var alert;
                                    if (resp.status === 403) {
                                        alert = new Alert({
                                            message: i18n("Cannot copy a component based on a component template the user does not have read access to.")
                                        });
                                    }
                                    else {
                                        alert = new Alert({
                                            message: i18n("Unknown error loading component template.")
                                        });
                                    }
                                    alert.startup();
                                }
                            });
                        }
                        else {
                            self.showNewComponentDialog(item);
                        }
                    }
                }];
            },

            /**
             * Returns the options for the Actions select on row hover that need
             * read permission.
             */
            getRowReadActions: function(item) {
                return [{
                    label: i18n("Export"),
                    onClick: function() {
                        util.downloadFile(bootstrap.restUrl+"deploy/component/"+item.id+"/export");
                    }
                }];
            },


            /***********************************************************************
             * FORMATTERS
             **********************************************************************/

            /**
             *
             */
            actionsFormatter: function(item) {
                var self = this;

                var result = domConstruct.create("div", {
                    "dir": util.getUIDir(),
                    "align": util.getUIDirAlign(),
                    "class": "tableHoverActions"
                });

                var menuActions = [];

                if (
                   (config.data.permissions[security.system.createComponents] && !item.template) ||
                   (config.data.permissions[security.system.createComponentsFromTemplate] && !!item.template)
                ) {
                    array.forEach(self.getRowCopyActions(item), function(action) {
                        menuActions.push(action);
                    });
                }

                if (item.security && item.security.read) {
                    array.forEach(self.getRowReadActions(item), function(action) {
                        menuActions.push(action);
                    });
                }

                if (item.security && item.security["Edit Basic Settings"]) {
                    self.addEditActions(item, result);
                    array.forEach(self.getRowWriteActions(item), function(action) {
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

            /**
             * Export many components
             */
            multipleExports: function(ids) {
               var self = this;
               if (ids.length) {
                   var queryParam = "?ids=" + ids.join();
                   util.downloadFile(bootstrap.restUrl + 'deploy/component/export' + queryParam);
               }
            },

            /**
             * Delete many components
             */
            confirmDeletes: function(items, callback) {
                var self = this;

                if (!items.length) {
                    var alert = new Alert({
                        message: i18n("Please select at least one component to delete.")
                    });
                    alert.startup();
                }
                else {
                    var confirm = new GenericConfirm({
                        message: i18n("Are you sure you want to delete %s components?", items.length),
                        action: function() {
                            xhr.del({
                                url: bootstrap.restUrl + "deploy/component/delete",
                                headers: { "Content-Type": "application/json" },
                                putData: JSON.stringify({componentIds: items}),
                                load: function() {
                                    if (callback) {
                                        callback();
                                    }
                                    self.grid.refresh();
                                },
                                error: function(error) {
                                    new Alert({
                                        title: i18n("Error deleting component"),
                                        message: error.responseText
                                    }).startup();
                                    self.grid.unblock();
                                }
                            });
                        }
                    });
                }
            },

            confirmClearIntegrationErrors: function(items) {
                var self = this;

                if (!items.length) {
                    var alert = new Alert({
                        message: i18n("Please select at least one component.")
                    });
                    alert.startup();
                }
                else {
                    var confirm = new GenericConfirm({
                        message: i18n("Are you sure you want to dismiss the import failure alerts on %s components? Records of the attempted imports will remain in history.", items.length),
                        action: function() {
                            xhr.put({
                                url: bootstrap.restUrl + "deploy/component/clearIntegrationErrors",
                                headers: { "Content-Type": "application/json" },
                                putData: JSON.stringify({componentIds : items}),
                                load: function(data) {
                                    self.grid.refresh();
                                },
                                error: function(error) {
                                    new Alert({
                                        title: i18n("Error clearing import failures"),
                                        message: error.responseText
                                    }).startup();
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
            editComponent: function(item) {
                var self = this;
                xhr.get({
                    url: bootstrap.restUrl + "deploy/component/" + item.id,
                    handleAs: "json",
                    load: function(response) {
                        var editComponentDialog = new Dialog({
                            title: i18n("Edit Component"),
                            closable: true,
                            draggable: true
                        });

                        var editComponent = new EditComponent({
                            component: response,
                            readOnly: !response.security["Edit Basic Settings"],
                            noRedirect: true,
                            callback: function() {
                                editComponentDialog.hide();
                                editComponentDialog.destroy();
                                self.grid.refresh();
                            }
                        });
                        editComponent.placeAt(editComponentDialog);
                        editComponentDialog.show();
                    }
                });
            },

            /**
             * Delete a single component
             */
            confirmDelete: function(target) {
                var self = this;

                var confirm = new GenericConfirm({
                    message: i18n("Are you sure you want to delete %s? " +
                            "This will permanently delete it from the system.", target.name.escape()),
                    action: function() {
                        self.grid.block();
                        xhr.del({
                            url: bootstrap.restUrl+"deploy/component/"+target.id,
                            handleAs: "json",
                            load: function(data) {
                                self.grid.unblock();
                                self.grid.refresh();
                            },
                            error: function(error) {
                                new Alert({
                                    title:i18n("Error deleting component"),
                                    message: error.responseText
                                }).startup();
                                self.grid.unblock();
                            }
                        });
                    }
                });
            },

            /*
             * Clear integration errors on a single target
             */
            confirmClearIntegrationError: function(target) {
                var self = this;

                var confirm = new GenericConfirm({
                    message: i18n("Are you sure you want to dismiss the import failure alert on this component? Records of the attempted imports will remain in its history."),
                    action: function() {
                        xhr.put({
                            url: bootstrap.restUrl + "deploy/component/clearIntegrationErrors",
                            headers: { "Content-Type": "application/json" },
                            putData: JSON.stringify({componentIds : [target.id]}),
                            load: function(data) {
                                self.grid.refresh();
                            },
                            error: function(error) {
                                new Alert({
                                    title: i18n("Error clearing import failures"),
                                    message: error.responseText
                                }).startup();
                                self.grid.unblock();
                            }
                        });
                    }
                });
            },

            /***********************************************************************
             * MISC
             **********************************************************************/

            /**
             *
             */
            _getSelected: function() {
                return array.map(this.grid.getSelectedItems(), function(item) {
                    return item.id;
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
            showNewComponentDialog: function(source) {
                var self = this;

                var newComponentDialog = new Dialog({
                    title: i18n("Create Component"),
                    closable: true,
                    draggable: true,
                    description: i18n("When you create a component, you identify the source and define how the artifacts are brought into UrbanCode Deploy.")
                });

                var newComponentForm = new EditComponent({
                    source: source,
                    callback: function() {
                        newComponentDialog.hide();
                        newComponentDialog.destroy();
                    }
                });
                newComponentForm.placeAt(newComponentDialog.containerNode);
                newComponentDialog.show();
            },

            /**
             *
             */
            showImportComponentDialog: function() {
                var self = this;

                var dialog = new Dialog({
                    "title": i18n("Import Components"),
                    "closable":true,
                    "draggable":true
                });

                self.importIsUpgrade = false;
                self.importTemplateUpgradeType = "USE_EXISTING_IF_EXISTS";
                self.processUpgradeType = "USE_EXISTING_IF_EXISTS";

                var form = domConstruct.create("form", {
                    target: "formTarget",
                    method: "Post",
                    enctype: "multipart/form-data",
                    encoding: "multipart/form-data",
                    className: "importForm"
                });

                var fileInputDiv = domConstruct.create("div", {
                    className: "filInputContainer"
                });
                var fileInput = domConstruct.create("input", {
                    type: "file",
                    name: "file",
                    className: "fileInput"
                });
                domConstruct.place(fileInput, fileInputDiv);

                //checkbox for upgrade
                var checkBoxRow = domConstruct.create("div", {
                    className: "labelsAndValues-row"
                });
                var checkBoxDiv = domConstruct.create("div", {
                    className: "labelsAndValues-valueCell inlineBlock"
                });
                var checkBoxLabel = domConstruct.create("label", {
                    "for": "upgradeComponent",
                    className: "labelsAndValues-labelCell inlineBlock",
                    innerHTML: i18n("Upgrade Component")
                });
                var upgradeInput = new CheckBox({
                    name: "upgradeComponent",
                    checked: false,
                    onChange: function(evt) {
                        self.importIsUpgrade = this.get("checked");
                        self.setFormAction(form);
                    }
                });

                upgradeInput.placeAt(checkBoxDiv);
                checkBoxRow.appendChild(checkBoxDiv);
                checkBoxRow.appendChild(checkBoxLabel);

                //Select for upgrade type
                var selectRow = domConstruct.create("div", {
                    className: "labelsAndValues-row"
                });
                var selectBoxDiv = domConstruct.create("div", {
                    className: "labelsAndValues-valueCell"
                });
                var selectBoxLabel = domConstruct.create("div", {
                    className: "labelsAndValues-labelCell",
                    innerHTML: i18n("Component Template Upgrade Type")
                });

                var templateUpgradeTypeInput = new Select({
                    name: "templateUpgradeTypeInput",
                    options: [
                          {label: i18n("Use Existing Template"), value: "USE_EXISTING_IF_EXISTS"},
                          {label: i18n("Create Template"), value: "CREATE_NEW_IF_EXISTS"},
                          {label: i18n("Fail If Template Exists"), value: "FAIL_IF_EXISTS"},
                          {label: i18n("Fail If Template Does Not Exist"), value: "FAIL_IF_DOESNT_EXIST"},
                          {label: i18n("Upgrade Template If Exists"), value: "UPGRADE_IF_EXISTS"}
                    ],
                    onChange: function(evt) {
                        self.importTemplateUpgradeType = this.get("value");
                        self.setFormAction(form);
                    }
                });

                templateUpgradeTypeInput.placeAt(selectBoxDiv);
                selectRow.appendChild(selectBoxLabel);
                selectRow.appendChild(selectBoxDiv);


                //Select for process upgrade type
                var processSelectRow = domConstruct.create("div", {
                    className: "labelsAndValues-row"
                });
                var processSelectBoxDiv = domConstruct.create("div", {
                    className: "labelsAndValues-valueCell"
                });
                var processSelectBoxLabel = domConstruct.create("div", {
                    className: "labelsAndValues-labelCell",
                    innerHTML: i18n("Generic Process Upgrade Type")
                });

                var processUpgradeTypeInput = new Select({
                    name: "processUpgradeTypeInput",
                    options: [
                          {label: i18n("Use Existing Process"), value: "USE_EXISTING_IF_EXISTS"},
                          {label: i18n("Create Process"), value: "CREATE_NEW_IF_EXISTS"},
                          {label: i18n("Fail If Process Exists"), value: "FAIL_IF_EXISTS"},
                          {label: i18n("Fail If Process Does Not Exist"), value: "FAIL_IF_DOESNT_EXIST"},
                          {label: i18n("Upgrade Process If Exists"), value: "UPGRADE_IF_EXISTS"}
                    ],
                    onChange: function(evt) {
                        self.processUpgradeType = this.get("value");
                        self.setFormAction(form);
                    }
                });

                processUpgradeTypeInput.placeAt(processSelectBoxDiv);
                processSelectRow.appendChild(processSelectBoxLabel);
                processSelectRow.appendChild(processSelectBoxDiv);


                //submit button
                var submitDiv = domConstruct.create("div");

                var submitButton = new Button({
                    label: i18n("Submit"),
                    type: "submit"
                });
                submitButton.placeAt(submitDiv);

                //adding all parts to the form
                form.appendChild(checkBoxRow);
                form.appendChild(selectRow);
                form.appendChild(processSelectRow);
                form.appendChild(fileInputDiv);
                form.appendChild(submitDiv);

                dialog.containerNode.appendChild(form);

                form.onsubmit = function() {
                    var result = true;
                    if (!fileInput.value) {
                        var fileAlert = new Alert({
                            message: i18n("Please choose a template json file to import.")
                        });
                        result = false;
                    }
                    else {
                        self.setFormAction(form);

                        ioIframe.send({
                            form: form,
                            handleAs: "json",
                            load: function(response) {
                                if (response.status === "ok") {
                                    dialog.hide();
                                    dialog.destroy();
                                    self.grid.refresh();
                                }
                                else {
                                    var msg = response.error || "";
                                    var fileAlert = new Alert({
                                        message: i18n("Error importing component: %s", msg)
                                    });
                                    fileAlert.startup();
                                }
                            },
                            error: function(response) {
                                var msg = response.error || "";
                                var fileAlert = new Alert({
                                    message: i18n("Error importing component: %s", msg)
                                });
                                fileAlert.startup();
                            }
                        });
                    }
                    return result;
                };

                dialog.show();
            },

            /**
             *
             */
            setFormAction: function(form) {
                var self = this;
                var sessionValue = util.getCookie(bootstrap.expectedSessionCookieName);

                form.action = bootstrap.restUrl + "deploy/component/" +
                    (self.importIsUpgrade === true?"upgrade":"import") + "?upgradeType=" +
                    self.importTemplateUpgradeType + "&processUpgradeType=" +
                    self.processUpgradeType + "&" +bootstrap.expectedSessionCookieName+"="+sessionValue;
            },

            showStats: function() {
                var self = this;
                this.getStats().then(function(data) {
                    self.successStatAttach.textContent = data.SUCCESS;
                    self.importingStatAttach.textContent = data.IMPORTING;
                    self.noVersionStatAttach.textContent = data["NO VERSION"];
                    self.failedStatAttach.textContent = data.FAILURE;
                    self.noArtifactStatAttach.textContent = data["NO ARTIFACT"];
                });
            },

            getStats: function() {
                var url = bootstrap.restUrl + "deploy/component/stats";
                var deferred = new Deferred();
                xhr.get({
                    url: url,
                    handleAs: "json",
                    load: function(data) {
                        deferred.resolve(data);
                    },
                    error: function(error) {
                        deferred.reject(error);
                    }
                });
                return deferred;
            }
        }
    );
});

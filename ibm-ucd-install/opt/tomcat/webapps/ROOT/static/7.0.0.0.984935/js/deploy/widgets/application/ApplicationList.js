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
/*global define, require, i18n, security */

define([
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dijit/form/Select",
        "dijit/form/Button",
        "dijit/form/CheckBox",
        "dijit/form/TextBox",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/_base/array",
        "dojo/dom-class",
        "dojo/dom-geometry",
        "dojo/dom-construct",
        "dojo/on",
        "deploy/widgets/Formatters",
        "deploy/widgets/application/EditApplication",
        "deploy/widgets/application/wizard/ApplicationWizard",
        "deploy/widgets/application/wizard/WizardProgressVisualization",
        "deploy/widgets/tag/Tagger",
        "deploy/widgets/filter/TagFilter",
        "js/webext/widgets/Alert",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Dialog",
        "deploy/widgets/wizard/WizardDialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/form/MenuButton",
        "js/util/blocker/BlockingContainer",
        "dojo/store/Memory",
        "js/webext/widgets/table/TreeTable",
        "dojo/data/ObjectStore",
        "deploy/widgets/tag/TagDisplay",
        "dojo/io/iframe"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Select,
        Button,
        CheckBox,
        TextBox,
        declare,
        xhr,
        array,
        domClass,
        domGeom,
        domConstruct,
        on,
        Formatters,
        EditApplication,
        ApplicationWizard,
        WizardProgressVisualization,
        Tagger,
        TagFilter,
        Alert,
        ColumnForm,
        Dialog,
        WizardDialog,
        GenericConfirm,
        MenuButton,
        BlockingContainer,
        Memory,
        TreeTable,
        ObjectStore,
        TagDisplay,
        ioIframe
) {
    /**
     *
     */
    return declare('deploy.widgets.application.ApplicationList',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="applicationList">' +
                '<div data-dojo-attach-point="buttonAttach" style="position:relative; z-index=1;"></div>' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
                '<div data-dojo-attach-point="activeBoxAttach" style="margin: 2px;"></div>' +
            '</div>',

        _BASIC_VIEW: 'deploy/application',
        _ALL_VIEW: 'deploy/application/all',
        _TAG_VIEW: 'deploy/application/all/sort?sort=tag',
        _TEAM_VIEW: 'deploy/application/all/sort?sort=team',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            this.currentView = self._BASIC_VIEW;
            self.selectStore = domConstruct.create("div");

            self.viewSelect = new Select({
                options: [{
                    label: i18n("Flat list"),
                    value: self._BASIC_VIEW,
                    selected: true
                },{
                    label: i18n("By Tag"),
                    value: self._TAG_VIEW
                },{
                    label: i18n("By Team"),
                    value: self._TEAM_VIEW
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
                    domConstruct.empty(self.activeBoxAttach);
                    self.grid.destroy();
                    var active = (self.currentView !== self._BASIC_VIEW);
                    self.makeTable(self.currentView, self.getColumns(), active);
                }
            });
            this.makeTable(self.currentView, self.getColumns());
        },

        /*
         *
         */
        makeTable: function(tableUrl, layout, activeOnly) {
            var self = this;
            var hideExpandCollapse = (tableUrl === self._BASIC_VIEW);

            // temp fix until Tag and Team tables can be paginated
            var serverSideProcessing = (tableUrl === self._BASIC_VIEW);

            this.grid = new TreeTable({
                "url": bootstrap.restUrl+tableUrl,
                "serverSideProcessing": serverSideProcessing,
                "noDataMessage": i18n("No applications found."),
                "tableConfigKey": "applicationList",
                "orderField": "name",
                "selectorField": "id",
                "hidePagination": false,
                "hideExpandCollapse": hideExpandCollapse,
                "selectable": function(item) { return !item.isRoot; },
                "columns": layout,
                "isSelectable": function(item) { return !item.isRoot; },
                "hasChildren": function(item) { return !!item.isRoot; },
                "getChildUrl": function(item) {
                    return bootstrap.restUrl + "deploy/application/all/" + item.type + "/" + item.id;
                },
                "queryData": {
                    "outputType":
                        ["BASIC",
                         "SECURITY",
                         "LINKED"]
                }
            });
            this.grid.placeAt(this.gridAttach);
            this.buttonAttach = this.grid.buttonAttach;

            this.addTopButtons();

            // Add "Actions..." button
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

                self.grid.on("selectItem", onSelectChange);
                self.grid.on("deselectItem", onSelectChange);
                self.grid.on("displayTable", onSelectChange);
            }

            if (config.data.systemConfiguration.enableInactiveLinks && !activeOnly) {
                var activeBox = new CheckBox({
                    checked: false,
                    value: 'true',
                    onChange: function(value) {
                        if (value) {
                            self.grid.url = bootstrap.restUrl+self._ALL_VIEW;
                        }
                        else {
                            self.grid.url = bootstrap.restUrl+self._BASIC_VIEW;
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
                activeLabel.innerHTML = i18n("Show Inactive Applications");
                this.activeBoxAttach.appendChild(activeLabel);
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
         * Returns the name column
         */
        getNameColumn: function() {
            var self = this;
            return {
                "name": i18n("Name"),
                "formatter": function(item, value, cell) {
                    cell.style.position = "relative";

                    var result = domConstruct.create("div", {
                        "class": "inlineBlock",
                        "style": "margin-" + (domGeom.isBodyLtr()?"right":"left") + ":78px;"
                    });
                    var itemWrapper = domConstruct.create("div", {
                        "class": "inlineBlock"
                    });
                    domConstruct.place(itemWrapper, result);
                    if (item.isRoot) {
                            if (item.color) {
                                var tag = [];
                                tag.push(item);
                                var labelTag = new TagDisplay({
                                    "readOnly": true,
                                    "tags": tag
                                });
                                labelTag.placeAt(result);
                            }
                            else {
                                return item.name;
                            }
                        }
                        else {
                            var link = Formatters.applicationLinkFormatter(item);
                            domConstruct.place(link, itemWrapper);

                            self.tagger = new Tagger({
                                "objectType": "Application",
                                "item": item,
                                "callback": function() {
                                    self.grid.refresh();
                                }
                            });
                            self.tagger.placeAt(result);

                            domConstruct.place(self.actionsFormatter(item), result);
                        }
                        return result;
                },
                "orderField": "name",
                "filterField": "name",
                "filterType": "custom",
                getRawValue: function(item) {
                    return item.name;
                },
                getFilterFields: function() {
                    var result = [];

                    result.push(new TextBox({
                        name: "name",
                        "class": "filter",
                        style: { "width": "45%" },
                        placeHolder: i18n("Name"),
                        type: "like"
                    }));

                    if (self.currentView === "basic") {
                        result.push(new TagFilter({
                            name: "tags",
                            "class": "filter",
                            style: { width: "45%" },
                            placeHolder: i18n("Tags"),
                            type: "eq"
                        }));
                    }

                    return result;
                }
            };
        },

        /**
         * Returns all columns that are not the name column
         */
        getOtherColumns: function() {
            return [{
                name: i18n("Template"),
                field: "template",
                formatter: function(item) {
                    var result = "";
                    if (item.template) {
                        result = item.template.name;
                    }
                    return result;
                }
            },{
                name: i18n("Description"),
                field: "description",
                orderField: "description",
                filterField: "description",
                filterType: "text",
                getRawValue: function(item) {
                    return item.description;
                }
            },{
                name: i18n("Created"),
                field: "created",
                formatter: util.tableDateFormatter,
                orderField: "dateCreated",
                getRawValue: function(item) {
                    return new Date(item.created);
                }
            },{
                name: i18n("By"),
                field: "user",
                orderField: "user.name",
                filterField: "user.name",
                filterType: "text",
                getRawValue: function(item) {
                    return item.user;
                }
            }];
        },


        /***********************************************************************
         * TOP BUTTONS
         **********************************************************************/

        /**
         * This returns an array of the buttons that should be at the top of
         * the table.
         *      e.g. Create Application
         *
         * This does NOT include the Select dropdown or the Actions dropdown
         */
        addTopButtons: function() {
            var self = this;

            // Boolean values for below logic
            var canCreate = config.data.permissions[security.system.createApplications];
            var canCreateWithTemplate
                    = config.data.permissions[security.system.createApplicationsFromTemplate];

            if (canCreate || canCreateWithTemplate) {
                var newApplicationButton = {
                    label: i18n("Create Application"),
                    showTitle: false,
                    onClick: function() {
                        self.showNewApplicationDialog();
                    }
                };
                var applicationButton = new Button(newApplicationButton).placeAt(this.buttonAttach);
                domClass.add(applicationButton.domNode, "idxButtonSpecial");

            }

            if (canCreate) {
                var importApplicationButton = {
                    "label": i18n("Import Applications"),
                    "showTitle": false,
                    "onClick": function() {
                        self.showImportApplicationDialog();
                    }
                };

                new Button(importApplicationButton).placeAt(this.buttonAttach);
            }
        },

        /**
         * Bulk Actions that require write permission
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

        /**
         * Bulk Actions that require read permission
         */
        getBulkReadOptions: function() {
            var self = this;
            return [{
                label: i18n("Export"),
                onClick: function() {
                    // Decide if we are trying to export and application based on a template.
                    var exportingTemplate = array.some(self.grid.getSelectedItems(), function(item) {
                        return !!item.templateId;
                    });

                    var ids = self._getSelected();
                    self.multipleExports(ids);
                }
            }];
        },

        /**
         * Returns an array of selected item ids
         */
        _getSelected: function() {
            return array.map(this.grid.getSelectedItems(), function(item) {
                return item.id;
            });
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
                    self.editApplication(item);
                }
            });
            editButton.placeAt(result);
        },

        /**
         * Returns all actions that can be taken on a row that require
         * write permission.
         */
        getRowWriteActions: function(item) {
            var self = this;
            return [{
                label: i18n("Delete"),
                onClick: function() {
                    self.confirmDelete(item);
                }
            }];
        },

        /**
         * Returns all actions that can be taken on a row that require
         * read permission.
         */
        getRowReadActions: function(item) {
            var self = this;
            return [{
                label: i18n("Export"),
                onClick: function() {
                    util.downloadFile(bootstrap.restUrl+"deploy/application/"+item.id+"/export");
                }
            },{
                label: i18n("Export With Snapshots"),
                onClick: function() {
                    self.exportWithSnapshots(item);
                }
            }];
        },

        /***********************************************************************
         * FORMATTERS
         **********************************************************************/

        /**
         * Responsible for creating the row hover actions
         */
        actionsFormatter: function(item) {
            var self = this;

            var result = domConstruct.create("div", {
                "dir": util.getUIDir(),
                "align": util.getUIDirAlign(),
                "class": "tableHoverActions"
            });

            var menuActions = [];

            if (item.security.read) {
                array.forEach(self.getRowReadActions(item), function(action) {
                    menuActions.push(action);
                });
            }

            if (item.security["Edit Basic Settings"]) {
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
         * Export many applications
         */
        multipleExports: function(ids) {
            if (ids.length) {
                var queryParam = "?ids=" + ids.join();
                util.downloadFile(bootstrap.restUrl + 'deploy/application/export' + queryParam);
            }
        },

        /**
         * Delete many applications
         */
        confirmDeletes: function(items, callback) {
            var self = this;

            if (!items.length) {
                var alert = new Alert({
                    message: i18n("Please select at least one application to delete")
                });
                alert.startup();
            }
            else {
                var confirm = new GenericConfirm({
                    message: i18n("Are you sure you want to delete %s applications?", items.length),
                    action: function() {
                        xhr.del({
                            url: bootstrap.restUrl + "deploy/application/delete",
                            headers: { "Content-Type": "application/json" },
                            putData: JSON.stringify({applicationIds: items}),
                            load: function() {
                                if (callback) {
                                    callback();
                                }
                                self.grid.refresh();
                            },
                            error: function(error) {
                                new Alert({
                                    title: i18n("Error deleting application"),
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
        editApplication: function(item) {
            var self = this;
            xhr.get({
                url: bootstrap.restUrl + "deploy/application/" + item.id,
                handleAs: "json",
                load: function(response) {
                    var editApplicationDialog = new Dialog({
                        title: i18n("Edit Application"),
                        closable: true,
                        draggable: true
                    });

                    var editApplication = new EditApplication({
                        application: response,
                        readOnly: !response.security["Edit Basic Settings"],
                        noRedirect: true,
                        callback: function() {
                            editApplicationDialog.hide();
                            editApplicationDialog.destroy();
                            self.grid.refresh();
                        }
                    });
                    editApplication.placeAt(editApplicationDialog);
                    editApplicationDialog.show();
                },
                error: function(error) {

                }
            });
        },

        /**
         *
         */
        confirmDelete: function(target) {
            var self = this;

            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to delete %s? " +
                        "This will permanently delete it from the system.", target.name),
                action: function() {
                    self.grid.block();
                    xhr.del({
                        url: bootstrap.restUrl+"deploy/application/"+target.id,
                        handleAs: "json",
                        load: function(data) {
                            self.grid.unblock();
                            self.grid.refresh();
                        },
                        error: function(error) {
                            new Alert({
                                title: i18n("Error deleting application"),
                                message: error.responseText
                            }).startup();
                            self.grid.unblock();
                        }
                    });
                }
            });
        },

        exportWithSnapshots: function(target) {
            var blocker = new BlockingContainer();

            var exportDialog = new Dialog({
                title: i18n("Select Snapshots"),
                closable: true,
                draggable: true
            });

            blocker.placeAt(exportDialog.containerNode);
            var exportForm = new ColumnForm({
                onSubmit: function(data) {
                    blocker.block();
                    var downloadUrl = bootstrap.restUrl+"deploy/application/"+target.id+"/exportWithArtifacts";
                    if (data.snapshotIds) {
                        downloadUrl += "?snapshotIds="+data.snapshotIds;
                    }
                    util.downloadFile(downloadUrl);
                    this.callback();
                },
                postSubmit: function(data) {
                    if (this.callback !== undefined) {
                        this.callback();
                    }
                },
                onCancel: function() {
                    if (this.callback !== undefined) {
                        this.callback();
                    }
                },
                callback: function() {
                    blocker.unblock();
                    exportDialog.hide();
                    exportDialog.destroy();
                }
            });

            var note = domConstruct.create("p", {
                innerHTML: i18n("Select snapshots to export with the application.%s" +
                        "Once submitted, the download may take a few moments to begin.", "<br/>"),
                style: {
                    "margin-left": "10px"
                }
            });
            domConstruct.place(note, blocker.containerNode);

            exportForm.addField({
                name: "snapshotIds",
                label: i18n("Include Snapshots"),
                required: true,
                type: "TableFilterMultiSelect",
                url: bootstrap.restUrl+"deploy/application/"+target.id+"/snapshots/false"
            });

            exportForm.placeAt(blocker);
            exportDialog.show();
        },

        /***********************************************************************
         * MISC
         **********************************************************************/

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
        showImportApplicationDialog: function() {
            var self = this;

            var blocker = new BlockingContainer();
            var dialog = new Dialog({
                "title": i18n("Import Applications"),
                "closable":true,
                "draggable":true
            });

            blocker.placeAt(dialog.containerNode);

            self.importIsUpgrade = false;
            self.includesArtifacts = false;
            self.appTemplateUpgradeType = "USE_EXISTING_IF_EXISTS";
            self.importComponentUpgradeType = "USE_EXISTING_IF_EXISTS";
            self.processUpgradeType = "USE_EXISTING_IF_EXISTS";
            self.resourceTemplateUpgradeType = "USE_EXISTING_IF_EXISTS";
            var form = domConstruct.create("form", {
                target: "formTarget",
                method: "Post",
                enctype: "multipart/form-data",
                encoding: "multipart/form-data"
            });
            dojo.addClass(form, "importForm");

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
                "for": "upgradeApplication",
                className: "labelsAndValues-labelCell inlineBlock",
                innerHTML: i18n("Upgrade Application")
            });
            var upgradeInput = new CheckBox({
                name: "upgradeApplication",
                checked: false,
                onChange: function(evt) {
                    self.importIsUpgrade = this.get("checked");
                    self.setFormAction(form);
                }
            });

            upgradeInput.placeAt(checkBoxDiv);
            checkBoxRow.appendChild(checkBoxDiv);
            checkBoxRow.appendChild(checkBoxLabel);

            var artifactBoxRow = domConstruct.create("div", {
                className: "labelsAndValues-row"
            });
            var artifactBoxDiv = domConstruct.create("div", {
                className: "labelsAndValues-valueCell inlineBlock"
            });
            var artifactBoxLabel = domConstruct.create("label", {
                "for": "includesArtifacts",
                className: "labelsAndValues-labelCell inlineBlock",
                innerHTML: i18n("Import with Snapshots")
            });
            var artifactsInput = new CheckBox({
                name: "includesArtifacts",
                checked: false,
                onChange: function(evt) {
                    self.includesArtifacts = this.get("checked");
                    self.setFormAction(form);
                }
            });

            artifactsInput.placeAt(artifactBoxDiv);
            artifactBoxRow.appendChild(artifactBoxDiv);
            artifactBoxRow.appendChild(artifactBoxLabel);

          //Select for template upgrade type
            var templateRow = domConstruct.create("div", {
                className: "labelsAndValues-row"
            });
            var templateBoxDiv = domConstruct.create("div", {
                className: "labelsAndValues-valueCell inlineBlock"
            });
            var templateBoxLabel = domConstruct.create("div", {
                className: "labelsAndValues-labelCell inlineBlock",
                innerHTML: i18n("Application Template Upgrade Type")
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
                    self.appTemplateUpgradeType = this.get("value");
                    self.setFormAction(form);
                }
            });

            templateUpgradeTypeInput.placeAt(templateBoxDiv);
            templateRow.appendChild(templateBoxLabel);
            templateRow.appendChild(templateBoxDiv);

            //Select for upgrade type
            var selectRow = domConstruct.create("div", {
                className: "labelsAndValues-row"
            });
            var selectBoxDiv = domConstruct.create("div", {
                className: "labelsAndValues-valueCell inlineBlock"
            });
            var selectBoxLabel = domConstruct.create("div", {
                className: "labelsAndValues-labelCell inlineBlock",
                innerHTML: i18n("Component Upgrade Type")
            });

            var componentUpgradeTypeInput = new Select({
                name: "componentUpgradeTypeInput",
                options: [
                      {label: i18n("Use Existing Component"), value: "USE_EXISTING_IF_EXISTS"},
                      {label: i18n("Create Component"), value: "CREATE_NEW_IF_EXISTS"},
                      {label: i18n("Fail If Component Exists"), value: "FAIL_IF_EXISTS"},
                      {label: i18n("Fail If Component Does Not Exist"), value: "FAIL_IF_DOESNT_EXIST"},
                      {label: i18n("Upgrade Component If Exists"), value: "UPGRADE_IF_EXISTS"}
                ],
                onChange: function(evt) {
                    self.importComponentUpgradeType = this.get("value");
                    self.setFormAction(form);
                }
            });

            componentUpgradeTypeInput.placeAt(selectBoxDiv);
            selectRow.appendChild(selectBoxLabel);
            selectRow.appendChild(selectBoxDiv);

            //Select for process upgrade type
            var processSelectRow = domConstruct.create("div", {
                className: "labelsAndValues-row"
            });
            var processSelectBoxDiv = domConstruct.create("div", {
                className: "labelsAndValues-valueCell inlineBlock"
            });
            var processSelectBoxLabel = domConstruct.create("div", {
                className: "labelsAndValues-labelCell inlineBlock",
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

            //Select for process upgrade type
            var resourceTemplateSelectRow = domConstruct.create("div", {
                className: "labelsAndValues-row"
            });
            var resourceTemplateSelectBoxDiv = domConstruct.create("div", {
                className: "labelsAndValues-valueCell inlineBlock"
            });
            var resourceTemplateSelectBoxLabel = domConstruct.create("div", {
                className: "labelsAndValues-labelCell inlineBlock",
                innerHTML: i18n("Resource Template Upgrade Type")
            });

            var resourceTemplateUpgradeTypeInput = new Select({
                name: "resourceTemplateUpgradeTypeInput",
                options: [
                      {label: i18n("Use Existing Resource Template"), value: "USE_EXISTING_IF_EXISTS"},
                      {label: i18n("Create Resource Template"), value: "CREATE_NEW_IF_EXISTS"},
                      {label: i18n("Fail If Resource Template Exists"), value: "FAIL_IF_EXISTS"},
                      {label: i18n("Fail If Resource Template Does Not Exist"), value: "FAIL_IF_DOESNT_EXIST"},
                      {label: i18n("Upgrade Resource Template If Exists"), value: "UPGRADE_IF_EXISTS"}
                ],
                onChange: function(evt) {
                    self.resourceTemplateUpgradeType = this.get("value");
                    self.setFormAction(form);
                }
            });

            resourceTemplateUpgradeTypeInput.placeAt(resourceTemplateSelectBoxDiv);
            resourceTemplateSelectRow.appendChild(resourceTemplateSelectBoxLabel);
            resourceTemplateSelectRow.appendChild(resourceTemplateSelectBoxDiv);

            //submit button
            var submitDiv = domConstruct.create("div");

            var submitButton = new Button({
                label: i18n("Submit"),
                type: "submit"
            });
            submitButton.placeAt(submitDiv);

            //adding all parts to the form
            form.appendChild(artifactBoxRow);
            form.appendChild(checkBoxRow);
            form.appendChild(templateRow);
            form.appendChild(selectRow);
            form.appendChild(processSelectRow);
            form.appendChild(resourceTemplateSelectRow);
            form.appendChild(fileInputDiv);
            form.appendChild(submitDiv);
            blocker.containerNode.appendChild(form);

            form.onsubmit = function() {
                var result = true;
                if (!fileInput.value) {
                    var fileAlert = new Alert({
                        message: i18n("Please choose a template json file to import.")
                    });
                    result = false;
                }
                else {
                    blocker.block();
                    self.setFormAction(form);

                    ioIframe.send({
                        form: form,
                        handleAs: "json",
                        load: function(response) {
                            blocker.unblock();
                            if (response.status === "ok") {
                                dialog.hide();
                                dialog.destroy();
                                self.grid.refresh();
                            }
                            else {
                                var msg = response.error || "";
                                var fileAlert = new Alert({
                                    message: i18n("Error importing application: %s", util.escape(msg))
                                });
                                fileAlert.startup();
                            }
                        },
                        error: function(response) {
                            blocker.unblock();
                            var msg = response.error || "";
                            var fileAlert = new Alert({
                                message: i18n("Error importing application: %s", util.escape(msg))
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

            form.action = bootstrap.restUrl + "deploy/application/" +
                (self.importIsUpgrade === true?"upgrade":"import") + (self.includesArtifacts === true?"WithArtifacts":"") + "?upgradeType=" +
                self.importComponentUpgradeType + "&compTempUpgradeType=" +
                self.importComponentUpgradeType + "&processUpgradeType=" +
                self.processUpgradeType + "&resourceTemplateUpgradeType=" +
                self.resourceTemplateUpgradeType + "&appTempUpgradeType=" +
                self.appTemplateUpgradeType + "&"+bootstrap.expectedSessionCookieName+"="+sessionValue;
        },

        /**
         *
         */
        showNewApplicationDialog: function() {
            var self = this;
            var applicationWizard = new ApplicationWizard({
            });

            var newApplicationDialog = new WizardDialog({
                title: i18n("Create Application"),
                closable: true,
                draggable: true,
                progressVisualization: WizardProgressVisualization,
                wizard: applicationWizard
            });

            applicationWizard.cleanup = function() {
                newApplicationDialog.hide();
                newApplicationDialog.destroy();
                self.grid.refresh();
            };

            newApplicationDialog.connect(newApplicationDialog, "hide", function(e) {
                applicationWizard.destroy();
                newApplicationDialog.destroy();
            });

            applicationWizard.startup();
            newApplicationDialog.show();
        }
    });
});

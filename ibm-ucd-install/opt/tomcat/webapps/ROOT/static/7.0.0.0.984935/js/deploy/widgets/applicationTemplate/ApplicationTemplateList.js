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
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/_base/array",
        "dojo/dom-class",
        "dojo/dom-geometry",
        "dojo/dom-construct",
        "dojo/on",
        "deploy/widgets/applicationTemplate/EditApplicationTemplate",
        "deploy/widgets/Formatters",
        "js/webext/widgets/Alert",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/form/MenuButton",
        "js/util/blocker/BlockingContainer",
        "js/webext/widgets/table/TreeTable",
        "dojo/io/iframe"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Select,
        Button,
        CheckBox,
        declare,
        xhr,
        array,
        domClass,
        domGeom,
        domConstruct,
        on,
        EditApplicationTemplate,
        Formatters,
        Alert,
        Dialog,
        GenericConfirm,
        MenuButton,
        BlockingContainer,
        TreeTable,
        ioIframe
) {
    /**
     *
     */
    return declare('deploy.widgets.application.ApplicationTemplateList',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="applicationTemplateList">' +
                '<div class="listTopButtons" data-dojo-attach-point="buttonAttach"></div>' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            self.addTopButtons();
            self.makeTable();
        },

        /*
         *
         */
        makeTable: function() {
            var self = this;

            this.grid = new TreeTable({
                url: bootstrap.restUrl + "deploy/applicationTemplate",
                serverSideProcessing: false,
                noDataMessage: i18n("No application templates found."),
                tableConfigKey: "applicationTemplateList",
                hidePagination: false,
                hideExpandCollapse: true,
                columns: [{
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

                        var link = Formatters.applicationTemplateLinkFormatter(item);
                        domConstruct.place(link, itemWrapper);
                        domConstruct.place(self.actionsFormatter(item), result);

                        return result;
                    },
                    orderField: "name",
                    filterField: "name",
                    filterType: "text",
                    getRawValue: function(item) {
                        return item.name;
                    }
                },{
                    name: i18n("Description"),
                    field: "description"
                },{
                    name: i18n("Created"),
                    field: "created",
                    formatter: util.tableDateFormatter,
                    orderField: "created",
                    getRawValue: function(item) {
                        return new Date(item.created);
                    }
                },{
                    name: i18n("By"),
                    field: "user",
                    orderField: "user",
                    getRawValue: function(item) {
                        return item.user;
                    }
                }]
            });

            this.grid.placeAt(this.gridAttach);
        },

        /***********************************************************************
         * TOP BUTTONS
         **********************************************************************/

        /**
         * This returns an array of the buttons that should be at the top of
         * the table.
         *      e.g. Create Application Template
         *
         * This does NOT include the Select dropdown or the Actions dropdown
         */
        addTopButtons: function() {
            var self = this;
            if (config.data.permissions[security.system.createApplicationTemplates]) {
                var newApplicationTemplateButton = {
                    label: i18n("Create Application Template"),
                    showTitle: false,
                    onClick: function() {
                        self.showNewApplicationTemplateDialog();
                    }
                };

                var applicationTemplateButton =
                        new Button(newApplicationTemplateButton).placeAt(this.buttonAttach);
                domClass.add(applicationTemplateButton.domNode, "idxButtonSpecial");

                var importApplicationButton = {
                    "label": i18n("Import Application Template"),
                    "showTitle": false,
                    "onClick": function() {
                        self.showImportApplicationTemplateDialog();
                    }
                };

                new Button(importApplicationButton).placeAt(this.buttonAttach);
            }
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
                    self.editApplicationTemplate(item);
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
                    util.downloadFile(bootstrap.restUrl+"deploy/applicationTemplate/"+item.id+"/export");
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
         * SINGLE OPERATIONS
         **********************************************************************/

        /**
         *
         */
        editApplicationTemplate: function(item) {
            var self = this;
            xhr.get({
                url: bootstrap.restUrl + "deploy/applicationTemplate/" + item.id,
                handleAs: "json",
                load: function(response) {
                    var editApplicationTemplateDialog = new Dialog({
                        title: i18n("Edit Application Template"),
                        closable: true,
                        draggable: true
                    });

                    var editApplicationTemplate = new EditApplicationTemplate({
                        applicationTemplate: response,
                        readOnly: !response.security["Edit Basic Settings"],
                        noRedirect: true,
                        callback: function() {
                            editApplicationTemplateDialog.hide();
                            editApplicationTemplateDialog.destroy();
                            self.grid.refresh();
                        },
                        // We don't need to refresh the table when canceling.
                        cancelCallback: function() {
                            editApplicationTemplateDialog.hide();
                            editApplicationTemplateDialog.destroy();
                        }
                    });
                    editApplicationTemplate.placeAt(editApplicationTemplateDialog);
                    editApplicationTemplateDialog.show();
                },
                error: function(error) {
                    new Alert({
                        title: i18n("Error retrieving application template for edit."),
                        message: error.responseText
                    }).startup();
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
                        "This will permanently delete it from the system.", target.name.escape()),
                action: function() {
                    self.grid.block();
                    xhr.del({
                        url: bootstrap.restUrl+"deploy/applicationTemplate/"+target.id,
                        handleAs: "json",
                        load: function(data) {
                            self.grid.unblock();
                            self.grid.refresh();
                        },
                        error: function(error) {
                            new Alert({
                                title: i18n("Error deleting application template"),
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
        destroy: function() {
            this.inherited(arguments);
            this.grid.destroy();
        },

        /**
         *
         */
        showImportApplicationTemplateDialog: function() {
            var self = this;

            var blocker = new BlockingContainer();
            var dialog = new Dialog({
                "title": i18n("Import Application Template"),
                "closable":true,
                "draggable":true
            });

            blocker.placeAt(dialog.containerNode);

            self.importIsUpgrade = false;
            var form = domConstruct.create("form", {
                target: "formTarget",
                method: "Post",
                enctype: "multipart/form-data",
                encoding: "multipart/form-data"
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
                "for": "upgradeApplication",
                className: "labelsAndValues-labelCell inlineBlock",
                innerHTML: i18n("Upgrade Application Template")
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
            checkBoxRow.appendChild(checkBoxLabel);
            checkBoxRow.appendChild(checkBoxDiv);

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

            self.processUpgradeType = processUpgradeTypeInput.get("value");
            processUpgradeTypeInput.placeAt(processSelectBoxDiv);
            processSelectRow.appendChild(processSelectBoxLabel);
            processSelectRow.appendChild(processSelectBoxDiv);

            //Select for resource template upgrade type
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

            self.resourceTemplateUpgradeType = resourceTemplateUpgradeTypeInput.get("value");
            resourceTemplateUpgradeTypeInput.placeAt(resourceTemplateSelectBoxDiv);
            resourceTemplateSelectRow.appendChild(resourceTemplateSelectBoxLabel);
            resourceTemplateSelectRow.appendChild(resourceTemplateSelectBoxDiv);

            //submit button
            var submitDiv = domConstruct.create("div", {
                style: "display:block; margin-top:10px;"
            });

            var submitButton = new Button({
                label: i18n("Submit"),
                type: "submit"
            });
            submitButton.placeAt(submitDiv);

            //adding all parts to the form
            form.appendChild(checkBoxRow);
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
                                    message: i18n("Error importing application template: %s", util.escape(msg))
                                });
                                fileAlert.startup();
                            }
                        },
                        error: function(response) {
                            blocker.unblock();
                            var msg = response.error || "";
                            var fileAlert = new Alert({
                                message: i18n("Error importing application template: %s", util.escape(msg))
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

            form.action = bootstrap.restUrl + "deploy/applicationTemplate/import"
                        + "?" + bootstrap.expectedSessionCookieName + "=" + sessionValue
                        + "&processUpgradeType=" + self.processUpgradeType
                        + "&resourceTemplateUpgradeType=" + self.resourceTemplateUpgradeType
                        + "&isUpgrade=" + self.importIsUpgrade;
        },

        /**
         *
         */
        showNewApplicationTemplateDialog: function() {
            var newApplicationtemplateDialog = new Dialog({
                title: i18n("Create Application Template"),
                closable: true,
                draggable: true
            });

            var newApplicationTemplateForm = new EditApplicationTemplate({
                callback: function() {
                    newApplicationtemplateDialog.hide();
                    newApplicationtemplateDialog.destroy();
                }
            });
            newApplicationTemplateForm.placeAt(newApplicationtemplateDialog.containerNode);
            newApplicationtemplateDialog.show();
        }
    });
});

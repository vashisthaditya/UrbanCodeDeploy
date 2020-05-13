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
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/dom-class",
        "dojo/dom-geometry",
        "dojo/dom-construct",
        "dojo/json",
        "dojo/on",
        "deploy/widgets/Formatters",
        "deploy/widgets/componentProcess/EditComponentProcess",
        "js/webext/widgets/Alert",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/form/MenuButton",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        CheckBox,
        array,
        declare,
        xhr,
        domClass,
        domGeom,
        domConstruct,
        JSON,
        on,
        Formatters,
        EditComponentProcess,
        Alert,
        Dialog,
        GenericConfirm,
        MenuButton,
        TreeTable
) {
    /**
     *
     */
    return declare('deploy.widgets.componentProcess.ComponentProcessList',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="componentProcessList">' +
                '<div class="listTopButtons" data-dojo-attach-point="buttonAttach"></div>' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
                '<div data-dojo-attach-point="activeBoxAttach" style="margin: 2px;"></div>' +
                '<div data-dojo-attach-point="copyContainer" class="hidden">' +
                    '<div data-dojo-attach-point="copyLabel" style="margin-top: 15px;"></div>' +
                    '<div class="innerContainer">' +
                        '<div data-dojo-attach-point="copyAttach"></div>' +
                        '<div data-dojo-attach-point="copyButtonAttach"></div>' +
                    '</div>' +
                '</div>' +
            '</div>',

        processListHash: null,
        baseGridUrl: null,
        basePasteUrl: null,
        readOnly: false,

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            var t = this;

            if (this.component) {
                this.processListHash = "component/"+this.component.id+"/processes";
                this.basePasteUrl = bootstrap.restUrl+"deploy/component/"+this.component.id+
                        "/pasteProcess";
                this.baseGridUrl = bootstrap.restUrl+"deploy/component/"+this.component.id+
                        "/processes";

                this.readOnly = !this.component.security["Manage Processes"];
            }
            else if (this.componentTemplate) {
                this.processListHash = "componentTemplate/"+this.componentTemplate.id+"/"+
                        this.componentTemplate.version+"/processes";
                this.basePasteUrl = bootstrap.restUrl+"deploy/componentTemplate/"+
                        this.componentTemplate.id+"/pasteProcess";
                this.baseGridUrl = bootstrap.restUrl+"deploy/componentTemplate/"+
                        this.componentTemplate.id+"/"+this.componentTemplate.version+"/processes";

                this.readOnly =
                        ((this.componentTemplate.version !== this.componentTemplate.versionCount)
                        || !this.componentTemplate.security["Manage Processes"]);
            }

            if (util.getCookie("copiedComponentProcesses") !== undefined) {
                this.copyContainer.className = "";

                this.copyLabel.innerHTML = i18n("Process Clipboard");
                this.copyLabel.className = "containerLabel";

                var copyGridLayout = [{
                    name: i18n("Process"),
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

                        var link = null;
                        if (self.component) {
                            link = Formatters.componentProcessLinkFormatter(item);
                        }
                        else if (self.componentTemplate) {
                            link = Formatters.componentTemplateProcessLinkFormatter(item);
                        }

                        var linkDiv = domConstruct.create('div', { "class" : 'inlineBlock'});
                        linkDiv.appendChild(link);
                        domConstruct.place(linkDiv, itemWrapper);

                        domConstruct.place(self.copyActionsFormatter(item), result);
                        return result;
                    }
                },{
                    name: i18n("From"),
                    formatter: function(item) {
                        var result = "";
                        if (item.component) {
                            result = Formatters.componentLinkFormatter(item.component);
                        }
                        else if (item.componentTemplate) {
                            result = Formatters.componentTemplateLinkFormatter(item.componentTemplate);
                        }
                        return result;
                    }
                },{
                    name: i18n("Description"),
                    field: "description"
                }];

                this.copyGrid = new TreeTable({
                    serverSideProcessing: false,
                    columns: copyGridLayout,
                    getData: function() {
                        var copiedComponentProcessesCookie = util.getCookie("copiedComponentProcesses");
                        var copiedComponentProcesses = JSON.parse(copiedComponentProcessesCookie);
                        return copiedComponentProcesses;
                    },
                    hidePagination: true,
                    rowsPerPage: 1000,
                    hideExpandCollapse: true
                });
                this.copyGrid.placeAt(this.copyAttach);

                var clearCopiedProcessesButton = new Button({
                    label: i18n("Clear Copied Processes"),
                    showTitle: false,
                    onClick: function() {
                        util.clearCookie("copiedComponentProcesses");
                        navBar.setHash(t.processListHash, false, true);
                    }
                });
                clearCopiedProcessesButton.placeAt(this.copyButtonAttach);

                if (!this.readOnly) {
                    var pasteAllButton = new Button({
                        label: i18n("Paste All"),
                        showTitle: false,
                        onClick: function() {
                            var copiedComponentProcessesCookie = util.getCookie("copiedComponentProcesses");
                            var copiedComponentProcesses = JSON.parse(copiedComponentProcessesCookie);

                            var index = 0;
                            var pasteProcess = function(index) {
                                var process = copiedComponentProcesses[index];

                                xhr.get({
                                    url: self.basePasteUrl+"/"+process.id,
                                    handleAs: "json",
                                    load: function(data) {
                                        index++;
                                        if (index === copiedComponentProcesses.length) {
                                            self.grid.refresh();
                                            if (self.componentTemplate) {
                                                navBar.setHash("componentTemplate/"+self.componentTemplate.id+"/-1/processes");
                                            }
                                        }
                                        else {
                                            pasteProcess(index);
                                        }
                                    },
                                    error: function(error) {
                                        var alert = new Alert({
                                            messages: [i18n("Error pasting processes:"),
                                                       "",
                                                       util.escape(error.responseText)]
                                        });
                                    }
                                });
                            };
                            pasteProcess(index);
                        }
                    });
                    pasteAllButton.placeAt(this.copyButtonAttach);
                }
            }

            var gridRestUrl = this.baseGridUrl+"/false";
            var gridLayout = [{
                name: i18n("Process"),
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

                    var link = null;
                    if (self.component) {
                        link = Formatters.componentProcessLinkFormatter(item);
                    }
                    else if (self.componentTemplate) {
                        link = Formatters.componentTemplateProcessLinkFormatter(item);
                    }

                    var linkDiv = domConstruct.create('div', { "class" : 'inlineBlock'});
                    linkDiv.appendChild(link);
                    domConstruct.place(linkDiv, itemWrapper);

                    domConstruct.place(self.actionsFormatter(item), result);
                    return result;
                }
            },{
                name: i18n("Description"),
                field: "description"
            }];

            if (config.data.systemConfiguration.safeEditFeatureEnabled) {
                gridLayout.push({
                    name: i18n("Locked By"),
                    formatter: function(item, value, cell) {
                        var result = domConstruct.create("div");
                        if (item.locked) {
                            result.innerHTML = util.escape(item.lockedBy);
                        }
                        return result;
                    }
                });
            }

            this.grid = new TreeTable({
                url: gridRestUrl,
                serverSideProcessing: false,
                columns: gridLayout,
                tableConfigKey:"componentProcessListKey",
                noDataMessage: i18n("No processes have been added to this component."),
                hidePagination: false,
                hideExpandCollapse: true
            });
            this.grid.placeAt(this.gridAttach);

            if (config.data.systemConfiguration.enableInactiveLinks) {
                var activeBox = new CheckBox({
                    checked: false,
                    value: 'true',
                    onChange: function(value) {
                        self.grid.url = self.baseGridUrl+"/"+value;
                        self.grid.refresh();
                    }
                });
                activeBox.placeAt(this.activeBoxAttach);

                var activeLabel = document.createElement("div");
                domClass.add(activeLabel, "inlineBlock");
                activeLabel.style.position = "relative";
                activeLabel.style.top = "2px";
                activeLabel.style.left = "2px";
                activeLabel.innerHTML = i18n("Show Inactive Processes");
                this.activeBoxAttach.appendChild(activeLabel);
            }

            if (!this.readOnly) {
                var newComponentProcessButton = new Button({
                    label: i18n("Create Process"),
                    showTitle: false,
                    onClick: function() {
                        self.showNewComponentProcessDialog();
                    }
                });
                domClass.add(newComponentProcessButton.domNode, "idxButtonSpecial");
                newComponentProcessButton.placeAt(this.buttonAttach);
            }
        },

        /**
         *
         */
        destroy: function() {
            this.inherited(arguments);
            this.grid.destroy();

            if (this.copyGrid !== undefined) {
                this.copyGrid.destroy();
            }
        },

        /**
         *
         */
        actionsFormatter: function(item) {
            var self = this;

            var result  = domConstruct.create("div", {
                "dir": util.getUIDir(),
                "align": util.getUIDirAlign(),
                "class": "tableHoverActions"
            });

            var menuActions = [];

            array.forEach(self.getReadActions(item), function(action) {
                menuActions.push(action);
            });

            if (!this.readOnly) {
                self.addEditActions(item, result);
                array.forEach(self.getWriteActions(item), function(action) {
                    // If the process is a component template process, and
                    // we're viewing a component, don't include the delete button
                    if (item.component || self.componentTemplate) {
                        menuActions.push(action);
                    }
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
                    if (config.data.systemConfiguration.safeEditFeatureEnabled) {
                        navBar.setHash("#draftComponentProcess/"+item.id+"/-1");
                    }
                    else {
                        navBar.setHash("#componentProcess/"+item.id+"/-1");
                    }
                }
            });
            editButton.placeAt(result);
        },

        /**
         *
         */
        getWriteActions: function(item) {
            var self = this;

            var menuActions = [];

            if (!item.locked || item.currentUserIsLockOwner) {
                menuActions.push({
                    label: i18n("Delete"),
                    onClick: function() {
                        self.confirmDelete(item);
                    }
                });
            }

            if (config.data.systemConfiguration.safeEditFeatureEnabled) {
                if (item.locked) {
                    var label;
                    if (item.currentUserIsLockOwner) {
                        label = i18n("Unlock");
                    }
                    else {
                        label = i18n("Force Unlock");
                    }
                    menuActions.push({
                        label: label,
                        onClick: function() {
                            self.unlockProcess(item);
                        }
                    });
                }
                else {
                    menuActions.push({
                        label: i18n("Lock"),
                        onClick: function() {
                            self.lockProcess(item);
                        }
                    });
                }
            }

            return menuActions;
        },

        lockProcess: function(item) {
            var self = this;
            xhr.put({
                url: bootstrap.restUrl+"deploy/componentProcess/lock/"+item.id,
                handleAs: "json",
                load: function(data) {
                    self.grid.refresh();
                },
                error: function(error) {
                    var alert = new Alert({
                        messages: [i18n("Error locking process:"),
                                   "",
                                   util.escape(error.responseText)]
                    });
                    alert.startup();
                }
            });
        },

        unlockProcess: function(item) {
            var self = this;
            xhr.put({
                url: bootstrap.restUrl+"deploy/componentProcess/unlock/"+item.id,
                handleAs: "json",
                load: function(data) {
                    self.grid.refresh();
                },
                error: function(error) {
                    var alert = new Alert({
                        messages: [i18n("Error unlocking process:"),
                                   "",
                                   util.escape(error.responseText)]
                    });
                    alert.startup();
                }
            });
        },

        /**
         *
         */
        getReadActions: function(item) {
            var self = this;
            return [{
               label: i18n("Copy"),
               onClick: function() {
                   var distilledItem = {
                       id: item.id,
                       name: item.name,
                       description: item.description
                   };

                   if (item.component) {
                       distilledItem.component = {
                           id: item.component.id,
                           name: item.component.name
                       };
                   }
                   else if (item.componentTemplate) {
                       distilledItem.componentTemplate = {
                           id: item.componentTemplate.id,
                           name: item.componentTemplate.name
                       };
                   }

                   var copiedComponentProcessesCookie = util.getCookie("copiedComponentProcesses");
                   var copiedComponentProcesses = [];
                   if (copiedComponentProcessesCookie !== undefined) {
                       copiedComponentProcesses = JSON.parse(copiedComponentProcessesCookie);
                   }
                   if (copiedComponentProcesses.length > 0) {
                       array.forEach(copiedComponentProcesses, function(process) {
                           if (process !== undefined && process.id === distilledItem.id) {
                               util.removeFromArray(copiedComponentProcesses, process);
                           }
                       });
                   }
                   copiedComponentProcesses.push(distilledItem);
                   util.setCookie("copiedComponentProcesses", JSON.stringify(copiedComponentProcesses));

                   if (copiedComponentProcessesCookie === undefined) {
                       navBar.setHash(self.processListHash, false, true);
                   }
                   else {
                       self.copyGrid.refresh();
                   }
               }
            }];
        },

        /**
         *
         */
        copyActionsFormatter: function(item) {
            var self = this;

            var result  = domConstruct.create("div", {
                "dir": util.getUIDir(),
                "align": util.getUIDirAlign(),
                "class": "tableHoverActions"
            });

            var menuActions = [];

            array.forEach(self.getCopyReadActions(item), function(action) {
                menuActions.push(action);
            });

            if (!this.readOnly) {
                array.forEach(self.getCopyWriteActions(item), function(action) {
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

        /**
         *
         */
        getCopyWriteActions: function(item) {
            var self = this;
            return [{
                label: i18n("Paste"),
                onClick: function() {
                    xhr.get({
                        url: self.basePasteUrl+"/"+item.id,
                        handleAs: "json",
                        load: function(data) {
                            if (self.componentTemplate) {
                                navBar.setHash("componentTemplate/"+self.componentTemplate.id+"/-1/processes", false, true);
                            }
                            else {
                                self.copyGrid.refresh();
                                self.grid.refresh();
                                if (self.componentTemplate) {
                                    navBar.setHash("componentTemplate/"+self.componentTemplate.id+"/-1/processes");
                                }
                            }
                        },
                        error: function(error) {
                            var alert = new Alert({
                                messages: [i18n("Error pasting processes:"),
                                           "",
                                           util.escape(error.responseText)]
                            });
                            alert.startup();
                        }
                    });
                }
            }];
        },

        /**
         *
         */
        getCopyReadActions: function(item) {
            var self = this;
            return [{
                label: i18n("Remove"),
                onClick: function() {
                    var copiedComponentProcessesCookie = util.getCookie("copiedComponentProcesses");
                    var copiedComponentProcesses = JSON.parse(copiedComponentProcessesCookie);

                    array.forEach(copiedComponentProcesses, function(process) {
                        if (process !== undefined && process.id === item.id) {
                            util.removeFromArray(copiedComponentProcesses, process);
                        }
                    });

                    if (copiedComponentProcesses.length > 0) {
                        util.setCookie("copiedComponentProcesses", JSON.stringify(copiedComponentProcesses));
                        self.copyGrid.refresh();
                    }
                    else {
                        util.clearCookie("copiedComponentProcesses");
                        navBar.setHash(self.processListHash, false, true);
                    }
                }
            }];
        },

        /**
         *
         */
        confirmDelete: function(target, affectedProcesses) {
            var self = this;
            var warningMessage = i18n(
                "Are you sure you want to delete %1?  Note that any application processes that " +
                "currently use %1 will continue to use it.",
                target.name.escape());

            // the process being deleted is being deleted from the template's process page if self.componentTemplate exists
            // otherwise, it is being deleted from an component that uses that template for that process and target.componentTemplate exists
            var componentTemplate = self.componentTemplate || target.componentTemplate;

            if (componentTemplate) {
                xhr.get({
                    url: bootstrap.restUrl + "deploy/componentTemplate/" + componentTemplate.id + "/numComponents",
                    handleAs: "text",
                    load: function(data) {
                        var numComponentsUsingTemplate = parseInt(data, 10);
                        if (numComponentsUsingTemplate > 0) {
                            warningMessage = i18n(
                                "This is an component template process. All %1 components that rely on this template will be affected. " +
                                "Note that any application processes that currently uses %2 will continue to use it. " +
                                "Delete %2?",
                                data, target.name.escape());
                        }
                        self.showDeleteComponentProcessConfirmation(target, warningMessage);
                    }
                });
            } else {
                self.showDeleteComponentProcessConfirmation(target, warningMessage);
            }
        },

        /**
         *
         */
        showDeleteComponentProcessConfirmation: function(target, warningMessage) {
            var self = this;
            var confirm = new GenericConfirm({
                message: warningMessage,
                action: function() {
                    self.grid.block();
                    xhr.del({
                        url: bootstrap.restUrl+"deploy/componentProcess/"+target.id,
                        handleAs: "json",
                        load: function(data) {
                            self.grid.unblock();
                            self.grid.refresh();
                            if (self.componentTemplate) {
                                navBar.setHash("componentTemplate/"+self.componentTemplate.id+"/-1/processes", false, true);
                            }
                        },
                        error: function(error) {
                            if (error.responseText) {
                                var wrongNameAlert = new Alert({
                                    messages: [i18n("Error deleting component process:"),
                                                       "",
                                                       util.escape(error.responseText)]
                                });
                            }
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
        showNewComponentProcessDialog: function() {
            var self = this;

            var newComponentProcessDialog = new Dialog({
                title: i18n("Create Process"),
                closable: true,
                draggable: true
            });

            var newComponentProcessForm = new EditComponentProcess({
                component: this.component,
                componentTemplate: this.componentTemplate,
                callback: function() {
                    newComponentProcessDialog.hide();
                    newComponentProcessDialog.destroy();
                }
            });
            newComponentProcessForm.placeAt(newComponentProcessDialog.containerNode);
            newComponentProcessDialog.show();
        }
    });
});

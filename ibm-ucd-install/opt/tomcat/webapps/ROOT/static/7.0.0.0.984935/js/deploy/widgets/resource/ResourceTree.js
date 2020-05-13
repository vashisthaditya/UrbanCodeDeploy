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
        "dijit/form/TextBox",
        "dijit/Tooltip",
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/dom-class",
        "dojo/dom-geometry",
        "dojo/dom-construct",
        "dojo/dom-style",
        "dojo/json",
        "dojo/on",
        "dojo/query",
        "deploy/widgets/Formatters",
        "deploy/widgets/component/ComponentResources",
        "deploy/widgets/log/LiveLogViewer",
        "deploy/widgets/resource/EditResource",
        "deploy/widgets/resource/ResourceSelector",
        "deploy/widgets/resourceTemplate/EditResourceTemplate",
        "js/webext/widgets/RadioButtonGroup",
        "deploy/widgets/resourceTemplate/ApplyResourceTemplate",
        "deploy/widgets/rightPanel/ResourceRightPanelContainer",
        "deploy/widgets/tag/Tagger",
        "deploy/widgets/resource/ResourceCompareSelectorDialog",
        "deploy/widgets/filter/TagFilter",
        "js/webext/widgets/Alert",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/table/TreeTable",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/DialogMultiSelect",
        "js/webext/widgets/form/MenuButton"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        TextBox,
        Tooltip,
        array,
        declare,
        xhr,
        domClass,
        domGeom,
        domConstruct,
        domStyle,
        JSON,
        on,
        query,
        Formatters,
        ComponentResources,
        LiveLogViewer,
        EditResource,
        ResourceSelector,
        EditResourceTemplate,
        RadioButtonGroup,
        ApplyResourceTemplate,
        RightPanelContainer,
        Tagger,
        ResourceCompareSelectorDialog,
        TagFilter,
        Alert,
        Dialog,
        GenericConfirm,
        TreeTable,
        ColumnForm,
        DialogMultiSelect,
        MenuButton
) {
    /**
     *
     */
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="resourceList">'+
                '<div class="listTopButtons" data-dojo-attach-point="buttonAttach" style="position:relative; z-index=1;"></div>' +
                '<div data-dojo-attach-point="resourcesGrid"></div>'+
                '<div class="right-panel-container" data-dojo-attach-point="panelAttach"></div>'+
            '</div>',

        hideTopButtons: false,
        onRowSelect: function(item, row) {
        },
        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            if (!this.url) {
                this.url = bootstrap.restUrl+"resource/resource/tree";
            }
            if (!this.xhrMethod) {
                this.xhrMethod = "GET";
            }
            if (!this.serverSideProcessing) {
                this.serverSideProcessing = false;
            }

            if (this.className) {
                domClass.add(this.domNode, this.className);
            }

            var gridLayout = [];
            gridLayout.push(this.getNameColumn());
            array.forEach(this.getOtherColumns(), function(column) {
                gridLayout.push(column);
            });

            var treeOptions = {
                url: this.url,
                style: this.treeStyle,
                xhrMethod: this.xhrMethod,
                serverSideProcessing: this.serverSideProcessing,
                orderField: "name",
                noDataMessage: i18n("No resources have been added yet."),
                tableConfigKey: "resourceList",
                columns: gridLayout,
                draggable: true,
                selectable: true,
                hideExpandCollapse: true,
                hidePagination: true,
                suppressDefaultOnDrop: true,
                isSelectable: function(item) {
                    return self.isSelectable(item);
                },
                canDragItem: function(item) {
                    return self.isSelectable(item);
                },
                canDropOnItem: function(sources, target) {
                    var result = true;

                    array.forEach(sources, function(source) {
                        // If dragging resource roles in, they may have allowedParentResourceRoles set.
                        // If dragging resources which have a role, we've explicitly put the role's
                        // allowedParentResourceRoles on them in ResourceResource.getLinkedJSON().
                        if (source.allowedParentResourceRoles) {
                            if (!target.hasAgent && !target.resourceTemplate) {
                                result = false;
                            }
                            else if (source.allowedParentResourceRoles.length > 0) {
                                var hasAllowedRole = false;
                                var acttarget = self.grid._getRowObjectForItem(target);
                                var parName = acttarget.item.name;
                                var role = self.getLowestParentRole(acttarget);
                                array.forEach(source.allowedParentResourceRoles, function(allowedRole) {
                                    if (role && role.id === allowedRole.id) {
                                        if (allowedRole.folder === null || allowedRole.folder === undefined) {
                                            hasAllowedRole = true;
                                        }
                                        else {
                                            if (allowedRole.folder === parName) {
                                                hasAllowedRole = true;
                                            }
                                        }
                                    }
                                });

                                if (!hasAllowedRole) {
                                    result = false;
                                }
                            }
                        }

                        // If dragging agents in, they will have a working directory. If dragging
                        // agent resources, they will have an "agent" property.
                        if ((source.workingDirectory || source.agent) && target.hasAgent) {
                            result = false;
                        }
                    });

                    return result;
                },
                onDrop: function(sources, target, copy) {
                    var handleCopy = function(targetChildNames) {
                        if (targetChildNames === undefined) {
                            targetChildNames = [];
                            if (target.children) {
                               array.forEach(target.children, function(child) {
                                   targetChildNames[targetChildNames.length] = child.name;
                               });
                            }
                        }
                        var simpleSources = [];
                        var sourcesToRename = {};
                        var hasRenames = false;
                        array.forEach(sources, function(source) {
                            simpleSources.push({
                                id: source.id
                            });
                            if (array.indexOf(targetChildNames, source.name) !== -1) {
                                sourcesToRename[source.id] = source.name;
                                hasRenames = true;
                            }
                        });

                        var url = bootstrap.restUrl+"resource/resource/";

                        if (copy) {
                            url += "copyTo";
                        }
                        else {
                            url += "moveTo";
                        }
                        url += "/"+target.id;

                        var submitFunction = function(data) {
                            self.grid.block();
                            var dataToPub = {
                                sources:simpleSources
                            };
                            if (data) {
                                dataToPub.renames = data;
                            }
                            xhr.put({
                                url: url,
                                putData: JSON.stringify(dataToPub),
                                handleAs: "json",
                                load: function(data) {
                                    self.grid.unblock();
                                    if (!copy) {
                                        array.forEach(sources, function(source) {
                                            self.grid.refreshSiblingsForItem(source);
                                        });
                                    }
                                    self.grid.refreshRowChildrenForItem(target);
                                },
                                error: function(response) {
                                    var dndAlert = new Alert({
                                        message: util.escape(response.responseText)
                                    });
                                    self.grid.refresh();
                                }
                            });
                        };

                        if (hasRenames) {
                           //popup a rename dialogue
                           var renameDialog = new Dialog({
                             title:i18n("Rename Resources with Conflicting Names"),
                             closable:true,
                             draggable:true
                           });

                           var renameForm = new ColumnForm({
                             onSubmit: function(data) {
                                 submitFunction(data);
                                 renameDialog.hide();
                                 renameDialog.destroy();
                             },
                             onCancel: function() {
                                 renameDialog.hide();
                                 renameDialog.destroy();
                             }
                           });
                           renameForm.placeAt(renameDialog.containerNode);
                           var theid;
                           for (theid in sourcesToRename) {
                               if (sourcesToRename.hasOwnProperty(theid)) {
                                   renameForm.addField({
                                       name: theid,
                                       label: i18n("New name for %s", sourcesToRename[theid]),
                                       value: i18n("%s (Copy)", sourcesToRename[theid]),
                                       required:true,
                                       type:"Text"
                                   });
                               }
                           }
                           renameDialog.show();
                        }
                        else {
                            submitFunction();
                        }
                    };

                    // Build an array of basic information about the sources being moved.
                    self.target = target;
                    // Perform additional function only if resource is not being dragged from the right panel.
                    if (!self.externalDrop && target && sources.length > 0) {
                        //get the names of the targets children for doing a collision check
                        if (target.hasChildren && (!target.children || target.children.length === 0)) {
                            //populate the children from the server.
                            xhr.get({
                                url: bootstrap.restUrl+"resource/resource/" + target.id + "/resources",
                                handleAs: "json",
                                load: function(data) {
                                   var targetChildNames = [];
                                   if (data) {
                                       dojo.forEach(data, function(item) {
                                           targetChildNames[targetChildNames.length] = item.name;
                                       });
                                   }
                                   handleCopy(targetChildNames);
                                },
                                error: function(response) {
                                    var dndAlert = new Alert({
                                        message: util.escape(response.responseText)
                                    });
                                    self.grid.refresh();
                                }
                            });
                        }
                        else {
                            handleCopy(undefined);
                        }
                    }
                },
                onRowSelect: self.onRowSelect,
                getChildUrl: function(item) {
                    return self.getChildUrl(item);
                },
                hasChildren: function(item) {
                    return item.hasChildren;
                }
            };
            this.grid = new TreeTable(treeOptions);
            this.grid.placeAt(this.resourcesGrid);
            if (this.grid.dndContainer){
                this.grid.dndContainer.onDropExternal = function(source, target, copy){
                    // Set a flag that an item was dropped onto a resource to not perfom the copy or
                    // move options defined at line 109.
                    self.externalDrop = true;
                };
            }

            this.buttonAttach = this.grid.buttonAttach;
            this.addTopButtons();
            this.addHoverHandler();

            var selectOptions = this.getSelectOptions();
            if (selectOptions && selectOptions.length > 0) {
                var selectButton = new MenuButton({
                    options: selectOptions,
                    label: i18n("Select All...")
                });
                selectButton.placeAt(this.buttonAttach);
            }

            var actionsOptions = this.getActionsOptions();
            if (actionsOptions && actionsOptions.length > 0) {
                var actionsButton = new MenuButton({
                    options: actionsOptions,
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
            if (config.data.permissions[security.system.createResources] && !domClass.contains(this.domNode, "agent-pool")){
                this.buildRightPanels();
            }
        },

        getChildUrl: function(item) {
            return bootstrap.restUrl + "resource/resource/" + item.id + "/resources";
        },

        /**
         * Builds the right panel or agents with no resource and components.
         */
        buildRightPanels: function(){
            var _this = this;

            // Adding a class to a resource group for styling purposes.
            if ((this.resource && !this.resource.parent) || (this.url && this.url.indexOf("/rest/agent") === 0)){
                domClass.add(this.domNode, "resource-group");
            }
            if (this.rightPanelClass){
                domClass.add(this.domNode, this.rightPanelClass);
            }

            this.rightPanel = new RightPanelContainer({
                parent: _this,
                buttonAttachPoint: _this.buttonAttach
            });
        },

        /**
         * Clears and rebuilds the right panel contents.
         */
        refreshRightPanel: function(type){
            var _this = this;
            if (_this.rightPanel && _this.rightPanel.current){
                _this.rightPanel.current.refresh();
            }
        },

        /**
         * Function responsible for generating the name column formatter for this tree
         */
        getNameColumn: function() {
            var self = this;

            return {
                name: i18n("Name"),
                formatter: function(item, value, cell) {
                    var result = domConstruct.create("div", {
                        "class": "inlineBlock resourceList-nameColumn",
                        "style": "margin-" + (domGeom.isBodyLtr()?"right":"left") + ":78px;"
                    });

                    if (item.discoveryFailed) {
                        var failureIcon = domConstruct.create("div", {
                            className: "general-icon failed-icon inlineBlock"
                        });

                        var helpTip = new Tooltip({
                            connectId: [failureIcon],
                            label: i18n("Discovery failed. Click this icon to view logs."),
                            showDelay: 100,
                            position: ["after", "above", "below", "before"]
                        });

                        domConstruct.place(failureIcon, result);

                        on(failureIcon, "click", function() {
                            var logViewer = new LiveLogViewer({
                                url: bootstrap.restUrl+"logView/latestResourceDiscovery/"+item.id+"/stdOut.txt",
                                title: i18n("Output Log"),
                                autoRefresh: false,
                                paddingTop: "0px"
                            });
                            logViewer.show();
                        });
                    }

                    var resourceLink;
                    if (item.isRoot) {
                        resourceLink = Formatters.resourceLinkFormatterWithPath(item);
                    }
                    else {
                        resourceLink = Formatters.resourceLinkFormatter(item);
                    }
                    domClass.add(resourceLink, "inlineBlock");
                    domConstruct.place(resourceLink, result);
                    self.showTags(item, result);

                    return result;
                },
                orderField: "name",
                filterField: "name",
                filterType: "custom",
                getFilterFields: function() {
                    var nameFilter = new TextBox({
                        name: "name",
                        "class": "filter",
                        style: { "width": "45%" },
                        placeHolder: i18n("Resource Name"),
                        type: "like"
                    });

                    var tagFilter = new TagFilter({
                        name: "tags",
                        "class": "filter",
                        style: { width: "45%" },
                        placeHolder: i18n("Tags"),
                        type: "like"
                    });

                    return [nameFilter, tagFilter];
                },
                getRawValue: function(item) {
                    return item.path;
                }
            };
        },

        /**
         * Responsible for defining all columns beyond the 'name' column
         */
        getOtherColumns: function() {
            var self = this;

            return [{
                name: i18n("Inventory"),
                formatter: function(item, value, cell) {
                    return Formatters.resourceInventoryFormatter(item, cell, true);
                },
                orderField: "version",
                filterField: "version",
                filterType: "text",
                getRawValue: function(item) {
                    var result = "None";

                    if (item.version) {
                        result = item.version.name;
                    }

                    return result;
                }
            },{
                name: i18n("Status"),
                formatter: Formatters.resourceStatusFormatter
            },{
                name: i18n("Description"),
                formatter: function(item) {
                    return domConstruct.create("div", {
                        innerHTML: item.description ? item.description.escape() : "",
                        style: {
                            "textOverflow": "ellipsis",
                            "whiteSpace": "nowrap",
                            "overflow": "hidden",
                            "maxWidth": "250px"
                        }
                    });
                },
                width: "250px",
                orderField: "description",
                filterField: "description",
                filterType: "text",
                getRawValue: function(item) {
                    return item.description;
                }
            }];
        },

        /**
         *
         */
        actionsFormatter: function(item) {
            var self = this;
            var result = domConstruct.create("div", {
                "dir": util.getUIDir(),
                "align": util.getUIDirAlign(),
                "class": "tableHoverActions resourceList-rowHoverActions"
            });

            var menuActions = [];

            if (!item.resourceTemplate) {
                menuActions.push({
                    label: i18n("Compare or Synchronize"),
                    onClick: function() {
                        self.showCompareDialog(item);
                    }
                });
                menuActions.push({
                    label: i18n("Define New Template"),
                    onClick: function() {
                        self.showNewTemplateDialog(item);
                    }
                });
                menuActions.push({
                    label: i18n("Synchronize With Template"),
                    onClick: function() {
                        self.showApplyTemplateDialog(item);
                    }
                });
                menuActions.push({
                    label: i18n("Add From Template"),
                    onClick: function() {
                        self.showApplyTemplateDialog(item, true);
                    }
                });
            }

            if (item.security["Edit Basic Settings"]) {
                this.addEditActions(item, result);
            }

            if(item.security["Create Resources"]) {
                array.forEach(this.getCreateActions(item), function(action) {
                    menuActions.push(action);
                });
            }

            if(item.security["View Resources"]) {
                array.forEach(this.getRunnableActions(item), function(action) {
                    menuActions.push(action);
                });
            }

            if(item.security.Delete && (!item.resourceTemplate || !!item.type)) {
                array.forEach(this.getDeleteActions(item), function(action) {
                    menuActions.push(action);
                });
            }

            var actionsButton = new MenuButton({
                options: menuActions,
                label: i18n("Actions...")
            });
            actionsButton.placeAt(result);

            return result;
        },

        /**
         * Generate any buttons to be shown to the left of the bulk operations buttons
         */
        addTopButtons: function() {
            var self = this;
            if (!self.hideTopButtons) {

                if (config.data.permissions[security.system.createResources]) {
                    domClass.add(this.domNode, "all-resources");
                    var createButton = new Button({
                        label: i18n("Create Top-Level Group"),
                        showTitle: false,
                        onClick: function() {
                            self.showNewResourceDialog();
                        }
                    });
                    domClass.add(createButton.domNode, "idxButtonSpecial");
                    createButton.placeAt(this.buttonAttach);
                }
            }
        },

        /**
         * Add a hover handler to add action dropdowns to any row that's hovered over.  (The other
         * alternative would be to use the same dropdown widget instance everywhere, but there's not
         * that much more performance gain there)
         */
        addHoverHandler: function() {
            var self = this;
            // Assumes TreeTable.tbody being the table body. (not a documented API)
            // Use event delegation to avoid a billion individual handlers.
            on(this.grid, "tbody tr:mouseover", function(evt) {
                // This handler will trigger as the user's mouse moves across the table, so it
                // needs to be fairly fast.
                var tr = this; // Just to be clear.

                // Add the dropdown only if it doesn't already exist.
                var existingActionsDropdown = query(".resourceList-rowHoverActions",tr);
                if (existingActionsDropdown.length < 1) {
                    var nameCell = query(".resourceList-nameColumn", tr)[0];
                    var item = self.grid._getRowObjectForDomNode(tr).item;
                    domConstruct.place(self.actionsFormatter(item), nameCell);
                }
            });
        },

        /**
         * This function is responsible for creating the icons in the row hover actions relating
         * to editing the resource for that row
         *
         * item: The data for the resource for the current row
         * result: The div in which any new action nodes should be placed
         */
        addEditActions: function(item, result) {
            var self = this;

            var editButton = new Button({
                showTitle: false,
                iconClass: "editIcon",
                title: i18n("Edit"),
                onClick: function() {
                    self.showEditResourceDialog(item);
                }
            });
            editButton.placeAt(result);
        },

        /**
         * This function is responsible for creating the icons in the row hover actions relating
         * to creation of new child objects.
         *
         * item: The data for the resource for the current row
         * result: The div in which any new action nodes should be placed
         */
        getCreateActions: function(item) {
            var self = this;

            var result = [];
            result.push({
                label: i18n("Add Group"),
                onClick: function() {
                    self.showNewResourceDialog(item);
                }
            });

            if (item.hasAgent) {
                result.push({
                    label: i18n("Add Component"),
                    onClick: function() {
                        self.showNewResourceDialog(item, "component");
                    }
                });

                result.push({
                    label: i18n("Add Component Tag"),
                    onClick: function() {
                        self.showNewResourceDialog(item, "componentTag");
                    }
                });
            }
            else {
                result.push({
                    label: i18n("Add Agent"),
                    onClick: function() {
                        self.showNewResourceDialog(item, "agent");
                    }
                });

                result.push({
                    label: i18n("Add Agent Pool"),
                    onClick: function() {
                        self.showNewResourceDialog(item, "agentPool");
                    }
                });
            }

            return result;
        },

        /**
         * This function is responsible for creating the icons in the row hover actions relating
         * to deletion of the resource for the row
         *
         * item: The data for the resource for the current row
         * result: The div in which any new action nodes should be placed
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
         * This function is responsible for creating the icons in the row hover actions relating
         * to running things(particularly auto config)
         *
         * item: The data for the resource for the current row
         * result: The div in which any new action nodes should be placed
         */
         getRunnableActions: function(item) {
             var self = this;
             var result = [];
             if (item.hasAgent) {
                 array.forEach(item.autoConfigureCommands, function(autoConfigureCommand) {
                     result.push({
                         label: i18n("Configure using %s", i18n(autoConfigureCommand.name)),
                         onClick: function() {
                             self.grid.block();

                             xhr.put({
                                 url: bootstrap.restUrl+"resource/resource/"+item.id+"/autoConfigure/"+autoConfigureCommand.id,
                                 handleAs: "json",
                                 load: function(data) {
                                     self.grid.unblock();
                                     self.grid.refreshRowChildrenForItem(item);

                                     var logViewer = new LiveLogViewer({
                                         url: bootstrap.restUrl+"logView/resourceDiscovery/"+data.id+"/stdOut.txt",
                                         title: i18n("Running configuration step..."),
                                         autoRefresh: data.status === "EXECUTING",
                                         paddingTop: "0px"
                                     });
                                     logViewer.show();
                                 },
                                 error: function(response) {
                                     self.grid.unblock();

                                     var dndAlert = new Alert({
                                         message: util.escape(response.responseText)
                                     });
                                 }
                             });
                         }
                     });
                 });

                 array.forEach(item.compareCommands, function(compareCommand) {
                     result.push({
                         label: i18n("Compare using %s", i18n(compareCommand.name)),
                         onClick: function() {
                             self.grid.block();

                             xhr.put({
                                 url: bootstrap.restUrl+"resource/resource/"+item.id+"/compareConfig/"+compareCommand.id,
                                 handleAs: "json",
                                 load: function(data) {
                                     self.grid.unblock();
                                     self.grid.refreshRowChildrenForItem(item);

                                     var logViewer = new LiveLogViewer({
                                         url: bootstrap.restUrl+"logView/resourceDiscovery/"+data.id+"/stdOut.txt",
                                         title: i18n("Running discovery step..."),
                                         autoRefresh: data.status === "EXECUTING",
                                         paddingTop: "0px"
                                     });
                                     logViewer.show();
                                 },
                                 error: function(response) {
                                     self.grid.unblock();

                                     var dndAlert = new Alert({
                                         message: util.escape(response.responseText)
                                     });
                                 }
                             });
                         }
                     });
                 });
             }

             return result;
         },

         /**
          * Add a tagger widget to a resource.  Also sets self.tagger, which is later used for bulk imports.
          */
         showTags: function(item, result) {
             var self = this;
             self.tagger = new Tagger({
                 objectType: "Resource",
                 item: item,
                 callback: function() {
                     self.grid.refresh();
                 }
             });
             self.tagger.placeAt(result);
         },

        /**
         * Generate a list of actions to make available in the bulk select dropdown. If this
         * returns false-ish or an empty array, no bulk select button will be shown.
         */
        getSelectOptions: function() {
            var self = this;

            return [{
                label: i18n("Agents"),
                onClick: function() {
                    var checkItems = [];
                    array.forEach(self.grid.getItems(), function(item) {
                        if (item.type === "agent") {
                            checkItems.push(item);
                        }
                    });

                    self.grid.deselectAll();
                    self.grid.selectItems(checkItems);
                }
            },{
                label: i18n("Agent Pools"),
                onClick: function() {
                    var checkItems = [];
                    array.forEach(self.grid.getItems(), function(item) {
                        if (item.type === "agent pool") {
                            checkItems.push(item);
                        }
                    });

                    self.grid.deselectAll();
                    self.grid.selectItems(checkItems);
                }
            },{
                label: i18n("Matching Filter"),
                onClick: function() {
                    self.grid.deselectAll();
                    self.grid.selectItems(self.grid.getItemsMatchingFilters());
                }
            }];
        },

        /**
         * Generate a list of actions to make available in the bulk actions dropdown. If this
         * returns false-ish or an empty array, no bulk actions button will be shown.
         */
        getActionsOptions: function() {
            var self = this;

            return [{
                label: i18n("Add Components"),
                onClick: function() {
                    self._prepareBulkNewResources("component");
                }
            },{
                label: i18n("Add Groups"),
                onClick: function() {
                    self._prepareBulkNewResources();
                }
            },{
                label: i18n("Delete"),
                onClick: function() {
                    self.confirmBulkDelete();
                }
            },{
                label: i18n("Add Tag"),
                onClick: function() {
                    self._prepareBulkTagAdd();
                }
            },{
                label: i18n("Remove Tag"),
                onClick: function() {
                    self._prepareBulkTagRemove();
                }
            }];
        },


        /**
         *
         */
        _prepareBulkTagRemove: function() {
            var self = this;
            var resourceIds = [];
            array.forEach(this.grid.getSelectedItems(), function(item) {
                resourceIds.push(item.id);
            });

            self.tagger.showRemoveTagDialog(resourceIds);
        },


        /**
         *
         */
        _prepareBulkTagAdd: function() {
            var self = this;

            var resourceIds = [];

            array.forEach(this.grid.getSelectedItems(), function(item) {
                resourceIds.push(item.id);
            });
            self.tagger.showAddTagDialog(resourceIds);
        },

        /**
         * Show the pop-up to create a new resource
         */
        showNewResourceDialog: function(parent, type) {
            var self = this;

            var newResourceDialog = new Dialog({
                title: i18n("Create Resource"),
                closable: true,
                draggable:true,
                description: i18n("A resource can represent an agent, agent pool, component, or an " +
                        "organizational entity that is used to group other resources. You can see your entire " +
                        "infrastructure (all resources across all environments) on the Resources page.")
            });

            var newResourceForm = self.createEditResourceForm({
                parent: parent,
                type: type,
                cancelCallback: function() {
                    newResourceDialog.hide();
                    newResourceDialog.destroy();
                },
                callback: function() {
                    newResourceDialog.hide();
                    newResourceDialog.destroy();

                    if (parent) {
                        self.grid.refreshRowChildrenForItem(parent);
                    }
                    else {
                        self.grid.refresh();
                    }
                    self.refreshRightPanel();
                }
            });

            newResourceForm.placeAt(newResourceDialog.containerNode);
            newResourceDialog.show();
        },

        /**
         * Show the pop-up to create many new resources based on what is selected in the tree.
         * @param type refers to the type of resources to create
         * The parents to use will be collected based on the selected rows.
         */
        showBulkNewResourceDialog: function(type, resourceIds) {
            var self = this;

            var newResourceDialog = new Dialog({
                title: i18n("Create Resources"),
                closable: true,
                draggable:true
            });

            var newResourceForm = self.createEditResourceForm({
                parentIds: resourceIds,
                type: type,
                cancelCallback: function() {
                    newResourceDialog.hide();
                    newResourceDialog.destroy();
                },
                callback: function() {
                    newResourceDialog.hide();
                    newResourceDialog.destroy();
                    self.grid.refresh();
                }
            });

            newResourceForm.placeAt(newResourceDialog.containerNode);
            newResourceDialog.show();
        },

        /**
         *
         */
        showEditResourceDialog: function(resource) {
            var self = this;

            xhr.get({
                url: bootstrap.restUrl+"resource/resource/"+resource.id,
                handleAs: "json",
                load: function(resource) {
                    var newResourceDialog = new Dialog({
                        title: i18n("Edit Resource"),
                        closable: true,
                        draggable:true
                    });

                    var newResourceForm = self.createEditResourceForm({
                        resource: resource,
                        callback: function() {
                            newResourceDialog.hide();
                            newResourceDialog.destroy();
                            self.grid.refresh();
                        },
                        cancelCallback: function() {
                            newResourceDialog.hide();
                            newResourceDialog.destroy();
                        }
                    });

                    newResourceForm.placeAt(newResourceDialog.containerNode);
                    newResourceDialog.show();
                }
            });
        },

        createEditResourceForm: function(options) {
            return new EditResource(options);
        },

        showCompareDialog: function(item) {
            var t = this;
            var resComSelDia = new ResourceCompareSelectorDialog({
                resource: item
            });
            resComSelDia.show();
        },

        /**
         *
         */
        showNewTemplateDialog: function(item) {
            var dialog = new Dialog({
                title: i18n("Define New Template"),
                closable: true,
                draggable: true
            });

            var editTemplateForm = new EditResourceTemplate({
                sourceResource: item,
                callback: function(data) {
                    dialog.hide();
                    if (data) {
                        navBar.setHash("#resourceTemplate/"+data.id);
                    }
                }
            });
            editTemplateForm.placeAt(dialog.containerNode);

            dialog.show();
        },

        /**
         *
         */
        showApplyTemplateDialog: function(item, newResource) {
            var self = this;

            var titToUse = newResource ? i18n("Create New Resource From Template") : i18n("Synchronize With Template");
            var dialog = new Dialog({
                title: titToUse,
                closable: true,
                draggable: true
            });

            var editTemplateForm = new ApplyResourceTemplate({
                resource: item,
                createNew: newResource,
                callback: function(data) {
                    dialog.hide();
                    if (data) {
                        self.grid.refreshRowChildrenForItem(item);
                    }
                }
            });
            editTemplateForm.placeAt(dialog.containerNode);

            dialog.show();
        },

        /**
         * Gather selected resources and construct the bulk new resources dialog
         */
        _prepareBulkNewResources: function(type) {
            var self = this;

            var invalidResources = [];

            var resourceIds = [];
            array.forEach(this.grid.getSelectedItems(), function(item) {
                resourceIds.push(item.id);

                if (type === "component") {
                    if (!item.hasAgent) {
                        invalidResources.push(item);
                    }
                }
            });

            if (invalidResources.length > 0) {
                var invalidMessage = "";
                if (type === "component") {
                    invalidMessage = i18n("Not all of the selected resources can host a " +
                            "component resource. Only resources with an agent available can host " +
                            "components. The following resources are invalid:");
                }

                var invalidLabel = domConstruct.create("div", {
                    "innerHTML": invalidMessage
                });

                domConstruct.create("div", {
                    "innerHTML": "&nbsp;"
                }, invalidLabel);

                array.forEach(invalidResources, function(resource) {
                    domConstruct.create("div", {
                        "innerHTML": util.escape(resource.path)
                    }, invalidLabel);
                });

                var invalidAlert = new Alert({
                    title: i18n("Invalid Selection"),
                    messageDom: invalidLabel
                });
            }
            else {
                this.showBulkNewResourceDialog(type, resourceIds);
            }
        },

        /**
         * Creates a deletion dialog pop over
         * @param dialog The message the user will see in the deletion popover warning
         * @param target The item being clicked on
         **/
        _createDeleteDialog: function(dialog, target) {
            var self = this;

            var confirm = new GenericConfirm({
                forceRawMessages: true,
                message: dialog,
                action: function() {
                    self.grid.block();
                    xhr.del({
                        url: bootstrap.restUrl + "resource/resource/" + target.id,
                        handleAs: "json",
                        load: function(data) {
                            self.grid.unblock();
                            self.grid.refreshSiblingsForItem(target);
                            self.refreshRightPanel();
                        },
                        error: function(error) {
                            var alert = new Alert({
                                messages: [i18n("Error deleting resource:"),
                                "",
                                util.escape(error.responseText)]
                            });
                            self.grid.unblock();
                            self.refreshRightPanel();
                        }
                    });
                }
            });
        },

        /**
         * Makes a rest call to the backend to find the total number of descendants under the
         * target provided
         * See ResourceResource.java under the 'getDescendantCount' method to see the backend
         * of this
         * @param target the root node to start the search from
         **/
        _getDescendants: function(target) {
            var self = this;

            self.grid.block();
            xhr.get({
                url: bootstrap.restUrl + "resource/resource/" + target.id + "/descendantsCount",
                handleAs: "json",
                load: function(data) {
                    self.grid.unblock();
                    var dialog = "";
                    dialog = i18n("<b>%s</b> contains <b>%s</b> children. Are you sure you want to delete it," +
                           "<b>and its immediate descendants</b>, from the system permanently?",
                        util.escape(target.name), data.numberOfDescendantsTotal.toString());
                    self._createDeleteDialog(dialog, target);
                }
            });
        },

        /**
         * Show a pop-up to confirm whether the user wants to delete an item or not.
         */
        confirmDelete: function(target) {
            var self = this;
            var dialog = "";

            if (target.hasChildren) {
                self._getDescendants(target);
            }
            else {
                dialog = i18n("Are you sure you want to delete %s? " +
                    "This will permanently delete it from the system.", util.escape(target.name));
                self._createDeleteDialog(dialog, target);
            }
        },


        /**
         * Show the pop-up to delete many resources based on what is selected in the tree.
         * @param type refers to the type of resources to create
         * The resources to use will be collected based on the selected rows.
         */
        confirmBulkDelete: function() {
            var self = this;

            var resourceIds = [];
            var resourceMessages = "";
            if (self.grid.getSelectedItems().length > 1) {
                resourceMessages = [i18n("Are you sure you want to delete the following " +
                        "resources? Any child resources of these will also be deleted."), ""];

                array.forEach(this.grid.getSelectedItems(), function(item) {
                    resourceIds.push(item.id);
                    resourceMessages.push(item.path.escape());
                });
                resourceMessages.push("");
            }
            else {
                //In the case of one item, notify the user of children if any.
                var target = self.grid.getSelectedItems()[0];
                return self.confirmDelete(target);
            }


            var confirm = new GenericConfirm({
                messages: resourceMessages,
                action: function() {
                    self.grid.block();
                    xhr.del({
                        url: bootstrap.restUrl + "resource/resource/bulk",
                        handleAs: "json",
                        putData: JSON.stringify(resourceIds),
                        load: function(data) {
                            self.grid.unblock();
                            self.grid.refresh();
                        },
                        error: function(error) {
                            var alert = new Alert({
                                messages: [i18n("Error deleting resources:"),
                                           "",
                                           util.escape(error.responseText)]
                            });
                            self.grid.unblock();
                        }
                    });
                }
            });
        },

        /**
         * Determine whether the given resource can be selected or not for bulk operations
         */
        isSelectable: function(item) {
            return true;
        },

        getLowestParentRole: function(acttarget) {
            var role;
            while ((acttarget.item.role === undefined || acttarget.item.role === null)
                    && (acttarget.parent !== null && acttarget.parent !== undefined && !!acttarget.parent.item)) {
                acttarget = acttarget.parent;
            }
            if (acttarget.item.role === undefined || acttarget.item.role === null) {
                role = acttarget.item.parentRole;
            }
            else {
                role = acttarget.item.role;
            }
            return role;
        }
    });
});

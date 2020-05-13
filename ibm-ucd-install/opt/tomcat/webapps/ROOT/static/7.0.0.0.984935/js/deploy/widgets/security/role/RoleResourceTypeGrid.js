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
        "dojox/form/TriStateCheckBox",
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/aspect",
        "dojo/json",
        "dojo/on",
        "dojo/dom-class",
        "dojo/dom-construct",
        "js/webext/widgets/Alert",
        "js/webext/widgets/table/TreeTable",
        "js/webext/widgets/Dialog",
        "deploy/widgets/security/resourceRole/EditResourceRole"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        CheckBox,
        TriStateCheckBox,
        array,
        declare,
        xhr,
        aspect,
        JSON,
        on,
        domClass,
        domConstruct,
        Alert,
        TreeTable,
        Dialog,
        EditResourceRole
) {
    /**
     *
     */
    return declare("deploy/widgets/security/role/RoleResourceTypeGrid", [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="roleList">'+
                '<div data-dojo-attach-point="buttonAttach"></div>'+
                '<div data-dojo-attach-point="gridAttach"></div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            if (this.canEdit !== false) {
                var p = config.data.permissions;
                this.canEdit = p["Manage Security"];
            }

            xhr.get({
                url: bootstrap.baseUrl+"security/role/"+this.role.id+"/actionMappings",
                handleAs: "json",
                load: function(actionMappings) {
                    self.role.actions = actionMappings;

                    xhr.get({
                        url: bootstrap.baseUrl+"security/resourceType/"+self.resourceType.name+"/actions",
                        handleAs: "json",
                        load: function(actions) {
                            self.showGrid(actions);
                        }
                    });
                }
            });
        },

        /**
         *
         */
        showGrid: function(actions) {
            var self = this;
            var uncategorizedActions = [];
            var categories = {};
            var categoryNames = [];
            var gridRestUrl = bootstrap.baseUrl + "security/resourceType/"+self.resourceType.name+"/resourceRoles";
            var gridLayout = [{
                name: i18n("Type"),
                field: "name",
                orderField: "name",
                formatter: function(item, value, cell) {
                    cell.style.verticalAlign = "top";
                    return value;
                },
                getRawValue: function(item) {
                    return item.name;
                }
            }];

            // We must persist the action state in the JS. This is necessary so that paging
            // back and forth won't appear to lose any changes made by the user.
            var persistActionState = function (value, item, action) {
                if (value) {
                    // Insert the item data into the list of checked actions
                    var newAction = {};
                    newAction.action = {
                            id: action.id
                    };
                    if (item && item.id) {
                        newAction.resourceRole = {
                                id: item.id
                        };
                    }
                    self.role.actions.push(newAction);
                }
                else {
                    // Filter the unchecked item out of the list of check actions
                    self.role.actions = array.filter(self.role.actions, function(roleAction) {
                        var result = true;
                        if (roleAction.action.id === action.id) {
                            if (!roleAction.resourceRole && !item.id) {
                                result = false;
                            }
                            else if (roleAction.resourceRole) {
                                if (roleAction.resourceRole.id === item.id) {
                                    result = false;
                                }
                            }
                        }
                        return result;
                    });
                }
            };

            array.forEach(actions, function(action) {
                if (action.category) {
                    if (!categories[action.category]) {
                        categories[action.category] = [];
                        categoryNames.push(action.category);
                    }
                    categories[action.category].push(action);
                }
                else {
                    uncategorizedActions.push(action);
                }
            });

            array.forEach(uncategorizedActions, function(action) {
                gridLayout.push({
                    name: i18n(action.name),
                    formatter: function(item, value, cell) {
                        cell.style.verticalAlign = "top";

                        var hasAction = false;
                        array.forEach(self.role.actions, function(roleAction) {
                            if (roleAction.action.id === action.id) {
                                // If this roleAction mapping matches the given action for this
                                // column, and the roleAction mapping is for the same resource role
                                // as this row (or both are for no resource role), check the box
                                if (!roleAction.resourceRole && !item.id) {
                                    hasAction = true;
                                }
                                else if (roleAction.resourceRole) {
                                    if (roleAction.resourceRole.id === item.id) {
                                        hasAction = true;
                                    }
                                }
                            }
                        });

                        var check = new CheckBox({
                            checked: hasAction,
                            disabled: !self.canEdit,
                            onChange: function(value) {
                                var putData = {
                                        resourceRole: item.id,
                                        action: action.id
                                };

                                self.grid.block();

                                var xhrOptions = {
                                    url: bootstrap.baseUrl+"security/role/"+self.role.id+"/actionMappings",
                                    handleAs: "json",
                                    putData: JSON.stringify(putData),
                                    load: function(data) {
                                        self.grid.unblock();
                                    },
                                    error: function(data) {
                                        self.grid.unblock();
                                        var alert = new Alert({
                                            message: util.escape(data.responseText)
                                        });
                                    }
                                };

                                if (value) {
                                    xhr.post(xhrOptions);
                                }
                                else {
                                    xhr.del(xhrOptions);
                                }
                                persistActionState(value, item, action);
                            }
                        });
                        return check;
                    }
                });
            });

            //manage categorized actions
            array.forEach(categoryNames, function(categoryName) {
                var allTrue = true;
                var allFalse = true;
                var actionIds = [];
                array.forEach(categories[categoryName], function(action) {
                    actionIds.push(action.id);
                });
                gridLayout.push({
                    name: i18n(categoryName),
                    formatter: function(item, value, cell) {
                        var checkBoxList = [];
                        var triCheckState = function(category, checkBoxList) {
                            var result;
                            var allTrue = true;
                            var allFalse = true;
                            array.forEach(checkBoxList, function(checkBox) {
                                allTrue = allTrue && checkBox.checked;
                                allFalse = allFalse && !checkBox.checked;
                            });
                            if (allTrue) {
                                result = true;
                            }
                            else if (allFalse) {
                                result = false;
                            }
                            else {
                                result = "mixed";
                            }
                            return result;
                        };

                        var categoryDiv = domConstruct.create("div", {
                            "class": "rolePermissions"
                        });
                        var collapseDiv = domConstruct.create("div", {
                            "class": "expandNode inlineBlock"
                        }, categoryDiv);
                        var subActionDivContainer = domConstruct.create("div", {
                            "class": "subActionContainer collapsedRolePermissions"
                        });
                        on(collapseDiv, "click", function(event) {
                            if (domClass.contains(subActionDivContainer, "collapsedRolePermissions")) {
                                domClass.remove(subActionDivContainer, "collapsedRolePermissions");
                                domClass.add(collapseDiv, "expanded");
                            }
                            else {
                                domClass.add(subActionDivContainer, "collapsedRolePermissions");
                                domClass.remove(collapseDiv, "expanded");
                            }
                        });

                        var triCheck = new TriStateCheckBox({
                            name: item.name + categoryName,
                            label: i18n(categoryName),
                            disabled: !self.canEdit,
                            onClick: function(value){
                                if (this.checked === "mixed"){
                                    this.set("checked", true);
                                }
                            },
                            onChange: function(value) {
                                var putData = {
                                    resourceRole: item.id,
                                    actions: actionIds
                                };

                                self.grid.block();

                                if (value === true) {
                                    xhr.post({
                                        url: bootstrap.baseUrl+"security/role/"+self.role.id+"/actionMappings",
                                        handleAs: "json",
                                        putData: JSON.stringify(putData),
                                        load: function(data) {
                                            self.grid.unblock();
                                        },
                                        error: function(data) {
                                            self.grid.unblock();
                                            var alert = new Alert({
                                                message: util.escape(data.responseText)
                                            });
                                        }
                                    });
                                }
                                else if (value === false) {
                                    xhr.del({
                                        url: bootstrap.baseUrl+"security/role/"+self.role.id+"/actionMappings",
                                        handleAs: "json",
                                        putData: JSON.stringify(putData),
                                        load: function(data) {
                                            self.grid.unblock();
                                        },
                                        error: function(data) {
                                            self.grid.unblock();
                                            var alert = new Alert({
                                                message: util.escape(data.responseText)
                                            });
                                        }
                                    });
                                }
                                array.forEach(checkBoxList, function(checkBox) {
                                    checkBox.set('checked', value, false);
                                    persistActionState(value, checkBox.item, checkBox.action);
                                });
                            }
                        });
                        triCheck.placeAt(categoryDiv);
                        domConstruct.place(subActionDivContainer, categoryDiv);
                        array.forEach(categories[categoryName], function(action) {
                            var hasAction = false;
                            array.forEach(self.role.actions, function(roleAction) {
                                if (roleAction.action.id === action.id) {
                                    // If this roleAction mapping matches the given action for this
                                    // column, and the roleAction mapping is for the same resource role
                                    // as this row (or both are for no resource role), check the box
                                    if (!roleAction.resourceRole && !item.id) {
                                        hasAction = true;
                                    }
                                    else if (roleAction.resourceRole) {
                                        if (roleAction.resourceRole.id === item.id) {
                                            hasAction = true;
                                        }
                                    }
                                }
                            });

                            var check = new CheckBox({
                                checked: hasAction,
                                disabled: !self.canEdit,
                                onChange: function(value) {
                                    var putData = {
                                            resourceRole: item.id,
                                            action: action.id
                                        };

                                    self.grid.block();

                                    var xhrOptions = {
                                        url: bootstrap.baseUrl+"security/role/"+self.role.id+"/actionMappings",
                                        handleAs: "json",
                                        putData: JSON.stringify(putData),
                                        load: function(data) {
                                            self.grid.unblock();
                                        },
                                        error: function(data) {
                                            self.grid.unblock();
                                            var alert = new Alert({
                                                message: util.escape(data.responseText)
                                            });
                                        }
                                    };

                                    if (value) {
                                        xhr.post(xhrOptions);
                                    }
                                    else {
                                        xhr.del(xhrOptions);
                                    }
                                    persistActionState(value, item, action);
                                    triCheck.set('checked', triCheckState(categoryName, checkBoxList), false);
                                },
                                // Make these accessible to the tri-state box
                                action: action,
                                item: item
                            });
                            dojo.addClass(check.domNode, item.name + categoryName);
                            checkBoxList.push(check);
                            allTrue = allTrue && hasAction;
                            allFalse = allFalse && !hasAction;
                            var subActionDiv = domConstruct.create("div", {
                                label: action.name,
                                "class": "subAction"
                            }, subActionDivContainer);
                            check.placeAt(subActionDiv);
                            var subActionLabel = domConstruct.create("label", {
                                innerHTML: i18n(action.name),
                                style: check.isLeftToRight() ? "margin-left:5px" : "margin-right:5px"
                            }, subActionDiv);
                        });
                        triCheck.set('checked', triCheckState(categoryName, checkBoxList), false);
                        return categoryDiv;
                    }
                });
            });

            self.grid = new TreeTable({
                url: gridRestUrl,
                serverSideProcessing: false,
                columns: gridLayout,
                noDataMessage: i18n("No types have been created yet."),
                hideFooterLinks: true,
                hidePagination: false,
                hideExpandCollapse: true
            });
            self.grid.placeAt(self.gridAttach);

            // Tracks if standard type already exists in the table so it isn't duplicated on page.
            self.grid.splicedInStandardType = false;
            self.grid.oldShowTable = self.grid.showTable;
            self.grid.showTable = function(data) {
                if (self.grid.splicedInStandardType === false) {
                    var standardName = "Standard "+self.resourceType.name;
                    data.splice(0, 0, {
                        name: i18n(standardName)
                    });
                    self.grid.splicedInStandardType = true;
                }
                self.grid.oldShowTable(data);
            };
            aspect.before(self.grid, "refresh", function() {
                // On refresh, standard type is lost and must be recreated.
                self.grid.splicedInStandardType = false;
            });

            if (self.canEdit){
                var addRoleButton = new Button({
                    label: i18n("Create Type")
                });
                domClass.add(addRoleButton.domNode, "idxButtonSpecial");
                addRoleButton.placeAt(self.buttonAttach);

                addRoleButton.on("click", function() {
                    self.showEditResourceRoleDialog();
                });
            }
        },

        /**
         *
         */
        destroy: function() {
            this.inherited(arguments);
            if (this.grid) {
                this.grid.destroy();
            }
        },

        /**
         *
         */
        showEditResourceRoleDialog: function(resourceRole) {
            var self = this;

            var resourceRoleDialog = new Dialog({
                title: i18n("Create Type"),
                closable: true,
                draggable: true
            });

            var resourceRoleForm = new EditResourceRole({
                resourceType: self.resourceType,
                resourceRole: resourceRole,
                callback: function() {
                    resourceRoleDialog.hide();
                    resourceRoleDialog.destroy();
                    xhr.get({
                        url: bootstrap.baseUrl+"security/role/"+self.role.id+"/actionMappings",
                        handleAs: "json",
                        load: function(actionMappings) {
                            self.role.actions = actionMappings;
                            self.grid.refresh();
                        }
                    });
                }
            });
            resourceRoleForm.placeAt(resourceRoleDialog.containerNode);
            resourceRoleDialog.show();
        }
    });
});

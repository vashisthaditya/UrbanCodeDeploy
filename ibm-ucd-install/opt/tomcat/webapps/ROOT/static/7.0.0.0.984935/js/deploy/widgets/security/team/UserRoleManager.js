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
/* global define, require */

define([
    "dijit/_TemplatedMixin",
    "dijit/_Widget",
    "dojo/_base/declare",
    "dojo/request/xhr",
    "dojo/dom-construct",
    "dojo/dom-class",
    "dojo/on",
    "js/webext/widgets/table/TreeTable",
    "js/webext/widgets/form/MenuButton",
    "js/webext/widgets/Dialog",
    "js/webext/widgets/GenericConfirm",
    "dojo/store/Memory",
    "dijit/form/FilteringSelect",
    "dijit/form/Button",
    "deploy/widgets/security/role/RoleResourceTypeManager"
], function(
    _TemplatedMixin,
    _Widget,
    declare,
    xhr,
    domConstruct,
    domClass,
    on,
    TreeTable,
    MenuButton,
    Dialog,
    GenericConfirm,
    Memory,
    FilteringSelect,
    Button,
    RoleResourceTypeManager) {
    /**
     * A view for managing role mappings for users that is organized based on
     * how a user is added to any role on any team.
     *
     * Optional input parameters:
     *
     * userFiltering / boolean - Choose whether to display the user filtering dropdown
     * above the role mapping table. Default behavior for undefined is false.
     *
     * Optional param:
     * userData / object - object that is representative of UserResource.getBasicJSON()
     * If userData is not provided then this widget will load the userData for the current user.
     */
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="UserRoleManager">' +
                '<div data-dojo-attach-point="filterAttach"></div>' +
                '<div data-dojo-attach-point="tableAttach"></div>' +
            '</div>',

        postCreate: function() {
            this._loadPermissions();
            if (!this.userData) {
                this._loadUserDataAndUserFilter();
            }
            this.loadTable();
        },

        _loadPermissions: function() {
            var p = config.data.permissions;
            this.canAdd = !!p["Add Team Members"];
            this.canEdit = !!p["Manage Security"];
            this.canManage = this.canAdd || this.canEdit;
        },

        /**
         * Refreshes the userData variable for the given id, or
         * loads the userData of the current user if no id is provided.
         * After load will refresh the user filter is appropriate
         * @param  {UUID} id [UUID is the user to load data for]
         */
        _loadUserDataAndUserFilter: function(id) {
            var self = this;

            if (this.canManage && !!id) {
                xhr.get(bootstrap.baseUrl + "security/user/" + id, {
                    handleAs: "json"
                }).then(function(data) {
                    self.userData = data;
                    if (!!self.userFiltering && !self.userFilter) {
                        self.loadUserFilter();
                    }
                });
            }
            else {
                if (!this.userData) {
                    this.userData = {
                        id: bootstrap.userId,
                        name: bootstrap.username
                    };
                }
                if (!!self.userFiltering && !self.userFilter) {
                    self.loadUserFilter();
                }
            }
        },

        /**
         * Loads the main table for this view
         */
        loadTable: function() {
            var url = bootstrap.baseUrl + "security/user/roleMappings/";
            if (this.userData) {
                url += this.userData.id;
            }
            else {
                url += bootstrap.userId;
            }
            this.showTable(url);
        },

        /**
         * generate the gridlayout for the main table of this view
         * @return {Array} [gridLayout contains columns Team, Role Mapping, and How Added]
         */
        generateUserTableGridLayout: function() {
            var self = this;

            var gridLayout = [{
                name: i18n("Team"),
                field: "team",
                beforeExpander: true,
                formatter: function(item, result, domNode) {
                    var itemWrapper = domConstruct.create("div", {
                        className: "row-text-block"
                    });
                    domConstruct.create("div", {
                        innerHTML: item.name.escape()
                    }, itemWrapper);

                    return itemWrapper;
                },
                orderField: "team",
                filterField: "team",
                filterType: "text",
                getRawValue: function(item) {
                    return item.name.escape();
                }
            }, {
                name: i18n("Role"),
                field: "role",
                beforeExpander: true,
                formatter: function(item, result, domNode) {
                    var itemWrapper = domConstruct.create("div", {
                        className: "row-text-block actions-text-block"
                    });
                    domConstruct.create("div", {
                        innerHTML: item.roleMapping.role.name.escape()
                    }, itemWrapper);

                    itemWrapper.appendChild(self.roleActionsFormatter(item));

                    return itemWrapper;
                },
                orderField: "role",
                filterField: "role",
                filterType: "text",
                getRawValue: function(item) {
                    return item.roleMapping.role.name.escape();
                }
            }, {
                name: i18n("How Added"),
                field: "context",
                beforeExpander: true,
                formatter: function(item, result, domNode) {
                    var context = item.roleMapping.context;
                    var groups = self._mergeGroupsIntoSingleList(context);
                    if (context.direct && groups.length !== 0) {
                        return self.generateContextLabel(i18n("Directly and Groups:"), groups);
                    }
                    if (context.direct) {
                        return self.generateContextLabel(i18n("Directly"), []);
                    }
                    if (groups.length !== 0) {
                        return self.generateContextLabel(i18n("Groups:"), groups);
                    }
                },
                orderField: "context",
                filterField: "context",
                filterType: "text",
                getRawValue: function(item) {
                    var searchValues = "";
                    if (item.roleMapping.context.direct) {
                        searchValues += "directlymanually";
                    }
                    var groups = self._mergeGroupsIntoSingleList(item.roleMapping.context);
                    if (groups.length !== 0) {
                        searchValues += "groups";
                        searchValues += self._generateGroupsSearchText(groups);
                    }
                    return searchValues;
                }
            }];
            return gridLayout;
        },

        /**
         * The RoleMapping context contains two types of groups:
         * Groups from Internal Storage and Groups from other Realms (such as LDAP)
         * This function merges the two lists of groups into a single list for
         * formatting reasons in the main table.
         * @param  {RoleMapping.context} context [context contains the means of how a user is mapped to a role]
         * @return {Array} [Array of All groups contained in context merged into single list]
         */
        _mergeGroupsIntoSingleList: function(context) {
            var groups = [];
            var i;
            for (i = 0; i < context.internalGroups.length; i++) {
                groups.push(context.internalGroups[i]);
            }
            for (i = 0; i < context.externalGroups.length; i++) {
                groups.push(context.externalGroups[i]);
            }
            return groups;
        },

        roleActionsFormatter: function(item) {
            var self = this;

            var result = domConstruct.create("div", {
                "dir": util.getUIDir(),
                "align": util.getUIDirAlign(),
                "class": "tableHoverActions"
            });

            var actionsList = [{
                label: i18n("View Role Permissions"),
                onClick: function() {
                    self.showRolePermissionsDialog(item.roleMapping.role, false);
                }
            }];
            if (item.canManage) {
                actionsList.push({
                    label: i18n("Remove User From Role"),
                    onClick: function() {
                        self.showRoleRemoveDialog(item);
                    }
                });
            }
            var actionsButton = new MenuButton({
                options: actionsList,
                label: i18n("Actions...")
            });
            actionsButton.placeAt(result);
            return result;
        },

        /**
         * Generates a div the contains a string of leading text followed by a list of groups
         * @param  {String} leadingText [Text preceding a list of groups]
         * @param  {Array} groups [List of groups following the text]
         * @return {DIV} [div of the text and groups with correct formatting]
         */
        generateContextLabel: function(leadingText, groups) {
            var groupsDiv = this.generateGroupsDiv(groups, false);
            var labelDiv = domConstruct.create("div", {
                style: {
                    display: "inline-block"
                },
                innerHTML: leadingText
            });
            domConstruct.place(labelDiv, groupsDiv, "first");
            return groupsDiv;
        },

        generateGroupsDiv: function(groups, showDelete) {
            var groupsDiv = domConstruct.create("div");
            var index;
            for (index in groups) {
                if (groups.hasOwnProperty(index)) {
                    var group = groups[index];
                    var groupBox = this.generateGroupDiv(group, showDelete);
                    domConstruct.place(groupBox, groupsDiv);
                }
            }
            return groupsDiv;
        },

        /**
         * Creates a purple (#9169BF) rectangle containing the group name with an optional
         * x button in the top right that will remove the selected user from the group
         * @param  {Group} group [object with data about a group]
         * @param  {Boolean} showDelete [boolean that determines whether to create the delete event listener and icon]
         * @return {DIV} [formatted box with group name]
         */
        generateGroupDiv: function(group, showDelete) {
            var self = this;

            // Group Box
            var groupBox = domConstruct.create("div", {
                className: "inline-block group-member-block",
                innerHTML: group.name.escape()
            });

            if (showDelete && this.canEdit) {
                // Hover Styling
                this.own(on(groupBox, "mouseover", function() {
                    domClass.add(groupBox, "group-member-block-hover");
                }));
                this.own(on(groupBox, "mouseout", function() {
                    domClass.remove(groupBox, "group-member-block-hover");
                }));

                // Remove Link
                var removeLink = domConstruct.create("div", {
                    className: "inline-block linkPointer remove-member icon_delete_red",
                    title: i18n("Remove %s", self.userData.name.escape())
                });
                domConstruct.place(removeLink, groupBox, "first");

                //Remove Link Handler
                this.own(on(removeLink, "click", function() {
                    self.showGroupDeleteDialog(group, groupBox);
                }));
            }
            return groupBox;
        },

        _generateGroupsSearchText: function(groups) {
            var groupNames = "";
            var i;
            for (i = 0; i < groups.length; i++) {
                groupNames += groups[i].name;
            }
            return groupNames;
        },

        showTable: function(url) {
            var gridLayout = this.generateUserTableGridLayout();
            this.roleTable = new TreeTable({
                url: url,
                columns: gridLayout,
                serverSideProcessing: false,
                orderField: "name",
                hideExpandCollapse: true,
                getTreeNodeId: function(data, parent) {
                    return data.id;
                }
            });
            this.roleTable.placeAt(this.tableAttach);
        },

        /**
         * From the My Profile view, users with sufficient security permissions
         * can filter for other users on their teams
         */
        loadUserFilter: function() {
            var self = this;

            if (this.canManage) {
                xhr.get(bootstrap.baseUrl + "security/user/manageableUsers", {
                    handleAs: "json"
                }).then(function(data) {
                    if (data.length !== 0) {
                        self.showUserFilter(i18n("Select user to manage roles:"), data);
                    }
                    else {
                        this.showUserFilter(i18n("Roles for user:"), [this.userData]);
                    }
                });
            }
            else {
                this.showUserFilter(i18n("Roles for user:"), [this.userData]);
            }
        },

        showUserFilter: function(leadingMessage, data) {
            var self = this;

            var filterWrapper = domConstruct.create("div");
            domConstruct.create("div", {
                style: {
                    display: "inline-block"
                },
                innerHTML: leadingMessage
            }, filterWrapper);

            this.userStore = new Memory({
                data: data
            });
            this.userFilter = new FilteringSelect({
                disabled: !this.canManage,
                name: self.userData.name.escape(),
                value: self.userData.id,
                store: self.userStore,
                searchAttr: "name",
                onChange: function(id) {
                    // An invalid selection will return an id of ""
                    if (!!id) {
                        self._loadUserDataAndUserFilter(id);
                        self.roleTable.url = bootstrap.baseUrl + "security/user/roleMappings/" + id;
                        self.roleTable.refresh();
                    }
                }
            });
            this.userFilter.domNode.style.position = "relative";
            this.userFilter.domNode.style.left = "10px";
            this.userFilter.placeAt(filterWrapper);
            domConstruct.place(filterWrapper, this.filterAttach);
            this.userFilter.startup();
        },

        /**
         * generates the popup dialog that the action button for manage user
         * roles creates in the main view. Contains a table of mappings with
         * options to remove the user from those mappings if the correct
         * permissions are present.
         * @param  {RoleMapping} item [object containing the context of how a
         * user is mapped to a role including the information on the role itself]
         */
        showRoleRemoveDialog: function(item) {
            var self = this;
            var roleRemoveDialog = new Dialog({
                title: i18n(
                    "Remove %s From Role %s",
                    self.userData.name.escape(),
                    item.roleMapping.role.name.escape()
                ),
                closeable: true,
                draggable: true
            });

            domConstruct.create("div", {
                className: "table-header",
                innerHTML: i18n(
                    "%s has access to the role %s via the following associations:",
                    self.userData.name.escape(),
                    item.roleMapping.role.name.escape()
                )
            }, roleRemoveDialog.containerNode);

            var gridLayout = this.generateRoleMappingGridLayout();
            this.roleManagerTable = new TreeTable({
                data: [item],
                noDataMessage: i18n(
                    "No more mappings to role %s exist.",
                    item.roleMapping.role.name.escape()
                ),
                columns: gridLayout,
                serverSideProcessing: false,
                orderField: "name",
                hideExpandCollapse: true,
                getTreeNodeId: function(data, parent) {
                    return data.id;
                }
            });
            this.roleManagerTable.placeAt(roleRemoveDialog.containerNode);

            var buttonsDiv = domConstruct.create("div", {
                className: "underField",
                style: {
                    display: "inline-block"
                }
            }, roleRemoveDialog.containerNode);
            var doneButton = new Button({
                label: i18n("Done"),
                onClick: function() {
                    self.roleTable.refresh();
                    roleRemoveDialog.destroy();
                }
            });
            doneButton.placeAt(buttonsDiv);

            domClass.add(roleRemoveDialog.containerNode, "UserRoleManager");
            roleRemoveDialog.show();
            // Strange problem where Dialog gives itself a height that is smaller than the available space
            roleRemoveDialog.containerNode.style.height = "";
        },

        /**
         * generate the gridlayout for the role removal table of this view
         * @return {Array} [gridLayout contains columns Direct Mapping true/false,
         * Internal Storage groups, and groups from other Realms]
         */
        generateRoleMappingGridLayout: function() {
            var self = this;
            var gridLayout = [{
                name: i18n("Direct Membership"),
                field: "direct",
                beforeExpander: true,
                formatter: function(item, result, domNode) {
                    var itemWrapper = domConstruct.create("div", {
                        className: "row-text-block actions-text-block"
                    });
                    if (item.roleMapping.context.direct) {
                        domConstruct.create("div", {
                            innerHTML: i18n("Manually assigned")
                        }, itemWrapper);
                        if (self.canEdit) {
                            itemWrapper.appendChild(self.directMappingActionsFormatter(item));
                        }
                    }
                    return itemWrapper;
                },
                getRawValue: function(item) {
                    return item.roleMapping.context.direct;
                }
            }, {
                name: i18n("Internal Storage Authentication Realms"),
                field: "internal",
                beforeExpander: true,
                formatter: function(item, result, domNode) {
                    var itemWrapper = domConstruct.create("div", {
                        className: "group-actions-text-block"
                    });
                    var groups = item.roleMapping.context.internalGroups;
                    if (groups.length !== 0) {
                        itemWrapper.appendChild(self.generateGroupsDiv(groups, true));
                        if (self.canEdit) {
                            itemWrapper.appendChild(self.groupMappingActionsFormatter(item));
                        }
                    }
                    return itemWrapper;
                }
            }, {
                name: i18n("Other Authentication Realms"),
                field: "external",
                beforeExpander: true,
                formatter: function(item, result, domNode) {
                    var itemWrapper = domConstruct.create("div", {
                        className: "inlineBlock"
                    });
                    itemWrapper.appendChild(self.generateGroupsDiv(item.roleMapping.context.externalGroups, false));
                    return itemWrapper;
                }
            }];
            return gridLayout;
        },

        directMappingActionsFormatter: function(item) {
            var self = this;

            var result = domConstruct.create("div", {
                "dir": util.getUIDir(),
                "align": util.getUIDirAlign(),
                "class": "tableHoverActions"
            });

            var actionsButton = new MenuButton({
                options: [{
                    label: i18n("Remove Mapping"),
                    onClick: function() {
                        xhr.del(
                            bootstrap.baseUrl + "security" +
                            "/team/" + item.id +
                            "/role/" + item.roleMapping.role.id +
                            "/user/" + self.userData.id,
                        {
                            handleAs: "json"
                        }).then(function(data) {
                            self.roleManagerTable.data[0].roleMapping.context.direct = false;
                            self.refreshRoleMappingTableData();
                            self.roleManagerTable.refresh();
                        });
                    }
                }],
                label: i18n("Actions...")
            });
            actionsButton.placeAt(result);
            return result;
        },

        groupMappingActionsFormatter: function(item) {
            var self = this;

            var result = domConstruct.create("div", {
                "dir": util.getUIDir(),
                "align": util.getUIDirAlign(),
                "class": "tableHoverActions",
                "style": {
                    "top": "5px"
                }
            });
            var groupStore = new Memory({
                data: item.roleMapping.context.internalGroups
            });
            var groupFilter = new FilteringSelect({
                required: false,
                placeHolder: i18n("Remove user from..."),
                store: groupStore,
                searchAttr: "name",
                onChange: function(id) {
                    // An invalid selection will return an id of ""
                    if (!!id) {
                        self.showGroupDeleteDialog(this.item);
                    }
                }
            }).placeAt(result).startup();
            return result;
        },

        /**
         * @param  {Group} group  [group to remove the user in userData from]
         * @param  {groupBox} DIV [The group as displayed in the roleManagerTable. if groupBox
         *                         is present then it should be destroyed as part of the
         *                         groupDeleteDialog confirm action. If groupBox is undefined
         *                         then this function was called from the group filter and so
         *                         the table should be refreshed on cancel instead.]
         */
        showGroupDeleteDialog: function(group, groupBox) {
            var self = this;
            var groupDeleteDialog = new GenericConfirm({
                message: i18n("Are you sure you wish to remove %s from the group %s?",
                    self.userData.name.escape(),
                    group.name.escape()),
                confirmLabel: i18n("Remove"),
                action: function() {
                    if (!!groupBox) {
                        domConstruct.destroy(groupBox);
                    }
                    self.deleteUserFromGroup(group);
                    groupDeleteDialog.destroy();
                },
                cancelAction: function() {
                    if (!groupBox) {
                        // Need to clear the group search dialog
                        self.roleManagerTable.refresh();
                    }
                }
            });
        },

        deleteUserFromGroup: function(group) {
            var self = this;
            xhr.del(bootstrap.baseUrl + "security/group/" + group.id + "/" + "members/" + self.userData.id, {
                handleAs: "json"
            }).then(function(data) {
                self.deleteGroupFromTableData(group);
                self.refreshRoleMappingTableData();
                self.roleManagerTable.refresh();
            });
        },

        /**
         * Because the role manager table is fed by local data, the data must be manually
         * updated since refreshing the table would reload the mapping from local memory.
         * @param  {Group} group [group to be deleted from the list of available groups in the table]
         */
        deleteGroupFromTableData: function(group) {
            var groups = this.roleManagerTable.data[0].roleMapping.context.internalGroups;
            var i;
            for (i = 0; i < groups.length; i++) {
                if (groups[i].id === group.id) {
                    groups.splice(i, 1);
                    return;
                }
            }
        },

        /**
         * If all mappings for a user are removed using role manager table then the data in the
         * table should be updated such that the table displays the no more data message.
         */
        refreshRoleMappingTableData: function() {
            var internalGroupsExist = this.roleManagerTable.data[0].roleMapping.context.internalGroups.length !== 0;
            var externalGroupsExist = this.roleManagerTable.data[0].roleMapping.context.externalGroups.length !== 0;
            var directMappingExists = this.roleManagerTable.data[0].roleMapping.context.direct;
            if (!internalGroupsExist && !externalGroupsExist && !directMappingExists) {
                this.roleManagerTable.data = [];
            }
        },

        showRolePermissionsDialog: function(role, canEdit) {
            var rolePermissionsDialog = new Dialog({
                title: i18n(
                    "Permissions For Role %s",
                    role.name.escape()
                ),
                closeable: true,
                draggable: true,
                style: {
                    width: "1200px"
                }
            });

            var typeManager = new RoleResourceTypeManager({
                role: role,
                overrideListWidth: "165px",
                canEdit: canEdit
            });
            typeManager.placeAt(rolePermissionsDialog.containerNode);

            var buttonsDiv = domConstruct.create("div", {
                className: "underField",
                style: {
                    display: "inline-block"
                }
            }, rolePermissionsDialog.containerNode);
            var doneButton = new Button({
                label: i18n("Close"),
                onClick: function() {
                    rolePermissionsDialog.destroy();
                }
            });
            doneButton.placeAt(buttonsDiv);
            rolePermissionsDialog.show();
        }
    });
});

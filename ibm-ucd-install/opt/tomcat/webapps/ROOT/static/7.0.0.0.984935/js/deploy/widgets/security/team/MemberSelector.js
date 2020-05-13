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
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/on",
        "dojo/query",
        "dojo/mouse",
        "dojo/dnd/Source",
        "deploy/widgets/Popup",
        "js/webext/widgets/DialogMultiSelect",
        "js/webext/widgets/GenericConfirm",
        "deploy/widgets/security/role/RoleResourceTypeManager"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        array,
        declare,
        xhr,
        domConstruct,
        domClass,
        on,
        query,
        mouse,
        dndSource,
        Popup,
        DialogMultiSelect,
        GenericConfirm,
        RoleResourceTypeManager
) {
    return declare([_Widget, _TemplatedMixin], {

        /**
         * MemberSelector(options)
         *
         * options: {
         *    team: The team of the current user.
         *    role: The role of the current user
         *    header: The name of the role.
         *    parent: The widget using the member selector (EditTeam.js)
         *    parentForm: The form this widget is in (ColumnForm), to auto submit the form on changes.
         *    }
         */
        templateString:
            '<div class="team-member-selector">' +
                '<div class="selector-header-container" data-dojo-attach-point="headerContainerAttach">' +
                    '<div class="selector-header-expand linkPointer inline-block" data-dojo-attach-point="expandAttach"></div>' +
                    '<div class="selector-header inline-block" data-dojo-attach-point="headerAttach"></div>' +
                    '<div class="selector-button inline-block" data-dojo-attach-point="buttonAttach"></div>' +
                '</div>'+
                '<div class="selector-member-container" data-dojo-attach-point="containerAttach">' +
                    '<div class="selector-users" data-dojo-attach-point="usersAttach">' +
                        '<div class="selector-label inline-block" data-dojo-attach-point="userLabelAttach"></div>' +
                    '</div>' +
                    '<div class="selector-groups" data-dojo-attach-point="groupsAttach">' +
                        '<div class="selector-label inline-block" data-dojo-attach-point="groupLabelAttach"></div>' +
                    '</div>' +
                '</div>'+
                '<div class="selector-permission-container" data-dojo-attach-point="permissionAttach">' +
            '</div>',

        rowClass: "labelsAndValues-row team-role-row",

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            this._loadPermissions();
            this._initializeData();
            this.showMembers();
            this._populateHeader();
            this._setUpDnd();
        },

        /**
         * Sets the permissions.
         */
        _loadPermissions: function(){
            var p = config.data.permissions;
            this.canAdd = p["Add Team Members"];
            this.canEdit = p["Manage Security"];
            this.canModify = this.canAdd || this.canEdit;
        },

        /**
         * Initializes global variables for this widget.
         */
        _initializeData: function(){
            this.userIds = [];
            this.groupIds = [];
            this.ids = {
                user: {},
                group: {}
            };
            this.usersToRemove = [];
            this.groupsToRemove = [];
            this.boxesToRemove = [];
            this.permissions = {};
            this.userPopups = {};
            this.groupPopups = {};
            this.edit = false;
        },

        /**
         * Builds the header of the team member selector.
         */
        _populateHeader: function(){
            if (this.header){
                this.headerAttach.innerHTML = this.header.escape();
            }
            if ((this.userIds.length > 0 || this.groupIds.length > 0) && this.canModify){
                this._createEdit();
            }
            this._createPermissions();
            if (this.canModify){
                this._createDialog();
            }
            this.popuplateContainerLabels();
        },

        /**
         * Populate the user and group container labels.
         */
        popuplateContainerLabels: function(){
            this.userLabelAttach.innerHTML = i18n("Users");
            this.groupLabelAttach.innerHTML = i18n("Groups");
        },

        /**
         * Sets up the edit mode which essentially displays the delete buttons on all member boxes with
         * a save and cancel button in the header to confirm changes.
         */
        _createEdit: function(){
            var _this = this;

            var editButton = new Button({
                label: i18n("Edit")
            });
            var saveButton = new Button({
                label: i18n("Save")
            });
            var cancelButton = new Button({
                label: i18n("Cancel")
            });
            domClass.add(editButton.domNode, "idxButtonCompact");
            domClass.add(saveButton.domNode, "idxButtonSpecial idxButtonCompact hidden");
            domClass.add(cancelButton.domNode, "idxButtonCompact hidden");

            // Hide add button and show save and cancel button in edit mode.
            var hideEdit = function(){
                _this.edit = false;
                domClass.add(saveButton.domNode, "hidden");
                domClass.add(cancelButton.domNode, "hidden");
                domClass.remove(_this.memberSelect.domNode, "hidden");
                domClass.remove(editButton.domNode, "hidden");
                domClass.remove(_this.domNode, "team-edit-mode");
            };

            on(editButton, "click", function(){
                _this.edit = true;
                domClass.remove(saveButton.domNode, "hidden");
                domClass.remove(cancelButton.domNode, "hidden");
                domClass.add(_this.memberSelect.domNode, "hidden");
                domClass.add(editButton.domNode, "hidden");
                domClass.add(_this.domNode, "team-edit-mode");
            });
            on(saveButton, "click", function(){
                hideEdit();
                array.forEach(_this.usersToRemove, function(memberId){
                    util.removeFromArray(_this.userIds, memberId);
                });
                array.forEach(_this.groupsToRemove, function(memberId){
                    util.removeFromArray(_this.groupIds, memberId);
                });
                _this.onChange();
            });
            on(cancelButton, "click", function(){
                hideEdit();
                array.forEach(_this.boxesToRemove, function(box){
                    domClass.remove(box, "hidden");
                });
            });
            domConstruct.place(editButton.domNode, this.buttonAttach);
            domConstruct.place(saveButton.domNode, this.buttonAttach);
            domConstruct.place(cancelButton.domNode, this.buttonAttach);
        },

        /**
         * Creates the Show Permissions Expand Button
         */
        _createPermissions: function(){
            var _this = this;

            var showButton = domConstruct.create("div", {
                className: "team-expander",
                value: true
            }, this.expandAttach);
            domClass.add(showButton, "team-collapsed");
            domClass.add(_this.permissionAttach, "hide-permissions");
            var loadPermissions = function(){
                domClass.add(_this.permissionAttach, "hide-permissions");
                domClass.remove(showButton, "team-expanded");
                domClass.remove(showButton, "team-collapsed");
                if (showButton.value){
                    // Load permissions table on first expand.
                    if (!_this.permissions[_this.role.id]){
                        _this._createPermissionsTable();
                    }
                    showButton.value = false;
                    domClass.add(showButton, "team-expanded");
                    domClass.remove(_this.permissionAttach, "hide-permissions");
                }
                else {
                    showButton.value = true;
                    domClass.add(showButton, "team-collapsed");
                }
            };
            on(this.expandAttach, "click", function(){
                loadPermissions();
            });
            on(this.headerContainerAttach, "dblclick", function(){
                loadPermissions();
            });
        },

        /**
         * Creates the permissions table to view permissions for a specific role.
         */
        _createPermissionsTable: function(){
            var role = new RoleResourceTypeManager({
                role: this.role,
                header: i18n("Permissions granted to members of role: %s", this.role.name.escape())
            });
            domConstruct.place(role.domNode, this.permissionAttach);
            this.permissions[this.role.id] = role;
            // If the current user has permissions to edit security, add a notice that changes
            // to the permissions will affect all users in the role.
            if (this.canEdit){
                var noteContainer = domConstruct.create("div", {
                    className: "edit-role-permissions-note"
                });
                domConstruct.create("div", {
                    className: "inline-block required",
                    innerHTML: "*"
                }, noteContainer);
                domConstruct.create("div", {
                    className: "inline-block description-text",
                    innerHTML: i18n("Editing these permissions affects this role in all teams!")
                }, noteContainer);
                domConstruct.place(noteContainer, role.detailContainerAttach, "first");
            }
        },

        /**
         * Creates the dialog for adding users.
         */
        _createDialog: function(){
            var _this = this;
            this.memberSelect = new DialogMultiSelect({
                noSelectionsLabel: i18n("Add"),
                url: bootstrap.baseUrl+"security/team/"+_this.team.id+"/roleMappings/"+_this.role.id+"/validMembers",
                getLabel: function(item) {
                    return item.name;
                },
                getValue: function(item) {
                    return item.type+"#"+item.id;
                }
            });
            // Add behavior to the DialogMultiSelect to style it as a regular button.
            domClass.add(this.memberSelect.domNode, "dijitButton idxButtonCompact member-select-button-compact");
            this.memberSelect.placeAt(_this.buttonAttach);

            on(this.memberSelect.domNode, mouse.enter, function(){
                domClass.add(_this.memberSelect.domNode, "dijitHover dijitButtonHover");
            });
            on(this.memberSelect.domNode, mouse.leave, function(){
                domClass.remove(_this.memberSelect.domNode, "dijitHover dijitButtonHover");
            });

            this.memberSelect.on("close", function() {
                var memberItems = _this.memberSelect.get("items");

                array.forEach(memberItems, function(memberItem) {
                    _this.showMember(memberItem, memberItem.type);
                });
                _this.memberSelect.set("value", "");
                _this.onChange();
            });
        },

        /**
         * Sets up the drag and drop functionality of the team member container.
         */
        _setUpDnd: function(){
            var _this = this;
            this.dnds = new dndSource(this.domNode, {
                onDropExternal: function(source, nodes, copy){
                    var mode = source.value;
                    var save = false;
                    // For each node, add it the corresponding array. If on edit mode, put it in the
                    // temporary array and user has the option to save or cancel the changes.
                    array.forEach(nodes, function(node){
                        var value = node.value;
                        var id = value ? value.id : null;
                        if (mode === "user" && !_this.ids.user[id]){
                            _this.showMember(value, mode);
                            save = true;
                        }
                        else if (mode === "group" && !_this.ids.group[id]){
                            _this.showMember(value, mode);
                            save = true;
                        }
                    });
                    // Save only if there was a mode and no matches (No Duplicates).
                    if (mode && save){
                        _this.onChange();
                    }
                }
            });
        },

        /**
         * Creates all the members to be displayed in the table.
         */
        showMembers: function() {
            var _this = this;
            array.forEach(_this.team.roleMappings, function(mapping) {
                if (mapping.role.id === _this.role.id) {
                    if (mapping.user) {
                        _this.showMember(mapping.user, "user");
                    }
                    else if (mapping.group) {
                        _this.showMember(mapping.group, "group");
                    }
                }
            });
        },

        /**
         * Creates a member block.
         *  @param member: Information of the member
         *  @param type: The type of the member (User or Group)
         */
        showMember: function(member, type) {
            var _this = this;

            var showBox = false;
            if (type === "user") {
                if (this.userIds.indexOf(member.id) === -1) {
                    showBox = true;
                    this.userIds.push(member.id);
                    this.ids.user[member.id] = true;
                }
            }
            else {
                if (this.groupIds.indexOf(member.id) === -1) {
                    showBox = true;
                    this.groupIds.push(member.id);
                    this.ids.group[member.id] = true;
                }
            }

            if (showBox) {
                var displayName = member.name;

                var memberBox = domConstruct.create("div", {
                    "class": "team-member-block inline-block member-box-" + member.id,
                    "innerHTML": displayName.escape()
                });
                on(memberBox, mouse.enter, function(){
                    var relatedBoxes = query(".member-box-" + member.id);
                    array.forEach(relatedBoxes, function(box){
                        domClass.add(box, "hover");
                    });
                    on(memberBox, mouse.leave, function(){
                        array.forEach(relatedBoxes, function(box){
                            domClass.remove(box, "hover");
                        });
                    });
                });

                if (type === "user") {
                    domConstruct.place(memberBox, _this.usersAttach);
                }
                else {
                    // Create group popup on first mouseover
                    if (this.canModify && !_this.groupPopups[member.id]){
                        _this.groupPopups[member.id] = on(memberBox, mouse.enter, function(){
                            _this._createGroupPopup(member.id, memberBox);
                        });
                    }
                    domConstruct.place(memberBox, _this.groupsAttach);
                }

                if (this.canEdit) {
                    var removeLink = domConstruct.create("div", {
                        className: "inline-block linkPointer remove-team-member icon_delete_red",
                        title: i18n("Remove %s", displayName)
                    });
                    domConstruct.place(removeLink, memberBox, "first");
                    on(removeLink, "click", function() {
                        if (!_this.edit){
                            var confirm = new GenericConfirm({
                                message: i18n("Are you sure you want to remove %1 from the %2 role?",
                                        util.escape(member.name),
                                        util.escape(_this.get("role").name)),
                                forceRawMessages: true,
                                action: function() {
                                    domConstruct.destroy(memberBox);
                                    if (type === "user") {
                                        util.removeFromArray(_this.userIds, member.id);
                                    }
                                    else {
                                        util.removeFromArray(_this.groupIds, member.id);
                                    }
                                    _this.onChange();
                                }
                            });
                        }
                        else {
                            domClass.add(memberBox, "hidden");
                            _this.boxesToRemove.push(memberBox);
                            if (type === "user") {
                                _this.usersToRemove.push(member.id);
                            }
                            else {
                                _this.groupsToRemove.push(member.id);
                            }
                        }
                    });
                }
            }
        },

        /**
         * Creates a popup on group blocks to show members within that group
         *  @param groupId: The id of the group
         *  @param: attachPoint: The domNode to attach the popup to.
         */
        _createGroupPopup: function(groupId, attachPoint){
            if (this.groupPopups[groupId]){
                xhr.get({
                    url: bootstrap.baseUrl + "security/group/" + groupId + "/members",
                    handleAs: "json",
                    load: function(data) {
                        var popupContents = domConstruct.create("div");
                        domConstruct.create("div", {
                            className: "group-popup-title",
                            innerHTML: i18n("Group Members (%s)", data.length)
                        }, popupContents);
                        array.forEach(data, function(member){
                            var memberLine = domConstruct.create("div", {
                                className: "group-member-line"
                            }, popupContents);
                            domConstruct.create("div", {
                                className: "team-member-label",
                                innerHTML: member.displayName.escape()
                            }, memberLine);
                        });
                        var popup = new Popup({
                            attachPoint: attachPoint,
                            contents: popupContents
                        });

                        // Show popover if the mouse is still here
                        if (this._cursorIsOverElement(attachPoint)) {
                            popup.externalShow();
                        }
                    }.bind(this)
                });
                this.groupPopups[groupId].remove();
            }
        },

        // Convenience wrapper to see if the mouse is over an element.
        _cursorIsOverElement: function(el) {
            // Get parent's children who are hovered.  Those are listed in
            // order from least to most specific, so we just make sure the
            // element we're interested in is the first element in the
            // selection.
            var hoverSelection = query(":hover", el.parentElement);
            return hoverSelection.length > 0 && hoverSelection[0] === el;
        },

        /**
         *
         */
        _getValueAttr: function() {
            var _this = this;

            var result = {
                userIds: _this.userIds,
                groupIds: _this.groupIds
            };

            return result;
        },

        /**
         * Function to call when adding or deleting members from the team.
         */
        onChange: function(){
            if (this.parentForm && !this.edit){
                this.parentForm.submitForm();
            }
        }
    });
});

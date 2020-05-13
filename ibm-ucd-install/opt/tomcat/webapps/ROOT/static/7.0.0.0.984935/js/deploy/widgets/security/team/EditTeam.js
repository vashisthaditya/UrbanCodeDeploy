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
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/dom-geometry",
        "dojo/on",
        "dojo/query",
        "dojo/mouse",
        "dojo/dnd/Target",
        "js/webext/widgets/ColumnForm",
        "deploy/widgets/security/team/MemberSelector",
        "deploy/widgets/rightPanel/RightPanelUsersAndGroups"
        ],
function(
        _TemplatedMixin,
        _Widget,
        array,
        declare,
        xhr,
        domConstruct,
        domClass,
        geo,
        on,
        query,
        mouse,
        dndTarget,
        ColumnForm,
        MemberSelector,
        RightPanelUsersAndGroup
) {
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="edit-user">'+
              '<div class="add-members-button" data-dojo-attach-point="buttonAttach"></div>'+
              '<div class="right-panel-container users-and-groups-right-panel" data-dojo-attach-point="panelAttach"></div>'+
              '<div class="team-list" data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var _this = this;
            this._loadPermissions();
            this.existingValues = this.team || {};

            xhr.get({
                url: bootstrap.baseUrl+"security/role",
                handleAs: "json",
                load: function(data) {
                    _this.roleData = data;
                    _this.showForm();
                    _this.showPanel();
                }
            });
        },

        /**
         * Sets the permissions.
         */
        _loadPermissions: function(){
            var p = config.data.permissions;
            var canAdd = p["Add Team Members"];
            var canEdit = p["Manage Security"];
            this.canModify = canEdit && canAdd;
        },

        /**
         * Builds the form for the team.
         */
        showForm: function() {
            var _this = this;

            this.roleRows = [];

            if (!this.canModify){
                domClass.add(this.domNode, "edit-team-read-only");
            }

            this.form = new ColumnForm({
                submitUrl: bootstrap.baseUrl+"security/team" + (_this.team ? "/"+_this.team.id : ""),
                submitMethod: _this.team ? "PUT" : "POST",
                cancelLabel: null,
                showButtons: _this.canModify,
                addData: function(data) {
                    data.roleMappings = [];
                    array.forEach(_this.roleData, function(role) {
                        var formValue = data["roleMembers_" + role.id];
                        delete data["roleMembers_" + role.id];

                        if (formValue) {
                            array.forEach(formValue.userIds, function(userId) {
                                data.roleMappings.push({
                                    user: userId,
                                    role: role.id
                                });
                            });
                            array.forEach(formValue.groupIds, function(groupId) {
                                data.roleMappings.push({
                                    group: groupId,
                                    role: role.id
                                });
                            });
                        }
                    });
                },
                postSubmit: function(data) {
                    if (_this.callback !== undefined) {
                        // On submit, page refreshes. Return additional flag if right panel was shown
                        _this.callback(true, !_this.rightPanel.panelHidden, data.id);
                    }
                },
                onCancel: function() {
                    if (_this.callback !== undefined) {
                        _this.callback(true);
                    }
                }
            });

            this.form.addField({
                name: "name",
                label: i18n("Name"),
                required: _this.canModify,
                type: "Text",
                readOnly: !_this.canModify,
                value: this.existingValues.name
            });

            if (_this.team) {
                var first = false;
                array.forEach(this.roleData, function(role) {
                    var memberSelector = new MemberSelector({
                        team: _this.team,
                        role: role,
                        header: i18n(role.name),
                        parentForm: _this.form,
                        parent: _this
                    });
                    var row = _this.form.addField({
                        name: "roleMembers_" + role.id,
                        label: !first ? i18n("Role Members") : "",
                        widget: memberSelector
                    });
                    _this.roleRows.push(row);
                    first = true;
                });
            }
            this.form.placeAt(this.formAttach);
            var saveButton = this.form.saveButton;
            // Places save button at top at form instead of bottom.
            if (saveButton){
                domClass.add(saveButton.domNode, "idxButtonCompact team-save-button");
                domConstruct.place(saveButton.domNode, this.form.formAttach, "first");
            }
            // Display save button only if textbox has been clicked on.
            var textbox = query(".dijitTextBox")[0];
            if (textbox && this.form.saveButton){
                domClass.add(saveButton.domNode, "hidden");
                domClass.add(_this.domNode, "edit-team-read-only");
                on(textbox, "click", function(){
                    domClass.remove(saveButton.domNode, "hidden");
                    domClass.remove(_this.domNode, "edit-team-read-only");
                });
            }
        },

        /**
         * Displays the right panel of users and groups
         */
        showPanel: function(){
            var _this = this;
            this.rightPanel = new RightPanelUsersAndGroup({
                attachPoint: _this.panelAttach,
                buttonAttachPoint: _this.buttonAttach,
                parent: _this,
                display: _this.showRightPanel,
                onShow: function(){
                    // Mac OSX has the ability to hide scroll bars, on other system they show and add
                    // some margin of padding. We can check the width of the right panel to determine
                    // if a scroll bar is shown or not and add a class to address this extra padding.
                    // Without it, the spacing of the right panel and team form looks awkward.
                    if (!domClass.contains(_this.panelAttach, "panel-with-scroll-bars") ||
                        !domClass.contains(_this.panelAttach, "panel-with-no-scroll-bars")){
                        if (geo.position(_this.panelAttach).w > 85){
                            domClass.add(_this.domNode, "panel-with-scroll-bars");
                        }
                        else {
                            domClass.add(_this.domNode, "panel-with-no-scroll-bars");
                        }
                    }
                    domClass.add(_this.domNode, "right-panel-show");
                },
                onHideExtra: function(){
                    domClass.remove(_this.domNode, "right-panel-show");
                }
            });
            if (!this.rightPanel.isHidden()){
                domClass.add(_this.domNode, "right-panel-show");
            }
            // On refresh of page, check if the right panel is at or above the top of the page.
            if (geo.position(_this.domNode).y < 24){
                domClass.add(_this.domNode, "right-panel-top");
            }
            // If right panel reaches top of screen, dock it to the right.
            if (window){
                on(window, "scroll", function(evt){
                    if (!_this.rightPanel.isHidden()){
                        try {
                            var position = geo.position(_this.domNode);
                            if (position && position.y < 24){
                                if (!domClass.contains(_this.domNode, "right-panel-top")){
                                    domClass.add(_this.domNode, "right-panel-top");
                                }
                            }
                            else if (domClass.contains(_this.domNode, "right-panel-top")){
                                domClass.remove(_this.domNode, "right-panel-top");
                            }
                        }
                        catch (e){
                            // Geo-position cannot find owner document. Somehow not caught by dojo.
                            // None blocking error, so we don't need to show it to console.
                        }
                    }
                });
            }
            this.showPanelMinimizer();
        },

        /**
         * When you begin the drag and drop motions, display a container to hover over to minimize
         * the role containers for easy addition of team members.
         */
        showPanelMinimizer: function(){
            var _this = this;
            var minimizerContainer = domConstruct.create("div", {
                className: "right-panel-role-minimizer-container hide-minimizer"
            }, this.panelAttach);
            var minimizer = domConstruct.create("div", {
                className: "inline-block right-panel-role-minimizer-text containerLabel",
                innerHTML: i18n("Hover here to minimize roles")
            }, minimizerContainer);
            // Create drag and drop listener to detect dnd events of the entire page.
            this.dndListener = new dndTarget(domConstruct.create("div"), {
                onDndStart: function(){
                    // Display the minimize when a dnd event starts.
                    domClass.remove(minimizerContainer, "hide-minimizer");
                },
                onDndDrop: function(){
                    domClass.add(minimizerContainer, "hide-minimizer");
                    if (_this.domNode){
                        domClass.remove(_this.domNode, "minimize-roles");
                    }
                },
                onDndCancel: function(){
                    domClass.add(minimizerContainer, "hide-minimizer");
                    if (_this.domNode){
                        domClass.remove(_this.domNode, "minimize-roles");
                    }
                }
            });
            // Add minimizer class to minimize role containers when hovering over minimizer.
            on(minimizer, mouse.enter, function(){
                // if (domClass.contains(_this.domNode, "minimize-roles")){
                    // domClass.remove(_this.domNode, "minimize-roles");
                    // minimizer.innerHTML = i18n("Hover here to minimize roles");
                // }
                domClass.add(_this.domNode, "minimize-roles");
                domClass.add(minimizerContainer, "hide-minimizer");
                // minimizer.innerHTML = i18n("Hover here to maximize roles");
            });
        }
    });
});
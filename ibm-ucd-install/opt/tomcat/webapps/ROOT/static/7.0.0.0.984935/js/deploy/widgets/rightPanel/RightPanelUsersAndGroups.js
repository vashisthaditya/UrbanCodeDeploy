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
define(["dojo/_base/declare",
        "dojo/_base/array",
        "deploy/widgets/rightPanel/RightPanel",
        "dojo/dom-class",
        "dojo/dom-style",
        "dojo/dom-construct",
        "dojo/on",
        "dojo/mouse",
        "dojo/query",
        "dijit/form/Button",
        "js/webext/widgets/table/TreeTable"
        ],
        function(
            declare,
            array,
            RightPanel,
            domClass,
            domStyle,
            domConstruct,
            on,
            mouse,
            query,
            Button,
            TreeTable
        ){
    /**
     * Right Panel Users And Groups
     *
     * Widget for displaying a right panel of users and groups on the teams page.
     *
     * Use: new RightPanelUsersAndGroups(options{});
     *
     * options: {

     * }
     */
    return declare('deploy.widgets.rightPanel.RightPanelUsersAndGroups',  [RightPanel], {

        postCreate: function() {
            this.inherited(arguments);
            this.loadPermissions();
            this.setHeader();
            if (this.canModify) {
                this.loadUserTable();
                this.loadGroupTable();
            }
            this._buildPanel();
            if (this.attachPoint){
                this.placeAt(this.attachPoint);
            }
            this._buildShowButton();
            this.showHelp();
        },

        /**
         * Sets the header of the right panel.
         */
        setHeader: function(){
            this.header = i18n("Users & Groups");
            this.description = i18n("Click and drag users and groups and release them over the " +
                    "role that you want to assign them to.  You can select multiple users to assign " +
                    "to a role.  Assigned users and groups are automatically saved to the role.");
        },

        /**
         * Sets the permissions for the right panel.
         */
        loadPermissions: function(){
            var p = config.data.permissions;
            this.canAdd = p["Add Team Members"];
            this.canEdit = p["Manage Security"];
            this.canModify = this.canEdit || this.canAdd;
            if (!this.canModify){
                this.subheader = "";
            }
        },

        /**
         * Refreshes the contents of the table.
         */
        refresh: function(){
            if (this.table){
                this.table.refresh();
            }
        },

        /**
         * Creates a menu button displaying the types of right panels to show.
         */
        _buildShowButton: function() {
            if (this.canModify) {
                var _this = this;
                var showLabel = i18n("Add Users & Groups");
                if (this.canEdit) {
                    showLabel = i18n("Show Users & Groups");
                }
                var hideLabel = i18n("Hide Users & Groups");
                this.showButton = new Button({
                    label: _this.panelHidden ? showLabel : hideLabel,
                    value: _this.panelHidden ? true : false
                });
                domClass.add(this.showButton.domNode, "idxButtonCompact");
                on(this.showButton, "click", function(evt){
                    if (_this.showButton.value){
                        _this.showButton.set("label", hideLabel);
                        _this.showButton.set("value", false);
                        _this.show(evt.shiftKey);
                    }
                    else {
                        _this.showButton.set("label", showLabel);
                        _this.showButton.set("value", true);
                        _this.hide(evt.shiftKey);
                    }
                });
                this.showButton.placeAt(this.buttonAttachPoint);
            }
        },

        onHide: function(){
            if (this.showButton){
                var showLabel = i18n("Add Users & Groups");
                if (this.canEdit) {
                    showLabel = i18n("Show Users & Groups");
                }
                this.showButton.set("value", true);
                this.showButton.set("label", showLabel);
            }
            this.onHideExtra();
        },

        /**
         * Additional function to perform after the onHide function.
         */
        onHideExtra: function(){
           // no-op by default
        },

        showHelp: function(){
            if (this.canAdd){
                var helpContainer = domConstruct.create("div", {
                    className: "dnd-hint-help"
                }, this.titleContentAttach);
                domConstruct.create("div", {
                    innerHTML: i18n("Drag items on handle"),
                    className: "inline-block description-text"
                }, helpContainer);
                domConstruct.create("div", {
                    innerHTML: "::",
                    className: "inline-block dnd-handle-text"
                }, helpContainer);
            }
        },

        /**
         * Builds and loads the user table.
         */
        loadUserTable: function(){
            var _this = this;
            var gridRestUrl = bootstrap.baseUrl + "security/user";
            var gridLayout = [{
                name: i18n("User"),
                field: "name",
                orderField: "name",
                filterField: "name",
                filterType: "text",
                getRawValue: function(item) {
                    return item.name;
                }
            },{
                name: i18n("Name"),
                field: "actualName",
                orderField: "actualName",
                filterField: "actualName",
                filterType: "text",
                getRawValue: function(item) {
                    return item.actualName;
                }
            },{
                name: i18n("Email"),
                field: "email",
                orderField: "email",
                filterField: "email",
                filterType: "text",
                getRawValue: function(item) {
                    return item.email;
                },
                formatter: function(item, value, cell) {
                    var label = "";
                    if (value) {
                        label = value;
                    }
                    var result = domConstruct.create("div", {
                        innerHTML: label,
                        className: "user-email-cell"
                    });
                    return result;
                }
            }];

            this.users = new TreeTable({
                url: gridRestUrl,
                serverSideProcessing: false,
                columns: gridLayout,
                tableConfigKey: "teamRightPanelUserList",
                noDataMessage: i18n("No users have been created yet."),
                rowsPerPage: 10,
                pageOptions: [5, 10, 15, 20, 25, 50, 75, 100],
                draggable: _this.canModify,
                selectable: _this.canModify,
                hideFooterLinks: true,
                hidePagination: false,
                hideExpandCollapse: true,
                allowHeaderLocking:false,
                onDisplayTable: function(){
                    domClass.add(this.domNode, "right-panel-users");
                    if (_this.canModify){
                        this.dndContainer.copyOnly = true;
                        this.dndContainer.value = "user";
                        this.dndContainer.checkAcceptance = function(){
                            return false;
                        };
                        this.dndContainer.onDraggingOut = function(){
                            _this.showMinimizeBubble();
                        };
                    }
                },
                applyRowStyle: function(item, row) {
                    row.value = item;
                    domClass.add(row, "member-box-" + item.id);
                    on(row, mouse.enter, function(){
                        var relatedBoxes = query(".member-box-" + item.id);
                        array.forEach(relatedBoxes, function(box){
                            domClass.add(box, "hover");
                        });
                        on(row, mouse.leave, function(){
                            array.forEach(relatedBoxes, function(box){
                                domClass.remove(box, "hover");
                            });
                        });
                    });
                }
            });
            domConstruct.place(this.users.domNode, this.contentAttach);
        },

        /**
         * Builds and loads the groups table.
         */
        loadGroupTable: function(){
            var _this = this;
            var gridRestUrl = bootstrap.baseUrl + "security/group";
            var gridLayout = [{
                name: i18n("Group"),
                field: "name",
                orderField: "name",
                filterField: "name",
                filterType: "text",
                getRawValue: function(item) {
                    return item.name;
                }
            },{
                name: i18n("Authorization Realm"),
                formatter: function(item) {
                    return item.authorizationRealm.name;
                }
            }];

            this.groups = new TreeTable({
                url: gridRestUrl,
                serverSideProcessing: true,
                columns: gridLayout,
                tableConfigKey: "groupList",
                noDataMessage: i18n("No groups have been created yet."),
                rowsPerPage: 10,
                pageOptions: [5, 10, 15, 20, 25, 50, 75, 100],
                draggable: _this.canModify,
                selectable: _this.canModify,
                hideFooterLinks: true,
                hidePagination: false,
                hideExpandCollapse: true,
                allowHeaderLocking:false,
                onDisplayTable: function(){
                    domClass.add(this.domNode, "right-panel-groups");
                    if (_this.canModify){
                        this.dndContainer.copyOnly = true;
                        this.dndContainer.value = "group";
                        this.dndContainer.checkAcceptance = function(){
                            return false;
                        };
                    }
                },
                applyRowStyle: function(item, row) {
                    row.value = item;
                    domClass.add(row, "member-box-" + item.id);
                    on(row, mouse.enter, function(){
                        var relatedBoxes = query(".member-box-" + item.id);
                        array.forEach(relatedBoxes, function(box){
                            domClass.add(box, "hover");
                        });
                        on(row, mouse.leave, function(){
                            array.forEach(relatedBoxes, function(box){
                                domClass.remove(box, "hover");
                            });
                        });
                    });
                }
            });
            domConstruct.place(this.groups.domNode, this.contentAttach);
        },

        showMinimizeBubble: function(){
            // Do nothing by default.
        }
    });
});

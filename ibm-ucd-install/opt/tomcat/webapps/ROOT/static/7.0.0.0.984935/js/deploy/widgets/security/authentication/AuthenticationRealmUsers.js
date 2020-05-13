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
define([
        "dijit/_Widget",
        "dijit/_TemplatedMixin",
        "dijit/form/Button",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/on",
        "deploy/widgets/security/EditUser",
        "deploy/widgets/security/SetUserPassword",
        "js/webext/widgets/Alert",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/table/TreeTable",
        "deploy/widgets/security/team/UserRoleManager"
        ],

function(
        _Widget,
        _TemplatedMixin,
        Button,
        declare,
        xhr,
        domClass,
        domConstruct,
        on,
        EditUser,
        SetUserPassword,
        Alert,
        ColumnForm,
        Dialog,
        GenericConfirm,
        Table,
        UserRoleManager
) {

/**
 *
 */
    return declare(
        [_Widget, _TemplatedMixin],
        {
            templateString: ' '+
                '<div class="userList">'+
                    '<div data-dojo-attach-point="buttonAttach"></div>'+
                    '<div data-dojo-attach-point="gridAttach"></div>'+
                '</div>',

            /**
             *
             */
            postCreate: function() {
                this.inherited(arguments);
                var self = this;

                var gridRestUrl = bootstrap.baseUrl + "security/authenticationRealm/" + this.authenticationRealm.id + "/users";
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
                    }
                },{
                    name: i18n("Last Logon Time"),
                    field: "lastLoginDate",
                    orderField:"lastLoginDate",
                    getRawValue: function(item) {
                        return item.lastLoginDate;
                    },
                    formatter: function(item){
                        return item.lastLoginDate && util.dateFormatShort(item.lastLoginDate);
                    }
                },{
                    name: i18n("Actions"),
                    formatter: this.actionsFormatter,
                    parentWidget: this
                }];

                this.grid = new Table({
                    url: gridRestUrl,
                    serverSideProcessing: false,
                    columns: gridLayout,
                    tableConfigKey: "authenticationRealmUserList",
                    noDataMessage: i18n("No users have been created yet."),
                    hideExpandCollapse: true,
                    hidePagination: false
                });
                this.grid.placeAt(this.gridAttach);

                var newUserButton;
                if (!this.authenticationRealm.readOnly) {
                    newUserButton = new Button({
                        label: i18n("Create User"),
                        showTitle: false,
                        onClick: function() {
                            self.showEditUserDialog();
                        }
                    });
                    domClass.add(newUserButton.domNode, "idxButtonSpecial");
                    newUserButton.placeAt(this.buttonAttach);
                }
                else {
                    newUserButton = new Button({
                        label: i18n("Import User"),
                        showTitle: false,
                        onClick: function() {
                            self.showImportUserDialog();
                        }
                    });
                    domClass.add(newUserButton.domNode, "idxButtonSpecial");
                    newUserButton.placeAt(this.buttonAttach);

                    var updateUsersButton = new Button({
                        label: i18n("Update Users"),
                        showTitle: false,
                        onClick: function() {
                            self.showUpdateUsersDialog();
                        }
                    });
                    updateUsersButton.placeAt(this.buttonAttach);
                }
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
            actionsFormatter: function(item) {
                var self = this.parentWidget;

                var result = document.createElement("div");

                var editLink = domConstruct.create("a", {
                    "className": "actionsLink linkPointer",
                    "innerHTML": i18n("Edit")
                }, result);
                on(editLink, "click", function() {
                    self.showEditUserDialog(item);
                });

                var teamsLink = domConstruct.create("a", {
                    "className": "actionsLink linkPointer",
                    "innerHTML": i18n("View User Roles")
                }, result);
                on(teamsLink, "click", function() {
                    self.showUserRoles(item);
                });

                if (!self.authenticationRealm.readOnly) {
                    var passwordLink = domConstruct.create("a", {
                        "className": "actionsLink linkPointer",
                        "innerHTML": i18n("Reset Password")
                    }, result);
                    on(passwordLink, "click", function() {
                        self.showSetUserPasswordDialog(item);
                    });
                }
                if (item.isDeletable) {
                    var removeLink = domConstruct.create("a", {
                        "className": "actionsLink linkPointer",
                        "innerHTML": i18n("Remove")
                    }, result);
                    on(removeLink, "click", function() {
                        self.confirmRemoval(item);
                    });
                }

                if (item.isLockedOut) {
                    var unlockLink = domConstruct.create("a", {
                        "innerHTML": i18n("Unlock User"),
                        "class": "linkPointer actionsLink"
                    }, result);
                    on(unlockLink, "click", function() {
                        self.confirmUnlock(item);
                    });
                }

                return result;
            },

            /*
             *
             */
            confirmUnlock: function(item) {
                var self = this;

                var confirm = new GenericConfirm({
                    message: i18n("Are you sure you want to unlock user '%s'?", item.name.escape()),
                    action: function() {
                        xhr.put({
                            url: bootstrap.baseUrl+"security/user/"+item.id+"/unlock",
                            load: function() {
                                self.grid.refresh();
                            },
                            error: function(data) {
                                var errorAlert = new Alert({
                                    message: util.escape(data.responseText)
                                });
                            }
                        });
                    }
                });
            },

            confirmRemoval: function(item) {
                var self = this;

                var message = i18n("Are you sure you want to delete user '%s'? "+
                        "This will remove the user from any groups and roles. "+
                        "This user may be re-added if this authentication realm is configured to create users automatically.",
                        item.name.escape());
                var messageBox = '<div style="width: 500px;">' + message + '</div>';

                var confirm = new GenericConfirm({
                    message: messageBox,
                    forceRawMessages: true,
                    action: function() {
                        xhr.del({
                            url: bootstrap.baseUrl + "security/user/" + item.id,
                            load: function() {
                                self.grid.refresh();
                            },
                            error: function(data) {
                                var errorAlert = new Alert({
                                    message: util.escape(data.responseText)
                                });
                            }
                        });
                    }
                });
            },

            /**
             *
             */
            showSetUserPasswordDialog: function(item) {
                var self = this;

                var setUserPasswordDialog = new Dialog({
                    title: i18n("Reset User Password: %s", util.escape(item.name)),
                    closable: true,
                    draggable: true
                });

                var setUserPasswordForm = new SetUserPassword({
                    user: item,
                    callback: function(refresh) {
                        setUserPasswordDialog.hide();
                        setUserPasswordDialog.destroy();
                    }
                });
                setUserPasswordForm.placeAt(setUserPasswordDialog.containerNode);
                setUserPasswordDialog.show();
            },

            /**
             *
             */
            showEditUserDialog: function(item) {
                var self = this;

                var title = i18n("Create User");
                if (item) {
                    title = i18n("Edit User: %s", util.escape(item.name));
                }
                var editUserDialog = new Dialog({
                    title: title,
                    closable: true,
                    draggable: true
                });

                var editUserForm = new EditUser({
                    realmId: self.authenticationRealm.id,
                    readOnlyRealm: self.authenticationRealm.readOnly,
                    user: item,
                    importOnly: self.authenticationRealm.readOnly,
                    callback: function(refresh) {
                        editUserDialog.hide();
                        editUserDialog.destroy();
                        if (refresh) {
                            self.grid.refresh();
                        }
                    }
                });
                editUserForm.placeAt(editUserDialog.containerNode);
                editUserDialog.show();
            },

            showUserRoles: function(item) {
                var userRolesDialog = new Dialog({
                    title: i18n("Current Roles for %s", item.displayName),
                    closable: true,
                    draggable: true
                });

                var userRoleManager = new UserRoleManager({
                    userFiltering:false,
                    userData:item
                });
                userRoleManager.placeAt(userRolesDialog);

                var buttonsDiv = domConstruct.create("div", {
                    className: "underField",
                    style: {
                        display: "inline-block"
                    }
                }, userRolesDialog.containerNode);
                var closeButton = new Button({
                    label: i18n("Close"),
                    onClick: function() {
                        userRolesDialog.destroy();
                    }
                });
                closeButton.placeAt(buttonsDiv);

                userRolesDialog.show();
            },

            /**
             *
             */
            showImportUserDialog: function() {
                var self = this;

                var importUserDialog = new Dialog({
                    title: i18n("Import Users"),
                    closable: true,
                    draggable: true
                });

                var importUserForm = new ColumnForm({
                    onSubmit: function(data) {
                        xhr.put({
                            url: bootstrap.baseUrl+"security/authenticationRealm/"+self.authenticationRealm.id+"/importUsers/"+util.encodeIgnoringSlash(data.name),
                            handleAs: "json",
                            load: function(data) {
                                var successAlert = new Alert({
                                    title: i18n("User Import"),
                                    message: i18n("Imported %s users using pattern %s",
                                        data.importedUsers.length,
                                        data.namePattern)
                                });
                                importUserDialog.hide();
                                importUserDialog.destroy();
                                self.grid.refresh();
                            },
                            error: function(data) {
                                var errorAlert = new Alert({
                                    message: i18n("Error importing users: %s", util.escape(data.responseText))
                                });

                                importUserDialog.hide();
                                importUserDialog.destroy();
                            },
                            saveLabel: i18n("Import")
                        });
                    },
                    onCancel: function() {
                        importUserDialog.hide();
                        importUserDialog.destroy();
                    }
                });

                importUserForm.addField({
                    name: "nameLabel",
                    label: "",
                    type: "Label",
                    value: i18n("Enter a name or name pattern to search for. * can be used as a wildcard. (* alone will import all users)")
                });

                importUserForm.addField({
                    name: "name",
                    type: "Text",
                    label: i18n("Username or Pattern"),
                    required: true
                });

                importUserForm.placeAt(importUserDialog.containerNode);
                importUserDialog.show();
            },

            /**
             *
             */
            showUpdateUsersDialog: function() {
                var self = this;

                var title = i18n("Update All Users");
                var updateUsersDialog = new Dialog({
                    title: title,
                    closable: true,
                    draggable: true
                });

                var updateUsersForm = new ColumnForm({
                    submitUrl: bootstrap.baseUrl+"security/authenticationRealm/" + self.authenticationRealm.id + "/updateUsers",
                    submitMethod: "PUT",
                    addData: function(data) {
                        data.authenticationRealmId = self.authenticationRealm.id;
                    },
                    saveLabel: i18n("Submit"),
                    postSubmit: function() {
                        updateUsersDialog.hide();
                        updateUsersDialog.destroy();
                        self.grid.refresh();
                    },
                    onCancel: function() {
                        updateUsersDialog.hide();
                        updateUsersDialog.destroy();
                    }
                });
                updateUsersForm.addField({
                    name: "label",
                    label: i18n("Confirm"),
                    type: "Label",
                    value: i18n("Are you sure you want to update all users from this realm?")
                });
                updateUsersForm.placeAt(updateUsersDialog.containerNode);
                updateUsersDialog.show();
            }
        }
    );
});

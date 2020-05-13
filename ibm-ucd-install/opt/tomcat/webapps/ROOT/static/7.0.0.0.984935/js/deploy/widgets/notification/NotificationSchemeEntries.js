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
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/on",
        "deploy/widgets/notification/EditNotificationEntry",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        declare,
        xhr,
        domClass,
        domConstruct,
        on,
        EditNotificationEntry,
        Dialog,
        GenericConfirm,
        Table
) {
    /**
     *
     */
    return declare('deploy.widgets.notification.NotificationSchemeEntries',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="notificationSchemeList">' +
                '<div class="listTopButtons" data-dojo-attach-point="buttonAttach"></div>' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            var canManageNotificationSchemes = config.data.permissions[security.system.manageNotificationSchemes];
            if (canManageNotificationSchemes) {
                var gridRestUrl = bootstrap.restUrl+"notification/notificationScheme/"+this.notificationScheme.id+"/entries";
                var gridLayout = [{
                    name: i18n("Type"),
                    formatter: this.typeFormatter
                },{
                    name: i18n("Role"),
                    formatter: this.roleFormatter
                },{
                    name: i18n("Template"),
                    field: "templateName"
                },{
                    name: i18n("Actions"),
                    formatter: this.actionsFormatter,
                    parentWidget: this
                }];

                this.grid = new Table({
                    url: gridRestUrl,
                    serverSideProcessing: false,
                    columns: gridLayout,
                    tableConfigKey: "notificationEntryList",
                    noDataMessage: i18n("This scheme has no notification entries."),
                    hideExpandCollapse: true,
                    hidePagination: false
                });
                this.grid.placeAt(this.gridAttach);

                var newEntryButton = new Button({
                    label: i18n("Add Notification Entry"),
                    showTitle: false,
                    onClick: function() {
                        self.showNewEntryDialog();
                    }
                });
                domClass.add(newEntryButton.domNode, "idxButtonSpecial");
                newEntryButton.placeAt(this.buttonAttach);
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
        typeFormatter: function(item) {
            var result = "";
            switch (item.type) {
                case "PROCESS_SUCCESS":
                    result = i18n("Process Success");
                    break;
                case "PROCESS_FAILURE":
                    result = i18n("Process Failure");
                    break;
                case "PROCESS_STARTED":
                    result = i18n("Process Started");
                    break;
                case "APPROVAL_COMPLETED":
                    result = i18n("Approval Completed");
                    break;
                case "APPROVAL_FAILED":
                    result = i18n("Approval Failed");
                    break;
            }
            return result;
        },

        /**
         *
         */
        actionsFormatter: function(item) {
            var self = this.parentWidget;

            var result = document.createElement("div");

            var editLink = domConstruct.create("a", {
                    "class": "actionsLink linkPointer",
                    "innerHTML": i18n("Edit")
                }, result);
            on(editLink, "click", function() {
                self.showEditEntryDialog(item);
            });

            var deleteLink = domConstruct.create("a", {
                    "class": "actionsLink linkPointer",
                    "innerHTML": i18n("Delete")
                }, result);
            on(deleteLink, "click", function() {
                self.confirmDeletion(item);
            });

            return result;
        },

        /**
         *
         */
        roleFormatter: function(item) {
            var resourceType = item.resourceTypeName;
            var roleName = item.roleName;
            var resourceRoleName = item.resourceRoleName;
            var result;

            if (!resourceType) {
                resourceType = i18n("Unknown");
            }
            if (!roleName) {
                roleName = i18n("Unknown");
            }
            if (resourceRoleName) {
                result = i18n("%s (%s) / %s", resourceType, resourceRoleName, roleName);
            } else {
                result = i18n("%s / %s", resourceType, roleName);
            }
            return result;
        },

        /**
         *
         */
        showNewEntryDialog: function() {
            var self = this;

            var newEntryDialog = new Dialog({
                title: i18n("Add Notification Entry"),
                closable: true,
                draggable: true
            });

            var newEntryForm = new EditNotificationEntry({
                notificationScheme: self.notificationScheme,
                roleOptions: self.roleOptions,
                callback: function() {
                    newEntryDialog.hide();
                    newEntryDialog.destroy();
                    self.grid.refresh();
                }
            });
            newEntryForm.placeAt(newEntryDialog.containerNode);
            newEntryDialog.show();
        },

        /**
         *
         */
        showEditEntryDialog: function(notificationEntry) {
            var self = this;

            var editEntryDialog = new Dialog({
                title: i18n("Edit Notification Entry"),
                closable: true,
                draggable: true
            });

            var editEntryForm = new EditNotificationEntry({
                notificationEntry: notificationEntry,
                roleOptions: self.roleOptions,
                callback: function() {
                    editEntryDialog.hide();
                    editEntryDialog.destroy();
                    self.grid.refresh();
                }
            });
            editEntryForm.placeAt(editEntryDialog.containerNode);
            editEntryDialog.show();
        },

        /**
         *
         */
        confirmDeletion: function(notificationEntry) {
            var self = this;
            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to delete this notification entry?"),
                action: function() {
                    self.grid.block();
                    xhr.del({
                        url: bootstrap.restUrl+"notification/notificationEntry/"+notificationEntry.id,
                        handleAs: "json",
                        load: function(data) {
                            self.grid.unblock();
                            self.grid.refresh();
                        }
                    });
                }
            });
        }
    });
});

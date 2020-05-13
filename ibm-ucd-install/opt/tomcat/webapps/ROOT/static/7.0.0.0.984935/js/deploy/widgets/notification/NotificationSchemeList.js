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
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/on",
        "deploy/widgets/notification/EditNotificationScheme",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/Alert",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        declare,
        xhr,
        domConstruct,
        domClass,
        on,
        EditNotificationScheme,
        Dialog,
        Alert,
        GenericConfirm,
        Table
) {
    /**
     *
     */
    return declare('deploy.widgets.notification.NotificationSchemeList',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="notificationSchemeList">' +
                '<div class="listTopButtons" data-dojo-attach-point="buttonTopAttach"></div>' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',
        defaultNotificationSchemeID: '00000000-0000-0000-0000-000000000000',
        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            var gridRestUrl = bootstrap.restUrl+"notification/notificationScheme";
            var gridLayout = [{
                name: i18n("Notification Scheme"),
                formatter: this.notificationSchemeFormatter
            },{
                name: i18n("Description"),
                field: "description"
            },{
                name: i18n("Actions"),
                formatter: this.actionsFormatter,
                parentWidget: this
            }];

            this.grid = new Table({
                url: gridRestUrl,
                serverSideProcessing: false,
                columns: gridLayout,
                tableConfigKey: "notificationSchemeList",
                noDataMessage: i18n("No notification schemes have been created yet."),
                hideExpandCollapse: true,
                hidePagination: false
            });
            this.grid.placeAt(this.gridAttach);

            var canManageNotificationSchemes = config.data.permissions[security.system.manageNotificationSchemes];
            if (canManageNotificationSchemes) {
                var newNotificationSchemeButton = {
                    label: i18n("Create Notification Scheme"),
                    showTitle: false,
                    onClick: function() {
                        self.showNewNotificationSchemeDialog({});
                    }
                };

                var topButton = new Button(newNotificationSchemeButton);
                domClass.add(topButton.domNode, "idxButtonSpecial");
                topButton.placeAt(this.buttonTopAttach);
            }
        },

        actionsFormatter: function(item) {
            var self = this.parentWidget;

            var result = document.createElement("div");
            var canManageNotificationSchemes = config.data.permissions[security.system.manageNotificationSchemes];
            if (canManageNotificationSchemes) {
                var editLink = domConstruct.create("a", {
                    "class": "actionsLink linkPointer",
                    "href": "/#notificationScheme/" + item.id,
                    "innerHTML": i18n("Edit")
                }, result);

                if (item.id !== self.defaultNotificationSchemeID) {
                    var deleteLink = domConstruct.create("a", {
                        "class": "actionsLink linkPointer",
                        "innerHTML": i18n("Delete")
                    }, result);
                    on(deleteLink, "click", function() {
                        self.confirmDeletion(item);
                    });
                }
            }

            return result;
        },

        confirmDeletion: function(notificationScheme) {
            var self = this;
            var errorMsg;
            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to delete this notification scheme?"),
                action: function() {
                    self.grid.block();
                    xhr.del({
                        url: bootstrap.restUrl+"notification/notificationScheme/"+notificationScheme.id,
                        handleAs: "json",
                        load: function(data) {
                            self.grid.unblock();
                            self.grid.refresh();
                        },
                        error:function(error) {
                            self.grid.unblock();
                            errorMsg = error.responseText;
                        }
                    });
                },
                destroy: function() {
                    if (errorMsg) {
                        var errorAlert = new Alert({message: errorMsg});
                    }
                }
            });
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
        notificationSchemeFormatter: function(item) {
            var result = document.createElement("a");

            var canManageNotificationSchemes = config.data.permissions[security.system.manageNotificationSchemes];
            if (canManageNotificationSchemes) {
                result.href = "#notificationScheme/"+item.id;
            }
            else {
                result.style = "text-decoration:none;";
            }

            result.innerHTML = i18n(item.name.escape());
            return result;
        },

        /**
         *
         */
        showNewNotificationSchemeDialog: function() {
            var self = this;

            var newNotificationSchemeDialog = new Dialog({
                title: i18n("Create Notification Scheme"),
                closable: true,
                draggable: true
            });

            var newNotificationSchemeForm = new EditNotificationScheme({
                callback: function() {
                    newNotificationSchemeDialog.hide();
                    newNotificationSchemeDialog.destroy();
                }
            });
            newNotificationSchemeForm.placeAt(newNotificationSchemeDialog.containerNode);
            newNotificationSchemeDialog.show();
        }
    });
});

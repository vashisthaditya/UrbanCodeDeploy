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
        "deploy/widgets/security/authorization/EditGroup",
        "js/webext/widgets/Alert",
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
        EditGroup,
        Alert,
        Dialog,
        GenericConfirm,
        TreeTable
) {
    /**
     *
     */
    return declare('deploy.widgets.security.authorization.GroupList',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="groupList">'+
                '<div data-dojo-attach-point="buttonAttach"></div>'+
                '<div data-dojo-attach-point="gridAttach"></div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
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
            },{
                name: i18n("Actions"),
                formatter: this.actionsFormatter,
                parentWidget: this
            }];

            this.grid = new TreeTable({
                url: gridRestUrl,
                serverSideProcessing: true,
                hidePagination: false,
                hideExpandCollapse: true,
                columns: gridLayout,
                tableConfigKey: "groupList",
                noDataMessage: i18n("No groups have been created yet.")
            });
            this.grid.placeAt(this.gridAttach);

            var newGroupButton = new Button({
                label: i18n("Create Group"),
                showTitle: false,
                onClick: function() {
                    self.showEditGroupDialog();
                }
            });
            domClass.add(newGroupButton.domNode, "idxButtonSpecial");
            newGroupButton.placeAt(this.buttonAttach);
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
            
            if (item.authorizationRealm.authorizationModuleClassName === "com.urbancode.security.authorization.internal.InternalAuthorizationModule") {
                var editLink = domConstruct.create("a", {
                    "class": "actionsLink linkPointer",
                    "innerHTML": i18n("Edit")
                }, result);
                on(editLink, "click", function() {
                    self.showEditGroupDialog(item);
                });
            }
            
            if (self.showGroupMembers !== undefined) {
                var membersLink = domConstruct.create("a", {
                    "class": "actionsLink linkPointer",
                    "innerHTML": i18n("Members")
                }, result);
                on(membersLink, "click", function() {
                    self.showGroupMembers(item);
                });
            }
            
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
        confirmDeletion: function(item) {
            var self = this;
            
            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to delete group '%s'?", item.name.escape()),
                action: function() {
                    xhr.del({
                        url: bootstrap.baseUrl + "security/group/" + item.id,
                        load: function() {
                            self.grid.refresh();
                        },
                        error: function(data) {
                            var alertPopup = new Alert({
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
        showEditGroupDialog: function(item) {
            var self = this;
            
            var newGroupDialog = new Dialog({
                title: (!!item) ? i18n("Edit Group") : i18n("Create Group"),
                closable: true,
                draggable: true
            });
            
            var newGroupForm = new EditGroup({
                group: item,
                callback: function(refresh) {
                    newGroupDialog.hide();
                    newGroupDialog.destroy();
                    if (refresh) {
                        self.grid.refresh();
                    }
                }
            });
            newGroupForm.placeAt(newGroupDialog.containerNode);
            newGroupDialog.show();
        }
    });
});
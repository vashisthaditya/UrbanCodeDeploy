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
        "deploy/widgets/security/authorization/EditAuthorizationRealm",
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
        EditAuthorizationRealm,
        Alert,
        Dialog,
        GenericConfirm,
        TreeTable
) {
    /**
     *
     */
    return declare('deploy.widgets.security.authorization.AuthorizationRealmList',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="authorizationRealmList">'+
                '<div data-dojo-attach-point="buttonAttach"></div>'+
                '<div data-dojo-attach-point="gridAttach"></div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            var gridRestUrl = bootstrap.baseUrl + "security/authorizationRealm";
            var gridLayout = [{
                name: i18n("Authorization Realm"),
                formatter: function(item) {
                    return item.name;
                },
                orderField: "name",
                filterField: "name",
                filterType: "text",
                getRawValue: function(item) {
                    return item.name;
                }
            },{
                name: i18n("Description"),
                formatter: function(item) {
                    var result = item.description;
                    if (item.id === "20000000000000000000000000000000") {
                        result = i18n("Internal database storage.");
                    }
                    return result;
                },
                orderField: "description",
                filterField: "description",
                filterType: "text",
                getRawValue: function(item) {
                    return item.description;
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
                tableConfigKey: "authRealmList",
                noDataMessage: i18n("No authorization realms have been created yet.")
            });
            this.grid.placeAt(this.gridAttach);

            var newAuthorizationRealmButton = new Button({
                label: i18n("Create Authorization Realm"),
                showTitle: false,
                onClick: function() {
                    self.showEditAuthorizationRealmDialog();
                }
            });
            domClass.add(newAuthorizationRealmButton.domNode, "idxButtonSpecial");
            newAuthorizationRealmButton.placeAt(this.buttonAttach);
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
            
            if (item.id !== "20000000000000000000000000000000") {
                var editLink = domConstruct.create("a", {
                    "innerHTML": i18n("Edit"),
                    "class": "actionsLink linkPointer"
                }, result);
                on(editLink, "click", function() {
                    self.showEditAuthorizationRealmDialog(item);
                });

                var deleteLink = domConstruct.create("a", {
                    "innerHTML": i18n("Delete"),
                    "class": "actionsLink linkPointer"
                }, result);
                on(deleteLink, "click", function() {
                    self.confirmDeletion(item);
                });
            }
            return result;
        },

        /**
         * 
         */
        confirmDeletion: function(item) {
            var self = this;
            
            var confirm = new GenericConfirm({
                message: i18n("This will delete all groups associated with this authorization realm. Are you sure you want to delete authorization realm '%s'?", item.name.escape()),
                action: function() {
                    xhr.del({
                        url: bootstrap.baseUrl + "security/authorizationRealm/" + item.id,
                        load: function() {
                            self.grid.refresh();
                        },
                        error: function(data) {
                            var deleteError = new Alert({
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
        showEditAuthorizationRealmDialog: function(item) {
            var self = this;
            
            var newAuthorizationRealmDialog = new Dialog({
                title: i18n("Create Authorization Realm"),
                closable: true,
                draggable: true
            });
            
            var newAuthorizationRealmForm = new EditAuthorizationRealm({
                authorizationRealm: item,
                callback: function(refresh) {
                    newAuthorizationRealmDialog.hide();
                    newAuthorizationRealmDialog.destroy();
                    if (refresh) {
                        self.grid.refresh();
                    }
                }
            });
            newAuthorizationRealmForm.placeAt(newAuthorizationRealmDialog.containerNode);
            newAuthorizationRealmDialog.show();
        }
    });
});
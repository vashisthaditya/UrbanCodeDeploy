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
        "deploy/widgets/security/authentication/EditAuthToken",
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
        EditAuthToken,
        Alert,
        Dialog,
        GenericConfirm,
        Table
) {
    /**
     *
     */
    return declare('deploy.widgets.security.authentication.AuthTokens',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="AuthTokens">' +
                '<div class="listTopButtons" data-dojo-attach-point="buttonTopAttach"></div>' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            var gridRestUrl = bootstrap.baseUrl+"security/authtoken/table";
            var gridLayout = [{
                name: i18n("Description"),
                field: "description",
                filterField: "description",
                filterType: "text",
                getRawValue: function(item) {
                    return item.description;
                }
            },{
                name: i18n("User"),
                field: "userName",
                filterField: "user.name",
                filterType: "text",
                getRawValue: function(item) {
                    return item.userName;
                }
            },{
                name: i18n("Creation Date"),
                field: "createdDate",
                filterField: "dateCreated",
                filterType: "date",
                filterClass: "Long",
                getRawValue: function(item) {
                    return item.createdDate;
                },
                orderField: "dateCreated",
                formatter: self.tableDateFormatter
            },{
                name: i18n("Expiration Date"),
                field: "expiration",
                filterField: "expiration",
                filterType: "date",
                filterClass: "Long",
                getRawValue: function(item) {
                    return new Date(item.expiration);
                },
                orderField: "expiration",
                formatter: self.tableDateFormatter
            },{
                name: i18n("Allowed IPs"),
                formatter: function(item) {
                    var result = item.host || '0.0.0.0/0';

                    if (result.indexOf("/") === -1) {
                        result += "/32";
                    }

                    return result;
                }
            },{
                name: i18n("Actions"),
                formatter: this.actionsFormatter,
                parentWidget: this
            }];

            this.grid = new Table({
                url: gridRestUrl,
                serverSideProcessing: true,
                hidePagination: false,
                tableConfigKey: "authTokenList",
                noDataMessage: i18n("No authentication tokens found."),
                columns: gridLayout,
                orderField: "expiration"
            });
            this.grid.placeAt(this.gridAttach);

            var newTokenButton = {
                label: i18n("Create Token"),
                showTitle: false,
                onClick: function() {
                    self.showNewTokenDialog();
                }
            };

            var topButton = new Button(newTokenButton);
            domClass.add(topButton.domNode, "idxButtonSpecial");
            topButton.placeAt(this.buttonTopAttach);
        },

        tableDateFormatter: function(item, arg) {
            var result = util.tableDateFormatter(item, arg);
            if (result === null || result === undefined) {
                result = i18n("Never");
            }
            return result;
        },

        /**
         *
         */
        destroy: function() {
            this.inherited(arguments);
            this.grid.destroy();
        },

        showNewTokenDialog: function() {
            var self = this;

            var newTokenDialog = new Dialog({
                title: i18n("Create Token"),
                closable: true,
                draggable: true
            });

            var newTokenForm = new EditAuthToken({
                callback: function(data) {
                    newTokenDialog.hide();
                    newTokenDialog.destroy();
                    var createdTokenDialog = new Dialog({
                        title: i18n("Newly Created Token"),
                        closable: true,
                        draggable: true
                    });
                    var buttonContainer = document.createElement("div");
                    buttonContainer.className = "underField";
                    var closeButton = new Button({
                        label: i18n("Close"),
                        onClick: function() {
                            createdTokenDialog.hide();
                            createdTokenDialog.destroy();
                        }
                    });
                    var message = domConstruct.create("div", {
                        innerHTML: i18n("You will not be able to see this again."),
                        "class": "authTokenCreateMessage"
                    }, createdTokenDialog.containerNode);
                    var content = domConstruct.create("div", {
                        innerHTML: i18n("Token: %s", data.token)
                    }, createdTokenDialog.containerNode);
                    closeButton.placeAt(buttonContainer);
                    createdTokenDialog.containerNode.appendChild(buttonContainer);
                    createdTokenDialog.show();
                    self.grid.refresh();
                }
            });
            newTokenForm.placeAt(newTokenDialog.containerNode);
            newTokenDialog.show();
        },

        actionsFormatter: function(item) {
            var self = this.parentWidget;

            var result = document.createElement("div");

            var deleteLink = domConstruct.create("a", {
                "class": "actionsLink linkPointer",
                "innerHTML": i18n("Delete")
            }, result);
            on(deleteLink, "click", function() {
                self.confirmDelete(item);
            });

            return result;
        },

        confirmDelete: function(target) {
            var self = this;

            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to delete this authorization token? " +
                        "This will permanently delete it from the system."),
                action: function() {
                    self.grid.block();
                    xhr.del({
                        url: bootstrap.baseUrl+"security/authtoken/"+target.id,
                        handleAs: "json",
                        load: function(data) {
                            self.grid.unblock();
                            self.grid.refresh();
                        },
                        error: function(error) {
                            var alert = new Alert({
                                messages: [i18n("Error deleting authorization token:"),
                                           "",
                                           util.escape(error.responseText)]
                            });
                            self.grid.unblock();
                        }
                    });
                }
            });
        }
    });
});

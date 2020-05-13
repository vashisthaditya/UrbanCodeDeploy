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
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dijit/form/Button",
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/dom-geometry",
        "dojo/on",
        "deploy/widgets/security/token/EditAuthTokenRestriction",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/Alert",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/form/MenuButton",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        array,
        declare,
        xhr,
        domClass,
        domConstruct,
        domGeom,
        on,
        EditAuthTokenRestriction,
        Dialog,
        Alert,
        GenericConfirm,
        MenuButton,
        Table
) {
    return declare('deploy.widgets.security.token.AuthTokenUrlList',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="tokenUrlList">' +
                '<div class="listTopButtons" data-dojo-attach-point="buttonTopAttach"></div>' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            var gridRestUrl = bootstrap.baseUrl+'security/authTokenRestriction';
            var gridLayout = [{
                name: i18n("Name"),
                field:"name",
                orderField: "name",
                filterField: "name",
                filterType: "text",
                getRawValue: function(item) {
                    return item.name;
                },
                formatter: function(item, value, cell) {
                    var result = domConstruct.create("div", {
                        "class": "inlineBlock",
                        "style": "margin-" + (domGeom.isBodyLtr()?"right":"left") + ":78px;"
                    });

                    var nameDiv = domConstruct.create("div");
                    nameDiv.innerHTML = i18n(util.escape(item.name));

                    domConstruct.place(nameDiv, result);
                    domConstruct.place(self.actionsFormatter(item), result);
                    return result;
                }
            },{
                name: i18n("Description"),
                field: "description",
                formatter: function(item, value, cell) {
                    var result = domConstruct.create("div");
                    result.innerHTML = i18n(util.escape(item.description));
                    return result;
                }
            }];

            this.grid = new Table({
                url: gridRestUrl,
                serverSideProcessing: true,
                hideExpandCollapse: true,
                hidePagination: false,
                orderField: "name",
                noDataMessage: i18n("No auth token restrictions found"),
                tableConfigKey: "authTokenRestrictionList",
                columns: gridLayout
            });
            this.grid.placeAt(this.gridAttach);

            if (config.data.permissions[security.system.manageAuthTokenRestrictions]) {
                this.attachCreateButton();
            }

        },

        /**
         *
         */
        attachCreateButton: function() {
            var self = this;
            var newListButton = {
                label: i18n("Create Auth Token Restriction"),
                showTitle: false,
                onClick: function() {
                    self.showEditUrlListDialog();
                }
            };

            var topButton = new Button(newListButton);
            domClass.add(topButton.domNode, "idxButtonSpecial");
            topButton.placeAt(this.buttonTopAttach);
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
        showEditUrlListDialog: function(item, isCopy) {
            var self = this;
            var dialog = new Dialog({
                "title": i18n("Create Auth Token Restriction"),
                "closable":true,
                "draggable":true,
                style: {
                    width: "650px"
                }
            });
            var editform = new EditAuthTokenRestriction({
                authTokenRestriction: item,
                isCopy: isCopy,
                callback: function() {
                    dialog.hide();
                    dialog.destroy();
                    self.grid.refresh();
                }
            });
            editform.placeAt(dialog);
            dialog.show();
        },

        /**
         *
         */
        confirmDelete: function(target) {
            var self = this;
            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to delete %s?", target.name),
                action: function() {
                    self.grid.block();
                    xhr.del({
                        url: bootstrap.baseUrl+"security/authTokenRestriction/"+target.id,
                        handleAs: "json",
                        load: function(data) {
                            self.grid.unblock();
                            self.grid.refresh();
                        },
                        error: function(error) {
                            var alert = new Alert({
                                message: error.responseText
                            });
                            self.grid.unblock();
                        }
                    });
                }
            });
        },

        /**
        *
        */
       actionsFormatter: function(item) {
           var self = this;

           var result = domConstruct.create("div", {
               "dir": util.getUIDir(),
               "align": util.getUIDirAlign(),
               "class": "tableHoverActions"
           });

           var menuActions = [];
           var canManage = config.data.permissions[security.system.manageAuthTokenRestrictions];
           var isDeletable = config.data.systemConfiguration.defaultAuthTokenRestriction !== item.id;

           if (canManage) {
               array.forEach(self.getRowWriteActions(item), function(action) {
                   menuActions.push(action);
               });
           }

           if(canManage && isDeletable) {
               array.forEach(self.getDeleteAction(item), function(action) {
                   menuActions.push(action);
               });
           }

           if (menuActions.length) {
               var actionsButton = new MenuButton({
                   options: menuActions,
                   label: i18n("Actions...")
               });
               actionsButton.placeAt(result);
           }

           return result;
       },

       /**
        * Returns the options for the Actions select on row hover that need
        * write permission.
        */
       getRowWriteActions: function(item) {
           var self = this;
           return [{
               label: i18n("Copy"),
               onClick: function() {
                   var itemClone = util.clone(item);
                   itemClone.name = "";
                   self.showEditUrlListDialog(itemClone, true);
               }
           },{
               label: i18n("Edit"),
               onClick: function() {
                   self.showEditUrlListDialog(item);
               }
           }];
       },

       /**
        * Returns the options for the Actions select on row hover that need
        * write permission.
        */
       getDeleteAction: function(item) {
           var self = this;
           return [{
               label: i18n("Delete"),
               onClick: function() {
                   self.confirmDelete(item);
               }
           }];
       }
    });
});
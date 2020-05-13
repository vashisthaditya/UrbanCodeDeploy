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
        "dijit/form/CheckBox",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/dom-class",
        "dojo/dom-geometry",
        "dojo/dom-construct",
        "dojo/on",
        "deploy/widgets/Formatters",
        "js/webext/widgets/Alert",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/form/MenuButton",
        "dojox/html/entities",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        CheckBox,
        declare,
        xhr,
        domClass,
        domGeom,
        domConstruct,
        on,
        Formatters,
        Alert,
        Dialog,
        GenericConfirm,
        MenuButton,
        entities,
        TreeTable
) {
    /**
     *
     */
    return declare('deploy.widgets.agentPool.AgentPoolList',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="agentPoolList">'+
                '<div class="listTopButtons" data-dojo-attach-point="buttonTopAttach"></div>' +
                '<div data-dojo-attach-point="tableAttach"></div>'+
                '<div data-dojo-attach-point="activeBoxAttach" style="margin: 2px;"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            var gridRestUrl = bootstrap.restUrl+"apikey/";
            var gridLayout = [{
                    name: i18n("API Key"),
                    field: "apiKey",
                    orderField: "apiKey",
                    filterField: "apiKey",
                    filterType: "text",
                    formatter: self.nameWithActionsFormatter,
                    parentWidget: self
                },{
                    name: i18n("User"),
                    field: "user.name",
                    filterField: 'user.name',
                    orderField: 'user.name',
                    filterType: 'text'
                },{
                    name: i18n("Date Created"),
                    formatter: util.tableDateFormatter,
                    field: "dateCreated",
                    orderField: "dateCreated"
                },{
                    name: i18n("Expiration "),
                    formatter: function(row, result, cell) {
                        if (result < 1) {
                            return i18n("NEVER");
                        }
                        return util.tableDateFormatter(row, result, cell);
                    },
                    field: "expiration",
                    orderField: "expiration"
                }];

            this.grid = new TreeTable({
                url: gridRestUrl,
                orderField: "apiKey",
                sortType: "asc",
                noDataMessage: i18n("No API Keys have been added yet."),
                tableConfigKey: "apiKeyTableConfig",
                columns: gridLayout,
                serverSideProcessing: true,
                hidePagination: false,
                hideExpandCollapse: true,
                queryData: {outputType: ["BASIC"]}
            });
            this.grid.placeAt(this.tableAttach);
        },

        nameWithActionsFormatter: function (row, value, cell) {
            var self = this.parentWidget;
            cell.style.position = "relative";
            var result = domConstruct.create("div", {
                "class": "inlineBlock",
                "style": "margin-" + (domGeom.isBodyLtr()?"right":"left") + ":78px;"
            });
            var itemWrapper = domConstruct.create("div", {
                "class": "inlineBlock"
            });
            domConstruct.place(itemWrapper, result);
            var nameDiv = domConstruct.create("div", { "class" : "inlineBlock"});
            nameDiv.innerHTML = value.escape();
            domConstruct.place(nameDiv, itemWrapper);
            domConstruct.place(self.actionsFormatter(row), result);
            return result;
        },

        actionsFormatter: function(item) {
                var self = this;

                var result = domConstruct.create("div", {
                    "dir": util.getUIDir(),
                    "align": util.getUIDirAlign(),
                    "class": "tableHoverActions"
                });

                var menuActions = [];

                menuActions.push(self.getRevokeAction(item));

                if (menuActions.length) {
                    var actionsButton = new MenuButton({
                        options: menuActions,
                        label: i18n("Actions...")
                    });
                    actionsButton.placeAt(result);
                }

                return result;
        },

        getRevokeAction: function(item) {
            var self = this;
            return {
                label: i18n("Revoke"),
                onClick: function() {
                    self.confirmRevoke(item);
                }
            };
        },

        /**
         *
         */
        confirmRevoke: function(target) {
            var self = this;

            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to revoke %s? " +
                        "This will permanently remove it from the system.", target.apiKey.escape()),
                action: function() {
                    self.grid.block();
                    xhr.del({
                        url: bootstrap.restUrl+"apikey/"+target.apiKey,
                        handleAs: "json",
                        load: function(data) {
                            self.grid.unblock();
                            self.grid.refresh();
                        },
                        error: function(error) {
                            var alert = new Alert({
                                messages: [i18n("Error revoking Keys"),
                                           "",
                                           util.escape(error.responseText)]
                            });
                            alert.startup();
                            self.grid.unblock();
                        }
                    });
                }
            });
        }
    });
});

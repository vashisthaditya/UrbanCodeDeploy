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
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/dom-geometry",
        "dojo/on",
        "deploy/widgets/Formatters",
        "js/webext/widgets/Alert",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/form/MenuButton",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        array,
        declare,
        xhr,
        domClass,
        domConstruct,
        domGeom,
        on,
        Formatters,
        Alert,
        Dialog,
        GenericConfirm,
        MenuButton,
        Table
) {
    /**
     *
     */
    return declare('deploy.widgets.network.ConnectedServerList',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="connectedServerList" id="connectedServerListContainer">'+
                '<div data-dojo-attach-point="connectedServerList" id="connectedServerListTable"></div>'+
            '</div>',

        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            var gridRestUrl = bootstrap.restUrl + "server"; // update
            var gridLayout = [{
                    name: i18n("Server Id"),
                    formatter: function(item, value, cell) {
                        var result = domConstruct.create("div", {
                            "class": "inlineBlock",
                            "style": "margin-" + (domGeom.isBodyLtr()?"right":"left") + ":78px;"
                        });

                        var nameDiv = domConstruct.create("div");
                        nameDiv.innerHTML = i18n(util.escape(item.serverId));

                        domConstruct.place(nameDiv, result);
                        domConstruct.place(self.actionsFormatter(item), result);
                        return result;
                    }
                },{
                    name: i18n("Date Created"),
                    field: "createdDate",
                    formatter: util.tableDateFormatter,
                    getRawValue: function(item) {
                        return new Date(item.createdDate);
                    }
                },{
                    name: i18n("Last Modified"),
                    field: "modifiedDate",
                    formatter: util.tableDateFormatter,
                    getRawValue: function(item) {
                        return new Date(item.modifiedDate);
                    }
                },{
                    name: i18n("Host"),
                    field: "host"
                },{
                    name: i18n("Port"),
                    field: "port"
                },{
                    name: i18n("Server Public Key Fingerprint"),
                    field: "serverPublicKeyFingerprint"
                },{
                    name: i18n("Client Public Key Fingerprint"),
                    field: "clientPublicKeyFingerprint"
                }];

            this.grid = new Table({
                url: gridRestUrl,
                serverSideProcessing: false,
                noDataMessage: i18n("No servers have have been connected to the server cluster yet."),
                tableConfigKey: "connectedServerList",
                columns: gridLayout,
                hidePagination: true,
                hideExpandCollapse: true
            });
            this.grid.placeAt(this.connectedServerList);

        },

        statusFormatter: function(item, value, cell) {
            var resultDiv = document.createElement("div");
            resultDiv.style.textAlign = "center";
            if (item.active) {
                resultDiv.innerHTML = i18n("Active");
                domClass.add(cell, "success-state-color");
            }
            else {
                resultDiv.innerHTML = i18n("Inactive");
                domClass.add(cell, "failed-state-color");
            }
            return resultDiv;
        },

        actionsFormatter: function(item) {
            var self = this;

            var result = domConstruct.create("div", {
                "dir": util.getUIDir(),
                "align": util.getUIDirAlign(),
                "class": "tableHoverActions"
            });

            var menuActions = [];

            if (config.data.permissions[security.system.editNetworkSettings]) {
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

        getDeleteAction: function(item) {
            var self = this;
            return [{
                label: i18n("Delete"),
                onClick: function() {
                    self.confirmDelete(item);
                }
            }];
        },

        confirmDelete: function(target) {
            var self = this;
            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to delete %s?", target.serverId),
                action: function() {
                    self.grid.block();
                    xhr.del({
                        url: bootstrap.restUrl+"server/"+target.serverId,
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
        }
    });
});
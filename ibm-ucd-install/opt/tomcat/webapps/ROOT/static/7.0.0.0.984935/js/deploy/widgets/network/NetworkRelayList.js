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
        "deploy/widgets/Formatters",
        "deploy/widgets/network/EditNetworkRelay",
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
        Formatters,
        EditNetworkRelay,
        Dialog,
        GenericConfirm,
        Table
) {
    /**
     *
     */
    return declare('deploy.widgets.network.NetworkRelayList',  [_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="networkRelayList">'+
                '<div class="listTopButtons" data-dojo-attach-point="buttonTopAttach"></div>' +
                '<div data-dojo-attach-point="networkRelayList"></div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            var gridRestUrl = bootstrap.restUrl + "network/networkRelay";
            var gridLayout = [{
                    name: i18n("Name"),
                    formatter: function(item) {
                        return item.name;
                    },
                    orderField: "name",
                    filterField: "name",
                    filterType: "text"
                },{
                    name: i18n("Active"),
                    formatter: this.statusFormatter
                },{
                    name: i18n("Host"),
                    field: "host"
                },{
                    name: i18n("Port"),
                    field: "port"
                },{
                    name: i18n("Actions"),
                    formatter: this.actionsFormatter.bind(this),
                    parentWidget: this
                }];

            this.grid = new Table({
                url: gridRestUrl,
                serverSideProcessing: false,
                noDataMessage: i18n("No servers have have been connected to the server cluster yet."),
                tableConfigKey: "networkRelayList",
                columns: gridLayout,
                hideExpandCollapse: true,
                hidePagination: false
            });
            this.grid.placeAt(this.networkRelayList);

            if (self.hasEditNetworkPermission()) {
                var newNetworkRelayButton = {
                    label: i18n("Add Server To Server Cluster"),
                    showTitle: false,
                    onClick: function() {
                        self.showNewNetworkRelayDialog();
                    }
                };
                var networkButton = new Button(newNetworkRelayButton);
                domClass.add(networkButton.domNode, "idxButtonSpecial");
                networkButton.placeAt(this.buttonTopAttach);
            }

            
        },

        /**
         * 
         */
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

        /**
         *
         */
        actionsFormatter: function(item) {
            var self = this;

            var result = document.createElement("div");

            if (self.hasEditNetworkPermission()) {
                var editLink = domConstruct.create("a", {
                    "innerHTML": i18n("Edit"),
                    "class": "actionsLink linkPointer"
                }, result);
                on(editLink, "click", function() {
                    self.showNewNetworkRelayDialog(item);
                });
                
                var deleteLink = domConstruct.create("a", {
                    "innerHTML": i18n("Delete"),
                    "class": "actionsLink linkPointer"
                }, result);
                on(deleteLink, "click", function() {
                    self.showDeleteConfirm(item);
                });
            }
            return result;
        },

        /**
         * 
         */
        showNewNetworkRelayDialog: function(item) {
            var self = this;

            var newNetworkRelayDialog = new Dialog({
                title: (item ? i18n("Edit Server Entry") : i18n("Connect Server to Server Cluster")),
                closable: true,
                draggable: true
            });
            
            var newNetworkRelayForm = new EditNetworkRelay({
            networkRelay: item,
                callback: function() {
                    newNetworkRelayDialog.hide();
                    newNetworkRelayDialog.destroy();
                    self.grid.refresh();
                }
            });
            
            newNetworkRelayForm.placeAt(newNetworkRelayDialog.containerNode);
            newNetworkRelayDialog.show();
        },

        showDeleteConfirm: function(item) {
            var self = this;
            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to disconnect this server from the server cluster?"),
                action: function() {
                    xhr.del({
                        url: bootstrap.restUrl + "network/networkRelay/" + item.id,
                        load: function() {
                            self.grid.refresh();
                        }
                    });
                }
            });
        },

        hasEditNetworkPermission: function() {
            return config && config.data &&
                    config.data.permissions &&
                    config.data.permissions[security.system.editNetworkSettings];
        }
    });
});
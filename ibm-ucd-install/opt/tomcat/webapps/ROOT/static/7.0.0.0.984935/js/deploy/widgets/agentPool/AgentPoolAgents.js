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
        "dojo/on",
        "deploy/widgets/Formatters",
        "deploy/widgets/agentPool/EditAgentPool",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        declare,
        xhr,
        domConstruct,
        on,
        Formatters,
        EditAgentPool,
        Dialog,
        TreeTable
) {
    /**
     *
     */
    return declare('deploy.widgets.agentPool.AgentPoolAgents',  [_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="agentPoolResources">'+
                '<div class="listTopButtons" data-dojo-attach-point="buttonAttach"></div>' +
                '<div data-dojo-attach-point="tableAttach"></div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            var gridRestUrl = bootstrap.restUrl+"agent";
            var gridLayout = [{
                    name: i18n("Name"),
                    formatter: Formatters.agentLinkFormatter,
                    orderField: "name",
                    getRawValue: function(item) {
                        return item.name;
                    }
                },{
                    name: i18n("Description"),
                    field: "description"
                },{
                    name: i18n("Status"),
                    formatter: Formatters.agentStatusFormatter
                },{
                    name: i18n("Last Contact"),
                    field: "lastContact",
                    formatter: function(item) {
                        return util.dateFormatShort(item.lastContact);
                    }
                },{
                    name: i18n("Version"),
                    field: "version"
                },{
                    name: i18n("Actions"),
                    formatter: this.actionsFormatter,
                    parentWidget: this
                },{
                    name: i18n("Relay"),
                    field: "relay",
                    formatter: function(item, value, cell) {
                        if(value) {
                            var statusCls = value.status === 'ONLINE' ? 'online' : 'offline';
                            var result =  domConstruct.create("div");
                            var status =  domConstruct.create("div", {
                                "class": "grid-cell-status"
                            });

                            var name = domConstruct.create("a", {
                                "class": "name"
                            });
                            name.innerHTML = value.name.escape();
                            name.href = "#relay/" + value.id;

                            var stat = domConstruct.create("span", {
                                "class": statusCls
                            });

                            domConstruct.place(name, status);
                            domConstruct.place(stat, status);

                            domConstruct.place(status, result);

                            return result;
                        }
                    }
                }];

            this.grid = new TreeTable({
                url: gridRestUrl,
                serverSideProcessing: true,
                orderField: "name",
                tableConfigKey: "agentPoolAgentList",
                noDataMessage: i18n("No agents have been added to this pool."),
                columns: gridLayout,
                hideExpandCollapse: true,
                hidePagination: false,
                baseFilters: [{
                    name: "agentPools.id",
                    type: "eq",
                    values: [self.agentPool.id],
                    className: "UUID"
                }]
            });
            this.grid.placeAt(this.tableAttach);

            if (this.agentPool.security["Edit Basic Settings"]) {
                var addAgentButton = new Button({
                    label: i18n("Edit Agent Pool"),
                    showTitle: false,
                    onClick: function() {
                        self.showAddAgentDialog();
                    }
                });
                addAgentButton.placeAt(this.buttonAttach);
            }
        },
        
        /**
         * 
         */
        actionsFormatter: function(item) {
            var self = this.parentWidget;

            var result = document.createElement("div");

            if (self.agentPool["Manage Pool Members"]) {
                var removeLink = domConstruct.create("a", {
                    "class": "actionsLink linkPointer",
                    "innerHTML": i18n("Remove")
                }, result);
                on(removeLink, "click", function() {
                    xhr.put({
                        url: bootstrap.restUrl+"agent/pool/"+self.agentPool.id+"/removeAgent/"+item.id,
                        load: function() {
                            self.grid.refresh();
                        }
                    });
                });
            }
            
            return result;
        },

        /**
         * 
         */
        showAddAgentDialog: function() {
            var self = this;
            
            xhr.get({
                url: bootstrap.restUrl+"agent/pool/"+this.agentPool.id,
                handleAs: "json",
                load: function(data) {
                    var editAgentPoolDialog = new Dialog({
                        title: i18n("Edit Agent Pool"),
                        closable: true,
                        draggable:true
                    });
                    
                    var editAgentPoolForm = new EditAgentPool({
                        agentPool: data,
                        callback: function() {
                            editAgentPoolDialog.hide();
                            editAgentPoolDialog.destroy();
                            self.grid.refresh();
                        }
                    });

                    editAgentPoolForm.placeAt(editAgentPoolDialog.containerNode);
                    editAgentPoolDialog.show();
                }
            });
        }
    });
});
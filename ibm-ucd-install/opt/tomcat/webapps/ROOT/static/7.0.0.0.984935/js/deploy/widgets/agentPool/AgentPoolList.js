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
        "dojo/dom-construct",
        "dojo/on",
        "deploy/widgets/Formatters",
        "deploy/widgets/agentPool/EditAgentPool",
        "js/webext/widgets/Alert",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
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
        domConstruct,
        on,
        Formatters,
        EditAgentPool,
        Alert,
        Dialog,
        GenericConfirm,
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

            var gridRestUrl = bootstrap.restUrl+"agent/pool/";
            var gridLayout = [{
                    name: i18n("Name"),
                    formatter: Formatters.agentPoolLinkFormatter,
                    orderField: "name",
                    filterField: "name",
                    filterType: "text"
                },{
                    name: i18n("Description"),
                    field: "description"
                },{
                    name: i18n("Status"),
                    formatter: Formatters.agentStatusFormatter
                },{
                    name: i18n("Actions"),
                    formatter: this.actionsFormatter,
                    parentWidget: this
                }];

            this.grid = new TreeTable({
                url: gridRestUrl,
                orderField: "name",
                sortType: "asc",
                noDataMessage: i18n("No agent pools have been added yet."),
                tableConfigKey: "agentPoolList",
                columns: gridLayout,
                serverSideProcessing: true,
                hidePagination: false,
                hideExpandCollapse: true,
                queryData: {outputType: ["BASIC", "SECURITY"]}
            });
            this.grid.placeAt(this.tableAttach);

            if (config.data.systemConfiguration.enableInactiveLinks) {
                var activeBox = new CheckBox({
                    checked: false,
                    value: 'true',
                    onChange: function(value) {
                        if (value) {
                            self.grid.baseFilters = [];
                        }
                        else {
                            self.grid.baseFilters = [{
                                name: "active",
                                type: "eq",
                                className: "Boolean",
                                values: [true]
                            }];
                        }
                        self.grid.refresh();
                    }
                });
                activeBox.placeAt(this.activeBoxAttach);
                
                var activeLabel = document.createElement("div");
                domClass.add(activeLabel, "inlineBlock");
                activeLabel.style.position = "relative";
                activeLabel.style.top = "2px";
                activeLabel.style.left = "2px";
                activeLabel.innerHTML = i18n("Show Inactive Agent Pools");
                this.activeBoxAttach.appendChild(activeLabel);
            }

            if (config.data.permissions[security.system.createAgentPools]) {
                var newAgentPoolButton = {
                    label: i18n("Create Agent Pool"),
                    showTitle: false,
                    onClick: function() {
                        self.showNewAgentPoolDialog();
                    }
                };
                
                var topCreateButton = new Button(newAgentPoolButton);
                domClass.add(topCreateButton.domNode, "idxButtonSpecial");
                topCreateButton.placeAt(this.buttonTopAttach);
            }
        },

        /**
         *
         */
        actionsFormatter: function(item) {
            var self = this.parentWidget;

            var result = document.createElement("div");

            if (item.security["Edit Basic Settings"]) {
                var editLink = document.createElement("a");
                editLink.innerHTML = i18n("Edit");
                editLink.className = "actionsLink";
                editLink.href = "#agentPool/"+item.id+"/configuration";
                result.appendChild(editLink);
            }
             
            var copyLink = domConstruct.create("a", {
                "class": "actionsLink linkPointer",
                "innerHTML": i18n("Copy")
            }, result);
            on(copyLink, "click", function() {
                xhr.get({
                    url: bootstrap.restUrl+"agent/pool/"+item.id,
                    handleAs: "json",
                    load: function(data) {
                        self.showNewAgentPoolDialog(data);
                    }
                });
            });
            
            if (item.security.Delete) {
                var deleteLink = domConstruct.create("a", {
                    "class": "actionsLink linkPointer",
                    "innerHTML": i18n("Delete")
                }, result);
                on(deleteLink, "click", function() {
                    self.confirmDelete(item);
                });
            }
            
            return result;
        },

        /**
         * 
         */
        showNewAgentPoolDialog: function(source) {
            var self = this;
            
            var newAgentPoolDialog = new Dialog({
                title: i18n("Create Agent Pool"),
                closable: true,
                draggable:true,
                description: i18n("Agent pools help you organize and manage agents that are installed " +
                        "in different environments. To create an agent pool, specify the agents that " +
                        "are the members of the pool.")
            });
            
            var newAgentPoolForm = new EditAgentPool({
                source: source,
                callback: function() {
                    newAgentPoolDialog.hide();
                    newAgentPoolDialog.destroy();
                }
            });
            
            newAgentPoolForm.placeAt(newAgentPoolDialog.containerNode);
            newAgentPoolDialog.show();
        },
        
        /**
         * 
         */
        confirmDelete: function(target) {
            var self = this;
            
            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to delete %s? " +
                        "This will permanently delete it from the system.", target.name.escape()),
                action: function() {
                    self.grid.block();
                    xhr.del({
                        url: bootstrap.restUrl+"agent/pool/"+target.id,
                        handleAs: "json",
                        load: function(data) {
                            self.grid.unblock();
                            self.grid.refresh();
                        },
                        error: function(error) {
                            var alert = new Alert({
                                messages: [i18n("Error deleting Agent Pool"),
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
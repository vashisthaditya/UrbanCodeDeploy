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
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/DialogMultiSelect",
        "js/webext/widgets/Alert",
        "deploy/widgets/security/TeamSelector"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        xhr,
        ColumnForm,
        DialogMultiSelect,
        Alert,
        TeamSelector
) {
    return declare('deploy.widgets.agentPool.EditAgentPool',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="editAgentPool">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',
        showCancel:true,

        /**
         * 
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            this.existingValues = {};
            if (this.agentPool) {
                this.existingValues = this.agentPool;
            }
            else if (this.source) {
                this.existingValues = this.source;
                this.existingValues.name = undefined;
            }
            else {
                xhr.get({
                    "url": bootstrap.restUrl + "security/teamsWithCreateAction/Agent Pool",
                    "handleAs": "json",
                    "sync": true,
                    "load": function(data) {
                        var extendedSecurity = {"teams": data};
                        self.existingValues.extendedSecurity = extendedSecurity;
                    }
                });
            }

            var cancelLabel = i18n("Cancel");

            if (!this.showCancel) {
                cancelLabel =null;
            }

            this.form = new ColumnForm({
                submitUrl: bootstrap.restUrl+"agent/pool",
                readOnly: self.readOnly,
                showButtons: !self.readOnly,
                "cancelLabel":cancelLabel,
                postSubmit: function(data) {
                    navBar.setHash("agentPool/"+data.id);
                    
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                addData: function(data) {
                    if (self.agentPool) {
                        data.existingId = self.existingValues.id;
                    }
                    if (self.source) {
                        data.copyId = self.existingValues.id;
                    }
                    
                    data.teamMappings = self.teamSelector.teams;
                },
                onError: function(error) {
                    var wrongNameAlert = new Alert({
                        message: util.escape(error.responseText)
                    });
                },
                onCancel: function() {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                }
            });
            
            this.form.addField({
                name: "name",
                label: i18n("Name"),
                required: true,
                type: "Text",
                value: this.existingValues.name
            });
            
            this.form.addField({
                name: "description",
                label: i18n("Description"),
                type: "Text",
                value: this.existingValues.description
            });

            var currentTeams = [];
            if (!!self.existingValues && !!self.existingValues.extendedSecurity && !!self.existingValues.extendedSecurity.teams) {
                currentTeams = self.existingValues.extendedSecurity.teams;
            }
            self.teamSelector = new TeamSelector({
                resourceRoleType: "Agent Pool",
                noneLabel: i18n("Standard Agent Pool"),
                teams: currentTeams
            });
            this.form.addField({
                name: "teams",
                label: i18n("Teams"),
                type: "Text",
                widget: self.teamSelector
            });
            
            this.form.addField({
                name: "agents",
                type: "TableFilterMultiSelect",
                url: bootstrap.restUrl+"agent",
                label: i18n("Add Agents"),
                description: i18n("Select the agent or agents to add to the pool."),
                defaultQuery: {
                    filterFields: "requiredActions",
                    filterType_requiredActions: "eq",
                    filterValue_requiredActions: security.agent.addToAgentPool
                },
                value: this.existingValues.agents,
                required: true
            });

            this.form.placeAt(this.formAttach);
        }
    });
});

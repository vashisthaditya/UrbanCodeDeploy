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
        "js/webext/widgets/ColumnForm",
        "dojo/date/locale",
        "deploy/widgets/security/TeamSelector"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        ColumnForm,
        locale,
        TeamSelector
) {
    return declare('deploy.widgets.agentRelay.EditRelay',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="edit-relay">'+
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
            if (this.relay) {
                this.existingValues = this.relay;
            }

            var cancelLabel = i18n("Cancel");
            if (!this.showCancel) {
                cancelLabel=null;
            }
            this.form = new ColumnForm({
                submitUrl: bootstrap.restUrl + "relay/" + self.existingValues.id,
                readOnly: self.readOnly,
                showButtons: !self.readOnly,
                "cancelLabel": cancelLabel,
                postSubmit: function(data) {
                    if (!self.noRedirect) {
                        navBar.setHash("relay/" + data.id);
                    }

                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                addData: function(data) {
                    var key;
                    for (key in data) {
                        if (data.hasOwnProperty(key)) {
                            //Relay API Only allows description to be updated. Remove all other fields before PUT.
                            if(key !== "description") {
                                delete data[key];
                            }
                        }
                    }
                    data.teamMappings = self.teamSelector.teams;
                },
                onCancel: function() {
                    self.form.setValue("description", self.existingValues.description);
                    if (!self.noRedirect) {
                        navBar.setHash("relay/" + self.existingValues.id);
                    }
                }
            });

            this.form.addField({
                name: "name",
                label: i18n("Name"),
                type: "Label",
                style: "margin-top:0;",
                value: this.existingValues.name
            });

            this.form.addField({
                name: "description",
                label: i18n("Description"),
                required: false,
                type: "Text",
                value: this.existingValues.description
            });

            var currentTeams = [];
            if (!!self.existingValues && !!self.existingValues.extendedSecurity && !!self.existingValues.extendedSecurity.teams) {
                currentTeams = self.existingValues.extendedSecurity.teams;
            }
            self.teamSelector = new TeamSelector({
                resourceRoleType: "Agent Relay",
                noneLabel: i18n("Standard Agent Relay"),
                teams: currentTeams
            });
            this.form.addField({
                name: "teams",
                label: i18n("Teams"),
                type: "Text",
                widget: self.teamSelector
            });

            this.form.addField({
                name: "relayHostname",
                label: i18n("Host"),
                type: "Label",
                style: "margin-top:0",
                value: this.existingValues.relayHostname
            });

            this.form.addField({
                name: "hostname",
                label: i18n("Listening on"),
                type: "Label",
                style: "margin-top:0",
                value: this.existingValues.hostname
            });

            this.form.addField({
                name: "jmsPort",
                label: i18n("JMS Port"),
                type: "Label",
                style: "margin-top:0",
                value: this.existingValues.jmsPort.toString()
            });

            this.form.placeAt(this.formAttach);
        }
    });
});
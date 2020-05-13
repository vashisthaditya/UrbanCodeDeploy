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
        "deploy/widgets/security/TeamSelector"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        ColumnForm,
        TeamSelector
) {
    return declare('deploy.widgets.agent.EditAgent',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="editAgent">'+
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
            if (this.agent) {
                this.existingValues = this.agent;
            }

            var cancelLabel = i18n("Cancel");
            if (!this.showCancel) {
                cancelLabel=null;
            }
            this.form = new ColumnForm({
                submitUrl: bootstrap.restUrl+"agent",
                readOnly: self.readOnly,
                showButtons: !self.readOnly,
                "cancelLabel":cancelLabel,
                postSubmit: function(data) {
                    if (!self.noRedirect) {
                        navBar.setHash("agent/"+data.id);
                    }

                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                addData: function(data) {
                    if (self.agent) {
                        data.existingId = self.existingValues.id;
                    }
                    data.teamMappings = self.teamSelector.teams;
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

            var currentTeams = [];
            if (!!self.existingValues && !!self.existingValues.extendedSecurity && !!self.existingValues.extendedSecurity.teams) {
                currentTeams = self.existingValues.extendedSecurity.teams;
            }
            self.teamSelector = new TeamSelector({
                resourceRoleType: "Agent",
                noneLabel: i18n("Standard Agent"),
                teams: currentTeams
            });
            this.form.addField({
                name: "teams",
                label: i18n("Teams"),
                type: "Text",
                widget: self.teamSelector
            });

            this.form.addField({
                name: "useImpersonation",
                label: i18n("Default Impersonation"),
                type: "Checkbox",
                value: !!this.existingValues.impersonationUser,
                onChange: function(value) {
                    if (value) {
                        self.showImpersonationOptions();
                    }
                    else {
                        self.hideImpersonationOptions();
                    }
                }
            });

            this.form.addField({
                name: "_impersonationInsert",
                type: "Invisible"
            });

            this.form.addField({
                name: "impersonationLabel",
                label: "",
                type: "Label",
                value: i18n("Default impersonation can be configured here. Any steps which do not "+
                        "specify their own impersonation settings will fall back to the settings "+
                        "provided here.")
            });

            if (!!this.existingValues.impersonationUser) {
                this.showImpersonationOptions();
            }
            else {
                this.hideImpersonationOptions();
            }

            this.form.addField({
                name: "description",
                label: i18n("Description"),
                type: "Text",
                value: this.existingValues.description
            });

            this.form.placeAt(this.formAttach);
        },

        /**
         *
         */
        showImpersonationOptions: function() {
            this.form.addField({
                name: "impersonationUser",
                label: i18n("User"),
                type: "Text",
                required: true,
                value: this.existingValues.impersonationUser
            }, "_impersonationInsert");
            this.form.addField({
                name: "impersonationPassword",
                label: i18n("Password"),
                type: "Secure",
                value: this.existingValues.impersonationPassword
            }, "_impersonationInsert");
            this.form.addField({
                name: "impersonationGroup",
                label: i18n("Group"),
                type: "Text",
                value: this.existingValues.impersonationGroup
            }, "_impersonationInsert");
            this.form.addField({
                name: "impersonationUseSudo",
                label: i18n("Use Sudo"),
                type: "Checkbox",
                value: this.existingValues.impersonationUseSudo
            }, "_impersonationInsert");
            this.form.addField({
                name: "impersonationForce",
                label: i18n("Always Use Default Impersonation"),
                type: "Checkbox",
                value: this.existingValues.impersonationForce
            }, "_impersonationInsert");
        },

        /**
         *
         */
        hideImpersonationOptions: function() {
            this.form.removeField("impersonationUser");
            this.form.removeField("impersonationPassword");
            this.form.removeField("impersonationGroup");
            this.form.removeField("impersonationUseSudo");
            this.form.removeField("impersonationForce");
        }
    });
});
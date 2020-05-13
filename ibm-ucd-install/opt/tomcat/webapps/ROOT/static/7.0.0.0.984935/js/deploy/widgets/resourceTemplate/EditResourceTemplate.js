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
        "js/webext/widgets/Alert",
        "deploy/widgets/security/TeamSelector",
        "dijit/form/CheckBox",
        "dojo/_base/array"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        xhr,
        ColumnForm,
        Alert,
        TeamSelector,
        CheckBox,
        array
) {
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="editResourceTemplate">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',
        showCancel: true,

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            self.editRootResourceTeams = true;

            this.readOnly = false;
            if (this.resourceTemplate) {
                this.readOnly = !this.resourceTemplate.security["Edit Basic Settings"];
            }

            this.existingValues = {};
            if (this.resourceTemplate) {
                this.existingValues = this.resourceTemplate;
            }
            else {
                if (this.sourceResource) {
                    this.existingValues.name = this.sourceResource.name;
                }

                xhr.get({
                    "url": bootstrap.restUrl + "security/teamsWithCreateAction/Resource Template",
                    "handleAs": "json",
                    "sync": true,
                    "load": function(data) {
                        var extendedSecurity = {"teams": data};
                        self.existingValues.extendedSecurity = extendedSecurity;
                    }
                });
            }

            this.form = new ColumnForm({
                submitUrl: bootstrap.restUrl+"resource/resourceTemplate",
                readOnly: self.readOnly,
                showButtons: !self.readOnly,
                postSubmit: function(data) {
                    if (self.callback !== undefined) {
                        self.callback(data);
                    }
                },
                addData: function(data) {
                    data.teamMappings = self.teamSelector.teams;
                    if (self.resourceTemplate) {
                        data.existingId = self.existingValues.id;
                    } else {
                        if (self.editRootResourceTeams &&
                            !self.form.fields.rootTeamInheritToggle.widget.checked) {
                            data.rootTeamMappings = self.rootTeamSelector.teams;
                        }
                    }
                    if (self.sourceResource) {
                        data.sourceResourceId = self.sourceResource.id;
                    }
                },
                onError: function(error) {
                    if (error.responseText) {
                        var wrongNameAlert = new Alert({
                            message: util.escape(error.responseText)
                        });
                    }
                },
                onCancel: function() {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                cancelLabel: self.showCancel ? i18n("Cancel") : null
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

            if (this.existingValues.parent || !this.existingValues.id) {
                var defaultQuery = {};
                if (this.application) {
                    // Filter out blueprints from other applications
                    defaultQuery.forApplication = this.application.id;
                }
                this.form.addField({
                    name: "parentId",
                    label: i18n("Parent Template"),
                    description: i18n("A resource template can use another existing template as " +
                            "its parent. If a parent is selected, all resources in the parent " +
                            "template will be inherited by the child, but the child template can " +
                            "still add additional resources as an overlay to the parent template. " +
                            "The parent cannot be changed after creating a resource template."),
                    type: "TableFilterSelect",
                    url: bootstrap.restUrl+"resource/resourceTemplate/couldBeParent",
                    defaultQuery: defaultQuery,
                    readOnly: !!this.existingValues.id,
                    value: this.existingValues.parent ? this.existingValues.parent.id : undefined,
                    onChange: function(value, item) {
                        // Don't let user mess with the teams of the resources of inherited parent
                        self.editRootResourceTeams = false;
                        if (self.form.hasField("rootTeams")) {
                            self.form.removeField("rootTeams");
                        }
                        if (self.form.hasField("rootTeamsCopy")) {
                            self.form.removeField("rootTeamsCopy");
                        }
                        if (self.form.hasField("rootTeamInheritToggle")) {
                            self.form.removeField("rootTeamInheritToggle");
                        }
                    }
                });
            }

            if (this.application) {
                this.form.addField({
                    name: "applicationId",
                    type: "Invisible",
                    value: this.application.id
                });
            }

            var currentTeams = [];
            if (!!self.existingValues && !!self.existingValues.extendedSecurity && !!self.existingValues.extendedSecurity.teams) {
                currentTeams = self.existingValues.extendedSecurity.teams;
            }
            this.teamSelector = new TeamSelector({
                resourceRoleType: "Resource Template",
                noneLabel: i18n("Standard Resource Template"),
                teams: currentTeams,
                onChanged: function(teams) {
                    if (!self.resourceTemplate && self.editRootResourceTeams) {
                        if (self.form.fields.rootTeamInheritToggle
                                && self.form.fields.rootTeamInheritToggle.widget.checked) {
                            self.attachRootTeamSelector(true, self.getSelectedTeams(teams));
                        }
                    }
                }
            });
            this.form.addField({
                name: "teams",
                label: i18n("Teams"),
                type: "Text",
                description: i18n("In the <b>Teams</b> field, add the teams that should be able to use the new resource template."),
                widget: this.teamSelector
            });
            // Only add the root resource teams field on creation of new template
            if (!this.resourceTemplate) {
                this.form.addField({
                    name: "rootTeamInheritToggle",
                    label: i18n("Copy Teams to Root Resource"),
                    type: "checkBox",
                    value: true,
                    description: i18n("This option makes the root resource available to the same teams as the resource template."),
                    onChange: function() {
                        self.attachRootTeamSelector(this.checked);
                    }
                });
                self.attachRootTeamSelector(true);
            }

            this.form.placeAt(this.formAttach);
        },

        attachRootTeamSelector: function(readOnly, displayTeams) {
            var self = this;
            if (self.form.hasField("rootTeams")) {
                self.form.removeField("rootTeams");
            }
            if (self.form.hasField("rootTeamsCopy")) {
                self.form.removeField("rootTeamsCopy");
            }
            var teams = [];
            if (readOnly) {
                if (!!displayTeams) {
                    teams = displayTeams;
                } else {
                    teams = self.getSelectedTeams(self.teamSelector.teams);
                }
                self.readOnlyRootTeamSelector = new TeamSelector({
                    resourceRoleType: "Resource",
                    noneLabel: i18n("Standard Resource"),
                    teams: teams,
                    readOnly: true
                });
            } else {
                if (!self.rootTeamSelector) {
                    self.rootTeamSelector = new TeamSelector({
                        resourceRoleType: "Resource",
                        noneLabel: i18n("Standard Resource"),
                        teams: teams,
                        readOnly: false
                    });
                }
            }
            self.form.addField({
                name: (readOnly ? "rootTeamsCopy" : "rootTeams"),
                label: i18n("Root Resource Teams"),
                type: "Text",
                description: i18n("In the <b>Root Resource Teams</b> field, add the teams that should be able to use the root resource of this resource template."),
                widget: (readOnly ? self.readOnlyRootTeamSelector : self.rootTeamSelector)
            });
        },

        getSelectedTeams: function(teams) {
            var self = this;
            // teamSelectDropdown closed, cannot get data. return last selected teams
            if (!self.teamSelector.teamSelect) {
                return self.teamSelector.selectedTeams;
            }
            // teams contains the correct values but does not have the
            // teamLabel field. That field is contained inside
            // self.teamSelector.teamSelect.data
            var selectedTeams = [];
            var team;
            array.forEach(self.teamSelector.teamSelect.data, function(teamData) {
                array.forEach(teams, function(selectedTeam) {
                    if (self.teamSelector.matchResourceRoleIds(teamData.teamId, selectedTeam.teamId)) {
                        selectedTeams.push(teamData);
                    }
                });
            });
            return selectedTeams;
        }
    });
});
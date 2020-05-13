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
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojox/data/JsonRestStore",
        "dojo/_base/xhr",
        "dojo/json",
        "dojo/dom-class",
        "js/webext/widgets/Alert",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/select/WebextSelect",
        "deploy/widgets/resource/ResourceRolePropertyEditor",
        "deploy/widgets/resource/EditResourceCondition",
        "deploy/widgets/security/TeamSelector"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        array,
        declare,
        JsonRestStore,
        xhr,
        JSON,
        domClass,
        Alert,
        ColumnForm,
        WebextSelect,
        ResourceRolePropertyEditor,
        EditResourceCondition,
        TeamSelector
) {
    return declare('deploy.widgets.resource.EditResource',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="editResource">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        showCancel: true,
        cancelCallback: undefined,
        agentPlaceholderName: "Agent Prototype",
        parentIds: [],

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            this.existingValues = {};
            if (this.resource) {
                this.existingValues = this.resource;

                if (this.resource.role) {
                    if (this.resource.role.specialType === "COMPONENT") {
                        this.type = "component";
                    }
                    else if (this.resource.role.specialType === "AGENT_PLACEHOLDER") {
                        this.type = "agentPlaceholder";
                    }
                    else if (this.resource.role.specialType !== "DYNAMIC_GROUP") {
                        this.type = "role";
                    }
                }
                else if (this.resource.agent) {
                    this.type = "agent";
                }
                else if (this.resource.agentPool) {
                    this.type = "agentPool";
                }
                else if (this.resource.componentTag) {
                    this.type = "componentTag";
                }
            }
            else if (this.parent) {
                this.existingValues.inheritTeam = true;

                xhr.get({
                    "url": bootstrap.restUrl+"resource/resource/teamInheritence/" + this.parent.id,
                    "handleAs": "json",
                    "sync": true,
                    "load": function(data) {
                        var extendedSecurity = {"teams": data};
                        self.existingValues.extendedSecurity = extendedSecurity;
                    }
                });
            }
            else if (this.parentIds && this.parentIds.length) {
                this.existingValues.inheritTeam = true;
                this.existingValues.extendedSecurity = {"teams": []};
            }
            else {
                xhr.get({
                    "url": bootstrap.restUrl + "security/teamsWithCreateAction/Resource",
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
                cancelLabel = null;
            }

            this.form = new ColumnForm({
                submitUrl: bootstrap.restUrl+"resource/resource",
                readOnly: self.readOnly,
                showButtons: !self.readOnly,
                "cancelLabel": cancelLabel,
                postSubmit: function(data) {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                    else {
                        navBar.setHash("resource/"+data.id);
                    }
                },
                addData: function(data) {
                    if (self.resource) {
                        data.existingId = self.existingValues.id;

                        if (self.resource.parent) {
                            data.parentId = self.resource.parent.id;
                        }
                    }
                    if (self.parent) {
                        data.parentId = self.parent.id;
                    }
                    if (self.parentIds && self.parentIds.length) {
                        data.parentIds = self.parentIds;
                    }
                    if (self.resourceTemplate) {
                        data.resourceTemplateId = self.resourceTemplate.id;
                    }

                    if (self.forceSecurityInheritence) {
                        data.teamMappings = [];
                    }
                    else {
                        data.teamMappings = self.teamSelector.teams;
                    }

                    if (self.inheritTeam) {
                        data.inheritTeam = self.inheritTeam;
                    }

                    // For dynamic groups, collect condition data into a resource role property
                    if (data.dynamic === "true" || data.dynamic === true) {
                        var conditions = [];
                        array.forEach(self.conditions, function(condition) {
                            conditions.push(condition.value);
                        });

                        data.roleProperties = {
                            rules: JSON.stringify(conditions)
                        };
                    }

                    if (self.type === "agentPlaceholder") {
                        if (!data.name) {
                            data.name = self.agentPlaceholderName;
                        }
                        data.agentPlaceholder = true;
                    }

                    if (!data.roleId && self.resource && self.resource.role) {
                        data.roleId = self.resource.role.id;
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
                    if (self.cancelCallback !== undefined) {
                        self.cancelCallback();
                    }
                    else if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                validateFields: function() {
                    var result = [];

                    if (self.rolePropertyEditor) {
                        result = self.rolePropertyEditor.getValidationErrors();
                    }

                    return result;
                }
            });

            if (!this.type || (this.type === "agentPlaceholder" && this.existingValues.name !== this.agentPlaceholderName)) {
                this.form.addField({
                    name: "name",
                    label: i18n("Name"),
                    required: true,
                    type: "Text",
                    value: this.existingValues.name
                });
            }

            this.form.addField({
                name: "_typeInsert",
                type: "Invisible"
            });

            this.form.addField({
                name: "_nameInsert",
                type: "Invisible"
            });

            this.form.addField({
                name: "description",
                label: i18n("Description"),
                type: "Text",
                value: this.existingValues.description
            });

            if (this.existingValues.prototype) {
                this.form.addField({
                    type: "Label",
                    label: "",
                    name: "_prototypeLabel",
                    value: i18n("This template resource is a prototype. When it is applied to an " +
                            "actual resource, it may create multiple copies of the template. The " +
                            "number of copies is controlled using the Prototype Iterations field. " +
                            "Use the token ${p:#} to reference the current iteration number in the " +
                            "name or properties of this resource and any of its children.")
                });

                this.form.addField({
                    name: "prototypeIterations",
                    label: i18n("Prototype Iterations"),
                    type: "Text",
                    required: true,
                    value: this.existingValues.prototypeIterations
                });
            }

            if (!this.forceSecurityInheritence) {
                if (this.parent ||
                        (this.parentIds && this.parentIds.length) ||
                        (this.resource && this.resource.parent)) {
                    this.form.addField({
                        name: "inheritTeam",
                        label: i18n("Inherit Teams From Parent"),
                        type: "Checkbox",
                        description: i18n("This option makes the new resource available to the same teams as the resource's parent."),
                        value: !!this.existingValues.inheritTeam,
                        onChange: function(value) {
                            //remove old team field
                            if (self.form.hasField("teams")) {
                                self.form.removeField("teams");
                            }

                            //add the correct team field (readonly or not)
                            if (value) {
                                self._addTeamField(true, "useImpersonation");
                            }
                            else {
                                self._addTeamField(false, "useImpersonation");
                            }
                        }
                    });
                }

                if (!!this.existingValues.inheritTeam) {
                    this._addTeamField(true);
                }
                else {
                    this._addTeamField(false);
                }
            }

            this.form.addField({
                name: "_impersonationMainInsert",
                type: "Invisible"
            });

            this.form.addField({
                name: "_rolePropertyInsert",
                type: "Invisible"
            });

            self.typeChanged(self.type);

            var showImpersonation = false;
            if (this.resource &&
                this.resource.hasAgent &&
                this.resource.role &&
                this.resource.role.specialType !== "AGENT_PLACEHOLDER")
            {
                showImpersonation = true;
            }
            else if (this.parent && this.parent.hasAgent){
                showImpersonation = true;
            }
            else if (this.type === "agent" || this.type === "agentPool") {
                showImpersonation = true;
            }
            else if (!this.type) {
                showImpersonation = true;
            }

            if (showImpersonation) {
                this.form.addField({
                    name: "useImpersonation",
                    label: i18n("Default Impersonation"),
                    type: "Checkbox",
                    description: i18n("Select this option to define default user impersonation credentials for a resource. Credentials are frequently required by agents on target machines. Typically, credentials are defined on plug-in steps, but any step that does not have its own credentials will use credentials defined on the associated resource."),
                    value: !!this.existingValues.impersonationUser,
                    onChange: function(value) {
                        if (value) {
                            self.showImpersonationOptions();
                        }
                        else {
                            self.hideImpersonationOptions();
                        }
                    }
                }, "_impersonationMainInsert");

                this.form.addField({
                    name: "_impersonationInsert",
                    type: "Invisible"
                }, "_impersonationMainInsert");

                this.form.addField({
                    name: "impersonationLabel",
                    label: "",
                    type: "Label",
                    value: i18n("Default impersonation can be configured here. Any steps which do not "+
                            "specify their own impersonation settings will fall back to the settings "+
                            "provided here.")
                }, "_impersonationMainInsert");

                if (!!this.existingValues.impersonationUser) {
                    this.showImpersonationOptions();
                }
                else {
                    this.hideImpersonationOptions();
                }
            }

            this.form.placeAt(this.formAttach);
        },

        _addTeamField: function(readOnly, before) {
            var self = this;

            var currentTeams = [];
            if (!!self.existingValues && !!self.existingValues.extendedSecurity && !!self.existingValues.extendedSecurity.teams) {
                currentTeams = self.existingValues.extendedSecurity.teams;
            }
            self.teamSelector = new TeamSelector({
                resourceRoleType: "Resource",
                noneLabel: i18n("Standard Resource"),
                readOnly: !!readOnly,
                teams: currentTeams,
                onChanged: function(updatedTeams) {
                    // Disable the 'Include Agents Automatically' button since they don't have
                    // any teams selected.
                    if (!self.readOnly) {
                        if (self.form.hasField("dynamic")) {
                            var shouldBeDisabled = (updatedTeams.length === 0);
                            self.autoIncludeAgents.widget.disabled = shouldBeDisabled; // HTML Disabled
                            if (shouldBeDisabled) {
                                self.form.setValue("dynamic", false);
                            }
                        }
                    }
                }
            });
            this.form.addField({
                name: "teams",
                label: i18n("Teams"),
                type: "Text",
                description: i18n("This field contains the teams that should be able to use this resource."),
                widget: self.teamSelector
            }, before);
        },

        typeChanged: function(type) {
            var self = this;

            if (this.form.hasField("agentId")) {
                this.form.removeField("agentId");
            }
            if (this.form.hasField("agentPoolId")) {
                this.form.removeField("agentPoolId");
            }

            var hasNameOverride;
            var existingValue = null;
            if (type === "agent") {
                hasNameOverride = false;
                if (this.existingValues.agent) {
                    existingValue = this.existingValues.agent.id;
                    if (this.existingValues.name !== this.existingValues.agent.name) {
                        hasNameOverride = true;
                    }
                }
                if (this.selectedValue){
                    existingValue = this.selectedValue.id;
                }

                self.form.addField({
                    name: "agentId",
                    label: i18n("Agent"),
                    type: "TableFilterSelect",
                    url: bootstrap.restUrl+"agent",
                    defaultQuery: {
                        filterFields: "requiredActions",
                        filterType_requiredActions: "eq",
                        filterValue_requiredActions: security.agent.createResources
                    },
                    value: existingValue,
                    onChange: function(value, item) {
                        if ((hasNameOverride && self.existingValues) || item) {
                            self.form.removeField("name");
                            self.form.addField({
                                name: "name",
                                label: i18n("Name"),
                                required: true,
                                value: hasNameOverride ? self.existingValues.name : item.name,
                                type: "Text"
                            }, "_typeInsert");
                        }
                    }
                }, "_typeInsert");
            }
            else if (type === "agentPool") {
                hasNameOverride = false;
                if (this.existingValues.agentPool) {
                    existingValue = this.existingValues.agentPool.id;
                    if (this.existingValues.name !== this.existingValues.agentPool.name) {
                        hasNameOverride = true;
                    }
                }

                self.form.addField({
                    name: "agentPoolId",
                    label: i18n("Agent Pool"),
                    required: true,
                    type: "TableFilterSelect",
                    url: bootstrap.restUrl+"agent/pool",
                    allowNone: false,
                    autoSelectFirst: true,
                    noDataMessage: i18n("No agent pools found"),
                    value: existingValue,
                    defaultQuery: {outputType: ["BASIC", "SECURITY"]},
                    onSetItem: function(value, item) {
                        if ((hasNameOverride && self.existingValues) || item) {
                            if (self.form.hasField("name")) {
                                self.form.removeField("name");
                            }
                            self.form.addField({
                                name: "name",
                                label: i18n("Name"),
                                required: true,
                                value: hasNameOverride ? self.existingValues.name : item.name,
                                type: "Text"
                            }, "_typeInsert");
                        }
                    }
                }, "_typeInsert");
            }
            else if (type === "component" || type === "role") {
                hasNameOverride = false;
                if (this.selectedValue) {
                    this.existingValues.role = this.selectedValue;
                    this.existingValues.name = this.selectedValue.name;
                    if (this.selectedValue.parentRole) {
                        this.existingValues.parentRole = this.selectedValue.parentRole;
                    }
                }
                if (this.existingValues.role) {
                    existingValue = this.existingValues.role.id;
                    if (this.existingValues.name !== this.existingValues.role.name) {
                        hasNameOverride = true;
                    }

                    var allowedNames = self.getAllowedNamesFromExistingValues(this.existingValues);
                    this.createNameWidget(allowedNames, hasNameOverride ? self.existingValues.name : this.existingValues.role.name);
                    this.showRoleProperties(this.existingValues.role);
                }

                var resourceRoleRestUrl;

                if (type === "component") {
                    //For adding new components to environments, only show components added to the application
                    if (appState.application && !this.existingValues.name) {
                        resourceRoleRestUrl = bootstrap.restUrl+"resource/resourceRole/componentRolesForApplication/"+appState.application.id;
                    }
                    else {
                        resourceRoleRestUrl = bootstrap.restUrl+"resource/resourceRole/componentRoles";
                    }
                }
                else if (type === "role") {
                    resourceRoleRestUrl = bootstrap.restUrl+"resource/resourceRole";
                }

                if (this.selectedValue){
                    existingValue = this.selectedValue.id;
                }

                var selectStore = new JsonRestStore({
                    target: resourceRoleRestUrl,
                    idAttribute: 'id'
                });
                var resourceRoleSelect = new WebextSelect({
                    store: selectStore,
                    searchAttr: "name",
                    autoComplete: false,
                    pageSize: 10,
                    value: existingValue,
                    readOnly: !!existingValue,
                    onChange: function(id, item) {
                        if ((hasNameOverride && self.existingValues) || item) {
                            self.form.removeField("name");
                            var allowedNames = self.getAllowedNamesFromExistingValues(self.existingValues);
                            self.createNameWidget(allowedNames, hasNameOverride ? self.existingValues.name : item.name);
                            self.showRoleProperties(item);
                        }
                    }
                });

                self.form.addField({
                    name: "roleId",
                    label: (type === "component" ? i18n("Component") : i18n("Role")),
                    required: true,
                    widget: resourceRoleSelect
                }, "_typeInsert");
            }
            else if (type === "componentTag") {
                hasNameOverride = false;
                if (this.existingValues.componentTag) {
                    existingValue = this.existingValues.componentTag.id;
                    if (this.existingValues.name !== this.existingValues.componentTag.name) {
                        hasNameOverride = true;
                    }
                }
                if (this.selectedValue){
                    existingValue = this.selectedValue.id;
                }

                this.form.addField({
                    name: "componentTagId",
                    label: i18n("Component Tag"),
                    type: "TagDropDown",
                    objectType: "Component",
                    value: existingValue,
                    readOnly: self.readOnly,
                    noneLabel: i18n("All Components"),
                    allowNone: false,
                    onChange: function(value, item) {
                        if ((hasNameOverride && self.existingValues) || item) {
                            if (self.form.hasField("name")) {
                                self.form.removeField("name");
                            }
                            self.form.addField({
                                name: "name",
                                label: i18n("Name"),
                                required: true,
                                value: hasNameOverride ? self.existingValues.name : item.name,
                                type: "Text"
                            }, "_typeInsert");
                        }
                    }
                }, "_typeInsert");
            }
            // self.existingValues.role.name = "SmartCloud Logical Node" or "Agent Placeholder"
            else if (type === "agentPlaceholder") {
                if (this.form.hasField("name")) {
                    this.form.removeField("name");
                }

                if ((!self.existingValues.role) || (self.existingValues.role.name === "Agent Placeholder")) {
                    var agentNamePatterns;
                    if (this.existingValues.roleProperties) {
                        agentNamePatterns = this.existingValues.roleProperties.agentNamePatterns;
                    }
                    this.form.addField({
                        name: "agentNamePatterns",
                        label: i18n("Agent Name Patterns"),
                        value: agentNamePatterns,
                        type: "TextArea",
                        description: i18n("After an environment is created, the agent prototype will " +
                                "automatically find agents matching these patterns and place them in " +
                                "the prototype's location. One pattern may be entered per line, and " +
                                "use the following special tokens: ${p:application.name}, ${p:environment.name}.")
                    });

                } //else if (self.existingValues.role.name === "SmartCloud Logical Node") {
                    // Do nothing
                //}
            }
            else if (!type) {
                var isDynamic = false;
                if (this.existingValues.role
                        && this.existingValues.role.specialType === "DYNAMIC_GROUP") {
                    isDynamic = true;
                }

                self.autoIncludeAgents = this.form.addField({
                    name: "dynamic",
                    label: i18n("Include Agents Automatically"),
                    type: "Checkbox",
                    description: i18n("When checked, this folder will automatically find agents " +
                            "matching the configured conditions and create resources for them " +
                            "inside the folder. Agents added manually will be removed if they do " +
                            "not match the criteria. Only agents sharing a team with this group "+
                            "will be eligible to belong to the group."),
                    value: isDynamic,
                    onChange: function(value) {
                        self.toggleDynamicFields(value);
                    }
                }, "_typeInsert");

                self.toggleDynamicFields(isDynamic);
                if (!isDynamic && self.resource && self.resource.role) {
                    self.showRoleProperties(self.resource.role);
                }
            }
        },

        showImpersonationOptions: function() {
            this.form.addField({
                name: "impersonationUser",
                label: i18n("User"),
                type: "Text",
                required: true,
                description: i18n("Enter the default impersonation user name."),
                value: this.existingValues.impersonationUser
            }, "_impersonationInsert");
            this.form.addField({
                name: "impersonationPassword",
                label: i18n("Password"),
                type: "Secure",
                description: i18n("Enter the default impersonation password."),
                value: this.existingValues.impersonationPassword
            }, "_impersonationInsert");
            this.form.addField({
                name: "impersonationGroup",
                label: i18n("Group"),
                type: "Text",
                description: i18n("Enter the authentication realm group to impersonate by default."),
                value: this.existingValues.impersonationGroup
            }, "_impersonationInsert");
            this.form.addField({
                name: "impersonationUseSudo",
                label: i18n("Use Sudo"),
                type: "Checkbox",
                description: i18n("To use the sudo command for impersonation, select the <b>Use Sudo</b> check box. If the resource is on a UNIX or Linux machine, you can use this option. If the resource is on a Windows machine, this option has no effect."),
                value: this.existingValues.impersonationUseSudo
            }, "_impersonationInsert");
            this.form.addField({
                name: "impersonationForce",
                label: i18n("Always Use Default Impersonation"),
                type: "Checkbox",
                description: i18n("To always use the credentials that are defined on the resource and override any defined on process steps, select the <b>Always Use Default Impersonation</b> option."),
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
        },

        /**
         *
         */
         showRoleProperties: function(role) {
             var self = this;

             if (this.form.hasField("roleProperties")) {
                 this.form.removeField("roleProperties");
             }

             this.rolePropertyEditor = new ResourceRolePropertyEditor({
                 role: role,
                 resource: self.resource,
                 doubleWidth: true
             });

             this.form.addField({
                 widget: this.rolePropertyEditor,
                 name: "roleProperties"
             }, "_rolePropertyInsert");
         },

         /**
          *
          */
         toggleDynamicFields: function(dynamic) {
             var self = this;

             if (dynamic) {
                 self.conditions = [];
                 self.showConditionButton();

                 if (self.resource && self.resource.roleProperties) {
                     var rawRules = self.resource.roleProperties.rules;
                     if (!!rawRules) {
                         array.forEach(JSON.parse(rawRules), function(rule) {
                             self.addCondition(rule);
                         });
                     }
                 }
                 else {
                     self.addCondition();
                 }
             }
             else {
                 if (self.form.hasField("conditionButton")) {
                     self.form.removeField("conditionButton");
                 }

                 array.forEach(self.conditions, function(condition) {
                     self.form.removeField(condition);
                 });
                 self.conditions = [];
             }
         },

         /**
          *
          */
         showConditionButton: function() {
             var self = this;
             var conditionButton = new Button({
                 label: i18n("Add Condition"),
                 onClick: function() {
                     self.addCondition();
                 }
             });
             self.form.addField({
                 widget: conditionButton,
                 name: "conditionButton",
                 label: ""
             }, "_typeInsert");
         },

         /**
          *
          */
         addCondition: function(value) {
             var self = this;

             var condition = new EditResourceCondition({
                 value: value,
                 onDelete: function() {
                     util.removeFromArray(self.conditions, condition);
                     self.form.removeField(condition);
                 }
             });

             this.form.addField({
                 widget: condition,
                 name: "condition_"+this.conditions.length,
                 label: ""
             }, "conditionButton");
             this.conditions.push(condition);
         },

         getAllowedNames: function(allowedParentResourceRoles, parentRoleName) {
             var self = this;
             var investigateAllowedNames = true;
             var allowedNames = [];
             var i = 0;
             array.forEach(allowedParentResourceRoles, function(role) {
                 if (investigateAllowedNames === true) {
                     if (role.name === parentRoleName) {
                         if (role.allowedName === undefined || role.allowedName === null || role.allowedName === '') {
                             investigateAllowedNames = false;
                             allowedNames = undefined;
                         }
                         else {
                             allowedNames[allowedNames.length] = role.allowedName;
                         }
                     }
                 }
             });
             return allowedNames;
         },

         getAllowedNamesFromExistingValues: function(existingValues) {
             var self = this;
             var investigateAllowedNames = true;
             var allowedNames = [];
             var i = 0;
             if (existingValues.parentRole) {
                 var parRoleName = existingValues.parentRole.name;
                 if (existingValues.role && existingValues.role.allowedParentResourceRoles) {
                     allowedNames = self.getAllowedNames(existingValues.role.allowedParentResourceRoles, parRoleName);
                 }
             }
             return allowedNames;
         },

         createNameWidget: function(allowedNames, curName) {
             var self = this;
             if (allowedNames !== undefined && allowedNames.length !== 0) {
                 self.form.addField({
                     'allowedValues':allowedNames,
                     name: "name",
                     label: i18n("Name"),
                     required: true,
                     value: curName,
                     type: "Select"
                 }, "_nameInsert");
             }
             else {
                 self.form.addField({
                     name: "name",
                     label: i18n("Name"),
                     required: true,
                     value: curName,
                     type: "Text"
                 }, "_nameInsert");
             }
         }
    });
});

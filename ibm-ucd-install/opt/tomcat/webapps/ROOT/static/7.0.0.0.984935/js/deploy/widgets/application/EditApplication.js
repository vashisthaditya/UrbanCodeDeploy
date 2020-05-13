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
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/RestSelect",
        "js/webext/widgets/Alert",
        "deploy/widgets/security/TeamSelector"
        ],
function(
        _TemplatedMixin,
        _Widget,
        array,
        declare,
        xhr,
        ColumnForm,
        RestSelect,
        Alert,
        TeamSelector
) {
    return declare('deploy.widgets.application.EditApplication',  [_Widget, _TemplatedMixin], {
        aThing: {},
        templateString:
            '<div class="editApplication">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        // Initialize arrays to be used later
        templatePropertyNames: [],
        templatePropertyPatterns: [],
        showCancel: true,

        /**
         * When the chosen template changes, this callback is invoked.  If the client code doesn't
         * specify this, the default is a no-op.
         */
        onTemplateChange: function(value, item) {},
        showButtons: true,

        /**
         *
         */
        postCreate: function() {
            var self = this;
            self.inherited(arguments);

            self.existingValues = {};
            if (self.application) {
                self.existingValues = self.application;
            }
            else {
                xhr.get({
                    "url": bootstrap.restUrl + "security/teamsWithCreateAction/Application",
                    "handleAs": "json",
                    "sync": true,
                    "load": function(data) {
                        var extendedSecurity = {"teams": data};
                        self.existingValues.extendedSecurity = extendedSecurity;
                    }
                });
            }

            self.form = new ColumnForm({
                submitUrl: bootstrap.restUrl+"deploy/application",
                readOnly: self.readOnly,
                showButtons: !self.readOnly && self.showButtons,
                postSubmit: function(data) {
                    if (!this.noRedirect) {
                        navBar.setHash("application/"+data.id);
                    }

                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                addData: function(data) {
                    if (self.application) {
                        data.existingId = self.application.id;
                    }
                    if (data.notificationSchemeId === "none") {
                        delete data.notificationSchemeId;
                    }

                    data.teamMappings = self.teamSelector.teams;
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
                validateFields: function(data) {
                    var result = [];
                    array.forEach(self.templatePropertyNames, function(propertyName, i) {
                        var propertyPattern = self.templatePropertyPatterns[i];
                        var propertyValue = data[propertyName];

                        if (propertyPattern && propertyValue) {
                            var passed = true;
                            if (self.templatePropertyTypes[i].indexOf("MULTI_SELECT") !== -1) {
                                propertyValue.split(",").forEach(function(val) {
                                    if (!self.validatePattern(val, propertyPattern)) {
                                        passed = false;
                                    }
                                });
                            } else if (!self.validatePattern(propertyValue, propertyPattern)) {
                                passed = false;
                            }

                            if (!passed) {
                                var label = "";
                                var fieldDetails = dojo.filter(self.form.fieldsArray, function(field) {
                                    return field.name === propertyName;
                                });
                                if (fieldDetails && fieldDetails.length === 1) {
                                    label = fieldDetails[0].label;
                                }
                                if (!label) {
                                    if (propertyName.indexOf("template/") === 0) {
                                        propertyName = propertyName.substring(9);
                                    }
                                    label = propertyName;
                                }
                                result.push(i18n("Value does not follow the required pattern for property %s.", label));
                            }
                        }
                    });
                    return result;
                 },
                 cancelLabel: self.showCancel ? i18n("Cancel") : null
            });

            self.form.addField({
                name: "name",
                label: i18n("Name"),
                required: true,
                type: "Text",
                value: self.existingValues.name
            });

            self.form.addField({
                name: "description",
                label: i18n("Description"),
                type: "Text",
                value: self.existingValues.description
            });

            var currentTeams = [];
            if (!!self.existingValues && !!self.existingValues.extendedSecurity && !!self.existingValues.extendedSecurity.teams) {
                currentTeams = self.existingValues.extendedSecurity.teams;
            }
            self.teamSelector = new TeamSelector({
                readOnly: self.readOnly,
                resourceRoleType: "Application",
                noneLabel: i18n("Standard Application"),
                teams: currentTeams
            });
            self.form.addField({
                name: "teams",
                label: i18n("Teams"),
                widget: self.teamSelector
            });

            self.form.addField({
                name: "_templateInsert",
                type: "Invisible"
            });

            self.form.addField({
                name: "_settingsInsert",
                type: "Invisible"
            });

            self.form.addField({
                name: "_templateProperties",
                type: "Invisible"
            });

            self.addTemplateFields();

            self.form.placeAt(self.formAttach);
        },

        /**
         *
         */
        addSettingFields: function(template) {
            var self = this;

            // Remove these fields if they already exist
            self.form.removeField("notificationSchemeId");
            self.form.removeField("enforceCompleteSnapshots");

            // -- Notification scheme
            var notificationSchemeSelect = new RestSelect({
                disabled: self.readOnly || !!template,
                restUrl: bootstrap.restUrl+"notification/notificationScheme",
                value: self.existingValues.notificationSchemeId,
                getLabel: function(item) {
                    return i18n(item.name);
                }
            });
            self.form.addField({
                name: "notificationSchemeId",
                label: i18n("Notification Scheme"),
                description: i18n("A notification scheme to use when handling events generated by this application."),
                widget: notificationSchemeSelect
            }, "_settingsInsert");

            self.form.addField({
                name: "enforceCompleteSnapshots",
                label: i18n("Enforce Complete Snapshots"),
                readOnly: !!template,
                type: "Checkbox",
                description: i18n("Whether this application should require that a version be given for each component when creating snapshots."),
                value: this.existingValues.enforceCompleteSnapshots
            }, "_settingsInsert");
        },

        /**
         *
         */
        addTemplateFields: function() {
            var self = this;
            var template = self.existingValues.template || self.applicationTemplate;

            // Boolean values for below logic
            var canCreate = config.data.permissions[security.system.createApplications];
            var canCreateWithTemplate
                    = config.data.permissions[security.system.createApplicationsFromTemplate];
            var emptyForm = !self.application && !self.applicationTemplate && !self.source;
            var edittingWithTemplate = (self.application && self.application.template)
                    || self.applicationTemplate;

            if ((emptyForm || !edittingWithTemplate) && canCreateWithTemplate) {

                // Show the template dropdown if we are creating a new application or editing
                // an existing application.
                var templateSelect = new RestSelect({
                    restUrl: bootstrap.restUrl+"deploy/applicationTemplate",
                    value: self.existingValues.templateId,
                    tooltipField: "description",
                    onChange: function(value, item) {
                        self.showStatusOrTemplateVersionFields(item);
                    }
                });

                self.form.addField({
                    name: "templateId",
                    label: i18n("Application Template"),
                    description: i18n("The template to use for this application."),
                    required: !canCreate,
                    widget: templateSelect
                }, "_templateInsert");
            }
            else if (edittingWithTemplate) {

                // Show readonly text field if we are copying or already have the template specified.
                self.form.addField({
                    name: "templateName",
                    label: i18n("Application Template"),
                    description: i18n("The template to use for this application."),
                    readOnly: true,
                    type: "Text",
                    value: !!template ? template.name : "None"
                }, "_templateInsert");

                self.showStatusOrTemplateVersionFields(template);
            }
            else {
                // Can't see the template field at all, load all other fields.
                self.addSettingFields();
            }
        },

        /**
         *
         */
        showStatusOrTemplateVersionFields: function(template) {
            var self = this;

            if (self.form.hasField("templateVersion")) {
                self.form.removeField("templateVersion");
            }

            if (template) {
                self.templateVersionSelect = new RestSelect({
                    restUrl: bootstrap.restUrl+"deploy/applicationTemplate/" + template.id + "/versions",
                    getLabel: function(item) {
                        return item.version+" - "+util.dateFormatShort(item.commit.commitTime);
                    },
                    getValue: function(item) {
                        return item.version;
                    },
                    noneLabel: i18n("Always Use Latest"),
                    value: (this.existingValues.templateVersion === -1 ? null : this.existingValues.templateVersion),
                    onChange: function(value, item) {
                        if (item) {
                            self.selectTemplate(item);
                        }
                        else {
                            self.selectTemplate(template);
                        }
                    }
                });
                this.form.addField({
                    name: "templateVersion",
                    label: i18n("Application Template Version"),
                    description: i18n("The version of the template to use for this component."),
                    widget: self.templateVersionSelect
                }, "_templateInsert");
            }
            else {
                self.selectTemplate();
                self.addSettingFields();
            }
        },

        /**
         *
         */
        selectTemplate: function(template) {
            var self = this;

            self.removeTemplatePropDefs();
            if (template) {
                // Reload the template so we have all the propdefs for the correct version of the template.
                var restUrl;
                if (self.templateVersionSelect.value) {
                    restUrl = bootstrap.restUrl + "deploy/applicationTemplate/" +
                            template.id + "/" + self.templateVersionSelect.value;
                }
                else {
                    restUrl = bootstrap.restUrl + "deploy/applicationTemplate/" + template.id + "/-1";
                }

                xhr.get({
                    url: restUrl,
                    handleAs: "json",
                    load: function(data) {
                        self.existingValues.notificationSchemeId = data.notificationSchemeId;
                        self.existingValues.enforceCompleteSnapshots = data.enforceCompleteSnapshots;
                        self.showTemplatePropDefs(data);
                        self.addSettingFields(data);
                        self.onTemplateChange.apply(this,arguments);
                    }
                });
            }
            else {
                self.onTemplateChange.apply(this,arguments);
            }
        },

        /**
         *
         */
        showTemplatePropDefs: function(template) {
            var self = this;

            self.templatePropertyNames = [];
            self.templatePropertyPatterns = [];
            self.templatePropertyTypes = [];
            array.forEach(template.propDefs, function(propDef) {
                var propDefCopy = util.clone(propDef);
                propDefCopy.name = "template/"+propDef.name;
                if (propDef.pattern) {
                    propDefCopy.description += i18n(" Required Pattern: %s", propDef.pattern);
                }

                util.populatePropValueAndLabel(self.existingValues.properties, propDefCopy);

                self.form.addField(propDefCopy, "_templateProperties");
                self.templatePropertyNames.push(propDefCopy.name);
                self.templatePropertyPatterns.push(propDefCopy.pattern);
                self.templatePropertyTypes.push(propDefCopy.type);
            });
        },

        /**
         *
         */
        removeTemplatePropDefs: function() {
            var self = this;
            array.forEach(self.templatePropertyNames, function(propertyName) {
                self.form.removeField(propertyName);
            });
        },

        /**
         * Get this form's data.  Useful for the application wizard, and possibly other things.
         */
        getData: function() {
            return this.form.getData();
        },

        submit: function() {
            this.form.submitForm();
        },

        validatePattern: function(value, pattern) {
            var regex = new RegExp("^"+pattern+"$");
            return regex.test(value);
        },

        // a return value other than true or [] means that validation failed
        validate: function() {
            var errorMessages = this.form.validateFields(this.getData());
            Array.prototype.push.apply(errorMessages, this.form.validateRequired());
            return errorMessages;
        }
    });
});

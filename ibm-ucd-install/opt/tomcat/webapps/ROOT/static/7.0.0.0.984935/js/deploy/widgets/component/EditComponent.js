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
        "js/util/blocker/_BlockerMixin",
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/dom",
        "dojo/dom-class",
        "dojo/store/Memory",
        "deploy/widgets/firstDayWizard/FirstDayWizardUtil",
        "dijit/form/ComboBox",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/RestSelect",
        "js/webext/widgets/Alert",
        "deploy/widgets/security/TeamSelector"
        ],
function(
        _TemplatedMixin,
        _Widget,
        _BlockerMixin,
        array,
        declare,
        xhr,
        dom,
        domClass,
        Memory,
        FirstDayWizardUtil,
        ComboBox,
        ColumnForm,
        RestSelect,
        Alert,
        TeamSelector
) {
    return declare('deploy.widgets.component.EditComponent',  [_Widget, _TemplatedMixin, _BlockerMixin], {
        templateString:
            '<div class="editComponent">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',
        showCancel: true,

        /**
         *
         */
        postCreate: function() {
            var self = this;
            self.block();
            self.inherited(arguments);

            self.existingValues = {
                useVfs: config.data.systemConfiguration.copyToCodestation
            };
            if (self.component) {
                self.existingValues = self.component;
                self.existingValues.componentType = self.component.componentType;

                if (self.component.sourceConfigPlugin) {
                    self.existingValues.sourceConfigPluginName = self.component.sourceConfigPlugin.name;
                }
            }
            else if (self.source) {
                xhr.get({
                    "url": bootstrap.restUrl+"deploy/component/" + self.source.id,
                    "handleAs": "json",
                    "sync": true,
                    "load": function(data) {
                        self.source = data;
                    }
                });
                self.existingValues = self.source;

                self.existingValues.name = undefined;
                if (self.source.sourceConfigPlugin) {
                    self.existingValues.sourceConfigPluginName = self.source.sourceConfigPlugin.name;
                }
                if (self.source.template) {
                    self.existingValues.templateId = self.source.template.id;
                }
            }
            else {
                xhr.get({
                    "url": bootstrap.restUrl + "security/teamsWithCreateAction/Component",
                    "handleAs": "json",
                    "sync": true,
                    "load": function(data) {
                        var extendedSecurity = {"teams": data};
                        self.existingValues.extendedSecurity = extendedSecurity;
                    }
                });
            }

            if (self.componentTemplate) {
                self.existingValues.template = self.componentTemplate;
            }

            var template = self.existingValues.template;
            self.sourceConfigPropertyNames = [];
            self.templatePropertyNames = [];
            self.templatePropertyPatterns = [];
            self.versionImportPropertyNames = [];

            self.form = new ColumnForm({
                submitUrl: bootstrap.restUrl+"deploy/component",
                readOnly: self.readOnly,
                showButtons: !self.readOnly && !(self.mode === "firstDayWizard"),
                postSubmit: function(data) {
                    if (!self.noRedirect) {
                        navBar.setHash("component/"+data.id);
                    }

                    if (self.callback !== undefined) {
                        self.callback(data);
                    }
                },
                addData: function(data) {
                    if (self.component) {
                        data.existingId = self.component.id;
                    }
                    if (self.source) {
                        data.copyId = self.source.id;

                        if (self.source.componentTemplate) {
                            data.templateId = self.source.componentTemplate.id;
                        }
                        if (self.source.template) {
                            data.templateId = self.source.template.id;
                        }
                    }

                    data.properties = {};
                    array.forEach(self.sourceConfigPropertyNames, function(propertyName) {
                        if (data[propertyName] !== undefined) {
                            data.properties[propertyName] = data[propertyName];
                            delete data[propertyName];
                        }
                        else {
                            data.properties[propertyName] = "";
                        }
                    });

                    data.importProperties = {"properties":{}};
                    array.forEach(self.versionImportPropertyNames, function(importPropertyName) {
                        if (data[importPropertyName] !== undefined) {
                            var beginActualName = importPropertyName.indexOf("/") + 1;
                            var actualImportPropertyName = importPropertyName.substring(beginActualName);
                            data.importProperties.properties[actualImportPropertyName] = data[importPropertyName];
                        } else {
                            data.importProperties.properties[importPropertyName] = "";
                        }
                    });

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
                    array.forEach(self.templatePropertyNames, function(i) {
                        var propertyName = self.templatePropertyNames[i];
                        var propertyPattern = self.templatePropertyPatterns[i];
                        var propertyValue = data[propertyName];

                        if (propertyPattern && propertyValue) {
                            if (!self.validatePattern(propertyValue,propertyPattern)) {
                                result.push(i18n("Value for property %s does not follow the required Pattern",propertyName));
                            }
                        }
                    });
                    return result;
                 },
                 cancelLabel : self.showCancel ? i18n("Cancel") : null
            });

            self.form.addField({
                name: "name",
                label: i18n("Name"),
                required: true,
                type: "Text",
                value: self.existingValues.name,
                onChange: function(value) {
                    if (self.mode === "firstDayWizard") {
                        self.firstDayWizardModel.set("pre_setComponentName",
                                                     {component: self.component,
                                                        newName: value});
                    }
                }
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
                resourceRoleType: "Component",
                noneLabel: i18n("Standard Component"),
                teams: currentTeams
            });
            if(self.mode !== "firstDayWizard"){
                self.form.addField({
                    name: "teams",
                    label: i18n("Teams"),
                    type: "Text",
                    widget: self.teamSelector
                });
            }
            if (self.mode === "firstDayWizard"){
               self.form.addField({
                   name: "advancedConfig",
                   label: i18n("Advanced Configuration"),
                   type: "Checkbox",
                   value: self.existingValues.advancedConfig,
                   onChange: self._showOrHideAdvancedConfigurationAsSpecified.bind(self)
               });
            }

            self.form.addField({
                name: "_templateInsert",
                type: "Invisible"
            });
            self.form.addField({
                name: "_componentTypeInsert",
                type: "Invisible"
            });
            self.form.addField({
                name: "_templateProperties",
                type: "Invisible"
            });
            self.addComponentTypeField();
            self.form.addField({
                name: "_sourceProperties",
                type: "Invisible"
            });
            self.form.addField({
                name: "_sourceStandardProperties",
                type: "Invisible"
            });
            self.form.addField({
                name: "_integrationProperties",
                type: "Invisible"
            });

            self.form.addField({
                name: "_cleanupSettingsHeader",
                type: "SectionLabel",
                value: i18n("Cleanup Configuration")
            });
            self.form.addField({
                name: "_cleanupSettings",
                type: "Invisible"
            });
            self.addSourcePropertiesHeader();

            // Booleans for logic around showing template fields
            var canCreate = config.data.permissions[security.system.createComponents];
            var canCreateWithTemplate
                    = config.data.permissions[security.system.createComponentsFromTemplate];
            var emptyForm = !self.component && !self.componentTemplate && !self.source;
            var edittingWithTemplate = (self.component && self.component.template)
                    || self.componentTemplate;

            if ((emptyForm || !edittingWithTemplate) && canCreateWithTemplate) {
                if (self.mode === 'firstDayWizard') {
                    self.showStatusOrTemplateVersionFields();
                } else {
                    // Limit templates based on provided tag if any.
                    var isValid = function() { return true; };
                    if (self.requireTemplateTag) {
                        isValid = function(item) {
                            return item.tags.some(function(tag) {
                                return tag.id === self.requireTemplateTag.id;
                            });
                        };
                    }

                    var templateSelect = new RestSelect({
                        restUrl: bootstrap.restUrl+"deploy/componentTemplate",
                        value: self.existingValues.templateId,
                        isValid: isValid,
                        onChange: function(value, item) {
                            self.showStatusOrTemplateVersionFields(item);
                        }
                    });
                    self.form.addField({
                        name: "templateId",
                        label: i18n("Component Template"),
                        description: i18n("The template to use for this component."),
                        required: !canCreate || !!self.requireTemplateTag,
                        widget: templateSelect
                    }, "_templateInsert");
                }
            }
            else if (edittingWithTemplate) {
                self.form.addField({
                    name: "templateName",
                    label: i18n("Template"),
                    description: i18n("The template to use for this component."),
                    readOnly: true,
                    type: "Text",
                    value: !!template ? template.name : "None"
                }, "_templateInsert");

                self.showStatusOrTemplateVersionFields(template);
            }
            else {
                self.showStatusOrTemplateVersionFields();
            }

            var useSystemSettings = (!self.existingValues.cleanupDaysToKeep
                    && !self.existingValues.cleanupCountToKeep);
            self.form.addField({
                name: "inheritSystemCleanup",
                label: i18n("Inherit Cleanup Settings"),
                description: i18n("Determines how many component versions are kept in CodeStation and how long they are kept. If selected, the component uses the values on the System Settings pane. If cleared, the Days to Keep Versions and Number of Versions to Keep fields are displayed. Initially, both fields are set to -1, which means keep indefinitely, and keep all."),
                type: "Checkbox",
                onChange: function(value) {
                    if (!value) {
                        self.showCleanupFields();
                    }
                    else {
                        if (self.form.hasField("cleanupDaysToKeep")) {
                            self.form.removeField("cleanupDaysToKeep");
                            self.form.removeField("cleanupCountToKeep");
                        }
                    }
                    if (self.mode === "firstDayWizard") {
                        FirstDayWizardUtil.boldLabelsOfRequiredFields();
                    }
                },
                value: useSystemSettings
            }, "_cleanupSettings");
            if (!useSystemSettings) {
                self.showCleanupFields();
            }
            if (self.mode === "firstDayWizard") {
                self._showOrHideAdvancedConfigurationAsSpecified();
            }

            self.form.placeAt(self.formAttach);
        },

        _showAdvancedConfiguration:function() {
            var self = this;
            self.form.fieldsArray.forEach(function (field) {
                domClass.remove(field.widget.fieldRow,"hidden");
            });
        },

        _hideAdvancedConfiguration: function() {
            var self = this;
            var fieldsAlwaysShown = ["name", "description", "teams", "advancedConfig"];

            self.form.fieldsArray.forEach(function (field) {
                var fieldIsAlwaysShown = fieldsAlwaysShown.indexOf(field.name) > -1;
                if (!fieldIsAlwaysShown) {
                    domClass.add(field.widget.fieldRow, "hidden");
                }
            });
        },

        _showOrHideAdvancedConfigurationAsSpecified: function() {
            var self = this;
            if (self.form && self.form.fields.advancedConfig){
                var show = self.form.fields.advancedConfig.widget.get('value');
                if (show) {
                    self._showAdvancedConfiguration();
                } else {
                    self._hideAdvancedConfiguration();
                }
            }
        },

        showStatusOrTemplateVersionFields: function(template) {
            var self = this;

            if (self.form.hasField("templateVersion")) {
                self.form.removeField("templateVersion");
            }

            if (template) {
                // Component may not exist if we're making a new one on a template 
                var templateURI;
                if(!!self.component) {
                    templateURI = bootstrap.restUrl+"deploy/component/"+self.component.id+"/componentTemplateVersions";
                } else {
                    templateURI = bootstrap.restUrl+"deploy/componentTemplate/"+template.id+"/versions";
                }

                var templateVersionSelect = new RestSelect({
                    restUrl: templateURI,
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
                    label: i18n("Template Version"),
                    description: i18n("The version of the template to use for this component."),
                    widget: templateVersionSelect
                }, "_templateInsert");
            }
            else {
                self.selectTemplate();
            }
        },

        selectTemplate: function(template) {
            var self = this;

            array.forEach(self.sourceConfigPropertyNames, function(propertyName) {
                self.form.removeField(propertyName);
            });
            self.sourceConfigPropertyNames = [];
            if (self.form.hasField("sourceConfigPlugin")) {
                self.form.removeField("sourceConfigPlugin");
                self.form.removeField("importAutomatically");
                self.form.removeField("useVfs");
                self.form.removeField("defaultVersionType");
                self.form.removeField("runVersionCreationProcess");
                self.form.removeField("importAgentType");
            }

            if (self.form.hasField("ignoreQualifiers")) {
                self.form.removeField("ignoreQualifiers");
            }

            array.forEach(self.templatePropertyNames, function(propertyName) {
                self.form.removeField(propertyName);
            });
            self.templatePropertyNames = [];
            self.addSourcePropertiesHeader();


            if (template) {
                // Component may not exist if we're making a new one on a template
                var templateURI;
                if(!!self.component) {
                    templateURI = bootstrap.restUrl+"deploy/component/"+self.component.id+"/componentTemplate/"+template.version;
                }
                else {
                    templateURI = bootstrap.restUrl+"deploy/componentTemplate/"+template.id+"/"+template.version;
                }

                // If the template selected is already available to us, no need to make a rest call
                xhr.get({
                    url: templateURI,
                    handleAs: "json",
                    load: function(data) {
                        template = data;
                        self.showTemplatePropDefs(template);
                        if (template.componentType) {
                            self.existingValues.componentType = template.componentType;
                            self.existingValues.ignoreQualifiers = template.ignoreQualifiers;
                            self.showComponentTypeSpecificFields(template);
                        }
                        else {
                            self.unblock();
                        }
                    }
                });

            }
            else {
                self.showComponentTypeSpecificFields(template);
            }
        },

        showComponentTypeSpecificFields: function(template) {
            this.addComponentTypeField(!!template);
            this.showSourceConfigProperties(template); // ignores template if null
            if(this.existingValues.componentType === "ZOS") {
                this.removeSourceConfigPropertiesForZos();
                this.showIgnoreQualifiers(template); // ignores template if null
                this.addInvisibleIncrementalVersionTypeField();
            }
        },

        /**
         *
         */
        showSourceConfigProperties: function(template) {
            var self = this;
            var initialValue = null;

            if (this.existingValues.sourceConfigPlugin) {
                initialValue = this.existingValues.sourceConfigPlugin.id;
            }

            if (this.mode === "firstDayWizard" &&
                this.existingValues.sourceConfigPlugin) {
                initialValue = this.existingValues.sourceConfigPlugin;
            }

            if (template && template.sourceConfigPlugin) {
                initialValue = template.sourceConfigPlugin.id;
            }

            this.form.addField({
                name: "sourceConfigPlugin",
                type: "TableFilterSelect",
                label: i18n("Source Configuration Type"),
                url: bootstrap.restUrl+"plugin/sourceConfigPlugin",
                description: i18n("The source configuration plugin to use for this component."),
                idProperty: function(item) {
                    return item.name;
                },
                value: initialValue,
                readOnly: (!!template && !!template.sourceConfigPluginName),
                allowNone: true,
                defaultQuery: {
                    outputType: ["BASIC", "LINKED", "EXTENDED"]
                },
                onChange: function(value, item) {
                    array.forEach(self.sourceConfigPropertyNames, function(propertyName) {
                        self.form.removeField(propertyName);
                    });
                    self.sourceConfigPropertyNames = [];

                    if (item) {
                        var groupName = item.componentPropSheetDef.name;
                        array.forEach(item.componentPropDefs, function(propDef) {
                            // Use the configured value if present.
                            var templateHadProperty = false;
                            if (!!template && !!template.sourceConfigProperties) {
                                var templateExistingValue = util.getNamedProperty(template.sourceConfigProperties, propDef.name);
                                if (!!templateExistingValue) {
                                    propDef.value = templateExistingValue.value;
                                    templateHadProperty = true;
                                }
                            }

                            if (!!self.existingValues.properties && !templateHadProperty) {
                                var existingValue = util.getNamedProperty(self.existingValues.properties, groupName+"/"+propDef.name);
                                if (existingValue) {
                                    propDef.value = existingValue.value;
                                }
                            }

                            if (self.mode === "firstDayWizard" && !!self.existingValues.properties) {
                                var keyName = groupName + "/" + propDef.name;
                                var value = self.existingValues.properties[keyName];
                                if (value) {
                                    propDef.value = value;
                                }
                            }

                            // Clone the prop def so we can change its name temporarily.
                            var propDefCopy = util.clone(propDef);

                            // Use a special prefix to separate these from other fields.
                            var propDefName = groupName+"/"+propDef.name;
                            propDefCopy.name = propDefName;
                            propDefCopy.translate = true;
                            self.sourceConfigPropertyNames.push(propDefName);

                            if (!!template) {
                                if (!!template.sourceConfigProperties) {
                                    if (!!util.getNamedProperty(template.sourceConfigProperties, propDef.name)) {
                                        propDefCopy.readOnly = true;
                                    }
                                }
                                else if (!!self.existingValues.templateSourceProperties) {
                                    if (!!util.getNamedProperty(self.existingValues.templateSourceProperties, propDef.name)) {
                                        propDefCopy.readOnly = true;
                                    }
                                }
                            }

                            if (propDefCopy.label.indexOf("URL") > -1 || propDefCopy.label.indexOf(" Url") > -1 ) {
                                propDefCopy.textDir = "ltr";
                            }
                            else if (propDefCopy.label.indexOf("Vob Location") > -1 || propDefCopy.label.indexOf("Path") > -1) {
                                propDefCopy.textDir = "ltr";
                            }

                            self.form.addField(propDefCopy, "_sourceProperties");
                        });
                        self.addVersionImportFields(item.importPropSheetDef, item.importPropDefs, item.componentPropDefs);
                    }
                    self.unblock();
                    if (self.mode === "firstDayWizard") {
                        FirstDayWizardUtil.boldLabelsOfRequiredFields();
                        self._showOrHideAdvancedConfigurationAsSpecified();
                    }
                },
                onFilterResult: function(result) {
                    var filterResult = [];
                    if (self.form.getValue("componentType") === "ZOS") {
                        array.forEach(result, function(plugin) {
                            if (/^[zZ][oO][sS]/.test(plugin.name)) {//Every source config plug-in for z/OS should start with 'zOS'
                                filterResult.push(plugin);
                            }
                        });
                    }
                    else {
                        filterResult = result;
                    }
                    return filterResult;
                },
                onSetItem: function(value, item) {
                    self.unblock();
                }
            }, "_sourceProperties");

            var existingIntegrationValue = "inherit";
            if (this.existingValues.integrationTag) {
                existingIntegrationValue = "tag";
            }
            else if (this.existingValues.integrationAgent) {
                existingIntegrationValue = "agent";
            }
            this.form.addField({
                name: "importAgentType",
                type: "Radio",
                label: "",
                value: existingIntegrationValue,
                allowedValues: [{
                    "label": i18n("Use the system's default version import agent/tag."),
                    "value": "inherit"
                },{
                    "label": i18n("Import new component versions using a single agent."),
                    "value": "agent"
                },{
                    "label": i18n("Import new component versions using any agent with the specified tag."),
                    "value": "tag"
                }],
                onChange: function(value) {
                    self.removeIntegrationTagField();
                    self.removeIntegrationAgentField();

                    if (value === "tag") {
                        self.addIntegrationTagField();
                    }
                    else if (value === "agent") {
                        self.addIntegrationAgentField();
                    }
                }
            }, "_integrationProperties");

            if (existingIntegrationValue === "tag") {
                this.addIntegrationTagField();
            }
            else if (existingIntegrationValue === "agent") {
                this.addIntegrationAgentField();
            }

            this.form.addField({
                name: "importAutomatically",
                label: i18n("Import Versions Automatically"),
                description: i18n("If this is checked, the configured version source will be polled periodically for new versions."),
                type: "Checkbox",
                value: this.existingValues.importAutomatically
            }, "_sourceStandardProperties");

            this.form.addField({
                name: "useVfs",
                label: i18n("Copy to CodeStation"),
                description: i18n("If this is checked, artifacts will be copied from the given source into the server's CodeStation repository, from which they can be retrieved during deployments."),
                type: "Checkbox",
                value: this.existingValues.useVfs
            }, "_sourceStandardProperties");

            this.form.addField({
                name: "defaultVersionType",
                label: i18n("Default Version Type"),
                description: i18n("The type of versions to create by default on version imports."),
                required: true,
                type:"Select",
                allowedValues: [{
                    label: i18n("Full"),
                    value: "FULL"
                },{
                    label: i18n("Incremental"),
                    value: "INCREMENTAL"
                }],
                value: this.existingValues.defaultVersionType
            }, "_sourceStandardProperties");


            if (this.mode !== "firstDayWizard") {
                this.form.addField({
                    name: "runVersionCreationProcess",
                    label: i18n("Run Process after a Version is Created"),
                    type: "Checkbox",
                    value: !!this.existingValues.versionCreationProcessId,
                    onChange: function(value) {
                        if (value) {
                            self.showProcessOptions();
                        }
                        else {
                            self.hideProcessOptions();
                        }
                    }
                });
            }

            this.form.addField({
                name: "_versionCreationProcessInsert",
                type: "Invisible"
            });

            if (!!this.existingValues.versionCreationProcessId) {
                this.showProcessOptions();
            }
            else {
                this.hideProcessOptions();
            }

            self.unblock();
        },

        showIgnoreQualifiers: function(template) {
            this.form.addField({
                name: "ignoreQualifiers",
                label: i18n("High Level Qualifier Length"),
                required: false,
                readOnly: !!template,
                type: "Text",
                textDir: "ltr",
                value: (!this.existingValues.ignoreQualifiers ? "0" : this.existingValues.ignoreQualifiers)
            }, "_componentTypeInsert");
        },

        showTemplatePropDefs: function(template) {
            var self = this;

            array.forEach(template.propDefs, function(propDef) {
                var propDefCopy = util.clone(propDef);
                propDefCopy.name = "template/"+propDef.name;
                if (propDef.pattern) {
                    propDefCopy.description += i18n(" Required Pattern: %s", util.escape(propDef.pattern));
                }

                util.populatePropValueAndLabel(self.existingValues.properties, propDefCopy);

                self.form.addField(propDefCopy, "_templateProperties");
                self.templatePropertyNames.push(propDefCopy.name);
                self.templatePropertyPatterns.push(propDefCopy.pattern);
            });
        },

        showCleanupFields: function() {
            var initialCleanupDaysToKeep = this.existingValues.cleanupDaysToKeep;
            var initialCleanupCountToKeep = this.existingValues.cleanupCountToKeep;

            if (initialCleanupDaysToKeep === 0 && initialCleanupCountToKeep === 0) {
                initialCleanupDaysToKeep = this.existingValues.systemCleanupDaysToKeep;
                initialCleanupCountToKeep = this.existingValues.systemCleanupCountToKeep;
            }

            this.form.addField({
                name: "cleanupDaysToKeep",
                label: i18n("Days to Keep Versions"),
                description: i18n("Number of days to keep component versions. -1 will keep indefinitely."),
                value: initialCleanupDaysToKeep,
                required: true,
                textDir: "ltr",
                type: "Text"
            }, "_cleanupSettings");

            this.form.addField({
                name: "cleanupCountToKeep",
                label: i18n("Number of Versions to Keep"),
                description: i18n("Number of versions to keep for each component. -1 will keep all."),
                value: initialCleanupCountToKeep,
                required: true,
                textDir: "ltr",
                type: "Text"
            }, "_cleanupSettings");
        },

        showProcessOptions: function() {
            var applicationProcessSelect = new RestSelect({
                restUrl: bootstrap.restUrl+"deploy/application/processes/forComponent/"+this.existingValues.id,
                getLabel: function(item) {
                    return item.application.name + " - " + item.name;
                },
                value: this.existingValues.versionCreationProcessId
            });
            this.form.addField({
                name: "versionCreationProcessId",
                label: i18n("Application Process"),
                widget: applicationProcessSelect,
                required: true
            }, "_versionCreationProcessInsert");

            var environmentSelect = new RestSelect({
                restUrl: bootstrap.restUrl+"deploy/application/environments/forComponent/"+this.existingValues.id,
                getLabel: function(item) {
                    return item.application.name + " - " + item.name;
                },
                value: this.existingValues.versionCreationEnvironmentId
            });
            this.form.addField({
                name: "versionCreationEnvironmentId",
                label: i18n("Environment"),
                widget: environmentSelect,
                required: true
            }, "_versionCreationProcessInsert");
        },

        hideProcessOptions: function() {
            if (this.form.hasField("versionCreationProcessId")) {
                this.form.removeField("versionCreationProcessId");
            }

            if (this.form.hasField("versionCreationEnvironmentId")) {
                this.form.removeField("versionCreationEnvironmentId");
            }
        },

        validatePattern: function(value, pattern) {
            var regex = new RegExp(pattern);
            var result = true;
            if (!regex.exec(value)) {
                result = false;
            }
           return result;
        },

        /**
         *
         */
        addIntegrationAgentField: function() {
            var self = this;

            var existingAgentId;
            if (this.existingValues.integrationAgent) {
                existingAgentId = this.existingValues.integrationAgent.id;
            }

            this.form.addField({
                name: "integrationAgent",
                label: i18n("Agent for Version Imports"),
                description: i18n("The agent to use for version imports on this component"),
                type: "FilteringSelect",
                url: bootstrap.restUrl+"agent",
                defaultQuery: {
                    filterFields: "requiredActions",
                    filterType_requiredActions: "eq",
                    filterValue_requiredActions: security.agent.manageVersionImports
                },
                value: existingAgentId
            }, "_integrationProperties");
        },

        /**
         *
         */
        addIntegrationTagField: function() {
            var self = this;

            var tagName = "";
            if (this.existingValues.integrationTag && this.existingValues.integrationTag.name) {
                tagName = this.existingValues.integrationTag.name;
            }

            var tags = [];
            xhr.get({
                url: bootstrap.restUrl+"tag/type/Agent",
                sync: true,
                handleAs: "json",
                load: function(results) {
                    tags = results;
                }
            });
            var mStore = new Memory( { "data": tags } );

            var tagSelect = new ComboBox({
                store: mStore,
                searchAttr: "name",
                value: tagName,
                noDataMessage: i18n("No tags found."),
                autoComplete: false,
                selectOnClick: true,
                pageSize: "10"
            });

            this.form.addField({
                name: "integrationTag",
                label: i18n("Agent Tag for Version Imports"),
                widget: tagSelect,
                description: i18n("The tag to use for version imports on this component")
            }, "_integrationProperties");
        },

        /**
         *
         */
        removeIntegrationAgentField: function() {
            this.form.removeField("integrationAgent");
        },

        /**
         *
         */
        removeIntegrationTagField: function() {
            this.form.removeField("integrationTag");
        },

        addSourcePropertiesHeader: function() {
            if (!this.form.hasField("_sourcePropertiesHeader")) {
                this.form.addField({
                    name: "_sourcePropertiesHeader",
                    type: "SectionLabel",
                    value: i18n("Version Source Configuration")
                }, "_sourceProperties");
            }
        },

        removeIgnoreQualifiers: function() {
            this.form.removeField("ignoreQualifiers");
        },

        removeSourcePropertiesHeader: function() {
            this.form.removeField("_sourcePropertiesHeader");
        },

        removeSourceConfigProperties: function() {
            this.form.removeField("sourceConfigPlugin");
            this.form.removeField("importAutomatically");
            this.form.removeField("useVfs");
            this.form.removeField("defaultVersionType");
            this.form.removeField("runVersionCreationProcess");
            this.form.removeField("importAgentType");
        },

        removeSourceConfigPropertiesForZos: function() {
            this.form.removeField("importAutomatically");
            this.form.removeField("useVfs");
            this.form.removeField("defaultVersionType");
        },

        /**
        *
        */
       removeSourceConfigFields: function() {
           var arrayLength = this.sourceConfigPropertyNames.length;
           var i;
           for (i = 0; i < arrayLength; i++) {
               this.form.removeField(this.sourceConfigPropertyNames[i]);
           }
           this.sourceConfigPropertyNames = [];
       },

        addInvisibleIncrementalVersionTypeField: function() {
            this.form.addField({
                name: "defaultVersionType",
                type:"Invisible",
                value: "INCREMENTAL"
            });
        },

        addComponentTypeField: function(isReadOnly) {
            var self = this;
            if(this.form.hasField("componentType")) {
                this.form.removeField("componentType");
            }

            this.form.addField({
                name: "componentType",
                label: i18n("Component Type"),
                description: i18n("The Type of Component."),
                type: "Select",
                allowedValues: [{
                    label: i18n("Standard"),
                    value: "STANDARD"
                },{
                    label: i18n("z/OS"),
                    value: "ZOS"
                }],
                value: self.existingValues.componentType,
                readOnly: !!isReadOnly,
                onChange: function (value) {
                    self.existingValues.componentType = value;
                    self.removeSourceConfigProperties();
                    self.removeSourceConfigFields();
                    if (value==="ZOS") {
                        self.showSourceConfigProperties();
                        self.removeSourceConfigPropertiesForZos();
                        self.showIgnoreQualifiers();
                        self.addInvisibleIncrementalVersionTypeField();
                    }
                    else {
                        self.removeIgnoreQualifiers();
                        self.showSourceConfigProperties();
                    }
                }
            },"_componentTypeInsert");
        },

        addVersionImportHeader: function() {
            this.form.addField({
                name: "_versionImportHeader",
                type: "SectionLabel",
                value: i18n("Version Import")
            });
        },

        addVersionImportFields: function(importPropSheetDef, importPropDefs, componentPropDefs) {
            var self = this;
            if (this.mode === "firstDayWizard") {
                self.form.removeField("_versionImportHeader");
                array.forEach(self.versionImportPropertyNames, function(propertyName) {
                    self.form.removeField(propertyName);
                });
                self.versionImportPropertyNames = [];

                var groupName = importPropSheetDef.name;

                if (importPropDefs.length > 0) {
                    this.addVersionImportHeader();
                    array.forEach(importPropDefs, function(propDef) {
                        var propDefCopy = util.clone(propDef);

                        //avoid multiple "Name" labels showing in the same form
                        if (propDefCopy.label === "Name") {
                            propDefCopy.label = "Version Name";
                        }

                        var propDefName = groupName + "/" +propDef.name;
                        propDefCopy.name = propDefName;
                        propDefCopy.translate = true;
                        self.versionImportPropertyNames.push(propDefName);
                        if (self.existingValues) {
                            var value = self.existingValues[propDefName];
                            if (value) {
                                propDefCopy.value = value;
                            }
                        }
                        self.form.addField(propDefCopy);
                    });
                }
            }
        }
    });
});
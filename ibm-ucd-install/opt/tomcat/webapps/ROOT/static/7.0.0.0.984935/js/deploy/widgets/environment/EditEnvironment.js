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
        "dojo/dom-construct",
        "js/webext/widgets/Alert",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/DialogMultiSelect",
        "js/webext/widgets/RestSelect",
        "deploy/widgets/Formatters",
        "deploy/widgets/security/TeamSelector",
        "deploy/widgets/resource/ResourceSelector",
        "deploy/widgets/environment/EditLandscaperEnvironmentWizardPane",
        "deploy/widgets/environment/EditEnvironmentBlueprintWizardPane"
    ],
    function(
        _TemplatedMixin,
        _Widget,
        array,
        declare,
        xhr,
        domConstruct,
        Alert,
        ColumnForm,
        DialogMultiSelect,
        RestSelect,
        Formatters,
        TeamSelector,
        ResourceSelector,
        EditLandscaperEnvironmentWizardPane,
        EditEnvironmentBlueprintWizardPane
    ) {
        return declare([_Widget, _TemplatedMixin], {
            templateString: '<div class="editEnvironment">' +
                '  <div data-dojo-attach-point="formAttach"></div>' +
                '</div>',

            // Initialize arrays to be used later
            templatePropertyNames: [],
            templatePropertyPatterns: [],
            showCancel: true,

            /**
             *
             */
            postCreate: function() {
                this.inherited(arguments);
                var self = this;

                this.existingValues = {
                    color: "#ffffff",
                    snapshotDaysToKeep: 0,
                    cleanupDaysToKeep: 0,
                    cleanupCountToKeep: 0,
                    enableProcessHistoryCleanup: true,
                    useSystemDefaultDays: true
                };
                if (this.environment) {
                    this.existingValues = this.environment;
                }
                else if (this.source) {
                    xhr.get({
                        "url": bootstrap.restUrl + "deploy/environment/" + this.source.id,
                        "handleAs": "json",
                        "sync": true,
                        "load": function(data) {
                            self.source = data;
                        }
                    });
                    this.existingValues = this.source;
                }
                else {
                    xhr.get({
                        "url": bootstrap.restUrl + "security/teamsWithCreateAction/Environment",
                        "handleAs": "json",
                        "sync": true,
                        "load": function(data) {
                            var extendedSecurity = {
                                "teams": data
                            };
                            self.existingValues.extendedSecurity = extendedSecurity;
                        }
                    });
                }

                this.form = new ColumnForm({
                    submitUrl: bootstrap.restUrl + "deploy/environment",
                    readOnly: self.readOnly,
                    showButtons: (this.environment || this.source) && (self.mode !== "firstDayWizard"),
                    postSubmit: function(data) {
                        if (self.callback !== undefined) {
                            self.callback();
                        }
                    },
                    addData: function(data) {
                        data.applicationId = self.application.id;
                        if (self.environment) {
                            data.existingId = self.environment.id;
                        }
                        if (self.source) {
                            data.copyId = self.source.id;
                        }
                        if (data.snapshotLockType === "SYSTEM_DEFAULT") {
                            delete data.snapshotLockType;
                        }
                        if (self.mode !== "firstDayWizard") {
                            data.teamMappings = self.teamSelector.teams;
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
                    validateFields: function(data) {
                        var result = [];
                        array.forEach(self.templatePropertyNames, function(i) {
                            var propertyName = self.templatePropertyNames[i];
                            var propertyPattern = self.templatePropertyPatterns[i];
                            var propertyValue = data[propertyName];

                            if (propertyPattern && propertyValue) {
                                if (!self.validatePattern(propertyValue, propertyPattern)) {
                                    result.push(i18n(
                                            "Value for property %s does not follow the required pattern.",
                                            propertyName));
                                }
                            }
                        });

                        if (!!data.snapshotDaysToKeep) {
                            var snapshotDaysToKeep = parseInt(data.snapshotDaysToKeep, 10);
                            if (isNaN(snapshotDaysToKeep)) {
                                result.push(i18n("The application snapshot cleanup days to keep must be an integer."));
                            }
                            else if (snapshotDaysToKeep < -1) {
                                result.push(i18n("The application snapshot cleanup days to keep must be greater than or equal to -1"));
                            }
                            else {
                                data.snapshotDaysToKeep = snapshotDaysToKeep;
                            }
                        }

                        if (!!data.historyCleanupDaysToKeep) {
                            if (!new RegExp("^[0-9]+$").test(data.historyCleanupDaysToKeep)) {
                                result.push(i18n("The Days to Keep Process History must be an " +
                                        "integer, 0 or greater."));
                            }
                        }
                        return result;
                    },
                    cancelLabel: self.showCancel ? i18n("Cancel") : null
                });

                this.form.addField({
                    name: "name",
                    label: i18n("Name"),
                    required: true,
                    type: "Text",
                    value: (this.source) ? undefined : this.existingValues.name,
                    onChange: function(value) {
                        if (self.mode === "firstDayWizard") {
                            self.firstDayWizardModel.set("pre_setEnvironmentName",
                                                     {environment: self.environment,
                                                          newName: value});

                        }
                    }
                });

                this.form.addField({
                    name: "description",
                    label: i18n("Description"),
                    type: "Text",
                    value: this.existingValues.description
                });

                if (!this.environment && !this.source) {
                    self.form.addField({
                        name: "_templateInsert",
                        type: "Invisible"
                    });

                    this.form.addField({
                        type: "Invisible",
                        name: "_blueprintInsert"
                    });

                    this._addBlueprintField();

                    this.form.addField({
                        type: "Invisible",
                        name: "_baseResourceInsert"
                    });
                }

                if (this.mode !== "firstDayWizard") {
                    var currentTeams = [];
                    if (!!self.existingValues && !!self.existingValues.extendedSecurity && !!self.existingValues.extendedSecurity.teams) {
                        currentTeams = self.existingValues.extendedSecurity.teams;
                    }
                    self.teamSelector = new TeamSelector({
                        resourceRoleType: "Environment",
                        noneLabel: i18n("Standard Environment"),
                        teams: currentTeams
                    });
                    this.form.addField({
                        name: "teams",
                        label: i18n("Teams"),
                        type: "Text",
                        widget: self.teamSelector
                    });
                }

                self.form.addField({
                    name: "_settingsInsert",
                    type: "Invisible"
                });

                self.form.addField({
                    name: "_templateProperties",
                    type: "Invisible"
                });

                if (self.application.templateId) {
                    self.addTemplateFields();
                }
                else {
                    self.addSettingsFields();
                }

                this.form.placeAt(this.formAttach);
            },

            _showSnapshotLockType: function(template) {
                var snapshotLockTypeOptions = {
                    "ALL": i18n("Component Versions and Configuration"),
                    "VERSIONS": i18n("Only Component Versions"),
                    "CONFIGURATION": i18n("Only Configuration")
                };

                this.form.addField({
                    name: "snapshotLockType",
                    label: i18n("Snapshot Lock Type"),
                    readOnly: !!template,
                    description: i18n("This setting determines which contents of a snapshot are locked " +
                        "when it is included in a deployment to this environment. Anything left " +
                        "unlocked can still be changed after the snapshot has been deployed."),
                    required: true,
                    value: this.existingValues.snapshotLockType || "SYSTEM_DEFAULT",
                    type: "Select",
                    allowedValues: [{
                        label: i18n("System Default (%s)",
                            snapshotLockTypeOptions[config.data.systemConfiguration.defaultSnapshotLockType]),
                        value: "SYSTEM_DEFAULT"
                    }, {
                        label: snapshotLockTypeOptions.ALL,
                        value: "ALL"
                    }, {
                        label: snapshotLockTypeOptions.VERSIONS,
                        value: "VERSIONS"
                    }, {
                        label: snapshotLockTypeOptions.CONFIGURATION,
                        value: "CONFIGURATION"
                    }]
                }, "_snapshotLockTypeInsert");
            },

            _addBlueprintField: function() {
                var self = this;

                this.form.addField({
                    name: "blueprintId",
                    label: i18n("Blueprint"),
                    type: "TableFilterSelect",
                    url: bootstrap.restUrl + "deploy/application/" + this.application.id + "/blueprints/all",
                    storeType: "Memory",
                    allowNone: true,
                    pageSize: 10000, // Because the url doesn't honor X-Range
                    formatDropDownLabel: Formatters.environmentBlueprintDropDownFormatter,
                    onChange: function(value, item) {
                        if (value) {
                            if (item.source === "landscaper") {
                                self._handleLandscaperBlueprints(value, item);
                            }
                            else {
                                self._handleUcdBlueprints(value);
                            }
                        }
                        else {
                            this.value = undefined;
                            self._removeBlueprintFields();
                        }
                    }
                }, "_blueprintInsert");
            },

            _removeBlueprintFields: function() {
                var self = this;
                if (self.form.hasField("baseResourceId")) {
                    self.form.removeField("baseResourceId");

                    self.form.onSubmit = undefined;
                }
                else {
                    self.form.onSubmit = undefined;
                }
                if (this.blueprintWizardPane) {
                    self.dialog.wizard.removeChild(this.blueprintWizardPane);
                    this.blueprintWizardPane.destroyRecursive();
                    this.blueprintWizardPane = null;
                }
                self.dialog.wizard.selectedChildWidget.attachDoneFunction();
                self.dialog.wizard.selectedChildWidget.isLastChild = true;
                self.dialog.wizard.doneButton.set("label", "Save");
                self.dialog.wizard.resize();
                self.dialog.wizard.selectedChildWidget.refreshWizardIcons();
            },

            _handleLandscaperBlueprints: function(value, item) {
                var self = this;
                if (self.form.hasField("baseResourceId")) {
                    self.form.removeField("baseResourceId");
                }

                if (this.blueprintWizardPane) {
                    self.dialog.wizard.removeChild(this.blueprintWizardPane);
                    this.blueprintWizardPane.destroyRecursive();
                    this.blueprintWizardPane = null;
                }

                var data = self.form.getData();
                this.blueprintWizardPane = new EditLandscaperEnvironmentWizardPane({
                    environmentData: data,
                    blueprint: item,
                    dialog: this.dialog,
                    application: this.application
                }).placeAt(self.dialog.wizard);
                self.dialog.wizard.selectedChildWidget.detachDoneFunction();
                self.dialog.wizard.selectedChildWidget.isLastChild = false;
                self.dialog.wizard.doneButton.set("label", "Create");
                self.dialog.wizard.resize();
                self.dialog.wizard.selectedChildWidget.refreshWizardIcons();
            },

            _handleUcdBlueprints: function(value) {
                var self = this;

                var resourceSelect = new ResourceSelector({
                    url: bootstrap.restUrl + "resource/resource/tree",
                    isSelectable: function(resource) {
                        return !resource.hasAgent && resource.security["Manage Children"] && resource.security["Create Resources"];
                    }
                });
                if (!self.form.hasField("baseResourceId")) {
                    self.form.addField({
                        name: "baseResourceId",
                        label: i18n("Base Resource"),
                        widget: resourceSelect,
                        required: true,
                        description: i18n("Choose a resource node in which the resources for " +
                            "this environment should be created.")
                    }, "_baseResourceInsert");
                }

                if (this.blueprintWizardPane) {
                    self.dialog.wizard.removeChild(this.blueprintWizardPane);
                    this.blueprintWizardPane.destroyRecursive();
                    this.blueprintWizardPane = null;
                }

                var blueprintRequiredValues = [];
                xhr.get({
                    url: bootstrap.restUrl + "resource/resourceTemplate/" + value + "/requiredValues",
                    sync: true,
                    handleAs: "json",
                    load: function(requiredValues) {
                        blueprintRequiredValues = requiredValues;
                    }
                });

                if (blueprintRequiredValues.length) {
                    var data = self.form.getData();
                    this.blueprintWizardPane = new EditEnvironmentBlueprintWizardPane({
                        environmentData: data,
                        blueprintId: value,
                        dialog: this.dialog,
                        requiredValues: blueprintRequiredValues,
                        application: this.application
                    }).placeAt(self.dialog.wizard);

                    self.dialog.wizard.selectedChildWidget.detachDoneFunction();
                    self.dialog.wizard.selectedChildWidget.isLastChild = false;
                    self.dialog.wizard.doneButton.set("label", "Create");

                }
                else {
                    self.dialog.wizard.selectedChildWidget.attachDoneFunction();
                    self.dialog.wizard.selectedChildWidget.isLastChild = true;
                    self.dialog.wizard.doneButton.set("label", "Save");
                }
                self.dialog.wizard.selectedChildWidget.refreshWizardIcons();
                self.dialog.wizard.resize();
            },

            showCleanupFields: function(template) {
                var self = this;

                this.form.addField({
                    name: "snapshotDaysToKeep",
                    label: i18n("Days to Retain Application Snapshots"),
                    readOnly: !!template,
                    description: i18n("The number of days to retain snapshots after they are no longer " +
                            "the most recently deployed snapshot in this environment. The most recently " +
                            "deployed snapshot is always retained. To retain application snapshots indefinitely," +
                            " enter -1. To use the system default retention value, enter 0."),
                    value: this.existingValues.snapshotDaysToKeep,
                    required: true,
                    textDir: "ltr",
                    type: "Text"
                },"enableProcessHistoryCleanup");

                this.form.addField({
                    name: "cleanupDaysToKeep",
                    label: i18n("Days to Retain Versions"),
                    readOnly: !!template,
                    description: i18n("The number of days to retain component versions.  " +
                            "To retain component versions indefinitely, enter - 1. " +
                            "To use the system default retention value, enter 0."),
                    value: this.existingValues.cleanupDaysToKeep,
                    required: true,
                    textDir: "ltr",
                    type: "Text"
                },"enableProcessHistoryCleanup");

                this.form.addField({
                    name: "cleanupCountToKeep",
                    label: i18n("Number of Versions to Retain"),
                    readOnly: !!template,
                    description: i18n("The number of versions to retain for each component. " +
                            "To retain all component versions, enter -1. To use the system " +
                            "default retention value, enter 0."),
                    value: this.existingValues.cleanupCountToKeep,
                    required: true,
                    textDir: "ltr",
                    type: "Text"
                },"enableProcessHistoryCleanup");
            },

            showHistoryCleanupFields: function(template) {
                var self = this;

                if (this.form.fields.enableProcessHistoryCleanup){
                    this.form.removeField("enableProcessHistoryCleanup");
                }

                this.form.addField({
                    name: "enableProcessHistoryCleanup",
                    label: i18n("Use Deployment History Cleanup"),
                    description: i18n("Select to use deployment history cleanup " +
                        "for this environment. If selected, the deployment history " +
                        "records in this environment are deleted according to the " +
                        "values that you set."),
                    value: !!this.existingValues.enableProcessHistoryCleanup,
                    textDir: "ltr",
                    type: "Checkbox",
                    readOnly: !!template,
                    onChange : function(value){
                        self.showUseSystemDefaultDays(value);
                        if (!value) {
                            self.showHistoryCleanupDaysToKeep(value, template);
                        }
                    }
                });

                if (!!this.existingValues.enableProcessHistoryCleanup) {
                    self.showUseSystemDefaultDays(true, template);
                }
            },

            showUseSystemDefaultDays: function(show, template){
                var self = this;
                if (show) {
                    this.form.addField({
                        name: "useSystemDefaultDays",
                        label: i18n("Use Default Deployment History Retention"),
                        description: i18n("Select to retain the deployment history for " +
                            "the number of days that the administrator set."),
                        value: !!this.existingValues.useSystemDefaultDays,
                        textDir: "ltr",
                        type: "Checkbox",
                        readOnly: !!template,
                        onChange : function(value){
                            self.showHistoryCleanupDaysToKeep(!value, template );
                        }
                    });
                     if(!this.existingValues.useSystemDefaultDays) {
                        self.showHistoryCleanupDaysToKeep(true, template);
                     }
                }
                else {
                    this.form.removeField("useSystemDefaultDays");
                }
            },

            showHistoryCleanupDaysToKeep: function(show, template){
                if (show) {
                    this.form.addField({
                        name: "historyCleanupDaysToKeep",
                        label: i18n("Days to Retain Deployment History "),
                        description: i18n("The number of days to retain application deployment " +
                            "history. Valid range is 0 or greater"),
                        value: this.existingValues.historyCleanupDaysToKeep,
                        required: true,
                        textDir: "ltr",
                        type: "Number",
                        readOnly: !!template
                    });
                }
                else {
                    if (this.form.hasField("historyCleanupDaysToKeep")) {
                        this.form.removeField("historyCleanupDaysToKeep");
                    }
                }
            },

            /**
             *
             */
            addTemplateFields: function() {
                var self = this;
                var initialized = false;

                // Setting up boolean values for below logic.
                var canCreate = config.data.permissions[security.system.createEnvironments];
                var canCreateWithTemplate
                        = config.data.permissions[security.system.createEnvironmentsFromTemplate];
                var emptyForm = !self.environment && !self.source;
                var edittingWithTemplate = (self.environment && self.environment.template)
                        || self.environmentTemplate;

                if (emptyForm && canCreateWithTemplate) {
                    var templateSelect = new RestSelect({
                        restUrl: bootstrap.restUrl + "deploy/applicationTemplate/" +
                                self.application.templateId + "/" +
                                self.application.templateVersion + "/environmentTemplates",
                        onChange: function(value, item) {

                            if (item) {
                                if (self.form.hasField("blueprintId")) {
                                    // Using an environment template means this is no longer valid
                                    self.form.removeField("blueprintId");
                                    self._removeBlueprintFields();
                                }
                                self.selectTemplate(item);
                            }
                            else {
                                // we don't want to call these when creating the widget
                                if (initialized) {
                                    self.resetExistingValues();
                                    self.removeTemplatePropDefFields();
                                    self.removeSettingsFields();
                                    self._addBlueprintField();
                                }
                                else {
                                    initialized = true;
                                }
                                self.addSettingsFields();
                            }
                        }
                    });

                    self.form.addField({
                        name: "templateId",
                        label: i18n("Environment Template"),
                        description: i18n("The template to use for this environment"),
                        required: !canCreate,
                        widget: templateSelect
                    }, "_templateInsert");
                }
                else if (edittingWithTemplate) {
                    // We don't support changing the template after its set
                    // Show read only text field for template
                    self.form.addField({
                        name: "templateName",
                        label: i18n("Template"),
                        description: i18n("The template to use for this environment"),
                        readOnly: true,
                        type: "Text",
                        value: self.existingValues.template.name
                    }, "_templateInsert");

                    self.selectTemplate(self.existingValues.template);
                }
                else {
                    self.removeTemplatePropDefFields();
                    if (self.source && self.source.template) {
                        self.addSettingsFields(self.source.template);
                    } else {
                        self.addSettingsFields();
                    }
                }
            },

            /**
             *
             */
            selectTemplate: function(template) {
                var self = this;

                self.removeTemplatePropDefFields();

                // Reload the template so we have all of the propDefs
                if (template) {
                    var restUrl = bootstrap.restUrl + "deploy/environmentTemplate/" +
                                template.id + "/" + template.version;

                    xhr.get({
                        "url": restUrl,
                        "handleAs": "json",
                        "load": function(data) {
                            self.existingValues.color = data.color;
                            self.existingValues.snapshotDaysToKeep = data.snapshotDaysToKeep;
                            self.existingValues.cleanupCountToKeep = data.cleanupCountToKeep;
                            self.existingValues.cleanupDaysToKeep = data.cleanupDaysToKeep;
                            self.existingValues.historyCleanupDaysToKeep =
                                data.historyCleanupDaysToKeep;
                            self.existingValues.lockSnapshots = data.lockSnapshots;
                            self.existingValues.snapshotLockType = data.snapshotLockType;
                            self.existingValues.requireApprovals = data.requireApprovals;
                            self.existingValues.noSelfApprovals = data.noSelfApprovals;
                            self.existingValues.exemptProcesses = data.exemptProcesses;
                            self.existingValues.requireSnapshot = data.requireSnapshot;

                            self.addTemplatePropDefFields(data);
                            self.addSettingsFields(data);
                        }
                    });
                }
            },

            addTemplatePropDefFields: function(template) {
                var self = this;

                array.forEach(template.propDefs, function(propDef) {
                    var propDefCopy = util.clone(propDef);
                    propDefCopy.name = "template/" + propDef.name;
                    if (propDef.pattern) {
                        propDefCopy.description += i18n(" Required Pattern: %s", propDef.pattern);
                    }

                    util.populatePropValueAndLabel(self.existingValues.properties, propDefCopy);

                    self.form.addField(propDefCopy, "_templateProperties");
                    self.templatePropertyNames.push(propDefCopy.name);
                    self.templatePropertyPatterns.push(propDefCopy.pattern);
                });
            },

            /**
             *
             */
            removeTemplatePropDefFields: function() {
                var self = this;
                array.forEach(self.templatePropertyNames, function(propertyName) {
                    self.form.removeField(propertyName);
                });
            },

            /**
             *
             */
            removeSettingsFields: function() {
                var self = this;
                if (self.form.hasField("requireApprovals")) {
                    self.form.removeField("requireApprovals");
                }
                if (self.form.hasField("noSelfApprovals")) {
                    self.form.removeField("noSelfApprovals");
                }
                if (self.form.hasField("exemptProcesses")) {
                    self.form.removeField("exemptProcesses");
                }
                if (self.form.hasField("color")) {
                    self.form.removeField("color");
                }
                if (self.form.hasField("_snapshotLockTypeInsert")) {
                    self.form.removeField("_snapshotLockTypeInsert");
                }
                if (self.form.hasField("inheritSystemCleanup")) {
                    self.form.removeField("inheritSystemCleanup");
                }
                if (self.form.hasField("snapshotDaysToKeep")) {
                    self.form.removeField("snapshotDaysToKeep");
                }
                if (self.form.hasField("cleanupDaysToKeep")) {
                    self.form.removeField("cleanupDaysToKeep");
                }
                if (self.form.hasField("cleanupCountToKeep")) {
                    self.form.removeField("cleanupCountToKeep");
                }
                if (self.form.hasField("historyCleanupDaysToKeep")) {
                    self.form.removeField("historyCleanupDaysToKeep");
                }
                if (self.form.hasField("snapshotLockType")) {
                    self.form.removeField("snapshotLockType");
                }
                if (self.form.hasField("lockSnapshots")) {
                    self.form.removeField("lockSnapshots");
                }
                if (self.form.hasField("requireSnapshot")) {
                    self.form.removeField("removeSnapshot");
                }
            },

            /**
             * Function to make sure existing values are set to their beginning values when a
             * template is unselected during environment creation.
             */
            resetExistingValues: function(){
                var self = this;
                var security = self.existingValues.extendedSecurity;
                self.existingValues = null;
                self.existingValues = {
                    color: "#ffffff"
                };
                self.existingValues.extendedSecurity = security;
            },

            /**
             *
             */
            addSettingsFields: function(template) {
                var self = this;
                var hasValue = self.environment || self.source || template;

                self.removeSettingsFields();

                if (self.mode !== 'firstDayWizard') {
                    self.form.addField({
                        name: "requireApprovals",
                        label: i18n("Require Approvals"),
                        readOnly: !!template,
                        type: "Checkbox",
                        description: i18n("When this is checked, no versions or snapshots can be deployed to this environment without being approved according to the approval process for this environment."),
                        onChange: function(value) { // conditionally add field for "noSelfApprovals"
                            self.showNoSelfApprovalField(value, template);
                        },
                        value: self.existingValues.requireApprovals
                    });

                    // If initial value of "requiredApprovals" is checked, show "noSelfApprovals".
                    if (self.existingValues.requireApprovals) {
                        self.showNoSelfApprovalField(true, template);
                    }

                    var exemptProcessSelector = new DialogMultiSelect({
                        url: bootstrap.restUrl + "deploy/application/" + self.application.id + "/processes/true",
                        value: self.existingValues.exemptProcesses,
                        getLabel: function(item) {
                            return item.name.escape();
                        },
                        getValue: function(item) {
                            return item.id;
                        },
                        disabled: !!template,
                        noSelectionsLabel: i18n("None")
                    });
                    self.form.addField({
                        name: "exemptProcesses",
                        label: i18n("Exempt Processes"),
                        widget: exemptProcessSelector,
                        description: i18n("Any processes selected here will be exempt from approval, even when the environment normally requires it.")
                    });

                    self.form.addField({
                        name: "lockSnapshots",
                        label: i18n("Lock Snapshots"),
                        readOnly: !!template,
                        type: "Checkbox",
                        description: i18n("When this is checked, all snapshots used in a request to this deployment will be locked to prevent further changes."),
                        value: self.existingValues.lockSnapshots,
                        onChange: function(value) {
                            if (value) {
                                self._showSnapshotLockType(template);
                            }
                            else {
                                self.form.removeField("snapshotLockType");
                            }
                        }
                    });

                    self.form.addField({
                        type: "Invisible",
                        name: "_snapshotLockTypeInsert"
                    });
                    if (self.existingValues.lockSnapshots) {
                        self._showSnapshotLockType(template);
                    }
                }

                self.form.addField({
                    name: "requireSnapshot",
                    label: i18n("Require Snapshot"),
                    readOnly: !!template,
                    type: "Checkbox",
                    description: i18n("If this box is checked, any deployment request must use a snapshot instead of individual versions."),
                    value: self.existingValues.requireSnapshot
                });

                if (config.data.systemConfiguration.safeEditFeatureEnabled) {
                    self.form.addField({
                        name: "_draftProcessInsert",
                        type: "Invisible"
                    });

                    self.form.addField({
                        name: "allowDrafts",
                        label: i18n("Allow process drafts to be deployed"),
                        readOnly: self.readOnly,
                        type: "Checkbox",
                        description: i18n("Process Drafts will be used for the configured components when deploying to this environment."),
                        value: self.existingValues.allowDrafts,
                        onChange: function(value) {
                            if (value) {
                                self.showComponentsUsingDraftsField();
                            }
                            else {
                                self.form.removeField("componentsUsingDrafts");
                            }
                        }
                    }, "_draftProcessInsert");

                    if (self.existingValues.allowDrafts) {
                        self.showComponentsUsingDraftsField();
                    }
                }

                self.form.addField({
                    name: "color",
                    label: i18n("Color"),
                    readOnly: !!template,
                    type: "ColorPicker",
                    value: self.existingValues.color,
                    onChange: function(value) {
                        if (self.mode === "firstDayWizard") {
                            self.environment.set("color", value);
                        }
                    }
                });


                if (self.mode !== 'firstDayWizard') {
                    var useSystemSettings = !hasValue
                        || (self.existingValues.cleanupDaysToKeep === 0
                                && self.existingValues.cleanupCountToKeep === 0
                                && self.existingValues.snapshotDaysToKeep ===0);

                    self.form.addField({
                        name: "inheritSystemCleanup",
                        label: i18n("Use Default Artifact Cleanup Settings"),
                        readOnly: !!template,
                        description: i18n("When selected, this environment uses the artifact " +
                                "cleanup settings for the system or component settings, if available. " +
                                "Clear to provide values for all components and snapshots in this environment."),
                        type: "Checkbox",
                        onChange: function(value) {
                            if (!value) {
                                self.showCleanupFields(template);
                            }
                            else {
                                if (self.form.hasField("cleanupDaysToKeep")) {
                                    self.form.removeField("snapshotDaysToKeep");
                                    self.form.removeField("cleanupDaysToKeep");
                                    self.form.removeField("cleanupCountToKeep");
                                }
                                self.form.validateFields = function(data) {
                                    return [];
                                };
                            }
                        },
                        value: useSystemSettings
                    });
                    self.showHistoryCleanupFields(template);
                    if (!useSystemSettings) {
                        this.showCleanupFields(template);
                    }
                }
            },

            showComponentsUsingDraftsField: function() {
                var self = this;
                self.form.addField({
                    name: "componentsUsingDrafts",
                    label: i18n("Components Using Process Drafts"),
                    readOnly: self.readOnly,
                    type: "TableFilterMultiSelect",
                    description: i18n("The components which will be using drafts when deployed."),
                    url: bootstrap.restUrl+"deploy/application/"+appState.application.id+"/components",
                    value: self.existingValues.componentsUsingDrafts
                }, "_draftProcessInsert");
            },

            /*
             * Add or remove "NoSelfApproval" field, which is dependent on "Require Approvals"
             * being visible and checked (true).
             */
            showNoSelfApprovalField: function(show, template) {
                var self = this;
                if (show) {
                    if (!self.form.hasField("noSelfApprovals")) {
                        self.form.addField({
                            name: "noSelfApprovals",
                            label: i18n("No Self-Approvals"),
                            readOnly: !!template,
                            type: "Checkbox",
                            description: i18n("When this option is selected, users that submit deployment requests cannot approve their own requests."),
                            value: self.existingValues.noSelfApprovals
                        }, "exemptProcesses"); // add before this field
                    }
                }
                else if (self.form.hasField("noSelfApprovals")) {
                    self.form.removeField("noSelfApprovals");
                }
            },

            /**
             *
             */
            submitForm: function() {
                this.form.submitForm();
            }
        });
    });

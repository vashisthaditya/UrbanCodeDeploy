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
        "dojo/dom-construct",
        "js/webext/widgets/Alert",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/DialogMultiSelect",
        "deploy/widgets/Formatters",
        "deploy/widgets/security/TeamSelector"
    ],
    function(
        _TemplatedMixin,
        _Widget,
        declare,
        xhr,
        domConstruct,
        Alert,
        ColumnForm,
        DialogMultiSelect,
        Formatters,
        TeamSelector
    ) {
        return declare([_Widget, _TemplatedMixin], {
            templateString: '<div class="editEnvironment">' +
                '  <div data-dojo-attach-point="formAttach"></div>' +
                '</div>',

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
                if (this.environmentTemplate) {
                    this.existingValues = this.environmentTemplate;
                }
                else if (this.source) {
                    xhr.get({
                        "url": bootstrap.restUrl + "deploy/environmentTemplate/" + this.source.id + "id",
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
                        "url": bootstrap.restUrl + "security/teamsWithCreateAction/Environment Template",
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
                    submitUrl: bootstrap.restUrl + "deploy/environmentTemplate",
                    readOnly: self.readOnly,
                    postSubmit: function(data) {
                        if (self.callback !== undefined) {
                            self.callback(data);
                        }
                    },
                    addData: function(data) {
                        data.applicationTemplateId = self.applicationTemplate.id;
                        if (self.environmentTemplate) {
                            data.existingId = self.environmentTemplate.id;
                        }
                        if (self.source) {
                            data.copyId = self.source.id;
                        }
                        if (data.snapshotLockType === "SYSTEM_DEFAULT") {
                            delete data.snapshotLockType;
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
                        if (self.cancelCallback !== undefined) {
                            self.cancelCallback();
                        }
                    },
                    validateFields: function(data) {
                        var result = [];

                        if (!!data.historyCleanupDaysToKeep) {
                            if (!new RegExp("^[0-9]+$").test(data.historyCleanupDaysToKeep)) {
                                result.push(i18n("The Days to Keep Process History must be an " +
                                        "integer, 0 or greater."));
                            }
                        }

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

                        return result;
                    }
                });

                this.form.addField({
                    name: "name",
                    label: i18n("Name"),
                    required: true,
                    type: "Text",
                    value: (this.source) ? undefined : this.existingValues.name
                });

                this.form.addField({
                    name: "description",
                    label: i18n("Description"),
                    type: "Text",
                    value: this.existingValues.description
                });

                this.form.addField({
                    name: "resourceTemplate",
                    label: i18n("Resource Template"),
                    type: "TableFilterSelect",
                    value: this.existingValues.resourceTemplateId,
                    url: bootstrap.restUrl + "resource/resourceTemplate",
                    required: true,
                    defaultQuery: {
                        filterFields: ["application"],
                        "filterType_application": "null",
                        "filterValue_application": null
                    }
                });

                // Not setting this field defaults to standard environment.
                this.form.addField({
                    name: "environmentType",
                    label: i18n("Type"),
                    type: "TableFilterSelect",
                    value: this.existingValues.environmentTypeId,
                    url: bootstrap.baseUrl + "security/resourceRole",
                    allowNone: true,
                    placeHolder: i18n("Standard Environment"),
                    defaultQuery: {
                        outputType: ["BASIC"],
                        filterFields: ["resourceType.name", "ghostedDate"],
                        "filterType_resourceType.name": "eq",
                        "filterValue_resourceType.name": "Environment",
                        "filterClass_resourceType.name": "String",
                        "filterType_ghostedDate": "eq",
                        "filterValue_ghostedDate": "0",
                        "filterClass_ghostedDate": "Long"
                    }
                });

                var currentTeams = [];
                if (!!self.existingValues && !!self.existingValues.extendedSecurity && !!self.existingValues.extendedSecurity.teams) {
                    currentTeams = self.existingValues.extendedSecurity.teams;
                }
                self.teamSelector = new TeamSelector({
                    resourceRoleType: "Environment Template",
                    noneLabel: i18n("Standard Environment Template"),
                    teams: currentTeams
                });
                this.form.addField({
                    name: "teams",
                    label: i18n("Teams"),
                    type: "Text",
                    widget: self.teamSelector
                });

                this.form.addField({
                    name: "requireApprovals",
                    label: i18n("Require Approvals"),
                    type: "Checkbox",
                    description: i18n("When this is checked, no versions or snapshots can be deployed to this environment without being approved according to the approval process for this environment."),
                    onChange: function(value) { // conditionally add field for "noSelfApprovals"
                        self.showNoSelfApprovalField(value);
                    },
                    value: this.existingValues.requireApprovals
                });

                // If initial value of "requiredApprovals" is checked, show "noSelfApprovals".
                if (self.existingValues.requireApprovals) {
                    self.showNoSelfApprovalField(true);
                }

                var exemptProcessSelector = new DialogMultiSelect({
                    url: bootstrap.restUrl + "deploy/applicationTemplate/" +
                            this.applicationTemplate.id + "/" +
                            this.applicationTemplate.version + "/processes",
                    value: this.existingValues.exemptProcesses,
                    getLabel: function(item) {
                        return item.name.escape();
                    },
                    getValue: function(item) {
                        return item.id;
                    },
                    noSelectionsLabel: i18n("None")
                });
                this.form.addField({
                    name: "exemptProcesses",
                    label: i18n("Exempt Processes"),
                    widget: exemptProcessSelector,
                    description: i18n("Any processes selected here will be exempt from approval, even when the environment normally requires it.")
                });

                this.form.addField({
                    name: "lockSnapshots",
                    label: i18n("Lock Snapshots"),
                    type: "Checkbox",
                    description: i18n("When this is checked, all snapshots used in a request to this deployment will be locked to prevent further changes."),
                    value: this.existingValues.lockSnapshots,
                    onChange: function(value) {
                        if (value) {
                            self._showSnapshotLockType();
                        }
                        else {
                            self.form.removeField("snapshotLockType");
                        }
                    }
                });

                this.form.addField({
                    type: "Invisible",
                    name: "_snapshotLockTypeInsert"
                });
                if (this.existingValues.lockSnapshots) {
                    self._showSnapshotLockType();
                }

                self.form.addField({
                    name: "requireSnapshot",
                    label: i18n("Require Snapshot"),
                    type: "Checkbox",
                    description: i18n("If this box is checked, any deployment request must use a snapshot instead of individual versions."),
                    value: self.existingValues.requireSnapshot
                });

                this.form.addField({
                    name: "color",
                    label: i18n("Color"),
                    type: "ColorPicker",
                    value: this.existingValues.color
                });

                var useSystemSettings = (!self.environmentTemplate && !self.source)
                    || (self.existingValues.cleanupDaysToKeep === 0
                            && self.existingValues.cleanupCountToKeep === 0
                            && self.existingValues.snapshotDaysToKeep === 0);

                this.form.addField({
                    name: "inheritSystemCleanup",
                    label: i18n("Use Default Artifact Settings"),
                    description: i18n("When selected, this environment uses the artifact " +
                            "cleanup settings for the system or component settings, if available. " +
                            "Clear to provide values for all components and snapshots in this environment."),
                    type: "Checkbox",
                    onChange: function(value) {
                        if (!value) {
                            self.showCleanupFields();
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
                self.showHistoryCleanupFields();
                if (!useSystemSettings) {
                    this.showCleanupFields();
                }

                this.form.placeAt(this.formAttach);
            },

            _showSnapshotLockType: function() {
                var snapshotLockTypeOptions = {
                    "ALL": i18n("Component Versions and Configuration"),
                    "VERSIONS": i18n("Only Component Versions"),
                    "CONFIGURATION": i18n("Only Configuration")
                };

                this.form.addField({
                    name: "snapshotLockType",
                    label: i18n("Snapshot Lock Type"),
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

            showCleanupFields: function() {
                var self = this;

                this.form.addField({
                    name: "snapshotDaysToKeep",
                    label: i18n("Days to Retain Application Snapshots"),
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
                    description: i18n("The number of versions to retain for each component. " +
                            "To retain all component versions, enter -1. To use the system " +
                            "default retention value, enter 0."),
                    value: this.existingValues.cleanupCountToKeep,
                    required: true,
                    textDir: "ltr",
                    type: "Text"
                },"enableProcessHistoryCleanup");
            },

            showHistoryCleanupFields: function() {
                var self = this;

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
                    onChange : function(value) {
                        self.showUseSystemDefaultDays(value);
                        if (!value) {
                            self.showHistoryCleanupDaysToKeep(value);
                        }
                    }
                });

                if (!!this.existingValues.enableProcessHistoryCleanup) {
                    self.showUseSystemDefaultDays(true);
                }
            },

            showUseSystemDefaultDays: function(show){
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
                        onChange : function(value){
                            self.showHistoryCleanupDaysToKeep(!value);
                        }
                    });
                    if (!this.existingValues.useSystemDefaultDays) {
                       self.showHistoryCleanupDaysToKeep(true);
                    }
                }
                else {
                    this.form.removeField("useSystemDefaultDays");
                }
            },

            showHistoryCleanupDaysToKeep: function(show){
                if (show) {
                    this.form.addField({
                        name: "historyCleanupDaysToKeep",
                        label: i18n("Days to Retain Deployment History "),
                        description: i18n("The number of days to retain application deployment " +
                            "history. Valid range is 0 or greater"),
                        value: this.existingValues.historyCleanupDaysToKeep,
                        required: true,
                        textDir: "ltr",
                        type: "Number"
                    });
                }
                else {
                    if(this.form.hasField("historyCleanupDaysToKeep")){
                        this.form.removeField("historyCleanupDaysToKeep");
                    }
                }
            },

            /*
             * Add or remove "NoSelfApproval" field, which is dependent on "Require Approvals"
             * being visible and checked (true).
             */
            showNoSelfApprovalField: function(show) {
                var self = this;
                if (show) {
                    if (!self.form.hasField("noSelfApprovals")) {
                        self.form.addField({
                            name: "noSelfApprovals",
                            label: i18n("No Self-Approvals"),
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

            submitForm: function() {
                this.form.submitForm();
            }
        });
    });

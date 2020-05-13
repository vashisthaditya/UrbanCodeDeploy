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
/*global define, require, i18n */

define([
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dijit/form/Button",
        "dijit/form/CheckBox",
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/xhr",
        "dojo/dom-construct",
        "dojo/dom-style",
        "dojo/on",
        "dojo/Deferred",
        "js/util/blocker/_IncrementBlockerMixin",
        "js/webext/widgets/Alert",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/DomNode",
        "deploy/widgets/version/VersionSelectionDialog",
        "deploy/widgets/patterns/PatternPropertySelectionDialog",
        "deploy/widgets/Formatters"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        CheckBox,
        array,
        declare,
        lang,
        xhr,
        domConstruct,
        domStyle,
        on,
        Deferred,
        _IncrementBlockerMixin,
        Alert,
        ColumnForm,
        Dialog,
        DomNode,
        VersionSelectionDialog,
        PatternPropertySelectionDialog,
        Formatters
) {
    /**
     * A widget to request application process execution. This handles
     * scheduling as well.
     *
     * Supported properties:
     * application / Object         A predefined application to select
     * environment / Object         A predefined environment to select
     * snapshot / Object            A predefined snapshot to select force
     * Schedule / Boolean           Whether  the schedule options must be filled out or not
     */
    return declare('deploy.widgets.application.RunApplicationProcess',  [_Widget, _TemplatedMixin, _IncrementBlockerMixin], {
        templateString:
            '<div class="runApplicationProcess">'+
            '  <div data-dojo-attach-point="formAttach" style="max-height: 500px; overflow-x: hidden; overflow-y: auto;"></div>'+
            '</div>',

        forceSchedule: false,

        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            this.showingVersions = false;
            this.isSchedule = false;
            this.loadedProcessData = {};

            this.form = new ColumnForm({
                submitMethod: "POST",
                addData: function(data) {
                    if (data.description) {
                        data.description = data.description.escape();
                    }

                    if (self.applicationProcess) {
                        // Add all properties for the application process from the form.
                        data.properties = {};
                        array.forEach(self.unfilledProperties, function(property) {
                            if (data["p_"+property.name] !== undefined) {
                                data.properties[property.name] = data["p_"+property.name];
                            }
                        });
                        // merge the pattern properties
                        if (data.patternProperties !== undefined){
                            var key;
                            for (key in data.patternProperties){
                                if (data.patternProperties[key] !== undefined) {
                                    data.properties[key] = data.patternProperties[key];
                                }
                            }
                            delete data.patternProperties;
                        }

                        data.applicationId = self.application.id;
                        data.applicationProcessId = self.applicationProcess.id;
                        data.environmentId = self.environment.id;
                        if (self.snapshot) {
                            data.snapshotId = self.snapshot.id;
                        }
                        if (self.isSchedule && data.date && data.time) {
                            data.date = util.combineDateAndTime(data.date, data.time).valueOf();
                        }
                    }
                },
                onSubmit: function(data){
                    if (self.applicationProcess !== undefined &&
                            self.applicationProcess.metadataType === "patternApplicationProcess"){
                        // do not want to close the dialog if the error occurs
                        var oldPostSubmit = self.form.postSubmit;
                        delete self.form.postSubmit;
                        self.patternPropertySelector.validateCloudProperties(data.properties).then(function(response) {
                            self.form.postSubmit = oldPostSubmit;
                            self.form.submitOverXhr(data);
                        }, function(response) {
                            // On error...
                            self.form.postSubmit = oldPostSubmit;
                            self.form.unblock();
                            self.form.onError(response);
                        });
                    }
                    else {
                        self.form.submitOverXhr(data);
                    }
                },

                postSubmit: function(data, ioargs) {
                    // We really don't want to do anything when we're called pre-submission.  See
                    // how ColumnForm.js calls postSubmit twice to understand.  If ioargs was
                    // passed in, we're probably looking at the response data (yay). If not, we're
                    // probably pre-submission (boo), and should not process anything.
                    if (arguments.length === 1) {
                        return;
                    }

                    // If the rest service returns blackouts, the move failed. Show error message.
                    if (data.blackouts !== undefined) {
                        var errorMessage = i18n("The event cannot be created at that time because it conflicts with a blackout:")+"<br/>";
                        if (data.blackouts.length > 1) {
                            errorMessage = i18n("The event cannot be created at that time because it conflicts with blackouts:")+"<br/>";
                        }

                        array.forEach(data.blackouts, function(blackout) {
                            errorMessage += "<br/><b>"+util.escape(blackout.name)+"</b><br/>";
                            if (blackout.environment !== undefined) {
                                errorMessage += "&nbsp; &nbsp; <b>"+i18n("Application Environment")+"</b>: "+util.escape(blackout.environment.name)+"<br/>";
                            }
                            errorMessage += "&nbsp; &nbsp; "+util.dateFormatShort(blackout.startDate)+" - "+util.dateFormatShort(blackout.endDate)+"<br/>";
                        });

                        var errorAlert = new Alert({
                            title: i18n("Schedule Error"),
                            forceRawMessages: true,
                            message: errorMessage
                        });
                    }
                    else {
                        // Redirect to the appropriate page - calendar for scheduled processes,
                        // process execution for live requests.
                        if (self.isSchedule) {
                            if (self.callback !== undefined) {
                                self.callback();
                            }
                            navBar.setHash("application/"+self.application.id+"/calendar", false, true);
                        }
                        else {
                            if (self.callback !== undefined) {
                                self.callback();
                            }
                            navBar.setHash("applicationProcessRequest/"+data.requestId+"/log", false, true);
                        }
                    }
                },
                onCancel: function() {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                onError: function(error) {
                    var messages =[i18n("An error has occurred while deploying this application:"), ""];
                    if (self.applicationProcess !== undefined &&
                            self.applicationProcess.metadataType === "patternApplicationProcess"){
                        var errorMessage = this._decodeJson(error.responseText);
                        try {
                            var provisionErrors = JSON.parse(errorMessage);
                            array.forEach(provisionErrors, function(provisionError) {
                                messages.push(util.escape(provisionError.errorMessage));
                            });
                        }
                        catch (e) {
                             messages.push(util.escape(error.responseText));
                        }
                    }
                    else {
                        if (self.callback !== undefined) {
                            self.callback();
                        }
                        messages.push(util.escape(error.responseText));
                    }
                    var errorAlert = new Alert({
                        title: i18n("Error"),
                        messages: messages
                    });
                },
                _decodeJson: function (str) {
                    return str.replace(/&#(\d+);/g, function (match, dec) {
                        return String.fromCharCode(dec);
                    });
                },
                validateFields: function(submitData) {
                    // check to validate if the properties have been set
                    var validationMessages = [];
                    if (self.applicationProcess !== undefined &&
                            self.applicationProcess.metadataType === "patternApplicationProcess"){
                        var propertyMessages = self.patternPropertySelector.validate();
                        if (propertyMessages !== undefined && propertyMessages.length > 0){
                            validationMessages.push(i18n("Not all required properties have values."));
                            array.forEach(propertyMessages, function(message) {
                                validationMessages.push(message);
                            });
                        }
                    }
                    return validationMessages;
                },
                saveLabel: i18n("Submit")
            });

            this.form.addField({
                name: "_applicationInsert",
                type: "Invisible"
            });

            this.form.addField({
                name: "_environmentInsert",
                type: "Invisible"
            });

            this.form.addField({
                name: "onlyChanged",
                label: i18n("Only Changed Versions"),
                value: "true",
                type: "Checkbox"
            });

            this.form.addField({
                name: "_processInsert",
                type: "Invisible"
            });

            this.form.addField({
                name: "_snapshotInsert",
                type: "Invisible"
            });
            this.form.addField({
                name: "_versionInsert",
                type: "Invisible"
            });

            this.form.addField({
                name: "_propertiesInsert",
                type: "Invisible"
            });
            this.form.addField({
                name: "_scheduleInsert",
                type: "Invisible"
            });

            if (this.forceSchedule) {
                self.showScheduleOptions();
            }
            else {
                this.scheduleCheckbox = new CheckBox({
                    onChange: function(newValue) {
                        if (newValue) {
                            self.showScheduleOptions();
                        }
                        else {
                            self.form.removeField("date");
                            self.form.removeField("time");
                            self.form.removeField("recurring");
                            if (self.form.hasField("recurrencePattern")) {
                                self.form.removeField("recurrencePattern");
                            }

                            self.isSchedule = false;
                        }
                    }
                });
                this.form.addField({
                    name: "scheduleCheckbox",
                    label: i18n("Schedule Deployment?"),
                    widget: this.scheduleCheckbox
                }, "_scheduleInsert");
            }

            this.form.addField({
                name: "description",
                label: i18n("Description"),
                type: "Text"
            });

            this.form.addField({
                name: "_warningInsert",
                type: "Invisible"
            });

            // If no application has been given, add a field for it.
            if (!this.application) {
                this.form.addField({
                    name: "applicationId",
                    label: i18n("Application"),
                    required: true,
                    type: "TableFilterSelect",
                    url: bootstrap.restUrl+"deploy/application",
                    onChange: function(value, item) {
                        self.application = item;
                        if (item) {
                            self.selectApplication(item);
                        }
                    }
                }, "_applicationInsert");
            }
            else {
                self.selectApplication(this.application);
            }

            this.form.placeAt(this.formAttach);
        },
        /**
         *
         */
        selectApplication: function(application) {
            var self = this;

            this.form.submitUrl = bootstrap.restUrl+"deploy/application/"+this.application.id+"/runProcess";

            if (self.form.hasField("environmentId")) {
                self.environment = undefined;
                self.form.removeField("environmentId");
            }
            if (self.form.hasField("applicationProcessId")) {
                self.clearProcessProperties();
                self.hideVersionFields();
                self.applicationProcess = undefined;
                self.form.removeField("applicationProcessId");
            }
            if (self.form.hasField("snapshotId")) {
                self.snapshot = undefined;
                self.form.removeField("snapshotId");
            }
            if (self.form.hasField("_snapshotLabel")) {
                self.form.removeField("_snapshotLabel");
            }

            // If no environment has been given, add a field for it.
            if (!this.environment) {
                this.form.addField({
                    name: "environmentId",
                    url: bootstrap.restUrl+"deploy/environment",
                    label: i18n("Environment"),
                    required: true,
                    type: "TableFilterSelect",
                    allowNone: false,
                    defaultQuery: {
                        filterFields: ["application.id", "active"],
                        "filterType_application.id": "eq",
                        "filterValue_application.id": self.application.id,
                        filterType_active: "eq",
                        filterValue_active: true,
                        filterClass_active: "Boolean"
                    },
                    onChange: function(value, item) {
                        self.hideVersionFields();
                        self.environment = item;

                        if (item) {
                            self.selectEnvironment(item);
                        }
                        if (!self.snapshot && self.applicationProcess && self.environment && !self.environment.requireSnapshot) {
                            self.showVersionFields();
                        }
                    }
                }, "_environmentInsert");
            }
            else {
                self.selectEnvironment(this.environment);
            }

            self.showSnapshot();
        },

        /*
         * Snapshot is not currently supported for pattern application process.
         * Hide the snapshot for Pattern application process and show the
         * snapshot for ucd application process
         */
        showSnapshot: function(){
            var self = this;
            if (!this.snapshot && !this.form.hasField("_snapshotLabel")) {
                this.form.addField({
                    name: "_snapshotLabel",
                    label: "",
                    type: "Label",
                    value: i18n("Select a snapshot, or choose versions for individual components."),
                    style: {
                        fontWeight: "bold",
                        marginTop: "10px",
                        marginBottom: "4px"
                    }
                }, "_snapshotInsert");

                this.form.addField({
                    name: "snapshotId",
                    label: i18n("Snapshot"),
                    type: "TableFilterSelect",
                    url: bootstrap.restUrl+"deploy/application/"+this.application.id+"/snapshots/false",
                    onChange: function(value, item) {
                        self.snapshot = item;

                        self.clearProcessProperties();
                        self.showProcessProperties();

                        if (!item) {
                            self.showVersionFields();
                        }
                        else {
                            self.hideVersionFields();
                        }
                    }
                }, "_snapshotInsert");
            }
        },

        /**
         *
         */
        hideSnapshot: function(){
            if (this.form.hasField("_snapshotLabel")) {
                this.form.removeField("_snapshotLabel");
            }
            if (this.form.hasField("snapshotId")) {
                this.form.removeField("snapshotId");
            }
        },

        /**
         *
         */
        selectEnvironment: function(environment) {
            var self = this;

            if (this.form.hasField("_allowDraftsWarning")) {
                this.form.removeField("_allowDraftsWarning");
            }

            if (environment.allowDrafts) {
                var allowDraftsWarningNode = new DomNode();
                var allowDraftsWarningDiv = domConstruct.create("div", {
                    "innerHTML": i18n("WARNING: This environment is configured to use draft processes for some or all components."),
                    "style": {
                        "fontWeight": "bold"
                    }
                }, allowDraftsWarningNode.domAttach);
                this.form.addField({
                    name: "_allowDraftsWarning",
                    label: "",
                    widget: allowDraftsWarningNode
                }, "_applicationInsert");
            }

            if (this.form.hasField("_propertiesWarning")) {
                this.form.removeField("_propertiesWarning");
            }
            var resturl = bootstrap.restUrl+"deploy/environment/"+this.environment.id+"/validateProperties";
            if (self.snapshot) {
                resturl += "/" + self.snapshot.id;
            }

            if (this.environment) {

                // Remove this field so we can get the correct process list allowed
                // on the environment chosen.
                if (this.form.hasField("applicationProcessId")) {
                    this.form.removeField("applicationProcessId");
                }

                // This field needs to be populated after choosing the environment as
                // application process required roles should only apply if the user
                // has that role on a team mapped to the environment they want to run
                // a process against.
                self.addApplicationProcessField();

                self.blockIncrement();
                xhr.get({
                    url: resturl,
                    handleAs: "json",
                    load: function(data) {
                        var hasMissingProperties = false;

                        array.forEach(data.environmentData, function(environment) {
                            if (environment.missingEnvironmentProperties.length > 0) {
                                hasMissingProperties = true;
                            }
                        });
                        array.forEach(data.resourceData, function(resource) {
                            if (resource.missingResourceProperties.length > 0) {
                                hasMissingProperties = true;
                            }
                        });

                        if (hasMissingProperties) {
                            var missingPropertiesWarningWidget = new DomNode();

                            domConstruct.create("div", {
                                "innerHTML": i18n("WARNING: Not all required properties have values."),
                                "style": {
                                    "fontWeight": "bold"
                                }
                            }, missingPropertiesWarningWidget.domAttach);

                            var missingPropertiesLink = domConstruct.create("a", {
                                "class": "linkPointer",
                                "innerHTML": i18n("View missing properties...")
                            }, missingPropertiesWarningWidget.domAttach);
                            on(missingPropertiesLink, "click", function() {
                                self.showMissingProperties(data);
                            });

                            domStyle.set(missingPropertiesWarningWidget.domAttach, {
                                "marginBottom": "5px"
                            });

                            self.form.addField({
                                name: "_propertiesWarning",
                                label: "",
                                widget: missingPropertiesWarningWidget
                            }, "_warningInsert");
                        }
                    },
                    handle: function(data) {
                        self.blockDecrement();
                    }
                });
            }
        },

        getProcesses: function(url) {
            var deferred = new Deferred();
            xhr.get({
                url: url,
                handleAs: "json",
                load: function(data) {
                    deferred.resolve(data);
                },
                error: function(error) {
                    deferred.reject(error);
                }
            });
            return deferred;
        },

        /**
         *
         */
        addApplicationProcessField: function() {
            var self = this;
            var url = bootstrap.restUrl + "deploy/application/" + this.application.id
                        + "/" + this.environment.id + "/executableProcesses";

            this.getProcesses(url).then(function(data) {
                var fieldAttr = {
                    name: "applicationProcessId",
                    label: i18n("Process"),
                    required: true,
                    type: "TableFilterSelect",
                    data: data,
                    onChange: function(value, item) {
                        self.clearProcessProperties();
                        self.hideVersionFields();

                        // See if we already loaded details for this application process - if so,
                        // simply reuse that rather than loading it all over again
                        if (self.loadedProcessData[item.id]) {
                            self.applicationProcess = self.loadedProcessData[item.id];
                            self.showProcessProperties();
                            if (!self.snapshot && self.environment && !self.environment.requireSnapshot) {
                                self.showVersionFields();
                            }
                        }
                        else {
                            self.blockIncrement();
                            xhr.get({
                                url: bootstrap.restUrl + "deploy/applicationProcess/" + item.id+"/" + item.version,
                                handleAs: "json",
                                load: function(data) {
                                    // Hold onto loaded data in case the user switches away and back
                                    // to this process
                                    self.loadedProcessData[item.id] = data;

                                    self.applicationProcess = data;
                                    self.showProcessProperties();
                                    if (!self.snapshot && self.environment && !self.environment.requireSnapshot) {
                                        self.showVersionFields();
                                    }
                                },
                                error: function(error) {
                                    var alert = new Alert({
                                        messages: [i18n("Error loading process details:"),
                                                   "",
                                                   util.escape(error.responseText)]
                                    });
                                },
                                handle: function(data) {
                                    self.blockDecrement();
                                }
                            });
                        }
                    }
                };
                if (data && lang.isArray(data) && data.length === 1 && data[0].id) {
                    fieldAttr.value = data[0].id;
                }
                self.form.addField(fieldAttr, "_processInsert"); },
                function(error) {
                    var alert = new Alert({
                        messages: [i18n("Error retrieving processes:"),
                                   "",
                                   util.escape(error.responseText)]
                    });
                });
        },

        /**
         *
         */
        clearProcessProperties: function() {
            var self = this;
            array.forEach(self.unfilledProperties, function(property) {
                self.form.removeField("p_" + property.name);
            });
            self.hidePatternPropertiesFields();
        },

        /**
         *
         */
        hideVersionFields: function() {
            if (this.showingVersions) {
                this.showingVersions = false;

                if (this.form.hasField("_versionsLabel")) {
                    this.form.removeField("_versionsLabel");
                }
                if (this.form.hasField("_versionsLabel2")) {
                    this.form.removeField("_versionsLabel2");
                }

                if (this.form.hasField("versions")) {
                    this.versionSelector.destroy();
                    this.form.removeField("versions");
                }
            }
        },

        /**
         *
         */
        showProcessProperties: function() {
            var self = this;
            if (this.applicationProcess !== undefined) {
                if (this.applicationProcess.metadataType === "patternApplicationProcess"){
                    self.showPatternProperties();
                } else {
                    var restUrl = bootstrap.restUrl+"deploy/applicationProcess/" +
                            this.applicationProcess.id + "/unfilledProperties/";
                    if (self.snapshot) {
                        restUrl += "snapshot/" + self.snapshot.id;
                    }
                    else {
                        restUrl += this.application.id;
                    }
                    self.blockIncrement();
                    xhr.get({
                        url: restUrl,
                        handleAs: "json",
                        load: function(data) {
                            self.unfilledProperties = data;

                            array.forEach(data, function(property) {
                                var label = "";
                                var propertyName = "p_"+property.name;

                                // if there is no label defined for this property or the label that is defined
                                // is the same as the part of the property name after the last "/" character
                                if (property.label === "" ||
                                    (property.name !== "" && property.name.substring(property.name.lastIndexOf("/") + 1) === property.label))
                                {
                                    label = property.name;
                                }
                                else {
                                    if (property.namePrefix && property.namePrefix.length > 0) {
                                        label = property.namePrefix + "/";
                                    }
                                    label += property.label;
                                }

                                var propertyFieldData = lang.clone(property);
                                if (!propertyFieldData.value && propertyFieldData.type &&
                                    propertyFieldData.type === "SELECT") {
                                    if (propertyFieldData.allowedValues &&
                                        lang.isArray(propertyFieldData.allowedValues)) {
                                        propertyFieldData.allowedValues.splice(0, 0, {
                                            label: i18n("-- Make Selection --"),
                                            value: " "
                                        });
                                    }
                                }
                                propertyFieldData.name = propertyName;
                                propertyFieldData.label = label.replace(/\//g, " / ");
                                propertyFieldData.description = (property.description ? property.description.escape() : property.description);

                                self.form.addField(propertyFieldData, "_propertiesInsert");
                            });
                        },
                        handle: function(data) {
                            self.blockDecrement();
                        }
                    });
                }
            }
        },

        /**
         *
         */
        showPatternProperties: function() {
            var self = this;

            if (!this.showingPatternProcessProperties) {
                this.showingPatternProcessProperties = true;

                if (this.applicationProcess !== undefined) {
                    this.form.addField({
                        label: "",
                        name: "_patternPropertiesLabel",
                        value: i18n("Blueprint Properties"),
                        type: "Label",
                        style: {
                            "marginTop": "10px",
                            "marginBottom": "3px",
                            "fontWeight": "bold"
                        }
                    }, "_propertiesInsert");

                    self.patternPropertySelector = new PatternPropertySelectionDialog({
                        applicationProcess: self.applicationProcess,
                        environment: self.environment
                    });

                    self.form.addField({
                        name: "patternProperties",
                        label: i18n("Properties"),
                        required: true,
                        widget: self.patternPropertySelector
                    }, "_propertiesInsert");

                    this.form.addField({
                        label: "",
                        name: "_propertiesLabel2",
                        value: "",
                        type: "Label",
                        style: {
                           "marginTop": "7px"
                        }
                    }, "_propertiesInsert");
                }
            }
        },

        /**
         *
         */
        hidePatternPropertiesFields: function() {
            if (this.showingPatternProcessProperties) {
                this.showingPatternProcessProperties = false;

                if (this.form.hasField("_patternPropertiesLabel")) {
                    this.form.removeField("_patternPropertiesLabel");
                }
                if (this.form.hasField("_propertiesLabel2")) {
                    this.form.removeField("_propertiesLabel2");
                }

                if (this.form.hasField("patternProperties")) {
                    this.patternPropertySelector.destroy();
                    this.form.removeField("patternProperties");
                }
            }
        },

        /**
         *
         */
        showVersionFields: function() {
            var self = this;

            if (!this.showingVersions) {
                this.showingVersions = true;

                if (this.applicationProcess !== undefined) {
                    self.blockIncrement();
                    xhr.get({
                        url: bootstrap.restUrl + "deploy/applicationProcess/" + self.applicationProcess.id +
                                "/componentsTakingVersions/" + self.application.id,
                        handleAs: "json",
                        load: function(data) {
                            // This application process has components needing versions for this app
                            if (data.length > 0) {
                                self.form.addField({
                                    label: "",
                                    name: "_versionsLabel",
                                    value: i18n("Component Versions"),
                                    type: "Label",
                                    style: {
                                        "marginTop": "10px",
                                        "marginBottom": "3px",
                                        "fontWeight": "bold"
                                    }
                                }, "_versionInsert");

                                self.versionSelector = new VersionSelectionDialog({
                                    applicationProcess: self.applicationProcess,
                                    environment: self.environment
                                });

                                self.form.addField({
                                    name: "versions",
                                    label: i18n("Versions"),
                                    widget: self.versionSelector
                                }, "_versionInsert");

                                self.form.addField({
                                    label: "",
                                    name: "_versionsLabel2",
                                    value: "",
                                    type: "Label",
                                    style: {
                                        "marginTop": "7px"
                                    }
                                }, "_versionInsert");
                            }
                        },
                        error: function(error) {
                            var alert = new Alert({
                                messages: [i18n("Error loading process details:"),
                                           "",
                                           util.escape(error.responseText)]
                            });
                        },
                        handle: function(data) {
                            self.blockDecrement();
                        }
                    });
                }
            }
        },

        /**
         *
         */
        showScheduleOptions: function() {
            var self = this;

            self.form.addField({
                name: "date",
                label: i18n("Date"),
                required: true,
                type: "Date",
                value: self.date || new Date()
            }, "_scheduleInsert");
            self.form.addField({
                name: "time",
                label: i18n("Time"),
                required: true,
                type: "Time",
                value: self.time || new Date()
            }, "_scheduleInsert");

            self.form.addField({
                name: "recurring",
                label: i18n("Make Recurring"),
                type: "Checkbox",
                onChange: function(value) {
                    if (value) {
                        self.form.addField({
                            name: "recurrencePattern",
                            label: i18n("Pattern"),
                            type: "Select",
                            allowedValues: [{
                                value: "M",
                                label: i18n("Monthly")
                            },{
                                value: "W",
                                label: i18n("Weekly")
                            },{
                                value: "D",
                                label: i18n("Daily")
                            }],
                            required: true
                        }, "_scheduleInsert");
                    }
                    else {
                        self.form.removeField("recurrencePattern");
                    }
                }
            }, "_scheduleInsert");

            self.isSchedule = true;
        },

        /**
         *
         */
        showMissingProperties: function(validationData) {
            var missingPropertiesDialog = new Dialog({
                title: i18n("Missing Properties"),
                closable: true,
                draggable: true
            });

            var missingPropertiesContainer = domConstruct.create("div", {
                "style": {
                    "width": "350px"
                }
            }, missingPropertiesDialog.containerNode);

            array.forEach(validationData.environmentData, function(component) {
                if (component.missingEnvironmentProperties.length > 0) {
                    var componentContainer = domConstruct.create("div", {
                        style: {
                            "marginBottom": "8px"
                        }
                    }, missingPropertiesContainer);

                    domConstruct.create("div", {
                        "innerHTML": i18n("Missing environment properties for %s:", component.name.escape()),
                        "style": {
                            "fontWeight": "bold"
                        }
                    }, componentContainer);

                    array.forEach(component.missingEnvironmentProperties, function(property) {
                        domConstruct.create("div", {
                            "innerHTML": property.escape(),
                            "style": {
                                "paddingLeft": "60px"
                            }
                        }, componentContainer);
                    });
                }
            });

            array.forEach(validationData.resourceData, function(resource) {
                if (resource.missingResourceProperties.length > 0) {
                    var resourceContainer = domConstruct.create("div", {
                        style: {
                            "marginBottom": "8px"
                        }
                    }, missingPropertiesContainer);

                    domConstruct.create("div", {
                        "innerHTML": i18n("Missing role properties for resource %s:", resource.name.escape()),
                        "style": {
                            "fontWeight": "bold"
                        }
                    }, resourceContainer);

                    array.forEach(resource.missingResourceProperties, function(property) {
                        domConstruct.create("div", {
                            "innerHTML": property.escape(),
                            "style": {
                                "paddingLeft": "60px"
                            }
                        }, resourceContainer);
                    });
                }
            });

            domConstruct.create("div", {
                "innerHTML": i18n("Until these properties have values, the deployment may fail or produce unexpected results."),
                "style": {
                    "marginBottom": "5px",
                    "fontWeight": "bold"
                }
            }, missingPropertiesContainer);

            var closeButton = new Button({
                label: i18n("Close"),
                showTitle: false,
                onClick: function() {
                    missingPropertiesDialog.hide();
                    missingPropertiesDialog.destroy();
                }
            });
            closeButton.placeAt(missingPropertiesContainer);

            missingPropertiesDialog.show();
        },

        destroy: function() {
            if (this.versionSelector) {
                this.versionSelector.destroy();
            }
            this.inherited(arguments);
        }
    });
});

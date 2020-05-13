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
        "dijit/form/Button",
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/dom-construct",
        "dojo/on",
        "deploy/widgets/scripts/PostScriptEditorDialog",
        "deploy/widgets/security/token/EditAuthTokenRestriction",
        "deploy/widgets/workflow/activity/BaseActivity",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/DomNode",
        "js/webext/widgets/RestSelect",
        "deploy/widgets/property/PropertyTextareaBox"
        ],
function(
        Button,
        array,
        declare,
        xhr,
        domConstruct,
        on,
        PostScriptEditorDialog,
        EditAuthTokenRestriction,
        BaseActivity,
        Dialog,
        DomNode,
        RestSelect,
        PropertyArea
) {
    return declare('deploy.widgets.workflow.activity.PluginActivity',  [BaseActivity], {
        postCreate: function() {
            this.inherited(arguments);

            if (!this.initialized) {
                this.editProperties();
            }
        },

        getLabel: function() {
            var result = util.applyBTD(this.data.name)+"\n"+i18n("%s (v. %s)",  i18n(this.data.commandName), this.data.pluginVersion);
            if (this.data.command !== null && this.data.command !== undefined) {
                if (this.data.command.plugin.ghostedDate !== 0) {
                    result += "\n"+i18n("PLUGIN DELETED");
                }
            }
            return result;
        },

        editProperties: function(callback) {
            var self = this;

            if (this.data.command) {
                this.showPropertyForm(this.data.command, callback);
            }
            else {
                xhr.get({
                    url: bootstrap.restUrl+"plugin/command/commandByName/"+this.data.pluginName+"/"+this.data.pluginVersion+"/"+this.data.commandName,
                    handleAs: "json",
                    load: function(data) {
                        self.data.command = data;
                        self.showPropertyForm(data);
                    }
                });
            }
        },

        showPropertyForm: function(command, callback) {
            var self = this;

            var propertyDialog = self.createPropertyDialog();
            var propertyForm = self.createPropertyForm({
                dialog: propertyDialog,
                validateFields: function(data) {
                    return self.validateName(data.name);
                },
                onSubmit: function(data) {
                    if (callback) {
                        callback();
                    }
                    self.initialized = true;

                    self.data.properties = {};

                    // Pick up the values for any property definitions on this activity's
                    // plugin step. If the value is undefined, it has been marked to be set
                    // on the usage of this process.
                    array.forEach(command.properties, function(availableProperty) {
                        var submittedValue = data["p_"+availableProperty.name];
                        if (submittedValue !== undefined) {
                            self.data.properties[availableProperty.name] = submittedValue;
                        }
                    });

                    if(data.showHidden === "true") {
                        self.data.showHidden = true;
                    }
                    self.data.name = data.name;
                    self.updateLabel();

                    self.data.allowFailure = data.allowFailure;

                    // Convert from a string value - for this to be used reliably in
                    // future loads of the property popup, it must be a boolean.
                    if (data.useImpersonation === "true") {
                        self.data.useImpersonation = true;
                    }
                    else {
                        self.data.useImpersonation = false;
                    }
                    self.data.impersonationUsername = data.impersonationUsername;
                    if (data.impersonationGroup !== undefined) {
                        self.data.impersonationGroup = data.impersonationGroup;
                    }
                    else {
                        self.data.impersonationGroup = "";
                    }
                    if (data.impersonationPassword !== undefined) {
                        self.data.impersonationPassword = data.impersonationPassword;
                    }
                    else {
                        self.data.impersonationPassword = "";
                    }
                    if (data.impersonationUseSudo === "true") {
                        self.data.impersonationUseSudo = true;
                    }
                    else {
                        self.data.impersonationUseSudo = false;
                    }

                    self.data.workingDir = data.workingDir;

                    if (data.preconditionScript !== undefined) {
                        self.data.preconditionScript = data.preconditionScript;
                    }
                    else {
                        self.data.preconditionScript = "";
                    }

                    if (self.postProcSelect !== undefined) {
                        self.data.postProcessingScript = self.postProcSelect.get('value');
                    }
                    else {
                        self.data.postProcessingScript = "";
                    }

                    if (self.data.postProcessingScript === null || self.data.postProcessingScript === undefined) {
                        self.data.postProcessingScript = "";
                    }

                    self.data.authTokenRestriction = self.authTokenRestrictionSelect.get('value');

                    if(data.showHidden === "true") {
                        self.data.showHidden = true;
                    }
                    else {
                        self.data.showHidden = false;
                    }

                    propertyDialog.hide();
                    propertyForm.destroy();
                    propertyDialog.destroy();
                },
                readOnly: self.readOnly
            });

            self.propertyForm = propertyForm;

            propertyForm.addField({
                name: "name",
                label: i18n("Name"),
                type: "Text",
                required: true,
                value: self.data.name
            });

            array.forEach(command.properties, function(availableProperty) {
                var value = availableProperty.value;
                array.forEach(availableProperty.allowedValues, function(allowedValue) {
                    allowedValue.label = i18n(allowedValue.label);
                });

                // Filter out null/undefined default values, and set them to empty strings so
                // the data processing doesn't think they've been set to "define later"
                if (value === undefined) {
                    value = "";
                }

                var configModeOn = true;

                if (self.data.properties !== undefined) {
                    var existingValue = self.data.properties[availableProperty.name];
                    if (existingValue !== undefined) {
                        value = existingValue;
                    }
                    else {
                        configModeOn = false;
                    }
                }
                if (!availableProperty.hidden) {
                    if (availableProperty.type && self.process && availableProperty.type.toLowerCase() === "text") {
                        availableProperty.type = "PropertyBox";
                    }
                    else if (availableProperty.type && self.process && availableProperty.type.toLowerCase() === "textarea") {
                        availableProperty.type = "PropertyArea";
                    }
                    var propertyName = "p_"+availableProperty.name;
                    var propertyFieldData = {
                        name: propertyName,
                        label: i18n(availableProperty.label),
                        type: availableProperty.type,
                        required: availableProperty.required,
                        allowedValues: availableProperty.allowedValues,
                        description: (availableProperty.description ? i18n(availableProperty.description).escape() : availableProperty.description),
                        value: value,
                        cache: self.graphEditor.cache
                    };

                    self.addPropertyField(propertyForm, propertyFieldData, configModeOn);
                }
            });

            if (config.data.systemConfiguration.enableAllowFailure || self.data.allowFailure) {
                propertyForm.addField({
                    name: "allowFailure",
                    label: i18n("Allow Failure"),
                    type: "Checkbox",
                    required: false,
                    description: i18n("Allow failures to let the process run normally even if this activity fails."),
                    value: self.data.allowFailure
                });
            }
            propertyForm.addField({
                name: "workingDir",
                label: i18n("Working Directory"),
                type: "PropertyBox",
                require: false,
                description: i18n("An alternative absolute path to the working directory for the step. If left blank, it will use the default process-specific working directory."),
                value: self.data.workingDir,
                cache: self.graphEditor.cache
            });

            var preconditionOptions = [{
                label: i18n("Any Prior Failure"),
                value: "properties.get(\"hasFailures\") == \"true\""
            },{
                label: i18n("No Prior Failures"),
                value: "properties.get(\"hasFailures\") != \"true\""
            }];

            self.createPostProcSelect(self.data.postProcessingScript);

            propertyForm.addField({
                name: "postProcessingScript",
                label: i18n("Post Processing Script"),
                description: i18n("The post processing script to use to determine pass/fail and lines of interest."),
                required : false,
                widget : self.postProcDomNode
            });

            var type = "Text Area";
            if (self.process) {
                type = "PropertyArea";
            }
            propertyForm.addField({
                name: "preconditionScript",
                label: i18n("Precondition"),
                type: type,
                description: i18n("A script to determine whether this step should run. Must evaluate to true or false if not left blank."),
                value: self.data.preconditionScript,
                cache: self.graphEditor.cache
            });

            propertyForm.addField({
                name: "useImpersonation",
                label: i18n("Use Impersonation"),
                type: "Checkbox",
                required: false,
                description: i18n("Run this task as a different user."),
                value: self.data.useImpersonation,
                onChange: function(value) {
                    if (value) {
                        self.showImpersonationFields(propertyForm);
                        propertyForm.showingImpersonation = true;
                    }
                    else {
                        if (propertyForm.showingImpersonation) {
                            propertyForm.removeField("impersonationUsername");
                            propertyForm.removeField("impersonationGroup");
                            propertyForm.removeField("impersonationPassword");
                            propertyForm.removeField("impersonationUseSudo");
                        }

                        propertyForm.showingImpersonation = false;
                    }
                }
            });

            var defaultAuthTokenRestrictionValue = config.data.systemConfiguration.defaultAuthTokenRestriction;
            if (!!self.data.authTokenRestriction) {
                defaultAuthTokenRestrictionValue = self.data.authTokenRestriction;
            }
            if (defaultAuthTokenRestrictionValue === undefined) {
                defaultAuthTokenRestrictionValue = "";
            }

            self.createAuthTokenRestrictionSelect(defaultAuthTokenRestrictionValue);

            propertyForm.addField({
                name: "authTokenRestriction",
                label: i18n("Auth Token Restriction"),
                type: "TableFilterSelect",
                description: i18n("A whitelist of urls the token of this step is allowed to access."),
                widget: self.authTokenRestrictionNode,
                allowNone: false,
                required: false,
                formatDropDownLabel: function(labelDomNode, item) {
                    labelDomNode.textContent = i18n(item.name);
                }
            });

            // show only if this form has properties that can be hidden
            if (self.hasHidden(propertyForm, command.properties)) {
                propertyForm.addField({
                    name: "showHidden",
                    label: i18n("Show Hidden Properties"),
                    type: "Checkbox",
                    required: false,
                    description: i18n("Modify this plugin step's hidden properties"),
                    value: self.data.showHidden,
                    onChange: function(value) {
                        if (value) {
                            self.showHidden(propertyForm, command.properties);
                        }
                        else {
                            self.hideHidden(propertyForm, command.properties);
                        }
                    }
                });
            }

            if (!!self.data.useImpersonation) {
                self.showImpersonationFields(propertyForm);
                propertyForm.showingImpersonation = true;
            }


            if (!!self.data.showHidden) {
                self.showHidden(propertyForm, command.properties);
            }
            else {
                self.hideHidden(propertyForm, command.properties);
            }

            propertyForm.placeAt(propertyDialog.containerNode);
            propertyDialog.show();
        },

        /**
        * Does this form have properties that can be hidden
        */
        hasHidden: function(propertyForm, propDefs) {
            var i;
            for (i = 0; i < propDefs.length; i++) {
                if (propDefs[i].hidden) {
                    return true;
                }
            }
            return false;
        },

        /**
         * Hide properties that can be hidden
         */
        hideHidden: function(propertyForm, propDefs) {
            var self = this;
            var formValues = propertyForm.getData();
            var properties = this.data.properties;

            array.forEach(propDefs, function(availableHiddenProp) {
                if (availableHiddenProp.hidden) {
                    var existingValue = availableHiddenProp.value;
                    if (properties && properties[availableHiddenProp.name] !== undefined) {
                        existingValue = properties[availableHiddenProp.name];
                    }
                    if (formValues["p_"+availableHiddenProp.name] !== undefined) {
                        existingValue = formValues["p_"+availableHiddenProp.name];
                    }

                    propertyForm.removeField("p_"+availableHiddenProp.name);
                    propertyForm.addField({
                        name: "p_"+availableHiddenProp.name,
                        type: "Invisible",
                        value: existingValue
                    });
                }
            });
        },

        /**
         * Show hidden properties
         */
        showHidden: function(propertyForm, propDefs) {
            var self = this;
            var formValues = propertyForm.getData();
            var properties = this.data.properties;

            array.forEach(propDefs, function(availableHiddenProp) {
                if (availableHiddenProp.hidden) {
                    var existingValue = availableHiddenProp.value;
                    if (properties && properties[availableHiddenProp.name] !== undefined) {
                        existingValue = properties[availableHiddenProp.name];
                    }
                    if (formValues["p_"+availableHiddenProp.name] !== undefined) {
                        existingValue = formValues["p_"+availableHiddenProp.name];
                    }

                    propertyForm.removeField("p_"+availableHiddenProp.name);
                    propertyForm.addField({
                        name: "p_"+availableHiddenProp.name,
                        label: i18n(availableHiddenProp.label),
                        type: availableHiddenProp.type,
                        required: availableHiddenProp.required,
                        allowedValues: availableHiddenProp.allowedValues,
                        description: (availableHiddenProp.description ? i18n(availableHiddenProp.description).escape() : availableHiddenProp.description),
                        value: existingValue
                    });
                }
            });
        },

        showImpersonationFields: function(propertyForm) {
            var self = this;
            propertyForm.addField({
                name: "impersonationUsername",
                label: i18n("User"),
                type: "Text",
                required: true,
                description: i18n("The username to authenticate as during impersonation."),
                value: self.data.impersonationUsername
            });
            propertyForm.addField({
                name: "impersonationPassword",
                label: i18n("Password"),
                type: "Secure",
                required: false,
                description: i18n("The password to use during impersonation. For UNIX or Linux agents, the password option is ignored. The agent user must be able to impersonate without a password."),
                value: self.data.impersonationPassword
            });
            propertyForm.addField({
                name: "impersonationGroup",
                label: i18n("Group"),
                type: "Text",
                required: false,
                description: i18n("The group to authenticate as during impersonation."),
                value: self.data.impersonationGroup
            });
            propertyForm.addField({
                name: "impersonationUseSudo",
                label: i18n("Use Sudo"),
                type: "Checkbox",
                required: false,
                description: i18n("If checked, sudo will be used around the su call to perform impersonation."),
                value: self.data.impersonationUseSudo
            });
        },

        createPostProcSelect: function(value) {
            var self = this;

            if (this.postProcDomNode && this.postProcDomNode.domAttach) {
                domConstruct.empty(this.postProcDomNode.domAttach);
            }
            else {
                this.postProcDomNode = new DomNode({});
            }

            var buttonDiv = domConstruct.create("div");

            this.postProcSelect = new RestSelect({
                restUrl : bootstrap.restUrl + "script/postprocessing",
                required:false,
                noneLabel: i18n("Step Default"),
                onChange: function() {
                    self.addEditButton(buttonDiv);
                },
                value : value,
                style: {
                    verticalAlign: "bottom"
                }
            });

            if (self.hasManageScriptPermission()) {
                var newScriptButton = {
                        label: i18n("New"),
                        title: i18n("Create a new post processing script"),
                        onClick: function() {
                            self.showEditScriptDialog();
                        }
                };

                var createButton = new Button(newScriptButton);
                createButton.placeAt(buttonDiv);
            }

            this.postProcSelect.placeAt(this.postProcDomNode.domAttach);
            domConstruct.place(buttonDiv, this.postProcDomNode.domAttach);
            self.addEditButton(buttonDiv);
        },

        createAuthTokenRestrictionSelect: function(value) {
            var self = this;

            var hasEditPermission = config &&
            config.data &&
            config.data.permissions &&
            config.data.permissions[security.system.manageAuthTokenRestrictions];

            if (this.authTokenRestrictionNode && this.authTokenRestrictionNode.domAttach) {
                domConstruct.empty(this.authTokenRestrictionNode.domAttach);
            }
            else {
                this.authTokenRestrictionNode = new DomNode({});
            }

            var buttonDiv = domConstruct.create("div");

            this.authTokenRestrictionSelect = new RestSelect({
                restUrl : bootstrap.baseUrl + "security/authTokenRestriction",
                required: false,
                allowNone: false,
                onChange: function(value) {
                    self.addEditRestrictionButton(buttonDiv, hasEditPermission);
                    // Need to ensure that the field has a value BEFORE validation, otherwise
                    // if the field is required you will be unable to save the form.
                    self.propertyForm.setValue("authTokenRestriction", value);
                },
                value : value,
                style: {
                    verticalAlign: "bottom"
                },
                getLabel: function(item) {
                    if (item.name === "System Default") {
                        return i18n("System Default");
                    }
                    return item.name;
                }
            });

            var newRestrictionButton = {
                label: i18n("New"),
                title: i18n("Create a new auth token restriction"),
                onClick: function() {
                    self.showEditAuthTokenRestrictionDialog(null, hasEditPermission);
                }
            };

            var createButton = new Button(newRestrictionButton);

            this.authTokenRestrictionSelect.placeAt(this.authTokenRestrictionNode.domAttach);
            domConstruct.place(buttonDiv, this.authTokenRestrictionNode.domAttach);

            self.addEditRestrictionButton(buttonDiv, hasEditPermission);
            if (hasEditPermission) {
                createButton.placeAt(buttonDiv);
            }
        },

        addEditButton : function(container) {
            var self = this;

            if (this.editButton) {
                this.editButton.destroy();
            }
            if (this.postProcSelect && this.postProcSelect.get('value')) {
                var editScriptButton = {
                    label: self.hasManageScriptPermission() ? i18n("Edit") : i18n("View"),
                    title: i18n("Edit the selected post processing script"),
                    onClick: function() {
                        self.showEditScriptDialog(self.postProcSelect._getItemAttr());
                    }
                };

                this.editButton = new Button(editScriptButton);
                this.editButton.placeAt(container);
            }
        },

        addEditRestrictionButton : function(container, hasEditPermission) {
            var self = this;
            if (this.editRestrictionButton) {
                this.editRestrictionButton.destroy();
            }
            if (this.authTokenRestrictionSelect && this.authTokenRestrictionSelect.get('value')) {
                this.editRestrictionButton = new Button({
                    label: hasEditPermission ? i18n("Edit") : i18n("View"),
                    title: i18n("Edit the selected auth token restriction"),
                    onClick: function() {
                        self.showEditAuthTokenRestrictionDialog(self.authTokenRestrictionSelect._getItemAttr(), hasEditPermission);
                    }
                });
                this.editRestrictionButton.placeAt(container);
            }
        },

        /**
         *
         */
        showEditScriptDialog: function(script) {
            var self = this;

            var scriptDialog = PostScriptEditorDialog({
                readOnly: !self.hasManageScriptPermission(),
                script: script,
                callback: function(data) {
                    self.createPostProcSelect(data ? data.id : (script ? script.id : undefined));
                }
            });
            scriptDialog.show();
        },

        /**
         *
         */
        showEditAuthTokenRestrictionDialog: function(restriction, hasEditPermission) {
            var self = this;
            var dialog = new Dialog({
                "title": i18n("Create Auth Token Restriction"),
                "closable":true,
                "draggable":true
            });
            var editform = new EditAuthTokenRestriction({
                authTokenRestriction: restriction,
                readOnly: !hasEditPermission,
                callback: function(data) {
                    dialog.hide();
                    dialog.destroy();
                    var result = null;
                    if (!!data) {
                        // saved a new item
                        result = data.id;
                    }
                    if (!result && !!restriction) {
                        // editted an old item
                        result = restriction.id;
                    }
                    if (!result) {
                        // cancelled saving a new item
                        result = self.data.authTokenRestriction;
                    }

                    self.createAuthTokenRestrictionSelect(result);
                }
            });
            editform.placeAt(dialog);
            dialog.show();
        },

        hasManageScriptPermission: function() {
            var hasPermission = false;
            if (config && config.data &&
                    config.data.permissions &&
                    config.data.permissions[security.system.managePostProcessingScripts]) {
                hasPermission = true;
            }
            return hasPermission;
        }
    });
});

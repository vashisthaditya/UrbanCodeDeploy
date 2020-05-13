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
        "js/webext/widgets/Alert",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/RestSelect",
        "deploy/widgets/firstDayWizard/FirstDayWizardUtil"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        Alert,
        ColumnForm,
        RestSelect,
        FirstDayWizardUtil
) {
    return declare('deploy.widgets.componentProcess.EditComponentProcess',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="editComponentProcess">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',
        showCancel: true,

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            this.existingValues = {};
            if (this.componentProcess) {
                this.existingValues = this.componentProcess;
            }
            else {
                this.existingValues.takesVersion = true;
                this.existingValues.inventoryActionType = "ADD";
                this.existingValues.defaultWorkingDir = "${p:resource/work.dir}/${p:component.name}";
            }

            this.form = new ColumnForm({
                submitUrl: bootstrap.restUrl+"deploy/componentProcess",
                readOnly: self.isReadOnly(),
                showButtons: !self.readOnly && (self.mode !== "firstDayWizard"),
                postSubmit: function(data) {
                    navBar.setHash(self.getOnSaveRedirectHash(data.id), false, true);

                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                onError: function(error) {
                    if (error.responseText) {
                        var wrongVersionAlert = new Alert({
                            message: util.escape(error.responseText)
                        });
                    }
                    if (self.componentProcess) {
                        //set hash such that unsaved changes are visible, and refresh will update to latest version
                        navBar.setHash(self.getConfigurationHash(self.componentProcess), true, false);
                    }
                },
                addData: function(data) {
                    if (self.component) {
                        data.componentId = self.component.id;
                    }
                    else if (self.componentTemplate) {
                        data.componentTemplateId = self.componentTemplate.id;
                    }

                    if (self.componentProcess) {
                        data.existingId = self.componentProcess.id;
                        data.componentProcessVersion = self.componentProcess.version;
                    }

                    // Translate from user-facing process type into server-consumable properties
                    var processType = data.processType;
                    delete data.processType;

                    if (processType === "deploy") {
                        data.inventoryActionType = "ADD";
                        data.configActionType = "ADD";
                        data.takesVersion = true;
                    }
                    else if (processType === "config_deploy") {
                        data.configActionType = "ADD";
                        data.takesVersion = false;
                    }
                    else if (processType === "uninstall") {
                        data.inventoryActionType = "REMOVE";
                        data.takesVersion = true;
                    }
                    else if (processType === "operational_version") {
                        data.takesVersion = true;
                    }
                    else if (processType === "operational") {
                        data.takesVersion = false;
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
                value: this.existingValues.name,
                textDir: util.getBaseTextDir(),
                onChange: function(value) {
                    if (self.mode === "firstDayWizard") {
                        self.firstDayWizardModel.set("pre_setProcessName",
                                {process: self.componentProcess,
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

            this.form.addField({
                name: "_type",
                type: "Invisible"
            });

            // Figure out the user-facing typed based on the value of certain properties from the
            // back-end
            var initialType = null;
            if (this.existingValues.takesVersion) {
                if (this.existingValues.inventoryActionType === "ADD") {
                    initialType = "deploy";
                }
                else if (this.existingValues.inventoryActionType === "REMOVE") {
                    initialType = "uninstall";
                }
                else {
                    initialType = "operational_version";
                }
            }
            else if (this.existingValues.configActionType === "ADD") {
                initialType = "config_deploy";
            }
            else {
                if (self.mode === "firstDayWizard") {
                    initialType = "deploy";
                } else {
                    initialType = "operational";
                }
            }

            this.form.addField({
                name: "processType",
                label: i18n("Process Type"),
                type: "Select",
                allowedValues: [{
                    label: i18n("Deployment"),
                    value: "deploy"
                },{
                    label: i18n("Configuration Deployment"),
                    value: "config_deploy"
                },{
                    label: i18n("Uninstall"),
                    value: "uninstall"
                },{
                    label: i18n("Operational (With Version)"),
                    value: "operational_version"
                },{
                    label: i18n("Operational (No Version Needed)"),
                    value: "operational"
                }],
                required: true,
                value: initialType,
                description: i18n("The type of action this process is performing. " +
                "Specify \"Deployment\" to install a component or \"Uninstall\" to " +
                "remove a component. Specify \"Configuration Deployment\" to apply " +
                "new configuration settings to a component without installing files. " +
                "Specify an operational process to make changes to an installed component " +
                "without changing its status in the inventory. "),
                onChange: function(value) {
                    if (value === "deploy"
                            || value === "uninstall") {
                        if (!self.form.hasField("status")) {
                            self.showStatusSelect();
                        }
                    }
                    else {
                        if (self.form.hasField("status")) {
                            self.form.removeField("status");
                        }
                    }
                    if (self.mode === "firstDayWizard") {
                        FirstDayWizardUtil.boldLabelsOfRequiredFields();
                    }
                }
            }, "_type");
            if (initialType === "deploy"
                    || initialType === "uninstall") {
                self.showStatusSelect();
            }

            this.form.addField({
                name: "defaultWorkingDir",
                label: i18n("Default Working Directory"),
                type: "Text",
                bidiDynamicSTT: "FILE_PATH",
                required: true,
                value: this.existingValues.defaultWorkingDir
            });

            // -- Required role
            this.form.addField({
                name: "requiredRoleId",
                label: i18n("Required Role"),
                description: i18n("The role on the component which a user must have to execute this process"),
                url: bootstrap.baseUrl+"security/role",
                value: this.existingValues.requiredRoleId,
                allowNone: true,
                type: "TableFilterSelect",
                formatDropDownLabel: function(labelDomNode, item) {
                    labelDomNode.textContent = i18n(item.name);
                },
                enforceTranslatedDisplayValues: true
            });

            this.form.placeAt(this.formAttach);
        },

        /**
         *
         */
        isReadOnly: function() {
            if (this.readOnly) {
                return true;
            }

            if (this.isDraft &&
                this.componentProcess &&
                this.componentProcess.locked &&
                !this.componentProcess.currentUserIsLockOwner &&
                config.data.systemConfiguration.safeEditFeatureEnabled)
            {
                return true;
            }

            if (!this.isDraft &&
                this.componentProcess &&
                this.mode !== "firstDayWizard" &&
                config.data.systemConfiguration.safeEditFeatureEnabled)
            {
                return true;
            }

            return false;
        },

        /**
         *
         */
        getOnSaveRedirectHash: function(id) {
            if ((this.isDraft || !this.componentProcess) && config.data.systemConfiguration.safeEditFeatureEnabled) {
                return "draftComponentProcess/" + id + "/-1";
            }
            return "componentProcess/" + id + "/-1";
        },

        /**
         *
         */
        getConfigurationHash: function(componentProcess) {
            if (this.isDraft && config.data.systemConfiguration.safeEditFeatureEnabled) {
                return "draftComponentProcess/"+componentProcess.id + "/-1/configuration";
            }
            return "componentProcess/"+componentProcess.id + "/-1/configuration";
        },

        /**
         *
         */
        showStatusSelect: function() {
            var statusSelect = new RestSelect({
                disabled: this.readOnly,
                restUrl: bootstrap.restUrl+"deploy/status/inventoryStatuses",
                getLabel: function(item) {
                    return i18n(item.name);
                },
                getValue: function(item) {
                    // Back end expects status name
                    // Intentionally untranslated
                    return item.name;
                },
                getStyle: function(item) {
                    var result = {
                        backgroundColor: item.color
                    };
                    return result;
                },
                allowNone: false,
                value: this.existingValues.status
            });
            this.form.addField({
                name: "status",
                label: i18n("Inventory Status"),
                required: true,
                widget: statusSelect,
                description: i18n("The inventory status to add or remove.")
            }, "_type");
        }
    });
});

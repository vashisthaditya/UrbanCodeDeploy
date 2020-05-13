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
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/on",
        "deploy/widgets/workflow/activity/BaseActivity",
        "deploy/widgets/property/PropDefs",
        "js/webext/widgets/DialogMultiSelect",
        "js/webext/widgets/RestSelect"
        ],
function(
        array,
        declare,
        on,
        BaseActivity,
        PropDefs,
        DialogMultiSelect,
        RestSelect
) {
    return declare('deploy.widgets.workflow.activity.ManualTaskActivity',  [BaseActivity], {
        postCreate: function() {
            this.inherited(arguments);

            if (!this.initialized) {
                this.data.templateName = "TaskCreated";
                this.editProperties();
            }
        },

        getLabel: function() {
            var result = i18n("Manual Task");
            if (this.initialized) {
                result += "\n"+this.data.name;
            }
            return result;
        },

        /**
         *
         */
        editProperties: function(callback) {
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

                    self.data.name = data.name;
                    self.updateLabel();

                    self.data.commentRequired = data.commentRequired;

                    if (data.commentPrompt !== undefined) {
                        self.data.commentPrompt = data.commentPrompt;
                    }
                    else {
                        self.data.commentPrompt = "";
                    }

                    self.data.templateName = data.templateName;
                    self.data.userNames = data.userNames;
                    self.data.groupNames = data.groupNames;

                    self.data.propDefs = data.propDefs;
                    array.forEach(self.data.propDefs, function(propDef) {
                        propDef.resolveHttpValuesUrl = "rest/process/" + appState.process.id + "/" + data.name + "/propDefs/resolveHttpValues/" + propDef.name;
                    });

                    propertyDialog.hide();
                    propertyForm.destroy();
                    propertyDialog.destroy();
                },
                readOnly: self.readOnly
            });

            propertyForm.addField({
                name: "name",
                label: i18n("Name"),
                type: "Text",
                required: true,
                value: self.data.name
            });

            propertyForm.addField({
                name: "deployingUserOnly",
                label: i18n("Only Allow Deploying User To Complete"),
                description: i18n("Only the user that starts the deployment can approve or reject this task."),
                type: "Checkbox",
                required: false,
                value: self.data.deployingUserOnly,
                onChange: function(value) {
                    self.data.deployingUserOnly = value;
                    if (value) {
                        self.removeApprovalType();
                    }
                    else {
                        self.addApprovalType();
                    }
                }
            });

            if (!self.data.deployingUserOnly) {
                propertyForm.addField(self.generateGroupSelectField());
                propertyForm.addField(self.generateUserSelectField());
            }

            // -- Notification Template
            var templateNameSelect = new RestSelect({
                restUrl: bootstrap.restUrl+"notification/notificationEntry/templateNames",
                getLabel: function(item) {
                    return i18n(item);
                },
                getValue: function(item) {
                    return item;
                },
                allowNone: true,
                value: self.getTemplateName()
            });
            propertyForm.addField({
                name: "templateName",
                label: i18n("Template Name"),
                description: i18n("Template to use for this task."),
                required: false,
                widget: templateNameSelect
            });

            var propDefs = new PropDefs({
                propDefs: self.data.propDefs || [],
                propSheetDef: {resolveHttpValuesUrl: "rest/process/" + appState.process.id + "/" + self.data.name + "/propDefs/resolveHttpValues"}
            });
            propertyForm.addField({
                widget: propDefs,
                label: i18n("Properties"),
                name: "propDefs"
            });

            propertyForm.addField({
                name: "commentRequired",
                label: i18n("Require Comment"),
                type: "Checkbox",
                required: false,
                description: i18n("Whether the approving/rejecting user must enter a remark."),
                value: self.data.commentRequired
            });

            propertyForm.addField({
                name: "commentPrompt",
                label: i18n("Comment Prompt"),
                type: "Text Area",
                require: false,
                description: i18n("The prompt to show a user before they approve/reject this task."),
                value: self.data.commentPrompt
            });

            self.form = propertyForm;
            propertyForm.placeAt(propertyDialog.containerNode);
            propertyDialog.show();
        },

        getTemplateName: function() {
            var self = this;
            var templateName;
            if(self.data.templateName !== undefined) {
                templateName = self.data.templateName;
            }
            else {
                templateName = "TaskCreated";
            }
            return templateName;
        },

        removeApprovalType: function() {
            var self = this;
            self.form.removeField("userNames");
            self.form.removeField("groupNames");
        },

        addApprovalType: function() {
            var self = this;
            self.form.addField(self.generateGroupSelectField(), "templateName");
            self.form.addField(self.generateUserSelectField(), "templateName");
        },

        generateUserSelectField: function() {
            var self = this;
            var userSelect = new DialogMultiSelect({
                url: bootstrap.baseUrl+"security/user",
                getLabel: function(item) {
                    return item.name.escape();
                },
                getValue: function(item) {
                    return item.name;
                },
                value: self.data.userNames,
                noSelectionsLabel: i18n("No Users Selected")
            });

            return {
                name: "userNames",
                label: i18n("Users"),
                description: i18n("Users who can approve or reject this task."),
                widget: userSelect
            };
        },

        generateGroupSelectField: function() {
            var self = this;
            var groupSelect = new DialogMultiSelect({
                url: bootstrap.baseUrl+"security/group",
                getLabel: function(item) {
                    return item.name.escape();
                },
                getValue: function(item) {
                    return item.name;
                },
                value: self.data.groupNames,
                noSelectionsLabel: i18n("No Groups Selected")
            });

            return {
                name: "groupNames",
                label: i18n("Groups"),
                description: i18n("Groups who can approve or reject this task."),
                widget: groupSelect
            };
        }
    });
});

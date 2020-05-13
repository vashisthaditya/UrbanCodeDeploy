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
        "js/webext/widgets/RestSelect"
        ],
function(
        array,
        declare,
        on,
        BaseActivity,
        PropDefs,
        RestSelect
) {
    return declare([BaseActivity], {
        postCreate: function() {
            var self = this;
            this.inherited(arguments);

            if (appState.environment) {
                self.approvalParent = appState.environment;
            }
            if (appState.environmentTemplate) {
                self.approvalParent = appState.environmentTemplate;
            }

            this.baseResolveHttpValuesUrl = "rest/approval/approvalProcess/" + self.approvalParent.id + "/" + this.data.name + "/propDefs/resolveHttpValues/";

            if (!this.initialized) {
                this.data.name = util.randomString(30);

                this.editProperties();
            }
        },

        getLabel: function() {
            var result = i18n("Application Approval");

            if (this.initialized) {
                if (this.data.role) {
                    result += "\n"+this.data.role.name;
                }
                else {
                    result += i18n("\nDeleted Role");
                }
            }

            return result;
        },
        
        /**
         * 
         */
        editProperties: function(callback) {
            var self = this;

            var selectedRole = this.data.role;

            var propertyDialog = self.createPropertyDialog();
            var propertyForm = self.createPropertyForm({
                dialog: propertyDialog,
                onSubmit: function(data) {
                    self.initialized = true;

                    if (callback) {
                        callback();
                    }

                    self.data.commentRequired = data.commentRequired;

                    if (data.commentPrompt !== undefined) {
                        self.data.commentPrompt = data.commentPrompt;
                    }
                    else {
                        self.data.commentPrompt = "";
                    }

                    self.data.roleRestrictionData = {};
                    self.data.roleRestrictionData.contextType = "APPLICATION";
                    self.data.roleRestrictionData.roleRestrictions = [ { roleId: data.role } ];
                    self.data.role = selectedRole;
                    self.data.templateName = data.templateName;

                    self.data.propDefs = data.propDefs;
                    array.forEach(self.data.propDefs, function(propDef) {
                        propDef.resolveHttpValuesUrl = self.baseResolveHttpValuesUrl + propDef.name;
                    });

                    propertyDialog.hide();
                    propertyForm.destroy();
                    propertyDialog.destroy();

                    self.updateLabel();
                },
                readOnly: self.readOnly
            });

            var roleSelect = new RestSelect({
                restUrl: bootstrap.baseUrl+"security/role",
                value: !!this.data.role ? this.data.role.id : undefined,
                onChange: function(value, item) {
                    selectedRole = item;
                },
                allowNone: false
            });

            propertyForm.addField({
                name: "role",
                label: i18n("Role"),
                required: true,
                description: i18n("The role the approving user must have."),
                widget: roleSelect
            });

            var notificationTemplateSelect = new RestSelect({
                restUrl: bootstrap.restUrl+"notification/notificationEntry/templateNames",
                getLabel: function(item) {
                    return item;
                },
                getValue: function(item) {
                    return item;
                },
                allowNone: false,
                value: self.data.templateName || "ApprovalCreated",
                disabled: self.readOnly
            });

            propertyForm.addField({
                name: "templateName",
                label: i18n("Notification Template"),
                required: true,
                widget: notificationTemplateSelect
            });

            var propDefs = new PropDefs({
                propDefs: self.data.propDefs || [],
                propSheetDef: {resolveHttpValuesUrl: self.baseResolveHttpValuesUrl}
            });
            propertyForm.addField({
                widget: propDefs,
                label: "Properties",
                name: "propDefs"
            });

            propertyForm.addField({
                name: "commentRequired",
                label: i18n("Require Comment"),
                type: "Checkbox",
                required: false,
                description: i18n("Is a comment required for this approval request ?"),
                value: self.data.commentRequired
            });

            propertyForm.addField({
                name: "commentPrompt",
                label: i18n("Comment Prompt"),
                type: "Text Area",
                require: false,
                description: i18n("The comment that will be shown in the approval request."),
                value: self.data.commentPrompt
            });

            propertyForm.placeAt(propertyDialog.containerNode);
            propertyDialog.show();
        }
    });
});
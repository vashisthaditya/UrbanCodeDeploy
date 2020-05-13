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
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/RestSelect"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        ColumnForm,
        RestSelect
) {
    return declare('deploy.widgets.notification.EditNotificationEntry',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="editNotificationEntry">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        /**
         * 
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            this.existingValues = {};
            if (this.notificationEntry) {
                this.existingValues = this.notificationEntry;
            }
            
            this.form = new ColumnForm({
                submitUrl: bootstrap.restUrl+"notification/notificationEntry",
                postSubmit: function(data) {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                addData: function(data) {
                    if (self.notificationScheme) {
                        data.notificationSchemeId = self.notificationScheme.id;
                    }
                    if (self.notificationEntry) {
                        data.existingId = self.notificationEntry.id;
                    }
                },
                onCancel: function() {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                }
            });
            
            var roleSelect = new RestSelect({
                restUrl: bootstrap.baseUrl+"security/role",
                allowNone: false,
                autoSelectFirst: false,
                noIllegalValues: true,
                value: this.existingValues.roleId
            });
            this.form.addField({
                name: "roleId",
                label: i18n("Role"),
                description: i18n("Send notifications to members of this role on the same team as the target object."),
                required: true,
                widget: roleSelect
            });

            this.form.addField({
                name: "type",
                label: i18n("Event Type"),
                description: i18n("The type of events which will be used for this notification entry"),
                allowedValues: [{
                    label: i18n("Process Success"),
                    value: "PROCESS_SUCCESS"
                },{
                    label: i18n("Process Failure"),
                    value: "PROCESS_FAILURE"
                },{
                    label: i18n("Process Started"),
                    value: "PROCESS_STARTED"
                },{
                    label: i18n("Approval Completed"),
                    value: "APPROVAL_COMPLETED"
                },{
                    label: i18n("Approval Failed"),
                    value: "APPROVAL_FAILED"
                }],
                required: true,
                type: "Select",
                value: this.existingValues.type
            });
            
            this.form.addField({
                name: "resourceTypeName",
                label: i18n("Target"),
                description: i18n("The target object to send notifications on."),
                required: true,
                type: "Select",
                allowedValues: [{
                        label: i18n("Application"),
                        value: "Application"
                    },{
                        label: i18n("Environment"),
                        value: "Environment"
                    },{
                        label: i18n("Resource"),
                        value: "Resource"
                    }],
                value: this.existingValues.resourceTypeName,
                onChange: function(value) {
                    self.showResourceRoleSelect(value);
                }
            });
            
            if (this.existingValues.resourceTypeName) {
                this.showResourceRoleSelect(this.existingValues.resourceTypeName, this.existingValues.resourceRoleId);
            }
            else {
                this.showResourceRoleSelect("Application");
            }
            
            var templateNameSelect = new RestSelect({
                restUrl: bootstrap.restUrl+"notification/notificationEntry/templateNames",
                getLabel: function(item) {
                    return i18n(item);
                },
                getValue: function(item) {
                    return item;
                },
                allowNone: false,
                value: this.existingValues.templateName
            });
            this.form.addField({
                name: "templateName",
                label: i18n("Template Name"),
                description: i18n("Template to use for this type of event."),
                required: true,
                widget: templateNameSelect
            });
            this.form.placeAt(this.formAttach);
        },
        
        /**
         * 
         */
        showResourceRoleSelect: function(resourceType, value) {
            if (this.form.hasField("resourceRoleId")) {
                this.form.removeField("resourceRoleId");
            }
            
            var standardName = "Standard "+resourceType;
            var roleSelect = new RestSelect({
                restUrl: bootstrap.baseUrl+"security/resourceType/"+resourceType+"/resourceRoles",
                noneLabel: i18n(standardName),
                value: value
            });
            this.form.addField({
                name: "resourceRoleId",
                label: i18n("Type"),
                description: i18n("Notifications will be limited to objects which match this type."),
                widget: roleSelect
            }, "templateName");
        }
    });
});
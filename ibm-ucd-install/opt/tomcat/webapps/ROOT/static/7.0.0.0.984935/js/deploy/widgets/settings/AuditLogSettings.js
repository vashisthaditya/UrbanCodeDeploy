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
        "dojo/dom-construct",
        "dojo/dom-class"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        domConstruct,
        domClass
) {
    /**
     * Required properties:
     * columnForm:              The ColumnForm the widget should be added to.
     * formData:                The existing values for the auditLogSettings.
     * readOnly:                Whether or not fields should be edittable.
     */
    return declare('deploy.widgets.settings.AuditLogSettings',  [_Widget,  _TemplatedMixin], {
        templateString:
            '<div data-dojo-attach-point="attachPoint"></div>',

        postCreate: function() {
            var self = this;
            this.inherited(arguments);

            var auditLogSettingsContainer = domConstruct.create("div", {
                className: "inline-block settings-section"
            }, this.attachPoint);
            var auditLogSettings = domConstruct.create("div", {
                className: "settings-section-inner"
            }, auditLogSettingsContainer);

            var sectionLabelField = this.columnForm.addField({
                value: i18n("Audit Log"),
                style: {
                    fontWeight: "bold",
                    marginTop: "15px"
                },
                attachPoint: auditLogSettings,
                type: "SectionLabel"
            });

            domClass.add(sectionLabelField.widget.fieldRow, "section-label-row");
            var iconNode = sectionLabelField.widget.domAttach;
            domConstruct.create("div", {
                className: "inline-block settings-icon general-settings-section-header general-settings-icon"
            }, iconNode, "first");

            var readEntriesField = this.columnForm.addField({
                name: "auditLogReadEntriesEnabled",
                label: i18n("Enable Audit Log Entries for Read Events"),
                description: i18n("When this option is disabled, no READ events will " +
                        "be recorded in the audit log."),
                value: this.formData.auditLogReadEntriesEnabled,
                type: "Switch",
                attachPoint: auditLogSettings,
                readOnly: self.readOnly
            });

            domClass.add(readEntriesField.widget.fieldRow, "switch-widget-row");

            var auditCleanupEnabledSwitch = this.columnForm.addField({
                name: "auditLogCleanupEnabled",
                label: i18n("Enable Audit Log Cleanup"),
                description: i18n("Turn on this setting to enable audit log cleanup. " +
                    "If enabled, audit log entries older than the specified number of days will be removed daily " +
                    "at the specified time."),
                value: this.formData.auditLogCleanupEnabled,
                type: "Switch",
                attachPoint: auditLogSettings,
                readOnly: self.readOnly
            });

            var cleanupTime = new Date();
            cleanupTime.setHours(this.formData.auditLogCleanupHour);
            cleanupTime.setMinutes(this.formData.auditLogCleanupMinute);
            var auditCleanupTimeOfDayField = this.columnForm.addField({
                name: "auditLogCleanupTimeOfDay",
                label: i18n("Daily Cleanup Start Time"),
                description: i18n("The time of day to start the daily audit log cleanup."),
                value: cleanupTime,
                required: true,
                type: "Time",
                attachPoint: auditLogSettings,
                readOnly: self.readOnly
            });

            var auditLogRetentionDaysField = this.columnForm.addField({
                name: "auditLogRetentionLength",
                label: i18n("Days to Retain Audit Log Entries"),
                description: i18n("The default number of days to retain audit entries in the database. " +
                            "Valid range is 0 or greater."),
                value: this.formData.auditLogRetentionLength,
                type: "Text",
                attachPoint: auditLogSettings,
                readOnly: self.readOnly
            });

            var updateAuditCleanupFields = function(auditCleanupSwitchIsOn) {
                auditCleanupTimeOfDayField.widget.set('disabled', !auditCleanupSwitchIsOn);
                auditLogRetentionDaysField.widget.set('disabled', !auditCleanupSwitchIsOn);
            };

            auditCleanupEnabledSwitch.widget.onChange = updateAuditCleanupFields;

            updateAuditCleanupFields(this.formData.auditLogCleanupEnabled);
        }
    });
});

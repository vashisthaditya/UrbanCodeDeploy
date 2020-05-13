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
define([
        "dojo/_base/declare",
        "dojo/_base/connect",
        "dojo/io-query",
        "dijit/_Widget",
        "dijit/_TemplatedMixin",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/on",
        "dojo/_base/xhr",
        "dojo/topic",
        "dijit/form/Button",
        "dijit/form/CheckBox",
        "deploy/widgets/component/EditComponent",
        "deploy/widgets/Formatters",
        "deploy/widgets/settings/AuditLogSettings",
        "js/webext/widgets/Alert",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/table/TreeTable",
        "js/webext/widgets/ColumnForm"
        ],
function(
        declare,
        connect,
        ioQuery,
        _Widget,
        _TemplatedMixin,
        domClass,
        domConstruct,
        on,
        xhr,
        topic,
        Button,
        CheckBox,
        EditComponent,
        Formatters,
        AuditLogSettings,
        Alert,
        Dialog,
        GenericConfirm,
        TreeTable,
        ColumnForm
) {

/**
 *
 */
    return declare(
        [_Widget, _TemplatedMixin],
        {
            templateString:
                '<div class="componentList">' +
                    '<div class="listTopButtons" data-dojo-attach-point="buttonTopAttach"></div>' +
                    '<div data-dojo-attach-point="gridAttach"></div>' +
                '</div>',

            postCreate: function() {
                this.inherited(arguments);
                var self = this;

                var gridLayout = [{
                    name: i18n("Date"),
                    field: "date",
                    formatter: util.tableDateFormatter,
                    orderField: "date",
                    getRawValue: function(item) {
                        return new Date(item.date);
                    },
                    filterField: "date",
                    filterType: "date",
                    filterClass: "Long"
                },{
                    name: i18n("User Name"),
                    field: "userName",
                    orderField: "userName",
                    filterField: "userName",
                    filterType: "text"
                },{
                    name: i18n("Event Type"),
                    field: "eventType",
                    orderField: "eventType",
                    filterField: "eventType",
                    filterType: "text"
                },{
                    name: i18n("Description"),
                    field: "description",
                    orderField: "description",
                    filterField: "description",
                    filterType: "text"
                },{
                    name: i18n("Object Type"),
                    field: "objType",
                    orderField: "objType",
                    filterField: "objType",
                    filterType: "text"
                },{
                    name: i18n("Object Name"),
                    field: "objName",
                    orderField: "objName",
                    filterField: "objName",
                    filterType: "text"
                },{
                    name: i18n("Status"),
                    field: "status",
                    orderField: "status",
                    filterField: "status",
                    filterType: "text",
                    formatter: function(item, value) {
                        return i18n(value);
                    }
                },{
                    name: i18n("IP Address"),
                    filterField: "ipAddress",
                    field: "ipAddress",
                    filterType: "text",
                    formatter: function(item) {
                        var result = item.ipAddress;
                        if (!result) {
                            result = i18n("Not Available");
                        }
                        return result;
                    }
                }];

                this.grid = new TreeTable({
                    url: bootstrap.restUrl+"auditentry",
                    noDataMessage: i18n("No Audit Entries Found."),
                    tableConfigKey: "auditEntryTable",
                    sortType: "desc",
                    orderField: "date",
                    columns: gridLayout,
                    hidePagination: false,
                    hideExpandCollapse: true
                });
                this.grid.placeAt(this.gridAttach);

                if (config.data.permissions[security.system.manageAuditLog]) {
                    var cleanupLogButton = {
                        "label": i18n("Cleanup Log"),
                        "showTitle": false,
                        "onClick": function() {
                            self.showCleanupLogDialog();
                        }
                    };
    
                    var topButton = new Button(cleanupLogButton);
                    domClass.add(topButton.domNode, "idxButtonSpecial");
                    topButton.placeAt(this.buttonTopAttach);
                }

                var csvButtonOpts = {
                    "label": i18n("Download As CSV"),
                    "showTitle": false,
                    "onClick": function() {
                        util.downloadFile(bootstrap.restUrl + "auditentry/csv?"
                                + ioQuery.objectToQuery(self.grid._getQueryData()));
                    }
                };

                var csvButton = new Button(csvButtonOpts);
                csvButton.placeAt(this.buttonTopAttach);

                if (config.data.permissions[security.system.viewBasicSystemSettings]) {
                    var settingsButton = new Button({
                        label: i18n("Audit Log Settings"),
                        onClick: function() {
                            self.showAuditLogSettings();
                        }
                    });
                    settingsButton.placeAt(this.buttonTopAttach);
                }
            },

            /**
             *
             */
            destroy: function() {
                this.inherited(arguments);
                this.grid.destroy();
            },

            showCleanupLogDialog: function() {
                var self = this;

                var dialog = new Dialog({
                    "title": i18n("Cleanup Audit Log"),
                    "closable":true,
                    "draggable":true
                });

                var form = new ColumnForm({
                    submitUrl : bootstrap.restUrl+"auditentry/",
                    addData: function(data) {
                        if (data.date && data.time) {
                            data.date = util.combineDateAndTime(data.date, data.time).valueOf();
                        }
                    },
                    postSubmit: function(data) {
                        dialog.hide();
                        dialog.destroy();
                        self.grid.refresh();
                    },
                    onError: function(error) {
                        var errorAlert = new Alert({
                            title: i18n("Error"),
                            messages: [i18n("An error has occurred while cleaning the audit log:"),
                                       "",
                                       util.escape(error.responseText)]
                        });
                    },
                    onCancel: function() {
                        dialog.hide();
                        dialog.destroy();
                    },
                    saveLabel: i18n("Submit")
                });

                form.addField({
                    name: "date",
                    label: i18n("Date"),
                    required: true,
                    type: "Date"
                });
                form.addField({
                    name: "time",
                    label: i18n("Time"),
                    required: true,
                    type: "Time"
                });


                form.placeAt(dialog);

                dialog.show();
            },

            showAuditLogSettings: function() {
                var self = this;

                self.dialog = new Dialog({
                    closable: true,
                    draggable: true,
                    title: i18n("System Settings")
                });

                xhr.get({
                    url: bootstrap.restUrl + "system/configuration/auditLogSettings",
                    handleAs: "json",
                    load: function(data) {
                        self.createAuditLogSettingsForm(data);
                    }
                });
            },

            createAuditLogSettingsForm: function(data) {
                var self = this;

                var form = new ColumnForm({
                    submitUrl: bootstrap.restUrl + "system/configuration/auditLogSettings",
                    addData: function(data) {
                        if (data.auditLogCleanupTimeOfDay) {
                            data.auditLogCleanupHour = data.auditLogCleanupTimeOfDay.getHours();
                            data.auditLogCleanupMinute = data.auditLogCleanupTimeOfDay.getMinutes();
                        }
                    },
                    postSubmit: function(data) {
                        self.dialog.hide();
                        self.dialog.destroy();
                    },
                    onError: function(error) {
                        var errorAlert = new Alert({
                            title: i18n("Error"),
                            messages: [i18n("An error has occurred while saving the audit log settings:"),
                                       "",
                                       util.escape(error.responseText)]
                        });
                    },
                    onCancel: function() {
                        self.dialog.destroy();
                    },
                    readOnly: (!config.data.permissions[security.system.editBasicSystemSettings] ||
                               !config.data.permissions[security.system.manageAuditLog])
                });
                form.placeAt(self.dialog);

                data.auditLogCleanupEnabled = !form.readOnly && data.auditLogCleanupEnabled;
                var auditSettings = new AuditLogSettings({
                    columnForm: form,
                    formData: data
                });
                auditSettings.placeAt(form.formAttach, "first");



                self.dialog.show();
            }
        }
    );
});

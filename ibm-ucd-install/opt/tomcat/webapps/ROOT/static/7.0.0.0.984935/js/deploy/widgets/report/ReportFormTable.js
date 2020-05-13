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
        "dijit/form/Button",
        "dijit/form/CheckBox",
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/dom-attr",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/on",
        "dojo/mouse",
        "dojo/io-query",
        "js/webext/widgets/Alert",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Dialog",
        "deploy/widgets/report/deploymentReport/DeploymentReportForm",
        "deploy/widgets/report/deploymentCount/DeploymentCountReportForm",
        "deploy/widgets/report/securityReportUser/SecurityReportUserForm",
        "deploy/widgets/report/deploymentReport/DeploymentReportTable",
        "deploy/widgets/report/deploymentCount/DeploymentCountReportTable",
        "deploy/widgets/report/deploymentCount/DeploymentDurationSumReportTable",
        "deploy/widgets/report/deploymentCount/DeploymentDurationAverageReportTable",
        "deploy/widgets/report/securityReportApplication/SecurityReportApplicationTable",
        "deploy/widgets/report/securityReportEnvironment/SecurityReportEnvironmentTable",
        "deploy/widgets/report/securityReportResource/SecurityReportResourceTable",
        "deploy/widgets/report/securityReportComponent/SecurityReportComponentTable",
        "deploy/widgets/report/securityReportUser/SecurityReportUserTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        CheckBox,
        array,
        declare,
        domAttr,
        domClass,
        domConstruct,
        on,
        mouse,
        ioQuery,
        Alert,
        ColumnForm,
        Dialog,
        DeploymentReportForm,
        DeploymentCountReportForm,
        SecurityReportUserForm,
        DeploymentReportTable,
        DeploymentCountReportTable,
        DeploymentDurationSumReportTable,
        DeploymentDurationAverageReportTable,
        SecurityReportApplicationTable,
        SecurityReportEnvironmentTable,
        SecurityReportResourceTable,
        SecurityReportComponentTable,
        SecurityReportUserTable
) {
    return declare('deploy.widgets.report.ReportFormTable',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="report-form-table">' +
                '<div data-dojo-attach-point="breadcrumbContainer">' +
                    '<div data-dojo-attach-point="scheduleLinkAttach" class="report-link inlineBlock"></div>' +
                    '<div data-dojo-attach-point="csvLinkAttach" class="report-link inlineBlock"></div>' +
                    '<div data-dojo-attach-point="printLinkAttach" class="report-link inlineBlock"></div>' +
                    '<div data-dojo-attach-point="breadcrumbAttach" class="report-breadcrumb inlineBlock"></div>' +
                    '<div>' +
                      '<div class="inlineBlock report-form" data-dojo-attach-point="reportFormAP">' +
                        '<div data-dojo-attach-point="datePickerAttach" class="report-date-picker report-form-field inlineBlock"></div>' +
                        '<div data-dojo-attach-point="formAttach" class="inlineBlock report-form-field"></div>' +
                      '</div>' +
                      '<div class="report-button-span report-form-field inlineBlock" data-dojo-attach-point="reportButtonSpanAP">' +
                        '<div class="inlineBlock report-buttons" data-dojo-attach-point="reportButtonAttach"></div>' +
                      '</div>' +
                    '</div>' +
                    '<div class="description-span inlineBlock" data-dojo-attach-point="descriptionAttach"></div>' +
                '</div>' +
                '<div data-dojo-attach-point="tableAttach" class="report-table"></div>' +
            '</div>',

        runButtonAttach : null,
        saveButtonAttach : null,
        formAttach : null,
        tableAttach : null,

        report : null,
        form : null,
        table : null,
        saveButton : null,
        runButton : null,
        scheduleLinkAttach : null,
        csvLinkAttach : null,
        printLinkAttach : null,

        constructor: function(args) {
            if (!args.reportRestUrlBase) {
                this.reportRestUrlBase = bootstrap.restUrl + "report/";
            }
            if (!args.reportHashBase) {
                this.reportHashBase = 'reports/';
            }

            if (args.report) {
                this.report = args.report;
            }
        },

        buildRendering: function() {
            this.inherited(arguments);
        },

        postCreate : function() {
            this.inherited(arguments);
            var t = this;

            if (t.report) {
                var reportFormWidgetClass = t._getFormForType(t.report.type);
                domClass.remove(this.breadcrumbAttach, "has-form-widget");

                if (reportFormWidgetClass !== undefined) {
                    t.form = new reportFormWidgetClass({report: t.report, 'datePickerAttach':t.datePickerAttach});
                    t.form.placeAt(t.formAttach);
                    domClass.add(this.breadcrumbAttach, "has-form-widget");

                    t.renderReport();
                    var buttonContainerSpacer = domConstruct.create("div", {innerHTML: "&nbsp;"}, t.reportButtonAttach);
                    var buttonContainer = domConstruct.create("div", {className: "report-button"}, t.reportButtonAttach);

                    t.runButton = new Button({
                        label: i18n("Run"),
                        showTitle: false,
                        onClick: function(){
                            t.requestPreviewReport();
                        },
                        'class':"reportButton"
                    });
                    t.runButton.set("disabled", false);
                    t.runButton.placeAt(buttonContainer);
                    domClass.add(t.runButton.domNode, "idxButtonSpecial idxButtonCompact");

                    // save report button
                    t.saveButton = new Button({
                        label: i18n("Save"),
                        showTitle: false,
                        onClick: function() {
                           t.showSaveFilterDialog();
                        },
                        'class':"reportButton"
                    });
                    t.saveButton.set("disabled", false);
                    t.saveButton.placeAt(buttonContainer);
                    domClass.add(t.saveButton.domNode, "idxButtonCompact");

                    if (t.report.description) {
                        domConstruct.create("span", {innerHTML: i18n("Description") + ": ", className: "bold"}, t.descriptionAttach);
                        domConstruct.create("span", {innerHTML: util.applyBTD(util.escape(t.report.description))}, t.descriptionAttach);
                    }
                }
                else {
                    t.renderReport();
                }
            }
        },

        renderReport: function(/*Object*/ args) {
            var t = this;

            // clear old report results
            if (t.table) {
                t.table.destroy();
                t.table = null;
            }
            domConstruct.empty(t.breadcrumbAttach);
            domConstruct.empty(t.tableAttach);
            domConstruct.empty(t.scheduleLinkAttach);
            domConstruct.empty(t.csvLinkAttach);


            if (t.report) {

                var url = t.reportRestUrlBase;
                if (t.report.system) {
                    url = url + "system/";
                }
                else if (t.report.shared) {
                    url = url + "shared/";
                }

                t.renderBreadcrumb();

                var resultsUrl =  url + util.encodeIgnoringSlash(t.report.name) + "/results";

                var tableConstructor = t._getReportDisplayWidget(t.report.type);
                var csvUrl = url + t.report.name + "/csv";
                t.table = new tableConstructor({
                    nonEmptyCallback: function (/*Object*/ args) {
                        args.csvUrl = csvUrl;
                        t.generateLinks(args);
                    }
                });
                t.table.placeAt(t.tableAttach);
                t.table.renderReport(resultsUrl);
            }
        },

        renderBreadcrumb: function() {
            var t = this;
            var breadcrumb = [];
            if (t.report.system) {
                if (t.report.name.indexOf("Deployment") > -1) {
                    breadcrumb.push(i18n("Deployment"));
                }
                else if (t.report.name.indexOf("Security") > -1) {
                    breadcrumb.push(i18n("Security"));
                }
                breadcrumb.push(i18n(t.report.name));
            } else {
                breadcrumb.push(i18n("My Reports"));
                breadcrumb.push(util.applyBTD(util.escape(t.report.name)));
            }

            var breadcrumbString = "";
            array.forEach(breadcrumb, function(word, index) {
                if (index > 0) {
                    breadcrumbString += " <img src=\"" + bootstrap.imageUrl + "deploy/arrow_report_breadcrumbs.png" + "\"> ";
                }
                breadcrumbString += word;
            });
            domClass.add(t.breadcrumbContainer, "report-breadcrumb-container");
            t.breadcrumbAttach.innerHTML = breadcrumbString;

        },

        showSaveFilterDialog : function() {
            var t = this;

            this.saveFilterDialog = new Dialog({
                title: i18n("Save Current Filters"),
                closable: true,
                draggable: true
            });

            var type = t.report.type;

            var saveFilterForm = new ColumnForm({
                submitUrl: t.reportRestUrlBase,
                submitMethod : "PUT",
                addData : function(data) {
                    var result = [];
                    result = result.concat(t.form.getProperties());
                    data.properties = result;

                    var displayConfig = t.table.getDisplayConfig();
                    if (displayConfig) {
                        data.hiddenColumns = displayConfig.hiddenColumns;
                        if (displayConfig.orderField && displayConfig.sortType) {
                            data.properties.push({
                                name: "orderField",
                                value: displayConfig.orderField
                            });
                            data.properties.push({
                                name: "sortType",
                                value: displayConfig.sortType
                            });
                        }
                    }
                    data.reportType = t.report.type;
                },
                postSubmit : function(responseData) {
                    var type = responseData.type;
                    var name = responseData.name;
                    var hash = t.reportHashBase;

                    if (responseData.shared) {
                        hash = hash + "shared/";
                    }
                    hash = hash + util.encodeIgnoringSlash(name);
                    navBar.setHash(hash,false,true);

                    t.saveFilterDialog.hide();
                    t.saveFilterDialog.destroy();
                },
                onCancel : function() {
                    t.saveFilterDialog.onCancel();
                }
            });

            saveFilterForm.addField({
                name: "name",
                label:i18n("Name"),
                required:true,
                type:"Text",
                value: t.report.name
            });

            saveFilterForm.addField({
                name: "description",
                label:i18n("Description"),
                required:false,
                type:"Text Area",
                value: t.report.description
            });

            saveFilterForm.placeAt(this.saveFilterDialog.containerNode);

            this.saveFilterDialog.show();
        },

        requestPreviewReport: function() {
            var t = this;
            var type = t.report.type;
            if(type) {

                var displayConfig;
                // get table config, then clear old report results
                if (t.resultWidget) {
                    displayConfig = t.resultWidget.getDisplayConfig();
                    t.resultWidget.destroy();
                    t.resultWidget = null;
                } else if (t.table && t.table.getDisplayConfig) {
                    displayConfig = t.table.getDisplayConfig();
                }

                domConstruct.empty(t.tableAttach);
                if (t.csvLinkAttach) {
                    domConstruct.empty(t.csvLinkAttach);
                }

                if (t.printLinkAttach) {
                    domConstruct.empty(t.printLinkAttach);
                }

                var reportObject = {};
                reportObject.type = type;
                reportObject.isAdHoc = true;
                var properties = [];
                properties = properties.concat(t.form.getProperties());
                if (displayConfig && displayConfig.orderField && displayConfig.sortType) {
                    properties.push({
                        name: "orderField",
                        value: displayConfig.orderField
                    });
                    properties.push({
                        name: "sortType",
                        value: displayConfig.sortType
                    });
                }
                array.forEach(properties, function(property) {
                    reportObject[property.name] = property.value;
                });

                var offendingProperties = [];
                if (type === "deploymentCount") {
                    var requiredProperties = ["application", "time_unit"];
                    var definedProperties = [];
                    array.forEach(properties, function(property, index) {
                        definedProperties.push(property.name);
                    });
                    array.forEach(requiredProperties, function(requiredPropName, index) {
                        if (definedProperties.indexOf(requiredPropName) < 0 ) {
                            offendingProperties.push(requiredPropName);
                        }
                    });
                }                var query = ioQuery.objectToQuery(reportObject);
                if (displayConfig && displayConfig.hiddenColumns) {
                    reportObject.hiddenColumns = displayConfig.hiddenColumns;
                }
                reportObject.query = query;
                reportObject.properties = properties;
                reportObject.name = i18n("Unsaved Report");

                if (offendingProperties.length) {
                    var missingPropertiesAlert = new Alert({
                        title: i18n("Missing Report Parameters"),
                        draggable: true,
                        message: i18n("Please select the following parameters: %s", util.escape(offendingProperties.toString()))
                    });
                } else {
                    var resultWidgetConstructor = t._getReportDisplayWidget(type);
                    t.resultWidget = new resultWidgetConstructor({
                            nonEmptyCallback: function (/*Object*/ args) {
                                t.generateLinks(args);
                            }
                    });

                    t.resultWidget.placeAt(t.tableAttach);

                    t.resultWidget.renderAdHocReport({
                        report: reportObject,
                        errorCallback: function(offending) {

                            var emptyReportAlert = new Alert({
                                title: i18n("Missing Report Parameters"),
                                draggable: true,
                                message: i18n("Missing parameters: %s", util.escape(offending.toString()))
                            });
                        }
                    });
                }

            } else {
                var emptyReportAlert = new Alert({
                    title: i18n("Missing Report Parameters"),
                    draggable: true,
                    message: i18n("Please select a report type")
                });
            }
        },

        generateLinks: function(/*Object*/ args) {
            var t = this;
            domConstruct.empty(t.scheduleLinkAttach);
            domConstruct.empty(t.csvLinkAttach);
            domConstruct.empty(t.printLinkAttach);
            if (args.reportLength) {
                var csvLink = util.createDownloadAnchor({
                    href: args.csvUrl
                }, t.csvLinkAttach);
                var csvIcon = domConstruct.create("div", {
                    className: "linkPointer general-icon download-icon",
                    title: i18n("Download CSV"),
                    alt: i18n("Download CSV")
                }, csvLink);
                this.own(on(csvLink, mouse.enter, function(){
                    var tableData = t.table.reportMetadata;
                    var hiddenColumns = tableData ? tableData.hiddenColumns : [];
                    var hiddenColumnsString = "";
                    // Build out URL query string for any hidden columns to not show when downloading csv.
                    array.forEach(hiddenColumns, function(column){
                        if (column !== "applicationRequestId"){
                            if (hiddenColumnsString !== ""){
                                hiddenColumnsString += "&";
                            }
                            else {
                                hiddenColumnsString += "?";
                            }
                            hiddenColumnsString += "hiddenColumns=" + column.toLowerCase();
                        }
                    });
                    domAttr.set(csvLink, "href", args.csvUrl + hiddenColumnsString);
                }));

                if (!t.report.system) {
                    var scheduleIcon = domConstruct.create("div", {
                        className: "linkPointer general-icon schedule-icon",
                        title:i18n("Schedule Recurring Report"),
                        alt: i18n("Schedule Recurring Report")
                    }, t.scheduleLinkAttach);
                    on(scheduleIcon, "click", function() {
                        var scheduleDialog = new Dialog({
                            title: i18n("Schedule Recurring Report"),
                            closable: true
                        });
                        t.callback = function() {
                            scheduleDialog.hide();
                            scheduleDialog.destroy();
                        };
                        t.showScheduleDialog();
                        t.scheduleForm.placeAt(scheduleDialog.containerNode);
                        scheduleDialog.show();
                    });
                }

                if (args.printReport) {
                    var printIcon = domConstruct.create("div", {
                        className: "linkPointer general-icon print-icon",
                        title: i18n("Print Report"),
                        alt: i18n("Print Report")
                    }, t.printLinkAttach);
                    on(printIcon, "click", function() {
                        args.printReport();
                    });
                }
            }
        },

        destroy: function() {
            if (this.table) {
                this.table.destroy();
            }
            if (this.form) {
                this.form.destroy();
            }
            if (this.saveButton) {
                this.saveButton.destroy();
            }
            if (this.runButton) {
                this.runButton.destroy();
            }
            this.inherited(arguments);
        },

        _getFormForType: function(type) {
            var widgetClass;
            if (type === 'com.urbancode.ds.subsys.report.domain.deployment_report.DeploymentReport') {
                widgetClass = DeploymentReportForm;
            }
            else if (type === 'com.urbancode.ds.subsys.report.domain.deployment_count.DeploymentCountReport') {
                widgetClass = DeploymentCountReportForm;
            }
            else if (type === 'com.urbancode.ds.subsys.report.domain.deployment_count.DeploymentDurationSumReport') {
                widgetClass = DeploymentCountReportForm;
            }
            else if (type === 'com.urbancode.ds.subsys.report.domain.deployment_count.DeploymentDurationAverageReport') {
                widgetClass = DeploymentCountReportForm;
            }
            else if (type === 'com.urbancode.ds.subsys.report.domain.security_report.application.SecurityReportApplication') {
                widgetClass = undefined;
            }
            else if (type === 'com.urbancode.ds.subsys.report.domain.security_report.component.SecurityReportComponent') {
                widgetClass = undefined;
            }
            else if (type === 'com.urbancode.ds.subsys.report.domain.security_report.resource.SecurityReportResource') {
                widgetClass = undefined;
            }
            else if (type === 'com.urbancode.ds.subsys.report.domain.security_report.environment.SecurityReportEnvironment') {
                widgetClass = undefined;
            }
            else if (type === 'com.urbancode.ds.subsys.report.domain.security_report.user.SecurityReportUser') {
                widgetClass = SecurityReportUserForm;
            }
            return widgetClass;
        },

        _getReportDisplayWidget: function(type) {
            var widgetClass;
            if (type === 'com.urbancode.ds.subsys.report.domain.deployment_report.DeploymentReport') {
                widgetClass = DeploymentReportTable;
            }
            else if (type === 'com.urbancode.ds.subsys.report.domain.deployment_count.DeploymentCountReport') {
                widgetClass = DeploymentCountReportTable;
            }
            else if (type === 'com.urbancode.ds.subsys.report.domain.deployment_count.DeploymentDurationSumReport') {
                widgetClass = DeploymentDurationSumReportTable;
            }
            else if (type === 'com.urbancode.ds.subsys.report.domain.deployment_count.DeploymentDurationAverageReport') {
                widgetClass = DeploymentDurationAverageReportTable;
            }
            else if (type === 'com.urbancode.ds.subsys.report.domain.security_report.application.SecurityReportApplication') {
                widgetClass = SecurityReportApplicationTable;
            }
            else if (type === 'com.urbancode.ds.subsys.report.domain.security_report.environment.SecurityReportEnvironment') {
                widgetClass = SecurityReportEnvironmentTable;
            }
            else if (type === 'com.urbancode.ds.subsys.report.domain.security_report.resource.SecurityReportResource') {
                widgetClass = SecurityReportResourceTable;
            }
            else if (type === 'com.urbancode.ds.subsys.report.domain.security_report.component.SecurityReportComponent') {
                widgetClass = SecurityReportComponentTable;
            }
            else if (type === 'com.urbancode.ds.subsys.report.domain.security_report.user.SecurityReportUser') {
                widgetClass = SecurityReportUserTable;
            }
            return widgetClass;
        },

        showScheduleOptions: function() {
            var self = this;

            self.scheduleForm.addField({
                name: "date",
                label: i18n("Date"),
                required: true,
                type: "Date"
            }, "_scheduleInsert");
            self.scheduleForm.addField({
                name: "time",
                label: i18n("Time"),
                required: true,
                type: "Time"
            }, "_scheduleInsert");

            self.scheduleForm.addField({
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

            self.stopScheduleCheckbox = new CheckBox({
                onChange: function(newValue) {
                    if (!newValue) {
                        self.scheduleForm.removeField("stopScheduleCheckbox");
                        self.showScheduleOptions();
                    }
                    else {
                        self.scheduleForm.removeField("date");
                        self.scheduleForm.removeField("time");
                        if (self.scheduleForm.hasField("recurrencePattern")) {
                            self.scheduleForm.removeField("recurrencePattern");
                        }
                    }
                }
            });

            self.scheduleForm.addField({
                name: "stopScheduleCheckbox",
                label: i18n("Stop scheduling this report?"),
                widget: self.stopScheduleCheckbox
            }, "_scheduleInsert");
        },

        showScheduleDialog: function() {
            var self = this;

            //make a dialog and attach the columnform to the dialog
            self.scheduleForm = new ColumnForm({
                addData: function(data) {
                    if (data.date && data.time) {
                        data.startDate = util.combineDateAndTime(data.date, data.time).valueOf();
                    }
                    if (data.stopScheduleCheckbox) {
                        data.stopSchedulingReport = true;
                    }
                    else {
                        data.stopSchedulingReport = false;
                    }
                },
                submitUrl: bootstrap.restUrl+"report/"+self.report.name+"/scheduledReport",
                postSubmit: function(data) {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                onCancel: function() {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                onError: function(error) {
                    if (self.callback !== undefined) {
                        self.callback();
                    }

                    var errorAlert = new Alert({
                        title: i18n("Error"),
                        messages: [i18n("An error has occurred while scheduling the report:"),
                                   "",
                                   util.escape(error.responseText)]
                    });
                },
                saveLabel: i18n("Submit")
            });
            self.showScheduleOptions();
        }

    });
});

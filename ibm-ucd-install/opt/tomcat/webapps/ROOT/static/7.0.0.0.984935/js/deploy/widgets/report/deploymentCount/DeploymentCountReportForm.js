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
        "dijit/form/Select",
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/dom-construct",
        "deploy/widgets/DateRangeSelector",
        "js/webext/widgets/FormDelegates"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Select,
        array,
        declare,
        domConstruct,
        DateRangeSelector,
        FormDelegates
) {
    return declare('deploy.widgets.report.deploymentCount.DeploymentCountReportForm',  [_Widget, _TemplatedMixin], {
        templateString: '<div></div>',

        applicationSelect: null,
        //aggregationSelect: null,
        report: null,
        datePickerAttach:null,

        constructor: function(/*object*/args) {
            var t = this;
            t.applicationRestUrl = bootstrap.restUrl+"deploy/application";
            if (args.report) {
                t.report = args.report;
            }

            if (args.datePickerAttach) {
                t.datePickerAttach = args.datePickerAttach;
            }
        },

        buildRendering: function() {
            this.inherited(arguments);

            var t = this;

            var appDiv = domConstruct.create("div", {'class':'inlineBlock report-form-field'}, t.domNode);
            domConstruct.create("div", {"innerHTML":i18n("Application")}, appDiv);
            t.applicationSelect = FormDelegates.retrieveDelegate("TableFilterMultiSelect")({
                "url": t.applicationRestUrl,
                "idAttribute": "id",
                "name": "application",
                "placeHolder": i18n("Any"),
                "formatDropDownLabel": function(labelDomNode, item) { labelDomNode.innerHTML = item.name.escape(); }
            });
            t.applicationSelect.placeAt(appDiv);

            t.dateRangeSelector = new DateRangeSelector();
            domConstruct.create("div", {"innerHTML":i18n("Date Range"), 'class':"inlineBlock report-form-field"}, t.datePickerAttach);
            t.dateRangeSelector.placeAt(t.datePickerAttach);

            var statusCriteriaDiv = domConstruct.create("div", {'class':'inlineBlock report-form-field'}, t.domNode);
            domConstruct.create("div", {"innerHTML": i18n("Status")}, statusCriteriaDiv);
            t.statusCriteriaSelect = new Select({
                "name": "statusCriteria",
                "required": true,
                "options": [
                  { "label": i18n("Success or Failure"), "value": "BOTH", "selected": true },
                  { "label": i18n("Success"), "value": "SUCCESS" },
                  { "label": i18n("Failure"), "value": "FAILURE" }
                ]
            });
            t.statusCriteriaSelect.placeAt(statusCriteriaDiv);


            var pluginDiv = domConstruct.create("div", {'class':'inlineBlock report-form-field'}, t.domNode);
            domConstruct.create("div", {"innerHTML": i18n("Plugin")}, pluginDiv);
            t.pluginSelect = FormDelegates.retrieveDelegate("TableFilterSelect")({
                "url": bootstrap.restUrl+"plugin/automationPlugin",
                "name": "plugin",
                "allowNone": true,
                "placeHolder": i18n("Any"),
                "formatDropDownLabel": function(labelDomNode, item) { labelDomNode.innerHTML = i18n(item.name.escape()); }
            });
            t.pluginSelect.placeAt(pluginDiv);

            t.setProperties(t.report.properties);
        },

        destroy: function() {
            var t = this;
            this.inherited(arguments);
            t.applicationSelect.destroy();
            t.pluginSelect.destroy();
            t.statusCriteriaSelect.destroy();
            t.dateRangeSelector.destroy();
        },

        setProperties: function(/* Array*/ properties) {
            var t = this;

            var setFormWidgetProp = function(formWidget, name, value) {
                if (formWidget.get("name") === name) {
                    formWidget.set("value", value);


                    // environment depends upon applicationselect, so this has to be async
                    if (name === "app") {
                        t.updateEnvironmentOptions(value);
                    }
                }
            };

            array.forEach(properties, function(prop){
                var propName = prop.name;
                var propValue = prop.value;

                setFormWidgetProp(t.applicationSelect, propName, propValue);
                setFormWidgetProp(t.statusCriteriaSelect, propName, propValue);
                setFormWidgetProp(t.pluginSelect, propName, propValue);

                if (propName === "time_unit") {
                    t.dateRangeSelector.timeUnit = propValue;
                }
                if (propName === "dateRange") {
                    t.dateRangeSelector.set('value', propValue);
                }
                if (propName === "startDate") {
                    t.dateRangeSelector.startDate = new Date(Number(propValue));
                }
                if (propName === "endDate") {
                    t.dateRangeSelector.endDate = new Date(Number(propValue));
                }
            });
        },

        getProperties: function() {
            var t = this;

            var properties = [];
            var addFormWidgetProp = function(formWidget, isTime) {
                var name = formWidget.get('name');
                var value;
                if (name === "plugin") {
                    var item = formWidget.get('item');
                    if (item) {
                        value = item.name;
                    }
                    else {
                        value = formWidget.get('value');
                    }
                }
                else {
                    value = formWidget.get('value');
                }
                if (name && value) {
                    if (isTime) {
                        properties.push({ "name": name, "value": value.getTime() });
                    }
                    else {
                        properties.push({ "name": name, "value": value });
                    }
                }
            };

            addFormWidgetProp(t.applicationSelect);
            addFormWidgetProp(t.statusCriteriaSelect);
            addFormWidgetProp(t.pluginSelect);

            if (t.dateRangeSelector) {
                properties.push({"name":"time_unit", "value":t.dateRangeSelector.getTimeUnit()});
                properties.push({"name":"dateRange", "value":t.dateRangeSelector.get('value')});
                    if (t.dateRangeSelector.getStartDate() !== null) {
                        properties.push({"name":"startDate", "value":t.dateRangeSelector.getStartDate().getTime()});
                    }

                    if (t.dateRangeSelector.getEndDate() !== null) {
                        properties.push({"name":"endDate", "value":t.dateRangeSelector.getEndDate().getTime()});
                    }
                }

            return properties;
        }
    });
});

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
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "js/webext/widgets/Alert",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/RestSelect"
        ],
function(
        _TemplatedMixin,
        _Widget,
        array,
        declare,
        lang,
        Alert,
        ColumnForm,
        RestSelect
) {
    return declare('deploy.widgets.component.RunComponentProcess',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="deploy">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            this.componentProcessProperties = undefined;

            var deploySubmitUrl = bootstrap.restUrl+"deploy/component/"+this.component.id+"/runProcess";
            
            this.form = new ColumnForm({
                submitUrl: deploySubmitUrl,
                addData: function(data) {
                    data.properties = {};
                    if (self.selectedComponentProcess !== undefined) {
                        // Add all properties for the component process from the form.
                        array.forEach(self.selectedComponentProcess.unfilledProperties, function(property) {
                            data.properties[property.name] = data["p_"+property.name];
                        });
                    }
                },
                postSubmit: function(data) {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                    navBar.setHash("componentProcessRequest/"+data.requestId+"/log", false, true);
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

                    var alert = new Alert({
                        title: i18n("Error"),
                        messages: [i18n("An error has occurred while starting the component process:"),
                                   "",
                                   util.escape(error.responseText)]
                    });
                },
                saveLabel: i18n("Submit")
            });

            // Environment
            self.form.addField({
                name: "environmentId",
                label: i18n("Environment"),
                description: i18n("Environments that require snapshots are excluded from this list."),
                required: true,
                type: "TableFilterSelect",
                url: bootstrap.restUrl+"deploy/environment",
                allowNone: false,
                defaultQuery: {
                    outputType: ["BASIC", "LINKED", "SECURITY"],
                    filterFields: ["application.id", "active", "requireSnapshot"],
                    "filterType_application.id": "eq",
                    "filterValue_application.id": self.application.id,
                    filterType_active: "eq",
                    filterValue_active: true,
                    filterClass_active: "Boolean",
                    filterType_requireSnapshot: "eq",
                    filterValue_requireSnapshot: false,
                    filterClass_requireSnapshot: "Boolean"
                },
                onChange: function(value, item) {
                    if (item) {
                        if (self.hasResourceField) {
                            self.form.removeField("resourceId");
                        }
                        self.hasResourceField = true;

                        var resourceSelect = new RestSelect({
                            restUrl: bootstrap.restUrl+"deploy/environment/"+item.id+"/executableResourcesForComponent/"+self.component.id,
                            getLabel: function(item) {
                                return item.path;
                            },
                            allowNone: false,
                            noDataMessage: i18n("No resources for component mapped to environment")
                        });
                        self.form.addField({
                            name: "resourceId",
                            label: i18n("Resource"),
                            required: true,
                            widget: resourceSelect
                        }, "componentProcessId");
                    }
                }
            });

            var processSelect = new RestSelect({
                restUrl: bootstrap.restUrl+"deploy/component/"+self.component.id+"/executableProcesses",
                getLabel: function(item) {
                    var result = item.name;
                    if (item.componentTemplate) {
                        result += i18n(" (Template)");
                    }
                    return result;
                },
                allowNone: false,
                noDataMessage: i18n("No processes on component"),
                onChange: function(value, item) {
                    self.selectedComponentProcess = item;
                    // Clear properties from the last process
                    array.forEach(self.extraFieldNames, function(fieldName) {
                        self.form.removeField(fieldName);
                    });
                    self.extraFieldNames = [];

                    if (item) {
                        // For appropriate processes, show a version selector.
                        if (item.takesVersion) {
                            self.extraFieldNames.push("versionId");
                            self.form.addField({
                                name: "versionId",
                                type: "TableFilterSelect",
                                allowNone: false,
                                url: bootstrap.restUrl+"deploy/version",
                                required: true,
                                label: i18n("Version"),
                                defaultQuery: {
                                    filterFields: ["component.id", "active"],
                                    filterType_active: "eq",
                                    filterValue_active: true,
                                    filterClass_active: "Boolean",
                                    "filterType_component.id": "eq",
                                    "filterValue_component.id": self.component.id,
                                    "orderField": "dateCreated",
                                    "sortType": "desc"
                                }
                            });
                        }
                        // Show all properties for the selected component process
                        array.forEach(item.unfilledProperties, function(property) {
                            var propertyName = "p_"+property.name;
                            self.extraFieldNames.push(propertyName);

                            /*
                             * The variable propertyFieldData needs to contain all of the relevant information for
                             * a property and some properties require different information (eg. HttpProperties
                             * require 6 additional values). So lang.clone was used to ensure that all required values are
                             * put into propertyFieldData. The clone function is safe here because property is a flat
                             * object containing only property values and therefore clone will not explode. 
                             */
                            var propertyFieldData = lang.clone(property);
                            propertyFieldData.name = propertyName;
                            propertyFieldData.context = {component: self.component};
                            if (property.description) {
                                propertyFieldData.description = property.description.escape();
                            }

                            self.form.addField(propertyFieldData);
                        });
                    }
                }
            });
            self.form.addField({
                name: "componentProcessId",
                label: i18n("Process"),
                required: true,
                widget: processSelect
            });

            this.form.placeAt(this.formAttach);
        }
    });
});

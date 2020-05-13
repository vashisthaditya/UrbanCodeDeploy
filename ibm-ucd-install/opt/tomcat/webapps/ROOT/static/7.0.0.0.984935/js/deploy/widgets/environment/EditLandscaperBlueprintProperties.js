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

define(
["dijit/_TemplatedMixin",
    "dijit/_Widget",
    "dijit/form/TextBox",
    "dojo/_base/declare",
    "dojo/_base/xhr",
    "dojo/dom-construct",
    "js/webext/widgets/ColumnForm",
    "js/webext/widgets/RestSelect",
    "js/webext/widgets/DomNode",
    "deploy/widgets/Formatters",
    "dojo/store/Memory",
    "dojo/_base/lang",
    "js/webext/widgets/select/WebextSelect"],

function (_TemplatedMixin,
        _Widget,
        TextBox,
        declare,
        xhr,
        domConstruct,
        ColumnForm,
        RestSelect,
        DomNode,
        Formatters,
        Memory,
        lang,
        WebextSelect) {
    return declare([_Widget, _TemplatedMixin], {
        templateString: '<div class="editEnvironment">' + 
                        '  <div data-dojo-attach-point="formAttach"></div>' + 
                        '</div>',

        /**
         *
         */
        postCreate: function () {
            this.inherited(arguments);
            var self = this;
            var url;
            if (this.isApplyToEnvironment()) {
                // for apply to environment in patterns
                url = bootstrap.restUrl + "deploy/environment/" + this.environment.id + "/apply";
            } else {
                url = bootstrap.restUrl + "deploy/environment";
            }
            var showButtons = this.blueprint ? false : true;
            this.form = new ColumnForm({
                submitUrl: url,
                readOnly: self.readOnly,
                saveLabel: i18n("Apply"),
                showButtons: showButtons,
                preSubmit: function(data){
                    if (self.dialog){
                        self.dialog.hideError();
                    }
                },

                onSubmit: function(data){
                    // do not want to close the dialog if the error occurs
                    var oldPostSubmit = self.form.postSubmit;
                    delete self.form.postSubmit;
                    self.validateCloudProperties(data).then(function(response) {
                        self.form.postSubmit = oldPostSubmit;
                            self.form.submitOverXhr(data);
                    }, function(response) {
                        // On error...
                        self.form.postSubmit = oldPostSubmit;
                        self.form.unblock();
                        self.form.onError(response);
                    });
                },

                postSubmit: function (data) {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                    navBar.setHash("environment/"+data.id+"/history", false, true);
                },
                addData: function (data) {
                    var key;

                    for (key in self.environmentData) {
                        if (self.environmentData.hasOwnProperty(key)) {
                            data[key] = self.environmentData[key];
                        }
                    }
                    if (self.environment) {
                        data.name = self.environment.name;
                        if (self.isApplyToEnvironment()){
                            data.externalEnvironmentId = self.environment.extEnvironment[0].externalId;
                        }
                    }
                    data.validate = true;
                    data.cloudBlueprintId = self.blueprint.id;
                    data.cloudBlueprintLocation = self.blueprint.location;
                    data.cloudBlueprint = self.blueprint.name;
                    data.cloudBlueprintUrl = self.blueprint.url;
                    data.integrationProviderId = self.blueprint.integrationProviderId;
                    data.cloudProjectId = self.cloudProjectId;
                    data.regionId = self.regionId;
                    delete data.blueprintId;
                    data.parameters = {};

                    dojo.forEach(self.parameters, function (parameterName) {
                        var propName = "parameter/" + parameterName;
                        var propValue = data[propName];

                        if (propValue && propValue.trim() !== "") {
                            data.parameters[parameterName] = propValue;
                        }

                        delete data[propName];
                    });

                    var configuration = data.cloudConfiguration;
                    if (configuration === "_no_label") {
                        data.configuration = "";
                    } else {
                        if (self.configuration) {
                            data.cloudConfigurationId = self.configuration.id;
                            data.cloudConfiguration = self.configuration.name;
                            data.cloudConfigurationLocation = self.configuration.location;
                        }
                    }
                },

                onError: function (error) {
                    var configuration = self.configuration ? self.configuration.name : "";
                    var errorMessage = self._decodeJson(error.responseText);
                    if (self.dialog){
                        try {
                            var errors = JSON.parse(errorMessage);
                            self.dialog.showError(self.form, self.blueprint.name, configuration, errors);
                        } catch (e) {
                            self.dialog.showError(self.form, self.blueprint.name, configuration, util.escape(errorMessage));
                        }
                    }
                },

                onCancel: function () {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                    if (self.onCancel !== undefined) {
                        self.onCancel();
                    }
                }
            });
            this.form.placeAt(this.formAttach);

            var cloudProvisioningWidget = new DomNode();

            domConstruct.create("div", {
                style: "display: inline-block;",
                "class": "iconCloud"
            }, cloudProvisioningWidget.domAttach);

            domConstruct.create("div", {
                "innerHTML": i18n("Cloud Provisioning"),
                "style": {
                    "fontWeight": "bold",
                    "display": "inline-block",
                    "marginBottom": "6px"
                }
            }, cloudProvisioningWidget.domAttach);

            self.form.addField({
                name: "",
                widget: cloudProvisioningWidget

            });

            this.form.addField({
                type: "Invisible",
                name: "_blueprintInsert"
            });

            this.form.addField({
                type: "Invisible",
                name: "_cloudProjectInsert"
            });

            this.form.addField({
                type: "Invisible",
                name: "_regionInsert"
            });

            this.form.addField({
                type: "Invisible",
                name: "_blueprintVersionInsert"
            });

            this.form.addField({
                type: "Invisible",
                name: "_configurationInsert"
            });

            this.form.addField({
                type: "Invisible",
                name: "_configurationVersionInsert"
            });

            this.form.addField({
                type: "Invisible",
                name: "_blueprintProperties"
            });

            if (this.blueprint) {
                this.form.addField({
                    name: "cloudBlueprint",
                    label: i18n("Blueprint"),
                    type: "Text",
                    readOnly: true,
                    value: this.blueprint.name
                }, "_blueprintInsert");

                self.blueprintChange();
            }
            else {
                self.form.addField({
                    name: "blueprintId",
                    label: i18n("Blueprint"),
                    required: true,
                    type: "TableFilterSelect",
                    url: bootstrap.restUrl + "deploy/application/" + this.application.id + "/blueprints/external",
                    storeType: "Memory",
                    formatDropDownLabel: Formatters.environmentBlueprintDropDownFormatter, 
                    onChange: function (value, item) {
                        if (value && item.source === "landscaper") {
                            self.blueprint = item;
                            self.blueprintChange();
                        }
                    }
                }, "_blueprintInsert");
            }
        },

        blueprintChange: function () {
            var self = this;
            // create cloud project drop down
            if (self.form.hasField("cloudProjectId")) {
                self.form.removeField("cloudProjectId");
            }

            var cloudProjectSelect = new RestSelect({
                restUrl: bootstrap.restUrl + "integration/pattern/" + self.blueprint.integrationProviderId + "/cloudprojects/",
                allowNone: false,
                getLabel: function(item){
                    return item.displayName;
                }
            });

            self.form.addField({
                name: "cloudProjectId",
                label: i18n("Cloud Project"),
                widget: cloudProjectSelect,
                required: true,
                description: i18n("Choose a cloud project to create the environment. Cloud project defines the target cloud for the environment.")
            }, "_cloudProjectInsert");

            cloudProjectSelect.on("change", function (value) {
                if (value){
                    self.cloudProjectId = value;
                    self.clearProject();
                    self.refreshRegion();
                    self.refreshConfiguration();
                } else {
                    self.cloudProjectId = null;
                    self.clearProject();
                }
            });

            if (self.form.hasField("cloudBlueprintVersion")) {
                self.form.removeField("cloudBlueprintVersion");
            }

            var blueprintVersionSelect = new RestSelect({
                restUrl: bootstrap.restUrl + "integration/pattern/" + self.blueprint.integrationProviderId + "/blueprint/" + self.blueprint.id + "/version"
            });

            self.form.addField({
                name: "cloudBlueprintVersion",
                label: i18n("Blueprint Version"),
                widget: blueprintVersionSelect,
                required: true,
                description: i18n("Choose a blueprint version for the blueprint used to create the environment.")
            }, "_blueprintVersionInsert");

            blueprintVersionSelect.on("change", function (value) {
                if (value) {
                    self.blueprintVersion = value;
                    self.refreshParameters();
                } else {
                    self.blueprintVersion = null;
                    self.refreshParameters();
                }
            });
            self.refreshConfiguration();
        },

        clearProject: function(){
            var self = this;

            if (self.form.hasField("regionId")) {
                self.form.removeField("regionId");
            }

            if (self.form.hasField("cloudConfiguration")) {
                self.form.removeField("cloudConfiguration");
            }

            if (self.form.hasField("cloudConfiguration")) {
                self.form.removeField("cloudConfiguration");
            }

            if (self.form.hasField("cloudConfigurationVersion")) {
                self.form.removeField("cloudConfigurationVersion");
            }

            if (self.form.hasField("propSectionLabel")) {
                self.form.removeField("propSectionLabel");
            }
            self.removeParameters();
            self.configuration = null;
        },

        refreshRegion: function(){
            var self = this;
            // if the cloud project is not selected .. do not fetch the region
            if (self.cloudProjectId){

                var regionSelect = new RestSelect({
                    restUrl: bootstrap.restUrl + "integration/pattern/" + self.blueprint.integrationProviderId + "/cloudProject/" + self.cloudProjectId + "/regions",
                    allowNone: false,
                    getLabel: function(item){
                        return item.name;
                    }
                });

                self.form.addField({
                    name: "regionId",
                    label: i18n("Region"),
                    widget: regionSelect,
                    required: true,
                    description: i18n("Choose a region to create the environment.")
                }, "_regionInsert");

                regionSelect.on("change", function (value) {
                    if (value) {
                        self.regionId = value;
                    } else {
                        self.regionId = null;
                    }
                    self.refreshParameters();
                });
            }
        },

        refreshConfiguration: function(){
            var self = this;
            // if the cloud project is not selected .. do not create the configuration selection widget
            if (self.cloudProjectId){
                self.form.block();
                var url = bootstrap.restUrl + "integration/pattern/" + self.blueprint.integrationProviderId + "/blueprint/" + self.blueprint.id + "/cloudproject/" + self.cloudProjectId + "/configuration";
                dojo.xhrGet({
                    url: url,
                    handleAs: "json",
                    headers: self.getHeaders(),
                    load: function (data) {
                        var store = new Memory({
                            data: data,
                            idProperty: "id"
                        });
                        var configurationSelect = new WebextSelect({
                            "store": store,
                             onChange: function (value, configItem) {
                                 self.form.block();
                                 if (self.form.hasField("cloudConfigurationVersion")) {
                                     self.form.removeField("cloudConfigurationVersion");
                                 }
                                 if (value) {
                                     self.removeParameters();
                                     self.configuration = configItem;
                                     var configurationVersionSelect = new RestSelect({
                                         restUrl: bootstrap.restUrl + "integration/pattern/" + self.blueprint.integrationProviderId + "/blueprint/" + self.blueprint.id + "/configuration/" + configItem.id + "/version"
                                     });
                                     if (!self.form.hasField("cloudConfigurationVersion")) {
                                         self.form.addField({
                                             name: "cloudConfigurationVersion",
                                             label: i18n("Configuration Version"),
                                             widget: configurationVersionSelect,
                                             required: true,
                                             description: i18n("Choose a configuration version for the configuration used to create the environment.")
                                         }, "_configurationVersionInsert");
                                     }

                                     configurationVersionSelect.on("change", function (value) {
                                         if (value) {
                                             self.configurationVersion = value;
                                             self.refreshParameters();
                                         } else {
                                             self.configurationVersion = null;
                                             self.refreshParameters();
                                         }
                                     });
                                 } else {
                                     self.configuration = null;
                                     self.configurationVersion = null;
                                     self.refreshParameters();
                                 }
                                 self.form.unblock();
                             }
                        });
                        self.form.addField({
                            name: "cloudConfiguration",
                            label: i18n("Configuration"),
                            widget: configurationSelect,
                            required: false,
                            description: i18n("Choose a configuration for the blueprint used to create the environment.")
                        }, "_configurationInsert");
                        self.form.unblock();
                    },
                    error: function(){
                        self.form.unblock();
                    }
                });
            }
        },

        refreshParameters: function () {
            var self = this;
            var form = this.form;

            if (!self.form.hasField("propSectionLabel")) {
                this.form.addField({
                    name: "propSectionLabel",
                    type: "SectionLabel",
                    value: i18n("Set property values for nodes to be created for this environment"),
                    style: {
                        fontWeight: "bold"
                    }
                }, "_blueprintProperties");
            }
            if (!self.form.hasField("_parameters")) {
                self.form.addField({
                    type: "Invisible",
                    name: "_parameters"
                });
            }
            self.removeParameters();
            self.addParameters();
        },

        removeParameters: function(){
            var self = this;
            dojo.forEach(self.parameters, function (parameterName) {
                var propName = "parameter/" + parameterName;
                if (self.form.hasField(propName)) {
                    self.form.removeField(propName);
                }
            });
            this.parameters = [];
            self.clearCostSection();
        },

        getHeaders: function(){
            var headers = {};
            headers.Location = this.blueprint.location;
            if (this.configuration) {
                headers.ConfigurationLocation = this.configuration.location;
            }
            if (this.regionId){
                headers.Region = this.regionId;
            }
            return headers;
        },

        addParameters: function (form) {
            var self = this;
            var configSuffix = self.configuration && self.configurationVersion ? "/configuration/" + self.configuration.id + "/version/" + self.configurationVersion : "";
            if (self.blueprint && self.cloudProjectId && self.blueprintVersion && self.regionId){
                self.form.block();
                var url = bootstrap.restUrl + "integration/pattern/" + self.blueprint.integrationProviderId + "/blueprint/" + self.blueprint.id  + "/version/" + self.blueprintVersion + "/cloudproject/" + self.cloudProjectId + configSuffix + "/parameters";
                dojo.xhrGet({
                    url: url,
                    handleAs: "json",
                    headers: self.getHeaders(),
                    load: function (propDefs) {
                        var ucdParams = ["ucd_hostname", "ucd_password", "ucd_server_url", "ucd_user"];
                        dojo.forEach(propDefs, function(property) {
                             self.creatingParameters = true;
                             if (ucdParams.indexOf(property.name) === -1){
                                 self.createParameter(property);
                             }
                        });
                        // compute the cost ... also will have to compute the cost if the value of parameter changes....
                        self.creatingParameters = false;
                        self.disableCostComputation = false;
                        self.form.unblock();
                        self.displayCost();
                    }
                });
            }
        },

        createParameter: function (property) {
            var self = this;
            var form = self.form;
            var value = property.value;
            var name = property.name;
            self.parameters.push(property.name);
            var costMetricProperties = ["image", "flavor", "size"];
            var costMetricProperty = costMetricProperties.indexOf(property.propertyName) !== -1;
            var fieldName = "parameter/" + name;
            if (self.form.hasField(fieldName)) {
                self.form.removeField(fieldName);
            }
            if (property.type === "SELECT") { 
                var fieldData = lang.clone(property);
                fieldData.name = name;
                var labelValue = value;
                var data = property.allowedValues || [];
                dojo.forEach(data, function (item) {
                    if (item.value === value || item.label === value) {
                        labelValue = item.label;
                    }
                });
                var store = new Memory({
                    data: data,
                    idProperty: "value"
                });

                fieldData.placeHolder = labelValue;
                fieldData.idProperty = "value";
                fieldData.searchAttr = "label";
                fieldData.labelAttr = "label";
                fieldData.store = store;
                fieldData.style = "width: 300px;";
                fieldData.value="";
                fieldData.costMetricProperty = costMetricProperty;
                fieldData.onChange = function (value) {
                    if (!self.creatingParameters && this.costMetricProperty){
                        self.displayCost();
                    }
                };
                var select = new WebextSelect(fieldData);

                form.addField({
                    name: fieldName,
                    label: name,
                    required: false,
                    widget: select
                }, "_parameters");
            } else {
                var secure = property.type === "SECURE" || property.type === "PASSWORD";
                var type = secure ? "password" : "text";
                // display placeholder as blank if the value is null, otherwise display ****
                var placeHolderValue = (secure  && value )? "****" : value;

                var textBox = new TextBox({
                    value: "",
                    placeHolder: placeHolderValue,
                    style: "width: 300px;",
                    type: type,
                    costMetricProperty : costMetricProperty,
                    intermediateChanges:true,
                    timeout: null,
                    onChange: function (value) {
                        if (!self.creatingParameters && this.costMetricProperty){
                            if(this.timeout) {
                                clearTimeout(this.timeout);
                            }
                            this.timeout = setTimeout(function() {
                                self.displayCost();
                            },1000);
                        }
                    }
                });

                form.addField({
                    name: fieldName,
                    label: name,
                    required: false,
                    widget: textBox
                }, "_parameters");
            }
        },

        _decodeJson: function (str) {
            return str.replace(/&#(\d+);/g, function (match, dec) {
                return String.fromCharCode(dec);
            });
        },
        submitForm: function () {
            this.form.submitForm();
        },

        displayCost: function(){
            var self = this;
            if (!self.disableCostComputation) {
                self.form.block();
                var data = self.form.getData();
                var formattedData = self.form.formatData(data);

                if (self.form.hasField("estimatedCostLabel")) {
                    self.form.removeField("estimatedCostLabel");

                    var costLabelNode = new DomNode();

                    var fieldRow = domConstruct.create("div", {
                        className: "labelsAndValues-labelCell inlineBlock"
                    });

                    costLabelNode.domNode.appendChild(fieldRow);

                    self.form.addField({
                        name: "estimatedCostLabel",
                        label: "",
                        required: false,
                        widget: costLabelNode
                    },"_estimateCostInsert");
                }
                dojo.xhrPut({
                    url:  bootstrap.restUrl + "integration/pattern/" + self.blueprint.integrationProviderId + "/blueprint/" + self.blueprint.id  + "/cost",
                    handleAs: "json",
                    "putData": formattedData,
                    headers: self.getHeaders(),
                    sync: false,
                    load: function(response, xhrArgs) {
                        if (response.costStatus === "UNKNOWN_COST_CENTER"){
                            self.disableCostComputation = true;
                            self.clearCostSection();
                        } else {
                            var value = null, description= null, iconClass = null;
                            if (response.costStatus === "ERROR"){
                                value = i18n("Error estimating cost.");
                                description = response.statusMessage;
                                iconClass = "errorIcon inlineBlock";
                            } else {
                                value = i18n("$ %s per hour",  response.cost.toFixed(2));
                                if (response.costStatus === "MISSING_DATA"){
                                    description = i18n("The estimate is approximate because some cost data are missing.");
                                    iconClass = "warningIcon inlineBlock";
                                }
                            }
                            self.createCostLabel(value, description, iconClass);
                        }
                        self.form.unblock();
                    },

                    error: function(error) {
                        self.form.unblock();
                    }
                });
            }
        },

        clearCostSection: function(){
            var self = this;
            if (self.form.hasField("estimatedCostSectionLabel")) {
                self.form.removeField("estimatedCostSectionLabel");
            }

            if (self.form.hasField("estimatedCostLabel")) {
                self.form.removeField("estimatedCostLabel");
            }
        },

        createCostLabel: function(value, description, iconClass){
            var self = this;
            if (!self.form.hasField("estimatedCostSectionLabel")) {
                self.form.addField({
                    name: "estimatedCostSectionLabel",
                    type: "SectionLabel",
                    value: i18n("Estimated cost"),
                    style: {
                        fontWeight: "bold"
                    }
                }, "_estimateCostInsert");
            }
            if (self.form.hasField("estimatedCostLabel")) {
                self.form.removeField("estimatedCostLabel");
            }
            var costLabelNode = new DomNode();

            var fieldRow = domConstruct.create("div", {
                className: "labelsAndValues-labelCell inlineBlock",
                innerHTML: value,
                style: {
                    fontWeight : "normal"
                }
            });
            costLabelNode.domNode.appendChild(fieldRow);
            if (description) {
                var iconRow = domConstruct.create("div", {
                    className: iconClass,
                    title: description
                });
                costLabelNode.domNode.appendChild(iconRow);
            }

            self.form.addField({
                name: "estimatedCostLabel",
                label: "",
                required: false,
                widget: costLabelNode
            },"_estimateCostInsert");
        },
        getData: function(){
            return this.form.getData();
        },

        validate: function(){
            return this.form.validateRequired();
        },

        validateCloudProperties: function(submitData){
           var self = this;
           var data = self.form.formatData(submitData);
           return dojo.xhrPut({
                url:  bootstrap.restUrl + "integration/pattern/" + self.blueprint.integrationProviderId + "/blueprint/" + self.blueprint.id  + "/validate",
                handleAs: "json",
                "putData": data,
                headers: self.getHeaders(),
                sync: false
            });
        },

        isApplyToEnvironment: function(){
           return this.environment && this.environment.extEnvironment && this.environment.extEnvironment.length >0;
        }
    });
});

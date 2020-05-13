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
        "dojo/dom-construct",
        "dojo/on",
        "dojo/_base/xhr",
        "js/webext/widgets/Alert",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/DomNode",
        "js/webext/widgets/RestSelect",
        "deploy/widgets/security/TeamSelector"
        ],
function(
        _TemplatedMixin,
        _Widget,
        array,
        declare,
        domConstruct,
        on,
        xhr,
        Alert,
        ColumnForm,
        DomNode,
        RestSelect,
        TeamSelector
) {
    return declare('deploy.widgets.componentTemplate.EditComponentTemplate',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="editComponentTemplate">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',
        showCancel: true,

        /**
         * 
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            this.sourceConfigPropertyNames = [];

            this.existingValues = {
                componentType: "STANDARD"
            };

            if (this.componentTemplate) {
                this.readOnly = !this.componentTemplate.security["Edit Basic Settings"];
                this.existingValues = this.componentTemplate;
                this.existingValues.componentType = this.componentTemplate.componentType;

                if (!this.readOnly) {
                    this.readOnly =
                            (this.componentTemplate.version !== this.componentTemplate.versionCount);
                }
            }
            else {
                xhr.get({
                    "url": bootstrap.restUrl + "security/teamsWithCreateAction/Component Template",
                    "handleAs": "json",
                    "sync": true,
                    "load": function(data) {
                        var extendedSecurity = {"teams": data};
                        self.existingValues.extendedSecurity = extendedSecurity;
                    }
                });
            }

            var sourceConfigPropertyNames = [];

            this.sourceConfigPluginSelect = new RestSelect({
                restUrl: bootstrap.restUrl+"plugin/sourceConfigPlugin",
                getLabel: function(item) {
                    return i18n(item.name);
                },
                getValue: function(item) {
                    return item.name;
                },
                value: this.existingValues.sourceConfigPluginName,
                onChange: function(value, item) {
                    array.forEach(sourceConfigPropertyNames, function(propertyName) {
                        self.removePropertyField(self.form, propertyName);
                    });
                    sourceConfigPropertyNames = [];

                    if (!!item) {
                        var groupName = item.componentPropSheetDef.name;
                        array.forEach(item.componentPropDefs, function(propDef) {
                            // Use the configured value if present.
                            var existingValue = null;
                            if (self.existingValues.sourceConfigProperties) {
                                existingValue = util.getNamedProperty(self.existingValues.sourceConfigProperties, propDef.name);
                                if (existingValue) {
                                    propDef.value = existingValue.value;
                                }
                            }

                            // Clone the prop def so we can change its name temporarily.
                            var propDefCopy = util.clone(propDef);

                            // Use a special prefix to separate these from other fields.
                            var propDefName = groupName+"/"+propDef.name;
                            propDefCopy.name = propDefName;
                            propDefCopy.translate = true;
                            sourceConfigPropertyNames.push(propDefName);

                            if (propDefCopy.label.indexOf("URL") > -1 || propDefCopy.label.indexOf(" Url") > -1) {
                                propDefCopy.textDir = "ltr";
                            }
                            else if (propDefCopy.label.indexOf("Vob Location") > -1 || propDefCopy.label.indexOf("Path") > -1) {
                                propDefCopy.textDir = "ltr";
                            }

                            var configModeOn = (!!existingValue);
                            self.addPropertyField(self.form, propDefCopy, configModeOn);
                        });
                    }
                }
            });

            this.form = new ColumnForm({
                submitUrl: bootstrap.restUrl+"deploy/componentTemplate",
                postSubmit: function(data) {
                    navBar.setHash("componentTemplate/"+data.id+"/-1");
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                addData: function(data) {
                    if (self.componentTemplate) {
                        data.existingId = self.componentTemplate.id;
                    }

                    data.properties = {};
                    array.forEach(self.sourceConfigPropertyNames, function(propertyName) {
                        if (data[propertyName] !== undefined) {
                            data.properties[propertyName] = data[propertyName];
                            delete data[propertyName];
                        }
                    });

 
                    data.teamMappings = self.teamSelector.teams;
                },
                onError: function(error) {
                    if (error.responseText) {
                        var wrongNameAlert = new Alert({
                            message: util.escape(error.responseText)
                        });
                    }
                },
                onCancel: function() {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                readOnly: self.readOnly,
                showButtons: !self.readOnly,
                cancelLabel : self.showCancel ? i18n("Cancel") : null
            });

            this.form.addField({
                name: "name",
                label: i18n("Name"),
                required: true,
                type: "Text",
                value: this.existingValues.name
            });

            this.form.addField({
                name: "description",
                label: i18n("Description"),
                type: "Text",
                value: this.existingValues.description
            });

            var currentTeams = [];
            if (!!self.existingValues && !!self.existingValues.extendedSecurity && !!self.existingValues.extendedSecurity.teams) {
                currentTeams = self.existingValues.extendedSecurity.teams;
            }
            self.teamSelector = new TeamSelector({
                resourceRoleType: "Component Template",
                noneLabel: i18n("Standard Component Template"),
                teams: currentTeams
            });
            this.form.addField({
                name: "teams",
                label: i18n("Teams"),
                type: "Text",
                widget: self.teamSelector
            });

            this.form.addField({
                name: "componentType",
                label: i18n("Component Type"),
                description: i18n("The Type of Component. z/OS components do not use source configs and will have them disabled."),
                type: "Select",
                allowedValues: [{
                    label: i18n("Standard"),
                    value: "STANDARD"
                },{
                    label: i18n("z/OS"),
                    value: "ZOS"
                }],
                onChange: function(value) {
                    self.existingValues.componentType = value;
                    if (value === "ZOS") {
                        self.showIgnoreQualifiers();
                    }
                    else {
                        self.removeIgnoreQualifiers();
                    }
                },
                value: this.existingValues.componentType
            });

            self.addSourceConfigField();

            if (this.existingValues.componentType === "ZOS") {
                self.showIgnoreQualifiers();
            }

            this.form.placeAt(this.formAttach);
        },

        showIgnoreQualifiers: function() {
            if (!this.form.hasField("ignoreQualifiers")) {
                this.form.addField({
                    name: "ignoreQualifiers",
                    label: i18n("High Level Qualifier Length"),
                    required: false,
                    type: "Text",
                    value: (!this.existingValues.ignoreQualifiers ? "0" : this.existingValues.ignoreQualifiers)
                }, "sourceConfigPlugin");
            }
        },

        removeIgnoreQualifiers: function() {
            if (this.form.hasField("ignoreQualifiers")) {
                this.form.removeField("ignoreQualifiers");
            }
        },

        addSourceConfigField: function() {
            var self = this;
            var initialValue = null;

            if (this.existingValues.sourceConfigPlugin) {
                initialValue = this.existingValues.sourceConfigPlugin.id;
            }

            this.form.addField({
                name: "sourceConfigPlugin",
                type: "TableFilterSelect",
                label: i18n("Source Configuration Type"),
                url: bootstrap.restUrl+"plugin/sourceConfigPlugin",
                description: i18n("The source configuration plugin to use for this component."),
                value: initialValue,
                idProperty: function(item) {
                    return item.name;
                },
                defaultQuery: {
                    outputType: ["BASIC", "LINKED", "EXTENDED"]
                },
                allowNone: true,
                onFilterResult: function(result) {
                    var filterResult = [];
                    if (self.form.getValue("componentType") === "ZOS") {
                        array.forEach(result, function(plugin) {
                            if (/^[zZ][oO][sS]/.test(plugin.name)) {//Every source config plug-in for z/OS should start with 'zOS'
                                filterResult.push(plugin);
                            }
                        });
                    }
                    else {
                        filterResult = result;
                    }
                    return filterResult;
                },
                onChange: function(value, item) {
                    array.forEach(self.sourceConfigPropertyNames, function(propertyName) {
                        self.removePropertyField(self.form, propertyName);
                    });
                    self.sourceConfigPropertyNames = [];

                    if(self.componentTemplate !== undefined && item.id !== this.value) {
                        var warningText = i18n("When you change the source configuration of a component template you will" +
                        " have to also update the configuration of components based on that template before you do version imports.");
                        var wrongNameAlert = new Alert({
                            message: util.escape(warningText)
                         });
                    }

                    if (!!item) {
                        var groupName = item.componentPropSheetDef.name;
                        array.forEach(item.componentPropDefs, function(propDef) {
                            // Use the configured value if present.
                            var existingValue = null;
                            if (self.existingValues.sourceConfigProperties) {
                                existingValue = util.getNamedProperty(self.existingValues.sourceConfigProperties, propDef.name);
                                if (existingValue) {
                                    propDef.value = existingValue.value;
                                }
                            }

                            // Clone the prop def so we can change its name temporarily.
                            var propDefCopy = util.clone(propDef);

                            // Use a special prefix to separate these from other fields.
                            var propDefName = groupName+"/"+propDef.name;
                            propDefCopy.name = propDefName;
                            propDefCopy.translate = true;
                            self.sourceConfigPropertyNames.push(propDefName);

                            var configModeOn = (!!existingValue);
                            self.addPropertyField(self.form, propDefCopy, configModeOn);
                        });
                    }
                }

            }, "_sourceProperties");
        },

        removeSourceConfigField: function() {
            this.form.removeField("sourceConfigPlugin");
        },

        updateSourceConfig: function(value) {
            console.log(this);
            if (value==="ZOS") {
                this.form.removeField("sourceConfigPlugin");
            }
            else {
                this.addSourceConfigField();
            }
        },

        addPropertyField: function(propertyForm, propertyFieldData, configModeOn, beforeField) {
            var runtimeSwitchName = "runtime_switch_"+propertyFieldData.name;
            var runtimeSwitchWidget = new DomNode();
            var runtimeSwitchLink = domConstruct.create("a", {
                "class": "linkPointer",
                "innerHTML": i18n("Prompt for a value on use"),
                "style": {
                    "marginBottom": "5px"
                }
            }, runtimeSwitchWidget.domAttach);
            var runtimeSwitchFieldData = {
                name: runtimeSwitchName,
                widget: runtimeSwitchWidget,
                label: ""
            };


            var configSwitchName = "config_switch_"+propertyFieldData.name;
            var configSwitchWidget = new DomNode();
            var configSwitchLink = domConstruct.create("a", {
                "class": "linkPointer",
                "innerHTML": i18n("Set a value here"),
                "style": {
                    "marginBottom": "5px"
                }
            }, configSwitchWidget.domAttach);
            var configSwitchFieldData = {
                name: configSwitchName,
                widget: configSwitchWidget,
                label: i18n(propertyFieldData.label)
            };

            on(runtimeSwitchLink, "click", function() {
                propertyForm.addField(configSwitchFieldData, propertyFieldData.name);
                propertyForm.removeField(runtimeSwitchName);
                propertyForm.removeField(propertyFieldData.name);
            });
            on(configSwitchLink, "click", function() {
                console.log(propertyFieldData);
                propertyForm.addField(propertyFieldData, configSwitchName);
                propertyForm.addField(runtimeSwitchFieldData, configSwitchName);
                propertyForm.removeField(configSwitchName);
            });

            if (configModeOn) {
                propertyForm.addField(propertyFieldData, beforeField);
                if (!this.readOnly) {
                    propertyForm.addField(runtimeSwitchFieldData, beforeField);
                }
            }
            else {
                propertyForm.addField(configSwitchFieldData, beforeField);
            }
        },

        removeAllSourceConfigPropertyFields: function() {
           var arrayLength = this.sourceConfigPropertyNames.length;
           var i;
           for (i = 0; i < arrayLength; i++) {
               this.removePropertyField(this.form, this.sourceConfigPropertyNames[i]);
           }
           this.sourceConfigPropertyNames = [];
        },

        removePropertyField: function(propertyForm, propertyField) {
            var configSwitchName = "config_switch_"+propertyField;
            var runtimeSwitchName = "runtime_switch_"+propertyField;
            var isConfigMode = propertyForm.hasField(configSwitchName);

            if(isConfigMode) {
                propertyForm.removeField(configSwitchName);
            }
            else {
                propertyForm.removeField(propertyField);
                propertyForm.removeField(runtimeSwitchName);
            }
        }
    });
});

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
        "dijit/form/ComboBox",
        "dijit/Tooltip",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/array",
        "dojo/dom-attr",
        "dojo/dom-class",
        "dojo/dom-style",
        "dojo/dom-construct",
        "dojo/on",
        "dojo/query",
        "js/webext/widgets/Alert",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/color/Color",
        "deploy/widgets/application/wizard/EnvironmentModelHelper",
        "deploy/widgets/application/wizard/EnvironmentTemplateOption",
        "deploy/widgets/ModelWidgetList"
        ],
function(
        _TemplatedMixin,
        _Widget,
        ComboBox,
        Tooltip,
        declare,
        lang,
        array,
        domAttr,
        domClass,
        domStyle,
        domConstruct,
        on,
        query,
        Alert,
        ColumnForm,
        Color,
        EnvironmentModelHelper,
        EnvironmentTemplateOption,
        ModelWidgetList
) {
    /**
     * A widget used to edit the properties of a created environment in the Application Wizard.
     *
     * Parameters:
     *     sharedData - Must contain the following:
     *                    + environments
     *                    + environmentTemplates
     */
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div data-dojo-attach-point="environmentFormAttach" class="environment-form">' +
            '  <div data-dojo-attach-point="environmentTemplateAttach">' +
            '    <div class="env-tmpl-dropdown">' +
            '      <span class="env-tmpl-dropdown-label">' + i18n("Environment template") + '</span>' +
            '      <span data-dojo-attach-point="selectAttach"></span>' +
            '      <div data-dojo-attach-point="templateSelectTooltip" class="labelsAndValues-helpCell title-helpCell inlineBlock"></div>' +
            '    </div>' +
            '    <div data-dojo-attach-point="environmentTmplDescriptionAttach" class="environment-tmpl-description"></div>' +
            '  </div>' +
            '  <div>' +
            '    <div data-dojo-attach-point="columnFormAttach"></div>' +
            '    <div data-dojo-attach-point="createEnvironmentAttach">' +
            '        <div class="create-environment-label">' +
            '            <div class="icon-button add-button"></div>' + i18n("Create Environment") +
            '        </div>' +
            '        <div data-dojo-attach-point="createEnvironmentWidgetAttach" class="create-env-widget"></div>' +
            '    </div>' +
            '    <div class="pageAlerts">' +
            '      <div data-dojo-attach-point="noEnvironmentSelectedAttach" class="pageAlert" style="display: none;">' +
                     i18n("No environment is currently selected.")  +
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '  <div style="height: 1px;"></div>' +  // Hard boundary for height:auto;
            '</div>',

        postCreate: function() {
            var self = this;
            this.inherited(arguments);

            this.modelHelper = new EnvironmentModelHelper(this.sharedData);

            // find and store the currently selected environment
            this.environment = null;
            var selectedEnvironments = this.sharedData.environments.query({selected: true});
            if (selectedEnvironments && selectedEnvironments.length > 0) {
                this.environment = selectedEnvironments[0];
            }

            // prepare the environment template select
            this.sharedData.environmentTemplates.query().forEach(function(envTmp, i) {
                var environmentColorObject = Color.getColorOrConvert(envTmp.color);
                if (!environmentColorObject.standard && environmentColorObject.fallback){
                    environmentColorObject = Color.getColor(environmentColorObject.fallback);
                }
                var environmentColor = environmentColorObject.value;
                /*
                envTmp.label = '<div class="color-hint-spacer" style="background-color:' + environmentColor + ';"></div>'
                             +  envTmp.name;
                */
                envTmp.label = '<div style="border-left-width:thick; border-left-style:solid; border-left-color:' + environmentColor + ';">&nbsp;&nbsp;&nbsp;' + envTmp.name + '</div>';
            });
            this.templateSelect = new ComboBox({
                store: this.sharedData.environmentTemplates,
                labelAttr: "label",
                labelType: "html",
                searchAttr: "name",
                autoComplete: false,
                selectOnClick: true,
                onChange: function(value) {
                    var selectedTemplate = self.sharedData.environmentTemplates.query({name: value})[0];
                    self.environment.set("template", selectedTemplate);
                }
            }).placeAt(this.selectAttach);

            var templateSelectTooltipText = "<div class='wizard-environment-page-tooltip'>" +
                i18n("Environment templates are defined for each application template. An environment template contains  a resource  template and can contain environment properties and deployment approval processes.  The resource template defines the resource tree, which determines the structure of its resources. Resources include the computers that you deploy components to and the agents and components themselves.") +
                "</div>";

            var helpTip = new Tooltip({
                connectId: [this.templateSelectTooltip],
                label: templateSelectTooltipText,
                showDelay: 100,
                position: ["below", "after", "above", "before"]
            });

            // watch for relevant changes to the selected environment
            this._reflectSelectedEnvironment();
            this._updateEnvironmentWatchers();
            this.sharedData.environments.query().observe(function(object, removedFrom, insertedInto) {
                if (insertedInto !== -1) {
                    self.environment = object;
                    self._updateEnvironmentWatchers();
                    self._reflectSelectedEnvironment();
                }
                if (self.sharedData.environments.query({selected: true}).length === 0) {
                    self.environment = null;
                    self._reflectSelectedEnvironment();
                }
            });
        },

        _reflectSelectedEnvironment: function() {
            var self = this;
            if (this.environment) {
                this.environmentTmplDescriptionAttach.textContent = this.environment.get("template").description;
                domStyle.set(this.noEnvironmentSelectedAttach, "display", "none");
                domStyle.set(this.createEnvironmentAttach, "display", "none");
                domStyle.set(this.environmentTemplateAttach, "display", "");
                this.templateSelect.set("value", this.environment.get("template").name);
                domConstruct.empty(this.createEnvironmentWidgetAttach);
                this._reflectSelectedEnvironmentTemplate();
            } else {
                domStyle.set(this.noEnvironmentSelectedAttach, "display", "");
                domStyle.set(this.createEnvironmentAttach, "display", "none");
                domStyle.set(this.environmentTemplateAttach, "display", "none");
                domConstruct.empty(this.columnFormAttach);
                if (this.sharedData.environments.query().length === 0) {
                    domStyle.set(this.noEnvironmentSelectedAttach, "display", "none");
                    domStyle.set(this.createEnvironmentAttach, "display", "");
                    // set up the add environment menu
                    new ModelWidgetList({
                        model: self.sharedData.environmentTemplates,
                        widgetFactory: function(template) {
                            return new EnvironmentTemplateOption({
                                template: template,
                                onSelected: function(selectedTemplate) {
                                    domStyle.set(self.createEnvironmentAttach, "display", "none");
                                    self.modelHelper.addEnvironment(selectedTemplate, true);
                                    domConstruct.empty(self.createEnvironmentWidgetAttach);
                                }
                            });
                        }
                    }).placeAt(this.createEnvironmentWidgetAttach);
                }
            }
        },

        _updateEnvironmentWatchers: function() {
            var self = this;
            this.sharedData.environments.query().forEach(function(env){
                env.watch("selected", function(propName, oldValue, newValue) {
                    if (newValue === true) {
                        if ((!self.environment) ||
                            (env.get("uniqId") !== self.environment.get("uniqId"))) {
                            self.environment = env;
                            self._reflectSelectedEnvironment();
                        }
                    }
                });

                env.watch("template", function(propName, oldValue, newValue){
                    if (env === self.environment && oldValue !== newValue) {
                        self._reflectSelectedEnvironmentTemplate(newValue);
                    }
                });
            });
        },

        _reflectSelectedEnvironmentTemplate: function(template) {
            var self = this;

            domConstruct.empty(this.columnFormAttach);

            this.envForm = new ColumnForm({
                showButtons: false
            });

            this.envForm.placeAt(this.columnFormAttach);

            this.envForm.addField({
                name: "name",
                label: i18n("Name"),
                required: true,
                type: "Text",
                value: this.environment ? this.environment.name : "",
                onChange: function(value) {
                    self.environment.set("name", value);
                }
            });

            this.envForm.addField({
                name: "description",
                label: i18n("Description"),
                type: "Text",
                value: this.environment ? this.environment.description : "",
                onChange: function(value) {
                    self.environment.set("description", value);
                }
            });

            domConstruct.place("<div class='env-prop-label'>" + i18n("Environment Properties") + "</div>",
                               this.envForm.formContainer.fieldAttach);

            var havePropDefs = this._havePropDefs();
            if (havePropDefs) {
                this.environment.get("props").query().forEach(function(prop) {
                    var propDef = prop.get("propDef");
                    var propDefCopy = util.clone(propDef);
                    propDefCopy.name = "template/" + propDef.name;
                    if (propDef.pattern) {
                        propDefCopy.description += i18n(" Required Pattern: %s", propDef.pattern);
                    }

                    // make sure the data model gets updated on change
                    propDefCopy.onChange = function(value, item) {
                        if (prop.propDef.type === "MULTI_SELECT") {
                            prop.set("currentValue", value.join(","));
                        } else if (prop.propDef.type === "HTTP_SELECT") {
                            prop.set("currentValue", item.value);
                            prop.set("currentHttpSelectLabel", item.label);
                        } else {
                            prop.set("currentValue", value);
                        }
                    };
                    if (propDefCopy.type === "HTTP_MULTI_SELECT") {
                        util.updateWebextMultiSelectData(propDefCopy, prop,
                            "currentValue", "currentHttpSelectLabel", true);
                    }

                    propDefCopy.value = prop.get("currentValue");
                    propDefCopy.defaultLabel = prop.get("currentHttpSelectLabel");

                    this.envForm.addField(propDefCopy);
                }, this);
            }
        },

        _havePropDefs: function() {
            var propDefs = this.environment.get("template").propDefs;
            return propDefs && propDefs.length > 0;
        }
    });
});

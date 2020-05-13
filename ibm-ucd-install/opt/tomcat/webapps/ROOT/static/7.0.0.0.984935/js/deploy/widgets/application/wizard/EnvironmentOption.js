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
        "dijit/Tooltip",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/dom-attr",
        "dojo/dom-class",
        "dojo/dom-style",
        "dojo/on",
        "js/webext/widgets/color/Color"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Tooltip,
        declare,
        lang,
        domAttr,
        domClass,
        domStyle,
        on,
        Color
) {
    /**
     * A widget that represents a single environment in the Application Wizard.
     * @param  environment  The AppWizEnvironment object that this widget should
     *                      reflect.
     * @param  onSelected   Callback function to run whenever this widget
     *                      receives a click event. Will be given the
     *                      environment associated with this widget.
     */
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div data-dojo-attach-point="environmentOptionAttach" class="environment-option">' +
            '  <span class="environment-option-content">' +
            '    <span data-dojo-attach-point="nameContainerAttach" class="environment-name-container">' +
            '      <div class="horizontal-spacer"></div>' +
            '      <span data-dojo-attach-point="nameAttach" class="environment-name"></span>' +
            '    </span>' +
            '    <span data-dojo-attach-point="requiredPropertiesAttach" class="required-property-wrapper">' +
            '      <span class="environment-req-props">' +
                       i18n('REQUIRED property') +
            '      </span>' +
            '      <span data-dojo-attach-point="propStatusIconAttach" class="propStatusIcon"></span>' +
            '    </span>' +
            '  </span>' +
            '</div>',
        onSelected: null,

        postCreate: function() {
            var self = this;
            this.inherited(arguments);

            var iconToolTip = new Tooltip({
                connectId: [this.propStatusIconAttach],
                position: ["after", "above", "below", "before"],
                getContent: function(matchedNode) {
                    var classList = matchedNode.classList;
                    var toolTipText;
                    if (classList.contains("complete")) {
                        toolTipText = i18n("The environment contains all required property values");
                    } else {
                        toolTipText = i18n("The environment does not contains all required property values");
                    }
                    return toolTipText;
                }
            });

            this._reflectName(this.environment.get("name"));
            this.environment.watch("name", function(propName, oldValue, newValue) {
                self._reflectName(newValue);
            });

            this._reflectHasRequiredProperties();
            this._reflectTemplate(this.environment.get("template"));
            this.environment.watch("template", function(propName, oldValue, newValue) {
                self._reflectTemplate(newValue);
            });

            this._reflectSelected(this.environment.get("selected"));
            this.environment.watch("selected", function(propName, oldValue, newValue) {
                self._reflectSelected(newValue);
            });

            on(this, "click", this._onSelected);
        },

        _onSelected: function() {
            this.environment.set("selected", true);
            if (this.onSelected) {
                this.onSelected(this.environment);
            }
        },

        _reflectTemplate: function(template) {
            var self = this;

            this.environment.get("props").query().forEach(function(property) {
                property.watch("currentValue", function(propName, oldValue, newValue) {
                    self._reflectProperty(property);
                });
            });

            this._reflectColor(template.color);
            this._reflectHasRequiredProperties(template.propDefs);
        },

        _reflectColor: function(colorObject) {
            var environmentColorObject = Color.getColorOrConvert(colorObject);
            if (!environmentColorObject.standard && environmentColorObject.fallback){
                environmentColorObject = Color.getColor(environmentColorObject.fallback);
            }
            var environmentColor = environmentColorObject.value;

            domStyle.set(this.environmentOptionAttach, "borderLeftWidth", "thick");
            domStyle.set(this.environmentOptionAttach, "borderLeftStyle", "solid");
            domStyle.set(this.environmentOptionAttach, "borderLeftColor", environmentColorObject.value);
        },

        _reflectName: function(name) {
            this.nameAttach.textContent = i18n(name);
        },

        _reflectHasRequiredProperties: function() {
            var self = this;

            // check for required properties
            this.requiredPropertiesAttach.style.display = "none";
            domClass.add(this.nameContainerAttach, "full-length");
            this.environment.get("props").query().some(function(prop) {
                if (prop.get("propDef").required === true) {
                    self.requiredPropertiesAttach.style.display = "";
                    domClass.remove(self.nameContainerAttach, "full-length");
                    domClass.add(self.nameContainerAttach, "partial-length");
                }
                return prop.required === true;
            });

            this._reflectValidation();
        },

        _reflectProperty: function() {
            this._reflectValidation();
        },

        _reflectValidation: function() {
            var self = this;
            var props = this.environment.get("props").query();

            // whether or not we have encountered an invalid property value
            var invalid = false;
            invalid = props.some(function(property){
                if (property.error !== "") {
                    domClass.remove(self.propStatusIconAttach, "complete");
                    domClass.add(self.propStatusIconAttach, "empty");
                    return true;
                }
            });

            if (invalid === false) {
                domClass.remove(this.propStatusIconAttach, "empty");
                domClass.add(this.propStatusIconAttach, "complete");
            }
        },

        _reflectSelected: function(selected) {
            if (selected === true) {
                domClass.add(this.environmentOptionAttach, "selected");
            }
            else {
                domClass.remove(this.environmentOptionAttach, "selected");
            }
        }
    });
});

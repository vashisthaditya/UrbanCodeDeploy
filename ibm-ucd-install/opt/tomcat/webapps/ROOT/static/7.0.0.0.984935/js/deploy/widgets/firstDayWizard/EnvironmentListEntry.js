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
     * A widget that represents a single environment in the First Day Wizard.
     * @param  environment The EnvironmentModel object that this widget should
     *                      reflect.
     * @param  onSelected   Callback function to run whenever this widget
     *                      receives a click event. Will be given the
     *                      environment associated with this widget.
     */
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div data-dojo-attach-point="environmentEntryAttach" class="entry">' +
            '  <span>' +
            '    <div class="inlineBlock general-icon environmentIcon"></div>' +
            '    <span data-dojo-attach-point="nameAttach" class="name-container"></span>' +
            '  </span>' +
            '</div>',
        onSelected: null,

        postCreate: function() {
            var self = this;
            this.inherited(arguments);

            this._reflectName(this.environment.get("name"));
            this.environment.watch("name", function(propName, oldValue, newValue) {
                self._reflectName(newValue);
            });

            this._reflectColor(this.environment.get("color"));
            this.environment.watch("color", function(propName, oldValue, newValue) {
                self._reflectColor(newValue);
            });

            //this._reflectHasRequiredProperties();

            this._reflectSelected(this.environment.get("selected"));
            this.environment.watch("selected", function(propName, oldValue, newValue) {
                self._reflectSelected(newValue);
            });

            on(this, "click", this._onSelected);
        },

        _onSelected: function() {
            if (this.onSelected) {
                this.onSelected(this.environment);
            }
        },

        _reflectName: function(name) {
            this.nameAttach.textContent = i18n(name);
        },

        _reflectColor: function(colorObject) {
            var environmentColorObject = Color.getColorOrConvert(colorObject);
            if (!environmentColorObject.standard && environmentColorObject.fallback){
                environmentColorObject = Color.getColor(environmentColorObject.fallback);
            }
            var environmentColor = environmentColorObject.value;

            domStyle.set(this.environmentEntryAttach, "borderLeftWidth", "thick");
            domStyle.set(this.environmentEntryAttach, "borderLeftStyle", "solid");
            domStyle.set(this.environmentEntryAttach, "borderLeftColor", environmentColorObject.value);
        },

        _reflectHasRequiredProperties: function() {
            var self = this;

            // check for required properties
            this.requiredPropertiesAttach.style.display = "none";
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

        _reflectValidation: function() {
            var self = this;
            var props = this.component.get("props").query();

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
                domClass.add(this.environmentEntryAttach, "selected");
            }
            else {
                domClass.remove(this.environmentEntryAttach, "selected");
            }
        }
    });
});

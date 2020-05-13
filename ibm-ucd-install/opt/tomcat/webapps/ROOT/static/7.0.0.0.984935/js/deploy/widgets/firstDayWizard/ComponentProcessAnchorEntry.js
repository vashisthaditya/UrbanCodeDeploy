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
     * A widget that represents a single component in the First Day Wizard.
     * @param  component The ComponentModel object that this widget should
     *                      reflect.
     * @param  onSelected   Callback function to run whenever this widget
     *                      receives a click event. Will be given the
     *                      component associated with this widget.
     */
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="process-anchor-entry">' +
            '  <div data-dojo-attach-point="componentEntryWrapperAttach">' +
            '  <span>' +
            '    <div class="inlineBlock general-icon componentIcon"></div>' +
            '    <span data-dojo-attach-point="nameAttach" class="component-name-container"></span>' +
            '  </span>' +
            '  </div>' +
            '  <div data-dojo-attach-point="componentProcessAttach" class="component-processes">' +
            '  </div>' +
            '</div>',
        onSelected: null,

        postCreate: function() {
            var self = this;
            this.inherited(arguments);

            this._reflectName(this.component.get("name"));
            this.component.watch("name", function(propName, oldValue, newValue) {
                self._reflectName(newValue);
            });

            //this._reflectHasRequiredProperties();

            this._reflectSelected(this.component.get("selected"));
            this.component.watch("selected", function(propName, oldValue, newValue) {
                self._reflectSelected(newValue);
            });

            this.componentProcessAttach.id = "component-" + this.component.id;

            on(this, "click", this._onSelected);
        },

        _onSelected: function() {
            if (this.onSelected) {
                this.onSelected(this.component);
            }
        },

        _reflectName: function(name) {
            this.nameAttach.textContent = i18n(name);
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
                domClass.add(this.componentEntryWrapperAttach, "selected");
            }
            else {
                domClass.remove(this.componentEntryWrapperAttach, "selected");
            }
        }
    });
});

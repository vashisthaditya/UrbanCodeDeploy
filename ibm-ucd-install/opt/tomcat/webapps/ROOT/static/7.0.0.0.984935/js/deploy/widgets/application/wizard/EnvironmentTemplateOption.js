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
     * @param  template
     *     The Stateful environment template that this widget should reflect.
     * @param  onSelected
     *     Callback function to run whenever this widget receives a click event.
     *     Will be given the environment template associated with this widget.
     */
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="environment-template-option">' +
            '  <div data-dojo-attach-point="contentAttach" class="environment-template-option-content">' +
            '  <div class="environment-name-container">' +
            '    <div class="horizontal-spacer"></div>' +
            '    <span data-dojo-attach-point="nameAttach" class="environment-name"></span>' +
            '  </div>' +
            '  </div>' +
            '</div>',
        onSelected: null,

        postCreate: function() {
            var self = this;
            this.inherited(arguments);

            this._reflectName(this.template.get("name"));
            this.template.watch("name", function(propName, oldValue, newValue) {
                self._reflectName(newValue);
            });

            this._reflectColor(this.template.get("color"));
            this.template.watch("color", function(propName, oldValue, newValue) {
                self._reflectSelected(newValue);
            });

            on(this, "click", function() {
                self.onSelected(self.template);
            });
        },

        _reflectColor: function(colorObject) {
            var environmentColorObject = Color.getColorOrConvert(colorObject);
            if (!environmentColorObject.standard && environmentColorObject.fallback){
                environmentColorObject = Color.getColor(environmentColorObject.fallback);
            }
            var environmentColor = environmentColorObject.value;

            domStyle.set(this.contentAttach, "borderLeftWidth", "thick");
            domStyle.set(this.contentAttach, "borderLeftStyle", "solid");
            domStyle.set(this.contentAttach, "borderLeftColor", environmentColor);
        },

        _reflectName: function(name) {
            this.nameAttach.textContent = i18n(name);
        }
    });
});

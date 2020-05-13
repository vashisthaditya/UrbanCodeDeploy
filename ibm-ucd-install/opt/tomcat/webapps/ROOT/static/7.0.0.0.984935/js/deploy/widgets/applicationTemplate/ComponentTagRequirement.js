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
/**
 *
 **/
define([
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dojo/_base/array",
        "dojo/on",
        "dojo/json",
        "dojo/mouse",
        "dojo/_base/declare",
        "dojo/_base/Color",
        "dojo/_base/xhr",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/dom-style",
        "dojo/dom-attr",
        "js/webext/widgets/Alert",
        "js/webext/widgets/GenericConfirm"
        ],
function(
    _TemplatedMixin,
    _Widget,
    array,
    on,
    JSON,
    mouse,
    declare,
    Color,
    xhr,
    domConstruct,
    domClass,
    domStyle,
    domAttr,
    Alert,
    GenericConfirm
) {
    /**
     * A single inline tag, with requirements. Editable unless readonly is set to true.
     */
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="inlineBlock tagRequirement tagBox">' +
                '<span class="tagName" data-dojo-attach-point="nameSpan"></span>' +
                '<select data-dojo-attach-point="requirementType" class="requirementType">' +
                    '<option value="EQUALS">=</option>' +
                    '<option value="GREATER_THAN">&gt;</option>' +
                    '<option value="LESS_THAN">&lt;</option>' +
                '</select>' +
                '<input type="text" data-dojo-attach-point="requirementNumber" class="requirementValue">' +
                '<span class="tagDelete" data-dojo-attach-point="delSpan" title="'+i18n("Delete")+'">x</span>' +
            '</div>',

        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            var tag = self.tag;

            // If using IE, add an extra class to the tag requirement for styling:
            if (util.getIE() !== null) {
                domClass.add(this.domNode, "ieTagRequirement");
            }

            this.nameSpan.textContent = tag.name;
            this.requirementNumber.value = self.number;
            this.requirementType.value = self.type;

            var borderColor = self.getShade(tag.color);
            domStyle.set(this.domNode, "backgroundColor", tag.color);
            domStyle.set(this.domNode, "borderColor", borderColor);
            domStyle.set(this.delSpan, "borderColor", borderColor);

            if (self._isDark(tag.color)) {
                domClass.add(this.domNode, "darkColor");
            }

            if (self.readOnly) {
                domStyle.set(self.delSpan, "display", "none");
                domAttr.set(this.requirementType, "disabled", "disabled");
                domAttr.set(this.requirementNumber, "disabled", "disabled");
            }

            on(self.delSpan, "click", self.deleteHandler);
        },

        _getValueAttr: function() {
            return {
                name: this.tag.name,
                type: this.requirementType.value,
                number: this.requirementNumber.value
            };
        },

        ///////  TODO: Everything below here is from TagDisplay.js :( ///////

        /**
         * Determines if a color is considered a "dark" color.
         * Used to decide whether to use light or dark colored text.
         * Note: Grabbed from uRelease
         */
        _isDark: function(color) {
            var rgbColor = new Color(color).toRgb();
            var colorWeight = 1 - (0.25 * rgbColor[0] + 0.6 * rgbColor[1] + 0.1 * rgbColor[2]) / 255;
            return colorWeight > 0.5;
        },

        /**
         * Returns a darker shade of a given color.
         */
        getShade : function(color) {
            var rgbColor = new Color(color).toRgb();
            var tint = [];
            array.forEach(rgbColor, function(hue){
                tint.push(0.6 * hue);
            });
            return Color.fromArray(tint).toHex();
        }
            
    });
});
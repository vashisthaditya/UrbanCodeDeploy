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
        "dijit/Tooltip",
        "dojo/_base/array",
        "dojo/on",
        "dojo/mouse",
        "dojo/_base/declare",
        "dojo/_base/Color",
        "dojo/dom-attr",
        "dojo/dom-class",
        "dojo/dom-style"
        ],
function(
    _TemplatedMixin,
    _Widget,
    Tooltip,
    array,
    on,
    mouse,
    declare,
    Color,
    domAttr,
    domClass,
    domStyle
) {
    /**
     * Yet another implementation of a single inline tag.  This time in it's own widget.
     */
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="inlineBlock tagBox">' +
                '<span class="tagName" data-dojo-attach-point="nameSpan"></span>' +
                '<span class="tagDelete" data-dojo-attach-point="delSpan" title="'+i18n("Delete")+'">x</span>' +
            '</div>',

        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            this.nameSpan.textContent = this.name;
            domStyle.set(this.domNode, "backgroundColor", this.color);

            if (this.description) {
                on(this.nameSpan, mouse.enter, function() {
                    Tooltip.show(util.escape(self.description), this);
                });
                on(this.nameSpan, mouse.leave, function() {
                    Tooltip.hide(this);
                });
            }

            if (self._isDark(this.color)) {
                domClass.add(this.domNode, "darkColor");
            }

            if (self.readOnly) {
                domStyle.set(self.delSpan, "display", "none");
            }

            on(self.delSpan, "click", self.deleteHandler);
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

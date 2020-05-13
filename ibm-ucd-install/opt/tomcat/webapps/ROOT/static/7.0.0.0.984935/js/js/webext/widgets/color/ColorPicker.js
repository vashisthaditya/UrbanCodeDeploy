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
/*global define */
define([
        "dojo/_base/declare",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/dom-style",
        "dojo/on",
        "dojo/mouse",
        "dojo/_base/array",
        "js/webext/widgets/color/Color"
], function(
        declare,
        _WidgetBase,
        _TemplatedMixin,
        domConstruct,
        domClass,
        domStyle,
        on,
        mouse,
        array,
        Color
) {

    /**
     * Simple color picker using colors from the IBM Design Language
     *
     * options {
     *     value (HEX String): A color value in HEX. If the value is not in the picker, it will convert it to the
     *            nearest color value in the color picker.
     *
     *     mode (string): Determines the number of colors to display.
     *           simple: 8
     *           basic: 16
     *           standard: 20 (Default)
     *           full: 30
     * }
     */
    return declare( [_WidgetBase, _TemplatedMixin], {
        mode: "standard",

        templateString:
            '<div class="color-picker">'+
                '<div class="color-picker-boxes-container" data-dojo-attach-point="colorBoxesAP"></div>'+
                '<div class="selected-color-box-container" data-dojo-attach-point="selectedColorAP"></div>'+
            '</div>',

        postCreate: function(){
            this._determineMode();
            this._createdSelectedColor();
            this._createColorBoxes();
            if (!this.value || (this.value && this.value.toUpperCase() === "#FFFFFF")){
                this.value = "#00B2EF";
            }
            this.set("value", this.value);
        },

        set: function(attr, value){
            var self = this;
            this.inherited(arguments);
            if (value && this.colorBoxes){
                try {
                    var color = self.colorBoxes[value.toUpperCase()];
                    self.convertedFrom = null;
                    // Assume if color value is not found, it is a color from the dojo color palette.
                    // Retrieve converted color values.
                    if (!color){
                        var dojoColor = Color.getDojoColor(value);
                        if (dojoColor){
                            color = self.colorBoxes[dojoColor.fallback];
                        }
                        self.value = color.value;
                        self.convertedFrom = dojoColor;
                    }
                    else {
                        delete self.convertedFrom;
                    }

                    // If color given was from a color picker with more colors to a picker with less
                    // colors, take the fallback color value.
                    var fallback = false;
                    if (color && !color[self.mode]){
                        self.convertedFrom = self.convertedFrom || color;
                        if ((self.mode === "basic" || self.mode === "simple") && color.basicFallback){
                            color = self.colorBoxes[color.basicFallback];
                            if (!color[self.mode]){
                                color = self.colorBoxes[color.fallback];
                            }
                        }
                        else {
                            color = self.colorBoxes[color.fallback];
                        }
                        fallback = true;
                        self.value = color.value;
                    }
                    var name = null;
                    var simpleName = null;
                    var light = false;
                    if (color){
                        name = color.name;
                        simpleName = color.simpleName;
                        light = color.light;

                        if (self.selectedColor && self.selectedColor.box){
                            domClass.remove(self.selectedColor.box, "selected-color");
                        }
                        self.selectedColor = color;
                        if (color.box){
                            self.selectedColor.box = color.box;
                        }
                        domClass.add(self.selectedColor.box, "selected-color");
                    }

                    // Update selected color box UI.
                    self._setSelectedColorBox(color.value, name, name ? simpleName : "", light, self.convertedFrom);
                    self.onChange(color.value, color.name, color.simpleName, color.baseColor, self.setByUser);
                }
                catch (e){
                    // Catches if text is already in upper case.
                }
            }
        },

        /**
         * Determines the amount of colors to display based on the mode.
         */
        _determineMode: function(){
            var mode = this.mode.toLowerCase();
            var colorColumn = 0;
            var className = "";
            switch (mode){
                case "simple":
                    mode = "simple";
                    colorColumn = 1;
                    className = "simple-colors";
                    break;
                case "basic":
                    mode = "basic";
                    className = "basic-colors";
                    colorColumn = 2;
                    break;
                case "full":
                    mode = "full";
                    colorColumn = 3;
                    className = "full-colors";
                    break;
                default:
                    mode = "standard";
                    className = "standard-colors";
                    colorColumn = 2;
                    break;
            }
            domClass.add(this.domNode, className);
            if (this.disabled){
                domClass.add(this.domNode, "color-picker-disabled");
            }
            this.colorColumn = colorColumn;
            this.mode = mode;
        },

        /**
         * Creates the selected color box.
         */
        _createdSelectedColor: function(){
            this.selectedColorBox = domConstruct.create("div", {
                className: "selected-color-box light-color"
            }, this.selectedColorAP);
            var textWrapper = domConstruct.create("div", {
                className: "selected-color-box-text-wrapper"
            }, this.selectedColorBox);
            // Color Name
            this.selectedColorBoxText = domConstruct.create("div", {
                className: "selected-color-box-text",
                innerHTML: i18n("No Color Selected")
            }, textWrapper);
            // Color Simple Name
            this.selectedColorBoxTextSimple = domConstruct.create("div", {
                className: "selected-color-box-text-simple"
            }, textWrapper);
            // Color HEX Value
            this.selectedColorBoxTextHexValue = domConstruct.create("div", {
                className: "selected-color-box-text-hex-value"
            }, textWrapper);
            // Color Converted From
            this.selectedColorBoxTextConvertedFromContainer = domConstruct.create("div", {
                className: "selected-color-box-converted-from-container"
            }, textWrapper);
            this.own(on(textWrapper, "dblclick", function(){
                // Clear text selection on double click.
                if (window.getSelection) {
                    if (window.getSelection().empty) {  // Chrome
                        window.getSelection().empty();
                    } else if (window.getSelection().removeAllRanges) {  // Firefox
                        window.getSelection().removeAllRanges();
                    }
                } else if (document.selection) {  // IE
                    document.selection.empty();
                }
                domClass.toggle(textWrapper, "show-color-hex-value");
                util.setCookie("showInformationOnColor", domClass.contains(textWrapper, "show-color-hex-value"));
            }));
            // Cookie to set preference on whether to show additional information on color.
            var showInformation = util.getCookie("showInformationOnColor");
            if (showInformation && showInformation === "true"){
                domClass.add(textWrapper, "show-color-hex-value");
            }
        },

        /**
         * Creates the color boxes to choose the colors.
         */
        _createColorBoxes: function(){
            var self = this;
            this.colors = Color.getColors();

            var colorBoxesContainer = domConstruct.create("div", {
                className: "color-boxes-container"
            }, this.colorBoxesAP);

            // Make a reference to each color box.
            if (!this.colorBoxes){
                this.colorBoxes = {};
            }

            var lastColorColumn = null;
            var index = 0;
            // Create the color boxes
            array.forEach(this.colors, function(color){
                // Add color if it exists in the current display mode.
                if (color[self.mode]) {
                    // Create a color column of common colors
                    if (index % self.colorColumn === 0){
                        lastColorColumn = domConstruct.create("div", {
                            className: "inline-block color-boxes-column color-" + color.baseColor
                        }, colorBoxesContainer);
                    }
                    index++;
                    self.colorBoxes[color.value] = color;
                    var colorBox = domConstruct.create("div", {
                        className: "color-box color-box-" + color.value,
                        tabindex: self.disabled ? undefined : 0,
                        title: i18n("%s (%s)", i18n(color.name), i18n(color.simpleName)),
                        alt: i18n("%s (%s)", i18n(color.name), i18n(color.simpleName)),
                        style: {
                            backgroundColor: color.value
                        }
                    }, lastColorColumn);

                    // Color the selected color box on hover
                    self.own(on(colorBox, mouse.enter, function(){
                        self._setSelectedColorBox(color.value, color.name, color.simpleName, color.light);
                    }));
                    // Set and color the selected box on click or enter
                    var setValue = function(){
                        if (!self.disabled){
                            self.setByUser = true; // Variable tracks if value is set by user and not a widget.
                            self.set("value", color.value);
                            self.setByUser = false;
                        }
                    };
                    self.own(on(colorBox, "click", function(){
                        setValue();
                    }));
                    self.own(on(colorBox, "keypress", function(evt){
                        if (evt.keyIdentifier === "Enter"){
                            setValue();
                        }
                    }));
                    self.colorBoxes[color.value].box = colorBox;
                }
                else {
                    // Add reference to color even if box is not created.
                    self.colorBoxes[color.value] = color;
                }
            });

            // If end hover, reset selected color box to selected color value or white.
            this.own(on(self.colorBoxesAP, mouse.leave, function(){
                var colorValue = self.value || "#FFFFFF";
                var colorName = self.selectedColor ? self.selectedColor.name : "";
                var colorSimpleName = self.selectedColor ? self.selectedColor.simpleName : null;
                var light = self.selectedColor ? self.selectedColor.light : false;
                if (!self.value){
                    colorName = i18n("No Color Selected");
                }
                self._setSelectedColorBox(colorValue, colorName, colorSimpleName, light, self.convertedFrom);
            }));
        },

        /**
         * Sets the color and text of the selected color box.
         * @param {String} color: HEX value of the color.
         * @param {String} name: Name of the color.
         * @param {String} simpleName: Simple name of color.
         * @param {Boolean} light: If color if really light, force to display dark text.
         * @param {Color Object} convertedFrom: The color that was converted from another color (If Exists).
         */
        _setSelectedColorBox: function(color, name, simpleName, light, convertedFrom){
            domStyle.set(this.selectedColorBox, "backgroundColor", color);
            this.selectedColorBox.alt = i18n("%s (%s) - %s", i18n(name), i18n(simpleName), color.toUpperCase());
            this.selectedColorBoxText.innerHTML = i18n(name);
            this.selectedColorBoxTextSimple.innerHTML = i18n("(%s)", i18n(simpleName));
            this.selectedColorBoxTextHexValue.innerHTML = color.toUpperCase();

            if (light){
                domClass.remove(this.selectedColorBox, "dark-color");
                domClass.add(this.selectedColorBox, "light-color");
            }
            else {
                domClass.remove(this.selectedColorBox, "light-color");
                domClass.add(this.selectedColorBox, "dark-color");
            }

            domConstruct.empty(this.selectedColorBoxTextConvertedFromContainer);
            if (convertedFrom && convertedFrom.name){
                domConstruct.create("div", {
                    className: "color-converted-name",
                    innerHTML: i18n("Converted From: %s", i18n(convertedFrom.name))
                }, this.selectedColorBoxTextConvertedFromContainer);
                domConstruct.create("div", {
                    className: "color-converted-value",
                    innerHTML: convertedFrom.value
                }, this.selectedColorBoxTextConvertedFromContainer);
                domConstruct.create("div", {
                    className: "color-converted-color",
                    title: i18n("%s - %s", i18n(convertedFrom.name), convertedFrom.value),
                    alt: i18n("%s - %s", i18n(convertedFrom.name), convertedFrom.value),
                    style: {
                        backgroundColor: convertedFrom.value
                    }
                }, this.selectedColorBoxTextConvertedFromContainer);
            }
        },

        /**
         * Function called when value gets changed
         * @param {HEX String} value: HEX value of color.
         * @param {String} name: The name of the color.
         * @param {String} simpleName: The simple name of the color.
         * @param {String} baseColor: The overall base color.
         * @param {Boolean} setByUser: If color was changed by user (Mouse Click or Keyboard).
         */
        onChange: function(value, name, simpleName, baseColor, setByUser){}

    }); // End declare
});

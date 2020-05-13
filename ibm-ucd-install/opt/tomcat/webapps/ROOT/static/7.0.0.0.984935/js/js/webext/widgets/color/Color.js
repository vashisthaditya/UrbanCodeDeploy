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
/*global i18n, define */

define(["dojo/_base/array",
        "dojo/_base/lang",
        "dojo/_base/Color"
        ],
function(array,
         lang,
         DojoColor) {
    /**
     * Defines the color palette from the IBM Design Language. Includes definitions of the dojo
     * color palette to convert those colors to a color closest to a color in the IBM Design language.
     */
    return {
        /**
         * Set of colors from the IBM Design Language.
         */
        colors: {
            "#F04E37" : {
                name: i18n("Vermillion"),
                simpleName: i18n("Light Red"),
                baseColor: i18n("Red"),
                value: "#F04E37",
                fallback:  "#D9182D",
                full: true
            },
            "#D9182D" : {
                name: i18n("Crimson"),
                simpleName: i18n("Red"),
                baseColor: i18n("Red"),
                value: "#D9182D",
                simple: true,
                basic: true,
                standard: true,
                full: true
            },
            "#A91024" : {
                name: i18n("Firebrick"),
                simpleName: i18n("Dark Red"),
                baseColor: i18n("Red"),
                value: "#A91024",
                fallback:  "#D9182D",
                basic: true,
                standard: true,
                full: true
            },
            "#F19027" : {
                name: i18n("Carrot Orange"),
                simpleName: i18n("Light Orange"),
                baseColor: i18n("Orange"),
                value: "#F19027",
                fallback: "#DD731C",
                full: true
            },
            "#DD731C" : {
                name: i18n("Cinnamon"),
                simpleName: i18n("Orange"),
                baseColor: i18n("Orange"),
                value: "#DD731C",
                simple: true,
                basic: true,
                standard: true,
                full: true
            },
            "#B8461B" : {
                name: i18n("Rust"),
                simpleName: i18n("Dark Orange"),
                baseColor: i18n("Orange"),
                value: "#B8461B",
                fallback: "#DD731C",
                basic: true,
                standard: true,
                full: true
            },
            "#FFE14F" : {
                name: i18n("Mustard"),
                simpleName: i18n("Light Yellow"),
                baseColor: i18n("Yellow"),
                value: "#FFE14F",
                fallback: "#FFCF01",
                light: true,
                full: true
            },
            "#FFCF01" : {
                name: i18n("Tangerine Yellow"),
                simpleName: i18n("Yellow"),
                baseColor: i18n("Yellow"),
                value: "#FFCF01",
                light: true,
                simple: true,
                basic: true,
                standard: true,
                full: true
            },
            "#FDB813" : {
                name: i18n("Golden Poppy"),
                simpleName: i18n("Dark Yellow"),
                baseColor: i18n("Yellow"),
                value: "#FDB813",
                fallback: "#FFCF01",
                light: true,
                basic: true,
                standard: true,
                full: true
            },
            "#8CC63F" : {
                name: i18n("Yellow Green"),
                simpleName: i18n("Light Green"),
                baseColor: i18n("Green"),
                value: "#8CC63F",
                fallback: "#17AF4A",
                full: true
            },
            "#17AF4A" : {
                name: i18n("Mountain Meadow"),
                simpleName: i18n("Green"),
                baseColor: i18n("Green"),
                value: "#17AF4A",
                simple: true,
                basic: true,
                standard: true,
                full: true
            },
            "#008A52" : {
                name: i18n("Sea Green"),
                simpleName: i18n("Dark Green"),
                baseColor: i18n("Green"),
                value: "#008A52",
                fallback: "#17AF4A",
                basic: true,
                standard: true,
                full: true
            },
            "#00A6A0" : {
                name: i18n("Persian Green"),
                simpleName: i18n("Light Teal"),
                baseColor: i18n("Green"),
                value: "#00A6A0",
                fallback: "#007670",
                basicFallback: "#17AF4A",
                full: true
            },
            "#007670" : {
                name: i18n("Pine Green"),
                simpleName: i18n("Teal"),
                baseColor: i18n("Green"),
                value: "#007670",
                fallback: "#17AF4A",
                standard: true,
                full: true
            },
            "#006059" : {
                name: i18n("Bottle Green"),
                simpleName: i18n("Dark Teal"),
                baseColor: i18n("Green"),
                value: "#006059",
                fallback: "#007670",
                basicFallback: "#17AF4A",
                standard: true,
                full: true
            },
            "#82D1F5" : {
                name: i18n("Baby Blue"),
                simpleName: i18n("Light Blue"),
                baseColor: i18n("Blue"),
                value: "#82D1F5",
                fallback: "#00B2EF",
                light: true,
                full: true
            },
            "#00B2EF" : {
                name: i18n("Bright Cerulean"),
                simpleName: i18n("Blue"),
                baseColor: i18n("Blue"),
                value: "#00B2EF",
                simple: true,
                basic: true,
                standard: true,
                full: true
            },
            "#00648D" : {
                name: i18n("Sea Blue"),
                simpleName: i18n("Dark Blue"),
                baseColor: i18n("Blue"),
                value: "#00648D",
                fallback: "#00B2EF",
                basic: true,
                standard: true,
                full: true
            },
            "#00B0DA" : {
                name: i18n("Iris Blue"),
                simpleName: i18n("Light Blue 2"),
                baseColor: i18n("Blue"),
                value: "#00B0DA",
                fallback: "#00B2EF",
                basicFallback: "#00B2EF",
                full: true
            },
            "#009AD6" : {
                name: i18n("Bondi Blue"),
                simpleName: i18n("Blue 2"),
                baseColor: i18n("Blue"),
                value: "#009AD6",
                fallback: "#00B2EF",
                standard: true,
                full: true
            },
            "#003F69" : {
                name: i18n("Prussian Blue"),
                simpleName: i18n("Dark Blue 2"),
                baseColor: i18n("Blue"),
                value: "#003F69",
                fallback: "#00648D",
                basicFallback: "#00648D",
                standard: true,
                full: true
            },
            "#AB1A86" : {
                name: i18n("Red Violet"),
                simpleName: i18n("Light Purple"),
                baseColor: i18n("Purple"),
                value: "#AB1A86",
                fallback: "#7F1C7D",
                basic: true,
                standard: true,
                full: true
            },
            "#7F1C7D" : {
                name: i18n("Mardi Gras"),
                simpleName: i18n("Purple"),
                baseColor: i18n("Purple"),
                value: "#7F1C7D",
                simple: true,
                basic: true,
                standard: true,
                full: true
            },
            "#3B0256" : {
                name: i18n("Indigo"),
                simpleName: i18n("Dark Purple"),
                baseColor: i18n("Purple"),
                value: "#3B0256",
                fallback: "#7F1C7D",
                full: true
            },
            "#F389AF" : {
                name: i18n("Mauvelous"),
                simpleName: i18n("Light Pink"),
                baseColor: i18n("Pink"),
                value: "#F389AF",
                fallback: "#F051A1",
                basic: true,
                standard: true,
                full: true
            },
            "#F051A1" : {
                name: i18n("French Rose"),
                simpleName: i18n("Pink"),
                baseColor: i18n("Pink"),
                value: "#F051A1",
                simple: true,
                basic: true,
                standard: true,
                full: true
            },
            "#BA006E" : {
                name: i18n("Jazzberry Jam"),
                simpleName: i18n("Dark Pink"),
                baseColor: i18n("Pink"),
                value: "#BA006E",
                fallback: "#F051A1",
                full: true
            },
            "#A5A215" : {
                name: i18n("Brass"),
                simpleName: i18n("Light Taupe"),
                baseColor: i18n("Yellow"),
                value: "#A5A215",
                fallback: "#91922F",
                basicFallback: "#FFCF01",
                full: true
            },
            "#91922F" : {
                name: i18n("Olive"),
                simpleName: i18n("Taupe"),
                baseColor: i18n("Yellow"),
                value: "#91922F",
                fallback: "#FDB813",
                basicFallback: "#FFCF01",
                standard: true,
                full: true
            },
            "#594F13" : {
                name: i18n("Antique Bronze"),
                simpleName: i18n("Dark Taupe"),
                baseColor: i18n("Yellow"),
                value: "#594F13",
                fallback: "#91922F",
                basicFallback: "#FDB813",
                standard: true,
                full: true
            },
            "#929497" : {
                name: i18n("Aluminum"),
                simpleName: i18n("Light Gray"),
                baseColor: i18n("Black"),
                value: "#929497",
                fallback: "#6D6E70",
                full: true
            },
            "#6D6E70" : {
                name: i18n("Dim Gray"),
                simpleName: i18n("Gray"),
                baseColor: i18n("Black"),
                value: "#6D6E70",
                simple: true,
                basic: true,
                standard: true,
                full: true
            },
            "#404041" : {
                name: i18n("Jet"),
                simpleName: i18n("Dark Gray"),
                baseColor: i18n("Black"),
                value: "#404041",
                fallback: "#6D6E70",
                basic: true,
                standard: true,
                full: true
            },
            "#A8A7A5" : {
                name: i18n("Silver Chalice"),
                simpleName: i18n("Light Gray 2"),
                baseColor: i18n("Black"),
                value: "#A8A7A5",
                fallback: "#8F8D8A",
                basicFallback: "#6D6E70",
                full: true
            },
            "#8F8D8A" : {
                name: i18n("Battleship Grey"),
                simpleName: i18n("Gray 2"),
                baseColor: i18n("Black"),
                value: "#8F8D8A",
                standard: true,
                fallback: "#6D6E70",
                full: true
            },
            "#605F5C" : {
                name: i18n("Sonic Silver"),
                simpleName: i18n("Dark Gray 2"),
                baseColor: i18n("Black"),
                value: "#605F5C",
                fallback: "##8F8D8A",
                basicFallback: "#404041",
                standard: true,
                full: true
            }
        },

        /**
         * Return a list of colors from the IBM Design Language.
         */
        getColors: function() {
            var self = this;
            var colors = [];
            // Array retrieves color objects in this order.
            var colorList = [
                // Red
                "#F04E37",
                "#D9182D",
                "#A91024",
                // Orange
                "#F19027",
                "#DD731C",
                "#B8461B",
                // Yellow
                "#FFE14F",
                "#FFCF01",
                "#FDB813",
                // Green
                "#8CC63F",
                "#17AF4A",
                "#008A52",
                // Teal
                "#00A6A0",
                "#007670",
                "#006059",
                // Blue
                "#82D1F5",
                "#00B2EF",
                "#00648D",
                "#00B0DA",
                "#009AD6",
                "#003F69",
                // Purple
                "#AB1A86",
                "#7F1C7D",
                "#3B0256",
                // Pink
                "#F389AF",
                "#F051A1",
                "#BA006E",
                // Taupe
                "#A5A215",
                "#91922F",
                "#594F13",
                // Gray
                "#929497",
                "#6D6E70",
                "#404041",
                "#A8A7A5",
                "#8F8D8A",
                "#605F5C"];
            array.forEach(colorList, function(color){
                colors.push(lang.clone(self.getColor(color)));
            });
            return colors;
        },

        /**
         * Gets information of a color.
         * @param {HEX String} color: The HEX value of the color.
         * @return {Object} Information about the color such as the color name.
         */
        getColor: function(color){
            return this.colors[color] || this.getDojoColor(color);
        },

        getColorOrConvert: function(color){
            var result = null;
            if (color){
                result = this.colors[color.toUpperCase()];
                if (!result){
                    result = this.getDojoColor(color.toUpperCase());
                    if (result){
                        result = this.getColor(result.fallback);
                    }
                }
            }
            if (!result) {
                result = this.colors["#00B2EF"];
            }
            return result;

        },

        /**
         * Define colors from dijit/ColorPalette.
         */
        dojoColors: {
            "#FFFFFF": {
                name: i18n("White"),
                baseColor: i18n("Gray"),
                value: "#FFFFFF",
                fallback: "#A8A7A5"
            },
            "#D3D3D3": {
                name: i18n("Light Gray"),
                baseColor: i18n("Gray"),
                value: "#D3D3D3",
                fallback: "#A8A7A5"
            },
            "#C0C0C0": {
                name: i18n("Silver"),
                baseColor: i18n("Gray"),
                value: "#C0C0C0",
                fallback: "#A8A7A5"
            },
            "#808080": {
                name: i18n("Gray"),
                baseColor: i18n("Gray"),
                value: "#808080",
                fallback: "#8F8D8A"
            },
            "#696969": {
                name: i18n("Dim Gray"),
                baseColor: i18n("Gray"),
                value: "#696969",
                fallback: "#6D6E70"
            },
            "#2F4F4F": {
                name: i18n("Dark Slate Gray"),
                baseColor: i18n("Gray"),
                value: "#2F4F4F",
                fallback: "#404041"
            },
            "#000000": {
                name: i18n("Black"),
                baseColor: i18n("Gray"),
                value: "#000000",
                fallback: "#404041"
            },
            "#FFF5EE": {
                name: i18n("Seashell"),
                baseColor: i18n("Orange"),
                value: "#FFF5EE",
                fallback: "#F19027"
            },
            "#FFC0CB": {
                name: i18n("Pink"),
                baseColor: i18n("Pink"),
                value: "#FFC0CB",
                fallback: "#F389AF"
            },
            "#F08080": {
                name: i18n("Light Coral"),
                baseColor: i18n("Pink"),
                value: "#F08080",
                fallback: "#F389AF"
            },
            "#FF0000": {
                name: i18n("Red"),
                baseColor: i18n("Red"),
                value: "#FF0000",
                fallback: "#F04E37"
            },
            "#DC143C": {
                name: i18n("Crimson"),
                baseColor: i18n("Red"),
                value: "#DC143C",
                fallback: "#D9182D"
            },
            "#B22222": {
                name: i18n("Fire Brick"),
                baseColor: i18n("Red"),
                value: "#B22222",
                fallback: "#A91024"
            },
            "#8B0000": {
                name: i18n("Dark Red"),
                baseColor: i18n("Red"),
                value: "#8B0000",
                fallback: "#A91024"
            },
            "#FFF8DC": {
                name: i18n("Cornsilk"),
                baseColor: i18n("Yellow"),
                value: "#FFF8DC",
                fallback: "#FFE14F"
            },
            "#FFE4C4": {
                name: i18n("Bisque"),
                baseColor: i18n("Orange"),
                value: "#FFE4C4",
                fallback: "#F19027"
            },
            "#F4A460": {
                name: i18n("Sandy Brown"),
                baseColor: i18n("Orange"),
                value: "#F4A460",
                fallback: "#F19027"
            },
            "#FF4500": {
                name: i18n("Orange Red"),
                baseColor: i18n("Red"),
                value: "#F04E37",
                fallback: "#F19027"
            },
            "#D2691E": {
                name: i18n("Chocolate"),
                baseColor: i18n("Orange"),
                value: "#D2691E",
                fallback: "#DD731C"
            },
            "#8B4513": {
                name: i18n("Saddle Brown"),
                baseColor: i18n("Orange"),
                value: "#8B4513",
                fallback: "#B8461B"
            },
            "#800000": {
                name: i18n("Maroon"),
                baseColor: i18n("Red"),
                value: "#800000",
                fallback: "#A91024"
            },
            "#FFFACD": {
                name: i18n("Lemon Chiffon"),
                baseColor: i18n("Yellow"),
                value: "#FFFACD",
                fallback: "#FFE14F"
            },
            "#FFE4B5": {
                name: i18n("Moccasin"),
                baseColor: i18n("Orange"),
                value: "#FFE4B5",
                fallback: "#F19027"
            },
            "#FFA500": {
                name: i18n("Orange"),
                baseColor: i18n("Orange"),
                value: "#FFA500",
                fallback: "#F19027"
            },
            "#FF8C00": {
                name: i18n("Dark Orange"),
                baseColor: i18n("Orange"),
                value: "#FF8C00",
                fallback: "#F19027"
            },
            "#FF7F50": {
                name: i18n("Coral"),
                baseColor: i18n("Orange"),
                value: "#FF7F50",
                fallback: "#F19027"
            },
            "#A0522D": {
                name: i18n("Sienna"),
                baseColor: i18n("Orange"),
                value: "#A0522D",
                fallback: "#B8461B"
            },
            "#A52A2A": {
                name: i18n("Brown"),
                baseColor: i18n("Red"),
                value: "#A52A2A",
                fallback: "#A91024"
            },
            "#FFFFE0": {
                name: i18n("Light Yellow"),
                baseColor: i18n("Yellow"),
                value: "#FFFFE0",
                fallback: "#FFE14F"
            },
            "#F0E68C": {
                name: i18n("Khaki"),
                baseColor: i18n("Yellow"),
                value: "#F0E68C",
                fallback: "#FFE14F"
            },
            "#EEE8AA": {
                name: i18n("Pale Goldenrod"),
                baseColor: i18n("Yellow"),
                value: "#EEE8AA",
                fallback: "#FFE14F"
            },
            "#FFFF00": {
                name: i18n("Yellow"),
                baseColor: i18n("Yellow"),
                value: "#FFFF00",
                fallback: "#FFCF01"
            },
            "#FFD700": {
                name: i18n("Gold"),
                baseColor: i18n("Yellow"),
                value: "#FFD700",
                fallback: "#FFCF01"
            },
            "#808000": {
                name: i18n("Olive"),
                baseColor: i18n("Taupe"),
                value: "#808000",
                fallback: "#838329"
            },
            "#556B2F": {
                name: i18n("Dark Olive Green"),
                baseColor: i18n("Green"),
                value: "#556B2F",
                fallback: "#008A52"
            },
            "#98FB98": {
                name: i18n("Pale Green"),
                baseColor: i18n("Green"),
                value: "#98FB98",
                fallback: "#8CC63F"
            },
            "#90EE90": {
                name: i18n("Light Green"),
                baseColor: i18n("Green"),
                value: "#90EE90",
                fallback: "#8CC63F"
            },
            "#7FFF00": {
                name: i18n("Chartreuse"),
                baseColor: i18n("Green"),
                value: "#7FFF00",
                fallback: "#8CC63F"
            },
            "#32CD32": {
                name: i18n("Lime Green"),
                baseColor: i18n("Green"),
                value: "#32CD32",
                fallback: "#17AF4A"
            },
            "#228B22": {
                name: i18n("Forest Green"),
                baseColor: i18n("Green"),
                value: "#228B22",
                fallback: "#008A52"
            },
            "#008000": {
                name: i18n("Green"),
                baseColor: i18n("Green"),
                value: "#008000",
                fallback: "#008A52"
            },
            "#006400": {
                name: i18n("Dark Green"),
                baseColor: i18n("Green"),
                value: "#006400",
                fallback: "#008A52"
            },
            "#AFEEEE": {
                name: i18n("Pale Turquoise"),
                baseColor: i18n("Blue"),
                value: "#AFEEEE",
                fallback: "#82D1F5"
            },
            "#20B2AA": {
                name: i18n("Light Sea Green"),
                baseColor: i18n("Teal"),
                value: "#20B2AA",
                fallback: "#00A6A0"
            },
            "#48D1CC": {
                name: i18n("Medium Turquoise"),
                baseColor: i18n("Teal"),
                value: "#48D1CC",
                fallback: "#00A6A0"
            },
            "#8FBC8F": {
                name: i18n("Sea Green"),
                baseColor: i18n("Green"),
                value: "#8FBC8F",
                fallback: "#8CC63F"
            },
            "#2E8B57": {
                name: i18n("Dark Sea Green"),
                baseColor: i18n("Green"),
                value: "#2E8B57",
                fallback: "#008A52"
            },
            "#008B8B": {
                name: i18n("Dark Cyan"),
                baseColor: i18n("Teal"),
                value: "#008B8B",
                fallback: "#007670"
            },
            "#191970": {
                name: i18n("Midnight Blue"),
                baseColor: i18n("Blue"),
                value: "#191970",
                fallback: "#3B0256"
            },
            "#E0FFFF": {
                name: i18n("Light Cyan"),
                baseColor: i18n("Blue"),
                value: "#E0FFFF",
                fallback: "#82D1F5"
            },
            "#87CEFA": {
                name: i18n("Light Sky Blue"),
                baseColor: i18n("Blue"),
                value: "#87CEFA",
                fallback: "#82D1F5"
            },
            "#87CEEB": {
                name: i18n("Sky Blue"),
                baseColor: i18n("Blue"),
                value: "#87CEEB",
                fallback: "#82D1F5"
            },
            "#4169E1": {
                name: i18n("Royal Blue"),
                baseColor: i18n("Blue"),
                value: "#4169E1",
                fallback: "#00648D"
            },
            "#0000FF": {
                name: i18n("Blue"),
                baseColor: i18n("Blue"),
                value: "#0000FF",
                fallback: "#00B2EF"
            },
            "#0000CD": {
                name: i18n("Medium Blue"),
                baseColor: i18n("Blue"),
                value: "#0000CD",
                fallback: "#00648D"
            },
            "#000080": {
                name: i18n("Navy"),
                baseColor: i18n("Blue"),
                value: "#000080",
                fallback: "#003F69"
            },
            "#E6E6FA": {
                name: i18n("Lavender"),
                baseColor: i18n("Purple"),
                value: "#E6E6FA",
                fallback: "#AB1A86"
            },
            "#6495ED": {
                name: i18n("Cornflower Blue"),
                baseColor: i18n("Blue"),
                value: "#6495ED",
                fallback: "#008ABF"
            },
            "#7B68EE": {
                name: i18n("Medium Slate Blue"),
                baseColor: i18n("Blue"),
                value: "#7B68EE",
                fallback: "#008ABF"
            },
            "#6A5ACD": {
                name: i18n("Slate Blue"),
                baseColor: i18n("Blue"),
                value: "#6A5ACD",
                fallback: "#00648D"
            },
            "#8A2BE2": {
                name: i18n("Blue Violet"),
                baseColor: i18n("Purple"),
                value: "#8A2BE2",
                fallback: "#AB1A86"
            },
            "#483D8B": {
                name: i18n("Dark Slate Blue"),
                baseColor: i18n("Purple"),
                value: "#483D8B",
                fallback: "#3B0256"
            },
            "#4B0082": {
                name: i18n("Indigo"),
                baseColor: i18n("Purple"),
                value: "#4B0082",
                fallback: "#3B0256"
            },
            "#DDA0DD": {
                name: i18n("Plum"),
                baseColor: i18n("Purple"),
                value: "#DDA0DD",
                fallback: "#F389AF"
            },
            "#EE82EE": {
                name: i18n("Violet"),
                baseColor: i18n("Purple"),
                value: "#EE82EE",
                fallback: "#F389AF"
            },
            "#DA70D6": {
                name: i18n("Orchid"),
                baseColor: i18n("Purple"),
                value: "#DA70D6",
                fallback: "#AB1A86"
            },
            "#BA55D3": {
                name: i18n("Medium Orchid"),
                baseColor: i18n("Purple"),
                value: "#BA55D3",
                fallback: "#AB1A86"
            },
            "#9932CC": {
                name: i18n("Dark Orchid"),
                baseColor: i18n("Purple"),
                value: "#9932CC",
                fallback: "#AB1A86"
            },
            "#8B008B": {
                name: i18n("Dark Magenta"),
                baseColor: i18n("Purple"),
                value: "#8B008B",
                fallback: "#7F1C7D"
            },
            "#800080": {
                name: i18n("Purple"),
                baseColor: i18n("Purple"),
                value: "#800080",
                fallback: "#7F1C7D"
            },
            "#B3D66D": {
                name: i18n("Yellow Green"),
                baseColor: i18n("Green"),
                value: "#B3D66D",
                fallback: "#8CC63F"
            },
            "default": {
                name: i18n("Cerulean"),
                baseColor: i18n("Blue"),
                fallback: "#00B2EF"
            }
        },

        /**
         * Returns information of a given color, such as name and base color from a color in dijit/ColorPalette.
         * @param {HEX String} color: The value of the color
         * @return {HEX String} Information about the given color.
         */
        getDojoColor: function(color){
            return this.dojoColors[color.toUpperCase()] || this.dojoColors["default"];
        },

        /**
         * Converts a color from dijit/ColorPalette to a color in the IBM Design Language.
         * @param {HEX String} color: The value of the color
         * @return {HEX String} The IBM design language equivalent color.
         */
        dojoToIBM: function(color){
            color = this.dojoColors[color.toUpperCase()];
            if (!color){
                color = this.dojoColors["default"];
            }
            color = color.fallback;
            return color;
        },

        /**
         * @param color: Color defined from the dojo color picker
         * @return base color name on hue (red, orange, yellow, green, blue, purple, or black)
         */
        getBasicColorName: function(color){
            return this.getColor(color).baseColor.toLowerCase();

        },

        isDark: function(color) {
            var rgbColor = new DojoColor(color).toRgb();
            var colorWeight = 1 - (0.25 * rgbColor[0] + 0.6 * rgbColor[1] + 0.1 * rgbColor[2]) / 255;
            return colorWeight > 0.5;
        }
    };
});

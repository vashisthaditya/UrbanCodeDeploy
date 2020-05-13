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
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/dom-style"
        ],
function(array,
        domConstruct,
        domClass,
        domStyle) {
    return {

        /**
         * @param color: Color defined from the dojo color picker
         * @return base color name on hue (red, orange, yellow, green, blue, purple, or black)
         */
        getBasicColorName: function(color){
            var colorClass = "";
            color = color.toUpperCase();
            switch(color){
                case "#FFF5EE":
                case "#FFC0CB":
                case "#F08080":
                case "#FF0000":
                case "#DC143C":
                case "#B22222":
                case "#8B0000":
                case "#A52A2A":
                    colorClass = "red";
                    break;
                case "#FFF8DC":
                case "#FFE4C4":
                case "#F4A460":
                case "#FF4500":
                case "#D2691E":
                case "#8B4513":
                case "#FFE4B5":
                case "#FFA500":
                case "#FF8C00":
                case "#FF7F50":
                case "#A0522D":
                    colorClass = "orange";
                    break;
                case "#FFFACD":
                case "#FFFFE0":
                case "#F0E68C":
                case "#EEE8AA":
                case "#FFFF00":
                case "#FFD700":
                case "#808000":
                    colorClass = "yellow";
                    break;
                case "#556B2F":
                case "#98FB98":
                case "#90EE90":
                case "#7FFF00":
                case "#32CD32":
                case "#228B22":
                case "#008000":
                case "#006400":
                case "#8FBC8F":
                case "#2E8B57":
                    colorClass = "green";
                    break;
                case "#AFEEEE":
                case "#20B2AA":
                case "#48D1CC":
                case "#008B8B":
                case "#191970":
                case "#E0FFFF":
                case "#87CEFA":
                case "#87CEEB":
                case "#4169E1":
                case "#0000FF":
                case "#0000CD":
                case "#000080":
                case "#E6E6FA":
                case "#6495ED":
                case "#7B68EE":
                case "#6A5ACD":
                case "#483D8B":
                    colorClass = "blue";
                    break;
                case "#8A2BE2":
                case "#4B0082":
                case "#DDA0DD":
                case "#EE82EE":
                case "#DA70D6":
                case "#BA55D3":
                case "#9932CC":
                case "#8B008B":
                case "#800080":
                    colorClass = "purple";
                    break;
                case "#FFFFFF":
                case "#D3D3D3":
                case "#C0C0C0":
                case "#808080":
                case "#696969":
                case "#2F4F4F":
                case "#000000":
                    colorClass = "black";
                    break;
                default:
                    colorClass = "black";
                    break;
            }
            return colorClass;
        }

    };
});

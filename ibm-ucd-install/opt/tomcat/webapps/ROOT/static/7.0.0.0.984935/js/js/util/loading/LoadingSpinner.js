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
         "dojo/dom-style"
         ],
function(
         declare,
         _WidgetBase,
         _TemplatedMixin,
         domConstruct,
         domClass,
         domStyle){
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString:
            '<span class="webext-spinner">'+
                '<div class="" data-dojo-attach-point="spinnerAttach"></div>'+
            '</span>',

        color: "black", // Options: white, blue, darkblue, black. (Default: black)

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            this.changeColor(this.color);
            this.hide();
        },

        /**
         * Rotates the spinner
         * @param {Boolean} stop: Stop animation
         */
        spin: function(stop){
            var self = this;
            if (!this.intervalId){
                var i = 0;
                this.intervalId = setInterval(function(){
                    if (self.spinnerAttach){
                        domStyle.set(self.spinnerAttach, "-webkit-transform", "rotate(" + i + "deg)");
                        domStyle.set(self.spinnerAttach, "mozTransform", "rotate(" + i + "deg)");
                        domStyle.set(self.spinnerAttach, "-moz-transform", "rotate(" + i + "deg)");
                        domStyle.set(self.spinnerAttach, "-ms-transform", "rotate(" + i + "deg)");
                        domStyle.set(self.spinnerAttach, "-o-transform", "rotate(" + i + "deg)");
                        domStyle.set(self.spinnerAttach, "transform", "rotate(" + i + "deg)");
                        }
                    if (i === 360){
                        i = 0;
                    }
                    i += 4;
                }, 10);
            }
            if (stop && this.intervalId){
                setTimeout(function(){
                    clearInterval(self.intervalId);
                    if (self.spinnerAttach){
                        domStyle.set(self.spinnerAttach, "-webkit-transform", "rotate(0deg)");
                        domStyle.set(self.spinnerAttach, "mozTransform", "rotate(0deg)");
                        domStyle.set(self.spinnerAttach, "-moz-transform", "rotate(0deg)");
                        domStyle.set(self.spinnerAttach, "-ms-transform", "rotate(0deg)");
                        domStyle.set(self.spinnerAttach, "-o-transform", "rotate(0deg)");
                        domStyle.set(self.spinnerAttach, "transform", "rotate(0deg)");
                    }
                    delete self.intervalId;
                }, 250);
            }
        },

        /**
         * Show the spinner
         */
        show: function(){
            this.spin();
            if (domClass.contains(this.domNode, "hide-spinner")){
                domClass.remove(this.domNode, "hide-spinner");
            }
            domClass.add(this.domNode, "show-spinner");
        },

        /**
         * Hide the spinner
         */
        hide: function(){
            if (domClass.contains(this.domNode, "show-spinner")){
                domClass.remove(this.domNode, "show-spinner");
            }
            domClass.add(this.domNode, "hide-spinner");
            this.spin(true);
        },

        /**
         * Change the spinner color.
         * @param {String} color
         */
        changeColor: function(color){
            color = color.toLowerCase();
            switch (color){
                case "white":
                    break;
                case "blue":
                    break;
                case "darkblue":
                    break;
                default:
                    color = "black";
            }
            if (domClass.contains(this.spinnerAttach, this.color + "-spinner")){
                domClass.remove(this.spinnerAttach, this.color + "-spinner");
            }
            domClass.add(this.spinnerAttach, color + "-spinner");
        }

    });
});
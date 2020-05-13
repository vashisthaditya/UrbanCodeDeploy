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
define(["dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/array",
        "dijit/_Widget",
        "dijit/_TemplatedMixin",
        "dojo/on",
        "dojo/mouse",
        "dojo/dom-geometry",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/dom-style",
        "dojo/has",
        "dijit/place"], 
        function (declare, array, lang, _Widget, _TemplatedMixin, on, mouse, geo, domClass, domConstruct, domStyle, has, place) {
        /**
         * 
         */
        return declare("deploy.widgets.Popup",
                [_Widget, _TemplatedMixin], {

            /**
             * Popup widget from uRelease.
             */
            templateString: 
                '<div class="mouse-over-popup hidden">' +
                    '<div class="popup-pointer" data-dojo-attach-point="pointerAttach"></div>' +
                    '<div class="popup-container" data-dojo-attach-point="popupAttach">' +
                        '<div class="popup-contents" data-dojo-attach-point="containerAttach"></div>' +
                    '</div>' +
                '</div>',

            //The domNode to attach the popup to.
            attachPoint: undefined,
            //The domNode to hover over to show popup. Leave null to use attachPoint.
            hoverPoint: undefined,
            clickPoint: null,
            // DomNode where mose pointer should be located to hide popup
            hoverPointExit: null,
            //A dom element of the contents of the popup.
            contents: null,
            
            align: "center",
            popupShow: mouse.enter,
            popupHide: mouse.leave,
            textAlign: "center",

            /**
             * 
             */
            postCreate: function() {
                this.inherited(arguments);
                var _this = this;
                if (this.contents){
                    domConstruct.place(_this.contents, _this.containerAttach);
                }
                if (!this.autoWidth){
                    domClass.add(this.popupAttach, "fixed-popup-width");
                }
                domStyle.set(this.popupAttach, "textAlign", this.textAlign);
                if (this.attachPoint){
                    domConstruct.place(this.domNode, this.attachPoint);
                    if (this.popupShow){
                        var hoverPoint = this.hoverPoint || this.attachPoint;
                        this.showPopup = on(hoverPoint, this.popupShow, function(){
                            _this._remarginAttachPoints();
                            _this.show();
                        });
                    }
                    if (this.popupHide){
                        var popupExit = this.hoverPointExit || this.hoverPoint || this.attachPoint;
                        on(popupExit, this.popupHide, function(){
                            _this.hide();
                        });
                    }
                }
            },

            //Move the popup pointer by a left margin.
            movePointer: function(marginLeft){
                this._setElementLeftMargin(this.pointerAttach, marginLeft);
            },

            //Move the popup by a left margin.
            movePopup: function(marginLeft){
                this._setElementLeftMargin(this.popupAttach, marginLeft);
            },

            show: function(){
                this.popupHide = false;
                domClass.remove(this.domNode, "hidden");
                domClass.add(this.domNode, "popup-show");
                var popupWidth = geo.position(this.domNode).w || null;
                
                if (popupWidth) {
                    //x - 2y - 2x
                    popupWidth = popupWidth - this.popupAttach.value;
                    if (popupWidth) {
                        this.movePopup(this.popupAttach.value - (popupWidth/2));
                    }
                }
                this.postShow();
            },
            
            /**
             * Additional function to call after showing popup
             */
            postShow: function(){
                // No opt by default
            },
            
            /**
             * Method to call to show pointer on a unspecified hover point.
             */
            externalShow: function(){
                this._remarginAttachPoints();
                this.show();
            },

            hide: function(){
                this.popupHide = true;
                domClass.remove(this.domNode, "popup-show");
                domClass.add(this.domNode, "hidden");
                this.postHide();
            },
            
            /**
             * Additional function to call after hiding popup
             */
            postHide: function(){
                // No opt by default
            },
            
            destroy: function(){
                domConstruct.destroy(this.domNode);
                this.showPopup = null;
            },

            _remarginAttachPoints: function() {
                var attachPointWidth = geo.position(this.attachPoint).w || null;
                if (attachPointWidth){
                    var marginLeftValue = attachPointWidth / 2;
                    this.popupAttach.value = marginLeftValue;
                    this.movePopup(marginLeftValue);
                    this.movePointer(marginLeftValue - 20);
                }
            },

            _setElementLeftMargin: function(element, marginLeft) {
                if (has("mozilla") || has("ff")){
                    element.style.marginLeft = marginLeft + "px";
                } else {
                    domStyle.set(element, "margin-left", marginLeft + "px");
                }
            }
        }
    );
});

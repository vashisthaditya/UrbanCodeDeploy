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
/*global define, MutationObserver */
define([
         "dojo/_base/declare",
         "dojo/dom-class",
         "dojo/dom-geometry",
         "dojo/dom-style",
         "dojo/_base/fx",
         "dojo/_base/lang",
         "dojo/dom-construct"],
function(
         declare,
         domClass,
         domGeom,
         domStyle,
         fx,
         lang,
         domConstruct){

/**
 * Requires _BlockerMixin.css
 *
 * A mixin to add block and unblock methods to any widget.
 * When blocked the widget has a gray animated spinner overlay
 * covering the widget
 */
return declare(null, {

    _changeListener: null, // for browsers which do not suppoprt MutationObserver api
    _observer: null,

    /**
     * Initialize the blocker element if not present
     */
    initBlocker: function (){
        var self = this;

        // fix the domNode positioning for blocker element to position against
        self.fixDomPositionStyle();

        // create the blocker element
        if (!self.blockerElement){
            self.blockerElement = domConstruct.create("div", {"class":"_blocker_mask"}, self.domNode, "first");

            if (window.hasOwnProperty('MutationObserver')) {
                self._observer = new MutationObserver(function (mutations, observer) {
                    mutations.forEach(function(mutation) {
                        self._updateBlocker();
                    });
                });
            }
            else {
                // use older api for modification events
                self._changeListener = lang.hitch(self, self._updateBlocker);
            }
        }
    },

    /**
     * When dom node is not yet in document, the css position attribute can not be determined,
     * we need to fix this after the fact if executed at this point.
     *
     * This method will garuntee that the widget domNode will have a position value other than "static".
     */
    fixDomPositionStyle: function() {
        var self = this;

        var position = domStyle.get(self.domNode, "position");
        if (!position) {
            // not in document yet, keep polling for when we can read position attribute
            // TODO use dojox.timing.Timer?
            if (!self.blockerTimer) {
                self.blockerTimer = window.setInterval(function (){ self.fixDomPositionStyle(); }, 50);
            }
        }
        else {
            window.clearInterval(self.blockerTimer);
            self.blockerTimer = null;
            if (position === "static") {
                domStyle.set(self.domNode, "position", "relative");
            }
        }
    },

    /**
     * Block the widget with a gray spinner overlay.
     */
    block: function (){
        var self = this;
        var duration = 400;
        var op = 0.6;

        // create blockerElement if not already present
        self.initBlocker();

        if (!!self._observer) {
            var config = {
                    //attributeFilter: null,
                    //attributes: false,
                    //attributeOldValue: false,
                    //characterData: true,
                    //characterDataOldValue: false,
                    childList: true,
                    subtree: true
                    };
            self._observer.observe(self.domNode, config);
        }
        else {
            self.domNode.addEventListener("DOMSubtreeModified", self._changeListener);
        }

        domStyle.set(self.blockerElement, "display", "block");
        self._updateBlocker();

        fx.fadeIn({
                "node": self.blockerElement,
                "duration": duration,
                "end": op
        }).play();
    },

    /**
     * Unblock the widget hiding the spinner overlay.
     */
    unblock: function (){
        var self = this;
        var duration = 400;
        //var op = 0.6;

        if (self.blockerElement && !self._beingDestroyed) {
            fx.fadeOut({
                "node": self.blockerElement,
                "duration": duration,
                "onEnd": lang.hitch(self, function (){
                    domStyle.set(self.blockerElement, "display", "none");
                    if (!!self._observer) {
                        self._observer.disconnect();
                    }
                    if (!!self._changeListener) {
                        self.domNode.removeEventListener("DOMSubtreeModified", self._changeListener);
                    }
                })
            }).play();
        }
    },

    /**
     * Indicates whether the widget is currently blocked.
     */
    isBlocked: function() {
        var result = false;

        if (this.blockerElement) {
            if (domStyle.get(this.blockerElement, "display") === "block") {
                result = true;
            }
        }

        return result;
    },

    _updateBlocker: function(event) {
            // if target node is small for our image, add additional styling to improve
            var self = this;

            var geo = domGeom.position(self.domNode);
            var isSmall = geo.w < 150 || geo.h < 150;
            domClass.toggle(self.blockerElement, '_blocker_mask_small', isSmall);

            var isTall = geo.h > 300;
            domClass.toggle(self.blockerElement, '_blocker_mask_tall', isTall);
    },

    /**
     * Cleanup any timers/pending operations
     */
    destroy: function (){
        var self = this;
        // clean up timer if present
        if (self.blockerTimer) {
            window.clearInterval(self.blockerTimer);
            self.blockerTimer = null;
        }
        if (self.blockerElement) {
            domConstruct.destroy(self.blockerElement);
        }

        if (!!self._observer) {
            self._observer.disconnect();
            self._observer = null;
        }
        if (!!self._changeListener) {
            if (!!self.domNode) {
                self.domNode.removeEventListener("DOMSubtreeModified", self._changeListener);
            }
       }

        self.inherited(arguments);
    }
}); // declare

}); // define

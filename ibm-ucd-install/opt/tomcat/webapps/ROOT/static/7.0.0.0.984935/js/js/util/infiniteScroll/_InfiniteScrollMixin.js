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
        "dojo/_base/window",
        "dojo/on",
        "dojo/mouse",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/dom-style",
        "dojo/dom-attr",
        "dojo/dom-geometry"
        ],
function(
        declare,
        win,
        on,
        mouse,
        domConstruct,
        domClass,
        domStyle,
        domAttr,
        domGeom
) {
    /**
     * This mixin provides functionality to fire an event when an element is scrolled to the bottom
     * of a given node.
     *
     * scrollNode (node)                Reference to the node that is being scrolled.
     *
     * scrollContainer (node)           Reference to the node that contains the scrollNode.
     *
     * bottomOffset (Integer)           The number of pixels from the bottom of the scrollContainer
     *                                  to fire the onScrollBottom event.
     */
    return declare(null,
        {
            scrollNode: null,
            scrollContainer: null,
            bottomOffset: 50,

            //-------------------------------------------------------------------------------
            // Functions to be overridden
            //-------------------------------------------------------------------------------
            /**
             * An event to fire when element is scrolled to bottom. Must run callback() last to reset
             * scroll function.
             */
            onScrollBottom: function(callback) {

                // Example. Callback will run after loading more items.
                setTimeout(function(){
                    callback();
                }, 1000);

            },


            //-------------------------------------------------------------------------------
            // Public functions
            //-------------------------------------------------------------------------------
            /**
             * Creates the event when the element is scrolled to the bottom.
             */
            setupScroll: function(options) {
                var self = this;
                if (options.scrollNode){
                    this.scrollNode = options.scrollNode;
                }
                if (options.scrollContainer){
                    this.scrollContainer = options.scrollNode;
                }
                if (options.bottomOffset){
                    this.bottomOffset = options.bottomOffset;
                }
                this.addScrollListener();
            },

            /**
             * Fires event when given scrollNode is scrolled to the bottom.
             */
            addScrollListener: function(){
                var self = this;
                this.notLoadingMore = true;
                this._determineScrollContainer();
                if (this.scrollContainer && this.scrollNode){
                    this.onscroll = on(this.scrollContainer, "scroll", function(evt){
                        var containerPosition = domGeom.position(self.scrollContainerNode);
                        var contH = self._windowHeight || containerPosition.h;

                        var panelPosition = domGeom.position(self.scrollNode);
                        // If page is switched, scollNode doesn't exist, only a reference, so check
                        // if w,h,x and y are 0 then remove event.
                        if (panelPosition.h === 0 && panelPosition.w === 0 && panelPosition.x === 0 && panelPosition.y === 0){
                            self.onscroll.remove();
                        }
                        else {
                            var panelOffset = panelPosition.h + panelPosition.y;
                            if (panelOffset < contH + self.bottomOffset && self.notLoadingMore){
                                self.notLoadingMore = false;
                                self.onScrollBottom(function(){
                                    setTimeout(function(){
                                        self.notLoadingMore = true;
                                    }, 500);
                                });
                            }
                        }
                    });
                }
                else {
                    console.warn("No node defined for infinite scroll");
                }
            },

            /**
             * Adds a listener event to a node when it hits the top of the screen;
             * @param {Node} domNode: The node to listen to.
             * @param {function} onTopCallback: function to run when node hits the top.
             * @param {function} onOutTopCallback: function to run when node is no longer on the top.
             * @param {integer} topOffset: Number of pixels from the top of the screen. Default: 0
             */
            onHitTop: function(domNode, onTopCallback, onOutTopCallback, topOffset){
                if (domNode && onTopCallback){
                    if (!topOffset){
                        topOffset = 0;
                    }
                    this.own(on(window, "scroll", function(evt){
                        var containerPosition = domGeom.position(domNode);
                        if (containerPosition && containerPosition.y < topOffset){
                            onTopCallback();
                        }
                        else if (onOutTopCallback) {
                            onOutTopCallback();
                        }
                    }));
                }
            },

            //-------------------------------------------------------------------------------
            // Functions for internal usage only
            //-------------------------------------------------------------------------------

            _determineScrollContainer: function(){
                if (!this.scrollContainer) {
                    this.scrollContainer = window;
                    this.scrollContainerNode = win.body();
                    if (window && window.innerHeight){
                        this._windowHeight = window.innerHeight;
                    }
                    else if (document && document.documentElement){
                        this._windowHeight = document.documentElement.clientHeight;
                    }
                }
                else {
                    this.scrollContainerNode = this.scrollContainer;
                }
                if (!this.scrollNode){
                    this.scrollNode = this.domNode;
                }
            }
        }
    );
});

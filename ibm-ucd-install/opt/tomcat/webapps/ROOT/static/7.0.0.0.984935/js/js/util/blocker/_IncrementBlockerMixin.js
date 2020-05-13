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
         "dojo/dom-style",
         "dojo/_base/fx",
         "dojo/_base/lang",
         "dojo/dom-construct",
         "js/util/blocker/_BlockerMixin"],
function(
         declare,
         domStyle,
         fx,
         lang,
         domConstruct,
         _BlockerMixin) {
/**
 * Requires _BlockerMixin.css
 *
 * A incremental counting mixin to add block and unblock methods to any widget.
 * When blocked the widget has a gray animated spinner overlay covering the widget.
 *
 * It automatically increments an internal counter to keep track of
 * how many times blockDecrement() needs to be called to remove the
 * spinner overlay.
 *
 * To use:
 * - When you want to block, call self.blockIncrement();
 * - When you want to unblock, call self.blockDecrement();
 *
 * - If you are inside of a REST call response, you can create the following to ensure decrement
 *   gets called properly.
 *
 *   self.blockIncrement();
 *      xhr.get({
 *          url: restUrl,
 *          handleAs: "json",
 *          load: function(data) {
 *             Do Work Here
 *          },
 *          error: function(error) {
 *             Do Error Work Here
 *          },
 *          handle: function(data) {
 *             self.blockDecrement();
 *          }
 *
 *   NOTE: The 'handle()' function gets called AFTER load or error gets called. It is almost like
 *         a finally block.
 */
return declare([_BlockerMixin], {

    /**
     * Initializes the incremental blocker.
     */
    constructor : function() {
        this.blockCounter = 0;
    },

    /**
     * Blocks the widget with a gray spinner overlay. This will increment an internal counter
     * that when calling unblockDecrement(), it will not unblock until the counter reaches zero.
     */
    blockIncrement: function() {
        if (this.blockCounter === 0) {
            this.block();
        }
        this.blockCounter = this.blockCounter + 1;
    },

    /**
     * This will decrement the internal counter. When the counter reaches zero, it will unblock the
     * element.
     */
    blockDecrement: function() {
        this.blockCounter = this.blockCounter - 1;
        // This is just in case someone called decrement one too many times.
        if (this.blockCounter < 0) {
            this.blockCounter = 0;
        }
        if (this.blockCounter === 0) {
            this.unblock();
        }
    }
});
});
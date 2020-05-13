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
        "dojo/_base/lang",
        "dojo/_base/array",
        "dojo/aspect",
        "dijit/Dialog",
        "dijit/Tooltip",
        "dojo/window",
        "dojo/dom-geometry",
        "dojo/dom-style",
        "dojo/_base/kernel"
        ],
function(
        declare,
        lang,
        array,
        aspect,
        Dialog,
        Tooltip,
        win,
        domGeometry,
        domStyle,
        kernel
) {

    /**
     * A local extension of js.webext.widgets.Dialog which suppresses the draggable DOM attribute.
     *
     * extraClasses -> an array of extra class names to add to the main div
     * Also supports manually dealing with dialog size. The following attributes may be supplied:
     *  height / Integer            Height, in pixels.
     *                              Negative value means <window height>-value
     *  width / Integer             Width, in pixels.
     *                              Negative value means <window width>-value
     *
     *                              - or -
     *
     *  heightPercent / Integer     Percent of window to use for height
     *  widthPercent / Integer      Percent of window to use for width
     *
     */
    return declare(
        'js.webext.widgets.Dialog',
        [Dialog],
        {
            templateString:
                '<div data-dojo-attach-point="mainAttach" class="dijitDialog" role="dialog" aria-labelledby="${id}_title">'+
                '    <div data-dojo-attach-point="titleBar" class="dijitDialogTitleBar">'+
                '    <span data-dojo-attach-point="titleNode" class="dijitDialogTitle" id="${id}_title"></span>'+
                '    <span data-dojo-attach-point="closeButtonNode" class="dijitDialogCloseIcon" data-dojo-attach-event="ondijitclick: onCancel" title="${buttonCancel}" role="button" tabIndex="-1" style="display:inline;">'+
                '        <span data-dojo-attach-point="closeText" class="icon-Icon_close__ui-05" title="${buttonCancel}"></span>'+
                '    </span>'+
                '    </div>'+
                '    <div data-dojo-attach-point="containerContainer"><div data-dojo-attach-point="containerNode" class="dijitDialogPaneContent"></div></div>'+
                '</div>',

            // State for hide and destroy below
            _destroying: false,
            _hideDeferred: null,
            destroyOnHide: false,
            maxRatio: 0.95,

            postCreate: function() {
                var  s = this;
                this.inherited(arguments);

                var dimensions = win.getBox();
                // We don't handle the dialog header height algorithmicly, so
                // we toss in an arbitrary spacing using maxHeight;
                var maxHeight = dimensions.h-100;
                this.containerContainer.style.maxHeight = maxHeight+"px";

                if (this.destroyOnHide) {
                    aspect.after(this, "onHide", lang.hitch(this, 'destroy'));
                }
                if (this.description) {
                    var helpCell = document.createElement("div");
                    helpCell.className = "labelsAndValues-helpCell inlineBlock";

                    var helpTip = new Tooltip({
                        connectId: [helpCell],
                        label: this.description,
                        showDelay: 100,
                        position: ["after", "above", "below", "before"]
                    });
                    this.titleBar.appendChild(helpCell);
                }
                if (!!this.extraClasses) {
                    array.forEach(this.extraClasses, function(className) {
                        s.mainAttach.className = s.mainAttach.className + " " + className;
                    });
                }
            },

            show: function() {
                this.domNode.draggable = false;
                this.inherited(arguments);
                this._hideDeferred = null;

                // This will automatically reposition the dialog after various intervals to make
                // sure that it appears in the center of the screen. We wait a bit potentially to
                // allow content for the dialog to load before repositioning it.
                var self = this;
                var reposition = function() {
                    if (self.open) {
                        self._size();
                        self._position();
                    }
                };
                setTimeout(function() {
                    reposition();
                }, 25);
                setTimeout(function() {
                    reposition();
                }, 50);
                setTimeout(function() {
                    reposition();
                }, 100);
                setTimeout(function() {
                    reposition();
                }, 200);
                setTimeout(function() {
                    reposition();
                }, 400);
                setTimeout(function() {
                    reposition();
                }, 800);
                setTimeout(function() {
                    reposition();
                }, 1200);
            },

            /*
             * hide() and destroy() are overridden to ensure both are called
             * in the correct order and with the correct timing. If this
             * is not done properly, IE8 may throw an exception. The
             * specific requirement is that destroy() must be preceeded by
             * hide(), but destroy() must wait for the animation
             * initiated by hide() to complete first.
             */

            hide: function() {
                var deferred = this._hideDeferred;
                if (!deferred) {
                    deferred = this._hideDeferred = this.inherited(arguments);
                }
                return deferred;
            },

            destroy: function() {
                var self = this;
                var deferred;
                var args;
                var superDestroy;

                if (!self._destroying) {
                    self._destroying = true;

                    deferred = self._hideDeferred;
                    args = arguments;
                    superDestroy = self.getInherited(arguments);

                    if (!deferred) {
                        deferred = self.hide();
                    }

                    var fin = function() {
                        superDestroy.apply(self, args);
                        self._destroying = false;
                        self._hideDeferred = null;
                    };
                    if (deferred) {
                        // wait for hiding animation to complete
                        deferred.then(fin);
                    }
                    else {
                        // no hiding animation just do it now
                        fin();
                    }
                }
            },

            _size: function() {
              // Capture the current scroll position so we can reset it afterwards
              var scrollPosition = this.containerNode.scrollTop;
              if (this.height || this.width || (this.heightPercent && this.widthPercent)) {
                this._sizeFixed();
              }
              else {
                this._sizeDynamic();
              }
              this.containerNode.scrollTop = scrollPosition;
            },

            _sizeFixed: function() {
              if (lang.isString(this.height) || lang.isString(this.width)) {
                  kernel.deprecated("String values for this.height or this.width is deprecated, and may not be supported in the future. Use integer values.");
              }
              // the height and width should be a number or a string without 'px'.
              // parseInt returns the first "number" in a string. e.g. "300px" will be parsed as 300.
              // there is no need to check that this.height or this.width exist, since parseInt will
              // return NaN for anything that cannot be parsed as a number, and the method will fail
              // below anyway.
              this.height = parseInt(this.height, 10);
              this.width = parseInt(this.width, 10);

              var dimensions = win.getBox();

              var height = this.height;
              var width = this.width;

              if (this.heightPercent) {
                  height = dimensions.h * this.heightPercent/100;
              }
              else if (this.height < 0) {
                  height = dimensions.h+this.height;
              }

              if (this.widthPercent) {
                  width = dimensions.w * this.widthPercent/100;
              }
              else if (this.width < 0) {
                  width = dimensions.w+this.width;
              }

              var style = {
                      overflow: "auto",
                      position: "relative",
                      maxHeight: this.containerContainer.style.maxHeight
              };
              if (width) {
                  style.width = width +"px";
              }
              if (height) {
                  style.height = height + "px";
              }

              domStyle.set(this.containerNode, style);
            },

            _sizeDynamic: function() {
              // Taken directly from dijit/Dialog to fix resizing issues.
              // See Fork Note below

              this._checkIfSingleChild();

              // If we resized the dialog contents earlier, reset them back to original size, so
              // that if the user later increases the viewport size, the dialog can display w/out a scrollbar.
              // Need to do this before the domGeometry.position(this.domNode) call below.
              if(this._singleChild){
                if(this._singleChildOriginalStyle === undefined){
                  this._singleChild.domNode.style.cssText = this._singleChildOriginalStyle;
                  delete this._singleChildOriginalStyle;
                }
              }else{
                domStyle.set(this.containerNode, {
                  width:"auto",
                  height:"auto"
                });
              }

              var bb = domGeometry.position(this.domNode);

              // Get viewport size but then reduce it by a bit; Dialog should always have some space around it
              // to indicate that it's a popup.  This will also compensate for possible scrollbars on viewport.
              var viewport = win.getBox(this.ownerDocument);
              viewport.w *= this.maxRatio;
              viewport.h *= this.maxRatio;

              if(bb.w >= viewport.w || bb.h >= viewport.h){
                // Reduce size of dialog contents so that dialog fits in viewport

                var containerSize = domGeometry.position(this.containerNode),
                  w = Math.min(bb.w, viewport.w) - (bb.w - containerSize.w),
                  h = Math.min(bb.h, viewport.h) - (bb.h - containerSize.h);

                // Fork Note: viewport size is the max size.  Also keep room
                // for the part of the dialog above the containers.
                var dialogHeaderHeight = containerSize.y - bb.y;
                var maxHeight = viewport.h - dialogHeaderHeight;
                w = Math.min(viewport.w, w);
                h = Math.min(maxHeight, h);

                if(this._singleChild && this._singleChild.resize){
                  if(this._singleChildOriginalStyle === undefined){
                    this._singleChildOriginalStyle = this._singleChild.domNode.style.cssText;
                  }
                  this._singleChild.resize({w: w, h: h});
                }else{
                  domStyle.set(this.containerNode, {
                    width: w + "px",
                    height: h + "px",
                    overflow: "auto",
                    position: "relative"	// workaround IE bug moving scrollbar or dragging dialog
                  });
                }
              }else{
                if(this._singleChild && this._singleChild.resize){
                  this._singleChild.resize();
                }
              }
            }
        }
    );
});

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
define([
    "dojo/_base/declare", // declare
    "dojo/keys",
    "dojo/_base/event",
    "dojo/dom-style",
    "dojo/dom-attr",
    "dojo/dom-class",
    "dojo/window",
    "dojo/on",
    "dojo/dom-geometry",
    "dojo/_base/lang",
    "dijit/popup",
    "deploy/widgets/property/PropertyComboBox"
], function(
        declare,
        keys,
        event,
        domStyle,
        domAttr,
        domClass,
        winUtils,
        on,
        domGeometry,
        lang,
        popup,
        PropertyComboBox
){
    /**
     * PropertyTextarea inherits and behaves exactly as PropertyComboBox except that the text input
     * area displays as a free form, resizable textarea rather than a text input
     */
    return declare("dijit.form.PropertyTextarea", [PropertyComboBox], {
        // summary:
        //      Auto-completing text area

        /**
         * Override ComboBoxMixin's template string to use a textarea instead of an input
         */
        templateString: '<div class="dijit dijitReset dijitInline dijitLeft propertyTextarea" id="widget_${id}" role="combobox" aria-haspopup="true" data-dojo-attach-point="_popupStateNode">' +
                      '<div class="dijitReset dijitRight dijitButtonNode dijitArrowButton dijitDownArrowButton dijitArrowButtonContainer" data-dojo-attach-point="_buttonNode" role="presentation">' +
                          '<input class="dijitReset dijitInputField dijitArrowButtonInner" value="&#9660; " type="text" tabIndex="-1" readonly="readonly" role="button presentation" aria-hidden="true" ${_buttonInputDisabled}/>' +
                      '</div>' +
                      '<div class="dijitReset dijitValidationContainer">' +
                          '<input class="dijitReset dijitInputField dijitValidationIcon dijitValidationInner" value="&#935; " type="text" tabIndex="-1" readonly="readonly" role="presentation"/>' +
                      '</div>' +
                      '<div class="dijitReset dijitInputContainer">' +
                          '<div class="dijitReset dijitInputInner" data-dojo-attach-point="positionAttach" style="visibility:hidden;overflow-wrap:break-word;word-wrap:break-word;position:absolute;"></div>' +
                          '<textarea class="dijitReset" data-dojo-type="dijit/form/Textarea" ${!nameAttrSetting} style="width:300px;" rows="5" data-dojo-attach-point="textbox,focusNode"></textarea>' +
                      '</div>' +
                  '</div>',

        /**
         * Override _onKey behavior from _AutoCompleterMixin and _HasDropDown so as not to break
         * normal textarea functionality on enter, splace, and arrow key events
         */
        _onKey: function (/*Event*/ evt) {
            // summary:
            //      Handles keyboard events
            var self = this;


            var inputText = self.focusNode.value;
            var stoppingPoint = self._getCaretPos(self.focusNode);

            inputText = inputText.substring(0, stoppingPoint);
            inputText = inputText.replace(/\n/g, "</br>");
            self.positionAttach.innerHTML = inputText;

            // alphanumeric reserved for searching
            if (evt.charCode >= 32) {
                return;
            }

            var key = evt.charCode || evt.keyCode;

            // except for cutting/pasting case - ctrl + x/v
            if (key === keys.ALT || key === keys.CTRL || key === keys.META || key === keys.SHIFT) {
                return; // throw out spurious events
            }

            var pw = this.dropDown;
            var highlighted = null;
            this._abortQuery();

            //overriding _HasDropDown _onKey event to not toggle dropdown on down arrow,
            //enter, or space since this breaks textarea functionality
            //  1. when drop down is already displayed:
            //      - on ESC key, call closeDropDown()
            //      - otherwise, call dropDown.handleKey() to process the keystroke
            if (this.disabled || this.readOnly) {
                return;
            }
            var d = this.dropDown, target = evt.target;
            if (d && this._opened && d.handleKey) {
                if (d.handleKey(evt) === false) {
                    /* false return code means that the drop down handled the key */
                    event.stop(evt);
                    return;
                }
            }
            if (d && this._opened && evt.keyCode === keys.ESCAPE) {
                this.closeDropDown();
                event.stop(evt);
            }
            // ---- end _HasDropDown _onKey override ---

            // don't process keys with modifiers  - but we want shift+TAB
            if (evt.altKey || evt.ctrlKey || evt.metaKey) {
                return;
            }

            if (this._opened) {
                highlighted = pw.getHighlightedOption();
            }

            switch(key){
                case keys.PAGE_DOWN:
                case keys.DOWN_ARROW:
                case keys.PAGE_UP:
                case keys.UP_ARROW:
                    // Keystroke caused ComboBox_menu to move to a different item.
                    // Copy new item to <input> box.
                    if (this._opened) {
                        this._announceOption(highlighted);
                        event.stop(evt);
                    }
                    break;

                case keys.ENTER:
                    // prevent submitting form if user presses enter. Also
                    // prevent accepting the value if either Next or Previous
                    // are selected
                    if (highlighted) {
                        // only stop event on prev/next
                        if (highlighted === pw.nextButton) {
                            this._nextSearch(1);
                            event.stop(evt); // prevent submit
                            break;
                        }
                        else if (highlighted === pw.previousButton) {
                            this._nextSearch(-1);
                            event.stop(evt); // prevent submit
                            break;
                        }
                        event.stop(evt); // prevent submit if ENTER was to choose an item
                    }
                    else {
                        // Update 'value' (ex: KY) according to currently displayed text
                        this._setBlurValue(); // set value if needed
                    }
                    if (this.handleKeyTab(pw, highlighted)) {
                        this.handleKeyEscape();
                    }
                    break;

                case keys.TAB:
                    if (this.handleKeyTab(pw, highlighted)) {
                        this.handleKeyEscape();
                    }
                    break;

                case keys.ESCAPE:
                    this.handleKeyEscape();
                    break;
            }
        },

        /**
         * Does handling for tab key, or fall through for enter key
         */
        handleKeyTab: function(pw, highlighted) {
            var newvalue = this.get('displayedValue');
            //  if the user had More Choices selected fall into the
            //  _onBlur handler
            if (pw && (newvalue === pw._messages.previousMessage ||
                    newvalue === pw._messages.nextMessage)) {
                return false;
            }
            if (highlighted) {
                this._selectOption(highlighted);
            }
            return true;
        },

        /**
         * Does handling for escape key or enter & tab fall through
         */
        handleKeyEscape: function() {
            if (this._opened) {
                this._lastQuery = null; // in case results come back later
                this.closeDropDown();
            }
        },

        openDropDown: function(){
            // summary:
            //      Opens the dropdown for this widget.   To be called only when this.dropDown
            //      has been created and is ready to display (ie, it's data is loaded).
            // returns:
            //      return value of dijit/popup.open()
            // tags:
            //      protected

            var dropDown = this.dropDown,
                ddNode = dropDown.domNode,
                aroundNode = this._aroundNode || this.domNode,
                self = this;

            // Prepare our popup's height and honor maxHeight if it exists.

            // TODO: isn't maxHeight dependent on the return value from dijit/popup.open(),
            // ie, dependent on how much space is available (BK)

            if(!this._preparedNode){
                this._preparedNode = true;
                // Check if we have explicitly set width and height on the dropdown widget dom node
                if(ddNode.style.width){
                    this._explicitDDWidth = true;
                }
                if(ddNode.style.height){
                    this._explicitDDHeight = true;
                }
            }

            // Code for resizing dropdown (height limitation, or increasing width to match my width)
            if(this.maxHeight || this.forceWidth || this.autoWidth){
                var myStyle = {
                    display: "",
                    visibility: "hidden"
                };
                if(!this._explicitDDWidth){
                    myStyle.width = "";
                }
                if(!this._explicitDDHeight){
                    myStyle.height = "";
                }
                domStyle.set(ddNode, myStyle);

                // Figure out maximum height allowed (if there is a height restriction)
                var maxHeight = this.maxHeight;
                if(maxHeight === -1){
                    // limit height to space available in viewport either above or below my domNode
                    // (whichever side has more room)
                    var viewport = winUtils.getBox(this.ownerDocument),
                        position = domGeometry.position(aroundNode, false);
                    maxHeight = Math.floor(Math.max(position.y, viewport.h - (position.y + position.h)));
                }

                // Attach dropDown to DOM and make make visibility:hidden rather than display:none
                // so we call startup() and also get the size
                popup.moveOffScreen(dropDown);

                if(dropDown.startup && !dropDown._started){
                    dropDown.startup(); // this has to be done after being added to the DOM
                }
                // Get size of drop down, and determine if vertical scroll bar needed.  If no scroll bar needed,
                // use overflow:visible rather than overflow:hidden so off-by-one errors don't hide drop down border.
                var mb = domGeometry.getMarginSize(ddNode);
                var overHeight = (maxHeight && mb.h > maxHeight);
                domStyle.set(ddNode, {
                    overflowX: "visible",
                    overflowY: overHeight ? "auto" : "visible"
                });
                if(overHeight){
                    mb.h = maxHeight;
                    if(mb.hasOwnProperty("w")){
                        mb.w += 16; // room for vertical scrollbar
                    }
                }else{
                    delete mb.h;
                }

                // Adjust dropdown width to match or be larger than my width
                if(this.forceWidth){
                    mb.w = aroundNode.offsetWidth;
                }else if(this.autoWidth){
                    mb.w = Math.max(mb.w, aroundNode.offsetWidth);
                }else{
                    delete mb.w;
                }

                // And finally, resize the dropdown to calculated height and width
                if(lang.isFunction(dropDown.resize)){
                    dropDown.resize(mb);
                }else{
                    domGeometry.setMarginBox(ddNode, mb);
                }
            }

            var retVal = popup.open({
                parent: this,
                popup: dropDown,
                x: self.getTextareaXPos(),
                y: self.getTextareaYPos(),
                onExecute: function(){
                    self.closeDropDown(true);
                },
                onCancel: function(){
                    self.closeDropDown(true);
                },
                onClose: function(){
                    domAttr.set(self._popupStateNode, "popupActive", false);
                    domClass.remove(self._popupStateNode, "dijitHasDropDownOpen");
                    self._set("_opened", false);    // use set() because _CssStateMixin is watching
                }
            });
            domAttr.set(this._popupStateNode, "popupActive", "true");
            domClass.add(this._popupStateNode, "dijitHasDropDownOpen");
            this._set("_opened", true); // use set() because _CssStateMixin is watching
            
            this._popupStateNode.setAttribute("aria-expanded", "true");
            this._popupStateNode.setAttribute("aria-owns", dropDown.id);

            // Set aria-labelledby on dropdown if it's not already set to something more meaningful
            if(ddNode.getAttribute("role") !== "presentation" && !ddNode.getAttribute("aria-labelledby")){
                ddNode.setAttribute("aria-labelledby", this.id);
            }
            
            return retVal;
        },
        
        validate: function() {
            return;
        },

        /**
         * Finds the left bound of the textarea to place the x position of the popup
         */
        getTextareaXPos: function() {
            var obj = this.focusNode;
            var left = obj.offsetLeft || 0;
            if (obj.offsetParent) {
                do {
                    obj = obj.offsetParent;
                    left += obj.offsetLeft;
                } while (obj.offsetParent);
            }

            return left;
        },

        /**
         * Finds the y position of the caret in the text area but using the hidden div
         * that contains the same text as the textarea, stopping at the cursor
         */
        getTextareaYPos: function() {
            var obj = this.positionAttach;
            var top = obj.offsetTop || 0;
            if (obj.offsetParent) {
                do {
                    obj = obj.offsetParent;
                    top += obj.offsetTop;
                } while (obj.offsetParent);
            }
            //now offset the top so it positions underneath the line the user is typing on
            //subtract the amount the textare is scrolled into
            //pad it by 10 for easy reading
            top = top + this.positionAttach.offsetHeight + 10 - this.focusNode.scrollTop;

            return top;
        }
    });
});
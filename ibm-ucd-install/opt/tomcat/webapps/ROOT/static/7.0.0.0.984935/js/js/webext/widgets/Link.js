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
        "dojo/_base/kernel",
        "dojo/_base/lang",
        "dijit/_Widget",
        "dijit/_TemplatedMixin",
        "dojo/_base/array",
        "dojox/html/entities",
        "dojo/dom-class",
        "dojo/text!./Link.html",
        "dojo/dom",
        "dojo/on",
        "dojo/keys",
        "dojo/dom-style",
        "dojo/window",
        "dojo/has",
        "dijit/a11y",
        "js/util/blocker/_BlockerMixin",
        "dojo/_base/sniff"
        ],
function(
        declare,
        kernel,
        lang,
        _Widget,
        _TemplatedMixin,
        array,
        entities,
        domClass,
        templateString,
        dom,
        on,
        keys,
        domStyle,
        win,
        has,
        a11y,
        _BlockerMixin
) {

    /**
     * Simple widget to create a link
     *
     * Supported properties (all are optional):
     *   href:          String
     *   target:        String the target attribute, only valid if href is specified
     *   iconClass:     String   additional iconClass+"Disabled" will be added when disabled
     *   label:         String   HTML string for the body of the link
     *   labelText:     String   Literal string for the body of the link
     *   showLabel:     boolean  hide the label/show only the icon, default true
     *   title:         String   if !showLabel this defaults to the label text, when disabled appends " (disabled)"
     *   disabled:      boolean  disables the link - removes tabstop, adds disabled icon, prevents clicks,
     *                           updates title-text, adds "disabled" class, default false
     *   onClick:       function add an onClick event to the widget.
     *   tabIndex:      Number   the tabindex, defaults to document order
     *   scrollOnFocus: boolean  scroll the window to show the element when receives focus, default true
     *   noBubble:      boolean  prevent bubbling of the click event, default to false (click event WILL bubble)
     */
    return declare(
        // TODO we should investigate using [_WidgetBase, _OnDijitClickMixin, _FocusMixin] instead of _Widget
        // and if that set of features makes our onKeyUp handling redundant
        [_Widget, _TemplatedMixin, _BlockerMixin],
        {
            // the template
            templateString: templateString,

            // Override _WidgetBase mapping id to this.domNode, needs to be on focusNode so <label> etc.
            // works with screen reader
            _setIdAttr: "focusNode",

            // href: String
            //    The location of this link's href, can be empty/null
            href: "",

            // target: String
            //    the target value for the link, only used if href is nonempty
            target: "",

            // iconClass: String
            //      Class to apply to DOMNode in button to make it display an icon
            iconClass: "dijitNoIcon",
            _setIconClassAttr: { "node": "iconNode", "type": "class" },

            //      - DOM node CSS class
            // |        myClass: { node: "domNode", type: "class" }
            //      Maps this.myClass to this.domNode.className
            "class": "link",
            _setClassAttr: { "node":"focusNode",     "type": "class" },


            _setStyleAttr: [
                            { "node":"focusNode",     "type": "attribute" },
                            { "node":"containerNode",     "type": "attribute" }
                  ],

            // label: HTML String
            //      Content to display in link.
            label: "",

            // showLabel: Boolean
            //      Set this to true to hide the label text and display only the icon.
            //      (If showLabel=false then iconClass must be specified.)
            //      Especially useful for toolbars.
            //      If showLabel=true, the label will become the title (a.k.a. tooltip/hint) of the icon.
            //
            //      The exception case is for computers in high-contrast mode, where the label
            //      will still be displayed, since the icon doesn't appear.
            showLabel: true,

            // disabled: Boolean
            //      Should this widget respond to user input?
            //      In markup, this is specified as "disabled='disabled'", or just "disabled".
            disabled: false,

            // tabIndex: Integer
            //      Order fields are traversed when user hits the tab key
            tabIndex: "0",
            _setTabIndexAttr: "focusNode",

            // scrollOnFocus: Boolean
            //      On focus, should this widget scroll into view?
            scrollOnFocus: true,

            // noBubble: Boolean
            //      if the click event should bubble.
            noBubble: false,

            //
            // Methods
            //

            postCreate: function(){
                var self = this;
                self.inherited(arguments);
                // Chrome truncates its title tooltips, so we do this to force them to wrap instead.
                // Other browsers won't break words to wrap, and there's some ugly looking unused real
                // estate in the tooltip, so we use a slightly larger segment length.
                var spliceTitle = function(title) {
                    /*jslint regexp: true */
                    if (!!title) {
                        var segmentExp = /.{1,50}/g;
                        var shouldWrap = title.length > 50;
                        if (!!has("chrome")) {
                            segmentExp = /.{1,30}/g;
                            shouldWrap = title.length > 30;
                        }
                        if (!!title && shouldWrap) {
                            var segmentArray = title.match(segmentExp);
                            self.title = segmentArray.join("\u200B");
                        }
                        self.titleNode.title = self.title;
                    }
                };
                self.watch("title", function(attr, oldValue, newValue) {
                    spliceTitle(newValue);
                });
                spliceTitle(self.title);
                self._enterListener = self._setupEnterToDoClick(self.focusNode);
            },

            destroy: function() {
                this._enterListener.remove(); // disconnect keyboard listener
                this.inherited(arguments);
            },

            _fillContent: function(/*DomNode*/ source){
                // Overrides _Templated._fillContent().
                // If button label is specified as srcNodeRef.innerHTML rather than
                // this.params.label, handle it here.
                // TODO: remove the method in 2.0, parser will do it all for me
                if(source && (!this.params || (this.params.label === undefined))){
                    var sourceLabel = lang.trim(source.innerHTML);
                    if(sourceLabel){
                        this.label = sourceLabel; // _applyAttributes will be called after buildRendering completes to update the DOM
                    }
                }
            },

            _setHrefAttr: function(/*String*/ href){
                // summary:
                //      Hook for set('href', ...) to work.
                // description:
                //      Set the href of the link; takes a string.
                this.inherited(arguments);

                this._set("href", href);
                if (href) {
                    this.focusNode.href = href;
                }
            },

            _setTargetAttr: function(/*String*/ target) {
                // summary:
                //      Hook for set('target', ...) to work.
                // description:
                //      Set the target of the link; takes a string.
                this.inherited(arguments);

                this._set("target", target);
                if (!!target) {
                    this.focusNode.setAttribute("target", target);
                }
                else {
                    this.focusNode.removeAttribute("target");
                }
            },

            _setLabelTextAttr: function(/*String*/ content){
                // summary:
                //      Hook for set('labelText', ...) to work.
                // description:
                //      Set the label (text) of the button; takes a plain text string.
                //      If the label is hidden (showLabel=false) then and no title has
                //      been specified, then label is also set as title attribute of icon.
                this.inherited(arguments);

                this.set("label", entities.encode(content));
            },

            _setLabelAttr: function(/*String*/ content){
                // summary:
                //      Hook for set('label', ...) to work.
                // description:
                //      Set the label (text) of the button; takes an HTML string.
                //      If the label is hidden (showLabel=false) then and no title has
                //      been specified, then label is also set as title attribute of icon.
                this.inherited(arguments);

                this._set("label", content);
                (this.containerNode||this.focusNode).innerHTML = content;
                if(!this.showLabel && !this.title){
                    this.titleNode.title = lang.trim(this.containerNode.innerText || this.containerNode.textContent || '');
                    if (this.titleNode.title && this.disabled) {
                        this.titleNode.title += " (disabled)";
                    }
                }
            },

            _setShowLabelAttr: function(val){
                if(this.containerNode){
                    domClass.toggle(this.containerNode, "dijitDisplayNone", !val);
                }
                this._set("showLabel", val);
            },

            _setDisabledAttr: function(/*Boolean*/ value){
                this._set("disabled", value);

                // append/strip trailing disabled from title text
                if (this.titleNode.title) {
                    if (value) {
                        this.titleNode.title = this.titleNode.title.replace(/( \(disabled\))?$/, ' (disabled)');
                    }
                    else {
                        this.titleNode.title = this.titleNode.title.replace(/ \(disabled\)$/, '');
                    }
                }

                domClass.toggle(this.focusNode, 'disabled', value);
                domClass.toggle(this.iconNode, this.iconClass+'Disabled', value);
                this.focusNode.setAttribute("aria-disabled", value ? "true" : "false");

                if (value) {
                    // clear tab stop(s) on this widget's focusable node(s)
                    var attachPointNames = this._firstNonUndefined(
                            this.attributeMap.tabIndex,
                            this._setTabIndexAttr,
                            "focusNode");
                    if (!lang.isArray(attachPointNames)) {
                        attachPointNames = [attachPointNames];
                    }
                    array.forEach( attachPointNames , function(attachPointName){
                        var node = this[attachPointName];
                        // complex code because tabIndex=-1 on a <div> doesn't work on FF
                        if(has("webkit") || a11y.hasDefaultTabStop(node)){  // see #11064 about webkit bug
                            node.setAttribute('tabIndex', "-1");
                        }
                        else {
                            node.removeAttribute('tabIndex');
                        }
                    }, this);
                }
                else {
                    if(this.tabIndex !== ""){
                        this.set('tabIndex', this.tabIndex);
                    }
                }
            },

            isFocusable: function(){
                // summary:
                //      Tells if this widget is focusable or not.  Used internally by dijit
                // tags:
                //      protected
                return !this.disabled && this.focusNode && (domStyle.get(this.domNode, "display") !== "none");
            },

            focus: function(){
                // summary:
                //      Put focus on this widget
                if(!this.disabled && this.focusNode.focus){
                    try{ this.focusNode.focus(); }catch(e){}/*squelch errors from hidden nodes*/
                }
            },

            onClick: function(){
                // stub for overriding with events
            },

            //
            // Events
            //

            _onFocus: function() {
                if(this.scrollOnFocus){
                    // without defer, the input caret position can change on mouse click
                    this.defer(function(){ win.scrollIntoView(this.domNode); });
                }
                this.inherited(arguments);
            },

            _onClick: function(event) {
                if (this.disabled) {
                    // no default action, no bubbling
                    event.preventDefault();
                    event.stopPropagation();
                }
                else {
                    this.onClick();
                }
                if (this.noBubble) {
                    event.stopPropagation();
                }
                return !this.disabled;
            },

            //
            // Utility
            //

            /**
             * Return the first non-undefined argument, null if none found
             */
            _firstNonUndefined: function (){
                var result = null;
                array.some(arguments, function(arg){
                    if (arg !== undefined) {
                        result = arg;
                    }
                    return arg !== undefined;
                });
                return result;
            },

            /**
             * Backported from newer 1.7.x dijit/_WidgetBase
             */
            defer: function(fcn, delay){
                // summary:
                //      Wrapper to setTimeout to avoid deferred functions executing
                //      after the originating widget has been destroyed.
                //      Returns an object handle with a remove method (that returns null) (replaces clearTimeout).
                // fcn: function reference
                // delay: Optional number (defaults to 0)
                // tags:
                //      protected.
                var w = kernel.global;
                var timer = w.setTimeout(lang.hitch(this,
                    function(){
                        timer = null;
                        if(!this._destroyed){
                            lang.hitch(this, fcn)();
                        }
                    }),
                    delay || 0
                );
                return {
                    remove: function(){
                            if(timer){
                                w.clearTimeout(timer);
                                timer = null;
                            }
                            return null; // so this works well: handle = handle.remove();
                        }
                };
            },

            /**
             * Treat enter key press the same as clicking the target
             * @param element the element to map enter keystroke to click event
             * @return the listener link ref, use #remove on this ref to delete it
             */
            _setupEnterToDoClick: function (element) {
                return on(element, "keyup", function (event) {
                    var key = event.charCode || event.keyCode;
                    if (key === keys.ENTER) {
                        if (kernel.doc.createEvent) {
                            var clickEvent = kernel.doc.createEvent("HTMLEvents");
                            clickEvent.initEvent("click", true, true);
                            this.dispatchEvent(clickEvent);
                        }
                        else if (this.fireEvent) {
                            this.fireEvent("onclick");
                        }
                        else {
                            // not supported?
                            console.debug('Creating events is not supported in this browser');
                        }
                    }
                });
            }
        }
    );
});

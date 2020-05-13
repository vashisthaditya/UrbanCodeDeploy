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
        "dojo/_base/declare",
        "dijit/form/ComboBox",
        "dojo/_base/lang",
        "dojo/dom-attr",
        "dojo/dom-style",
        "dojo/aspect",
        "dojo/_base/array",
        "dojo/_base/xhr",
        "dojo/store/Memory"
        ],
function (
        declare,
        ComboBox,
        lang,
        domAttr,
        domStyle,
        aspect,
        array,
        xhr,
        Memory
) {
    
    /**
     * Modifies dijit's ComboBox for use when typing in a property tag ${p: ... }
     *
     */
    return declare("deploy.widgets.property.PropertyComboBox", [ComboBox], {

        propertyBeginOptions: ["${p:", "${p?:"],
        propertyBegin : "${p:",
        propertyEnd : "}",
        //default the autoComplete to false
        autoComplete: false,
        isTopLevel: true,

        postCreate: function() {
            var self = this;
            this.inherited(arguments);

            self.setMemoryStore(self.cache[0]);

            // This prevents the drop down arrow from displaying
            domStyle.set(this._buttonNode, "display", "none");
        },

        /**
         * Overrides the behavior of the ComboBox when submitting a fetch query
         *  to the store.
         */
        _startSearch: function(/*String*/ query){
            var cursorPosition = this._getCaretPos(this.focusNode);
            var parsedQuery = this._getCurrentProperty();
            if (parsedQuery.inTag) {
                //only query when in a property tag
                var newQuery = lang.trim(parsedQuery.current);
                this.checkContext(newQuery);
                this.inherited(arguments, [newQuery]);
            }
            else {
                //if not in a property tag, make sure no options are suggested
                this.closeDropDown();
            }
        },

        /**
         * Decides whether the user has entered a specific context yet. If the input
         * matches only one context, then the store is populated with the cached
         * properties from the REST service. Designed to only happen once per context
         * change.
         */
        checkContext: function(query) {
            var self = this;

            var splitQuery = query.split(/\.|\//g);
            var context = query;
            if (splitQuery.length > 1) {
                context = splitQuery[0];
            }
            var regex = new RegExp(context);
            var results = array.filter(this.cache[0], function(item) {
                return item.name.match(regex);
            });

            if (results.length <= 2 && self.isTopLevel) {
                self.isTopLevel = false;
                this.setMemoryStore(this.cache[1]);
            }
            else if (!self.isTopLevel && results.length > 2) {
                self.isTopLevel = true;
                this.setMemoryStore(this.cache[0]);
            }
        },

        /**
         * Overrides the behavior of the ComboBox when the user selects an
         *  item from the drop-down list. Prevents the cursor position being
         *  moved to the end of the text box, which is the default behavior
         *  when something is selected.
         */
        _selectOption: function(/*DomNode*/ target) {
            this.closeDropDown();
            if(target){
                this._announceOption(target);
            }
            this._handleOnChange(this.value, true);
            if (this.isTopLevel) {
                this.loadDropDown();
            }
        },

        /**
         * Overrides the behavior of the ComboBox when the user selects an
         *  item from the drop-down list.
         *
         * Instead of overwriting the contents with the selected item, we want
         *  to overwrite the contents of the current property only.
         */
        _announceOption: function(/*Node*/ node){
            if(!node){
                return;
            }

            var cursorPosition = this._getCaretPos(this.focusNode);
            var scrollTopPosition = this.focusNode.scrollTop;
            var scrollLeftPosition = this.focusNode.scrollLeft;

            // pull the text value from the item attached to the DOM node
            var newValue;
            if (node === this.dropDown.nextButton ||
                    node === this.dropDown.previousButton) {
                newValue = node.innerHTML;
                this.item = undefined;
                this.value = '';
            }
            else {
                var item = this.dropDown.items[node.getAttribute("item")];
                newValue = (this.store._oldAPI ?  // remove getValue() for 2.0 (old dojo.data API)
                        this.store.getValue(item, this.searchAttr) : item[this.searchAttr]).toString();
                var newValueLength = newValue.length;

                // identify the boundaries of the word that the
                //  user is currently editing
                var tagInfo = this._getCurrentProperty();
                // insert the selected value into the current string, append property end
                if (!this.isTopLevel && 
                        (tagInfo.after.lastIndexOf(this.propertyEnd, 0) === -1 
                                && newValue.lastIndexOf(this.propertyEnd) === -1)) {
                    tagInfo.after = this.propertyEnd + tagInfo.after;
                }
                newValue = tagInfo.before + newValue + tagInfo.after;
                this.set('item', item, false, newValue);
                // move the cursor to the end of the inserted word
                cursorPosition = tagInfo.before.length + newValueLength;
            }
            // get the text that the user manually entered (cut off autocompleted text)
            this.focusNode.value = this.focusNode.value.substring(0, this._lastInput.length);
            this.focusNode.setAttribute("aria-activedescendant", domAttr.get(node, "id"));
            this._autoCompleteText(newValue);
            this._setCaretPos(this.focusNode, cursorPosition);
            //reset the scroll so that view is correct
            this.focusNode.scrollTop = scrollTopPosition;
            this.focusNode.scrollLeft = scrollLeftPosition;
        },

        /**
         * Retrieves the input of the ComboBox and splits it into different parts
         * depending on whether or not the cursor is within a property tag.
         */
        _getCurrentProperty : function (){
            var cursorPosition = this._getCaretPos(this.focusNode);
            var key = this.focusNode.value;
            var propertyRef = -1;
            //out of all the tag start options, get the first one that actually exists
            var i;
            for (i = 0; i < this.propertyBeginOptions.length; i++) {
                var temp = key.indexOf(this.propertyBeginOptions[i]);
                if (temp !== -1 && (propertyRef === -1 || temp < propertyRef)) {
                    propertyRef = temp;
                    this.propertyBegin = this.propertyBeginOptions[i];
                }
            }

            var propertyEnd = -1;
            var results = {
                    "before"  : key,
                    "after"   : "",
                    "current" : "",
                    "inTag"   : false
            };
            //there is no property tag
            if (propertyRef === -1) {
                results.before = key;
                results.current = "";
                results.after = "";
            }
            while (propertyRef !== -1){
                if (propertyRef < cursorPosition) {
                    propertyEnd = key.indexOf(this.propertyEnd, propertyRef);
                    if (propertyEnd === -1) {
                        //in the property tag, set values accordingly
                        results.before = key.substr(0, propertyRef+this.propertyBegin.length);
                        results.current = key.substr(propertyRef+this.propertyBegin.length);
                        results.after = "";
                        results.inTag = true;
                        break;
                    }
                    else if (propertyEnd >= cursorPosition) {
                        //in a closed property tag, set values accordingly
                        var propBegin = propertyRef + this.propertyBegin.length;
                        var propEnd = propertyEnd - this.propertyEnd.length;

                        results.before = key.substr(0, propBegin);
                        results.current = key.substr(propBegin, propertyEnd - propBegin);
                        results.after = key.substr(propertyEnd);
                        results.inTag = true;
                        break;
                    }
                    else {
                        //the cursor is past the property tag, check the next reference
                        propertyRef = -1;
                        for (i = 0; i < this.propertyBeginOptions.length; i++) {
                            var tmp = key.indexOf(this.propertyBeginOptions[i], propertyEnd);
                            if (tmp !== -1 && (propertyRef === -1 || tmp < propertyRef)) {
                                propertyRef = tmp;
                                this.propertyBegin = this.propertyBeginOptions[i];
                            }
                        }
                        results.inTag = false;
                    }
                }
                else {
                    //this property tag is past the cursor, not within a property tag
                    //safe to say that any subsequent property tag will also be past the cursor
                    results.before = key;
                    results.current = "";
                    results.after = "";
                    results.inTag = false;
                    break;
                }
            }
            return results;
        },

        /**
         * Switch the data in the store for matching suggestions
         */
        setMemoryStore: function(data) {
            if (data && !this.store) {
                this.store = new Memory({
                    data: data,
                    idProperty: "name"
                });
            }
            else if (data) {
                this.store.setData(data);
            }
            else {
                this.store.setData([]);
            }
        }
    });
});
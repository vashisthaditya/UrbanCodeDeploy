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

define([
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/array",
        "dojo/_base/xhr",
        "dojo/_base/json",
        "dojo/aspect",
        "dojo/window",
        "dojo/on",
        "dojo/mouse",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/dom-style",
        "dojo/dom-attr",
        "dojo/dom-geometry",
        "dijit/form/FilteringSelect",
        "dijit/form/ComboBox",
        "dijit/form/CheckBox",
        "dojox/data/JsonRestStore",
        "dojo/store/Memory"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        lang,
        array,
        xhr,
        baseJson,
        aspect,
        winUtils,
        on,
        mouse,
        domConstruct,
        domClass,
        domStyle,
        domAttr,
        domGeom,
        FilteringSelect,
        ComboBox,
        CheckBox,
        JsonRestStore,
        Memory
) {
    /**
     * FilteringSelect Widget with support for multi-select with check boxes (if multiple = true) and infinite scroll.
     *
     * store: The data store of items to show in the drop down. (None if url is given).
     * url (string): If a url is given, it will create a store from the given url. Url should return an array of items.
     *               restUrl can also be used.
     *
     * defaultQuery (object): Query to apply to all requests to populate the list. Only applies when using a URL and JSON store.
     *                        { description: "*contains this text*" }
     *                        The object is converted to a URL query using standard object-to-query mechanisms.
     *
     * storeType (string): If url is given, you can set the type of store to create.
     *                     Options: 'JSON' = dojox/data/JsonRestStore (Default)
     *                              'memory' = dojo/store/Memory
     *
     * options (array): If an array of options (Objects) are given, it will create a memory store with these options.
     *                  Structure: [
     *                      {name: "name", id: 1},
     *                      {name: "name", id: 2, checked: true},
     *                  ]
     *
     * idProperty (string): Define the id attribute of each item in the store. Default 'id'.
     *
     * handleAs (string): If storeType is Memory, define the parameter to handle the data from the server. Default 'json'.
     *
     * headers (object): If storeType is Memory, you can specify the headers to send with the request.
     *
     * accept (string or boolean(true)) : If storeType is Memory, you can specify the headers accept type. If set to true, it will use "application/json".
     *
     * searchAttr (string): The attribute to use for each item to get value of each menu item. Default 'name'
     *
     * autoComplete (boolean): If user types in a partial string, and then tab out of the <input> box,
     *                         automatically copy the first entry displayed in the drop down list to the <input> field.
     *                         Default: false
     *
     * queryExpr (string): whether to match the search string as "begins with" "contains" or "ends with"
     *                     default: "${0}*"                          "${0}*",   "$*{0}*",      "$*{0}"
     *                     XXX: queryExpr other than "${0}*" should only be used in conjunction with autocomplete:false, as
     *                     autocompleting `contains` or `ends with` has buggy UI consequences.  See: https://bugs.dojotoolkit.org/ticket/17353
     *
     *
     * highlightMatch (string): what if any text of items that match the query string should be highlighted in the dropdown.
     *                          default:"first".  possible values: "first", "all" or "none".
     *
     * pageSize (integer): The number of items to fetch for each page.
     *
     * style (object | string): The style of the widget in css style string or key/value pair object.
     *
     * dropDownMaxHeight (integer): Max height in pixels of the drop down menu.
     *
     * multiple (boolean): Allow multiple selections with checkBoxes. (Uses ComboBox widget).
     *
     * autoSelectFirst (boolean): Select first option if no default value is given. Default: false.
     *
     * allowNone (boolean): Display none value in drop down. Default: false. Not available if multiple === true.
     *
     * showClear (boolean): Display link to clear selected items if multiple === true. Default: true.
     *
     * clearSelectedItemsLabel (string) : If multiple, set label for clear selected items label. Default (Clear Selection)
     *
     * required (boolean): If value is required. Default: false.
     *
     * disabled (boolean) -OR- readOnly (boolean): If drop down is disabled. Default: false.
     *
     * validate (boolean): If widget should validate input. Default: true.
     *
     * value: value for select. Set to the 'ID' of selected item.
     *      If multiple === true, use array of objects to set, will return array of id's when getting value.
     *      this.values will return an array of the objects selected.
     *      To get data object, use get("item")
     *
     * className (string): Add a class name to the widget.
     *
     *
     * ~ FUNCTIONS ~
     *
     * get(attr)
     *     Gets a value from the widget.
     *     @param attr (string): The attribute to get a value to return.
     *     @return The value of the given parameter.
     *
     * set(attr, value)
     *     Sets a value in the widget.
     *     @param attr (string): The attribute to set the value of.
     *     @param value: The value to set the attribute.
     *
     * updateUrl(url)
     *     Updates the URL and recreates the dropdown from the given url.
     *     @param url: The new url to update the dropdown.
     *
     * onLoad()
     *     Run function after dropDown is created.
     *
     * onChange(value, item, type)
     *     Function when value of drop down is changed.
     *     @param value: The value of the drop down (Usually the id)
     *     @param item: The entire data item (object) of the selected value.
     *     @param type: The type of onChange event (value, clearSelectedItems, removeSelectedItems, checkBox, noneSelected).
     *
     * isShown(item)
     *     Determines if item is shown in the drop down.
     *     @param item: The menu item.
     *     @return (boolean) If item should be shown in drop down.
     *
     * formatDropDownLabel(menuitem, item)
     *     Add style to an item in the drop down.
     *     @param menuitem: The item label node
     *     @param item: The data for the item
     *
     * placeAt(attachPoint)
     *     Places this widget at a given domNode.
     *     @param attachPoint: The node to attach this widget to.
     *     @return The widget.
     *
     *
     * ~ FUNCTIONS (MULTIPLE ONLY) ~
     *
     * onSelectedRollOver(item, node)
     * onSelectedRollOut(item, node)
     *     Functions when selected item in selected items list is hovered on.
     *     @param item: The data of the selected item.
     *     @param node: The node of the item.
     *
     * formatSelectedItem(selectedItem, item, label, removeItem)
     *    Formats the selected items in the selected items list.
     *    @param selectedItem: The entire selected item node.
     *    @param item: The data associated with the selectedItem.
     *    @param label: The label node.
     *    @param removeItem: The remove item node.
     *
     * clearSelectedItems()
     *    Clears selected items if multiple is specified.
     */
    return declare('js.webext.widgets.FilteringScrollSelect', [_Widget, _TemplatedMixin], {
        store: null,
        storeType: 'JSON',
        targetId: 'id',
        idProperty: 'id',
        handleAs: 'json',
        searchAttr: "name",
        autoComplete: false,
        queryExpr:"${0}*", //one of "${0}*", "$*{0}*", "$*{0}"
        highlightMatch: "first",
        pageSize: 30,
        dropDownMaxHeight: 280,
        multiple: false,
        allowNone: false,
        autoSelectFirst: false,
        showClear: true,
        readOnly: false,
        required: false,
        disabled: false,
        trim: false,
        validate: true,
        templateString:
            '<div class="combo-check-box-select filtering-scroll-select">' +
                '<div class="selected-items-list" data-dojo-attach-point="selectedItemsAttachPoint"></div>' +
                '<div data-dojo-attach-point="comboBoxAttachPoint"></div>' +
            '</div>',

        constructor: function(args, attachPoint){
            if (attachPoint){
                this.attachPoint = attachPoint;
            }
        },

        /**
         * Creates the Widget and adds in classNames if provided.
         */
        postCreate: function(){
            this.inherited(arguments);
            if (!this.idProp){
                this.idProp = this.idProperty;
            }
            if (this.multiple){
                this._numberOfSelectedItems = 0;
                if (!this.selectedItems){
                    this.selectedItems = {};
                }
                this.values = [];
                this._displaySelectedItems();
            }
            if (!this.url && this.restUrl){
                this.url = this.restUrl;
            }
            if (!this.store && (this.url || this.options)){
                this._createStore();
            }
            if (this.store){
                this._createFilteringSelect();
            }
            if (this.attachPoint){
                this.placeAt(this.attachPoint);
            }
            if (this.className || this["class"]){
                var classes = this.className || this["class"];
                domClass.add(this.domNode, classes);
            }
        },

        /**
         * Sets a value in the widget.
         * @param attr: The attribute to set the value of.
         * @param value: The value to set the attribute.
         */
        set: function(attr, value){
            var self = this;
            this[attr] = value;
            if (this.multiple && this.value && (attr === "values" || attr === "value")) {
                var valueJson = baseJson.toJson(value);
                if (valueJson === "[]" || valueJson === "{}" || valueJson === "null"){
                    this.clearSelectedItems();
                }
                else {
                    this.selectedValues = value;
                    if (!this.selectedItems){
                        this.selectedItems = {};
                    }
                    array.forEach(this.value, function(value){
                        self.selectedItems[value[self.searchAttr]] = value;
                    });
                    if (!this.idProp){
                        this.idProp = this.idProperty;
                    }
                    this._displaySelectedItems();
                    //Because multiple doesn't place the value into the dropDown
                    //we want to manually fire onChange here just to catch when
                    //a value change happens.
                    this.onChange(this.value, this.values, "value");
                }
            }
            if (attr === "idProperty"){
                this.idProp = value;
            }
            //!this.multiple added because adding a value to the dropDown when
            //it is multiple will cause weird UI behavior for the end user.
            else if (this.dropDown && attr === "value" && !this.multiple){
                this.dropDown.set(attr, value);
            }
        },

        /**
         * If a url and a store type are passed as arguments, create a store based on these parameters.
         */
        _createStore: function(){
            var self = this;
            if (this.options){
                this.storeType = "memory";
            }
            this.storeType = this.storeType.toLowerCase();
            switch (this.storeType){
                case "memory":
                    var items = self.options || [];
                    var createMemoryStore = function(data){
                        self.store = new Memory({
                            data: data,
                            idProperty: self.idProperty
                        });
                    };
                    if (self.url){
                        var getOptions = {
                            url: self.url,
                            sync: true,
                            handleAs: self.handleAs,
                            load: function(data) {
                                createMemoryStore(data);
                            }
                        };
                        if (self.headers){
                            getOptions.headers = self.headers;
                        }
                        else if (self.accept){
                            getOptions.headers = {
                                "Accept": typeof self.accept === "boolean" ? "application/json" : self.accept
                            };
                        }
                        xhr.get(getOptions);
                    }
                    else {
                        createMemoryStore(items);
                    }
                    break;
                case "json":
                    self.store = new JsonRestStore({
                        target: self.url,
                        idAttribute: self.idProperty
                    });
                    break;
                default:
                    console.error(i18n("Error creating store with store type: %s", self.storeType));
            }
        },

        /**
         * Creates the filtering drop down widget.
         */
        _createFilteringSelect: function(){
            var self = this;
            this.originalPageSize = this.pageSize;
            if (this.multiple){
                self.required = false;
                if (!self.placeHolder){
                    self.placeHolder = i18n("None selected");
                }
                if (this.selectedValues){
                    self.placeHolder = i18n("%s Selected", self.selectedValues.length);
                }
            }
            else {
                domClass.add(self.selectedItemsAttachPoint, "selected-items-list-empty");
            }

            // Multiple uses combo box since filtering select requires one value.
            var widget = (this.multiple || !this.validate) ? ComboBox : FilteringSelect;
            var widgetOptions = {
                store: self.store,
                searchAttr: self.searchAttr,
                noDataMessage: self.noDataMessage,
                placeHolder: self.placeHolder,
                autoComplete: self.autoComplete,
                queryExpr: self.queryExpr,
                highlightMatch: self.highlightMatch,
                selectOnClick: self.selectOnClick || false,
                pageSize: self.pageSize,
                maxHeight: self.dropDownMaxHeight,
                style: self.style,
                required: (self.disabled || self.readOnly) ? false : self.required,
                disabled: !!self.disabled || !!self.readOnly,
                trim: self.trim,
                query: self.defaultQuery || {},
                onChange: function(value){
                    var item = this.item;
                    if (!self.multiple && item){
                        // Clear paging cache and set value.
                        self._resetValues();
                        self.value = item[self.idProp];
                    }
                    // Value usually is the item. Set reference to the selected object as well.
                    self.item = item;
                    if (self.multiple){
                        self._onChange(item);
                        // Prevent double onChange on blur of drop down.
                        if (this.value !== ""){
                            self.onChange(self.value, self.values, "value");
                        }
                    }
                    else {
                        self.onChange(value, item, "value");
                    }
                },
                _showResultList: function(){
                    // summary:
                    //      Display the drop down if not already displayed, or if it is displayed, then
                    //      reposition it if necessary (reposition may be necessary if drop down's height changed).
                    this.closeDropDown(true);
                    this.openDropDown();
                    this.domNode.setAttribute("aria-expanded", "true");
                    setTimeout(function(){
                        self._scrollIntoView(self.dropDownMenu.domNode);
                    }, 1);
                }
            };
            // Prepopulate value in drop down.
            if (!self.multiple && (self.value || self.autoSelectFirst)){
                widgetOptions.value = self.value;
                // Fetch item if memory store.
                // JSON store should automatically get item, and can't auto-select the first item
                // since it won't be loaded until the user opens the form field.
                if (self.storeType.toLowerCase() === "memory"){
                    // If selectFirst, choose first option by default if no value is given.
                    if (self.autoSelectFirst && !self.value && self.store.data && self.store.data[0]){
                        self.item = self.store.data[0];
                        self.value = self.item[self.idProperty];
                        widgetOptions.value = self.value;
                    }
                    else if (self.value) {
                        self.item = self.store.get(self.value);
                    }
                }
            }
            if (widgetOptions.value === undefined) {
                if(self.autoSelectFirst && self.storeType === 'memory') {
                    // If there is no value, but autoselect first is set, then we need to
                    // "query" the store for a single item that is anything (returns true) and use the resulting
                    // object's 'id' value, according to idProp which is set by idProperty;
                    widgetOptions.value = widgetOptions.store.query(function () {return true; },{count:1})[0][self.idProp];
                    self.set('value', widgetOptions.value);
                } else {
                    widgetOptions.value = null; // This is a peculiarity of FilteringSelect
                }
            }
            this.dropDown = new widget(widgetOptions).placeAt(self.comboBoxAttachPoint);

            // Various places rely on the onChange method to retrieve the full object for an existing
            // string value (for example, load this widget with a preselected agent ID, and on populating
            // the widget with the initial value, also add more fields based on some properties of the
            // agent object.) It's cleaner to just fire onChange for that rather than looking up the
            // agent object separately.
            if (widgetOptions.value) {
                var loadedInitialValue = false;
                aspect.after(this.dropDown, "_setValueAttr", function(value, priorityChange, displayedValue, item) {
                    if (!loadedInitialValue && value === widgetOptions.value) {
                        self.onChange(value, item, "value");
                    }
                    loadedInitialValue = false;
                }, true);
            }
            this.onLoad();
            this._addDropDownEvents(this.dropDown);
        },

        /**
         * Updates the URL and recreates the dropdown from the given url.
         * @param url: The new url to update the dropdown.
         */
        updateUrl: function(url){
            if (url){
                domConstruct.empty(this.comboBoxAttachPoint);
                this.url = url;
                if (this.restUrl){
                    this.restUrl = url;
                }
                this.store = null;
                delete this.store;
                this.postCreate();
                if (this.multiple){
                    this.clearSelectedItems();
                }
            }
        },

        /**
         * Adds the listener events to the drop down
         * @param dropDown: The dropDown widget.
         */
        _addDropDownEvents: function(dropDown){
            var self = this;
            var loadedDropDown = false;
            // Define function to load more items when drop down is scroll to last item.
            var loadMore = function(){
                if (dropDown.dropDown){
                    var dropDownPanel = dropDown.dropDown;

                    dropDownPanel.clearResultList = function(){
                        // summary:
                        //      Clears the entries in the drop down list, but of course keeps the previous and next buttons.
                        if (!self.loadMore){
                            var container = this.containerNode;
                            while(container.childNodes.length > 2){
                                container.removeChild(container.childNodes[container.childNodes.length-2]);
                            }
                            this._setSelectedAttr(null);
                            delete this.firstItem;
                            self.lastScrollPosition = 0;
                        }
                    };

                    self._createOptions(dropDownPanel);
                    if (!loadedDropDown){
                        loadedDropDown = true;
                        domClass.add(dropDownPanel.domNode, "filtering-scroll-select-drop-down");
                        // If multiple, keep drop down open.
                        dropDownPanel.on("click", function(node){
                            if (self.multiple && dropDownPanel._popupWrapper){
                                domStyle.set(dropDownPanel._popupWrapper, "display", "inline");
                            }
                            else {
                                self.loadMore = false;
                            }
                        });

                        // Trigger event when dropDown is scrolled to within 200px of the last item.
                        dropDownPanel.on("scroll", function(node){
                            var panelPosition = domGeom.position(dropDownPanel.domNode);
                            var panelHeight = panelPosition.h;
                            var panelY = panelPosition.y;
                            if (dropDownPanel.nextButton){
                                var nextPosition = domGeom.position(dropDownPanel.nextButton);
                                var nextHeight = nextPosition.h;
                                var nextY = nextPosition.y;

                                // Total number of pixels of scrolling before we'd see the end of the list
                                var distanceUntilEnd = nextY - (panelHeight + panelY);

                                if (distanceUntilEnd <= 200 && nextHeight !== 0 && !self.loadMore){
                                    if (self.keyUp){
                                        delete self.keyUp;
                                        self.selectLastOnKey = true;
                                        self.lastSelectedItem = dropDownPanel.getHighlightedOption();
                                    }

                                    var loadMoreItems = function(){
                                        var dropDownPosition = domGeom.position(dropDownPanel.firstItem);
                                        var dY = dropDownPosition.y;
                                        // Save last scroll position;
                                        self.lastScrollPosition = panelY - dY;
                                        self.loadMore = true;
                                        dropDownPanel.onPage(1);
                                    };
                                    loadMoreItems();

                                    setTimeout(function(){
                                        if (self.cachedResults){
                                            var cR = self.cachedResults;
                                            // If current result length plus next page size is less than total results,
                                            // Load more results after a second.
                                            if (cR.total > cR.results.length + self.pageSize){
                                                self.selectLastOnKey = true;
                                                self.lastSelectedItem = dropDownPanel.getHighlightedOption();
                                                loadMoreItems();
                                            }
                                        }
                                    }, 1000);
                                }
                            }
                        });
                    }
                }
            };
            dropDown.on("mouseDown", function(){
                loadMore();
            });
            dropDown.on("keyUp", function(e){
                var key = e.keyIdentifier;
                delete self.keyUp;
                if (self.allowNone){
                    if (key === "Enter"){
                        self._isNoneSelectedLast(this);
                    }
                    else {
                        this.lastSelected = this.dropDown.selected;
                    }
                }
                if (key === "Up"|| key === "Down"){
                    var dropDown = this.dropDown;
                    // If menu is navigated with keyboard and next button is selected, automatically
                    // load more results and keep item selected.
                    self.keyUp = true;
                }
                // When navigating the drop down list with the keyboard, ctrl key can be used to select checkbox.
                else if (e.ctrlKey || key === "Control"){
                    if (this.item && this.item.checkBox){
                        self._setChecked(this.item, this.item.checkBox);
                    }
                }
                // Directional and other function keys should not alter drop down.
                else if (!(key === "Left" || key === "Right" || key === "Enter" || e.shiftKey || e.altKey || e.altGraphKey)){
                    self._resetValues();
                }
                loadMore();

                //Allows the FilteringScrollSelect backed by a JSONRestStore to have an empty value selected.
                var currentInput = self.dropDown.get("displayedValue");
                if (currentInput === ""){
                    self.dropDown.set('value', '', undefined, undefined, '');
                }
            });
            dropDown.on("blur", function(){
                self._resetValues();
                if (self.multiple){
                    if (dropDown.dropDown && dropDown.dropDown._popupWrapper){
                        domStyle.set(dropDown.dropDown._popupWrapper, "display", "none");
                        self._displaySelectedItems();
                        self._setDisplayCount();
                        dropDown.set("DisplayedValue", "");
                    }
                    self.clickSet = null;
                }
                if (dropDown.dropDown && dropDown.dropDown.firstItem){
                    delete dropDown.dropDown.firstItem;
                }
                self.lastScrollPosition = 0;
                self._isNoneSelectedLast(this);
            });
        },

        /**
         * On keyboard events, determine if none option was selected to clear drop down value.
         * @param dropDown: The dropDown menu.
         */
        _isNoneSelectedLast: function(dropDown){
            if (this.allowNone && dropDown.lastSelected){
                if (domClass.contains(dropDown.lastSelected, "menu-item-none-item")){
                    dropDown.set('value', '', undefined, undefined, '');
                    this.value = null;
                    this.values = null;
                    this.onChange(null, null, "noneSelected");
                }
            }
        },

        /**
         * Clear cached values for the loadMore function.
         */
        _resetValues: function(){
            this.cachedResults = null;
            this.lastPage = null;
            this.prevCountResults = null;
            this.pageSize = this.originalPageSize;
        },

        /**
         * Run function after dropDown is created.
         */
        onLoad: function(){},

        /**
         * Changes the placeHolder text to show how many items are selected. If none, it will revert to the default placeHolder.
         */
        _setDisplayCount: function(){
            var numberOfItems = this._numberOfSelectedItems;
            var placeHolder = numberOfItems > 0 ? i18n("%s Selected", numberOfItems) : this.placeHolder;
            this.dropDown.set("placeHolder", placeHolder);
        },

        /**
         * Adds an item to the selected list when typed.
         * @param item: The item to add.
         */
        _onChange: function(item){
            var self = this;
            if (item && !item.checked && self.clickSet !== item[self.searchAttr]){
                this.enterToAdd = false;
                item.checked = true;
                self.selectedItems[item[self.searchAttr]] = item;
                self._displaySelectedItems();
            }
        },

        /**
         * Function when value of drop down is changed.
         * @param value: The value of the drop down (Usually the id)
         * @param item: The entire data item (object) of the selected value.
         * @param type: The type of onChange event (value, clearSelectedItems, removeSelectedItems, checkBox, noneSelected).
         */
        onChange: function(value, item, type){},

        /**
         * Overriding the default createOptions in the ComboBoxWidget to add checkBoxes to each menu item.
         */
        _createOptions: function(dropDown){
            var _this = this;

            dropDown.createOptions = function(results, options, labelFunc){
                var self = this;

                var itemHeight = domGeom.position(this.nextButton).h;
                if (!_this.itemHeight && itemHeight > 0){
                    _this.itemHeight = itemHeight + 1;
                }
                // Always hide previous page link.
                this.previousButton.style.display = "none";
                //domAttr.set(this.previousButton, "id", this.id + "_prev");
                var displayMore = false;
                // Try to determine if we should show 'more'...
                if (results.total && !results.total.then && results.total !== -1){
                    if ((options.start + options.count) < results.total){
                        displayMore = true;
                    }
                    else if ((options.start + options.count) > results.total && options.count === results.length){
                        // Weird return from a data store, where a start + count > maxOptions
                        // implies maxOptions isn't really valid and we have to go into faking it.
                        // And more or less assume more if count == results.length
                        displayMore = true;
                    }
                }
                else if (options.count === results.length){
                    //Don't know the size, so we do the best we can based off count alone.
                    //So, if we have an exact match to count, assume more.
                    displayMore = true;
                }

               if (!_this.cachedResults){
                    _this.cachedResults = {
                        index: {},
                        results: [],
                        page: 0,
                        total: results.total
                    };
                    _this.itemCount = 0;
                    delete self.firstItem;
                }

                var lastItem = 0;
                if (_this.allowNone && !_this.multiple && results.length > 0){
                    if (!_this.selectNone){
                        try {
                            _this.selectNone = domConstruct.create("div", {
                                className: "dijitReset dijitMenuItem menu-item-none-item",
                                innerHTML: i18n("None"),
                                onclick: function(){
                                    _this.dropDown.set('value', '', undefined, undefined, '');
                                    _this.value = null;
                                    _this.values = null;
                                }
                            });
                            _this.selectNone.setAttribute("item", 0);
                        }
                        catch (e){
                            // Item does not exist;
                        }
                    }
                    if (this.previousButton){
                        domConstruct.place(_this.selectNone, this.previousButton, "after");
                    }
                }
                array.forEach(results, function(item, i){
                    if (_this.isShown(item)){
                        var menuitem = this._createOption(item, labelFunc);
                        if (!item.id){
                            item.id = item[_this.idProp];
                        }
                        menuitem.setAttribute("item", (_this.itemCount + i));   // index to this.items; use indirection to avoid mem leak
                        domAttr.set(menuitem, "id", this.id + (_this.itemCount + i));
                        _this.formatDropDownLabel(menuitem, item);
                        if (_this.multiple){
                            _this._addCheckBoxToMenuitem(menuitem, item);
                        }
                        if (!self.firstItem){
                            self.firstItem = menuitem;
                        }
                        lastItem = i;
                        this.nextButton.parentNode.insertBefore(menuitem, this.nextButton);
                    }
                }, this);
                _this.itemCount += lastItem + 1;

                // When building the menu items, keep a cache of previous items when new items are loaded.
                array.forEach(results, function(result){
                    var index = result[_this.searchAttr];
                    _this.cachedResults.index[index] = 1;
                    _this.cachedResults.results.push(result);

                });
                //_this.cachedResults.results.concat(results);
                results = _this.cachedResults.results;
                this.items = results;

                // display "Next . . ." button
                this.nextButton.innerHTML = i18n("Loading...");
                this.nextButton.style.display = displayMore ? "" : "none";
                domAttr.set(this.nextButton, "id", this.id + "_next");
                // Set dropDown variables for _scrollIntoView function.
                _this.dropDownMenu = {
                    domNode: self.domNode,
                    resultsLength: results.length
                };

                if (_this.selectLastOnKey && _this.lastSelectedItem){
                    setTimeout(function(){
                        dropDown.onSelect(_this.lastSelectedItem);
                        dropDown.selected = _this.lastSelectedItem;
                        _this.selectLastOnKey = false;
                    }, 1);
                }
                _this.lastItem = lastItem;
            };
        },

        /**
         * Determines if item is shown in the drop down.
         * @param item: The menu item.
         * @return (boolean) If item should be shown in drop down.
         */
        isShown: function(item){
            return true;
        },

        /**
         * Scrolls the dropdown in the last position after adding more items into the dropdown.
         *      @param dropDown: The dropdown widget
         */
        _scrollIntoView: function(dropDown){
            // Scroll to the same position in the menu.
            dropDown.scrollTop = this.lastScrollPosition;
            this.loadMore = false;
        },

        /**
         * Adds a check box to a menu item in the drop down.
         * @param menuitem: The menu item to attach the check box to.
         * @param item: The data for the menuitem.
         */
        _addCheckBoxToMenuitem: function(menuitem, item){
            var self = this;
            var items = this.selectedItems;
            if ((items && items[item[this.searchAttr]]) || item.checked){
                item.checked = true;
            }
            var checkBox = new CheckBox({
                checked: item.checked
            }).placeAt(menuitem, "first");
            item.checkBox = checkBox;
            on(menuitem, "click", function(){
                self._setChecked(item, checkBox);
            });
        },

        /**
         * Sets the checked value for the given item.
         * @param item: The given item.
         * @param checkBox: The check box associated with the item in the drop down.
         */
        _setChecked: function(item, checkBox){
            if (item.checked){
                item.checked = false;
                checkBox.set("checked", false);
                delete this.selectedItems[item[this.searchAttr]];
            }
            else {
                item.checked = true;
                checkBox.set("checked", true);
                this.selectedItems[item[this.searchAttr]] = item;
            }
            this.clickSet = item[this.searchAttr];
            this._displaySelectedItems(true);
            this.onChange(this.value, this.values, "checkBox");
        },

        /**
         * Add style to an item in the drop down.
         * @param menuitem: The item label node
         * @param item: The data for the item
         */
        formatDropDownLabel: function(menuitem, item){},

        /**
         * No IE8 support for Object.keys, so define function.
         * @param obj : Object to retrieve keys.
         * @return Array of key values in given object.
         */
        _getObjectKeys: function(obj){
            var keys = [];
            var i;
            for (i in obj) {
                if (obj.hasOwnProperty(i)) {
                    keys.push(i);
                }
            }
            return keys;
        },

        /**
         * Creates the list of selected items.
         */
        _displaySelectedItems: function(hideItems){
            var self = this;
            if (this.selectedItems) {
                var items = this.selectedItems;
                if (!Object.keys) {
                    Object.keys = this._getObjectKeys(items);
                }
                var keys = Object.keys(items);
                var length = keys.length;
                this._numberOfSelectedItems = length;
                keys.sort();
                if (!hideItems){
                    domConstruct.empty(self.selectedItemsAttachPoint);
                }
                this.value = [];
                this.values = [];
                var i = 0;

                for (i = 0; i < length; i++){
                    var tempItem = items[keys[i]];
                    if (tempItem){
                        if (tempItem[self.idProp]){
                            self.value.push(tempItem[self.idProp]);
                        }
                        self.values.push(tempItem);
                    }
                    if (!hideItems){
                        var selectedItem = self._createSelectedItem(tempItem, keys[i]);
                        domConstruct.place(selectedItem, self.selectedItemsAttachPoint);
                    }
                }
                if (!hideItems){
                    if (this.showClear){
                        if (!this.clearSelectedItemsLink){
                            this.clearSelectedItemsLink = domConstruct.create("div", {
                                innerHTML: this.clearSelectedItemsLabel || i18n("Clear Selection"),
                                className: "linkPointer clear-selected-items"
                            }, this.domNode, "first");
                        }
                        on(this.clearSelectedItemsLink, "click", function(){
                            self.clearSelectedItems();
                            self.value = [];
                            self.values = [];
                            self.onChange(self.value, self.values, "clearSelectedItems");
                            self._numberOfSelectedItems = 0;
                            domClass.add(this, "hidden");
                            domClass.add(self.selectedItemsAttachPoint, "selected-items-list-empty");
                        });
                        if (this._numberOfSelectedItems < 1){
                            domClass.add(this.clearSelectedItemsLink, "hidden");
                        }
                        else {
                            domClass.remove(this.clearSelectedItemsLink, "hidden");
                        }
                    }
                    if (this._numberOfSelectedItems < 1){
                        domClass.add(this.selectedItemsAttachPoint, "selected-items-list-empty");
                    }
                    else {
                        domClass.remove(this.selectedItemsAttachPoint, "selected-items-list-empty");
                    }
                }
            }
        },

        /**
         * Creates a single selected item to display in the selected items list.
         */
        _createSelectedItem: function(item, label){
            var self = this;
            var selectedItem = domConstruct.create("div", {
                className: "selected-item-container",
                title: label
            });
            this.own(on(selectedItem, mouse.enter, function(){
                self.onSelectedRollOver(item, selectedItem);
            }));
            this.own(on(selectedItem, mouse.leave, function(){
                self.onSelectedRollOut(item, selectedItem);
            }));
            var removeItem = domConstruct.create("div", {
                className: "remove-selected-item",
                innerHTML: "X"
            }, selectedItem);
            var labelItem = domConstruct.create("div", {
                className: "selected-item-label",
                innerHTML: label
            }, selectedItem);
            if (this.dropDown){
                var maxWidth = domGeom.position(this.dropDown.domNode).w;
                // Selected item is as wide as the drop down.
                domStyle.set(labelItem, "max-width", maxWidth - 22 + "px");
            }
            this._onRemoveItem(removeItem, item);
            this.formatSelectedItem(selectedItem, item, labelItem, removeItem);
            return selectedItem;
        },

        /**
         * Functions when selected item is hover on.
         * @param item: The data of the selected item.
         * @param node: The node of the item.
         */
        onSelectedRollOver: function(item, node){},
        onSelectedRollOut: function(item, node){},

        /**
         * Formats the selected items in the selected item list.
         * @param selectedItem: The entire selected item node.
         * @param item: The data associated with the selectedItem.
         * @param label: The label node.
         * @param removeItem: The remove item node.
         */
        formatSelectedItem: function(selectedItem, item, label, removeItem){},

        /**
         * Adds a listener to remove an item in the selected items list.
         * @param removeItem: The node clicked on to remove the item.
         * @param item: The data of the item.
         */
        _onRemoveItem: function(removeItem, item){
            var self = this;
            var items = this.selectedItems;
            this.own(on(removeItem, "click", function(){
                delete items[item[self.searchAttr]];
                item.checked = false;
                domConstruct.empty(self.selectedItemsAttachPoint);
                self._displaySelectedItems();
                self._setDisplayCount();
                self.onChange(self.value, self.values, "removeSelectedItem");
            }));
        },

        /**
         * Clears selected items if multiple is specified.
         */
        clearSelectedItems: function(){
            var self = this;
            if (this.multiple && this.selectedItems){
                domConstruct.empty(this.selectedItemsAttachPoint);
                var items = this.selectedItems;
                if (!Object.keys) {
                    Object.keys = this._getObjectKeys(items);
                }
                var keys = Object.keys(items);
                var length = keys.length;
                this._numberOfSelectedItems = length;
                var i = 0;
                for (i = 0; i < length; i++){
                    var tempItem = items[keys[i]];
                    tempItem.checked = false;
                }
                this.selectedItems = {};
                this._numberOfSelectedItems = 0;
                self._setDisplayCount();
            }
        },

        /**
         * Places this widget at a given domNode.
         * @param attachPoint: The node to attach this widget to.
         * @return The widget.
         */
        placeAt: function(attachPoint){
            if (attachPoint){
                domConstruct.place(this.domNode, attachPoint);
            }
            this.startup();
            return this;
        }

    });
});

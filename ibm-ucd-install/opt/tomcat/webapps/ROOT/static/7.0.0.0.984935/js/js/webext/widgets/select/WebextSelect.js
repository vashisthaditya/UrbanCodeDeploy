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
        "dojo/when",
        "dijit/form/FilteringSelect",
        "js/util/loading/LoadingSpinner"
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
        when,
        FilteringSelect,
        LoadingSpinner
) {
    /**
     * This is a standard drop-down widget for Webext which provides infinite scrolling and
     * lazy-loading list contents.
     *
     * store: The data store of items to show in the drop down.
     *
     * defaultQuery (object): Query to apply to all requests to populate the list. Only applies when using a URL and JSON store.
     *                        { description: "*contains this text*" }
     *                        The object is converted to a URL query using standard object-to-query mechanisms.
     *
     * pageSize (integer): The number of items to fetch for each page.
     *
     * searchAttr (string): The attribute to use for each item to get value of each menu item. Default 'name'
     *
     * queryExpr (string): whether to match the search string as "begins with" "contains" or "ends with"
     *                     default: "${0}*"                          "${0}*",   "$*{0}*",      "$*{0}"
     *                     XXX: queryExpr other than "${0}*" should only be used in conjunction with autocomplete:false, as
     *                     autocompleting `contains` or `ends with` has buggy UI consequences.
     *                     See: https://bugs.dojotoolkit.org/ticket/17353
     *
     * value: value for select. Set to the 'ID' of selected item. To get data object, use get("item")
     *
     * displayedValue: value for select. Set to the `searchAttr` of selected item.  Fires a query to resolve to a value.
     *
     * autoSelectFirst (boolean): Select first option if no default value is given. Default: false.
     *
     * allowNone (boolean): Display none value in drop down. Default: false. Not available if multiple === true.
     *
     * required (boolean): If value is required. Default: false.
     *
     * readOnly (boolean): If drop down is read-only. Default: false.
     *
     * maxHeight (integer): Max height in pixels of the drop down menu.
     *
     * enforceTranslatedDisplayValues (boolean) :enforce that the displayed value should always be translated.
     *
     * ~ FUNCTIONS ~
     *
     * onChange(value, item)
     *     Function when value of drop down is changed. (Does not fire on setting of the initial value)
     *     @param value: The value of the drop down (Usually the id)
     *     @param item: The entire data item (object) of the selected value.
     *
     * onSetItem(value, item)
     *     Function when value of drop down is initially loaded OR is changed.
     *     This is useful when you need to take some action as soon as you've loaded the full data
     *     for the selected item, even if it does not represent a change from a previous value.
     *     @param value: The value of the drop down (Usually the id)
     *     @param item: The entire data item (object) of the selected value.
     *
     * onFilterResult(result)
     *     Function to filter result obtained from backend if desired.
     *     @param result: an array obtained from backend REST call
     *     @returns an array after running through any front-end filters
     *
     * formatDropDownLabel(labelDomNode, item)
     *     Add style to an item in the drop down.
     *     @param labelDomNode: The item label node
     *     @param item: The data for the item
     *
     * onQueryError(error)
     *     Function to run when the store.query call fails.
     *
     */
    return declare('js.webext.widgets.select.WebextSelect', [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="webext-select combo-check-box-select filtering-scroll-select">' +
                '<div class="combo-box-attach" data-dojo-attach-point="comboBoxAttachPoint"></div>' +
            '</div>',

        store: null,
        displayedValue: null,
        searchAttr: "name",
        value: "", // <-- if we do not set a default value, Form cannot detect this widget as a source
                   //     of data (value).
        queryExpr:"${0}*", //one of "${0}*", "$*{0}*", "$*{0}"
        pageSize: 30,
        maxHeight: 280,
//      defaultQuery: {}, Commented to avoid having this set on every instance, but still supported
        allowNone: false,
        autoSelectFirst: false,
        readOnly: false,
        required: false,
        trim: false,
        validate: true,
        enforceTranslatedDisplayValues: false,

        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            this._createDropDownWidget();
            this._attachDropDownEvents();

            // If we allow 'none' as a value, add a 'x' to clear any selected value when present.
            // (Mutually exclusive with the 'required' flag and the 'readOnly' flag)
            if (!self.required && self.allowNone && !self.readOnly) {
                dojo.addClass(this.comboBoxAttachPoint, "allowsNone");
                var clearContainer = domConstruct.create("div", {
                    className: "clear-container"
                }, self.dropDown.domNode);
                var clearIcon = domConstruct.create("div", {
                    className: "icon_delete",
                    title: i18n("Clear Selection")
                }, clearContainer);
                this.own(on(clearIcon, "click", function() {
                    self.dropDown.set('value', '', undefined, undefined, '');
                }));
            }

            self._setInitialValue();

            // Before showing the dropdown, attach a few event listeners and function interceptors
            // to handle the infinite-scroll behavior.
            // _startSearch is a common entry point for pretty much every behavior which starts
            // loading the list contents.
            // Initially defined by _AutoCompleterMixin
            aspect.after(self.dropDown, "_startSearch", function() {
                if (self._spinner){
                    self._spinner.show();
                }
                var dropDownScroller = self.dropDown.dropDown;
                if (!dropDownScroller._webextData) {
                    self._setupInfiniteScroll(dropDownScroller);
                    self._setupStylingInterceptors(dropDownScroller);
                }
            });

            // This allows us to perform special logic if a query fails.
            aspect.after(self.store, 'query', function(queryResults) {
                when(queryResults,
                        function() {
                            // This is where you could handle logic on a successful query.
                            // However, Dojo already provides this via the onSearch attribute
                            // inherited via _SearchMixin.js. It might be nicer to use that instead.
                        },
                        function(err) {
                            // Handle unsuccessful query logic (ignoring cancelled queries)
                            if (!(err.dojoType && err.dojoType === 'cancel')) {
                                self.onQueryError(err);
                                if (self._spinner){
                                    self._spinner.hide();
                                }
                            }
                        });
                return queryResults;
            });
        },

        /**
         * Creates the filtering drop down widget.
         */
        _createDropDownWidget: function() {
            var self = this;

            this.dropDown = new FilteringSelect({
                autoComplete: false,
                labelAttr: self.searchAttr,
                maxHeight: self.maxHeight,
                pageSize: self.pageSize,
                placeHolder: self.placeHolder,
                query: self.defaultQuery || {},
                readOnly: self.readOnly || false,
                required: self.required || false,
                searchAttr: self.searchAttr,
                queryExpr: self.queryExpr,
                store: self.store,
                style: self.style
            });

            self.dropDown.placeAt(self.comboBoxAttachPoint);

            this._spinner = new LoadingSpinner({
                color: "blue"
            }).placeAt(self.dropDown);
        },

        _attachDropDownEvents: function() {
            var self = this;

            self.dropDown.on("change", function(value) {
                var item = self.dropDown.item;
                if (item) {
                    self.onChange(value, item);
                }
                else {
                    self.onChange(null, item);
                }
            });
            self.dropDown.own(on(self.dropDown, "blur", function(){
                if (self._spinner){
                    self._spinner.hide();
                }
            }));

            aspect.after(self.dropDown, "_setValueAttr",
                function(value, priorityChange, displayedValue, item) {
                    // If we had set a placeholder while waiting to load, remove its styling now.
                    domClass.remove(self.dropDown.domNode, "dijitPlaceHolder");

                    if (item) {
                        domClass.add(self.domNode, "has-value");
                        self.onSetItem(value, item);
                    }
                    else {
                        domClass.remove(self.domNode, "has-value");
                        self.onSetItem(null, item);
                    }
                    if (self.enforceTranslatedDisplayValues) {
                        self._onSelectItem();
                    }
                }, true
            );

            if (this.enforceTranslatedDisplayValues) {
                aspect.after(self.dropDown, "_announceOption",
                    function(value, priorityChange, displayedValue,item) {
                        self._onSelectItem();
                    }, true
                );
            }
        },

        _setInitialValue: function() {
            var self = this;

            if (self.value) {
                // Set once to fill in the existing value and again to try to load the full object
                // for the existing value. If that fails (lack of permissions, object is gone, etc)
                // we'll at least show the ID as the label.
                this.dropDown.set("value", self.value, false, self.value+"...", {});

                // Also, add the placeholder class so it shows differently than an actual value
                // until we successfully load one.
                domClass.add(this.dropDown.domNode, "dijitPlaceHolder");

                // ...and, this call will actually try to get the full value.
                this.dropDown.set("value", self.value);
            } else if (self.displayedValue) {
                // using FilteringSelect and ComboBox's displayedValue
                self.dropDown.set("displayedValue", self.displayedValue);
            }
            else if (self.autoSelectFirst) {
                // Get the first object to appear in the list if we've enabled autoSelectFirst
                // (Mutually exclusive with 'value')
                var queryResult = self.store.query(self.defaultQuery || {}, {count: 1});
                queryResult.forEach(function(item) {
                    self.dropDown.set('item', item, false, item[self.searchAttr]);
                });
            }
        },

        _setupInfiniteScroll: function(dropDownScroller) {
            var self = this;

            // Use a special property on the scroller to mark that we've handled it and to store
            // whatever data we need to keep track of
            dropDownScroller._webextData = {
                isLoading: false
            };

            // Every time we scroll through the list, check to see if we're nearing the end of the
            // list so we can start loading the next page.
            dropDownScroller.on("scroll", function() {
                if (dropDownScroller.nextButton) {
                    // Get position of the list itself...
                    var panelPosition = domGeom.position(dropDownScroller.domNode);
                    var panelHeight = panelPosition.h;
                    var panelY = panelPosition.y;

                    // Get position of the "show more" button...
                    var nextPosition = domGeom.position(dropDownScroller.nextButton);
                    var nextHeight = nextPosition.h;
                    var nextY = nextPosition.y;

                    // Total number of pixels of scrolling before we'd see the end of the list
                    // (position of "show more" minus the current position in the list)
                    var distanceUntilEnd = nextY - (panelHeight + panelY);
                    if (distanceUntilEnd <= 200 && nextHeight !== 0 && !dropDownScroller._webextData.isLoading) {
                        dropDownScroller._webextData.isLoading = true;
                        dropDownScroller.onPage(1);
                    }
                }
            });

            // This is responsible for showing a new set of options.
            // Originally defined in _AutoCompleterMixin
            aspect.around(self.dropDown, "_openResultList", function(originalFunction) {
                return function() {
                    if (self._spinner){
                        self._spinner.hide();
                    }
                    var originalScroll = dropDownScroller.domNode.scrollTop;
                    var originalSelected = dropDownScroller.getHighlightedOption();

                    originalFunction.apply(self.dropDown, arguments);

                    // Reset the scroll position to where we were before it loaded the next page
                    dropDownScroller.set("selected", originalSelected);
                    dropDownScroller.domNode.scrollTop = originalScroll;

                    // Reset the loading flag so we can catch the next scroll event.
                    dropDownScroller._webextData.isLoading = false;
                };
            });

            // This is called any time we throw new options into the dropdown (on first open or
            // loading next page, responding to a user typing for autocomplete, etc)
            // Originally defined in _ComboBoxMenuMixin
            aspect.around(dropDownScroller, "createOptions", function(originalFunction) {
                return function(results, options, labelFunc) {
                    var filteredResults = self.onFilterResult(results);
                    // The original function wipes out the "items" collection in favor of what was
                    // just loaded. Instead of that, make sure we accumulate all options so far.
                    var currentItems = dropDownScroller.items || [];
                    originalFunction.apply(dropDownScroller, [filteredResults, options, labelFunc]);

                    // If this is happening while loading the next page, do not clear the existing
                    // items - concatenate them with the new list of results.
                    if (dropDownScroller._webextData.isLoading) {
                        dropDownScroller.items = currentItems.concat(filteredResults);

                        if (dropDownScroller.nextButton) {
                            // We need to correct the item indexes on option DOM nodes because they were
                            // generated based on the first item in the new result set, not the first
                            // item in the overall list.
                            // Get the previous sibling of the "next" button, and work back from there
                            // until we find the option with item index #0.
                            var newOption = dropDownScroller.nextButton.previousSibling;
                            var itemIndex;
                            while (newOption) {
                                itemIndex = Number(newOption.getAttribute("item"));
                                newOption.setAttribute("item", itemIndex+currentItems.length);

                                // Keep going until we get to the first new option added here, which
                                // will have had an index of 0. Before that will either be empty or
                                // a higher number from a previous page.
                                if (itemIndex === 0) {
                                    newOption = null;
                                }
                                else {
                                    newOption = newOption.previousSibling;
                                }
                            }
                        }
                    }

                    // Always hide the "previous page" button, since we never take anything off
                    // the list
                    if (dropDownScroller.previousButton) {
                        dropDownScroller.previousButton.style.display = "none";
                    }
                    if (dropDownScroller.nextButton) {
                        dropDownScroller.nextButton.innerHTML = i18n("Loading...");
                    }
                };
            });

            // We override default behavior for clearing the result list when loading a new page
            // of options, because we want to accumulate all options.
            // Originally defined in _ComboBoxMenuMixin
            aspect.around(dropDownScroller, "clearResultList", function(originalFunction) {
                return function() {
                    if (!dropDownScroller._webextData.isLoading) {
                        // This is a fresh open of the list - reload results as usual.
                        originalFunction.apply(dropDownScroller, arguments);
                    }
                    // Otherwise, don't call the original function as it basically closes/opens the
                    // list, which makes us lose our existing options and is unnecessary work.
                };
            });
        },

        _setupStylingInterceptors: function(dropDownScroller) {
            var self = this;

            // Intercept the call to create the DOM for the option in the drop-down list so we
            // can apply styling to it
            // Originally defined in _ComboBoxMenuMixin
            aspect.around(dropDownScroller, "_createOption", function(originalFunction) {
                return function(item, labelFunc) {
                    var result = originalFunction.apply(dropDownScroller, arguments);
                    self.formatDropDownLabel(result, item);
                    return result;
                };
            });
        },

        /**
         * Add style to an item in the drop down.
         * @param labelDomNode: The item label node
         * @param item: The data for the item
         */
        formatDropDownLabel: function(labelDomNode, item) {
            // no-op by default
        },

        // Pass any setting of a value into the dropdown
        _setValueAttr: function(value) {
            // If we haven't created the dropdown yet, then we can't do this. The value will be
            // passed into the dropdown when it's created, which comes after this in that case.
            if (this.dropDown) {
                this.dropDown.set("value", value);
            }
        },

        // Pass displayedValue to dropDown so that we can have an initial user-friendly value
        // this method is not called if WebextSelect has a value.
        _setDisplayedValueAttr: function(value) {
            // If we haven't created the dropdown yet, then we can't do this. The value will be
            // passed into the dropdown when it's created, which comes after this in that case.
            if (this.dropDown) {
                this.dropDown.set("displayedValue", value);
            }
        },

        // Defer to the dropdown to get value
        _getValueAttr: function() {
            return this.dropDown.get("value");
        },

        // Defer to the dropdown to get the selected item
        _getItemAttr: function() {
            return this.dropDown.get("item");
        },

        onChange: function(value, item) {
            // Placeholder for onChange event
        },

        _onSelectItem: function() {
            this._setTextDisplayedValue(i18n(this._getTextDisplayedValue()));
        },

        onSetItem: function(value, item) {
            // Placeholder for onSetItem event
        },

        onQueryError: function(error) {
            // Placeholder for onQueryError event
        },

        // Placeholder
        onFilterResult: function(result) {
            return result;
        },

        focus: function() {
            // Placeholder for focus action
        },

        /**
         * This method is used to push a translated value into the textbox of the Select widget
         */
        _setTextDisplayedValue: function(value) {
            if (this.dropDown && this.dropDown.textbox && this.dropDown.textbox.value) {
                this.dropDown.textbox.value = value;
            }
        },

        /**
         * This method is used to pull an untranslated value from the textbox of a Select widget for translation purposes.
         */
        _getTextDisplayedValue: function() {
            if (this.dropDown && this.dropDown.textbox && this.dropDown.textbox.value) {
                return this.dropDown.textbox.value;
            }
            return null;
        }
    });
});

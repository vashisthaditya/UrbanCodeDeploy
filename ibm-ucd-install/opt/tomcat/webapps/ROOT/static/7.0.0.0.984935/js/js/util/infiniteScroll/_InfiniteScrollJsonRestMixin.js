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
        "js/util/infiniteScroll/_InfiniteScrollMixin",
        "dojo/store/JsonRest",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/on",
        "dijit/form/TextBox",
        "js/webext/widgets/FormDelegates"
        ],
function(
        declare,
        _InfiniteScrollMixin,
        JsonRest,
        domClass,
        domConstruct,
        on,
        TextBox,
        FormDelegates
) {
    /**
     * This mixin provides additional functionality to the _InifinteScrollMixin by adding helper functions
     * for paging a JsonRest store.
     *
     * store (JSONRest Store): The store to use to load more items.
     *
     * url (String): The URL to build a store from if not store is provided.
     *
     * idAttribute (String): Attribute to search the store.
     *
     * itemsPerPage (Integer): Number of items to load per rest call.
     *
     * noItemsLabel (String): Label to show when no items exist.
     *
     * query (object): Optional query params. Can also pass in a query in the searchItem function.
     */
    return declare([_InfiniteScrollMixin],
        {
            store: null,
            url: null,
            idAttribute: "id",
            itemsPerPage: 15,
            noItemsLabel: null,
            //query: {},

            //-------------------------------------------------------------------------------
            // Functions to be overridden
            //-------------------------------------------------------------------------------
            /**
             * Event runs when items are loaded.
             * @param [array] items: The array of loaded items.
             * @param {integer} total: Total number of items.
             * @param {boolean} isThereMore: If there are additional items available to load.
             */
            onLoadMoreItems: function(items, total, isThereMore){},

            onPreLoad: function(){}, // Runs before items are loaded.

            onPostLoad: function(){}, // Runs after all items are loaded.

            onNoItemsFound: function(){}, // Runs when no items are found.

            clearList: function(){}, // Function that should clear the result list.

            /**
             * Optional Override.
             * Creates and determines when to hide or show a "loading more" container.
             *
             * NOTE: Specify a loadingMoreAttachPoint in the templateString to work.
             * @param {boolean} show: True to show loading dialog.
             * @param {boolean} showLoading: True if list is currently loading items. Determines if "Loading..." is shown.
             * @param {boolean} noItems: True if no items are found. Determine if "No items found" is shown.
             */
            displayLoadingContainer: function(show, showLoading, noItems){
                var self = this;
                if (this.loadingMoreAttachPoint){
                    if (!this._loadingMoreContainer){
                        this._loadingMoreContainer = domConstruct.create("div", {
                            className: "infinite-scroll-loading-more-container"
                        }, this.loadingMoreAttachPoint);

                        on(this._loadingMoreContainer, "click", function(){
                            self.loadMoreItems(function(){
                                self.notLoadingMore = true;
                            });
                        });
                        domClass.add(this.loadingMoreAttachPoint, "hidden");
                    }
                    domConstruct.empty(this._loadingMoreContainer);
                    if (showLoading){
                        domConstruct.create("div", {
                            className: "infinite-scroll-loading-more-container-text",
                            innerHTML: i18n("Loading...")
                        }, this._loadingMoreContainer);
                    }
                    else if (noItems){
                        domConstruct.create("div", {
                            className: "infinite-scroll-loading-more-container-text",
                            innerHTML: self.noItemsLabel || i18n("No items found")
                        }, this._loadingMoreContainer);
                    }
                    else {
                        domConstruct.create("div", {
                            className: "infinite-scroll-loading-more-container-text linkPointer",
                            innerHTML: i18n("Scroll up or click to load more items")
                        }, this._loadingMoreContainer);
                    }
                    if (show){
                        domClass.remove(this.loadingMoreAttachPoint, "hidden");
                    }
                    else {
                        domClass.add(this.loadingMoreAttachPoint, "hidden");
                    }
                }
            },

            //-------------------------------------------------------------------------------
            // Public functions
            //-------------------------------------------------------------------------------
            /**
             * Creates the event when the element is scrolled to the bottom.
             */
            setupScroll: function(options) {
                var self = this;
                if (options.store){
                    this.store = options.store;
                }
                else if (!this.store && options.url){
                    this.url = options.url;
                    this.createStore();
                }

                if (options.query){
                    this.query = options.query;
                }
                if (options.scrollNode){
                    this.scrollNode = options.scrollNode;
                }
                if (options.scrollContainer){
                    this.scrollContainer = options.scrollNode;
                }
                if (options.bottomOffset){
                    this.bottomOffset = options.bottomOffset;
                }
                if (options.noItemsLabel){
                    this.noItemsLabel = options.noItemsLabel;
                }
                // Keeping track of item counts.
                this._store = {
                    total: -1
                };
                if (options.initialLoad){
                    this.loadMoreItems();
                }
                this.addScrollListener();
                this.displayLoadingContainer(true, true);
            },

            /**
             * Creates the JSON Rest store to load items from.
             */
            createStore: function(){
                var self = this;
                this.store = new JsonRest({
                    target: self.url,
                    idAttribute: self.idAttribute || "id"
                });
            },

            /**
             * An event to fire when element is scrolled to bottom. Must run callback() last to reset
             * scroll function.
             */
            onScrollBottom: function(callback) {
                this.loadMoreItems(callback);
            },

            /**
             * Function to run when filtering
             *
             * @param {String} searchString: The name to search for in the store
             * @param {object} options: {
             *     {String} searchString: The attribute to search on. Default: name.
             *     {Object} query: Filter query for the store
             *     {Boolean} reset: If true, reset and clear results.
             * }
             */
            searchItem: function(searchString, options){
                var self = this;
                var searchAttr = options.searchAttr || 'name';
                if (options.reset){
                    searchString = "";
                }
                self._query = null;
                if (options.query){
                    self._query = options.query;
                }
                else if (searchString){
                    self._query = {
                        name: searchString
                    };
                    if (options.outputType){
                        self._query.outputType = options.outputType;
                    }
                    if (options.orderField){
                        self._query.orderField = options.orderField;
                    }
                }
                else {
                    self._query = self.query;
                }

                self.options = {};
                self.options[searchAttr] = searchString;
                if (!self._isSearching && !(self._previousSearch === searchString)){
                    self._isSearching = true;
                    self.resetIndex();

                    // Show loading... when clearing list.
                    self.displayLoadingContainer(true, true);
                    self.clearList();
                    var callback = function(){
                        self.notLoadingMore = true;
                        self._isSearching = false;
                    };
                    self.loadMoreItems(callback);
                    self._previousSearch = searchString;
                }
            },

            /**
             * Create a filter from FormDelegates.
             * @param {object} options
             */
            createFilter: function(options){
                var result = null;
                if (options.type){
                    var Delegate = new FormDelegates().getDelegate(options.type);
                    if (Delegate){
                        // ClassNames passed to drop downs behave differently than other widgets.
                        // Pick out class name and apply after.
                        var className = options.className;
                        if (options.className){
                            delete options.className;
                        }
                        result = new Delegate(options);
                        if (result.domNode && className){
                            domClass.add(result.domNode, className);
                        }
                    }
                }
                return result;
            },

            /**
             * Resets search index of store.
             */
            resetIndex: function(){
                this._store.startIndex = 0;
                this._store.endIndex = this.itemsPerPage - 1;
                this.searchOptions = {
                    start: 0
                };
            },

            /**
             * Increments search index of store.
             */
            incrementIndex: function(){
                this.searchOptions = {
                    start: this._store.startIndex
                };
                this._store.startIndex = this._store.endIndex + 1;
                this._store.endIndex = this._store.startIndex + this.itemsPerPage - 1;
            },

            /**
             * Loads more results
             * @param {function} callback
             */
            loadMoreItems: function(callback){
                var self = this;
                if (!this._store.endIndex){
                    this.resetIndex();
                }
                this.store.headers = {
                    Range: "items=" + self._store.startIndex + "-" + self._store.endIndex
                };
                this.onPreLoad();
                try {
                    var results = self.store.query(self._query || self.query);
                    if (this._store.total === -1 || this._store.startIndex <= this._store.total){
                        self.incrementIndex();
                        self.displayLoadingContainer(true, true);
                        results.then(function(data){
                            results.total.then(function(total){
                                var showMore = self._store.startIndex <= total;
                                self._store.total = total;
                                self.onLoadMoreItems(data, total, showMore);
                                self.displayLoadingContainer(showMore);
                                if (total === 0){
                                    self.displayLoadingContainer(true, false, true);
                                    self.onNoItemsFound();
                                }
                                self.onPostLoad();
                                setTimeout(function(){
                                    if (callback){
                                        callback();
                                    }
                                }, 100);
                            });
                        });
                    }
                }
                catch (exception){
                    if (callback){
                        callback();
                    }
                }
            }

        }
    );
});

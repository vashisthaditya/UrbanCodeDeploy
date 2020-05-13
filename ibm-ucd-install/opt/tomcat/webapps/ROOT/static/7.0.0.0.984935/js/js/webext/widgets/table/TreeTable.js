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
/*global define, _ */
define([
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/event",
        "dojo/_base/lang",
        "dojo/_base/sniff",
        "dojo/_base/xhr", // legacy dojo.xhr backing for dojo.xhr* methods
        "dojo/aspect",
        "dojo/dom-attr",
        "dojo/dom-class",
        "dojo/dom-geometry",
        "dojo/dom-construct",
        "dojo/dom-style",
        "dojo/json",
        "dojo/on",
        "dojo/dnd/Manager",
        "dojo/dnd/Source",
        "dojo/query",
        "dojo/io-query",
        "dojo/topic",
        "dojo/window",
        "dojo/Deferred",
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dijit/_WidgetBase",
        "dijit/registry",
        "dojox/html/entities",
        "js/util/blocker/_BlockerMixin",
        "js/webext/widgets/table/_TableFilteringMixin",
        "js/webext/widgets/table/_TableSortingMixin",
        "js/webext/widgets/table/_TableSelectableMixin",
        "js/webext/widgets/table/_TableConfigMixin",
        "js/webext/widgets/table/_TableHeaderFooterMixin"
        ],
function(
        array,
        declare,
        baseEvent,
        lang,
        sniff,
        baseXhr,
        aspect,
        domAttr,
        domClass,
        domGeom,
        domConstruct,
        domStyle,
        JSON,
        on,
        Manager,
        DndSource,
        query,
        ioQuery,
        topic,
        dojoWindow,
        Deferred,
        _TemplatedMixin,
        _Widget,
        _WidgetBase,
        registry,
        entities,
        _BlockerMixin,
        _TableFilteringMixin,
        _TableSortingMixin,
        _TableSelectableMixin,
        _TableConfigMixin,
        _TableHeaderFooterMixin
) {

    /**
     * A general purpose table widget, with pagination, sorting, and custom formatting. Uses an actual
     * HTML table for display. Contains tree behavior for hierarchies of data.
     *
     * Pagination, sorting, and filtering are ideally supported by the rest service. Rest
     * services built to perform these operations must return an object of the format:
     *  {
     *      totalRecords: ##,
     *      records: [
     *          {record}, ...
     *      ]
     *  }
     *
     * Optionally, these operations can be performed on the client side, given the full list of rows
     * for the table. In this case, the rest service need only return an array of records.
     *
     * Supported properties:
     *  rowsPerPage / Number                Initial number of rows per page.
     *                                      Default value: 10
     *  pageNumber / Number                 Initial page number.
     *                                      Default value: 1
     *  pageOptions / [Number]              An array of numbers to show as valid numbers of rows per
     *                                      page. Default is [10, 25, 50, 100, 250].
     *  orderField / String or [String]     Initial field name to sort results by OR
     *                                      Array of initial field names to sort results by. Each index in the array
     *                                      corresponds to a nesting level. IE - ['foo', 'bar'] will sort the root rows
     *                                      by column 'foo', and their children by 'bar'.
     *                                      Default value: null (not sorted)
     *  sortType / String                   Sort direction. Either "desc", or "asc".
     *                                      Default value: asc
     *  baseFilters / Array                 Initial data for the filter to always use when getting data.
     *      name / String                   Name of the field being filtered.
     *      type / String                   Type of the field being filtered.
     *      values / [String]               Array of values to filter by.
     *      className / String              The name of the class which values should be converted to
     *                                      when filtering. For supported values, see filterClass
     *                                      documentation in columns documentation below.
     *  serverSideProcessing / Boolean      Specifies whether table operations are performed by the
     *                                      rest service or on the client side.
     *                                      Default value: true
     *  hideFooter / Boolean                Hides the entire table footer
     *  hideFooterLinks / Boolean           Hides the "refresh" and "print" links in the footer
     *  hidePagination / Boolean            Hides the pagination options and turns off pagination.
     *  allowHeaderLocking / Boolean        Whether or not to snap the header and footer to the top
     *                                      and bottom of the screen when they have scrolled off.
     *
     *  tableConfigKey / String             The key to use in the table storage cookie to save the
     *                                      user's settings for the table.
     *  noDataMessage / String              Message to show when no records are found.
     *  url / String                        The URL of the rest service to retrieve data from.
     *  data / Array                        Preloaded data to show in the table.
     *  getData / Function                  Function to return all data for the table (instead of
     *                                      providing it all upfront in the data property).
     *  processXhrResponse / Function       Accepts a function which can perform extra operations on
     *                                      data retrieved via an Xhr call, before the standard
     *                                      operations are performed.
     *  queryData / Object                  An object to be parsed into a query string, which will
     *                                      be appended to the request URL.
     *  selectable / Boolean                Include a column containing a checkbox.
     *                                      this.selectedItems will include an array of any
     *                                      object values which have been selected.
     *                                      items that will be returned with the getSelectedData function
     *
     *  style / CSS Style Object            Styling to apply to the tree table widget. Optional.
     *  class / css class                   The class to apply to the tree table widget. Optional.
     *
     *  columns / Array                     Array of column definitions.
     *      name / String                   Column label
     *      description / String            Text to use in a popup tooltip for the column
     *      field / String                  Name of the property in the row data to get a value from.
     *                                      The value retrieved will be the text contents of the cell.
     *      orderField / String             Field name given to the rest service when the results are
     *                                      being sorted by this column. Without this property, the
     *                                      column will not be sortable.
     *      filterField / String            Field name given to the rest service when the results are
     *                                      being filtered by this column. Without this property, the
     *                                      column will not be filterable.
     *      filterType / String             Type of widget to use for the filtering operation. Valid
     *                                      values are:
     *                                          text
     *                                          textExact
     *                                          date
     *                                          select
     *                                          filteringSelect
     *                                          filteringCombo
     *                                          custom
     *      getFilterFields / Array         Required if using 'custom' filterType. This needs to be an
     *                                      array containing the widgets that will be used for filtering
     *                                      a column. Each widget is required to have these functions:
     *                                          filterPass(item, value) / Boolean: this handles the
     *                                            actual logic of filtering. Where 'item' is the item
     *                                            being filtered, and 'value' is the value of the
     *                                            widget through widget.get("value").
     *      filterClass / String            The name of the class which values should be converted to
     *                                      when filtering. Current supported values are:
     *                                          Boolean
     *                                          Long
     *                                          String (default)
     *                                          UUID
     *      filterUrl / String              URL to use when supplying the filter with values. Only
     *                                      used when the type is filteringSelect or filteringCombo.
     *      filterOptions / Array           Options to show in the filter. Only used when the type is
     *                                      select.
     *          label / String
     *          value / String
     *      getRawValue / Function          Function which returns the raw (sort/filter) value of the
     *                                      column given a row of data as the argument. Must be
     *                                      provided for any sortable/filterable columns when using
     *                                      client-side processing. Not used with server-side
     *                                      processing unless using view manipulation methods.
     *      style / CSS Style Object        Style object to apply to all cells in the column.
     *      class / css class               apply class to all cells in this column
     *      styleHeading / CSS Style Object Style object to apply to the heading cells in the column, in addition to "style"
     *      formatter / Function            Function to use for custom cell contents. The formatter
     *                                      calls have this definition:
     *                                      formatter(row, result, cellDom)
     *                                      row: Data for the table row.
     *                                      result: Text value retrieved using the "field" column
     *                                              property, if applicable.
     *                                      cellDom: DOM node of the cell to be filled. Useful for
     *                                               attaching custom styles to the cell.
     *                                      Formatters can return a string, a DOM node, or a widget.
     *      headingFormatter / Function     Function to use for custom header cell contents. The
     *                                      formatter calls have this definition:
     *                                      headingFormatter(cellDom)
     *                                      cellDom: DOM node of the header cell to be filled.
     *      beforeExpander / Boolean        Determines if the tree expand icon can be shown in this column
     *      parentWidget / Widget           Not used explicitly by the table. But, as a matter of
     *                                      convention, set a column's parentWidget to the containing
     *                                      widget if the column's formatter needs access to it. It
     *                                      will be available in the formatter as: this.parentWidget
     *  baseFilters / Array
     *      name / String                   Name of the field being filtered.
     *      type / String                   Type of the field being filtered.
     *      values / [String]               Array of values to filter by.
     *      className / String              The name of the class which values should be converted to
     *                                      when filtering. For supported values, see filterClass
     *                                      documentation in columns documentation below.
     *
     *  alwaysShowFilters / Boolean         Whether to always show the filters (default: true)
     *  applyRowStyle / Function            Function to run on every row to apply custom classes or
     *                                      styling. Arguments: (item, row DomNode)
     *
     *  itemPasses / Function               When using client-side filtering, the itemPasses function
     *                                      can be specified to determine if a row should be shown.
     *                                      Signature: itemPasses(rowItem)
     *
     * Tree-specific properties:
     *  draggable / Boolean                 Whether the contents of this TreeTable are draggable
     *  onDrop / Function                   Function to call when items are dropped. Arguments are:
     *                                      (sources, target, copy)
     *                                      sources: Array of objects moved
     *                                      target: The object they were moved into
     *                                      copy: Whether or not this is a copy operation
     *                                      before: True if the drop is before the target, false if after
     *
     *  canDragItem / Function              Function to call to determine whether a given object can be
     *                                      dragged. Arguments are: (item)
     *  canDropOnItem / Function            Function to call to determine whether source items can
     *                                      be dropped on the given target. Arguments are: (sources, target)
     *  copyOnly / Boolean                  Whether items can only be copied out of this tree, not moved
     *  suppressDefaultOnDrop / Boolean     Whether Dojo's default on-drop behavior of putting the dragged
     *                                      DOM node in the tree should be ignored (as in when the data
     *                                      will be refreshed anyway)
     *
     *  idAttribute / String                Name of the uniquely identifying field from the JSON
     *  onRowSelect / Function              Function to call when a row is clicked. Arguments: item, row
     *  rowPadding / Number                 Padding in pixels added to each hierarchical level (Default: 25)
     *  hideExpandCollapse / Boolean        Whether or not to hide the expand all/collapse all links at the
     *                                      top right above the table. Default is false.
     *
     *  collapseImageClass / String         Name of the image class to use for the collapse icon for rows.
     *                                      Default is 'collapseImage'
     *  expandImageClass / String           Name of the image class to use for the expand icon for rows.
     *                                      Default is 'expandImage'
     *  expandCollapseAllLinkClass / String Name of the class to use for the expand/collapse all links.
     *                                      Default is 'linkPointer'
     *  expandRoots / Boolean            Whether or not to expand the top level nodes.
     *                                      Default is false
     *
     *  rowObjects / Array of Object:       (Used for internal tracking)
     *      id / String                     The string ID generated for this particular row
     *      item / Object                   The actual data item for this row
     *      visible / Boolean               Whether this row has been filtered out or not
     *      matchesFilters / Boolean        Whether this row specifically matches the filters
     *      expanded / Boolean              Whether or not the row is expanded in the widget
     *      domNode / DOM Object            The DOM representation of the row for this object
     *      collapseDoms / [DOM Objects]    The DOM nodes of the row's expand/collapse icons (one per column)
     *      parent / Object                 The rowObject of which this is a child
     *
     *  getChildUrl                         Function to call when a row is expanded in order to get
     *                                      the url to retrieve the children json.
     *
     *  hasChildren                         Function to return whether or not a row has children rows. By
     *                                      default checks if item has children = true || false
     *
     *  getChildFilters / Function          Function to return the list of filters to be used for all children.
     *                                      If this is undefined, the filters in baseFilters will be used.
     *
     *  getChildOutputType / Function       Function that should return the list of JSON Output Types to request.
     *                                      If this is undefined, it will use the valued defined in defaultQuery.
     *
     *  floatCollapseSpace / Boolean        Will change the dom structure of the cell to float the collapse space
     *                                      left. If the cell content is too long for one line this will prevent
     *                                      the inner content taking a new line and causing the display to look bad
     *
     *  processData / Function              This method will need to return the data to be used. Care
     *                                      should be taken to not update the data if it is cached,
     *                                      instead returning a modified copy of the data.
     *                                      Defaults to returning the data passed in.
     *
     *
     */
    return declare(
        [_Widget, _TemplatedMixin, _BlockerMixin, _TableFilteringMixin, _TableSortingMixin,
         _TableConfigMixin, _TableHeaderFooterMixin, _TableSelectableMixin],
        {
            templateString:
                '<div style="position: relative;">' +
                    '<div data-dojo-attach-point="aboveTreeOptions" class="aboveTreeOptions">'+
                        '<div data-dojo-attach-point="tableTitleAttach" class="tableTitle"></div>' +
                        '<div data-dojo-attach-point="expandCollapseAttach" class="inlineBlock expandCollapse"></div>' +
                        '<div class="listTopButtons" data-dojo-attach-point="buttonAttach"></div>'+
                    '</div>'+
                    '<div data-dojo-attach-point="belowTreeOptions"></div>'+
                    '<div class="selectableTable webextTable treeTable" data-dojo-attach-point="tableContainerAttach">'+
                        '<table data-dojo-attach-point="tableAttach">'+
                            '<thead data-dojo-attach-point="theadNode">'+
                                '<tr data-dojo-attach-point="theadAttach"></tr>'+
                                '<tr data-dojo-attach-point="filterAttach" class="noPrint tableFilterRow"></tr>'+
                                '<tr data-dojo-attach-point="theadSizerAttach"></tr>'+
                            '</thead>'+
                            '<tr data-dojo-attach-point="tbodySizerAttach"></tr>'+
                            '<tfoot data-dojo-attach-point="tfootAttach" class="noPrint"></tfoot>'+
                        '</table>'+
                        '<div data-dojo-attach-point="footerSizerAttach"></div>' +
                    '</div>' +
                '</div>',

            serverSideProcessing: true,
            hideFooter: false,
            hideFooterLinks: false,
            hidePagination: true,
            allowHeaderLocking: true,
            rowObjects: null,
            rowObjectList: null,
            rowPadding: 25,
            idAttribute: "id",
            actionsTimer: null,
            draggable: false,
            hideExpandCollapse: false,
            totalRecords: undefined,
            rowsPerPage: 10,
            pageNumber: 1,
            tableTitle: "",
            getChildUrl: null,
            xhrMethod: "GET",
            collapseImageClass: "collapseImage",
            expandImageClass: "expandImage",
            expandCollapseAllLinkClass: "linkPointer",
            expandRoots: false,
            cachedData: null,
            _checkHeaderFooterLocksTimeoutId: null,
            _scrollListener: null,
            _resizeListener: null,

            /**
             *
             */
            constructor: function() {
                this.rowObjects = [];
                this.rowObjectList = [];
                this.expandedNodeList = [];
                this.actionsTimer = 0;
            },

            /**
             *
             */
            postCreate: function() {
                var self = this;
                self.inherited(arguments);

                if (!self.noDataMessage) {
                    self.noDataMessage = i18n("No records found.");
                }

                // Order of these matters.
                self.initSelectableMixin();
                self.initFilteringMixin();
                self.initConfigMixin();

                self.domNode.draggable = false;

                self.tableTitleAttach.textContent = self.tableTitle;

                if (!self.hideExpandCollapse) {
                    self._addExpandCollapseLinks();

                    domStyle.set(self.aboveTreeOptions, {
                        minHeight: "2em"
                    });
                }

                self.drawHeadings();

                if (self['class']) {
                    domClass.add(self.tableAttach, self['class']);
                }

                if (self.style) {
                    domStyle.set(self.tableAttach, self.style);
                }

                self.loadTable();

                self.attachHeaderFooterLockingEvents();

                if (util.getIE() !== null) {
                    domClass.add(self.domNode, "ie" + util.getIE());
                }
            },

            /**
             * Get the top level row objects (rows without a parent)
             */
            getTopLevelRowObjects: function() {
                var self = this;
                return array.filter(self.rowObjectList, function(rowObject) {
                    return !rowObject.parent;
                });
            },

            /**
             * Filter/customize cached data right at the beginning of showTable
             */
            processData: function(data) {
                return data;
            },

            /**
             * Display the table. If necessary, this will load data from the rest service.
             */
            loadTable: function() {
                var self = this;
                // Ensure pageNumber is an int instead of a string before proceeding
                self.pageNumber = parseInt(self.pageNumber, 10);

                self.saveCurrentSettings();

                if (!self.serverSideProcessing
                        && !!self.cachedData) {
                    // If the table is using client-side operations and already has data, just use that.
                    self.showTable(self.cachedData);
                }
                else if (self.data !== undefined) {
                    // Table is using preloaded data - just show that.
                    self.cachedData = self.data;
                    self.showTable(self.cachedData);
                }
                else if (self.getData !== undefined) {
                    self.cachedData = self.getData();
                    self.showTable(self.cachedData);
                }
                else {
                    // Show the loading spinner while waiting for a rest service.
                    self.block();

                    var xhrOpts = {
                            url: self.url,
                            handleAs: "json",
                            load: function(data, ioArgs) {
                                if (self.processXhrResponse) {
                                    self.processXhrResponse(data);
                                }

                                // If server side processing is off, cache the data for use in table operations.
                                if (!self.serverSideProcessing) {
                                    self.cachedData = data;
                                }

                                self.unblock();

                                var contentRange = ioArgs.xhr.getResponseHeader("Content-Range");
                                if (data.records && data.records.length === 0 && self.pageNumber !== 1) {
                                    self.pageNumber--;
                                    self.loadTable();
                                }
                                else if (self.serverSideProcessing && contentRange) {
                                    // The response took the form of an array with headers
                                    // indicating total content size. Reshape this data into what
                                    // TreeTable expects.
                                    // "Content-Range: 10-20/200" (showing 10-19 of 200 items)
                                    var totalRecords = contentRange.substring(
                                            contentRange.indexOf("/")+1);
                                    var firstRecord = contentRange.substring(0,contentRange.indexOf("-"));
                                    var lastRecord = contentRange.substring(contentRange.indexOf("-")+1,
                                            contentRange.indexOf("/"));

                                    if (Number(lastRecord) === Number(firstRecord) && self.pageNumber !== 1) {
                                        self.pageNumber--;
                                        self.loadTable();
                                    }
                                    else {
                                        data = {
                                            records: data,
                                            totalRecords: Number(totalRecords)
                                        };
                                        self.showTable(data);
                                    }
                                }
                                else {
                                    self.showTable(data);
                                }
                            },
                            error: function(data) {
                                self.unblock();
                                self.showError(data);
                            }
                    };
                    if (self.xhrMethod.toUpperCase() === "GET") {
                        xhrOpts.content = self._getQueryData();
                    }
                    else if (self.xhrMethod.toUpperCase() === "POST") {
                        xhrOpts.postData = JSON.stringify({expandedNodeList: self.expandedNodeList});
                        xhrOpts.headers = {"Content-Type": "application/json"};
                        var queryData = self._getQueryData();
                        queryData[bootstrap.expectedSessionCookieName] =
                            util.getCookie(bootstrap.expectedSessionCookieName);
                        xhrOpts.url = xhrOpts.url + "?" + ioQuery.objectToQuery(queryData);
                    }
                    self.tableDataDeferred = baseXhr(self.xhrMethod, xhrOpts);

                    // remove the deferred upon completion
                    self.tableDataDeferred.addBoth(function() {
                        self.tableDataDeferred = null;
                    });
                }
            },

            _getQueryData: function() {
                var self = this;
                var result = self.getFilterData(self.baseFilters);
                if (self.queryData) {
                    lang.mixin(result, self.queryData);
                }
                return result;
            },

            redraw: function() {
                if (this.serverSideProcessing) {
                    this.cachedData = null;
                    this.rowObjects = [];
                    this.rowObjectList = [];
                    this.totalRecords = undefined;
                }
                this.loadTable();
            },

            /**
             * Clear cached data, if present, and reload the table.
             */
            refresh: function() {
                this.cachedData = undefined;
                this.rowObjects = [];
                this.rowObjectList = [];
                this.setCheckboxState(false);
                this.loadTable();
            },

            /**
             * Clear row children, and reload the row.
             */
            _refreshRowChildren: function(rowObject) {
                this._emptyRow(rowObject);
                this.getNewChildren(rowObject);
            },

            /**
             * Clear row children, and reload the row for a given item.
             */
            refreshRowChildrenForItem: function(item) {
                var rowObject = this._getRowObjectForItem(item);
                if (!!rowObject) {
                    this._refreshRowChildren(rowObject);
                }
            },

            /**
             * Clear parent row children, and reload the parent row for a given item.
             */
            refreshSiblingsForItem: function(item) {
                var rowObject = this._getRowObjectForItem(item);
                var parent;
                if (!!rowObject) {
                    parent = rowObject.parent;
                }
                if (!!parent) {
                    this._refreshRowChildren(parent);
                }
                else {
                    this.loadTable();
                }
            },

            /**
             * Delete a row's children from the table.
             */
            _emptyRow: function(rowObject) {
                var self = this;
                var childIndex;
                array.forEach(rowObject.children, function(child) {
                    self._emptyRow(child);
                    self._deleteRowOnly(child);
                });
                rowObject.children = [];
                rowObject.item.children = [];
            },

            /**
             * Delete a row from the table.
             */
            _deleteRowOnly: function(rowObject) {
                var self = this;

                if (rowObject.domNode) {
                    array.forEach(registry.findWidgets(rowObject.domNode), self._destroyWidget);
                    domConstruct.destroy(rowObject.domNode);
                }

                delete self.rowObjects[rowObject.id];
                var rowObjectIndex = array.indexOf(self.rowObjectList, rowObject);
                if (rowObjectIndex !== -1) {
                    self.rowObjectList.splice(rowObjectIndex, 1);
                }
                if (!!rowObject.parent && !self.shouldShowCollapseDom(rowObject.parent)) {
                    array.forEach(rowObject.parent.collapseDoms, function(collapseDom) {
                        domStyle.set(collapseDom, "visibility", "hidden");
                    });
                }
            },

            /**
             *
             */
            showError: function(data) {
                domConstruct.empty(this.filterAttach);

                var footerRow = domConstruct.create("tr");
                var footerCell = domConstruct.create("td");
                footerCell.className = "webextTableFooter";
                footerCell.colSpan = this.columns.length;
                if (this.draggable) {
                    footerCell.colSpan++;
                }

                var footerWrapper = domConstruct.create("div");

                var errorSpan = domConstruct.create("span");
                var errorSeparator = domConstruct.create("br");
                var errorResponseSpan = domConstruct.create("span");
                errorSpan.innerHTML = i18n("An error has occurred.");
                errorSpan.style.fontSize = "medium";

                if (data.responseText) {
                    errorResponseSpan.innerHTML = i18n(data.responseText);
                    errorResponseSpan.style.fontSize = "medium";
                }

                footerWrapper.appendChild(errorSpan);
                footerWrapper.appendChild(errorSeparator);
                footerWrapper.appendChild(errorResponseSpan);
                footerCell.appendChild(footerWrapper);
                footerRow.appendChild(footerCell);

                this.tfootAttach.appendChild(footerRow);
            },

            /**
             *
             */
            showTable: function(data) {
                var self = this;

                //make any last minute changes the user may want to perform
                data = self.processData(data);

                //
                // Actual table data / body
                //
                if (self.tbody) {
                    if (self.dndContainer) {
                        self.dndContainer.destroy();
                    }

                    self.tableAttach.removeChild(self.tbody);
                    array.forEach(registry.findWidgets(self.tbody), self._destroyWidget);
                }
                self.tbody = domConstruct.create("tbody", {
                    className: "treeTable-body"
                });

                if (self.draggable) {
                    self.dndContainer = new DndSource(self.tbody, {
                        withHandles: true,
                        copyOnly: self.copyOnly,
                        onSelectStart: function() {
                            // Override this function so that text in DND nodes is selectable
                        },
                        creator: function(item, type) {
                            var result;
                            // If creating an avatar for DND operations, grab the content of the
                            // first meaningful column on this row and use that rather than the
                            // entire row.
                            if (type === "avatar") {
                                var firstRealCellIndex = 1;
                                if (self.selectable) {
                                    firstRealCellIndex++;
                                }

                                // "item" will be a string when making an avatar, so we need to turn
                                // it back into a normal DOM node and then get its children
                                var dummyNode = domConstruct.create("tr", {
                                    innerHTML: item
                                });
                                var firstCell = dummyNode.children[firstRealCellIndex];

                                // Delegate to the default creator to make the standard object, then
                                // simply override its DOM node.
                                result = this.defaultCreator.apply(this, arguments);
                                result.node = domConstruct.create("span", {
                                    innerHTML: firstCell.innerHTML
                                });
                            }
                            else {
                                result = this.defaultCreator.apply(this, arguments);
                            }
                            return result;
                        }
                    });

                    // We need to use aspect.around because after the normal onDndDrop function completes,
                    // the dnd action is cancelled, which alters the state of the Source in a way that breaks things for us
                    aspect.around(self.dndContainer, "onDndDrop", function(originalMethod) {
                        return function(source, nodes, copy, target) {
                            var before = source.before;
                            if (!self.suppressDefaultOnDrop) {
                                originalMethod.apply(this, arguments);
                            }
                            else {
                                originalMethod.apply(this, [source, [], copy, target]);
                            }

                            var nodeObjects = [];
                            var targetObject = null;

                            array.forEach(self.rowObjectList, function(rowObject) {
                                array.forEach(nodes, function(node) {
                                    if (rowObject.domNode === node) {
                                        nodeObjects.push(rowObject.item);
                                    }
                                });
                                if (rowObject.domNode === target.current) {
                                    self._expandAllParents(rowObject);

                                    targetObject = rowObject.item;
                                }
                            });

                            self.onDrop(nodeObjects, targetObject, copy, before);

                            self.lastCurrentDom = null;
                            self.lastBefore = null;
                        };
                    });

                    // To insert a tip about how to copy using DND, we have to look up the avatar
                    // and insert a DOM node into it. There's no other reasonable way to override
                    // creation of the avatar without reinventing the wheel.
                    aspect.after(self.dndContainer, "onDndStart", function() {
                        array.forEach(query("tr.dojoDndAvatarHeader td"), function(avatarHeader) {
                            if (avatarHeader.children.length === 1) {
                                var copyKey = "Ctrl";
                                if (sniff("mac")) {
                                    copyKey = "&#8984; Cmd";
                                }

                                domConstruct.create("div", {
                                    innerHTML: i18n("(Hold %s to copy)", copyKey),
                                    className: "inlineBlock dndCopyHint"
                                }, avatarHeader);
                            }
                        });

                        // Track the list of source items on the manager so it can be easily accessed
                        var manager = Manager.manager();
                        var sourceItems = [];
                        if (manager.source === self.dndContainer) {
                            array.forEach(manager.nodes, function(node) {
                                var sourceRowObject = self._getRowObjectForDomNode(node);
                                if (sourceRowObject) {
                                    sourceItems.push(sourceRowObject.item);
                                }
                            });
                            manager.sourceItems = sourceItems;
                        }
                    });

                    aspect.after(self.dndContainer, "onMouseMove", function() {
                        if (self.dndContainer.isDragging) {
                            var manager = Manager.manager();
                            var currentDom = self.dndContainer.current;
                            var currentBefore = self.dndContainer.before;

                            // Performance optimization: do not do this calculation if we have not
                            // changed which item we're hovering over.
                            if (self.lastCurrentDom !== currentDom || self.lastBefore !== currentBefore) {
                                self.lastCurrentDom = currentDom;
                                self.lastBefore = currentBefore;

                                var currentRowObject = self._getRowObjectForDomNode(currentDom);
                                if (currentRowObject) {
                                    if (!!self.canDropOnItem && !self.canDropOnItem(manager.sourceItems, currentRowObject.item)) {
                                        manager.canDrop(false);
                                    }
                                }
                            }
                        }
                    });

                    self.dndStartSubscription = topic.subscribe("/dnd/start", function() {
                        // If this treetable has a function to determine validity of drop targets,
                        // run through it and mark rows which can be dropped onto.
                        if (!!self.canDropOnItem) {

                            // This has to run with a timeout so it is always evaluated after the
                            // aspect.after we've done above for onDndStart.
                            setTimeout(function() {
                                var manager = Manager.manager();

                                var canDropDomNodes = [];
                                var cannotDropDomNodes = [];
                                array.forEach(self.rowObjectList, function(rowObject) {
                                    if (rowObject.item && rowObject.domNode) {
                                        domClass.remove(rowObject.domNode, "invalidDropTarget");
                                        domClass.remove(rowObject.domNode, "validDropTarget");

                                        if (self.canDropOnItem(manager.sourceItems, rowObject.item)) {
                                            canDropDomNodes.push(rowObject.domNode);
                                        }
                                        else {
                                            cannotDropDomNodes.push(rowObject.domNode);
                                        }
                                    }
                                });

                                // We only add any of these classes if there are any nodes we can't
                                // drop onto. Otherwise, we don't want to make the display too
                                // noisy when everything is droppable anyway.
                                if (cannotDropDomNodes.length > 0) {
                                    array.forEach(canDropDomNodes, function(domNode) {
                                        domClass.add(domNode, "validDropTarget");
                                    });
                                    array.forEach(cannotDropDomNodes, function(domNode) {
                                        domClass.add(domNode, "invalidDropTarget");
                                    });
                                }
                            }, 1);
                        }
                    });
                }

                // Gather the full set of sorted, filtered row objects. If these operations are handled
                // server-side, just convert the server-supplied data to row objects. Otherwise, convert
                // the full set of data to row objects, then apply filters and sort.
                var topLevelRowObjects = [];
                var displayData;
                if (lang.isArray(data)) {
                    // data is an array - get row objects and convert to a record object
                    topLevelRowObjects = self._initializeRowObjects(data);
                    displayData = self.getDisplayData(topLevelRowObjects);
                    self.totalRecords = displayData.totalRecords;
                    topLevelRowObjects = displayData.records;
                }
                else {
                    // assume data is a record object - get the records array
                    if (data.totalRecords !== undefined && data.totalRecords >= 0) {
                        self.totalRecords = data.totalRecords;
                    }

                    topLevelRowObjects = self._initializeRowObjects(data.records);

                    if (!self.serverSideProcessing) {
                        displayData = self.getDisplayData(topLevelRowObjects);
                        // reset the total records since filtering gets applied in getDisplayData()
                        self.totalRecords = displayData.totalRecords;
                        topLevelRowObjects = displayData.records;
                    }
                }

                // Set up tracking objects for all row objects
                self._initializeRowObjectCollections(topLevelRowObjects);

                array.forEach(topLevelRowObjects, function(rowObject) {
                    self.createRow(rowObject);
                    if (self.expandRoots) {
                        self._expand(rowObject);
                    }
                });
                domConstruct.place(self.tbody, self.tfootAttach, "before");

                // Rebuild the footer. This must be done each time because the data may have changed
                // and we need an up-to-date number of pages based on total rows.
                self.showFooter();

                // Expand all previously expanded rows
                array.forEach(self.expandedNodeList, function(nodeId) {
                    var rowObject = self.rowObjects[nodeId];
                    if (rowObject) {
                        if (rowObject.domNode || !rowObject.parent) {
                            // Only expand nodes when they're top-level or already have dom nodes
                            self._expand(rowObject);
                        }
                        else {
                            // If this is a child and does not have a dom node yet, mark it as
                            // expanded.
                            rowObject.expanded = true;
                        }
                    }
                });

                self.scheduleCheckHeaderFooterLocks();

                self.onDisplayTable();
            },

            /**
             * A recursive function to create the table row objects to track table-related metadata for
             * any raw data items to be shown by the table. This will run through the provided item
             * array and will recursively set up rowObject.children arrays on each resulting object
             * to contain that object's child RowObjects.
             */
            _initializeRowObjects: function(items, parentRowObject) {
                var self = this;
                var result = [];

                array.forEach(items, function(item) {
                    var rowObject = self.createTreeNode(item, parentRowObject);
                    result.push(rowObject);

                    // Set the children of this RowObject to be the RowObjects for child items
                    rowObject.children = self._initializeRowObjects(self.getItemChildren(item), rowObject);
                });

                return result;
            },

            /**
             * Populate the row object tracking objects to contain all of the row objects which are
             * to be shown in the table.
             */
            _initializeRowObjectCollections: function(rowObjects) {
                var self = this;
                self.rowObjects = {};
                self.rowObjectList = [];

                array.forEach(rowObjects, function(rowObject) {
                    self._populateForRowObjectRecursive(rowObject);
                });
            },

            /**
             * Register the given row object with the rowObject tracking lists
             */
            _populateForRowObject: function(rowObject) {
                var self = this;
                self.rowObjects[rowObject.id] = rowObject;
                self.rowObjectList.push(rowObject);
            },

            /**
             * Register the given row object (and any children) with the rowObject tracking lists
             */
            _populateForRowObjectRecursive: function(rowObject) {
                var self = this;
                self._populateForRowObject(rowObject);
                array.forEach(rowObject.children, function(childRowObject) {
                    self._populateForRowObjectRecursive(childRowObject);
                });
            },

            /**
             *
             */
            createTreeNode: function(data, parent) {
                var result;

                var level = 0;
                var id = this.getTreeNodeId(data);
                var hasChildren = this.hasChildren(data);
                if (!!parent) {
                    id = parent.id+"/"+id;
                    level = parent.level+1;
                }

                result = {
                    id: id,
                    level: level,
                    expanded: false,
                    item: data,
                    parent: parent,
                    children: [],
                    domNode: null,
                    hasChildren: hasChildren,
                    retrievedChildren: false
                };
                if (parent) {
                    parent.children.push(result);
                }
                return result;
            },

            /**
             * Get the id for the tree node
             */
            getTreeNodeId: function(data, parent){
                return data[this.idAttribute];
            },

            /**
             * Apply table view configuration data (sort/filter/pagination) to produce the viewable
             * set of data, given all of the data.
             */
            getDisplayData: function(rowObjects) {
                var self = this;
                var result = {};

                rowObjects = self.filter(rowObjects);
                self.sort(rowObjects);

                var totalRecords = rowObjects.length;
                // Slice the data to return according to pagination settings.
                if (!self.hidePagination) {
                    var startRow = (self.pageNumber-1) * self.rowsPerPage;
                    if (totalRecords <= startRow && startRow > 0) {
                        console.error("Page number out of range: Start index "+startRow+" is higher than "+totalRecords);
                        self.pageNumber = Math.ceil(totalRecords / self.rowsPerPage);
                        startRow = (self.pageNumber-1) * self.rowsPerPage;
                    }
                    rowObjects = rowObjects.slice(startRow, startRow+self.rowsPerPage);
                }

                result.records = rowObjects;
                result.totalRecords = totalRecords;

                return result;
            },

            /**
             * Return all data items currently showing in the table
             */
            getItems: function() {
                var result = [];

                array.forEach(this.rowObjectList, function(rowObject) {
                    if (rowObject.visible !== false) {
                        result.push(rowObject.item);
                    }
                });

                return result;
            },

            /**
             * Get the children for a given table data item.
             * The default implementation assumes that there is an array as a property "children" of
             * each item.
             */
            getItemChildren: function(item) {
                return item.children;
            },

            /**
             * Get all descendants of the given item, recursively
             */
            getAllRowObjectDescendants: function(rowObject) {
                var self = this;
                var result = [];

                array.forEach(rowObject.children, function(child) {
                    result.push(child);
                    result = result.concat(self.getAllRowObjectDescendants(child));
                });

                return result;
            },

            /**
             * Set the children for a given table data item. If the mechanism by which item children
             * are retrieved has been customized so that it's not just "item.children", this method
             * should also be overridden to match.
             *
             * This is called by lazy-loading when children are loaded to populate the tree data.
             */
            setItemChildren: function(item, children) {
                item.children = children;
            },

            /**
             * Get the internal object tracking tree data for a given data item.
             */
            _getRowObjectForItem: function(item) {
                var rowObject;
                array.forEach(this.rowObjectList, function(thisRowObject) {
                    if (thisRowObject.item === item) {
                        rowObject = thisRowObject;
                    }
                });

                return rowObject;
            },

            /**
             * Get the internal object tracking tree data for a given DOM node
             */
            _getRowObjectForDomNode: function(domNode) {
                var rowObject;
                array.forEach(this.rowObjectList, function(thisRowObject) {
                    if (thisRowObject.domNode === domNode) {
                        rowObject = thisRowObject;
                    }
                });

                return rowObject;
            },

            /**
             *
             */
            _checkExpandCollapse: function(rowObject) {
                var expanded = rowObject.expanded;
                if (!expanded) {
                    this._expand(rowObject);
                }
                else {
                    this._collapse(rowObject);
                }
            },

            /**
             * Expand the row for a given data item
             *
             * item:                        The object whose row should be expanded
             * expandAll / Boolean:         If true, recursively expand all children
             */
            expand: function(item, expandAll) {
                var self = this;

                var rowObject = self._getRowObjectForItem(item);
                if (rowObject) {
                    self._expand(rowObject, expandAll);

                    if (expandAll) {
                        array.forEach(self.getItemChildren(item), function(child) {
                            self.expand(child, true);
                        });
                    }
                }
            },

            /**
             *
             */
            _expand: function(rowObject, expandAll) {
                var expanded = rowObject.expanded;
                if (!expanded) {
                    this._toggle(rowObject, expandAll);
                    this.scheduleCheckHeaderFooterLocks();
                }
            },

            /**
             * Collapse the row for a given data item
             */
            collapse: function(item) {
                var rowObject = this._getRowObjectForItem(item);
                if (rowObject) {
                    this._collapse(rowObject);
                }
            },

            /**
             *
             */
            _collapse: function(rowObject) {
                var expanded = rowObject.expanded;
                if (expanded) {
                    this._toggle(rowObject);
                    this.scheduleCheckHeaderFooterLocks();
                }
            },

            /**
             *
             */
            _expandAllParents: function(rowObject) {
                if (rowObject.parent) {
                    this._expandAllParents(rowObject.parent);
                }
                this._expand(rowObject);
            },

            _collapseAll: function() {
                var self = this;
                array.forEach(self.getItems(), function(item) {
                    self.collapse(item);
                });
            },

            _addExpandCollapseLinks: function() {
                var self = this;
                domConstruct.empty(self.expandCollapseAttach);

                var expandLink = domConstruct.create("a", {
                    innerHTML: i18n("Expand All"),
                    style: "margin-" + (domGeom.isBodyLtr()?"right":"left") + ":10px;",
                    className: self.expandCollapseAllLinkClass
                });
                expandLink.onclick = function() {
                    array.forEach(self.getItems(), function(item) {
                        self.expand(item, true);
                    });
                };

                var collapseLink = domConstruct.create("a", {
                    innerHTML: i18n("Collapse All"),
                    className: self.expandCollapseAllLinkClass
                });
                if (domGeom.isBodyLtr()){
                    domStyle.set(collapseLink, "float", "none");
                }
                else{
                    domStyle.set(collapseLink, "float", "left");
                }
                collapseLink.onclick = function() {
                    self._collapseAll();
                };

                domConstruct.place(expandLink, self.expandCollapseAttach);
                domConstruct.place(collapseLink, self.expandCollapseAttach);
            },

            /**
             * expandAll: If we are expanding this row during an "expand all" operation, we need to
             *            track that so that we can recursively expand any children which get lazy
             *            loaded.
             */
            _toggle: function(rowObject, expandAll) {
                var self = this;

                if (!rowObject.expanded) {
                    if (!self.hasAllChildren(rowObject)) {
                        self.getNewChildren(rowObject, expandAll);
                    }
                    else {
                        array.forEach(rowObject.children, function(childRowObject) {
                            if (!childRowObject.domNode) {
                                // When lazy-loading is activated, child-objects which are
                                // pre-loaded but not yet expanded will not have a DOM object yet.
                                // We must create it, and initialize the proper properties.
                                self.createRow(childRowObject);
                                if (childRowObject.expanded) {
                                    childRowObject.expanded = false;
                                    childRowObject.visible = true;
                                    self._expand(childRowObject);
                                }
                            }
                            if (childRowObject.visible) {
                                self.unhideRow(childRowObject);
                            }
                            // Catch any lazy-loaded children nodes which should be expanded
                            array.forEach(self.expandedNodeList, function(nodeId) {
                                if (childRowObject.id === nodeId) {
                                    childRowObject.expanded = false;
                                    self._expand(childRowObject);
                                }
                            });
                        });

                        if (rowObject.domNode) {
                            if (domClass.contains(rowObject.domNode, "collapsedRow")) {
                                domClass.remove(rowObject.domNode, "collapsedRow");
                                if (rowObject.hasChildren) {
                                    array.forEach(rowObject.collapseDoms, function(collapseDom) {
                                        domClass.add(collapseDom, self.collapseImageClass);
                                        domClass.remove(collapseDom, self.expandImageClass);
                                    });
                                }
                            }
                        }

                        if (self.expandedNodeList.indexOf(rowObject.id) === -1) {
                            self.expandedNodeList.push(rowObject.id);
                        }
                    }
                }
                else {
                    array.forEach(rowObject.children, function(childRowObject) {
                        self.hideRow(childRowObject);
                    });

                    if (!domClass.contains(rowObject.domNode, "collapsedRow")) {
                        domClass.add(rowObject.domNode, "collapsedRow");
                        if (rowObject.hasChildren) {
                            array.forEach(rowObject.collapseDoms, function(collapseDom) {
                                domClass.add(collapseDom, self.expandImageClass);
                                domClass.remove(collapseDom, self.collapseImageClass);
                            });
                        }
                    }

                    if (self.expandedNodeList.indexOf(rowObject.id) !== -1) {
                        util.removeFromArray(self.expandedNodeList, rowObject.id);
                    }
                }
                rowObject.expanded = !rowObject.expanded;

                self.saveCurrentSettings();
            },

            /**
             *
             */
            hideRow: function(rowObject) {
                var self = this;

                if (rowObject.domNode !== null) {
                    if (!domClass.contains(rowObject.domNode, "hidden")) {
                        domClass.add(rowObject.domNode, "hidden");
                    }
                }

                array.forEach(rowObject.children, function(child) {
                    self.hideRow(child);
                });
            },

            /**
             *
             */
            unhideRow: function(rowObject) {
                var self = this;

                if (!rowObject.domNode) {
                    self.createRow(rowObject);
                }

                if (domClass.contains(rowObject.domNode, "hidden")) {
                    domClass.remove(rowObject.domNode, "hidden");
                }

                if (rowObject.expanded) {
                    if (domClass.contains(rowObject.domNode, "collapsedRow")) {
                        domClass.remove(rowObject.domNode, "collapsedRow");
                    }

                    array.forEach(rowObject.children, function(child) {
                        if (child.visible) {
                            self.unhideRow(child);
                        }
                    });
                }
                else {
                    if (!domClass.contains(rowObject.domNode, "collapsedRow")) {
                        domClass.add(rowObject.domNode, "collapsedRow");
                    }
                }
            },

            /**
             * options is an object that currently accepts the following:
             *   insertSorted: Inserts the domNode and then resorts
             *   insertFiltered: Inserts the domNode and then refilters
             */
            createRow: function(rowObject, options) {
                var self = this;
                var createTree = true;
                var row,
                cellDom,
                link,
                insertSorted,
                insertFiltered;

                if (!!options) {
                    insertSorted = options.insertSorted;
                    insertFiltered = options.insertFiltered;
                }

                row = domConstruct.create("tr");

                if (rowObject.matchesFilters) {
                    domClass.add(row, "matchesFilters");
                }

                self.applyRowStyle(rowObject.item, row);

                self.own(
                    on(row, "click", function() {
                        self.selectRow(row);
                    }),
                    on(row, "dblclick", function() {
                        self._toggle(rowObject);
                    })
                );


                domClass.add(row, "collapsedRow");

                if (self.draggable) {
                    if (self.canDragItem(rowObject.item)) {
                        domClass.add(row, "dojoDndItem");

                        var dndHandle = domConstruct.create("td", {
                            innerHTML: "::",
                            "class": "dojoDndHandle"
                        }, row);
                    }
                    else {
                        domConstruct.create("td", {
                            innerHTML: ""
                        }, row);
                    }
                }

                var skipCount = 0;
                array.forEach(self.columns, function(column) {
                    if (skipCount === 0) {
                        cellDom = domConstruct.create("td");
                        row.appendChild(cellDom);

                        var cellWrapperDom = domConstruct.create("div", {
                            "class": "cellWrapper"
                        }, cellDom);

                        if (column['class']) {
                            domClass.add(cellDom, column['class']);
                        }

                        if (column.style !== undefined) {
                            domStyle.set(cellDom, column.style);
                        }

                        // Save a tracking entry for the cell's data.
                        var cellData = {
                            dom: cellDom
                        };


                        var result = "";

                        var contentDom = cellWrapperDom;
                        if ((createTree && !column.beforeExpander) || column.alwaysShowExpandArrow) {
                            contentDom = domConstruct.create("div");
                        }

                        if (column.field !== undefined) {
                            result = rowObject.item[column.field];
                        }

                        if (column.formatter !== undefined) {
                            result = column.formatter(rowObject.item, result, cellDom);
                        }

                        // Handle the type of the result of the formatter, and use the appropriate
                        // method to add the result to the cell.
                        if (result === null) {
                            // do nothing, cellDom is empty
                            console.debug("skipping empty result");
                        }
                        else if (result instanceof _WidgetBase) {
                            result.placeAt(contentDom);
                        }
                        else if ((typeof result === "object") && (result.nodeType === 1) &&
                                 (typeof result.style === "object") && (typeof result.ownerDocument ==="object")) {
                            contentDom.appendChild(result);
                        }
                        else if (result !== undefined && typeof result !== "object") {
                            contentDom.innerHTML = entities.encode(String(result));
                        }

                        var strToCheck = "";
                        if (typeof result === "string") {
                            strToCheck = result;
                        } else {
                            strToCheck = rowObject.item.name;
                            if (strToCheck === undefined) {
                                if (rowObject.item.serviceData) {
                                    strToCheck = rowObject.item.serviceData.name;
                                }
                            }
                        }
                        domAttr.set(contentDom, "dir", util.getResolvedBTD(strToCheck));
                        domAttr.set(contentDom, "align", util.getUIDirAlign());

                        if ((createTree && !column.beforeExpander) || column.alwaysShowExpandArrow) {
                            domClass.add(contentDom, "inlineBlock expandableCellContent");
                            var collapseDom = domConstruct.create("div", {
                                "class": "inlineBlock collapseSpace"
                            }, cellWrapperDom);

                            if (!rowObject.collapseDoms) {
                                rowObject.collapseDoms = [];
                            }
                            rowObject.collapseDoms.push(collapseDom);

                            var imageClass = self.expandImageClass;
                            if (rowObject.children.length > 0 || (self.getChildUrl && rowObject.hasChildren !== false)) {
                                // Note: This doesn't add collapse to parents on row addition, only on table load/page refresh.
                                if (!!rowObject.expanded) {
                                    domClass.remove(row, "collapsedRow");
                                    imageClass = self.collapseImageClass;
                                }
                                domClass.add(collapseDom, "linkPointer " + imageClass);

                                self.own(
                                    on(collapseDom, "click", function(event) {
                                        self._checkExpandCollapse(rowObject);
                                        baseEvent.stop(event);
                                    })
                                );
                            }
                            else if (rowObject.level !== 0 &&
                                self.shouldShowCollapseDom(rowObject.parent) &&
                                rowObject.parent.collapseDoms[0].className.indexOf("linkPointer") < 0)
                            {
                                // If parent doesn't already have its collapse link, you should add it.
                                var parentCollapseDom = rowObject.parent.collapseDoms[0];
                                imageClass = self.collapseImageClass;
                                domClass.remove(row, "collapsedRow");
                                domClass.add(parentCollapseDom, "linkPointer " + imageClass);

                                self.own(
                                    on(parentCollapseDom, "click", function(event) {
                                        self._checkExpandCollapse(rowObject.parent);
                                        baseEvent.stop(event);
                                    })
                                );
                            }

                            cellWrapperDom.appendChild(collapseDom);
                            if (rowObject.level > 0) {
                                domStyle.set(cellWrapperDom, {
                                    paddingLeft: rowObject.level * self.rowPadding+"px"
                                });
                            }
                            cellWrapperDom.appendChild(contentDom);

                            createTree = false;
                        }

                        if (cellDom.colSpan > 1) {
                            skipCount = cellDom.colSpan-1;
                        }
                    }
                    else {
                        skipCount--;
                    }
                });

                rowObject.domNode = row;

                // Recursive function to locate the last descendant row object of the the passed in row object
                var getLastDescendant = function(row) {
                    if (!row.expanded || row.children.length === 0) {
                        return row;
                    }
                    return getLastDescendant(row.children[row.children.length - 1]);
                };

                // Function to locate the row to insert after
                var getInsertionPoint = function(scanRowObject) {
                    var children = scanRowObject.children;
                    var rowIndex = array.indexOf(children, rowObject);
                    if (rowIndex === 0) {
                        return scanRowObject;
                    }
                    if (rowIndex === -1) {
                        rowIndex = children.length;
                    }
                    var lastChild = children[rowIndex - 1];
                    return getLastDescendant(lastChild);
                };

                var refNode;
                var parent = rowObject.parent;
                if (!parent) {
                    parent = {
                        children: self.getTopLevelRowObjects()
                    };
                }
                parent.hasChildren = true;
                if (parent.children.length === 0 || array.indexOf(parent.children, rowObject) === -1) {
                    parent.children.push(rowObject);
                }
                if (!!insertSorted) {
                    parent.children = self.sort(parent.children);
                }
                if (!!insertFiltered) {
                    parent.children = self.filter(parent.children);
                }
                refNode = getInsertionPoint(parent).domNode;

                if (self.draggable) {
                    self.dndContainer.insertNodes(false, [row], false, refNode);
                }
                else if (!!refNode) {
                    domConstruct.place(row, refNode, "after");
                }
                // If !refNode, the new row needs to be the first table row
                // If there's already a child, insert before that
                else if (!!self.tbody.firstChild) {
                    domConstruct.place(row, self.tbody.firstChild, "before");
                }
                // Otherwise, the table is empty, so place inside the tbody
                else {
                    domConstruct.place(row, self.tbody);
                }
                if (self.serverSideProcessing) {
                    // When lazy-loading is active, visible should always be true, because filtering
                    // is handled server-side. But sometimes visible is false, which is bad.
                    rowObject.visible = true;
                }
                else if (rowObject.visible === false) {
                    self.hideRow(rowObject);
                }

                return row;
            },

            /**
             * select a row, highlighting it and calling onRowSelect
             */
            selectRow: function (row) {
                var self = this;

                //only update the UI if we're clicking on a new row
                if (self.selectedRow !== row) {
                    self.unselectRow();
                    domClass.add(row, "selected");
                    // unselect the previously selected row.
                    self.selectedRow = row;
                }


                // run onRowSelect in any case
                var rowObject = self._getRowObjectForDomNode(row);
                self.onRowSelect(rowObject.item, row);
            },

            /**
             * un-select the currently selected row.
             */
            unselectRow: function () {
                var self = this;

                if(self.selectedRow) {
                    domClass.remove(self.selectedRow, "selected");
                    self.selectedRow = null;
                }
            },

            /**
             *
             */
            canDragItem: function(item) {
                return true;
            },

            /**
             *
             */
            onRowSelect: function(item, row) {

            },

            /**
             * Placeholder function - to be overridden.
             */
            onDrop: function(sources, target, copy, before) {
                // no-op by default
            },

            /**
             * Placeholder function - to be overridden.
             */
            onDndStart: function() {
                // no-op by default
            },

            /**
             * Placeholder
             */
            onDisplayTable: function() {
                // no-op by default
            },

            /**
             * Placeholder function to specify a class for a row
             */
            applyRowStyle: function(item, row) {
                // no-op by default
            },

            /**
             * Convenience method for creating img elements using the blankGif with a given css class name
             *
             * @param class_name, subsequent arguments are passed to domConstruct.create invocation
             * @param targetDom, the parent dom node for the generated image
             * @param imageAttribs, extra attributes for the image element (id, alt, tabIndex attribute etc)
             * @return a new img Element using the dojo.config.blankGif src attribute
             */
            _createImg: function(className, targetDom, imageAttribs) {
                var imgDom = domConstruct.create("img", {src: this._blankGif});
                if (imageAttribs) {
                    domAttr.set(imgDom, imageAttribs);
                }
                targetDom.appendChild(imgDom);
                domClass.add(targetDom, "inlineBlock");
                if (className) {
                    domClass.add(imgDom, className);
                }
                return imgDom;
            },

            /**
            *
            */
           destroy: function() {
               clearTimeout(this._checkHeaderFooterLocksTimeoutId);

               if (this._scrollListener) {
                   this._scrollListener.remove();
               }

               if (this._resizeListener) {
                   this._resizeListener.remove();
               }

               if (this.dndContainer) {
                   this.dndContainer.destroy();
               }

               if (this.dndStartSubscription) {
                   this.dndStartSubscription.remove();
               }

               if (this.perPageSelect) {
                   this.perPageSelect.destroy();
               }

               if (this.pageBox) {
                   this.pageBox.destroy();
               }

               if (this.selectStore) {
                   this.selectStore.destroy();
               }

               if (this.filterWidget) {
                   this.filterWidget.destroy();
               }

               if (this.tableDataDeferred) {
                   this.tableDataDeferred.cancel();
               }

               if (this.domNode) {
                   array.forEach(registry.findWidgets(this.domNode), function (w) {
                       if (w.destroyRecursive) {
                           w.destroyRecursive();
                       }
                       else {
                           w.destroy();
                       }
                   });
               }

               this.inherited(arguments);
           },

           /**
            * Shows all rows, and initiates a browser print.
            * Caution This may be slow for large data sets.
            */
           print: function() {
               var self = this;

               // callback for initiating browser print
               var doPrint = function() {
                   window.print();
               };

               if (!self.hidePagination) {

                   /**
                    * function to set a property and return a function to rollback that action
                    */
                   var setPropWithRollback = function (object, propName, newValue) {
                       var oldValue = object[propName];
                       object[propName] = newValue;
                       if (self.hasOwnProperty(propName)) {
                           return function() {object[propName] = oldValue;};
                       }
                       return function() {delete object[propName];};
                   };

                   // Array and function to establish rollback logic
                   var rollbacks = [];
                   var rollbackAll = function() {
                       // restore original pagination settings
                       array.forEach(rollbacks, function(func){ func(); });
                       self.loadTable();
                   };

                   try {
                       // load/format the table without pagination and don't save filter settings
                       rollbacks.push(setPropWithRollback(self, "hidePagination", true));
                       rollbacks.push(setPropWithRollback(self, "rowsPerPage", 99999));
                       rollbacks.push(setPropWithRollback(self, "tableConfigKey", undefined));

                       self.loadTable();
                       if (!self.tableDataDeferred) {
                           doPrint();
                       }
                       else {
                           self.tableDataDeferred.addCallback(doPrint);
                       }
                   }
                   finally {
                       // reset the table to it's original state (use deferred callback if needed)
                       if (!self.tableDataDeferred) {
                           rollbackAll();
                       }
                       else {
                           self.tableDataDeferred.addBoth(rollbackAll);
                       }
                   }
               }
               else {
                   // just print it, no reloading/formatting required
                   doPrint();
               }
           },

           /**
            * Default method for determining whether or not an item should expect to have children
            * objects.
            */
           hasChildren: function(item) {
               var hasChildren = true;
               if (item.children === false) {
                   hasChildren = false;
               }
               return hasChildren;
           },

           /**
            * Determines if the rowObject has tried to retrieve it's children yet.
            */
           hasAllChildren: function(rowObject){
               if (!rowObject.hasChildren ||
                       (!rowObject.retrievedChildren && rowObject.children.length > 0)) {
                   rowObject.retrievedChildren = true;
               }
               return rowObject.retrievedChildren;
           },

           /**
            * Calls a rest service to get the children for a particular row and removes the toggle button
            * if a row does not have any children.
            *
            * expandAll: If we are loading children during an "expand all" operation, expand all
            *            children after we've loaded them.
            */
           getNewChildren: function(rowObject, expandAll) {
               var self = this;
               var result;
               if (self.getChildUrl) {
                   var url = self.getChildUrl(rowObject.item);
                   if (url) {

                       // Use any filters that are specified for just the children
                       var queryFilters;
                       if (self.getChildFilters) {
                           queryFilters = self.getChildFilters(rowObject.item);
                       }
                       // This will return the table's baseFilters if child ones do not exist
                       var content = self.getFilterData(queryFilters);

                       // Use any outputTypes that are specified for just the children
                       var outputTypes;
                       if (self.getChildOutputType) {
                           outputTypes = self.getChildOutputType(rowObject.item);
                       }
                       // Use any outputType already defined if we have nothing else
                       else if (self.queryData) {
                           outputTypes = self.queryData;
                       }
                       if (outputTypes) {
                           content = lang.mixin(content, outputTypes);
                       }

                       domClass.add(rowObject.domNode, "loadingImage");
                       if (self.queuedRequests) {
                           self._set("queuedRequests", _.union(self.queuedRequests, [url]));
                       }
                       baseXhr.get({
                           url: url,
                           content: content,
                           handleAs: "json",
                           load: function(data) {
                               //set up the children
                               self._emptyRow(rowObject);
                               rowObject.children = self._initializeRowObjects(data, rowObject);
                               self.setItemChildren(rowObject.item, data);

                               array.forEach(rowObject.children, function(childRowObject) {
                                   self._populateForRowObjectRecursive(childRowObject);
                                   childRowObject.visible = true;
                               });
                               rowObject.retrievedChildren = true;

                               if (!self.serverSideProcessing) {
                                   self.sort(rowObject.children);
                                   self.filter(rowObject.children);
                               }

                               //mark whether the row has children and either show children or remove toggle button
                               if (data.length > 0) {
                                   rowObject.hasChildren = true;
                                   // Show the expand/collapse icon.
                                   array.forEach(rowObject.collapseDoms, function(collapseDom) {
                                       domStyle.set(collapseDom, "visibility", "visible");
                                   });
                                   rowObject.expanded = false;
                                   self.expand(rowObject.item, expandAll);
                               }
                               else {
                                   rowObject.hasChildren = false;
                                   // Set visibility of collapseDom to hidden. Avoids clicking and won't mess with styling.
                                   array.forEach(rowObject.collapseDoms, function(collapseDom) {
                                       domStyle.set(collapseDom, "visibility", "hidden");
                                   });
                               }
                               domClass.remove(rowObject.domNode, "loadingImage");
                           },
                           error: function(data) {
                               self.showError(data);
                           },
                           handle: function(data, ioArgs) {
                               if (self.queuedRequests) {
                                   self._set("queuedRequests",
                                       _.without(self.queuedRequests, ioArgs.args.url));
                               }
                           }
                       });
                   }
               }
           },

           shouldShowCollapseDom: function(rowObject) {
               return !!rowObject && !!rowObject.collapseDoms && rowObject.collapseDoms.length > 0
                       && rowObject.hasChildren && array.some(rowObject.children, function(childRowObject) {
                   return !!childRowObject.visible;
               });
           },

           _destroyWidget: function (widget) {
               if (widget) {
                   if (widget.destroyRecursive) {
                       widget.destroyRecursive();
                   }
                   else if (widget.destroy) {
                       widget.destroy();
                   }
               }
           },

           /**
            * Attach listeners so that we fix the header/footer into place whenever they reach the
            * top or bottom of the page.
            */
           attachHeaderFooterLockingEvents: function() {
               // Disable this scrolling if we're in IE11
               // It randomly crashes the browswer when removing "position: fixed"
               if (!window || util.getIE() === 11 || !this.allowHeaderLocking) {
                   return;
               }

               this._scrollListener = on(window, "scroll", this.scheduleCheckHeaderFooterLocks.bind(this));

               // On resizing the window, we must re-evaluate column widths. We will un-fix
               // the header/footer, grab the dynamic widths of all cells, and use the new
               // widths to re-fix the header/footer.
               this._resizeListener = on(window, "resize", function(evt) {
                   try {
                       if (this._headerLocked) {
                           this._unlockHeaderAndCellSize();
                           this._lockHeaderAndCellSize();
                       }

                       if (this._footerLocked) {
                           this._unlockFooter();
                           this._lockFooter();
                       }
                   }
                   catch (e) {
                       // Couldn't get position. Widget may have been destroyed or removed.
                       this._scrollListener.remove();
                   }
               }.bind(this));
           },

           /**
            * Checking the header and footer lock can be a little bit expensive when we do it for
            * every single row in the table.  This method schedules this moderately expensive call
            * for "as soon as possible", which should be quick enough to be imperceptible.  The
            * benefit is that we can call this for every row in the table if we want, and it won't
            * bog down the CPU.
            */
            scheduleCheckHeaderFooterLocks: function() {
                if (this._checkHeaderFooterLocksTimeoutId === null) {
                    this._checkHeaderFooterLocksTimeoutId = setTimeout(function() {
                        try {
                            this._checkHeaderFooterLocks();
                        }
                        finally {
                            this._checkHeaderFooterLocksTimeoutId = null;
                        }
                    }.bind(this));
                }
            },

           /**
            * Determine whether we should lock the header or footer of this table based on whether
            * the top of it is above the top of the window, or the bottom of it is below the bottom
            * of the window.
            */
           _checkHeaderFooterLocks: function() {
               var self = this;

               var windowBox = dojoWindow.getBox();

               var position = domGeom.position(self.tableContainerAttach);

               var topOfThisWidget =  domGeom.position(self.belowTreeOptions).y;
               var bottomOfThisWidget = topOfThisWidget+position.h;
               var topOfThePage = windowBox.t;
               var bottomOfThePage = topOfThePage+windowBox.h;

               // If the top of the widget is above the top of the window (and the widget is at
               // least partly on the page) we will fix the table headers
               if (topOfThisWidget < 10 && bottomOfThisWidget > 0) {
                   if (!domClass.contains(self.theadNode, "thead-fixed-position")) {
                       self._lockHeaderAndCellSize();
                   }

                   // If we're within 90px of the widget scrolling off the bottom of the page, start
                   // adjusting position of the header so it scrolls off with the rest of the widget
                   if (bottomOfThisWidget < 90) {
                       domStyle.set(self.theadNode, "top", (bottomOfThisWidget-90)+"px");
                   }
                   else {
                       domStyle.set(self.theadNode, "top", "");
                   }
               }
               else if (domClass.contains(self.theadNode, "thead-fixed-position")) {
                   self._unlockHeaderAndCellSize();
               }

               // If the bottom of the widget is below the bottom of the window (and the widget is
               // at least partly on the page) we will fix the table footer
               if (bottomOfThisWidget > windowBox.h && topOfThisWidget < windowBox.h) {
                   if (!domClass.contains(self.tfootAttach, "tfoot-fixed-position")) {
                       self._lockFooter();
                   }

                   // If we're within 95px of the widget scrolling off the top of the page, start
                   // adjusting position of the footer so it scrolls off with the rest of the widget
                   var amountOfTopOfWidgetShowing = windowBox.h - topOfThisWidget;
                   if (amountOfTopOfWidgetShowing < 95) {
                       domStyle.set(self.tfootAttach, "bottom", "-"+(95-amountOfTopOfWidgetShowing)+"px");
                   }
                   else {
                       domStyle.set(self.tfootAttach, "bottom", "");
                   }
               }
               else if (domClass.contains(self.tfootAttach, "tfoot-fixed-position")) {
                   self._unlockFooter();
               }
           },

           /**
            * Lock the headers into place and create necessary table cells to ensure cell size
            * remains consistent
            */
           _lockHeaderAndCellSize: function() {
               var self = this;

               // Disable this behavior if we're in IE11
               // It randomly crashes the browswer when removing "position: fixed"
               if (util.getIE() !== 11 && self.allowHeaderLocking) {
                   var tablePosition = domGeom.position(self.tableContainerAttach);
                   domStyle.set(self.theadNode, "width", tablePosition.w+"px");

                   var theadNodePosition = domGeom.position(self.theadNode);

                   // We need to lock the size of each header cell to whatever it's currently sized as.
                   // Since setting the header as fixed will remove it from the dynamic table sizing
                   // rendering provided by browsers, we need to remember the current size of all
                   // columns and fix them as such.
                   var savedWidths = [];
                   if (self.tbody) {
                       query("tr:first-child > td", self.tbody).forEach(function(tdNode) {
                           savedWidths.push(domGeom.position(tdNode));
                       });
                   }

                   domClass.add(self.theadNode, "thead-fixed-position");

                   // inflate tbodySizerAttach only after header is removed from table using fixed positioning,
                   // otherwise if done before we will temporary have two headers the same height which
                   // will cause the tree window to get bigger which will cause the scroll to get bigger
                   // which will end up calling here again which will cause the screen to jiggle
                   if (self.tbody) {
                       var i;
                       for (i = 0; i < savedWidths.length; i++) {
                           var tdPosition = savedWidths[i];

                           // Create fixed-width cells within the header
                           domConstruct.create("td", {
                               className: "table-sizer-cell",
                               style: {
                                   width: tdPosition.w+"px",
                                   height: theadNodePosition.h+"px"
                               }
                           }, self.tbodySizerAttach);

                           // Create fixed-width cells within the body
                           domConstruct.create("td", {
                               className: "table-sizer-cell",
                               style: {
                                   width: tdPosition.w+"px"
                               }
                           }, self.theadSizerAttach);
                       }
                   }
                   self._headerLocked = true;
               }
           },

           /**
            * Unfix the header and remove all width-setting cells, so the header simply appears at
            * the top of the table.
            */
           _unlockHeaderAndCellSize: function() {
               var self = this;

               domClass.remove(self.theadNode, "thead-fixed-position");
               domStyle.set(self.theadNode, "width", "");

               domConstruct.empty(self.tbodySizerAttach);
               domConstruct.empty(self.theadSizerAttach);

               self._headerLocked = false;
           },

           /**
            * Lock the table footer into place.
            */
           _lockFooter: function() {
               var self = this;

               // Disable this behavior if we're in IE11
               // It randomly crashes the browswer when removing "position: fixed"
               if (util.getIE() !== 11 && self.allowHeaderLocking) {
                   var tablePosition = domGeom.position(self.tableAttach);
                   domStyle.set(self.tfootAttach, "width", (tablePosition.w-1)+"px");

                   // Since fixing the footer will remove it from the table layout, we must set its
                   // width to whatever value it currently has.
                   query("tfoot > tr:first-child > td:first-child", self.tableAttach).forEach(function(tdNode) {
                       domStyle.set(tdNode, "min-width", tablePosition.w-5+"px");
                   });

                   domClass.add(self.tfootAttach, "tfoot-fixed-position");

                   var footerPosition = domGeom.position(self.tfootAttach);
                   domStyle.set(self.footerSizerAttach, "height", footerPosition.h+"px");

                   self._footerLocked = true;
               }
           },

           /**
            * Unfix the footer so it simply appears at the bottom of the table
            */
           _unlockFooter: function() {
               var self = this;

               query("tfoot > tr:first-child > td:first-child", self.tableAttach).forEach(function(tdNode) {
                   domStyle.set(tdNode, "min-width", "");
               });

               domClass.remove(self.tfootAttach, "tfoot-fixed-position");
               domStyle.set(self.footerSizerAttach, "height", "");
               domStyle.set(self.tfootAttach, "width", "");

               self._footerLocked = false;
           },

           /**
            * update(data) is intended as an alternative to refresh(data) function
            * with the advantage of not destroying and recreating the entire table
            * each time data changes. It compares new data with the existing data,
            * and only update rows or columns that have changed.
            *
            * To use update(), each column needs to define a "relevantFieldNames" list.
            * "relevantFieldNames" should include all field names that have the potential
            * to affect this column's display content.
            *
            * Utility library underscore.js is utilized due to lack of similar
            * support in Dojo. All update support functions are marked in between
            * --- begin update() support function --- and
            * --- end update() support function --- markings.
            *
            * If you don't need to use update() function, there is no need to
            * worry about loading underscore.js.
            *
            * NOTE: this function was tested with UCD ExecutionLog only where
            *       serverSideProcessing=false
            *       draggable=false
            *       data is of the form of an array
            */
           update: function(newData) {
               if (!this.serverSideProcessing && !this.draggable && lang.isArray(this.data)) {
                   this.data = newData;
                   this.cachedData = newData;
                   this.queuedRequests = [];
                   this._updateChildren(this.data, null);
               } else {
                   console.error("update() does not support your treeTable configuration.");
               }
           },

           /*** --- begin update() support functions --- ***/

           /**
            * Recursive function to walk through all items to determine
            * whether we can find an exsiting row to update or create new rows.
            *
            * For UCD ExecutionLog, items are either be all have existing rows,
            * or none have existing rows.
            */
           _updateChildren: function(items, parent) {
               var itemsWithExistingRow = this._getItemsWithExistingRow(items);
               var itemsWithoutExistingRow = this._getItemsWithoutExistingRow(items);

               if (itemsWithExistingRow && itemsWithExistingRow.length > 0) {
                   this._processItems(itemsWithExistingRow);
               }
               if (itemsWithoutExistingRow && itemsWithoutExistingRow.length > 0) {
                   var parentRowObj;
                   if (parent && parent[this.idAttribute]) {
                       parentRowObj = this._getRowObjectByItemId(parent[this.idAttribute]);
                       if (parentRowObj) {
                           parentRowObj.visible = true;
                       }
                   }
                   var rowObjs = this._initializeRowObjects(itemsWithoutExistingRow, parentRowObj);

                   //if parentRowObj is not expanded,
                   //do not create the row now, let _toggle() does it.
                   array.forEach(rowObjs, function(rowObject) {
                      rowObject.visible = true;
                      this._populateForRowObjectRecursive(rowObject);
                      if (!parentRowObj || parentRowObj.expanded) {
                          this.createRow(rowObject);
                          if (rowObject.expanded) {
                              rowObject.expanded = false;
                              rowObject.visible = true;
                              this._expand(rowObject);
                          }
                      }
                   }, this);
                   this._addExpandCollapseImage(parentRowObj);
               }
           },

           _processItems: function(items, parent) {
               array.forEach(items, function(item) {
                   var existingRowObj = this._getRowObjectByItemId(item[this.idAttribute]);
                   if (existingRowObj) {
                       existingRowObj.visible = true;
                       this._updateColumns(existingRowObj, item);
                       if (item.children) {
                           this._updateChildren(item.children, item);
                       } else {
                           this._checkLazyLoad(item, existingRowObj);
                       }
                   }
               }, this);
           },

           _checkLazyLoad: function(item, existingRowObj) {
               if (this.getChildUrl && this.getChildUrl(item)) {
                   if (existingRowObj) {
                       //Important: only fetch lazy loaded data
                       //when existingRowObj is expanded
                       if (existingRowObj.expanded) {
                           this._getLazyLoadedData(this.getChildUrl(item)).then(
                               lang.hitch(this, function(data) {
                                   this._updateChildren(data, item);
                               }),
                               lang.hitch(this, function(error) {
                                   this.showError(error);
                               })
                           );
                       }
                   }
               }
           },

           /**
            * Based on relevantFieldNames list defined for a column,
            * determine if any column's content needs to be updated.
            * rowObj.hasChildren was set at time of creation, therefore
            * when rowObj.item changes, we need to make sure we reset it.
            */
           _updateColumns: function(existingRowObj, item) {
               array.forEach(this.columns, function(column, idx) {
                   if (column.relevantFieldNames) {
                       if (this._hasDataChanged(existingRowObj.item, item, column.relevantFieldNames)) {
                           if (existingRowObj.domNode) {
                               var existingDomNode = existingRowObj.domNode.children[idx];
                               var newNode = this._createNewTableCellNode(existingRowObj, item, column, idx);
                               domConstruct.place(newNode, existingDomNode, "replace");
                           }
                           existingRowObj.hasChildren = this.hasChildren(item);
                       }
                   } else {
                       console.error("relevantFieldNames must be defined to use update()");
                   }
               }, this);

               existingRowObj.item = item;
           },

           _getRowObjectByItemId: function(itemId) {
               return _.find(this.rowObjectList, function(rowObj) {
                   return rowObj && rowObj.item && rowObj.item[this.idAttribute] === itemId;
               }, this);
           },

           _hasDataChanged: function(oldItem, newItem, attributeList) {
               var changed = _.find(attributeList, function(attr) {
                   return !(_.isEqual(oldItem[attr], newItem[attr]));
               });
               return changed;
           },

           /**
            * create a new td element based on item data for a given row.
            * Mostly borrowed from original _createRow function, incomprehensible.
            */
           _createNewTableCellNode: function(rowObject, item, column, idx) {
               var createTree = (idx === 0);
               var cellDom = domConstruct.create("td");
               var cellWrapperDom = domConstruct.create("div", {
                   "class": "cellWrapper"
               }, cellDom);

               if (column['class']) {
                   domClass.add(cellDom, column['class']);
               }

               if (column.style !== undefined) {
                   domStyle.set(cellDom, column.style);
               }

               var result = "";

               var contentDom = cellWrapperDom;
               if ((createTree && !column.beforeExpander) || column.alwaysShowExpandArrow) {
                   contentDom = domConstruct.create("div");
               }

               if (column.field !== undefined) {
                   result = item[column.field];
               }

               if (column.formatter !== undefined) {
                   result = column.formatter(item, result, cellDom);
               }

               // Handle the type of the result of the formatter, and use the appropriate
               // method to add the result to the cell.
               if (result) {
                   if (result instanceof _WidgetBase) {
                       result.placeAt(contentDom);
                   }
                   else if ((typeof result === "object") && (result.nodeType === 1) &&
                        (typeof result.style === "object") && (typeof result.ownerDocument ==="object")) {
                       contentDom.appendChild(result);
                   }
                   else if (result !== undefined && typeof result !== "object") {
                       contentDom.innerHTML = entities.encode(String(result));
                   }
               }

               var strToCheck = "";
               if (typeof result === "string") {
                   strToCheck = result;
               } else {
                   strToCheck = item.name;
                   if (strToCheck === undefined) {
                       if (item.serviceData) {
                           strToCheck = item.serviceData.name;
                       }
                   }
               }
               domAttr.set(contentDom, "dir", util.getResolvedBTD(strToCheck));
               domAttr.set(contentDom, "align", util.getUIDirAlign());

               if ((createTree && !column.beforeExpander) || column.alwaysShowExpandArrow) {
                   domClass.add(contentDom, "inlineBlock expandableCellContent");
                   var collapseDom = domConstruct.create("div", {
                       "class": "inlineBlock collapseSpace"
                   }, cellWrapperDom);

                   if (!rowObject.collapseDoms) {
                       rowObject.collapseDoms = [];
                   }
                   rowObject.collapseDoms.push(collapseDom);

                   var hasLazyLoadChildren = this.getChildUrl && this.getChildUrl(item);
                   if ((item.children && item.children.length > 0) || hasLazyLoadChildren) {
                       rowObject.hasChildren = true;
                       domClass.remove(rowObject.domNode, "collapsedRow");
                       domClass.remove(collapseDom, this.expandImageClass);
                       domClass.remove(collapseDom, this.collapseImageClass);
                       if (hasLazyLoadChildren && (!rowObject.children || rowObject.children.length === 0)) {
                           rowObject.retrievedChildren = false;
                           domClass.add(rowObject.domNode, "collapsedRow");
                           domClass.add(collapseDom, "linkPointer " + this.expandImageClass);
                       } else {
                           if (rowObject.expanded) {
                               domClass.add(collapseDom, "linkPointer " + this.collapseImageClass);
                           } else {
                               domClass.add(rowObject.domNode, "collapsedRow");
                               domClass.add(collapseDom, "linkPointer " + this.expandImageClass);
                           }
                       }
                       this.own(on(collapseDom, "click",
                           lang.hitch(this, "_expandCollapseClickHandler", rowObject)));
                   }
                   else if (rowObject.level !== 0 &&
                       this.shouldShowCollapseDom(rowObject.parent) &&
                       rowObject.parent.collapseDoms[0].className.indexOf("linkPointer") < 0)
                   {
                       // If parent doesn't already have its collapse link, you should add it.
                       var parentCollapseDom = rowObject.parent.collapseDoms[0];
                       domClass.remove(rowObject.domNode, "collapsedRow");
                       domClass.add(parentCollapseDom, "linkPointer " + this.collapseimageClass);

                       this.own(
                           on(parentCollapseDom, "click", function(event) {
                               this._checkExpandCollapse(rowObject.parent);
                               baseEvent.stop(event);
                           })
                       );
                   }

                   cellWrapperDom.appendChild(collapseDom);
                   if (rowObject.level > 0) {
                       domStyle.set(cellWrapperDom, {
                           paddingLeft: rowObject.level * this.rowPadding+"px"
                       });
                   }
                   cellWrapperDom.appendChild(contentDom);
               }

               return cellDom;
           },

           _getLazyLoadedData: function(url) {
               this._set("queuedRequests", _.union(this.queuedRequests, [url]));
               var deferred = new Deferred();
               var self = this;
               baseXhr.get({
                   url: url,
                   handleAs: "json",
                   load: function(data) {
                       deferred.resolve(data);
                   },
                   error: function(error) {
                       deferred.reject(error);
                   },
                   handle: function(data, ioArgs) {
                       self._set("queuedRequests", _.without(self.queuedRequests, ioArgs.args.url));
                   }
               });
               return deferred;
           },

           _getItemsWithoutExistingRow: function(items) {
               return _.filter(items, function(item) {
                   return !item || !item[this.idAttribute] || !this._getRowObjectByItemId(item[this.idAttribute]);
               }, this);
           },

           _getItemsWithExistingRow: function(items) {
               return _.filter(items, function(item) {
                   return item && item[this.idAttribute] && this._getRowObjectByItemId(item[this.idAttribute]);
               }, this);
           },

           /**
            * Add expand/collapse arrow image as well as the click event
            */
           _addExpandCollapseImage: function(rowObj) {
               if (rowObj && rowObj.collapseDoms && rowObj.collapseDoms.length > 0) {
                   var collapseDom = rowObj.collapseDoms[0];
                   if (!domClass.contains(collapseDom, "linkPointer")) {
                       domClass.remove(rowObj.domNode, "collapsedRow");
                       domClass.remove(collapseDom, this.expandImageClass);
                       domClass.remove(collapseDom, this.collapseImageClass);
                       if (rowObj.expanded) {
                           domClass.add(collapseDom, "linkPointer " + this.collapseImageClass);
                       } else {
                           domClass.add(rowObj.domNode, "collapsedRow");
                           domClass.add(collapseDom, "linkPointer " + this.expandImageClass);
                       }
                       this.own(on(collapseDom, "click",
                           lang.hitch(this, "_expandCollapseClickHandler", rowObj)));
                   }
               }
           },

           _expandCollapseClickHandler: function(rowObj, event) {
               this._checkExpandCollapse(rowObj);
               baseEvent.stop(event);
           }
           /*** --- end update() support functions --- ***/

        }
    );
});

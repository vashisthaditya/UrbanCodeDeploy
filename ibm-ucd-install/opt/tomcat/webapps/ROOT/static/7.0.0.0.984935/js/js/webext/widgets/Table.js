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
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/xhr",
        "dojo/aspect",
        "dojo/dom-attr",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/dom-style",
        "dojo/json",
        "dojo/keys",
        "dojo/on",
        "dojox/html/entities",
        "dijit/Tooltip",
        "dijit/_TemplatedMixin",
        "dijit/_WidgetBase",
        "dijit/form/CheckBox",
        "dijit/form/DateTextBox",
        "dijit/form/FilteringSelect",
        "dijit/form/ComboBox",
        "dijit/form/Select",
        "dijit/form/TextBox",
        "dijit/form/NumberTextBox",
        "dijit/registry",
        "js/util/blocker/_BlockerMixin",
        "dojox/data/JsonRestStore",
        "dijit/_BidiSupport"
        ],
function(
        array,
        declare,
        lang,
        baseXhr,
        aspect,
        domAttr,
        domClass,
        domConstruct,
        domStyle,
        JSON,
        keys,
        on,
        entities,
        Tooltip,
        _TemplatedMixin,
        _WidgetBase,
        CheckBox,
        DateTextBox,
        FilteringSelect,
        ComboBox,
        Select,
        TextBox,
        NumberTextBox,
        registry,
        _BlockerMixin,
        JsonRestStore,
        bidi
) {
    var lscache = lang.getObject('lscache'); // get from kernel.global.lscache

    /**
     * A general purpose table widget, with pagination, sorting, and custom formatting. Uses an actual
     * HTML table for display.
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
     *  orderField / String                 Initial field name to sort results by.
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
     *  hidePagination / Boolean            Hides the pagination options and turns off pagination.
     *                                      Default value: false
     *  hideFooterLinks / Boolean           Hides the "refresh" and "print" links in the footer
     *  alwaysShowFilters / Boolean         Always show the filter fields for a table.
     *                                      Default value: true
     *  tableConfigKey / String             The key to use in a the table storage cookie to save the
     *                                      user's settings for the table.
     *  noDataMessage / String              Message to show when no records are found.
     *  url / String                        The URL of the rest service to retrieve data from.
     *  data / Array                        Preloaded data to show in the table.
     *  getData / Function                  Function to return all data for the table (instead of
     *                                      providing it all upfront in the data property).
     *  processXhrResponse / Function       Accepts a function which can perform extra operations on
     *                                      data retrieved via an Xhr call, before the standard
     *                                      operations are performed.
     *  customizedRefresh / Function        Accepts a function which can perform extra operations,
     *                                      such as, getFilterData, then update table url according to
     *                                      filterdata, before table refresh function is called.
     *  selectorField / String              If defined, Include a column containing dijit.form.Checkbox
     *                                      items that will be returned with the getSelectedData funciton
     *  getSelectedData / Function          Returns an array containing values for the given field for
     *                                      each selected row
     *  isSelectable / Function             Function that determines if an item should have a checkbox,
     *                                      when selectorField is defined.
     *  style / CSS Style Object            Styling to apply to the table widget. Optional.
     *  class / css class                   The class to apply to the table widget. Optional.
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
     *                                          filteringCombo
     *                                          text
     *                                          textExact
     *                                          select
     *                                          filteringSelect
     *                                          date
     *      filterClass / String            The name of the class which values should be converted to
     *                                      when filtering. Current supported values are:
     *                                          Boolean
     *                                          Long
     *                                          String (default)
     *                                          UUID
     *      filterUrl / String              URL to use when supplying the filter with values. Only
     *                                      used when the type is filteringSelect.
     *      filterIdAttr / String           The name of the attribute that holds an objects id.
     *                                      This is for JsonRestStore.
     *                                      Default value is filterField.
     *      filterLabelAttr / String        This is used to specify which attribute of the
     *                                      response from the REST endpoint should be used as the label
     *                                      for each item in the widget's dropdown menu. Currently
     *                                      only used in filteringCombo.
     *      filterSearchAttr / String       This is used to specify the query parameter's name that
     *                                      is sent to the REST endpoint when populating the filter's
     *                                      list of items. Currently only used in filteringCombo.
     *                                      The default value is filterField.
     *      filterListCap / Number          is used to specify the maximum number of items
     *                                      that should be put in the filter widget's dropdown menu.
     *                                      This is 40 by default. Currently only used in filteringCombo.
     *      filterOptions / Array           Options to show in the filter. Only used when the type is
     *                                      select.
     *          label / String
     *          value / String
     *      filterDefaultValue / String     This is the default value in the filter ComboBox. Only used when the type is
     *                                      filteringCombo.
     *      getRawValue / Function          Function which returns the raw (sort/filter) value of the
     *                                      column given a row of data as the argument. Must be
     *                                      provided for any sortable/filterable columns when using
     *                                      client-side processing. Not used with server-side
     *                                      processing.
     *      style / CSS Style Object        Style object to apply to all cells in the column.
     *      class / css class               apply class to all cells in this column
     *      styleHeading / CSS Style Object Style object to apply to the heading cells in the column, in addition to
     *                                      "style"
     *      formatter / Function            Function to use for custom cell contents. The formatter
     *                                      calls have this definition:
     *                                      formatter(row, result, cellDom)
     *                                      row: Data for the table row.
     *                                      result: Text value retrieved using the "field" column
     *                                              property, if applicable.
     *                                      cellDom: DOM node of the cell to be filled. Useful for
     *                                               attaching custom styles to the cell.
     *                                      Formatters can return a string, a DOM node, or a widget.
     *      parentWidget / Widget           Not used explicitly by the table. But, as a matter of
     *                                      convention, set a column's parentWidget to the containing
     *                                      widget if the column's formatter needs access to it. It
     *                                      will be available in the formatter as: this.parentWidget
     *  filterFields / Array
     *      name / String                   Name of the field being filtered.
     *      type / String                   Type of the field being filtered.
     *      values / [String]               Array of values to filter by.
     *      className / String              The name of the class which values should be converted to
     *                                      when filtering. For supported values, see filterClass
     *                                      documentation in columns documentation below.
     */
    return declare(
        [_WidgetBase, _TemplatedMixin, _BlockerMixin],
        {
            templateString:
                '<div class="webextTable">'+
                    '<table data-dojo-attach-point="tableAttach">'+
                        '<thead>'+
                            '<tr data-dojo-attach-point="theadAttach"></tr>'+
                            '<tr data-dojo-attach-point="filterAttach" class="noPrint tableFilterRow"></tr>'+
                        '</thead>'+
                        '<tfoot data-dojo-attach-point="tfootAttach" class="noPrint"></tfoot>'+
                    '</table>'+
                '</div>',

            rowsPerPage: 10,
            pageNumber: 1,
            orderField: null,
            sortType: "asc",
            serverSideProcessing: true,
            hidePagination: false,
            selectorField: false,
            selectors: [],
            hideFooterLinks: false,
            pageOptions: [10, 25, 50, 100, 250],
            totalRecords: undefined,
            prevPage: undefined,
            prevFilterFields: [],
            baseTextDir: null,
            alwaysShowFilters: true,
            customizedRefresh: util.noop,

            /**
             *
             */
            postCreate: function() {
                this.inherited(arguments);

                if (!this.noDataMessage) {
                    this.noDataMessage = i18n("No records found.");
                }

                if (!this.filterFields) {
                    this.filterFields = [];
                }
                this.filterWidgets = [];

                if (this.selectorField) {
                    var selectorField = {
                        name: "",
                        field: "_checkbox"
                    };
                    this.columns.unshift(selectorField);
                }

                // load/apply settings before drawing headings
                this.defaultRowsPerPage = this.rowsPerPage;
                this.defaultPageNumber = this.pageNumber;
                this.defaultOrderField = this.orderField;
                this.defaultSortType = this.sortType;
                var storedTableConfig = this.getStoredConfig();
                if (storedTableConfig !== undefined) {
                    if (storedTableConfig.rowsPerPage !== undefined) {
                        this.rowsPerPage = storedTableConfig.rowsPerPage;
                    }
                    if (storedTableConfig.pageNumber !== undefined) {
                        this.pageNumber = storedTableConfig.pageNumber;
                    }
                    if (storedTableConfig.orderField !== undefined) {
                        this.orderField = storedTableConfig.orderField;
                    }
                    if (storedTableConfig.sortType !== undefined) {
                        this.sortType = storedTableConfig.sortType;
                    }
                }

                this.drawHeadings();

                var hasFilters = false;

                array.forEach(this.columns, function(column) {
                    if (column.filterField) {
                        hasFilters = true;
                    }
                });

                if (hasFilters) {
                    this.drawFilterHiddenRow();

                    if (this.alwaysShowFilters) {
                        this.drawFilters();
                    }
                }

                if (this['class']) {
                    domClass.add(this.tableAttach, this['class']);
                }

                if (this.style) {
                    domStyle.set(this.tableAttach, this.style);
                }

                if (this['class']) {
                    domClass.add(this.tableAttach, this['class']);
                }

                if (this.style) {
                    domStyle.set(this.tableAttach, this.style);
                }

                this.loadTable();

                if (util.getIE() !== null) {
                    domClass.add(this.domNode, "ie" + util.getIE());
                }
            },

            /**
             *
             */
            getStoredConfig: function() {
                var result; // = undefined;

                if (!!this.tableConfigKey) {
                    if (lscache) {
                        var tableConfigJson = lscache.get(this.tableConfigKey);
                        if (typeof tableConfigJson === 'String') {
                            return JSON.parse(tableConfigJson);
                        }
                        if (!!tableConfigJson) {
                            return tableConfigJson;
                        }
                        // fall-back to the older cookie-store
                    }

                    var tableConfig = util.getCookie("savedTableConfig");
                    if (!!tableConfig) {
                        var tableConfigObject = JSON.parse(tableConfig);
                        result = tableConfigObject[this.tableConfigKey];
                    }
                }

                return result;
            },

            /**
             *
             */
            storeConfig: function(storedTableConfig) {
                if (!!this.tableConfigKey) {
                    if (lscache) {
                        // expire after 4 hrs
                        lscache.set(this.tableConfigKey, JSON.stringify(storedTableConfig), 4*60);
                        return;
                    }

                    var tableConfigObject = {};

                    var currentTableConfig = util.getCookie("savedTableConfig");
                    if (!!currentTableConfig) {
                        tableConfigObject = JSON.parse(currentTableConfig);
                    }

                    tableConfigObject[this.tableConfigKey] = storedTableConfig;

                    // If we've accumulated more than 3900 characters of table config (one cookie), knock
                    // content off in the opposite order it was added.
                    var first;
                    var newTableConfig;
                    var key;
                    while (JSON.stringify(tableConfigObject).length > 3900) {
                        first = true;
                        newTableConfig = {};
                        for (key in tableConfigObject) {
                            if (tableConfigObject.hasOwnProperty(key)) {
                                if (!first) {
                                    newTableConfig[key] = tableConfigObject[key];
                                }
                                first = false;
                            }
                        }
                        tableConfigObject = newTableConfig;
                    }

                    util.setCookie("savedTableConfig", JSON.stringify(tableConfigObject));
                }
            },

            /**
             * Display the table. If necessary, this will load data from the rest service.
             */
            loadTable: function() {
                var self = this;

                if (!!this.tableConfigKey) {
                    var storedTableConfig = {};

                    // Only store settings which deviate from the default for the table.
                    if (this.rowsPerPage !== this.defaultRowsPerPage) {
                        storedTableConfig.rowsPerPage = this.rowsPerPage;
                    }
                    if (this.pageNumber !== this.defaultPageNumber) {
                        storedTableConfig.pageNumber = this.pageNumber;
                    }
                    if (this.orderField !== this.defaultOrderField) {
                        storedTableConfig.orderField = this.orderField;
                    }
                    if (this.sortType !== this.defaultSortType) {
                        storedTableConfig.sortType = this.sortType;
                    }

                    this.storeConfig(storedTableConfig);
                }

                if (!this.serverSideProcessing
                        && this.cachedData !== undefined) {
                    // If the table is using client-side operations and already has data, just use that.
                    this.showTable(this.cachedData);
                }
                else if (this.data !== undefined) {
                    // Table is using preloaded data - just show that.
                    this.cachedData = this.data;
                    this.showTable(this.cachedData);
                }
                else if (this.getData !== undefined) {
                    this.cachedData = this.getData();
                    this.showTable(this.cachedData);
                }
                else {
                    // Show the loading spinner while waiting for a rest service.
                    this.block();

                    this.tableDataDeferred = baseXhr.get({
                        url: this.url,
                        content: this.getFilterData(),
                        handleAs: "json",
                        load: function(data, ioArgs) {
                            // if REST endpoint returns 204 response, there is no entity attached,
                            // therefore should initialize data with an empty array.
                            if (ioArgs.xhr.status === 204) {
                                data = [];
                            }
                            if (self.processXhrResponse) {
                                self.processXhrResponse(data);
                            }

                            // If server side processing is off, cache the data for use in table operations.
                            if (!self.serverSideProcessing) {
                                self.cachedData = data;
                            }

                            self.unblock();

                            var contentRange = ioArgs.xhr.getResponseHeader("Content-Range");
                            if (data.records && data.records.length === 0 && self.prevPage &&
                                    self.pageNumber !== self.prevPage) {
                                self.pageNumber = self.prevPage;
                                self.loadTable();
                            }
                            else if (self.serverSideProcessing && contentRange) {
                                // The response took the form of an array with headers
                                // indicating total content size. Reshape this data into what
                                // TreeTable expects.
                                // "Content-Range: 10-19/200" (showing 10-19 of 200 items)
                                var totalRecords = contentRange.substring(
                                        contentRange.indexOf("/")+1);
                                data = {
                                    records: data,
                                    totalRecords: Number(totalRecords)
                                };
                                self.showTable(data);
                            }
                            else {
                                self.showTable(data);
                            }
                        },
                        error: function(error, ioargs) {
                            self.unblock();
                            self.showError();
                        }
                    });

                    // remove the deferred upon completion
                    this.tableDataDeferred.addBoth(function() {
                        this.tableDataDeferred = null;
                    });
                }
            },

            /**
             * Clear cached data, if present, and reload the table.
             */
            refresh: function() {
                this.customizedRefresh();
                this.cachedData = undefined;
                this.loadTable();
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
                        rollbacks.push(setPropWithRollback(self, "rowsPerPage", Number.MAX_VALUE));
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
             *
             */
            showError: function() {
                var footerRow = domConstruct.create("tr");
                var footerCell = domConstruct.create("td");
                footerCell.className = "webextTableFooter";
                footerCell.colSpan = this.columns.length;

                var footerWrapper = domConstruct.create("div");

                var errorSpan = domConstruct.create("span", {
                    "style": {"fontSize":"medium"}
                });
                errorSpan.innerHTML = util.i18n("An error has occurred.");

                footerWrapper.appendChild(errorSpan);
                footerCell.appendChild(footerWrapper);
                footerRow.appendChild(footerCell);

                this.tfootAttach.appendChild(footerRow);
            },

            /**
             *
             */
            selectAll: function() {
                if (this.selectors) {
                    array.forEach(this.selectors, function (selector) {
                        if (!selector.get('disabled')) {
                            selector.set('checked', true);
                        }
                    });
                }
            },

            /**
             *
             */
            clearSelection: function() {
                if (this.selectors) {
                    array.forEach(this.selectors, function (selector) {
                        if (!selector.get('disabled')) {
                            selector.set('checked', false);
                        }
                    });
                }
            },

            /**
             *
             */
            getSelectedData: function(field) {
                var result = [];
                array.forEach(this.selectors, function(selector) {
                    if (selector.get('checked')) {
                        result.push(selector.get('fieldValue'));
                    }
                });
                return result;
            },

            isSelectable: function(row) {
                return true;
            },

            /**
             *
             */
            showTable: function(data) {
                var self = this;

                //
                // Actual table data / body
                //
                if (this.tbody) {
                    // remove existing data and destroy any child widgets
                    this.tableAttach.removeChild(this.tbody);
                    array.forEach(registry.findWidgets(this.tbody), this._destroyWidget);
                    this.tbody = null;
                }
                self.tbody = domConstruct.create("tbody", {
                    className: "treeTable-body"
                });

                var remainingSelections = [];
                if (self.selectors) {
                    remainingSelections = self.getSelectedData();
                }

                self.selectors = [];

                var records = [];
                if (this.serverSideProcessing) {
                    records = data.records;
                    if (data.totalRecords !== undefined && data.totalRecords >= 0) {
                        self.totalRecords = data.totalRecords;
                    }
                }
                else {
                    var displayData = this.getDisplayData(data);
                    self.totalRecords = displayData.totalRecords;
                    records = displayData.records;
                }

                var odd = false;
                array.forEach(records, function(row) {
                    var rowDom = domConstruct.create("tr");
                    if (odd) {
                        rowDom.className = "odd";
                    }
                    odd = !odd;

                    array.forEach(self.columns, function(column) {
                        var cellDom = domConstruct.create("td");
                        rowDom.appendChild(cellDom);

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

                        if (column.field !== undefined) {
                            if (column.field !== "_checkbox") {
                                result = row[column.field];
                            }
                            else if (self.isSelectable(row)) {
                                var fieldValue = row[self.selectorField];
                                var checked = remainingSelections.indexOf(fieldValue) > -1;
                                var enable = !row.security || !!row.security.write;
                                result = new CheckBox({
                                    disabled: !enable,
                                    checked: checked,
                                    fieldValue: fieldValue
                                });
                                result.on("change", function() {
                                    self.updateColumnSelector();
                                });

                                self.selectors.push(result);
                            }
                        }

                        if (column.formatter !== undefined) {
                            result = column.formatter(row, result, cellDom);
                        }

                        // Handle the type of the result of the formatter, and use the appropriate
                        // method to add the result to the cell.
                        if (result === null) {
                            // do nothing, cellDom is empty
                            console.debug("skipping empty result");
                        }
                        else if (result instanceof _WidgetBase) {
                            result.placeAt(cellWrapperDom);
                        }
                        else if ((typeof result === "object") && (result.nodeType === 1) &&
                                 (typeof result.style === "object") && (typeof result.ownerDocument ==="object")) {
                            cellWrapperDom.appendChild(result);
                        }
                        else if (result !== undefined && typeof result !== "object") {
                            cellWrapperDom.innerHTML = entities.encode(String(result));
                        }

                        if (typeof result === "string") {
                            domAttr.set(cellWrapperDom, "dir", util.getResolvedBTD(result));
                        } else {
                            domAttr.set(cellWrapperDom, "dir", util.getResolvedBTD(row.name));
                        }
                        domAttr.set(cellWrapperDom, "align", util.getUIDirAlign());
                    });

                    self.tbody.appendChild(rowDom);
                });

                if (self.selectorField && remainingSelections) {
                    self.updateColumnSelector();
                }

                domConstruct.place(self.tbody, self.tfootAttach, "before");

                var totalPages;
                if (self.totalRecords !== undefined) {
                    totalPages = Math.ceil(self.totalRecords/this.rowsPerPage);
                }
                //
                // Rebuild the footer. This must be done each time because the data may have changed
                // and we need an up-to-date number of pages based on total rows.
                //
                domConstruct.empty(this.tfootAttach);
                if (!this.hidePagination) {
                    var footerRow = domConstruct.create("tr");
                    var footerCell = domConstruct.create("td");
                    footerCell.className = "webextTableFooter";

                    //IE doesn't know how to handle a colSpan of 0
                    footerCell.colSpan = this.columns.length || 1;

                    var footerWrapper = domConstruct.create("div");

                    var totalResultsContainer =
                        domConstruct.create("div", {className: "numberOfItemsContainer"}, footerWrapper);
                    var totalResultsLabel = domConstruct.create("span", {}, totalResultsContainer);
                    if (self.totalRecords === 0 && self.noDataMessage !== undefined) {
                        var noDataRow = domConstruct.create("tr", {
                            "class": "noDataRow"
                        }, this.tfootAttach);
                        var noDataCell = domConstruct.create("td", {
                            colSpan: self.columns.length
                        }, noDataRow);

                        domConstruct.create("span", {
                            innerHTML: this.noDataMessage
                        }, noDataCell);
                    }
                    else {
                        if (self.totalRecords === 1) {
                            totalResultsLabel.innerHTML = util.i18n("%s record", self.totalRecords);
                        }
                        else if (self.totalRecords) {
                            totalResultsLabel.innerHTML = util.i18n("%s records", self.totalRecords);
                        }
                    }


                    if (!this.hideFooterLinks) {
                        if (self.totalRecords) {
                            var refreshSpacer = domConstruct.create("span", {}, totalResultsContainer);
                            refreshSpacer.innerHTML = "-";
                        }

                        var refreshLink = domConstruct.create("a", {}, totalResultsContainer);
                        domClass.add(refreshLink, 'linkPointer');
                        refreshLink.onclick = function() {
                            self.refresh();
                        };
                        refreshLink.innerHTML = util.i18n("Refresh");
                    }

                    if (self.totalRecords !== 0 && !this.hidePagination) {
                        // printer link
                        if (!this.hideFooterLinks) {
                            var printLink = domConstruct.create("a", {
                                    "class": "linkPointer",
                                    "innerHTML": util.i18n("Print")
                                }, totalResultsContainer);
                            on(printLink, "click", function(){self.print();});
                        }

                        // -- Rows Per Page selector
                        var perPageDivContainer = domConstruct.create("div");
                        perPageDivContainer.className = "perPage";

                        // Establish a list of numbers of rows to show based on configured options.
                        var pageOptions = [];
                        array.forEach(this.pageOptions, function(pageOption) {
                            pageOptions.push({
                                label: String(pageOption),
                                value: String(pageOption),
                                selected: self.rowsPerPage === pageOption
                            });
                        });

                        var perPageLabel = domConstruct.create("span");
                        perPageLabel.style.paddingTop = "2px";
                        perPageLabel.innerHTML = util.i18n("Rows");
                        perPageDivContainer.appendChild(perPageLabel);
                        footerWrapper.appendChild(perPageDivContainer);

                        var perPageSelect = new Select({
                            options: pageOptions,
                            onChange: function(value) {
                                value = Number(value);

                                if (self.rowsPerPage !== value) {
                                    var startRecord = (self.pageNumber - 1) * self.rowsPerPage + 1;
                                    self.rowsPerPage = value;
                                    self.pageNumber = Math.ceil(startRecord/self.rowsPerPage);
                                    self.loadTable();
                                }
                            }
                        });

                        domStyle.set(perPageSelect.domNode, "display", "inline-block");
                        perPageSelect.placeAt(perPageDivContainer);
                        this.own(perPageSelect);

                        // -- Page number / navigation selector
                        var pageNumberContainer = domConstruct.create("div", {
                            className: "pageNumbers inline-block"
                        });

                        var firstLink;
                        var previousLink;
                        if (this.pageNumber > 1) {
                            firstLink = domConstruct.create("a", {"class":"linkPointer", "tabindex": "0"});
                            this._createImg("arrow_fastBackwards", firstLink, {"alt": util.i18n("first page")});
                            var firstClick = function() {
                                self.pageNumber = 1;
                                self.loadTable();
                            };
                            firstLink.onclick = firstClick;
                            firstLink.onkeyup = function (event) {
                                if (self._isEnterKeyPressed(event)) {
                                    firstClick();
                                }
                            };
                            pageNumberContainer.appendChild(firstLink);

                            previousLink = domConstruct.create("a", {"class":"linkPointer", "tabindex": "0"});
                            this._createImg("arrow_backwards", previousLink, {"alt": util.i18n("previous page")});
                            var prevClick = function() {
                                self.prevPage = self.pageNumber;
                                self.pageNumber--;
                                self.loadTable();
                            };
                            previousLink.onclick = prevClick;
                            previousLink.onkeyup = function (event) {
                                if (self._isEnterKeyPressed(event)) {
                                    prevClick();
                                }
                            };
                            pageNumberContainer.appendChild(previousLink);
                        }
                        else {
                            firstLink = domConstruct.create("span");
                            this._createImg("arrow_fastBackwards_grey", firstLink,
                                {"alt": util.i18n("first page disabled")});
                            pageNumberContainer.appendChild(firstLink);

                            previousLink = domConstruct.create("span");
                            this._createImg("arrow_backwards_grey", previousLink,
                                {"alt": util.i18n("previous page disabled")});
                            pageNumberContainer.appendChild(previousLink);
                        }

                        if (totalPages && this.pageNumber > totalPages) {
                            this.pageNumber = totalPages;
                        }
                        var pageBox = new TextBox({
                            title: util.i18n("current page"),
                            name: "page",
                            value: this.pageNumber,
                            onKeyPress: function(event) {
                                if (self._isEnterKeyPressed(event)) {
                                    self.prevPage = self.pageNumber;
                                    var newPage = pageBox.textbox.value;
                                    if (newPage >= 1 && newPage !== self.pageNumber) {
                                        if (totalPages && newPage > totalPages) {
                                            newPage = totalPages;
                                        }
                                        self.pageNumber = newPage;
                                        self.loadTable();
                                    }
                                }
                            },
                            onFocus: function() {
                                pageBox.textbox.select();
                            }
                        });
                        var pageDigits = String(this.pageNumber).length;
                        domStyle.set(pageBox.domNode, "width", (10 + pageDigits * 10) + "px");
                        pageBox.placeAt(pageNumberContainer);
                        self.own(pageBox);
                        pageBox.textbox.style.textAlign = "center";

                        var pageCountLabel = domConstruct.create("span");
                        if (totalPages) {
                            pageCountLabel.innerHTML = "/ " + totalPages;
                            pageNumberContainer.appendChild(pageCountLabel);
                        }

                        var nextLink;
                        var lastLink;
                        if (this.pageNumber < totalPages || !totalPages) {
                            nextLink = domConstruct.create("a", {"class":"linkPointer", "tabindex": "0"});
                            this._createImg("arrow_forward", nextLink, {"alt": util.i18n("next page")});
                            var nextClick = function() {
                                self.prevPage = self.pageNumber;
                                self.pageNumber++;
                                self.loadTable();
                            };
                            nextLink.onclick = nextClick;
                            nextLink.onkeyup = function (event) {
                                if (self._isEnterKeyPressed(event)) {
                                    nextClick();
                                }
                            };
                            pageNumberContainer.appendChild(nextLink);

                            if (self.totalRecords) {
                                lastLink = domConstruct.create("a", {"class":"linkPointer", "tabindex": "0"});
                                this._createImg("arrow_fastForward", lastLink, {"alt": util.i18n("last page")});
                                var lastClick = function() {
                                    self.pageNumber = totalPages;
                                    self.loadTable();
                                };
                                lastLink.onclick = lastClick;
                                lastLink.onkeyup = function (event) {
                                    if (self._isEnterKeyPressed(event)) {
                                        lastClick();
                                    }
                                };
                                pageNumberContainer.appendChild(lastLink);
                            }
                            else {
                                lastLink = domConstruct.create("span");
                                this._createImg("arrow_fastForward_grey", lastLink,
                                        {"alt": util.i18n("last page disabled")});
                                pageNumberContainer.appendChild(lastLink);
                            }
                        }
                        else {
                            nextLink = domConstruct.create("span");
                            this._createImg("arrow_forward_grey", nextLink, {"alt": util.i18n("next page disabled")});
                            pageNumberContainer.appendChild(nextLink);

                            lastLink = domConstruct.create("span");
                            this._createImg("arrow_fastForward_grey", lastLink,
                                    {"alt": util.i18n("last page disabled")});
                            pageNumberContainer.appendChild(lastLink);
                        }
                        footerWrapper.appendChild(pageNumberContainer);
                    }
                    footerCell.appendChild(footerWrapper);

                    footerRow.appendChild(footerCell);
                    this.tfootAttach.appendChild(footerRow);
                }
            },

            /**
             *
             */
            drawHeadings: function() {
                var self = this;
                domConstruct.empty(this.theadAttach);

                array.forEach(this.columns, function(column) {
                    var columnHeading = domConstruct.create("th");
                    if (column.style) {
                        domStyle.set(columnHeading, column.style);
                    }
                    if (column.styleHeading) {
                        domStyle.set(columnHeading, column.styleHeading);
                    }
                    if (column.width !== undefined) {
                        columnHeading.style.width = column.width;
                    }

                    if (column['class']) {
                        domClass.add(columnHeading,column['class']);
                    }

                    // Wrap the contents of the cell in a relatively positioned div to allow absolute
                    // positioning of child elements.
                    var columnHeadingWrapper = domConstruct.create("div", {
                        "style": {"position":"relative"}
                    });

                    var columnSelector;
                    if (column.field === "_checkbox") {
                        columnSelector = new CheckBox({
                            label: util.i18n("Select All")
                        });
                        self.own(columnSelector);

                        columnSelector.on("click", function() {
                            var selectedRows = self.getSelectedData().length;
                            var visibleRows = self.selectors.length;
                            if (selectedRows === visibleRows) {
                                columnSelector.set("label", util.i18n("Select All"));
                                self.clearSelection();
                            }
                            else {
                                columnSelector.set("label", util.i18n("Select None"));
                                self.selectAll();
                            }
                        });


                        self.updateColumnSelector = function() {
                            var selectedRows = self.getSelectedData().length;
                            var visibleRows = self.selectors.length;

                            if (selectedRows === visibleRows) {
                                columnSelector.set('checked', true);
                            }
                            else {
                                columnSelector.set('checked', false);
                            }
                        };

                        columnSelector.placeAt(columnHeadingWrapper);
                    }
                    var columnLabel = domConstruct.create("span");
                    columnLabel.innerHTML = entities.encode(String(column.name));
                    columnHeadingWrapper.appendChild(columnLabel);

                    if (column.description) {
                        var helpImage = self._createImg("helpImage", columnHeadingWrapper);
                        var helpTip = new Tooltip({
                            connectId: [helpImage],
                            label: column.description,
                            showDelay: 200,
                            position: ["after", "above", "below", "before"]
                        });
                        this.own(helpTip);
                    }

                    if (column.orderField) {
                        // make the columnHeadingWrapper focusable
                        domClass.add(columnHeading, "sortableColumn");
                        columnHeadingWrapper.tabIndex = 0;

                        if (column.orderField === self.orderField) {
                            if (self.sortImageContainer && self.sortImageContainer.parentNode) {
                                self.sortImageContainer.parentNode.removeChild(self.sortImageContainer);
                                self.sortImageContainer = undefined;
                            }

                            var sortImageContainer = domConstruct.create("div", {
                                "class":"sortImageWrapper"
                            });

                            // reflect current sort state
                            var sortImage = self._createImg("sortImage", sortImageContainer);
                            domClass.toggle(sortImage, "arrow_asc", self.sortType === "asc");
                            domClass.toggle(sortImage, "arrow_desc", self.sortType === "desc");
                            sortImage.alt = ( self.sortType === "asc" ? 'ascending' : 'descending');

                            sortImageContainer.appendChild(sortImage);
                            columnHeadingWrapper.appendChild(sortImageContainer);

                            self.sortImageContainer = sortImageContainer;
                        }

                        var doSort = function() {
                            // Destroy an existing sort image if one exists.
                            if (self.sortImageContainer) {
                                self.sortImageContainer.parentNode.removeChild(self.sortImageContainer);
                                self.sortImageContainer = null;
                            }

                            var sortImageContainer = domConstruct.create("div", {
                                "class":"sortImageWrapper"
                            }, columnHeadingWrapper);
                            var sortImage = self._createImg("sortImage", sortImageContainer);
                            sortImageContainer.appendChild(sortImage);

                            if (self.orderField === column.orderField && self.sortType === "asc") {
                                // detect if we are re-sorting (reversing) the current column
                                self.sortType = "desc";
                            }
                            else {
                                self.sortType = "asc";
                            }

                            domClass.toggle(sortImage, "arrow_asc", self.sortType === "asc");
                            domClass.toggle(sortImage, "arrow_desc", self.sortType === "desc");
                            sortImage.alt = ( self.sortType === "asc" ? 'ascending' : 'descending');

                            self.sortImageContainer = sortImageContainer;
                            self.sortColumn = column;
                            self.orderField = column.orderField;
                            self.refresh();
                        };
                        on(columnHeading, "click", doSort);
                        on(columnHeading, "keyup", function (event) {
                            if (self._isEnterKeyPressed(event)) {
                                doSort();
                            }
                        });
                    }
                    columnHeading.appendChild(columnHeadingWrapper);
                    self.theadAttach.appendChild(columnHeading);
                });
            },

            /**
             *
             */
            drawFilterHiddenRow: function() {
                var self = this;
                domConstruct.empty(this.filterAttach);

                var filterCell = domConstruct.create("td");
                filterCell.colSpan = this.columns.length;

                var filterLink = domConstruct.create("a");
                domClass.add(filterLink, 'linkPointer');
                filterLink.innerHTML = util.i18n("Show Filters");
                filterLink.onclick = function() {
                    self.drawFilters();
                };
                filterCell.appendChild(filterLink);
                this.filterAttach.appendChild(filterCell);
            },

            /**
             *
             */
            drawFilters: function() {
                var self = this;
                domConstruct.empty(this.filterAttach);

                array.forEach(this.columns, function(column) {
                    var columnFilter = domConstruct.create("td");

                    var columnFilterWrapper = domConstruct.create("div");
                    columnFilterWrapper.style.position = "relative";

                    // If this is the first column, show the reset filter button.
                    if (column === self.columns[0]  && !self.alwaysShowFilters) {
                        var clearFilterButtonContainer = domConstruct.create("div", {
                            "style": {
                                "position": "absolute",
                                "top": "3px"
                            }
                        });
                        var positionProperty = self.isLeftToRight() ? "left" : "right";
                        domStyle.set(clearFilterButtonContainer, positionProperty, "3px");
                        var clearFilterLink =
                            domConstruct.create("a", {"class":"linkPointer"}, clearFilterButtonContainer);
                        self._createImg("icon_delete", clearFilterLink);
                        clearFilterLink.alt = util.i18n("Clear and hide filters");
                        clearFilterLink.onclick = function() {
                            self.drawFilterHiddenRow();
                            self.filterFields = [];
                            self.refresh();
                        };

                        columnFilterWrapper.appendChild(clearFilterButtonContainer);
                    }

                    if (column.filterField) {
                        var filterWidget = null;
                        var secondFilterWidget = null;
                        switch (column.filterType) {
                            case "filteringCombo":
                                var comboStore = new JsonRestStore({
                                    target: column.filterUrl,
                                    idAttribute: column.filterIdAttr || column.filterField
                                });
                                self.own(comboStore);
                                filterWidget = new ComboBox({
                                    name: column.filterField,
                                    store: comboStore,
                                    autoComplete: false,
                                    required: false,
                                    queryExpr: "*${0}*",
                                    query: {
                                        "rowsPerPage": column.filterListCap || 40
                                    },
                                    // searchAttr specifies which attribute of query object should be
                                    // used to specify the query expression and sent to the REST endpoint
                                    searchAttr: column.filterSearchAttr || column.filterField,
                                    labelAttr: column.filterLabelAttr || column.filterField,
                                    searchDelay: 500,
                                    onChange: function(value) {
                                        var existingFieldData = util.getNamedProperty(self.filterFields, column.filterField);
                                        if (existingFieldData !== undefined) {
                                            util.removeFromArray(self.filterFields, existingFieldData);
                                        }
                                        self.filterFields.push({
                                            name: column.filterField,
                                            type: "eq",
                                            className: column.filterClass,
                                            values: [value]
                                        });
                                        if ((existingFieldData === undefined && value)
                                                || (existingFieldData !== undefined
                                                        && existingFieldData.values[0] !== value)) {
                                            self.pageNumber = 1;
                                            self.refresh();
                                        }
                                    }
                                });

                                if (column.filterDefaultValue) {
                                    filterWidget.set('value', column.filterDefaultValue);
                                    self.filterFields.push({
                                        name: column.filterField,
                                        type: "eq",
                                        className: column.filterClass,
                                        values: [column.filterDefaultValue]
                                    });
                                }
                                break;
                            case "filteringSelect":
                                var filteringSelectStore = new JsonRestStore({
                                    target: column.filterUrl,
                                    idAttribute: column.filterIdAttr || "name"
                                });
                                self.own(filteringSelectStore);
                                filterWidget = new FilteringSelect({
                                    name: column.filterField,
                                    store: filteringSelectStore,
                                    autoComplete: false,
                                    required: false,
                                    onChange: function(value) {
                                        var existingFieldData =
                                            util.getNamedProperty(self.filterFields, column.filterField);
                                        if (existingFieldData !== undefined) {
                                            util.removeFromArray(self.filterFields, existingFieldData);
                                        }
                                        self.filterFields.push({
                                            name: column.filterField,
                                            type: "eq",
                                            className: column.filterClass,
                                            values: [value]
                                        });
                                        if ((existingFieldData === undefined && value)
                                                || (existingFieldData !== undefined
                                                        && existingFieldData.values[0] !== value)) {
                                            self.pageNumber = 1;
                                            self.refresh();
                                        }
                                    }
                                });
                                break;
                            case "text":
                            case "textExact":
                                filterWidget = new TextBox({
                                    name: column.filterField,
                                    placeHolder: "Filter",
                                    onChange: function(value) {
                                        var existingFieldData =
                                            util.getNamedProperty(self.filterFields, column.filterField);
                                        if (existingFieldData !== undefined) {
                                            util.removeFromArray(self.filterFields, existingFieldData);
                                        }

                                        if (value) {
                                            var type = "like";
                                            if (column.filterType === "textExact") {
                                                type = "eq";
                                            }

                                            self.filterFields.push({
                                                name: column.filterField,
                                                type: type,
                                                className: column.filterClass,
                                                values: [value]
                                            });
                                        }

                                        if ((existingFieldData === undefined && value)
                                                || (existingFieldData !== undefined
                                                        && existingFieldData.values[0] !== value)) {
                                            self.pageNumber = 1;
                                            self.refresh();
                                        }
                                    },
                                    onKeyPress: function(event) {
                                        if (event.charOrCode === 13) {
                                            this.onChange(filterWidget.textbox.value);
                                        }
                                    },
                                    onBlur: function(event) {
                                        this.onChange(filterWidget.textbox.value);
                                    }
                                });
                                break;
                            case "number":
                                filterWidget = new NumberTextBox({
                                    name: column.filterField,
                                    constraints: {pattern: "0"},
                                    onChange: function(value) {
                                        var existingFieldData =
                                            util.getNamedProperty(self.filterFields, column.filterField);
                                        if (existingFieldData !== undefined) {
                                            util.removeFromArray(self.filterFields, existingFieldData);
                                        }

                                        if (value) {
                                            var type = "eq";
                                            self.filterFields.push({
                                                name: column.filterField,
                                                type: type,
                                                className: column.filterClass,
                                                values: [value]
                                            });
                                        }

                                        if ((existingFieldData === undefined && value)
                                                || (existingFieldData !== undefined
                                                        && existingFieldData.values[0] !== value)) {
                                            self.pageNumber = 1;
                                            self.refresh();
                                        }
                                    },
                                    onKeyPress: function(event) {
                                        if (event.charOrCode === 13) {
                                            this.onChange(filterWidget.textbox.value);
                                        }
                                    },
                                    onBlur: function(event) {
                                        this.onChange(filterWidget.textbox.value);
                                    }
                                });
                                break;
                            case "select":
                                var params = {
                                        name: column.filterField,
                                        onChange: function(value) {
                                            var existingFieldData =
                                                util.getNamedProperty(self.filterFields, column.filterField);
                                            if (existingFieldData !== undefined) {
                                                util.removeFromArray(self.filterFields, existingFieldData);
                                            }
                                            var filterValue = value;
                                            if (value === '_EMPTY_VALUE_') {
                                                filterValue = '';
                                            }
                                            var valueIsSet = filterValue !== undefined && filterValue !== null;

                                            if (filterValue !== "Any") {
                                                self.filterFields.push({
                                                    name: column.filterField,
                                                    type: "eq",
                                                    className: column.filterClass,
                                                    values: [filterValue]
                                                });
                                            }
                                            if ((existingFieldData === undefined && valueIsSet)
                                                    || (existingFieldData !== undefined
                                                            && existingFieldData.values[0] !== filterValue)) {
                                                self.pageNumber = 1;
                                                self.refresh();
                                            }
                                        }
                                };

                                if (!!column.filterUrl) {
                                    var selectStore = new JsonRestStore({
                                        "target": column.filterUrl,
                                        "idAttribute": column.filterIdAttr || "id",
                                        "labelAttribute": column.filterLabelAttr || "label"
                                    });
                                    self.own(selectStore);
                                    params.store = selectStore;
                                }
                                else {
                                    var options = [{
                                        label: util.i18n("Any"),
                                        value: "Any"
                                    }];
                                    array.forEach(column.filterOptions, function(filterOption) {
                                        options.push(filterOption);
                                    });
                                    params.options = options;
                                }

                                filterWidget = new Select(params);
                                break;
                            case "date":
                                filterWidget = new DateTextBox({
                                    name: column.filterField+"_low",
                                    onChange: function(value) {
                                        var timeValue;
                                        if (value) {
                                            timeValue = value.getTime();
                                        }
                                        else {
                                            timeValue = 0;
                                        }
                                        var existingFieldData =
                                            util.getNamedProperty(self.filterFields, column.filterField);
                                        var type = "range";

                                        if (existingFieldData === undefined) {
                                            self.filterFields.push({
                                                name: column.filterField,
                                                type: type,
                                                className: column.filterClass
                                            });
                                        }
                                        existingFieldData =
                                            util.getNamedProperty(self.filterFields, column.filterField);
                                        if (existingFieldData.values === undefined) {
                                            existingFieldData.values = [];
                                            existingFieldData.values[0] = {
                                                low: timeValue,
                                                high: new Date().getTime()
                                            };
                                        }
                                        else {
                                            existingFieldData.values[0].low = timeValue;
                                        }

                                        self.pageNumber = 1;
                                        self.refresh();
                                    },
                                    onKeyPress: function(event) {
                                        if (event.charOrCode === 13) {
                                            if (!!filterWidget.textbox.value) {
                                                filterWidget.set("value", new Date(filterWidget.textbox.value));
                                            }
                                            else {
                                                filterWidget.set("value", null);
                                            }
                                        }
                                    }
                                });
                                secondFilterWidget = new DateTextBox({
                                    name: column.filterField+"_hi",
                                    onChange: function(value) {
                                        var timeValue;
                                        if (value) {
                                            // One day in milliseconds 24*60*60*1000 = 86400000
                                            timeValue = value.getTime() + 86400000;
                                        }
                                        else {
                                            timeValue = new Date().getTime();
                                        }
                                        var existingFieldData =
                                            util.getNamedProperty(self.filterFields, column.filterField);
                                        var type = "range";

                                        if (existingFieldData === undefined) {
                                            self.filterFields.push({
                                                name: column.filterField,
                                                type: type,
                                                className: column.filterClass
                                            });
                                        }
                                        existingFieldData =
                                            util.getNamedProperty(self.filterFields, column.filterField);
                                        if (existingFieldData.values === undefined) {
                                            existingFieldData.values = [];
                                            existingFieldData.values[0] = {
                                                high: timeValue,
                                                low: 0
                                            };
                                        }
                                        else {
                                            existingFieldData.values[0].high = timeValue;
                                        }

                                        self.pageNumber = 1;
                                        self.refresh();
                                    },
                                    onKeyPress: function(event) {
                                        if (event.charOrCode === 13) {
                                            if (!!secondFilterWidget.textbox.value) {
                                                secondFilterWidget.set("value",
                                                        new Date(secondFilterWidget.textbox.value));
                                            }
                                            else {
                                                secondFilterWidget.set("value", null);
                                            }
                                        }
                                    }
                                });
                                break;
                            default:
                                console.error("Unexpected filterType: "+column.filterType);
                        }
                        var existingFieldData = util.getNamedProperty(self.filterFields, column.filterField);
                        if (existingFieldData !== undefined) {
                            if (secondFilterWidget !== null) {
                                filterWidget.set('value', existingFieldData.values[0].low);
                            }
                            else {
                                filterWidget.set('value', existingFieldData.values[0]);
                            }
                        }

                        self.filterWidgets.push(filterWidget);
                        self.own(filterWidget);
                        filterWidget.placeAt(columnFilterWrapper);
                        if (secondFilterWidget !== null) {
                            if (existingFieldData !== undefined) {
                                secondFilterWidget.set('value', existingFieldData.values[0].high);
                            }
                            domConstruct.create("span", {"innerHTML":"&nbsp;-&nbsp;"}, columnFilterWrapper);
                            secondFilterWidget.placeAt(columnFilterWrapper);
                        }
                    }
                    else {
                        domConstruct.create("div", {"innerHTML":"&nbsp;", "style":{"height":"16px"}},
                                columnFilterWrapper);
                    }
                    columnFilter.appendChild(columnFilterWrapper);
                    self.filterAttach.appendChild(columnFilter);
                });
            },

            setFilterValue: function (name, value, type, className) {
                var self = this;
                var thisWidget; // = undefined;
                array.forEach(self.filterWidgets, function(widget, index) {
                    if (widget.name === name) {
                        widget.value = value;
                        thisWidget = widget;
                    }
                });

                var thisField;
                if (thisWidget === undefined) {
                    //we didn't find it in shown widgets set the field
                    array.forEach(self.filterFields, function(field, index) {
                        if (field.name === name) {
                            thisField = field;
                            field.values=value;
                            field.className = className;
                            field.type = type;
                        }
                    });
                }

                if (thisField === undefined) {
                    //still didn't find it... just set it
                    self.filterFields.push({
                        name:name,
                        values:value,
                        type:type,
                        className:className
                    });
                }
                self.refresh();
            },

            /**
             *
             */
            getFilterData: function() {
                var self = this;
                var rowsPerPage = self.rowsPerPage;
                var pageNumber = self.pageNumber;
                if (self.hidePagination) {
                    rowsPerPage = 99999;
                    pageNumber = 1;
                }

                var result = {
                    rowsPerPage: rowsPerPage,
                    pageNumber: pageNumber,
                    orderField: self.orderField,
                    sortType: self.sortType,
                    filterFields: []
                };

                if (self.filters && !self.baseFilters) {
                    self.baseFilters = self.filters;
                }

                // Add any filters pre-set in the configuration of this table.
                array.forEach(self.baseFilters, function(filter) {
                    result.filterFields.push(filter.name);
                    var filterValues = [];
                    array.forEach(filter.values, function(value) {
                        filterValues.push(value);
                    });
                    result["filterValue_"+filter.name] = filterValues;
                    result["filterType_"+filter.name] = filter.type;
                    if (filter.className !== undefined) {
                        result["filterClass_"+filter.name] = filter.className;
                    }
                    else {
                        result["filterClass_"+filter.name] = "String";
                    }
                });

                // Add user-set filters.
                array.forEach(self.filterFields, function(field) {
                    result.filterFields.push(field.name);
                    var filterValues = [];
                    array.forEach(field.values, function(value) {
                        filterValues.push(value);
                    });
                    result["filterValue_"+field.name] = filterValues;
                    result["filterType_"+field.name] = field.type;
                    if (field.className !== undefined) {
                        result["filterClass_"+field.name] = field.className;
                    }
                    else {
                        result["filterClass_"+field.name] = "String";
                    }
                });

                if ((self.filterFields && !self.prevFilterFields) ||
                        (!self.filterFields && self.prevFilterFields) ||
                        (self.filterFields.length !== self.prevFilterFields.length)) {
                    self.totalRecords = undefined;
                }
                else {
                    var i = 0;
                    var j = 0;
                    var found = false;
                    for (i = 0; i < self.filterFields.length; i++) {
                        found = false;
                        for (j = 0; j < self.prevFilterFields.length; j++) {
                            if (self.filterFields[i] === self.prevFilterFields[j]) {
                                found = true;
                                break;
                            }
                        }

                        if (!found) {
                            // Lists are different
                            self.totalRecords = undefined;
                            break;
                        }
                    }
                }

                self.prevFilterFields = [];
                array.forEach(self.filterFields, function(filterField) {
                    self.prevFilterFields.push(filterField);
                });

                return result;
            },

            /**
             * Apply table view configuration data (sort/filter/pagination) to produce the viewable
             * set of data, given all of the data.
             */
            getDisplayData: function(data) {
                var self = this;
                var result = {};
                var records = [];

                // Pass through all data and collect any rows which match the filter. This pass is
                // only performed for each field being filtered.
                array.forEach(self.filterFields, function(field) {
                    var fieldColumn; // = undefined;
                    array.forEach(self.columns, function(column) {
                        if (column.filterField === field.name) {
                            fieldColumn = column;
                        }
                    });

                    if (fieldColumn === undefined) {
                        console.error("Filtered field "+field.name+" had no column match.");
                    }
                    else if (fieldColumn.getRawValue === undefined) {
                        console.error("Filtered column "+fieldColumn.name+" had no getRawValue function.");
                    }
                    else {
                        var filteredData = [];
                        array.forEach(data, function(row) {
                            var pass = false;

                            var rawValue = fieldColumn.getRawValue(row);
                            if (rawValue === null || rawValue === undefined) {
                                rawValue = "";
                            }
                            if (rawValue.normalize) {
                                rawValue = rawValue.normalize('NFC');
                            }

                            array.forEach(field.values, function(value) {
                                if (value.normalize) {
                                    value= value.normalize('NFC');
                                }
                                if (field.type === "eq") {
                                    if (value === rawValue) {
                                        pass = true;
                                    }
                                }
                                else if (field.type === "like") {
                                    if (rawValue.toLowerCase().indexOf(value.toLowerCase()) !== -1) {
                                        pass = true;
                                    }
                                }
                                else if (field.type === "daterange") {
                                    var trueValueHigh;
                                    var trueValueLow;

                                    if (value.high !== undefined) {
                                        trueValueHigh = value.high.getTime();
                                    }
                                    else {
                                        trueValueHigh = 9007199254740992;
                                    }

                                    if (value.low !== undefined) {
                                        trueValueLow = value.low.getTime();
                                    }
                                    else {
                                        trueValueLow = 0;
                                    }

                                    var newRaw = Number(rawValue);
                                    if (newRaw <= trueValueHigh && newRaw >= trueValueLow) {
                                        pass=true;
                                    }
                                }
                            });

                            if (pass) {
                                filteredData.push(row);
                            }
                        });
                        data = filteredData;
                    }
                });

                // Sort the data, if necessary.
                if (self.orderField !== undefined) {
                    array.forEach(self.columns, function(column) {
                        if (column.orderField !== undefined
                                && column.orderField === self.orderField) {
                            data.sort(function(first, second) {
                                var firstValue = column.getRawValue(first);
                                var secondValue = column.getRawValue(second);

                                var hasFirstValue = true;
                                var hasSecondValue = true;

                                if (firstValue === null || firstValue === undefined) {
                                    hasFirstValue = false;
                                }
                                if (secondValue === null || secondValue === undefined) {
                                    hasSecondValue = false;
                                }

                                var result = 0;
                                if (!hasFirstValue || !hasSecondValue) {
                                    if (!hasFirstValue && !hasSecondValue) {
                                        result = 0;
                                    }
                                    else if (hasFirstValue) {
                                        result = 1;
                                    }
                                    else if (hasSecondValue) {
                                        result = -1;
                                    }
                                }
                                else {
                                    var type = typeof firstValue;
                                    if (type === "number") {
                                        result = firstValue - secondValue;
                                    }
                                    else if (type === "string") {
                                        result = firstValue.localeCompare(secondValue);
                                    }
                                    else if (type === "object") {
                                        if (firstValue instanceof Date) {
                                            result = firstValue - secondValue;
                                        }
                                    }
                                }

                                if (self.sortType === "desc") {
                                    result = result*(-1);
                                }
                                return result;
                            });
                        }
                    });
                }

                var totalRecords = data.length;

                // Slice the data to return according to pagination settings.
                if (!self.hidePagination) {
                    var startRow = (self.pageNumber-1) * self.rowsPerPage;
                    if (totalRecords <= startRow && startRow > 0) {
                        console.error("Page number out of range: Start index " + startRow + " is higher than "
                                + totalRecords);
                        self.pageNumber = Math.ceil(totalRecords / self.rowsPerPage);
                        startRow = (self.pageNumber-1) * self.rowsPerPage;
                    }
                    records = data.slice(startRow, startRow+self.rowsPerPage);
                }
                else {
                    records = data;
                }

                result.records = records;
                result.totalRecords = totalRecords;
                return result;
            },

            /**
             *
             */
            destroy: function() {
                if (this.tableDataDeferred) {
                    this.tableDataDeferred.cancel();
                }

                // destroy orphaned widgets
                if (this.tbody) {
                    array.forEach(registry.findWidgets(this.tbody), this._destroyWidget);
                }

                this.inherited(arguments);
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
                var imgDom = domConstruct.create("img", {"src": this._blankGif});
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

            _isEnterKeyPressed: function (event) {
                var key = event.charCode || event.keyCode;
                return key === keys.ENTER;
            },

            _destroyWidget: function (w) {
                if (w) {
                    if (w.destroyRecursive) {
                        w.destroyRecursive();
                    }
                    else if (w.destroy) {
                        w.destroy();
                    }
                    // else not a widget?
                }
                // else console.warn destroying null/undefined?
            }
        }
    );
});

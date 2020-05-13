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
        "dojo/_base/array",
        "dojo/on",
        "dojo/keys",
        "dojo/dom-attr",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dijit/form/DateTextBox",
        "dijit/form/FilteringSelect",
        "dijit/form/Select",
        "dijit/form/TextBox",
        "dijit/form/ComboBox",
        "dojox/data/JsonRestStore"
        ],
function(
        declare,
        array,
        on,
        keys,
        domAttr,
        domClass,
        domConstruct,
        DateTextBox,
        FilteringSelect,
        Select,
        TextBox,
        ComboBox,
        JsonRestStore
) {
    return declare(null,
        {
            baseFilters: [],
            columns: [],
            filterAttach: null,
            draggable: false,
            hasAnyFilterValues: false,
            alwaysShowFilters: true,

            _filterFields: [],
            _filterWidgets: [],
            _prevFilterFields: [],

            /**
             *
             */
            getItemsMatchingFilters: function() {
                var result = [];

                array.forEach(this.rowObjectList, function(rowObject) {
                    if (rowObject.matchesFilters || (rowObject.item && rowObject.item.matchesFilters)) {
                        result.push(rowObject.item);
                    }
                });

                return result;
            },

            /**
             *
             */
            initFilteringMixin: function() {
                var self = this;

                this._filterFields = [];
                this._filterWidgets = [];

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
            },

            /**
             *
             */
            drawFilterHiddenRow: function() {
                var self = this;
                domConstruct.empty(this.filterAttach);

                var filterCell = domConstruct.create("td");

                if (this.draggable) {
                    filterCell.colSpan = this.columns.length+1;
                }
                else {
                    filterCell.colSpan = this.columns.length;
                }

                var filterLink = domConstruct.create("a");
                domClass.add(filterLink, "linkPointer");
                filterLink.innerHTML = i18n("Show Filters");
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

                if (this.draggable) {
                    domConstruct.create("td", {}, this.filterAttach);
                }

                array.forEach(this.columns, function(column) {
                    var columnFilter = domConstruct.create("td");

                    var columnFilterWrapper = domConstruct.create("div");
                    columnFilterWrapper.style.position = "relative";

                    // If this is the first column, show the reset filter button.
                    if (column === self.columns[0] && !self.alwaysShowFilters) {
                        var clearFilterButtonContainer = domConstruct.create("div", {
                            "style": {
                                "position": "absolute",
                                "top": "3px",
                                "left": "3px"
                            }
                        });

                        var clearFilterLink =
                            domConstruct.create("a", {"class":"linkPointer"}, clearFilterButtonContainer);
                        self._createImg("icon_delete", clearFilterLink);
                        clearFilterLink.alt = i18n("Clear and hide filters");
                        clearFilterLink.onclick = function() {
                            self.drawFilterHiddenRow();
                            self._filterFields = [];
                            self.redraw();
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
                                    idAttribute: "name"
                                });
                                filterWidget = new ComboBox({
                                    "name": column.filterField,
                                    store: comboStore,
                                    autoComplete: false,
                                    required: false,
                                    queryExpr: "*${0}*",
                                    searchDelay: 250,
                                    query: {
                                        // "name" is replaced by queryExpr and user's input
                                        "name": ""
                                    },
                                    onChange: function(value) {
                                        var existingFieldData = util.getNamedProperty(self._filterFields, column.filterField);
                                        if (existingFieldData !== undefined) {
                                            util.removeFromArray(self._filterFields, existingFieldData);
                                        }
                                        self._filterFields.push({
                                            name: column.filterField,
                                            type: "eq",
                                            className: column.filterClass,
                                            values: [value]
                                        });
                                        if ((existingFieldData === undefined && value)
                                                || (existingFieldData !== undefined
                                                        && existingFieldData.values[0] !== value)) {
                                            self.applyFilters();
                                        }
                                    }
                                });

                                break;
                            case "filteringSelect":
                                var selectStore = new JsonRestStore({
                                    target: column.filterUrl,
                                    idAttribute: "name"
                                });
                                filterWidget = new FilteringSelect({
                                    "name": column.filterField,
                                    store: selectStore,
                                    autoComplete: false,
                                    required: false,
                                    onChange: function(value) {
                                        var existingFieldData =
                                            util.getNamedProperty(self._filterFields, column.filterField);
                                        if (existingFieldData !== undefined) {
                                            util.removeFromArray(self._filterFields, existingFieldData);
                                        }
                                        self._filterFields.push({
                                            name: column.filterField,
                                            type: "eq",
                                            className: column.filterClass,
                                            values: [value]
                                        });
                                        if ((existingFieldData === undefined && value)
                                                || (existingFieldData !== undefined
                                                        && existingFieldData.values[0] !== value)) {
                                            self.applyFilters();
                                        }
                                    }
                                });

                                break;
                            case "text":
                            case "textExact":
                                filterWidget = new TextBox({
                                    "name": column.filterField,
                                    placeHolder: "Filter",
                                    onChange: function(value) {
                                        var existingFieldData =
                                            util.getNamedProperty(self._filterFields, column.filterField);
                                        if (existingFieldData !== undefined) {
                                            util.removeFromArray(self._filterFields, existingFieldData);
                                        }

                                        if (value) {
                                            var type = "like";
                                            if (column.filterType === "textExact") {
                                                type = "eq";
                                            }

                                            self._filterFields.push({
                                                name: column.filterField,
                                                type: type,
                                                className: column.filterClass,
                                                values: [value]
                                            });
                                        }

                                        if ((existingFieldData === undefined && value)
                                                || (existingFieldData !== undefined
                                                        && existingFieldData.values[0] !== value)) {
                                            self.applyFilters();
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
                                var options = [{
                                    label: i18n("Any"),
                                    value: "Any"
                                }];
                                array.forEach(column.filterOptions, function(filterOption) {
                                    options.push(filterOption);
                                });
                                filterWidget = new Select({
                                    "name": column.filterField,
                                    options: options,
                                    onChange: function(value) {
                                        var existingFieldData =
                                            util.getNamedProperty(self._filterFields, column.filterField);
                                        if (existingFieldData !== undefined) {
                                            util.removeFromArray(self._filterFields, existingFieldData);
                                        }
                                        var filterValue = value;
                                        if (value === '_EMPTY_VALUE_') {
                                            filterValue = '';
                                        }
                                        var valueIsSet = filterValue !== undefined && filterValue !== null;

                                        if (filterValue !== "Any") {
                                            self._filterFields.push({
                                                name: column.filterField,
                                                type: "eq",
                                                className: column.filterClass,
                                                values: [filterValue]
                                            });
                                        }
                                        if ((existingFieldData === undefined && valueIsSet)
                                                || (existingFieldData !== undefined
                                                        && existingFieldData.values[0] !== filterValue)) {
                                            self.applyFilters();
                                        }
                                    }
                                });
                                break;
                            case "date":
                                filterWidget = new DateTextBox({
                                    "name": column.filterField+"_low",
                                    onChange: function(value) {
                                        var timeValue;
                                        if (value) {
                                            timeValue = value.getTime();
                                        }
                                        else {
                                            timeValue = self._getMinAllowedDateValue();
                                        }
                                        var existingFieldData =
                                            util.getNamedProperty(self._filterFields, column.filterField);
                                        var type = "range";

                                        if (existingFieldData === undefined) {
                                            self._filterFields.push({
                                                name: column.filterField,
                                                type: type,
                                                className: column.filterClass
                                            });
                                        }
                                        existingFieldData =
                                            util.getNamedProperty(self._filterFields, column.filterField);
                                        if (existingFieldData.values === undefined) {
                                            existingFieldData.values = [];
                                            existingFieldData.values[0] = {
                                                    low : timeValue,
                                                    high: self._getMaxAllowedDateValue()
                                            };
                                        }
                                        else {
                                            existingFieldData.values[0].low = timeValue;
                                        }

                                        self.applyFilters();
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
                                    "name": column.filterField+"_hi",
                                    onChange: function(value) {
                                        var timeValue;
                                        if (value) {
                                            timeValue = value.getTime() + 86400000;
                                        }
                                        else {
                                            timeValue = self._getMaxAllowedDateValue();
                                        }
                                        var existingFieldData =
                                            util.getNamedProperty(self._filterFields, column.filterField);
                                        var type = "range";

                                        if (existingFieldData === undefined) {
                                            self._filterFields.push({
                                                name: column.filterField,
                                                type: type,
                                                className: column.filterClass
                                            });
                                        }
                                        existingFieldData =
                                            util.getNamedProperty(self._filterFields, column.filterField);
                                        if (existingFieldData.values === undefined) {
                                            existingFieldData.values = [];
                                            existingFieldData.values[0] = {
                                                    high : timeValue,
                                                    low: self._getMinAllowedDateValue()
                                            };
                                        }
                                        else {
                                            existingFieldData.values[0].high = timeValue;
                                        }

                                        self.applyFilters();
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
                            case "custom":
                                if (!column.getFilterFields) {
                                    throw "Column has no getFilterFields.";
                                }
                                filterWidget = column.getFilterFields();
                                // We need to make the filters apply on change of any of the
                                // given widgets.
                                if (!filterWidget.length) {
                                    console.error("filterWidget", filterWidget);
                                    throw "Expected array returned from getFilterFields," +
                                            " instead found "+(typeof filterWidget);
                                }
                                array.forEach(filterWidget, function(filterField) {
                                    // We need to make sure the widget has a unique name
                                    // otherwise, the existingFieldData will have duplicates
                                    // and filtering will not work correctly.
                                    if (!filterField.get("name")) {
                                        filterField.name = util.randomString(30);
                                    }

                                    on(filterField, "change", function(e) {
                                        self._customFilter(filterWidget, column);
                                    });
                                    on(filterField, "keypress", function(event) {
                                        switch(event.charOrCode) {
                                        case keys.ENTER:
                                            self._customFilter(filterWidget, column);
                                            break;
                                        }
                                    });
                                });
                                break;
                            default:
                                console.error("Unexpected filterType: "+column.filterType);
                        }
                        var existingFieldData = util.getNamedProperty(self._filterFields, column.filterField);
                        if (existingFieldData !== undefined) {
                            if (secondFilterWidget !== null) {
                                filterWidget.set('value', existingFieldData.values[0].low);
                            }
                            else {
                                filterWidget.set('value', existingFieldData.values[0]);
                            }
                        }

                        if (filterWidget.length) {
                            array.forEach(filterWidget, function(widget) {
                                self._filterWidgets.push(widget);
                                widget.placeAt(columnFilterWrapper);
                                domClass.add(widget.domNode, "filterField");
                                domAttr.set(widget.domNode, "data-field-name", widget.name);
                            });
                        }
                        else {
                            self._filterWidgets.push(filterWidget);
                            filterWidget.placeAt(columnFilterWrapper);
                            domClass.add(filterWidget.domNode, "filterField");
                            domAttr.set(filterWidget.domNode, "data-field-name", filterWidget.name);
                        }

                        if (secondFilterWidget !== null) {
                            if (existingFieldData !== undefined) {
                                secondFilterWidget.set('value', existingFieldData.values[0].high);
                            }
                            domConstruct.create("span", {"innerHTML":"&nbsp;-&nbsp;"}, columnFilterWrapper);
                            secondFilterWidget.placeAt(columnFilterWrapper);
                            domAttr.set(secondFilterWidget.domNode, "data-field-name", secondFilterWidget.name);
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

            /**
             * This is called to consolidate all the filtering widgets' values.
             *
             * This provides us with a way to apply all of the filters on a
             * specific column in a simple way.
             *
             */
            _customFilter: function(widgets, column) {
                var self = this;
                var filterField = column.filterField;
                var filterClass = column.filterClass;
                var filtersChanged = false;

                array.forEach(widgets, function(widget) {
                    var widgetName = widget.get("name");
                    var existingFieldData = util.getNamedProperty(self._filterFields, widgetName);
                    if (existingFieldData !== undefined) {
                        util.removeFromArray(self._filterFields, existingFieldData);
                    }

                    var values = widget.get("values");
                    if (values === undefined) {
                        var value = widget.get("value");
                        if (value) {
                            values = [value];
                        }
                    }

                    if (values) {
                        self._filterFields.push({
                            name: widgetName,
                            column: column,
                            widget: widget,
                            type: widget.get("type"),
                            className: filterClass,
                            values: values
                        });
                    }

                    if (!filtersChanged) {
                        //Determine if a new value has been set in the filter field
                        var oldValues = [];
                        var newValues = [];
                        if (values) {
                            newValues = newValues.concat(values);
                        }
                        if (existingFieldData && existingFieldData.values) {
                            oldValues = oldValues.concat(existingFieldData.values);
                        }

                        // Test if any of the three refresh conditions have been met:
                        // No data existed and data was entered, data existed and it was changed, or the filter needs to
                        // be reset
                        if (newValues.length !== oldValues.length) {
                            filtersChanged = true;
                        }
                        else {
                            array.forEach(newValues, function(newValue, i) {
                                if (newValue !== oldValues[i]) {
                                    filtersChanged = true;
                                }
                            });
                        }
                    }
                });
                if (filtersChanged) {
                    self.applyFilters();
                }
            },

            setFilterValue: function (name, value, type, className) {
                var self = this;
                var thisWidget; // = undefined;
                array.forEach(this._filterWidgets, function(widget, index) {
                    if (widget.name === name) {
                        widget.value = value;
                        thisWidget = widget;
                    }
                });

                var thisField;
                if (thisWidget === undefined) {
                    //we didn't find it in shown widgets set the field
                    array.forEach(this._filterFields, function(field, index) {
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
                    this._filterFields.push({
                        name:name,
                        values:value,
                        type:type,
                        className:className
                    });
                }
                this.redraw();
            },

            /**
             *
             */
            applyFilters: function() {
                this.pageNumber = 1;
                this.redraw();
            },

            /**
            *Override this function to change table filters after retrieving filter data.
            */
            adjustFilters: function(result) {

            },

            /**
             *
             */
            getFilterData: function(queryFilters) {
                var self = this;
                var rowsPerPage = this.rowsPerPage;
                var pageNumber = this.pageNumber;
                if (this.hidePagination) {
                    rowsPerPage = 10000;
                    pageNumber = 1;
                }

                var result = {
                    rowsPerPage: rowsPerPage,
                    pageNumber: pageNumber,
                    orderField: this.orderField,
                    sortType: this.sortType,
                    filterFields: []
                };

                if (this.filters && !this.baseFilters) {
                    this.baseFilters = this.filters;
                }

                // If no filters were passed in, use the baseFilters
                if (!queryFilters) {
                    queryFilters = this.baseFilters;
                }

                // Add any filters pre-set in the configuration of this table.
                array.forEach(queryFilters, function(filter) {
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
                array.forEach(this._filterFields, function(field) {
                    result.filterFields.push(field.name);
                    var filterValues = [];
                    array.forEach(field.values, function(value) {
                        if (value instanceof Object) {
                            // Must be a range filter
                            filterValues.push(value.low);
                            filterValues.push(value.high);
                        }
                        else {
                            filterValues.push(value);
                        }
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

                if ((this._filterFields && !this._prevFilterFields) ||
                        (!this._filterFields && this._prevFilterFields) ||
                        (this._filterFields.length !== this._prevFilterFields.length)) {
                    this.totalRecords = undefined;
                }
                else {
                    var i = 0;
                    var j = 0;
                    for (i = 0; i < this._filterFields.length; i++) {
                        var found = false;
                        for (j = 0; j < this._prevFilterFields.length; j++) {
                            if (this._filterFields[i] === this._prevFilterFields[j]) {
                                found = true;
                                break;
                            }
                        }

                        if (!found) {
                            // Lists are different
                            this.totalRecords = undefined;
                            break;
                        }
                    }
                }
                this.adjustFilters(result);

                return result;
            },

            /**
             *
             */
            filter: function(rowObjects) {
                var self = this;
                var result = [];

                array.forEach(rowObjects, function(rowObject) {
                    var add = self.filterPass(rowObject.item);

                    if (self.hasFilterValues()) {
                        rowObject.matchesFilters = add;
                    }

                    if (rowObject.domNode) {
                        if (rowObject.matchesFilters) {
                            domClass.add(rowObject.domNode, "matchesFilters");
                        }
                        else {
                            domClass.remove(rowObject.domNode, "matchesFilters");
                        }
                    }

                    var filteredChildren = self.filter(rowObject.children);

                    // This row should be visible if it has children which pass or if it does itself
                    if (filteredChildren.length > 0 || add) {
                        result.push(rowObject);
                        rowObject.visible = true;
                    }
                    else if (!self.hasParentMatchingFilters(rowObject)) {
                        // Only hide rows which have no parents matching the filters
                        rowObject.visible = false;
                        self.hideRow(rowObject);
                    }
                    else {
                        // Default to true but do not return this row as a result, since it doesn't
                        // explicitly pass the filters, nor do any of its children.
                        rowObject.visible = true;
                    }

                    // If this item has any children showing per the filter, expand it.
                    // (Do not expand if no values are being used to filter, though)
                    if (filteredChildren.length > 0
                            && self.hasFilterValues()
                            && self.expandedNodeList.indexOf(rowObject.id) === -1) {
                        self.expandedNodeList.push(rowObject.id);
                    }

                    // If we are not showing this item, make sure we don't keep it marked as expanded
                    if (!add
                            && filteredChildren.length === 0
                            && self.expandedNodeList.indexOf(rowObject.id) !== -1) {
                        util.removeFromArray(self.expandedNodeList, rowObject.id);
                    }
                });

                return result;
            },

            /**
             * Determine if any parent of this row object has matched the filters.
             */
            hasParentMatchingFilters: function(rowObject) {
                var result = false;

                if (rowObject.matchesFilters) {
                    result = true;
                }
                else if (rowObject.parent) {
                    result = this.hasParentMatchingFilters(rowObject.parent);
                }

                return result;
            },

            /**
             *
             */
            filterPass: function(item) {
                var self = this;
                var result = true;

                if (this.itemPasses && !this.itemPasses(item)) {
                    result = false;
                }
                else if (this.hasFilterValues()) {
                    // Pass through all data and collect any rows which match the filter. This pass is
                    // only performed for each field being filtered.
                    array.forEach(this._filterFields, function(field) {
                        var fieldColumn; // = undefined;
                        array.forEach(self.columns, function(column) {
                            var fieldName = field.name;
                            if (column.filterField === fieldName || column === field.column) {
                                fieldColumn = column;
                            }
                        });

                        var pass = false;

                        if (fieldColumn === undefined) {
                            console.error("Filtered field "+field.name+" had no column match.");
                        }
                        else if (field.widget && field.widget.filterPass) {
                            // Custom fields can supply widgets which implement their own
                            // filterPass behavior
                            pass = field.widget.filterPass(item, field.values);
                        }
                        else {
                            var rawValue;
                            if (fieldColumn.getRawValue) {
                                rawValue = fieldColumn.getRawValue(item);
                            }
                            else {
                                rawValue = item[fieldColumn.filterField];
                            }

                            if (rawValue === null || rawValue === undefined) {
                                rawValue = "";
                            }

                            array.forEach(field.values, function(value) {
                                var trueValueHigh,
                                trueValueLow,
                                newRaw;
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
                                    if (!!value.high) {
                                        trueValueHigh = value.high.getTime();
                                    }
                                    else {
                                        trueValueHigh = 9007199254740992;
                                    }

                                    if (!!value.low) {
                                        trueValueLow = value.low.getTime();
                                    }
                                    else {
                                        trueValueLow = 0;
                                    }

                                    newRaw = Number(rawValue);
                                    if(newRaw <= trueValueHigh && newRaw >= trueValueLow) {
                                        pass = true;
                                    }
                                }
                                else if (field.type === "range") {
                                    if (!!value.high) {
                                        trueValueHigh = Number(value.high);
                                    }
                                    else {
                                        trueValueHigh = 9007199254740992;
                                    }

                                    if (!!value.low) {
                                        trueValueLow = Number(value.low);
                                    }
                                    else {
                                        trueValueLow = 0;
                                    }

                                    newRaw = Number(rawValue);
                                    if(newRaw <= trueValueHigh && newRaw >= trueValueLow) {
                                        pass = true;
                                    }
                                }
                            });
                        }

                        if (!pass) {
                            result = false;
                        }
                    });
                }

                return result;
            },

            /**
             * Determines whether we should be filtering based on any values
             */
            hasFilterValues: function() {
                return (this._filterFields.length !== 0);
            },

            _getMinAllowedDateValue: function() {
                return 0;
            },

            _getMaxAllowedDateValue: function() {
                return new Date(8640000000000000).getTime();
            }
        }
    );
});

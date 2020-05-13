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
        "dojo/_base/kernel",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dijit/form/Select",
        "dijit/MenuSeparator",
        "dijit/_base/wai",
        "dojo/_base/xhr",
        "dojo/_base/array",
        "dijit/MenuItem",
        "dojox/html/entities"
        ],
function(
        declare,
        lang,
        kernel,
        _WidgetBase,
        _TemplatedMixin,
        Select,
        MenuSeparator,
        wai,
        baseXhr,
        array,
        MenuItem,
        entities
) {

    /**
     * Presents options as radio buttons and tracks the selected value.
     * Supported properties:
     *  value / String              Value of the option to be selected initially.
     *  existingValueLabel / String Optional label of the option to be selected initially. If not set,
     *                              the value will be used as the default label.
     *                                  This property is only needed when the 'value' is not in the list
     *                                  returned by restUrl AND noIllegalValues is false
     *  restUrl / String            The URL to use when retrieving the options. This should return an
     *                              array.
     *  getLabel / Function         Optional function to get the label of an item in the data array.
     *                                  Default implementation returns item.name
     *  getValue / Function         Optional function to get the value of an item in the data array.
     *                                  Default implementation returns item.id
     *  getStyle / Function         Optional function to get a style object for the given label.
     *  isValid / Function          Optional function to determine whether an item will be shown. Should
     *                              return a boolean.
     *  onChange / Function         Function to execute on a change in value.
     *  disabled / Boolean          Whether the widget should be disabled.
     *  allowNone / Boolean         Whether the user should be allowed to have "None" selected. If this
     *                              is false, the widget will automatically shift to the first value
     *                              returned by the restUrl when loading is completed.
     *  autoSelectFirst / Boolean   Whether the widget should automatically select the first option
     *                              when the list has been loaded, assuming no value has been provided.
     *                              This is always the behavior whenever there is only one item in the
     *                              list, but it also defaults to true.
     *  noneLabel / String          Text to show instead of "None"
     *  noDataMessage / String      Text to show when no data is loaded from the rest service.
     *  noIllegalValues/ Boolean    Whether to show illegal values or not.
     *  escapeHTMLLabel / Boolean   Whether to escape HTML tags in the label of the option this is
     *                              true by default
     *  tooltipField / String       Optional, indicates which json key field should be shown as tooltip
     */
    return declare(
        [_WidgetBase, _TemplatedMixin],
        {
            templateString:
                '<span class="restSelect inlineBlock">'+
                '    <span data-dojo-attach-point="restSelect"></span>'+
                '</span>',

            name: "",
            value: null,
            cachedValues: null, // object used as a cache of option values to corresponding items

            autoSelectFirst: true,
            allowNone: true,
            noneValue: "NONE_VALUE",
            escapeHTMLLabel: true,
            loaded: false,

            /**
             * Constructor
             */
            constructor: function(options) {
                if (options.onChange) {
                    kernel.deprecated("RestSelect#onChange", "onChange property is discouraged, use aspect.after(X, 'onChange', func) instead");
                }
                if (options.tooltipField) {
                    this.tooltipField = options.tooltipField;
                }
                this.cachedValues = {};
                this.watch("restUrl", this._updateRestUrl);
            },

            _setDisabledAttr: function(disabled) {
                this.disabled = !!disabled;
                if (this.loaded) {
                    this.selectWidget.set('disabled', this.disabled);
                }
            },

            /**
             *
             */
            postCreate: function() {
                var self = this;

                if (this.value === undefined) {
                    this.value = null;
                }

                this.selectWidget = new Select({
                    "name": self.name,
                    options: [{
                        label: i18n("Loading..."),
                        value: self.value || this.noneValue
                    }],
                    disabled: true
                });
                this.selectWidget.placeAt(this.restSelect);

                // load data, replace select widget
                baseXhr.get({
                    url: this.restUrl,
                    handleAs: "json",
                    headers: {
                        "Accept": "application/json"
                    },
                    error: function (err) {
                        if (!self.restSelect) {
                            // this widget/attach point was destroyed while this request was in flight
                            return;
                        }
                        console.error(err);

                        // update the label of first option (should be the Loading... option)
                        var placeholder = self.selectWidget.getOptions(0);
                        placeholder.label = i18n("Error!");
                        self.selectWidget.updateOption(placeholder);
                        self.selectWidget.set('disabled', true);
                    },
                    load: function(data) {
                        if (!self.restSelect) {
                            // this widget/attach point was destroyed while this request was in flight
                            return;
                        }
                        self.selectWidget.destroy();
                        self.selectWidget = null;
                        self.loaded = true;

                        var options = [];

                        // create options from data
                        var selectedValueFound = false;
                        array.forEach(data, function(item, i) {
                            var valid = self.isValid(item);
                            if (valid) {
                                var label = self.getLabel(item);
                                if(self.escapeHTMLLabel && typeof label === "string"){
                                    label = entities.encode(label);
                                }
                                var value = self.getValue(item);
                                var style = self.getStyle(item);
                                var selected = self.value === value;

                                if (selected) {
                                    // found the specified value
                                    selectedValueFound = true;
                                }

                                var option = {
                                    "label": label,
                                    "value": String(value),
                                    "style": style,
                                    "selected": selected
                                };

                                if (self.tooltipField && item.hasOwnProperty(self.tooltipField)) {
                                    option[self.tooltipField] = item[self.tooltipField];
                                }

                                options.push(option);
                                self.cachedValues[String(value)] = item;
                            }
                        });

                        // auto-select first data option as default when configured to do so
                        if (self.autoSelectFirst && self.value === null && !self.allowNone) {
                            if (options.length > 0) {
                                options[0].selected = true;
                                selectedValueFound = true;
                            }
                        }

                        // an illegal/unknown value was specified for initial value, show it anyway as last option
                        if (!selectedValueFound && self.value !== null && !self.noIllegalValues) {
                            selectedValueFound = true;
                            options.push({
                                "label": self.existingValueLabel || self.value,
                                "value": self.value,
                                "style": "font-style:italic;",
                                "selected": true
                            });
                        }

                        // insert a first option as appropriate,
                        //   must be done after processing data due to isValid processing of data
                        if (self.allowNone) {
                            // if a none-option is allowed
                            var noneLabel = self.noneLabel || i18n("None");
                            options.splice(0, 0, {
                                label: noneLabel,
                                value: self.noneValue,
                                selected: self.value === null && !selectedValueFound
                            });
                        }
                        else if (options.length === 0) {
                            // we need a selection, but there was no data
                            var noDataMessage = self.noDataMessage || i18n("No selections found");
                            options.splice(0, 0, {
                                label: noDataMessage,
                                value: self.noneValue,
                                selected: self.value === null
                            });

                            // disable the input, we shouldn't be presenting a value
                            self.disabled = true;
                        }
                        else if (self.value === null && options.length > 1 && !self.autoSelectFirst) {
                            // we need a selection, and have choices, but have not selected one yet
                            var makeSelectLabel = self.noneLabel || i18n("-- Make Selection --");
                            options.splice(0, 0, {
                                label: makeSelectLabel,
                                value: self.noneValue,
                                selected: !selectedValueFound
                            });
                        }

                        // auto-select when only 1 option is available
                        if (options.length === 1) {
                            options[0].selected = true;
                        }

                        self.selectWidget = new Select({
                            "name": self.name,
                            "className": self.className,
                            "options": options,
                            "disabled": !!self.disabled,
                            "maxHeight": 250,
                            "onChange": function(newValue) {
                                if (newValue === self.noneValue) {
                                    newValue = "";
                                }
                                self.value = newValue;
                                self.onChange(self.value, self.cachedValues[self.value]);
                            },
                            // Override the getMenuItemForOption function so we can add style
                            "_getMenuItemForOption": function(option) {
                                // summary:
                                //      For the given option, return the menu item that should be
                                //      used to display it.  This can be overridden as needed
                                if(!option.value && !option.label){
                                    // We are a separator (no label set for it)
                                    return new MenuSeparator();
                                }
                                // Just a regular menu option
                                var click = lang.hitch(this, "_setValueAttr", option);
                                var menuItemOptions = {
                                    option: option,
                                    label: option.label || this.emptyLabel,
                                    style: option.style,
                                    onClick: click,
                                    disabled: option.disabled || false
                                };
                                if (self.tooltipField) {
                                    menuItemOptions.title = util.escape(option[self.tooltipField]);
                                }
                                var item = new MenuItem(menuItemOptions);

                                wai.setWaiRole(item.focusNode, "listitem");
                                return item;
                            }
                        });
                        self.selectWidget.placeAt(self.restSelect);

                        // detect initial onLoad and/or onChange events as needed
                        var selectedValue = self.selectWidget.get('value');
                        if (self.value !== selectedValue && ( !!selectedValue || !!self.value )) {
                            if (selectedValue === self.noneValue) {
                                selectedValue = "";
                            }
                            self.value = selectedValue;

                            // call onLoad event
                            self.onLoad();

                            // call onChange event
                            self.onChange(self.value, self.cachedValues[self.value]);
                        }
                        else {
                            // call onLoad event
                            self.onLoad();

                            // call onChange event - for some deprecated usage scenarios
                            self.onChange(self.value, self.cachedValues[self.value]);
                        }
                    }
                });
            },

            /*
             *
             */
            _updateRestUrl: function() {
                this.selectWidget.destroy();
                this.selectWidget = null;
                this.postCreate();
            },

            /**
             * Compute the style for the option corresponding to the given item
             */
            getStyle: function(item) {
                return {};
            },

            /**
             * A filter method for limiting the data items which are used in the select.
             * Default is to include all items as options.
             */
            isValid: function(item) {
                return true;
            },

            onLoad: function() {
                // place-holder for onLoad event
            },

            onChange: function() {
                // place-holder for onChange event
            },

            /**
             *
             */
            setValue: function(value) {
                this.selectWidget.set("value", value || this.noneValue);
            },

            /**
             * Get the currently selected item, this will not be valid until onLoad fires
             */
            _getItemAttr: function() {
                // return null instead of undefined
                var item = this.cachedValues[this.selectWidget.get('value')];
                return item === undefined ? null : item;
            },

            _getDisplayedValueAttr: function() {
                return this.selectWidget.get("displayedValue");
            },

            destroy: function() {
                this.selectWidget.destroy();
                this.inherited(arguments);
            },

            /**
             * Default implementations of getValue and getLabel are intended to be overridden in most
             * cases, but if the objects returned have simple name and id attributes, we'll use those
             */
            getLabel: function(item) {
                return item.name;
            },
            getValue: function(item) {
                return item.id;
            }
        }
    );
});

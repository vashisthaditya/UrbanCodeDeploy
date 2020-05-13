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
var FormDelegates_extra_requirements_GLOBAL = [
    'dojo/_base/declare',
    'dojo/_base/array',
    "dojo/_base/Color",
    'dojo/_base/kernel',
    'dojo/_base/lang',
    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/dom-style',
    'dijit/_WidgetBase',
    'dijit/ColorPalette',
    'dijit/MenuItem',
    'dijit/MenuSeparator',
    'dijit/_base/wai',
    'dijit/form/CheckBox',
    'dijit/form/DateTextBox',
    'dijit/form/MultiSelect',
    'dijit/form/NumberTextBox',
    "dijit/form/NumberSpinner",
    'dijit/form/Select',
    'dijit/form/SimpleTextarea',
    'dijit/form/TextBox',
    'dijit/form/TimeTextBox',
    'dijit/form/ValidationTextBox',
    "dojo/store/Cache",
    "dojo/store/JsonRest",
    'dojo/store/Memory',
    'dojox/html/entities',
    'dojox/form/CheckedMultiSelect',
    'js/webext/widgets/DateTime',
    'js/webext/widgets/DialogMultiSelect',
    'js/webext/widgets/DomNode',
    'js/webext/widgets/FilteringScrollSelect',
    'js/webext/widgets/CheckboxGroup',
    'js/webext/widgets/RadioButtonGroup',
    'js/webext/widgets/Switch',
    'js/webext/widgets/SourceBrowser',
    'js/webext/widgets/color/ColorPicker',
    'js/webext/widgets/color/Color',
    'js/webext/widgets/select/WebextSelect',
    'js/webext/widgets/select/WebextMultiSelect',
    'js/webext/widgets/BidiDateUtil'];

// Block to append extra amd includes from the global config extraFormIncludes property
(function () {
    /*jslint devel:true */
    var extraIncludes, i, amdInclude;

    extraIncludes = !!window.config ? config.getProperty("extraFormIncludes") : [];
    if (!!extraIncludes && extraIncludes instanceof Array) {
        for (i=0; i<extraIncludes.length;i++) {
            // upgrade old package notation to amd notation (replace . with /)
            amdInclude = extraIncludes[i].replace(/\./g,'/');
            FormDelegates_extra_requirements_GLOBAL.push(amdInclude);
            if (console && console.warn) {
                console.warn("DEPRECATED: config extraFormIncludes is deprecated, value="+amdInclude);
            }
        }
    }
}());

define(FormDelegates_extra_requirements_GLOBAL, function (
        declare,
        array,
        Color,
        kernel,
        lang,
        domClass,
        domConstruct,
        domStyle,
        _WidgetBase,
        ColorPalette,
        MenuItem,
        MenuSeparator,
        wai,
        CheckBox,
        DateTextBox,
        MultiSelect,
        NumberTextBox,
        NumberSpinner,
        Select,
        SimpleTextarea,
        TextBox,
        TimeTextBox,
        ValidationTextBox,
        Cache,
        JsonRest,
        Memory,
        entities,
        CheckedMultiSelect,
        DateTime,
        DialogMultiSelect,
        DomNode,
        FilteringSelect,
        CheckboxGroup,
        RadioButtonGroup,
        Switch,
        SourceBrowser,
        ColorPicker,
        WebextColor,
        WebextSelect,
        WebextMultiSelect,
        BidiDateUtil) {

    // global registry of type names to delegate functions
    var delegateRegistry = {};

    var registerDelegate = function(typeName, delegateFunction) {
        if (lang.isArray(typeName)) {
            array.forEach(typeName, function(name){
                registerDelegate(name, delegateFunction);
            });
        }
        else {
            // convert name to upper case
            delegateRegistry[typeName.toUpperCase()] = delegateFunction;
        }
    };

    var retrieveDelegate = function(typeName) {
        return delegateRegistry[typeName.toUpperCase()];
    };

    /**
     * FormDelegates provides a set of functions to be used in constructing form widgets in a generic
     * manner. Each delegate takes a single object as a parameter. That object may have the following
     * properties:
     *  {
     *      name / String           Name assigned to the form element, also property name.
     *      label / String          Label shown for the form element.
     *      description / String    Description text shown as a tooltip with a hover-over icon.
     *      required / Boolean      Whether this field should be required on submission.
     *      readOnly / Boolean      Whether this field should be disabled.
     *      onChange / Function     Function to execute on value change.
     *      allowedValues / Array   Allowed options for certain field types.
     *          label / String
     *          value / String
     *      value / Mixed           Initial value. Type varies depending on field type.
     *      widget / Widget         A widget to be used instead of all other options.
     *      style / Object          An optional style object to be passed to the field widget.
     *  }
     *
     *  Default delegates are:
     *          Text
     *          Text Area
     *          Validation Text
     *          Checkbox
     *          CheckboxGroup       Similar to multiselect; can disable individual options
     *          Select
     *          Radio
     *          LabeledSelect       Select which uses associated labels and values.
     *          FilteringSelect     Select with text input.
     *                              Add the following properties to make this a paginated, lazy-
     *                              loading dropdown:
     *                                  url: Required - the URL to load options from
     *                                  idAttribute: The attribute in the results to use as the ID
     *                                               (optional - defaults to "id")
     *          Multi-Select
     *          Checked-Multi-Select
     *          Number              Text box which requires numeric input
     *          NumberBox           Number Spinner for numeric input
     *          Date
     *          Time
     *          DateTime            Both date and time pickers
     *          Color
     *          Label               A simple line of text. Value is the text to display.
     *          SectionLabel        Same as Label, but styled as the header for a form section
     *          Hidden              Self-explanatory - use for internal purposes (alias: "Invisible")
     */
    var FormDelegates = declare([], {

        // object that is our hash of types to delegate functions, inherits the global delegate registry
        delegates: null,

        "constructor": function(params) {
            // create a new instance that will dynamically inherit settings on delegateRegistry
            this.delegates = lang.delegate(delegateRegistry);

            // from _WidgetBase
            if(params){
                this.params = params;
                lang.mixin(this, params);
            }

            this.initDelegates();
        },

        "getDelegate": function(name) {
            return this.delegates[name.toUpperCase()];
        },

        /**
         * Add/override a delegate function to this instance of FormDelegates.
         * @param delegateName the type name for the delegate, optionally an array of type names
         */
        "addDelegate": function(/*String */ typeName, /*String */ delegateFunction) {
            var self = this;
            if (lang.isArray(typeName)) {
                array.forEach(typeName, function(name){
                    self.addDelegate(name, delegateFunction);
                });
            }
            else {
                // convert name to upper case
                self.delegates[typeName.toUpperCase()] = delegateFunction;
            }
        },

        "initDelegates": function() {
            var self = this;
            array.forEach(config.getProperty("extraFormDelegates"), function(extraDelegate) {
                kernel.deprecated("config extraFormDelegates should be replaced with calls to #addDelegate or #registerDelegate");
                self.addDelegate(extraDelegate.name, extraDelegate.delegateFunction);
            });
        }
    });

    /**
     * Add/override a delegate function for all instances of FormDelegates.
     * @param name the type name for the delegate, optionally an array of type names
     * @param func the delegate function
     */
    FormDelegates.registerDelegate = registerDelegate;
    FormDelegates.retrieveDelegate = retrieveDelegate;

    var standardWidth = 400;
    var getStyle = function(entry) {
        var result = entry.style;
        if (!result) {
            result = {
                width: standardWidth+"px"
            };
        }
        return result;
    };

    //
    // Initial delegates
    //

    FormDelegates.registerDelegate("TEXT", function(entry) {
        var text = new TextBox({
            label: (entry.label ? entry.label.escapeHTML() : entry.label),
            name: (entry.name ? entry.name.escapeHTML() : entry.name),
            value: entry.value,
            placeHolder: entry.placeHolder,
            disabled: (entry.readOnly) ? true : false,
            style: getStyle(entry),
            textDir: entry.textDir || util.getBaseTextDir() || "auto"
        });
        if (!!entry.onChange) {
            text.onChange = entry.onChange;
        }
        if (!!entry.intermediateChanges) {
            text.set("intermediateChanges", entry.intermediateChanges);
        }
        return text;
    });
    FormDelegates.registerDelegate("SECURE", function(entry) {
        var text = new TextBox({
            label: (entry.label ? entry.label.escapeHTML() : entry.label),
            name: (entry.name ? entry.name.escapeHTML() : entry.name),
            value: entry.value,
            placeHolder: entry.placeHolder,
            style: getStyle(entry),
            disabled: (entry.readOnly) ? true : false,
            textDir: "ltr",
            type: "password"
        });
        if (!!entry.onChange) {
            text.onChange = entry.onChange;
        }
        return text;
    });
    FormDelegates.registerDelegate(['Text Area', "TEXTAREA"], function(entry) {
        var style = getStyle(entry);

        // TextArea has padding in the widget. If we're using the standard width, we need to adjust
        // it for these.
        if (style.width === standardWidth+"px") {
            style.width = (standardWidth-16)+"px";
        }

        var textarea = new SimpleTextarea({
            rows: 5,
            label: (entry.label ? entry.label.escapeHTML():entry.label),
            name: (entry.name ? entry.name.escapeHTML():entry.name),
            value: entry.value,
            placeHolder: entry.placeHolder,
            style: style,
            textDir: entry.textDir || util.getBaseTextDir() || "auto",
            disabled: (entry.readOnly) ? true : false
        });
        if (!!entry.onChange) {
            textarea.onChange = entry.onChange;
        }
        return textarea;
    });
    FormDelegates.registerDelegate(["PASSWORD"], function(entry) {
        var passwordtext = new ValidationTextBox({
            label: entry.label,
            name: entry.name,
            value: entry.value,
            placeHolder: entry.placeHolder,
            style: getStyle(entry),
            disabled: (entry.readOnly) ? true : false,
            required: (entry.required) ? true : false,
            textDir: "ltr",
            // Default type is password unless override by entry.textType
            type: entry.textType || "Password"
        });
        if (!!entry.promptMessage) {
            passwordtext.promptMessage = entry.promptMessage;
        }
        else if (passwordtext.required) {
            passwordtext.promptMessage = i18n("Required");
        }
        return passwordtext;
    });
    FormDelegates.registerDelegate(['Validation Text', "VALIDATION_TEXT"], function(entry) {
        if(entry.regExp) {
            kernel.deprecated("See dijit/form/ValidationTextBox.js line 74: \"regExp: Deprecated [extension protected] String.  Use \"pattern\" instead.\"");
        }
        var validationtext = new ValidationTextBox({
            label: entry.label,
            name: entry.name,
            value: entry.value,
            placeHolder: entry.placeHolder,
            style: getStyle(entry),
            disabled: (entry.readOnly) ? true : false,
            required: (entry.required) ? true : false,
            type: entry.textType || "text",
            regExp: entry.regExp || "",
            pattern: entry.pattern || ".*" //@see dijit/form/ValidationTextBox.js" line 74
        });

        // Currently error/prompt message. When using the default tooltip implementation, this will
        // only be displayed when the field is focused.
        if (entry.message !== undefined) {
            validationtext.message = entry.message;
        }

        // The message to display if value is invalid. The translated string value is read from the
        // message file by default. Set to "" to use the promptMessage instead.
        if (entry.invalidMessage !== undefined) {
            validationtext.invalidMessage = entry.invalidMessage;
        }

        // The message to display if value is empty and the field is required. The translated string
        // value is read from the message file by default. Set to "" to use the invalidMessage instead.
        if (entry.missingMessage !== undefined) {
            validationtext.missingMessage = entry.missingMessage;
        }

        // If defined, display this hint string immediately on focus to the textbox, if empty. Also
        // displays if the textbox value is Incomplete (not yet valid but will be with additional
        // input). Think of this like a tooltip that tells the user what to do, not an error message
        // that tells the user what they've done wrong.
        // Message disappears when user starts typing.
        if (entry.promptMessage !== undefined) {
            validationtext.promptMessage = entry.promptMessage;
        }
        else if (entry.missingMessage !== undefined) {
            validationtext.promptMessage = entry.missingMessage;
        }
        else if (validationtext.required) {
            validationtext.promptMessage = i18n("Required");
        }

        if (entry.pattern !== undefined) {
            validationtext.pattern = entry.pattern;
        }

        if (!!entry.onChange) {
            validationtext.onChange = entry.onChange;
        }
        return validationtext;
    });
    FormDelegates.registerDelegate("Number", function(entry) {
        var result = new NumberTextBox({
            name: entry.name,
            label: entry.label,
            value: entry.value,
            placeHolder: entry.placeHolder,
            style: getStyle(entry),
            textDir: "ltr",
            disabled: (entry.readOnly) ? true : false,
            constraints: {
                pattern: "#"
            }
        });
        if (!!entry.onChange) {
            result.onChange = entry.onChange;
        }
        return result;
    });
    FormDelegates.registerDelegate("NumberBox", function(entry) {
        var result = new NumberSpinner({
            name: entry.name,
            label: entry.label,
            value: entry.value,
            placeHolder: entry.placeHolder,
            smallDelta: entry.smallDelta || 1,
            style: getStyle(entry),
            textDir: "ltr",
            disabled: (entry.readOnly) ? true : false,
            required: (entry.required) ? true : false,
            constraints: entry.constraints || { places: 0 }
        });
        if (entry.message !== undefined) {
            result.message = entry.message;
        }
        if (entry.promptMessage !== undefined) {
            result.promptMessage = entry.promptMessage;
        }
        else if (entry.missingMessage !== undefined) {
            result.promptMessage = entry.missingMessage;
        }
        if (entry.rangeMessage !== undefined) {
            result.rangeMessage  = entry.rangeMessage;
        }
        if (!!entry.onChange) {
            result.onChange = entry.onChange;
        }
        return result;
    });
    FormDelegates.registerDelegate("CHECKBOX", function(entry) {
        var booleanValue = false;
        if (entry.value === true || entry.value === "true" || entry.value === "on") {
            booleanValue = true;
        }
        var cbox = new CheckBox({
            label: (entry.label ? entry.label.escapeHTML():entry.label),
            name: (entry.name ? entry.name.escapeHTML():entry.name),
            checked: booleanValue,
            value: 'true',
            style: {
                marginTop: "3px"
            },
            disabled: (entry.readOnly) ? true : false
        });
        if (!!entry.onChange) {
            cbox.onChange = entry.onChange;
        }

        return cbox;
    });
    FormDelegates.registerDelegate("Checkbox Group", function(entry) {
        var result = new CheckboxGroup({
            "name": entry.name,
            "label": entry.label,
            "options": entry.options
        });
        return result;
    });
    FormDelegates.registerDelegate("SWITCH", function(entry) {
        var booleanValue = false;
        if (entry.value === true || entry.value === "true" || entry.value === "on") {
            booleanValue = true;
        }
        var webextSwitch = new Switch ({
            label: entry.label,
            name: entry.name,
            value: booleanValue,
            disabled: (entry.readOnly) ? true : false,
            color: entry.color || "blue"
        });
        if (!!entry.onChange) {
            webextSwitch.onChange = entry.onChange;
        }
        return webextSwitch;
    });
    var buildSelectOptions = function(entry) {
        var options = [];
        array.forEach(entry.allowedValues, function(value) {
            if (value.label !== undefined && value.value !== undefined) {
                options.push({
                    label: (value.label ? value.label.escapeHTML():value.label),
                    value: String(value.value),
                    selected: value.value === entry.value,
                    checked: value.value === entry.value,
                    style: value.style
                });
            }
            else {
                // Backwards compatibility for flat arrays of options.
                options.push({
                    label: value,
                    id: String(value),
                    value: String(value),
                    selected: value === entry.value,
                    checked: value === entry.value
                });
            }
        });
        return options;
    };
    FormDelegates.registerDelegate(["SELECT", "PROPERTY_VALUE_GROUP"], function(entry) {
        if (entry.value) {
            var i;
            var foundSelectedValue = false;
            for (i = 0; i < entry.allowedValues.length; i++) {
                if (entry.allowedValues[i].value === entry.value) {
                    foundSelectedValue = true;
                    break;
                }
            }

            if (!foundSelectedValue) {
                entry.allowedValues.push({
                    value: entry.value,
                    label: entry.value,
                    style: "font-style:italic;"
                });
            }
        }
        var select = new Select({
            label: (entry.label ? entry.label.escapeHTML():entry.label),
            name: (entry.name ? entry.name.escapeHTML():entry.name),
            options: buildSelectOptions(entry),
            disabled: (entry.readOnly) ? true : false,
            // Override the getMenuItemForOption function so we can add style
            "_getMenuItemForOption": function(option) {
                // summary:
                //      For the given option, return the menu item that should be
                //      used to display it.  This can be overridden as needed
                var self = this;
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
                var item = new MenuItem(menuItemOptions);

                wai.setWaiRole(item.focusNode, "listitem");
                return item;
            }
        });
        if (!!entry.onChange) {
            select.onChange = entry.onChange;
        }
        return select;
    });
    FormDelegates.registerDelegate("RADIO", function(entry) {
        var radioGroup = new RadioButtonGroup({
            label: entry.label,
            name: entry.name,
            options: entry.allowedValues || entry.options,
            value: entry.value,
            disabled: (entry.readOnly) ? true : false,
            onChange: entry.onChange
        });
        return radioGroup;
    });
    FormDelegates.registerDelegate("LabeledSelect", function(entry) {
        array.forEach(entry.allowedValues, function(option) {
            if (entry.value === option.value) {
                option.selected = true;
            }
        });

        var select = new Select({
            label: entry.label,
            name: entry.name,
            options: entry.allowedValues,
            disabled: (entry.readOnly) ? true : false
        });
        if (!!entry.onChange) {
            select.onChange = entry.onChange;
        }
        return select;
    });


    // DEPRECATED - Should be switched to WebextSelect
    FormDelegates.registerDelegate("FilteringScrollSelect", function(entry) {
        return new FilteringSelect(entry);
    });

    // DEPRECATED - Should be switched to WebextSelect
    FormDelegates.registerDelegate("FilteringSelect", function(entry) {
        var store = entry.store;
        var autoComplete = entry.autoComplete;
        var pageSize = entry.pageSize;

        if (!store) {
            // If we have a URL, make this a JsonRest-backed select.
            if (entry.url) {
                // JsonRest will query for individual items at url+id, not url+"/"+id.
                if (entry.url.substring(entry.url.length-1) !== "/") {
                    entry.url = entry.url+"/";
                }
                store = new JsonRest({
                    target: entry.url,
                    idAttribute: entry.idProperty || "id"
                });

                // These options only apply to REST-backed selects
                autoComplete = false;
                pageSize = 30;
            }
            else if (entry.allowedValues) {
                array.forEach(entry.allowedValues, function(option) {
                    if (entry.value === option.value) {
                        option.checked = true;
                    }
                });
                store = new Memory({
                    data: entry.allowedValues,
                    idProperty: entry.idProperty || "id"
                });
            }
            else {
                // The Select API expected entries with "label" and "value", so adapt to that
                entry.searchAttr = "label";
                store = new Memory({data: buildSelectOptions(entry), idProperty: "value"});
            }
        }

        var select = new FilteringSelect({
            label: entry.label,
            name: entry.name,
            value: entry.value,
            placeHolder: entry.placeHolder,
            store: store,
            defaultQuery: entry.defaultQuery,
            multiple: entry.multiple,
            autoSelectFirst: entry.autoSelectFirst || false,
            searchAttr: (!!entry.searchAttr) ? entry.searchAttr : "name",
            autoComplete: autoComplete,
            pageSize: pageSize,
            required: (entry.required) ? true : false,
            disabled: (entry.readOnly) ? true : false,
            readOnly: (entry.readOnly) ? true : false,
            allowNone: entry.allowNone || !entry.required,
            idProperty: entry.idProperty || "id",
            validate: (!!entry.validate) ? entry.validate : true,
            onLoad: entry.onLoad || function() { return undefined; /* intentionally empty */}
        });
        if (!!entry.onChange) {
            select.onChange = entry.onChange;
        }
        return select;
    });

    var checkRegExpPattern = function(widget, entry) {
        //filter dropdown result through regExp defined in entry.pattern
        if (entry && entry.pattern) {
            var regExp = util.getNormalizedRegExp(entry.pattern);

            widget.onFilterResult = function(result) {
                return array.filter(result, function(item) {
                    return (item && item.value && regExp.test(item.value));
                });
            };
        }
    };

    FormDelegates.registerDelegate(["HTTP_SELECT"], function(entry) {
        delete entry.inherited; // PropDefs have this property, but it's overwriting dojo's inherited function
        entry.searchAttr = "label";

        // If entry.id exists dojo will attempt to use that id in the creation of a new WebextSelect.
        // Resulting in conflicting ids if the id was already used in the creation of another widget.
        if (entry.id) {
            entry.id = "";
        }

        if (entry.resolveHttpValuesUrl) {
            entry.url = bootstrap.baseUrl + entry.resolveHttpValuesUrl;
        }
        if (entry.url && entry.url.substring(entry.url.length-1) !== "/") {
            entry.url = entry.url+"/";
        }

        entry.label = (entry.label ? entry.label.escapeHTML() : entry.label);

        var jsonStore = new JsonRest({
            target: entry.url,
            idProperty: "value"
        });
        entry.store = jsonStore;

        var widget = new WebextSelect(entry);

        checkRegExpPattern(widget, entry);

        return widget;
    });

    FormDelegates.registerDelegate(["HTTP_MULTI_SELECT"], function(entry) {
        delete entry.inherited;
        entry.searchAttr = "label";
        entry.idAttribute = "value";

        // If entry.id exists dojo will attempt to use that id in the creation of a new WebextMultiSelect.
        // Resulting in conflicting ids if the id was already used in the creation of another widget.
        if (entry.id) {
            entry.id = "";
        }

        if (entry.resolveHttpValuesUrl) {
            entry.url = bootstrap.baseUrl + entry.resolveHttpValuesUrl;
        }
        if (entry.url && entry.url.substring(entry.url.length-1) !== "/") {
            entry.url = entry.url+"/";
        }
        var jsonStore = new JsonRest({
            target: entry.url,
            idProperty: "value"
        });
        if (entry.value) {
            var valuesAsItems = [];
            var defaultLabels;
            if (entry.defaultLabel) {
                defaultLabels = entry.defaultLabel.split(',');
            }
            array.forEach(entry.value.split(','), function(val, i) {
                valuesAsItems.push({
                    label: defaultLabels ? defaultLabels[i] : val,
                    value: val,
                    checked: true
                });
            });
            entry.value = valuesAsItems;
            var initValueStore = new Memory({
                data: valuesAsItems,
                idProperty: "value"
            });

            // Use Cache so querying for the initial value doesn't make a call to the server,
            // which could potentially be a very slow call.
            entry.store = new Cache(jsonStore, initValueStore);
        }
        else {
            entry.store = jsonStore;
        }

        var widget = new WebextMultiSelect(entry);

        checkRegExpPattern(widget, entry);

        return widget;
    });

    // Prepare the widget options for WebextSelects and WebextMultiSelects
    var buildWebextSelectOptions = function(entry) {
        var widgetOptions = lang.clone(entry);

        widgetOptions.style = getStyle(widgetOptions);

        if (widgetOptions.url) {
            // JsonRest will query for individual items at url+id, not url+"/"+id.
            if (widgetOptions.url.substring(widgetOptions.url.length-1) !== "/") {
                widgetOptions.url = widgetOptions.url+"/";
            }
            widgetOptions.store = new JsonRest({
                "target": widgetOptions.url,
                "idProperty": widgetOptions.idAttribute || "id"
            });
        }
        else if (widgetOptions.data) {
            widgetOptions.store = new Memory({
                "data": widgetOptions.data,
                "idProperty": widgetOptions.idAttribute || "id"
            });
        }
        return widgetOptions;
    };

    var buildWebextMultiSelectOptions = function(entry, orderable) {
        var widgetOptions = buildWebextSelectOptions(entry);
        if (orderable === true) {
            widgetOptions.orderable = true;
        }
        return widgetOptions;
    };

    /**
     * Produces a filtering drop-down which assumes a backing REST call implementing TableFilter.
     *
     * Supports all properties offered by WebextSelect, as well as:
     *  url: Base URL to get the options (required if data not present)
     *  data: Raw data to use in the select (required if url not present)
     *  idAttribute: Property name to use for the ID. Defaults to 'id' (optional)
     */
    FormDelegates.registerDelegate(["TableFilterSelect"], function(entry) {
        return new WebextSelect(buildWebextSelectOptions(entry));
    });

    /**
     * Produces a filtering multi-select which assumes a backing REST call implementing TableFilter.
     *
     * Supports all properties offered by WebextMultiSelect, as well as:
     *  url: Base URL to get the options (required if data not present)
     *  data: Raw data to use in the select (required if url not present)
     *  idAttribute: Property name to use for the ID. Defaults to 'id' (optional)
     */
    FormDelegates.registerDelegate(["TableFilterMultiSelect"], function(entry) {
        return new WebextMultiSelect(buildWebextMultiSelectOptions(entry, false));
    });

    FormDelegates.registerDelegate(["OrderedTableFilterMultiSelect"], function(entry) {
        return new WebextMultiSelect(buildWebextMultiSelectOptions(entry, true));
    });

    FormDelegates.registerDelegate(["OrderedColoredMultiSelect", "OrderedTagMultiSelect", "ORDERED_TAG_MULTI_SELECT"], function(entry) {
        var widgetOptions = buildWebextMultiSelectOptions(entry, true);

        widgetOptions.formatSelectedItem = function(selectedItem, item, label, removeItem) {
            if (item.color) {
                if (!WebextColor.isDark(item.color)) {
                    domStyle.set(selectedItem, "color", "black");
                }
                domStyle.set(selectedItem, "background-color", item.color);
            }
        };
        if (!widgetOptions.url && !widgetOptions.data && widgetOptions.allowedValues) {
            var defaultIdAttribute = "id";
            if (widgetOptions.allowedValues.length > 0) {
                if (!widgetOptions.allowedValues[0].id) {
                    defaultIdAttribute = "value";
                }
                if (!widgetOptions.allowedValues[0].name) {
                    widgetOptions.searchAttr = "label";
                }
            }
            widgetOptions.idAttribute = widgetOptions.idAttribute || defaultIdAttribute;
            widgetOptions.store = new Memory({
                "data": widgetOptions.allowedValues,
                "idProperty": widgetOptions.idAttribute
            });
            widgetOptions.value = widgetOptions.allowedValues;
        }
        return new WebextMultiSelect(widgetOptions);
    });

    FormDelegates.registerDelegate(["MULTI-SELECT", "MULTI_SELECT"], function(entry) {
        var multi = new MultiSelect({
            label: (entry.label ? entry.label.escapeHTML():entry.label),
            name: (entry.name ? entry.name.escapeHTML():entry.name),
            style: getStyle(entry),
            disabled: (entry.readOnly) ? true : false
        });
        if (!!entry.onChange) {
            multi.onChange = entry.onChange;
        }

        var selected = [];
        if (!!entry.value) {
            if (lang.isArray(entry.value)) {
                selected = entry.value;
            }
            else {
                selected = entry.value.split(',');
            }
        }

        array.forEach(entry.allowedValues, function(allowedValue) {
            var optionDom = domConstruct.create('option');

            if (allowedValue.label !== undefined && allowedValue.value !== undefined) {
                optionDom.innerHTML = entities.encode(allowedValue.label);
                optionDom.value = allowedValue.value;
            }
            else {
                // Backwards compatibility for flat arrays of options.
                optionDom.innerHTML = entities.encode(allowedValue);
                optionDom.value = allowedValue;
            }

            if (selected.indexOf(allowedValue) > -1 || selected.indexOf(allowedValue.value) > -1) {
                optionDom.selected = "selected";
            }
            multi.containerNode.appendChild(optionDom);
        });
        return multi;
    });
    FormDelegates.registerDelegate(["CHECKED-MULTI-SELECT", "CHECKED_MULTI_SELECT"], function(entry) {
        var multi = new CheckedMultiSelect({
            label: entry.label,
            name: entry.name,
            style: getStyle(entry),
            multiple: (entry.multiple === undefined) ? true : entry.multiple,
            disabled: (entry.readOnly) ? true : false
        });
        array.forEach(entry.allowedValues, function(allowedValue) {
            if (allowedValue.label !== undefined && allowedValue.value !== undefined) {
                multi.addOption(allowedValue);
            }
        });
        return multi;
    });

    FormDelegates.registerDelegate("Date", function(entry) {
        var date = new DateTextBox({
            label: entry.label,
            datePackage: BidiDateUtil.getDatePackage(),
            name: entry.name,
            disabled: (entry.readOnly) ? true : false,
            value: entry.value,
            format: function(currentDate) {
                return util.dayFormatShort(currentDate);
            },
            placeHolder: entry.placeHolder,
            constraints: { fullYear: true, datePattern: util.dateFormatPattern },
            promptMessage: util.dateFormatPattern,
            required: (entry.required) ? true : false
        });
        if (!!entry.onChange) {
            date.onChange = entry.onChange;
        }
        if (entry.message !== undefined) {
            date.message = entry.message;
        }
        if (entry.promptMessage !== undefined) {
            date.promptMessage = entry.promptMessage;
        }
        else if (entry.missingMessage !== undefined) {
            date.promptMessage = entry.missingMessage;
        }
        if (entry.rangeMessage !== undefined) {
            date.rangeMessage  = entry.rangeMessage;
        }

        return date;
    });
    FormDelegates.registerDelegate("Time", function(entry) {
        var date = new TimeTextBox({
            label: entry.label,
            name: entry.name,
            disabled: (entry.readOnly) ? true : false,
            value: entry.value,
            placeHolder: entry.placeHolder,
            constraints:{ timePattern: util.timeFormatPattern },
            required: (entry.required) ? true : false
        });
        if (!!entry.onChange) {
            date.onChange = entry.onChange;
        }
        if (entry.message !== undefined) {
            date.message = entry.message;
        }
        if (entry.promptMessage !== undefined) {
            date.promptMessage = entry.promptMessage;
        }
        else if (entry.missingMessage !== undefined) {
            date.promptMessage = entry.missingMessage;
        }
        if (entry.rangeMessage !== undefined) {
            date.rangeMessage  = entry.rangeMessage;
        }

        return date;
    });
    FormDelegates.registerDelegate("DateTime", function(entry) {
        var dateTime = new DateTime({
            label: entry.label,
            name: entry.name,
            datePackage: BidiDateUtil.getDatePackage(),
            disabled: (entry.readOnly) ? true : false,
            value: entry.value
        });
        if (!!entry.onChange) {
            dateTime.onChange = entry.onChange;
        }

        return dateTime;
    });
    FormDelegates.registerDelegate("Color", function(entry) {
        var color = new ColorPalette({
            label: entry.label,
            name: entry.name,
            value: entry.value,
            disabled: (entry.readOnly) ? true : false,
            _imagePaths: {
                "7x10": bootstrap.imageUrl+"webext/colors7x10.png"
            }
        });
        if (!!entry.onChange) {
            color.onChange = entry.onChange;
        }

        return color;
    });
    FormDelegates.registerDelegate("ColorPicker", function(entry) {
        var color = new ColorPicker({
            label: entry.label,
            name: entry.name,
            value: entry.value,
            mode: entry.mode || "standard",
            disabled: (entry.readOnly) ? true : false
        });
        if (!!entry.onChange) {
            color.onChange = entry.onChange;
        }
        return color;
    });
    FormDelegates.registerDelegate("Source", function(entry) {
        var source = new SourceBrowser({
            label: entry.label,
            name: entry.name,
            value: entry.value,
            required: entry.required,
            disabled: (entry.readOnly) ? true : false
        });

        if (!!entry.onChange) {
            source.onChange = entry.onChange;
        }

        source.startup();

        return source;
    });
    FormDelegates.registerDelegate("Label", function(entry) {
        var labelWidget = new DomNode({
            name: entry.name,
            label: entry.label || ""
        });
        var labelDiv = domConstruct.create("div");
        labelDiv.innerHTML = entities.encode(entry.value);

        if (entry.style) {
            domStyle.set(labelDiv, entry.style);
        }
        else {
            labelDiv.style.width = "400px";
            labelDiv.style.marginTop = "15px";
        }

        if (entry.width){
            labelDiv.style.width = entry.width;
        }
        if (entry.height){
            labelDiv.style.height = entry.height;
        }

        labelWidget.domAttach.appendChild(labelDiv);

        return labelWidget;
    });
    FormDelegates.registerDelegate("SectionLabel", function(entry) {
        entry.label = "";

        var labelWidget = new DomNode({
            name: entry.name,
            label: entry.label || ""
        });
        var labelDiv = domConstruct.create("div");
        labelDiv.innerHTML = entities.encode(entry.value);

        if (entry.style) {
            domStyle.set(labelDiv, entry.style);
        }

        domClass.add(labelDiv, "sectionLabel");

        labelWidget.domAttach.appendChild(labelDiv);

        return labelWidget;
    });
    FormDelegates.registerDelegate(["Invisible", "Hidden"], function(entry) {
        var labelWidget = new DomNode({
            name: entry.name,
            label: "",
            rowClass: "hidden",
            value: entry.value
        });

        return labelWidget;
    });
    FormDelegates.registerDelegate("MultiSelect", function(entry) {
        var widget = new DialogMultiSelect({
            url: entry.url,
            name: entry.name,
            label: entry.label,
            value: entry.value,
            disabled: (entry.readOnly) ? true : false
        });

        if (!!entry.onChange) {
            widget.onChange = entry.onChange;
        }

        return widget;
    });

    return FormDelegates;
});

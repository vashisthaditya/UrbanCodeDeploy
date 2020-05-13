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
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dijit/form/ComboBox",
        "dojox/data/JsonRestStore"
        ],
function(
        declare,
        _WidgetBase,
        _TemplatedMixin,
        ComboBox,
        JsonRestStore
) {

    /**
     * Options that must be passed in to the constructor:
     *     (string)  name
     *
     *     (string)  restUrl - The URL of the REST endpoint using which the ComboBox should populate
     *                         and filter its items.
     *
     *     (string)  idAttr - The name of the attribute that holds an objects id. This can be a
     *                        pre-existing id provided by the server. If an ID isn't already provided
     *                        when an object is fetched or added to the store, the autoIdentity
     *                        system will generate an id for it and add it to the index.
     *
     *     (string)  searchAttr - Search for items in the data store where this attribute
     *                            (in the item) matches what the user typed.
     *
     *     (string)  labelAttr - The entries in the drop down list come from this attribute
     *
     *     (boolean) required - Whether or not users are required to enter a value for the combo box
     */
    return declare(
        [_WidgetBase, _TemplatedMixin],
        {
            templateString:
                '<span class="restCombo inlineBlock">'+
                '    <span data-dojo-attach-point="restCombo"></span>'+
                '</span>',

            name: null,

            // the following variables are for JsonRestStore and ComboBox's filtering
            restUrl: null,
            idAttr: null,
            searchAttr: null,
            labelAttr: null,
            required: false,

            _value: null,
            _comboWidget: null,

            constructor: function(options) {
                var self = this;

                self.name = options.name;
                self.required = options.required;
                self.restUrl = options.restUrl;
                self.idAttr = options.idAttr;
                self.searchAttr = options.searchAttr;
                self.labelAttr = options.labelAttr;

                var restStore = new JsonRestStore({
                    target: self.restUrl,
                    idAttribute: self.idAttr
                });

                var comboProps = {
                    name: self.name,
                    store: restStore,
                    autoComplete: true,
                    required: self.required,
                    style: {"width": "90%"},
                    queryExpr: "*${0}*",
                    searchDelay: 250,
                    searchAttr: self.searchAttr,
                    labelAttr: self.labelAttr,
                    onChange: function(newValue) {
                        self._value = newValue;
                    }
                };

                // A query that can be passed to store to initially filter the items. ComboBox
                // overwrites any reference to the searchAttr and sets it to the queryExpr with the
                // user's input substituted.
                comboProps.query[self.searchAttr] = "";

                self._comboWidget = new ComboBox(comboProps);
            },

            postCreate: function() {
                if (this._value === undefined) {
                    this._value = null;
                }
                this._comboWidget.placeAt(this.restCombo);
            },

            _getDisabledAttr: function() {
                return this._disabled;
            },

            _setDisabledAttr: function(disabled) {
                this._disabled = !!disabled;
                this._comboWidget.set('disabled', this._disabled);
            },

            _getDisplayedValueAttr: function() {
                return this._comboWidget.get("displayedValue");
            },

            _getValueAttr: function() {
                return this._comboWidget.get("value");
            },

            _setValueAttr: function(value) {
                this.value = value;
                this._comboWidget.set("value", value);
            }
        }
    );
});

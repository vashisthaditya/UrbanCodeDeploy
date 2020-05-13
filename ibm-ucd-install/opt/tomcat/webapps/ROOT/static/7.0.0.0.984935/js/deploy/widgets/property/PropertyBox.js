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
        "dojo/Deferred",
        "dojo/store/util/QueryResults",
        "dojo/store/Memory",
        "deploy/widgets/property/PropertyComboBox"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        lang,
        Deferred,
        QueryResults,
        Memory,
        PropertyComboBox
) {
    /**
     * A widget for autocompleting properties.
     */
    var propertyBoxWidget = declare('deploy.widgets.property.PropertyBox',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="propBox" data-dojo-attach-point="propBoxAttach">' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            var self = this;

            var propertyStore = new Memory({
                data: [],
                idProperty: 'name'
            });

            this.propTextBox = new PropertyComboBox({
                store: propertyStore,
                searchAttr: "name",
                selectOnClick: true,
                autoComplete: false,
                pageSize: this.pageSize || Infinity,
                value: this.value || "",
                "class": "propertyBox",
                cache: this.cache
            });
            this.propTextBox.placeAt(this.propBoxAttach);
        },

        _getValueAttr: function() {
            return this.propTextBox.get('value');
        }
    });

    config.data.extraFormDelegates.push({
        name: "PropertyBox",
        delegateFunction: function(entry) {
            var propertyBox = new propertyBoxWidget({
                pageSize: entry.pageSize || Infinity,
                value: entry.value,
                label: entry.label,
                noneLabel: entry.noneLabel,
                name: entry.name,
                cache: entry.cache
            });

            return propertyBox;
        }
    });

    return propertyBoxWidget;
});

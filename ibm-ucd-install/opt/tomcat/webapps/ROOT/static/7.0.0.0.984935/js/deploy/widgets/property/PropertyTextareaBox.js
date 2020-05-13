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
        "deploy/widgets/property/PropertyTextarea"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        lang,
        Deferred,
        QueryResults,
        Memory,
        PropertyTextarea
) {
    /**
     * A widget for autocompleting properties... with a textarea!
     */
    var propertyBoxWidget = declare('deploy.widgets.property.PropertyTextareaBox',  [_Widget, _TemplatedMixin], {
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

            this.propTextArea = new PropertyTextarea({
                store: propertyStore,
                searchAttr: "name",
                autoComplete: false,
                pageSize: this.pageSize || Infinity,
                value: this.value || "",
                cache: self.cache
            });
            this.propTextArea.placeAt(this.propBoxAttach);
        },

        _getValueAttr: function() {
            return this.propTextArea.get('value');
        }
    });

    config.data.extraFormDelegates.push({
        name: "PropertyArea",
        delegateFunction: function(entry) {
            var propertyArea = new propertyBoxWidget({
                pageSize: entry.pageSize || Infinity,
                value: entry.value,
                label: entry.label,
                noneLabel: entry.noneLabel,
                name: entry.name,
                cache: entry.cache
            });

            return propertyArea;
        }
    });

    return propertyBoxWidget;
});

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
/*global define, i18n */
define([
        "dojo/_base/declare",
        "dijit/_Widget",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dojo/_base/array",
        "dojo/dom-class",
        "dojo/dom-style",
        "dojo/dom-construct",
        "dojo/_base/lang",
        "dojo/_base/xhr",
        "dojo/window"
        ],
function(
        declare,
        _Widget,
        _WidgetBase,
        _TemplatedMixin,
        array,
        domClass,
        domStyle,
        domConstruct,
        lang,
        baseXhr,
        win
) {
    return declare(
        [_WidgetBase, _TemplatedMixin],
        {
            templateString: '<div class="genericDetail">' +
                                '<div data-dojo-attach-point="detailAttach" class="inlineBlock detailContainer"></div>' +
                                '<div data-dojo-attach-point="descriptionAttach" class="descriptionContainer"></div>'+
                                '<div style="clear: both;"></div>'+
                            '</div>',

            labelStyle: null,
            fieldStyle: null,

            /**
             *
             */
            constructor: function() {
                this.labelStyle = {};
                this.fieldStyle = {};
            },

            /**
             *
             */
            postCreate: function() {
                this.inherited(arguments);
                var self = this;

                array.forEach(this.properties, function(item) {
                    self._createDetailElement(item);
                }, this);

                if (this.description) {
                    domClass.add(this.domNode, "withDescription");

                    domConstruct.create("div", {
                        "innerHTML": i18n("Description:"),
                        "class": "detailDescriptionLabel"
                    }, this.descriptionAttach);

                    domConstruct.create("div", {
                        "innerHTML": this.description,
                        "dir": util.getResolvedBTD(this.description),
                        "align": util.getUIDirAlign(),
                        "class": "detailDescription"
                    }, this.descriptionAttach);
                }

                if (!this.properties || this.properties.length === 0) {
                    domClass.add(this.domNode, "noProperties");
                }
            },

            destroy: function() {
                this.inherited(arguments);
            },

            /**
             *
             */
            _createDetailElement: function(item) {
                var self = this;

                var detailDiv = domConstruct.create("div", {
                    "class": "detailDiv"
                }, this.detailAttach);
                if (item.containerClassName) {
                    domClass.add(detailDiv, item.containerClassName);
                }
                if (item.placeAbove){
                    domConstruct.place(detailDiv, this.detailAttach, "before");
                }
                else if (item.placeBelow){
                    domConstruct.place(detailDiv, this.detailAttach, "after");
                }

                // create label element
                var detailLabel = domConstruct.create("div", {
                    "class": "inlineBlock detailLabel",
                    innerHTML: item.label || "&nbsp;"
                }, detailDiv);

                // create the field element
                var detailField = domConstruct.create("div", {
                    "class": "inlineBlock detailField"
                }, detailDiv);

                if (item.value) {
                    if (item.value instanceof _Widget) {
                        item.value.placeAt(detailField);
                    }
                    else if ((typeof item.value === "object") && (item.value.nodeType === 1) &&
                             (typeof item.value.style === "object") && (typeof item.value.ownerDocument ==="object")) {
                        detailField.appendChild(item.value);
                    }
                    else if (typeof item.value !== "object") {
                        detailField.innerHTML = item.value;
                    }
                }
                else {
                    detailField.innerHTML = "";
                }

                if (item.className) {
                    domClass.add(detailField, item.className);
                }
            }
        }
    );
});

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
        "dojo/_base/array",
        "dojo/dom-attr",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/dom-style",
        "dijit/registry",
        "js/webext/widgets/DomNode",
        "js/webext/widgets/TooltipCreator"
        ],
function(
        declare,
        _WidgetBase,
        _TemplatedMixin,
        array,
        domAttr,
        domConstruct,
        domClass,
        domStyle,
        registry,
        DomNode,
        TooltipCreator
) {


    /**
     * Shows widgets in a tabular label/field format.
     *
     * Supported properties:
     *  fieldStyle / Object (Style)       Styles to use as the field width.
     */
    return declare(
        [_WidgetBase, _TemplatedMixin],
        {
            templateString:
                '<div class="table">'+
                    '<div data-dojo-attach-point="fieldAttach"></div>'+
                '</div>',

            fieldStyle: {},

            /**
             *
             */
            postCreate: function() {
                this.inherited(arguments);

                this.fields = [];
                this.rows = [];
            },

            /**
             * The following properties are supported on widgets passed to this function:
             *  label: The label to show for this field
             *  rowClass: The class to apply to this row (default: labelsAndValues-row)
             *  doubleWidth: Whether the label and field portions should be united
             */
            insertField: function(widget, index, tooltip, fieldName, alwaysShowTooltipIcon) {
                var fieldRow = document.createElement("div");

                if (fieldName) {
                    // Track the given field name on the base div for the field. Used for testing.
                    domAttr.set(fieldRow, "data-field-name", fieldName);
                }

                if (!!widget.rowClass) {
                    fieldRow.className = widget.rowClass;
                }
                else {
                    fieldRow.className = "labelsAndValues-row";
                }

                if (!widget.doubleWidth && !widget.hideLabel) {
                    var labelClass = "labelsAndValues-labelCell";
                    if (widget.type === "checkbox") {
                        labelClass += " checkBoxLabel";
                    }

                    var labelContainer = domConstruct.create("div", {className: labelClass});
                    var labelCell = domConstruct.create("div", {className: "labelsAndValues-labelCell"});

                    if ((typeof widget.label === "object") && (widget.label.nodeType === 1) &&
                            (typeof widget.label.style === "object") && (typeof widget.label.ownerDocument ==="object")) {
                        labelCell.appendChild(widget.label);
                    }
                    else if (widget.label !== undefined && typeof widget.label !== "object") {
                        labelCell.innerHTML = widget.label;
                    }

                    labelContainer.appendChild(labelCell);
                    fieldRow.appendChild(labelContainer);

                    if (tooltip) {
                        var tooltipCreator = new TooltipCreator();
                        tooltipCreator.createTooltip(labelContainer, tooltip);
                    }
                    if (!alwaysShowTooltipIcon) {
                        domClass.add(fieldRow, "help-toolip-on-hover");
                    }
                }

                var fieldCell = document.createElement("div");
                fieldCell.className = "labelsAndValues-valueCell";

                domStyle.set(fieldCell, this.fieldStyle);
                widget.placeAt(fieldCell);
                fieldRow.appendChild(fieldCell);

                if (index === undefined || index === null || index === this.fields.length) {
                    this.fields.push(widget);
                    this.rows.push(fieldRow);
                    this.fieldAttach.appendChild(fieldRow);
                }
                else {
                    this.fields.splice(index, 0, widget);
                    this.rows.splice(index, 0, fieldRow);
                    this.fieldAttach.insertBefore(fieldRow, this.rows[index+1]);
                }
                if (widget.attachPoint){
                    domConstruct.place(fieldRow, widget.attachPoint);
                }
                widget.fieldRow = fieldRow;

            },

            /**
             * Shortcut to add a field using the given dom node.
             */
            insertDomNode: function(label, domNode, index) {
                var result = new DomNode({});
                result.label = label;
                result.domAttach.appendChild(domNode);

                this.insertField(result, index);
            },

            /**
             * Shortcut to make a div with the given label and value and add it.
             */
            insertDiv: function(label, value, index) {
                var result = new DomNode({});
                result.label = label;

                var resultDiv = document.createElement("div");
                resultDiv.innerHTML = value;
                result.domAttach.appendChild(resultDiv);

                this.insertField(result, index);
            },

            /**
             * Shortcut to make a link with the given label, href, and value and add it.
             */
            insertLink: function(label, href, value, index) {
                var result = new DomNode({});
                result.label = label;

                var resultDom = document.createElement("a");
                resultDom.innerHTML = value;
                resultDom.href = href;
                result.domAttach.appendChild(resultDom);

                this.insertField(result, index);
            },

            /**
             *
             */
            removeField: function(index) {
                this.fieldAttach.removeChild(this.rows[index]);
                this.fields.splice(index, 1);
                this.rows.splice(index, 1);
            },

            destroy: function (/*boolean */preserveDom) {
                if (this.fieldAttach) {
                    array.forEach(registry.findWidgets(this.fieldAttach), function (w){
                        w.destroy(preserveDom);
                    });
                }
                this.inherited(arguments);
            }
        }
    );
});

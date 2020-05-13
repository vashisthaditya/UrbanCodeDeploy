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
        "dijit/form/Select",
        "dijit/form/TextBox",
        "dojo/_base/declare",
        "dojo/dom-construct",
        "dojo/dom-style",
        "dojo/on"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Select,
        TextBox,
        declare,
        domConstruct,
        domStyle,
        on
) {
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="edit-resource-condition">'+
                '<div data-dojo-attach-point="typeAttach" class="inline-block"></div>' +
                '<div data-dojo-attach-point="typeValueAttach" class="inline-block"></div>' +
                '<div data-dojo-attach-point="comparisonAttach" class="inline-block"></div>' +
                '<div data-dojo-attach-point="valueAttach" class="inline-block"></div>' +
                '<div data-dojo-attach-point="deleteAttach" class="inline-block linkPointer"></div>' +
            '</div>',

        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            domStyle.set(this.domNode, {
                height: "26px"
            });

            var value = self.get("value");

            self.typeSelect = new Select({
                options: [{
                    label: i18n("Name"),
                    value: "NAME",
                    selected: value.type === "NAME"
                },{
                    label: i18n("Property"),
                    value: "PROPERTY",
                    selected: value.type === "PROPERTY"
                }],
                onChange: function(value) {
                    if (self.typeValueText) {
                        self.typeValueText.destroy();
                        delete self.typeValueText;
                    }

                    if (value === "TYPE") {
                        //we need to remove the condition type if it exists
                        if (self.comparisonSelect) {
                            self.comparisonSelect.destroy();
                            delete self.comparisonSelect;
                        }
                        if (self.valueText) {
                            self.valueText.destroy();
                            delete self.valueText;
                        }
                        self._createResourceTypeSelect(value);
                    }
                    else if (self.resourceTypeSelect) {
                        //having switched from type to something else we need to delete typeselect
                        // and create comparisonSelect and valueText
                        self.resourceTypeSelect.destroy();
                        delete self.resourceTypeSelect;
                        self._createComparisonSelect(value);
                        self._createValueText(value);
                    }

                    if (value === "PROPERTY") {
                        self._createTypeValueText();
                    }
                }
            });
            self.typeSelect.placeAt(self.typeAttach);

            if (value.type === "PROPERTY") {
                self._createTypeValueText();
            }

            self._createComparisonSelect(value);
            self._createValueText(value);

            var deleteImage = domConstruct.create("div", {
                className: "iconMinus",
                style: {
                    position: "relative",
                    top: "5px"
                }
            }, self.deleteAttach);
            on(deleteImage, "click", function(){
                if (self.onDelete) {
                    self.onDelete();
                }
            });

        },

        validate: function() {
            var result = [];

            var value = this.get("value");

            if (value.type === "PROPERTY" && !value.typeValue) {
                result.push(i18n("A property name must be specified."));
            }
            if (!value.value) {
                result.push(i18n("A comparison value must be specified."));
            }

            return result;
        },

        _getValueAttr: function() {
            var result = this.value || {
                type: "NAME",
                comparison: "EQUALS",
                typeValue: "",
                value: ""
            };
            this.value = result;

            // Update value with current values from components
            if (this.typeSelect) {
                result.type = this.typeSelect.get("value");
            }
            if (this.typeValueText) {
                result.typeValue = this.typeValueText.get("value");
            }
            if (this.comparisonSelect) {
                result.comparison = this.comparisonSelect.get("value");
            }
            else if (result.type === "TYPE") {
                result.comparison = "EQUALS";
            }
            if (this.valueText) {
                result.value = this.valueText.get("value");
            }
            if (this.resourceTypeSelect) {
                result.value = this.resourceTypeSelect.get("value");
            }
            if (result.type === "NAME") {
                result.typeValue = "";
            }

            return result;
        },

        _setValueAttr: function(value) {
            this.value = value;
        },

        _createTypeValueText: function() {
            var value = this.get("value");
            this.typeValueText = new TextBox({
                value: value.typeValue
            });
            this.typeValueText.domNode.style.width = "60px";
            this.typeValueText.placeAt(this.typeValueAttach);
        },

        _createComparisonSelect: function(value) {
            this.comparisonSelect = new Select({
                options: [{
                    label: i18n("Equals"),
                    value: "EQUALS",
                    selected: value.comparison === "EQUALS"
                },{
                    label: i18n("Doesn't Equal"),
                    value: "NOT_EQUALS",
                    selected: value.comparison === "NOT_EQUALS"
                },{
                    label: i18n("Contains"),
                    value: "CONTAINS",
                    selected: value.comparison === "CONTAINS"
                },{
                    label: i18n("Doesn't Contain"),
                    value: "NOT_CONTAINS",
                    selected: value.comparison === "NOT_CONTAINS"
                },{
                    label: i18n("Matches Regex"),
                    value: "REGEX",
                    selected: value.comparison === "REGEX"
                }]
            });
            this.comparisonSelect.placeAt(this.comparisonAttach);
        },

        _createValueText: function(value) {
            this.valueText = new TextBox({
                value: value.value
            });
            this.valueText.domNode.style.width = "100px";
            this.valueText.placeAt(this.valueAttach);
        }
    });
});
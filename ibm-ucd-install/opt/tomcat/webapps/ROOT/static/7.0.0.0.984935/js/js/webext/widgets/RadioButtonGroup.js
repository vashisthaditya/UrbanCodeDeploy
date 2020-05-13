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
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/on",
        "dijit/_TemplatedMixin",
        "dijit/_WidgetBase",
        "dojox/html/entities",
        "dijit/form/RadioButton"
        ],
function(
        declare,
        array,
        domClass,
        domConstruct,
        on,
        _TemplatedMixin,
        _WidgetBase,
        entities,
        RadioButton
) {

    /**
     * Presents options as radio buttons and tracks the selected value.
     * Supported properties:
     *  name / String               Name of the radio button group. Must be unique to the page.
     *  value / String              Value of the option to be selected initially.
     *  options / Array             An array of options, one for each radio button. 
     *                              Each option should contain label and value 
     *                              properties, or content and value properties,
     *                              if the label needs to have unescaped html in
     *                              it.
     *  onChange / Function         Function to execute on a change in value.
     *  disabled / Boolean          Whether the radio button should be disabled.
     *
     */
    return declare(
        [_WidgetBase, _TemplatedMixin],
        {
            templateString:
                '<span class="radioButtonGroup">' +
                '    <div data-dojo-attach-point="radioButtonGroup"></div>' +
                '</span>',

            postCreate: function() {
                var self = this;
                var radioButtons = [];

                array.forEach(self.options, function(option) {
                    var radioButtonContainer = domConstruct.create("div");
                    
                    var radioButton = new RadioButton({
                        name: self.name,
                        value: option.value,
                        disabled: self.disabled,
                        checked: self.value === option.value,
                        onChange: function(checked) {
                            if (checked) {
                                if (self.onChange) {
                                    self.onChange(self.get("value"));
                                }
                            }
                        }
                    });

                    var radioButtonLabel = domConstruct.create("label", {
                        "class": "inlineBlock"
                    });
                    radioButton.placeAt(radioButtonLabel);
                    
                    var labelContainer = domConstruct.create("div", {
                        "class": "inlineBlock radioButtonLabel"
                    });
                    if (option.content) {
                        labelContainer.appendChild(option.content);
                    }
                    else {
                        var labelText = document.createTextNode(option.label);
                        labelContainer.appendChild(labelText);
                    }

                    radioButtonLabel.appendChild(labelContainer);
                    
                    radioButtonContainer.appendChild(radioButtonLabel);

                    self.radioButtonGroup.appendChild(radioButtonContainer);
                    radioButtons.push(radioButton);
                });

                self._radioButtons = radioButtons;
            },

            // Initialized in postCreate
            _radioButtons: null,

            // Initialized in _setValueAttr
            _initialValue : undefined,

            _getValueAttr: function() {
                var result;
                var i;
                var radioButton;
                var radioButtons = this._radioButtons;
                if (!radioButtons) {
                    result = this._initialValue;
                }
                else {
                    result = undefined;
                    for (i = 0; i < radioButtons.length; i++) {
                        radioButton = radioButtons[i];
                        if (radioButton.get("checked")) {
                            result = radioButton.get("value");
                            break;
                        }
                    }
                }
                return result;
            },

            _setValueAttr: function(value) {
                var i;
                var radioButton;
                var radioButtons = this._radioButtons;
                if (!radioButtons) {
                    this._initialValue = value;
                }
                else {
                    for (i = 0; i < radioButtons.length; i++) {
                        radioButton = radioButtons[i];
                        if (radioButton.get("value") === value) {
                            radioButton.set("checked", true);
                            break;
                        }
                    }
                }
            }
        }
    );
});

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
        "dojo/aspect",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dijit/_TemplatedMixin",
        "dijit/_WidgetBase",
        'dijit/form/CheckBox',
        "dojox/html/entities",
        "js/webext/widgets/TooltipCreator"
        ],
function(
        declare,
        array,
        aspect,
        domClass,
        domConstruct,
        _TemplatedMixin,
        _WidgetBase,
        CheckBox,
        entities,
        TooltipCreator
) {

    /**
     * A widget which wraps a set of checkboxes as an alternative to a multiselect
     *
     * Takes parameters:
     *  name            The name of the widget; used as a prefix in the names of checkbox form elements
     *  onChange(new)   Overridable function for any change to any option on the widget
     *  options         List of checkbox objects of the following form:
     *    {
     *      label           Label to show next to the individual checkboxes
     *      name            Name of the checkbox. Present in CheckboxGroup value if checked.
     *      checked         Whether or not the box is checked
     *      disabled        Whether the box is disabled (read only) or not
     *      onChange(new)   Overridable function for individual checkbox changes.
     *    }
     *
     */
    return declare("js/webext/widgets/CheckboxGroup",
        [_WidgetBase, _TemplatedMixin],
        {
            "templateString":
                '<div class="checkBoxGroup">'+
                '    <div data-dojo-attach-point="optionDiv" class="inlineBlock"></div>'+
                '</div>',

            "optionDiv":    null,

            "name":         null,

            "onChange":     function(newValue) {},

            "options":      [],

            "_getValueAttr": function() {
                return array.map(this._getCheckedOptions(), function(option) {
                    return option.name;
                });
            },

            "_getCheckedOptions": function() {
                return array.filter(this.options, function(option) {
                    return option.checked;
                });
            },

            "_setOptionsAttr": function(options) {
                this.options = options;
                this.refreshOptions();
            },

            "addOption": function(option, index) {
                if (!!index) {
                    this.options.splice(index, 0, option);
                }
                else {
                    this.options.push(option);
                }
                this.refreshOptions();
            },

            "removeOption": function(name) {
                var index = this.findOption(name);
                if (index !== -1) {
                    this.options.splice(index, 1);
                    this.refreshOptions();
                }
            },

            "findOption": function(name) {
                var result = -1;
                array.forEach(this.options, function(option, index) {
                    if (option.name === name) {
                        result = index;
                        return;
                    }
                });
                return result;
            },

            /**
             *
             */
            "refreshOptions": function() {
                var self = this;
                var cbox,
                label,
                containerDiv;
                domConstruct.empty(self.optionDiv);
                array.forEach(self.options, function(option) {
                    containerDiv = domConstruct.create("div", {
                        "class": "block"
                    });
                    cbox = new CheckBox({
                        "name": self.name,
                        "checked": option.checked,
                        "value": option.name,
                        "disabled": !!option.disabled,
                        "class": "groupOption",
                        "onChange": function(newValue) {
                            option.checked = newValue;
                            if (!!option.onChange) {
                                option.onChange(newValue);
                            }
                            self.onChange(newValue);
                        }
                    });
                    self.own(cbox);
                    label = domConstruct.create("div", {
                        "innerHTML": entities.encode(option.label),
                        "class": "inlineBlock"
                    });
                    cbox.placeAt(containerDiv);
                    domConstruct.place(label, containerDiv);
                    domConstruct.place(containerDiv, self.optionDiv);

                    if (option.description) {
                        var tooltipCreator = new TooltipCreator();
                        tooltipCreator.createTooltip(containerDiv, option.description);
                    }
                });
            },

            /**
             *
             */
            "postCreate": function() {
                this.inherited(arguments);
                this.refreshOptions();
            }
        }
    );
});
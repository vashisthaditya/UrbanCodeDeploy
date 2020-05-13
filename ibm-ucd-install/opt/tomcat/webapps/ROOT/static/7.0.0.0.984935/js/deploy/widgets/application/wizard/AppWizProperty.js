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
        "dojo/Stateful",
        "dojo/store/Memory",
        "dojo/store/Observable",
        "dojo/_base/declare"
        ],
function(
        Stateful,
        Memory,
        Observable,
        declare
) {
    /**
     * Stateful data model backing for Property.
     */
    return declare([Stateful], {
        propDef: null,
        currentValue: null,
        currentHttpSelectLabel: null,
        error:null,

        /**
         * The initial value for this property is determined based on the
         * following rules (in order):
         *     1. Use initialValue if it is neither null nor undefined.
         *     2. Use the default value in propDef if it is neither null nor
         *        undefined.
         *     3. If propDef.type is "CHECKBOX", use the string "false".
         *     4. If propDef.type is "DATETIME", use the string "0".
         *     5. Use the string "".
         */
        constructor: function(propDef, initialValue) {
            var self = this;

            this.propDef = propDef;

            if (this._valueIsDefinedAndNotEmpty(initialValue)) {
                this.currentValue = initialValue;
            } else if (this._valueIsDefinedAndNotEmpty(propDef.value)) {
                if (propDef.type === "CHECKBOX") {
                    if (propDef.value === "true") {
                        this.currentValue = true;
                    } else if (propDef.value === "false") {
                        this.currentValue = false;
                    }
                } else {
                    this.currentValue = propDef.value;
                }
                this._handleHttpSelectLabel();
            } else if (propDef.type === "SELECT") {
                if (propDef.allowedValues && propDef.allowedValues.length > 0) {
                    this.currentValue = propDef.allowedValues[0].value;
                } else {
                    this.currentValue = "";
                }
            } else if (propDef.type === "CHECKBOX") {
                this.currentValue = false;
            } else if (propDef.type === "DATETIME") {
                var d = new Date();
                this.currentValue = d.getTime().toString();
            } else {
                this.currentValue = "";
            }

            this.validate();
            this.watch("currentValue", function(propName, oldValue, newValue) {
                if (oldValue !== newValue) {
                    self.validate();
                }
            });
        },

        /**
         * Validate this property's current value against its definition.
         * @return An array of size 2 where:
         *         - Index 0 is true if the validation passed and false if not.
         *         - Index 1 is an empty String if the validation passed and an
         *           error message explaining why it failed if not.
         * Future endeavor?
         *         location of this validation logic?
         *         option of pulling validation logic for each of the
         *         9 prop types into its own validator class?
         */
        validate: function() {
            var self = this;
            var msg = "";
            var pattern = this.propDef.pattern;
            var label = this.propDef.label;

            // strip off any leading "template/" from the front of the label to
            // avoid confusing the user
            if (label.indexOf("template/") === 0) {
                label = label.substring(9);
            }

            // ensure value is provided if required
            if (this.propDef.required === true &&
                (this.currentValue === "" ||       // text property
                    this.currentValue === false || // checkbox property
                    this.currentValue.length === 0))     // multi select property
            {
                msg = i18n("Value for property %s is required but not given", label);
                this.set("error", msg);
                return [false, msg];
            }

            // if the pattern and value are both set, ensure that the value matches the pattern
            if (pattern && this.currentValue) {
                if (this.propDef.type.indexOf("MULTI_SELECT") !== -1) {
                    var passed = true;
                    this.currentValue.split(",").forEach(function(value) {
                        if (!self._validatePattern(value, pattern)) {
                            msg = i18n("Value for property %s does not match the required pattern.", label);
                            passed = false;
                        }
                    });
                    if (passed === false) {
                        this.set("error", msg);
                        return [false, msg];
                    }
                } else if (!this._validatePattern(this.currentValue, pattern)) {
                    msg = i18n("Value for property %s does not match the required pattern.", label);
                    this.set("error", msg);
                    return [false, msg];
                }
            }

            // validation passed
            this.set("error", "");
            return [true, ""];
        },

        _handleHttpSelectLabel: function() {
            if (this.propDef.type === 'HTTP_SELECT' || this.propDef.type === 'HTTP_MULTI_SELECT') {
                this.currentHttpSelectLabel = this.propDef.defaultLabel;
            }
        },

        _valueIsDefinedAndNotEmpty: function(value) {
            return value !== null && value !== undefined && value !== "";
        },

        _validatePattern: function(value, pattern) {
            var regex = new RegExp("^"+pattern+"$");
            return regex.test(value);
        }
    });
});

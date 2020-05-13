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
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/aspect",
        "js/webext/widgets/ColumnForm",
        'js/webext/widgets/DateTime',
        "js/webext/widgets/BidiDateUtil",
        "dijit/form/DateTextBox"
        ],
function(
        _TemplatedMixin,
        _Widget,
        array,
        declare,
        baseXhr,
        aspect,
        ColumnForm,
        DateTime,
        BidiDateUtil,
        DateTextBox
) {
    /**
     * Edit form for PropDefs
     *
     *  onlyValueChange / Boolean   Whether to prevent editing of any fields but the default value,
     *                              addition of properties, deletion of properties, etc.
     *                              Default value: false
     *
     *  testHttpPropDefUrl / String Where to make a PUT against to test HTTP property values.
     *                              If not given, will attempt to generate url:
     *                              property/propSheetDef/{propSheetParam}/testHttpValues
     */
    return declare('deploy.widgets.property.EditPropDef',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="editPropDef">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        httpFieldNames: ["httpUrl", "httpUsername", "httpPassword", "httpFormat",
                      "httpBasePath", "httpValuePath", "httpLabelPath"],

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            this.existingValues = {};
            if (this.propDef) {
                this.existingValues.name = this.propDef.name;
                this.existingValues.description = this.propDef.description;
                this.existingValues.label = this.propDef.label;
                this.existingValues.pattern = this.propDef.pattern;
                this.existingValues.required = this.propDef.required;
                this.existingValues.value = this.propDef.value;
                this.existingValues.defaultLabel = this.propDef.defaultLabel;
                this.existingValues.type = this.propDef.type;
                this.existingValues.allowedValues = this.propDef.allowedValues;
                this.existingValues.httpUrl = this.propDef.httpUrl;
                this.existingValues.httpUsername = this.propDef.httpUsername;
                this.existingValues.httpPassword = this.propDef.httpPassword;
                this.existingValues.httpFormat = this.propDef.httpFormat;
                this.existingValues.httpBasePath = this.propDef.httpBasePath;
                this.existingValues.httpValuePath = this.propDef.httpValuePath;
                this.existingValues.httpLabelPath = this.propDef.httpLabelPath;
            }

            var submitUrl;
            if (this.propSheetDefPath) {
                submitUrl = bootstrap.baseUrl+"property/propSheetDef/"+util.vc.encodeVersionedPath(this.propSheetDefPath)+".-1/propDefs";
                if (this.propDef) {
                    submitUrl += "/"+encodeURIComponent(this.propDef.name);
                }
            }
            else if (this.saveUrl) {
                submitUrl = this.saveUrl;
            }
            else {
                submitUrl = bootstrap.baseUrl+"property/propSheetDef/"+this.propSheetDefId+"/propDefs";
                if (this.propDef) {
                    submitUrl += "/"+encodeURIComponent(this.propDef.name);
                }
            }

            this.form = new ColumnForm({
                submitUrl: submitUrl,
                addData: function(data) {
                    data.definitionGroupId = self.propSheetDefId;
                    if (self.propDef) {
                        data.existingId = self.propDef.id;
                    }

                    if (data.type === "SELECT" || data.type === "MULTI_SELECT") {
                        data.allowedValues = [];
                        if (data.value === " ") {
                            data.value = "";
                        }
                        var regExp;
                        if (self.form.getValue("pattern")) {
                            regExp = util.getNormalizedRegExp(self.form.getValue("pattern"));
                        }
                        var allowedValuesText = self.form.getValue("allowedValues");
                        var propLines = allowedValuesText.split("\n");
                        array.forEach(propLines, function(propLine) {
                            if (propLine.length > 0) {
                                if ( (!regExp) || regExp.test(propLine) ) {
                                    data.allowedValues.push({
                                        label: propLine,
                                        value: propLine
                                    });
                                }
                            }
                        });
                    }
                    if (data.type === "HTTP_SELECT" || data.type === "HTTP_MULTI_SELECT") {
                        data.resolveHttpValuesUrl = self.resolveHttpValuesUrl + "/" + data.name;
                    }
                    if (data.type === "DATETIME") {
                        data.value = new Date(data.value).getTime();
                    }

                    self.addData(data);
                },
                onSubmit: self.onSubmit,
                onError: function(response) {
                    if (self.callback !== undefined) {
                        self.callback(response);
                    }
                },
                validateFields: function(data) {
                    var result = [];
                    var patternValid = true;
                    if (data.pattern) {
                        var error = self.validatePattern(data.pattern);
                        if (error) {
                            result.push(error);
                            patternValid = false;
                        }
                        if (data.value && patternValid) {
                            if (!self.validateValue(data.value,data.pattern)) {
                                result.push(i18n("Default value for property %s does not follow the required pattern",data.name));
                            }
                        }
                    }
                    return result;
                },
                postSubmit: function(data) {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                onCancel: function() {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                }
            });

            this.form.addField({
                name: "name",
                label: i18n("Name"),
                required: true,
                readOnly: this.propDef !== undefined,
                type: "Text",
                value: this.existingValues.name
            });

            this.form.addField({
                name: "description",
                label: i18n("Description"),
                type: "Text",
                readOnly: this.onlyValueChange,
                value: this.existingValues.description
            });

            this.form.addField({
                name: "label",
                label: i18n("Label"),
                type: "Text",
                readOnly: this.onlyValueChange,
                value: this.existingValues.label
            });
            this.form.addField({
                name: "pattern",
                label: i18n("Pattern"),
                type: "Text",
                value: this.existingValues.pattern,
                readOnly: this.onlyValueChange,
                description: i18n("Enter a regular expression to enforce that values for this property match a certain pattern. Leave blank to allow any values."),
                onChange: function() {
                    var type = self.form.getValue("type");

                    /* Checks that the default value being pattern checked has
                     a drop down box for the type. Not performing this check
                     causes the default value to be cleared, which can lead
                     to data loss */
                    if (type === "SELECT" || type === "HTTP_SELECT" || type === "DATETIME" || type === "MULTI_SELECT" ||
                        type === "HTTP_MULTI_SELECT") {
                        self.updateDefaultValueField();
                    }
                },
                intermediateChanges: true
            });

            this.form.addField({
                name: "required",
                label: i18n("Required"),
                type: "Checkbox",
                readOnly: this.onlyValueChange,
                value: this.existingValues.required
            });

            this.form.addField({
                name: "type",
                label: i18n("Type"),
                required: true,
                type: "Select",
                readOnly: this.onlyValueChange,
                value: this.existingValues.type,
                allowedValues: [{
                    label: i18n("Text"),
                    value: "TEXT"
                },{
                    label: i18n("Text Area"),
                    value: "TEXTAREA"
                },{
                    label: i18n("Checkbox"),
                    value: "CHECKBOX"
                },{
                    label: i18n("Select"),
                    value: "SELECT"
                },{
                    label: i18n("Multi Select"),
                    value: "MULTI_SELECT"
                },{
                    label: i18n("HTTP Select"),
                    value: "HTTP_SELECT"
                },{
                    label: i18n("HTTP Multi Select"),
                    value: "HTTP_MULTI_SELECT"
                },{
                    label: i18n("Secure"),
                    value: "SECURE"
                },{
                    label: i18n("DateTime"),
                    value: "DATETIME"
                }],
                onChange: function(value) {
                    self.updateAllowedValues();
                    self.updateHttpValues();
                    self.updateDefaultValueField();
                    this.previousType = value; // Referenced within DefaultValueField
                }
            });

            if (this.propDef) {
                var allowedValues;
                if (this.existingValues.type === "SELECT"
                        || this.existingValues.type === "MULTI_SELECT") {
                    allowedValues = [];
                    if (this.existingValues.type === "SELECT") {
                        allowedValues.push({
                            label: i18n("-- Make Selection --"),
                            value: " "
                        });
                    }
                    array.forEach(this.existingValues.allowedValues, function(allowedValue) {
                        allowedValues.push({
                            label: allowedValue.label,
                            value: allowedValue.value
                        });
                    });
                }
            }
            this.updateAllowedValues();
            this.updateHttpValues();
            this.updateDefaultValueField();

            this.form.placeAt(this.formAttach);
        },

        /**
         *
         */
        updateAllowedValues: function() {
            var self = this;

            var type = this.form.getValue("type");

            var oldValue;

            if (this.form.hasField("allowedValues")) {
                oldValue = this.form.getValue("allowedValues");
                this.form.removeField("allowedValues");
            }
            else if (this.existingValues.allowedValues) {
                oldValue = "";
                array.forEach(this.existingValues.allowedValues, function(allowedValue) {
                    oldValue += allowedValue.value+"\n";
                });
            }

            if (type === "SELECT" || type === "MULTI_SELECT") {
                this.form.addField({
                    name: "allowedValues",
                    label: i18n("Allowed Values"),
                    type: "TEXTAREA",
                    value: oldValue,
                    readOnly: this.onlyValueChange,
                    onChange: function() {
                        self.updateDefaultValueField();
                    }
                }, "value");
            }
        },

        /**
         *
         */
        updateHttpValues: function() {
            var self = this;

            var type = this.form.getValue("type");

            var oldValues = {};

            array.forEach(self.httpFieldNames, function(fieldName) {
                if (self.form.hasField(fieldName)) {
                    oldValues[fieldName] = self.form.getValue(fieldName);
                    self.form.removeField(fieldName);
                }
                else if (self.existingValues[fieldName]) {
                    oldValues[fieldName] = self.existingValues[fieldName];
                }
            });

            if (type === "HTTP_SELECT" || type === "HTTP_MULTI_SELECT") {
                this.form.addField({
                    name: "httpUrl",
                    label: i18n("URL"),
                    type: "TEXT",
                    value: oldValues.httpUrl,
                    readOnly: this.onlyValueChange,
                    required: true,
                    description: i18n("URL to retrieve the XML or JSON data from."),
                    onChange: function() {
                        self.updateDefaultValueField();
                    },
                    intermediateChanges: true
                });
                this.form.addField({
                    name: "httpUsername",
                    label: i18n("Username"),
                    type: "TEXT",
                    value: oldValues.httpUsername,
                    readOnly: this.onlyValueChange,
                    description: i18n("Username required to authenticate on the given URL."),
                    onChange: function() {
                        self.updateDefaultValueField();
                    },
                    intermediateChanges: true
                });
                this.form.addField({
                    name: "httpPassword",
                    label: i18n("Password"),
                    type: "SECURE",
                    value: oldValues.httpPassword,
                    readOnly: this.onlyValueChange,
                    description: i18n("Password required to authenticate on the given URL."),
                    onChange: function() {
                        self.updateDefaultValueField();
                    },
                    intermediateChanges: true
                });
                this.form.addField({
                    name: "httpFormat",
                    label: i18n("Data Format"),
                    type: "SELECT",
                    allowedValues: ["JSON", "XML"],
                    value: oldValues.httpFormat,
                    readOnly: this.onlyValueChange,
                    required: true,
                    description: i18n("The format which the retrieved data will have."),
                    onChange: function() {
                        self.updateDefaultValueField();
                    }
                });
                this.form.addField({
                    name: "httpBasePath",
                    label: i18n("Base Path"),
                    type: "TEXT",
                    value: oldValues.httpBasePath,
                    readOnly: this.onlyValueChange,
                    description: i18n("If Data Format is set to XML, this is an XPath statement" +
                            " that will retrieve the list of XML nodes, each of which" +
                            " contains a property. If Data Format is set to JSON, this is a" +
                            " dot-separated path which leads to the JSON Array containing" +
                            " each property. See documention for more details and examples."),
                    onChange: function() {
                        self.updateDefaultValueField();
                    },
                    intermediateChanges: true
                });
                this.form.addField({
                    name: "httpValuePath",
                    label: i18n("Value Path"),
                    type: "TEXT",
                    value: oldValues.httpValuePath,
                    readOnly: this.onlyValueChange,
                    description: i18n("This is a path which describes how to obtain the value" +
                            " representing a property from each object within the list found via" +
                            " the Base Path. For XML, this is an XPath statement. JSON requires a" +
                            " dot-seperated path. See documention for more details and examples."),
                    onChange: function() {
                        self.updateDefaultValueField();
                    },
                    intermediateChanges: true
                });
                this.form.addField({
                    name: "httpLabelPath",
                    label: i18n("Label Path"),
                    type: "TEXT",
                    value: oldValues.httpLabelPath,
                    readOnly: this.onlyValueChange,
                    description: i18n("This is a path which describes how to obtain the displayable" +
                            " name for a property from each object within the list found via" +
                            " the Base Path. For XML, this is an XPath statement. JSON requires a" +
                            " dot-seperated path. If no label is specified, the value retrieved via" +
                            " the Name Path will be used. See documention for more details and examples."),
                    onChange: function() {
                        self.updateDefaultValueField();
                    },
                    intermediateChanges: true
                });
            }
        },

        /**
         *
         */
        updateDefaultValueField: function() {
            var type = this.form.getValue("type");
            var oldValue;
            var oldDefaultLabel;
            var allowedValues;

            if (this.form.hasField("value")) {
                if (this.previousType
                        && (this.previousType !== "MULTI_SELECT" || this.previousType !== "HTTP_MULTI_SELECT")
                        && (type !== "MULTI_SELECT" || type !== "HTTP_MULTI_SELECT")) {
                    // Ignore default value for multi-selects, doesn't translate to other types
                    oldValue = this.form.getValue("value");
                }
                this.form.removeField("value");
            }
            else if (this.existingValues.value) {
                oldValue = this.existingValues.value;
            }
            if (this.form.hasField("defaultLabel")) {
                oldDefaultLabel = this.form.getValue("defaultLabel");
                this.form.removeField("defaultLabel");
            }
            else if (this.existingValues.defaultLabel) {
                oldDefaultLabel = this.existingValues.defaultLabel;
            }

            if (type === "SELECT" || type === "MULTI_SELECT") {
                allowedValues = [];
                if (type === "SELECT") {
                    allowedValues.push({
                        label: i18n("-- Make Selection --"),
                        value: " "
                    });
                }

                var regExp;
                if (this.form.getValue("pattern")) {
                    regExp = util.getNormalizedRegExp(this.form.getValue("pattern"));
                }
                var allowedValuesText = this.form.getValue("allowedValues");
                var propLines = allowedValuesText.split("\n");
                array.forEach(propLines, function(propLine) {
                    if (propLine.length > 0) {
                        if ( (!regExp) || regExp.test(propLine) ) {
                            allowedValues.push({
                                label: propLine,
                                value: propLine
                            });
                        }
                    }
                });
                this.form.addField({
                    name: "value",
                    label: i18n("Default Value"),
                    type: type,
                    value: oldValue,
                    allowedValues: allowedValues
                });
            }
            else if (type === "HTTP_SELECT" || type === "HTTP_MULTI_SELECT") {
                this.updateHttpDefaultValue(oldValue, oldDefaultLabel);
            }
            else if (type === "DATETIME") {
                if (!oldValue) {
                    oldValue = new Date();
                }
                else {
                    oldValue = new Date(Number(oldValue));
                }
                this.form.addField({
                    name: "value",
                    label: i18n("Default Value"),
                    type: "DateTime",
                    datePackage: BidiDateUtil.getDatePackage(),
                    value: oldValue,
                    readOnly: this.onlyValueChange
                });
            }
            else {
                this.form.addField({
                    name: "value",
                    label: i18n("Default Value"),
                    type: type,
                    value: oldValue,
                    readOnly: this.onlyValueChange
                });
            }
        },

        updateHttpDefaultValue: function(oldValue, oldDefaultLabel) {
            var self = this;
            var type = this.form.getValue("type");

            if (type === "HTTP_SELECT" || type === "HTTP_MULTI_SELECT") {
                var fieldData = {};
                array.forEach(self.httpFieldNames, function(fieldName) {
                    fieldData[fieldName] = self.form.getValue(fieldName);
                });
                if (this.propDef) {
                    fieldData.propDefName = this.propDef.name;
                }

                var url;
                if (this.resolveHttpValuesUrl) {
                    url = bootstrap.baseUrl + this.resolveHttpValuesUrl;
                }
                else {
                    var propSheetParam;
                    if (this.propSheetDefPath) {
                        propSheetParam = util.vc.encodeVersionedPath(this.propSheetDefPath)+".-1";
                    }
                    else {
                        propSheetParam = this.propSheetDefId;
                    }
                    var baseResolveHttpUrl = "property/propSheetDef/"
                        + propSheetParam + "/resolveHttpValues";
                    url = bootstrap.baseUrl + baseResolveHttpUrl;
                    if (!this.resolveHttpValuesUrl) {
                        this.resolveHttpValuesUrl = baseResolveHttpUrl;
                    }
                }

                var createEmptyField = function(placeholder) {
                    if (self.form.hasField("value")) {
                        self.form.removeField("value");
                    }
                    self.form.addField({
                        name: "value",
                        label: i18n("Default Value"),
                        type: type,
                        allowedValues: [],
                        readOnly: true
                    });
                    if (placeholder) {
                        self.form.fields.value.widget.dropDown.set("placeholder", placeholder);
                    }
                };

                var createRestfulField = function() {
                    if (self.form.hasField("defaultLabel")) {
                        self.form.removeField("defaultLabel");
                    }
                    self.form.addField({
                        name: "defaultLabel",
                        type: "hidden",
                        value: oldDefaultLabel
                    });

                    if (type === "HTTP_MULTI_SELECT") {
                        aspect.after(self.form.fields.defaultLabel.widget, "get", function(arg) {
                            if (arg === "value" && self.form.fields.value) {
                                // Override how we get the defaultLabel field value for multiselect
                                var labels = [];
                                array.forEach(self.form.fields.value.widget.items, function(item) {
                                    labels.push(item.label);
                                });
                                return labels.join(',');
                            }
                        }, true);
                    }

                    self.form.addField({
                        name: "value",
                        label: i18n("Default Value"),
                        pattern: self.form.getValue("pattern"),
                        url: url,
                        defaultQuery: fieldData,
                        type: type,
                        value: oldValue,
                        defaultLabel: oldDefaultLabel,
                        allowNone: true,
                        readOnly: self.onlyValueChange,
                        onSetItem: function(value, item) {
                            // Tracking label for HTTP Selects. Multi-select handled above.
                            if (value) {
                                self.form.setValue("defaultLabel", item.label);
                            }
                        },
                        onQueryError: function(error) {
                            console.log("axg");
                            createEmptyField(i18n("An error occurred."));
                        }
                    });
                };
                if (self.form.getValue("httpUrl")) {
                    createRestfulField();
                }
                else {
                    createEmptyField();
                }
            }
        },

        validateValue: function(value, pattern) {
            var result = true;
            var regex = new RegExp(pattern);
            try {
                // must be an exact match:
                //  ID00[1234] means ID001 is good, ID0012 is bad unless it's ID00[1234]*
                var match = value.match(regex);
                result = match !== null && value === match[0];
            } catch (err) {
                result = false;
            }
            return result;
        },

        validatePattern: function(pattern) {
            var result;
            try {
                // dojo build optimizes out the try/catch
                // if you don't use the expression you create
                new RegExp(pattern).exec('');
            }
            catch (err) {
                result = err.message || i18n("Invalid regular expression pattern for property");
            }
            return result;
        }
    });
});

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
        "dijit/_TemplatedMixin",
        "dijit/_WidgetBase",
        "dijit/form/Button",
        "dojo/_base/declare",
        "dojo/_base/array",
        "dojo/_base/xhr",
        "dojo/_base/lang",
        "dojo/aspect",
        "dojo/window",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/dom-style",
        "dojo/dom-geometry",
        "dojo/io-query",
        "dojo/json",
        "dojo/on",
        "js/util/blocker/_BlockerMixin",
        "js/webext/widgets/FormDelegates",
        "js/webext/widgets/FieldList",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/Alert",
        "dojox/string/BidiComplex"
],
function(
        _TemplatedMixin,
        _WidgetBase,
        Button,
        declare,
        array,
        baseXhr,
        lang,
        aspect,
        win,
        domConstruct,
        domClass,
        domStyle,
        domGeo,
        ioQuery,
        JSON,
        on,
        _BlockerMixin,
        FormDelegates,
        FieldList,
        Dialog,
        Alert,
        bidi_stt
) {

    /**
     * An general form widget which takes an array of fields and creates a form in a single-column
     * table format.
     *
     * Supported properties:
     *  fields / Array              An array of field objects, each of which can contain the following:
     *      widget / Widget         A widget to be used instead of all other options.
     *        - or -
     *      type / String           Type of the field. See FormDelegates.js for built-in types.
     *      ...and any properties documented by FormDelegates.js
     *  readOnly / Boolean          Whether the whole form should be read-only.
     *  shrinkFormToFit / Boolean   If a dialog is provided, shrink to fit it to prevent double-scrollbars.
     *  showButtons / Boolean       Whether the submit/cancel buttons should be shown.
     *  version / integer           Optional Value which if present indicates that the form is
     *                              versioned and that the header should include a version number
     *  saveLabel / String          Label to use for the "Save" button.
     *  cancelLabel / String        Label to use for the "Cancel" button. Null will hide the button.
     *  submitUrl / String          The URL to send the xhr call to.
     *  submitMethod / String       The method to use when submitting. Supported values:
     *                                  PUT (default)
     *                                  POST
     *                                  GET (does not attach field data)
     *  submitFormat / String       The format to wrap the submit data in. Supported values:
     *                                  JSON - JSON representation of the submit data object (default)
     *                                  Query - form parameters format. var1=value&var2=value, etc.
     *  getData / Function          An optional function to convert form data into the data submitted.
     *  addData / Function          An optional function to insert additional arguments into data.
     *  preSubmit / Function        The function to execute before submitting the form.
     *  postSubmit / Function       The function to execute after the form has been submitted.
     *  onCancel / Function         The function to execute when the user presses "cancel".
     *  onSubmit / Function         The function to execute when the user presses "submit". Overrides
     *                              default behavior - no xhr call will be made.
     *  onError / Function          The function to execute when an error comes back from the rest
     *                              service. This is given the error response object as an argument.
     *                              The default onError simply shows an alert with the text.
     *  validateFields / Function   Function to process data (after getData). Should return an array of
     *                              messages to display to the user as field validation errors.
     *  filter / Function           Optional function that determines what fields to display.
     *                              Example: filter: function(field) {
     *                                          var show = true;
     *
     *                                          if (field.name.substr(0, 1) === '_') {
     *                                              show = false;
     *                                          }
     *
     *                                          return show;
     *                                       }
     */
    return declare(
        [_WidgetBase, _TemplatedMixin, _BlockerMixin], {

            templateString:
                '<div>'+
                '  <div class="columnForm">'+
                '    <form data-dojo-attach-point="nativeFormAttach">'+
                '      <div data-dojo-attach-point="formAttach"></div>'+
                '    </form>'+
                '  </div>'+
                '  <div class="clear"></div>'+
                '</div>',

            submitMethod: "PUT",
            submitFormat: "JSON",
            readOnly: false,
            saveLabel: "",
            cancelLabel: "",
            showButtons: true,
            version: null,

            /**
             *
             */
            "constructor": function() {
                // XXX allowing i18n to be loaded before we try to translate strings.
                // this could probably be fixed by restructuring i18n and making it a dependency for this widget.
                this.saveLabel = i18n("Save");
                this.cancelLabel = i18n("Cancel");
                // showingFields: Tracks whether any fields have been shown.
                this.showingFields = false;

                // hasRequired: Tracks whether any required fields have been shown, to
                // determine whether the message about required properties is shown.
                this.hasRequired = false;

                // helpNodes: Array of objects to use creating tooltips after fields.
                this.helpNodes = [];
            },

            /**
             *
             */
            "postCreate": function() {
                var self = this;
                this.inherited(arguments);

                this.delegates = new FormDelegates();

                // add extra dynamic delegates
                if (!!self.extraFormDelegates) {
                    array.forEach(self.extraFormDelegates, function(delegateConfig) {
                        self.delegates.addDelegate(delegateConfig.name, delegateConfig.delegateFunction);
                    });
                }


                this.formContainer = new FieldList();
                this.own(this.formContainer);

                // Process all fields and add them to the TableContainer.
                array.forEach(this.fieldsArray, function(field) {
                    self.formContainer.insertField(field.widget, null, field.description, field.tooltipIcon);
                    self.showingFields = true;
                });

                // Determine if form should shrink to fit dialog
                if (this.dialog && this.shrinkFormToFit) {
                    this.formContainerContainer = domConstruct.create("div", {
                        style: {
                            overflowX: "hidden",
                            overflowY: "auto"
                        }
                    }, this.formAttach);
                    this.formContainer.placeAt(this.formContainerContainer);
                    aspect.after(this.dialog, "_size", lang.hitch(this, "_shrinkToFit"));
                } else {
                    this.formContainer.placeAt(this.formAttach);
                }

                this.started = true;
                on(this.nativeFormAttach, "submit", function(event) {
                    event.preventDefault();
                });

                // Only show the required message if some required fields have been shown.
                if (this.showingFields && this.hasRequired) {
                    var requiredNoticeText = domConstruct.create("div");
                    requiredNoticeText.innerHTML = i18n("All fields marked with<span class=\"required\">*</span> are required.");
                    requiredNoticeText.className = "underFieldText";

                    this.formAttach.appendChild(requiredNoticeText);
                }

                if (this.showButtons) {
                    // Create and show buttons.
                    self.buttonsAttach = domConstruct.create("div");
                    self.buttonsAttach.style.marginTop = "15px";
                    self.buttonsAttach.className = "underField";

                    if (!this.readOnly) {
                        this.saveButton = new Button({
                            label: this.saveLabel,
                            type: "submit"
                        });
                        domClass.add(this.saveButton.domNode, "idxButtonSpecial");
                        this.saveButton.placeAt(self.buttonsAttach);

                        on(this.nativeFormAttach, "submit", function(event) {
                            self.submitForm();
                        });
                    }

                    if (this.cancelLabel) {
                        var cancelButton = new Button({
                            label: this.cancelLabel,
                            onClick: function() {
                                self.onCancel();
                            }
                        });
                        cancelButton.placeAt(self.buttonsAttach);
                    }

                    this.formAttach.appendChild(self.buttonsAttach);
                }

                array.forEach(this.fields, function(field) {
                    self.addField(field);
                });

            },

            /**
             * To prevent form AND dialog from both having scroll bars
             * resize form to fit dialog
             */
            _shrinkToFit: function() {
                var dim = win.getBox();

                // available height minus what dialog would subtract (120px)
                var availableHeight = dim.h - 120;

                // fixed height (title and buttons)
                var buttonHeight = 0;
                if (this.showButtons) {
                    buttonHeight = domGeo.position(this.buttonsAttach).h;
                }
                var fixedHeight = buttonHeight + domGeo.position(this.dialog.titleBar).h;

                // height left for the form plus padding (30px)
                var formHeight = domGeo.position(this.formContainer.domNode).h + 30;
                // if screen too small just show title and buttons
                formHeight = Math.min(availableHeight-fixedHeight, formHeight);

                // set form height and and turn off container scroll bars
                domStyle.set(this.formContainerContainer, "height", formHeight +'px');
                domStyle.set(this.dialog.containerContainer, {
                    maxHeight: formHeight + fixedHeight +'px',
                    overflowX: "hidden",
                    overflowY: "hidden" //IE is very specific
                });
                domStyle.set(this.dialog.containerNode, {
                    overflowX: "hidden",
                    overflowY: "hidden",
                    position: "inherit"
                });
            },

            /**
             *
             */
            onCancel: function() {
                // No-op by default.
            },

            /**
             *
             */
            destroy: function() {
                this.inherited(arguments);
            },

            /**
             *
             */
            filter: function() {
                return true;
            },

            /**
             * Append a field, creating the fields array if necessary. This adds it to a fields
             * object which tracks them by name for easy access from calling widgets, and to an
             * array which tracks by index for internal usage.
             *
             * This function can also be used to generate widgets for form fields which can be
             * used outside of the generated form.
             *
             * @param before can be a string (for a field name) or a widget.
             * @return the field object, modified in-place to hold new information.
             */
            addField: function(field, before) {
                var self = this;
                if (self.fields === undefined) {
                    self.fields = {};
                }
                if (self.fieldsArray === undefined) {
                    self.fieldsArray = [];
                }

                if (field.widget === undefined && self.delegates.getDelegate(field.type) === undefined) {
                    console.error("Field: " + field.name + ": There is no form delegate for type " + field.type);
                }
                else {
                    if (field.translate && !field.translated) {
                        field.translated = true;

                        if(field.placeholder) {
                            field.placeholder = i18n(field.placeholder);
                        }

                        if (field.label) {
                            field.label = i18n(field.label.escapeHTML());
                        }

                        if (field.description) {
                            field.description = i18n(field.description.escapeHTML());
                        }

                        if (field.allowedValues) {
                            array.forEach(field.allowedValues, function(allowedValue) {
                                allowedValue.label = i18n(allowedValue.label);
                            });
                        }
                    }

                    field.readOnly = field.readOnly || self.readOnly;

                    // Set label to name if no label was provided.
                    if (!field.label && field.label !== "") {
                        if (field.name) {
                            field.label = field.name.escapeHTML();
                        }
                    }

                    // If the field does not pass the filter check, do not add it.
                    if (!(self.filter(field))) {
                        return;
                    }

                    if (field.widget === undefined) {
                        // Obtain the form field widget using the delegates, calling a function
                        // based on the given type of the field.
                        field.widget = self.delegates.getDelegate(field.type)(field);

                        // When a delegate returns null, no widget is to be shown.
                        if (field.widget === null) {
                            return;
                        }
                    }
                    else {
                        // For fields with supplied widgets, simply use the widget.
                        if (field.label){
                            field.widget.label = field.label.escapeHTML();
                        }
                        if (field.name) {
                            field.widget.name = field.name.escapeHTML();
                        }
                    }
                    if (field.attachPoint) {
                        field.widget.attachPoint = field.attachPoint;
                    }
                    if (field.placeholder) {
                        field.widget.set("placeholder", field.placeholder);
                    }
                    if (field.bidiDynamicSTT) {
                        var btd = util.getBaseTextDir();
                        if(btd) {
                            field.widget.focusNode.dir = "ltr";
                            bidi_stt.attachInput(field.widget.focusNode, field.bidiDynamicSTT);
                        }
                    }

                    self.own(field.widget);

                    if (field.style !== undefined) {
                        if (field.widget.set !== undefined) {
                            field.widget.set("style", field.style);
                        }
                        else {
                            field.widget.style = field.style;
                        }
                    }

                    // For required fields, show the required asterisk.
                    if (field.required) {
                        if (field.widget.label) {
                            field.widget.label += "<span class=\"required\">*</span>";
                        }

                        self.hasRequired = true;
                    }

                    self.fields[field.name] = field;

                    var index = self.fieldsArray.length;
                    // If a "before" argument has been given, locate the existing index of the target.
                    if (before !== undefined) {
                        var count = 0;
                        array.forEach(self.fieldsArray, function(addedField) {
                            if (addedField.name === before || addedField.widget === before) {
                                index = count;
                            }
                            count++;
                        });
                        self.fieldsArray.splice(index, 0, field);
                        if (self.started) {
                            self.formContainer.insertField(field.widget, index, field.description, field.name, field.tooltipIcon);
                            self.showingFields = true;
                        }
                    }
                    else {
                        self.fieldsArray.push(field);
                        if (self.started) {
                            self.formContainer.insertField(field.widget, undefined, field.description, field.name, field.tooltipIcon);
                            self.showingFields = true;
                        }
                    }
                }

                return field;
            },

            /**
             *
             */
            removeField: function(target) {
                var index = null;
                var field = null;
                var count = 0;
                array.forEach(this.fieldsArray, function(addedField) {
                    if (addedField.name === target || addedField.widget === target) {
                        index = count;
                        field = addedField;
                    }
                    count++;
                });
                if (index !== null) {
                    util.removeFromArray(this.fieldsArray, field);
                    this.fields[field.name] = undefined;

                    this.formContainer.removeField(index);
                }
                else {
                    console.error(target+" not found in form fields.");
                }
            },

            /**
             *
             */
            hasField: function(target) {
                var result = false;

                array.forEach(this.fieldsArray, function(addedField) {
                    if (addedField.name === target || addedField.widget === target) {
                        result = true;
                    }
                });

                return result;
            },

            /**
             *
             */
            getValue: function(target) {
                var field = null;
                var value = null;
                array.forEach(this.fieldsArray, function(addedField) {
                    if (addedField.name === target || addedField.widget === target) {
                        field = addedField;
                    }
                });
                if (field !== null) {
                    value = this.getValueByField(field);
                }
                return value;
            },

            /**
             * Set the value of one of the fields in the form.
             */
            setValue: function(target, value) {
                var field = null;
                array.forEach(this.fieldsArray, function(addedField) {
                    if (addedField.name === target || addedField.widget === target) {
                        field = addedField;
                    }
                });
                if (field !== null && field.widget) {
                    field.widget.set("value", value);
                }
            },

            /**
             * Submit the form data, using the submitMethod property to determine the desired type
             * of submission.
             */
            submitForm: function() {
                // Do not re-submit once a form is already being submitted.
                if (!this.isBlocked()) {
                    this._submitForm();
                }
            },

            _submitForm: function() {
                this.block();

                var self = this;
                var validationMessages = this.validateRequired();

                var submitData = this.getData();

                // Add any messages returned by the custom validation function.
                if (this.validateFields !== undefined) {
                    var customValidationMessages = this.validateFields(submitData);
                    array.forEach(customValidationMessages, function(message) {
                        validationMessages.push(message);
                    });
                }

                // No validation errors. Continue with submission.
                if (validationMessages.length === 0) {
                    if (this.preSubmit !== undefined) {
                        this.preSubmit(submitData);
                    }
                    if (this.onSubmit !== undefined) {
                        this.onSubmit(submitData);
                        if (this.postSubmit !== undefined) {
                            this.postSubmit(submitData);
                        }
                    }
                    else {
                        this.submitOverXhr(submitData);
                    }
                }
                // Show any validation messages.
                else {
                    validationMessages.unshift(i18n("Please correct the following errors before submitting this form:"));
                    new Alert({
                        messages: validationMessages
                    }).startup();
                    self.unblock();
                }

            },

            /**
             * Send submitted data over an XHR call (standard submission behavior)
             */
            submitOverXhr: function(submitData) {
                var self = this;

                if (this.submitMethod === "PUT" || this.submitMethod === "POST") {
                    var data;
                    var dataContentType;
                    data = self.formatData(submitData);
                    if (this.submitFormat === "JSON") {
                        dataContentType = "application/json";
                    }
                    else if (this.submitFormat === "Query") {
                        dataContentType = "application/x-www-form-urlencoded";
                    }
                    var header = {};
                    header["Content-Type"] = dataContentType;
                    if (self.version) {
                        header.version = self.version;
                    }
                    var ioArgs = {
                            "url": this.submitUrl,
                            "handleAs": "json",
                            "putData": data,
                            "headers": header,
                            "load": function(data, ioArgs) {
                                if (self.postSubmit !== undefined) {
                                    self.postSubmit(data, ioArgs);
                                }
                                self.unblock();
                            },
                            "error": function(data) {
                                if (self.onError !== undefined) {
                                    self.onError(data);
                                }
                                self.unblock();
                            }
                    };
                    if (this.submitMethod === "PUT") {
                        baseXhr.put(ioArgs);
                    }
                    else if (this.submitMethod === "POST") {
                        baseXhr.post(ioArgs);
                    }
                }
                else if (this.submitMethod === "GET") {
                    baseXhr.get({
                        url: this.submitUrl,
                        handleAs: "json",
                        load: function(data, ioArgs) {
                            if (self.postSubmit !== undefined) {
                                self.postSubmit(data, ioArgs);
                            }
                            self.unblock();
                        },
                        error: function(data) {
                            if (self.onError !== undefined) {
                                self.onError(data);
                            }
                            self.unblock();
                        }
                    });
                }
            },

            /**
             * The default function to convert the form into data to be submitted.
             */
            getData: function() {
                var self = this;
                var result = {};

                // Iterate through all fields, putting all current values into the result object.
                array.forEach(this.fieldsArray, function(field) {
                    var value = self.getValueByField(field);
                    if (value !== undefined && value !== null) {
                        if (typeof value === "string") {
                            result[field.name] = bidi_stt.stripSpecialCharacters(value);
                        }
                        else {
                            result[field.name] = value;
                        }
                    }
                    if ((field.type === 'HTTP_SELECT') || (field.type === 'HTTP_MULTI_SELECT')) {
                        var httpSelectLabel = field.name + '/HTTP_SELECT_LABEL';
                        result[httpSelectLabel] = self.getHttpSelectedLabelByField(field);
                    }
                });

                if (this.addData) {
                    this.addData(result);
                }

                return result;
            },

            /**
             * Use the appropriate method to format the data for submission.
             */
            formatData: function(data) {
                var result = "";
                if (this.submitFormat === "JSON") {
                    result = JSON.stringify(data);
                }
                else if (this.submitFormat === "Query") {
                    result = ioQuery.objectToQuery(data);
                }
                else {
                    console.error("Unsupported submit format: "+this.submitFormat);
                }
                return result;
            },

            /**
             * Ensure that all required fields have been populated and return any fields which have not.
             */
            validateRequired: function() {
                var self = this;
                var offendingFields = [];

                array.forEach(this.fieldsArray, function(field) {
                    if (field.required) {
                        var value = self.getValueByField(field);

                        if (lang.isString(value)) {
                            value = value.trim();
                        }
                        if (field.type === "Checkbox") {
                            if (value !== "true") {
                                offendingFields.push(field);
                            }
                        }
                        else {
                            if (value === null || value === undefined || value.length === 0) {
                                if (field.label) {
                                    offendingFields.push(i18n("%s is a required field.", field.label));
                                }
                                else {
                                    offendingFields.push(i18n("%s is a required field.", field.name));
                                }
                            }
                        }
                    }

                    if (field.widget && field.widget.getValidationMessages) {
                        array.forEach(field.widget.getValidationMessages(), function(message) {
                            offendingFields.push(message);
                        });
                    }
                });

                return offendingFields;
            },

            /**
             * Clean the value of a field's widget and return it in string format.
             */
            getValueByField: function(field) {
                var value = field.widget.get('value');

                if (field.type === "Multi-Select" || field.type === "MULTI_SELECT"
                    || field.type === "HTTP_MULTI_SELECT" || field.type === "ORDERED_TAG_MULTI_SELECT"
                    || field.type === "OrderedTagMultiSelect" || field.type === "OrderedColoredMultiSelect") {
                    if (value) {
                        value = value.join(",");
                    }
                }

                return value;
            },

            /**
             * @return label(s) for selected from http_select/http_multi_select dropdown
             */
            getHttpSelectedLabelByField: function(field) {
                var httpSelectedLabel = null;
                if (field.type === "HTTP_SELECT") {
                    var item = field.widget.get('item');
                    if (item) {
                        httpSelectedLabel = item.label;
                    }
                }
                else if (field.type === "HTTP_MULTI_SELECT") {
                    if (field.widget.items) {
                        var labels = array.map(field.widget.items, function(item) {
                            return item.label;
                        });
                        httpSelectedLabel = labels.join(",");
                    }
                }
                return httpSelectedLabel;
            },

            /**
             * Default handler for errors coming back during save
             */
            onError: function(response) {
                var alert = new Alert({
                    message: response.responseText
                });
                alert.startup();
            }
        }
    );
});

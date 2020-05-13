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
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/kernel",
        "dojo/aspect",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojox/html/entities",
        "dijit/_WidgetBase",
        "dijit/form/Button",
        "dijit/form/TextBox",
        "js/webext/widgets/Dialog"
        ],
function(
        array,
        declare,
        lang,
        kernel,
        aspect,
        domClass,
        domConstruct,
        entities,
        _WidgetBase,
        Button,
        TextBox,
        Dialog
) {

    /**
     * Should receive an array of messages and an action function as properties.  The message will
     * be displayed in the dialog window.  Any blank messages (Ex: "") will result in a blank line.
     * The action function will be executed if the user clicks "OK". Optionally may receive a flag
     * which determines whether the dialog will take user input.
     */
    return declare(
        [_WidgetBase],
        {
            /**
             * @type Array
             */
            messages: null,

            /**
             * @type Array
             */
            inputFieldArray: null,

            /**
             * @type String
             */
            confirmLabel: null,

            /**
             * @type String
             */
            cancelLabel: null,

            /**
             * @type String
             */
            title: null,

            /**
             *
             */
            hasInput: false,

            /**
             * if true, message contents will not be escaped.  Hazardous messages
             * must be escaped before being passed to this widget.
             */
            forceRawMessages: false,

            /**
             *
             */
            postCreate: function() {
                var self = this;
                self.inherited(arguments);

                self.inputFieldArray = [];

                if (!self.cancelLabel) {
                    self.cancelLabel = i18n("Cancel");
                }
                if (!self.confirmLabel) {
                    self.confirmLabel = i18n("OK");
                }

                // Support passing in a single message.
                if (self.message && self.messages === null) {
                    self.messages = [];
                    self.messages.push(self.message);
                }

                if (!self.title) {
                    self.title = i18n("Confirmation");
                }

                var dialog = new Dialog({
                    title: self.title,
                    closable: true,
                    draggable: true,
                    destroyOnHide: true,
                    execute: function() {
                        self.action();
                        dialog.hide();
                    },
                    extraClasses:["ucd-generic-confirm-alert"]
                });
                domClass.add(dialog.containerNode, "webext-generic-confirm");

                self.own(dialog);
                aspect.after(dialog, "onHide", lang.hitch(self, 'destroy'));
                aspect.after(dialog, "onCancel", lang.hitch(self, 'cancelAction'));

                array.forEach(self.messages, function(message) {
                    // if we are not allowing raw message content, escape the message
                    if(!self.forceRawMessages) {
                        message = entities.encode(message);
                    }
                    else {
                        kernel.deprecated("forceRawMessages is intended to support legacy code, but is discouraged, and may not be supported in the future.");
                    }

                    // Empty messages indicate a blank line.  We give &nbsp; to keep the div from collapsing.
                    message = message || "&nbsp;";

                    domConstruct.create("div", {
                        className: "confirm-message",
                        innerHTML: message
                    }, dialog.containerNode);

                    if (self.hasInput) {
                        var inputField = new TextBox({});
                        dialog.own(inputField);
                        inputField.placeAt(dialog.containerNode);
                        self.inputFieldArray.push(inputField);
                    }

                    domConstruct.create("div", {
                        className: "clear"
                    }, dialog.containerNode);
                });

                var buttonContainer = domConstruct.create("div");
                if (self.hasInput || self.showUnderField || self.showUnderField === undefined) {
                    buttonContainer.className = "underField";
                }

                var acceptButton = new Button({
                    label: self.confirmLabel,
                    showTitle: false,
                    onClick: function() {
                        dialog.execute();
                    }
                });
                dialog.own(acceptButton);
                acceptButton.placeAt(buttonContainer);
                domClass.add(acceptButton.domNode, "idxButtonSpecial");

                var cancelButton = new Button({
                    label: self.cancelLabel,
                    showTitle: false,
                    onClick: function() {
                        dialog.onCancel();
                    }
                });
                dialog.own(cancelButton);
                cancelButton.placeAt(buttonContainer);

                dialog.containerNode.appendChild(buttonContainer);

                dialog.show();
            },

            /**
             * Returns an array of all user input.
             */
            getInput: function() {
                var inputValuesArray = [];

                array.forEach(this.inputFieldArray, function(element) {
                    inputValuesArray.push(element.attr("value"));
                });

                //Clears the input field array.
                //Temporary solution to persistent widget properties.
                //Use the getInput function only once per dialog.
                this.inputFieldArray = [];

                return inputValuesArray;
            },

            /**
             * Stub method for when the GenericConfirm is accepted
             */
            action: function() {
            },

            /**
             * Stub method for when the GenericConfirm is cancelled
             */
            cancelAction: function() {
            }
        }
    );
});

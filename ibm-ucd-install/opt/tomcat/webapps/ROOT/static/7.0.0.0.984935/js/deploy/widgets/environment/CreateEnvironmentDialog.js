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
define(["dojo/_base/declare",
    "js/webext/widgets/Dialog",
    "dojo/dom-construct",
    "dojo/on",
    "dojo/dom-style",
    "dojo/dom",
    "dojo/json",
    "dijit/focus"],

function (declare, 
          Dialog,
          domConstruct,
          on,
          domStyle,
          dom,
          JSON,
          focusUtil) {

    return declare([Dialog], {
        templateString: '<div class="dijitDialog" role="dialog" aria-labelledby="${id}_title">' +
                        '    <div data-dojo-attach-point="titleBar" class="dijitDialogTitleBar">' + 
                        '    <span data-dojo-attach-point="titleNode" class="dijitDialogTitle" id="${id}_title"></span>' + 
                        '    <span data-dojo-attach-point="wizardIconNode1"  style="display:none;">' + 
                        '        <span data-dojo-attach-point="wizardIconText1" class="iconWizardPage1" ></span>' + 
                        '    </span>' + 
                        '    <span data-dojo-attach-point="wizardIconNode2"  style="display:none;">' + 
                        '        <span data-dojo-attach-point="wizardIconText2" class="iconWizardPage2" ></span>' + 
                        '    </span>' + 
                        '    <span data-dojo-attach-point="closeButtonNode" class="dijitDialogCloseIcon" data-dojo-attach-event="ondijitclick: onCancel" title="${buttonCancel}" role="button" tabIndex="-1" style="display:inline;">' + 
                        '        <span data-dojo-attach-point="closeText" class="icon-Icon_close__ui-05" title="${buttonCancel}"></span>' + 
                        '    </span>' + 
                        '    </div>' + 
                        '    <div data-dojo-attach-point="errorContainer" class="environment-error-container" style="position: relative; display: none;">' + 
                        '      <div class="inlineBlock vAlignMiddle minusMargin5Left iconError"></div>' + 
                        '      <div data-dojo-attach-point="errorContainerNode" class="inlineBlock vAlignMiddle margin5Left"></div>' + 
                        '      <div data-dojo-attach-point="errorContainerDetailNode" class="block vAlignMiddle environment-error-detail" style="display :none;"></div>' + 
                        '    </div>' + 
                        '    <div data-dojo-attach-point="containerContainer" style="overflow-y: auto;overflow-x: hidden;">' + 
                        '       <div data-dojo-attach-point="containerNode" class="dijitDialogPaneContent"></div>' + 
                        '    </div>' + 
                        '</div>',

        showError: function (columnForm, blueprint, config, errors) {
            var self = this;
            var errornum = "";
            this.errorContainerDetailNode.innerHTML = "";
            if (errors && Array.isArray(errors)) {
                errornum = errors.length;

                dojo.forEach(errors, function (error) {
                    if (error.errorMessage) {
                        var source = "";
                        if (error.source === "template") {
                            source = blueprint + ": ";
                        } else if (error.source === "configuration") {
                            source = config + ": ";
                        }
                        var errorMessage = source + error.errorMessage;
                        var errorDiv = domConstruct.create("div", {}, self.errorContainerDetailNode);
                        var errorAnchor = domConstruct.create("a", {
                            "innerHTML": errorMessage
                        }, errorDiv);
                        if (error.source === "template" || error.source === "configuration") {
                            on(errorAnchor, "click", function () {
                                self.focusField(columnForm, error);
                            });
                        } else {
                            on(errorAnchor, "click", function () {
                                self.focusField(columnForm, error);
                            });
                        }
                    }
                });
            } else {
                errornum = "1";
                var source = blueprint + ": ";
                var errorMessage = source + errors;
                var errorDiv = domConstruct.create("div", {}, self.errorContainerDetailNode);
                domConstruct.create("a", {
                    "innerHTML": errorMessage
                }, errorDiv);

            }

            domStyle.set(self.errorContainer, "display", "block");
            var errorTitleMessage;
            if (errornum === "1") {
                errorTitleMessage = i18n("%s Error deploying blueprint \"%s\"", errornum, blueprint);
            } else {
                errorTitleMessage = i18n("%s Errors deploying blueprint \"%s\"", errornum, blueprint);
            }
            var errorTitle = domConstruct.create("a", {
                "innerHTML": util.escape(errorTitleMessage)
            }, this.errorContainerNode);

            on(errorTitle, "click", function () {
                if (domStyle.get(self.errorContainerDetailNode, "display") === "none") {
                    domStyle.set(self.errorContainerDetailNode, "display", "block");
                } else {
                    domStyle.set(self.errorContainerDetailNode, "display", "none");
                }
            });

        },

        hideError: function () { 
            domConstruct.empty(this.errorContainerNode);
            domConstruct.empty(this.errorContainerDetailNode); 
            domStyle.set(this.errorContainer, "display", "none");
        },

        showFieldErrors: function (columnForm, errors) {
            var self = this;
            dojo.forEach(errors, function (error) {
                var errorFieldName = null;
                if (error.object.parameters) {
                    var key;
                    for (key in error.object.parameters) {
                        if (error.object.parameters.hasOwnProperty(key)) {
                            errorFieldName = key;
                            break;
                        }
                    }
                }
            });
        },

        getField: function (columnForm, fieldName) {
            var ret = null;
            dojo.forEach(columnForm.fieldsArray, function (field) {
                if (fieldName && (field.name === fieldName || field.name === "parameter/" + fieldName)) {
                    ret = field;
                } else if (fieldName === "environmentName" && field.name === "name") {
                    ret = field;
                }
            });
            return ret;
        },

        focusField: function (columnForm, error) {
            if (error.object.parameters) {
                var key;
                for (key in error.object.parameters) {
                    if (error.object.parameters.hasOwnProperty(key)) {
                        var field = this.getField(columnForm, key);
                        if (field && field.widget) {
                            focusUtil.focus(field.widget.domNode);
                        }
                        break;
                    }
                }
            }
        }
    });
});

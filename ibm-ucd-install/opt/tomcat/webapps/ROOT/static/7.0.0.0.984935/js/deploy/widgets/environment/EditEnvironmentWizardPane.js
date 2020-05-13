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
    "dojox/widget/WizardPane",
    "deploy/widgets/environment/EditEnvironment",
    "js/webext/widgets/Dialog",
    "dojo/dom-construct",
    "dijit/form/Button",
    "dojo/dom-class",
    "js/webext/widgets/Alert",
    "dojo/dom-style"],

function (declare,
          WizardPane,
          EditEnvironment,
          Dialog,
          domConstruct,
          Button,
          domClass,
          Alert,
          domStyle) {

    return declare([WizardPane], {

        postCreate: function () {
            this.inherited(arguments);

            var self = this;
            this.page = new EditEnvironment({
                application: this.application,
                dialog: this.dialog,
                callback: function () {
                    self.dialog.hide();
                    self.dialog.destroy();

                    if (self.application) {
                        navBar.setHash("#application/" + self.application.id, false, true);
                    }
                }
            });
            this.attachDoneFunction();
            this.addChild(this.page, 0);
        },
        _doneFunction: function () {
            this.page.submitForm();
        },
        attachDoneFunction: function () {
            this.doneFunction = this._doneFunction;
        },

        detachDoneFunction: function () {
            this.doneFunction = null;
        },

        getData: function () {
            return this.page.form.getData();
        },

        _checkPass: function () {
            var validationMessages = this.page.form.validateRequired();
            if (validationMessages.length > 0) {
                validationMessages.unshift(i18n("Please correct the following errors before submitting this form:"));
                new Alert({
                    messages: validationMessages
                }).startup();
                return false;
            }
            return true;
        },

        _onShow: function () {
            this.inherited(arguments);
            this.refreshWizardIcons();

        },

        refreshWizardIcons: function () {
            if (this.isLastChild) {
                domStyle.set(this.dialog.wizardIconNode1, "display", "none");
                domStyle.set(this.dialog.wizardIconNode2, "display", "none");
            } else {
                domStyle.set(this.dialog.wizardIconNode1, "display", "inline");
                domStyle.set(this.dialog.wizardIconNode2, "display", "none");
            }
        }

    });
});

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
    "dojo/_base/lang",
    "dojo/dom-style",
    "dojo/dom-attr",
    "dijit/_Widget",
    "dijit/_TemplatedMixin",
    "deploy/widgets/wizard/_WizardWatcherMixin"
],

function (declare,
          lang,
          domStyle,
          domAttr,
          _Widget,
          _TemplatedMixin,
          _WizardWatcherMixin) {

    /**
     * A wizard visualization suitable for simple wizards.  Intended for use in a dialog header
     * by application templates, but should be suitable for elsewhere. YMMV.
     *
     * The following attributes must be supplied:
     *  wizard / Wizard Object      The wizard.
     */
    return declare([_Widget, _TemplatedMixin, _WizardWatcherMixin], {
        templateString: '<img data-dojo-attach-point="wizardProgressImage" class="wizardProgressImage"></img>',

        postCreate: function() {
            this.inherited(arguments);

            this._addWizardChangeHandler(lang.hitch(this,this.render));
        },

        /**
         * An idempotent render function.
         */
        render: function() {
            var steps = this.wizard.getChildren();
            var currentStep = this.wizard.selectedChildWidget;
            var numSteps = steps.length;
            var currentStepNumber = steps.indexOf(currentStep) + 1;

            domStyle.set(this.wizardProgressImage, "display", numSteps > 1 ? "" : "none");
            domAttr.set(this.wizardProgressImage, "src", bootstrap.contentUrl + "images/wizard/WizardProgress_" + currentStepNumber + ".png");
        }
    });
});

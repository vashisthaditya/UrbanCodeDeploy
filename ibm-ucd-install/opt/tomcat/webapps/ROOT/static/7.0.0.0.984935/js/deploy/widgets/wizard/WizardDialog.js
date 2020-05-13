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
    "dojo/dom-class",
    "js/webext/widgets/Dialog",
    "deploy/widgets/wizard/_WizardWatcherMixin"],

function (declare,
          lang,
          domClass,
          Dialog,
          _WizardWatcherMixin) {

    /**
     * An extension of webext Dialog aiming to accommodate all Dialog-Wizard stories.  As a
     * result, there's very little here.  This class doesn't even presume to know where to put the
     * wizard itself, though it will presume to know where the progress visualization should go.
     *
     * The following attributes must be supplied:
     *  wizard / Wizard Object      The wizard.
     *
     * The following attributes may be supplied:
     *  progressVisualization       The visualization widget next to the title in the dialog.
     *       / Widget or Function   Optional. If a constructor, assumed to take
     *                              { wizard: aWizardObject } to produce a widget.
     *
     *  resizeOnWizardChange        Resize the dialog on each wizard change. Default true.
     */
    return declare([Dialog, _WizardWatcherMixin], {
        resizeOnWizardChange: true,

        postCreate: function() {
            this.inherited(arguments);

            domClass.add(this.domNode, "webext-wizardDialog");

            if (this.resizeOnWizardChange !== false) {
                this.resizeOnWizardChange = true;
            }

            // Construct visualization if appropriate.
            if (this.progressVisualization.call !== undefined) {
                this.progressVisualization = new this.progressVisualization({
                    wizard: this.wizard
                });
            }

            if (this.progressVisualization) {
                this.progressVisualization.placeAt(this.titleBar);
            }

            if (this.resizeOnWizardChange) {
                this._wizardWatcherCallbacks.push(lang.hitch(this, this.resize));
            }

            // Inform the wizard that it's in a resizable container
            this.wizard.resizeDom = this.domNode;

            this.wizard.placeAt(this.containerNode);
        },

        /**
         * Shows the dialog.  Just make sure the progress vis (if any) is rendered beforehand.
         */
        show: function() {
            if (this.progressVisualization !== undefined) {
                this.progressVisualization.render();
            }
            this.inherited(arguments);
        }
    });
});

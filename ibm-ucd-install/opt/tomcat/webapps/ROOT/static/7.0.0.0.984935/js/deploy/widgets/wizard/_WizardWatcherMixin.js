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
    "dojo/topic"],

function (declare,
          topic) {

    /**
     * A mixin for watching wizards.  Tells you if anything around the wizard panes or the users
     * place in the wizard changes.  Useful if you're writing a widget that shows how far along a
     * user is in a wizard.
     *
     * The following attributes may be supplied:
     *  wizard / Wizard Object      The wizard.
     *
     * We define the following methods for inheriting widgets:
     *  _watchWizard(wizard)        Sets the wizard to watch.  Identical to providing
     *       / Wizard               the wizard at init-time.
     *
     *  _addWizardChangeHandler(f)  Adds a function to call when the wizard changes.
     *       / Widget or Function
     */
    return declare(null, {
        postCreate: function() {
            this.inherited(arguments);
            this._wizardWatcherCallbacks = [];
            if (this.wizard) {
                this._watchWizard(this.wizard);
            }
        },

        _watchWizard: function(wizard) {
            if (this._watchedWizard !== undefined) {
                throw "Not implemented: Wizard watchers can currently only watch one wizard.";
            }
            this._watchedWizard = wizard;

            this._subscribeToWizardTopic("addChild");
            this._subscribeToWizardTopic("removeChild");
            this._subscribeToWizardTopic("selectChild");
        },

        /**
         * Internal method for subscribing to the relevant topic.  The actual callback occurs in
         * the function defined in here, too.
         */
        _subscribeToWizardTopic: function(topicSuffix) {
            var self = this;

            /**
             * The actual topic subscription handler.  Calls back all callbacks we've registered.
             */
            function handler(msg) {
                self._wizardWatcherCallbacks.forEach(function(callback) {
                    callback(msg);  // msg coming from StackContainer.js in this case.
                });
            }

            topic.subscribe(this.wizard.id + "-" + topicSuffix, handler);
        },

        _addWizardChangeHandler: function(callback) {
            this._wizardWatcherCallbacks.push(callback);
        }
    });
});

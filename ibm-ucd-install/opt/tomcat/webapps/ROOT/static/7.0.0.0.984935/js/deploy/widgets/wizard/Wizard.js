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
    "dojo/dom-class",
    "dojox/widget/Wizard"
],

function (declare,
        domClass,
        Wizard) {

    /**
     * A minimally-tweaked UrbanCode version of dojox's wizard.
     *
     * Public Methods:
     *      highlightButton(buttonDomNode, classname)
     *          Highlights a button (by applying a class name), and un-highlights all other
     *          buttons. All button highlighting must be done via this method -- Or else!
     */

    return declare([Wizard], {
        // These are mostly like the dojox defaults, but with i18n.
        doneButtonLabel: i18n("Create"),
        nextButtonLabel: i18n("Next"),
        previousButtonLabel: i18n("Previous"),
        cancelButtonLabel: i18n("Cancel"),

        postCreate: function() {
            this.inherited(arguments);
            this._highlightButtons = [];
        },

        /**
         * We don't like the default wizard button display logic, so we complete / fight with it.
         */
        _checkButtons: function() {
            this.inherited(arguments);

            // Dojox version doesn't check cancelFunction all the time.
            if (this.cancelFunction){
                this._buttonOn(this.cancelButton);
            } else {
                this._buttonOff(this.cancelButton);
            }

            // We're jousting with dojox Wizard.js here to display all buttons all the time.
            // XXX: Way too tightly integrated with dojox/Wizard.js
            if (this.doneButton.domNode.style.display === "") {
                this._buttonOn(this.doneButton);
            }

            if (!this.hideDisabled) {
                if (this.doneButton.domNode.style.display === "none") {
                    this._buttonOff(this.doneButton);
                }
                if (this.nextButton.domNode.style.display === "none") {
                    this._buttonOff(this.nextButton);
                }
            }
        },

        _buttonOff: function(button) {
            button.set("disabled", true);
            if (this.hideDisabled) {
                button.domNode.style.display = "none";
            } else {
                button.domNode.style.display = "";
            }
        },

        _buttonOn: function(button) {
            button.set("disabled", false);
            button.domNode.style.display = "";
        },

        /**
         * Highlights a button (and unhighlights others)
         */
        highlightButton: function(buttonToHighlight, className) {
            this._highlightButtons.filter(function(button) {
                return domClass.contains(button.domNode, className);
            })
            .forEach(function(button){
                domClass.remove(button.domNode, className);
            });

            if (buttonToHighlight) {
                domClass.add(buttonToHighlight.domNode, className);
                if (this._highlightButtons.indexOf(buttonToHighlight) === -1) {
                    this._highlightButtons.push(buttonToHighlight);
                }
            }
        }
    });
});

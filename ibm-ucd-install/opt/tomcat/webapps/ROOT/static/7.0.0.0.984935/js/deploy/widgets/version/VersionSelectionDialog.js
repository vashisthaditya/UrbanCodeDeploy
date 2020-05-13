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
        "dijit/form/Button",
        "dojo/_base/declare",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/on",
        "dojo/aspect",
        "js/webext/widgets/Dialog",
        "deploy/widgets/application/VersionSelection"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        declare,
        domConstruct,
        domClass,
        on,
        aspect,
        Dialog,
        VersionSelection
) {
    /**
     * A widget to select component versions for an application process request.
     *
     * Supported properties:
     *  applicationProcess /                A predefined application process
     *  environment / Object                A predefined environment to select
     *  componentVersionsMap / Object       A map created to keep track of the versions selected in the form:
     *                                      { "<component 1 id>": ["<version 1 id>", "<version 2 id>", ...],
     *                                      "<component 2 id>": [...], ...}
     */
    return declare('deploy.widgets.version.VersionSelectionDialog',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="versionSelector">'+
            '  <div data-dojo-attach-point="textAttach">' +
            '    <div data-dojo-attach-point="selectedAttach" class="inlineBlock"></div> ' +
            '    (<div data-dojo-attach-point="linkAttach" class="linkPointer inlineBlock"></div>)' +
            '  </div>'+
            '  <div data-dojo-attach-point="dialogAttach"></div>' +
            '</div>',

        postCreate: function() {
            var self = this;

            this.selectedAttach.innerHTML = i18n("%s selected", 0);
            //only create the dialog once per opening of run process request
            this.linkAttach.innerHTML = i18n("Choose Versions");
            on(this.linkAttach, "click", function(e) {
                if (self.versionDialog) {
                    self.showDialog();
                }
                else {
                    self.createVersionDialog();
                }
            });
        },

        //creates the dialog and calls all other functions to populate it
        createVersionDialog: function () {
            var self = this;

            this.versionDialog = new Dialog({
                title: i18n("Component Versions"),
                closable: true,
                draggable: true
            });
            domClass.add(this.versionDialog.domNode, "version-selection-dialog");

            this.dialogDiv = domConstruct.create("div",{}, this.versionDialog.containerNode);
            var buttonDiv = domConstruct.create("div", {
                "class": "underField",
                style: "margin-top: 15px;"
            });

            this.versionSelection = new VersionSelection({
                applicationProcess: self.applicationProcess,
                environment: self.environment
            });

            aspect.after(this.versionSelection, "_changeCount", function() {
                self.selectedAttach.innerHTML = i18n("%s selected",self.versionSelection.getCount());
            });

            //ok button just hides the dialog and keeps all the data
            var okButton = new Button({
                label: i18n("OK"),
                onClick: function(e) {
                    self.versionDialog.hide();
                }
            });
            domClass.add(okButton.domNode, "idxButtonSpecial");
            okButton.placeAt(buttonDiv);

            this.versionSelection.placeAt(this.dialogDiv);
            domConstruct.place(buttonDiv, this.dialogDiv);
            //add a cancel button that destroys the dialog and resets the selected versions to 0

            this.showDialog();
        },

        showDialog: function() {
            this.versionDialog.show();
        },

        _getValueAttr: function() {
            var self = this;
            var result = "";
            if (self.versionSelection) {
                result = self.versionSelection.get('value');
            }
            return result;
        },

        destroy: function() {
            if(this.versionDialog) {
                this.versionDialog.destroyRecursive();
            }
            this.inherited(arguments);
        }
    });
});

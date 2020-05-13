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
        "deploy/widgets/environment/EditLandscaperBlueprintProperties"
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
        EditLandscaperBlueprintProperties
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
    return declare('deploy.widgets.patterns.PatternPropertySelectionDialog',  [_Widget, _TemplatedMixin], {
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

            //only create the dialog once per opening of run process request
            this.linkAttach.innerHTML = i18n("Set Properties");

            this.propertiesDialog = new Dialog({
                title: i18n("Blueprint Properties"),
                closable: true,
                draggable: true
            });
            domClass.add(this.propertiesDialog.domNode, "property-selection-dialog");

            this.dialogDiv = domConstruct.create("div",{}, this.propertiesDialog.containerNode);
            var buttonDiv = domConstruct.create("div", {
                "class": "underField",
                style: "margin-top: 15px;"
            });

            // user is not required to click set properties. User can directly click save
            this.propertySelection = new EditLandscaperBlueprintProperties({
                blueprint: self.applicationProcess.blueprint,
                environment: self.environment,
                dialog: self.propertiesDialog
            });

            //ok button just hides the dialog and keeps all the data
            var okButton = new Button({
                label: i18n("OK"),
                onClick: function(e) {
                    self.propertiesDialog.hide();
                }
            });
            domClass.add(okButton.domNode, "idxButtonSpecial");
            okButton.placeAt(buttonDiv);

            this.propertySelection.placeAt(this.dialogDiv);
            domConstruct.place(buttonDiv, this.dialogDiv);
            on(this.linkAttach, "click", function(e) {
                    self.showDialog();
            });
        },

        showDialog: function() {
            this.propertiesDialog.show();
        },

        _getValueAttr: function() {
           if (this.propertySelection) {
               return this.propertySelection.getData();
           }
           return null;
        },

        validate: function(){
            var validationMessages = [];
            if (this.propertySelection){
                validationMessages = this.propertySelection.validate();
            }
            return validationMessages;
        },

        validateCloudProperties: function(data) {
            return this.propertySelection.validateCloudProperties(data);
        },

        destroy: function() {
            if(this.propertiesDialog) {
                this.propertiesDialog.destroyRecursive();
            }
            this.inherited(arguments);
        }
    });
});

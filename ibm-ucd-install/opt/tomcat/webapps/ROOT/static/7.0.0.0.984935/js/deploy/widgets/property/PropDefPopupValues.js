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
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/dom-construct",
        "dojo/on",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Dialog"
        ],
function(
        _TemplatedMixin,
        _Widget,
        array,
        declare,
        domConstruct,
        on,
        ColumnForm,
        Dialog
) {
    /**
     * A popup form for showing values for a PropSheetDef and indicating whether the given
     * values comply with property requirements
     * 
     * Takes properties:
     *  propDefs / Array                : An array of PropDefs to use for this
     *  label / String                  : The label to show in the popup link text
     */
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="propDefPopupValues">'+
            '  <div data-dojo-attach-point="displayAttach"></div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            this.dialog = new Dialog({
                title: this.popupLabel
            });
            
            this.form = new ColumnForm({
                onSubmit: function(data) {
                    self.form.unblock();
                    self.data = data;
                    self.isValid = true;
                    self.showLink();
                    self.dialog.hide();
                },
                onCancel: function() {
                    self.form.unblock();
                    self.dialog.hide();
                }
            });
            this.form.placeAt(this.dialog.containerNode);

            self.isValid = true;
            var initialData = {};
            array.forEach(this.propDefs, function(propDef) {
                self.displayPropDef(propDef);
                initialData[propDef.name] = propDef.value;
            });
            
            if (self.isValid) {
                self.data = initialData;
            }
            
            self.showLink();
        },
        
        displayPropDef: function(propDef) {
            var self = this;
            
            propDef.label = propDef.name;
            self.form.addField(propDef);
            if (propDef.required && !propDef.value) {
                self.isValid = false;
            }
        },
        
        showLink: function() {
            var self = this;
            
            domConstruct.empty(this.displayAttach);
            
            if (this.isValid) {
                domConstruct.create("div", {
                    "class": "inlineBlock general-icon completeIcon"
                }, this.displayAttach);
            }
            else {
                domConstruct.create("div", {
                    "class": "inlineBlock general-icon incompleteIcon"
                }, this.displayAttach);
            }
            
            var popupLink = domConstruct.create("a", {
                innerHTML: this.popupLabel,
                "class": "linkPointer"
            }, this.displayAttach);
            on(popupLink, "click", function() {
                self.dialog.show();
            });
        },
        
        _getValueAttr: function() {
            return this.data;
        },
        
        getValidationMessages: function() {
            var result = [];
            if (!this.data) {
                result.push(i18n("Missing property values for %s", this.popupLabel));
            }
            return result;
        }
    });
});

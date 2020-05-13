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
        "dojo/_base/lang",
        "dojo/dom-construct",
        "dojo/on",
        "js/webext/widgets/ColumnForm"
        ],
function(
        _TemplatedMixin,
        _Widget,
        array,
        declare,
        lang,
        domConstruct,
        on,
        ColumnForm
) {
    return declare('deploy.widgets.environment.EnvironmentComponentProperty',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="environmentComponentProperty">'+
            '  <div data-dojo-attach-point="labelAttach"></div>'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '  <div data-dojo-attach-point="expandAttach"></div>'+
            '</div>',

        // Formatting specification for FieldList to pick up on
        doubleWidth: true,
        tooltipIcon: true,
        
        /**
         * 
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            this.form = new ColumnForm({
                showButtons: false,
                readOnly: this.readOnly
            });
            
            if (this.isCollapsible() && this.valuesAreEqual()) {
                this.collapse();
            }
            else {
                this.expand();
            }
            
            var propertyLabel = self.getLabel();
            var labelDiv = domConstruct.create("div", {
                "innerHTML": propertyLabel.escape(),
                "style": {
                    "fontSize": "14px",
                    "class": "actionsLink"
                }
            });
            this.labelAttach.appendChild(labelDiv);

            this.form.placeAt(this.formAttach);

            if (self.isCollapsible() && !self.readOnly) {
                var toggleLinkText = i18n("Set a Single Value");
                if (self.collapsed) {
                    toggleLinkText = i18n("Split Values Per Component");
                }

                var toggleLink = domConstruct.create("a", {
                    "innerHTML": toggleLinkText,
                    "class": "linkPointer",
                    "style": {
                        "marginLeft": "167px"
                    }
                }, this.expandAttach);
                on(toggleLink, "click", function() {
                    if (self.collapsed) {
                        toggleLink.innerHTML = i18n("Set a Single Value");
                        self.expand();
                    }
                    else {
                        toggleLink.innerHTML = i18n("Split Values Per Component");
                        self.collapse();
                    }
                });
            }
        },
        
        expand: function() {
            var self = this;
            
            this.collapsed = false;
            
            array.forEach(this.fieldNames, function(fieldName) {
                self.form.removeField(fieldName);
            });
            this.fieldNames = [];

            array.forEach(this.propertyData.components, function(componentData) {
                var propValue = componentData.propValue;
                var propDef = componentData.propDef;
                
                var value = propDef.value;
                var label = propDef.defaultLabel;
                if (propValue) {
                    value = propValue.value;
                    label = propValue.label;
                }
                
                var propDefCopy = lang.clone(propDef);
                propDefCopy.value = value;
                propDefCopy.defaultLabel = label;
                propDefCopy.label = componentData.name;
                propDefCopy.name = componentData.name+"/"+propDef.name;
                propDefCopy.tooltipIcon = self.tooltipIcon;
                if (propDefCopy.pattern) {
                    propDefCopy.description += i18n(" Required Pattern: %s", propDefCopy.pattern);
                }
                self.fieldNames.push(propDefCopy.name);
                self.form.addField(propDefCopy);
            });
        },
        
        collapse: function() {
            var self = this;
            
            this.collapsed = true;
            
            array.forEach(this.fieldNames, function(fieldName) {
                self.form.removeField(fieldName);
            });
            this.fieldNames = [];

            var componentData = this.propertyData.components[0];
            var propDef = componentData.propDef;
            var propValue = componentData.propValue;

            var value = propDef.value;
            if (propValue) {
                value = propValue.value;
            }

            var propDefCopy = lang.clone(propDef);
            propDefCopy.value = value;
            propDefCopy.label = i18n("All Components");
            propDefCopy.name = propDef.name;
            propDefCopy.description = this.getDescription();
            propDefCopy.required = this.isRequired();
            propDefCopy.tooltipIcon = self.tooltipIcon;
            
            this.fieldNames.push(propDefCopy.name);
            this.form.addField(propDefCopy);
        },
        
        isCollapsible: function() {
            var result = false;
            var propertyData = this.propertyData;
            
            var type;

            var varianceFound = false;
            
            if (propertyData.components.length > 1) {
                array.forEach(propertyData.components, function(componentData) {
                    var propDef = componentData.propDef;
                    var propValue = componentData.propValue;
                    
                    if (!type) {
                        type = propDef.type;
                    }
                    else if (propDef.type !== type) {
                        varianceFound = true;
                    }
                });
                
                if (!varianceFound && type !== "SECURE") {
                    result = true;
                }
            }
            
            return result;
        },
        
        valuesAreEqual: function() {
            var result = false;
            var propertyData = this.propertyData;
            
            var value;
            var varianceFound = false;
            
            array.forEach(propertyData.components, function(componentData) {
                var propDef = componentData.propDef;
                var propValue = componentData.propValue;
                
                var storedValue = "";
                if (propValue) {
                    storedValue = propValue.value;
                }
                
                if (value === undefined) {
                    // Set the value to the first property value found
                    value = storedValue;
                }
                else if (storedValue !== value) {
                    varianceFound = true;
                }
            });
            
            if (!varianceFound) {
                result = true;
            }
            
            return result;
        },
        
        isRequired: function() {
            var propertyData = this.propertyData;
            var required = false;
            
            array.forEach(propertyData.components, function(componentData) {
                var propDef = componentData.propDef;
                
                required = required || propDef.required;
            });
            
            return required;
        },
        
        getDescription: function() {
            var propertyData = this.propertyData;
            var result;
            
            array.forEach(propertyData.components, function(componentData) {
                var propDef = componentData.propDef;
                
                if (!result) {
                    result = propDef.description;
                }
            });
            
            return result;
        },
        
        getLabel: function() {
            var propertyData = this.propertyData;
            var result;
            
            array.forEach(propertyData.components, function(componentData) {
                var propDef = componentData.propDef;
                
                if (!result || propDef.label !== propDef.name) {
                    result = propDef.label;
                }
            });
            
            return result;
        },
        
        _getValueAttr: function() {
            return this.form.getData();
        },
        
        validatePattern: function(result) {
            var self = this;
            var propertyData = this.propertyData;
            array.forEach(propertyData.components, function(componentData) {
                var propertyDef = componentData.propDef;
                var propertyValue = self.form.getValue(componentData.name+"/"+propertyDef.name);
                var propertyDefPattern = propertyDef.pattern;
                if (propertyDefPattern && propertyValue) {
                     if (!self.checkPattern(propertyValue,propertyDefPattern)) {
                         result.push(i18n("Value for property %s does not follow the required pattern",propertyDef.name+"/"+componentData.name));
                     }
                }
             });
            return result;
         },
         
         checkPattern: function(value, pattern) {
             var regex = new RegExp(pattern);
             var result = true;
             if (!regex.exec(value)) {
                 result = false;
             }
            return result;
         }
    });
});
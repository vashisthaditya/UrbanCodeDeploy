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

/*global define, i18n */
define([
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Alert",
        "dojo/_base/lang",
        "dijit/_Widget",
        "dijit/_TemplatedMixin",
        "dijit/form/FilteringSelect",
        "dojox/data/JsonRestStore",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/DomNode",
        "dojo/_base/declare",
        "dojo/_base/array",
        "deploy/widgets/resource/ResourceSelector"
        ],
 function(
         ColumnForm,
         Alert,
         lang,
         _Widget,
         _TemplatedMixin,
         FilteringSelect,
         JsonRestStore,
         Dialog,
         DomNode,
         declare,
         array,
         ResourceSelector
 ) {
   
/**
 * A widget to request application process execution. This handles scheduling as well.
 * 
 * Supported properties:
 *  application / Object                The application to request an environment for
 */
    return declare(
        [_Widget, _TemplatedMixin],
        {
            templateString:
                '<div class="runProcess">'+
                '  <div data-dojo-attach-point="formAttach" style="max-height: 500px; overflow: auto;"></div>'+
                '</div>',

            postCreate: function() {
                this.inherited(arguments);
                var self = this;
                
                // Insert logic to allow the UI to handle this properly
                array.forEach(self.process.propDefs, function(propDef) {
                    if (!propDef.required) {
                        propDef.allowNone = true;
                    }
                });

                this.form = new ColumnForm({
                    submitUrl: bootstrap.restUrl+"process/request",
                    submitMethod: "POST",
                    cancelLabel: self.callback ? i18n("Cancel") : null,
                    addData: function(data) {
                        
                        // Put all standard inputs into a properties object to ensure that they cannot
                        // override the system fields.
                        data.properties = lang.clone(data);
                        
                        // Insert all system fields here.
                        data.processId = self.process.id;
                    },
                    postSubmit: function(data) {
                        if (self.callback !== undefined) {
                            self.callback();
                        }
                        navBar.setHash("#processRequest/"+data.id);
                    },
                    onCancel: function() {
                        if (self.callback !== undefined) {
                            self.callback(); 
                        }
                    },
                    onError: function(error) {
                        if (self.callback !== undefined) {
                            self.callback();
                        }
    
                        var errorAlert = new Alert({
                            title: i18n("Error"),
                            messages: [i18n("An error has occurred while submitting the process request:"),
                                       "",
                                       util.escape(error.responseText)]
                        });
                    },
                    saveLabel: i18n("Submit"),
                    fields: self.process.propDefs
                });
                
                var contextType = util.getNamedPropertyValue(self.process.properties, "contextType");
                if (contextType === "Resource") {
                    var resourceSelect = new ResourceSelector({
                        url: bootstrap.restUrl+"resource/resource/tree",
                        value: self.process.defaultResourceId,
                        isSelectable: function(resource) {
                            return resource.hasAgent;
                        }
                    });
                    self.form.addField({
                        name: "resource",
                        label: i18n("Resource"),
                        widget: resourceSelect,
                        required: true
                    });

                    self.showProcessProperties();
                }
                
                this.form.placeAt(this.formAttach);
            },
            showProcessProperties: function() {
                var self = this;
                  
                if (this.process !== undefined) {

                    array.forEach(self.process.unfilledProperties, function(property) {
                       var propertyName = property.name;
                          
                       if (property.label === "") {
                           property.label = property.name;
                       }
                       
                        self.form.addField({
                            name: propertyName,
                            type: property.type,
                            description: property.description,
                            required: property.required,
                            value: property.value,
                            label: property.label,
                            allowedValues: property.allowedValues
                        }, "_propertiesInsert");
                    });
                }
            }
        }
    );
});

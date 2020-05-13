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
        "dojo/_base/declare",
        "js/webext/widgets/ColumnForm"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        ColumnForm
) {
    return declare('deploy.widgets.property.EditPropValue',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="editPropValue">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',
        propSheetVersion: null,

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            this.existingValues = {};
            if (this.propValue) {
                this.existingValues.name = this.propValue.name;
                this.existingValues.value = this.propValue.value;
                this.existingValues.description = this.propValue.description;
                this.existingValues.secure = this.propValue.secure;
            }

            var submitUrl;
            if (this.propSheetPath) {
                submitUrl = bootstrap.baseUrl+"property/propSheet/"+util.vc.encodeVersionedPath(this.propSheetPath)+".-1/propValues";
                if (this.propValue) {
                    submitUrl += "/"+encodeURIComponent(this.propValue.name);
                }
            }
            else if (this.saveUrl) {
                submitUrl = this.saveUrl;
            }
            else {
                submitUrl = bootstrap.baseUrl+"property/propSheet/"+this.propSheetId+"/propValues";
                if (this.propValue) {
                    submitUrl += "/"+encodeURIComponent(this.propValue.name);
                }
            }

            this.form = new ColumnForm({
                submitUrl: submitUrl,
                version: self.propSheetVersion,
                addData: function(data) {
                    data.propSheetId = self.propSheetId;
                    if (self.propValue) {
                        data.existingId = self.propValue.id;
                    }
                    
                    if (data.value === undefined) {
                        data.value = "";
                    }
                    
                    self.addData(data);
                },
                onError: function(response) {
                    if (self.callback !== undefined) {
                        self.callback(response);
                    }
                },
                postSubmit: function(data) {
                    if (self.callback !== undefined) {
                        self.callback(true);
                    }
                },
                onCancel: function() {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                }
            });
            
            this.form.addField({
                name: "name",
                label: i18n("Name"),
                required: true,
                readOnly: this.propValue !== undefined,
                type: "Text",
                value: this.existingValues.name
            });
            
            this.form.addField({
                name: "description",
                label: i18n("Description"),
                type: "Text",
                value: this.existingValues.description
            });

            this.form.addField({
                name: "secure",
                label: i18n("Secure"),
                type: "Checkbox",
                value: this.existingValues.secure,
                onChange: function(value) {
                    var oldValue = self.form.getValue("value");
                    self.form.removeField("value");
                    self.form.addField({
                        name: "value",
                        label: i18n("Value"),
                        type: value ? "Secure" : "Text",
                        value: oldValue
                    });
                }
            });

            this.form.addField({
                name: "value",
                label: i18n("Value"),
                type: this.existingValues.secure ? "Secure" : "Text Area",
                value: this.existingValues.value
            });
            this.form.placeAt(this.formAttach);
        }
    });
});

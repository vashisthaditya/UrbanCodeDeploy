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
    return declare('deploy.widgets.resourceRole.EditResourceRole',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="editResourceRole">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        /**
         * 
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            var existingValues = {
                color: "#ffffff"
            };
            if (this.resourceRole) {
                existingValues.id = this.resourceRole.id;
                existingValues.name = this.resourceRole.name;
                existingValues.description = this.resourceRole.description;
                existingValues.color = this.resourceRole.color;
            }
            
            this.form = new ColumnForm({
                submitUrl: bootstrap.restUrl+"resource/resourceRole",
                postSubmit: function(data) {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                    else if (self.resourceRole) {
                        navBar.setHash("resourceRole/"+self.resourceRole.id+"/resources", false, true);
                    }
                },
                addData: function(data) {
                    if (self.resourceRole) {
                        data.existingId = existingValues.id;
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
                type: "Text",
                value: existingValues.name
            });
            
            this.form.addField({
                name: "description",
                label: i18n("Description"),
                type: "Text",
                value: existingValues.description
            });
            
            this.form.addField({
                name: "color",
                label: i18n("Color"),
                required: true,
                type: "Color",
                value: existingValues.color
            });

            this.form.placeAt(this.formAttach);
        }
    });
});
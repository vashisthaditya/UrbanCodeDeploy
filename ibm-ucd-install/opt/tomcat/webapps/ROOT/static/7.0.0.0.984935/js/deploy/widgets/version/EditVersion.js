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
    return declare('deploy.widgets.version.EditVersion',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="editVersion">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        /**
         * 
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            this.existingValues = {};
            if (this.version) {
                this.existingValues = this.version;
            }
            
            var sourceConfigPropertyNames = [];
            var versionPropertyNames = [];
            
            this.form = new ColumnForm({
                submitUrl: bootstrap.restUrl+"deploy/version",
                readOnly: self.readOnly,
                showButtons: !self.readOnly,
                postSubmit: function(data) {
                    navBar.setHash("version/"+data.id, false, true);
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                addData: function(data) {
                    data.properties = {};

                    data.componentId = self.component.id;
                    if (self.version) {
                        data.existingId = self.version.id;
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
                readOnly: (this.version !== undefined),
                type: "Text",
                value: this.existingValues.name,
                disabled: true
            });
            
            this.form.addField({
                name: "description",
                label: i18n("Description"),
                type: "Text",
                value: this.existingValues.description
            });

            this.form.addField({
                name: "type",
                label: i18n("Type"),
                type: "Select",
                value: this.existingValues.type,
                allowedValues: [{
                    label: i18n("Full"),
                    value: "FULL"
                },{
                    label: i18n("Incremental"),
                    value: "INCREMENTAL"
                }]
            });

            this.form.placeAt(this.formAttach);
        }
    });
});
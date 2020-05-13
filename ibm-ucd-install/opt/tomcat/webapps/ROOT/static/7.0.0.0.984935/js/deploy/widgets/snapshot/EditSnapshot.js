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
        "js/webext/widgets/Alert",
        "js/webext/widgets/ColumnForm"
        ],
function(
        _TemplatedMixin,
        _Widget,
        array,
        declare,
        Alert,
        ColumnForm
) {
    return declare('deploy.widgets.snapshot.EditSnapshot',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="editSnapshot">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        /**
         * 
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            this.versionPickers = [];
            this.existingValues = {};
            if (this.snapshot) {
                this.existingValues = this.snapshot;
            }
            
            this.form = new ColumnForm({
                submitUrl: bootstrap.restUrl+"deploy/snapshot",
                postSubmit: function(data) {
                    navBar.setHash("snapshot/"+data.id+"/versions", false, true);
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                addData: function(data) {
                    data.applicationId = self.application.id;
                    if (self.snapshot) {
                        data.existingId = self.snapshot.id;
                    }
                    data.versions = [];
                    array.forEach(self.versionPickers, function(versionPicker) {
                        array.forEach(versionPicker.versions, function(version) {
                            data.versions.push(version.id);
                        });
                    });
                },
                onError: function(error) {
                    if (error.responseText) {
                        var wrongNameAlert = new Alert({
                            message: util.escape(error.responseText)
                        });
                    }
                },
                onCancel: function() {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                readOnly: this.readOnly,
                showButtons: !self.readOnly,
                cancelLabel: (self.snapshot === undefined) ? i18n("Cancel") : undefined 
            });
            
            this.form.addField({
                name: "name",
                label: i18n("Name"),
                required: true,
                type: "Text",
                value: this.existingValues.name
            });
            
            this.form.addField({
                name: "description",
                label: i18n("Description"),
                type: "Text",
                value: this.existingValues.description
            });
            this.form.placeAt(this.formAttach);
        }
    });
});
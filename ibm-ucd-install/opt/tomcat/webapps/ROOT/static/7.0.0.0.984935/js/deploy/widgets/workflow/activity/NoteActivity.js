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
        "dojo/_base/declare",
        "dojo/on",
        "deploy/widgets/workflow/activity/BaseActivity"
        ],
function(
        declare,
        on,
        BaseActivity
) {
    return declare('deploy.widgets.workflow.activity.NoteActivity',  [BaseActivity], {
        postCreate: function() {
            this.inherited(arguments);
            
            if (!this.initialized) {
                this.data.name = util.randomString(30);
                this.initialized = true;
                this.editProperties();
            }
        },

        getLabel: function() {
            return this.data.text || i18n("Edit to place notes.");
        },
        
        getStyle: function() {
            return "noteStyle";
        },
        
        canEdit: function() {
            return true;
        },
        
        canDelete: function() {
            return true;
        },
        
        editProperties: function(callback) {
            var self = this;

            var propertyDialog = self.createPropertyDialog();
            var propertyForm = self.createPropertyForm({
                dialog: propertyDialog,
                onSubmit: function(data) {
                    if (callback) {
                        callback();
                    }
                    self.initialized = true;

                    self.data.text = data.text;

                    self.updateLabel();
                    //self.sizeCell();
                    propertyDialog.hide();
                    propertyForm.destroy();
                    propertyDialog.destroy();
                },
                readOnly: self.readOnly
            });
   
            var text = "";
            if (self.data.text) {
                text = self.data.text;
            }
            
            propertyForm.addField({
                name: "text",
                label: i18n("Text"),
                type:"Text Area",
                required: false,
                value: text
            });
            
            propertyForm.placeAt(propertyDialog.containerNode);
            propertyDialog.show();
        }
    });
});
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
    return declare('deploy.widgets.workflow.activity.SetStatusActivity',  [BaseActivity], {
        postCreate: function() {
            this.inherited(arguments);
            
            if (!this.initialized) {
                this.data.name = util.randomString(30);
                this.editProperties();
            }
        },
    
        getLabel: function() {
            var result = "";
            
            var cleanStatus = "...";
            if (this.data.status === "FAILURE") {
                cleanStatus = i18n("Failure");
            }
            else if (this.data.status === "SUCCESS") {
                cleanStatus = i18n("Success");
            }
            
            result += i18n("Set Status: %s", cleanStatus);
            
            return result;
        },
        
        /**
         * 
         */
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

                    self.data.status = data.status;

                    self.updateLabel();

                    propertyDialog.hide();
                    propertyForm.destroy();
                    propertyDialog.destroy();
                },
                readOnly: self.readOnly
            });
   
            propertyForm.addField({
                name: "status",
                label: i18n("Status"),
                required: true,
                type: "Select",
                allowedValues: [{
                    label: i18n("Success"),
                    value: "SUCCESS"
                },{
                    label: i18n("Failure"),
                    value: "FAILURE"
                }],
                value: self.data.status
            });
            propertyForm.placeAt(propertyDialog.containerNode);
            propertyDialog.show();
        }
    });
});
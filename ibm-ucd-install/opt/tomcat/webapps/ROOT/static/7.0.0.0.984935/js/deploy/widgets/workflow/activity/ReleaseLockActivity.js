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
    return declare('deploy.widgets.workflow.activity.ReleaseLockActivity',  [BaseActivity], {
        postCreate: function() {
            this.inherited(arguments);
            
            if (!this.initialized) {
                this.data.name = util.randomString(30);

                if (!this.data.lockName) {
                    if (appState.applicationProcess) {
                        this.data.lockName = "${p:application.name}-${p:applicationProcess.name}-${p:environment.name}";
                    }
                    else {
                        this.data.lockName = "${p:component.name}-${p:componentProcess.name}-${p:resource.name}";
                    }
                }
                
                this.editProperties();
            }
        },
    
        getLabel: function() {
            var result = "";
            
            result = i18n("Release Lock");
            if (this.data.lockName) {
                var displayLockName = this.data.lockName;
                if (displayLockName.length > 22) {
                    displayLockName = displayLockName.substring(0, 20)+"...";
                }
                result += "\n"+displayLockName;
            }
            
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

                    self.data.lockName = data.lockName;

                    self.updateLabel();

                    propertyDialog.hide();
                    propertyForm.destroy();
                    propertyDialog.destroy();
                },
                readOnly: self.readOnly
            });
   
            var lockName = "";
            if (this.data.lockName) {
                lockName = this.data.lockName;
            }

            propertyForm.addField({
                name: "lockName",
                label: i18n("Lock Name"),
                type:"PropertyBox",
                required: true,
                value: lockName,
                cache: self.graphEditor.cache
            });

            propertyForm.placeAt(propertyDialog.containerNode);
            propertyDialog.show();
        }
    });
});
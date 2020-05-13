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
        "deploy/widgets/workflow/activity/BaseActivity",
        "js/webext/widgets/RestSelect"
        ],
function(
        declare,
        on,
        BaseActivity,
        RestSelect
) {
    return declare('deploy.widgets.workflow.activity.ResourceInventoryActivity',  [BaseActivity], {
        postCreate: function() {
            this.inherited(arguments);
            
            if (!this.initialized) {
                this.data.name = util.randomString(30);
                this.editProperties();
            }
        },
    
        getLabel: function() {
            var result = "";
            if (this.data.type === "addResourceInventory") {
                result = i18n("Add Inventory");
            }
            else if (this.data.type === "removeResourceInventory") {
                result = i18n("Remove Inventory");
            }
            
            if (this.data.status) {
                result += "\n"+this.data.status;
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

                    self.data.status = data.status;

                    self.updateLabel();

                    propertyDialog.hide();
                    propertyForm.destroy();
                    propertyDialog.destroy();
                },
                readOnly: self.readOnly
            });
   
            var restUrl = "";
            if (self.graphEditor.component) {
                restUrl = bootstrap.restUrl+"deploy/status/inventoryStatuses";
            }
            else if (self.graphEditor.componentTemplate) {
                restUrl = bootstrap.restUrl+"deploy/status/inventoryStatuses";
            }
            
            var statusSelect = new RestSelect({
                restUrl: restUrl,
                getValue: function(item) {
                    return item.name;
                },
                getStyle: function(item) {
                    var result = {
                        backgroundColor: item.color
                    };
                    return result;
                },
                allowNone: false,
                value: self.data.status,
                disabled: self.readOnly
            });
            propertyForm.addField({
                name: "status",
                label: i18n("Status"),
                required: true,
                widget: statusSelect
            });
            propertyForm.placeAt(propertyDialog.containerNode);
            propertyDialog.show();
        }
    });
});
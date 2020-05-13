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
    return declare('deploy.widgets.workflow.activity.DesiredSnapshotInventoryActivity',  [BaseActivity], {
        postCreate: function() {
            this.inherited(arguments);

            if (!this.initialized) {
                this.data.name = util.randomString(30);
                this.editProperties();
            }
        },

        getLabel: function() {
            var result = "";

            if (!this.initialized) {
                result += i18n("Snapshot Inventory Update");
            }
            else {
                if (this.data.type === "addDesiredSnapshotInventory") {
                    result += i18n("Inventory: Add Snapshot");
                }
                else if (this.data.type === "removeDesiredSnapshotInventory") {
                    result += i18n("Inventory: Remove Snapshot");
                }
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

                    self.data.type = data.type;
                    self.updateLabel();

                    propertyDialog.hide();
                    propertyForm.destroy();
                    propertyDialog.destroy();
                },
                readOnly: self.readOnly
            });

            propertyForm.addField({
                name: "type",
                label: i18n("Action"),
                type: "Select",
                required: true,
                value: self.data.type,
                allowedValues: [{
                    label: i18n("Choose an Action"),
                    value: ""
                },{
                    label: i18n("Add Desired Snapshot Inventory"),
                    value: "addDesiredSnapshotInventory"
                },{
                    label: i18n("Remove Desired Snapshot Inventory"),
                    value: "removeDesiredSnapshotInventory"
                }]
            });

            propertyForm.placeAt(propertyDialog.containerNode);
            propertyDialog.show();
        }
    });
});
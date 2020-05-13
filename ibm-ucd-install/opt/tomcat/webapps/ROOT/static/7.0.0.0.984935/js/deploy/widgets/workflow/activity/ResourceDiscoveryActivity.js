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
        "deploy/widgets/resource/ResourceSelector",
        "deploy/widgets/workflow/activity/BaseActivity"
        ],
function(
        declare,
        ResourceSelector,
        BaseActivity
) {
    return declare([BaseActivity], {
        postCreate: function() {
            this.inherited(arguments);

            if (!this.initialized) {
                this.editProperties();
            }
        },

        getLabel: function() {
            var result = this.data.name;
            if (this.initialized) {
                result += "\n" + i18n("using %s", this.data.commandName);
            }
            return result;
        },

        editProperties: function(callback) {
            var self = this;

            var propertyDialog = self.createPropertyDialog();
            self.propertyForm = self.createPropertyForm({
                dialog: propertyDialog,
                validateFields: function(data) {
                    return self.validateName(data.name);
                },
                addData: function(data) {
                    // Ensure we keep track of commandType/actionType without a field for them
                    data.commandType = self.data.commandType;
                    data.actionType = self.data.actionType;
                },
                onSubmit: function(data) {
                    if (callback) {
                        callback();
                    }
                    self.initialized = true;

                    self.data.name = data.name;
                    self.data.propertyName = data.propertyName;
                    self.data.command = data.command;
                    self.data.resource = data.resource;

                    self.updateLabel();

                    propertyDialog.hide();
                    self.propertyForm.destroy();
                    propertyDialog.destroy();
                },
                readOnly: self.readOnly
            });

            self.propertyForm.addField({
                name: "name",
                label: i18n("Name"),
                type: "Text",
                required: "True",
                value: self.data.name
            });

            self.propertyForm.addField({
                name: "resource",
                label: i18n("Resource"),
                type: "Text",
                value: self.data.resource || "${p:resource.parent.path}",
                required: true,
                description: i18n("The path or ID of the resource to run the step on.")
            });

            self.propertyForm.addField({
                name: "command",
                label: i18n("Plugin Step"),
                type: "TableFilterSelect",
                required: true,
                value: self.data.command,
                url: bootstrap.restUrl + "plugin/command",
                description: i18n("The plugin step to run."),
                defaultQuery: {
                    "filterFields": ["type"],
                    "filterType_type": "eq",
                    "filterValue_type": self.data.commandType
                },
                onChange: function(value, item) {
                    self.data.commandName = item.name;
                }
            });

            self.propertyForm.placeAt(propertyDialog.containerNode);
            propertyDialog.show();
        }
    });
});

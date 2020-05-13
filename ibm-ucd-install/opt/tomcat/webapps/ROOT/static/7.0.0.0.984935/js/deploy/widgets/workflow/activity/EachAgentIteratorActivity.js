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
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/on",
        "deploy/widgets/workflow/activity/BaseActivity"
        ],
function(
        array,
        declare,
        on,
        BaseActivity
) {
    return declare([BaseActivity], {
        postCreate: function() {
            this.inherited(arguments);
            this.isContainer = true;

            if (!this.initialized) {
                this.editProperties();
            }
        },

        editProperties: function() {
            var self = this;

            var propertyDialog = self.createPropertyDialog();
            var propertyForm = self.createPropertyForm({
                dialog: propertyDialog,
                validateFields: function(data) {
                    var result = self.validateName(data.name);
                    if (data.maxIteration.trim() === "0") {
                        result.push(i18n("Max Concurrent Agents cannot be 0."));
                    }
                    return result;
                },
                onSubmit: function(data) {
                    self.initialized = true;

                    self.data = {
                        "name": data.name,
                        "type": "eachAgentIterator",
                        "maxIteration": data.maxIteration
                    };

                    // tempTags are only used locally and are updated every time
                    // there is a change in the tag selector dropdown
                    // This is because the field holds on to the ids and we
                    // want the actual items
                    if (data.tagIds && data.tagIds.length !== 0) {
                        self.data.tags = self.tempTags;
                    }
                    else if (self.data.tagIds) {
                        self.data.tags = undefined;
                    }

                    self.updateLabel();

                    propertyDialog.hide();
                    propertyForm.destroy();
                    propertyDialog.destroy();
                },
                readOnly: self.readOnly
            });

            propertyForm.addField({
                name: "name",
                label: i18n("Name"),
                type: "Text",
                required: true,
                value: self.data.name
            });

            // -- Resource tag
            propertyForm.addField({
                name: "tagIds",
                label: i18n("Limit to Resource Tags"),
                type: "TagMultiDropDown",
                objectType: "Resource",
                value: self.data.tags,
                readOnly: self.readOnly,
                description: i18n("Resource Tags to limit this process to. Process will be eligible for running on any resource with ANY of these tags."),
                onAdd: function(item) {
                    self.tempTags = this.items;
                },
                onRemove: function(item) {
                    self.tempTags = this.items;
                }
            });

            var maxIteration = self.data.maxIteration;
            if (!maxIteration) {
                maxIteration = -1;
            }

            propertyForm.addField({
                name: "maxIteration",
                label: i18n("Max Concurrent Agents"),
                type: "Text",
                required: true,
                value: maxIteration,
                description: i18n("The maximum number of agents to run this step at one time.")
            });

            propertyForm.placeAt(propertyDialog.containerNode);
            propertyDialog.show();
        },

        getLabel: function() {
            var result;
            if (this.data.name) {
                result = i18n("%s\n(For Every Agent)", this.data.name);
            }
            else {
                result = i18n("For Every Agent...");
            }
            return result;
        },

        getStyle: function() {
            return "parallelStyle";
        },

        canEdit: function() {
            return true;
        },

        canDelete: function() {
            return true;
        },

        canCopy: function() {
            //can't support copying for this step yet
            return false;
        }
    });
});
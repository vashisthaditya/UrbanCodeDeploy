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
        },

        getLabel: function() {
            var result;
            if (this.data.name) {
                result = i18n("%s\n(For Each Tag)", this.data.name);
            }
            else {
                result = i18n("For Each Tag...");
            }
            return result;
        },

        getStyle: function() {
            return "parallelStyle";
        },

        editProperties: function(callback) {
            var self = this;

            var childData = this.getChildData();

            var propertyDialog = self.createPropertyDialog();
            var propertyForm = self.createPropertyForm({
                dialog: propertyDialog,
                validateFields: function(data) {
                    var result = self.validateName(data.name);
                    if (data.maxIteration.trim() === "0") {
                        result.push(i18n("Max Concurrent Tags cannot be 0."));
                    }
                    return result;
                },
                onSubmit: function(data) {
                    if (callback) {
                        callback();
                    }
                    self.initialized = true;

                    self.data = {
                        "name": data.name,
                        "type": "eachTagIterator",
                        "maxIteration": data.maxIteration
                    };

                    if (data.tags && data.tags !== "") {
                        self.data.tags = self.tempTags;
                    }
                    else if (self.data.tags) {
                        self.data.tags = undefined;
                    }

                    self.updateLabel();

                    propertyDialog.hide();
                    propertyForm.destroy();
                    propertyDialog.destroy();
                }
            });

            propertyForm.addField({
                name: "name",
                label: i18n("Name"),
                type: "Text",
                required: true,
                value: self.data.name
            });

            propertyForm.addField({
                name: "tags",
                label: i18n("Tags"),
                type: "OrderedTagMultiSelect",
                required: true,
                url: bootstrap.restUrl + "tag/type/Resource",
                value: self.data.tags,
                readOnly: self.readOnly,
                description: i18n("Ordered List of Resource Tags. This process will only run on resources with the given tag for that iteration. This can be overriden at request time. Only tags selected here will be available at request time."),

                // need these because after editing the tag slection for this step and then
                // clicking submit, self.data.tags would be overriden with ONLY the ids of
                // the selected tags, which means that editing this step's properties a
                // second time would not display anything correctly.
                onReorder: function(items) {
                    self.tempTags = this.items;
                },
                onAdd: function(item) {
                    self.tempTags = this.items;
                },
                onRemove: function(item) {
                    self.tempTags = this.items;
                }
            });

            var maxIteration = self.data.maxIteration;
            if (!maxIteration) {
                maxIteration = 1;
            }

            propertyForm.addField({
                name: "maxIteration",
                label: i18n("Max Concurrent Tags"),
                type: "Text",
                required: true,
                value: maxIteration,
                description: i18n("The maximum number of tags to run this step for at one time.")
            });

            propertyForm.placeAt(propertyDialog.containerNode);
            propertyDialog.show();
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
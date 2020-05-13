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
        "dojo/_base/xhr",
        'dojo/dom-class',
        "dojo/dom-construct",
        "dojo/on",
        "deploy/widgets/workflow/activity/BaseActivity",
        "js/webext/widgets/DialogMultiSelect",
        "js/webext/widgets/RestSelect",
        "js/webext/widgets/DomNode",
        "deploy/widgets/property/PropertyTextareaBox"
        ],
function(
        array,
        declare,
        xhr,
        domClass,
        domConstruct,
        on,
        BaseActivity,
        DialogMultiSelect,
        RestSelect,
        DomNode,
        PropertyArea
) {
    return declare('deploy.widgets.workflow.activity.EachTouchedResourceActivity',  [BaseActivity], {
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
                result += i18n("Run Generic Process");
            } else {
                var childData = this.getChildData();
                result += this.getDisplayName(childData.name, childData.processName, i18n("Run"));
            }
            result += "\n" + i18n("All Affected Resources");
            return result;
        },

        showProcessFields: function(form, process) {
            var self = this;

            this.setDefaultNameValue(form,process.name);

            array.forEach(process.propDefs, function(propDef) {
                var existingValue = null;
                if (self.data.properties) {
                    existingValue = self.data.properties[propDef.name];
                }

                if (existingValue) {
                    propDef.value = existingValue;
                }

                propDef.name = "p_"+propDef.name;
                form.addField(propDef);
                self.extraPropertyNames.push(propDef.name);
            });
        },

        /**
         *
         */
        editProperties: function(callback) {
            var self = this;

            var childData = this.getChildData();

            var propertyDialog = self.createPropertyDialog();
            var propertyForm = self.createPropertyForm({
                dialog: propertyDialog,
                validateFields: function(data) {
                    return self.validateName(data.name);
                },
                onSubmit: function(data) {
                    if (callback) {
                        callback();
                    }
                    self.initialized = true;

                    self.data.name = util.randomString(30);
                    self.data.type = "touchedResourceIterator";

                    self.data.maxIteration = data.maxIteration;
                    self.data.failFast = data.failFast;
                    self.data.preconditionScript = data.preconditionScript;
                    self.data.properties = {};

                    self.data.children = [{
                        "name": data.name,
                        "type": "runProcess",
                        "processName": data.processName,
                        "allowFailure": data.allowFailure
                    }];

                    array.forEach(self.extraPropertyNames, function(propertyName) {
                        var realPropertyName = propertyName.substring(2);
                        self.data.properties[realPropertyName] = data[propertyName];
                    });

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
                value: childData.name
            });

            var processSelect = new RestSelect({
                restUrl: bootstrap.restUrl+"process",
                getValue: function(item) {
                    return item.name;
                },
                onChange: function(value, item) {
                    // item will not exist if we are reselecting a process we don't have read access to.
                    // item will not have id if the step is prepopulated with a process we don't have read access to.
                    self.hideAbsentPropertiesMessage(propertyForm);
                    array.forEach(self.extraPropertyNames, function(name) {
                        propertyForm.removeField(name);
                    });
                    self.extraPropertyNames = [];

                    // When no generic processes, item is null
                    if (!!item) {
                        xhr.get({
                            url: bootstrap.restUrl+"process/"+item.id+"/-1",
                            handleAs: "json",
                            load: function(data) {
                                self.showProcessFields(propertyForm, data);
                            }
                        });
                    }
                    else {
                        self.showAbsentPropertiesMessage(propertyForm);
                    }
                },
                allowNone: false,
                value: childData.processName,
                disabled: self.readOnly
            });
            propertyForm.addField({
                name: "processName",
                label: i18n("Process"),
                required: true,
                description: i18n("The process to run."),
                widget: processSelect
            });

            if (config.data.systemConfiguration.enableAllowFailure || childData.allowFailure) {
                propertyForm.addField({
                    name: "allowFailure",
                    label: i18n("Ignore Failure"),
                    description: i18n("When checked, this step will always be considered successful."),
                    type: "Checkbox",
                    value: childData.allowFailure
                }, "tagId");
            }

            propertyForm.addField({
                name: "maxIteration",
                label: i18n("Maximum number of concurrent processes"),
                type: "Text",
                required: true,
                textDir: "ltr",
                value: self.data.maxIteration || -1 ,
                description: i18n("The maximum number of concurrent processes to run at the same time. " +
                        "For example, if you set the maximum number of concurrent processes to 2, " +
                        "the generic process runs on only two resources at a time. Use -1 for unlimited.")
            });

            propertyForm.addField({
                name: "failFast",
                label: i18n("Fail Fast"),
                type: "Checkbox",
                description: i18n("When this is checked, this step will not start any more component processes if one fails."),
                value: self.data.failFast
            });

            propertyForm.addField({
                name: "preconditionScript",
                label: i18n("Precondition"),
                type: "PropertyArea",
                description: i18n("A script to determine whether this step should run. Must evaluate to true or false if not left blank."),
                value: self.data.preconditionScript,
                cache: self.graphEditor.cache
            });

            propertyForm.placeAt(propertyDialog.containerNode);
            propertyDialog.show();
        },

        showAbsentPropertiesMessage: function(form) {
            this.absentPropsMessageDom = new DomNode({
                name: "",
                label: ""
            });

            var messageDiv = domConstruct.create("div");
            messageDiv.innerHTML = i18n("Any existing property fields have been omitted due to" +
                    " insufficient permissions to the process.");
            domClass.add(messageDiv, "processFormMessage");
            this.absentPropsMessageDom.domAttach.appendChild(messageDiv);

            form.addField({
                name: "", // Hides the label in the form
                widget: this.absentPropsMessageDom
            });
        },

        hideAbsentPropertiesMessage: function(form) {
            if (form.hasField(this.absentPropsMessageDom)) {
                form.removeField(this.absentPropsMessageDom);
            }
        },

        getDefaultName: function(processName) {
            return i18n("Run Generic: \"%s\"", processName);
        }
    });
});

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
        "dojo/_base/xhr",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Alert"
        ],
function(
        _TemplatedMixin,
        _Widget,
        array,
        declare,
        xhr,
        ColumnForm,
        Alert
) {
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="applyResourceTemplate">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        createNew: false,
        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            var putUrl = this.createNew ? bootstrap.restUrl+"resource/resource/addFromTemplate" : bootstrap.restUrl+"resource/resource/applyTemplate";
            this.form = new ColumnForm({
                submitUrl: putUrl,
                postSubmit: function(data) {
                    if (self.callback !== undefined) {
                        self.callback(data);
                    }
                },
                addData: function(data) {
                    data.targetResourceId = self.resource.id;
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
                }
            });

            this.extraPropNames = [];

            if (this.createNew) {
                this.form.addField({
                    name: "name",
                    label: i18n("New Resource Name"),
                    description: i18n("The name of the new resource to be created based on the template."),
                    type: "Text",
                    required: true
                });
            }

            this.form.addField({
                name: "resourceTemplateId",
                label: i18n("Resource Template"),
                description: i18n("Choose the resource template to apply to this resource. Any " +
                        "resources which exist in the template will be copied to the resource " +
                        "which the template is applied to."),
                type: "TableFilterSelect",
                required: true,
                url: bootstrap.restUrl+"resource/resourceTemplate/couldBeParent",
                onChange: function(resourceTemplateId) {
                    array.forEach(self.extraPropNames, function(extraPropName) {
                        self.form.removeField(extraPropName);
                    });
                    self.extraPropNames = [];

                    if (resourceTemplateId) {
                        self.form.block();
                        xhr.get({
                            url: bootstrap.restUrl+"resource/resourceTemplate/"+resourceTemplateId,
                            handleAs: "json",
                            load: function(data) {
                                self.form.unblock();

                                array.forEach(data.propDefs, function(propDef) {
                                    propDef.name = "p_"+propDef.name;
                                    self.form.addField(propDef);
                                    self.extraPropNames.push(propDef.name);
                                });
                            },
                            error: function(response) {
                                self.form.unblock();
                                var dndAlert = new Alert({
                                    message: util.escape(response.responseText)
                                });
                            }
                        });
                    }
                }
            });


            this.form.placeAt(this.formAttach);
        }
    });
});

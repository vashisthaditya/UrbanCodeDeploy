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
        "dojo/_base/declare",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/RestSelect"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        ColumnForm,
        RestSelect
) {
    return declare('deploy.widgets.status.EditStatus',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="editStatus">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        /**
         * 
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            this.existingValues = {};
            if (this.status) {
                this.existingValues = this.status;
            }
            
            this.form = new ColumnForm({
                submitUrl: bootstrap.restUrl+"deploy/status",
                addData: function(data) {
                    if (self.status) {
                        data.existingId = self.status.id;
                    }
                    data.type = self.type;
                },
                postSubmit: function(data) {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                onCancel: function() {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                }
            });
            
            this.form.addField({
                name: "name",
                label: i18n("Name"),
                required: true,
                readOnly: !!this.status,
                type: "Text",
                value: this.existingValues.name
            });

            this.form.addField({
                name: "description",
                label: i18n("Description"),
                type: "Text",
                value: this.existingValues.description
            });
            
            this.form.addField({
                name: "color",
                label: i18n("Color"),
                type: "ColorPicker",
                value: this.existingValues.color
            });
            
            this.form.addField({
                name: "unique",
                label: i18n("Unique"),
                type: "Checkbox",
                description: i18n("When this box is checked, this status can only be used once for "+
                            "any component. For inventory statuses, that means an application of "+
                            "this status will remove it for any other versions in the environment "+
                            "or resource inventory. For version/snapshot statuses, the status can "+
                            "only exist on one version/snapshot at the same time."),
                value: this.existingValues.unique
            });
            
            if (this.type === "version" || this.type === "snapshot") {
                var roleSelect = new RestSelect({
                    restUrl: bootstrap.baseUrl + "security/role",
                    value: !!this.existingValues ? this.existingValues.roleId : null,
                    noneValue: "No roles found"
                });
                this.form.addField({
                    name: "roleId",
                    label: i18n("Required Role"),
                    description: i18n("A role which a user must belong to in the component to add this status to a version."),
                    required: false,
                    widget: roleSelect
                });
            }

            this.form.placeAt(this.formAttach);
        }
    });
});
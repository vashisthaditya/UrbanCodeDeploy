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
        "js/webext/widgets/ColumnForm"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        ColumnForm
) {
    return declare('deploy.widgets.notification.EditNotificationScheme',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="editNotificationScheme">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        /**
         * 
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            this.existingValues = {};
            if (this.notificationScheme) {
                this.existingValues.name = this.notificationScheme.name;
                this.existingValues.description = this.notificationScheme.description;
            }
            
            this.form = new ColumnForm({
                submitUrl: bootstrap.restUrl+"notification/notificationScheme",
                postSubmit: function(data) {
                    navBar.setHash("notificationScheme/"+data.id);
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                addData: function(data) {
                    if (self.notificationScheme) {
                        data.existingId = self.notificationScheme.id;
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
                type: "Text",
                value: this.existingValues.name
            });
            
            this.form.addField({
                name: "description",
                label: i18n("Description"),
                type: "Text",
                value: this.existingValues.description
            });
            this.form.placeAt(this.formAttach);
        }
    });
});
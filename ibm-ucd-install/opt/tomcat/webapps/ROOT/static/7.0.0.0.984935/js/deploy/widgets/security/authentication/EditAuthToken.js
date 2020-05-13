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
        "dijit/form/FilteringSelect",
        "dojo/_base/declare",
        "dojox/data/JsonRestStore",
        "js/webext/widgets/ColumnForm"
        ],
function(
        _TemplatedMixin,
        _Widget,
        FilteringSelect,
        declare,
        JsonRestStore,
        ColumnForm
) {
    return declare('deploy.widgets.security.authentication.EditAuthToken',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="editAuthToken">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            this.sourceConfigPropertyNames = [];
            this.templatePropertyNames = [];

            this.form = new ColumnForm({
                submitUrl: bootstrap.baseUrl+"security/authtoken",
                postSubmit: function(data) {
                    if (self.callback !== undefined) {
                        self.callback(data);
                    }
                },
                addData: function(data) {
                    if (data.expDate && data.expTime) {
                        data.expiration = util.combineDateAndTime(
                                data.expDate,
                                data.expTime).valueOf();
                    }
                },
                onCancel: function() {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                }
            });

            this.groupMembersStore = new JsonRestStore({
                target: bootstrap.baseUrl + "security/user",
                idAttribute: 'id'
            });
            this.groupMemberSelect = new FilteringSelect({
                store: this.groupMembersStore,
                searchAttr: "name"
            });
            this.form.addField({
                name: "userId",
                label: i18n("User"),
                required: true,
                widget: this.groupMemberSelect,
                description: i18n("If you are using the token to integrate with UrbanCode Release, " +
                    "you must specify the administrator. " +
                    "If the token is for an agent relay that uses component version replication, " +
                    "the user must have a role that has the Read Artifact Set List permission.")
            });

            this.form.addField({
                name: "expDate",
                label: i18n("Expiration Date"),
                required: true,
                type: "Date"
            });

            this.form.addField({
                name: "expTime",
                label: i18n("Expiration Time"),
                required: true,
                type: "Time"
            });

            this.form.addField({
                name: "description",
                label: i18n("Description"),
                required: false,
                type: "Text"
            });

            this.form.addField({
                name: "host",
                label: i18n("Allowed IPs"),
                required: false,
                type: "Text",
                textDir: "ltr",
                placeholder: "10.15.10.0/24",
                description: i18n("Specifies allowed IPv4 addresses using CIDR notation. " +
                    "If no CIDR mask is specified, 32 is assumed. " +
                    "Leave this field blank for no IP restrictions, or if this server is part of a cluster. " +
                    "Do not use hostnames, for example, use 127.0.0.1 instead of localhost.")
            });

            this.form.placeAt(this.formAttach);
        }
    });
});
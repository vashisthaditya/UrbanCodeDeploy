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
        "dijit/form/CheckBox",
        "dojo/_base/declare",
        "js/webext/widgets/ColumnForm"
        ],
function(
        _TemplatedMixin,
        _Widget,
        CheckBox,
        declare,
        ColumnForm
) {
    return declare('deploy.widgets.network.EditNetworkRelay',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="editNetworkRelay">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            var existingValues = {id: null,
                                  name: null,
                                  host: null,
                                  port: null,
                                  active: false
            };
            if (this.networkRelay) {
                existingValues.id = this.networkRelay.id;
                existingValues.name = this.networkRelay.name;
                existingValues.host = this.networkRelay.host;
                existingValues.port = this.networkRelay.port;
                existingValues.active = this.networkRelay.active;
            }

            this.form = new ColumnForm({
                submitUrl: bootstrap.restUrl + "network/networkRelay",
                postSubmit: function(data) {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                addData: function(data) {
                    if (self.networkRelay) {
                        data.existingId = existingValues.id;
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
                value: existingValues.name
            });

            this.form.addField({
                name: "host",
                label: i18n("Host"),
                required: true,
                type: "Text",
                textDir: "ltr",
                value: existingValues.host
            });

            this.form.addField({
                name: "port",
                label: i18n("Port"),
                description: i18n("The JMS port for the server to connect to the cluster (default: 7918)."),
                required: true,
                type: "Number",
                textDir: "ltr",
                value: existingValues.port
            });

            this.activeCheckBox = new CheckBox({
                checked: existingValues.active || true,
                value: 'true'
            });
            this.form.addField({
                name: "active",
                label: i18n("Active"),
                widget: this.activeCheckBox
            });
        },

        /**
         * 
         */
        startup: function() {
            this.inherited(arguments);
            
            this.form.startup();
            this.form.placeAt(this.formAttach);
        }
    });
});
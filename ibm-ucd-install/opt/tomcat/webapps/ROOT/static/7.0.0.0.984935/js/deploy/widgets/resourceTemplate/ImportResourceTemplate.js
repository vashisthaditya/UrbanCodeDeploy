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
        "dojo/_base/xhr",
        "js/webext/widgets/ColumnForm",
        "deploy/widgets/security/TeamSelector",
        "js/webext/widgets/select/WebextSelect",
        "dojo/store/JsonRest",
        "js/webext/widgets/Dialog",
        "deploy/widgets/resourceTemplate/CloudConnectionSelect"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        xhr,
        ColumnForm,
        TeamSelector,
        WebextSelect,
        JsonRest,
        Dialog,
        CloudConnectionSelect
) {
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="importResourceTemplate">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        /**
         *
         */

        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            this.existingValues = {};
            if (this.resourceTemplate) {
                this.existingValues = this.resourceTemplate;
            }
            else {
                xhr.get({
                    "url": bootstrap.restUrl + "security/teamsWithCreateAction/Resource Template",
                    "handleAs": "json",
                    "sync": true,
                    "load": function(data) {
                        var extendedSecurity = {"teams": data};
                        self.existingValues.extendedSecurity = extendedSecurity;
                    }
                });
            }

            this.form = new ColumnForm({
                submitUrl: bootstrap.restUrl+"resource/resourceTemplate",
                postSubmit: function(data) {
                    if (self.callback !== undefined) {
                        self.callback(data);
                    }
                },
                addData: function(data) {
                    if (self.resourceTemplate) {
                        data.existingId = self.existingValues.id;
                    }

                    data.teamMappings = self.teamSelector.teams;
                },
                onCancel: function() {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                }
            });

            // the self.connectionStore isn't defined in this file; the selector creates its own
            this.connectionSelector = new CloudConnectionSelect(
                {
                    store: self.connectionStore,
                    searchAttr: "name",
                    labelAttr: "name",
                    noDataMessage: i18n("No resources found."),
                    autoComplete: false,
                    intermediateChanges: true,
                    onChange: function(cloudConnectionId) {
                        if (self.form.hasField("isVsys")) {
                            self.form.removeField("isVsys");
                        }

                        self.form.addField({
                            name: "isVsys",
                            label: i18n("Use Virtual System Patterns"),
                            description: i18n("When this box is checked, Virtual System patterns in IBM PureApplication System version 2.0 or later will be used. Uncheck to use Classic patterns instead."),
                            type: "Checkbox",
                            value: true,
                            onChange: function(value) {
                                self.showCloudResourceField(cloudConnectionId, value);
                            }
                        }, "_cloudResourceInsertionPoint");

                        self.showCloudResourceField(cloudConnectionId, true);
                    }
                }
            );
            this.form.addField({
                name: "name",
                label: i18n("Name"),
                required: true,
                type: "Validation Text",
                promptMessage: null,
                value: this.existingValues.name
            });

            this.form.addField({
                name: "connection",
                label: i18n("Cloud Connection"),
                description: i18n("In the <b>Cloud Connection</b> list, select the connection to the cloud system. If you do not have a connection to the cloud system, click <b>New Connection</b> and specify the information for the connection, including the host name and login information for the cloud system."),
                required: true,
                widget: this.connectionSelector
            });

            this.form.addField({
                name: "_cloudResourceInsertionPoint",
                type: "Invisible"
            });

            this.teamSelector = new TeamSelector({
                resourceRoleType: "Resource Template",
                noneLabel: i18n("Standard Resource Template"),
                teams: this.existingValues.extendedSecurity.teams
            });
            this.form.addField({
                name: "teams",
                label: i18n("Teams"),
                type: "Text",
                description: i18n("In the <b>Teams</b> field, add the teams that should be able to use the resource template."),
                widget: this.teamSelector
            });

            this.form.placeAt(this.formAttach);
        },

        showCloudResourceField: function(cloudConnectionId, isVsys) {
            var self = this;

            if (self.form.hasField("cloudResourceId")) {
                self.form.removeField("cloudResourceId");
            }

            self.cloudResourcesStore = new JsonRest({
                target: bootstrap.restUrl + "resource/cloud/connection/" + cloudConnectionId + "/resources",
                idAttribute: 'id'
            });

            self.cloudResourcesSelector = new WebextSelect(
                {
                    store: self.cloudResourcesStore,
                    searchAttr: "name",
                    labelAttr: "name",
                    noDataMessage: i18n("No resources found."),
                    autoComplete: false,
                    intermediateChanges: true,
                    defaultQuery: {
                        vsys: !!isVsys
                    }
                }
            );

            self.cloudResourceField = self.form.addField({
                name: "cloudResourceId",
                label: i18n("Cloud Resource"),
                description: i18n("In the <b>Cloud Resource</b> list, select the virtual system pattern to use."),
                required: true,
                widget: self.cloudResourcesSelector
            }, "_cloudResourceInsertionPoint");
        }
    });
});
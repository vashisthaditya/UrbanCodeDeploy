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
/*global define */
define([
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/_base/lang",
        "dojo/aspect",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dijit/form/Button",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/RestSelect",
        "deploy/widgets/security/TeamSelector"
    ],
    function(
        _TemplatedMixin,
        _Widget,
        declare,
        xhr,
        lang,
        aspect,
        domConstruct,
        domClass,
        Button,
        Dialog,
        ColumnForm,
        RestSelect,
        TeamSelector
    ) {
        return declare(
            'js.deploy.widgets.resourceTemplate.CloudConnectionSelect', [_Widget, _TemplatedMixin], {

                templateString: '<div class="collectionSelector">' +
                    '  <div data-dojo-attach-point="selectorAttach" class="versionSelectorComponent"></div>' +
                    '  <div data-dojo-attach-point="buttonAttach" style="vertical-align: top; display:inline-block;" ></div>' +
                    '</div>',

                postCreate: function() {
                    var self = this;
                    this.inherited(arguments);

                    xhr.get({
                        "url": bootstrap.restUrl + "security/teamsWithCreateAction/Cloud Connection",
                        "handleAs": "json",
                        "sync": true,
                        "load": function(data) {
                            var extendedSecurity = {
                                "teams": data
                            };
                            self.extendedSecurity = extendedSecurity;
                        }
                    });

                    var connectionURL = bootstrap.restUrl + "resource/cloud/connection";
                    if (self.blueprintId) {
                        connectionURL += "?filter_type=blueprint&same_host_as=" + self.blueprintId;
                    }

                    this.connectionSelector = new RestSelect({
                        restUrl: connectionURL,
                        onChange: function(value, entry) {
                            if (value) {
                                self.selectedCloudId = value;
                                self.set('value', self.selectedCloudId);
                                self.selectedCloudabel = entry.name;
                            }
                            self.onChange(value);

                            // TODO: Add onChange: here and propagate that value outward to the form
                        },
                        isValid: function(entry) {
                            return true;
                        },
                        allowNone: false
                    });

                    this.newConnectionBtn = new Button({
                        label: i18n('New Connection...'),
                        onClick: function(evt) {
                            var newConnectionDlg = new Dialog({
                                title: i18n("New Cloud Connection"),
                                closable: true,
                                draggable: true,
                                description: i18n("To create a cloud connection, specify the cloud system " +
                                    "to connect to and the credentials for that cloud system. Make " +
                                    "sure that you have a user account on the cloud system and that " +
                                    "you have the permissions to read information about virtual system " +
                                    "patterns, IP groups, cloud groups, and environment profiles.")
                            });

                            this.form = new ColumnForm({
                                submitUrl: bootstrap.restUrl + "resource/cloud/connection",
                                postSubmit: function(data) {
                                    newConnectionDlg.hide();
                                    newConnectionDlg.destroy();
                                    if (self.callback !== undefined) {
                                        self.callback(data);
                                    }
                                    self.connectionSelector._updateRestUrl();
                                },
                                addData: function(data) {

                                    data.teamMappings = self.teamSelector.teams;
                                },
                                onCancel: function() {
                                    newConnectionDlg.hide();
                                    newConnectionDlg.destroy();
                                    if (self.callback !== undefined) {
                                        self.callback();
                                    }
                                }
                            });

                            this.form.addField({
                                name: "name",
                                label: i18n("Name"),
                                required: false,
                                type: "Text"
                            });
                            this.form.addField({
                                name: "url",
                                label: i18n("Management Console"),
                                required: true,
                                textDir: "ltr",
                                type: "Text",
                                placeholder: "<hostname>",
                                description: i18n("Specify the host name of the cloud system.")
                            });
                            this.form.addField({
                                name: "username",
                                label: i18n("Username"),
                                required: true,
                                description: i18n("The user name of an account that has permission to request cloud resources. The server stores this user name and password and uses it to request cloud resources when you use this cloud connection."),
                                type: "Text"
                            });
                            this.form.addField({
                                name: "password",
                                label: i18n("Password"),
                                required: true,
                                description: i18n("The password for the user account."),
                                textDir: "ltr",
                                type: "Secure"
                            });
                            this.form.addField({
                                name: "description",
                                label: i18n("Description"),
                                required: false,
                                type: "Text"
                            });

                            var currentTeams = [];
                            if (self.extendedSecurity.teams) {
                                currentTeams = self.extendedSecurity.teams;
                            }
                            self.teamSelector = new TeamSelector({
                                resourceRoleType: "Cloud Connection",
                                noneLabel: i18n("Standard Cloud Connection"),
                                teams: currentTeams
                            });
                            this.form.addField({
                                name: "teams",
                                label: i18n("Teams"),
                                type: "Text",
                                widget: self.teamSelector
                            });
                            this.form.placeAt(newConnectionDlg.containerNode);

                            newConnectionDlg.show();
                        }
                    });

                    this.connectionSelector.placeAt(this.selectorAttach);
                    this.newConnectionBtn.placeAt(this.buttonAttach);
                },


                get: function(val) {
                    if (this.connectionSelector) {
                        return this.connectionSelector.get(val);
                    }
                },

                set: function(name, value) {
                    if (this.connectionSelector) {
                        return this.connectionSelector.set(name, value);
                    }
                }
            });
    });
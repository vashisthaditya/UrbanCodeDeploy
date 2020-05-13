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
        "js/webext/widgets/Alert",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/RestSelect",
        "deploy/widgets/security/TeamSelector",
        "deploy/widgets/resource/ResourceSelector"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        xhr,
        Alert,
        ColumnForm,
        RestSelect,
        TeamSelector,
        ResourceSelector
) {
    return declare('deploy.widgets.process.EditProcess',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="editProcess">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            this.existingValues = {};
            this.properties = [];

            if (this.process) {
                this.existingValues = this.process;
                this.properties = this.process.properties;
            }
            else if (this.source) {
                xhr.get({
                    "url": bootstrap.restUrl+"process/" + this.source.id + "/-1",
                    "handleAs": "json",
                    "sync": true,
                    "load": function(data) {
                        self.source = data;
                    }
                });
                this.existingValues = this.source;
                this.copyId = this.source.id;
                this.existingValues.name = undefined;
                this.properties = this.source.properties;
            }
            else {
                this.properties.push({
                    "name": "contextType",
                    "value": "Resource"
                });
                xhr.get({
                    "url": bootstrap.restUrl + "security/teamsWithCreateAction/Process",
                    "handleAs": "json",
                    "sync": true,
                    "load": function(data) {
                        var extendedSecurity = {"teams": data};
                        self.existingValues.extendedSecurity = extendedSecurity;
                    }
                });
            }
            self.createForm();
        },

        createForm: function() {
            var self = this;
            this.form = new ColumnForm({
                submitUrl: bootstrap.restUrl+"process",
                readOnly: self.readOnly,
                showButtons: !self.readOnly,
                postSubmit: function(data) {
                    navBar.setHash("process/"+data.id+"/-1");
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                onError: function(error) {
                    if (error.responseText) {
                        var wrongVersionAlert = new Alert({
                            message: util.escape(error.responseText)
                        });
                    }
                    if (self.process) {
                        //set hash such that unsaved changes are visible, and refresh will update to latest version
                        navBar.setHash("process/"+self.process.id + "/-1/configuration", true, false);
                    }
                },
                addData: function(data) {
                    if (self.process) {
                        data.existingId = self.process.id;
                        data.processVersion = self.process.version;
                    }
                    if (self.copyId) {
                        data.copyId = self.copyId;
                    }
                    
                    data.properties = {
                        contextType: data.contextType,
                        workingDir: data.workingDir
                    };
                    
                    data.teamMappings = self.teamSelector.teams;
                },
                onCancel: function() {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                cancelLabel: (self.process === undefined) ? i18n("Cancel") : undefined 
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

            var currentTeams = [];
            if (!!self.existingValues && !!self.existingValues.extendedSecurity && !!self.existingValues.extendedSecurity.teams) {
                currentTeams = self.existingValues.extendedSecurity.teams;
            }
            self.teamSelector = new TeamSelector({
                readOnly: self.readOnly,
                resourceRoleType: "Process",
                noneLabel: i18n("Standard Process"),
                teams: currentTeams
            });
            this.form.addField({
                name: "teams",
                label: i18n("Teams"),
                type: "Text",
                widget: self.teamSelector
            });
            
            var resourceSelect = new ResourceSelector({
                url: bootstrap.restUrl+"resource/resource/tree",
                value: self.existingValues.defaultResourceId,
                isSelectable: function(resource) {
                    return resource.hasAgent;
                }
            });
            this.form.addField({
                name: "defaultResourceId",
                label: i18n("Default Resource"),
                widget: resourceSelect
            });

            this.form.addField({
                name: "workingDir",
                label: i18n("Default Working Directory"),
                type: "Text",
                description: i18n("The default working directory for plugin steps in this process"),
                required: true,
                bidiDynamicSTT: "FILE_PATH",
                value: util.getNamedPropertyValue(self.properties, "workingDir") || "${p:resource/work.dir}/${p:process.name}"
            });
            
            // -- Notification scheme
            var notificationSchemeSelect = new RestSelect({
                disabled: self.readOnly,
                restUrl: bootstrap.restUrl+"notification/notificationScheme",
                value: this.existingValues.notificationSchemeId
            });
            this.form.addField({
                name: "notificationSchemeId",
                label: i18n("Notification Scheme"),
                description: i18n("A notification scheme to use when handling events generated by this process."),
                widget: notificationSchemeSelect
            });

            this.form.placeAt(this.formAttach);
        }
    });
});

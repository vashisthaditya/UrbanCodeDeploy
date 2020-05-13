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
        "js/webext/widgets/RestSelect",
        "js/webext/widgets/Alert",
        "deploy/widgets/security/TeamSelector",
        "deploy/widgets/applicationTemplate/ComponentTagRequirementSelector"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        xhr,
        ColumnForm,
        RestSelect,
        Alert,
        TeamSelector,
        ComponentTagRequirementSelector
) {
    return declare('deploy.widgets.application.EditApplication',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="editApplication">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        showCancel: true,
        /**
         *
         */
        postCreate: function() {
            var self = this;
            self.inherited(arguments);

            self.existingValues = {};
            if (self.applicationTemplate) {
                self.existingValues = self.applicationTemplate;
            }
            else {
                xhr.get({
                    "url": bootstrap.restUrl + "security/teamsWithCreateAction/Application Template",
                    "handleAs": "json",
                    "sync": true,
                    "load": function(data) {
                        var extendedSecurity = {"teams": data};
                        self.existingValues.extendedSecurity = extendedSecurity;
                    }
                });
            }

            self.form = new ColumnForm({
                submitUrl: bootstrap.restUrl+"deploy/applicationTemplate",
                readOnly: self.readOnly,
                showButtons: !self.readOnly,
                postSubmit: function(data) {
                    if (!this.noRedirect) {
                        navBar.setHash("applicationTemplate/" + data.id + "/-1");
                    }

                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                addData: function(data) {
                    if (self.applicationTemplate) {
                        data.existingId = self.applicationTemplate.id;
                    }
                    if (data.notificationSchemeId === "none") {
                        delete data.notificationSchemeId;
                    }

                    data.teamMappings = self.teamSelector.teams;
                },
                onError: function(error) {
                    if (error.responseText) {
                        var wrongNameAlert = new Alert({
                            message: util.escape(error.responseText)
                        });
                    }
                },
                onCancel: function() {
                    if (self.cancelCallback !== undefined) {
                        self.cancelCallback();
                    }
                    else {
                        if (self.callback !== undefined) {
                            self.callback();
                        }
                    }
                },
                validateFields: function(data) {
                    var tagRequirementsArray = data.tagRequirements;
                    var errorMessages = [];

                    tagRequirementsArray.forEach(function(tag){
                        if (tag.number < 0 || tag.number > 999 || tag.number === "") {
                            errorMessages.push(i18n("The Required Component Tag number %s for the %s tag is invalid. Please enter a number between 0 and 999", tag.number, tag.name));
                        }
                    });

                    return errorMessages;
                },
                cancelLabel: self.showCancel ? i18n("Cancel") : null
            });

            self.form.addField({
                name: "name",
                label: i18n("Name"),
                required: true,
                type: "Text",
                value: self.existingValues.name
            });

            self.form.addField({
                name: "description",
                label: i18n("Description"),
                type: "Text",
                value: self.existingValues.description
            });

            var currentTeams = [];
            if (!!self.existingValues && !!self.existingValues.extendedSecurity && !!self.existingValues.extendedSecurity.teams) {
                currentTeams = self.existingValues.extendedSecurity.teams;
            }
            self.teamSelector = new TeamSelector({
                readOnly: self.readOnly,
                resourceRoleType: "Application Template",
                noneLabel: i18n("Standard Application Template"),
                teams: currentTeams
            });
            self.form.addField({
                name: "teams",
                label: i18n("Teams"),
                type: "Text",
                widget: self.teamSelector
            });

            // -- Notification scheme
            var notificationSchemeSelect = new RestSelect({
                disabled: self.readOnly,
                restUrl: bootstrap.restUrl+"notification/notificationScheme",
                value: self.existingValues.notificationSchemeId,
                getLabel: function(item) {
                    return i18n(item.name);
                }
            });
            self.form.addField({
                name: "notificationSchemeId",
                label: i18n("Notification Scheme"),
                description: i18n("A notification scheme to use when handling events generated by applications using this template."),
                widget: notificationSchemeSelect
            });

            self.form.addField({
                name: "enforceCompleteSnapshots",
                label: i18n("Enforce Complete Snapshots"),
                type: "Checkbox",
                description: i18n("Whether this applications using this template should require that a version be given for each component when creating snapshots."),
                value: this.existingValues.enforceCompleteSnapshots
            });

            self.requirementSelector = new ComponentTagRequirementSelector({
                readOnly: this.readOnly,
                value: this.existingValues.tagRequirements
            });
            self.form.addField({
                name: "tagRequirements",
                label: i18n("Required Component Tags"),
                widget: self.requirementSelector,
                description: i18n("Specify which tags the set of components for applications created from this template must be tagged with as well as the number of components for each tag.")
            });

            self.form.placeAt(self.formAttach);
        }
    });
});

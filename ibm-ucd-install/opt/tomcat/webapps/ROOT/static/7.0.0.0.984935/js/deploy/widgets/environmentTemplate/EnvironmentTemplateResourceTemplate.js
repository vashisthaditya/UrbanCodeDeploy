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
        "dijit/form/Button",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/xhr",
        "deploy/widgets/resourceTemplate/ResourceTemplateEditManager",
        "js/webext/widgets/Alert",
        "js/webext/widgets/ColumnForm"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        declare,
        lang,
        xhr,
        ResourceTemplateEditManager,
        Alert,
        ColumnForm
) {
    /**
     *
     */
    return declare('deploy.widgets.environmentTemplate.EnvironmentTemplateResourceTemplate',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="environmentTemplateResources">' +
                '<div data-dojo-attach-point="optionsAttach" style="display:inline-block;" class="environmentTemplateResource-options"></div>' +
                '<div data-dojo-attach-point="errorMessageAttach" style="display: none;" class="pageAlerts">' +
                    '<div class="pageAlert highPriority">' + i18n("You do not have sufficient security permissions. Please contact your server administrator.") + '</div>' +
                '</div>' +
                '<div data-dojo-attach-point="buttonAttach" style="display:inline-block; margin-left: 15px;"></div>' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            var self = this;

            self.showOptions();
            self.showTable();
        },

        /**
         *
         */
        showOptions: function() {
            var self = this;

            self.selectedTemplate = self.environmentTemplate.resourceTemplate;

            self.readOnly = appState.environmentTemplate.version !== appState.environmentTemplate.versionCount
                        || !self.environmentTemplate.security["Edit Basic Settings"];

            self.form = new ColumnForm({
                submitUrl: bootstrap.restUrl + "deploy/environmentTemplate",
                readOnly: self.readOnly,
                showButtons: false,
                postSubmit: function(data) {
                    self.destroyTable();
                    self.showTable();
                },
                addData: function(data) {
                    // Pretend we're saving the entire environment template.
                    self.environmentTemplate.resourceTemplate = data.resourceTemplate;
                    lang.mixin(data, self.environmentTemplate);
                    data.existingId = self.environmentTemplate.id;
                },
                onError: function(error) {
                    if (error.responseText) {
                        var wrongNameAlert = new Alert({
                            message: util.escape(error.responseText)
                        });
                    }
                }
            });

            // Don't show the button or load the table twice initially.
            var initialLoad = true;
            self.form.addField({
                name: "resourceTemplate",
                label: i18n("Resource Template"),
                type: "TableFilterSelect",
                value: self.environmentTemplate.resourceTemplateId,
                url: bootstrap.restUrl + "resource/resourceTemplate",
                onChange: function(value, item) {
                    if (!initialLoad) {
                        self.selectedTemplate = item;
                        self.destroyTable();
                        self.showTable();
                        self.showUpdateTemplateButton();
                    }
                    initialLoad = false;
                }
            });

            self.form.placeAt(self.optionsAttach);
        },

        /**
         *
         */
        showTable: function() {
            var self = this;
            self.errorMessageAttach.style.display = "none";
            // Only get resource template if the user has read permissions for it. Otherwise, print explanatory message.
            xhr.get({
                "url": bootstrap.restUrl + "resource/resourceTemplate/" + self.environmentTemplate.resourceTemplateId,
                "handleAs": "json",
                "sync": true,
                "load": function(data) {
                    self.selectedTemplate = data;

                    self.resourceTemplateEditManager = new ResourceTemplateEditManager({
                        resourceTemplate: self.selectedTemplate
                    });
                    self.resourceTemplateEditManager.placeAt(self.gridAttach);
                },
                "error": function(response, ioArgs) {
                    if (response.status === 403) {
                        self.errorMessageAttach.style.display = "";
                    }
                }
            });
        },

        /**
         *
         */
        destroyTable: function() {
            var self = this;
            if (self.resourceTemplateEditManager) {
                self.resourceTemplateEditManager.destroy();
            }
        },

        /**
         *
         */
        showUpdateTemplateButton: function() {
            var self = this;
            if (!self.updateTemplateButton) {
                self.updateTemplateButton = new Button({
                    label: i18n("Update Resource Template"),
                    showTitle: false,
                    onClick: function() {
                        self.form.submitForm();
                        self.hideUpdateTemplateButton();
                    },
                    baseClass: "dijitButton idxButtonSpecial"
                });

                self.updateTemplateButton.placeAt(self.buttonAttach);
            }
        },

        /**
         *
         */
        hideUpdateTemplateButton: function() {
            var self = this;
            self.updateTemplateButton.destroy();
            self.updateTemplateButton = null;
        }
    });
});
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
        "dijit/_Container",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/xhr",
        "dojo/Deferred",
        "dojo/store/Memory",
        "dojo/store/Observable",
        "dojo/query",
        "dojo/dom-style",
        "dojo/dom-class",
        "dojo/dom-construct",
        "deploy/widgets/firstDayWizard/FirstDayWizardUtil",
        "deploy/widgets/TooltipTitle",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Alert"
        ],
function(
        _TemplatedMixin,
        _Widget,
        _Container,
        declare,
        lang,
        xhr,
        Deferred,
        Memory,
        Observable,
        query,
        domStyle,
        domClass,
        domConstruct,
        FirstDayWizardUtil,
        TooltipTitle,
        ColumnForm,
        Alert
) {
    return declare([_Widget, _TemplatedMixin, _Container], {
        templateString:
            '<div class="fdw-application-page">' +
            '    <div class="fdw-info-column">' +
            '        <div class="fdw-info-text">' +
            '            <div class="fdw-info-title">' + i18n("About Applications") + '</div>' +
            '            <br/>' +
            '            <div data-dojo-attach-point="text1Attach" class="fdw-info-content"></div>' +
            '            <br/><br/>' +
            '            <div data-dojo-attach-point="text2Attach" class="fdw-info-content">' +
            '              <div class="fdw-emphasis2">' + i18n("In this step:") + '</div>' +
            '              <ul><li>' + i18n("Specify basic information about the application.") + '</li></ul>' +
            '            </div>' +
            '        </div>' +
            '    </div>' +
            '    <div class="fdw-control-form-column">' +
            '        <div data-dojo-attach-point="formAttach" id="fdw-application-form"></div>' +
            '    </div>' +
            '</div>',
        duplicateNameError: i18n("The application name you entered already exists. Application names must be unique."),

        postCreate: function() {
            this.inherited(arguments);
            domConstruct.place('<div>' +
                i18n("In UrbanCode Deploy, applications are containers for components that are deployed together. Applications also include processes that deploy and change those components and environments that host the running components.") +
                '</div>', this.text1Attach);

            this.isNameValid = true;
        },

        showForm: function() {
            var self = this;
            domConstruct.empty(this.formAttach);

            this.appForm = new ColumnForm({
                showButtons: false
            });

            this.appForm.placeAt(this.formAttach);

            this.appForm.addField({
                name: "name",
                label: i18n("Name"),
                required: true,
                type: "Text",
                value: this.model.application ? this.model.application.name : "",
                onChange: function(value) {
                    if (value) {
                        self._validateName(value).then(function(data) {
                            var isNameValid = Boolean(data.result);
                            if (isNameValid) {
                                self.isNameValid = true;
                                self.model.application.set("name", value);
                            }
                            else {
                                self.isNameValid = false;
                                var alert = new Alert({
                                    messages: ["",
                                               "",
                                               util.escape(i18n("An application with this name already exists. Application Name: %s", value))]
                                });
                            }
                        });
                    }
                }
            });

            this.appForm.addField({
                name: "description",
                label: i18n("Description"),
                type: "Text",
                value: this.model.application ? this.model.application.description: "",
                onChange: function(value) {
                    self.model.application.set("description", value);
                }
            });

            if (this.model.application && this.model.application.name) {
                this._validateName(this.model.application.name).then(function(data) {
                    self.isNameValid = true;
                }, function(error) {
                    self.isNameValid = false;
                });
            }
        },

        _onShow: function() {
            this.showForm();
            FirstDayWizardUtil.boldLabelsOfRequiredFields();
        },

        _validateName: function(name) {
            var url = bootstrap.restUrl + 'deploy/firstDay/isValidName/APPLICATION/' + encodeURIComponent(name);
            var deferred = new Deferred();
            xhr.get({
                url: url,
                handleAs: "json",
                load: function(data) {
                    deferred.resolve(data);
                },
                error: function(error) {
                    deferred.reject(error);
                }
            });
            return deferred;
        },

        // a return value other than true or [] means that validation failed
        validate: function() {
            var errorMessages = this.appForm.validateRequired();
            if (errorMessages.length === 0) {
                if (!this.isNameValid) {
                    errorMessages = [this.duplicateNameError];
                }
            }
            return errorMessages;
        }
    });
});

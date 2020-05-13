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
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/json",
        "deploy/widgets/environment/EnvironmentConditions",
        "js/webext/widgets/Alert"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        array,
        declare,
        xhr,
        domClass,
        domConstruct,
        JSON,
        EnvironmentConditions,
        Alert
) {
    /**
     *
     */
    return declare('deploy.widgets.application.ApplicationEnvironmentConditions',  [_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="applicationEnvironmentConditions">' +
                '<div class="listTopButtons" data-dojo-attach-point="buttonAttach"></div>' +
                '<div data-dojo-attach-point="listAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            this.environmentConditionBoxes = [];
            this.saveButtonShown = false;

            if (this.application) {
                // Have to check application first so we can load and save conditions based on the
                // application's enviornments if possible
                self.managePermission = this.application.security["Manage Environments"];
                self.putUrl = bootstrap.restUrl + "deploy/application/" + self.application.id + "/environmentConditions";
                self.getUrl = bootstrap.restUrl + "deploy/application/" + this.application.id + "/environments/false";
            }
            else if (this.applicationTemplate) {

                // Conditionally allow editting conditions based on app template version and permissions
                if (this.applicationTemplate.version === this.applicationTemplate.versionCount) {
                    self.managePermission = this.applicationTemplate.security["Manage Environment Templates"];
                }
                else {
                    self.managePermission = false;
                }

                self.putUrl = bootstrap.restUrl + "deploy/applicationTemplate/"
                    + self.applicationTemplate.id + "/environmentConditions";
                self.getUrl = bootstrap.restUrl + "deploy/applicationTemplate/"
                    + self.applicationTemplate.id + "/" + self.applicationTemplate.version
                    + "/environmentTemplates";
            }

            // We shouldn't allow users to update these from the application UI if the
            // conditions are being set by the template.
            if ((!this.application || !this.applicationTemplate) && self.managePermission) {
                this.showSaveButton();
            }

            this.showEnvironments();
        },

        /**
         *
         */
        showSaveButton: function() {
            var self = this;
            this.saveButtonShown = true;
            var saveButton = new Button({
                label: i18n("Save Conditions"),
                showTitle: false,
                onClick: function() {
                    var data = [];
                    array.forEach(self.environmentConditionBoxes, function(box) {
                        if (!box.readOnly) {
                            data.push(box.getValue());
                        }
                    });

                    xhr.put({
                        url: self.putUrl,
                        putData: JSON.stringify(data),
                        load: function() {
                            var saveAlert = new Alert({
                                message: i18n("Conditions saved successfully.")
                            });
                            if (!self.application) {
                                // If we're editting on a template then we need to refresh to
                                // the newest version.
                                navBar.setHash(
                                     "applicationTemplate/"+self.applicationTemplate.id+"/-1/configuration/gates",
                                     false, true);
                            }
                        },
                        error: function(error) {
                            var errorAlert = new Alert({
                                messages: [i18n("Error saving conditions:"),
                                           "",
                                           util.escape(error.responseText)]
                            });
                        }
                    });
                }
            });
            domClass.add(saveButton.domNode, "idxButtonSpecial");
            saveButton.placeAt(this.buttonAttach);
        },

        /**
         *
         */
        showEnvironments: function() {
            var self = this;

            xhr.get({
                url: self.getUrl,
                handleAs: "json",
                load: function(data) {
                    array.forEach(data, function(environmentObject) {
                        var environmentConditionBox = new EnvironmentConditions({
                            environment: environmentObject,
                            application: self.application,
                            applicationTemplate: self.applicationTemplate
                        });
                        environmentConditionBox.placeAt(self.listAttach);
                        self.environmentConditionBoxes.push(environmentConditionBox);

                        // If we an environment not based on a template we need to show the save
                        // button and allow editing of those gates.
                        if (!environmentObject.version  && !environmentObject.templateId
                                && !self.saveButtonShown && self.managePermission) {
                            self.showSaveButton();
                        }

                        domConstruct.create("div", {}, self.listAttach);
                    });
                }
            });
        },

        /**
         * 
         */
        destroy: function() {
            this.inherited(arguments);
        }
    });
});
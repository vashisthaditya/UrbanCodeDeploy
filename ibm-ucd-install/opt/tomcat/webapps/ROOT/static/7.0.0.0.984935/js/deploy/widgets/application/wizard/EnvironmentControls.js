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
        "dijit/Tooltip",
        "dojo/_base/declare",
        "dojo/dom-class",
        "dojo/dom-style",
        "dojo/on",
        "deploy/widgets/application/wizard/EnvironmentModelHelper",
        "deploy/widgets/application/wizard/EnvironmentTemplateOption",
        "deploy/widgets/ModelWidgetList"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Tooltip,
        declare,
        domClass,
        domStyle,
        on,
        EnvironmentModelHelper,
        EnvironmentTemplateOption,
        ModelWidgetList
) {
    /**
     * A widget that is used to create, clone and remove created environments in the Application Wizard.
     *
     * Parameters:
     *     sharedData - Must contain the following:
     *                    + environments
     *                    + environmentTemplates
     */
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div data-dojo-attach-point="environmentControlAttach" class="environment-controls">' +
            '  <span data-dojo-attach-point="titleAttach" class="created-environments-title"></span>' +
            '  <div class="button-container">' +
            '    <div data-dojo-attach-point="addEnvironmentMenuAttach"' +
            '         class="addEnvironmentMenu"' +
            '         style="display:none;">' +
            '    </div>' +
            '    <div data-dojo-attach-point="addButtonAttach" class="icon-button add-button"></div>' +
            '    <div data-dojo-attach-point="cloneButtonAttach" class="icon-button clone-button"></div>' +
            '    <div data-dojo-attach-point="removeButtonAttach" class="icon-button remove-button"></div>' +
            '  </div>' +
            '</div>',

        postCreate: function() {
            var self = this;
            this.inherited(arguments);

            self.modelHelper = new EnvironmentModelHelper(self.sharedData);

            // Only pre-create environments if the user has all necessary permissions
            // This prevents environments from being created in the background
            if (config.data.permissions["Create Environments From Template"]) {
                self.modelHelper.precreateEnvironments();
            }

            on(this.addButtonAttach, 'click', function(e) {
                var display = domStyle.get(self.addEnvironmentMenuAttach, "display");
                if (display === "none") {
                    domStyle.set(self.addEnvironmentMenuAttach, "display", "");
                } else {
                    domStyle.set(self.addEnvironmentMenuAttach, "display", "none");
                }
            });

            on(this.cloneButtonAttach, 'click', function(e) {
                var selectedEnvironment = self._getSelectedEnvironment();
                if (selectedEnvironment !== null) {
                    self.sharedData.environments.query({selected: true}).forEach(function(env) {
                        env.set("selected", false);
                    });
                    self.modelHelper.cloneEnvironment(selectedEnvironment, true);
                }
            });

            on(this.removeButtonAttach, 'click', function(e) {
                var selectedEnvironment = self._getSelectedEnvironment();
                if (selectedEnvironment !== null) {
                    self.modelHelper.removeEnvironment(selectedEnvironment);
                }
            });

            var addToolTip = new Tooltip({
                connectId: [this.addButtonAttach],
                label: i18n('Create an environment from a template'),
                showDelay: 100,
                position: ["above", "before", "below", "after" ]
            });

            var removeToolTip = new Tooltip({
                connectId: [this.removeButtonAttach],
                label: i18n('Delete the selected environment'),
                showDelay: 100,
                position: ["above", "before", "below", "after" ]
            });

            var cloneToolTip = new Tooltip({
                connectId: [this.cloneButtonAttach],
                label: i18n('Duplicate the selected environment'),
                showDelay: 100,
                position: ["above", "before", "below", "after" ]
            });

            this._reflectNumberOfEnvironments();
            this.sharedData.environments.query().observe(function(object, removedFrom, insertedInto) {
                if (removedFrom !== -1 || insertedInto !== -1) {
                    self._reflectNumberOfEnvironments();
                }
            }, false);

            // set up the add environment menu
            new ModelWidgetList({
                model: self.sharedData.environmentTemplates,
                widgetFactory: function(template) {
                    return new EnvironmentTemplateOption({
                        template: template,
                        onSelected: function(selectedTemplate) {
                            domStyle.set(self.addEnvironmentMenuAttach, "display", "none");
                            self.sharedData.environments.query({selected: true}).forEach(function(env) {
                                env.set("selected", false);
                            });
                            self.modelHelper.addEnvironment(selectedTemplate, true);
                        }
                    });
                }
            }).placeAt(this.addEnvironmentMenuAttach);
        },

        _reflectNumberOfEnvironments: function() {
            var envs = this.sharedData.environments.query();
            var numEnvironments = 0;
            if (envs) {
                numEnvironments = envs.length;
            }

            this.titleAttach.textContent = i18n("Environments (%s)", numEnvironments.toString());
            if (numEnvironments === 0) {
                domClass.remove(this.cloneButtonAttach, "clone-button");
                domClass.add(this.cloneButtonAttach, "clone-button-disabled");

                domClass.remove(this.removeButtonAttach, "remove-button");
                domClass.add(this.removeButtonAttach, "remove-button-disabled");
            } else {
                domClass.remove(this.cloneButtonAttach, "clone-button-disabled");
                domClass.add(this.cloneButtonAttach, "clone-button");

                domClass.remove(this.removeButtonAttach, "remove-button-disabled");
                domClass.add(this.removeButtonAttach, "remove-button");
            }
        },

        _getSelectedEnvironment: function() {
            var selectedEnvironments = this.sharedData.environments.query({selected: true});
            if (selectedEnvironments && selectedEnvironments.length > 0) {
                return selectedEnvironments[0];
            }
            return null;
        }

    });
});

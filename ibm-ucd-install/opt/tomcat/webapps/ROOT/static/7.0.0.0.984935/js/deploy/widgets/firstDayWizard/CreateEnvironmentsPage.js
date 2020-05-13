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
        "dojo/_base/array",
        "dojo/store/Memory",
        "dojo/store/Observable",
        "dojo/query",
        "dojo/dom-style",
        "dojo/dom-class",
        "dojo/dom-construct",
        "deploy/widgets/firstDayWizard/FirstDayWizardUtil",
        "deploy/widgets/TooltipTitle",
        "deploy/widgets/environment/EditEnvironment",
        "deploy/widgets/firstDayWizard/Controls",
        "deploy/widgets/firstDayWizard/EnvironmentListEntry",
        "deploy/widgets/ModelWidgetList",
        "js/webext/widgets/Alert",
        "js/webext/widgets/ColumnForm"
        ],
function(
        _TemplatedMixin,
        _Widget,
        _Container,
        declare,
        array,
        Memory,
        Observable,
        query,
        domStyle,
        domClass,
        domConstruct,
        FirstDayWizardUtil,
        TooltipTitle,
        EditEnvironment,
        Controls,
        EnvironmentListEntry,
        ModelWidgetList,
        Alert,
        ColumnForm
) {
    return declare([_Widget, _TemplatedMixin, _Container], {
        templateString:
            '<div class="fdw-CreateEnvironments-page">' +
            '    <div class="fdw-info-column">' +
            '        <div class="fdw-info-text">' +
            '            <div class="fdw-info-title">' + i18n("Create Environments") + '</div>' +
            '            <br/>' +
            '            <div data-dojo-attach-point="text1Attach" class="fdw-info-content"></div>' +
            '            <br/>' +
            '            <div data-dojo-attach-point="text2Attach" class="fdw-info-content"></div>' +
            '            <br/>' +
            '            <div data-dojo-attach-point="text3Attach" class="fdw-info-content">' +
            '              <div class="fdw-emphasis2">' + i18n("In this step:") + '</div>' +
            '              <ul>' +
            '              <li>' + i18n("Define the environments to which this application deploys component artifacts.") + ' (' +
               i18n("In this wizard, you cannot create more environments than the number of available agents.") + ')' + '</li>' +
            '              </ul>' +
            '            </div>' +
            '        </div>' +
            '    </div>' +
            '    <div class="fdw-control-form-column">' +
            '        <div class="fdw-control-column">' +
            '            <div data-dojo-attach-point="controlAttach" class="fdw-control-row"></div>' +
            '            <div data-dojo-attach-point="listAttach" class="fdw-list-column"></div>' +
            '        </div>' +
            '        <div data-dojo-attach-point="formAttach" class="fdw-form-column">' +
            '        </div>' +
            '    </div>' +
            '</div>',
        duplicateNameError: i18n("The environment name you entered already exists. Environment names must be unique."),
        zeroEnvironmentError: i18n("You must create at least one environment before you continue."),
        tooManyEnvironmentsError: i18n("The number of environments cannot exceed the number of agents."),

        postCreate: function() {
            this.inherited(arguments);
            domConstruct.place('<div>' +
                i18n("Environments host a deployed copy of components. Each environment includes hosting resources, such as one or more servers. You specify the resources for each environment on the next page.") +
                '</div>', this.text1Attach);

            domConstruct.place('<div>' +
                i18n("In most cases, you start with development \"sandbox\" environments. Then, when you have a working version of an application, you take a snapshot of the application and move it to testing and production environments. You can base environment names on who has access to them or what work each environment does, such as \"development,\" \"test,\" and \"production.\"") +
                '</div>', this.text2Attach);

            var controls = new Controls({model: this.model,
                                         objType: 'environment',
                                         templateBased: false});
            controls.placeAt(this.controlAttach);

            var self = this;
            this.model.environments.query().observe(function(object, removedFrom, insertedInto) {
                //new environment added, refresh the form
                if (insertedInto !== -1) {
                    self.selectedEnvironment = object;
                    self._setWatch(object);
                    self._refreshForm();
                }
                //no selected environment, empty the form
                if (self.model.environments.query({selected: true}).length === 0) {
                    self.selectedEnvironment = null;
                    self._refreshForm();
                }
            });

            this.model.environments.query().forEach(function(env){
                self._setWatch(env);
            });

            //user should not be allowed to add a new environment until the
            //currently selected one has been properly validated and saved.
            this.model.watch("pre_addAnEnvironment", function(propName, oldValue, newValue) {
                if (newValue) {
                    self.model.pre_addAnEnvironment = false;
                    //if existing selected environment is valid
                    //and check total of agents, number of environments should not
                    //exceed number of agents, add a new environment
                    if (self._validateEnvironment()) {
                        self._saveEnvironment();
                        if ((self.model.agentsTotal !== undefined) &&
                            (self.model.environments.query().length < self.model.agentsTotal)) {
                            self.model.addObj("environment", null, true);
                        } else {
                            var alert = new Alert({
                                messages: [self.tooManyEnvironmentsError]
                            });
                        }
                    }
                }
            });

            //user should not be allowed to select another environment until the
            //currently selected one has been properly validated and saved.
            this.model.watch("pre_selectAnEnvironment", function(propName, oldValue, newValue) {
                if (newValue) {
                    self.model.pre_selectAnEnvironment = false;
                    //if existing selected environment is valid, select the other environment
                    if (self._validateEnvironment()) {
                        self._saveEnvironment();
                        self.model.setSelectedObj("environment", newValue);
                    }
                }
            });

            //EnvironmentListEntry is responsible for building the environment list
            new ModelWidgetList({
                model: this.model.environments,
                widgetFactory: function(env) {
                    return new EnvironmentListEntry({
                        environment: env,
                        onSelected: function(env) {
                            self.model.set("pre_selectAnEnvironment", env);
                        }
                    });
                }
            }).placeAt(this.listAttach);

            this.model.watch("pre_setEnvironmentName", function(propName, oldValue, newValue) {
                if (newValue) {
                    self.model.pre_setEnvironmentName = undefined;
                    var error = self._validateName(newValue.environment, newValue.newName);
                    if (error) {
                        newValue.environment.hasInvalidName = true;
                        var alert = new Alert({
                            messages: ["",
                                       "",
                                       util.escape(error)]
                        });
                    } else {
                        if (newValue.environment.hasInvalidName) {
                            delete newValue.environment.hasInvalidName;
                        }
                        newValue.environment.set("name", newValue.newName);
                    }
                }
            });

            if (this.model.selectedEnvironment) {
                this.selectedEnvironment = this.model.selectedEnvironment;
                this._refreshForm();
            }

        },

        _setWatch: function(env) {
            var self = this;
            env.watch("selected", function(propName, oldValue, newValue) {
                if (newValue === true) {
                    self.selectedEnvironment = env;
                    self._refreshForm();
                }
            });
        },

        _refreshForm: function() {
            domConstruct.empty(this.formAttach);
            this.form = undefined;
            if (this.selectedEnvironment) {
                this.form = new EditEnvironment({mode: "firstDayWizard",
                                                 application: this.model.application,
                                                 environment: this.selectedEnvironment,
                                                 firstDayWizardModel: this.model
                            }).placeAt(this.formAttach);
                FirstDayWizardUtil.boldLabelsOfRequiredFields();
            }
        },

        _validateEnvironment: function() {
            var retVal = true;
            if (this.selectedEnvironment) {
                var userData = this.form.form.getData();
                var validationResults = this.form.form.validateRequired();
                validationResults.concat(this.form.form.validateFields(userData));
                if (validationResults.length > 0) {
                    validationResults = validationResults.map(function(currentValue) {
                        return util.escape(currentValue);
                    });
                    Alert({
                        messages: validationResults
                    });
                    retVal = false;
                }
            }
            return retVal;
        },

        _saveEnvironment: function() {
            if (this.selectedEnvironment) {
                var self = this;
                var props = this.form.form.getData();
                array.forEach(Object.keys(props), function(k) {
                    self.selectedEnvironment.props[k] = props[k];
                    self.selectedEnvironment[k] = props[k];
                });
            }
        },

        _validateName: function(env, newName) {
            var error, dups;
            dups = array.filter(this.model.environments.query(), function(e) {
                if (env.id !== e.id) {
                    return e.name === newName;
                }
            });
            if (dups.length > 0) {
                error = this.duplicateNameError;
            }
            return error;
        },

        //this is called when user is leaving the tab
        //save what we can without validation
        save: function() {
            if (this.selectedEnvironment) {
                this._saveEnvironment();
                this.model.selectedEnvironment = this.selectedEnvironment;
            }
        },

        // a return value other than true or [] means that validation failed
        validate: function() {
            if (this.selectedEnvironment) {
                if (this.selectedEnvironment.hasInvalidName) {
                    Alert({
                        messages: [this.duplicateNameError]
                    });
                    return false;
                }
                if (!this._validateEnvironment()) {
                    return false;
                }
                this._saveEnvironment();
            }
            if (this.model.environments.query().length < 1) {
                Alert({
                    messages: [this.zeroEnvironmentError]
                });
                return false;
            }
            return true;
        }
    });
});

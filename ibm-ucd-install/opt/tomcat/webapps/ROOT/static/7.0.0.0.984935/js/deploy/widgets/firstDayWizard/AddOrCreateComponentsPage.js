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
        "dijit/Dialog",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/array",
        "dojo/_base/xhr",
        "dojo/Deferred",
        "dojo/store/Memory",
        "dojo/store/Observable",
        "dojo/dom-class",
        "dojo/dom-style",
        "dojo/dom-construct",
        "dojo/query",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Alert",
        "deploy/widgets/firstDayWizard/FirstDayWizardUtil",
        "deploy/widgets/TooltipTitle",
        "deploy/widgets/firstDayWizard/Controls",
        "deploy/widgets/firstDayWizard/ComponentListEntry",
        "deploy/widgets/component/EditComponent",
        "deploy/widgets/ModelWidgetList"
        ],
function(
        _TemplatedMixin,
        _Widget,
        _Container,
        Dialog,
        declare,
        lang,
        array,
        xhr,
        Deferred,
        Memory,
        Observable,
        domClass,
        domStyle,
        domConstruct,
        query,
        ColumnForm,
        Alert,
        FirstDayWizardUtil,
        TooltipTitle,
        Controls,
        ComponentListEntry,
        EditComponent,
        ModelWidgetList
) {

    return declare([_Widget, _TemplatedMixin, _Container], {
        templateString:
            '<div class="fdw-application-page">' +
            '    <div class="fdw-info-column">' +
            '        <div class="fdw-info-text">' +
            '            <div class="fdw-info-title">' + i18n("Specify Components") + '</div>' +
            '            <br/>' +
            '            <div data-dojo-attach-point="text1Attach" class="fdw-info-content"></div>' +
            '            <br/>' +
            '            <div data-dojo-attach-point="text2Attach" class="fdw-info-content"></div>' +
            '            <br/>' +
            '            <div data-dojo-attach-point="text3Attach" class="fdw-info-content">' +
            '              <div class="fdw-emphasis2">' + i18n("In this step:") + '</div>' +
            '              <ul>' +
            '              <li>' + i18n("Create components to use in the application.") + '</li>' +
            '              <li>' + i18n("Specify where artifacts for the components are stored.") + '</li>' +
            '              <li>' + i18n("Optionally: Configure advanced settings, including those for source configuration plug-ins.") + '</li>' +
            '              </ul>' +
            '            </div>' +
            '        </div>' +
            '    </div>' +
            '    <div class="fdw-control-form-column">' +
            '        <div class="fdw-control-column">' +
            '            <div data-dojo-attach-point="controlAttach" class="fdw-control-row"></div>' +
            '            <div data-dojo-attach-point="listAttach" class="fdw-list-column"></div>' +
            '        </div>' +
            '        <div data-dojo-attach-point="formAttach" class="fdw-form-column"></div>' +
            '    </div>' +
            '</div>',
        duplicateNameError: i18n("The component name you entered already exists. Component names must be unique."),
        zeroComponentError: i18n("Create at least one component before you continue to the next step."),

        postCreate: function() {
            this.inherited(arguments);
            domConstruct.place('<div>' +
                i18n("Components represent deployable artifacts of an application. UrbanCode Deploy can receive pushed, or published, deployable artifacts from build systems and install them on environments. If required, UrbanCode Deploy can pull in artifacts using source configuration plug-ins.") +
                '</div>', this.text1Attach);

            domConstruct.place('<div>' +
                i18n("For best results, break up deployable artifacts into small components so that you can deploy small pieces of the application independently.") +
                '</div>', this.text2Attach);

            var controls = new Controls({model: this.model,
                                         objType: 'component',
                                         templateBased: false});
            controls.placeAt(this.controlAttach);

            var self = this;
            this.model.components.query().observe(function(object, removedFrom, insertedInto) {
                //new component added, refresh the form
                if (insertedInto !== -1) {
                    self.selectedComponent = object;
                    self._setWatch(object);
                    self._refreshForm();
                }
                //no selected component, empty the form
                if (self.model.components.query({selected: true}).length === 0) {
                    self.selectedComponent = null;
                    self._refreshForm();
                }
            });

            this.model.components.query().forEach(function(comp){
                self._setWatch(comp);
            });

            //user should not be allowed to add a new component until the
            //currently selected one has been properly validated and saved.
            this.model.watch("pre_addAComponent", function(propName, oldValue, newValue) {
                if (newValue) {
                    self.model.pre_addAComponent = false;
                    //if existing selected component is valid, add a new component
                    if (self._validateComponent()) {
                        self._saveComponent();
                        self.model.addObj("component", null, true);
                    }
                }
            });

            //user should not be allowed to select another component until the
            //currently selected one has been properly validated and saved.
            this.model.watch("pre_selectAComponent", function(propName, oldValue, newValue) {
                if (newValue) {
                    self.model.pre_selectAComponent = false;
                    //if existing selected component is valid, select the other component
                    if (self._validateComponent()) {
                        self._saveComponent();
                        self.model.setSelectedObj("component", newValue);
                    }
                }
            });

            //ComponentListEntry is responsible for building the component list
            new ModelWidgetList({
                model: this.model.components,
                widgetFactory: function(comp) {
                    return new ComponentListEntry({
                        component: comp,
                        onSelected: function(comp) {
                            self.model.set("pre_selectAComponent", comp);
                        }
                    });
                }
            }).placeAt(this.listAttach);

            this.model.watch("pre_setComponentName", function(propName, oldValue, newValue) {
                if (newValue) {
                    self.model.pre_setComponentName = undefined;
                    if (newValue.newName) {
                        self._validateName(newValue.component, newValue.newName).then(function(data) {
                            var isNameValid = Boolean(data.result);
                            if (isNameValid) {
                                if (newValue.component.hasInvalidName) {
                                    delete newValue.component.hasInvalidName;
                                }
                                newValue.component.set("name", newValue.newName);
                            }
                            else {
                                newValue.component.hasInvalidName = true;
                                var alert = new Alert({
                                    messages: ["",
                                               "",
                                               util.escape(i18n("A component with this name already exists. Component Name: %s", newValue.newName))]
                                });
                            }
                        });
                    }
                }
            });

            if (this.model.selectedComponent) {
                this.model.setSelectedObj("component", this.model.selectedComponent);
                this.selectedComponent = this.model.selectedComponent;
                this._refreshForm();
            }
        },

        _setWatch: function(comp) {
            var self = this;
            comp.watch("selected", function(propName, oldValue, newValue) {
                if (newValue === true) {
                    self.selectedComponent = comp;
                    self._refreshForm();
                }
            });
        },

        _refreshForm: function() {
            domConstruct.empty(this.formAttach);
            this.form = undefined;
            if (this.selectedComponent) {
                this.form = new EditComponent({mode: "firstDayWizard",
                                               component: this.selectedComponent,
                                               firstDayWizardModel: this.model
                            }).placeAt(this.formAttach);
                FirstDayWizardUtil.boldLabelsOfRequiredFields();
            }
        },

        _validateComponent: function() {
            var retVal = true;
            if (this.selectedComponent) {
                var userData = this.form.form.getData();
                var validationResults = this.form.form.validateRequired();
                validationResults.concat(this.form.form.validateFields(userData));
                if (this.selectedComponent.hasInvalidName) {
                    validationResults.push(this.duplicateNameError);
                }
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

        _saveComponent: function() {
            if (this.selectedComponent) {
                var self = this;
                var props = this.form.form.getData();
                array.forEach(Object.keys(props), function(k) {
                    self.selectedComponent.props[k] = props[k];
                    self.selectedComponent[k] = props[k];
                });
            }
        },

        _validateName: function(comp, newName) {
            var deferred = new Deferred();
            //check name conflicts among newly created components
            var dups = array.filter(this.model.components.query(), function(com) {
                if (comp.id !== com.id) {
                    return com.name === newName;
                }
            });
            if (dups.length > 0) {
                var error = {};
                error.responseText = this.duplicateNameError;
                deferred.reject(error);
            } else {
                var url = bootstrap.restUrl + 'deploy/firstDay/isValidName/COMPONENT/' + encodeURIComponent(newName);
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
            }
            return deferred;
        },

        //this is called when user is leaving the tab
        //save what we can without validation
        save: function() {
            if (this.selectedComponent) {
                this._saveComponent();
                this.model.selectedComponent = this.selectedComponent;
            }
        },

        // a return value other than true or [] means that validation failed
        validate: function() {
            if (this.selectedComponent) {
                if (this.selectedComponent.hasInvalidName) {
                    Alert({
                        messages: [this.duplicateNameError]
                    });
                    return false;
                }
                if (!this._validateComponent()) {
                    return false;
                }
                this._saveComponent();
            }
            if (this.model.components.query().length < 1){
                Alert({
                    messages: [this.zeroComponentError]
                });
                return false;
            }
            return true;
        }
    });
});

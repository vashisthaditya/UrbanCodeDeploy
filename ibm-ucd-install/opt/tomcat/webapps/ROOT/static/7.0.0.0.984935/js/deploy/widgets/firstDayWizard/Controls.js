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
        "dojo/_base/lang",
        "dojo/dom-class",
        "dojo/dom-style",
        "dojo/on",
        "js/webext/widgets/Alert",
        "deploy/widgets/ModelWidgetList"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Tooltip,
        declare,
        lang,
        domClass,
        domStyle,
        on,
        Alert,
        ModelWidgetList
) {
    /**
     * A widget that is used to create, remove a component, process or environment
     * in First-day Wizard
     * @param {WizardModel} model - wizard model
     * @param {string} objType - "component", "process" or "environment"
     * @param {boolean} templateBased - whether object is based on any template
     */
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div data-dojo-attach-point="controlAttach" class="controls">' +
            '  <span data-dojo-attach-point="titleAttach" class="created-objects-title"></span>' +
            '  <div class="button-container">' +
            '    <div data-dojo-attach-point="addMenuAttach"' +
            '         class="add-menu"' +
            '         style="display:none;">' +
            '    </div>' +
            '    <div data-dojo-attach-point="addButtonAttach" class="icon-button add-button"></div>' +
            '    <div data-dojo-attach-point="removeButtonAttach" class="icon-button remove-button"></div>' +
            '  </div>' +
            '</div>',

        postCreate: function() {
            var self = this;
            this.inherited(arguments);

            if (this.objType === "process") {
                this.objStorageName = this.objType + "es";
            } else {
                this.objStorageName = this.objType + "s";
            }

            on(this.addButtonAttach, 'click', function(e) {
                if (self.objType === "process") {
                    self._handleProcessAdd();
                } else if (self.objType === "environment") {
                    self._handleEnvironmentAdd();
                } else if (self.objType === "component") {
                    self._handleComponentAdd();
                }
            });

            on(this.removeButtonAttach, 'click', function(e) {
                var selected = self._getSelected();
                var error;

                if (selected) {
                    if (self.objType === "component"){
                        error = self._checkForUseInAppProcess(selected);
                    }
                    if (!error) {
                        self.model.removeObj(self.objType, selected);
                    } else {
                        Alert({
                            messages: [error]
                        });
                    }
                }
            });

            var toolTipLabel;
            switch (self.objType) {
                case "component":
                    toolTipLabel = i18n("Create a component");
                    break;
                case "process":
                    toolTipLabel = i18n("Create a process");
                    break;
                case "environment":
                    toolTipLabel = i18n("Create an environment");
                    break;
            }
            var addToolTip = new Tooltip({
                connectId: [this.addButtonAttach],
                label: toolTipLabel,
                showDelay: 100,
                position: ["above", "before", "below", "after" ]
            });

            var removeToolTipLabel;
            switch (self.objType) {
                case "component":
                    removeToolTipLabel = i18n("Delete the selected component");
                    break;
                case "process":
                    removeToolTipLabel = i18n("Delete the selected process");
                    break;
                case "environment":
                    removeToolTipLabel = i18n("Delete the selected environment");
                    break;
            }
            var removeToolTip = new Tooltip({
                connectId: [this.removeButtonAttach],
                label: removeToolTipLabel,
                showDelay: 100,
                position: ["above", "before", "below", "after" ]
            });

            this._reflectNumberOfObjects();
            if (this.model[this.objStorageName]) {
                this.model[this.objStorageName].query().observe(function(object, removedFrom, insertedInto) {
                    if (removedFrom !== -1 || insertedInto !== -1) {
                        self._reflectNumberOfObjects();
                    }
                }, false);
            }
        },

        _handleComponentAdd: function() {
            if (this._getSelected()) {
                this.model.set("pre_addAComponent", true);
            } else {
                this.model.addObj(this.objType, null, true);
            }
        },

        _handleEnvironmentAdd: function() {
            if (this._getSelected()) {
                this.model.set("pre_addAnEnvironment", true);
            } else {
                this.model.addObj(this.objType, null, true);
            }
        },

        _handleProcessAdd: function() {
            if (this.model.selectedObjForProcess) {
                if (this.model.selectedObjForProcess.id === this.model.application.id) {
                    this._handleApplicationProcessAdd();
                } else {
                    this._addAProcess();
                }
            } else {
                Alert({
                    messages: [i18n("Please select a component or application first")]
                });
            }
        },

        _handleApplicationProcessAdd: function() {
            if (this._validateComponentProcesses()) {
                this._addAProcess();
            } else {
                Alert({
                    messages: [i18n("Please define all component processes before attempting to define an application process.")]
                });
            }
        },

        _addAProcess: function() {
            if (this._getSelected()) {
                this.model.set("pre_addAProcess", true);
            } else {
                this.model.addObj(this.objType, null, true,
                                  this.model.selectedObjForProcess.id,
                                  this.model.selectedObjForProcess.type);
                this.model.unSelectAllObjs('component');
                this.model.application.set("selected", false);
            }
        },

        _checkForUseInAppProcess: function(component){
            var self = this;
            var processDesignList = self.model.processDesigns;
            if (!processDesignList){
                return;
            }
            var error = i18n("Component cannot be deleted, it is being used in an application process.");

            var designIndex;
            for (designIndex = 0; designIndex < processDesignList.length; designIndex++){
                var design = processDesignList[designIndex];
                if(design.parentObjType === "application"){
                    var stepList = design.children;
                    var stepIndex;
                    for(stepIndex = 0; stepIndex < stepList.length; stepIndex++){
                        var curStep = stepList[stepIndex];
                        if (curStep.componentName && curStep.componentName === component.name){
                            return error;
                        }

                    }
                }
            }
        },

        _validateComponentProcesses: function(){
            var value = true;
            var compList = this.model.components.query();
            var compProcList = this.model.getAllComponentProcesses();
            if (compProcList.length < 1) {
                value = false;
            }
            compList.forEach(function(comp) {
                var matchProcList = compProcList.filter(function(proc){
                    return comp.id === proc.parentObjId;
                });
                if (matchProcList.length < 1) {
                    value = false;
                }
            });
            return value;
        },

        _reflectNumberOfObjects: function() {
            if (this.model[this.objStorageName]) {
                var objs = this.model[this.objStorageName].query();
                var numObjs = 0;
                if (objs) {
                    numObjs = objs.length;
                }

                if (this.objType === "component") {
                    this.titleAttach.textContent = i18n("Components (%s)", numObjs.toString());
                } else if (this.objType === "process") {
                    this.titleAttach.textContent = i18n("Processes (%s)", numObjs.toString());
                } else if (this.objType === "environment") {
                    this.titleAttach.textContent = i18n("Environments (%s)", numObjs.toString());
                }

                if (numObjs === 0) {
                    domClass.remove(this.removeButtonAttach, "remove-button");
                    domClass.add(this.removeButtonAttach, "remove-button-disabled");
                } else {
                    domClass.remove(this.removeButtonAttach, "remove-button-disabled");
                    domClass.add(this.removeButtonAttach, "remove-button");
                }
            }
        },

        _getSelected: function() {
            var selected = this.model[this.objStorageName].query({selected: true});
            if (selected && selected.length > 0) {
                return selected[0];
            }
            return null;
        }

    });
});

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
        "dijit/form/Button",
        "dojo/_base/declare",
        "dojo/_base/array",
        "dojo/_base/lang",
        "dojo/store/Memory",
        "dojo/store/Observable",
        "dojo/query",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/dom-style",
        "dojo/on",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Alert",
        "js/webext/widgets/RadioButtonGroup",
        "dijit/Dialog",
        "deploy/widgets/firstDayWizard/FirstDayWizardUtil",
        "deploy/widgets/TooltipTitle",
        "deploy/widgets/ModelWidgetList",
        "deploy/widgets/componentProcess/ComponentProcessActivities",
        "deploy/widgets/applicationProcess/ApplicationProcessActivities",
        "deploy/widgets/componentProcess/EditComponentProcess",
        "deploy/widgets/applicationProcess/EditApplicationProcess",
        "deploy/widgets/firstDayWizard/ComponentProcessAnchorEntry",
        "deploy/widgets/firstDayWizard/ApplicationProcessAnchorEntry",
        "deploy/widgets/firstDayWizard/ProcessListEntry",
        "deploy/widgets/firstDayWizard/Controls",
        "deploy/widgets/workflow/SavedProcessDiagram"
        ],
function(
        _TemplatedMixin,
        _Widget,
        _Container,
        Button,
        declare,
        array,
        lang,
        Memory,
        Observable,
        query,
        domClass,
        domConstruct,
        domStyle,
        on,
        ColumnForm,
        Alert,
        RadioButtonGroup,
        Dialog,
        FirstDayWizardUtil,
        TooltipTitle,
        ModelWidgetList,
        ComponentProcessActivities,
        ApplicationProcessActivities,
        EditComponentProcess,
        EditApplicationProcess,
        ComponentProcessAnchorEntry,
        ApplicationProcessAnchorEntry,
        ProcessListEntry,
        Controls,
        SavedProcessDiagram
) {
    return declare([_Widget, _TemplatedMixin, _Container], {
        templateString:
            '<div class="fdw-defineProcesses-page">' +
            '    <div class="fdw-info-column">' +
            '        <div class="fdw-info-text">' +
            '            <div class="fdw-info-title">' + i18n("Define Processes") + '</div>' +
            '            <br/>' +
            '            <div data-dojo-attach-point="text1Attach" class="fdw-info-content"></div>' +
            '            <br/>' +
            '            <div data-dojo-attach-point="text2Attach" class="fdw-info-content"></div>' +
            '            <br/>' +
            '            <div data-dojo-attach-point="text3Attach" class="fdw-info-content">' +
            '              <div class="fdw-emphasis2">' + i18n("In this step:") + '</div>' +
            '              <ul>' +
            '                <li>' + i18n("Create a deployment process for each component.") + '</li>' +
            '                <li>' + i18n("Create a deployment process for the application.") + '</li>' +
            '                <li>' + i18n("Optional: Define the automated steps for each process by using the process editor.") + '</li>' +
            '              </ul>' +
            '            </div>' +
            '            <br/>' +
            '        </div>' +
            '    </div>' +
            '    <div class="fdw-control-form-column">' +
            '        <div class="fdw-control-column">' +
            '            <div data-dojo-attach-point="controlAttach" class="fdw-control-row"></div>' +
            '            <div data-dojo-attach-point="listAttach" class="fdw-list-column"></div>' +
            '        </div>' +
            '        <div data-dojo-attach-point="formAttach" class="fdw-form-column">' +
            '            <div data-dojo-attach-point="minifyProcessAttach" class="fdw-minifyProcess"></div>' +
            '        </div>' +
            '    </div>' +
            '</div>',
        duplicateNameError: i18n("The process name you entered already exists. Process names must be unique."),
        atLeastOneDuplicateNameError: i18n("A process name you entered is a duplicate.  Process names must be unique."),
        notEveryComponentHasAProcess: i18n("Every component must have a process that is defined for it."),
        zeroApplicationProcessError: i18n("You must create at least one application process before you can proceed."),

        noProcessDesignErrorPart1: i18n("Each component and the application must have a process flow. You can design the process flow now or later. Complete one of these steps:"),
        noProcessDesignErrorPart2: i18n('Click the "Design the process flow now" radio button, click the process editor window, and then design the process flow.'),
        noProcessDesignErrorPart3: i18n('Click the "Design the process flow later" radio button, and continue.'),

        createProcessButtonLabel: i18n("Create Process Design"),
        modifyProcessButtonLabel: i18n("Modify Process Design"),

            postCreate: function() {
                this.inherited(arguments);

                domConstruct.place('<div>' +
                    i18n("Processes are automated tasks that UrbanCode Deploy runs. Components and applications include different types of processes. Component processes deploy, modify, upgrade, or uninstall the component artifacts. Application processes call the component processes in the order that you specify.") +
                    '</div>', this.text1Attach);
                domConstruct.place('<div>' +
                    i18n("Each process contains steps that define the sequence of these actions, and you use the process editor to define the steps for each process. Before you define an application process, each component that the process will contain, must contain a deployment process.") +
                    '</div>', this.text2Attach);

                var controls = new Controls({objType: 'process',
                                               model: this.model});
                controls.placeAt(this.controlAttach);

                var self = this;
                this.model.processes.query().observe(function(object, removedFrom, insertedInto) {
                    //new process added, refresh the form
                    if (insertedInto !== -1) {
                        self.selectedProcess = object;
                        self._setWatch(object);
                        self._refreshForm();
                    }
                    //no selected component process, empty the form
                    if (self.model.processes.query({selected: true}).length === 0) {
                        self.selectedProcess = undefined;
                        self.model.selectedProcess = undefined;
                        self._refreshForm();
                    }

                    self._updateComponentApplicationProcessList();
                });

                this.model.processes.query().forEach(function(process){
                    self._setWatch(process);
                });

                //user should not be allowed to select a component until the
                //currently selected process has been properly validated and saved.
                this.model.watch("pre_selectAComponentAnchor", function(propName, oldValue, newValue) {
                    if (newValue) {
                        self.model.pre_selectAComponentAnchor = false;
                        //if existing selected process is valid, add a new process
                        if (self._validateProcessForm()) {
                            self._saveProcess();
                            self.model.selectedObjForProcess = {id: newValue.id,
                                                                type: "component"};
                            self.model.unSelectAllObjs('process');
                            self.model.application.set("selected", false);
                            self.model.setSelectedObj('component', newValue);
                            self.model.selectedProcess = undefined;
                            self.selectedProcess = undefined;
                            self._refreshForm();
                        }
                    }
                });

                //user should not be allowed to select the application until the
                //currently selected process has been properly validated and saved.
                this.model.watch("pre_selectAnApplicationAnchor", function(propName, oldValue, newValue) {
                    if (newValue) {
                        self.model.pre_selectAnApplicationAnchor = false;
                        //if existing selected process is valid, add a new process
                        if (self._validateProcessForm()) {
                            self._saveProcess();
                            self.model.selectedObjForProcess = {id: newValue.id,
                                                              type: "application"};
                            self.model.unSelectAllObjs('component');
                            self.model.unSelectAllObjs('process');
                            self.model.application.set("selected", true);
                            self.model.selectedProcess = undefined;
                            self.selectedProcess = undefined;
                            self._refreshForm();
                        }
                    }
                });

                //user should not be allowed to add a new process util the
                //currently selected one has been properly validated and saved.
                this.model.watch("pre_addAProcess", function(propName, oldValue, newValue) {
                    if (newValue) {
                        self.model.pre_addAProcess = false;
                        //if existing selected process is valid, add a new process
                        if (self._validateProcessForm()) {
                            self._saveProcess();
                            self.model.addObj("process", null, true,
                                              self.model.selectedObjForProcess.id,
                                              self.model.selectedObjForProcess.type);
                            self.model.unSelectAllObjs('component');
                            self.model.application.set("selected", false);
                        }
                    }
                });

                //user should not be allowed to select a component process util the
                //currently selected one has been properly validated and saved.
                this.model.watch("pre_selectAProcess", function(propName, oldValue, newValue) {
                    if (newValue) {
                        self.model.pre_selectAProcess = false;
                        //if existing selected process is valid, select the component
                        if (self._validateProcessForm()) {
                            self._saveProcess();
                            self.model.unSelectAllObjs('component');
                            self.model.application.set("selected", false);
                            self.model.selectedObjForProcess = {id: newValue.parentObjId,
                                                                type: newValue.parentObjType};
                            self.model.setSelectedObj("process", newValue);
                            self.selectedProcess = newValue;
                        }
                    }
                });

                //ComponentProcessAnchorEntry is responsible for building the component process list
                new ModelWidgetList({
                    model: this.model.components,
                    widgetFactory: function(comp) {
                        return new ComponentProcessAnchorEntry({
                            component: comp,
                            onSelected: function(comp) {
                                self.model.set("pre_selectAComponentAnchor", comp);
                            }
                        });
                    }
                }).placeAt(this.listAttach);

                //ApplicationProcessAnchorEntry is responsible for building the application process list
                new ApplicationProcessAnchorEntry({
                    application: this.model.application,
                    onSelected: function(app) {
                        self.model.set("pre_selectAnApplicationAnchor", self.model.application);
                    }
                }).placeAt(this.listAttach);

                this.model.watch("pre_setProcessName", function(propName, oldValue, newValue) {
                    if (newValue) {
                        self.model.pre_setProcessName = undefined;
                        var error = self._validateName(newValue.process, newValue.newName);
                        if (error) {
                            newValue.process.hasInvalidName = true;
                            var alert = new Alert({
                                messages: ["",
                                           "",
                                           util.escape(error)]
                            });
                        } else {
                            if (newValue.process.hasInvalidName) {
                                delete newValue.process.hasInvalidName;
                            }
                            newValue.process.set("name", newValue.newName);
                        }
                    }
                });
            },

            _updateComponentApplicationProcessList: function() {
                var self = this;
                //building a list of processes for each component
                self.model.components.query().forEach(function(comp) {
                    var listForComp = self.model.processes.query().filter(function(proc) {
                        return proc.parentObjId === comp.id;
                    });
                    var omForComp = new Observable(new Memory({
                        data: listForComp
                    }));

                    var attachNode = dojo.byId("component-" + comp.id);
                    if (attachNode) {
                        domConstruct.empty(attachNode);

                        new ModelWidgetList({
                            model: omForComp,
                            widgetFactory: function(process) {
                                return new ProcessListEntry({
                                    process: process,
                                    onSelected: function(proc) {
                                        self.model.set("pre_selectAProcess", proc);
                                    }
                                });
                            }
                        }).placeAt(attachNode);
                    }
                });

                //building a list of processes for application
                var listForApp = self.model.processes.query().filter(function(proc) {
                    return proc.parentObjType === "application";
                });
                var omForApp = new Observable(new Memory({
                    data: listForApp
                }));

                var attachNode = dojo.byId("application-process-anchor");
                if (attachNode) {
                    domConstruct.empty(attachNode);

                    new ModelWidgetList({
                        model: omForApp,
                        widgetFactory: function(process) {
                            return new ProcessListEntry({
                                process: process,
                                onSelected: function(proc) {
                                    self.model.set("pre_selectAProcess", proc);
                                }
                            });
                        }
                    }).placeAt(attachNode);
                }
            },

            _setWatch: function(process) {
                var self = this;
                process.watch("selected", function(propName, oldValue, newValue) {
                    if (newValue === true) {
                        self.selectedProcess = process;
                        self._refreshForm();
                    }
                });
            },

            _saveProcess: function() {
                if (this.selectedProcess) {
                    var self = this;
                    var props = this.form.form.getData();
                    array.forEach(Object.keys(props), function(k) {
                        self.selectedProcess.props[k] = props[k];
                        self.selectedProcess[k] = props[k];
                    });
                    self.selectedProcess.props.useDesigner = self.selectedProcess.useDesigner;
                }
            },

            _refreshForm: function() {
                domConstruct.empty(this.formAttach);
                this.form = undefined;
                if (this.selectedProcess) {
                    if (this.model.selectedObjForProcess.type === "component") {
                        this.form = new EditComponentProcess({mode: "firstDayWizard",
                                                              firstDayWizardModel: this.model,
                                                              componentProcess: this.selectedProcess
                        }).placeAt(this.formAttach);
                        this._addProcessDesignerChoice();
                    } else if (this.model.selectedObjForProcess.type === "application") {
                        this.form = new EditApplicationProcess({mode: "firstDayWizard",
                                                                firstDayWizardModel: this.model,
                                                                applicationProcess: this.selectedProcess
                        }).placeAt(this.formAttach);
                        this._addProcessDesignerChoice();
                    }
                    query(".labelsAndValues-labelCell .required").forEach(function(node) {
                        domStyle.set(node.parentNode, "font-weight", "bold");
                    });
                    FirstDayWizardUtil.boldLabelsOfRequiredFields();
                }
            },

            _addProcessDesignerChoice: function() {
                var self = this;
                domConstruct.place('<br/>', this.formAttach);
                var designerChoiceSection = domConstruct.toDom('<div class="fdw-designer-choice-section"></div>');
                domConstruct.place(designerChoiceSection, this.formAttach);
                var radioButtonGroup = new RadioButtonGroup({
                    name:"useDesigner",
                    options: [
                        {
                            label:i18n("Design the process flow now"),
                            value:true
                        },{
                            label:i18n("I'll design the process flow later"),
                            value:false
                        }
                    ],
                    value: this.selectedProcess.useDesigner,
                    disabled:false,
                    enabled:true,
                    onChange: function(use) {
                        self.selectedProcess.useDesigner = use;
                        if (use) {
                            self.processDesignerButton.set("disabled", false);
                            domClass.add(self.processDesignerButton.domNode, "idxButtonSpecial");

                        } else {
                            self.processDesignerButton.set("disabled", true);
                            domClass.remove(self.processDesignerButton.domNode, "idxButtonSpecial");

                        }
                    }
                });
                radioButtonGroup.placeAt(designerChoiceSection);
                var createProcessDesignButton = {
                    label: this.createProcessButtonLabel,
                    showTitle: false,
                    onClick: function() {
                        self._launchDesigner();
                    }
                };

                self.processDesignerButton = new Button(createProcessDesignButton)
                    .placeAt(designerChoiceSection);
                domClass.add(self.processDesignerButton.domNode, "idxButtonSpecial");

                if (this.selectedProcess.useDesigner) {
                    self.processDesignerButton.set("disabled", false);
                    domClass.add(this.processDesignerButton.domNode, "idxButtonSpecial");
                } else {
                    self.processDesignerButton.set("disabled", true);
                    domClass.remove(this.processDesignerButton.domNode, "idxButtonSpecial");
                }

                this._updateLaunchBtnText();
            },

            _launchDesigner: function() {
                if (this.selectedProcess && this.selectedProcess.useDesigner &&
                    this.model.selectedObjForProcess && this._validateProcessForm(true)) {
                    var self = this;
                    var processActivities;
                    var savedDesign;
                    if (this.model.selectedObjForProcess.type === "application") {
                        var appProc = this.selectedProcess;
                        appProc.version = "1";
                        savedDesign = this.model.getProcessDesign("application", appProc);
                        if (savedDesign) {
                            appProc.rootActivity = self._cloneDesign(savedDesign);
                        }
                        processActivities = new ApplicationProcessActivities({
                            mode: "firstDayWizard",
                            application: this.model.application,
                            applicationProcess: appProc,
                            firstDayWizardModel: this.model
                        });
                    } else if (this.model.selectedObjForProcess.type === "component") {
                        var compProc = this.selectedProcess;
                        compProc.version = "1";
                        savedDesign = this.model.getProcessDesign("component", compProc);
                        if (savedDesign) {
                            compProc.rootActivity = self._cloneDesign(savedDesign);
                        }
                        var selectedComponent = this.model.getObjById("component", this.model.selectedObjForProcess.id);
                        processActivities = new ComponentProcessActivities({
                            mode: "firstDayWizard",
                            component: selectedComponent,
                            componentProcess: compProc,
                            firstDayWizardModel: this.model
                        });
                    }
                    var processDialog = new Dialog({
                        id: 'fdw-designer-dialog',
                        title: i18n("Process: %s",this.selectedProcess.name),
                        className: 'fdw-process-dialog',
                        style: 'height:100%; width:100%; top:0; left:0; position:absolute; max-width: 100%; max-height: 100%',
                        closable: true,
                        draggable: false,
                        destroyOnHide: true
                    });

                    var doneButtonAttr = {
                        label: i18n("Done"),
                        showTitle: false
                    };
                    this.designerDoneButton = new Button(doneButtonAttr).placeAt(processDialog.titleNode);
                    domClass.add(this.designerDoneButton.domNode, "fdw-designer-done-btn");

                    this.model.watch("processDesignerSaveBtnState", function(propName, oldValue, newValue) {
                        if (self.designerDoneButton) {
                            if (newValue === "enabled") {
                                domClass.add(self.designerDoneButton.domNode, "idxButtonSpecial");
                                self._addDesignerDoneClickHandler();
                            } else {
                                domClass.remove(self.designerDoneButton.domNode, "idxButtonSpecial");
                                self._removeDesignerDoneClickHandler();
                            }
                        }
                    });

                    var cancelButtonAttr = {
                        label: i18n("Cancel"),
                        showTitle: false
                    };
                    var cancelButton = new Button(cancelButtonAttr).placeAt(processDialog.titleNode);
                    on(cancelButton, 'click', function() {
                        processDialog.destroy();
                        self._updateLaunchBtnText();
                    });

                    processActivities.placeAt(processDialog.containerNode);

                    processDialog.show();
                    domClass.toggle(processDialog.domNode, 'fullScreen', true);
                }
            },

            //Dojo's normal clone doesn't like mixins on objects.
            _cloneDesign: function(design){
                return JSON.parse(JSON.stringify(design));
            },

            _addDesignerDoneClickHandler: function() {
                var self = this;
                this._removeDesignerDoneClickHandler();
                this.designerDoneSignal = on(this.designerDoneButton, 'click', function() {
                    var designerWidget = dijit.byId(dijit.byId('fdw-designer-dialog').containerNode.childNodes[0].id);
                    if (designerWidget) {
                        var toolBar = designerWidget.toolbar;
                        toolBar.onSave();
                        self._updateLaunchBtnText();
                    }
                });
            },

            _removeDesignerDoneClickHandler: function() {
                if (this.designerDoneSignal) {
                    this.designerDoneSignal.remove();
                }
            },

            _updateLaunchBtnText: function() {
                if (this.savedProcessDiagram) {
                    this.savedProcessDiagram.destroy();
                }

                var savedDesign;
                if (this.model.selectedObjForProcess.type === "application") {
                    savedDesign = this.model.getProcessDesign("application", this.selectedProcess);
                } else if (this.model.selectedObjForProcess.type === "component") {
                    savedDesign = this.model.getProcessDesign("component", this.selectedProcess);
                }
                if (savedDesign) {
                    this.processDesignerButton.set("label", this.modifyProcessButtonLabel);
                } else {
                    this.processDesignerButton.set("label", this.createProcessButtonLabel);
                }
            },

            _validateProcessForm: function(formOnly) {
                var retVal = true;
                if (this.selectedProcess) {
                    var userData = this.form.form.getData();
                    var validationResults = this.form.form.validateRequired();
                    if (validationResults.length > 0) {
                        validationResults = validationResults.map(function(currentValue) {
                            return util.escape(currentValue);
                        });
                        Alert({
                            messages: validationResults
                        });
                        retVal = false;
                    }
                    if (!formOnly) {
                        if (this.selectedProcess.useDesigner) {
                            var savedDesign;
                            if (this.model.selectedObjForProcess.type === "application") {
                                savedDesign = this.model.getProcessDesign("application", this.selectedProcess);
                            } else if (this.model.selectedObjForProcess.type === "component") {
                                savedDesign = this.model.getProcessDesign("component", this.selectedProcess);
                            }
                            if (!savedDesign) {
                                Alert({
                                    messages: [this.noProcessDesignErrorPart1,
                                               "",
                                               this.noProcessDesignErrorPart2,
                                               "",
                                               this.noProcessDesignErrorPart3
                                               ]
                            });
                            retVal = false;
                        }
                    }
                }
            }
            return retVal;
        },

        _onShow: function() {
            if (!this.model.selectedProcess && !this.model.selectedObjForProcess) {
                var firstComponent = this.model.getFirstComponent();
                this.model.selectedObjForProcess = {id: firstComponent.id,
                                                    type: "component"};
                this.model.unSelectAllObjs('process');
                this.model.setSelectedObj("component", firstComponent);
                this._refreshForm();
            } else {
                if (this.model.selectedObjForProcess) {
                    if (this.model.selectedProcess) {
                        this.model.setSelectedObj("process", this.model.selectedProcess);
                        this.selectedProcess = this.model.selectedProcess;
                        this._refreshForm();
                    } else {
                        if (this.model.selectedObjForProcess.type === "component") {
                            this.model.unSelectAllObjs('process');
                            this.model.application.set("selected", false);
                            this.model.setSelectedObj('component',
                                this.model.getObjById('component', this.model.selectedObjForProcess.id));
                        } else {
                            this.model.unSelectAllObjs('component');
                            this.model.unSelectAllObjs('process');
                            this.model.application.set("selected", true);
                        }
                    }
                }
            }
            this._updateComponentApplicationProcessList();
        },

        _onHide: function() {
            this.selectedProcess = undefined;
            this.model.selectedProcess = undefined;
            this.model.selectedObjForProcess = undefined;
        },

        _validateName: function(proc, newName) {
            var error, dups;
            dups = array.filter(this.model.processes.query(), function(p) {
                if ((p.parentObjType === proc.parentObjType) &&
                    (p.parentObjId === proc.parentObjId) &&
                    (proc.id !== p.id)) {
                    return p.name === newName;
                }
            });
            if (dups.length > 0) {
                error = this.duplicateNameError;
            }
            return error;
        },

        _validateAllNames: function() {
            var self = this;
            var processList = self.model.processes.query();
            var error;

            var index;
            for (index = 0; index < processList.length; index ++){
                var process = processList[index];
                error = self._validateName(process,process.name);
                if (error) {
                    error = self.atLeastOneDuplicateNameError;
                    return error;
                }
            }

            return error;
        },

        //this is called when user is leaving the tab
        //save what we can without validation
        save: function() {
            if (this.selectedProcess) {
                this._saveProcess();
                this.model.selectedProcess = this.selectedProcess;
            }
        },

        validate: function() {

            if (this._validateAllNames()) {
                Alert({
                    messages: [this.duplicateNameError]
                });
                return false;
            }
            if (this.selectedProcess) {
                if (this.selectedProcess.hasInvalidName) {
                    Alert({
                        messages: [this.duplicateNameError]
                    });
                    return false;
                }
                if (!this._validateProcessForm()) {
                    return false;
                }
                this._saveProcess();
            }
            if (!this.model.isEveryComponentHasAProcess()) {
                Alert({
                       messages: [this.notEveryComponentHasAProcess]
                     });
                return false;
            }
            if (this.model.getAllApplicationProcesses().length < 1) {
                Alert({
                       messages: [this.zeroApplicationProcessError]
                     });
                return false;
            }
            return true;
        }
    });
});

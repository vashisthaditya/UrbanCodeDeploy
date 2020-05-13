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
/*global define, require, sessionSharedData:true, _ */
define(["dijit/focus",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/array",
        "dojo/_base/connect",
        "dojo/dom",
        "dojo/dom-construct",
        "dojo/dom-attr",
        "dojo/dom-style",
        "dojo/dom-class",
        "dojo/dom-geometry",
        "dojo/on",
        "dojo/Deferred",
        "dojo/request/xhr",
        "dojo/Stateful",
        "dojo/store/Memory",
        "dojo/store/Observable",
        "dojox/widget/WizardPane",
        "deploy/widgets/wizard/Wizard",
        "js/webext/widgets/Alert",
        "js/util/blocker/_BlockerMixin",
        "deploy/widgets/firstDayWizard/WizardModel",
        "deploy/widgets/firstDayWizard/ApplicationModel",
        "deploy/widgets/firstDayWizard/CreateApplicationPage",
        "deploy/widgets/firstDayWizard/CreateEnvironmentsPage",
        "deploy/widgets/firstDayWizard/AgentMappingPage",
        "deploy/widgets/firstDayWizard/DefineProcessesPage",
        "deploy/widgets/firstDayWizard/AddOrCreateComponentsPage",
        "deploy/widgets/firstDayWizard/WhatsNextPopup"
],

function (focusUtil,
          declare,
          lang,
          array,
          connect,
          dom,
          domConstruct,
          domAttr,
          domStyle,
          domClass,
          domGeom,
          on,
          Deferred,
          xhr,
          Stateful,
          Memory,
          Observable,
          WizardPane,
          Wizard,
          Alert,
          _BlockerMixin,
          Model,
          ApplicationModel,
          CreateApplicationPage,
          CreateEnvironmentsPage,
          AgentMappingPage,
          DefineProcessesPage,
          AddOrCreateComponentsPage,
          WhatsNextPopup
) {
    return declare([Wizard, _BlockerMixin], {
        hideDisabled: true,
        cancelFunction: function() {
            this._cancel();
        },
        postCreate: function() {
            var self = this;
            this.inherited(arguments);
            this.model = new Model({});

            if (sessionSharedData && sessionSharedData.wizardData) {
                //user returns to this tab, restore data
                this.model.deserialize(sessionSharedData.wizardData);
            } else {
                //brand new wizard from start
                var wizardData = {};

                wizardData.sequenceNum = 0;
                this.determineWizardPages(wizardData);
                this.model.deserialize(wizardData);
                this.model.application = new ApplicationModel({id: this.model.getUniqId()});
                this.model.components = new Observable(new Memory({}));
                this.model.processes = new Observable(new Memory({}));
                this.model.environments = new Observable(new Memory({}));
                this.model.set("furthestEnabledPageIndex", 0);
                this.model.set("selectedPageIndex", 0);
            }

            self.addedPanes = [];
            self.createPanes();
            self.setUpPaginator();

            //return back to the wizard pane user left:
            self.selectChild(self.addedPanes[self.model.selectedPageIndex], false);
        },

        setUpPaginator: function() {
            var self = this;
            //This is a way to monitor what is coming from clicks on the paginator.
            this.model.watch("pre_selectedPageIndex", function(propName, oldValue, newValue) {
                if (newValue > self.model.selectedPageIndex) {
                    var curIndex = self.model.selectedPageIndex;
                    while(curIndex < newValue && self.addedPanes[curIndex]._checkPass()){
                        curIndex++;
                    }
                    if (curIndex === newValue){
                        self.model.set("selectedPageIndex", newValue);
                    } else {
                        self.model.pre_selectedPageIndex = self.model.selectedPageIndex;
                        self.model.set("furthestEnabledPageIndex", curIndex);
                    }
                } else {
                    self.model.set("selectedPageIndex", newValue);
                }
            });

            this.model.watch("selectedPageIndex", function (propName, oldValue, newValue) {
                self.selectChild(self.addedPanes[newValue]);
                if (self.model.furthestEnabledPageIndex < newValue) {
                    self.model.set("furthestEnabledPageIndex", newValue);
                }
            });

            //when user leaves the wizard tab, save serialized data to sessionSharedData
            navBar.setPageChangeNotification(function() {
                if (self.selectedChildWidget.content.save) {
                    self.selectedChildWidget.content.save();
                }
                if (self.model && self.model.application) {
                    if (!sessionSharedData) {
                        sessionSharedData = {};
                    }
                    sessionSharedData.wizardData = self.model.serialize();
                }
                self.destroy();
                return false;
            });
        },

        determineWizardPages: function(wizardData) {
            wizardData.pageIds = [];
            wizardData.pageIds.push(this.model.PageIds.CreateApplication);
            wizardData.pageIds.push(this.model.PageIds.AddOrCreateComponents);
            wizardData.pageIds.push(this.model.PageIds.DefineProcesses);
            wizardData.pageIds.push(this.model.PageIds.CreateEnvironments);
            wizardData.pageIds.push(this.model.PageIds.AgentMapping);

            if (wizardData.pageIds.length > 0) {
                wizardData.selectedPageId = wizardData.pageIds[0];
            }
        },

        createPanes: function() {
            var pageIdToName = _.invert(this.model.PageIds);
            array.forEach(this.model.pageIds, function(pageId) {
                var funcName = "add" + pageIdToName[pageId] + "Pane";
                if (typeof this[funcName] === "function") {
                    this[funcName]();
                } else {
                    console.error(funcName + " is not defined");
                }
            }, this);
        },

        addCreateApplicationPane: function() {
            var createApplicationPage = new CreateApplicationPage({
                model: this.model
            });
            this.newPane({
                content: createApplicationPage,
                doneFunction: undefined
            });
        },

        addAddOrCreateComponentsPane: function() {
            var componentsPage = new AddOrCreateComponentsPage({
                model: this.model
            });
            this.newPane({
                content: componentsPage,
                doneFunction: undefined
            });
        },

        addDefineProcessesPane: function() {
            var processesPage = new DefineProcessesPage({
                model: this.model
            });
            this.newPane({
                content: processesPage,
                doneFunction: undefined
            });
        },

        addCreateEnvironmentsPane: function() {
            var environmentsPage = new CreateEnvironmentsPage({
                model: this.model
            });
            this.newPane({
                content: environmentsPage,
                doneFunction: undefined
            });
        },

        addAgentMappingPane: function() {
            var agentPage = new AgentMappingPage({
                model: this.model
            });
            this.newPane({
                content:agentPage,
                doneFunction: lang.hitch(this,this.saveDataToBackend)
            });
        },

        saveDataToBackend: function() {
            if (this.selectedChildWidget._checkPass()) {
                var postData = this.model.getPostData();

                this.block();
                var self = this;
                var request = xhr.put(bootstrap.restUrl + "deploy/firstDay/createFromWizard", {
                   data: JSON.stringify(postData),
                   headers: {"Content-Type":"application/json"},
                   handleAs: "json"
                });

                request.then(function(data) {
                    if (self.selectedChildWidget.content._onHide) {
                        self.selectedChildWidget.content._onHide();
                    }
                    self.unblock();
                    self._cancel();
                    self.destroy();
                    if (!sessionSharedData) {
                        sessionSharedData = {};
                    }
                    sessionSharedData.wizardAlertsData = data.alerts;
                    // Redirect the UI to the new application.
                    navBar.setHash("application/"+data.id);
                    //Open the what's next popup
                    var wnPopup = new WhatsNextPopup({
                        name:"wn"
                    });
                    wnPopup.open(true);

                    if (!!focusUtil.curNode) {
                      focusUtil.curNode.blur();
                    }
                    focusUtil.focus(wnPopup.domNode);
                }, function (error) {
                    self.unblock();
                    var errorMsg = "An unknown error has occurred";
                    if (error.response && error.response.text) {
                        errorMsg = error.response.text;
                    }

                    var alert = new Alert({
                        message: util.escape(errorMsg)
                    });
                    alert.startup();
                });
            }
        },

        /**
         * A factory function for seating some page of content in a wizard pane.
         * In this case, sets up the shared data, validation logic and the onShow of the wizard
         * pane.
         */
        newPane: function(options) {
            var self = this;
            var paneHeight = '530px';
            var paneStyle = "height: " + paneHeight;
            lang.mixin(options, {
                style: paneStyle,

                onShow: function() {
                    if (lang.isFunction(this.content._onShow)) {
                        this.content._onShow();
                    }
                },

                onHide: function() {
                    if (lang.isFunction(this.content._onHide)) {
                        this.content._onHide();
                    }
                },

                passFunction: function() {
                    // "this" represents the WizardPane!!
                    var validationResult = this.content.validate();
                    return self.interpretValidationResult(validationResult);
                }
            });

            var pane = new WizardPane(options);
            pane.placeAt(this);
            this.addedPanes.push(pane);
            return pane;
        },

        //callback when next button is clicked
        _forward: function() {
            if(this.selectedChildWidget._checkPass()){
                this.model.set("selectedPageIndex", this.model.selectedPageIndex + 1);
            }
        },

        //callback when previous button is clicked
        back: function() {
            this.model.set("selectedPageIndex", this.model.selectedPageIndex - 1);
        },

        _checkButtons: function() {
            this.inherited(arguments);
            var sw = this.selectedChildWidget;
            if (sw) {
                var lastStep = sw.isLastChild;

                if (sw.doneFunction) {
                    this.highlightButton(this.doneButton, "idxButtonSpecial");
                }
                else if (!lastStep) {
                    this.highlightButton(this.nextButton, "idxButtonSpecial");
                }
            }
        },

        _cancel: function() {
            //reset model
            this.model = new Model({});
            if (sessionSharedData && sessionSharedData.wizardData) {
                sessionSharedData.wizardData = undefined;
            }

            //destroy the wizard
            this.destroy();

            //hide paginator and show welcome page
            domStyle.set("first-day-wizard", "display", "none");
            domStyle.set("fdw-welcome", "display", "");
        },

        /**
         * validationResults is expected to be either a boolean representing if validation passed,
         * an error message string, or an array of strings where each string is a separate error
         * message. Anything other than true or [] means that validation failed.
         */
        interpretValidationResult: function(validationResults) {
            switch (typeof validationResults) {
                case "boolean":
                    return validationResults;
                case "string":
                    Alert({
                        message: util.escape(validationResults)
                    });
                    return false;
                case "object":
                    // ECMAScript standard method for testing if an object is an array
                    if (Object.prototype.toString.call(validationResults) === '[object Array]') {
                        if (validationResults.length > 0) {
                            validationResults = validationResults.map(function(currentValue) {
                                return util.escape(currentValue);
                            });
                            Alert({
                                messages: validationResults
                            });
                            return false;
                        }
                        return true;
                    }
                    return false;
            }
        }
    });
});

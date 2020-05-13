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
define([
    "idx/widget/ResizeHandle",
    "dojo/_base/declare",
    "dojox/widget/WizardPane",
    "dojo/dom-class",
    "dojo/on",
    "dojo/query",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/request/xhr",
    "dojo/Stateful",
    "dojo/store/Memory",
    "dojo/store/Observable",
    "deploy/widgets/application/EditApplication",
    "deploy/widgets/application/wizard/ComponentPage",
    "deploy/widgets/application/wizard/EnvironmentPage",
    "deploy/widgets/application/wizard/AgentMappingPage",
    "deploy/widgets/wizard/Wizard",
    "js/webext/widgets/Alert",
    "js/util/blocker/_BlockerMixin"
],

function (
        ResizeHandle,
        declare,
        WizardPane,
        domClass,
        on,
        query,
        array,
        lang,
        xhr,
        Stateful,
        Memory,
        Observable,
        EditApplication,
        ComponentPage,
        EnvironmentPage,
        AgentMappingPage,
        Wizard,
        Alert,
        _BlockerMixin
) {

    /**
     * Private Final Function.
     */
    function _cancelFunction() {
        this._cleanup();
    }

    /**
     * A wizard for creating new applications.  At this point, we're going to assume pretty hard
     * that this will only ever be for creation.  Using this as an "Edit" wizard may require some
     * rethinking/refactoring.
     *
     * We've got two modes.  Form mode, showing only the first page, and wizard mode, which appears
     * on a template selection. Deselecting that template will bring us back to "form mode".
     *
     * Parameters:
     *      (optional) resizeDom: The resizable domNode, if any, containing this wizard.  The
     *                            wizard will attach a resize handle to this domNode. Note that the
     *                            actual resizing will occur on the wizardPane, and the container
     *                            is used only to show the handle.
     */
    return declare([Wizard, _BlockerMixin], {
        // Dojox Wizard settings.
        doLayout: false,
        hideDisabled: true,
        cancelFunction: function() {
            this._cleanup();
        },
        // End Dojox wizard settings.

        saveDraftButtonLabel: i18n("Save as Draft"),
        wizardPaneHeight: 500, // px. This height is the smallest in which the agent list shows up
                               // OK in linux Chrome (i.e. the biggest font size that I know of)

        postCreate: function () {
            var self = this;
            this.inherited(arguments);

            this.addedPanes = [];
            this._initSharedData();

            domClass.add(this.domNode, "applicationWizard");
            this.nextButton.domNode.style["margin-right"] = "25px";

            // We always have a basic application form setup.
            this.newApplicationForm = new EditApplication({
                showButtons: undefined,
                applicationTemplate: this.applicationTemplate,
                onTemplateChange: function(template) {
                    // If we're changing from template to template, unwind and then re-init the wizard.
                    if (!!self.sharedData.template && !!template) {
                        self._initSharedData(template);
                        self._disableWizard();
                        self._setupFullWizard();
                    }
                    // If we're coming from nothing to a template, setup the wizard.
                    else if (!self.sharedData.template && !!template) {
                        self._initSharedData(template);
                        self._setupFullWizard();
                    }
                    // Otherwise, we're just not doing a template, and hence no wizard.
                    else {
                        self._initSharedData();
                        self._disableWizard();
                    }
                },
                callback: function() {
                    // We expect this only to be called if the application form is acting on it's
                    // own. If the full wizard is enabled, this shouldn't be called.
                    self._cleanup();
                }
            });

            this.firstPage = new WizardPane({
                content: this.newApplicationForm,
                doneFunction: lang.hitch(this,this._nonWizardDoneFunction),
                passFunction: function() {
                    // "this" represents the WizardPane!!
                    var validationResult = this.content.validate();
                    return self.interpretValidationResult(validationResult);
                }
            }).placeAt(this);
        },

        /**
         * Setup some state that the pages can use to communicate between themselves.
         */
        _initSharedData: function(template) {
            this.sharedData = {};
            if (template) {
                // this is the ApplicationTemplate
                this.sharedData.template = template;

                this.sharedData.environmentTemplates = new Observable(new Memory({
                    data: template.environmentTemplates.map(function(environmentTemplate) {
                        return Stateful(environmentTemplate);
                    })
                }));

                // The environments have some dojo containerization. The result
                // is an Observable Memory full of AppWizEnvironment objects.
                this.sharedData.environments = new Observable(new Memory({
                    idProperty: "uniqId"
                }));
            }
        },

        _setupFullWizard: function() {
            var self = this;

            var paneHeightPx = this.wizardPaneHeight + "px";

            // Grow the first page.
            this.firstPage.domNode.style.width = "800px";
            this.firstPage.domNode.style.height = paneHeightPx;

            // Change the way buttons are displayed.
            this.hideDisabled = false;
            // No more saving from page 1.
            this.firstPage.doneFunction = undefined;

            /**
             * A factory function for seating some page of content in a wizard pane.
             * In this case, sets up the shared data, validation logic and the onShow of the wizard
             * pane.
             */
            function newPane(options) {
                lang.mixin(options, {
                    onShow: function() {
                        // Monkey-patch wizardpane to trigger the build-in _onShow of the content widget.
                        // Here, we expect "this" to be the WizardPane!!
                        if (lang.isFunction(this.content._onShow)) {
                            this.content._onShow();
                        }
                    },

                    passFunction: function() {
                        // "this" represents the WizardPane!!
                        var validationResult = this.content.validate();
                        return self.interpretValidationResult(validationResult);
                    }
                });

                var pane = new WizardPane(options);
                return pane;
            }

            // Add the component selection page to the wizard.
            this.componentPage = new ComponentPage({
                sharedData: this.sharedData
            });
            // don't allow saving on this page
            this.componentPage.doneFunction = undefined;
            this.addedPanes.push(newPane({
                style:"height: " + paneHeightPx + "; width: 800px;",
                content: this.componentPage
            }));

            // Add the environment selection page to the wizard.
            this.environmentPage = new EnvironmentPage({
                sharedData: this.sharedData
            });
            // don't allow saving on this page
            this.environmentPage.doneFunction = undefined;
            this.addedPanes.push(newPane({
                style:"height:" + paneHeightPx + "; width: 800px;",
                content: this.environmentPage
            }));

            // Add the resource-mapping page to the wizard.
            // This is complicated by the need to attach the resize handle.
            this.agentMappingPage = new AgentMappingPage({
                sharedData: this.sharedData
            });

            this.agentMappingPane = newPane({
                style:"height:" + paneHeightPx + "; width: 1000px;",
                content: this.agentMappingPage,
                doneFunction: lang.hitch(this,this._wizardDoneFunction)
            });
            this.addedPanes.push(this.agentMappingPane);

            // Note that the node to be resized is different from the display location of the
            // handle. (The agent mapping pane and the resizeDom, respectively)
            this.resizeWidget = new ResizeHandle({
                activeResize: true,
                minHeight: this.wizardPaneHeight,
                minWidth: 800,
                targetContainer: this.agentMappingPane.domNode
            }).placeAt(this.resizeDom);

            this.addedPanes.forEach(function(page) {
                page.placeAt(this);
            }, this);

            this.firstPage.isLastChild = false;
            this.resize();
        },

        /**
         * Disables the full wizard, leaving the basic application form.
         */
        _disableWizard: function() {
            // Collapse the first page down around the columnform
            this.firstPage.domNode.style.width = "";
            this.firstPage.domNode.style.height = "";

            // Change the way the buttons work.
            this.firstPage.doneFunction = lang.hitch(this,this._nonWizardDoneFunction);
            this.hideDisabled = true;

            this.addedPanes.forEach(function(page) {
                this.removeChild(page);
            },this);
            this.addedPanes = [];
            this.firstPage.isLastChild = true;
            this.resize();
        },

        /**
         * What happens when you click save when the full wizard is not enabled.
         */
        _nonWizardDoneFunction: function() {
            this.newApplicationForm.submit();
        },

        /**
         * What happens when you click save when the full wizard is enabled.
         */
        _wizardDoneFunction: function() {
            this.block();
            var existingComponents = [];
            this.sharedData.components.query().forEach(function(component) {
                 existingComponents.push(component.id);
            });

            var environments = [];
            this.sharedData.environments.query().forEach(function(env) {
                var envJSON = this.makeEnvironmentJSON(env);
                env.props.query().forEach(function(prop) {
                    var k = 'template/' + prop.name;
                    envJSON[k] = prop.currentValue;
                    if (prop.type === 'HTTP_SELECT' || prop.type === 'HTTP_MULTI_SELECT') {
                        var httpSelectLabelName = k + '/HTTP_SELECT_LABEL';
                        envJSON[httpSelectLabelName] = prop.currentHttpSelectLabel;
                    }
                });

                // Generate the resource data
                envJSON.resources = [];
                Object.keys(env.mappings).forEach(function(parentId) {
                    env.mappings[parentId].forEach(function(agent) {
                        envJSON.resources.push({
                            name: agent.name,
                            agentId: agent.id,
                            path: agent.parentPath
                        });
                    });
                });
                environments.push(envJSON);
            }, this);

            var postData = {
                application: this.newApplicationForm.form.getData(),
                components: {
                    existingComponents: existingComponents,
                    newComponents: [] // TODO
                },
                environments: environments
            };

            this.onSave(postData);
        },

        /**
         * The actual wizard save method.  Potentially override-able.
         */
        onSave: function(postData) {
            var self = this;
            var request = xhr.put(bootstrap.restUrl + "deploy/application/createFromWizard", {
               data: JSON.stringify(postData),
               headers: {"Content-Type":"application/json"},
               handleAs: "json"
            });

            request.then(function(data) {
                self.unblock();
                // Redirect the UI to the new application.
                if (!this.noRedirect) {
                    navBar.setHash("application/"+data.id);
                }
                self._cleanup();
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

            return request;
        },

        /**
         * A wrapper around the user-provided cleanup function
         */
        _cleanup: function() {
            if (lang.isFunction(this.cleanup)) {
                this.cleanup();
            }
        },

        /**
         * Highlight the appropriate buttons.
         *
         * It's not clear if this logic is generic enough to be in Wizard.js, but we need it in
         * this case, at least. Also handles the display of the resize widget.
         */
        _checkButtons: function() {
            this.inherited(arguments);
            var sw = this.selectedChildWidget;
            var lastStep = sw.isLastChild;

            if (sw.doneFunction) {
                this.highlightButton(this.doneButton, "idxButtonSpecial");
            }
            else if (!lastStep) {
                this.highlightButton(this.nextButton, "idxButtonSpecial");
            }

            if (this.resizeWidget) {
                if (sw === this.agentMappingPane) {
                    this.resizeWidget.domNode.style.display = "";
                }
                else {
                    this.resizeWidget.domNode.style.display = "none";
                }
            }
        },

        /**
         * Given an environment template json, make a "submittable" environment json.
         */
        makeEnvironmentJSON: function(env) {
            var environment = {
                "name": env.name,
                "templateId": env.template.id,
                "templateVersion": env.template.version,
                "description": env.description,
                "requireApprovals": env.template.requireApprovals,
                "noSelfApprovals": env.template.noSelfApprovals,
                "exemptProcesses": env.template.exemptProcesses,
                "lockSnapshots": env.template.lockSnapshots,
                "requireSnapshot": env.template.requireSnapshot,
                "color": env.template.color,
                "inheritSystemCleanup": env.template.inheritSystemCleanup,
                "teamMappings": this.generateTeamMappingsForEnvironments(env.template)
            };
            return environment;
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
        },

        generateTeamMappingsForEnvironments: function(envTemp) {
            var result = [];

            array.forEach(this.newApplicationForm.getData().teamMappings, function(mapping) {
                // Decide if we've mapped to this team already.
                var added = array.some(result, function(item) {
                    return item.teamId === mapping.teamId;
                }, this);

                if (!added) {
                    // Force the mapping to use the Standard Environment type.
                    result.push({
                        "resourceRoleId": envTemp.environmentTypeId,
                        "teamId": mapping.teamId
                    });
                }
            }, this);

            return result;
        }
    });
});

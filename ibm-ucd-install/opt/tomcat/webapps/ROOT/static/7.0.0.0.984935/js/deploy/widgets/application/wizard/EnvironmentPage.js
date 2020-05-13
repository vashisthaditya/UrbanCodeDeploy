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
        "dojo/on",
        "dojo/query",
        "dojo/request/xhr",
        "dojo/store/Memory",
        "dojo/store/Observable",
        "deploy/widgets/TooltipTitle",
        "deploy/widgets/application/wizard/EnvironmentOption",
        "deploy/widgets/application/wizard/EnvironmentForm",
        "deploy/widgets/application/wizard/AppWizEnvironment",
        "deploy/widgets/application/wizard/EnvironmentControls",
        "deploy/widgets/ModelWidgetList"
        ],
function(
        _TemplatedMixin,
        _Widget,
        _Container,
        declare,
        array,
        on,
        query,
        xhr,
        Memory,
        Observable,
        TooltipTitle,
        EnvironmentOption,
        EnvironmentForm,
        AppWizEnvironment,
        EnvironmentControls,
        ModelWidgetList
) {
    /**
     * A wizard page for the selection of environments, to the satisfaction of an application template.
     *
     * Parameters:
     *      sharedData: A plain-old object.
     *          A shared namespace for communication between wizard pages.
     */
    return declare([_Widget, _TemplatedMixin, _Container], {
        templateString:
            '<div class="environmentPage wizardFullPage">' +
            '  <div data-dojo-attach-point="callToAction" class="callToAction">' +
            '  </div>' +
            '  <div data-dojo-attach-point="columnsAttach" class="columns">' +
            '    <div class="created-environments-column">' +
            '      <div data-dojo-attach-point="environmentControlsAttach" class="created-environments-controls"></div>' +
            '      <div data-dojo-attach-point="createdEnvironmentsListAttach" class="created-environments-list"></div>' +
            '    </div>' +
            '    <div data-dojo-attach-point="environmentColumnFormAttach" class="create-environment-form-column">' +
            '        <div data-dojo-attach-point="formAttach"></div>' +
            '    </div>' +
            '  </div>' +
            '  <!-- begin yes env permission no env tmpls -->' +
            '  <div class="pageAlerts">' +
            '    <div data-dojo-attach-point="yesEnvPermNoEnvTmplAttach" class="pageAlert lowPriority">' +
            '      <h1 class="msgtitle">' +
                     i18n("You cannot create environments for this application now.") +
            '      </h1> ' +
            '      <p class="description">'+
                     i18n("The application template does not contain environment templates.") +
            '      </p>' +
            '      <h2 class="solutionheader">' +
                     i18n("Solutions") +
            '      </h2>' +
            '      <ul class="listheader">' +
            '          <li class="solutionoptions">' +
                         i18n("You can create environments after you save this application. To create an environment, from within the application, click Environments > Create Environment. After you define the environment, define base resources by opening the environment and clicking Add Base Resources.") +
            '          </li>' +
            '          <li class="solutionoptions">' +
                         i18n("You can request that environment templates be added to the application template.") +
            '          </li>' +
            '          <li class="solutionoptions">' +
                         i18n("If you expected to create environments during creation, confirm that you selected the correct application template.") +
            '          </li>' +
            '      </ul>' +
            '    </div>' +
            '  </div>' +
            '  <!-- end yes env permission no env tmpls -->' +
            '  <!-- begin no env permission no env tmpls -->' +
            '  <div class="pageAlerts">' +
            '    <div data-dojo-attach-point="noEnvPermNoEnvTmplAttach" class="pageAlert lowPriority">' +
            '      <h1 class="msgtitle">' +
                     i18n("You cannot create environments for this application now.") +
            '      </h1> ' +
            '      <p class="description">'+
                     i18n("Your role does not have the permissions to create environments, and the application template does not contain environment templates.") +
            '      </p>' +
            '      <h2 class="solutionheader">' +
                     i18n("Solutions") +
            '      </h2>' +
            '      <ul class="listheader">' +
                       i18n("For permissions") +
            '          <li class="solutionoptions">' +
                         i18n("You can ask administrator to grant your role the permissions that are required to create an environment while using this application template.") +
            '          </li>' +
            '          <li class="solutionoptions">' +
                         i18n("You can request that environment templates be added to the application template.") +
            '          </li>' +
            '      </ul>' +
            '      <ul class="listheader">' +
                       i18n("For environment templates (You must request permission to create an environment while using application templates.)") +
            '          <li class="solutionoptions">' +
                         i18n("You can create environments after you save this application. To create an environment, from within the application, click Environments > Create Environment. After you define the environment, define base resources by opening the environment and clicking Add Base Resources.") +
            '          </li>' +
            '          <li class="solutionoptions">' +
                         i18n("You can request that environment templates be added to the application template.") +
            '          </li>' +
            '          <li class="solutionoptions">' +
                         i18n("If you expected to create environments during creation, confirm that you selected the correct application template.") +
            '          </li>' +
            '      </ul>' +
            '    </div>' +
            '  </div>' +
            '  <!-- end no env permission no env tmpls -->' +
            '  <!-- begin no env permission yes env tmpls -->' +
            '  <div class="pageAlerts">' +
            '    <div data-dojo-attach-point="noEnvPermYesEnvTmplAttach" class="pageAlert lowPriority">' +
            '      <h1 class="msgtitle">' +
                     i18n("You cannot create environments for this application now.") +
            '      </h1> ' +
            '      <p class="description">'+
                     i18n("Your role does not have the permissions that are needed to create environments during application creation.") +
            '      </p>' +
            '      <h2 class="solutionheader">' +
                     i18n("Solutions") +
            '      </h2>' +
            '      <ul class="listheader">' +
            '          <li class="solutionoptions">' +
                         i18n("You can ask your administrator to grant your role the permissions that are required to create an environment while using this application template.") +
            '          </li>' +
            '      </ul>' +
            '    </div>' +
            '  </div>' +
            '  <!-- end no env permission yes env tmpls -->' +
            '</div>',

        postCreate: function() {
            var self = this;
            this.inherited(arguments);

            var title = new TooltipTitle({
                titleText : i18n("Create the environments to use in this application"),
                tooltipText : "<div class='wizard-environment-page-tooltip'>" +
                i18n("An environment is a collection of resources to which you deploy the components of an application. If you deploy the application to multiple stages, such as development and production, create an environment for each stage.") +
                "<br/><br/>" +
                i18n("During application creation, the environments that you create are based on only the displayed environment templates, and you  can create multiple environments that are based on these templates. After  you complete this wizard, if your role  has permission,  you can add more environments to the application.") +
                "<br/><br/>" +
                i18n("The environment template might contain  environment properties, which are a type of environment variable. If these properties are required, you must provide values for each property before you proceed.") +
                "<br/><br/>" +
                i18n("You can duplicate an environment. For example, if two  quality assurance environments require several identical environment properties, you can duplicate the  environment after you provide the property values.") +
                "</div>"
            });

            title.placeAt(this.callToAction);

            // The environment templates in the application template need their propdefs. Let's update that.
            var id = this.sharedData.template.id;
            var version = this.sharedData.template.version;
            // linked=true return related resourceTemplates so we can check if there are permission issues
            var url = bootstrap.restUrl + "deploy/applicationTemplate/" + id + "/" + version + "/environmentTemplates?linked=true";
            var request = xhr.get(url, {
                handleAs: "json",
                query: {
                    extended: true,
                    linked: true
                }
            });

            request.then(function(data) {
                // Update the template environment templates.  Recall from ApplicationWizard that
                // sharedData.environmentTemplates is a dojo/Memory
                var environmentTemplates = self.sharedData.environmentTemplates;
                data.forEach(function(environmentTemplate) {
                    var id = environmentTemplates.getIdentity(environmentTemplate);
                    // If no resource template is associated with an environment template
                    // this means user has permission issues, remove it from available
                    // environmentTemplates memory store.
                    if (environmentTemplate.hasOwnProperty("resourceTemplate")) {
                        var existing = environmentTemplates.get(id);
                        existing.set(environmentTemplate);
                    } else {
                        environmentTemplates.remove(id);
                    }
                },this);

                self._initWidgets();
            });
        },

        _hasEnvironmentTemplates: function() {
            var retVal = false;
            if (this.sharedData.environmentTemplates &&
                this.sharedData.environmentTemplates.query().length > 0) {
                retVal = true;
            }
            return retVal;
        },

        _canCreateEnvironment: function() {
            var retVal = false;
            if (config.data.permissions["Create Environments From Template"]) {
                retVal = true;
            }
            return retVal;
        },

        /**
         * The functions which handles what happens when the pane is shown,
         * and what to make visible.
         */
        _onShow: function() {
            if (this._canCreateEnvironment()) {
                if (this._hasEnvironmentTemplates()) {
                    dojo.style(this.columnsAttach, "display", "");
                    dojo.style(this.noEnvPermNoEnvTmplAttach, "display", "none");
                    dojo.style(this.noEnvPermYesEnvTmplAttach, "display", "none");
                    dojo.style(this.yesEnvPermNoEnvTmplAttach, "display", "none");
                } else {
                    dojo.style(this.callToAction, "display", "none");
                    dojo.style(this.yesEnvPermNoEnvTmplAttach, "display", "");
                    dojo.style(this.noEnvPermNoEnvTmplAttach, "display", "none");
                    dojo.style(this.noEnvPermYesEnvTmplAttach, "display", "none");
                    dojo.style(this.columnsAttach, "display", "none");
                }
            } else {
                dojo.style(this.callToAction, "display", "none");
                if (this._hasEnvironmentTemplates()) {
                    dojo.style(this.noEnvPermYesEnvTmplAttach, "display", "");
                    dojo.style(this.noEnvPermNoEnvTmplAttach, "display", "none");
                    dojo.style(this.yesEnvPermNoEnvTmplAttach, "display", "none");
                    dojo.style(this.columnsAttach, "display", "none");
                } else {
                    dojo.style(this.noEnvPermNoEnvTmplAttach, "display", "");
                    dojo.style(this.yesEnvPermNoEnvTmplAttach, "display", "none");
                    dojo.style(this.noEnvPermYesEnvTmplAttach, "display", "none");
                    dojo.style(this.columnsAttach, "display", "none");
                }
            }
        },

        /**
         * An initialization function.  Should only be called once in the lifetime of the widget.
         */
        _initWidgets: function() {
            var self = this;

            new EnvironmentControls({
                sharedData: self.sharedData
            }).placeAt(this.environmentControlsAttach);

            new ModelWidgetList({
                model: self.sharedData.environments,
                widgetFactory: function(env) {
                    return new EnvironmentOption({
                        environment: env,
                        onSelected: function(environment) {
                            self.sharedData.environments.query({selected: true}).forEach(function(env) {
                                if (env.get("uniqId") !== environment.get("uniqId")) {
                                    env.set("selected", false);
                                }
                            });
                        }
                    });
                }
            }).placeAt(this.createdEnvironmentsListAttach);

            new EnvironmentForm({
                sharedData: this.sharedData
            }).placeAt(this.formAttach);
        },

        // a return value other than true or [] means that validation failed
        validate: function() {
            var baseErrorMsg = i18n("Provide required property values in the following ");
            var errorMessages = [];
            var erroredEnvs = [];
            this.sharedData.environments.query().forEach(function(env) {
                env.get("props").query().forEach(function(prop) {
                    var error = prop.get("error");
                    if (error !== "") {
                        if (array.indexOf(erroredEnvs, env.name) === -1) {
                            erroredEnvs.push(env.name);
                        }
                    }
                });
            });
            if (erroredEnvs.length > 0) {
                if (erroredEnvs.length === 1) {
                    errorMessages.push(baseErrorMsg + i18n("environment:"));
                } else {
                    errorMessages.push(baseErrorMsg + i18n("environments:"));
                }
                array.forEach(erroredEnvs, function(env) {
                    errorMessages.push(" - " + env);
                });
            }

            return errorMessages;
        }
    });
});

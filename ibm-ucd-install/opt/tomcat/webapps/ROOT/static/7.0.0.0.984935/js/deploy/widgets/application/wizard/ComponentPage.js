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
        "dojo/store/Memory",
        "dojo/store/Observable",
        "deploy/widgets/TooltipTitle",
        "deploy/widgets/application/wizard/AppWizardComponentSelector"
        ],
function(
        _TemplatedMixin,
        _Widget,
        _Container,
        Dialog,
        declare,
        Memory,
        Observable,
        TooltipTitle,
        AppWizardComponentSelector
) {
    /**
     * A wizard page for the selection of components, to the satisfaction of an application template.
     *
     * Parameters:
     *      sharedData: A plain-old object.
     *          A shared namespace for communication between wizard pages.  Should include an
     *          applicationtemplate json at .template
     */
    return declare([_Widget, _TemplatedMixin, _Container], {
        templateString:
            '<div class="wizardFullPage">' +
            '  <div data-dojo-attach-point="callToAction" class="callToAction"></div>' +
            '  <!-- begin no permission no component tags -->' +
            '  <div class="pageAlerts">' +
            '    <div data-dojo-attach-point="noPermissionNoTagsAttach" class="pageAlert lowPriority">' +
            '      <h1 class="msgtitle">' +
                     i18n("You cannot specify components for this application now.") +
            '      </h1> ' +
            '      <p class="description">'+
                     i18n("Your role does not have the permissions to add components to an application, and the application template does not contain component tags.") +
            '      </p>' +
            '      <h2 class="solutionheader">' +
                     i18n("Solutions") +
            '      </h2>' +
            '      <ul class="listheader solutionoptionscontainer">' +
                     i18n("For permissions") +
            '          <li class="solutionoptions">' +
                         i18n("You can ask your administrator to grant your role the permissions that are required to add components to an application.") +
            '          </li>' +
            '      </ul>' +
            '      <ul class="listheader">' +
                       i18n("For component tags (You must request permission to add components to an application.)") +
            '          <li class="solutionoptions">' +
                         i18n("You can add components after you save this application.") +
            '          </li>' +
            '          <li class="solutionoptions">' +
                         i18n("You can request that component tags be added to the application template.") +
            '          </li>' +
            '          <li class="solutionoptions">' +
                         i18n("If you expected to specify components for this application during creation, confirm that you selected the correct application template.") +
            '          </li>' +
            '      </ul>' +
            '    </div>' +
            '  </div>' +
            '  <!-- end no permission no component tags --> ' +
            '  <!-- begin yes permission no component tags -->' +
            '  <div class="pageAlerts">' +
            '    <div data-dojo-attach-point="yesPermissionNoTagsAttach" class="pageAlert lowPriority">' +
            '      <h1 class="msgtitle">' +
                     i18n("You cannot specify components for this application now.") +
            '      </h1> ' +
            '      <p class="description">'+
                     i18n("The application template does not contain component tags.") +
            '      </p>' +
            '      <h2 class="solutionheader">' +
                     i18n("Solutions") +
            '      </h2>' +
            '      <ul class="listheader">' +
            '          <li class="solutionoptions">' +
                         i18n("You can add components after you save this application.") +
            '          </li>' +
            '          <li class="solutionoptions">' +
                         i18n("You can request that component tags be added to the application template.") +
            '          </li>' +
            '          <li class="solutionoptions">' +
                         i18n("If you expected to specify components for this application during creation, confirm that you selected the correct application template.") +
            '          </li>' +
            '      </ul>' +
            '    </div>' +
            '  </div>' +
            '  <!-- end yes permission no component tags -->' +
            '  <!-- begin no permission yes component tags -->' +
            '  <div class="pageAlerts">' +
            '    <div data-dojo-attach-point="noPermissionYesTagsAttach" class="pageAlert lowPriority">' +
            '      <h1 class="msgtitle">' +
                     i18n("You cannot specify components for this application now.") +
            '      </h1> ' +
            '      <p class="description">'+
                     i18n("Your role does not have the permissions to add components to an application.") +
            '      </p>' +
            '      <h2 class="solutionheader">' +
                     i18n("Solutions") +
            '      </h2>' +
            '      <ul class="listheader">' +
            '          <li class="solutionoptions">' +
                         i18n("You can ask your administrator to grant your role the permissions that are required to add components to an application.") +
            '          </li>' +
            '      </ul>' +
            '    </div>' +
            '  </div>' +
            '  <!-- end no permission yes component tags -->' +
            '</div>',

        postCreate: function() {
            this.inherited(arguments);
            var title = new TooltipTitle({
                titleText : i18n("Select components to deploy in this application."),
                tooltipText : "<div class='wizard-component-page-tooltip'>" +
                i18n("An application is a collection of components. Components are deployable items  and the processes that are required to deploy them to an environment.  Applications often contain multiple components, and you might use the same component in multiple applications.") +
                "<br/><br/>" +
                i18n("During application creation, you populate the application with a specific number of components that contain the  displayed tags. You can add existing components or create components. If you add components, they must contain the specified tag. If you create components, you must create them from templates that contain the tag. The total number of added and created components must meet the requirements that are specified for each tag.") +
                "<br/><br/>" +
                i18n("If you create a component, you must create a deployment process for the component.") +
                "</div>"
            });
            title.placeAt(this.callToAction);
        },

        _hasPermission: function() {
            var retVal = false;
            if (config.data.permissions["Manage Components"] &&
                config.data.permissions["View Components"]) {
                retVal = true;
            }
            return retVal;
        },

        _hasTag: function() {
            var retVal = false;
            if (this.sharedData.template &&
                this.sharedData.template.tagRequirements.length > 0) {
                retVal = true;
            }
            return retVal;
        },

        _onShow: function() {
            // Re-render if the template has changed. Otherwise rely on existing widgets to take care of things.
            if (this.template && this.template.name === this.sharedData.template.name) {
                return;
            }
            if (this._hasPermission()) {
                if (this._hasTag()) {
                    dojo.style(this.noPermissionNoTagsAttach, "display", "none");
                    dojo.style(this.yesPermissionNoTagsAttach, "display", "none");
                    dojo.style(this.noPermissionYesTagsAttach, "display", "none");
                } else {
                    dojo.style(this.callToAction, "display", "none");
                    dojo.style(this.yesPermissionNoTagsAttach, "display", "");
                    dojo.style(this.noPermissionNoTagsAttach, "display", "none");
                    dojo.style(this.noPermissionYesTagsAttach, "display", "none");
                }
            } else {
                dojo.style(this.callToAction, "display", "none");
                if (this._hasTag()) {
                    dojo.style(this.noPermissionYesTagsAttach, "display", "");
                    dojo.style(this.yesPermissionNoTagsAttach, "display", "none");
                    dojo.style(this.noPermissionNoTagsAttach, "display", "none");
                } else {
                    dojo.style(this.noPermissionNoTagsAttach, "display", "");
                    dojo.style(this.yesPermissionNoTagsAttach, "display", "none");
                    dojo.style(this.noPermissionYesTagsAttach, "display", "none");
                }
            }

            this.template = this.sharedData.template;

            // A single model of components is shared across the subwidgets.  In this way, a widget
            // selected in one place may appear in multiple other places.
            this.sharedData.components = new Observable(new Memory({
                idProperty:"id"
            }));

            // Reset the widgets
            this.getChildren().forEach(function(widget) {
                if (widget.declaredClass !== "deploy.widgets.TooltipTitle") {
                    widget.destroy();
                }
            });

            if (this._hasPermission()) {
                this.template.tagRequirements.forEach(function(componentRequirement) {
                    var componentSelector = new AppWizardComponentSelector({
                        tagRequirement: componentRequirement,
                        components: this.sharedData.components
                    });

                    this.addChild(componentSelector);
                },this);
            }
        },

        // a return value other than true or [] means that validation failed
        validate: function() {
            var errorMessages = [];
            this.getChildren().forEach(function(child) {
                if (child.declaredClass !== "deploy.widgets.TooltipTitle") {
                    if (!child.isRequirementSatisfied()) {
                        errorMessages.push(child.getRequirementDescriptionWithTagName());
                    }
                }
            });

            return errorMessages;
        }
    });
});

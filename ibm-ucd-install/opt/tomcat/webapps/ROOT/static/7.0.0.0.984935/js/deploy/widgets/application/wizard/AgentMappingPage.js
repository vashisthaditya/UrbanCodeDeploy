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
        "dijit/layout/ContentPane",
        "dijit/layout/BorderContainer",
        "dijit/form/TextBox",
        "dijit/Tooltip",
        "dojo/_base/declare",
        "dojo/store/Memory",
        "dojo/store/Observable",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/dom-style",
        "dojo/on",
        "dojo/mouse",
        "js/webext/widgets/table/TreeTable",
        "deploy/widgets/tag/Tagger",
        "deploy/widgets/filter/TagFilter",
        "deploy/widgets/TooltipTitle",
        "deploy/widgets/application/wizard/AgentMappingTargetTree",
        "deploy/widgets/ModelWidgetList"
        ],
function(
        _TemplatedMixin,
        _Widget,
        ContentPane,
        BorderContainer,
        TextBox,
        Tooltip,
        declare,
        Memory,
        Observable,
        domConstruct,
        domClass,
        domStyle,
        on,
        mouse,
        TreeTable,
        Tagger,
        TagFilter,
        TooltipTitle,
        AgentMappingTargetTree,
        ModelWidgetList
) {

    /**
     * A wizard page for the selection of environments, to the satisfaction of an application template.
     *
     * Parameters:
     *      sharedData: A plain-old object.
     *          A shared namespace for communication between wizard pages.
     */
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="agentMappingPage wizardFullPage">' +
            '  <div data-dojo-attach-point="callToAction" class="callToAction">' +
            '  </div>' +
            '  <div class="columns" data-dojo-attach-point="columnsAttach">' +
            '    <div class="agentsColumn">' +
            '      <div data-dojo-attach-point="agentsColumnHeader" class="columnHeader">' + i18n("Agents") + '</div>' +
            '      <div class="columnInstructions">' +
                     i18n("To find agents, use the search boxes. Drag agents to the agent prototypes for each environment.") +
            '      </div>' +
            '      <div data-dojo-attach-point="agentsAttach" class="agentsAttach"></div>' +
            '    </div>' +
            '    <div class="environmentsColumn">' +
            '      <div data-dojo-attach-point="environmentsColumnHeader" class="columnHeader">' + i18n("Environments") + '</div>' +
            '      <div data-dojo-attach-point="environmentsAttach" class="environmentsAttach"></div>' +
            '    </div>' +
            '  </div>' +
            '  <div style="display:none">' +
                 i18n('Confirm that the permissions are correctly set for the roles that are used to create applications from this template. For more information about these permissions, open the documentation and search for "Permissions reference for using application templates."') +
            '  </div>' +
            '  <!-- begin yes map permission no env -->' +
            '  <div class="pageAlerts">' +
            '    <div data-dojo-attach-point="yesMapPermNoEnvAttach" class="pageAlert lowPriority">' +
            '      <h1 class="msgtitle">' +
                     i18n("You cannot map agents to environments now.") +
            '      </h1> ' +
            '      <p class="description">'+
                     i18n("The application does not contain environments.") +
            '      </p>' +
            '      <h2 class="solutionheader">' +
                     i18n("Solutions") +
            '      </h2>' +
            '      <ul class="listheader">' +
            '          <li class="solutionoptions">' +
                         i18n("You can add agents to the base resources after you save the application and create environments. To map an agent, from within the application, open the environment. Select the base resource that must contain an agent, and then click Actions > Add Agent and select the agent.") +
            '          </li>' +
            '          <li class="solutionoptions">' +
                         i18n("If you expected to specify environments for this application during creation, confirm that you selected the correct application template.") +
            '          </li>' +
            '      </ul>' +
            '    </div>' +
            '  </div>' +
            '  <!-- end yes resource permission no env -->' +
            '  <!-- begin no map permission no env -->' +
            '  <div class="pageAlerts">' +
            '    <div data-dojo-attach-point="noMapPermNoEnvAttach" class="pageAlert lowPriority">' +
            '      <h1 class="msgtitle">' +
                     i18n("You cannot map agents to environments now.") +
            '      </h1> ' +
            '      <p class="description">'+
                     i18n("Your role does not have the permissions to create or map resources for the environments, and the application does not contain environments.") +
            '      </p>' +
            '      <h2 class="solutionheader">' +
                     i18n("Solutions") +
            '      </h2>' +
            '      <ul class="listheader">' +
                       i18n("For permissions") +
            '          <li class="solutionoptions">' +
                         i18n("You can ask your administrator to grant your role the permissions that are needed to create or map resources for the environments.") +
            '          </li>' +
            '      </ul>' +
            '      <ul class="listheader">' +
                       i18n("For environments (You must request permission to create resources for environments.)") +
            '          <li class="solutionoptions">' +
                         i18n("You can add agents to the base resources after you save the application and create environments. To map an agent, from within the application, open the environment. Select the base resource that must contain an agent, and then click Actions > Add Agent and select the agent.") +
            '          </li>' +
            '          <li class="solutionoptions">' +
                         i18n("You can request that environment templates be added to the application template.") +
            '          </li>' +
            '          <li class="solutionoptions">' +
                         i18n("If you expected to specify environments for this application during creation, confirm that you selected the correct application template.") +
            '          </li>' +
            '      </ul>' +
            '    </div>' +
            '  </div>' +
            '  <!-- end no resource permission no env -->' +
            '  <!-- begin no resource permission yes env -->' +
            '  <div class="pageAlerts" >' +
            '    <div data-dojo-attach-point="noMapPermYesEnvAttach" class="pageAlert lowPriority">' +
            '      <h1 class="msgtitle">' +
                     i18n("You cannot map agents to environments now.") +
            '      </h1> ' +
            '      <p class="description">'+
                     i18n("Your role does not have the permissions that are needed to create or map resources for the environments.") +
            '      </p>' +
            '      <h2 class="solutionheader">' +
                     i18n("Solutions") +
            '      </h2>' +
            '      <ul class="listheader">' +
            '          <li class="solutionoptions">' +
                         i18n("You can ask your administrator to grant your role the permissions that are needed to create or map resources for the environments.") +
            '          </li>' +
            '      </ul>' +
            '    </div>' +
            '  </div>' +
            '  <!-- end no resource permission yes env -->' +
            '</div>',

        postCreate: function() {
            this.inherited(arguments);

            var title = new TooltipTitle({
                titleText : i18n("Add agents to the resource tree for each environment."),
                tooltipText : "<div class='wizard-agent-mapping-page-tooltip'>" +
                i18n("An agent is software that runs deployment processes. Each environment contains a resource tree that describes the  structure of its resources. Resources include the computers that you deploy components to and the agents and components themselves.") +
                "<br/><br/>" +
                i18n("The environment templates in an application template contain resource templates that specify the resource tree. Because resource templates are applied to multiple environments, they often contain agent prototypes and component tags instead of individual agents and components.") +
                "<br/><br/>" +
                i18n("You assign agents to agent prototypes.  If an agent prototype is assigned component tags, the agent that you assign runs processes for the components that contain  those tags.") +
                "</div>"
            });
            title.placeAt(this.callToAction);

            this._initDnDTrees();
        },

        /**
         * The dungeon master. Inits the agent list, and the Target tree widgets. Should only need
         * be called once, after which the model logic will guide showing and hiding of
         * environment resource template widgets.
         */
        _initDnDTrees: function() {
            var self = this;

            // This object is provided to everywhere involved in drag-and-drop.  It's a shared state. See "onDrop"
            this.crossWidgetDnDState = {};

            // init Agent list
            this.agentList = new TreeTable({
                serverSideProcessing: true,
                url: bootstrap.restUrl + "agent",
                orderField: "name",
                //tableConfigKey: "agentList",
                selectorField: "id",
                columns: [this.getNameColumn()],
                hideExpandCollapse: true,
                // Hiding the pagination results in loading EVERYTHING, so we "show" pagination
                // and hide the footer.
                hidePagination: false,
                hideFooter: true,
                selectable: false,
                draggable: true,
                copyOnly: true,
                onDrop: function(sources, target, node) {
                    // The two TreeTables that are the source and dest of the drag and drop each
                    // know half of the story, because reasons.  We put our half of the info in.
                    if (sources && sources.length > 0) {
                        self.crossWidgetDnDState.sources = sources;
                    }
                },
                // Eliminate the usual headings.
                drawHeadings: function() {},
                onDisplayTable: function() {
                    self.agentsColumnHeader.innerText = "Agents (" + this.totalRecords + ")";
                }
            });
            this.agentList.placeAt(this.agentsAttach);

            // Init Environment widgets.
            // We don't *really* need a ModelWidgetList here anymore, but it's not hurting anyone.
            this.modelWidgetList = new ModelWidgetList({
                model: this.sharedData.environments,
                //query:
                widgetFactory: function(environment) {
                    return new AgentMappingTargetTree({
                        crossWidgetDnDState: self.crossWidgetDnDState,
                        environment: environment
                    });
                }
            });
            this.modelWidgetList.placeAt(this.environmentsAttach);
        },

        /**
         * Shamefully copied from AgentList.js :(
         */
        getNameColumn: function() {
            var self = this;
            return {
                name: i18n("Name"),
                formatter: function(item, value, cell) {
                    cell.style.position = "relative";

                    var result = domConstruct.create("div", {
                        "class": "inlineBlock"
                    });

                    var agentSpan = document.createElement("span");
                    agentSpan.innerHTML = item.name.escape();
                    result.appendChild(agentSpan);
                    domClass.add(agentSpan, "inlineBlock");
                    domConstruct.place(agentSpan, result);
                    if (item.description) {
                        on(agentSpan, mouse.enter, function() {
                            Tooltip.show(util.escape(item.description), this);
                        });
                        on(agentSpan, mouse.leave, function() {
                            Tooltip.hide(this);
                        });
                    }

                    var tagger = new Tagger({
                        objectType: "Agent",
                        item: item,
                        callback: function() {
                            self.agentList.refresh();
                        }
                    });
                    tagger.placeAt(result);

                    return result;
                },
                orderField: "name",
                filterField: "name",
                filterType: "custom",
                getRawValue: function(item) {
                    return item.name;
                },
                getFilterFields: function() {
                    var result = [];

                    result.push(new TextBox({
                        name: "name",
                        "class": "filter",
                        style: { "width": "45%" },
                        placeHolder: i18n("Agent Name"),
                        type: "like"
                    }));

                    result.push(new TagFilter({
                        name: "tags",
                        "class": "filter",
                        style: { width: "45%" },
                        placeHolder: i18n("Tags"),
                        type: "eq"
                    }));

                    return result;
                }
            };
        },

        validate: function() {
            // no validation needed
            return true;
        },

        _hasPermission: function() {
            var retVal = false;
            if (config.data.permissions["Map to Environments"]) {
                retVal = true;
            }
            return retVal;
        },

        _hasEnvironment: function() {
            var retVal = false;
            if (this.sharedData &&
                this.sharedData.environments &&
                this.sharedData.environments.query().length > 0) {
                retVal = true;
            }
            return retVal;
        },

        _onShow: function() {
            if (this._hasPermission()) {
                if (this._hasEnvironment()) {
                    var numEnvironments = this.sharedData.environments.query().length;
                    this.environmentsColumnHeader.innerText = "Environments (" + numEnvironments + ")";
                    dojo.style(this.callToAction, "display", "");
                    dojo.style(this.columnsAttach, "display", "");
                    dojo.style(this.noMapPermNoEnvAttach, "display", "none");
                    dojo.style(this.noMapPermYesEnvAttach, "display", "none");
                    dojo.style(this.yesMapPermNoEnvAttach, "display", "none");
                } else {
                    dojo.style(this.yesMapPermNoEnvAttach, "display", "");
                    dojo.style(this.callToAction, "display", "none");
                    dojo.style(this.columnsAttach, "display", "none");
                    dojo.style(this.noMapPermNoEnvAttach, "display", "none");
                    dojo.style(this.noMapPermYesEnvAttach, "display", "none");
                }
            } else {
                if (this._hasEnvironment()) {
                    dojo.style(this.noMapPermYesEnvAttach, "display", "");
                    dojo.style(this.callToAction, "display", "none");
                    dojo.style(this.columnsAttach, "display", "none");
                    dojo.style(this.noMapPermNoEnvAttach, "display", "none");
                    dojo.style(this.yesMapPermNoEnvAttach, "display", "none");
                } else {
                    dojo.style(this.noMapPermNoEnvAttach, "display", "");
                    dojo.style(this.callToAction, "display", "none");
                    dojo.style(this.columnsAttach, "display", "none");
                    dojo.style(this.noMapPermYesEnvAttach, "display", "none");
                    dojo.style(this.yesMapPermNoEnvAttach, "display", "none");
                }
            }
        }
    });
});

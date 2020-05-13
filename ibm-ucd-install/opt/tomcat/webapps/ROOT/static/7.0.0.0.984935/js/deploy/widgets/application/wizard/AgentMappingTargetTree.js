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
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/dom-attr",
        "dojo/dom-class",
        "dojo/dom-style",
        "dojo/dom-geometry",
        "dojo/dom-construct",
        "dojo/on",
        "deploy/widgets/Formatters",
        "deploy/widgets/tag/Tagger",
        "js/webext/widgets/table/TreeTable",
        "js/webext/widgets/color/Color"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        lang,
        domAttr,
        domClass,
        domStyle,
        domGeom,
        domConstruct,
        on,
        Formatters,
        Tagger,
        TreeTable,
        Color
) {
    /**
     * The target tree for agent assignments in the application wizard.
     *
     * Parameters:
     *     environment:
     *         The AppWizEnvironment object that this widget should reflect.
     *     crossWidgetDnDState:
     *         Shared state for Drag 'n Drop.  See "onDrop"
     */
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="agentMappingTargetTree">'+
            '  <div data-dojo-attach-point="environmentNameContainer" class="environment-name-container">' +
            '    <span data-dojo-attach-point="environmentName" class="environment-name"></span>' +
            '  </div>' +
            '  <div data-dojo-attach-point="resourcesGrid"></div>'+
            '</div>',

        USETHISSOMEDAYMAYBE: i18n("Drag agents here"),

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            if (!self.environment.mappings) {
                self.environment.mappings = {};
            }

            this.setName();
            this.environment.watch("name", function(propName, oldValue, newValue) {
                self.setName();
            });

            this.setDescription();
            this.environment.watch("description", function(propName, oldValue, newValue) {
                self.setDescription();
            });

            this.setColor();
            this.setupTree();
            this.environment.watch("template", function(propName, oldValue, newValue) {
                self.environment.mappings = {};
                self.setColor();
                self.setupTree();
            });

        },

        setName: function() {
            this.environmentName.textContent = this.environment.name;
        },

        setDescription: function() {
            var description = this.environment.get("description");
            if (description) {
                domAttr.set(this.environmentNameContainer, "title", util.escape(description));
            }
        },

        setColor: function() {
            var environmentColorObject = Color.getColorOrConvert(this.environment.get("template").get("color"));
            if (!environmentColorObject.standard && environmentColorObject.fallback){
                environmentColorObject = Color.getColor(environmentColorObject.fallback);
            }
            var environmentColor = environmentColorObject.value;
            var environmentTint = util.getTint(environmentColor, 0.25);

            if (environmentColorObject.light){
                domClass.add(this.domNode, "light-colored-environment");
            }
            if (util.isDarkColor(environmentColor)){
                domClass.add(this.domNode, "dark-colored-environment");
            }
            domStyle.set(this.environmentNameContainer, "backgroundColor", environmentColor);
        },

        setupTree: function() {
            var self = this;

            domConstruct.empty(this.resourcesGrid);

            var url = bootstrap.restUrl +
                "resource/resourceTemplate/" +
                this.environment.get("template").get("resourceTemplateId") +
                "/resources";

            var treeOptions = {
                url: url,
                xhrMethod: "POST",
                serverSideProcessing: false,
                orderField: "name",
                columns: [this.getNameColumn()],
                draggable: true,
                selectable: false,
                hideExpandCollapse: true,
                hidePagination: true,
                hideFooterLinks: true,
                expandRoots: true,
                suppressDefaultOnDrop: true,
                canDragItem: function(item) {
                    return false;
                },
                canDropOnItem: function(sources, target) {
                    // Ensure the target is an agent Prototype and that the source(s) haven't been mapped to this prototype yet.

                    var canDrop = false;
                    var existingMappings;
                    if (self._isAgentPrototype(target) && target.parent) {
                        canDrop = true;
                        existingMappings = self.environment.mappings[target.parent.id];
                    }
                    if (Array.isArray(existingMappings) && existingMappings.length > 0) {
                        // In reality, there will usually only be one source, but we handle the many-sources case.
                        canDrop = sources.every(function(source) {
                            return existingMappings.every(function(agentData) {
                                return (agentData.id !== source.id);
                            });
                        });
                    }

                    return canDrop;
                },
                onDrop: function(sources, target, copy) {
                    if (!target) {
                        return;
                    }
                    var treeTable = this; // Because "self" is the wrapping widget

                    // Wait until the other tree puts the agent ("sources") in shared state.
                    setTimeout(function() {
                        var sources = self.crossWidgetDnDState.sources;
                        var parentId = target.parent.id;
                        var mappings = self.environment.mappings;
                        if (!mappings[parentId]) {
                            mappings[parentId] = [];
                        }

                        // Add the agent to the list of agents for this prototype
                        sources.forEach(function(source) {
                            // Due do a bug where (treetable?) allows bad drops, we might get
                            // sources that already exist in the target.  Let's ignore those.
                            var sourceAlreadyExists = mappings[parentId].some(function(existing) {
                                return existing.id === source.id;
                            });
                            if (sourceAlreadyExists) {
                                return;
                            }

                            // Shallow copy should be good enough.
                            var agentData = lang.mixin({},source);
                            mappings[parentId].push(agentData);
                            agentData.parentPath = target.parent.path;
                        });

                        treeTable.loadTable();
                    }, 100);
                },
                getChildUrl: function(item) {
                    return self.getChildUrl(item);
                },
                hasChildren: function(item) {
                    return item.hasChildren;
                },
                // Eliminate the usual headings.
                drawHeadings: function() {}
            };
            this.grid = new TreeTable(treeOptions);
            this.grid.placeAt(this.resourcesGrid);
        },

        getChildUrl: function(item) {
            return bootstrap.restUrl +
                "resource/resourceTemplate/" +
                this.environment.get("template").get("resourceTemplateId") +
                "/resources/" +
                item.id +
                "/children";
        },

        /**
         * Function responsible for generating the name column formatter for this tree
         */
        getNameColumn: function() {
            var self = this;

            return {
                name: i18n("Name"),
                formatter: function(item, value, cell) {
                    var result = domConstruct.create("div", {
                        "class": "inlineBlock"
                    });

                    var resourceName = Formatters.resourceNonLinkFormatter(item, true);
                    domClass.add(resourceName, "inlineBlock");
                    domConstruct.place(resourceName, result);
                    self.showTags(item, result);

                    if (self._isAgentPrototype(item) && item.parent) {
                        var assignedAgents = self.environment.mappings[item.parent.id];
                        if (assignedAgents) {
                            assignedAgents.forEach(function(agent) {
                                agent.agent = true;  // To fool the formatter.
                                var agentDiv = Formatters.resourceNonLinkFormatter(agent, true);
                                domClass.add(agentDiv, "assignedAgent");
                                // Make the agent removable
                                var delSpan = domConstruct.toDom('<span class="del">×</span>');
                                on(delSpan, "click", function() {
                                    var agentIndex = assignedAgents.indexOf(agent);
                                    assignedAgents.splice(agentIndex, 1);
                                    domConstruct.destroy(agentDiv);
                                });
                                domConstruct.place(delSpan, agentDiv);
                                domConstruct.place(agentDiv, result);
                            });
                        }
                    }

                    return result;
                },
                getRawValue: function(item) {
                    return item.path;
                }
            };
        },

        /**
         * Add a tagger widget to a resource.  Also sets self.tagger, which is later used for bulk imports.
         */
        showTags: function(item, result) {
            var self = this;
            self.tagger = new Tagger({
                objectType: "Resource",
                allowTagAdd: false,
                item: item,
                callback: function() {
                    self.grid.refresh();
                }
            });
            self.tagger.placeAt(result);
        },

        _isAgentPrototype: function(item) {
            // Ideally, we could say item.prototype, but that doesn't seem to be viable, for
            // reasons unclear. Instead, we just see if "Agent Prototype" is the last thing in the
            // path.  This is brittle.
            return !!(item.path.match("Agent Prototype[/]?$"));
        }
    });
});

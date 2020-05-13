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
/*global define, require, Set */

define([
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dijit/_Container",
        "dijit/form/Button",
        "dijit/form/TextBox",
        "dijit/Dialog",
        "dojo/_base/declare",
        "dojo/_base/array",
        "dojo/_base/xhr",
        "dojo/dom-geometry",
        "dojo/dom",
        "dojo/keys",
        "dojo/query",
        "dojo/on",
        "dojo/Deferred",
        "dojo/store/Memory",
        "dojo/store/Observable",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/dom-style",
        "dojo/dnd/Source",
        "dojox/form/CheckedMultiSelect",
        "deploy/widgets/TooltipTitle",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Alert",
        "d3/d3"
        ],
function(
        _TemplatedMixin,
        _Widget,
        _Container,
        Button,
        TextBox,
        Dialog,
        declare,
        array,
        xhr,
        domGeom,
        dom,
        keys,
        query,
        on,
        Deferred,
        Memory,
        Observable,
        domClass,
        domConstruct,
        domStyle,
        Source,
        CheckedMultiSelect,
        TooltipTitle,
        ColumnForm,
        Alert,
        d3
) {
    /**
     * welcome page
     *
     * Parameters:
     *      model: A plain-old object.
     */
    return declare([_Widget, _TemplatedMixin, _Container], {
        templateString:
            '<div class="fdw-AgentMapping-page">' +
            '    <div class="fdw-info-column">' +
            '        <div class="fdw-info-text">' +
            '            <div class="fdw-info-title">' + i18n("Map Components to Agents") + '</div>' +
            '            <br/>' +
            '            <div data-dojo-attach-point="text1Attach" class="fdw-info-content"></div>' +
            '            <br/>' +
            '            <div data-dojo-attach-point="text21Attach" class="fdw-info-content"></div>' +
            '            <br/>'+
            '            <div data-dojo-attach-point="text22Attach" class="fdw-info-content"></div>' +
            '            <br/>'+
            '            <div data-dojo-attach-point="text23Attach" class="fdw-info-content"></div>' +
            '            <br/>'+
            '            <div data-dojo-attach-point="text3Attach" class="fdw-info-content">' +
            '              <div class="fdw-emphasis2">' + i18n("In this step:") + '</div>' +
            '              <ul>' +
            '              <li>' + i18n("Drag an agent to one environment, and choose components to map to the agent.") + '</li>' +
            '              </ul>' +
            '            </div>' +
            '        </div>' +
            '    </div>' +
            '    <div class="fdw-svg-mapping-widget">' +
            '        <div class="fdw-svg-mapping-widget-title">'+
            '            <div class="fdw-mapping-agent-title fdw-mapping-title" data-dojo-attach-point="fdwMappingAgentTitleTextAttach"></div>'+
            '            <div class="fdw-mapping-environment-title fdw-mapping-title" id="fdwMapEnvTitle" data-dojo-attach-point="fdwMappingEnvTitleTextAttach"></div>'+
            '        </div>' +
            '        <br/>' +
            '        <div class="fdw-svg" id="fdw-agent-mapping-svg-container" data-dojo-attach-point="mappingWidgetAttach"></div>' +
            '        <div data-dojo-attach-point="fdwAgentFilterAttach"></div>' +
            '    </div>' +
            '</div>',

        notAllComponentsMappedError: i18n("In each environment that you create, all components must be mapped before you can save the application. You can map all components within one agent or map them with a combination of agents."),

        agentHeight: 30,
        agentWidth: "20%",
        envWidth: "65%",
        environmentHeight: 40,
        envOffset: 280,

        leftLibrary:
        {
            "attachPoint": ".agent-group-rect",
            "target": "#fdw-unmapped-agentGroup",
            "parent": "#unmapped-agent-group-container",
            "handle": "left-Handle",
            "savedScrollY": 0
        },
        rightLibrary:
        {
            "attachPoint": ".env-group-rect",
            "target": "#fdw-agentMapping-rightSide",
            "parent": "#env-group-container",
            "handle": "right-Handle",
            "savedScrollY": 0
        },

        leftY: 0,
        rightY: 0,

        _calcAgentOffset: function(){
            var self = this;
            return 90;
        },

        _calcCompOffset: function(){
            var self = this;
            return 180;
        },

        selectedEnv: null,
        selectedAgent: null,
        selectedComponent: null,
        selectedSide:null,
        agentColor: "#FFFFFF",

        triangleData: [
            {"x":10, "y":10}, {"x":10, "y":30},
            {"x":10, "y":30}, {"x":20, "y":20},
            {"x":20, "y":20}, {"x":10, "y":10}
        ],

        triangleSmallerData: [
            {"x":10, "y":2}, {"x":10, "y":22},
            {"x":10, "y":22}, {"x":20, "y":12},
            {"x":20, "y":12}, {"x":10, "y":2}
        ],

        lineFunction: d3.line()
            .x(function(d) { return d.x; })
            .y(function(d) { return d.y; }),

        postCreate: function() {
            this.inherited(arguments);
            domConstruct.place('<div>' +
                i18n("Agents are installed on the servers that host components of an application. Agents manage the servers, download component artifacts, and run processes. An agent must run on each host server.") +
                '</div>', this.text1Attach);

            domConstruct.place('<div>' +
                i18n("To drag an agent, hover the cursor over the agent name, click and hold, and move the agent name to the line that includes the target environment.") +
                '</div>', this.text21Attach);

            domConstruct.place('<div>' +
                i18n("To delete an agent from an environment, hover over the agent name, and click the red x to the right of the name.") +
                '</div>', this.text22Attach);

            domConstruct.place('<div>' +
                i18n("To add or remove components from the agent, click the agent name and select or clear the associated text boxes.") +
                '</div>', this.text23Attach);

            this._setUpAgentListDeferred = this._setUpAgentList();
        },

        startup: function() {
            var self = this;
            this.model.environments.query().observe(function(object, removedFrom, insertedInto) {
                if (insertedInto !== -1) {
                    self._setWatchEnv(object);
                }
                if (removedFrom !== -1) {
                    self._removeAgentsFromEnvironment(object);
                }
            });
            this.model.environments.query().forEach(function(env){
                self._setWatchEnv(env);
            });

            this.model.components.query().observe(function(object, removedFrom, insertedInto){
                if (removedFrom!==-1){
                    self._removeComponentFromAgents(object);
                }
                self._initWidget();
            });

            this.model.watch("agents", function(propName, oldValue, newValue) {
                self._initWidget();
            });

            var agentFilterTextBox = new TextBox({
                name: "agentFilter",
                value: "",
                placeHolder: i18n("filter")
            }, self.fdwAgentFilterAttach);
            domClass.add(agentFilterTextBox.domNode, "agent-filter");

            dojo.addClass(agentFilterTextBox.domNode, "agent-filter");

            on(agentFilterTextBox, "keyup", function(evt){
                if (evt.key === "Enter"){
                    self._setUpAgentListDeferred = undefined;
                    self._setUpAgentListDeferred = self._setUpAgentList(agentFilterTextBox.get("value"));
                    self._initWidget();
                }
            });
        },

        validate: function() {
            var self = this;
            var value = false;
            if (this._evaluateEnvAgents() === self.model.environments.query().length){
                value = true;
            } else {
                var alert = new Alert({
                    messages: [this.notAllComponentsMappedError]
                });
            }
            return value;
        },

        _calcExpandedChildren: function(element) {
            var self = this;
            var value = 0;
            if (element.expanded) {
                if (element.children && element.children.length > 0) {
                    value += element.children.length;
                    var i;
                    for(i = 0 ; i < element.children.length; i++) {
                        value += self._calcExpandedChildren(element.children[i]);
                    }
                }
            }
            return value;
        },

        _findItemIndexByName: function(list, name) {
            var index = -1;
            var i;
            for (i = 0; i <list.length; i++) {
                if(list[i].name === name) {
                    index = i;
                }
            }
            return index;
        },

        _findItemIndexById: function(list, id) {
            var index = -1;
            var i;
            for (i=0; i<list.length; i++) {
                if (list[i].id === id) {
                    index = i;
                }
            }
            return index;
        },

        _initWidget: function() {
            if (!this.pageShown) {
                return;
            }

            var self = this;
            this._setUpAgentListDeferred.then(function() {
                domConstruct.empty(dojo.byId("fdw-agent-mapping-svg-container"));
                self._determineOffset();
                self._setupWindowResizeHandle();
                var agentList = self.model.agents;
                var envList = self.model.environments.query();
                var compList = self.model.components.query();

                var unmappedAgentList = [];
                agentList.forEach(function(agent) {
                    if(!agent.mappedToEnv) {
                        unmappedAgentList.push (agent);
                    }
                });

                self.fdwMappingAgentTitleTextAttach.textContent = i18n("Agents (%s)", self.model.agentsTotal);
                self.fdwMappingEnvTitleTextAttach.textContent = i18n("Environments with All Components (%s / %s)", self._evaluateEnvAgents() , envList.length);

                var zoom = function() {};
                var zoomer = d3.zoom()
                      .on("zoom", zoom);
                var panOnScroll = function() {
                    var targetLibrary;
                    var totalTargetHeight;
                    if (d3.select(self.leftLibrary.target).node() === d3.event.currentTarget){
                        targetLibrary = self.leftLibrary;
                        totalTargetHeight = unmappedAgentList.length * self.agentHeight;
                    } else if (d3.select(self.rightLibrary.target).node() === d3.event.currentTarget){
                        targetLibrary = self.leftLibrary;
                        totalTargetHeight = self._calcTotalHeight(envList);
                    }

                    if (targetLibrary) {
                        var change = 0;
                        //for IE/Opera
                         if (d3.event.detail) {
                            change = d3.event.detail > 0 ? 15: -15 ;
                        } else if (d3.event.deltaY){
                            change = d3.event.deltaY > 0 ? 15 : -15;
                        } else if (d3.event.wheelDelta) {
                            change = -d3.event.wheelDeltaY/10;
                        }

                        if (d3.event.preventDefault) {
                            d3.event.preventDefault();
                        }

                        if (d3.event.currentTarget.transform.baseVal.numberOfItems > 0){
                            change += -d3.event.currentTarget.transform.baseVal.getItem(0).matrix.f;
                        }
                        var scrollAttachBBox = d3.select(targetLibrary.attachPoint).node().getBBox();
                        var yScale = self._defineScale(targetLibrary, scrollAttachBBox, totalTargetHeight);
                        self._scroll(targetLibrary, d3.select(targetLibrary.target), change, d3.select("#"+ targetLibrary.handle), yScale);
                    }
                };
                //Make space for widget
                var svgContainer = d3.select("div.fdw-svg")
                    .append("svg")
                    .attr("width", "100%")
                    .attr("height", "100%")
                    .style("stroke", "none");

                //Set up environments part of widget
                var envContainer = svgContainer.append("g")
                    .attr("id", "env-group-container")
                    .attr("transform", function (d, i) {
                        return "translate("+self.envOffset+", 0)";
                    });

                var envGroup = envContainer.append("g");

                envGroup.append("rect")
                    .attr("class", "env-group-rect")
                    .attr("width", self.envWidth)
                    .attr("height", "100%")
                    .attr("y", 0)
                    .style("fill", "#FFFFFF");

                var environmentGroup = envContainer.append("g")
                    .attr("id", "fdw-agentMapping-rightSide")
                    .call(zoomer)
                        .on("wheel.zoom", panOnScroll);

                //Set up unmapped agent part of widget
                var agentContainerWhole = svgContainer.append("g")
                    .attr("class", "agent-column");

                var agentGroup = agentContainerWhole.append("g")
                    .attr("id", "unmapped-agent-group-container")
                    .attr("transform", function(d) {
                        var x = 15;
                        var y = parseInt(domStyle.getComputedStyle(dojo.query("#fdw-wizard .agent-filter")[0]).height, 10);
                        return "translate(" + x + "," + y + ")";
                    });

                agentGroup.append("rect")
                    .attr("class", "agent-group-rect")
                    .attr("width", self.agentWidth)
                    .attr("height", function() {
                        var totalHeight = parseInt(domStyle.getComputedStyle(dojo.query("#fdw-agent-mapping-svg-container")[0]).height, 10);
                        totalHeight = totalHeight - parseInt(domStyle.getComputedStyle(dojo.query("#fdw-wizard .agent-filter")[0]).height, 10);
                        return totalHeight + "px";
                    })
                    .attr("y", 0)
                    .style("fill", "#FFFFFF");

                var agentContainer = agentGroup.append("g")
                    .attr("id", "fdw-unmapped-agentGroup")
                    .call(zoomer)
                        .on("wheel.zoom", panOnScroll);

                //Draw Environments, Agents, and Components.
                self._drawEnvironments(envList, agentList, compList, environmentGroup);
                self._drawAllAgents(envList, agentList, compList, agentContainer, environmentGroup);
                self._drawComponents(envList, agentList, compList, environmentGroup);

                var totalAgentHeight = unmappedAgentList.length * self.agentHeight;
                var totalEnvHeight = self._calcTotalHeight(envList) ;

                self._drawScrollbar(self.leftLibrary, totalAgentHeight);
                self._drawScrollbar(self.rightLibrary, totalEnvHeight);

                //TODO: might be able to find faster algorithm
                var wrap = function(text, width) {
                    text.each(function() {
                      var text = d3.select(this),
                          words = text.text(),
                          textLength = text.node().getComputedTextLength();
                      while (textLength > width && textLength > 0) {
                          words = words.slice(0, -1);
                          text.text(words + '...');
                          textLength = text.node().getComputedTextLength();
                      }
                    });
                };

                //text.x = 27px, plus 20px for ::
                agentContainer.selectAll(".agent-name-label")
                              .call(wrap, self.agentWidth - 45);

            });
        },

        _drawEnvironments: function(envList, agentList, compList, environmentGroup){
            var self = this;

            var environmentContainer = environmentGroup.append("g")
                .attr("class", "fdw-environment-group");

            //Make list of Environment Targets
            var envTxtSvg = environmentContainer.selectAll("g")
                .data(envList)
                .enter().append("g")
                .attr("transform", function (d, i) {
                    return "translate(0,"+ self._calcEnvHeight(i, envList) +" )";
                })
                .on("mouseover", function(d) {
                    self.selectedEnv = d;
                })
                .on("mouseout", function(d){
                    self.selectedEnv = null;
                })
                .on("click", function(d) {
                    if (d.children.length > 0) {
                        d.expanded=!d.expanded;
                        self._initWidget();
                    }
                });

            //Add rectangles for Env objects
            envTxtSvg.append("rect")
                .attr("width", self.envWidth)
                .attr("height", self.environmentHeight - 5 + "px")
                .style("fill", "#E1E1E1");

            envTxtSvg.append("rect")
                .attr("x", 35)
                .attr("width", "10px")
                .attr("height", self.environmentHeight - 5 + "px")
                .style("fill", function(d){
                    return d.color;
                });

            //Add in twisty triangle
            envTxtSvg.append("path")
                .attr("class", "twisty-triangle")
                .attr("d", self.lineFunction(self.triangleData))
                .attr("stroke", "none")
                .attr("transform", function(d) {
                    if (d.expanded){
                        return "rotate(90, 15, 20)";
                    }
                    return "rotate(0, 15, 20)";
                })
                .attr("fill", function(d) {
                    if (d.children.length>0) {
                        return "grey";
                    }
                    return "none";
                });

            //Make Env Text
            envTxtSvg.append("text")
                .attr("x", 55)
                .attr("y", self.environmentHeight/2 + 5)
                .attr("font-family", "'Helvetica-Light', 'Helvetica Light',  'Helvetica'")
                .attr("font-size", "14")
                .attr("class", "environment-name-label")
                .text(function (d) {
                    return d.name;
                });

            envTxtSvg.append("text")
                .attr("x",  300)
                .attr("y", self.environmentHeight/2 + 5)
                .attr("font-family", "'Helvetica-Light', 'Helvetica Light',  'Helvetica'")
                .attr("font-size", "12")
                .attr("class", "fdw-environment-list-state-label")
                .text(function(d) {
                    var value = "";
                    if(d.children.length === 0) {
                        value = i18n("Drag agents here");
                    } else if (d.children.length > 0) {
                        var count = self._calcMissingChildren(d);
                        if (count > 0){
                            value = i18n("Components Missing: %s", count);
                        }
                    }
                    return value;
                });

        },

        _drawAllAgents: function(envList, agentList, compList, agentContainer, environmentGroup){
            var self = this;

            self._drawMappedAgents(envList, agentList, compList, environmentGroup);
            self._drawUnmappedAgents(agentList, envList, agentContainer);
        },

        _drawMappedAgents: function(envList, agentList, compList, environmentGroup) {
            var self = this;

             //make agents that are children of environments.
            var allAgentChildren = [];
            var i;
            for (i = 0; i < envList.length; i++){
                var curEnv = envList[i];
                if (curEnv.expanded) {
                    allAgentChildren = allAgentChildren.concat(curEnv.children);
                }
            }

            var assignedAgentContainer = environmentGroup.append("g")
                .attr("class", "fdw-assigned-agent-group");

            var assignedAgentObject = assignedAgentContainer.selectAll("g")
                .data(allAgentChildren)
                .enter()
                .append("g")
                .on("mouseover", function(d){
                    self.selectedAgent = d;
                    var envIndex = self._findItemIndexById(envList, d.envId);
                    self.selectedEnv = envList[envIndex];
                    d3.select(this).select(".delete-agent").style("opacity", 1);
                    d3.select(this).select(".agent-name-label").attr("text-decoration", "underline");
                    d3.select(this).style("cursor", "pointer");
                })
                .on("mouseout", function(d) {
                    self.selectedAgent = null;
                    self.selectedEnv = null;
                    d3.select(this).select(".delete-agent").style("opacity", 0);
                    d3.select(this).select(".agent-name-label").attr("text-decoration", "none");
                    d3.select(this).style("cursor", "default");
                })
                .attr("transform", function (d) {
                    return "translate(" + self._calcAgentOffset() + ", " + self._calcAgentHeight(d, envList) + " )";
                });

            assignedAgentObject.append("rect")
                .attr("width", self.agentWidth)
                .attr("height", self.agentHeight - 5 + "px")
                .style("fill", self.agentColor)
                .on("click", function (d) {
                    self._showComponentSelectionDialog(d);
                });

            assignedAgentObject.append("image")
                .attr("x", 30)
                .attr("y", 3)
                .attr("width", 19)
                .attr("height", 19)
                .attr('xlink:href', bootstrap.contentUrl +'images/deploy/resources/agent.png')
                .attr("class", "agentIcon");

            assignedAgentObject.append("text")
                .attr("x", 50)
                .attr("y", self.agentHeight/2)
                .attr("class", "agent-name-label")
                .attr("stroke", "none")
                .attr("font-family", "'Helvetica-Light', 'Helvetica Light',  'Helvetica'")
                .attr("font-size", "14")
                .text(function (d) {
                    return d.name;
                })
                .on("click", function (d) {
                    self._showComponentSelectionDialog(d);
                });

            //Add in twisty triangle
            var twistyGroup = assignedAgentObject.append("g")
                .attr("class", "agent-twisty-group")
                .on("click", function(d) {
                    if (d.children.length > 0) {
                        d.expanded=!d.expanded;
                        self._initWidget();
                    }
                });

            twistyGroup.append("rect")
                .attr("width", "25px")
                .attr("height", "20px")
                .style("fill", self.agentColor);

            twistyGroup.append("path")
                .attr("class", "twisty-triangle")
                .attr("d", self.lineFunction(self.triangleSmallerData))
                .attr("stroke", "white")
                .attr("transform", function(d) {
                    if (d.expanded){
                        return "rotate(90, 15, 12)";
                    }
                    return "rotate(0, 15, 12)";
                })
                .attr("fill", function(d) {
                    if (d.children.length>0) {
                        return "grey";
                    }
                    return "none";
                });

            var deleteAgentGroup = assignedAgentObject.append("g")
                .attr("class", "delete-agent")
                .attr("transform", function() {
                    var textNode = d3.select(this.parentNode).select(".agent-name-label");
                    var bbox = textNode.node().getBBox();
                    var x = bbox.x + bbox.width + 20;
                    return 'translate(' + x + ', 10)rotate(45, 0, 0)';
                })
                .style("opacity", 0)
                .on("click", function() {
                    var agent = d3.select(this.parentNode).datum();
                    var envIndex = self._findItemIndexById(envList, agent.envId);
                    var env = envList[envIndex];
                    self._removeAgentFromEnvironment(agent, env);
                    self._initWidget();
                });

            deleteAgentGroup.append("path")
                .attr('d', function() {
                        return d3.symbol().size(180).type(d3.symbolSquare)();
                })
                .attr('fill', self.agentColor)
                .attr('stroke', self.agentColor)
                .attr('stroke-width', 1);

            deleteAgentGroup.append("path")
                .attr('d', function() {
                        return d3.symbol().size(100).type(d3.symbolCross)();
                })
                .attr('fill', '#ff0000')
                .attr('stroke', '#ff0000')
                .attr('stroke-width', 1);
        },

        _drawUnmappedAgents: function(agentList, envList, agentContainer) {
            var self = this;

            var drag = d3.drag()
                .on("start", function(d){
                    d3.event.sourceEvent.stopPropagation();
                })
                .on("drag", function() {
                    var x = d3.event.x;
                    var y = d3.event.y;
                    d3.select(this).attr("pointer-events", "none");
                    d3.select(this).attr("transform", "translate(" + x + "," + y + ")");
                    d3.select(this).select(".agent-drag-handle").style("display", "none");
                })
                .on("end", function(){
                    d3.select(this).attr("pointer-events", "auto");
                    var agentIndex, envIndex;
                    var dragged = this;
                    if (self.selectedEnv) {
                        agentIndex = self._findItemIndexByName(agentList, d3.select(this).datum().name);
                        envIndex = envList.indexOf(self.selectedEnv);
                        self._addAgentToEnvironment(envIndex, agentIndex);
                    } else if (self.selectedAgent) {
                        agentIndex = self._findItemIndexByName(agentList, d3.select(this).datum().name);
                        envIndex = self._findItemIndexById(envList, self.selectedAgent.envId);
                        self._addAgentToEnvironment(envIndex, agentIndex);
                    } else if(self.selectedComponent) {
                        agentIndex = self._findItemIndexByName(agentList, d3.select(this).select(".agent-name-label").text());
                        envIndex = self._findItemIndexById(envList, agentList[agentIndex].envId);
                        self._addAgentToEnvironment(envIndex, agentIndex);
                    }
                    else {
                        self._initWidget();
                    }
                });

            var unmappedAgentList = [];
            agentList.forEach(function(agent) {
                if(!agent.mappedToEnv) {
                    unmappedAgentList.push(agent);
                }
            });

            //Make list of Agent draggables
            var agentTxtSvg = agentContainer.selectAll("g")
                .data(unmappedAgentList)
                .enter()
                .append("g")
                .attr("class", "draggable")
                .call(drag)
                .on("mouseover", function() {
                    d3.select(this).style("cursor", "move");
                })
                .on("mouseout", function() {
                    d3.select(this).style("cursor", "default");
                })
                .attr("transform", function (d, i) {
                    return "translate(0," + (i * self.agentHeight) + ")";
                });

            //Add rectangles for Agent objects
            agentTxtSvg.append("rect")
                .attr("width", self.agentWidth)
                .attr("height", self.agentHeight - 5 + "px")
                .style("fill", self.agentColor);

            agentTxtSvg.append("image")
                .attr("x", 3)
                .attr("y", 3)
                .attr("width", 19)
                .attr("height", 19)
                .attr('xlink:href', bootstrap.contentUrl +'images/deploy/resources/agent.png')
                .attr("class", "agentIcon");

            //Make Agent Text
            agentTxtSvg.append("text")
                .attr("x", function() {
                    var bbox = d3.select(this.parentNode).select(".agentIcon").node().getBBox();
                    return bbox.x + bbox.width + 10;
                })
                .attr("y", self.agentHeight/2)
                .attr("class", "agent-name-label")
                .attr("font-family", "'Helvetica-Light', 'Helvetica Light',  'Helvetica'")
                .attr("font-size", "14")
                .text(function (d) {
                    return d.name;
                });

            //drag handle
            agentTxtSvg.append("text")
                .attr("class", "agent-drag-handle")
                .attr("x", function() {
                    return self.agentWidth - 20;
                })
                .attr("y", self.agentHeight/2)
                .attr("font-family", "'Helvetica-Light', 'Helvetica Light',  'Helvetica'")
                .attr("font-size", "14")
                .text("::");

        },

        _drawComponents: function(envList, agentList, compList, environmentGroup) {
            var self = this;

            var allCompChildren = [];
            var i;

            envList.forEach(function(env){
                env.children.forEach(function(agent){
                    if (env.expanded && agent.expanded && agent.children.length > 0){
                        allCompChildren = allCompChildren.concat(agent.children);
                    }
                });
            });

            var mappedCompContainer = environmentGroup.append("g")
                .attr("class", "fdw-mapped-comp-group");

            var mappedCompObject = mappedCompContainer.selectAll("g")
                .data(allCompChildren)
                .enter()
                .append("g")
                .attr("transform", function (d) {
                    var y = self._calcCompHeight(d, envList, self.environmentHeight, self.agentHeight, self.environmentHeight);
                    return "translate(" + self._calcCompOffset() + ", " + y + " )";
                })
                .on("mouseover", function() {
                    d3.select(this).select(".delete-component").style("opacity", 1);
                })
                .on("mouseout", function(d) {
                    d3.select(this).select(".delete-component").style("opacity", 0);
                })
            ;

            mappedCompObject.append("rect")
                .attr("width", self.agentWidth)
                .attr("height", self.agentHeight - 5 + "px")
                .style("fill", self.agentColor);

            mappedCompObject.append("image")
                .attr("x", 3)
                .attr("y", 3)
                .attr("width", 19)
                .attr("height", 19)
                .attr('xlink:href', bootstrap.contentUrl +'images/deploy/component_19x19.png');

            mappedCompObject.append("text")
                .attr("class", "component-name-label")
                .attr("x", 28)
                .attr("y", self.agentHeight/2)
                .attr("font-family", "'Helvetica-Light', 'Helvetica Light',  'Helvetica'")
                .attr("font-size", "14")
                .attr("class", "component-name-label")
                .text(function (d) {
                    var curComp = compList.filter(function(component) {
                        return d.id === component.id;
                    });
                    return curComp[0].name;
                });

            var deleteComponentGroup = mappedCompObject.append("g")
                .attr("class", "delete-component")
                .attr("transform", function() {
                    var textNode = d3.select(this.parentNode).select(".component-name-label");
                    var bbox = textNode.node().getBBox();
                    var x = bbox.x + bbox.width + 20;
                    return 'translate(' + x + ', 10)rotate(45, 0, 0)';
                })
                .style("opacity", 0)
                .on("click", function(d, i) {
                    var component = d3.select(this.parentNode).datum();
                    var env = envList[self._findItemIndexById(envList, component.envId)];
                    var agent = env.children[self._findItemIndexById(env.children, component.agentId)];
                    self._removeCompFromAgent(component, agent);
                    self._initWidget();
                });

            deleteComponentGroup.append("path")
                .attr('d', function() {
                        return d3.symbol().size(180).type(d3.symbolSquare)();
                })
                .attr('fill', self.agentColor)
                .attr('stroke', self.agentColor)
                .attr('stroke-width', 1);

            deleteComponentGroup.append("path")
                .attr('d', function() {
                        return d3.symbol().size(100).type(d3.symbolCross)();
                      })
                .attr('fill', '#ff0000')
                .attr('stroke', '#ff0000')
                .attr('stroke-width', 1);
        },

        _addComponentsToAgent: function(agent, compList) {
            var self = this;
            var envList = self.model.environments.query();

            var completeCompList = self.model.components.query();
            var env = envList[self._findItemIndexById(envList, agent.envId)];
            var agentIndex = self._findItemIndexById(env.children, agent.id);

            env.children[agentIndex].children = [];
            compList.forEach(function(comp) {
                var component = {"id":comp.id, "agentId": agent.id, "envId": env.id };
                env.children[agentIndex].children.push(component);
                env.children[agentIndex].expanded = true;
            });

            self._initWidget();
        },

        _removeComponentFromAgents: function(component) {
            var self = this;
            var envList = self.model.environments.query();
            var agentList = [];

            self.selectedEnv = null;
            self.selectedAgent = null;
            self.selectedComponent = null;

            envList.forEach(function(env){
                agentList = agentList.concat(env.children);
            });

            agentList.forEach(function(agent) {
                self._removeCompFromAgent(component, agent);
            });

        },

        _removeCompFromAgent: function(component, agent) {
            var self = this;
            self.selectedEnv = null;
            self.selectedAgent = null;
            self.selectedComponent = null;

            var componentIndex = self._findItemIndexById(agent.children, component.id);
            if(componentIndex > -1){
                agent.children.splice(componentIndex, 1);
            }
        },

        _addAgentToEnvironment: function(envIndex, agentIndex) {
            var self = this;
            var agentList = self.model.agents;
            var environment = self.model.environments.query()[envIndex];

            agentList[agentIndex].envId = environment.id;
            agentList[agentIndex].mappedToEnv = true;

            self.model.set("agents", agentList);

            self._showComponentSelectionDialog(self.model.agents[agentIndex]);
            var mappedAgent = self.model.agents[agentIndex];

            environment.children.push(mappedAgent);

            self.model.environments.query()[envIndex].set("children", environment.children);
            self.model.environments.query()[envIndex].set("expanded",true);
        },

        _removeAgentsFromEnvironment: function(env) {
            var self = this;
            self.selectedAgent = null;
            self.selectedEnv = null;

            var agentList = env.children;
            if (env.children.length >0) {
                agentList.forEach(function(agent) {
                    self._removeAgentFromEnvironment(agent, env);
                });
            }
            env.set("children", []);
        },

        _removeAgentFromEnvById: function(agentId){
            var self = this;
            var envList = self.model.environments.query();
            self.selectedAgent = null;
            self.selectedEnv = null;

            var agentToBeRemoved;
            var parentEnv;
            envList.forEach(function(env){
                env.children.forEach(function(agent){
                    if (agent.id === agentId){
                        agentToBeRemoved = agent;
                        parentEnv = env;
                    }
                });
            });

            if (envList.indexOf(parentEnv) > -1){
                parentEnv.children.splice(parentEnv.children.indexOf(agentToBeRemoved), 1);
                if (parentEnv.children.length === 0) {
                    parentEnv.expanded = false;
                }
            }

            agentToBeRemoved.mappedToEnv = false;

            var agentList = self.model.agents;
            var agentInAgentList = agentList[self._findItemIndexById(agentList, agentToBeRemoved.id)];
            if (agentInAgentList){
                agentInAgentList.mappedToEnv = false;
            }

            agentToBeRemoved.children.forEach(function(child) {
                self._removeCompFromAgent(child, agentToBeRemoved);
            });
            agentToBeRemoved.expanded = false;
            agentToBeRemoved.envId = -1;
        },

        _removeAgentFromEnvironment: function (mappedAgent, env) {
            var self = this;
            self.selectedAgent = null;
            self.selectedEnv = null;

            if (self.model.environments.query().indexOf(env) > -1){
                env.children.splice(env.children.indexOf(mappedAgent), 1);
                if (env.children.length === 0) {
                    env.expanded = false;
                }
            }

            mappedAgent.mappedToEnv = false;

            var agentList = self.model.agents;
            var agentInAgentList = agentList[self._findItemIndexById(agentList, mappedAgent.id)];
            if (agentInAgentList){
                agentInAgentList.mappedToEnv = false;
            }

            mappedAgent.children = [];
            mappedAgent.expanded = false;
            mappedAgent.envId = -1;
        },

        _calcEnvHeight: function (curIndex, envList) {
            var self = this;
            var totalChildren = 0;
            var i;
            for (i =0; i < curIndex; i++){
                totalChildren += self._calcExpandedChildren(envList[i]);
            }
            var heightFromEnvironments = curIndex * self.environmentHeight;
            var heightFromChildren = totalChildren * self.agentHeight;
            return  heightFromChildren + heightFromEnvironments;
        },
        //Need to figure out how to calculate the agent from the id without going to the backend.
        _calcAgentHeight: function(agent, envList) {
            var self = this;
            var totalHeight = 0;
            var envIndex = self._findItemIndexById(envList, agent.envId);

            var parent = envList[envIndex];
            var parentHeight = self._calcEnvHeight(envIndex, envList);
            var childrenAbove = 0;
            var curAgentIndex = parent.children.indexOf(agent);
            var i;
            for (i = 0; i<curAgentIndex; i++) {
                childrenAbove += 1;
                if (parent.children[i].expanded) {
                    childrenAbove += parent.children[i].children.length;
                }
            }
            return parentHeight + childrenAbove * self.agentHeight + self.agentHeight + 10;
        },

        _calcCompHeight: function(component, envList) {
            var self = this;
            var totalHeight = 0;

            var envIndex = self._findItemIndexById(envList, component.envId);
            var env = envList[envIndex];

            var parent = env.children[self._findItemIndexById(env.children, component.agentId)];
            var parentHeight = self._calcAgentHeight(parent, envList);
            var heightChildrenAbove = parent.children.indexOf(component) ;
            return parentHeight + heightChildrenAbove * self.agentHeight + self.agentHeight;
        },

        _evaluateEnvAgents: function() {
            var self = this;
            var fullyMappedEnvs = 0;
            self.model.environments.query().forEach(function(env) {
                if (self._allComponentsMappedToEnvironment(env)) {
                    fullyMappedEnvs += 1;
                }
            });

            return fullyMappedEnvs;
        },

        _calcTotalHeight:function (envList) {
            var self = this;
            var totalHeight = 0;
            var lastEnv = envList[envList.length - 1];
            var lastAgent;
            if (!lastEnv.expanded || lastEnv.children.length < 1) {
                totalHeight = self._calcEnvHeight(envList.length - 1, envList) + self.environmentHeight;
            } else if(!lastEnv.children[lastEnv.children.length -1].expanded ||
                lastEnv.children[lastEnv.children.length -1].children.length < 1) {

                lastAgent = lastEnv.children[lastEnv.children.length - 1];
                totalHeight = self._calcAgentHeight(lastAgent, envList) + self.agentHeight;
            } else{
                lastAgent = lastEnv.children[lastEnv.children.length - 1];
                var lastComponent = lastAgent.children[lastAgent.children.length - 1];
                totalHeight = self._calcCompHeight(lastComponent, envList) + self.agentHeight;
            }

            return totalHeight;
        },

        _allComponentsMappedToEnvironment:function(env) {
            var self = this;
            var value = false;

            if (env.children && env.children.length > 0){
                var numComponentsMapped = 0;
                self.model.components.query().forEach(function(comp){
                    var foundComp = false;
                    env.children.forEach(function(agent){
                        if (agent.children){
                            var matchingComponents = agent.children.filter(function(child){
                                return child.id === comp.id;
                            });
                            if (matchingComponents.length > 0){
                                foundComp = true;
                            }

                        }
                    });
                    if (foundComp) {
                        numComponentsMapped +=1;
                    }
                });
                if (numComponentsMapped === self.model.components.query().length){
                    value = true;
                }
            }
            return value;
        },

        _onShow: function() {
            var page = "DefineProcesses";
            this.pageShown = true;
            this._initWidget();
        },

        _onHide: function() {
            this.pageShown = false;
            this.windowResizeHandle.remove();
            this.windowResizeHandle = undefined;
        },

        _setWatchEnv: function(env) {
            var self = this;
            env.watch("children", function(propName, oldValue, newValue) {
                self._initWidget();
            });
            env.watch("expanded", function(propName, oldValue, newValue) {
                self._initWidget();
            });
            env.watch("name", function(propName, oldValue, newValue) {
                self._initWidget();
            });
            env.watch("color", function(propNames, oldValue, newValue) {
                self._initWidget();
            });
        },

        _setUpAgentList: function(filter) {
            var self = this;
            var deferred = new Deferred();

            var mappedAgents = self._getListOfMappedAgents();

            this._getAgentList(filter).then(function(data) {
                var agents = array.map(data, function(agent) {
                    agent.mappedToEnv = mappedAgents.indexOf(agent.id) > -1;
                    agent.children = [];
                    return agent;
                });
                //if there are any mapped agents that got deleted remove them.
                //This probably involves a second api call


                //FOR TESTING
                //self.model.set("agents", self._getTestAgentList(100));
                self.model.set("agents", agents);
                deferred.resolve();
            },
            function(error) {
                var alert = new Alert({
                    messages: [i18n("Error retrieving processes:"),
                               "",
                               util.escape(error.responseText)]
                });
                deferred.reject(error);
            });

            return deferred;
        },

        _getListOfMappedAgents: function() {
            var self = this;
            var envList = self.model.environments.query();
            var mappedAgentList = [];

            envList.forEach(function(env){
                env.children.forEach(function(agent){
                    mappedAgentList.push(agent.id);
                });
            });
            return mappedAgentList;
       },

        _getTestAgentList: function(numAgents) {
            var agentList = [];
            var i;
            for (i = 0; i < numAgents ; i++){
                var curAgent = {
                    "name": i + "agent name",
                    "mappedToEnv": false,
                    "children":[]
                };
                agentList.push(curAgent);
            }
            return agentList;
        },

        _showComponentSelectionDialog: function(agent) {
            var self = this;

            var compSelect;
            var compSelectDialog = new Dialog({
                title: i18n("Select Components to Use This Agent: %s", "<br>" + util.escape(agent.name)),
                closable: false,
                draggable: true,
                destroyOnHide: true,
                className: "fdw-compSelect-dialog",
                description: i18n("You can select which components will be present on the agent you just dragged to it's environment.")
            });

            compSelect = new CheckedMultiSelect({
                multiple: true,
                name: "compSelectWidget"
               });

            var compList = self.model.components.query();
            compList.forEach(function(comp){
                var selected = false;
                if (self._isCompChildOfAgent(comp, agent)){
                    selected = true;
                }
                var compValue = {value:comp, selected:selected};
                compValue.label = '<img src="' +
                    bootstrap.contentUrl +'images/deploy/component_19x19.png">' +
                    '<span class="agent-mapping-dialog-comp-name">' + comp.name + '</span>';
                compSelect.addOption(compValue);
            });

            var okButtonAttr = {
                label: i18n("OK"),
                showTitle: false,
                onClick:function(){
                    var selectedComps = compSelect.getValue();
                    if (selectedComps) {
                        self._addComponentsToAgent(agent, selectedComps);
                    }
                    compSelectDialog.hide();
                }
            };

            var cancelButtonAttr = {
                label: i18n("Cancel"),
                showTitle: false,
                onClick:function(){
                    compSelectDialog.hide();
                }
            };

            compSelect.placeAt(compSelectDialog.containerNode);

            this.designerOkButton = new Button(okButtonAttr).placeAt(compSelectDialog.containerNode);
            domClass.add(this.designerOkButton.domNode, "fdw-designer-ok-btn");
            domClass.add(this.designerOkButton.domNode, "idxButtonSpecial");

            this.designerCancelButton = new Button(cancelButtonAttr).placeAt(compSelectDialog.containerNode);
            domClass.add(this.designerCancelButton.domNode, "fdw-designer-cancel-btn");

            compSelectDialog.show();
        },

        _isCompChildOfAgent:function(comp, agent) {
            var isChild = false;
            agent.children.forEach(function(child) {
                if (child.id === comp.id){
                    isChild = true;
                }
            });
            return isChild;
        },

        _calcMissingChildren:function(env) {
            var self = this;
            var compList = self.model.components.query();
            var countMissingChildren = compList.length;

            if (self._allComponentsMappedToEnvironment(env)) {
                countMissingChildren = 0;
            }
            else {
                compList.forEach(function(comp) {
                    var compNotFound = true;
                    env.children.forEach(function(agent) {
                        if (compNotFound && self._isCompChildOfAgent(comp, agent)){
                            countMissingChildren--;
                            compNotFound = false;
                        }
                    });
                });
            }
            return countMissingChildren;
        },

        _getAgentList: function(filter) {
            var self = this;
            var url = bootstrap.restUrl + 'agent';
            var deferred = new Deferred();
            xhr.get({
                url: url,
                content: {
                    rowsPerPage: 1000,
                    pageNumber: 1,
                    orderField: "name",
                    sortType: "asc",
                    filterFields: ["requiredActions", "name"],
                    filterType_requiredActions: "eq",
                    filterValue_requiredActions: ["Create Resources"],
                    filterType_name: "like",
                    filterValue_name: filter,
                    filterClass_name: "String"
                },
                handleAs: "json",
                load: function(data, ioArgs) {
                    var contentRange = ioArgs.xhr.getResponseHeader("Content-Range");
                    // "Content-Range: 10-19/200" (showing 10-19 of 200 items)
                    if (!filter){
                        self.model.agentsTotal = parseInt(contentRange.substring(contentRange.indexOf("/")+1), 10);
                    }
                    deferred.resolve(data);
                },
                error: function(error) {
                    deferred.reject(error);
                }
            });
            return deferred;
        },

        _scroll:function(targetLibrary, target, inputChange, handle, y) {
            var self = this;
            var change = this._normalize(inputChange, 0, y.domain()[1]);
            var handleBarY = y(change);
            handleBarY = this._normalize(handleBarY, 0, targetLibrary.maxHandleBarY);
            handle.attr("transform", "translate(0, " + handleBarY + ")");

            targetLibrary.savedScrollY = change;

            target.attr("transform", function() {
                self.leftY = -change;
                return "translate(0," + self.leftY + ")";
            });
        },

        _defineScale: function(targetLibrary, scrollAttachBBox, totalTargetHeight) {
            //track's strokeWidth = 10, handleBar's strokeWidth = 6;
            var viewableHeight = scrollAttachBBox.height;
            var targetScrollHeight = totalTargetHeight - viewableHeight;
            var handleBarHeight = viewableHeight * viewableHeight/totalTargetHeight - 6;
            targetLibrary.handleBarHeight = handleBarHeight;
            var maxHandleBarY = viewableHeight - handleBarHeight - 10;
            targetLibrary.maxHandleBarY = maxHandleBarY;

            var handleBarYToScrollScale = d3.scaleLinear()
                .domain([0, targetScrollHeight])
                .range([0, maxHandleBarY])
                .clamp(true);

            return handleBarYToScrollScale;
        },

        _drawScrollbar: function(targetLibrary, totalTargetHeight) {
            var self = this;

            var myBBox = d3.select(targetLibrary.attachPoint).node().getBBox();
            if (myBBox.height < totalTargetHeight) {
                var translateX = myBBox.width + 10/2;
                var translateY = myBBox.y + 10/2;

                //track strokeWidth = 10
                var trackHeight = myBBox.height - 10;

                var handleBarYToScrollScale = self._defineScale(targetLibrary, myBBox, totalTargetHeight);

                var slider = d3.select(targetLibrary.parent).append("g")
                    .attr("class", "slider")
                    .attr("transform", "translate(" + translateX + "," + translateY + ")");

                var handle;

                slider.append("line")
                    .attr("class", "track")
                    .attr("y1", 0)
                    .attr("y2", trackHeight)
                  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
                    .attr("class", "track-inset")
                  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
                    .attr("class", "track-handle")
                    .attr("id", function() {
                        return targetLibrary.handle;
                    })
                    .attr("y1", 0)
                    .attr("y2", targetLibrary.handleBarHeight)
                  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
                    .attr("class", "track-overlay")
                    .attr("y1", 0)
                    .attr("y2", trackHeight)
                    .call(d3.drag()
                        .on("start.interrupt", function() { slider.interrupt(); })
                        .on("start", function() {
                            var eventY = d3.event.y;
                            var handle = d3.select('#' + targetLibrary.handle).node();
                            var translateY = 0;
                            if (handle.transform.baseVal.numberOfItems > 0) {
                                translateY = handle.transform.baseVal.getItem(0).matrix.f;
                            }
                            targetLibrary.handleBarRelativeY = eventY - handle.getBBox().y - translateY;

                            //this is to handle user clicks outside of the handle:
                            if ((targetLibrary.handleBarRelativeY < 0) ||
                                (targetLibrary.handleBarRelativeY > targetLibrary.handleBarHeight)) {
                                var newHandleBarY = self._normalize(eventY, 0, targetLibrary.maxHandleBarY);

                                self._scroll(targetLibrary,
                                             d3.select(targetLibrary.target),
                                             handleBarYToScrollScale.invert(newHandleBarY),
                                             d3.select("#" + targetLibrary.handle),
                                             handleBarYToScrollScale);
                            }
                        })
                        .on("drag", function() {
                            var eventY = d3.event.y;
                            var handle = d3.select('#' + targetLibrary.handle);
                            var newHandleBarY = eventY - targetLibrary.handleBarRelativeY;
                            newHandleBarY = self._normalize(newHandleBarY, 0, targetLibrary.maxHandleBarY);

                            self._scroll(targetLibrary,
                                         d3.select(targetLibrary.target),
                                         handleBarYToScrollScale.invert(newHandleBarY),
                                         d3.select("#" + targetLibrary.handle),
                                         handleBarYToScrollScale);
                        }));

                //scroll to previous saved position
                self._scroll(targetLibrary,
                             d3.select(targetLibrary.target),
                             targetLibrary.savedScrollY,
                             d3.select("#" + targetLibrary.handle),
                             handleBarYToScrollScale);

            }
        },

        _setupWindowResizeHandle: function() {
            var self = this;
            if (!this.windowResizeHandle) {
                this.windowResizeHandle = on(window, 'resize', function() {
                    self._determineOffset();
                    self._initWidget();
                });
            }
        },

        /**
         * .fdw-mapping-agent-title is set to be 30% of the width in css
         * envWidth should be 65% of the width
         * gap btw agent and env should be 10%
         */
        _determineOffset: function() {
            if (query(".fdw-mapping-agent-title")) {
                var node = query(".fdw-mapping-agent-title")[0];
                this.agentWidth = 20 * domStyle.get(node, "width")/30;
                this.envWidth = 65 * domStyle.get(node, "width")/30;
                this.envOffset = domStyle.get(node, "width");
                var envLabelOffset = -domStyle.get(node, "padding-left");
                var envLabelNode = query(".fdw-mapping-environment-title")[0];
                domStyle.set(envLabelNode, "margin-left", envLabelOffset + "px");
            }
        },

        _normalize: function(input, min, max) {
            var output = input;
            output = Math.max(output, min);
            output = Math.min(output, max);
            return output;
        }
    });
});

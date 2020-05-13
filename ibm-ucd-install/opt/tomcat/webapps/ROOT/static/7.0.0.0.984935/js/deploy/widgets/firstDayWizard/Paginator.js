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
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/store/Memory",
        "dojo/store/Observable",
        "dojo/dom-class",
        "dojo/dom-construct",
        "deploy/widgets/ModelWidgetList",
        "deploy/widgets/TooltipTitle",
        "d3/d3"
        ],
function(
        _TemplatedMixin,
        _Widget,
        _Container,
        array,
        declare,
        Memory,
        Observable,
        domClass,
        domConstruct,
        ModelWidgetList,
        TooltipTitle,
        d3
) {
    /**
     *
     */
    return declare([_Widget, _TemplatedMixin, _Container], {
        templateString: '<span data-dojo-attach-point = "paginatorAttach"></span>',

        postCreate: function() {
            var self = this;
            this.inherited(arguments);
            self.pages = self._initPagesData(this.wizardModel);
            this._initWidgets(self.pages);
            this.wizardModel.watch("selectedPageIndex", function (propName, oldValue, newValue) {
                self.pages.forEach(function (page, index){
                    if (index !== newValue) {
                        page.selected = false;
                    } else {
                        page.selected = true;
                        if(!page.enabled) {
                            self.wizardModel.set("furthestEnabledPageIndex", index);
                        }
                    }
                });
                self._initWidgets(self.pages);
            });
            this.wizardModel.watch("pageIds", function (propName, oldValue) {
                if (self.pages.length !== self.wizardModel.pageIds.length) {
                    self.pages = self._initPagesData(this.wizardModel);
                    self._initWidgets(self.pages);
                }
            });
            this.wizardModel.watch("furthestEnabledPageIndex", function(propName, oldValue, newValue) {
                self.pages.forEach(function(page, index){
                    if (index <= newValue){
                        page.enabled = true;
                    } else {
                        page.enabled = false;
                    }
                });
                self._initWidgets(self.pages);
            });
        },

        _initPagesData: function(wizardModel) {
            var self = this;
            var pages = [];
            wizardModel.pageIds.forEach(function (pageId, index) {
                var selected = false;
                var enabled = false;
                var firstPage = false;
                var endPage = false;
                var number = index + 1;
                if (wizardModel.selectedPageIndex === index) {
                    selected = true;
                }
                if (index === 0) {
                    firstPage = true;
                }
                if (index === wizardModel.pageIds.length - 1){
                    endPage = true;
                }
                if (index <= wizardModel.furthestEnabledPageIndex){
                    enabled = true;
                }
                var page = {
                    id:wizardModel.getUniqId(),
                    name:wizardModel.PageNameById[pageId],
                    number:number,
                    selected:selected,
                    enabled:enabled,
                    firstPage:firstPage,
                    endPage:endPage,
                    wizardModel:wizardModel
                };
                pages.push(page);
            });
            return pages;
        },

        _initWidgets: function(pages) {
            var self = this;
            domConstruct.empty("fdw-paginator");
            var numPages = pages.length;

            //Make space for circles
            var svgContainer = d3.select("span#fdw-paginator")
                .append("svg")
                .attr("width", function(pages) {
                    return 40 * numPages + 20;
                })
                .attr("height", 50);
            //Make Groups for every thing to be drawn
            var circleGroup = svgContainer.append("g");
            var leftRectGroup = svgContainer.append("g");
            var rightRectGroup = svgContainer.append("g");
            //Make circles
            var widgetCircles = circleGroup.selectAll("circle")
                .data(pages)
                .enter()
                .append("circle");
            var widgetCircleAttributes = widgetCircles
                .attr("cx", function(d) {
                    return 40*d.number;
                })
                .attr("cy", 25)
                .attr("r", function(d) {
                    if (d.selected) {
                        return 15;
                    }
                    return 10;
                })
                .style("fill", function(d) {
                    var color = "#f4f4f4";
                    if (d.enabled && !d.selected) {
                        color = "#999999";
                    }
                    return color;
                })
                .style("stroke", function (d) {
                    var strokeColor = "#999999";
                    if (d.selected) {
                        strokeColor = "#373E3E";
                    }
                    return strokeColor;
                })
                .style("stroke-width", function (d){
                    var width = "2";
                    if (d.selected){
                        width = "4";
                    }
                    return width;
                })
                .on("click", function (d) {
                    if (!d.selected) {
                        d.wizardModel.set("pre_selectedPageIndex", d.number - 1);
                    }
                })
                .append("svg:title")
                    .text(function(d) {return d.name;});

            //Make left connection between circles
            var widgetLeftConnections = leftRectGroup.selectAll("rect")
                .data(pages)
                .enter()
                .append("rect");
            var widgetLeftRectAttr = widgetLeftConnections
                .attr("x", function(d) {
                    if (d.selected) {
                        return 40 * d.number - 27;
                    }
                    return 40 * d.number - 20;
                })
                .attr("y", 24)
                .attr("width", 10)
                .attr("height", 2)
                .style("fill", function(d) {
                    var color = "#999999";
                    if (d.firstPage) {
                        color = "none";
                    }
                    return color;
                });
            //make right connections
            var widgetRightConnections = rightRectGroup.selectAll("rect")
                .data(pages)
                .enter()
                .append("rect");
            var widgetRightRectAttr = widgetRightConnections
                .attr("x", function(d) {
                    if (d.selected) {
                        return 40 * d.number + 17;
                    }
                    return 40 * d.number + 10;
                })
                .attr("y", 24)
                .attr("width", 10)
                .attr("height", 2)
                .style("fill", function(d) {
                    var color = "#999999";
                    if (d.endPage) {
                        color = "none";
                    }
                    return color;
                });
        }

    });
});


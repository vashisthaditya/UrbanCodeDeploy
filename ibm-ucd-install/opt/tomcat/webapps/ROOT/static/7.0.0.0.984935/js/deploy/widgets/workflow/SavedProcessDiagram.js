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
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/_base/xhr",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/dom-class",
    "dijit/_TemplatedMixin",
    "dijit/_Widget",
    "deploy/widgets/workflow/BaseGraph",
    "deploy/widgets/workflow/GraphEdgeManager",
    "deploy/widgets/workflow/activity/ActivityCreator"],

function(
    declare,
    array,
    lang,
    xhr,
    domConstruct,
    domStyle,
    domClass,
    _TemplatedMixin,
    _Widget,
    BaseGraph,
    GraphEdgeManager,
    ActivityCreator) {

    /**
     * Utilizing BaseGraph.js to display a saved process design
     *
     * Parameters:
     *      diagramOnlyWidth: desired container width for the diagram
     *      diagramOnlyHeight: desired container height for the diagram
     *      diagramOnlyData: saved process data to be displayed
     *
     * Internals: (not pretty)
     *      diagramOnly is set to true in BaseGraph
     *      not calling BaseGraph's postCreate is intentional
     *      graph is drawn in diagramOnlyContainer, which is defined in BaseGraph.js
     */

    return declare('deploy.widgets.workflow.SavedProcessDiagram', [BaseGraph], {
        postCreate: function() {
            this.diagramOnly = true;
            if (this.diagramOnlyData) {
                this._assembleWidget(this.diagramOnlyData);
            }
        },

        _assembleWidget: function(data) {
            this.createGraph();
            this.graphStartupDelayed(data);

            this.domNode.appendChild(this.diagramOnlyContainer);
            domStyle.set(this.domNode, "position", "relative");
            domStyle.set(this.domNode, "padding", "0px");
            domStyle.set(this.domNode, "width", this.diagramOnlyWidth + "px");
            domStyle.set(this.domNode, "height", this.diagramOnlyHeight + "px");
            domStyle.set(this.domNode, "overflow", "hidden");
            this.domNode.appendChild(this._getOverlayDiv());
        },

        _getOverlayDiv: function() {
            var overlay = domConstruct.create("div");
            domStyle.set(overlay, "position", "absolute");
            domStyle.set(overlay, "top", "0px");
            domStyle.set(overlay, "left", "0px");
            domStyle.set(overlay, "width", this.diagramOnlyWidth + "px");
            domStyle.set(overlay, "height", this.diagramOnlyHeight + "px");
            return overlay;
        },

        //this function is called from BaseGraph graph.fit callback
        fitDiagram: function(view) {
            var scaleAndOffsets = this._calculateScaleOffsets(view);
            view.scaleAndTranslate(scaleAndOffsets.scale,
                                   scaleAndOffsets.x,
                                   scaleAndOffsets.y);
        },

        //this is to override BaseGraph's resize function to avoid errors
        resize: function() {
        },

        _calculateScaleOffsets: function(view) {
            var border = 10;
            var bounds = view.getGraphBounds();
            var boundWidth = bounds.width/view.scale;
            var boundHeight = bounds.height/view.scale;

            var scale = Math.min((this.diagramOnlyWidth-2*border)/boundWidth,
                                 (this.diagramOnlyHeight-2*border)/boundHeight);
            var x = (this.diagramOnlyWidth - 2*border - boundWidth*scale)/2 + border;
            var y = (this.diagramOnlyHeight - 2*border - boundHeight*scale)/2 + border;
            return {scale: scale,
                        x: x/scale,
                        y: y/scale};
        }
    });
});

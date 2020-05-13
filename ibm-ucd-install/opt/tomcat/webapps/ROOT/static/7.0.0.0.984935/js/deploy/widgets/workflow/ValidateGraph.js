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
/*global define, require, mxClient, mxHierarchicalLayout */
define(["dojo/_base/declare"
        ],

function(declare
        ) {

    var ValidateGraph = declare("deploy.widgets.workflow.ValidateGraph", [], {});

    ValidateGraph.validate = function(editor) {
        var graph = editor.graph;
        var model = graph.model;
        var parent = graph.getDefaultParent();
        var cells = [];
        ValidateGraph.helper(graph, model, parent, cells);
        var i;
        var errors = false;
        for (i = 0; i < cells.length; i++) {
            if (cells[i].activity) {
                errors = cells[i].activity.refreshOverlays(true) || errors;
            }
        }
        graph.refresh();
        return errors;
    };

    ValidateGraph.helper = function(graph, model, parent, cells) {
        var i;
        var childCount = model.getChildCount(parent);
        for (i = 0; i < childCount; i++) {
            var cell = model.getChildAt(parent, i);
            if (!cell.edge) {
                if (cell.activity && cell.activity.isContainer) {
                    ValidateGraph.helper(graph, model, cell, cells);
                }
                cells.push(cell);
            }
        }
    };

    return ValidateGraph;

});

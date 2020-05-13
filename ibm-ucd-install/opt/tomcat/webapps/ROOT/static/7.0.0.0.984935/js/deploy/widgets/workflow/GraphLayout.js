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
/*global define, require, mxClient, mxUtils, mxHierarchicalLayout, mxGraphLayout, mxGeometry, mxRectangle, mxConstants, MedianCellSorter */
define(["dojo/_base/declare"],

    function (declare) {

        var GraphLayout = declare("deploy.widgets.workflow.GraphLayout", [], {});

        GraphLayout.animation_timer = null;

        GraphLayout.CONTAINER_PADDING = 30;

        // horizontal distance to move note to its paired step
        GraphLayout.NOTE_PADDING = 60;
        // a step within this horizontal distance is considered paired
        GraphLayout.NOTE_PAIRING = 150;

        GraphLayout.ANIMATION_CELL_THRESHOLD = 100;

        GraphLayout.MAX_SCALE = 2;
        GraphLayout.MIN_SCALE = 0.2;
        GraphLayout.ZOOM_FACTOR = 1.1;
        GraphLayout.ZOOM_DELTA_LIMIT = 200;
        GraphLayout.ZOOM_DELTA_SCALE = 0.25;

        GraphLayout.layout = function (editor, options) {
            options = options || {};
            var edgeCount = GraphLayout.getVisibleEdges(editor).length;
            if (!GraphLayout.animation_timer) {
                var graph = editor.graph;
                var model = graph.model;
                var view = graph.getView();
                var parent = graph.getDefaultParent();
                var scale = view.scale;
                var animate = options.animate;
                // Disable animation if there is a large number of steps for performance reasons
                if (editor.graph.model.cells.hasOwnProperty(GraphLayout.ANIMATION_CELL_THRESHOLD)) {
                    animate = false;
                }
                if (GraphLayout.animation_timer) {
                    window.clearTimeout(GraphLayout.animation_timer);
                    GraphLayout.animation_timer = null;
                }
                model.beginUpdate();
                try {
                    // collect cell info
                    var initialCellGeo = {};
                    var edges = [];
                    var left = GraphLayout.layoutHelper(
                        graph,
                        model,
                        parent,
                        editor.autolayout,
                        initialCellGeo,
                        edges
                    );

                    // reset edges
                    var i;
                    var geo;
                    for (i = 0; i < edges.length; i++) {
                        geo = new mxGeometry();
                        geo.relative = true;
                        edges[i].setGeometry(geo);
                    }

                    // normalize cells (left most cell is at 0)
                    var id = null;
                    left = -left;
                    for (id in initialCellGeo) {
                        if (initialCellGeo.hasOwnProperty(id)) {
                            var data = initialCellGeo[id];
                            // adjust x so diagram centers correctly
                            geo = data.geo.clone();
                            geo.x += left;
                            model.setGeometry(model.getCell(data.cellID), geo);
                        }
                    }

                    if (editor.autolayout) {

                        // determine note placement
                        var notePlacement = {};
                        GraphLayout.determineNotePlacement(
                            model,
                            parent,
                            notePlacement
                        );

                        GraphLayout.autoLayout(
                            graph,
                            model,
                            parent,
                            scale,
                            edges,
                            edgeCount,
                            notePlacement,
                            options
                        );

                        if (animate) {
                            GraphLayout.animate(
                                graph,
                                model,
                                scale,
                                initialCellGeo,
                                options
                            );
                        } else if (options.select) {
                            graph.setSelectionCell(options.select);
                        }
                    } else if (options.select) {
                        graph.setSelectionCell(options.select);
                    }

                } finally {
                    model.endUpdate();
                }
            }
        };

        /**
         * Calculates the best positions for all cells in the graph
         */
        GraphLayout.autoLayout = function (
            graph,
            model,
            parent,
            scale,
            edges,
            edgeCount,
            notePlacement,
            options)
        {
            var hierarchicalLayout = new mxHierarchicalLayout(graph);
            hierarchicalLayout.useBoundingBox = false;
            hierarchicalLayout.resizeParent = false;
            hierarchicalLayout.moveParent = false;
            if (edgeCount > 4) {
                hierarchicalLayout.interRankCellSpacing = 50;
            } else if (edgeCount > 3) {
                hierarchicalLayout.interRankCellSpacing = 75;
            } else if (edgeCount > 2) {
                hierarchicalLayout.interRankCellSpacing = 100;
            } else {
                hierarchicalLayout.interRankCellSpacing = 150;
            }
            hierarchicalLayout.interHierarchySpacing = 10;
            hierarchicalLayout.parentBorder = GraphLayout.CONTAINER_PADDING;

            // Map of all unconnected cells contained in a parent
            var unconnected = {};

            // Map of all subgraphs contained within a parent
            var subGraphs = {};

            /**
             * Overrides mxLayout's hierarchicalLayout.placementStage function.
             *
             * Here, we add the capability for mxLayout to place containers and their contents properly.
             * Throughout placement stage, we collect data about the entire graph which is then used
             * after placementStage has finished to then position the unconnected cells.
             */
            hierarchicalLayout.placementStage = function (oldX, parent) {
                var subGraphInfo = {};
                GraphLayout.analyzeGraph(this, model, subGraphInfo);

                // X coordinate which we will return so that mxLayout can place steps relative to
                // each other on the X-axis
                var x = oldX;

                // If we are moving from outside of a container to inside of a container make a
                // recursive call to auto layout
                if (subGraphInfo.insideContainer && subGraphInfo.parent
                    .id !== parent.id) {
                    x = GraphLayout.calculateContainerXValueForChildCellsPlacement(
                        subGraphInfo, subGraphs,
                        hierarchicalLayout.parentBorder,
                        hierarchicalLayout.interHierarchySpacing
                    );

                    // Adjust Y coordinate
                    var oldY = subGraphInfo.parent.geometry.y;
                    subGraphInfo.parent.geometry.y = -GraphLayout.getLabelMetrics(
                        graph,
                        subGraphInfo.parent,
                        true,
                        null, scale).size.height
                        - hierarchicalLayout.parentBorder;

                    // recurse into placementStage with a new parent (the container)
                    hierarchicalLayout.placementStage(x, subGraphInfo.parent);

                    // After placing the cells, their coordinates are tied to the container so it is
                    // safe to reset the container back to its old Y value
                    subGraphInfo.parent.geometry.y = oldY;

                    // Reset X coordinate
                    x = oldX;

                    // fix parent size after placing cells
                    GraphLayout.resizeParent(subGraphInfo.parent, graph);
                } else {
                    if (subGraphInfo.isUnconnected) {
                        // If cell is unconnected, push into list and leave for last. Cell will be
                        // placed next to group of all connected cells
                        var unconnectedList = unconnected[
                            subGraphInfo.parent.id];
                        if (!unconnectedList) {
                            unconnectedList = [];
                        }
                        if (unconnectedList.indexOf(subGraphInfo.subGraph[0]) === -1) {
                            unconnectedList.push(subGraphInfo.subGraph[0]);
                        }
                        unconnected[subGraphInfo.parent.id] =
                            unconnectedList;
                    } else {
                        // If cell is part of subgraph, push into list and leave for later. Unconnected
                        // cells are positioned relative to connected graphs.
                        var subGraphList = subGraphs[subGraphInfo.parent.id];
                        if (!subGraphList) {
                            subGraphList = [];
                        }
                        if (subGraphList.indexOf(subGraphInfo.subGraph) === -1) {
                            subGraphList.push(subGraphInfo.subGraph);
                        }
                        subGraphs[subGraphInfo.parent.id] = subGraphList;
                        // subGraphInfo.useDefaultLayout is determined in the GraphLayout.analyzeGraph
                        // function
                        if (subGraphInfo.useDefaultLayout) {
                            // Let mxLayout handle placement of all cells in this subgraph.
                            x = mxHierarchicalLayout.prototype.placementStage
                                .apply(this, arguments);
                        } else {
                            /**
                             * Implementing a custom layout will be a combination of two steps.
                             *
                             * First: GraphLayout.analyzeGraph() must be able to determine whether a
                             * custom layout is applicable to the current subgraph. Once it determines
                             * this, subGraphInfo.useDefaultLayout should be set to false. In that case,
                             * placementStage will have you end up in this branch during cell placement.
                             *
                             * Second: write a function that will be called from this branch which will
                             * place cells according to the custom layout(s) that you desire.
                             * Example: x = GraphLayout.placeMySubgraph(subGraphInfo);
                             */
                            console.log(
                                "A custom layout hasn't been implemented"
                            );
                            x = mxHierarchicalLayout.prototype.placementStage
                                .apply(this, arguments);
                        }
                    }
                }
                return x;
            };

            // Kick off the recursive process for placing cells for all parents
            hierarchicalLayout.execute(parent);

            // Afterwards, place all unconnected steps relative to the subgraphs placed with mxLayouts
            // placement algorithm.
            GraphLayout.placeUnconnectedSteps(
                graph,
                model,
                subGraphs,
                unconnected,
                notePlacement,
                hierarchicalLayout.interHierarchySpacing,
                hierarchicalLayout.parentBorder,
                scale
            );
        };

        /**
         * This is used to get mxLayout to place the contents of containers in the correct place. The
         * x value it calculates is based on whether the container already has subgraphs placed inside.
         *
         * If it already has subgraphs inside then the placement of the current subgraph should be to
         * the left of the existing subgraphs + cellSpacing
         *
         * If there are no subgraphs inside then the current subgraph is the first one being placed in
         * the current container. It should be aligned such that its left-most cell is [parentBoarder]
         * padding away from the left side.
         */
        GraphLayout.calculateContainerXValueForChildCellsPlacement = function (
            subGraphInfo,
            subGraphs,
            parentBorder,
            cellSpacing)
        {
                var x = subGraphInfo.parent.geometry.x;
                var subGraphsAlreadyInContainer = subGraphs[subGraphInfo.parent.id];
                if (subGraphsAlreadyInContainer) {
                    x += GraphLayout.calculateBoundsOfPlacedStepsForAllSubGraphs(
                        subGraphsAlreadyInContainer).maxX + cellSpacing;
                } else {
                    x += parentBorder;
                    // Sometimes, mxLayout decides to place cells too far to the left. If that is the case,
                    // we make sure that the current position of the graph is at minimum in line with the
                    // edge of the container.
                    var sizeOfSubGraph = GraphLayout.calculateBoundsOfPlacedSteps(
                        subGraphInfo.subGraph);
                    if (sizeOfSubGraph.minX < 0) {
                        x -= sizeOfSubGraph.minX;
                    }
                }
                return x;
            };

        /**
         * Wrap note lines at 64 characters in autolayout mode
         */
        GraphLayout.layoutLabel = function (graph, cell, autoLayout, label) {
            if (cell.style === "noteStyle") {
                var i;
                var parts = label.split('\n');
                var wrapAt = 64;
                // if not auto layout, try to wrap text within size of cell
                if (!autoLayout) {
                    wrapAt = Math.round(cell.geometry.width/
                       GraphLayout.getLabelMetrics(graph, cell, autoLayout, label).avgCharWidth)
                       - 10; // don't wrap at the very edges of note--allow a space of 5 characters
                }
                for (i = parts.length-1; i >=0 ; i--) {
                    GraphLayout.wrapLine(parts, i, wrapAt);
                }
                label = parts.join('\n');
            }
            return label;
        };

        GraphLayout.wrapLine = function (parts, inx, max) {
            //  Don't wrap to less than 4 characters, or risk wrapping infinitely
            max = Math.max(max, 4);
            var splitting = false;
            var line = parts[inx];
            while (line.length > max) {
                // try to split on space
                var index = line.substr(max - 3, 6).indexOf(' ');
                var dash = index === -1;
                if (dash) {
                    index = max;
                } else {
                    index += max - 3;
                }
                // splice wrapped line into label
                var wrapped = line.substring(0, index)+(dash?'-':'');
                parts.splice(inx, splitting?0:1, wrapped);
                line = line.substring(index);
                splitting = true;
                inx++;
            }
            if (splitting) {
                parts.splice(inx, 0, line);
            }
        };

        /**
         * get label metrics
         */
        GraphLayout.getLabelMetrics = function (
            graph,
            cell,
            autoLayout,
            label,
            scale,
            optionalState,
            optionalStyle)
        {
            var state = (!!optionalState) ? optionalState : graph.view.getState(cell);
            var style = (!!optionalStyle) ? optionalStyle : ((!!state) ?
                state.style : graph.getCellStyle(cell));
            scale = scale || graph.getView().scale;
            label = label || graph.getLabel(cell);
            var xlate = document.createElement('div');
            xlate.innerHTML = util.escape(label);
            var childNodes = xlate.childNodes[0];
            var parts = childNodes.nodeValue.split('\n');
            parts.sort(function (a, b) {
                return b.length - a.length;
            });
            var fontSize = GraphLayout.getFontSize(scale, autoLayout, cell.style);
            var size = mxUtils.getSizeForString(util.escape(parts[0]),
                fontSize, style[mxConstants.STYLE_FONTFAMILY]);
            size.height = size.height * parts.length;
            return {size: size, avgCharWidth: size.width/parts[0].length};
        };

        GraphLayout.getFontSize = function (scale, autoLayout, style) {
            if ((!autoLayout || style=== "noteStyle") && scale < 0.8) {
                return "18";
            }
            if (scale < 0.2) {
                return "42";
            }
            if (scale < 0.3) {
                return "36";
            }
            if (scale < 0.4) {
                return "32";
            }
            if (scale < 0.5) {
                return "30";
            }
            if (scale < 0.6) {
                return "26";
            }
            if (scale < 0.7) {
                return "22";
            }
            if (scale < 0.8) {
                return "18";
            }
            return "14";
        };

        /**
         * Since mxLayout has no implementation for placing unconnected cells, After mxLayout has placed
         * all the subgraphs we must place all unconnected cells manually.
         */
        GraphLayout.placeUnconnectedSteps = function (
            graph,
            model,
            subGraphs,
            unconnected,
            notePlacement,
            cellSpacing,
            parentBorder,
            scale)
        {
            var parentID = null;
            for (parentID in unconnected) {
                if (unconnected.hasOwnProperty(parentID)) {
                    var parent = model.getCell(parentID);
                    if (parent.activity && parent.activity.isContainer) {
                        // inside a container
                        GraphLayout.placeUnconnectedStepsInsideParent(
                            graph, model, subGraphs, unconnected,
                            notePlacement, parent, cellSpacing, parentBorder,
                            scale);
                    } else {
                        // outside a container
                        GraphLayout.placeUnconnectedStepsInsideParent(
                            graph, model, subGraphs, unconnected,
                            notePlacement, parent, cellSpacing, 0, scale);
                    }
                }
            }
        };

        /**
         * Unconnected cells in the graph are placed in a vertical stack starting at the bottom-left
         * corner of the container, or if they are not in a container then they are placed at the
         * bottom left of the graph.
         */
        GraphLayout.placeUnconnectedStepsInsideParent = function (
            graph,
            model,
            subGraphs,
            unconnected,
            notePlacement,
            parent,
            cellSpacing,
            parentBorder,
            scale)
        {
            var maxY = 0;
            var i;
            for (i = 0; i < parent.children.length; i++) {
                var child = parent.children[i];
                // only look at children that are connected and not edges themselves.
                if (!child.edge && child.edges && child.edges.length !== 0) {
                    maxY = Math.max(child.geometry.y + child.geometry.height, maxY);
                }
            }

            var y = 0;
            if (parent.activity && parent.activity.isContainer) {
                if (maxY === 0) {
                    maxY += GraphLayout.getLabelMetrics(
                        graph,
                        parent,
                        true,
                        null,
                        scale
                    ).size.height;
                }
            }
            maxY += cellSpacing;

            for (i = 0; i < unconnected[parent.id].length; i++) {
                var cell = unconnected[parent.id][i];
                // Place every unconnected cell next to the rest of the connected cells.
                if (cell.style !== "noteStyle") {
                    cell.geometry.x = parentBorder;
                    cell.geometry.y = maxY + y;
                    // resize the parent to accommodate the unconnected cell
                    if (parent.activity && parent.activity.isContainer) {
                        GraphLayout.resizeParent(parent, graph);
                    }
                    y += cell.geometry.height + cellSpacing;
                }
            }

            // layout notes next to their steps
            GraphLayout.placeNotesInsideParent(
                graph,
                model,
                unconnected,
                notePlacement,
                parent);
        };

        /**
         * Notes in the graph are placed near the step they were located prior to the layout.
         */
        GraphLayout.placeNotesInsideParent = function (
            graph,
            model,
            unconnected,
            notePlacement,
            parent)
        {
            var i;
            var flipPosition, placeToLeft, placeToRight;
            var overlapChecks = [];
            var placements = notePlacement[parent.id].placements;
            var bounds = GraphLayout.getBounds(model, parent);
            for (i = 0; i < unconnected[parent.id].length; i++) {
                var cell = unconnected[parent.id][i];
                if (cell.style === "noteStyle") {
                    var placement = placements[cell.id];
                    // paired with step
                    if (placement.step) {
                        var stepCell = model.getCell(placement.step.id);

                        // vertically center note on step
                        cell.geometry.y = stepCell.geometry.y +
                                Math.min(200, stepCell.geometry.height/2) - cell.geometry.height/2;

                        // horizontally place next to step
                        placeToLeft = bounds.x - cell.geometry.width - GraphLayout.NOTE_PADDING;
                        placeToRight = bounds.x + bounds.width + GraphLayout.NOTE_PADDING;
                        if (placement.note.geo.x < placement.step.geo.x) {
                            cell.geometry.x = placeToLeft;
                            flipPosition = placeToRight;
                        } else {
                            cell.geometry.x = placeToRight;
                            flipPosition = placeToLeft;
                        }
                        overlapChecks.push({noteCell: cell, flipPosition: flipPosition});

                    // just keep in diagram area
                    } else if (placement.diagram) {
                        placeToLeft = bounds.x - cell.geometry.width - GraphLayout.NOTE_PAIRING*2;
                        placeToRight = bounds.x + bounds.width + GraphLayout.NOTE_PAIRING*2;
                        if (placement.diagram.toLeft) {
                            cell.geometry.x = placeToLeft;
                            flipPosition = placeToRight;
                        } else {
                            cell.geometry.x = placeToRight;
                            flipPosition = placeToLeft;
                        }
                        overlapChecks.push({noteCell: cell, flipPosition: flipPosition});
                    }
                }
            }

            // try to correct overlapping notes
            GraphLayout.fixOverlaps(model, parent, overlapChecks);

            // resize the parent to accommodate the note
            if (parent.activity && parent.activity.isContainer) {
                GraphLayout.resizeParent(parent, graph);
            }
        };

        /**
         * Position to left or right of step as long as it doesn't overlap
         */
        GraphLayout.fixOverlaps = function (
                model,
                parent,
                overlapChecks) {
            var i;
            for (i = 0; i < overlapChecks.length; i++) {
                var overlapCheck = overlapChecks[i];
                var noteCell = overlapCheck.noteCell;

                // if it overlaps there, try the other side
                if (GraphLayout.anyOverlaps(model, parent, noteCell.id, noteCell.geometry)) {
                    noteCell.geometry.x = overlapCheck.flipPosition;
                }

                // if note is moved past x=0, shift all cells to right to fit in diagram/container
                if (noteCell.geometry.x < 0) {
                    GraphLayout.moveCells(
                        model,
                        parent,
                        -noteCell.geometry.x,
                        0);
                }
            }
        };

        /**
         * Move all cells in this parent
         */
        GraphLayout.moveCells = function (
            model,
            parent,
            xOffset,
            yOffset) {
            var i;
            var childCount = model.getChildCount(parent);
            for (i = 0; i < childCount; i++) {
                var cell = model.getChildAt(parent, i);
                cell.geometry.translate(xOffset, yOffset);
            }
        };

        /**
         * This function takes a list of subgraphs and finds the overall
         * minimum and maximum X values taken up by an entire group of subgraphs
         */
        GraphLayout.calculateBoundsOfPlacedStepsForAllSubGraphs = function (subGraphs) {
            var size = {
                maxX: Number.MIN_VALUE,
                minX: Number.MAX_VALUE
            };
            if (!subGraphs) {
                size.maxX = 0;
                size.minX = 0;
                return size;
            }
            // This simply iterates over all the individual subgraphs in subGraphs and calls
            // GraphLayout.calculateBoundsOfPlacedSteps on each one
            var index;
            for (index = 0; index < subGraphs.length; index++) {
                var subGraph = subGraphs[index];
                var currSubGraphSize = GraphLayout.calculateBoundsOfPlacedSteps(subGraph);
                size.maxX = Math.max(currSubGraphSize.maxX, size.maxX);
                size.minX = Math.min(currSubGraphSize.minX, size.minX);
            }
            return size;
        };

        /**
         * Find the overall minimum and maximum X values taken up by a single subgraph
         */
        GraphLayout.calculateBoundsOfPlacedSteps = function (subGraph) {
            var size = {
                maxX: Number.MIN_VALUE,
                minX: Number.MAX_VALUE
            };
            if (!subGraph) {
                size.maxX = 0;
                size.minX = 0;
                return size;
            }
            //Find the overall size of all the steps in subGraph
            var index;
            for (index = 0; index < subGraph.length; index++) {
                if (!subGraph[index].edge) {
                    var geo = subGraph[index].geometry;
                    size.maxX = Math.max(geo.x + geo.width, size.maxX);
                    size.minX = Math.min(geo.x, size.minX);
                }
            }
            return size;
        };

        /**
         * Sets the size of a container as a function of getPreferredSizeForCell()
         */
        GraphLayout.resizeParent = function (parent, graph) {
            var parentGeo = parent.geometry;
            var preferedContainerGeo = graph.getPreferredSizeForCell(parent);
            parentGeo.width = preferedContainerGeo.width;
            parentGeo.height = preferedContainerGeo.height;
        };

        /**
         * This function is called at the beginning of each placement stage and it
         * populates subGraphInfo to contain the information pertinent to laying out cells
         *
         * subGraphInfo.parent is the parent of the current subgraph
         * (either a container or the actual graph)
         * All subGraphs have a parent
         *
         * subGraphInfo.insideContainer determines whether the parent is a container or
         * the overall graph
         *
         * subGraphInfo.subGraph is the list of all cell in the current subgraph
         *
         * In order to generate custom layouts, add a function that is called at the very
         * end of this function that can determine if a custom layout is applicable.
         * This new function would iterate through each cell in subGraphInfo.subGraph and will
         * set the value of subGraphInfo.useDefaultLayout to false if it determines that a
         * custom layout can be applied.
         *
         * Example:
         * GraphLayout.isCustomLayout(layout, model, subGraphInfo);
         */
        GraphLayout.analyzeGraph = function (layout, model, subGraphInfo) {
            subGraphInfo.parent = null;
            subGraphInfo.insideContainer = false;
            subGraphInfo.useDefaultLayout = true;
            subGraphInfo.subGraph = [];
            var key = null;
            for (key in layout.model.vertexMapper) {
                if (layout.model.vertexMapper.hasOwnProperty(key)) {
                    var cell = layout.model.vertexMapper[key].cell;
                    if (cell.parent) {
                        subGraphInfo.parent = cell.parent;
                        if (cell.parent.activity && cell.parent.activity.isContainer) {
                            subGraphInfo.insideContainer = true;
                        }
                    }
                    subGraphInfo.subGraph.push(cell);
                }
            }
            subGraphInfo.isUnconnected = subGraphInfo.subGraph.length === 1;
        };

        /**
         * Collects information from the entire graph and populates initialCellGeo and edges
         *
         * InitialCellGeo is a map of cellID's and their initial geometry before autolayout runs
         * It is only used again during GraphLayout.animate
         */
        GraphLayout.layoutHelper = function (
            graph,
            model,
            parent,
            autolayout,
            initialCellGeo,
            edges)
        {
            var left = 0;
            var childCount = model.getChildCount(parent);
            var i;
            for (i = 0; i < childCount; i++) {
                var cell = model.getChildAt(parent, i);
                if (!cell.edge) {
                    if (cell.activity && cell.activity.isContainer) {
                        GraphLayout.layoutHelper(graph, model, cell,
                                autolayout, initialCellGeo, edges);
                    }
                    var geo = model.getGeometry(cell);
                    if (autolayout || cell.style !== "noteStyle") {
                        var size = graph.getPreferredSizeForCell(cell);
                        geo.height = size.height;
                        geo.width = size.width;
                    }
                    initialCellGeo[cell.id] = {
                        cellID: cell.id,
                        geo: geo.clone()
                    };
                    if (geo.x < left) {
                        left = geo.x;
                    }
                } else {
                    edges.push(cell);
                }
            }

            return left;
        };


        /**
         * In autolayout mode, the position of notes is inferenced by finding the closest step to the
         * right or left of it before the layout is done, After the step is laid out, the note is
         * moved to the right or left of that paired step on the side of the diagram
         */
        GraphLayout.determineNotePlacement = function (
            model,
            parent,
            notePlacement)
        {
            // get all the notes and steps in this container
            var i;
            var geo;
            var bounds = GraphLayout.getBounds(model, parent);
            var childCount = model.getChildCount(parent);
            var container = notePlacement[parent.id] = {notes:{}, steps:{}, placements: {}};
            for (i = 0; i < childCount; i++) {
                var cell = model.getChildAt(parent, i);
                if (!cell.edge) {
                    geo = model.getGeometry(cell).clone();
                    if (cell.activity && cell.activity.isContainer) {
                        container.steps[cell.id] = geo;
                        GraphLayout.determineNotePlacement(model, cell, notePlacement);
                    }
                    if (cell.style === "noteStyle") {
                        container.notes[cell.id] = geo;
                    } else {
                        container.steps[cell.id] = geo;
                    }
                }
            }

            // pair notes with steps
            // size of lasso to use to find neighboring steps
            var lasso = {w: 1600, h: 2};
            GraphLayout.determineNotePlacementHelper(
                container,
                lasso,
                bounds,
                notePlacement
            );
        };

        /**
         * Pair notes with their closest steps
         */
        GraphLayout.determineNotePlacementHelper = function (
            container,
            lasso,
            bounds,
            notePlacement)
        {
            // expand each note horizontally to find its closest step
            var pairs = {};
            var noteID, cellID;
            for (noteID in container.notes) {
                if (container.notes.hasOwnProperty(noteID)) {
                    var id;
                    var closest = Number.MAX_SAFE_INTEGER;

                    // create a discovery area around not to find the best step to pair it with
                    var noteGeo = container.notes[noteID];
                    var lassoGeo = noteGeo.clone();
                    lassoGeo.x -= lasso.w/2;
                    lassoGeo.width += lasso.w;
                    lassoGeo.y += noteGeo.height/2-lasso.h/2;
                    lassoGeo.height = lasso.h;

                    // search steps
                    for (cellID in container.steps) {
                        if (container.steps.hasOwnProperty(cellID)) {
                            var cellGeo = container.steps[cellID];
                            var overlap = GraphLayout.getOverlap(lassoGeo, cellGeo);
                            // pair with the closest nearby step
                            if (overlap>0) {
                                var distance = noteGeo.x < cellGeo.x ?
                                    cellGeo.x - (noteGeo.x + noteGeo.width) :
                                    noteGeo.x - (cellGeo.x + cellGeo.width);
                                if (distance < closest) {
                                    id = cellID;
                                    closest = distance;
                                }
                            }
                        }
                    }

                    container.placements[noteID] = {note: {id: noteID, geo: container.notes[noteID]}};
                    if (closest !== Number.MAX_SAFE_INTEGER) {
                        // paired with step
                        container.placements[noteID].step = {id: id, geo: container.steps[id]};
                    } else {
                        // not paired with step, just keep near steps in diagram
                        if (noteGeo.getCenterX() < bounds.getCenterX()) {
                            container.placements[noteID].diagram = {toLeft: bounds.x-noteGeo.x-noteGeo.width};
                        } else {
                            container.placements[noteID].diagram = {toRight: noteGeo.x-bounds.x-bounds.width};
                        }
                    }
                }
            }
            return notePlacement;
        };

        /**
         * See if a geo overlaps with any other cell in this parent
         */
        GraphLayout.anyOverlaps = function (
            model,
            parent,
            ignoreId,
            testGeo)
        {
            // get all the notes and steps in this container
            var i;
            var childCount = model.getChildCount(parent);
            for (i = 0; i < childCount; i++) {
                var cell = model.getChildAt(parent, i);
                if (!cell.edge && cell.id!==ignoreId) {
                    var geo = model.getGeometry(cell);
                    if (GraphLayout.getOverlap(geo, testGeo)>0) {
                        return true;
                    }
                }
            }
            return false;
        };

        /**
         * Get overlap between two geos
         */
        GraphLayout.getOverlap = function (geo1, geo2) {
            var xOverlap = Math.max(0, Math.min(geo1.x+geo1.width, geo2.x+geo2.width) - Math.max(geo1.x, geo2.x));
            var yOverlap = Math.max(0, Math.min(geo1.y+geo1.height, geo2.y+geo2.height) - Math.max(geo1.y, geo2.y));
            return xOverlap * yOverlap;
        };


        /**
         * Get container bounds ignoring notes and edges
         */
        GraphLayout.getBounds = function (
            model,
            container)
        {
            // get all the notes and steps in this container
            var i;
            var geo;
            var childCount = model.getChildCount(container);
            for (i = 0; i < childCount; i++) {
                var cell = model.getChildAt(container, i);
                if (!cell.edge && cell.style !== "noteStyle") {
                    if (!geo) {
                        geo = model.getGeometry(cell).clone();
                    } else {
                        geo.add(model.getGeometry(cell));
                    }
                }
            }
            return geo || new mxRectangle();
        };



        GraphLayout.getVisibleEdges = function (editor) {
            var edges = [];
            var graph = editor.graph;
            var model = graph.model;
            var parent = graph.getDefaultParent();
            GraphLayout.getVisibleEdgeCountHelper(model, parent, edges);
            return edges;
        };

        GraphLayout.getVisibleEdgeCountHelper = function (
            model,
            parent,
            edges)
        {
            var i = 0;
            var childCount = model.getChildCount(parent);
            for (i = 0; i < childCount; i++) {
                var cell = model.getChildAt(parent, i);
                if (!cell.edge) {
                    if (cell.activity && cell.activity.isContainer) {
                        GraphLayout.getVisibleEdgeCountHelper(
                            model,
                            cell,
                            edges
                        );
                    }
                } else if (cell.visible) {
                    edges.push(cell);
                }
            }
        };

        /**
         * Resets the position of all cells back the their initial positions
         * (using the data in initialCellGeo) and the animates them back into
         * the positions calculated by autolayout.
         */
        GraphLayout.animate = function (
            graph,
            model,
            scale,
            initialCellGeo,
            options)
        {
            var i;
            // search initialCellGeo for cells not to animate and remove them from initialCellGeo
            if (options.cellsNotToAnimate) {
                for (i = 0; i < options.cellsNotToAnimate.length; i++) {
                    delete initialCellGeo[options.cellsNotToAnimate[i]];
                }
            }
            // move laid out cells back to original position, then animate them into place
            var id = null;
            var changes = 0;
            var changeMap = {};
            var view = graph.getView();
            var animateEdgeMap = {};
            for (id in initialCellGeo) {
                if (initialCellGeo.hasOwnProperty(id)) {
                    var data = initialCellGeo[id];
                    var cell = model.getCell(data.cellID);
                    var geo = model.getGeometry(cell);
                    if (geo.x !== data.geo.x || geo.y !== data.geo.y) {
                        model.setGeometry(cell, data.geo);
                        changeMap[id] = {
                            geometry: geo,
                            previous: data.geo,
                            state: view.getState(cell, false)
                        };
                        changes++;
                        if (cell.edges && (Math.abs(geo.x - data.geo.x) >
                                40 || Math.abs(geo.y - data.geo.y))) {
                            for (i = 0; i < cell.edges.length; i++) {
                                var edge = cell.edges[i];
                                if (!animateEdgeMap[edge.id]) {
                                    animateEdgeMap[edge.id] = edge;
                                    var g = new mxGeometry();
                                    g.relative = true;
                                    edge.setGeometry(g);
                                }
                            }
                        }
                    }
                }
            }

            var maxStep = changes < 5 ? 10 : (changes < 10 ? 5 : (
                changes < 20 ? 4 : (changes < 30 ? 2 : 1)));
            var step = 0;
            var delay = 30;

            var animate = null;
            animate = function () {
                // move cells
                var id = null;
                for (id in changeMap) {
                    if (changeMap.hasOwnProperty(id)) {
                        var change = changeMap[id];
                        var state = change.state;
                        if (state && step > 0) {
                            var dx = (change.geometry.x - change.previous.x) * scale;
                            var dy = (change.geometry.y - change.previous.y) * scale;
                            var sx = (change.geometry.width -
                                change.previous.width) * scale;
                            var sy = (change.geometry.height -
                                change.previous.height) * scale;
                            state.x += dx / maxStep;
                            state.y += dy / maxStep;
                            state.width += sx / maxStep;
                            state.height += sy / maxStep;
                            graph.cellRenderer.redraw(state);
                        }
                    }
                }
                if (step < maxStep) {
                    step++;
                    GraphLayout.animation_timer = window.setTimeout(
                        animate, delay);
                } else {
                    GraphLayout.animation_timer = null;
                    if (options.select) {
                        graph.setSelectionCell(options.select);
                    }
                    graph.fit(GraphLayout.MIN_SCALE);
                }
            };
            animate();
        };
        return GraphLayout;
    });

/**
 * try to add some stability to layout the position of cells with a row are
 * normally determined by the Sugiyama layout algorithm however if the algorithm
 * doesn't care, sort the row by cell names otherwise returning a zero will mix
 * up order every time this is run
 */
MedianCellSorter.prototype.compare = function (a, b) {
    var r = 0;
    if (a !== null && b !== null) {
        if (b.medianValue > a.medianValue) {
            r = -1;
        } else if (b.medianValue < a.medianValue) {
            r = 1;
        } else if (a.cell.cell && b.cell.cell) {
            r = a.cell.cell.value.localeCompare(b.cell.cell.value);
        }
    }
    return r;
};
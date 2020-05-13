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

/*global define, require, mxGraph, mxEvent, mxCellHighlight, mxConstants, mxGraphSelectionModel,
  mxText, mxShape, MouseEvent, mxUtils, mxRectangle, mxRectangleShape, mxOutline, mxClient, mxDivResizer, mxDragSource,
  mxHierarchicalLayout, mxImage, mxClient, mxEventObject, mxVertexHandler, mxConnectionHandler, mxPoint, mxTooltipHandler, _
*/

define([
    "dojo/_base/declare",
    "dijit/layout/ContentPane",
    "idx/layout/BorderContainer",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/_base/xhr",
    "dojo/window",
    "dojo/sniff",
    "dojo/dom",
    "dojo/dom-style",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/dom-attr",
    "dojo/dom-geometry",
    "dojo/aspect",
    "dojo/on",
    "dojo/mouse",
    "dojo/query",
    "dojo/_base/Deferred",
    "dojo/DeferredList",
    "deploy/widgets/workflow/GraphEdgeManager",
    "deploy/widgets/workflow/activity/ActivityCreator",
    "js/webext/widgets/Alert",
    "dijit/form/Button",
    "dijit/form/Textarea",
    "js/webext/widgets/Dialog",
    "deploy/widgets/workflow/GraphDiagram",
    "deploy/widgets/workflow/GraphToolbar",
    "deploy/widgets/workflow/GraphLayout",
    "deploy/widgets/workflow/GraphTooltips",
    "deploy/widgets/workflow/GraphPalettePane",
    "deploy/widgets/workflow/GraphPaletteDialog"
    ],

function(
    declare,
    ContentPane,
    BorderContainer,
    array,
    lang,
    xhr,
    win,
    sniffer,
    dom,
    domStyle,
    domClass,
    domConstruct,
    domAttr,
    domGeo,
    aspect,
    on,
    mouse,
    query,
    Deferred,
    DeferredList,
    GraphEdgeManager,
    ActivityCreator,
    Alert,
    Button,
    Textarea,
    Dialog,
    GraphDiagram,
    GraphToolbar,
    GraphLayout,
    GraphTooltips,
    GraphPalettePane,
    GraphPaletteDialog) {
    /**
     * This widget provides some skeleton for mxGraph implementations, as well as utility methods.
     */
    return declare('deploy.widgets.workflow.BaseGraph', [ContentPane], {

        graph: null,
        edgeManager: null,
        tooltips: null,
        activityCreator: null,
        initialized: false,
        loaded: null,
        diagramOnly: undefined,

        MANUAL_ZOOM_THRESHOLD: 0.85,
        AUTOLAYOUT_ZOOM_THRESHOLD: 0.85,
        MAX_MAGNIFY_HEIGHT: 125,

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            this.loaded = new Deferred();

            this.tooltips = new GraphTooltips();

            this.domNode.style.padding = 0;
            this.domNode.style.overflow = "hidden";
            domStyle.set(this.domNode, "border-top", "1px solid #d2d2d2");
            query(".footer-spacer")[0].style.height = 0;
            this.exploreMode = !!window.parent.document.getElementById("explore_iframe_id");

            this.bc = new BorderContainer({
                persist: true,
                gutters: false,
                liveSplitters: true,
                style: "width: 100%;min-width:800px",
                onPanelOpen: function() {
                    if (!self.exploreMode) {
                        util.setCookie("graphPaletteClosed", "false");
                    }
                },
                onPanelClose: function() {
                    if (!self.exploreMode) {
                        util.setCookie("graphPaletteClosed", "true");
                    }
                }
            });

            // palette
            this.leftPane = new ContentPane({
                persist: true,
                region: 'left',
                minSize: 25,
                splitter: true,
                style: "width: 260px; border:none;background-color: #808080;visibility:hidden;"
            });
            this.resizePalettePromise = new Deferred();
            var aspectLeftHandle = aspect.after(this.leftPane, "resize", function() {
                aspectLeftHandle.remove();
                self.resizePalettePromise.resolve();
            });

            // graph editor
            this.graphPane = new ContentPane({
                minSize: 75,
                region: 'center',
                style: "border:none;overflow:hidden;min-width:800px"
            });
            this.graphDiagram = new GraphDiagram({
                editor: this
            });
            this.graphPane.addChild(this.graphDiagram);

            // toolbar
            domStyle.set(this.graphDiagram.toolbarAttach, {
                position: "relative",
                borderBottom: "1px solid #D2D2D2",
                display: "none"
            });
            this.resizePalettePromise.then(function(){
                domStyle.set(self.graphDiagram.toolbarAttach, "display", "");
            });
            this.toolbarContainer = domConstruct.create("div", {
                style: {
                    display: "inline-block"
                }
            }, this.graphDiagram.toolbarAttach);

            // A bug was introduced in Safari 9 causing touch pad scroll events to only
            // trigger 1 event per touch. Disable scroll to zoom for Safari 9+
            // Source:
            // https://bugs.webkit.org/show_bug.cgi?id=149526
            var safariVersion = sniffer("safari");
            if (!safariVersion || (safariVersion && safariVersion < 9)) {
                this.graphPane.on("wheel", _.debounce(function(e) {
                    if (self.zoomTimeout) {
                        clearTimeout(self.zoomTimeout);
                    }
                    self.zoomTimeout = setTimeout(function() {
                        // Prevent zooming in and out when changing the scale of the whole page
                        // (This is when you ctrl+zoom / pinch to zoom)
                        if (!e.ctrlKey) {
                            var view = self.graph.view;
                            var graphBounds = view.getGraphBounds();
                            var zoomDeltaScale;
                            var scale;
                            if (e.deltaY < 0 && view.scale < GraphLayout.MAX_SCALE) {
                                zoomDeltaScale = -GraphLayout.ZOOM_DELTA_SCALE;
                                scale = view.scale * GraphLayout.ZOOM_FACTOR;
                            } else if (e.deltaY > 0 && view.scale > GraphLayout.MIN_SCALE) {
                                zoomDeltaScale = GraphLayout.ZOOM_DELTA_SCALE;
                                scale = view.scale * (1 / GraphLayout.ZOOM_FACTOR);
                            }
                            if (scale) {
                                var mouseX = ((e.layerX + graphBounds.getCenterX()) - self.paneBounds.w / 2);
                                var mouseY = ((e.layerY + graphBounds.getCenterY()) - self.paneBounds.h / 2);
                                // +5 to startX and +4 to startY in order to correct for mxClient inconsistency
                                var startX = (graphBounds.x / view.scale) + 5;
                                var startY = (graphBounds.y / view.scale) + 4;
                                var deltaLimit = GraphLayout.ZOOM_DELTA_LIMIT / (view.scale * GraphLayout.ZOOM_FACTOR);
                                mouseX = Math.min(mouseX, deltaLimit);
                                mouseX = Math.max(mouseX, -deltaLimit);
                                mouseY = Math.min(mouseY, deltaLimit);
                                mouseY = Math.max(mouseY, -deltaLimit);
                                var x = startX + zoomDeltaScale * mouseX;
                                var y = startY + zoomDeltaScale * mouseY;
                                view.scaleAndTranslate(scale, x, y);
                            }
                        }
                    }, 5);
                }, 0));
            }

            // start graph after data set and pane sized
            this.dataSetPromise = new Deferred();
            this.resizeGraphPromise = new Deferred();
            var aspectGraphHandle = aspect.after(this.graphPane, "resize", function() {
                aspectGraphHandle.remove();
                self.resizeGraphPromise.resolve();
            });
            this.graphPanePromise = new Deferred();
            aspect.before(this.graphPane, "resize", function(bounds){
                var b = !self.paneBounds;
                self.paneBounds = bounds;
                if (b) {
                    self.graphPanePromise.resolve();
                }
            });
            new DeferredList([this.dataSetPromise, this.resizeGraphPromise]).then(function() {
                self.graphStartupDelayed(self.data);
            });

            // startup everything
            this.bc.addChild(this.graphPane);
            this.addChild(this.bc);
            this.bc.startup();
            this.resize();
        },

        /**
         * Add toolbar.
         */
        buildToolbar: function(versionData) {
            this.toolbar = new GraphToolbar({
                editor: this,
                versionData: versionData
            });
        },

        destroyToolbar: function() {
            this.toolbar.destroyToolbar();
        },

        /**
         * Populate palette.
         */
        refreshStepPalette: function(config, openClipboard) {
            lang.mixin(this.graphPalettePane, config);
            if (this.graphPalettePane) {
                this.graphPalettePane.refreshStepPalette(config, openClipboard);
            }
        },

        /**
         * Start diagram.
         */
        graphStartup: function(data) {
            // see if this was opened in explore dialog from this same process
            var iframe = window.parent.document.getElementById("explore_iframe_id");
            if (iframe && iframe.dataset.processId === this.processId) {
                var alert = new Alert({
                    message: i18n("You cannot edit a process from within itself.")
                });
                this.readOnly = true;
            }

            // add palettes if not read only
            if (!this.readOnly) {

                // create palette dialog
                this.graphPaletteDialog = new GraphPaletteDialog({
                    'class':'nonModal',
                    editor: this,
                    mode: this.mode
                });

                // create side palette
                var spinner = null;
                if (util.getCookie("graphPaletteClosed") !== "true" && !this.exploreMode) {
                    spinner = domConstruct.create("div", {
                        "class": "loading-spinner",
                        style: "position: absolute; left:75px; top: 50%;"
                    }, this.domNode);
                }
                this.graphPalettePane = this.graphPaletteDialog.palettePane = new GraphPalettePane({
                    spinner: spinner,
                    editor: this,
                    myPane: this.leftPane,
                    paletteDialog: this.graphPaletteDialog,
                    resizePalettePromise: this.resizePalettePromise,
                    style: "height: 95%; width:100%",
                    mode: this.mode
                });

                // add palettes to side and toolbar
                this.leftPane.addChild(this.graphPalettePane);
                this.graphPalettePane.startup();
                this.bc.addChild(this.leftPane);
                if (util.getCookie("graphPaletteClosed") === "true" || this.exploreMode) {
                    this.bc.collapse("left");
                }

            } else {
                domStyle.set(this.graphDiagram.toolbarAttach, "display", "");
            }

            this.data = data;
            this.dataSetPromise.resolve();
        },

        createGraph: function(diagram) {
            var self = this;
            var container;
            if (this.diagramOnly) {
                container = domConstruct.create('div');
                domStyle.set(container, "width", this.diagramOnlyWidth + "px");
                domStyle.set(container, "height", this.diagramOnlyHeight + "px");
                this.diagramOnlyContainer = container;
            } else {
                this.diagram = diagram;

                container = this.diagram.mxgraphAttach;
                container.style.overflow = 'hidden';
                container.style.height = win.getBox().h + "px";
            }

            mxEvent.disableContextMenu(container);
            mxConstants.SHADOWCOLOR = '#CCCCCC';
            mxConstants.VERTEX_SELECTION_COLOR = '#0099FF';
            mxConstants.HANDLE_FILLCOLOR = '#FFFFFF';
            mxConstants.HIGHLIGHT_COLOR = "#00B2EF";
            mxConstants.TARGET_HIGHLIGHT_COLOR = "#00B2EF";
            mxConstants.VERTEX_HIGHLIGHT_COLOR = "#00B2EF";
            mxConstants.DROP_TARGET_COLOR = "#00B2EF";

            this.graph = new mxGraph(container);

            this.configureGraph();
            this.setGraphStyling();

            if (!this.diagramOnly) {
                // hide any tool tip if cursor has left the diagram
                on(this.diagram.mxgraphAttach, mouse.leave, function() {
                    self.graph.tooltipHandler.hide();
                });

                this.graph.tooltipHandler.mouseMove = function(graph, e) {
                    if (mxClient.IS_IE) {
                        e.evt.MSPOINTER_TYPE_MOUSE = "mouse";
                    }
                    mxTooltipHandler.prototype.mouseMove.call(this, graph, e);
                };
                // Create the overview box.
                var outlineBox = new mxOutline(this.graph, this.diagram.outlineAttach);

                // setup magnify box
                this.magnifySvg = document.createElementNS(mxConstants.NS_SVG, "svg");
                this.magnifySvg.style.width = "100%";
                this.magnifySvg.style.height = "100%";
                this.magnifySvg.style.display = "block";
                this.magnifyCanvas = document.createElementNS(mxConstants.NS_SVG, "g");
                this.magnifySvg.appendChild(this.magnifyCanvas);
                this.diagram.magnifyAttach.appendChild(this.magnifySvg);
            }

            // position of hover connector arrow on shape
            mxConnectionHandler.prototype.getIconPosition = function(icon, state) {
                var cx=0;
                var cy=0;
                if (!self.zoomToSelectionData || self.zoomToSelectionData.cells[state.cell.id]) {
                    cx = state.getCenterX() + (this.graph.getView().scale<0.5 ? state.width/2 : 0);
                    cy = state.getCenterY();
                    icon.node.setAttribute('visibility', 'visible');
                    cx -= icon.bounds.width / 2;
                    cy -= icon.bounds.height / 2;
                } else {
                    icon.node.setAttribute('visibility', 'hidden');
                }
                return new mxPoint(cx, cy);
            };

            // update zoom to selection
            this.graph.getSelectionModel().addListener(mxEvent.CHANGE, function(sender, evt) {
                self.graph.tooltipHandler.hide();
                if (self.zoomToSelectionData) {
                    self.toolbar.zoomToSelection();
                }
            });

            this.graph.getTooltip = function(state, node) {
                return state.cell.activity ? self.tooltips.get(state.cell.activity.data, state, node) : (state.cell.tooltip||"");
            };

            this.graph.getStepName = function(cell) {
                return self.tooltips.getStepName(cell);
            };

            this.graph.getLabel = function(cell) {
                var label = mxGraph.prototype.getLabel.apply(this, arguments); // "supercall"
                return GraphLayout.layoutLabel(self.graph, cell, self.autolayout, label);
            };

            if (navigator.userAgent.indexOf("Trident/7.0") !== -1) {
                mxClient.IS_IE = true;
            }

            // Workaround for Internet Explorer ignoring certain styles
            if (mxClient.IS_IE) {
                if (this.diagramOnly) {
                    domStyle.set(container, "position", "");
                } else {
                    domStyle.set(this.diagram.mxgraphAttach, "position", "");
                    domStyle.set(this.diagram.outlineAttach, "position", "");
                }
            }

            this.edgeManager = new GraphEdgeManager({
                graphEditor: this,
                graphHasChanges: function() {
                    self.graphHasChanges();
                }
            });

            this.activityCreator = new ActivityCreator({
                graphEditor: this,
                graphHasChanges: function() {
                    self.graphHasChanges();
                }
            });

            if (!this.diagramOnly) {
                // Keep showing save dialog on page refresh;
                if (util.getCookie("processSaved") === "true") {
                    var message = util.getCookie("processSavedMessage");
                    var error = util.getCookie("error") === "true";
                    this.showSavePopup(message, error);
                }
            }
        },

        /**
         * Given data loaded for the saved workflow, add all activities and edges back to the graph.
         */
        graphStartupDelayed: function(data) {
            var self = this;
            var parent = this.graph.getDefaultParent();
            var model = this.graph.getModel();
            this.pauseLayout = true;

            if (data && data.children) {
                data = this.getLowestGraphChild(data);
            }

            // set autolayout based on saved graph property
            this.autolayout = util.getCookie("graphAutoLayout")==="true";
            if (data && data.layoutMode) {
                var b = data.layoutMode === "auto";
                if (b !== this.autolayout) { // prevent auto on older diagrams
                    this.autolayout = b;
                }
            }

            model.beginUpdate();

            var startOffset =  0;

            this.activityCreator.addSavedActivity({
                "type": "start"
            }, startOffset, 0);

            if (data && data.children) {
                array.forEach(data.children, function(child) {
                    var x = null;
                    var y = null;
                    var h = null;
                    var w = null;

                    var offset = util.getNamedProperty(data.offsets, child.name);
                    if (offset) {
                        x = offset.x + startOffset;
                        y = offset.y;

                        if (child.type === "note") {
                            h = offset.h;
                            w = offset.w;
                        }
                    }
                    self.activityCreator.addSavedActivity(child, x, y, null, h, w);
                });

                // If and only if the top level start cell is not the left most cell, all cells in
                // containers are inexplicably placed too far over to the right by a value of
                // [distance between left most cell x coordinate and top level start cell x coordinate]
                // this moves them back over by the correct amount.
                var topLevelParent = self.graph.getDefaultParent();
                var topLevelStartX = self.graph.getCellGeometry(self.getStartCell(topLevelParent)).x;
                var topLevelChildren = self.graph.getChildCells(topLevelParent);
                var topLevelMinX = GraphLayout.calculateBoundsOfPlacedSteps(topLevelChildren).minX;
                if (topLevelStartX > topLevelMinX) {
                    array.forEach(topLevelChildren, function(cell) {
                        if (cell.activity && cell.activity.isContainer) {
                            array.forEach(cell.children, function(child) {
                                child.geometry.x -= topLevelStartX - topLevelMinX;
                            });
                        }
                    });
                }

                var startCell = this.getStartCell();

                array.forEach(data.edges, function(edge) {
                    var from;
                    if (edge.from) {
                        from = model.filterCells(parent.children, function(cell) {
                            return (cell.activity && cell.activity.getName() === edge.from);
                        })[0];
                    } else {
                        from = startCell;
                    }

                    var to;
                    if (edge.to) {
                        to = model.filterCells(parent.children, function(cell) {
                            return (cell.activity && cell.activity.getName() === edge.to);
                        })[0];
                    }

                    if (from && to) {
                        self.restoreEdge({
                            from: from,
                            to: to,
                            type: edge.type,
                            value: edge.value
                        });
                    }
                });
            }

            // Check for any existing finish cells...if none exist, auto-add one.
            var finishYOffset = 420;
            if (!(this.getFinishCells().length)) {
                this.activityCreator.addNewActivity({
                    "type": "finish"
                }, startOffset - 5, finishYOffset);
            }
            model.endUpdate();

            if (!this.diagramOnly) {
                // get property context info, and store it in a cache to use for autocomplete
                var processType = null;
                var processId = null;
                if (!this.readOnly) {
                    if (this.applicationProcess) {
                        processId = this.applicationProcess.id;
                        processType = 'application';
                    } else if (this.componentProcess) {
                        processId = this.componentProcess.id;
                        if (this.componentProcess.component) {
                            processType = 'component';
                        } else {
                            processType = 'componentTemplate';
                        }
                    }
                }
                this.cache = ["", ""];
                if (this.mode !== "firstDayWizard") {
                    if (processType && processId) {
                        xhr.get({
                            url: bootstrap.restUrl + "process/" + processType + "/" + processId + "/propContext",
                            handleAs: "json",
                            load: function(data) {
                                if (data) {
                                    self.cache[0] = data.prefixes;
                                    self.cache[1] = data.properties;
                                }
                            }
                        });
                    }
                }

                // prevent refresh if diagram is dirty
                window.onbeforeunload = lang.hitch(this, function(e) {
                    if (document.hasChanges) {
                        return i18n("There are unsaved changes.");
                    }
                });

                // override breadcrumb link to prevent paging away when dirty
                var breadcrumbs = query(".idxBreadcrumb")[0];
                if (breadcrumbs) {
                    var i=0;
                    var links = query("a", breadcrumbs);
                    var clickFunc = function(e) {
                        var olink = e.currentTarget.oldLink;
                        if (document.hasChanges) {
                            var dialog = new Dialog();
                            var msg = new Textarea({
                                value: i18n("Are you sure you want to navigate away from this page?") +
                                '\n\n' + i18n("You have unsaved changes which will be lost."),
                                readonly: true,
                                onfocus: "this.blur()",
                                "class": "noBoxShadow",
                                style: {
                                    font: "normal 12px tahoma",
                                    border: "0"
                                }
                            });
                            msg.placeAt(dialog.containerNode);
                            var buttonContainer = domConstruct.create("div", {
                                className: "underField"
                            }, dialog.containerNode);
                            var button1 = new Button({
                                label: i18n("Yes"),
                                "class" : "idxButtonSpecial",
                                onClick: function() {
                                    dialog.destroy();
                                    document.hasChanges = false;
                                    olink.click();
                                }
                            });
                            button1.placeAt(buttonContainer);
                            var button2 = new Button({
                                label: i18n("No"),
                                onClick: function() {
                                    dialog.destroy();
                                }
                            });
                            button2.placeAt(buttonContainer);
                            dialog.show();
                        } else {
                            olink.click();
                        }
                    };
                    for (i=0; i<links.length; i++) {
                        var oldLink = links[i];
                        var newLink = oldLink.cloneNode(true);
                        oldLink.parentNode.replaceChild(newLink, oldLink);
                        newLink.oldLink = oldLink;
                        on(newLink, "click", clickFunc);
                    }
                }
            }

            this.graph.fit(GraphLayout.MIN_SCALE);
            this.pauseLayout = false;

            if (!this.diagramOnly) {
                document.hasChanges = false;
                this.initialized = true;
                if (self.autolayout) {
                    setTimeout(function(){
                        if (!self.pauseLayout) {
                            GraphLayout.layout(self, {animate: false});
                        }
                    });
                }
                this.loaded.resolve();
            }
        },

        /**
         * Get the lowest-level graph child. This fix is in place to protect against unusable
         * graphs caused by repeated application of 4.5 change #1.
         */
        getLowestGraphChild: function(activity) {
            var result = activity;

            array.forEach(activity.children, function(child) {
                if (child.type === "graph") {
                    result = child;
                }
            });

            if (result !== activity) {
                result = this.getLowestGraphChild(result);
            }

            return result;
        },

        /*
         * args = {from, to, type, value}
         */
        restoreEdge: function(edgeArgs) {
            var self = this;
            var parent = this.graph.getDefaultParent();
            var startCell = this.getStartCell();

            var from = edgeArgs.from;
            var to = edgeArgs.to;
            var type = edgeArgs.type;
            var value = edgeArgs.value;

            var newEdge = self.graph.insertEdge(parent, null, null, from, to);

            if (from.activity && from.activity.data.type === "switch") {
                newEdge.data.value = value;
                var edgeValue = newEdge.data.value || i18n("Default");
                self.graph.labelChanged(newEdge, edgeValue);
                if (!value) {
                    self.graph.setDefaultEdge(newEdge, true);
                } else {
                    self.graph.setDefaultEdge(newEdge);
                }
            } else if (!from.activity || from.activity.data.type !== "start") {
                if (type === "FAILURE") {
                    self.edgeManager.addErrorOverlay(newEdge);
                } else if (type === "ALWAYS") {
                    self.edgeManager.addAlwaysOverlay(newEdge);
                }
            }
            return newEdge;
        },

        /**
         * Search all children of the given parent to identify which child is the "start" cell.
         */
        getStartCell: function(parent) {
            if (!parent) {
                parent = this.graph.getDefaultParent();
            }

            var startCell = null;
            array.forEach(parent.children, function(child) {
                if (child.activity && child.activity.data.type === "start") {
                    startCell = child;
                }
            });

            return startCell;
        },

        getFinishCells: function() {
            var model = this.graph.getModel();

            return model.filterDescendants(function(cell) {
                var result = false;
                if (cell.activity && cell.activity.data && cell.activity.data.type === "finish") {
                    result = true;
                }
                return result;
            });
        },

        /**
         *
         */
        getWorkflowJson: function() {
            var self = this;

            var parent = this.graph.getDefaultParent();

            var startCell = this.getStartCell();
            var startCellGeometry = this.graph.getCellGeometry(startCell);
            var startX = startCellGeometry.x;
            var startY = startCellGeometry.y;

            var result = this.getGraphJson(parent, startX, startY);

            return result;
        },

        /**
         * Create raw data about the current state of the graph to submit back to the server as JSON
         */
        getGraphJson: function(parent, xOffset, yOffset) {
            var self = this;

            var result = {
                type: "graph",
                layoutMode: this.autolayout ? "auto" : "manual",
                children: [],
                edges: [],
                offsets: []
            };

            // If this is a user-inserted container cell, we need to track where to position its
            // 'start' activity.
            if (parent.activity) {
                var startCell = self.getStartCell(parent);
                if (startCell) {
                    var startGeometry = self.graph.getCellGeometry(startCell);

                    result.startX = startGeometry.x - xOffset;
                    result.startY = startGeometry.y - yOffset;
                }
            }

            array.forEach(parent.children, function(child) {
                if (child.edge) {
                    var edge = {};
                    if (child.source.activity && !child.source.activity.isUtilityCell()) {
                        edge.from = child.source.activity.getName();
                    }
                    if (child.target.activity && !child.target.activity.isUtilityCell()) {
                        edge.to = child.target.activity.getName();
                    }
                    edge.type = child.data.type;
                    edge.value = child.data.value;

                    result.edges.push(edge);
                } else {
                    if (child.activity && !child.activity.isUtilityCell()) {
                        var childGeometry = self.graph.getCellGeometry(child);
                        var childXOffset = childGeometry.x - xOffset;
                        var childYOffset = childGeometry.y - yOffset;
                        var childHeight = childGeometry.height;
                        var childWidth = childGeometry.width;

                        result.children.push(child.activity.data);

                        var childOffset = {
                            name: child.activity.getName(),
                            x: childXOffset,
                            y: childYOffset,
                            h: childHeight,
                            w: childWidth
                        };
                        result.offsets.push(childOffset);

                        if (child.activity.isContainer) {
                            child.activity.data.children = [self.getGraphJson(child, 0, 0)];
                        }
                    }
                }
            });

            return result;
        },

        /**
         * Recursively find any activities in this graph with the given name and return them.
         * Calls into this function should only pass the "name" parameter. Cell and activityData are
         * for recursive calls back into this function.
         *
         * Returns an array of objects with:
         *  {
         *      cell: Graph cell object containing the activity (or one of the activity's ancestors)
         *      activity: JSONObject representing the activity with the given name
         *  }
         */
        getChildrenByName: function(name, caseInsensitive, cell, activityData) {
            var self = this;
            var result = [];

            if (caseInsensitive) {
                name = name.toLowerCase();
            }

            if (activityData) {
                // This call is scoped to a specific activity within a cell. Check its name and then
                // recursively check its children.
                var nameToCheck = activityData.name;
                if (nameToCheck) {
                    if (caseInsensitive) {
                        nameToCheck = nameToCheck.toLowerCase();
                    }

                    if (nameToCheck === name) {
                        result.push({
                            cell: cell,
                            activity: activityData
                        });
                    }
                }
                array.forEach(activityData.children, function(child) {
                    if (child && !cell.activity.isContainer) {
                        result = result.concat(self.getChildrenByName(name, caseInsensitive, cell, child));
                    }
                });
            } else {
                // Top-level call into this function - find all cells with activity data and
                // recursively call into them and their children.
                var model = this.graph.getModel();
                var allCells = model.filterDescendants(function(cell) {
                    return (cell.activity && cell.activity.data);
                });

                array.forEach(allCells, function(cell) {
                    result = result.concat(self.getChildrenByName(name, caseInsensitive, cell, cell.activity.data));
                });
            }

            return result;
        },

        graphHasChanges: function() {
            if (this.initialized) {
                document.hasChanges = true;
                if (this.toolbar.saveButton) {
                    domClass.add(this.toolbar.saveButton, "enabled");
                    domClass.add(this.toolbar.discardButton, "enabled");
                    if (config.data.systemConfiguration.safeEditFeatureEnabled) {
                        if (this.toolbar.isForDraft()) {
                            domClass.remove(this.toolbar.promoteButton, "enabled");
                        }
                    }
                }
                if (this.mode === "firstDayWizard") {
                    this.firstDayWizardModel.set("processDesignerSaveBtnState", "enabled");
                }
            }
        },

        clearHasChanges: function() {
            document.hasChanges = false;
            if (this.toolbar.saveButton) {
                domClass.remove(this.toolbar.saveButton, "enabled");
                domClass.remove(this.toolbar.discardButton, "enabled");
            }
            if (this.mode === "firstDayWizard") {
                this.firstDayWizardModel.set("processDesignerSaveBtnState", "disabled");
            }
        },

        registerChangedActivity: function(activity) {
            var self = this;
            if (!self._editedActivities) {
                self._editedActivities = [];
            }
            if (activity.data.id) {
                self._editedActivities.push(activity.data.id);
            }
        },

        isActivityChanged: function(activity) {
            var self = this;
            var result = true;
            if (activity.data.id) {
                if (!self._editedActivities) {
                    self._editedActivities = [];
                }
                result = array.indexOf(self._editedActivities, activity.data.id) !== -1;
            }
            return result;
        },

        clearChangedActivities: function() {
            var self = this;
            self._editedActivities = [];
        },


        /**
         * Shows a save confirmation box for 2 seconds after saving.
         *  @param message: The message to display.
         *  @param error: If the message is an error (Non-Save).
         */
        showSavePopup: function(message, error) {
            var self = this;
            util.setCookie("processSaved", "true");
            util.setCookie("processSavedMessage", message);
            util.setCookie("processSavedError", error);
            domClass.remove(this.diagram.dialogAttach, "hide-notification");
            domClass.remove(this.diagram.dialogAttach, "show-notification");
            domClass.remove(this.diagram.dialogAttach, "process-saved");
            domClass.remove(this.diagram.dialogAttach, "process-error");
            var fullMessage = "";
            if ((error === true) || (error === "true")) {
                fullMessage = '<div class="inline-block general-icon warning-icon-large"></div>' + util.escape(message);
                domClass.add(this.diagram.dialogAttach, "process-error");
            } else {
                fullMessage = '<div class="inline-block general-icon check-icon-large"></div>' + util.escape(message);
                domClass.add(this.diagram.dialogAttach, "process-saved");
            }
            this.diagram.dialogAttach.innerHTML = fullMessage;
            setTimeout(function() {
                if (self.diagram.dialogAttach) {
                    domClass.add(self.diagram.dialogAttach, "hide-notification");
                    domClass.remove(self.diagram.dialogAttach, "show-notification");
                }
                util.setCookie("processSaved", "false");
            }, 2000);
            on(this.diagram.dialogAttach, mouse.enter, function() {
                if (self.diagram.dialogAttach) {
                    domClass.add(self.diagram.dialogAttach, "hide-notification");
                    domClass.remove(self.diagram.dialogAttach, "show-notification");
                }
            });
        },

        /**
         * Show the appropriate message based on an error encountered when saving the process
         */
        showSaveErrorPopup: function(error) {
            if (error && error.response) {
                if (error.response.status === 409) {
                    var concurrentModificationAlert = new Alert({
                        message: i18n("Design not saved; this process has been modified since you " +
                            "last opened it. Refresh the page before making changes")
                    });
                } else if (error.response.text) {
                    var errorResponseAlert = new Alert({
                        messages: [i18n("An error occurred while saving the process design."),
                            "",
                        util.escape(error.response.text)]
                    });
                }
            } else {
                var errorAlert = new Alert({
                    message: i18n("An error occurred while saving the process design.")
                });
            }
        },



        //==========================================================================================
        // General graph configuration and styling
        //==========================================================================================

        /**
         *
         */
        configureGraph: function() {
            var self = this;

            //this is to make the drag icon to show in first day wizard popup process designer
            mxDragSource.prototype.dragElementZIndex = 9999;

            this.graph.ordered = true;
            this.graph.setAllowLoops(false);
            this.graph.setConnectable(true);
            this.graph.setDropEnabled(true);
            this.graph.setPanning(true);
            this.graph.panningHandler.useLeftButtonForPanning = true;
            this.graph.setTooltips(true);
            this.graph.foldingEnabled = true;
            this.graph.graphHandler.guidesEnabled = true;
            this.graph.setAutoSizeCells(true);
            this.graph.setTolerance(20);
            mxGraph.prototype.setCellsEditable(false);

            this.graph.connectionHandler.connectImage = new mxImage(bootstrap.imageUrl + "icons/process/step_connector.png", 16, 16);

            // Pre-fetches connect image
            var img = new Image();
            img.src = this.graph.connectionHandler.connectImage.src;

            this.graph.isValidDropTarget = function(cell, cells, evt) {
                // Check if dragged cells include container to make sure that attempting to drop
                // a container inside another container does not return a valid drop target.
                var draggedCellsIncludeContainer = array.some(cells, function(item) {
                    return item.activity && item.activity.isContainer;
                });
                return cell.activity && cell.activity.isContainer && !draggedCellsIncludeContainer;
            };

            this.graph.setDefaultEdge = function(cell, isDefault) {
                var color = isDefault ? "#00A6A0" : "#00649D";
                mxUtils.setCellStyles(self.graph.model, [cell], "fontColor", color);
                mxUtils.setCellStyles(self.graph.model, [cell], "labelBorderColor", color);
                mxUtils.setCellStyles(self.graph.model, [cell], "strokeColor", color);
            };

            this.graph.setEdgeState = function(cell, failed) {
                var color = failed ? "#D9182D" : null;
                if (failed === "always") {
                    color = "#777";
                }
                mxUtils.setCellStyles(self.graph.model, [cell], "strokeColor", color);
            };

            this.graph.createEdge = function(parent, id, value, source, target, style) {
                if (target) {
                    var hasEdge = false;

                    // No-op if there is already an edge directly between the two in either direction
                    array.forEach(source.edges, function(edge) {
                        if ((edge.source === source && edge.target === target) || (edge.source === target && edge.target === source)) {
                            hasEdge = true;
                        }
                    });

                    if (!hasEdge) {
                        self.graphHasChanges();
                        var result = mxGraph.prototype.createEdge(arguments);
                        self.edgeManager.addEdgeOverlays(result, source);
                        return result;
                    }
                }
            };

            this.graph.splitEdge = function(edge, cells, newEdge, dx, dy) {
                var cell = cells[0];

                //Don't split if cell already has edges
                if (cell && !self.disableSplitting && !this.model.getEdgeCount(cell) &&
                        cell.value !== "Finish" && cell.style !== "noteStyle") {
                    dx = dx || 0;
                    dy = dy || 0;

                    if (dx === 0 && dy === 0) {
                        //Offset dx and dy to center cell on edge
                        var height = cell.geometry.height || 0;
                        var width = cell.geometry.width || 0;

                        dx -= width / 2;
                        dy -= height / 2;
                    }

                    var parent = cell.parent || self.graph.getDefaultParent();
                    var source = this.model.getTerminal(edge, true);
                    var target = this.model.getTerminal(edge, false);

                    this.model.beginUpdate();
                    try {
                        newEdge = self.graph.connectionHandler.connect(cell, target, null, cell);
                        this.cellsMoved(cells, dx, dy, false, false);
                        this.cellsAdded(cells, parent, this.model.getChildCount(parent), null, null, true);
                        this.cellsAdded([newEdge], parent, this.model.getChildCount(parent), source, cell, false);
                        this.cellConnected(edge, cell, false);
                        this.fireEvent(new mxEventObject(mxEvent.SPLIT_EDGE, 'edge', edge, 'cells', cells, 'newEdge', newEdge, 'dx', dx, 'dy', dy));
                    } finally {
                        this.model.endUpdate();
                    }
                    return newEdge;
                }
            };

            /**
             * On moving any cell, if the parent has changed, remove all edges from the cell. This
             * prevents users from having arrows from one step to a step inside a container, which
             * would break our graph workflow handling.
             */
            this.graph.addListener(mxEvent.MOVE_CELLS, function(sender, event) {
                var movedCells = event.properties.cells;
                var target = event.properties.target;
                var alert;

                //check to see if after moving all selected cells if there is an instance of a
                // container on top of another. This only executes on mouse events.
                if (event && event.properties.event) {
                    var cells = Object.keys(self.graph.model.cells).map(function (key) {
                        return self.graph.model.cells[key];
                    });
                    var userAlerted = false;
                    array.forEach(movedCells, function(currCell) {
                        if (currCell.activity && currCell.activity.isContainer) {
                            array.forEach(cells, function(cell) {
                                if (cell.activity && cell.activity.isContainer) {
                                    var isCellAtMoveLocation = self.graph.intersects(
                                            self.graph.view.getState(cell),
                                            event.properties.event.layerX,
                                            event.properties.event.layerY);
                                    if (isCellAtMoveLocation && (cell.id !== currCell.id)) {
                                        if (!userAlerted) {
                                            userAlerted = true;
                                            alert = new Alert({
                                                message: i18n("You cannot nest containers!")
                                            });
                                        }
                                        currCell.geometry.x -= event.properties.dx;
                                        currCell.geometry.y -= event.properties.dy;
                                    }
                                }
                            });
                        }
                        // A Start cell has been moved to a different parent
                        else if (currCell.value === "Start" && event.properties.target) {
                            if (!userAlerted) {
                                userAlerted = true;
                                alert = new Alert({
                                    message: i18n("The start cell cannot be moved outside of the parent step.")
                                });
                            }
                            // Find the parent without a start cell
                            array.forEach(cells, function(parent) {
                                // is cell a container or the overall graph?
                                if (parent.id === "1" || (parent.activity && parent.activity.isContainer)) {
                                    var hasStartCell = false;
                                    array.forEach(self.graph.getChildCells(parent), function(child) {
                                        if (child.value ==="Start") {
                                            hasStartCell = true;
                                        }
                                    });
                                    // Found the parent without a start cell, time to fix all references
                                    if (!hasStartCell) {
                                        self.graph.moveCells(
                                                [currCell],
                                                -event.properties.dx,
                                                -event.properties.dy,
                                                event.properties.clone,
                                                parent,
                                                null
                                        );
                                    }
                                }
                            });
                        }
                    });
                }
                // If placing cells into a container run an iteration of autolayout
                var targetIsContainer = target && target.id !== sender.getDefaultParent().id;
                array.forEach(movedCells, function(cell) {
                    var edgesToDelete = [];
                    array.forEach(cell.edges, function(edge) {
                        if (edge.source.parent !== edge.target.parent) {
                            edgesToDelete.push(edge);
                        }
                    });

                    if (edgesToDelete.length > 0) {
                        self.graph.removeCells(edgesToDelete);
                    }
                });
                if (self.autolayout && !self.pauseLayout && targetIsContainer) {
                    GraphLayout.layout(self, {animate: true});
                }
                if (!self.readOnly && (!self.autolayout || !targetIsContainer)) {
                    self.graphHasChanges();
                }
            });

            this.graph.addListener(mxEvent.REMOVE_CELLS, function(sender, event) {
                if (self.autolayout && !self.pauseLayout) {
                    GraphLayout.layout(self, {animate: true});
                }
            });

            this.graph.isHtmlLabel = function(cell) {
                if ( !! cell.htmlLabels) {
                    return cell.htmlLabels;
                }
                return false;
            };

            /**
             * Default behavior for mxGraph is that resizing a parent maintains the relative position
             * of all of the parent's children (so it's impossible to just resize to add extra space
             * at the top or left side of a cell). This function override will cause the children to
             * be moved to the same place on the page where they were prior to the resize.
             */
            this.graph.oldCellsResized = this.graph.cellsResized;
            this.graph.cellsResized = function(cells, bounds) {
                // Gather the existing positions of all children of the cell being resized.
                var oldChildCoords = [];
                array.forEach(cells, function(cell) {
                    array.forEach(cell.children, function(child) {
                        if (!child.edge) {
                            oldChildCoords.push({
                                child: child,
                                parent: cell,
                                x: cell.geometry.x + child.geometry.x,
                                y: cell.geometry.y + child.geometry.y
                            });
                        }
                    });
                });

                self.graph.oldCellsResized(cells, bounds);

                // Check all children to make sure they still fit in the resized parent. For any
                // which don't fit, resize the parent to continue to fit them.
                array.forEach(oldChildCoords, function(childCoords) {
                    var child = childCoords.child;
                    var parent = childCoords.parent;
                    var oldX = childCoords.x;
                    var oldY = childCoords.y;

                    if (oldX < parent.geometry.x) {
                        parent.geometry.width += (parent.geometry.x - oldX);
                        parent.geometry.x = oldX;
                    }
                    if (oldY < parent.geometry.y) {
                        parent.geometry.height += (parent.geometry.y - oldY);
                        parent.geometry.y = oldY;
                    }
                });

                // Reset all child cell positions so that they fit the parent.
                array.forEach(oldChildCoords, function(childCoords) {
                    var child = childCoords.child;
                    var parent = childCoords.parent;
                    var oldX = childCoords.x;
                    var oldY = childCoords.y;

                    var newX = parent.geometry.x + child.geometry.x;
                    var newY = parent.geometry.y + child.geometry.y;

                    if (newX !== oldX || newY !== oldY) {
                        child.geometry.x = oldX - parent.geometry.x;
                        child.geometry.y = oldY - parent.geometry.y;
                    }

                    self.graph.extendParent(child);
                });
            };

            this.graph.addListener(mxEvent.CELLS_RESIZED, function(sender, event) {
                if (!self.readOnly) {
                    self.graphHasChanges();
                }
            });

            this.graph.addListener(mxEvent.CELLS_MOVED, function(sender, event) {
                var changes = !self.readOnly && !self.autolayout;
                // if autolayout, make diagram dirty if they move a shape w/o any edges
                if (!changes && self.autolayout) {
                    var properties = event.getProperties();
                    if (properties && properties.cells) {
                        var i = 0;
                        for (i=0; i<properties.cells.length; i++) {
                            if (!properties.cells[i].edges) {
                                changes = true;
                                break;
                            }
                        }
                    }
                }
                if (changes) {
                    self.graphHasChanges();
                }
            });

            /**
             * Before collapsing a cell, we must notify GraphLayout that it should not animate the children
             * of the container. If we do not do this then autolayout will try to animate in the children from
             * extemely far away and will cause the layout to fail.
             */
            this.graph.addListener(mxEvent.CELLS_FOLDED, function(sender, event) {
                if (!self.pauseLayout && self.autolayout) {
                    var options = {};
                    options.animate = true;
                    options.cellsNotToAnimate = [];
                    var collapsedCells = event.properties.cells;
                    var i;
                    for (i = 0; i < collapsedCells.length; i++) {
                        var container = collapsedCells[i];
                        var children = container.children;
                        if(children) {
                            var j;
                            for (j = 0; j < children.length; j++) {
                                if (!children[j].edge) {
                                    options.cellsNotToAnimate.push(children[j].id);
                                }
                            }
                        }
                    }
                    GraphLayout.layout(self, options);
                }
            });

            this.graph.addListener(mxEvent.ADD_CELLS, function(sender, event) {
                if (!self.pauseLayout &&
                    self.autolayout) {
                    var cellIsEdge = event.properties.cells[0] && event.properties.cells[0].edge;
                    var parentIsContainer =
                        event.properties.parent.id !== sender.getDefaultParent().id;
                    if (cellIsEdge || parentIsContainer) {
                        setTimeout(function(){
                            GraphLayout.layout(self, {animate: true});
                        });
                    }
                }
            });

            this.graph.isCellResizable = function(cell) {
                // allow notes and containers to be resizable when auto layout is off
                return (!self.autolayout &&
                        ((cell && cell.style==="noteStyle") ||
                        (cell.activity && cell.activity.isContainer)));
            };

            this.graph.isCellSelectable = function(cell) {
                return !cell.edge;
            };

            this.graph.connectionHandler.isValidSource = function(cell) {
                var result = self.graph.isValidSource(cell);
                if (cell.activity && ((cell.activity.data.type === "finish") || cell.activity.data.type === "note")) {
                    result = false;
                }
                return result;
            };

            this.graph.connectionHandler.isValidTarget = function(cell) {
                var result = self.graph.isValidTarget(cell);
                if (cell.activity && ((cell.activity.data.type === "start") || cell.activity.data.type === "note")) {
                    result = false;
                }

                return result;
            };

            // Prevent connections from activities in different parents
            this.graph.isValidConnection = function(source, target) {
                return source.parent === target.parent;
            };


            // Override the shape initializer so we put easily locatable IDs on the nodes for tests
            var oldInitializeShape = this.graph.cellRenderer.initializeShape;
            this.graph.cellRenderer.initializeShape = function(state) {
                oldInitializeShape.apply(this, arguments);

                // Put an ID on the DOM node for this shape which contains the cell ID
                if (state.shape.node && state.cell && state.cell.id) {
                    state.shape.node.setAttribute("id", "shape-" + state.cell.id);
                }
            };

            // Override the label initializer so we put easily locatable IDs on the nodes for tests
            var oldInitializeLabel = this.graph.cellRenderer.initializeLabel;
            this.graph.cellRenderer.initializeLabel = function(state) {
                oldInitializeLabel.apply(this, arguments);

                // Put an ID on the DOM node for this label which contains the cell ID
                if (state.text.node && state.cell && state.cell.id) {
                    state.text.node.setAttribute("id", "label-" + state.cell.id);
                }
            };

            // Override the overlay initializer so we put easily locatable IDs on the nodes for tests
            var oldInitializeOverlay = this.graph.cellRenderer.initializeOverlay;
            this.graph.cellRenderer.initializeOverlay = function(state, shape) {
                oldInitializeOverlay.apply(this, arguments);

                // Put an ID on the DOM node for this overlay which contains the cell ID as well as
                // the filename being used for the overlay, so we can easily locate a particular
                // icon for a particular cell ID.
                if (shape.image && shape.node && state.cell && state.cell.id) {
                    var imageUrl = shape.image;
                    var urlParts = imageUrl.split("/");
                    var imageFilename = urlParts[urlParts.length - 1];
                    if (imageFilename.indexOf(".") > 0) {
                        imageFilename = imageFilename.split(".")[0];

                        shape.node.setAttribute("id", "overlay-" + state.cell.id + "-" + imageFilename);
                    }
                }
            };

            this.graph.getPreferredSizeForCell = function(cell) {
                return self.getPreferredSize(self.graph, self.graph.view.getScale(), cell);
            };

           this.graph.connectionHandler.marker.highlight.createShape = function(state) {
                var shape = mxCellHighlight.prototype.createShape.apply(this, arguments); // "supercall"
                shape.isRounded = true;
                shape.style = {};
                shape.style[mxConstants.STYLE_ARCSIZE] = 12;
                return shape;
            };

            this.graph.fit = function(min) {
                var that = this;
                if (!self.diagramOnly) {
                    self.graphPanePromise.then(function(){
                        var scaleDiagram = function(view) {
                            var border = 20;
                            var w1 =  self.paneBounds.w - 3;
                            var h1 =  self.paneBounds.h - 35;
                            var bounds = view.getGraphBounds();
                            var w2 = bounds.width / view.scale;
                            var h2 = bounds.height / view.scale;
                            var b = 2 * border;
                            var scale = Math.min(w1 / (w2 + b), h1 / (h2 + b));
                            scale = Math.min(1, Math.max(min, Math.floor(scale * 100) / 100));
                            if (scale <= 1 || min>1) {
                                // center shapes
                                var dx = (w1-bounds.width)*0.25;
                                if (dx<100) {
                                    dx = 100;
                                }
                                var dy = (h1-h2)*0.25;
                                view.scaleAndTranslate(scale, dx*(1/scale), (dy>10?dy:10));
                            }
                        };
                        scaleDiagram(that.view);
                        scaleDiagram(that.view);
                    });
                } else {
                    self.fitDiagram(this.view);
                }
            };

            var view =this.graph.getView();
            if (!this.diagramOnly) {
                this.graph.getSelectionModel().changeSelection = function(added, removed) {
                    mxGraphSelectionModel.prototype.changeSelection.apply(this, arguments); // "supercall"

                    // show magnified cell
                    var thresh = self.autolayout ? self.MANUAL_ZOOM_THRESHOLD : self.AUTOLAYOUT_ZOOM_THRESHOLD;
                    var selectedCell = self.graph.getSelectionCount()===1 ? self.graph.getSelectionCell() : null;
                    if (!selectedCell || (!selectedCell.edge && view.scale < thresh)) {
                        self.magnify(selectedCell);
                    }
                };

                view.addListener(mxEvent.SCALE, function(sender, evt) {
                    GraphLayout.layout(self);
                    var thresh = self.autolayout ? self.MANUAL_ZOOM_THRESHOLD : self.AUTOLAYOUT_ZOOM_THRESHOLD;
                    if (view.scale >= thresh) {
                        self.magnify(null);
                    }
                });

                view.addListener(mxEvent.SCALE_AND_TRANSLATE, function(sender, evt) {
                    GraphLayout.layout(self);
                    var thresh = self.autolayout ? self.MANUAL_ZOOM_THRESHOLD : self.AUTOLAYOUT_ZOOM_THRESHOLD;
                    if (view.scale >= thresh) {
                        self.magnify(null);
                    }
                    if (self.autolayout) {
                        var dx;
                        var dy;
                        var graphBounds = view.getGraphBounds();
                        if (view.scale > GraphLayout.MAX_SCALE) {
                            dx = graphBounds.x / GraphLayout.MAX_SCALE;
                            dy = graphBounds.y / GraphLayout.MAX_SCALE;
                            view.scaleAndTranslate(GraphLayout.MAX_SCALE, dx, dy);
                        }
                        else if (view.scale < GraphLayout.MIN_SCALE) {
                            dx = graphBounds.x / GraphLayout.MIN_SCALE;
                            dy = graphBounds.y / GraphLayout.MIN_SCALE;
                            view.scaleAndTranslate(GraphLayout.MIN_SCALE, dx, dy);
                        }
                    }
                });
            }

            // counter-zoomed labels
            mxText.prototype.redraw = function() {
                var isNote = this.state.cell.style === "noteStyle";
                this.size = GraphLayout.getFontSize(this.scale, self.autolayout, this.state.cell.style);
                mxShape.prototype.redraw.apply(this, arguments); // "supercall"

                // no way to give a "note" shape with wrapping text a margin
                if (isNote) {
                    var fo = query("div", this.node)[0];
                    if (fo) {
                        var w = domStyle.get(fo, "width");
                        domStyle.set(fo, {
                            maxWidth: (w-60) + "px",
                            paddingLeft: "30px"
                        });
                    }
                }
            };
        },

        magnify: function(cell) {
            // clean out current
            while (this.magnifyCanvas.firstChild) {
                this.magnifyCanvas.removeChild(this.magnifyCanvas.firstChild);
            }
            // add new
            if (cell && !cell.edge && !(cell.activity && cell.activity.isContainer)) {
                var view = this.graph.getView();
                var state = view.getState(cell);
                if (state && state.shape) {

                    // clone shape/label
                    var shape = state.shape.node.cloneNode(true);
                    var bounds = this.getPreferredSize(this.graph, 1, cell);
                    var w = bounds.width;
                    var h = bounds.height;

                    // rectangle
                    // prevent magnify window from filling up diagram
                    h = Math.min(this.MAX_MAGNIFY_HEIGHT, h);
                    shape.firstChild.setAttribute('x', 6);
                    shape.firstChild.setAttribute('y', 6);
                    shape.firstChild.setAttribute('width', w);
                    shape.firstChild.setAttribute('height', h);
                    // icon
                    var hasIcon = false;
                    if (shape.childNodes.length>1) {
                        hasIcon = true;
                        shape.childNodes[1].setAttribute('x', 12);
                        shape.childNodes[1].setAttribute('y', (h-32)/2);
                        shape.childNodes[1].setAttribute('width', 32);
                        shape.childNodes[1].setAttribute('height', 32);
                    }
                    this.magnifyCanvas.appendChild(shape);

                    // base position of text on presence of icon/if it's a note
                    var y = 35;
                    var left = 45;
                    var lines = state.text.value.split("\n");
                    if (cell.style==="noteStyle") {
                        left = 10;
                    } else if (hasIcon) {
                        left = 55;
                    }

                    var xlate = document.createElement('div');
                    var i = 0;
                    for (i=0; i<lines.length; i++) {
                        var g = document.createElementNS(mxConstants.NS_SVG, "g");
                        g.setAttribute("font-size", "14px");
                        this.magnifyCanvas.appendChild(g);
                        var text = document.createElementNS(mxConstants.NS_SVG, "text");
                        g.appendChild(text);
                        text.setAttribute('x', left + 3);
                        text.setAttribute('y', y+3);
                        xlate.innerHTML = util.escape(lines[i]);
                        // if line will appear below magnify shape, show ellipse instead and exit
                        var isOver = y+8 > h;
                        if (xlate.childNodes[0]) {
                            var textNode = document.createTextNode(isOver?"...":xlate.childNodes[0].nodeValue);
                            text.appendChild(textNode);
                            text.setAttribute('cursor', 'default');
                            text.setAttribute('fill', state.style.fontColor);
                            if (isOver) {
                                break;
                            }
                            y+=17;
                        }
                    }


                    // make it look selected
                    var s = document.createElementNS(mxConstants.NS_SVG, 'rect');
                    this.magnifyCanvas.appendChild(s);
                    s.setAttribute('pointer-events', 'none');
                    s.setAttribute('x', 3);
                    s.setAttribute('y', 3);
                    s.setAttribute('width', w+6);
                    s.setAttribute('height', h+6);
                    s.setAttribute('rx', 4);
                    s.setAttribute('ry', 4);
                    s.setAttribute('stroke', mxConstants.VERTEX_SELECTION_COLOR);
                    s.setAttribute('stroke-width', 3);
                    s.setAttribute('fill-opacity', 0);


                    // overlays
                    if (state.overlays) {
                        var dy = 3;
                        var dx = w-10;
                        var size = 16;
                        var overlay = null;
                        var onclick = function(e) {
                            var evt = document.createEvent("MouseEvent");
                            evt.initMouseEvent("click",true,true,window,0,0,0,0,0,false,false,false,false,0,null);
                            e.currentTarget.onode.dispatchEvent(evt);
                        };
                        for (overlay in state.overlays.map) {
                            if (state.overlays.map.hasOwnProperty(overlay)) {
                                var shp =  state.overlays.map[overlay];
                                if (shp.image.endsWith && (
                                        shp.image.endsWith('info.png') || shp.image.endsWith('error.png'))) {
                                    dy = h/2-8;
                                    dx = w-26;
                                    size = 28;
                                }
                                var onode = shp.node;
                                var node = onode.cloneNode(true);
                                node.onode = onode;
                                var img = node.firstChild;
                                img.setAttribute('x', dx);
                                img.setAttribute('y', dy);
                                img.setAttribute('width', size);
                                img.setAttribute('height', size);
                                img.style = null;
                                on(node, "click", onclick);
                                this.magnifyCanvas.appendChild(node);
                                dx-=20;
                            }
                        }
                    }

                    // set canvas size
                    w+=9; h+=9;
                    domStyle.set(this.magnifySvg, {
                        minWidth: w+"px",
                        minHeight: h+"px"
                    });
                    domStyle.set(this.diagram.magnifyAttach, {
                        visibility: "visible",
                        width: (w+2)+"px",
                        height: (h+2)+"px"
                    });
                }
            } else {
                domStyle.set(this.diagram.magnifyAttach, {
                    visibility: "hidden"
                });

            }
        },

        getPreferredSize: function(graph, scale, cell) {
            var result = null;
            if (cell !== null) {
                var state = graph.view.getState(cell);
                var style = !!state ? state.style : graph.getCellStyle(cell);
                if (style && !graph.model.isEdge(cell)) {
                    var width = 40;
                    var height = 20;
                    if (!this.zoomToSelectionData || this.zoomToSelectionData.cells[cell.id]) {
                        var dx = 0;
                        var dy = 0;
                        // If a cell has children, resize to accommodate all children
                        var headerSize = GraphLayout.getLabelMetrics(
                            graph,
                            cell,
                            this.autolayout,
                            null,
                            scale,
                            state,
                            style).size;
                        if(cell.children) {
                            var size = this.getPrefferedSizeForContainer(graph, cell);
                            dx += size.maxX - size.minX + GraphLayout.CONTAINER_PADDING * 2;
                            dy += size.maxY - size.minY + GraphLayout.CONTAINER_PADDING * 2;
                            if(headerSize.width + GraphLayout.CONTAINER_PADDING * 2 > dx) {
                                width = headerSize.width + GraphLayout.CONTAINER_PADDING * 2;
                            } else {
                                width = dx;
                            }
                        } else {
                            if (graph.getImage(state) !== null || style[mxConstants.STYLE_IMAGE] !== null) {
                                dx = dy = 32;
                            }
                            dx += 2 * (style[mxConstants.STYLE_SPACING] || 0);
                            dx += style[mxConstants.STYLE_SPACING_LEFT] || 0;
                            var r = style[mxConstants.STYLE_SPACING_RIGHT] || 0;
                            dx += r<0?0:r;
                            dy += 2 * (style[mxConstants.STYLE_SPACING] || 0);
                            dy += style[mxConstants.STYLE_SPACING_TOP] || 0;
                            dy += style[mxConstants.STYLE_SPACING_BOTTOM] || 0;
                            width = headerSize.width + dx;
                        }
                        height = headerSize.height + dy;
                        if (graph.gridEnabled) {
                            width = graph.snap(width + graph.gridSize / 2);
                            height = graph.snap(height + graph.gridSize / 2);
                        }
                    }
                    result = new mxRectangle(0, 0, width, height);
                }
            }
            return result;
        },

        getPrefferedSizeForContainer: function(graph, cell) {
            var size = {
                    minX : Number.MAX_VALUE,
                    minY : Number.MAX_VALUE,
                    maxX : -1,
                    maxY : -1
            };
            if(cell.collapsed) {
                size.minX = 0;
                size.minY = 0;
                size.maxX = 40;
                size.maxY = 20;
            } else {
                array.forEach(cell.children, function(child) {
                    if (!child.edge) {
                        size.minX = Math.min(child.geometry.x, size.minX);
                        size.minY = Math.min(child.geometry.y, size.minY);
                        size.maxX = Math.max(child.geometry.x + child.geometry.width, size.maxX);
                        size.maxY = Math.max(child.geometry.y + child.geometry.height, size.maxY);
                    }
                });
            }
            return size;
        },

        /**
         * Get valid targets to drop a cell on, ignoring any cells which aren't containers.
         */
        getCellDropTarget: function(graph, x, y) {
            var cell = graph.getCellAt(x, y);

            var result = null;
            if (cell && cell.isVertex()) {
                // Only let users drop onto cells which are set
                // as containers.
                if (cell.activity && cell.activity.isContainer) {
                    result = cell;
                }
            } else {
                // For edges, we don't care what it is, they
                // can always be drop targets.
                result = cell;
            }
            graph.lastDropTarget = result;
            return result;
        },

        /**
         * Set standard graph object styles.
         */
        setGraphStyling: function() {
            // Edges

            // -- Default edge style
            var defaultEdgeStyle = this.graph.getStylesheet().getDefaultEdgeStyle();
            defaultEdgeStyle[mxConstants.STYLE_STROKEWIDTH] = 0;
            defaultEdgeStyle[mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = "#FFFFFF";
            defaultEdgeStyle[mxConstants.STYLE_LABEL_PADDING] = 4;
            defaultEdgeStyle[mxConstants.STYLE_STROKECOLOR] = "#3B0256";
            defaultEdgeStyle[mxConstants.STYLE_LABEL_BORDERCOLOR] = "#7F1C7D";
            defaultEdgeStyle[mxConstants.STYLE_FONTCOLOR] = "#7F1C7D";
            defaultEdgeStyle[mxConstants.STYLE_FONTSIZE] = '12';
            defaultEdgeStyle[mxConstants.STYLE_SPACING_TOP] = 15;
            defaultEdgeStyle[mxConstants.STYLE_MOVABLE] = 0;
            defaultEdgeStyle[mxConstants.STYLE_ROUNDED] = true;

            mxConstants.VALID_COLOR = "#00B2EF";
            mxConstants.HIGHLIGHT_COLOR = "#00B2EF";
            mxConstants.TARGET_HIGHLIGHT_COLOR = "#00B2EF";
            mxConstants.OUTLINE_STROKEWIDTH = 0;
            mxConstants.INVALID_COLOR = "#F04E37";
            mxConstants.OUTLINE_HANDLE_FILLCOLOR = "#00B2EF";
            mxConstants.OUTLINE_HANDLE_STROKECOLOR = "#00B2EF";
            mxConstants.VERTEX_SELECTION_STROKEWIDTH = 2;

            // -- Edge with no ending arrow
            var noArrowEdgeStyle = {};
            noArrowEdgeStyle[mxConstants.STYLE_ENDARROW] = undefined;
            this.graph.getStylesheet().putCellStyle('noArrowEdgeStyle', noArrowEdgeStyle);

            // Vertices
            // -- Default vertex style
            var defaultVertexStyle = this.graph.getStylesheet().getDefaultVertexStyle();
            defaultVertexStyle[mxConstants.STYLE_SPACING] = 8;
            defaultVertexStyle[mxConstants.STYLE_FONTCOLOR] = '#000000';
            defaultVertexStyle[mxConstants.VERTEX_HIGHLIGHT_COLOR] = '#000000';
            defaultVertexStyle[mxConstants.STYLE_ARCSIZE] = 6;
            defaultVertexStyle[mxConstants.STYLE_ROUNDED] = true;

            // -- Add point styling (a "plus" image)
            var plusStyle = {};
            plusStyle[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_IMAGE;
            plusStyle[mxConstants.STYLE_IMAGE] = bootstrap.imageUrl + '/mxgraph/add.png';
            plusStyle[mxConstants.STYLE_IMAGE_WIDTH] = '16';
            plusStyle[mxConstants.STYLE_IMAGE_HEIGHT] = '16';
            this.graph.getStylesheet().putCellStyle('plusStyle', plusStyle);

            // -- Top level container
            var topContainerStyle = {};
            topContainerStyle[mxConstants.STYLE_SHAPE] = 'rectangle';
            topContainerStyle[mxConstants.STYLE_STROKECOLOR] = '#ffffff';
            topContainerStyle[mxConstants.STYLE_FILLCOLOR] = '#ffffff';
            this.graph.getStylesheet().putCellStyle('topContainerStyle', topContainerStyle);

            // -- Sequential activity containers
            var sequenceStyle = {};
            sequenceStyle[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
            sequenceStyle[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_RIGHT;
            sequenceStyle[mxConstants.STYLE_SPACING_TOP] = -7;
            sequenceStyle[mxConstants.STYLE_SPACING_RIGHT] = -3;
            sequenceStyle[mxConstants.STYLE_SPACING_LEFT] = 15;
            sequenceStyle[mxConstants.STYLE_FONTSIZE] = '12';
            sequenceStyle[mxConstants.STYLE_FONTFAMILY] = "helvetica, arial, tahoma, verdana, sans-serif, 'lucida grande'";
            sequenceStyle[mxConstants.STYLE_SHAPE] = 'rectangle';
            sequenceStyle[mxConstants.STYLE_GRADIENTCOLOR] = '#ddddff';
            sequenceStyle[mxConstants.STYLE_STROKECOLOR] = '#bbc6ff';
            sequenceStyle[mxConstants.STYLE_FILLCOLOR] = '#eeeeff';
            sequenceStyle[mxConstants.STYLE_ROUNDED] = false;
            this.graph.getStylesheet().putCellStyle('sequenceStyle', sequenceStyle);

            // -- Iteration activity containers
            var iterationStyle = {};
            iterationStyle[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
            iterationStyle[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_LEFT;
            iterationStyle[mxConstants.STYLE_SPACING_TOP] = -7;
            iterationStyle[mxConstants.STYLE_SPACING_RIGHT] = -3;
            iterationStyle[mxConstants.STYLE_SPACING_LEFT] = 5;
            iterationStyle[mxConstants.STYLE_FONTSIZE] = '12';
            iterationStyle[mxConstants.STYLE_FONTFAMILY] = "helvetica, arial, tahoma, verdana, sans-serif, 'lucida grande'";
            iterationStyle[mxConstants.STYLE_SHAPE] = 'rectangle';
            iterationStyle[mxConstants.STYLE_GRADIENTCOLOR] = '#ffdddd';
            iterationStyle[mxConstants.STYLE_STROKECOLOR] = '#ffbbc6';
            iterationStyle[mxConstants.STYLE_FILLCOLOR] = '#ffeeee';
            iterationStyle[mxConstants.STYLE_ROUNDED] = false;
            this.graph.getStylesheet().putCellStyle('iterationStyle', iterationStyle);

            // -- Parallel activity containers
            var parallelStyle = {};
            parallelStyle[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
            parallelStyle[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_LEFT;
            parallelStyle[mxConstants.STYLE_SPACING_TOP] = -5;
            parallelStyle[mxConstants.STYLE_SPACING_RIGHT] = -3;
            parallelStyle[mxConstants.STYLE_SPACING_LEFT] = 15;
            parallelStyle[mxConstants.STYLE_FONTSIZE] = '14';
            parallelStyle[mxConstants.STYLE_FONTFAMILY] = "helvetica, arial, tahoma, verdana, sans-serif, 'lucida grande'";
            parallelStyle[mxConstants.STYLE_SHAPE] = 'rectangle';
            parallelStyle[mxConstants.STYLE_FILLCOLOR] = '#BDE4F6';
            parallelStyle[mxConstants.STYLE_STROKEWIDTH] = '2';
            parallelStyle[mxConstants.STYLE_STROKECOLOR] = '#00B2EF';
            parallelStyle[mxConstants.STYLE_ROUNDED] = false;
            this.graph.getStylesheet().putCellStyle('parallelStyle', parallelStyle);

            // -- Utility (e.g. start/stop) activities
            var utilityStyle = {};
            utilityStyle[mxConstants.STYLE_SHAPE] = 'label';
            utilityStyle[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
            utilityStyle[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
            utilityStyle[mxConstants.STYLE_SPACING_LEFT] = 15;
            utilityStyle[mxConstants.STYLE_SPACING_TOP] = 5;
            utilityStyle[mxConstants.STYLE_SPACING_BOTTOM] = 5;
            utilityStyle[mxConstants.STYLE_SPACING_RIGHT] = 15;
            utilityStyle[mxConstants.STYLE_STROKEWIDTH] = '2';
            utilityStyle[mxConstants.STYLE_STROKECOLOR] = '#FFF';
            utilityStyle[mxConstants.STYLE_FILLCOLOR] = '#888';
            utilityStyle[mxConstants.STYLE_FONTFAMILY] = "helvetica, arial, tahoma, verdana, sans-serif, 'lucida grande'";
            utilityStyle[mxConstants.STYLE_FONTSIZE] = '14';
            utilityStyle[mxConstants.STYLE_FONTCOLOR] = '#FFFFFF';
            utilityStyle[mxConstants.STYLE_SHADOW] = '0';
            utilityStyle[mxConstants.STYLE_ARCSIZE] = 6;
            utilityStyle[mxConstants.STYLE_ROUNDED] = true;
            this.graph.getStylesheet().putCellStyle('utilityStyle', utilityStyle);

            // -- Note activities
            var noteStyle = {};
            noteStyle[mxConstants.STYLE_SHAPE] = 'label';
            noteStyle[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
            noteStyle[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
            noteStyle[mxConstants.STYLE_SPACING_LEFT] = 5;
            noteStyle[mxConstants.STYLE_SPACING_TOP] = 5;
            noteStyle[mxConstants.STYLE_SPACING_BOTTOM] = 5;
            noteStyle[mxConstants.STYLE_SPACING_RIGHT] = 5;
            noteStyle[mxConstants.STYLE_STROKEWIDTH] = '2';
            noteStyle[mxConstants.STYLE_STROKECOLOR] = '#FFF';
            noteStyle[mxConstants.STYLE_FILLCOLOR] = '#FAF2AD';
            noteStyle[mxConstants.STYLE_FONTFAMILY] = "helvetica, arial, tahoma, verdana, sans-serif, 'lucida grande'";
            noteStyle[mxConstants.STYLE_FONTSIZE] = '12';
            noteStyle[mxConstants.STYLE_FONTSTYLE] = '0';
            noteStyle[mxConstants.STYLE_SHADOW] = '0';
            noteStyle[mxConstants.STYLE_WHITE_SPACE] = 'wrap';
            noteStyle[mxConstants.STYLE_OVERFLOW] = 'width';
            noteStyle[mxConstants.STYLE_AUTOSIZE] = '1';
            this.graph.getStylesheet().putCellStyle('noteStyle', noteStyle);

            // -- Component process activities
            var activityStyle = {};
            activityStyle[mxConstants.STYLE_SHAPE] = 'label';
            activityStyle[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
            activityStyle[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_LEFT;
            activityStyle[mxConstants.STYLE_SPACING_LEFT] = 45;
            activityStyle[mxConstants.STYLE_SPACING_TOP] = -10;
            activityStyle[mxConstants.STYLE_SPACING_BOTTOM] = -10;
            activityStyle[mxConstants.STYLE_SPACING_RIGHT] = -20;
            activityStyle[mxConstants.STYLE_STROKECOLOR] = '#7F1C7D';
            activityStyle[mxConstants.STYLE_FILLCOLOR] = '#7F1C7D';
            activityStyle[mxConstants.STYLE_FONTCOLOR] = '#FFFFFF';
            activityStyle[mxConstants.STYLE_FONTFAMILY] = "helvetica, arial, tahoma, verdana, sans-serif, 'lucida grande'";
            activityStyle[mxConstants.STYLE_FONTSIZE] = '12';
            activityStyle[mxConstants.STYLE_FONTSTYLE] = '0';
            activityStyle[mxConstants.STYLE_SHADOW] = '0';
            activityStyle[mxConstants.STYLE_ARCSIZE] = 6;
            activityStyle[mxConstants.STYLE_ROUNDED] = true;
            activityStyle[mxConstants.STYLE_IMAGE] = bootstrap.imageUrl + 'icons/mxgraph/process_step.png';
            activityStyle[mxConstants.STYLE_IMAGE_WIDTH] = '32';
            activityStyle[mxConstants.STYLE_IMAGE_HEIGHT] = '32';
            this.graph.getStylesheet().putCellStyle('activityStyle', activityStyle);
        },

        destroy: function() {
            domConstruct.destroy(this.toolbarContainer);
            if (this.toolbar) {
                this.toolbar.destroy();
            }
            this.graph.tooltipHandler.hide();
        },

        resize: function() {
            // content uses up full browser window minus header and footer
            var contentY = domGeo.position(this.domNode, true).y;
            var windowH = window.innerHeight || document.body.clientHeight;
            var windowW = window.innerWidth || document.body.clientWidth;
            var contentH = windowH - contentY;
            var container = this.diagram.mxgraphAttach;
            container.style.height = contentH - 32 + "px";
            this.bc.containerNode.style.height = contentH + "px";
            this.bc.containerNode.style.width = windowW + "px";
            this.bc.resize();
        },

        getActivityStyle: function() {

        }
    });
});

mxVertexHandler.prototype.createSelectionShape = function(bounds) {
    var shape = new mxRectangleShape(bounds, null, mxConstants.VERTEX_SELECTION_COLOR);
    shape.strokewidth = 3;
    shape.isDashed = false;
    shape.isRounded = true;
    shape.style = {};
    shape.style[mxConstants.STYLE_ARCSIZE] = 4;
    return shape;
};

mxVertexHandler.prototype.redraw = function() {
    this.selectionBounds = this.getSelectionBounds(this.state);
    this.bounds = new mxRectangle(this.state.x,this.state.y,this.state.width,this.state.height);
    this.bounds.grow(2);
    this.redrawHandles();
    this.drawPreview();
};


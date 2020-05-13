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
/*global define, require, mxToolbar, mxUtils, mxConstants, mxPrintPreview */

define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/_base/xhr",
    "dojo/_base/lang",
    "dojo/window",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/dom-attr",
    "dojo/on",
    "dojo/mouse",
    "dojo/query",
    "dijit/form/Button",
    "dijit/form/CheckBox",
    "dijit/form/NumberSpinner",
    "deploy/widgets/workflow/GraphEdgeManager",
    "deploy/widgets/workflow/activity/ActivityCreator",
    "js/webext/widgets/Alert",
    "js/webext/widgets/Dialog",
    "js/webext/widgets/GenericConfirm",
    "js/webext/widgets/Switch",
    "deploy/widgets/workflow/GraphLayout",
    "deploy/widgets/workflow/ValidateGraph",
    "deploy/widgets/process/ProcessIconsFormatter",
    "deploy/widgets/workflow/GraphExploreDialog",
    "deploy/widgets/process/RequiredCommentForm"],

function(
    declare,
    array,
    xhr,
    lang,
    win,
    domClass,
    domConstruct,
    domStyle,
    domAttr,
    on,
    mouse,
    query,
    Button,
    CheckBox,
    NumberSpinner,
    GraphEdgeManager,
    ActivityCreator,
    Alert,
    Dialog,
    GenericConfirm,
    Switch,
    GraphLayout,
    ValidateGraph,
    ProcessIconsFormatter,
    GraphExploreDialog,
    RequiredCommentForm) {
    /**
     * This widget provides the graph editor toolbar.
     */
    return declare(null, {
        /**
         *
         */
        constructor: function(args) {
            lang.mixin(this, args);

            var self = this;
            this.graph = this.editor.graph;

            // Create the toolbar window.
            var toolWindowContent = domConstruct.create("div", {
                className: "toolbar-container",
                style: {
                    minWidth: "900px",
                    overflow: "hidden"
                 }
            }, this.editor.toolbarContainer);
            this.toolWindowContent = toolWindowContent;

            var spacer = document.createElement('div');
            spacer.setAttribute('class', 'toolbarSeparator graphIcon');

            // -- Add buttons.
            var toolbar = new mxToolbar(toolWindowContent);

            if (this.editor.readOnly) {
                this.editor.graphDiagram.toolbarAttach.style.paddingLeft = "10px";
            }

            //readOnly mode or designer in first-day wizard needs to hide save/revert btns
            var hideSaveRevertBtn = false;
            if (this.editor.mode === "firstDayWizard") {
                hideSaveRevertBtn = true;
            } else {
                if (this.editor.readOnly) {
                    hideSaveRevertBtn = true;
                }
            }

            if (!hideSaveRevertBtn) {
                // save/revert tools
                this.saveButton = toolbar.addItem(self.getSaveButtonTitle(), null, function() {
                    self.onSave();
                }, null, "mxToolbarItem graphToolbarButton");
                this.discardButton = toolbar.addItem(i18n("Revert"), null, function() {
                    if (document.hasChanges) {
                        var discardConfirm = new GenericConfirm({
                            message: i18n("Discard all changes and revert the graph to its last saved state?"),
                            action: function() {
                                document.hasChanges = false;
                                location.reload(true);
                            }
                        });
                    }
                }, null, "mxToolbarItem graphToolbarButton");
                if (document.hasChanges) {
                    domClass.add(this.discardButton, "enabled");
                    domClass.add(this.saveButton, "enabled");
                }
            }

            if (this.isForDraft() && config.data.systemConfiguration.safeEditFeatureEnabled) {
                if (self.versionData.promotionPending) {
                    this.promoteButton = toolbar.addItem(i18n("Promotion Pending"), null, null, null, "mxToolbarItem graphToolbarButton");
                }
                else {
                    this.promoteButton = toolbar.addItem(i18n("Promote"), null, function() {
                        self.versionData.promoteFunction(document.hasChanges);
                        if (config.data.systemConfiguration.requireProcessPromotionApproval) {
                            domClass.remove(self.promoteButton, "enabled");
                            self.promoteButton.innerHTML = i18n("Promotion Pending");
                        }
                    }, null, "mxToolbarItem graphToolbarButton enabled");
                    if (document.hasChanges || (self.isLocked() && !self.lockIsOwned())) {
                        domClass.remove(this.promoteButton, "enabled");
                    }
                }

                if (this.isLocked()) {
                    if (this.lockIsOwned() && config.data.systemConfiguration.safeEditFeatureEnabled) {
                        this.lockButton = toolbar.addItem(i18n("Unlock"), null, function() {
                            self.versionData.unlockFunction();
                            // Maybe something nice like swapping the button
                        }, null, "mxToolbarItem graphToolbarButton enabled");
                    }
                    else {
                        this.lockButton = toolbar.addItem(i18n("Force Unlock"), null, function() {
                            self.versionData.unlockFunction();
                            // Maybe something nice like swapping the button
                        }, null, "mxToolbarItem graphToolbarButton enabled");
                    }

                }
                else {
                    this.lockButton = toolbar.addItem(i18n("Lock"), null, function() {
                        self.versionData.lockFunction();
                        // Maybe something nice like swapping the button
                    }, null, "mxToolbarItem graphToolbarButton enabled");
                }
            }




            //designer in first-day wizard does not need print tool
            if (this.editor.mode !== "firstDayWizard") {
                // print tool
                toolbar.addItem(i18n("Print"), null, lang.hitch(this, "printPreview"), null, "mxToolbarItem graphToolbarButton enabled");
                toolbar.container.appendChild(spacer.cloneNode(true));
            }

            // zooming tools
            toolbar.addItem(i18n("Zoom In"), bootstrap.imageUrl + 'icons/blank18x18.png', function() {
                self.zoomToSelectionReset();
                self.graph.zoomIn();
                self.graph.tooltipHandler.hide();
            }, null, "mxToolbarItem general-icon zoom-in-icon graphToolbarIcon");
            toolbar.addItem(i18n("Zoom Out"), bootstrap.imageUrl + 'icons/blank18x18.png', function() {
                self.zoomToSelectionReset();
                self.graph.zoomOut();
                self.graph.tooltipHandler.hide();
            }, null, "mxToolbarItem general-icon zoom-out-icon graphToolbarIcon");
            toolbar.addItem(i18n("Zoom to Selected"), bootstrap.imageUrl + 'icons/blank18x18.png', function() {
                self.zoomToSelection();
                self.graph.tooltipHandler.hide();
            }, null, "mxToolbarItem general-icon zoom-select-icon graphToolbarIcon");
            toolbar.addItem(i18n("Zoom to Fit"), bootstrap.imageUrl + 'icons/blank18x18.png', function() {
                self.zoomToSelectionReset();
                self.graph.fit();
                self.graph.tooltipHandler.hide();
            }, null, "mxToolbarItem general-icon zoom-fit-icon graphToolbarIcon");

            // popup palette tool
            if (this.editor.graphPaletteDialog) {
                toolbar.container.appendChild(spacer.cloneNode(true));
                toolbar.addItem(i18n("Popup Step Palette"), bootstrap.imageUrl + 'icons/blank18x18.png', function() {
                    self.editor.graphPaletteDialog.show();
                    self.graph.tooltipHandler.hide();
                }, null, "mxToolbarItem general-icon new-step-icon graphToolbarIcon");
            }

            // Explore dialog
            var exploreMode = !!window.parent.document.getElementById("explore_iframe_id");
            if (this.editor.mode !== "firstDayWizard") {
                if (!exploreMode && !this.editor.readOnly) {
                    toolbar.container.appendChild(spacer.cloneNode(true));
                    toolbar.addItem(i18n("Explore"), bootstrap.imageUrl + 'icons/blank18x18.png', function() {
                        if (!self.exploreDialog) {
                            self.exploreDialog = new GraphExploreDialog({
                                'class':'nonModal',
                                editor: self.editor
                            });
                        }
                        self.exploreDialog.show();
                        self.graph.tooltipHandler.hide();
                    }, null, "mxToolbarSmallerItem mxToolbarItem general-icon explorer-icon graphToolbarIcon");
                }
            }

            // add autolayout div
            toolbar.container.appendChild(spacer.cloneNode(true));
            var chkDiv = domConstruct.create("div", {
                "class": "toolbar-button",
                style: {
                    color: "#2e2d2d",
                    display: "inline-block",
                    position: "relative",
                    minWidth: "120px",
                    lineHeight: "30px"
                 }
            });
            toolbar.container.appendChild(chkDiv);

            if (this.editor.mode !== "firstDayWizard") {
                // add version control on side
                if (this.versionData) {
                    toolbar.container.appendChild(spacer.cloneNode(true));
                    this.versionContainer = domConstruct.create("div", {
                        style: {
                            "display": "inline-block",
                            marginLeft: "50px"
                        }
                    });

                    var label = domConstruct.create("div", {
                        innerHTML: this.versionData.label,
                        style: {
                            display: "inline-block",
                            verticalAlign: "middle",
                            paddingRight: "40px"
                        }
                    }, this.versionContainer);
                    this.versionContainer.appendChild(label);
                    var controls = domConstruct.create("div", {
                        style: {
                            display: "inline-block",
                            height: this.versionData.latest?"20px":"30px",
                            verticalAlign: "middle"
                        }
                    }, this.versionContainer);
                    this.versionData.controls.style.lineHeight = "10px";
                    controls.appendChild(this.versionData.controls);
                    toolbar.container.appendChild(this.versionContainer);
                }
            }

            on(this.editor.graphDiagram.hideHelpAttach, "click", function(event) {
                self.hideHelp();
            });

            this.helpLink = domConstruct.create("a", {
                "class": "linkPointer designer-help-link",
                "innerHTML":util.i18n("Show help")});
            on(this.helpLink, "click", function(event){
                self.showHelp();
                domStyle.set(this, "display", "none");
            });
            toolbar.container.appendChild(this.helpLink);

            // auto-layout -- wait for diagram to load to determine if diagram is autolayout
            this.editor.loaded.then(function(){

                var chk = new Switch({
                    value: self.editor.autolayout,
                    disabled: self.editor.readOnly,
                    style: {
                        display: "inline",
                        position: "absolute",
                        top: "-3px",
                        marginLeft: "10px"
                    },
                    onChange: function (b) {
                      if (self.editor.autolayout !== b) {
                          self.editor.autolayout = b;
                          util.setCookie("graphAutoLayout", b ? "true" : "false");
                          GraphLayout.layout(self.editor, {animate: true});
                          self.editor.graphHasChanges();
                          self.graph.tooltipHandler.hide();
                      }
                    }
                }).placeAt(chkDiv);

                var lbl = domConstruct.create("label", {
                    "for": chk.id,
                    "innerHTML": i18n("Autolayout"),
                    style: {
                        verticalAlign: "middle",
                        font: "12px arial",
                        marginLeft: "5px"
                    }
                });
                domConstruct.place(lbl, chkDiv);
                chk.placeAt(chkDiv);
            });
        },

        getSaveButtonTitle: function() {
            if (this.isForDraft() && config.data.systemConfiguration.safeEditFeatureEnabled) {
                return i18n("Save Draft");
            }
            return i18n("Save");
        },

        destroy: function() {
            if (this.exploreDialog) {
                this.exploreDialog.destroy();
            }
        },

        destroyToolbar: function() {
            domConstruct.empty(this.toolWindowContent);
        },

        onSave: function() {
            var self = this;
            if (document.hasChanges) {
                if (self.editor.getFinishCells().length === 0) {
                    var noChangesAlert = new Alert({
                        message: i18n("This process has no 'Finish' step. Processes must end in a finish step to execute successfully.")
                    });
                } else if (ValidateGraph.validate(self.editor)) {
                    var noRequiredAlert = new Alert({
                        message: i18n("This process has steps with required properties that have not been set.")
                    });
                } else if (config.data.systemConfiguration.requiresCommitComment) {
                    //create new dialog with comment area - save upon submit
                    var commentDialog = new Dialog({
                        title: i18n("Process Change Comment"),
                        closable: true
                    });
                    var commentForm = new RequiredCommentForm({
                        callback: function(data) {
                            if (data) {
                                self.editor.saveProcessDesign(data.comment);
                            }
                            commentDialog.hide();
                            commentDialog.destroy();
                        }
                    });
                    commentForm.placeAt(commentDialog);
                    commentDialog.show();
                } else {
                    self.editor.saveProcessDesign();
                    if (this.isForDraft()) {
                        domClass.add(self.promoteButton, "enabled");
                    }
                }
            }
        },

        zoomToSelection: function() {
            var selectedCell = this.graph.getSelectionCell();
            if (selectedCell && (!this.editor.zoomToSelectionData || selectedCell!==this.editor.zoomToSelectionCell)) {
                this.editor.zoomToSelectionData = {edges: {}, cells: {}};
                this.editor.zoomToSelectionCell = selectedCell;
                this.editor.zoomToSelectionData.cells[selectedCell.id] = true;
                this.zoomToSelectionCollector(selectedCell, true);
                this.zoomToSelectionCollector(selectedCell, false);
                this.editor.diagram.mxgraphAttach.style.overflow = "auto";
                if (!this.zscale) {
                    this.zscale = this.graph.view.scale;
                }
                var b = this.zoomToSelectionRefresh();
                this.graph.fit(b?0.50:(this.zscale<0.5?0.5:(this.zscale<0.9?1.0:1.10)));
                if (!b && selectedCell.geometry.y>300) {
                    this.graph.scrollCellToVisible(selectedCell, true);
                }
            } else if (this.editor.zoomToSelectionData) {
                this.editor.diagram.mxgraphAttach.style.overflow = "hidden";
                this.zoomToSelectionReset();
                this.graph.fit(GraphLayout.MIN_SCALE);
                delete this.zscale;
            }
        },

        zoomToSelectionCollector: function(cell, up) {
            var edges = up ? this.graph.model.getIncomingEdges(cell) : this.graph.model.getOutgoingEdges(cell);
            var i=0;
            for (i=0; i<edges.length; i++) {
                var edge = edges[i];
                this.editor.zoomToSelectionData.edges[edge.id] = true;
                var cll = up ? edge.source : edge.target;
                if (!this.editor.zoomToSelectionData.cells[cll.id]) {
                    this.editor.zoomToSelectionData.cells[cll.id] = true;
                    this.zoomToSelectionCollector(cll, up);
                }
            }
        },

        zoomToSelectionReset: function() {
            if (this.editor.zoomToSelectionData) {
                delete this.editor.zoomToSelectionData;
                delete this.editor.zoomToSelectionCell;
                this.zoomToSelectionRefresh();
            }
        },

        zoomToSelectionRefresh: function() {
            var anyZoomed = [false];
            this.zoomToSelectionRefreshHelper(this.graph.getDefaultParent(), anyZoomed);
            return anyZoomed[0];
        },

        zoomToSelectionRefreshHelper: function(parent, anyZoomed) {
            var i=0;
            var childCount = this.graph.model.getChildCount(parent);
            for (i = 0; i < childCount; i++) {
                var cell = this.graph.model.getChildAt(parent, i);
                var state = this.graph.view.getState(cell);
                var zoomedAway = false;
                if (cell.edge) {
                    if (state && state.shape) {
                        zoomedAway = this.editor.zoomToSelectionData && !this.editor.zoomToSelectionData.edges[cell.id];
                        state.shape.node.setAttribute('stroke-opacity', zoomedAway?'0.1':'1.0');
                    }
                } else {
                    if (state && state.text) {
                        zoomedAway = this.editor.zoomToSelectionData && !this.editor.zoomToSelectionData.cells[cell.id];
                        state.text.opacity = zoomedAway?0:100;
                        state.shape.image = zoomedAway ? undefined : state.style.image;
                        state.shape.node.setAttribute('cursor', zoomedAway?'pointer':'arrow');

                    }
                }
                anyZoomed[0] = anyZoomed[0] || zoomedAway;
                if (state && state.overlays) {
                    var j = 0;
                    var values = state.overlays.getValues();
                    for (j=0; j<values.length; j++) {
                        var overlay = values[j];
                        overlay.overlay.image.width = zoomedAway ? 0 : 24; // for FF
                        overlay.node.setAttribute('visibility', zoomedAway?'hidden':'visible');
                    }
                }

                // and its children?
                if (cell.activity && cell.activity.isContainer) {
                    this.zoomToSelectionRefreshHelper(cell, anyZoomed);
                }
            }
        },

        printPreview: function() {
            var self = this;
            var printDialog = new Dialog({
                title: i18n("Print Preview"),
                closable: true,
                draggable: true
            });

            var printFormatNormal = true;
            var printStyleNormal = true;
            var posterPages = 2;

            var printContainer = domConstruct.create("div", {}, printDialog.containerNode);

            // Create print format blocks.
            var printFormatContainer = domConstruct.create("div", {
                className: "graph-print-container"
            }, printContainer);
            domConstruct.create("div", {
                className: "graph-print-container-title",
                innerHTML: i18n("Print Format")
            }, printFormatContainer);
            var normalPrint = domConstruct.create("div", {
                className: "inline-block graph-print-format-container selected-print-option"
            }, printFormatContainer);
            domConstruct.create("div", {
                className: "normal-print-block"
            }, normalPrint);
            domConstruct.create("div", {
                innerHTML: i18n("Normal"),
                className: "graph-print-container-subtitle"
            }, normalPrint);

            var posterPrint = domConstruct.create("div", {
                className: "inline-block graph-print-format-container"
            }, printFormatContainer);
            var posterPrintBlock = domConstruct.create("div", {
                className: "poster-print-block-container"
            }, posterPrint);
            domConstruct.create("div", {
                className: "inline-block poster-print-block poster-print-block-left"
            }, posterPrintBlock);
            domConstruct.create("div", {
                className: "inline-block poster-print-block"
            }, posterPrintBlock);
            domConstruct.create("div", {
                className: "inline-block poster-print-block poster-print-block-left"
            }, posterPrintBlock);
            domConstruct.create("div", {
                className: "inline-block poster-print-block"
            }, posterPrintBlock);
            domConstruct.create("div", {
                innerHTML: i18n("Poster"),
                className: "graph-print-container-subtitle"
            }, posterPrint);

            var numberOfPagesContainer = domConstruct.create("div", {
                className: "hidden"
            }, printFormatContainer);
            domConstruct.create("div", {
                innerHTML: i18n("Number of pages"),
                className: "graph-print-poster-pages-title"
            }, numberOfPagesContainer);
            var numberOfPages = new NumberSpinner({
                value: 2,
                constraints: {
                    min: 1,
                    max: 100,
                    places: 0
                },
                focused: false,
                onChange: function(value) {
                    posterPages = value;
                    if (value && value > 100) {
                        value = 2;
                    }
                }
            }).placeAt(numberOfPagesContainer);
            on(normalPrint, "click", function() {
                domClass.remove(posterPrint, "selected-print-option");
                domClass.add(numberOfPagesContainer, "hidden");
                domClass.add(normalPrint, "selected-print-option");
                printFormatNormal = true;
            });
            on(posterPrint, "click", function() {
                domClass.remove(normalPrint, "selected-print-option");
                domClass.remove(numberOfPagesContainer, "hidden");
                domClass.add(posterPrint, "selected-print-option");
                printFormatNormal = false;
            });

            // Create print style blocks.
            var printStyleContainer = domConstruct.create("div", {
                className: "graph-print-container"
            }, printContainer);
            domConstruct.create("div", {
                className: "graph-print-container-title",
                innerHTML: i18n("Graph Style")
            }, printStyleContainer);
            var normalStyle = domConstruct.create("div", {
                className: "inline-block graph-print-style-container selected-print-option"
            }, printStyleContainer);
            var normalBlock = domConstruct.create("div", {
                className: "normal-print-style-block"
            }, normalStyle);
            domConstruct.create("div", {
                className: "graph-print-style-container-image"
            }, normalBlock);
            domConstruct.create("div", {
                innerHTML: i18n("Shaded"),
                className: "graph-print-style-container-subtitle"
            }, normalBlock);

            var outlineStyle = domConstruct.create("div", {
                className: "inline-block graph-print-style-container"
            }, printStyleContainer);
            var outlineBlock = domConstruct.create("div", {
                className: "outline-print-style-block"
            }, outlineStyle);
            domConstruct.create("div", {
                className: "graph-print-style-container-image-dark"
            }, outlineBlock);
            domConstruct.create("div", {
                innerHTML: i18n("Outline"),
                className: "graph-print-style-container-subtitle"
            }, outlineBlock);

            on(normalStyle, "click", function() {
                domClass.remove(outlineStyle, "selected-print-option");
                domClass.add(normalStyle, "selected-print-option");
                printStyleNormal = true;
            });
            on(outlineStyle, "click", function() {
                domClass.remove(normalStyle, "selected-print-option");
                domClass.add(outlineStyle, "selected-print-option");
                printStyleNormal = false;
            });

            var printOverlays = true;
            var overlayCheckBoxContainer = domConstruct.create("div", {}, printStyleContainer);
            var overlayCheckBox = new CheckBox({
                value: printOverlays,
                checked: printOverlays,
                onChange: function(value) {
                    printOverlays = value;
                }
            }).placeAt(overlayCheckBoxContainer);
            domConstruct.create("label", {
                innerHTML: i18n("Show Overlays"),
                "for": overlayCheckBox.id
            }, overlayCheckBoxContainer);

            var printConfirmContainer = domConstruct.create("div", {
                className: "graph-print-buttons-container"
            }, printContainer);

            var previewButton = new Button({
                label: i18n("Preview"),
                onClick: function() {
                    printDialog.hide();

                    var activityCellsToChange = [];
                    var utilityCellsToChange = [];
                    var noteCellsToChange = [];
                    var parallelCellsToChange = [];
                    var switchCellsToChange = [];
                    var cells = null;

                    if (!printStyleNormal && self.graph && self.graph.model && self.graph.model.cells) {
                        cells = self.graph.model.cells;
                        var key = null;
                        for (key in cells) {
                            if (cells.hasOwnProperty(key)) {
                                var cell = cells[key];
                                if (cell.activity && cell.style) {
                                    var style = cell.style;
                                    if (style.indexOf("shape") === 0) {
                                        if (style.indexOf(".png") !== -1) {
                                            style = style.replace(".png", "-dark.png");
                                            cell.setStyle(style);
                                        }
                                        if (style.indexOf("fillColor=#00649D") !== -1) {
                                            switchCellsToChange.push(cell);
                                        } else {
                                            activityCellsToChange.push(cell);
                                        }
                                    } else if (style.indexOf("utilityStyle") === 0) {
                                        utilityCellsToChange.push(cell);
                                    } else if (style.indexOf("noteStyle") === 0) {
                                        noteCellsToChange.push(cell);
                                    } else if (style.indexOf("parallelStyle") === 0) {
                                        parallelCellsToChange.push(cell);
                                    }

                                }
                            }
                        }
                        if (activityCellsToChange && activityCellsToChange.length > 0) {
                            mxUtils.setCellStyles(self.graph.model, activityCellsToChange, "fillColor", "#FFF");
                            mxUtils.setCellStyles(self.graph.model, activityCellsToChange, "strokeColor", "#3B0256");
                            mxUtils.setCellStyles(self.graph.model, activityCellsToChange, "fontColor", "#222");
                        }
                        if (utilityCellsToChange && utilityCellsToChange.length > 0) {
                            mxUtils.setCellStyles(self.graph.model, utilityCellsToChange, "fillColor", "#FFF");
                            mxUtils.setCellStyles(self.graph.model, utilityCellsToChange, "strokeColor", "#222");
                            mxUtils.setCellStyles(self.graph.model, utilityCellsToChange, "fontColor", "#222");
                            mxUtils.setCellStyles(self.graph.model, utilityCellsToChange, "fontSize", "16");
                        }
                        if (noteCellsToChange && noteCellsToChange.length > 0) {
                            mxUtils.setCellStyles(self.graph.model, noteCellsToChange, "fillColor", "#EEE");
                            mxUtils.setCellStyles(self.graph.model, noteCellsToChange, "strokeColor", "#AAA");
                            mxUtils.setCellStyles(self.graph.model, noteCellsToChange, "shadow", "1");
                        }
                        if (parallelCellsToChange && parallelCellsToChange.length > 0) {
                            mxUtils.setCellStyles(self.graph.model, parallelCellsToChange, "fillColor", "#EEE");
                            mxUtils.setCellStyles(self.graph.model, parallelCellsToChange, "strokeColor", "#888");
                            mxUtils.setCellStyles(self.graph.model, parallelCellsToChange, "fontColor", "#222");
                        }
                        if (switchCellsToChange && switchCellsToChange.length > 0) {
                            mxUtils.setCellStyles(self.graph.model, switchCellsToChange, "fillColor", "#F0F0F0");
                            mxUtils.setCellStyles(self.graph.model, switchCellsToChange, "strokeColor", "#888");
                            mxUtils.setCellStyles(self.graph.model, switchCellsToChange, "fontColor", "#222");
                        }
                    }

                    var preview = null;
                    var title = i18n("Printer-friendly version");
                    var scale = mxUtils.getScaleForPageCount(printFormatNormal?1:posterPages, self.graph, mxConstants.PAGE_FORMAT_A4_LANDSCAPE);
                    if (scale>1) {
                        scale = 1;
                    }
                    scale -= 0.1;
                     if (printFormatNormal) {
                        preview = new mxPrintPreview(self.graph, scale, null, null, null, null, null, title, null);
                     } else {
                        title = i18n("Poster Printer-friendly version");
                        preview = new mxPrintPreview(self.graph, scale, null, null, null, null, null, title, null);
                     }
                    preview.pageFormat = mxConstants.PAGE_FORMAT_A4_LANDSCAPE;
                    preview.printOverlays = printOverlays;
                    preview.border = 20;
                    preview.open();

                    if (activityCellsToChange && activityCellsToChange.length > 0) {
                        array.forEach(activityCellsToChange, function(cell) {
                            var cellStyle = cell.style;
                            if (cellStyle.indexOf("-dark.png") !== -1) {
                                cellStyle = cellStyle.replace("-dark.png", ".png");
                                cell.setStyle(cellStyle);
                            }
                        });
                        mxUtils.setCellStyles(self.graph.model, activityCellsToChange, "fillColor", "#7F1C7D");
                        mxUtils.setCellStyles(self.graph.model, activityCellsToChange, "strokeColor", "#FFF");
                        mxUtils.setCellStyles(self.graph.model, activityCellsToChange, "fontColor", "#FFF");
                    }
                    if (utilityCellsToChange && utilityCellsToChange.length > 0) {
                        mxUtils.setCellStyles(self.graph.model, utilityCellsToChange, "fillColor", "#888");
                        mxUtils.setCellStyles(self.graph.model, utilityCellsToChange, "strokeColor", "#FFF");
                        mxUtils.setCellStyles(self.graph.model, utilityCellsToChange, "fontColor", "#FFF");
                        mxUtils.setCellStyles(self.graph.model, utilityCellsToChange, "fontSize", "14");
                    }
                    if (noteCellsToChange && noteCellsToChange.length > 0) {
                        mxUtils.setCellStyles(self.graph.model, noteCellsToChange, "fillColor", "#FDB813");
                        mxUtils.setCellStyles(self.graph.model, noteCellsToChange, "strokeColor", "#FFF");
                        mxUtils.setCellStyles(self.graph.model, noteCellsToChange, "shadow", "0");
                    }
                    if (parallelCellsToChange && parallelCellsToChange.length > 0) {
                        mxUtils.setCellStyles(self.graph.model, parallelCellsToChange, "fillColor", "#82D1F5");
                        mxUtils.setCellStyles(self.graph.model, parallelCellsToChange, "strokeColor", "#00B2EF");
                        mxUtils.setCellStyles(self.graph.model, parallelCellsToChange, "fontColor", "#222");
                    }
                    if (switchCellsToChange && switchCellsToChange.length > 0) {
                        array.forEach(switchCellsToChange, function(cell) {
                            var switchCellStyle = cell.style;
                            if (switchCellStyle.indexOf("-dark.png") !== -1) {
                                switchCellStyle = switchCellStyle.replace("-dark.png", ".png");
                                cell.setStyle(switchCellStyle);
                            }
                        });
                        mxUtils.setCellStyles(self.graph.model, switchCellsToChange, "fillColor", "#00649D");
                        mxUtils.setCellStyles(self.graph.model, switchCellsToChange, "strokeColor", "#FFF");
                        mxUtils.setCellStyles(self.graph.model, switchCellsToChange, "fontColor", "#FFF");
                    }
                }
            }).placeAt(printConfirmContainer);
            var cancelButton = new Button({
                label: i18n("Cancel"),
                onClick: function() {
                    printDialog.hide();
                }
            }).placeAt(printConfirmContainer);
            domClass.add(previewButton.domNode, "idxButtonSpecial");
            printDialog.show();
        },

        showHelp: function() {
            domStyle.set(this.editor.graphDiagram.helpAttach, "display", "block");
        },

        hideHelp: function() {
            domStyle.set(this.editor.graphDiagram.helpAttach, "display", "none");
            domStyle.set(this.helpLink, "display", "block");
        },

        isForDraft: function() {
            return this.versionData && this.versionData.isDraft && config.data.systemConfiguration.safeEditFeatureEnabled;
        },

        isLocked: function() {
            return this.versionData && this.versionData.locked && config.data.systemConfiguration.safeEditFeatureEnabled;
        },

        lockIsOwned: function() {
            return this.versionData && this.versionData.lockOwned && config.data.systemConfiguration.safeEditFeatureEnabled;
        }
    });
});

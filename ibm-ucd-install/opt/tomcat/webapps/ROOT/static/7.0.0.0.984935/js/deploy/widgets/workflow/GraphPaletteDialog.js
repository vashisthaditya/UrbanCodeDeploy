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
/*global define, require, mxEvent, mxClient, mxUtils */

define(["dojo/_base/declare",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/dom-class",
    "dojo/dom-geometry",
    "dojo/date/locale",
    "dojo/aspect",
    "dojo/on",
    "dojo/has",
    "dojo/_base/event",
    "dojo/_base/connect",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/window",
    "dijit/TitlePane",
    "dijit/form/Button",
    "js/webext/widgets/Dialog",
    "deploy/widgets/workflow/GraphPaletteWidget"
], function(declare,
    domConstruct,
    domStyle,
    domClass,
    domGeometry,
    dateLocale,
    aspect,
    on,
    has,
    event,
    connect,
    lang,
    array,
    win,
    TitlePane,
    Button,
    Dialog,
    GraphPaletteWidget) {
    return declare('deploy.widgets.workflow.GraphPaletteDialog', [Dialog], {

        editor: null,
        positionCell: true,

        postCreate: function() {
            this.inherited(arguments);

            // create dialog
            var self = this;
            domStyle.set(this.containerContainer, {
                maxHeight: "1000px"
            });

            // title
            domConstruct.create("div", {
                innerHTML: i18n("Add Step")
            }, this.titleNode);

            // palette
            this.addPaletteWidget();

            // add buttons
            this.buttonContainer = domConstruct.create("div", {
                className: "underField"
            }, this.containerNode);

            // add button
            this.selectedItem = null;
            var addButton = new Button({
                label: i18n("Add"),
                "class": "idxButtonSpecial",
                onClick: function() {
                    if (self.selectedItem) {
                        self.releaseFunction(self.selectedItem);
                    }
                }
            });
            addButton.placeAt(this.buttonContainer);

            // cancel button
            var cancelButton = new Button({
                label: i18n("Cancel"),
                onClick: function() {
                    self.hide();
                }
            });
            cancelButton.placeAt(this.buttonContainer);

            // set container node size
            this._size = function() {
                var dim = win.getBox();
                var treeHeight = Math.min(600, dim.h - 300);
                domStyle.set(self.paletteWidget.treeAttach, "height", treeHeight + "px");
                domStyle.set(
                    self.paletteWidget.paletteContainer,
                    "height",
                    treeHeight + "px");
                domStyle.set(self.containerNode, {
                    width: "415px",
                    height: treeHeight + 100 + "px",
                    overflow: "hidden",
                    position: "inherit"
                });
                domStyle.set(self.containerContainer, {
                    height: treeHeight + 130 + "px",
                    overflow: "hidden"
                });
                self._position();
                self.paletteWidget.tree.resize();
            };
        },

        addPaletteWidget: function() {
            var ds = null;
            var self = this;
            var threshFunc = function(e) {
                ds.dragOffset.x = 0;
                ds.dragOffset.y = 0;
                if (!ds.begX) {
                    ds.begX = e.clientX;
                    ds.begY = e.clientY;
                    ds.moving = false;
                } else if (Math.abs(ds.begX - e.clientX) > 10 ||
                    Math.abs(ds.begY - e.clientY) > 10) {
                    ds.moving = true;
                }
                if (ds.moving && ds.mouseMoveHandler) {
                    if (self.isDialogVisible) {
                        delete self.isDialogVisible;
                        self.hide();
                    }
                    ds.mouseMoveHandler(e);
                }
            };
            var startDrag = function(evt) {
                if (this.enabled && !mxEvent.isConsumed(evt)) {
                    ds = evt.currentTarget.ds;
                    this.startDrag(evt);
                    this.mouseMoveHandler = mxUtils.bind(this, this.mouseMove);
                    mxEvent.addListener(document, 'mousemove', threshFunc);
                    this.mouseUpHandler = mxUtils.bind(this, this.mouseUp);
                    mxEvent.addListener(document, 'mouseup', this.mouseUpHandler);
                    mxEvent.consume(evt);
                }
            };

            var onclick = function(e) {
                if (self.selectedItem) {
                    domClass.remove(self.selectedItem, "selected");
                }
                self.selectedItem = e.currentTarget;
                domClass.add(self.selectedItem, "selected");
            };

            var ondblclick = function(e) {
                self.releaseFunction(e.currentTarget);
            };

            var onmouseup = function(evt) {
                if (ds.mouseUpHandler !== null) {
                    mxEvent.removeListener(document, 'mousemove', threshFunc);
                    mxEvent.removeListener(document, 'mouseup', ds.mouseUpHandler);
                }
            };

            var postStepCreate = function(div) {

                // on single click, just select it
                on(div, "click", onclick);

                // on double click, created it
                on(div, "dblclick", ondblclick);

                ds = div.ds;
                if (ds) {
                    var m = div.mxListenerList[0];
                    mxEvent.removeListener(div, m.name, m.f);
                    mxEvent.addListener(div, m.name, mxUtils.bind(ds, startDrag));

                    aspect.before(ds, "mouseUp", onmouseup);
                }

            };

            var paletteWidgetContainer = domConstruct.create("div", {}, this.containerNode);
            this.paletteWidget = new GraphPaletteWidget({
                editor: this.editor,
                postStepCreate: postStepCreate,
                nodrag: mxClient.IS_IE
            }, paletteWidgetContainer);
            this.paletteWidget.startup();
            domClass.add(this.paletteWidget.treeAttach, "dialogPaletteTree");
        },

        releaseFunction: function(selectedItem) {
            // find empty spot in diagram
            var x = 0;
            var y = 0;

            // increment where shape is dropped from top of diagram
            var graph = this.editor.graph;
            this.dropDeltaX = this.dropDeltaX || 0;
            this.dropDeltaY = this.dropDeltaY || -50;
            this.dropDeltaY += 80;
            if (this.dropDeltaY > 600) {
                this.dropDeltaY = 25;
                this.dropDeltaX += 300;
            }
            y = this.dropDeltaY;

            // find emtpy space on right
            var model = graph.model;
            var parent = graph.getDefaultParent();
            var childCount = model.getChildCount(parent);
            var i = 0;
            for (i = 0; i < childCount; i++) {
                var cell = model.getChildAt(parent, i);
                if (!cell.edge) {
                    var geo = model.getGeometry(cell);
                    var hasEdges = model.getEdges(cell).length > 0;
                    var isContainer = cell.activity && cell.activity.isContainer;
                    // place to the left of everything with edges or a container
                    if (hasEdges || isContainer) {
                        if (geo.x + geo.width > x) {
                            x = geo.x + geo.width;
                        }
                    }
                }
            }
            selectedItem.releaseFunction(graph, null, null, x + this.dropDeltaX + 100, y);
            this.hide();
        },

        show: function(opts) {
            var self = this;
            var options = opts || {};
            if (options.onlyShow) {
                // if opened from palette, hide all drawers except that drawer
                var drawerId = null;
                for (drawerId in this.titlePanes) {
                    if (this.titlePanes.hasOwnProperty(drawerId)) {
                        var titlePane = this.titlePanes[drawerId];
                        if (drawerId === options.onlyShow) {
                            domClass.remove(titlePane.domNode, "hidden");
                        } else if (!domClass.contains(titlePane.domNode, "hidden")) {
                            domClass.add(titlePane.domNode, "hidden");
                            titlePane.restoreMe = true;
                        }
                    }
                }
            }

            this.inherited(arguments);

            if (this._fadeInDeferred) {
                this._fadeInDeferred.then(function() {
                    self.resize();
                });
            }

            if (this.selectedItem) {
                domClass.remove(this.selectedItem, "selected");
                this.selectedItem = null;
            }

            this.paletteWidget.resetSearch();

            this.isDialogVisible = true;
        }

    });
});

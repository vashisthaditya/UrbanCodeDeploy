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
        "dijit/_Widget",
        "dojo/_base/declare",
        "dojo/on",
        "dojo/dom-construct",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Dialog"
        ],
function(
        _Widget,
        declare,
        on,
        domConstruct,
        ColumnForm,
        Dialog
) {
    /*globals mxClient, mxUtils, mxToolbar, mxPrintPreview, mxWindow, mxCellOverlay, mxCellOverlay, mxImage, mxPoint,
     mxConstants, mxEvent, mxConnectionConstraint, mxGraph, mxOutline, mxDivResizer, mxGraphLayout, mxRectangle,
     mxLayoutManager, mxEdgeStyle
     */
    /**
     * This is an edge management widget for graphs. Its primary purpose is to handle creation and
     * modification of edges.
     *
     * Properties:
     *  graphEditor / Object (BaseGraph)    The editor this activity has been added to. Required at
     *                                      creation time.
     *
     * Built-in (generated) properties:
     *  graph / Object (mxGraph)            The internal mxGraph instance for the editor.
     *
     */
    return declare('deploy.widgets.workflow.GraphEdgeManager',  [_Widget], {
        graphEditor: null,
        graph: null,

        postCreate: function() {
            this.inherited(arguments);

            if (!this.graphEditor) {
                throw "Unable to create a GraphEdgeManager without a graphEditor specified.";
            }

            this.graph = this.graphEditor.graph;
        },

        setGraphHasChanges: function(){
            if (this.graphHasChanges){
                this.graphHasChanges();
            }
            else {
                document.hasChanges = true;
            }
        },

        addEdgeOverlays: function(cell, source) {
            var self = this;
            var model = this.graph.getModel();
            var geometry = model.getGeometry(cell);
            var width = geometry.width;
            var height = geometry.height;
            var isApproval = (source.activity.data.type === "applicationApprovalTask"
                                 || source.activity.data.type === "environmentApprovalTask"
                                     || source.activity.data.type === "componentApprovalIterator");

            cell.data = {
                type: "ALWAYS"
            };

            var deleteOverlay = new mxCellOverlay(new mxImage(bootstrap.imageUrl+'icons/process/close_step.png', 18, 18));
            deleteOverlay.cursor = 'pointer';

            var xOffset = 0;
            var yOffset = 0;
            if (source.activity && source.activity.data.type !== "start" && !isApproval) {
                if (source.activity.data.type === "switch") {
                    yOffset = -10;
                    xOffset = 10;
                }
                else {
                    xOffset = 10;
                }
            }

            deleteOverlay.offset = new mxPoint(xOffset, yOffset);
            deleteOverlay.addListener(
                mxEvent.CLICK,
                mxUtils.bind(this, function(sender, evt) {
                    self.deleteEdge(cell);
                })
            );

            this.graph.addCellOverlay(cell, deleteOverlay);

            if (source.activity && source.activity.data.type === "switch") {
                this.addEditOverlay(cell);
                self.graph.labelChanged(cell, i18n("Default"));
                self.graph.setDefaultEdge(cell, true);
            }
            if (source.activity
                    && source.activity.data.type !== "switch"
                        && source.activity.data.type !== "start") {
                // Approval tasks should default to SUCCESS arrows, and not display it
                if (!isApproval) {
                    this.addCheckOverlay(cell);
                } else {
                    cell.data.type = "SUCCESS";
                }
            }
        },

        addCheckOverlay: function(cell) {
            var self = this;

            var checkOverlay = new mxCellOverlay(new mxImage(bootstrap.imageUrl+'icons/process/step_successful.png', 20, 20));
            checkOverlay.cursor = 'pointer';
            checkOverlay.offset = new mxPoint(-11, 0);
            checkOverlay.align = mxConstants.ALIGN_RIGHT;
            checkOverlay.verticalAlign = mxConstants.ALIGN_TOP;
            checkOverlay.tooltip = i18n("Run On Success");
            checkOverlay.addListener(
                mxEvent.CLICK,
                mxUtils.bind(this, function(sender, evt) {
                    self.setGraphHasChanges();
                    self.addErrorOverlay(cell);
                    self.graph.removeCellOverlay(cell, checkOverlay);
                })
            );

            cell.data.type = "SUCCESS";

            this.graph.setEdgeState(cell);
            this.graph.addCellOverlay(cell, checkOverlay);
        },

        /**
         *
         */
        addErrorOverlay: function(cell) {
            var self = this;

            var errorOverlay = new mxCellOverlay(new mxImage(bootstrap.imageUrl+'icons/process/step_fail.png', 20, 20));
            errorOverlay.cursor = 'pointer';
            errorOverlay.offset = new mxPoint(-11, 0);
            errorOverlay.align = mxConstants.ALIGN_RIGHT;
            errorOverlay.verticalAlign = mxConstants.ALIGN_TOP;
            errorOverlay.tooltip = i18n("Run On Failure");
            errorOverlay.addListener(
                mxEvent.CLICK,
                mxUtils.bind(this, function(sender, evt) {
                    self.setGraphHasChanges();
                    self.addAlwaysOverlay(cell);
                    self.graph.removeCellOverlay(cell, errorOverlay);
                })
            );

            cell.data.type = "FAILURE";

            this.graph.setEdgeState(cell, true);
            this.graph.addCellOverlay(cell, errorOverlay);
        },

        /**
         *
         */
        addAlwaysOverlay: function(cell) {
            var self = this;

            var alwaysOverlay = new mxCellOverlay(new mxImage(bootstrap.imageUrl+'icons/process/step_always.png', 20, 20));
            alwaysOverlay.cursor = 'pointer';
            alwaysOverlay.offset = new mxPoint(-11, 0);
            alwaysOverlay.align = mxConstants.ALIGN_RIGHT;
            alwaysOverlay.verticalAlign = mxConstants.ALIGN_TOP;
            alwaysOverlay.tooltip = i18n("Always Run");
            alwaysOverlay.addListener(
                mxEvent.CLICK,
                mxUtils.bind(this, function(sender, evt) {
                    self.setGraphHasChanges();
                    self.addCheckOverlay(cell);
                    self.graph.removeCellOverlay(cell, alwaysOverlay);
                })
            );

            cell.data.type = "ALWAYS";

            this.graph.setEdgeState(cell, "always");
            this.graph.addCellOverlay(cell, alwaysOverlay);
        },

        /**
         *
         */
        addEditOverlay: function(cell) {
            var self = this;

            var editOverlay = new mxCellOverlay(new mxImage(bootstrap.imageUrl+'icons/process/step_edit.png', 18, 18));
            editOverlay.cursor = 'pointer';
            editOverlay.offset = new mxPoint(-10, -10);
            editOverlay.align = mxConstants.ALIGN_RIGHT;
            editOverlay.verticalAlign = mxConstants.ALIGN_TOP;
            editOverlay.addListener(
                mxEvent.CLICK,
                mxUtils.bind(this, function(sender, evt) {
                    self.editEdgeProperties(cell);
                })
            );

            cell.data.type = "VALUE";

            this.graph.addCellOverlay(cell, editOverlay);
        },

        deleteEdge: function(edge) {
            var model = this.graph.getModel();

            model.beginUpdate();
            this.graph.removeCells([edge], true);
            model.endUpdate();

            this.setGraphHasChanges();
        },

        editEdgeProperties: function(cell) {
            var self = this;

            var propertyDialog = new Dialog({
                title: i18n("Edit Properties"),
                closable: true,
                draggable: true
            });

            var propertyForm = new ColumnForm({
                onSubmit: function(data) {
                    self.setGraphHasChanges();

                    cell.data.value = data.value || null;

                    if (data.isDefault === "true" || cell.data.value === "" || !data.value) {
                        self.graph.labelChanged(cell, i18n("Default"));
                        self.graph.setDefaultEdge(cell, true);
                    }
                    else {
                        self.graph.labelChanged(cell, data.value.replace(/\n/g, ", "));
                        self.graph.setDefaultEdge(cell);
                    }

                    propertyDialog.hide();
                    propertyForm.destroy();
                    propertyDialog.destroy();
                },
                onCancel: function(){
                    propertyDialog.hide();
                    this.destroy();
                    propertyDialog.destroy();
                }
            });

            var isDefault = !cell.data.value;
            var defaultSwitch = propertyForm.addField({
                name: "isDefault",
                label: i18n("Default?"),
                type: "Switch",
                value: isDefault,
                onChange: function(value) {
                    if (value) {
                        if (propertyForm.hasField("value")) {
                            propertyForm.removeField("value");
                            propertyForm.removeField("value_description");
                            propertyForm.removeField("wildcard");
                        }
                    }
                    else {
                        self.addValueFields(propertyForm, cell);
                    }
                }
            });

            domConstruct.create("div", {
                className: "inline-block graph-edit-properties labelsAndValues-valueCell",
                innerHTML: i18n("When this switch is on, this connection will be taken only when no " +
                    "others are matched.")
            }, defaultSwitch.widget.fieldRow, "last");

            if (!isDefault) {
                self.addValueFields(propertyForm, cell);
            }

            propertyForm.placeAt(propertyDialog.containerNode);
            propertyDialog.show();
        },

        addValueFields: function(propertyForm, cell) {
            propertyForm.addField({
                name: "value",
                label: i18n("Value"),
                type: "Text Area",
                required: true,
                value: cell.data.value
            });
            propertyForm.addField({
                name: "value_description",
                label: "",
                type: "Label",
                value: i18n("Enter the value(s) to match to take this arrow. Multiple values can " +
                        "be entered, one per line. Only one must match for this connection to " +
                        "be valid.")
            });
            propertyForm.addField({
                name: "wildcard",
                label: "",
                type: "Label",
                value: i18n("* can be used as a wildcard.")
            });
        }
    });
});
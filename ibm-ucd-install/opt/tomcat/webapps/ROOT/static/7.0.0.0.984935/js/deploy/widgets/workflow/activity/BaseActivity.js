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
/*global define, require, mxGeometry */

define([
        "dijit/_Widget",
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/xhr",
        "dojo/_base/event",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/aspect",
        "dojo/on",
        "js/webext/widgets/DomNode",
        "js/webext/widgets/Alert",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Dialog",
        "deploy/widgets/workflow/GraphLayout",
        "deploy/widgets/property/PropertyBox",
        "deploy/widgets/scripts/ScriptEditorDialog",
        "deploy/widgets/process/ProcessIconsFormatter"
        ],
function(
        _Widget,
        array,
        declare,
        lang,
        xhr,
        event,
        domClass,
        domConstruct,
        aspect,
        on,
        DomNode,
        Alert,
        GenericConfirm,
        ColumnForm,
        Dialog,
        GraphLayout,
        PropertyBox,
        ScriptEditorDialog,
        ProcessIconsFormatter
) {
    /**
     * A base widget for managing an activity in a graph.
     *
     * Properties:
     *  graphEditor / Object (BaseGraph)    The editor this activity has been added to. Required at
     *                                      creation time.
     *  readOnly / Boolean                  Whether this activity can be edited or not. Default: false
     *  isContainer / Boolean               Whether this activity is a container for other activities
     *  parent / Object (BaseActivity)      The parent activity of this activity. Default: null
     *  data / Object                       The configuration for this activity.
     *
     * Built-in (generated) properties:
     *  graph / Object (mxGraph)            The internal mxGraph instance for the editor.
     *  cell / Object (mxCell)              The internal mxCell representation of this activity. This is
     *                                      null until the createCell() function is invoked.
     * initialized / Boolean                Whether this cell has all data set. This is automatically
     *                                      set to true for cells loaded from existing graphs. It's up
     *                                      to the editActivities function to handle this for new cells.
     *
     * Functions:
     *  getLabel() returns String           Returns the text to display as this cell's label, given the
     *                                      current state of the activity.
     *  getStyle() returns String           Returns the mxGraph cell style name to use for the cell.
     *  editProperties()                    For applicable activity types, this will create the dialog
     *                                      and form for editing the activity properties.
     *  createPropertyDialog() ret. Dialog  For child classes: Creates a Dialog with useful defaults.
     *  createPropertyform() ret. Dialog    For child classes: Creates a ColumnForm with useful defaults.
     *  canEdit() returns Boolean           Determines whether this activity can be edited.
     *  canDelete() returns Boolean         Determines whether this activity can be deleted.
     *  isUtilityCell() returns Boolean     Determines whether this activity is a utility-type cell
     *                                      (start, end, etc.)
     *  addEditOverlay()                    Creates the edit button over this cell.
     *  addDeleteOverlay()                  Creates the delete button over this cell.
     *  sizeCell()                          Sets the cell size to match the label.
     *
     */
    return declare('deploy.widgets.workflow.activity.BaseActivity',  [_Widget], {
        graphEditor: null,
        graph: null,
        cell: null,
        readOnly: false,
        isContainer: false,
        parent: null,
        data: {},
        uiData: {},
        initialized: false,
        disableEditing: true,

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            if(!this.process) {
                if (this.graphEditor && this.graphEditor.applicationProcess) {
                    this.process = this.graphEditor.applicationProcess;
                }
                else if (this.graphEditor && this.graphEditor.componentProcess) {
                    this.process = this.graphEditor.componentProcess;
                }
            }

            if (!this.graphEditor) {
                throw "Unable to create an activity without a graphEditor specified.";
            }

            this.graph = this.graphEditor.graph;

            // prevent edit properties on creation
            if (!this.initialized) {
                aspect.around(this, "editProperties", function(originalMethod) {
                    return function() {
                        if (!this.disableEditing) {
                            originalMethod.apply(this, arguments);
                        }
                    };
                });
            }
        },

        getLabel: function() {
            // Placeholder
        },

        getName: function() {
            return this.data.name;
        },

        getFillColor: function() {
            return "#7F1C7D";
        },

        getStyle: function() {
            var image = ProcessIconsFormatter.getIconForStep(this);

            var imageUrl = bootstrap.imageUrl+'icons/process/' + image + '.png';
            var style = 'shape=label;' +
                'spacingLeft=45;' +
                'spacingRight=-20;' +
                'spacingTop=-10;' +
                'spacingBottom=-10;' +
                'fontFamily=helvetica,arial,tahoma,verdana,sans-serif,"lucida grande";' +
                'fontSize=12;' +
                'fontColor=#FFF;' +
                'verticalAlign=middle;' +
                'align=left;' +
                'strokeColor=#FFF;'+
                'strokeWidth=2;'+
                'fillColor=' + this.getFillColor() + ";" +
                'vertexHighlightColor=#AAA;' +
                'edgeHighlightColor=#AAA;' +
                'highlightColor=#AAA;' +
                'image=' + imageUrl + ';' +
                'imageWidth=32;' +
                'imageHeight=32;' +
                'autosize;';
            return style;
        },

        getIcon: function(){
            var icon = " job-icon";
            if (this.type){
                icon += this.type;
            }
            else if (this.icon){
                icon += this.icon;
            }
            else if (this.plugin && this.name){
                icon += this.name.replace(/\W+/g, "");
            }
            return '<div class="process-icon' + icon + '"></div>';
        },

        editProperties: function() {
            // Placeholder
        },

        copyActivity: function() {
            var self = this;

            var ownerId, ownerVersion, processType;
            if (this.graphEditor.applicationProcessId) {
                processType = "APPLICATION";
                ownerId = this.graphEditor.applicationProcessId;
                ownerVersion = this.graphEditor.applicationProcessVersion;
            }
            else if (this.graphEditor.componentProcessId) {
                if (this.graphEditor.isDraft && config.data.systemConfiguration.safeEditFeatureEnabled) {
                    processType = "COMPONENTDRAFT";
                }
                else {
                    processType = "COMPONENT";
                }
                ownerId = this.graphEditor.componentProcessId;
                ownerVersion = this.graphEditor.componentProcessVersion;
            }
            // approvalProcess also has a processId so need to check this first
            else if (this.graphEditor.approvalProcess) {
                processType = "APPROVAL";
                ownerId = this.graphEditor.approvalProcess.environmentId;
                ownerVersion = this.graphEditor.approvalProcess.version;
            }
            else if (this.graphEditor.processId) {
                processType = "GENERIC";
                ownerId = this.graphEditor.processId;
                ownerVersion = this.graphEditor.processVersion;
            }

            var putData = {
                "name" : this.getName(),
                "label" : this.getLabel(),
                "activityId" : this.data.id,
                "ownerId" : ownerId,
                "ownerVersion": ownerVersion,
                "processType" : processType
            };

            xhr.put({
                url: bootstrap.restUrl+"copiedStep/",
                putData: JSON.stringify(putData),
                load: function(data) {
                    self.graphEditor.refreshStepPalette(null, true);
                    self.graphEditor.showSavePopup(i18n("'%s' copied successfully.", self.getLabel()));
                },
                error: function(error, ioArgs) {
                    var errorAlert = new Alert({
                        message: i18n("An error occurred while trying to copy the activity %s: %s",
                                util.escape(self.getName()),
                                util.escape(error.responseText))
                    });
                }
            });
        },

        canEdit: function() {
            return true;
        },

        canDelete: function() {
            return !this.readOnly;
        },

        canCopy: function() {
            return true;
        },

        isUtilityCell: function() {
            return false;
        },

        setGraphHasChanges: function(){
            if (this.graphHasChanges){
                this.graphHasChanges();
            }
            else {
                document.hasChanges = true;
            }
        },

        createCell: function(x, y, h, w) {
            var self = this;
            this.disableEditing = false;
            if (this.cell) {
                throw "Cell already generated.";
            }

            var label = this.getLabel();
            var style = this.getStyle();

            // if dropping on an edge, use source or target's parent
            var parent = this.parent;
            if (parent && parent.edge) {
                parent = (parent.source || parent.target || {parent:parent}).parent;
            }
            this.cell = this.graph.insertVertex(parent, '', label, x, y, null, null, style);
            this.cell.activity = this;

            this.sizeCell(h, w);

            var dropTarget = this.graph.lastDropTarget;
            // Check if we are dropping on an edge and if the edge
            // will end up connecting within the same parent.
            if (dropTarget && dropTarget.edge && dropTarget.parent.id === parent.id) {
                this.edgePlaceholder = {
                    from: dropTarget.source,
                    to: dropTarget.target,
                    type: dropTarget.data ? dropTarget.data.type : null,
                    value: dropTarget.data ? dropTarget.data.value : null
                };
                this.graph.splitEdge(dropTarget, [this.cell], 0, 0);
            }

            this.addOverlays();

            // make container big enough
            if (parent && parent.activity && parent.activity.isContainer) {
                GraphLayout.resizeParent(parent, this.graph);
            }

            // select created cell and layout diagram
            if (this.graphEditor.initialized) {
                if (this.parent && this.parent.edge) {
                    this.graphEditor.pauseLayout = true;
                    setTimeout(function(){
                        delete self.graphEditor.pauseLayout;
                        GraphLayout.layout(self.graphEditor, {animate: true, select: self.cell});
                    });
                } else {
                    this.graph.setSelectionCell(this.cell);
                    if (this.cell.style !== "noteStyle" && GraphLayout.getVisibleEdges(this.graphEditor).length===0) {
                        var finishCells = this.graphEditor.getFinishCells();
                        if (finishCells && finishCells.length===1) {
                            if (!parent) {
                                parent = this.graph.getDefaultParent();
                            }
                            this.graphEditor.pauseLayout = true;
                            this.graph.insertEdge(parent, null, '', this.graphEditor.getStartCell(parent), this.cell);
                            this.graph.insertEdge(parent, null, '', this.cell, finishCells[0]);
                            delete this.graphEditor.pauseLayout;
                            this.graph.fit(GraphLayout.MIN_SCALE);
                        }
                    }
                }
            }

        },

        addOverlays: function() {
            var x = -10;
            this.overlays = [];

            if (this.canDelete()) {
                this.addDeleteOverlay(x);
                x = x - 22;
            }

            if (this.canEdit()) {
                this.addEditOverlay(x);
                x = x - 22;
            }

            if (this.canCopy() && this.initialized) {
                this.addCopyOverlay(x);
            }


            if (this.canEdit() && !this.initialized) {
                this.infoIcon = true;
                this.addEditOverlay(x, true);
            }

        },

        refreshOverlays: function(validate) {
            var ret = false;
            if (validate) {
                if (!this.initialized && this.overlays.length>0) {
                    this.overlays[this.overlays.length-1].image = new mxImage(bootstrap.imageUrl+'icons/process/step_error.png', 28, 28);
                    ret = true;
                }
             } else if (this.initialized && this.infoIcon) {
                delete this.infoIcon;
                this.graph.removeCellOverlay(this.cell, this.overlays.pop());
                var x = -56;
                if (this.canCopy()) {
                    this.addCopyOverlay(x);
                }
            }
            return ret;
        },

        addDeleteOverlay: function(x) {
            var self = this;

            var deleteOverlay = new mxCellOverlay(new mxImage(bootstrap.imageUrl+'icons/process/close_step.png', 24, 24));
            deleteOverlay.cursor = 'pointer';
            deleteOverlay.offset = new mxPoint(x, 2);
            deleteOverlay.align = mxConstants.ALIGN_RIGHT;
            deleteOverlay.verticalAlign = mxConstants.ALIGN_TOP;
            deleteOverlay.addListener(
                mxEvent.CLICK,
                mxUtils.bind(this, function(sender, evt) {
                    var removeConfirm = new GenericConfirm({
                        message: i18n("Are you sure you want to remove this step?"),
                        action: function() {
                            self.destroy();
                            self.setGraphHasChanges();
                        }
                    });
                })
            );
            this.overlays.push(deleteOverlay);
            this.graph.addCellOverlay(this.cell, deleteOverlay);
        },

        addEditOverlay: function(x, info) {
            var self = this;

            // display info icon to highlight the fact that this step hasn't been initialized
            var icon = 'step_edit.png';
            var size = 18;
            var y = 2;
            if (info) {
                icon = 'step_info.png';
                size = 28;
                x = -20;
                var sz = this.graph.getPreferredSizeForCell(this.cell);
                y = (sz.height/2);
            }
            var editOverlay = new mxCellOverlay(new mxImage(bootstrap.imageUrl+'icons/process/'+ icon, size, size));
            editOverlay.cursor = 'pointer';
            editOverlay.offset = new mxPoint(x, y);
            editOverlay.align = mxConstants.ALIGN_RIGHT;
            editOverlay.verticalAlign = mxConstants.ALIGN_TOP;
            editOverlay.addListener(mxEvent.CLICK,
                mxUtils.bind(this, function(sender, evt) {
                    self.graphEditor.graph.tooltipHandler.hide();
                    self.graph.setSelectionCell(self.cell);
                    self.editProperties(function() {
                        if (!self.readOnly) {
                            self.setGraphHasChanges();
                            self.graphEditor.registerChangedActivity(self);
                        }
                    });
                })
            );
            this.overlays.push(editOverlay);
            this.graph.addCellOverlay(this.cell, editOverlay);
        },

        addCopyOverlay: function(x) {
            var self = this;

            var copyOverlay = new mxCellOverlay(new mxImage(bootstrap.imageUrl+'/icons/process/step_copy.png', 18, 18));
            copyOverlay.cursor = 'pointer';
            copyOverlay.offset = new mxPoint(x, 2);
            copyOverlay.align = mxConstants.ALIGN_RIGHT;
            copyOverlay.verticalAlign = mxConstants.ALIGN_TOP;
            copyOverlay.addListener(mxEvent.CLICK,
                mxUtils.bind(this, function(sender, evt) {
                    // Do not copy new or unsaved changed steps.
                    if (self.data.id && !self.graphEditor.isActivityChanged(self)) {
                        self.copyActivity();
                        self.graph.setSelectionCell(self.cell);
                    }
                    else {
                        var alert = new Alert({
                            message: i18n("This step has been edited. Please save the process before copying this step.")
                        });
                    }
                })
            );
            this.overlays.push(copyOverlay);
            this.graph.addCellOverlay(this.cell, copyOverlay);
        },

        destroy: function() {
            this.inherited(arguments);
            var model = this.graph.getModel();

            model.beginUpdate();
            this.graph.removeCells([this.cell], true);
            model.endUpdate();

            if (this.edgePlaceholder) {
                var edgeArgs = this.edgePlaceholder;
                var source = edgeArgs.from;
                var target = edgeArgs.to;

                if (source.parent && target.parent) {
                    this.graphEditor.restoreEdge(edgeArgs);
                }
            }

            this.edgePlaceholder = null;
            if (!this.readOnly) {
                this.setGraphHasChanges();
            }
        },

        sizeCell: function(h, w) {
            var model = this.graph.getModel();
            var geometry = model.getGeometry(this.cell);

            if (!!h && !!w) {
                geometry.height = h;
                geometry.width = w;
            }
            else {
                var size = this.graph.getPreferredSizeForCell(this.cell);
                geometry.height = size.height;
                geometry.width = size.width;
            }
        },

        updateLabel: function() {
            var model = this.graph.getModel();

            model.beginUpdate();
            this.graph.labelChanged(this.cell, this.getLabel());
            this.graph.refresh();
            model.endUpdate();
        },

        removePropertyField: function(propertyForm, name) {
            var runtimeSwitchName = "runtime_switch_"+name;
            var configSwitchName = "config_switch_"+name;

            if (propertyForm.hasField(runtimeSwitchName)) {
                propertyForm.removeField(runtimeSwitchName);
            }
            if (propertyForm.hasField(configSwitchName)) {
                propertyForm.removeField(configSwitchName);
            }
            if (propertyForm.hasField(name)) {
                propertyForm.removeField(name);
            }
        },

        /**
         * Helper function for child classes.  Many activities will want to take advantage of the defaults present here.
         */
         createPropertyDialog: function(config) {
            var self = this;

            if (config === undefined) {
                config = {};
            }
            if (config.title === undefined) {
                // use step name in title if available
                var name = this.graph.getStepName(this.cell);
                if (name) {
                    config.title = i18n("Edit Properties for %s", i18n(name));
                } else {
                    config.title = i18n("Edit Properties");
                }
            }
            if (config.closable === undefined) {
                config.closable = true;
            }
            if (config.draggable === undefined) {
                config.draggable = true;
            }

            var propertyDialog = new Dialog(config);
            propertyDialog.on("show", function() {
                self.graph.tooltipHandler.hide();

                dojo.forEach(self.propertyForm.fieldsArray, function(field) {
                    if (field.type === 'CodeEditor') {
                        field.widget.startup();

                        // this editor is display only
                        var editor = field.widget.editor;
                        editor.renderer.$cursorLayer.element.style.display = "none";
                        editor.setReadOnly(true);
                        editor.setOption("highlightActiveLine", false);
                        editor.on('changeSelection', function(e) {
                            editor.selection.setSelectionRange({
                                start: {
                                    row: 0,
                                    column: 0
                                },
                                end: {
                                    row: 0,
                                    column: 0
                                }
                            });
                        });

                        // show editor on click
                        editor.container.widget = field.widget;
                        on (editor.container, "mousedown", function(e){
                            event.stop(e);
                            self.openCodeEditor(e.currentTarget.widget);
                        });
                    }
                });
            });

            propertyDialog.on("hide", function() {
                self.refreshOverlays();
                self.propertyForm.destroy();
                propertyDialog.destroy();
            });

            return propertyDialog;
         },

        /**
         * Helper function for child classes.  Many activities will want to take advantage of the defaults present here.
         */
        createPropertyForm: function(config) {
            var self = this;

            if (config === undefined)  {
                config = {};
            }
            if (config.saveLabel === undefined) {
                config.saveLabel = i18n("OK");
            }

            // Client code MUST specify a dialog to attach to, merely because the alternative hasn't been fleshed out.
            var propertyDialog = config.dialog;
            if (!propertyDialog) {
                throw "Internal Error: Plugin must specify a dialog to attach it's property form to.";
            }

            // prevent double scrollbars by resizing to fit provided dialog
            config.shrinkFormToFit = true;
            this.propertyForm = new ColumnForm(config);

            // if creating script Property Area, use Ace editor instead
            aspect.around(this.propertyForm, "addField", function(originalMethod) {
                return function(propertyFieldData, beforeField) {
                    var field = null;
                    if (propertyFieldData.type === "PropertyArea" ||
                            propertyFieldData.name === "preconditionScript") {
                            var fieldData = lang.clone(propertyFieldData);
                            fieldData.type = "CodeEditor";
                            fieldData.textDir = "ltr";
                            switch(propertyFieldData.name) {
                            case "p_scriptBody":
                                fieldData.language = self.data.pluginName==="Groovy"?"groovy":"powershell";
                                break;
                            case "preconditionScript":
                                fieldData.language = "javascript";
                                break;
                            default:
                                fieldData.language = "text";
                                break;
                            }
                            fieldData.fontSize = "6pt";
                            field = originalMethod.call(this, fieldData, beforeField);
                            var widget = field.widget;
                            widget.type = "CodeEditor";
                            widget.value = fieldData.value||"";
                            domClass.add(widget.domNode, "labelsAndValues-editorCell");
                            if (widget.value.length<100) {
                                domClass.add(widget.domNode, "empty");
                            }
                    } else {
                        field = originalMethod.apply(this, arguments);
                    }
                    return field;
                };
            });

            this.propertyForm.on("cancel", function() {
                propertyDialog.hide();
                self.propertyForm.destroy();
                propertyDialog.destroy();
            });

            return this.propertyForm;
        },

        addPropertyField: function(propertyForm, propertyFieldData, configModeOn, beforeField) {
            var runtimeSwitchName = "runtime_switch_"+propertyFieldData.name;
            var runtimeSwitchWidget = new DomNode();
            var runtimeSwitchLink = domConstruct.create("a", {
                "class": "linkPointer",
                "innerHTML": i18n("Prompt for a value on use"),
                "style": {
                    "marginBottom": "5px"
                }
            }, runtimeSwitchWidget.domAttach);
            var runtimeSwitchFieldData = {
                name: runtimeSwitchName,
                widget: runtimeSwitchWidget,
                label: ""
            };


            var configSwitchName = "config_switch_"+propertyFieldData.name;
            var configSwitchWidget = new DomNode();
            var configSwitchLink = domConstruct.create("a", {
                "class": "linkPointer",
                "innerHTML": i18n("Set a value here"),
                "style": {
                    "marginBottom": "5px"
                }
            }, configSwitchWidget.domAttach);
            var configSwitchFieldData = {
                name: configSwitchName,
                widget: configSwitchWidget,
                label: (propertyFieldData.label ? propertyFieldData.label.escape() : propertyFieldData.label)
            };

            on(runtimeSwitchLink, "click", function() {
                propertyForm.addField(configSwitchFieldData, propertyFieldData.name);
                propertyForm.removeField(runtimeSwitchName);
                propertyForm.removeField(propertyFieldData.name);
            });
            on(configSwitchLink, "click", function() {
                propertyForm.addField(propertyFieldData, configSwitchName);
                if (config.data.systemConfiguration.enablePromptOnUse) {
                    propertyForm.addField(runtimeSwitchFieldData, configSwitchName);
                }
                propertyForm.removeField(configSwitchName);
            });

            if (configModeOn) {
                propertyForm.addField(propertyFieldData, beforeField);
                if (!this.readOnly && config.data.systemConfiguration.enablePromptOnUse) {
                    propertyForm.addField(runtimeSwitchFieldData, beforeField);
                }
            }
            else {
                if (!this.readOnly && config.data.systemConfiguration.enablePromptOnUse) {
                    propertyForm.addField(configSwitchFieldData, beforeField);
                }
                else {
                    propertyForm.addField(propertyFieldData, beforeField);
                }
            }
        },

        openCodeEditor: function(widget) {
            if (widget.type === "CodeEditor") {
                var scriptDialog = new ScriptEditorDialog({
                    readOnly: this.readOnly,
                    activity: this,
                    widget: widget
                });
                scriptDialog.show();
            }
        },


        /**
         * If the user entered a name that doesn't mention what this step does,
         * add the default label as a "description" of what this step does.
         */
        getDisplayName: function(name, value, mention, legacy) {
            var displayName = name;
            if (value) {
                var defaultName = this.getDefaultName(value);

                // if name is the legacy default name, use new default name
                if (legacy && displayName.indexOf(legacy) !== -1 ) {
                    displayName = defaultName;
                }

                // name doesn't mention a key aspect of what this step does,
                // add default name as a "description"
                if (displayName.indexOf(mention) === -1 || displayName.indexOf(value) === -1) {
                    displayName += "\n" + defaultName;
                }
            } else {
                // if value is not known at label time (ex: tagged labels)

                // name doesn't mention a key aspect of what this step does,
                // add default name as a "description"
                if (displayName.indexOf(mention) === -1) {
                    displayName += "\n" + this.getDefaultName("");
                }
            }
            return displayName;
        },

        getDefaultName: function(value) {
            // each step must implement their own
        },

        setDefaultNameValue: function(propertyForm, value) {
            var existingName = propertyForm.getValue("name");
            if (!existingName || existingName === this.lastDefaultName) {
                var defaultName = this.getUniqueName(this.getDefaultName(value));
                propertyForm.setValue("name", defaultName);
                this.lastDefaultName = defaultName;
            }
        },

        getUniqueName: function(name) {
            var inc = 1;
            var baseName = name;
            while (!this.isUnique(name)) {
              name = baseName + ' (' + inc + ')';
              inc++;
            }
            return name;
        },

        isUnique: function(name) {
            var nameDup = this.graphEditor.getChildrenByName(name, true);
            return nameDup.length===0 || nameDup[0].cell === this.cell;
        },

        validateName: function(name) {
            var self = this;
            var result = [];

            if (name.indexOf("/") >= 0) {
                result.push(i18n("The name may not contain the following characters: /"));
            }

            array.forEach(self.graphEditor.getChildrenByName(name, true), function(nameDup) {
                if (nameDup.cell !== self.cell) {
                    result.push(i18n("That name is in use by another activity in this process." +
                                " Please choose a unique name." +
                                " Name uniqueness is case insensitive."));
                }
            });

            return result;
        },

        getChildData: function() {
            var result = {};
            if (this.data.children && this.data.children.length === 1) {
                result = this.data.children[0];
            }

            return result;
        },

        getChildChildData: function() {
            var childData = this.getChildData();
            var result = {};
            if (childData.children && childData.children.length === 1) {
                result = childData.children[0];
            }

            return result;
        }
    });
});
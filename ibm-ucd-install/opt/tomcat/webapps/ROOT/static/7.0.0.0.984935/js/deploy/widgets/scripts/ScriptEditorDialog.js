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
/*global define, require, mxEvent, mxClient, mxToolbar, mxUtils */

define(["dojo/_base/declare",
        "dojo/dom-construct",
        "dojo/dom-style",
        "dojo/dom-class",
        "dojo/dom-geometry",
        "dojo/date/locale",
        "dojo/aspect",
        "dojo/on",
        "dojo/has",
        "dojo/query",
        "dojo/_base/event",
        "dojo/_base/lang",
        "dojo/_base/xhr",
        "dojo/window",
        "dijit/form/Button",
        "dijit/form/TextBox",
        "dijit/form/NumberTextBox",
        "idx/widget/ResizeHandle",
        "deploy/widgets/scripts/Editor",
        "js/webext/widgets/Alert",
        "js/webext/widgets/Dialog"],

function(declare,
        domConstruct,
        domStyle,
        domClass,
        domGeometry,
        dateLocale,
        aspect,
        on,
        has,
        query,
        event,
        lang,
        baseXhr,
        win,
        Button,
        TextBox,
        NumberTextBox,
        ResizeHandle,
        Editor,
        Alert,
        Dialog) {
    return declare('deploy.widgets.scripts.ScriptEditorDialog', [Dialog], {

        postCreate: function() {
            this.inherited(arguments);

            // create dialog
            var self = this;
            domStyle.set(this.containerContainer, {
                maxHeight: "1000px"
            });
            domClass.add(this.containerContainer, "no-double-click-select");

            // start based on who opened us
            if (this.script || this.source) {
                if (this.script) {
                    this.existingValues = this.script;
                }
                else if (this.source) {
                    this.existingValues = this.source;
                    this.existingValues.name = undefined;
                    this.existingValues.id = undefined;
                }
                this.value = this.existingValues.body;
            } else {
                this.value = this.widget.getValue();
            }
            this.language = this.language||this.widget.lang;

            // title
            domStyle.set(this.titleBar, {
                padding: "15px 0"
            });
            domConstruct.create("div", {
                innerHTML: this.language==="text"?i18n("Edit Text") :
                    (this.language==="javascript"? i18n("Edit JavaScript") :
                        (this.language==="groovy"? i18n("Edit Groovy") :
                            i18n("Edit Script"))),
                style: {
                    display: "inline-block"
                }
            }, this.titleNode);

            if (this.script || this.source) {
                this.addEditFields();
            }
            this.addToolbarWidget();
            this.addEditorWidget();

            // set container node size
            this.manualSized = false;
            this.editorDiv = query(".ace_editor", this.editorAttach)[0];
            domStyle.set(this.editorDiv, "width", "100%");
            this.resizeWidget = new ResizeHandle({
                activeResize: false,
                animateSizing: false,
                minHeight: 200,
                minWidth: 200,
                targetContainer: this.containerNode,
                onResize: function(e) {
                    self.manualSized = true;
                    var size = domGeometry.position(self.containerNode);
                    util.setCookie("savedScriptWidth", size.w.toString());
                    util.setCookie("savedScriptHeight", size.h.toString());
                    var editorHeight = size.h - (self.script?70:35) - 35;
                    domStyle.set(self.editorAttach, "height", editorHeight + "px");
                    domStyle.set(self.editorDiv, "height", editorHeight + "px");
                    self.editor.editor.resize();
                    self._position();
                }
            }).placeAt(this.containerContainer);
            this._size = function() {
                if (!self.manualSized) {
                    var dim = win.getBox();
                    var editorHeight = Math.min(util.getCookie("savedScriptHeight")||550, dim.h - (self.script?200:150));
                    var editorWidth = Math.min(util.getCookie("savedScriptWidth")||1200, dim.w - 150);
                    domStyle.set(self.editorAttach, "height", editorHeight + "px");
                    domStyle.set(self.editorDiv, "height", editorHeight + "px");
                    domStyle.set(self.containerNode, {
                        width: editorWidth + "px",
                        height: editorHeight + (self.script?70:35) + "px",
                        overflow: "hidden",
                        position: "inherit"
                    });
                    self._position();
                }
            };

            // set initial focus
            setTimeout(function(){
                self.focusWidget.focus();
            },250);

            aspect.around(this, "hide", function(originalMethod) {
                return function() {
                    var self = this;
                    if (this.isDirty) {
                        var dialog = new Dialog();
                        dialog.containerContainer.style.maxHeight = "1000px";
                        domConstruct.create("div", {
                            innerHTML: i18n("Save changes")
                        }, dialog.titleNode);
                        var buttonContainer = domConstruct.create("div", {
                            className: "underField"
                        }, dialog.containerNode);
                        var button1 = new Button({
                            label: i18n("Yes"),
                            "class" : "idxButtonSpecial",
                            onClick: function() {
                                dialog.destroy();
                                if (self.saveScript()) {
                                    originalMethod.apply(self, arguments);
                                }
                            }
                        });
                        button1.placeAt(buttonContainer);
                        var button2 = new Button({
                            label: i18n("No"),
                            onClick: function() {
                                dialog.destroy();
                                originalMethod.apply(self, arguments);
                            }
                        });
                        button2.placeAt(buttonContainer);
                        dialog.show();
                    } else {
                        originalMethod.apply(this, arguments);
                    }
                };
            });
        },

        addEditFields: function() {
            var name = "";
            var description = "";

            if (this.existingValues) {
                name = this.existingValues.name;
                description = this.existingValues.description;
            }

            var self = this;
            var fieldAttach = domConstruct.create("div", {
                style: {
                    minWidth: "1400px",
                    overflow: "hidden",
                    border: 0,
                    margin: "0 0 8px"
                 }
            }, this.containerNode);

             domConstruct.create("div", {
                 innerHTML: i18n("Name"),
                 style: {
                     display: "inline",
                     fontWeight: "bold"
                 }
            }, fieldAttach);
            this.nameTextBox = new TextBox({
                name: "name",
                value: name,
                disabled: !!this.readOnly,
                style: {
                    marginLeft: "6px",
                    width: "300px",
                    display: "inline-block"
                },
                intermediateChanges: true,
                onChange: function(value) {
                    self.refreshSaveButton();
                }
            });
            this.nameTextBox.placeAt(fieldAttach);
            if (!name) {
                this.focusWidget = this.nameTextBox.domNode;
            }

            domConstruct.create("div", {
                innerHTML: i18n("Description"),
                style: {
                    marginLeft: "34px",
                    display: "inline",
                    fontWeight: "bold"
                }
           }, fieldAttach);
           this.descTextBox = new TextBox({
               name: "name",
               value: description,
               disabled: !!this.readOnly,
               style: {
                   marginLeft: "6px",
                   width: "560px",
                   display: "inline-block"
               },
               intermediateChanges: true,
               onChange: function(value) {
                   self.refreshSaveButton();
               }
           });
           this.descTextBox.placeAt(fieldAttach);
        },

        addToolbarWidget: function() {
            var self = this;
            // Create the toolbar window.
            var toolWindowContent = domConstruct.create("div", {
                className: "toolbar-container",
                style: {
                    minWidth: "900px",
                    overflow: "hidden",
                    border: "1px solid lightGray",
                    marginBottom: "2px"
                 }
            }, this.containerNode);

            var spacer = document.createElement('div');
            spacer.setAttribute('class', 'toolbarSeparator graphToolbarIcon');

            // save
            var toolbar = new mxToolbar(toolWindowContent);
            this.saveButton = toolbar.addItem(i18n("Save"), null, function(){
                if (self.saveScript()) {
                    self.hide();
                }
            }, null, "mxToolbarItem graphToolbarButton");

            // -- undo/redo
            toolbar.container.appendChild(spacer.cloneNode(true));
            toolbar.addItem(i18n("Undo"), bootstrap.imageUrl + 'icons/blank18x18.png', function() {
                self.editor.editor.undo();
            }, null, "mxToolbarItem general-icon undo-icon graphToolbarIcon");
            toolbar.addItem(i18n("Redo"), bootstrap.imageUrl + 'icons/blank18x18.png', function() {
                self.editor.editor.redo();
            }, null, "mxToolbarItem general-icon redo-icon graphToolbarIcon");

            // cut/copy/paste
            var doc = !window.parent.document.getElementById("explore_iframe_id")?
                    document : window.parent.document;
            toolbar.container.appendChild(spacer.cloneNode(true));
            toolbar.addItem(i18n("Cut"), bootstrap.imageUrl + 'icons/blank18x18.png', function() {
                doc.innerClipboard = self.editor.editor.getCopyText();
                self.editor.editor.insert("");
            }, null, "mxToolbarItem general-icon copy-icon graphToolbarIcon");
            toolbar.addItem(i18n("Copy"), bootstrap.imageUrl + 'icons/blank18x18.png', function() {
                doc.innerClipboard = self.editor.editor.getCopyText();
            }, null, "mxToolbarItem general-icon cut-icon graphToolbarIcon");
            toolbar.addItem(i18n("Paste"), bootstrap.imageUrl + 'icons/blank18x18.png', function() {
               self.editor.editor.insert(doc.innerClipboard);
            }, null, "mxToolbarItem general-icon paste-icon graphToolbarIcon");

            // goto
            toolbar.container.appendChild(spacer.cloneNode(true));
            var gotoDiv = domConstruct.create("div", {
                "class": "toolbar-button",
                style: {
                    color: "#2e2d2d",
                    display: "inline",
                    lineHeight: "30px"
                 }
            });
            var textbox = new NumberTextBox({
                name: "goto",
                intermediateChanges: true,
                style: {
                    width: "50px",
                    marginTop: "2px"
                },
                onChange: function (num) {
                    if (self.typingTimeout) {
                        clearTimeout(self.typingTimeout);
                    }
                    self.typingTimeout = setTimeout(function() {
                        if (!isNaN(num)) {
                            self.editor.editor.gotoLine(num, 0, true);
                        }
                    }, 250);
                }
            });
            var lbl = domConstruct.create("label", {
                "for": textbox.id,
                "innerHTML": i18n("Go to line"),
                style: {
                    marginRight: "6px",
                    verticalAlign: "middle",
                    font: "12px arial"
                }
            });
            domConstruct.place(lbl, gotoDiv);
            textbox.placeAt(gotoDiv);
            toolbar.container.appendChild(gotoDiv);

            // find/replace
            toolbar.container.appendChild(spacer.cloneNode(true));
            toolbar.addItem(i18n("Find"), bootstrap.imageUrl + 'icons/blank18x18.png', function() {
                self.editor.editor.execCommand("find");
            }, null, "mxToolbarItem general-icon find-icon graphToolbarIcon");
            toolbar.addItem(i18n("Replace"), bootstrap.imageUrl + 'icons/blank18x18.png', function() {
                self.editor.editor.execCommand("replace");
            }, null, "mxToolbarItem general-icon replace-icon graphToolbarIcon");

            // toggle comment
            if (this.language!=="text") {
                toolbar.container.appendChild(spacer.cloneNode(true));
                var btn = toolbar.addItem((this.language==="javascript"||this.language==="groovy"?"//":"#"), null, function() {
                    self.editor.editor.execCommand("togglecomment");
                }, null, "mxToolbarItem graphToolbarButton reversed");
                btn.setAttribute("title", i18n("Toggle Comment"));
                toolbar.container.appendChild(spacer.cloneNode(true));
            }

        },

        saveScript: function() {
            var self = this;
            var ret = true;
            var val = this.editor.getValue();
            this.isDirty = false;
            if (this.script) {
                if (!this.nameTextBox.get("value")) {
                    this.showValidationError();
                    this.isDirty = true;
                    ret = false;
                } else {
                    var data = {
                            name: this.nameTextBox.get("value"),
                            description: this.descTextBox.get("value"),
                            body: val
                    };
                    if (this.script && this.script.id) {
                        data.id = this.script.id;
                    }
                    data = JSON.stringify(data);
                    var header = {};
                    header["Content-Type"] = "application/json";
                    var pathArray = window.location.href.split('/');
                    var url = pathArray[0] + '//' + pathArray[2] + bootstrap.restUrl+"script/postprocessing";
                    var ioArgs = {
                            "url": url,
                            "handleAs": "json",
                            "putData": data,
                            "headers": header,
                            "load": function(data, ioArgs) {
                                if (self.callback) {
                                    self.callback(data);
                                }
                                self.hide();
                            },
                            "error": function(data) {
                                alert(data.responseText);
                            }
                    };
                    baseXhr.put(ioArgs);
                }
            } else {
                this.widget.setValue(val);
                if (val.length<100) {
                    domClass.add(this.widget.domNode, "empty");
                } else {
                    domClass.remove(this.widget.domNode, "empty");
                }
            }
            return ret;
        },

        addEditorWidget: function() {
            var self = this;
            this.editorAttach = domConstruct.create("div", {
                style: {
                    width: "100%",
                    border: "1pt solid lightGray"
                }
            }, this.containerNode);

            this.editor = new Editor();
            this.editor.placeAt(this.editorAttach);
            this.editor.startup();
            this.editor.setLanguage(this.language);
            this.editor.setValue(this.value);
            this.editor.editor.setReadOnly(!!this.readOnly);
            this.session = this.editor.editor.getSession();
            this.session.setUseWrapMode(true);
            setTimeout(function(){
                self.session.getUndoManager().reset();
            });
            this.session.on("change", function(){
                setTimeout(function(){
                    self.refreshSaveButton();
                });
            });
            if (!this.focusWidget) {
                this.focusWidget = this.editor.editor;
            }
        },

        showValidationError: function() {
            new Alert({
                messages: [i18n("Name is required")]
            }).startup();
        },

        refreshSaveButton: function() {
            this.isDirty = false;
            if (this.session.getUndoManager().hasUndo() || (this.nameTextBox && this.nameTextBox.get("value")!==(this.script.name||""))
                    || (this.descTextBox && this.descTextBox.get("value")!==(this.script.description||""))) {
                domClass.add(this.saveButton, "enabled");
                this.isDirty = true;
            } else {
                domClass.remove(this.saveButton, "enabled");
            }
        }


    });
});

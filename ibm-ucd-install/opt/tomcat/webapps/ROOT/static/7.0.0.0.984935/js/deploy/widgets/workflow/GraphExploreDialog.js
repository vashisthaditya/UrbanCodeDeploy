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
        "dojo/dom-attr",
        "dojo/date/locale",
        "dojo/aspect",
        "dojo/on",
        "dojo/has",
        "dojo/query",
        "dojo/_base/event",
        "dojo/_base/lang",
        "dojo/window",
        "dijit/form/Button",
        "dijit/form/Textarea",
        "idx/widget/ResizeHandle",
        "js/webext/widgets/TabManager",
        "js/webext/widgets/Dialog"],

function(declare,
        domConstruct,
        domStyle,
        domClass,
        domGeometry,
        domAttr,
        dateLocale,
        aspect,
        on,
        has,
        query,
        event,
        lang,
        win,
        Button,
        Textarea,
        ResizeHandle,
        TabManager,
        Dialog) {
    return declare('deploy.widgets.workflow.GraphExploreDialog', [Dialog], {

        postCreate: function() {
            this.inherited(arguments);

            // create dialog
            var self = this;
            domStyle.set(this.containerContainer, {
                maxHeight: "1000px"
            });

            // title
            domStyle.set(this.titleBar, {
                padding: "15px 0"
            });
            domConstruct.create("div", {
                innerHTML: i18n("Explore"),
                style: {
                    display: "inline-block"
                }
            }, this.titleNode);

            this.addTabManagerWidget();

            this.resizeWidget = new ResizeHandle({
                activeResize: false,
                animateSizing: false,
                minHeight: 200,
                minWidth: 200,
                targetContainer: this.containerNode,
                onResize: function(e) {
                    var pos = domGeometry.position(self.containerNode);
                    util.setCookie("savedExplorerWidth", pos.w.toString());
                    util.setCookie("savedExplorerHeight", pos.h.toString());
                    self.oposition();
                }
            }).placeAt(this.containerContainer);

            // set container node size
            this.sized = false;
            this.positioned = false;
            this._size = function() {
                if (!self.sized) {
                    self.sized = true;
                    var dim = win.getBox();
                    var width = Math.min(util.getCookie("savedExplorerWidth")||1000, dim.w - 150);
                    var height = Math.min(util.getCookie("savedExplorerHeight")||700, dim.h - 150);
                    domStyle.set(self.containerNode, {
                        width: width + "px",
                        height: height + 20 + "px",
                        overflow: "hidden",
                        position: "inherit"
                    });
                    if (util.getCookie("savedExplorerLeft") && util.getCookie("savedExplorerWidth")) {
                        domStyle.set(self.domNode, {
                            "left": util.getCookie("savedExplorerLeft") + "px",
                            "top": util.getCookie("savedExplorerTop") + "px"
                        });
                        self.positioned = true;
                    }
                }
            };
            this.oposition = this._position;
            this._position = function() {
                if (!self.positioned) {
                    self.positioned = true;
                    self.oposition();
                }
            };

            aspect.around(this, "hide", function(originalMethod) {
                return function() {
                    var self = this;
                    // warn user that process editor changes are not saved
                    var hasChanges = false;
                    try {
                        hasChanges = this.iframe.contentWindow.document.hasChanges;
                    } catch(e){
                    }
                    if (hasChanges && !this._destroying) {
                        var dialog = new Dialog();
                        dialog.containerContainer.style.maxHeight = "1000px";
                        domConstruct.create("div", {
                            innerHTML: i18n("Unsaved changes")
                        }, dialog.titleNode);
                        var msg = new Textarea({
                            value: i18n("Close without saving changes?"),
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
                            onClick: function() {
                                originalMethod.apply(self, arguments);
                                self.editor.refreshStepPalette();
                                dialog.destroy();
                            }
                        });
                        button1.placeAt(buttonContainer);
                        var button2 = new Button({
                            "class" : "idxButtonSpecial",
                            label: i18n("No"),
                            onClick: function() {
                                dialog.destroy();
                            }
                        });
                        button2.placeAt(buttonContainer);
                        dialog.show();
                    } else {
                        util.setCookie("savedExplorerLeft", domStyle.get(self.domNode, "left").toString());
                        util.setCookie("savedExplorerTop", domStyle.get(self.domNode, "top").toString());
                        originalMethod.apply(this, arguments);
                        this.editor.refreshStepPalette();
                    }
                };
            });

        },

        addTabManagerWidget: function() {
            var self = this;
            this.tabAttach = domConstruct.create("div", {
                style: {
                    width: "100%",
                    height: "100%",
                    border: "1pt solid lightGray"
                }
            }, this.containerNode);
            var spinner = domConstruct.create("div", {
                "class": "loading-spinner",
                style: "position: absolute; left:50%; top: 50%;"
            }, this.tabAttach);

            var pathArray = window.location.href.split('/');
            var src = pathArray[0] + '//' + pathArray[2] + '/index.jsp' + (this.editor.exploreUrl||"");
            this.iframe = domConstruct.create("iframe", {
                src: src,
                style: "border: 0; width: 100%; height: 100%; overflow: hidden;",
                id: 'explore_iframe_id',
                onload: function() {
                    domClass.add(self.iframe.contentWindow.document.body, "explorer-view");
                    domClass.add(spinner, "hidden");
               },
               onerror: function(e) {
               }
            });
            // prevent explore dialog from writing to this process
            domAttr.set(this.iframe, "data-process-id", this.editor.processId);
            this.tabAttach.appendChild(this.iframe);
        }

    });
});

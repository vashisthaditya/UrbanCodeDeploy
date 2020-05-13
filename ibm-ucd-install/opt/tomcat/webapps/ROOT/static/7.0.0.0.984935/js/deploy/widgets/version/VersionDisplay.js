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
define([
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dojo/on",
        "dojo/json",
        "dojo/mouse",
        "dojo/_base/declare",
        "dojo/_base/Color",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/dom-style",
        "js/webext/widgets/Alert",
        "js/webext/widgets/GenericConfirm"
        ],
function(
    _TemplatedMixin,
    _Widget,
    on,
    JSON,
    mouse,
    declare,
    Color,
    domConstruct,
    domClass,
    domStyle,
    Alert,
    GenericConfirm
) {
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="tagDisplay" data-dojo-attach-point="versionDiv">'+
                '<div class="tagContainer tagBox" data-dojo-attach-point="versionAttach"></div>'+
            '</div>',

            draggable: true,

            postCreate: function() {
                var self = this;
                self.inherited(arguments);

                if (self.draggable) {
                    domClass.add(self.versionDiv, "dojoDndItem");
                }

                var inHTML = "";
                if (self.version instanceof String || typeof self.version === "string") {
                    inHTML = self.version.escape();
                } 
                else {
                    inHTML = self.version.name.escape();
                }
                
                var tname = domConstruct.create("div", {
                    "innerHTML": inHTML
                });
                domClass.add(tname, "tagName");
                domConstruct.place(tname, self.versionAttach);

                if (!self.readOnly) {
                    var deleteDiv = domConstruct.create("div", {
                        "title": i18n("Delete"),
                        "innerHTML": "x"
                    });
                    domClass.add(deleteDiv, "inlineBlock");
                    domClass.add(deleteDiv, "tagDelete");
                    
                    on(deleteDiv, "click", function() {
                        self.onDelete();
                    });
                    
                    on(deleteDiv, mouse.enter, function(event) {
                        domClass.add(deleteDiv, "tagSelector");
                    });
                    on(deleteDiv, mouse.leave, function(event) {
                        domClass.remove(deleteDiv, "tagSelector");
                    });

                    domConstruct.place(deleteDiv, self.versionAttach);
                }
            },

            onDelete: function(div) {
                var self = this;
                self.destroy();
            }
    });
});
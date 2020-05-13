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
/**
 *
 **/
define([
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dojo/_base/array",
        "dojo/on",
        "dojo/json",
        "dojo/mouse",
        "dojo/_base/declare",
        "dojo/_base/Color",
        "dojo/_base/xhr",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/dom-style",
        "js/webext/widgets/Alert",
        "js/webext/widgets/GenericConfirm"
        ],
function(
    _TemplatedMixin,
    _Widget,
    array,
    on,
    JSON,
    mouse,
    declare,
    Color,
    xhr,
    domConstruct,
    domClass,
    domStyle,
    Alert,
    GenericConfirm
) {
    /**
     *
     */
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="tagDisplay">'+
                '<div class="tagContainer" data-dojo-attach-point="tagAttach"></div>'+
            '</div>',

            /**
             *
             */
            postCreate: function() {
                this.inherited(arguments);
                var self = this;

                dojo.forEach(self.tags, function(tag) {
                    var dark = self._isDark(tag.color);
                    var tagDiv = domConstruct.create("div", {
                        className: "inlineBlock tagBox",
                        "style": { "backgroundColor": tag.color},
                        "title": tag.description || ""
                    });

                    if (dark) {
                        domClass.add(tagDiv, "darkColor");
                    }

                    var tname = domConstruct.create("div", {
                        "innerHTML": tag.name.escape()
                    });
                    domClass.add(tname, "tagName");
                    domConstruct.place(tname, tagDiv);

                    var isDisabled = self._checkDisabled(tag);

                    if (!self.readOnly && !isDisabled) {
                        var deleteDiv = domConstruct.create("div", {
                            className: "inlineBlock tagDelete",
                            "title": i18n("Delete"),
                            "innerHTML": "x"
                        });

                        on(deleteDiv, "click", function(event) {
                            self.confirmDelete(tag, tagDiv);
                        });

                        on(deleteDiv, mouse.enter, function(event) {
                            domClass.add(deleteDiv, "tagSelector");
                        });
                        on(deleteDiv, mouse.leave, function(event) {
                            domClass.remove(deleteDiv, "tagSelector");
                        });

                        domConstruct.place(deleteDiv, tagDiv);
                    }

                    domConstruct.place(tagDiv, self.tagAttach);
                });
            },

            /**
             * Show a pop-up to confirm whether the user wants to delete an  or not.
             */
            confirmDelete: function(target, tag) {
                var self = this;
                var confirm = new GenericConfirm({
                    message: i18n("Are you sure you want to remove %s?", target.name),
                    action: function() {
                        xhr.del({
                            url: bootstrap.restUrl+"tag/"+self.objectType+"/"+target.id,
                            sync: true,
                            // We have to format the json before sending
                            putData: JSON.stringify({ids: [self.itemId]}),
                            handleAs: "json",
                            headers: { "Content-Type": "application/json" },
                            load: function(results) {
                                domConstruct.destroy(tag);
                            },
                            error: function(response) {
                                var dndAlert = new Alert({
                                    message: util.escape(response.responseText)
                                });
                            }
                        });
                        if (self.callback) {
                            self.callback();
                        }
                    }
                });
            },

            /**
             * Checks if the given tag's name is in the list of disabled tags' names
             */
            _checkDisabled: function(tag) {
                var result = -1,
                    self = this;

                if (self.disabledTags) {
                    // check if this tag is in the list of disabledTags
                    result = array.indexOf(
                        self.disabledTags.map(function(item) { return item.id; }),
                        tag.id);
                }
                return result !== -1;
            },

            /**
             * Determines if a color is considered a "dark" color.
             * Used to decide whether to use light or dark colored text.
             * Note: Grabbed from uRelease
             */
            _isDark: function(color) {
                var rgbColor = new Color(color).toRgb();
                var colorWeight = 1 - (0.25 * rgbColor[0] + 0.6 * rgbColor[1] + 0.1 * rgbColor[2]) / 255;
                return colorWeight > 0.5;
            },

            /**
             * Returns a lighter tint of a given color.
             */
            getTint : function(color) {
                var rgbColor = new Color(color).toRgb();
                var tint = [];
                array.forEach(rgbColor, function(hue){
                    tint.push(1.6 * hue);
                });
                return Color.fromArray(tint).toHex();
            },

            /**
             * Returns a darker shade of a given color.
             */
            getShade : function(color) {
                var rgbColor = new Color(color).toRgb();
                var tint = [];
                array.forEach(rgbColor, function(hue){
                    tint.push(0.6 * hue);
                });
                return Color.fromArray(tint).toHex();
            }

    });
});
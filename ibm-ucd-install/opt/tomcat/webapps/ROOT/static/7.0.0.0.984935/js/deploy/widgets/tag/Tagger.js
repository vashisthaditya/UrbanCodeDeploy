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
 * This is a all-in-one widget for displaying tags and the tag icon
 * Co
 **/
define([
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/dom",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/dom-style",
        "dojo/on",
        "dojo/mouse",
        "dojo/aspect",
        "dijit/form/FilteringSelect",
        "deploy/widgets/Formatters",
        "deploy/widgets/tag/TagSelector",
        "deploy/widgets/tag/TagRemover",
        "deploy/widgets/tag/TagDisplay",
        "deploy/widgets/tag/TagSelect",
        "js/webext/widgets/Alert",
        "js/webext/widgets/Dialog"
        ],
function(
    _TemplatedMixin,
    _Widget,
    declare,
    xhr,
    dom,
    domConstruct,
    domClass,
    domStyle,
    on,
    mouse,
    aspect,
    FilteringSelect,
    Formatters,
    TagSelector,
    TagRemover,
    TagDisplay,
    TagSelect,
    Alert,
    Dialog
) {
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="inlineBlock">'+
                '<div data-dojo-attach-point="tagAttach" class="inlineBlock" ></div>'+
                '<div class="inlineBlock">'+
                    '<div data-dojo-attach-point="iconAttach" class="inlineBlock" ></div>'+
                '</div>'+
            '</div>',

        allowTagAdd : true,
        /**
         * This is used to display tags and the "Add Tag" icon
         *
         * Probably doesn't work to well with bulk operations
         *
         * {
         *  objectType: "taggableObjectType",
         *  item: {taggable} or [taggables]
         *  icon: [optional]
         *  callback: [optional]
         * }
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            if (!self.icon) {
                self.icon = Formatters.createIcon("tagIcon", i18n("Add Tag"), "glyph");
            }

            self._displayTags(self.item.tags);
            if (self.allowTagAdd && self.item.security['Edit Basic Settings']) {
                self._displayTagIcon();
            }
        },

        /**
         * pass a list of items to tag
         */
        showAddTagDialog: function(items) {
            var self = this;

            var tagDialog = new Dialog({
                title: i18n("Add New Tag"),
                closable: true,
                draggable: true
            });

            var tagForm = new TagSelector({
                item: items,
                objectType: self.objectType,
                callback: function() {
                    tagDialog.hide();
                    tagDialog.destroy();
                    if (self.callback) {
                        self.callback();
                    }
                }
            });
            tagForm.placeAt(tagDialog.containerNode);
            tagDialog.show();
        },

        /**
         * pass a list of taggable items ids
         */
        showRemoveTagDialog: function(items) {
            var self = this;

            var removeTagDialog = new Dialog({
                title: i18n("Remove Tag"),
                closable: true,
                draggable:true
            });

            var newTagForm = new TagRemover({
                ids: items,
                objectType: self.objectType,
                callback: function() {
                    removeTagDialog.hide();
                    removeTagDialog.destroy();
                    if (self.callback) {
                        self.callback();
                    }
                }
            });

            newTagForm.placeAt(removeTagDialog.containerNode);
            removeTagDialog.show();
        },

        resolve: function(type) {
            if (type === "ComponentTemplate") {
                return "Component";
            }
            return type;
        },

        showAddExistingTagSelect: function(items) {
            var _this = this;
            if (!items.length) {
                if (items.id) {
                    var tmp = items.id;
                    items = [];
                    items.push(tmp);
                }
            }

            if (this.tagSelect) {
                this.tagSelect.destroy();
            }
            this.tagSelect = new TagSelect({
                items: items,
                objectType: _this.resolve(_this.objectType)
            });
            this.tagSelect.placeAt(this.tagLink, "before");
            on(this.tagSelect.tagSelector, "change", function(value) {
                if (value) {
                    var tagItem = _this.tagSelect.tagSelector.get('item');
                    _this.addTag(value, items);
                    _this.tagSelect.destroy();
                }
            });
            on(this.tagSelect.newTag, "click", function() {
                if(_this.tagSelect) {
                    _this.tagSelect.destroy();
                }
                _this.showAddTagDialog(items);
            });
            on(this.tagSelect, "click", function() {
                if (_this.tagSelect && !_this.tagSelect.tagSelector.focused) {
                    _this.tagSelect.destroy();
                }
            });
            on(this.tagSelect.tagAttach, mouse.leave, function() {
                if (_this.tagSelect && !_this.tagSelect.tagSelector.focused) {
                    _this.tagSelect.destroy();
                }
            });
            on(this.tagSelect, "blur", function() {
                if(_this.tagSelect) {
                    _this.tagSelect.destroy();
                }
            });

            aspect.after(this.tagSelect, "destroy", function() {
                domClass.add(_this.tagLink, "tagSelector tagIconSizer");
            });
        },

        addTag: function(value, items) {
            var self = this;

            var data = {
                    ids: items
            };

            data.name = value;
            xhr.put({
                url: bootstrap.restUrl+"tag/"+self.objectType,
                sync: true,
                putData: JSON.stringify(data),
                handleAs: "json",
                headers: { "Content-Type": "application/json" },
                load: function(data) {
                    self.tagSelect.destroy();
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                error: function(response) {
                    var dndAlert = new Alert({
                        message: util.escape(response.responseText)
                    });
                }
            });
        },

        /**
         * display the given tags
         */
        _displayTags: function(tags) {
            var self = this;
            var tagsContainer = new TagDisplay({
                readOnly: !self.allowTagAdd || !self.item.security['Edit Basic Settings'],
                itemId: self.item.id,
                objectType: self.objectType,
                tags: self.item.tags,
                disabledTags: self.item.disabledTags,
                callback: function() {
                    if (self.callback) {
                        self.callback();
                    }
                }
            });
            tagsContainer.placeAt(self.tagAttach);
        },

        /**
         * display the tag icon and register a function when you click it
         */
        _displayTagIcon: function() {
            var self = this;
            this.tagLink = self.icon;
            domClass.add(self.tagLink, "tagSelector tagIconSizer");
            domClass.remove(self.tagLink, "inlineBlock");
            domConstruct.place(self.tagLink, this.iconAttach);

            on(this.tagLink, "click", function() {
                domClass.remove(self.tagLink, "tagSelector tagIconSizer");
                self.showAddExistingTagSelect(self.item);
            });

        }

    });
});

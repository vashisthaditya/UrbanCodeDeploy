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
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dojo/dom-construct",
        "dojo/dom-style",
        "dojo/_base/declare",
        "js/webext/widgets/FormDelegates"
        ],
function(
    _TemplatedMixin,
    _Widget,
    domConstruct,
    domStyle,
    declare,
    FormDelegates
) {
    return declare('deploy.widgets.tag.TagSelect', [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="tagSelect" data-dojo-attach-point="tagAttach">' +
                '<div data-dojo-attach-point="tagSelectAttach" class="inlineBlock tag-select-drop-down"></div>' +
                '<div data-dojo-attach-point="newTagAttach" class="inlineBlock new-tag-link"></div>' +
            '</div>',

        /**
         * This is used to display the add tag selector and button to make a new tag
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            this.tagSelector = new FormDelegates().getDelegate("TagDropDown") ({
                idProperty: "name",
                searchAttr: "name",
                selectOnClick: true,
                objectType: self.objectType
            });

            this.tagSelector.placeAt(this.tagSelectAttach);

            this.newTag = domConstruct.create("a", {
                innerHTML: i18n("Create Tag"),
                "class": "inlineBlock linkPointer"
            }, this.newTagAttach);
        }
    });
});
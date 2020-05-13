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
/*global define */
define([
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/dom-class",
        "dojo/on",
        "dijit/_TemplatedMixin",
        "dijit/_WidgetBase",
        "dojox/html/entities"
        ],
function(
        declare,
        lang,
        domClass,
        on,
        _TemplatedMixin,
        _WidgetBase,
        entities
) {

    /**
     * A widget which wraps something else inside an expand/collapse pop-down arrow.
     *
     * Takes parameters:
     *  label           The text to add to the header as plain text
     *  labelHTML       HTML to add to the header (can not be used with label)
     *  collapsed       Whether the content will initially be collapsed. Default: true
     *
     * Add content to the PopDown by adding to its domAttach:
     *      (popDown.domAttach.appendChild(...) or widget.placeAt(popDown.domAttach))
     */
    return declare(
        [_WidgetBase, _TemplatedMixin],
        {
            templateString:
                '<div class="popDown popDownCollapsed">'+
                '    <div data-dojo-attach-point="headerAttach" class="popDownHeader"></div>'+
                '    <div data-dojo-attach-point="domAttach" class="popDownContent"></div>'+
                '</div>',

            headerAttach: null,
            domAttach: null,

            collapsed: true,
            label:     "",
            labelHTML: "",

            /**
             *
             */
            postCreate: function() {
                var self = this;
                self.inherited(arguments);

                if (self.label) {
                    self.headerAttach.innerHTML = entities.encode(self.label);
                }
                else if (self.labelHTML) {
                    self.headerAttach.innerHTML = self.innerHTML;
                }

                // init dom state
                //dojo.toggleClass(self.domNode, "popDownCollapsed", self.collapsed);

                // set up event listener
                on(self.headerAttach, 'click', lang.hitch(self, self.toggle));
            },

            /**
             *
             */
            collapse: function() {
                this.set("collapsed", true);
            },

            /**
             *
             */
            expand: function() {
                this.set("collapsed", false);
            },

            /**
             * Toggle the collapsed state
             */
            toggle: function() {
                this.set("collapsed", !this.get("collapsed"));
            },

            /**
             * Implementation of widget.set("collapsed", <boolean>);
             */
            _setCollapsedAttr: function(collapsed) {
                var self = this;
                self.collapsed = !!collapsed;
                domClass.toggle(self.domNode, "popDownCollapsed", self.collapsed);
            }
        }
    );
});

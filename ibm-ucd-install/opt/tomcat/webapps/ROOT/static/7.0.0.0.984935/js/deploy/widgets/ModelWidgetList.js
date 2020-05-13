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
        "dijit/_Container",
        "dojo/_base/declare"
        ],
function(
    _TemplatedMixin,
    _Widget,
    _Container,
    declare
) {
    /**
     * A widget for the model-bound display of child widgets.
     *
     * Implementation note: Though we're using a model to help keep track of the list of widgets, the
     * source of truth actually stems from the Widgets themselves.
     */
    return declare([_Widget, _TemplatedMixin, _Container], {
        templateString:
            '<div class="modelWidgetList">' +
                '<div data-dojo-attach-point="containerNode"></div>' +
            '</div>',

        /**
         * Initializes the data model around a list of tag requirements and
         * attaches observers.
         */
        postCreate: function() {
            var self = this;
            this.inherited(arguments);

            this._mappings = {};

            if (! this.query)  {
                this.query = {};
            }

            var modelQueryResult = this.model.query(this.query);

            // When the model shows a change, add / remove the relevant widget
            modelQueryResult.observe(function(widgetModel, removedFromIndex, insertedAtIndex) {
                if (removedFromIndex !== -1) {
                    var modelId = self.model.getIdentity(widgetModel);
                    self.removeChild(removedFromIndex);
                    delete self._mappings[modelId];
                } else if (insertedAtIndex !== -1) {
                    self.displayWidget(widgetModel, insertedAtIndex);
                }
            });

            // Add the initial set of widgets
            modelQueryResult.forEach(this.displayWidget, this);
        },

        displayWidget: function(widgetModel, insertedAtIndex) {
            var widget = this.widgetFactory(widgetModel);
            this.addChild(widget, insertedAtIndex);

            var modelId = this.model.getIdentity(widgetModel);
            this._mappings[modelId] = widget;
        },

        getWidgetForModel: function(widgetModel) {
            var modelId = this.model.getIdentity(widgetModel);
            return this._mappings[modelId];
        }
    });
});
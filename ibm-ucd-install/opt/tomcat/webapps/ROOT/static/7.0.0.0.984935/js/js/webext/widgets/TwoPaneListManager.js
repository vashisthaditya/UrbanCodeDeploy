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
        "dojo/_base/array",
        'dojo/dom-class',
        "dojo/dom-construct",
        "dijit/_TemplatedMixin",
        "dijit/_WidgetBase",
        "dojo/dom-geometry"
        ],
function(
        declare,
        array,
        domClass,
        domConstruct,
        _TemplatedMixin,
        _WidgetBase,
        domGeom
) {

    /**
     * overrideListWidth        The width of the list to set, overriding the default (e.g. 90)
     * defaultSelectionId       The ID of the entry to be selected by default.
     */
    return declare(
        [_WidgetBase, _TemplatedMixin],
        {
            templateString:
                '<div class="twoPaneManager twoPaneListManager">'+
                    '<div class="twoPaneContainer">'+
                      '<div class="twoPaneList" data-dojo-attach-point="listAttach"></div>'+
                      '<div class="twoPaneDetail" data-dojo-attach-point="detailContainerAttach">'+
                        '<div class="twoPaneDetailTopBorder"></div>'+
                        '<div class="twoPaneDetailPadding">'+
                          '<div data-dojo-attach-point="detailAttach"></div>'+
                        '</div>'+
                      '<div style="clear: both;"></div>'+
                    '</div>'+
                '</div>',

            entries: [],
            detailWidgets: [],
            overrideListWidth: undefined,

            /**
             *
             */
            postCreate: function() {
                this.inherited(arguments);

                if (this.overrideListWidth) {
                    if (domGeom.isBodyLtr()){
                        this.detailContainerAttach.style.marginLeft = this.overrideListWidth;
                    }
                    else{
                        this.detailContainerAttach.style.marginRight = this.overrideListWidth;
                    }
                    this.listAttach.style.width = this.overrideListWidth;
                }
                
                this.entries = [];
                this.detailWidgets = [];
            },

            /**
             * Takes the following arguments in properties:
             *  id      Optional. ID for this entry to be used in programmatically selecting entries.
             *  label   \
             *  domNode - Mutually exclusive. The text/dom/widget to place as the label.
             *  widget  /
             *  action  Function to execute when this item is selected.
             */
            addEntry: function(properties) {
                var self = this;

                var entryDiv = domConstruct.create("div");
                entryDiv.className = "twoPaneEntry";

                if (properties.label) {
                    entryDiv.innerHTML = properties.label;
                }
                else if (properties.domNode) {
                    entryDiv.appendChild(properties.domNode);
                }
                else if (properties.widget) {
                    properties.widget.placeAt(entryDiv);
                }

                entryDiv.onclick = function() {
                    self.selectEntryByDiv(entryDiv);
                };

                var arrow = domConstruct.create("div", {
                    "class": "twoPaneArrow"
                }, entryDiv);

                var entry = {
                    div: entryDiv,
                    action: properties.action,
                    id: properties.id
                };

                this.listAttach.appendChild(entryDiv);
                this.entries.push(entry);

                if ((this.entries.length === 1 && this.defaultSelectionId === undefined) ||
                 (entry.id && this.defaultSelectionId === entry.id)) {
                    this.selectEntryByDiv(entryDiv);
                }
            },

            /**
             *
             */
            selectEntryByDiv: function(div) {
                var self = this;

                array.forEach(this.entries, function(entry) {
                    if (entry.div === div) {
                        self._selectEntry(entry);
                    }
                });
            },

            /**
             *
             */
            selectEntryById: function(id) {
                var self = this;

                array.forEach(this.entries, function(entry) {
                    if (entry.id === id) {
                        self._selectEntry(entry);
                    }
                });
            },
            
            /**
             * 
             */
            clearSelection: function() {
                this.clearDetail();

                if (this.selectedEntry) {
                    domClass.remove(this.selectedEntry.div, "twoPaneSelectedEntry");
                }
                this.selectedEntry = null;
            },

            /**
             *
             */
            _selectEntry: function(entry) {
                var self = this;

                if (self.selectedEntry !== entry) {
                    self.clearSelection();

                    self.selectedEntry = entry;

                    domClass.add(entry.div, "twoPaneSelectedEntry");

                    if (entry.action !== undefined) {
                        entry.action();
                    }
                }
            },

            /**
             *
             */
            registerDetailWidget: function(widget) {
                this.detailWidgets.push(widget);
            },

            /**
             *
             */
            clearDetail: function() {
                array.forEach(this.detailWidgets, function(widget) {
                    widget.destroy();
                });
                this.detailWidgets = [];

                domConstruct.empty(this.detailAttach);
            },

            /**
             *
             */
            clearList: function() {
                domConstruct.empty(this.listAttach);
                this.selectedEntry = undefined;
                this.entries = [];
            }
        }
    );
});
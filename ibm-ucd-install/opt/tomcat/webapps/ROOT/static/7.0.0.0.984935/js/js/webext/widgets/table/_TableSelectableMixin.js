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
        "dijit/form/CheckBox",
        "dijit/form/RadioButton"
        ],
function(
        declare,
        array,
        CheckBox,
        RadioButton
) {
    /**
     * This mixin provides functionality related to selecting rows in a table. See the "selectable"
     * option in TreeTable.
     * Supported properties:
     *      radioSelect             : If true, this will use radio buttons instead of checkboxes
     *
     * Fires events:
     *      "selectItem"            : Triggered when a row is selected. Event arguments: (item)
     *      "deselectItem"          : Triggered when a row is deselected. Event arguments: (item)
     *
     * Functions to be overridden:
     *      isSelectable(item)      : Determines whether a given row item can be selected or not.
     *                                If this returns false, it will not have a checkbox.
     *
     * setCheckboxState:            : Change the display state of the checkbox in the table header.
     *                                    true: checked.
     *                                    false: unchecked.
     */
    return declare(null,
        {
            // Last row selected, for shift+click bulk-selection
            lastSelectedRowObject: null,

            //-------------------------------------------------------------------------------
            // Functions to be overridden
            //-------------------------------------------------------------------------------
            /**
             * An event to fire when an item is selected
             */
            onSelectItem: function(item) {
                // no-op by default
            },

            /**
             * An event to fire when an item is deselected
             */
            onDeselectItem: function(item) {
                // no-op by default
            },

            /**
             * Determines whether a given row item can be selected or not. If this returns false,
             * it will not have a checkbox.
             */
            isSelectable: function(item) {
                return true;
            },



            //-------------------------------------------------------------------------------
            // Public functions
            //-------------------------------------------------------------------------------
            /**
             *
             */
            getSelectedItems: function() {
                var self = this;
                var result = [];

                array.forEach(self.selectedItems, function(selectedItem) {
                    var rowObject = self.rowObjects[selectedItem];
                    if (rowObject && rowObject.visible) {
                        result.push(rowObject.item);
                    }
                });

                return result;
            },

            /**
             * Select all rows matching the given array of data items
             */
            selectItems: function(items) {
                var self = this;

                array.forEach(items, function(item) {
                    var rowObject = self._getRowObjectForItem(item);

                    if (rowObject.parent) {
                        self._expandAllParents(rowObject.parent);
                    }

                    if (rowObject.selectCheckbox && rowObject.visible) {
                        rowObject.selectCheckbox.set("value", true);
                    }
                });
            },

            /**
             * Select all rows matching the given array of data items
             */
            deselectItems: function(items) {
                var self = this;

                array.forEach(items, function(item) {
                    var rowObject = self._getRowObjectForItem(item);

                    if (rowObject.parent) {
                        self._expandAllParents(rowObject.parent);
                    }

                    if (rowObject.selectCheckbox && rowObject.visible) {
                        rowObject.selectCheckbox.set("value", false);
                    }
                });
            },

            /**
             * Deselect all rows
             */
            deselectAll: function() {
                var self = this;

                array.forEach(self.rowObjectList, function(rowObject) {
                    if (rowObject.selectCheckbox) {
                        rowObject.selectCheckbox.set("value", false);
                    }
                });
            },



            //-------------------------------------------------------------------------------
            // Functions for internal usage only
            //-------------------------------------------------------------------------------
            /**
             *
             */
            initSelectableMixin: function() {
                var self = this;

                this.selectedItems = [];

                if (this.selectable) {
                    this.columns.unshift({
                        name: "",
                        width: "14px",
                        beforeExpander: true,
                        headingFormatter: function(cell) {
                            if (!self.radioSelect) {
                                self.selectAllCheckbox = new CheckBox();
                                self.selectAllCheckbox.on("change", function(value) {
                                    array.forEach(self.rowObjectList, function(rowObject) {
                                        if (rowObject.selectCheckbox &&
                                                (value === false || rowObject.visible)) {
                                            rowObject.selectCheckbox.set("value", value);
                                        }
                                    });
                                });

                                return self.selectAllCheckbox;
                            }
                        },
                        formatter: function(item, value, cell) {
                            var thisRowObject = self._getRowObjectForItem(item);

                            if (self.isSelectable(item)) {
                                var rowObject = self._getRowObjectForItem(item);

                                var checked = (self.selectedItems.indexOf(thisRowObject.id) !== -1);
                                var checkbox;
                                if (self.radioSelect) {
                                    checkbox = new RadioButton({
                                        name: "treeSelect",
                                        value: rowObject.id,
                                        checked: checked
                                    });
                                }
                                else {
                                    checkbox = new CheckBox({
                                        checked: checked
                                    });
                                }

                                checkbox.on("click", function(event) {
                                    if (checkbox.get("checked")) {
                                        if (event.shiftKey && self.lastSelectedRowObject) {
                                            var checking = false;
                                            array.forEach(self.rowObjectList, function(rowObject) {
                                                if (rowObject === thisRowObject
                                                        || rowObject === self.lastSelectedRowObject) {
                                                    checking = !checking;
                                                }

                                                // Only care about visible rows (child of an expanded
                                                // node, or top level)
                                                var isShowingRow = !rowObject.parent
                                                        || (rowObject.parent && rowObject.parent.expanded);
                                                if (checking && rowObject.visible && isShowingRow) {
                                                    self._setSelected(rowObject, true);
                                                }
                                            });
                                        }

                                        self.lastSelectedRowObject = thisRowObject;
                                    }
                                    else {
                                        self.lastSelectedRowObject = null;
                                    }
                                });
                                checkbox.on("change", function(value) {
                                    self._setSelected(thisRowObject, value);
                                });

                                rowObject.selectCheckbox = checkbox;

                                return checkbox;
                            }
                        }
                    });

                    // If this is a draggable table, we need to refresh the drag selection state
                    // on resetting the table.
                    if (self.draggable) {
                        this.on("displayTable", function() {
                            var itemsToRefresh = [];
                            array.forEach(self.selectedItems, function(selectedItem) {
                                var rowObject = self.rowObjects[selectedItem];
                                if (rowObject && rowObject.visible) {
                                    itemsToRefresh.push(selectedItem);
                                }
                            });
                            array.forEach(itemsToRefresh, function(selectedItem) {
                                var rowObject = self.rowObjects[selectedItem];
                                util.removeFromArray(self.selectedItems, selectedItem);
                                if (rowObject && rowObject.visible) {
                                    self._setSelected(rowObject, true);
                                }
                            });
                        });
                    }
                }
            },

            setCheckboxState: function(checked){
                if (this.selectAllCheckbox){
                    this.selectAllCheckbox.set("checked", checked);
                }
            },

            /**
             * Set the selected state of a data item. Also updates all children and its checkbox
             */
            _setSelected: function(rowObject, selected) {
                var self = this;

                if (selected) {
                    if (self.selectedItems.indexOf(rowObject.id) === -1) {
                        self.selectedItems.push(rowObject.id);

                        // Mark this row as selected for the purposes of dragging
                        if (this.draggable) {
                            self.dndContainer._addItemClass(rowObject.domNode, "Selected");
                            self.dndContainer.selection[rowObject.domNode.id] = 1;
                        }

                        self.onSelectItem(rowObject.item);
                    }
                }
                else {
                    util.removeFromArray(self.selectedItems, rowObject.id);

                    // Mark this row as deselected for the purposes of dragging
                    if (this.draggable) {
                        self.dndContainer._removeItemClass(rowObject.domNode, "Selected");
                        delete self.dndContainer.selection[rowObject.domNode.id];
                    }

                    self.onDeselectItem(rowObject.item);
                }

                if (rowObject.selectCheckbox) {
                    rowObject.selectCheckbox.set("value", selected);
                }
                
                if (self.cascadeSelectedState) {
                    array.forEach(self.getAllRowObjectDescendants(rowObject), function(descendant) {
                        self._setSelected(descendant, selected);
                    });
                }
            }
        }
    );
});

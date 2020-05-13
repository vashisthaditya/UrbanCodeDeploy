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
/*global define, i18n */
define([
        "dojo/_base/declare",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dijit/form/Button",
        "dijit/form/CheckBox",
        "dijit/form/TextBox",
        "js/util/blocker/_BlockerMixin",
        "js/webext/widgets/Dialog",
        "dojo/_base/array",
        "dojo/dom-class",
        "dojo/dom-geometry",
        "dojo/dom-construct",
        "dojo/_base/lang",
        "dojo/_base/xhr"
        ],
function(
        declare,
        _WidgetBase,
        _TemplatedMixin,
        Button,
        CheckBox,
        TextBox,
        _BlockerMixin,
        Dialog,
        array,
        domClass,
        domGeom,
        domConstruct,
        lang,
        baseXhr
) {
    /**
     * Supported properties:
     *  url / String                    The URL to use to get the data.
     *
     *  getLabel / Function             Given an item from the data, returns the label to show.
     *  getValue / Function             Given an item from the data, returns the value to use.
     *  value / String                  A list of values (comma-separated) to be selected on load.
     *  noSelectionsLabel / String      The label to show when the user has not selected any items.
     *
     * Supported events:
     *  close                           When the user closes the dialog to save the selected values
     *
     *  processData / Function          This method will need to return the data to be used.
     *                                  Defaults to returning the data passed in.
     */
    return declare(
        [_WidgetBase, _TemplatedMixin, _BlockerMixin],
        {
            templateString:
                '<span class="dialogMultiSelect">'+
                    '<div data-dojo-attach-point="fieldAttach"></div>'+
                '</span>',

            noSelectionsLabel: null,

            disabled: false,

            editButtonsDisplay: "",

            closeButtonDisplay: "",

            /**
             *
             */
            postCreate: function() {
                this.inherited(arguments);
                var self = this;

                this.selectedValues = [];
                this.set("value", this.value);

                this.fieldAttach.onclick = function() {
                    self.showSelectDialog(self.selectedValues);
                };

                this.fieldAttach.className = "dijitButtonNode";

                if (this.disabled) {
                    this.editButtonsDisplay = "none";
                }
                else {
                    this.closeButtonDisplay = "none";
                }
            },

            /**
             * Return the array of data objects representing the selected boxes
             */
            _getItemsAttr: function() {
                var self = this;
                var result = [];

                array.forEach(this.selectedValues, function(selectedValue) {
                    array.forEach(self.restData, function(restItem) {
                        if (self.getValue(restItem) === selectedValue) {
                            result.push(restItem);
                        }
                    });
                });

                return result;
            },

            _getValueAttr: function() {
                return this.selectedValues.join(",");
            },

            _setValueAttr: function(value) {
                this.selectedValues = [];
                if (value !== undefined && value.length > 0) {
                    this.selectedValues = value.split(",");
                }

                if (this.selectedValues.length === 0) {
                    this.fieldAttach.innerHTML = this.noSelectionsLabel || i18n("Any (None Selected)");
                }
                else {
                    this.fieldAttach.innerHTML = i18n("%s selected", this.selectedValues.length);
                }
            },

            updateCheckboxDisplay: function(visibleItems, button) {
                var selectedVisibleItems = [];

                array.forEach(visibleItems, function(item) {
                    if (item.checkbox.get('value')) {
                        selectedVisibleItems.push(item);
                    }
                });

                domClass.remove(button.domNode, 'partialSelect');

                if (visibleItems.length) {
                    if (visibleItems.length === selectedVisibleItems.length) {
                        button.set('label', i18n("Select None"));
                        button.set('action', 'none');
                    }
                    if (selectedVisibleItems.length === 0) {
                        button.set('label', i18n("Select All"));
                        button.set('action', 'all');
                    }
                    else if (visibleItems.length > selectedVisibleItems.length) {
                        button.set('label', i18n("Select the rest"));
                        button.set('action', 'all');
                        domClass.add(button.domNode, 'partialSelect');
                    }
                    button.set('value', button.get('action') === 'none');
                }
            },

            showSelectDialog: function(selections) {
                var self = this;

                var itemLines = [];
                var visibleItems = [];

                var tempSelectedValues = lang.clone(selections);

                var dialog = new Dialog({
                    title: "",
                    closable: true,
                    draggable: false,
                    width: 300
                });

                var dialogContainer = document.createElement("div");
                domClass.add(dialogContainer, "dialogMultiSelectDialog");

                var dialogHeader = document.createElement("div");
                dialogContainer.appendChild(dialogHeader);

                var boxContainerStyle = domGeom.isBodyLtr() ? {
                    marginRight: '10px'
                }:{
                    marginLeft: '10px'
                };
                var selectBoxContainer = domConstruct.create('div', {style: boxContainerStyle}, dialogHeader);
                domClass.add(selectBoxContainer, 'inlineBlock');

                var selectAllBox = new CheckBox({
                    label: "Select All",
                    action: "all",
                    onClick: function() {
                        if (this.action === "all") {
                            selectAllBox.set('label', i18n("Select None"));
                            array.forEach(visibleItems, function (item) {
                                item.checkbox.set('value', true);
                            });
                        }
                        else if (this.action === 'none') {
                            selectAllBox.set('label', i18n("Select All"));
                            array.forEach(visibleItems, function (item) {
                                item.checkbox.set('value', false);
                            });
                        }
                        self.updateCheckboxDisplay(visibleItems, selectAllBox);
                    },
                    disabled: self.disabled
                });
                if (!self.disabled) {
                    selectAllBox.placeAt(selectBoxContainer);
                }

                var originalFilter = i18n("Enter text to filter...");
                var filterText = new TextBox({
                    placeholder: originalFilter,
                    onKeyPress: function(event) {
                        if (event.charOrCode === 13) {
                            var filter = filterText.get("value").toLowerCase();
                            if (filter.length > 0) {
                                visibleItems = [];
                                array.forEach(itemLines, function(itemLine) {
                                    if (itemLine.label.toLowerCase().indexOf(filter) > -1) {
                                        domClass.remove(itemLine.domNode, "hidden");
                                        visibleItems.push(itemLine);
                                    }
                                    else {
                                        domClass.add(itemLine.domNode, "hidden");
                                        util.removeFromArray(visibleItems, itemLine);
                                    }
                                });

                                self.updateCheckboxDisplay(visibleItems, selectAllBox);
                            }
                        }
                    },
                    onFocus: function() {
                        if (filterText.get("value") === originalFilter) {
                            filterText.set("value", "");
                        }
                        filterText.textbox.select();
                    }
                });
                if (self.disabled) {
                    filterText.domNode.style.marginLeft ="20px";
                }
                filterText.placeAt(dialogHeader);

                var clearFilterButton = new Button({
                    label: i18n("Clear Filter"),
                    onClick: function() {
                        filterText.set("value", "");
                        self.filterTextSet = true;
                        array.forEach(itemLines, function(itemLine) {
                            domClass.remove(itemLine.domNode, "hidden");
                        });
                        visibleItems = itemLines;
                        self.updateCheckboxDisplay(visibleItems, selectAllBox);
                    }
                });
                clearFilterButton.domNode.style.display = self.editButtonsDisplay;
                clearFilterButton.placeAt(dialogHeader);

                var itemList = document.createElement("div");
                itemList.style.overflowY = "auto";
                itemList.style.maxHeight = "200px";
                if (domGeom.isBodyLtr()) {
                    itemList.style.paddingRight = "30px";
                }
                else {
                    itemList.style.paddingLeft = "30px";
                }

                dialogContainer.appendChild(itemList);

                var dialogFooter = document.createElement("div");
                dialogFooter.style.position = "relative";
                dialogContainer.appendChild(dialogFooter);

                var countLabel = document.createElement("div");
                countLabel.style.margin = "5px";
                if (domGeom.isBodyLtr()) {
                    countLabel.style.marginLeft = "26px";
                }
                else {
                    countLabel.style.marginRight = "26px";
                }
                countLabel.style.fontWeight = "bold";

                countLabel.innerHTML = i18n("%s selected", selections.length);
                dialogFooter.appendChild(countLabel);

                var clearSelection = new Button({
                    label: i18n("Clear Selection"),
                    onClick: function() {
                        array.forEach(itemLines, function (item) {
                            item.checkbox.set('value', false);
                        });
                        self.updateCheckboxDisplay(visibleItems, selectAllBox);
                    }
                });
                clearSelection.domNode.style.display = self.editButtonsDisplay;
                clearSelection.placeAt(dialogFooter);

                var saveButton = new Button({
                    label: i18n("OK"),
                    onClick: function() {
                        self.set("value", tempSelectedValues.join(","));

                        self.onClose();
                        dialog.hide();
                        dialog.destroy();
                    }
                });
                saveButton.domNode.style.display = self.editButtonsDisplay;
                saveButton.placeAt(dialogFooter);

                var resetButton = new Button({
                    label: i18n("Reset"),
                    onClick: function() {
                        dialog.hide();
                        dialog.destroy();

                        self.showSelectDialog([]);
                    }
                });
                resetButton.domNode.style.display = self.editButtonsDisplay;
                resetButton.placeAt(dialogFooter);

                var closeButton = new Button({
                    label: i18n("Close"),
                    onClick: function() {
                        dialog.hide();
                        dialog.destroy();
                    }
                });
                closeButton.domNode.style.display = self.closeButtonDisplay;
                closeButton.placeAt(dialogFooter);

                baseXhr.get({
                    url: this.url,
                    handleAs: "json",
                    load: function(data) {
                        //make any last minute changes the user may want to perform
                        data = self.processData(data);

                        self.restData = data;

                        self.checkBoxes = [];
                        array.forEach(data, function(item) {
                            var itemValue = util.escape(self.getValue(item));
                            var itemLabel = util.escape(self.getLabel(item));

                            var itemChecked = false;
                            if (array.indexOf(tempSelectedValues, itemValue) > -1) {
                                itemChecked = true;
                            }

                            var itemCheckbox = new CheckBox({
                                onChange: function(value) {
                                    if (value) {
                                        tempSelectedValues.push(itemValue);
                                    }
                                    else {
                                        util.removeFromArray(tempSelectedValues, itemValue);
                                    }
                                    countLabel.innerHTML = i18n("%s selected", tempSelectedValues.length);
                                },
                                onClick: function () {
                                    self.updateCheckboxDisplay(visibleItems, selectAllBox);
                                },
                                disabled: self.disabled,
                                checked: itemChecked
                            });

                            var itemDiv = document.createElement("label");

                            itemCheckbox.placeAt(itemDiv);
                            var itemLabelDiv = document.createElement("div");
                            itemLabelDiv.className = "inlineBlock";
                            itemLabelDiv.style.verticalAlign="middle";
                            if (domGeom.isBodyLtr()){
                                itemLabelDiv.style.paddingLeft = "5px";
                            }
                            else{
                                itemLabelDiv.style.paddingRight = "5px";
                            }

                            itemLabelDiv.innerHTML = itemLabel;
                            itemDiv.appendChild(itemLabelDiv);

                            itemList.appendChild(itemDiv);

                            var itemLine = {
                                label: itemLabel,
                                domNode: itemDiv,
                                checkbox: itemCheckbox
                            };
                            itemLines.push(itemLine);
                            visibleItems.push(itemLine);
                        });
                        self.updateCheckboxDisplay(visibleItems, selectAllBox);
                    }
                });

                dialog.containerNode.appendChild(dialogContainer);
                dialog.show();
            },

            getLabel: function(item) {
                return "getLabel() not specified";
            },

            getValue: function(item) {
                return "getValue() not specified";
            },

            /**
             * Placeholder for listening for close events
             */
            onClose: function() {
            },

            /**
             * Filter/customize data right at the beginning of show dialog selection list
             */
            processData: function(data) {
                return data;
            }
        }
    );
});

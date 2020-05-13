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
        "dijit/form/Button",
        "dijit/form/CheckBox",
        "dijit/form/TextBox",
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/on",
        "deploy/widgets/Formatters",
        "deploy/widgets/tag/Tagger",
        "deploy/widgets/filter/TagFilter",
        "js/webext/widgets/Alert",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        CheckBox,
        TextBox,
        array,
        declare,
        domClass,
        domConstruct,
        on,
        Formatters,
        Tagger,
        TagFilter,
        Alert,
        Dialog,
        GenericConfirm,
        TreeTable
) {
    /**
     * A widget to facilitate selection of resources from the tree.
     *
     * Set the onSave function to perform some action when the user clicks "OK"
     *
     * Supported properties:
     *  gridRestUrl                 : URL to load resource tree from
     *  radioSelect                 : Whether to allow only single selection or multiple
     *  isSelectable                : Function which takes a resource object as an argument and
     *                                determines whether the resource should be selectable
     */
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="resourceList">'+
                '<div data-dojo-attach-point="resourcesGrid"></div>'+
                '<div data-dojo-attach-point="buttonBottomAttach" class="bottom-buttons"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            if (!this.gridRestUrl) {
                this.gridRestUrl = bootstrap.restUrl+"resource/resource/tree";
            }

            var gridLayout = [{
                    name: i18n("Name"),
                    formatter: function(item) {
                        var result = domConstruct.create("div", {
                            "class": "inlineBlock"
                        });
                        var resourceLink = Formatters.resourceNonLinkFormatter(item);

                        domClass.add(resourceLink, "inlineBlock");
                        domConstruct.place(resourceLink, result);

                        var tagger = new Tagger({
                            objectType: "Resource",
                            item: item,
                            allowTagAdd: false
                        });
                        tagger.placeAt(result);

                        return result;
                    },
                    orderField: "name",
                    filterField: "name",
                    filterType: "custom",
                    getFilterFields: function() {
                        var nameFilter = new TextBox({
                            name: "name",
                            "class": "filter",
                            style: { "width": "45%" },
                            placeHolder: i18n("Name"),
                            type: "like"
                        });

                        var tagFilter = new TagFilter({
                            name: "tags",
                            "class": "filter",
                            style: { width: "45%" },
                            placeHolder: i18n("Tags"),
                            type: "like"
                        });

                        return [nameFilter, tagFilter];
                    },
                    getRawValue: function(item) {
                        return item.path;
                    }
                },{
                    name: i18n("Inventory"),
                    formatter: function(item, value, cell) {
                        return Formatters.resourceInventoryFormatter(item, cell, false);
                    },
                    orderField: "version",
                    filterField: "version",
                    filterType: "text",
                    getRawValue: function(item) {
                        var result = "None";

                        if (item.version) {
                            result = item.version.name;
                        }

                        return result;
                    }
                },{
                    name: i18n("Description"),
                    formatter: function(item) {
                        return domConstruct.create("div", {
                            innerHTML: item.description ? item.description.escape() : "",
                            style: {
                                "textOverflow": "ellipsis",
                                "whiteSpace": "nowrap",
                                "overflow": "hidden",
                                "maxWidth": "250px"
                            }
                        });
                    },
                    width: "250px",
                    orderField: "description",
                    filterField: "description",
                    filterType: "text",
                    getRawValue: function(item) {
                        return item.description;
                    }
                }];

            this.grid = new TreeTable({
                url: this.gridRestUrl,
                serverSideProcessing: true,
                allowHeaderLocking: false,
                xhrMethod: "POST",
                orderField: "name",
                noDataMessage: i18n("No resources have been added yet."),
                tableConfigKey: this.tableConfigKey === undefined ? "resourceList" : this.tableConfigKey,
                hidePagination: true,
                hideExpandCollapse: false,
                columns: gridLayout,
                selectable: true,
                isSelectable: function(resource) {
                    return self.isSelectable(resource);
                },
                radioSelect: this.radioSelect,
                getChildUrl: function(item) {
                    var result;
                    if (!!self.childUrlBase) {
                        result = self.childUrlBase + item.id;
                    }
                    else {
                        result = bootstrap.restUrl + "resource/resource/" + item.id + "/resources";
                    }
                    return result;
                },
                hasChildren: function(item) {
                    return item.hasChildren;
                }
            });
            this.grid.placeAt(this.resourcesGrid);

            var selectButton = new Button({
                label: i18n("OK"),
                showTitle: false,
                onClick: function() {
                    self.onSave(self.grid.getSelectedItems());
                }
            });
            domClass.add(selectButton.domNode, "idxButtonSpecial");
            selectButton.placeAt(this.buttonBottomAttach);

            var cancelButton = new Button({
                label: i18n("Cancel"),
                showTitle: false,
                onClick: function() {
                    self.onCancel();
                }
            });
            cancelButton.placeAt(this.buttonBottomAttach);
        },

        /**
         * Function to run when a user hits "OK"
         */
        onSave: function() {
            // No-op by default
        },

        /**
         * Function to run when a user hits "Cancel"
         */
        onCancel: function() {
            // No-op by default
        },

        /**
         * Overridable function to determine whether a given resource should be selectable
         */
        isSelectable: function(resource) {
            return true;
        }
    });
});
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
        "dojo/_base/xhr", // legacy dojo.xhr backing for dojo.xhr* methods
        "dojo/_base/event",
        "dojo/json",
        "dojo/on",
        "dojo/query",
        "dijit/Tooltip",
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dijit/_WidgetBase",
        "js/webext/widgets/table/TreeTable",
        "dijit/form/CheckBox",
        "dojo/dom-construct",
        "dojo/dom-class",
        "js/util/blocker/_BlockerMixin"
        ],
function(
        declare,
        array,
        baseXhr,
        baseEvent,
        JSON,
        on,
        query,
        Tooltip,
        _TemplatedMixin,
        _Widget,
        _WidgetBase,
        TreeTable,
        CheckBox,
        domConstruct,
        domClass,
        _BlockerMixin
) {
    return declare(
        [_Widget, _TemplatedMixin, _BlockerMixin],
        {
            templateString:
                '<div>' + //style="float:left;margin-top:10px;margin-left:5px"
                '<div data-dojo-attach-point="buttonAttach" style="margin-top:10px;margin-left:5px"></div>' +
                '<div data-dojo-attach-point="dataDiv"></div>' +
                '</div>',
                
            newValueColumnHeading : i18n("New Value"),
            oldValueColumnHeading : i18n("Old Value"),
            showChangedOnly: false,
            postCreate : function() {
                var self = this;
                
                if (!this.url) {
                    this.url = bootstrap.restUrl+"resource/resource/" + this.resource.id + "/variance"; 
                }
                
                var gridLayout = [{
                    name:i18n("Name"),
                    field: "name",
                    filterField: "name",
                    filterType: "text",
                    orderField: "name",
                    getRawValue: function(item) {
                        return item.name;
                    }
                },{
                    name: self.newValueColumnHeading,
                    field: "value",
                    filterField: "value",
                    filterType: "text",
                    getRawValue: function(item) {
                        return item.value;
                    }
                },{
                    name: self.oldValueColumnHeading,
                    field: "oldValue",
                    filterField: "oldValue",
                    filterType: "text",
                    getRawValue: function(item) {
                        return item.oldValue;
                    }
                }
                ];
                this.tree = new TreeTable({
                    url: this.url,
                    noDataMessage: i18n("No fingerprint found from Config Management Server!"),
                    columns: gridLayout,
                    serverSideProcessing: false,
                    orderField: "name",
                    idAttribute: "name",
                    draggable: false,
                    selectable: false,
                    hidePagination: true,
                    itemPasses: function(item) {
                        var result = true;
                        if (self.showChangedOnly) {
                            if (!item.varianceType || item.varianceType === "NONE") {
                                result = false;
                            }
                        }
                        return result;
                    },
                    applyRowStyle: function(item, row) {
                        if (item.varianceType === "ADDED") {
                            domClass.add(row,"resourceVarianceAdded");
                        } 
                        else if (item.varianceType === "REMOVED") {
                            domClass.add(row,"resourceVarianceRemoved");
                        }
                        else if (item.varianceType === "CHANGED") {
                            domClass.add(row,"resourceVarianceChanged");
                        }
                        else if (item.varianceType === "CHILD_CHANGED" && !self.showChangedOnly) {
                            domClass.add(row,"resourceVarianceChildChanged");
                        }
                    },
                    getItemChildren: function(item) {
                        var childrenArray = item.children;
                        if (childrenArray === undefined || childrenArray === null) {
                            childrenArray = [];
                        }
                        var attributes = item.attributes;
                        dojo.forEach(attributes, function(attObject) {
                            childrenArray.push(attObject);
                        });
                        return childrenArray;
                    }
                });
                
                var showChangedOnlyBox = new CheckBox({
                    checked: self.showChangedOnly,
                    onChange: function(value) {
                        self.showChangedOnly = value;
                        self.tree.refresh();
                    }
                });
                
                showChangedOnlyBox.placeAt(this.buttonAttach);
                
                domConstruct.create("div", {
                    innerHTML: i18n("Show Only Changed"),
                    "class": "inlineBlock",
                    "style": {
                        position: "relative",
                        top: "2px",
                        left: "2px"
                    }
                }, this.buttonAttach);
                this.tree.placeAt(this.dataDiv);
            }
        });
});

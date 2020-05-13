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
define ([
         "dijit/_Widget",
         "dijit/_TemplatedMixin",
         "dijit/form/Button",
         "dijit/form/CheckBox",
         "dojo/_base/array",
         "dojo/_base/declare",
         "dojo/_base/xhr",
         "dojo/dom-class",
         "dojo/dom-construct",
         "dojo/json",
         "dojo/on",
         "js/webext/widgets/Alert",
         "js/webext/widgets/Dialog",
         "js/webext/widgets/table/TreeTable",
         "deploy/widgets/Formatters",
         "deploy/widgets/property/PropSheetDiffReportTable"
         ],
function(_Widget,
         _TemplatedMixin,
         Button,
         CheckBox,
         array,
         declare,
         xhr,
         domClass,
         domConstruct,
         JSON,
         on,
         Alert,
         Dialog,
         TreeTable,
         Formatters,
         PropSheetDiffReportTable) {
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="resource-compare-tree with-description-text with-top-buttons">'+
                '<div data-dojo-attach-point="explainationAttach"></div>' +
                '<div data-dojo-attach-point="treeAttach"></div>'+
            '</div>',

        readOnly: false,
        leftColumnName: i18n("Left"),
        rightColumnName: i18n("Right"),
        selectable: true,

        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            self.onlyChangedBox = new CheckBox({
                checked: true,
                value: "true",
                onChange: function(value) {
                    self.tree.refresh();
                }
            });

            self.tree = new TreeTable({
                url: self.url,
                data:self.data,
                selectable: self.selectable,
                processData: function(data) {
                    if (self.onlyChangedBox.get("value")) {
                        var dataCopy = [];
                        var innerDataCopy;

                        array.forEach(data, function(item) {
                            if (item.pathChangeType !== "EQUIVALENT"){
                                innerDataCopy = self.shallowCloneResource(item);
                                //we want to avoid deep cloning all of the children due to
                                //performance issues. just deep clone the ones that have
                                //actually changed
                                innerDataCopy.children = self.cloneChangedChildren(item);
                                dataCopy.push(innerDataCopy);
                            }
                        });
                        return dataCopy;
                    }

                    return data;
                },
                hideExpandCollapse: false,
                idAttribute: "path",
                isSelectable: function(item) {
                    return item.pathChangeType !== "EQUIVALENT" && item.pathChangeType !== "CHILDREN_CHANGED" && item.pathChangeType !== "PROP_DEF_MISMATCH";
                },
                cascadeSelectedState: true,
                onSelectItem: function(item) {
                    // Whenever we select a child, we have to ensure all parents which are new are
                    // also selected.
                    var rowObject = self.tree._getRowObjectForItem(item);
                    var parent = rowObject.parent;
                    var parentsToCheck = [];
                    while (!!parent) {
                        if (parent.item && parent.item.pathChangeType === "LEFT_ONLY") {
                            parentsToCheck.push(parent.item);
                        }
                        parent = parent.parent;
                    }

                    self.tree.selectItems(parentsToCheck);
                },
                columns: [{
                    name: self.leftColumnName, // LEFT
                    formatter: function(item, value, cell) {
                        return self.leftResourceLinkFormatter(item, value, cell);
                    }
                },{
                    name: self.rightColumnName, // RIGHT
                    alwaysShowExpandArrow: true,
                    formatter: function(item, value, cell) {
                        return self.rightResourceLinkFormatter(item, value, cell);
                    }
                },{
                    name: i18n("Difference"),
                    formatter: function(item, value, cell) {
                        return self.differenceFormatter(item, value, cell);
                    }
                },{
                    name: i18n("Actions"),
                    formatter: function(item, value, cell) {
                        if (self.onlyChangedBox.get("value")){
                            self.filterIndifferentProperties(item);
                        }
                        return self.viewPropertiesFormatter(item, value, cell);
                    }
                }]
            });
            self.tree.placeAt(self.treeAttach);

            if (!this.readOnly) {
                this.buildApplyInstructions();
            }

            var onlyChangedDiv = domConstruct.create("div", {
                style: {
                    paddingTop: "7px"
                }
            }, self.explainationAttach);
            self.onlyChangedBox.placeAt(onlyChangedDiv);

            domConstruct.create("span", {
                innerHTML: i18n("Only show changes"),
                style: {
                   paddingLeft: "7px"
                }
            }, onlyChangedDiv);
        },

        buildApplyInstructions: function() {
            var self = this;

            domConstruct.create("span", {
                className: "bold",
                innerHTML: i18n("To apply changes from the first resource tree to the second:")
            }, self.explainationAttach);
            domConstruct.create("div", {
                innerHTML: i18n("1: Select changes to apply from the left side to the right side.")
            }, self.explainationAttach);
            domConstruct.create("div", {
                innerHTML: i18n("2: Click the Continue button to preview changes, then submit to apply all changes.")
            }, self.explainationAttach);

            var continueButton = new Button({
                showTitle: false,
                label: i18n("Continue")
            });
            domClass.add(continueButton.domNode, "idxButtonSpecial");
            continueButton.placeAt(self.explainationAttach);

            on(continueButton, "click", function() {
                var diffReportTable = new PropSheetDiffReportTable({
                    propSheetDiffReport: []
                });

                var selectedItems = self.tree.getSelectedItems().sort(function(first, second) {
                    return first.path.localeCompare(second.path);
                });

                var previewDialog = new Dialog({
                    title: i18n("Preview Changes")
                });

                var messageContainer = domConstruct.create("div", {}, previewDialog.containerNode);

                domConstruct.create("div", {
                    innerHTML: i18n("The following changes will be applied to %s:", appState.rightResource.path.escape()),
                    style: {
                        paddingBottom: "5px"
                    }
                }, messageContainer);

                array.forEach(selectedItems, function(item) {
                    var path;
                    if (item.pathChangeType === "LEFT_ONLY") {
                        path = item.leftResource.path.substring(appState.leftResource.path.length);
                        domConstruct.create("div", {
                            innerHTML: i18n("Create %s", path.escape()),
                            style: {
                                paddingBottom: "3px"
                            }
                        }, messageContainer);
                    }
                    else if (item.pathChangeType === "RIGHT_ONLY") {
                        path = item.rightResource.path.substring(appState.rightResource.path.length);
                        domConstruct.create("div", {
                            innerHTML: i18n("Delete %s", path.escape()),
                            style: {
                                paddingBottom: "3px"
                            }
                        }, messageContainer);
                    }
                    else if (item.pathChangeType === "PROPERTY_DIFFERENCE") {
                        path = item.rightResource.path.substring(appState.rightResource.path.lastIndexOf("/"));
                        var resourceContainer = domConstruct.create("div", {
                            innerHTML: i18n("Apply properties to %s", path.escape()),
                            style: {
                                paddingBottom: "3px"
                            }
                        }, messageContainer);

                        array.forEach(item.propertyComparison, function(property) {
                            var displayName = diffReportTable.getDisplayName(property);
                            var newValue = diffReportTable.getLeftValue(property);

                            function displayChange(content) {
                                domConstruct.create("div", {
                                    innerHTML: content,
                                    style: {
                                        paddingLeft: "15px"
                                    }
                                }, resourceContainer);
                            }

                            if (property.different) {
                                if (property.leftPropValue === undefined) {
                                    displayChange(i18n("Remove %s", displayName.escape()));
                                }
                                else if (property.rightPropValue === undefined) {
                                    displayChange(i18n("Add %s with value %s", displayName.escape(), newValue.escape()));
                                }
                                else {
                                    displayChange(i18n("Set %s to %s", displayName.escape(), newValue.escape()));
                                }
                            }
                        });
                    }
                });

                var confirmButton = new Button({
                    label: i18n("Apply Changes")
                });
                confirmButton.placeAt(previewDialog.containerNode);
                confirmButton.on("click", function() {
                    var postData = [];
                    array.forEach(selectedItems, function(item) {
                        if (item.pathChangeType === "LEFT_ONLY") {
                            var parentPath = appState.rightResource.path+item.path;
                            parentPath = parentPath.substring(0, parentPath.lastIndexOf("/"));

                            var curData = {
                                action: "copy",
                                parentPath: parentPath,
                                sourceId: item.leftResource.id
                            };

                            if (!!appState.rightResource.resourceTemplate) {
                                curData.parentTemplate = appState.rightResource.resourceTemplate.id;
                            }

                            postData.push(curData);
                        }
                        else if (item.pathChangeType === "RIGHT_ONLY") {
                            postData.push({
                                action: "delete",
                                id: item.rightResource.id,
                                path: item.rightResource.path
                            });
                        }
                        else if (item.pathChangeType === "PROPERTY_DIFFERENCE") {
                            postData.push({
                                action: "applyProperties",
                                sourceId: item.leftResource.id,
                                targetId: item.rightResource.id
                            });
                        }
                    });

                    previewDialog.hide();
                    previewDialog.destroy();
                    self.tree.block();

                    xhr.post({
                        url: bootstrap.restUrl+"resource/resource/applyCompareChanges",
                        postData: JSON.stringify(postData),
                        headers: {
                            "Content-Type": "application/json"
                        },
                        load: function() {
                            previewDialog.hide();
                            previewDialog.destroy();

                            var alert = new Alert({
                                message: i18n("Resource changes applied successfully.")
                            });
                            self.tree.refresh();
                        },
                        error: function(error) {
                            var alert = new Alert({
                                messages: [i18n("Error applying resource changes:"),
                                           "",
                                           util.escape(error.responseText)]
                            });
                            self.grid.unblock();
                        }
                    });
                });

                previewDialog.show();
            });
        },

        //if "show changes only" is checked, filter out any
        //indifferent properties and return only different
        filterIndifferentProperties: function(item) {
            var newPropertyComparison = [];

            array.forEach(item.propertyComparison, function(prop) {
                if(prop.different){
                    newPropertyComparison.push(prop);
                }
            });

            item.propertyComparison = newPropertyComparison;
        },

        shallowCloneResource: function(item) {
            return {
                leftResource: item.leftResource,
                path: item.path,
                pathChangeType: item.pathChangeType,
                propertyComparison: item.propertyComparison,
                rightResource: item.rightResource
            };
        },

        cloneChangedChildren: function (item) {
            var self = this;
            var cloneChildren = [];
            array.forEach(item.children, function(child) {
              if (child.pathChangeType !== "EQUIVALENT") {
                  var newChild = self.shallowCloneResource(child);
                  //we will pass in the original which actually has the children, and not the clone
                  newChild.children = self.cloneChangedChildren(child);
                  cloneChildren.push(newChild);
              }
            });
            return cloneChildren;
        },

        viewPropertiesFormatter: function(item, value, cell) {
            var result = domConstruct.create("a", {
                className: "linkPointer",
                innerHTML: i18n("View Properties")
            });

            on(result, "click", function() {
                var dialog = new Dialog({
                    title: i18n("Compare Properties")
                });

                var diffTable = new PropSheetDiffReportTable({
                    propSheetDiffReport: item.propertyComparison
                });
                diffTable.placeAt(dialog.containerNode);

                dialog.show();
            });

            return result;
        },

        differenceFormatter: function(item, value, cell) {
            var result = domConstruct.create("div");

            if (item.pathChangeType === "EQUIVALENT") {
                domConstruct.create("div", {
                    innerHTML: i18n("No Change")
                }, result);
            }
            else if (item.pathChangeType === "RIGHT_ONLY") {
                domConstruct.create("div", {
                    innerHTML: i18n("Deleted")
                }, result);
                domClass.add(cell, "table-compare-removed");
            }
            else if (item.pathChangeType === "LEFT_ONLY") {
                domConstruct.create("div", {
                    innerHTML: i18n("Added")
                }, result);
                domClass.add(cell, "table-compare-added");
            }
            else if (item.pathChangeType === "PROPERTY_DIFFERENCE") {
                domConstruct.create("div", {
                    innerHTML: i18n("Properties Changed")
                }, result);
                domClass.add(cell, "table-compare-changed");
            }
            else if (item.pathChangeType === "CHILDREN_CHANGED") {
                domConstruct.create("div", {
                    innerHTML: i18n("Children Changed")
                }, result);
                domClass.add(cell, "table-compare-children-changed");
            }
            else if (item.pathChangeType === "PROP_DEF_MISMATCH") {
                domConstruct.create("div", {
                    innerHTML: i18n("Property definition type mismatch")
                }, result);
                domClass.add(cell, "table-compare-error");
            }

            return result;
        },

        rightResourceLinkFormatter: function(item, value, cell) {
            var result = "";
            if (item.rightResource) {
                result = Formatters.resourceLinkFormatter(item.rightResource);
            }

            if (item.pathChangeType === "LEFT_ONLY") {
                domClass.add(cell, "resource-compare-placeholder-cell");
            }
            return result;
        },

        leftResourceLinkFormatter: function(item, value, cell) {
            var result = "";
            if (item.leftResource) {
                result = Formatters.resourceLinkFormatter(item.leftResource);
            }

            if (item.pathChangeType === "RIGHT_ONLY") {
                domClass.add(cell, "resource-compare-placeholder-cell");
            }
            return result;
        }
    });
});

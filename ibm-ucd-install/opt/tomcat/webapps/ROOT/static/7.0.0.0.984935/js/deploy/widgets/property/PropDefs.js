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
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/on",
        "deploy/widgets/property/EditPropDef",
        "js/webext/widgets/Alert",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/table/TreeTable",
        "deploy/widgets/Formatters"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        declare,
        xhr,
        domClass,
        domConstruct,
        on,
        EditPropDef,
        Alert,
        Dialog,
        GenericConfirm,
        TreeTable,
        Formatters
) {
    /**
     * A general widget for display and management of property definition groups.
     *
     * Supported properties:
     *  propDefs / Array            A full set of existing data for a PropSheetDef to show
     *   -- or --
     *  propSheetDefPath / String   The path to a versioned PropSheetDef
     *   -- or --
     *  propSheetDefId / String     The path to a versioned PropSheetDef
     *   -- or each of --
     *  getUrl / String             The URL to use to get the list of property definitions.
     *  saveUrl / String            The URL to use to save changes to a property definition.
     *  refreshUrl / String         The URL to use to refresh after saving changes.
     *  deleteUrl / String          The URL to use to delete a property definition.
     *
     *
     *  readOnly / Boolean          Whether to show editing options around properties.
     *                              Default value: false
     *  onlyValueChange / Boolean   Whether to prevent editing of any fields but the default value,
     *                              addition of properties, deletion of properties, etc.
     *                              Default value: false
     *  deleteHeaders / Object      The object to use as headers for the headers of the deletion request
     */
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="propDefs">' +
                '<div class="listTopButtons" data-dojo-attach-point="buttonTopAttach"></div>' +
                '<div class="versionLinks" data-dojo-attach-point="versionAttach"></div>' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',

        deleteHeaders: {},
        readOnly: false,
        onlyValueChange: false,
        SECUREMASK: "****",

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            if (this.propSheetDef) {
                this.propSheetDefId = this.propSheetDef.id;
                if (this.propSheetDef.versioned) {
                    this.propSheetDefPath = this.propSheetDef.path;
                    this.propSheetDefVersionCount = this.propSheetDef.versionCount;
                    this.propSheetDefVersion = this.propSheetDef.version;
                }
            }
            else if (this.propSheetDefPath) {
                this.propSheetDefVersion = -1;
            }

            var gridLayout = [{
                name: i18n("Name"),
                field: "name"
            },{
                name: i18n("Label"),
                field: "label"
            },{
                name: i18n("Pattern"),
                field: "pattern"
            },{
                name: i18n("Required"),
                field: "required",
                formatter: function(item) {
                    return Formatters.booleanTranslator(item.required);
                }
            },{
                name: i18n("Default Value"),
                field: "value",
                formatter: function(item, value, cell) {
                    var result = item.value;
                    if (item.type === "SECURE") {
                        result = self.SECUREMASK;
                    }
                    else if (item.type === "DATETIME") {
                        // Convert it to the valid date time
                        if (item.value && item.value.trim()) {
                            var num = Number(item.value);
                            if (!isNaN(num)) {
                                var date = new Date(num);
                                result = result + " (" + date.toLocaleString() + ")";
                            }
                            // Invalid number
                            else {
                                result = "";
                            }
                        }
                        // If it is undefined or null, make it a blank string
                        else {
                            result = "";
                        }
                    }
                    return result;
                }
            },{
                name: i18n("Description"),
                field: "description"
            },{
                name: i18n("Actions"),
                formatter: this.actionsFormatter,
                parentWidget: this
            }];

            var gridRestUrl;
            if (this.propSheetDefPath) {
                gridRestUrl = bootstrap.baseUrl+"property/propSheetDef/"+util.vc.encodeVersionedPath(this.propSheetDefPath)+"."+this.propSheetDefVersion+"/propDefs";
            }
            else if (this.getUrl) {
                gridRestUrl = this.getUrl;
            }
            else {
                gridRestUrl = bootstrap.baseUrl+"property/propSheetDef/"+this.propSheetDefId+"/propDefs";
            }

            this.grid = new TreeTable({
                url: gridRestUrl,
                data: this.propDefs || undefined,
                hidePagination: false,
                serverSideProcessing: false,
                hideExpandCollapse: true,
                columns: gridLayout,
                tableConfigKey: "propDefList",
                noDataMessage: i18n("No properties have been defined.")
            });
            this.grid.placeAt(this.gridAttach);

            if (!self.readOnly && !self.onlyValueChange) {
                var newPropertyButton = {
                    label: i18n("Add Property"),
                    showTitle: false,
                    onClick: function() {
                        self.showPropertyDialog();
                    }
                };
                var newButton = new Button(newPropertyButton);
                domClass.add(newButton.domNode, "idxButtonSpecial");
                newButton.placeAt(this.buttonTopAttach);
            }

            if (this.propSheetDefVersion && this.propSheetDefVersionCount) {
                this.showVersionLinks();
            }
        },

        /**
         *
         */
        destroy: function() {
            this.inherited(arguments);
            this.grid.destroy();
        },

        /**
         *
         */
        showVersionLinks: function() {
            var self = this;

            domConstruct.empty(this.versionAttach);

            var versionLabel = domConstruct.create("div", {
                "innerHTML": i18n("Version %s of %s", this.propSheetDefVersion, this.propSheetDefVersionCount)
            }, this.versionAttach);

            var versionLinks = domConstruct.create("div", {
            }, this.versionAttach);

            if (this.propSheetDefVersion === 1) {
                var greyBackLink = domConstruct.create("div", {
                    className: "arrow_backwards_grey inlineBlock"
                }, versionLinks);
            }
            else {
                var backLink = domConstruct.create("div", {
                    className: "arrow_backwards inlineBlock"
                }, versionLinks);

                on(backLink, "click", function() {
                    self.propSheetDefVersion--;
                    self.refreshGrid();
                });
            }

            domConstruct.create("span", {
                "innerHTML": "&nbsp;&nbsp;&nbsp;"
            }, versionLinks);

            if (this.propSheetDefVersion === this.propSheetDefVersionCount) {
                var greyForwardLink = domConstruct.create("div", {
                    className: "arrow_forward_grey inlineBlock"
                }, versionLinks);

                domConstruct.create("span", {
                    "innerHTML": "&nbsp;&nbsp;"
                }, versionLinks);

                var greyHeadLink = domConstruct.create("div", {
                    className: "arrow_fastForward_grey inlineBlock"
                }, versionLinks);
            }
            else {
                var forwardLink = domConstruct.create("div", {
                    className: "arrow_forward inlineBlock"
                }, versionLinks);

                on(forwardLink, "click", function() {
                    self.propSheetDefVersion++;
                    self.refreshGrid();
                });

                domConstruct.create("span", {
                    "innerHTML": "&nbsp;&nbsp;"
                }, versionLinks);

                var headLink = domConstruct.create("div", {
                    className: "arrow_fastForward inlineBlock"
                }, versionLinks);

                on(headLink, "click", function() {
                    self.propSheetDefVersion = self.propSheetDefVersionCount;
                    self.refreshGrid();
                });

                if (!this.readOnly) {
                    domConstruct.create("span", {
                        "innerHTML": "&nbsp;&nbsp;"
                    }, versionLinks);

                    var resetLink = domConstruct.create("a", {
                        "innerHTML": i18n("Reset Latest to This Version")
                    }, versionLinks);
                    on(resetLink, "click", function() {
                        var resetConfirm = new GenericConfirm({
                            "message": i18n("Are you sure you want to reset to version %s?",
                                    self.propSheetDefVersion),
                            "action": function() {
                                xhr.put({
                                    url: bootstrap.restUrl+"vc/persistent/"+util.vc.encodeVersionedPath(self.propSheetDefPath)+"."+self.propSheetDefVersion+"/setAsLatest",
                                    load: function() {
                                        self.propSheetDefVersionCount++;
                                        self.propSheetDefVersion = self.propSheetDefVersionCount;
                                        self.refreshGrid();
                                    },
                                    error: function(data) {
                                        var errorAlert = new Alert({
                                            message: i18n("Error: %s", util.escape(data.responseText))
                                        });
                                    }
                                });
                            }
                        });
                    });
                }
            }
        },

        /**
         *
         */
        refreshGrid: function(version) {
            if (!this.propDefs) {
                var gridRestUrl;
                if (version !== null && version !== undefined) {
                    gridRestUrl = bootstrap.baseUrl+"property/propSheetDef/"+util.vc.encodeVersionedPath(this.propSheetDefPath)+"." + version+"/propDefs";
                }
                else if (this.propSheetDefPath) {
                    gridRestUrl = bootstrap.baseUrl+"property/propSheetDef/"+util.vc.encodeVersionedPath(this.propSheetDefPath)+"." + this.propSheetDefVersion+"/propDefs";
                }
                else if (this.getUrl) {
                    gridRestUrl = this.getUrl;
                }
                else {
                    gridRestUrl = bootstrap.baseUrl+"property/propSheetDef/"+this.propSheetDefId+"/propDefs";
                }

                this.grid.url = gridRestUrl;
                this.grid.refresh();

                if (this.propSheetDefPath) {
                    this.showVersionLinks();
                }
            }
        },

        /**
         *
         */
        actionsFormatter: function(item) {
            var self = this.parentWidget;

            var result = document.createElement("div");

            if (!self.readOnly && !item.inherited) {
                var editLink = document.createElement("a");
                editLink.className = "actionsLink linkPointer";
                editLink.innerHTML = i18n("Edit");
                editLink.onclick = function() {
                    self.showPropertyDialog(item);
                };
                result.appendChild(editLink);

                if (!self.onlyValueChange) {
                    var deleteLink = document.createElement("a");
                    deleteLink.className = "actionsLink linkPointer";
                    deleteLink.innerHTML = i18n("Delete");
                    deleteLink.onclick = function() {
                        var confirm = new GenericConfirm({
                            message: i18n("Are you sure you want to delete property \"%s\"?", item.name.escape()),
                            action: function() {
                                var deleteUrl;

                                if (self.propDefs) {
                                    var propDef = util.getNamedProperty(self.propDefs, item.name);
                                    if (propDef) {
                                        util.removeFromArray(self.propDefs, propDef);
                                    }
                                    self.grid.data = self.propDefs;
                                    self.grid.refresh();
                                }
                                else {
                                    if (self.propSheetDefPath) {
                                        deleteUrl = bootstrap.baseUrl+"property/propSheetDef/"+util.vc.encodeVersionedPath(self.propSheetDefPath)+".-1/propDefs/"+encodeURIComponent(item.name);
                                    }
                                    else if (self.deleteUrl) {
                                        deleteUrl = self.deleteUrl.replace("{propertyName}", encodeURIComponent(item.name));
                                    }
                                    else {
                                        deleteUrl = bootstrap.baseUrl+"property/propSheetDef/"+self.propSheetDefId+"/propDefs/"+encodeURIComponent(item.name);
                                    }

                                    xhr.del({
                                        url: deleteUrl,
                                        headers: self.deleteHeaders,
                                        load: function() {
                                            if (self.refreshHash) {
                                                navBar.setHash(self.refreshHash, false, true);
                                            }
                                            else {
                                                if (self.propSheetDefVersionCount) {
                                                    self.propSheetDefVersion++;
                                                    self.propSheetDefVersionCount++;
                                                }
                                                self.refreshGrid();
                                            }
                                        },
                                        error: function(response) {
                                            if (response.responseText) {
                                                var wrongVersionAlert = new Alert({
                                                    message: util.escape(response.responseText)
                                                });
                                                if (self.refreshHash) {
                                                    navBar.setHash(self.refreshHash, true, false);
                                                }
                                                if (self.grid) {
                                                    self.grid.refresh = function() {
                                                        navBar.setHash(self.refreshHash, false, true);
                                                    };
                                                }
                                            } else {
                                                this.inherited(arguments);
                                            }
                                        }
                                    });
                                }
                            }
                        });
                    };
                    result.appendChild(deleteLink);
                }
            }

            if (item.inherited) {
                result.innerHTML = i18n("(Inherited)");
            }

            return result;
        },

        /**
         *
         */
        showPropertyDialog: function(propDef) {
            var self = this;
            var propertyDialog = new Dialog({
                title: i18n("Edit Property"),
                closable: true,
                draggable: true
            });

            var overrideOnSubmit;
            if (self.propDefs) {
                overrideOnSubmit = function(data) {
                    var existingPropDef;
                    if (propDef) {
                        existingPropDef = util.getNamedProperty(self.propDefs, propDef.name);
                    }
                    if (existingPropDef) {
                        var key;
                        for (key in data) {
                            if (data.hasOwnProperty(key)) {
                                existingPropDef[key] = data[key];
                            }
                        }
                    }
                    else {
                        self.propDefs.push(data);
                    }

                    self.grid.data = self.propDefs;
                    self.grid.refresh();
                };
            }

            var propertyForm = new EditPropDef({
                saveUrl: this.saveUrl,
                propDef: propDef,
                propSheetDefId: this.propSheetDefId,
                propSheetDefPath: this.propSheetDefPath,
                addData: this.addData,
                onSubmit: overrideOnSubmit,
                onlyValueChange: this.onlyValueChange,
                resolveHttpValuesUrl: (this.propSheetDef) ? this.propSheetDef.resolveHttpValuesUrl : null,
                callback: function(response) {
                    if (response && response.status > 399) {
                        //failed save attempt
                        var wrongVersionAlert = new Alert({
                            message: util.escape(response.responseText)
                        });
                        if (self.refreshHash) {
                            navBar.setHash(self.refreshHash, true, false);
                        }
                        if (self.grid && self.refreshHash) {
                            self.grid.refresh = function() {
                                navBar.setHash(self.refreshHash, false, true);
                            };
                        }
                    }
                    else {
                        propertyDialog.hide();
                        propertyDialog.destroy();
                        if (self.refreshHash) {
                            navBar.setHash(self.refreshHash, false, true);
                        }
                        else if (self.propSheetDef) {
                            self.propSheetDefVersion++;
                            self.propSheetDefVersionCount++;
                            self.propSheetDef.version=self.propSheetDefVersion;
                            self.propSheetDef.versionCount=self.propSheetDefVersionCount;
                            self.refreshGrid(!!self.propSheetDefPath ? "-1" : null);
                        }
                        else if (self.propSheetDefId) {
                            self.refreshGrid();
                        }
                    }
                }
            });

            propertyForm.placeAt(propertyDialog.containerNode);
            propertyDialog.show();
        },

        /**
         *
         */
        addData: function(data) {
            // Placeholder
        },

        _getValueAttr: function() {
            return this.propDefs;
        }
    });
});

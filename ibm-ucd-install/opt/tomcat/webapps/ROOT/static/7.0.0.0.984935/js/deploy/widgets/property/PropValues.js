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
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/on",
        "deploy/widgets/property/EditPropValue",
        "js/webext/widgets/Alert",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/DomNode",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        array,
        declare,
        xhr,
        domClass,
        domConstruct,
        on,
        EditPropValue,
        Alert,
        ColumnForm,
        Dialog,
        DomNode,
        GenericConfirm,
        TreeTable
) {
    /**
     * A general widget for display and management of property value groups.
     *
     * Supported properties:
     *  propSheetPath / String      The path to a versioned PropSheet
     *   -- or --
     *  propSheetId / String        The ID of a DB-persisted PropSheet to view
     *   -- or each of --
     *  getUrl / String             The URL to use to get the list of property values.
     *  saveUrl / String            The URL to use to save changes to a property value.
     *  deleteUrl / String          The URL to use to delete a property value.
     *  saveAllUrl / String         The URL to use for batch edit of all properties.
     *
     *
     *  showDescription / Boolean   Whether to show the description column
     *  readOnly / Boolean          Whether to show editing options around properties.
     *                              Default value: false
     *  deleteHeaders / Object      The object to use as headers for the headers of the deletion request
     *  oldVersion / Boolean        Whether the propSheetVersion is less than the  propSheetVersionCount.
     *                              Used to determine which version arrows should be shown as well as
     *                              add, edit, delete and save buttons.
     *  data / Object               If the propSheet is not supplied we'll request the PropValues
     *                              and version information, this object contains this information
     */
    return declare('deploy.widgets.property.PropValues',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="propValues">' +
                '<div class="versionLinks" data-dojo-attach-point="versionAttach"></div>' +
                '<div class="listTopButtons" data-dojo-attach-point="buttonTopAttach"></div>' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
                '<div data-dojo-attach-point="formAttach"></div>' +
            '</div>',

        readOnly: false,
        showDescription: true,
        deleteHeaders: {},
        oldVersion: false,
        data: null,

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            if (this.propSheet && this.propSheet.versioned) {
                this.propSheetPath = this.propSheet.path;
                this.propSheetVersionCount = this.propSheet.versionCount;
                this.propSheetVersion = this.propSheet.version;
            }
            else if (this.propSheetPath && !this.propSheetVersion) {
                this.propSheetVersion = -1;
            }

            this.generateUrls();

            if (this.propSheetVersion && this.propSheetVersionCount) {
                if (this.propSheetVersion < this.propSheetVersionCount) {
                    self.oldVersion = true;
                }
                this.showVersionLinks();
            }

            this.showTable();
        },

        /**
         *
         */
        generateUrls: function() {
            if (this.propSheetPath) {
                this.gridRestUrl = bootstrap.baseUrl+"property/propSheet/"+util.vc.encodeVersionedPath(this.propSheetPath)+"."+this.propSheetVersion;

            }
            else if (this.getUrl) {
                this.gridRestUrl = this.getUrl;
            }
            else {
                this.gridRestUrl = bootstrap.baseUrl+"property/propSheet/"+this.propSheetId;
            }

            if (this.propSheetPath) {
                this.saveAllUrl = bootstrap.baseUrl+"property/propSheet/"+util.vc.encodeVersionedPath(this.propSheetPath)+"."+this.propSheetVersion+"/allPropValues";
                this.saveBatchAllUrl = bootstrap.baseUrl+"property/propSheet/"+util.vc.encodeVersionedPath(this.propSheetPath)+"."+this.propSheetVersion+"/allPropValuesFromBatch";
            }
            else if (this.propSheetId) {
                this.saveAllUrl = bootstrap.baseUrl+"property/propSheet/"+this.propSheetId+"/allPropValues";
            }
        },

        /**
         *
         */
        destroy: function() {
            this.inherited(arguments);
            this.clearWidgets();
        },

        /**
         *
         */
        showVersionLinks: function() {
            var self = this;

            domConstruct.empty(this.versionAttach);

            if (this.propSheetVersion && this.propSheetVersionCount) {
                var versionLabel = domConstruct.create("div", {
                    "innerHTML": i18n("Version %s of %s", this.propSheetVersion, this.propSheetVersionCount)
                }, this.versionAttach);

                var versionLinks = domConstruct.create("div", {
                }, this.versionAttach);

                if (this.propSheetVersion === 1) {
                    var greyFastBackLink = domConstruct.create("div", {
                        className: "arrow_fastBackwards_grey inlineBlock"
                    }, versionLinks);

                    domConstruct.create("span", {
                        "innerHTML": "&nbsp;&nbsp;"
                    }, versionLinks);

                    var greyBackLink = domConstruct.create("div", {
                        className: "arrow_backwards_grey inlineBlock"
                    }, versionLinks);
                }
                else {
                    var fastBackLink = domConstruct.create("div", {
                        className: "arrow_fastBackwards inlineBlock"
                    }, versionLinks);

                    on(fastBackLink, "click", function() {
                        self.propSheetVersion = 1;
                        self.refresh();
                    });

                    domConstruct.create("span", {
                        "innerHTML": "&nbsp;&nbsp;"
                    }, versionLinks);

                    var backLink = domConstruct.create("div", {
                        className: "arrow_backwards inlineBlock"
                    }, versionLinks);

                    on(backLink, "click", function() {
                        self.propSheetVersion--;
                        self.refresh();
                    });
                }

                domConstruct.create("span", {
                    "innerHTML": "&nbsp;&nbsp;&nbsp;"
                }, versionLinks);

                if (this.propSheetVersion === this.propSheetVersionCount) {
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
                        self.propSheetVersion++;
                        self.refresh();
                    });

                    domConstruct.create("span", {
                        "innerHTML": "&nbsp;&nbsp;"
                    }, versionLinks);

                    var headLink = domConstruct.create("div", {
                        className: "arrow_fastForward inlineBlock"
                    }, versionLinks);

                    on(headLink, "click", function() {
                        self.propSheetVersion = self.propSheetVersionCount;
                        self.refresh();
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
                                        self.propSheetVersion),
                                "action": function() {
                                    xhr.put({
                                        url: bootstrap.restUrl+"vc/persistent/"+util.vc.encodeVersionedPath(self.propSheetPath)+"."+self.propSheetVersion+"/setAsLatest",
                                        load: function() {
                                            self.propSheetVersionCount++;
                                            self.propSheetVersion = self.propSheetVersionCount;
                                            self.refresh();
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
            }
        },

        /**
         *
         */
        refresh: function() {
            if (this.propSheetVersion && this.propSheetVersionCount) {
                if (this.propSheetVersion < this.propSheetVersionCount) {
                    this.oldVersion = true;
                }
                else {
                    this.oldVersion = false;
                }
            }
            this.showVersionLinks();
            this.generateUrls();

            if (this.grid) {
                this.showTable();
            }
            else if (this.form) {
                this.showBatchEdit();
            }

            this.showVersionLinks();
        },

        /**
         *
         */
        clearWidgets: function() {
            if (this.grid) {
                this.grid.destroy();
                if (this.buttonTopAttach) {
                    domConstruct.empty(this.buttonTopAttach);
                }
                if (this.gridAttach) {
                    domConstruct.empty(this.gridAttach);
                }
                this.grid = undefined;
            }
            if (this.form) {
                this.form.destroy();
                this.form = undefined;
            }
        },

        /**
         *
         */
        showTable: function() {
            var self = this;

            this.clearWidgets();

            var gridLayout = [{
                name: i18n("Name"),
                field: "name",
                orderField: "name",
                filterField: "name",
                filterType: "text",
                width: "170px",
                style: {"word-break" : "break-all"},
                getRawValue: function(item) {
                    return item.name;
                }
            },{
                name: i18n("Value"),
                orderField: "value",
                filterField: "value",
                filterType: "text",
                style: {"word-break" : "break-all"},
                getRawValue: function(item) {
                    return item.value;
                },
                formatter: function(item) {
                    var result = domConstruct.create("div");

                    var textResult = item.value.escape();
                    while (textResult.indexOf("\n") > -1) {
                        textResult = textResult.replace("\n", "<br />");
                    }
                    result.innerHTML = textResult;

                    return result;
                }
            }];

            if (this.showDescription) {
                gridLayout.push({
                    name: i18n("Description"),
                    width: "200px",
                    style: {"word-break" : "break-all"},
                    field: "description"
                });
            }
            if (!this.readOnly && !this.oldVersion) {
                gridLayout.push({
                    name: i18n("Actions"),
                    width: "70px",
                    style: {"word-break" : "break-all"},
                    formatter: this.actionsFormatter,
                    parentWidget: this
                });
            }

            xhr.get({
                url: this.gridRestUrl,
                handleAs: "json",
                load: function(data) {
                    self.propSheetVersion = data.version;

                    if (data.properties) {
                        data = data.properties;
                    }
                    self.grid = new TreeTable({
                        data: self.propValues || data,
                        hidePagination: false,
                        serverSideProcessing: false,
                        hideExpandCollapse: true,
                        columns: gridLayout,
                        tableConfigKey: "propValueList",
                        noDataMessage: i18n("No properties found."),
                        allowHeaderLocking: false
                    });
                    self.grid.placeAt(self.gridAttach);
                }
            });

            if (!this.readOnly) {
                if (!this.oldVersion) {
                    var newPropertyButton = {
                        label: i18n("Add Property"),
                        showTitle: false,
                        onClick: function() {
                            self.showPropertyDialog();
                        }
                    };
                    var propertyButton = new Button(newPropertyButton);
                    domClass.add(propertyButton.domNode, "idxButtonSpecial");
                    propertyButton.placeAt(this.buttonTopAttach);
                }

                var batchEditButton = {
                    label: i18n("Batch Edit"),
                    showTitle: false,
                    onClick: function() {
                        self.showBatchEdit();
                    }
                };

                new Button(batchEditButton).placeAt(this.buttonTopAttach);
            }
        },

        /**
         *
         */
        actionsFormatter: function(item) {

            var propSheet = this.parentWidget.propSheet;
            var self = this.parentWidget;

            var result = domConstruct.create("div", {
                "style": "word-break:normal;"
            });

            if (!self.readOnly && !item.inherited) {
                var editLink = domConstruct.create("a", {
                        className: "actionsLink linkPointer",
                        innerHTML: i18n("Edit")
                }, result);

                on(editLink, "click", function() {
                    self.showPropertyDialog(item);
                });

                var deleteLink = domConstruct.create("a", {
                        className: "actionsLink linkPointer",
                        innerHTML: i18n("Delete")
                }, result);

                on(deleteLink, "click", function() {
                    var confirm = new GenericConfirm({
                        message: i18n("Are you sure you want to delete property \"%s\"?", item.name.escape()),
                        action: function() {
                            var deleteUrl;
                            if (self.propSheetPath) {
                                deleteUrl = bootstrap.baseUrl+"property/propSheet/"+util.vc.encodeVersionedPath(self.propSheetPath)+".-1/propValues/"+encodeURIComponent(item.name);
                            }
                            else if (self.deleteUrl) {
                                deleteUrl = self.deleteUrl.replace("{propertyName}", encodeURIComponent(item.name));
                            }
                            else {
                                deleteUrl = bootstrap.baseUrl+"property/propSheet/"+self.propSheetId+"/propValues/"+encodeURIComponent(item.name);
                            }
                            if (self.propSheetVersion) {
                                self.deleteHeaders.version=self.propSheetVersion;
                            }

                            xhr.del({
                                url: deleteUrl,
                                headers: self.deleteHeaders,
                                load: function() {
                                    if (self.refreshHash) {
                                        navBar.setHash(self.refreshHash, false, true);
                                    } else {
                                        if (self.propSheetVersion) {
                                            if (self.propSheetVersionCount){
                                                self.propSheetVersionCount++;
                                            }
                                            self.propSheetVersion++;
                                            //Update of the current propSheet
                                            if (self.propSheet) {
                                                self.propSheet.version = self.propSheetVersion;
                                                self.propSheet.versionCount = self.propSheetVersionCount;
                                            }
                                        }
                                        self.refresh();
                                    }
                                },
                                error: function(response) {
                                    if (response.responseText) {
                                        if (response.status === 409) {
                                            var wrongVersionAlert = new Alert({
                                                message: i18n("Modifications have occured since you loaded this page, please refresh.")
                                            });
                                        }
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
                    });
                });
            }

            if (item.inherited) {
                result.innerHTML = i18n("(Inherited)");
            }

            return result;
        },

        /**
         *
         */
        showPropertyDialog: function(propValue) {
            var propSheet = this.propSheet;
            var self = this;
            var propertyDialog = new Dialog({
                title: i18n("Edit Property"),
                closable: true,
                draggable: true
            });
            var propertyForm = new EditPropValue({
                propValue: propValue,
                propSheetVersion: this.propSheetVersion,
                propSheetPath: this.propSheetPath,
                propSheetId: this.propSheetId,
                saveUrl: this.saveUrl,
                addData: this.addData,
                callback: function(response) {
                    if (response) {
                        if (response.status > 399) {
                            //failed save attempt
                            if (response.status === 409) {
                                var wrongVersionAlert = new Alert({
                                    message: i18n("Modifications have occured since you loaded this page please refresh.")
                                });
                            }
                            else if (response.responseText){
                                var errorAlert = new Alert({
                                    message: util.escape(response.responseText)
                                });
                            }
                            if (self.refreshHash) {
                                navBar.setHash(self.refreshHash, true, false);
                            }
                            if (self.grid && self.refreshHash) {
                                self.grid.refresh = function() {
                                    navBar.setHash(self.refreshHash, false, true);
                                };
                            }
                        } else {
                            propertyDialog.hide();
                            propertyDialog.destroy();
                            if (self.refreshHash) {
                                navBar.setHash(self.refreshHash, false, true);
                            }
                            else {
                                if (self.propSheetVersion){
                                    self.propSheetVersion++;
                                    if (self.propSheetVersionCount){
                                        self.propSheetVersionCount++;
                                    }
                                    //Update of the current propSheet
                                    if (self.propSheet){
                                        self.propSheet.version = self.propSheetVersion;
                                        self.propSheet.versionCount = self.propSheetVersionCount;
                                    }
                                }
                                self.refresh();
                            }
                        }
                    }
                    else {
                        propertyDialog.hide();
                        propertyDialog.destroy();
                    }
                }
            });
            propertyForm.placeAt(propertyDialog.containerNode);
            propertyDialog.show();
        },

        /**
         *
         */
        showBatchEdit: function() {
            var self = this;
            this.clearWidgets();
            this.form = new ColumnForm({
                submitUrl: this.saveBatchAllUrl,
                version: this.propSheetVersion,
                addData: this.addData,
                onError: function(response) {
                    if (response.status === 409) {
                        var wrongVersionAlert = new Alert({
                            message: i18n("Modifications have occured since you loaded this page, please refresh.")
                        });
                    }
                    else {
                        var errorAlert = new Alert({
                            message: util.escape(response.responseText)
                        });
                    }
                    if (self.refreshHash) {
                        navBar.setHash(self.refreshHash, true, false);
                    }
                },
                postSubmit: function(data) {
                    if (self.refreshHash) {
                        navBar.setHash(self.refreshHash, false, true);
                    }
                    else {
                        if (self.propSheetVersion) {
                            self.propSheetVersion++;
                            if (self.propSheetVersionCount) {
                                self.propSheetVersionCount++;
                            }
                            //Update the propSheet (if we have one)
                            if (self.propSheet) {
                                self.propSheet.version = self.propSheetVersion;
                                self.propSheet.versionCount = self.propSheetVersionCount;
                            }
                        }
                        var successAlert = new Alert({
                            message: i18n("Saved changes successfully")
                        });
                        self.refresh();
                    }
                },
                getData: function() {
                    var self = this;
                    var result = {};
                    // Iterate through all fields, putting all current values into the result object.
                    array.forEach(this.fieldsArray, function(field) {
                        var value = self.getValueByField(field);
                        if (value !== undefined && value !== null) {
                                if ( field.name === "properties" ) {
                                    value.replace(/\\n/g, "\n");
                                }
                                result[field.name] = value;
                        }
                    });

                    if (this.addData) {
                        this.addData(result);
                    }
                    return result;
                },
                readOnly: self.readOnly || self.oldVersion,
                cancelLabel: null
            });
            self.form.placeAt(self.formAttach);

            var switchLink = document.createElement("a");
            switchLink.onclick = function() {
                self.showTable();
            };
            switchLink.innerHTML = i18n("Use Table Mode");
            switchLink.className = "linkPointer";
            var switchLinkWidget = new DomNode();
            switchLinkWidget.domAttach.appendChild(switchLink);
            self.form.addField({
                name: "_switchLink",
                label: "",
                widget: switchLinkWidget
            });

            xhr.get({
                url: this.gridRestUrl,
                handleAs: "json",
                load: function(data) {
                    if (data.version) {
                        data = data.properties;
                    }
                    var textContent = "";
                    array.forEach(data, function(propValue) {
                        textContent += propValue.name.replace(/\\/g,"\\\\")
                                            // Replace the new lines with \n\ + a new line
                                            // for visibility. Java Util Properties will
                                            // handle the extra new line
                                           .replace(/\n/g, "\\n\\\n")
                                           .replace(/\=/g, "\\=")
                                           .replace(/:/g, "\\:")
                                           .replace(/ /g, "\\ ")
                                       +"="+
                                       propValue.value.replace(/\\/g, "\\\\")
                                           .replace(/\n/g, "\\n\\\n")
                                           .replace(/\=/g, "\\=")
                                           .replace(/:/g, "\\:")
                                       +"\n";
                    });

                    self.form.addField({
                        name: "properties",
                        label: i18n("Properties"),
                        description: i18n("Edit properties as a batch. Properties should be defined in Java.util.Properties format."),
                        required: true,
                        type: "Text Area",
                        style: {
                            width: "300px",
                            height: "200px"
                        },
                        value: textContent
                    });
                }
            });
        },
        /**
         *
         */
        addData: function(data) {
            // Placeholder
        }
    });
});

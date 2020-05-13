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
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/xhr",
        "dojo/dom-construct",
        "dojo/on",
        "js/webext/widgets/Alert",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/DomNode"
        ],
function(
        _TemplatedMixin,
        _Widget,
        array,
        declare,
        lang,
        xhr,
        domConstruct,
        on,
        Alert,
        ColumnForm,
        GenericConfirm,
        DomNode
) {
    /**
     *
     */
    return declare('deploy.widgets.property.PropSheetDefValues',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="propSheetDefValues">'+
                '<div class="versionLinks" data-dojo-attach-point="versionAttach"></div>' +
                '<div data-dojo-attach-point="detailAttach"></div>'+
            '</div>',

        noPropertiesMessage: i18n("No properties have been defined."),
        oldVersion: false,
        showVersions: false,

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            if (this.propSheetDef) {
                if (this.propSheetDef.versioned) {
                    this.propSheetDefPath = this.propSheetDef.path;
                    this.propSheetDefVersion = this.propSheetDef.version;
                }
                else {
                    this.propSheetDefId = this.propSheetDef.id;
                }
            }

            if (this.propSheet && this.propSheet.versioned) {
                this.propSheetVersionCount = this.propSheet.versionCount;
                this.propSheetVersion = this.propSheet.version;
            }
            if (this.propSheetVersion && this.propSheetVersionCount) {
                if (this.propSheetVersion < this.propSheetVersionCount) {
                    self.oldVersion = true;
                }
                this.showVersionLinks();
            }
            if (this.propSheetPath && !this.propSheetVersion) {
                xhr.get({
                    url: bootstrap.baseUrl+"property/propSheet/"+util.vc.encodeVersionedPath(this.propSheetPath)+".-1",
                    handleAs: "json",
                    load: function(data) {
                        self.propSheetVersion = data.version;
                        self.initializePage();
                    }
                });
            }
            else {
                self.initializePage();
            }
        },

        initializePage : function() {
            var self = this;
            self.generateUrls();

            xhr.get({
                url: this.getDefsUrl,
                handleAs: "json",
                load: function(propDefs) {
                    if (propDefs.length > 0) {
                        self.propDefs = propDefs;
                        self.showForm();
                    }
                    else {
                        var noPropertiesMessage = document.createElement("div");
                        noPropertiesMessage.style.marginLeft = "30px";
                        noPropertiesMessage.innerHTML = self.noPropertiesMessage;
                        self.detailAttach.appendChild(noPropertiesMessage);
                    }
                }
            });
        },

        generateUrls : function() {
            if (this.propSheetDefId) {
                this.getDefsUrl = bootstrap.baseUrl+"property/propSheetDef/"+this.propSheetDefId+"/propDefs";
            }
            else if (this.propSheetDefPath) {
                this.getDefsUrl = bootstrap.baseUrl+"property/propSheetDef/"+util.vc.encodeVersionedPath(this.propSheetDefPath);
                if (this.propSheetDefVersion) {
                    this.getDefsUrl = this.getDefsUrl + "." + this.propSheetDefVersion + "/propDefs";
                }
                else {
                    this.getDefsUrl = this.getDefsUrl + ".-1/propDefs";
                }
            }

            if (this.propSheetId) {
                this.getValuesUrl = bootstrap.baseUrl+"property/propSheet/"+this.propSheetId+"/propValues";
                this.saveValuesUrl = bootstrap.baseUrl+"property/propSheet/"+this.propSheetId+"/allPropValues";
            }
            else if (this.propSheetPath) {
                this.getValuesUrl = bootstrap.baseUrl+"property/propSheet/"+util.vc.encodeVersionedPath(this.propSheetPath)+"."+this.propSheetVersion;
                this.saveValuesUrl = bootstrap.baseUrl+"property/propSheet/"+util.vc.encodeVersionedPath(this.propSheetPath)+"."+this.propSheetVersion+"/allPropValues";
                this.saveBatchValuesUrl = bootstrap.baseUrl+"property/propSheet/"+util.vc.encodeVersionedPath(this.propSheetPath)+"."+this.propSheetVersion+"/allPropValuesFromBatch";
            }
        },

        /**
         *
         */
        destroy: function() {
            this.inherited(arguments);

            if (this.form !== undefined) {
                this.form.destroy();
            }
        },

        /**
         *
         */
        showForm: function() {
            var self = this;
            this.batchLoaded = false;
            var propDefs = this.propDefs;

            if (self.form !== undefined) {
                self.form.destroy();
            }
            if (self.propSheetVersion) {
                self.version = self.propSheetVersion;
            }

            self.form = new ColumnForm({
                submitUrl: self.saveValuesUrl,
                version: self.version,
                postSubmit: function(data) {
                    if (self.refreshHash) {
                        navBar.setHash(self.refreshHash, false, true);
                    }
                    else {
                        var alert = new Alert({
                            message: i18n("Properties saved.")
                        });
                        if (self.version) {
                            self.version++;
                        }
                        if (self.propSheetVersion && !this.showVersions){
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
                },
                onError: function(response) {
                    if (self.onError === undefined) {
                        if (response.responseText) {
                            if (response.status === 409) {
                                var wrongVersionAlert = new Alert({
                                    message: i18n("Modifications have occurred since you loaded this page, please refresh.")
                                });
                            }
                            else if (response.status === 405) {
                                var validationFailedAlert = new Alert({
                                    message: i18n(response.responseText)
                                });
                            }
                             if (self.refreshHash) {
                                navBar.setHash (self.refreshHash, true, false);
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
                    else {
                        self.onError(response);
                    }
                },
                readOnly: self.readOnly || this.oldVersion,
                cancelLabel: null
            });
            self.form.placeAt(self.detailAttach);

            var switchLink = document.createElement("a");
            switchLink.onclick = function() {
                self.showBatchEdit();
            };
            switchLink.innerHTML = i18n("Use Batch Edit Mode");
            switchLink.className = "linkPointer";
            var switchLinkWidget = new DomNode();
            switchLinkWidget.domAttach.appendChild(switchLink);
            self.form.addField({
                name: "_switchLink",
                label: "",
                widget: switchLinkWidget
            });

            xhr.get({
                url: self.getValuesUrl,
                handleAs: "json",
                load: function(data) {
                    self.form.version = data.version;
                    array.forEach(propDefs, function(propDef) {
                        var propDefCopy = lang.clone(propDef);
                        util.populatePropValueAndLabel(data.properties, propDefCopy);
                        propDefCopy.description = (!propDef.pattern) ? propDef.description : i18n("%s Required Pattern: %s", propDef.description, propDef.pattern);
                        self.form.addField(propDefCopy);
                    });
                }
            });
        },

        /**
         *
         */
        showBatchEdit: function() {
            var self = this;
            this.batchLoaded = true;
            var propDefs = this.propDefs;

            if (self.form !== undefined) {
                self.form.destroy();
            }

            self.form = new ColumnForm({
                submitUrl: self.saveBatchValuesUrl,
                version: self.propSheetVersion,
                addData: function() {
                    var self = this;
                    var result = {};
                    // Iterate through all fields, putting all current values into the result object.
                    array.forEach(this.fieldsArray, function(field) {
                        var value = self.getValueByField(field);
                        if (value) {
                            if (field.name === "properties") {
                                value = value.replace(/\\n/g, "\n");
                            }
                            result[field.name] = value;
                        }
                    });
                    return result;
                },
                postSubmit: function(data) {
                    if (self.refreshHash) {
                        navBar.setHash(self.refreshHash, false, true);
                    }
                    else {
                        var alert = new Alert({
                            message: i18n("Properties saved.")
                        });
                        if (self.version) {
                            self.version++;
                        }
                        if (self.propSheetVersion && !this.showVersions){
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
                },
                onError: function(response) {
                    if (self.onError === undefined) {
                        if (response.responseText) {
                            if (response.status === 409) {
                                var wrongVersionAlert = new Alert({
                                    message: i18n("Modifications have occured since you loaded this page, please refresh.")
                                });
                            }
                            else if (response.status === 405) {
                                var validationFailedAlert = new Alert({
                                    message: i18n(response.responseText)
                                });
                            }
                             if (self.refreshHash) {
                                navBar.setHash (self.refreshHash, true, false);
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
                    else {
                        self.onError(response);
                    }
                },
                readOnly: self.readOnly || this.oldVersion,
                cancelLabel: null
            });
            self.form.placeAt(self.detailAttach);

            var switchLink = document.createElement("a");
            switchLink.onclick = function() {
                self.showForm();
            };
            switchLink.innerHTML = i18n("Use Property Form Mode");
            switchLink.className = "linkPointer";
            var switchLinkWidget = new DomNode();
            switchLinkWidget.domAttach.appendChild(switchLink);
            self.form.addField({
                name: "_switchLink",
                label: "",
                widget: switchLinkWidget
            });

            xhr.get({
                url: self.getValuesUrl,
                handleAs: "json",
                load: function(data) {
                    self.form.version = data.version;
                    var textContent = "";
                    array.forEach(propDefs, function(propDef) {
                        var value = util.getNamedPropertyValue(data.properties, propDef.name);
                        var name = propDef.name;
                        if (value === undefined) {
                            value = propDef.value;
                        }
                        name = name.replace(/\\/g,"\\\\")
                                   .replace(/\n/g, "\\n\\\n")
                                   .replace(/\=/g, "\\=")
                                   .replace(/:/g, "\\:")
                                   .replace(/ /g, "\\ ");

                        value = value.replace(/\\/g, "\\\\")
                                     .replace(/\n/g, "\\n\\\n")
                                     .replace(/\=/g, "\\=")
                                     .replace(/:/g, "\\:");
                        textContent += name+"="+value+"\n";
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
       showVersionLinks: function() {
           var self = this;

           domConstruct.empty(this.versionAttach);

           if (this.propSheetVersion && this.propSheetVersionCount && this.showVersions) {
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

                   if (!this.readOnly && this.oldVersion) {
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
            var self = this;
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
            if (this.batchLoaded) {
                this.showBatchEdit();
            }
            else {
                this.showForm();
            }
        }
    });
});
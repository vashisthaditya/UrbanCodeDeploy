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
        "dijit/registry",
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/_base/window",
        "dojo/dnd/Source",
        "dojo/dom",
        "dojo/dom-geometry",
        "dojo/dom-construct",
        "dojo/dom-style",
        "dojo/on",
        "js/webext/widgets/Alert",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/table/TreeTable",
        "js/webext/widgets/form/MenuButton",
        "js/webext/widgets/ColumnForm",
        "deploy/widgets/version/VersionSelect",
        "deploy/widgets/version/VersionDisplay"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        registry,
        array,
        declare,
        xhr,
        window,
        Source,
        dom,
        domGeom,
        domConstruct,
        domStyle,
        on,
        Alert,
        Dialog,
        GenericConfirm,
        TreeTable,
        MenuButton,
        ColumnForm,
        VersionSelect,
        VersionDisplay
) {
    /**
     * A widget to select component versions for an application process request.
     *
     * Supported properties:
     *  snapshot / Object                   The snapshot to view versions for
     *  environment / Object                A predefined environment to select
     */
    return declare('deploy.widgets.snapshot.SnapshotVersionSelection',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="versionSelector" style="margin-top:15px;">'+
                '<div data-dojo-attach-point="buttonAttach" class="inlineBlock"></div>' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',

        versionDisplays: {},

        postCreate: function() {
            var self = this;
            this.originalCompVersions = [];
            this.createVersionForm();
        },

        //creates the dialog and calls all other functions to populate it
        createVersionForm: function () {
            var self = this;

            this.createVersionTable();

            if (!self.snapshot.versionsLocked) {
                this.addSelectForAll();
                this.addRevertButton();
                this.addLockButton();
            }
        },

        showNameDialog: function(requestUrlBase) {
            // create a dialog with a field for name of version to add to the components
            var self = this;
            if (this.nameDialog) {
                this.nameDialog.destroy();
            }
            if (this.nameForm) {
                this.nameForm.destroy();
            }

            this.nameDialog = new Dialog({
                title: i18n("Add Versions With Name...")
            });

            domConstruct.create("div", {
                "innerHTML": i18n("Warning: This action will remove any existing versions from the snapshot."),
                "style": {
                    "fontWeight": "bold",
                    "padding": "3px 15px",
                    "marginLeft": "150px"
                }
            }, this.nameDialog.containerNode);

            this.nameForm = new ColumnForm({
                postSubmit: function(data) {
                    self.nameDialog.destroy();
                    self.nameForm.destroy();
                },
                onCancel: function() {
                    self.nameDialog.destroy();
                    if (self.nameForm) {
                        self.nameForm.destroy();
                    }
                },
                onSubmit: function(data) {
                    if (data) {
                        var requestUrl = requestUrlBase+'/'+data.name;
                        xhr.put({
                            url: requestUrl,
                            handleAs: "json",
                            load: function(data) {
                                self.grid.refresh();
                            },
                            error: function(error) {
                                var alert = new Alert({
                                    messages: [i18n("Error adding component versions:"),
                                               "",
                                               util.escape(error.responseText)]
                                });
                            }
                        });
                    }
                }
            });

            /* add the required name field */
            var nameField = this.nameForm.addField({
                name: "name",
                label: i18n("Name"),
                required: true,
                type: "Text",
                description: i18n("Use * as a wildcard. Without wildcard character, exact match is used.")
            });

            this.nameForm.placeAt(this.nameDialog.containerNode);
            this.nameDialog.show();
        },

        /**
         *
         */
        showCopyFromEnvironmentDialog: function() {
            var self = this;

            var dialog = new Dialog({
                title: i18n("Copy Versions from Environment")
            });

            domConstruct.create("div", {
                "innerHTML": i18n("Warning: This action will remove any existing versions from the snapshot."),
                "style": {
                    "fontWeight": "bold",
                    "padding": "3px 15px",
                    "marginLeft": "150px"
                }
            }, dialog.containerNode);

            var form = new ColumnForm({
                submitUrl: null,
                postSubmit: function(data) {
                    dialog.hide();
                    dialog.destroy();
                    self.grid.refresh();
                },
                onCancel: function() {
                    dialog.hide();
                    dialog.destroy();
                }
            });

            form.addField({
                name: "environmentId",
                label: i18n("Environment"),
                type: "TableFilterSelect",
                required: true,
                url: bootstrap.restUrl+"deploy/environment",
                defaultQuery: {
                    filterFields: ["application.id", "active"],
                    "filterType_application.id": "eq",
                    "filterValue_application.id": self.applicationId,
                    filterType_active: "eq",
                    filterValue_active: true,
                    filterClass_active: "Boolean"
                },
                onChange: function(value, item) {
                    if (item) {
                        form.submitUrl = bootstrap.restUrl+"deploy/snapshot/"+self.snapshot.id+"/versions/fromEnvironment/"+item.id;
                    }
                },
                allowNone: false
            });

            form.placeAt(dialog.containerNode);
            dialog.show();
        },

        /**
        *
        */
       showCreateCompressedVersionDialog: function(item) {
           var self = this;
           if (this.versionNameDialog) {
               this.versionNameDialog.destroy();
           }
           if (this.versionNameForm) {
               this.versionNameForm.destroy();
           }
           this.versionNameDialog = new Dialog({
               title: i18n("Create merged version for component %s", item.name)
           });

           this.versionNameForm = new ColumnForm({
               submitUrl: null,
               preSubmit: function(data) {
                   self.versionNameForm.submitUrl = bootstrap.restUrl+'deploy/snapshot/'
                     +self.snapshot.id+'/createCompressedVersion/'
                     +item.zosComponentId+'/'+util.encodeIgnoringSlash(data.version);
               },
               postSubmit: function(data) {
                   self.versionNameDialog.destroy();
                   self.versionNameForm.destroy();
                   navBar.setHash("version/"+data.id, false, true);
               },
               onCancel: function() {
                   self.versionNameDialog.destroy();
                   if (self.versionNameForm) {
                       self.versionNameForm.destroy();
                   }
               },
               onError: function(error) {
                   var alert = new Alert({
                       messages: [i18n("Error merging component versions:"),
                                   "",
                                   util.escape(error.responseText)]
                   });
               }
            });

           /* add the required name field */
           var nameField = this.versionNameForm.addField({
               name: "version",
               label: i18n("Version Name"),
               required: true,
               type: "Text",
               description: i18n("The version name for the merged version.")
           });

           this.versionNameForm.placeAt(this.versionNameDialog.containerNode);
           this.versionNameDialog.show();
       },

        /**
         *
         */
        showCopyFromSnapshotDialog: function() {
            var self = this;

            var dialog = new Dialog({
                title: i18n("Copy Versions from Snapshot")
            });

            domConstruct.create("div", {
                "innerHTML": i18n("Warning: This action will remove any existing versions from the snapshot."),
                "style": {
                    "fontWeight": "bold",
                    "padding": "3px 15px",
                    "marginLeft": "150px"
                }
            }, dialog.containerNode);

            var form = new ColumnForm({
                submitUrl: null,
                postSubmit: function(data) {
                    dialog.hide();
                    dialog.destroy();
                    self.grid.refresh();
                },
                onCancel: function() {
                    dialog.hide();
                    dialog.destroy();
                }
            });

            form.addField({
                name: "snapshotId",
                label: i18n("Snapshot"),
                type: "TableFilterSelect",
                url:  bootstrap.restUrl+"deploy/application/"+self.applicationId+"/snapshots/false",
                onChange: function(value, item) {
                    if (item) {
                        form.submitUrl = bootstrap.restUrl+"deploy/snapshot/"+self.snapshot.id+"/versions/fromSnapshot/"+item.id;
                    }
                },
                defaultQuery: {
                    filterFields: ["id"],
                    filterType_id: "ne",
                    filterValue_id: self.snapshot.id,
                    filterClass_id: "UUID"
                }
            });

            form.placeAt(dialog.containerNode);
            dialog.show();
        },

        /* Creates the menu button to apply options to all components
         * Options include:
         *      Latest versions - finds the latest version for each component and adds them, if it exists
         *      Currently Deployed - adds all the latest desired versions in the inventory in the environment
         *      None (Clear All) - this removes all versions the user has selected so far
         */
        addSelectForAll: function() {
            //create a select for choosing latest version for all
            var self = this;

            var selectAllOptions = [{
                label: i18n("Latest Available"),
                onClick: function() {
                    self.addLatestVersions(bootstrap.restUrl+'deploy/snapshot/'+self.snapshot.id+'/latestVersions');
                }
            },{
                label: i18n("Copy From Environment..."),
                onClick: function() {
                    self.showCopyFromEnvironmentDialog();
                }
            },{
                label: i18n("Copy From Snapshot..."),
                onClick: function() {
                    self.showCopyFromSnapshotDialog();
                }
            },{
                label: i18n("Versions With Name..."),
                onClick: function() {
                    self.showNameDialog(bootstrap.restUrl+'deploy/snapshot/'+self.snapshot.id+'/versions');
                }
            },{
                label: i18n("None (Clear All)"),
                onClick: function() {
                    self.removeAllVersions();
                }
            }];
            this.applyAllSelect = new MenuButton({
                options: selectAllOptions,
                label: i18n("Select For All...")
            });
            this.applyAllSelect.placeAt(self.buttonAttach);
        },

        /**
         * Resets the snapshot versions to original page load
         */
        addRevertButton: function() {
            var self = this;

            var revertButton = new Button({
                label: i18n("Revert"),
                title: i18n("Reverts To Versions From Original Page Load"),
                onClick: function() {
                    array.forEach(self.grid.cachedData, function(item) {
                        item.desiredVersions = [];
                    });

                    array.forEach(self.originalCompVersions, function(item) {
                        array.forEach(item.desiredVersions, function (version) {
                            self.addVersion(version.id, version, item);
                        });
                    });
                    self.saveVersions();
                }
            });

            revertButton.placeAt(this.buttonAttach);
        },

        /**
         * Locks the snapshot and sets this widget as read-only
         */
        addLockButton: function() {
            var self = this;

            var lockButton = new Button({
                label: i18n("Lock Versions"),
                onClick: function() {
                    var lockConfirm = new GenericConfirm({
                        message: i18n("Are you sure you want to lock the versions on this snapshot? " +
                                "This will prevent any further changes to the list of versions " +
                                "included in this snapshot. Once locked, it cannot be unlocked."),
                        action: function() {
                            self.grid.block();

                            xhr.put({
                                url: bootstrap.restUrl+"deploy/snapshot/"+self.snapshot.id+"/versions/lock"
                            }).then(function() {
                                // Set to read only and remove all buttons, because the versions
                                // can no longer be modified.
                                self.readOnly = true;
                                domConstruct.empty(self.buttonAttach);

                                self.grid.refresh();
                            }, function(response) {
                                // On error...
                                self.grid.unblock();
                                var errorAlert = new Alert({
                                    message: i18n("Error locking snapshot versions: %s", util.escape(response.responseText))
                                });
                            });
                        }
                    });
                }
            });

            lockButton.placeAt(this.buttonAttach);
        },

        /* Creates the table for viewing components, currently deployed versions,
         * and column to select versions to deploy in the application process
         * This is where all the event listeners for the version select reside
         */
        createVersionTable: function() {
            var self = this;
            var gridRestUrl = bootstrap.restUrl+'deploy/snapshot/'+this.snapshot.id+'/versions';
            var noDataMessage = i18n("No components found on the snapshot.");
            if (this.grid) {
                this.grid.destroy();
            }

            var gridLayout = [{
                name: i18n("Component"),
                field: "name",
                orderField: "name",
                filterField: "name",
                filterType: "text",
                getRawValue: function(item) {
                    return item.name;
                },
                formatter: function(item, value, cell) {
                    var displayName = item.name;
                    if (item.zosContainerType) {
                        displayName += " [" + item.zosContainerType;
                        if (item.membersCount) {
                            if (item.zosContainerType === "directory") {
                                displayName += ", " + item.membersCount + " " + i18n("files");
                            }
                            else if (item.zosContainerType === "PDS"){
                                displayName += ", " + item.membersCount + " " + i18n("members");
                            }
                        }
                        displayName += "]";
                    }

                    if (item.zosComponentId && !item.isZosArtifact) {
                        cell.style.position = "relative";

                        var result = domConstruct.create("div", {
                            "class": "inlineBlock",
                            "style": "margin-" + (domGeom.isBodyLtr()?"right":"left") + ":78px;"
                        });
                        var itemWrapper = domConstruct.create("div", {
                            "class": "inlineBlock",
                            "innerHTML": displayName
                        });
                        domConstruct.place(itemWrapper, result);
                        domConstruct.place(self.actionsFormatter(item), result);
                        return result;
                    }

                    return displayName;
                }
            },{
                name: i18n("Versions"),
                formatter: function(item, value, cell) {
                    if (item.isZosArtifact) {
                        return item.versionsWithTheArtifact;
                    }

                    domStyle.set(cell, "width", "50%");
                    var _self = this;

                    //for each version that is already selected, put here
                    self.clearDisplays(item.id);
                    var result = domConstruct.create("div", {"class": "snapshot-version-selection"});
                    var tagAttach = domConstruct.create("div", {
                        "class": "inlineBlock",
                        "id": "tagAttach_" + item.id
                    }, result);
                    var tagAttachSource = new Source(tagAttach, {
                        item: item,
                        copyOnly: false,
                        copyState: function() {
                            return false;
                        },
                        horizontal: true,
                        onDndDrop: function(source, nodes, copy, target) {
                            // Don't process the event if it's not for this Source
                            if(this === source && this === target){
                                var versionList = this.item.desiredVersions;
                                // There can be only one
                                var node = nodes[0];
                                var currentVersion = registry.byId(node.id).version;
                                var currentIndex = array.indexOf(versionList, currentVersion);
                                // Index should never be -1
                                if (currentIndex !== -1) {
                                    versionList.splice(currentIndex, 1);
                                }
                                var targetVersion = registry.byId(target.current.id).version;
                                var insertIndex = array.indexOf(versionList, targetVersion);
                                if (insertIndex !== -1) {
                                    // Index should never be -1
                                    if (!target.before) {
                                        insertIndex++;
                                    }
                                    // Insert the dragged item
                                    versionList.splice(insertIndex, 0, currentVersion);
                                }
                                self.clearDisplays(this.item.id);
                                self.displayVersions(this.item, tagAttach);
                                self.saveVersions();
                            }
                            this.onDndCancel();
                        }
                    });
                    tagAttach.source = tagAttachSource;
                    var selectorAttach = domConstruct.create("div", {
                        "class": "selectorAttach"
                    }, tagAttach, "before");

                    if (!self.readOnly) {
                        var add = domConstruct.create("div", {
                            "innerHTML": i18n("Add..."),
                            "class": "inlineBlock linkPointer"
                        }, result);

                        //attach the version selection widget
                        self.addEvent = on(add, "click", function(e) {
                            var _this = this;

                            if (_this.selector) {
                                _this.selector.destroy();
                            }
                            _this.selector = new VersionSelect({
                                component: item,
                                environment: self.environment,
                                allowInvalidVersions: self.allowInvalidVersions
                            });

                            _this.selector.placeAt(dojo.body());

                            var pos = domGeom.position(add);
                            var bodyPos = domGeom.position(dojo.body());
                            var selectorW = 0;
                            array.forEach(this.selector.versionAttach.children, function(child) {
                               var childPos = domGeom.position(child);
                               selectorW += childPos.w;
                            });
                            selectorW+=22;

                            var minLeft = (bodyPos.w - selectorW) - 8;
                            var left = Math.min(pos.x, minLeft);
                            dojo.style(this.selector.versionAttach,  {
                                position: "fixed",
                                top: pos.y + "px",
                                left: left + "px"
                            });

                            if (_this.selector.versionSelect && _this.selector.versionSelect.dropDown){
                                var dropDown = _this.selector.versionSelect.dropDown;
                                if (dropDown.focusNode){
                                    dropDown.focusNode.focus();
                                }
                            }

                            //connect to the rest select change
                            on(_this.selector.versionSelect, "add", function(value) {
                                if (value) {
                                    self.addVersion(value.id, value, item);
                                }
                            });

                            on(_this.selector.versionSelect, "remove", function(value) {
                                if (value) {
                                    self.unAddVersion(value.id, value, item);
                                }
                            });

                            on(_this.selector.latest, "click", function(e) {
                                self.addLatestVersion(bootstrap.restUrl+"deploy/component/"+
                                        item.id+"/latestVersion", item, tagAttach);
                                if(_this.selector) {
                                    _this.selector.destroy();
                                }
                            });

                            // Only destroy on click if the click is provably outside the widget
                            // NOTE: Typically, attaching listeners to globals is BAD. In this case,
                            // however, the alternative would be intrusive and more prone to regressions.
                            // It's safe to do this here because "on" is additive (we won't be stomping
                            // on existing listeners) and the listener will be cleaned up when the widget
                            // is destroyed because of the call to "own".
                            var windowClickListener = on(window.doc, "click", function(e) {
                                if (_this.selector
                                        && dom.isDescendant(e.target, window.doc) // target is in DOM.
                                        && e.target !== add
                                        && !dom.isDescendant(e.target, _this.selector.versionAttach)
                                        // The parent of the selector attach and the dropdown (sibling) is the body
                                        // of the page.
                                        && !dom.isDescendant(e.target, _this.selector.versionAttach.nextSibling)) {
                                    _this.selector.destroy();
                                    windowClickListener.remove();
                                    self.saveVersions();
                                }
                            });
                            _this.selector.own(windowClickListener);
                        });
                    }

                    self.displayVersions(item, tagAttach);

                    return result;
                }
            }];

            self.grid = new TreeTable({
                url: gridRestUrl,
                processXhrResponse: function(data) {
                    if (self.originalCompVersions !== null && self.originalCompVersions.length <= 0) {
                        self.originalCompVersions = data;
                    }
                },
                serverSideProcessing: false,
                columns: gridLayout,
                noDataMessage: noDataMessage,
                hidePagination: false,
                hideFooterLinks: true,
                hideExpandCollapse: true,
                getChildUrl: function(item) {
                    var returnUrl = bootstrap.restUrl + 'deploy/snapshot/' +
                            self.snapshot.id + '/' + item.zosComponentId + "/fileTree";
                    if (item.$ref) {
                        returnUrl = bootstrap.restUrl + 'deploy/snapshot/' +
                            self.snapshot.id + '/' + item.zosComponentId + "/fileTree/" +
                            util.encodeIgnoringSlash(item.$ref);
                    }

                    return returnUrl;
                }
            });

            self.grid.placeAt(self.gridAttach);
        },

        /**
         * Display the version tags for the passed component. Set up the delete listener.
         */
        displayVersions: function(compItem, attach) {
            var self = this;
            var versions = compItem.desiredVersions;

            array.forEach(versions, function(version) {
                var versionDisplay = new VersionDisplay({
                    version: version,
                    readOnly: self.readOnly,
                    onDelete: function() {
                        self.deleteVersion(version, versionDisplay);
                    }
                });
                versionDisplay.placeAt(attach);
                self.versionDisplays[compItem.id].push(versionDisplay);
                attach.source.setItem(versionDisplay.id, {"type": ["text"]});
            });
        },

        clearDisplays: function(compId) {
            var self = this;
            array.forEach(self.versionDisplays[compId], function(display) {
                display.destroy();
            });
            self.versionDisplays[compId] = [];
        },

        /**
         * Remove versions from the back end and refresh the table
         */
        deleteVersion: function(version, versionDisplay) {
            var self = this;
            xhr.del({
                url: bootstrap.restUrl+"deploy/snapshot/"+self.snapshot.id+"/versions/"+version.id,
                handleAs: "json",
                load: function(data) {
                    versionDisplay.destroy();
                    if (self.grid) {
                        self.grid.refresh();
                    }
                },
                error: function(error) {
                    var alert = new Alert({
                        messages: [i18n("Error deleting component versions:"),
                                   "",
                                   util.escape(error.responseText)]
                    });
                }
            });
        },

        /**
         * Unlike deleteVersion(), only acts as a cheap/rough opposite of addVersion().
         */
        unAddVersion: function(value, versionItem, compItem) {
            if (value) {
                var i = array.indexOf(compItem.desiredVersions, versionItem);
                if (i >= 0) {
                    compItem.desiredVersions.splice(i,1);
                }
                var displayList = this.versionDisplays[compItem.id];
                if (!!displayList) {
                    this.versionDisplays[compItem.id] = array.filter(displayList, function(display) {
                        if (display.version.id === versionItem.id) {
                            display.destroy();
                        }
                        return display.version.id !== versionItem.id;
                    });
                }
            }
        },

        addVersion: function(value, versionItem, compItem) {
            var self = this;
            if (value) {
                var cacheIndex = array.indexOf(self.grid.cachedData, compItem);
                var match = array.some(compItem.desiredVersions, function(versionId) {
                    return versionId === value;
                });
                if (!match) {
                    compItem.desiredVersions.push(versionItem);
                }
                if (cacheIndex === -1) {
                    self.grid.cachedData.push(compItem);
                }
                else {
                    self.grid.cachedData[cacheIndex] = compItem;
                }
            }
        },

        /**
         * Save the version to the back end, refresh the table
         */
        saveVersions: function() {
            var self = this;
            var dataToSubmit = {"versionIds": []};

            array.forEach(self.grid.cachedData, function(item) {
                array.forEach(item.desiredVersions, function(version) {
                    dataToSubmit.versionIds.push(version.id);
                });
            });

            xhr.put({
                url: bootstrap.restUrl+'deploy/snapshot/'+self.snapshot.id+'/versions',
                putData: JSON.stringify(dataToSubmit),
                load: function(data) {
                    self.grid.refresh();
                },
                error: function(error) {
                    var alert = new Alert({
                        messages: [i18n("Error adding component versions:"),
                                   "",
                                   util.escape(error.responseText)]
                    });
                }
            });
        },

        /* adds the latest version of a component (calls displayVersion)
         * compItem         the component object to add the latest version to
         * attach           HTML element to place the new version display tag
         *
         */
        addLatestVersions: function(/* String */ latestVersionsUrl) {
            var self = this;

            xhr.put({
                url: latestVersionsUrl,
                load: function(data) {
                    self.grid.refresh();
                },
                error: function(error) {
                    var alert = new Alert({
                        messages: [i18n("Error adding latest component versions:"),
                                   "",
                                   util.escape(error.responseText)]
                    });
                }
            });
        },

        addLatestVersion: function(latestUrl, compItem) {
            var self = this;
            xhr.get({
                url: latestUrl,
                handleAs: "json",
                load: function(data) {
                    if (data) {
                        self.addVersion(data.id, data, compItem);
                        self.saveVersions();
                    }
                }
            });
        },

        removeAllVersions: function(compId) {
            var self = this;
            var dataToSubmit = {"versionIds" : []};

            xhr.put({
                url: bootstrap.restUrl+'deploy/snapshot/'+self.snapshot.id+'/versions',
                putData: JSON.stringify(dataToSubmit),
                sync: true,
                load: function(data) {
                    self.grid.refresh();
                },
                error: function(error) {
                    var alert = new Alert({
                        messages: [i18n("Error adding component versions:"),
                                   "",
                                   util.escape(error.responseText)]
                    });
                }
            });
        },

        _getValueAttr: function() {
            var self = this;
            var data = {};
            array.forEach(self.grid.cachedData, function(component) {
                data[component.id] = component.desiredVersions;
            });
            return data;
        },

        actionsFormatter: function(item) {
            var self = this;
            var result = domConstruct.create("div", {
                "dir": util.getUIDir(),
                "align": util.getUIDirAlign(),
                "class": "tableHoverActions"
            });
            var menuActions = [{
                label: i18n("Merge"),
                onClick: function() {
                    self.showCreateCompressedVersionDialog(item);
                }}];

            if (menuActions.length) {
                var actionsButton = new MenuButton({
                    options: menuActions,
                    label: i18n("Actions...")
                });
                actionsButton.placeAt(result);
            }

            return result;
        }
    });
});

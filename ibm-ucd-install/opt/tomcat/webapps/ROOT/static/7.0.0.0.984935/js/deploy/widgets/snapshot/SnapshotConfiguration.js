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
        "dojo/_base/lang",
        "dojo/_base/xhr",
        "dojo/dom-construct",
        "dojo/on",
        "deploy/widgets/property/PropValues",
        "js/webext/widgets/Alert",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "deploy/widgets/configTemplate/EditConfigTemplate",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        array,
        declare,
        lang,
        xhr,
        domConstruct,
        on,
        PropValues,
        Alert,
        ColumnForm,
        Dialog,
        GenericConfirm,
        EditConfigTemplate,
        TreeTable
) {
    /**
     *
     */
    return declare('deploy.widgets.snapshot.SnapshotConfiguration',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="snapshotConfiguration">'+
                '<div data-dojo-attach-point="buttonAttach"></div>'+
                '<div data-dojo-attach-point="configTree"></div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            var gridRestUrl = bootstrap.restUrl+"deploy/snapshot/"+this.snapshotId+"/configurationByPath/";
            var gridLayout = [{
                    name: i18n("Name"),
                    field: "name",
                    formatter: function(item, value, cell) {
                        return i18n(item.name);
                    },
                    getRawValue: function(item) {
                        return item.name;
                    }
                },{
                    name: i18n("Version"),
                    formatter: function(item, value, cell) {
                        var result;
                        if (item.locked === true) {
                            result = item.version;
                        }
                        else {
                            if (item.version !== undefined && item.version !== null) {
                                result = i18n("Latest (%s)", item.versionCount);
                            }
                        }
                        return result;
                    }
                },{
                    name: i18n("Commit"),
                    formatter: function(item, value, cell) {
                        var result = "";
                        if (item.commit) {
                            result = i18n("%s on %s", item.commit.committer, util.dateFormatShort(item.commit.commitTime));
                        }
                        return result;
                    }
                },{
                    name: i18n("Actions"),
                    formatter: this.actionsFormatter,
                    parentWidget: this
                }];

            this.tree = new TreeTable({
                url: gridRestUrl + "base",
                serverSideProcessing: false,
                hideExpandCollapse: true,
                orderField: "name",
                noDataMessage: i18n("No configuration found."),
                columns: gridLayout,
                hasChildren: function(item) {
                    return !!item.treePath;
                },
                getChildUrl: function(item) {
                    return gridRestUrl + util.encodeIgnoringSlash(item.treePath);
                }
            });
            this.tree.placeAt(this.configTree);

            if (!this.readOnly) {
                var buttonTable = domConstruct.create("table", {
                    style: {
                        width: "620px",
                        borderSpacing: "10px",
                        borderCollapse: "separate"
                    }
                }, this.buttonAttach);




                var copyFromSnapshotRow = domConstruct.create("tr", {}, buttonTable);
                var copyFromSnapshotButtonRow = domConstruct.create("td", {}, copyFromSnapshotRow);
                var copyFromSnapshotButton = new Button({
                    "label": i18n("Copy from Snapshot"),
                    "showTitle": false,
                    "onClick": function() {
                        self.showCopyFromSnapshotDialog();
                    }
                });
                copyFromSnapshotButton.placeAt(copyFromSnapshotButtonRow);

                domConstruct.create("td", {
                    innerHTML: i18n("Copies all selected configuration versions from another snapshot.")
                }, copyFromSnapshotRow);


                var resetAllToLatestRow = domConstruct.create("tr", {}, buttonTable);
                var resetAllToLatestButtonCell = domConstruct.create("td", {}, resetAllToLatestRow);
                var latestButton = new Button({
                    "label": i18n("Reset All to Latest"),
                    "showTitle": false,
                    "onClick": function() {
                        self.showLatestDialog();
                    }
                });
                latestButton.placeAt(resetAllToLatestButtonCell);

                domConstruct.create("td", {
                    innerHTML: i18n("Updates all configuration in this snapshot so that it uses the " +
                            "latest available version of that configuration. Any additional changes " +
                            "to the configuration will also be pulled into this snapshot until it " +
                            "is locked.")
                }, resetAllToLatestRow);


                var setAllToCurrentlySelectedRow = domConstruct.create("tr", {}, buttonTable);
                var setAllToCurrentlySelectedButtonCell = domConstruct.create("td", {}, setAllToCurrentlySelectedRow);
                var latestLockButton = new Button({
                    "label": i18n("Set Latest Entries to Current"),
                    "showTitle": false,
                    "onClick": function() {
                        self.showLatestLockDialog();
                    }
                });
                latestLockButton.placeAt(setAllToCurrentlySelectedButtonCell);

                domConstruct.create("td", {
                    innerHTML: i18n("Sets all configuration in this snapshot which is currently " +
                            "marked as \"Latest\" so that it will no longer take any future changes. " +
                            "This prevents automatically absorbing configuration changes, but does " +
                            "not prevent manual changes to the version of each configuration object " +
                            "being used.")
                }, setAllToCurrentlySelectedRow);


                var lockConfigRow = domConstruct.create("tr", {}, buttonTable);
                var lockConfigButtonCell = domConstruct.create("td", {}, lockConfigRow);
                var lockConfigButton = new Button({
                    "label": i18n("Lock Configuration"),
                    "showTitle": false,
                    "onClick": function() {
                        self.showLockConfigDialog();
                    }
                });
                lockConfigButton.placeAt(lockConfigButtonCell);

                domConstruct.create("td", {
                    innerHTML: i18n("Locks all configuration to the current version selected and " +
                            "prevents any future changes. This cannot be reversed.")
                }, lockConfigRow);
            }
        },

        /**
         *
         */
        actionsFormatter: function(item) {
            var self = this.parentWidget;
            var result = document.createElement("div");

            if (item.className === "PropSheet") {
                var viewLink = domConstruct.create("a", {
                    "innerHTML": i18n("View"),
                    "class": "linkPointer actionsLink"
                }, result);
                on(viewLink, "click", function() {
                    self.showProperties(item.name, item);
                });
            }
            else if (item.className === "ComponentProcess") {
                domConstruct.create("a", {
                    "innerHTML": i18n("View"),
                    "class": "linkPointer actionsLink",
                    "href": "#componentProcess/"+item.id+"/"+item.version
                }, result);
            }
            else if (item.className === "ApplicationProcess") {
                domConstruct.create("a", {
                    "innerHTML": i18n("View"),
                    "class": "linkPointer actionsLink",
                    "href": "#applicationProcess/"+item.id+"/"+item.version
                }, result);
            }
            else if (item.className === "ApprovalProcess") {
                domConstruct.create("a", {
                    "innerHTML": i18n("View"),
                    "class": "linkPointer actionsLink",
                    "href": "#environment/"+item.environmentId+"/approvals"
                }, result);
            }
            else if (item.className === "ConfigTemplate") {
                var ctViewLink = domConstruct.create("a", {
                    "innerHTML": i18n("View"),
                    "class": "linkPointer actionsLink"
                }, result);
                on(ctViewLink, "click", function() {
                    self.showConfigTemplate(item.name, item);
                });
            }

            if (item.path && !self.readOnly) {
                var setVersionLink = domConstruct.create("a", {
                    "innerHTML": i18n("Set Version"),
                    "class": "linkPointer actionsLink"
                }, result);
                on(setVersionLink, "click", function() {
                    self.showSetVersion(item);
                });
            }

            return result;
        },

        /**
         *
         */
        showProperties: function(name, propSheet) {
            var propertiesDialog = new Dialog({
                title: i18n("Property Details: %s", util.escape(name)),
                closable: true,
                draggable: true,
                style: {
                    "width": "500px"
                }
            });

            var propertyList = new PropValues({
                propSheet: propSheet,
                showDescription: false,
                readOnly: true
            });

            propertyList.placeAt(propertiesDialog.containerNode);
            propertiesDialog.show();
        },

        showConfigTemplate: function(name, configTemplate) {
            var self = this;
            var title = i18n("View Configuration Template: %s", util.escape(name));
            var dialog = new Dialog({
                "title": title,
                closable: true,
                dtaggable: true
            });
            var configTempForm = new EditConfigTemplate({
                readOnly: true,
                component: {
                    id: configTemplate.componentId
                },
                "configTemplate": configTemplate
            });
            //refresh to force loading of the correct data for the version
            //SnapshotConfigurationBuilder returns data from the latest version no matter what
            configTempForm.refresh();
            configTempForm.placeAt(dialog.containerNode);
            dialog.show();
        },

        /**
         *
         */
        showSetVersion: function(item) {
            var self = this;

            var dialog = new Dialog({
                title: i18n("Set Version")
            });

            var commitContainer = domConstruct.create("div", {
                "style": {
                    "overflowY": "auto",
                    "maxHeight": "200px",
                    "maxWidth": "350px",
                    "paddingRight": "30px"
                }
            }, dialog.containerNode);
            dialog.show();

            xhr.get({
                url: bootstrap.restUrl+"vc/persistent/"+util.vc.encodeVersionedPath(item.path)+"/commits",
                handleAs: "json",
                load: function(data) {
                    data.reverse();
                    var version = data.length;

                    array.forEach(data, function(commit) {
                        var localVersion = lang.clone(version);

                        if (localVersion === data.length) {
                            var latestLink = domConstruct.create("a", {
                                "innerHTML": i18n("Always use latest version"),
                                "style": {
                                    "display": "block",
                                    "padding": "1px"
                                },
                                "class": "linkPointer"
                            }, commitContainer);
                            on(latestLink, "click", function() {
                                self.updateConfigurationVersion(dialog, item, localVersion, commit, true);
                            });
                        }

                        var commitLink = domConstruct.create("a", {
                            "innerHTML": i18n("%s: %s on %s", version, commit.committer, util.dateFormatShort(commit.commitTime)),
                            "style": {
                                "display": "block",
                                "padding": "1px"
                            },
                            "class": "linkPointer"
                        }, commitContainer);
                        on(commitLink, "click", function() {
                            self.updateConfigurationVersion(dialog, item, localVersion, commit);
                        });

                        version--;
                    });
                }
            });
        },

        /**
         *
         */
        showCopyFromSnapshotDialog: function() {
            var self = this;

            var dialog = new Dialog({
                title: i18n("Copy Configuration from Snapshot")
            });

            domConstruct.create("div", {
                "innerHTML": i18n("Warning: This action will remove any existing configuration from the snapshot."),
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
                    self.tree.refresh();
                },
                onCancel: function() {
                    dialog.hide();
                    dialog.destroy();
                }
            });

            form.addField({
                name: "snapshotId",
                label: i18n("Snapshot"),
                required: true,
                type: "TableFilterSelect",
                url: bootstrap.restUrl+"deploy/application/"+this.applicationId+"/snapshots/false",
                autoSelectFirst: true,
                onChange: function(value, item) {
                    if (item) {
                        form.submitUrl = bootstrap.restUrl+"deploy/snapshot/"+self.snapshotId+"/configuration/fromSnapshot/"+item.id;
                    }
                },
                defaultQuery: {
                    filterFields: ["id"],
                    "filterType_id": "ne",
                    "filterValue_id": self.snapshotId
                }
            });

            form.placeAt(dialog.containerNode);
            dialog.show();
        },

        /**
         *
         */
        updateConfigurationVersion: function(dialog, item, version, commit, latest) {
            var self = this;

            var versionToSet = version;
            if (latest) {
                versionToSet = -1;
            }

            xhr.put({
                url: bootstrap.restUrl+"deploy/snapshot/"+self.snapshotId+"/configuration/"+util.vc.encodeVersionedPath(item.path)+"/"+versionToSet,
                load: function(data) {
                    self.tree.refreshSiblingsForItem(item);

                    dialog.hide();
                    dialog.destroy();
                },
                error: function(error) {
                    var alert = new Alert({
                        messages: [i18n("Error setting snapshot configuration version:"),
                                   "",
                                   util.escape(error.responseText)]
                    });

                    dialog.hide();
                    dialog.destroy();
                }
            });
        },

        /**
         *
         */
        showLatestDialog: function() {
            var self = this;

            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to reset all configuration to the latest version?"),
                action: function() {
                    self.tree.block();
                    xhr.del({
                        url: bootstrap.restUrl+"deploy/snapshot/"+self.snapshotId+"/configuration",
                        load: function(data) {
                            self.tree.unblock();
                            self.tree.refresh();
                        }
                    });
                }
            });
        },

        /**
         *
         */
        showLatestLockDialog: function() {
            var self = this;

            var confirm = new GenericConfirm({
                message: i18n("This action will lock all configuration which is automatically using " +
                        "the latest version available. Are you sure you want to lock all loose " +
                        "configuration targets?"),
                action: function() {
                    self.tree.block();
                    xhr.put({
                        url: bootstrap.restUrl+"deploy/snapshot/"+self.snapshotId+"/configuration/lockAllToCurrent",
                        load: function(data) {
                            self.tree.unblock();
                            self.tree.refresh();
                        }
                    });
                }
            });
        },

        showLockConfigDialog: function() {
            var self = this;

            var lockConfirm = new GenericConfirm({
                message: i18n("Are you sure you want to lock the configuration of this snapshot? " +
                        "This will prevent any further changes to the configuration selected for " +
                        "this snapshot. Once locked, it cannot be unlocked."),
                action: function() {
                    self.tree.block();

                    xhr.put({
                        url: bootstrap.restUrl+"deploy/snapshot/"+self.snapshotId+"/configuration/lock"
                    }).then(function() {
                        // Set to read only and remove all buttons, because the versions
                        // can no longer be modified.
                        self.readOnly = true;
                        domConstruct.empty(self.buttonAttach);

                        self.tree.refresh();
                    }, function(response) {
                        // On error...
                        self.tree.unblock();
                        var errorAlert = new Alert({
                            message: i18n("Error locking snapshot versions: ", util.escape(response.responseText))
                        });
                    });
                }
            });
        }
    });
});

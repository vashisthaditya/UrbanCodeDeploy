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
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/dom-style",
        "dojo/on",
        "deploy/widgets/Formatters",
        "js/webext/widgets/Alert",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/table/TreeTable",
        "deploy/widgets/version/VersionCompare",
        "deploy/widgets/component/ComponentSourceConfigHistory",
        "deploy/widgets/filter/TagFilter",
        "deploy/widgets/tag/TagDisplay"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        CheckBox,
        array,
        declare,
        xhr,
        domClass,
        domConstruct,
        domStyle,
        on,
        Formatters,
        Alert,
        ColumnForm,
        Dialog,
        GenericConfirm,
        TreeTable,
        VersionCompare,
        ComponentSourceConfigHistory,
        TagFilter,
        TagDisplay
) {
    /**
     *
     */
    return declare('deploy.widgets.component.ComponentVersions',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="versions">' +
                '<div class="listTopButtons" data-dojo-attach-point="buttonAttach"></div>' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
                '<div data-dojo-attach-point="activeBoxAttach" style="margin: 2px;"></div>' +
                '<hr>' +
                '<div data-dojo-attach-point="runningIntegrationTitleAttach" class="containerLabel"></div>' +
                '<div data-dojo-attach-point="runningIntegrationAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            var gridRestUrl = bootstrap.restUrl + "deploy/version";
            var gridLayout = [{
                name: i18n("Version"),
                formatter: Formatters.versionLinkFormatter,
                orderField: "name",
                filterField: "name",
                filterType: "text",
                getRawValue: function(item) {
                    return item.name;
                }
            },{
                name: i18n("Statuses"),
                formatter: function(item, value, cell) {
                    var result = domConstruct.create("div", {
                        "class": "inlineBlock",
                        "style": "margin-right:78px;"
                    });
                    if (item.statuses) {
                        var labelTag = new TagDisplay({
                            readOnly: true,
                            tags: item.statuses
                        });
                        labelTag.placeAt(result);
                    }
                    else {
                        return "";
                    }
                    return result;
                },
                filterField: "statuses",
                filterType: "custom",
                getFilterFields: function() {
                    var statusFilter = new TagFilter({
                        name: "statuses",
                        "class": "filter",
                        style: { "width": "80%" },
                        placeHolder: i18n("Statuses"),
                        type: "eq"
                    });

                    return [statusFilter];
                },
                getRawValue: function(item) {
                    var result = null;
                    if (item.latestStatus) {
                        result = item.latestStatus.name;
                    }
                    return result;
                }
            },{
                name: i18n("Type"),
                formatter: this.typeFormatter,
                orderField: "type",
                filterField: "type",
                filterType: "select",
                filterOptions: [{
                    label: i18n("Full"),
                    value: "FULL"
                },{
                    label: i18n("Incremental"),
                    value: "INCREMENTAL"
                }],
                getRawValue: function(item) {
                    return item.type;
                }
            },{
                name: i18n("Created By"),
                field: "creator",
                orderField: "user.name"
            },{
                name: i18n("Date"),
                field: "created",
                formatter: util.tableDateFormatter,
                orderField: "dateCreated",
                getRawValue: function(item) {
                    return new Date(item.created);
                }
            },{
                name: i18n("Description"),
                field: "description"
            },{
                name: i18n("Actions"),
                formatter: this.actionsFormatter,
                parentWidget: this
            }];

            this.grid = new TreeTable({
                url: gridRestUrl,
                serverSideProcessing: true,
                columns: gridLayout,
                orderField: "dateCreated",
                sortType: "desc",
                tableConfigKey: "componentVersionList",
                noDataMessage: i18n("No versions found."),
                hidePagination: false,
                hideExpandCollapse: true,
                queryData: {
                    outputType: ["BASIC", "LINKED"]
                },
                baseFilters: [{
                    name: "component.id",
                    type: "eq",
                    className: "UUID",
                    values: [appState.component.id]
                }, {
                    name: "active",
                    type: "eq",
                    className: "Boolean",
                    values: [true]
                 }]
            });
            this.grid.placeAt(this.gridAttach);

            if (config.data.systemConfiguration.enableInactiveLinks) {
                var activeBox = new CheckBox({
                    checked: false,
                    value: 'true',
                    onChange: function(value) {
                        if (!value) {
                            self.grid.baseFilters.push({
                                name: "active",
                                type: "eq",
                                values: [ true ],
                                className: "Boolean"
                            });
                        }
                        else {
                            self.grid.baseFilters = array.filter(self.grid.baseFilters, function (filter) {
                                return filter.name !== "active";
                            });

                        }
                        self.grid.refresh();
                    }
                });
                activeBox.placeAt(this.activeBoxAttach);

                var activeLabel = document.createElement("div");
                domClass.add(activeLabel, "inlineBlock");
                activeLabel.style.position = "relative";
                activeLabel.style.top = "2px";
                activeLabel.style.left = "2px";
                activeLabel.innerHTML = i18n("Show Inactive Versions");
                this.activeBoxAttach.appendChild(activeLabel);
            }

            if (appState.component.extendedSecurity[security.component.manageVersions] && appState.component.sourceConfigPlugin) {
                var importVersionsButton = new Button({
                    label: i18n("Import New Versions"),
                    showTitle: false,
                    onClick: function() {
                        self.importVersions();
                    }
                });
                domClass.add(importVersionsButton.domNode, "idxButtonSpecial");
                importVersionsButton.placeAt(this.buttonAttach);
                //Check if template has been updated and no reconfigure of sourceConfigPlugin
                if (appState.component.sourceConfigPluginNameMatchesPlugin === false) {
                    importVersionsButton.disabled = true;
                    domStyle.set(importVersionsButton.domNode, "display", "none");
                }
            }

            self.showRunningIntegrations();
            self.injectExtraRefreshLogic();
        },

        // So both refresh calls on the page call the other as well
        injectExtraRefreshLogic: function() {
            var self = this;
            this.compSourceHistory.grid.oldRefresh = this.compSourceHistory.grid.refresh;
            this.grid.oldRefresh = this.grid.refresh;
            this.refreshAll = function() {
                self.compSourceHistory.grid.oldRefresh();
                self.grid.oldRefresh();
            };
            this.compSourceHistory.grid.refresh = this.refreshAll;
            this.grid.refresh = this.refreshAll;
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
        typeFormatter: function(item) {
            var result = "";
            if (item.type === "FULL") {
                result = i18n("Full");
            }
            else if (item.type === "INCREMENTAL") {
                result = i18n("Incremental");
            }

            return result;
        },

        /**
         *
         */
        actionsFormatter: function(item) {
            var self = this.parentWidget;

            var result = document.createElement("div");
            var compareLink = domConstruct.create("a", {
                "class": "actionsLink linkPointer",
                "innerHTML": i18n("Compare")
             }, result);
             on(compareLink, "click", function() {
                 self.compareVersion(item);
             });

            if (appState.component.extendedSecurity[security.component.manageVersions]) {
                var deleteLink = domConstruct.create("a", {
                    "class": "actionsLink linkPointer",
                    "innerHTML": i18n("Delete")
                }, result);
                on(deleteLink, "click", function() {
                    self.confirmDeletion(item);
                });
                var copyLink = domConstruct.create("a", {
                  "class": "actionsLink linkPointer",
                  "innerHTML": i18n("Copy")
                }, result);
                on(copyLink, "click", function() {
                    self.copyDialog(item);
                });
            }


            return result;
        },

        copyDialog: function(item) {
            var self = this;
            var copyDialog = new Dialog({
                title: i18n("Copy"),
                closable: true,
                draggable: true
            });

            var copyForm = new ColumnForm({
                submitUrl: bootstrap.restUrl+"deploy/version",
                preSubmit: function() {
                    self.grid.block();
                },
                postSubmit: function(data) {
                    self.grid.unblock();
                    copyDialog.hide();
                    copyDialog.destroy();
                    self.grid.refresh();//recall this is overriden to refresh both tables
                },
                addData: function(data) {
                    data.copyId = item.id;
                },
                onError: function(response){
                    self.grid.unblock();
                    var fileAlert = new Alert({
                        message: i18n("Error copying version: %s", util.escape(response.responseText))
                    });
                    fileAlert.startup();
                },
                onCancel: function() {
                    copyDialog.hide();
                    copyDialog.destroy();
                }
            });

            copyForm.addField({
                name: "name",
                label: i18n("Name"),
                required: true,
                type: "Text"
            });

            copyForm.addField({
                name: "description",
                label: i18n("Description"),
                required: false,
                type: "Text"
            });

            copyForm.placeAt(copyDialog.containerNode);
            copyDialog.show();
        },

        /**
         *
         */
        confirmDeletion: function(version) {
            var self = this;
            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to delete version %s?", version.name),
                action: function() {
                    self.grid.block();
                    xhr.del({
                        url: bootstrap.restUrl+"deploy/version/"+version.id,
                        handleAs: "json",
                        load: function(data) {
                            self.grid.unblock();
                            if (!data.passed) {
                                self.showDeleteViolationDialog(data);
                            }
                            else {
                                self.grid.refresh();
                            }
                        },
                        error: function(error) {
                            self.grid.unblock();
                            var alert = new Alert({
                                message: util.escape(error.responseText)
                            });
                            self.grid.refresh();
                        }
                    });
                }
            });
        },

        /**
         *
         */
        compareVersion: function (version) {
            var self = this;
            var dialog = new Dialog({
                title: i18n("Compare Versions"),
                closable: true,
                draggable: true,
                heightPercent: 75,
                widthPercent: 75,
                destroyOnHide: true
            });
            var versionCompare = new VersionCompare({
                version: version
            });
            versionCompare.placeAt(dialog.containerNode);
            dialog.show();
        },

        /**
        *
        */

        showDeleteViolationDialog: function(data) {
            var messageDom = document.createElement("div");

            var textDiv = document.createElement("div");
            textDiv.style.width = "200px";
            domClass.add(textDiv, "inlineBlock");
            textDiv.innerHTML = i18n("This version cannot be deleted because it is in use by the following:");
            messageDom.appendChild(textDiv);

            if (data.offendingResources !== undefined) {
                var resourceLabelDiv = document.createElement("div");
                resourceLabelDiv.style.fontWeight = "bold";
                resourceLabelDiv.style.marginTop = "15px";
                resourceLabelDiv.innerHTML = i18n("Resources:");
                messageDom.appendChild(resourceLabelDiv);

                array.forEach(data.offendingResources, function(resource) {
                    var resourceDiv = document.createElement("div");
                    resourceDiv.style.marginLeft = "15px";
                    resourceDiv.innerHTML = resource.path.escape();
                    messageDom.appendChild(resourceDiv);
                });
            }

            if (data.offendingSnapshots !== undefined) {
                var snapshotLabelDiv = document.createElement("div");
                snapshotLabelDiv.style.fontWeight = "bold";
                snapshotLabelDiv.style.marginTop = "15px";
                snapshotLabelDiv.innerHTML = i18n("Application Snapshots:");
                messageDom.appendChild(snapshotLabelDiv);

                array.forEach(data.offendingSnapshots, function(snapshot) {
                    var snapshotDiv = document.createElement("div");
                    snapshotDiv.style.marginLeft = "15px";
                    snapshotDiv.innerHTML = snapshot.name.escape();
                    messageDom.appendChild(snapshotDiv);
                });
            }

            if (data.offendingProcesses !== undefined) {
                var processLabelDiv = document.createElement("div");
                processLabelDiv.style.fontWeight = "bold";
                processLabelDiv.style.marginTop = "15px";
                processLabelDiv.innerHTML = i18n("You cannot delete this version because it is used by: ");
                messageDom.appendChild(processLabelDiv);

                var processHistoryDiv = document.createElement("div");
                processHistoryDiv.style.marginTop = "15px";
                processHistoryDiv.innerHTML = i18n("Process History (You can delete versions that were deployed in a process only through Artifact Cleanup.)");
                messageDom.appendChild(processHistoryDiv);
            }

            var alert = new Alert({
                messageDom: messageDom
            });
        },

        /**
         *
         */
        showRunningIntegrations: function() {
            this.runningIntegrationTitleAttach.innerHTML = i18n("Currently Running Version Imports");
            this.compSourceHistory = ComponentSourceConfigHistory({
                gridRestUrl: bootstrap.restUrl+"sourceConfigExecutionRecord/" + appState.component.id + "/table/running",
                tableConfigKey: "componentRunningIntegrations" + appState.component.id
            });
            this.compSourceHistory.placeAt(this.runningIntegrationAttach);
        },

        /**
         *
         */
        importVersions: function() {
            var self = this;

            xhr.get({
                url: bootstrap.baseUrl+"property/propSheetDef/"+appState.component.sourceConfigPlugin.importPropSheetDef.id+"/propDefs",
                handleAs: "json",
                load: function(properties) {
                    var showForm = true;

                    // Never need to show the form when there are no properties to prompt for.
                    if (properties.length === 0) {
                        showForm = false;
                    }

                    // Special checks for specific source config properties - depending on the
                    // configuration of the component, the form may or may not be needed.
                    var alwaysUseName = util.getNamedPropertyValue(appState.component.properties, "FileSystemComponentProperties/useNamePattern");
                    if (alwaysUseName === "true") {
                        showForm = false;
                    }


                    if (showForm) {
                        var integrateDialog = new Dialog({
                            title: i18n("Import New Versions"),
                            closable: true,
                            draggable: true
                        });

                        var integrateForm = new ColumnForm({
                            submitUrl: bootstrap.restUrl+"deploy/component/"+appState.component.id+"/integrate",
                            preSubmit: function() {
                                self.grid.block();
                            },
                            postSubmit: function(data) {
                                self.grid.unblock();
                                integrateDialog.hide();
                                integrateDialog.destroy();
                                self.grid.refresh();//recall this is overriden to refresh both tables
                            },
                            addData: function(data) {
                                data.properties = {};
                                array.forEach(properties, function(property) {
                                    if (data[property.name] !== undefined) {
                                        data.properties[property.name] = data[property.name];
                                    }
                                    else {
                                        data.properties[property.name] = "";
                                    }
                                    delete data[property.name];
                                });
                            },
                            onError: function(response){
                                self.grid.unblock();
                                var fileAlert = new Alert({
                                    message: i18n("Error running import: %s", util.escape(response.responseText))
                                });
                                fileAlert.startup();
                            },
                            onCancel: function() {
                                integrateDialog.hide();
                                integrateDialog.destroy();
                            }
                        });

                        array.forEach(properties, function(property) {
                            property.translate = true;
                            integrateForm.addField(property);
                        });

                        integrateForm.placeAt(integrateDialog.containerNode);
                        integrateDialog.show();
                    }
                    else {
                        xhr.put({
                            url: bootstrap.restUrl+"deploy/component/"+appState.component.id+"/integrate",
                            putData: "{}",
                            handleAs: "json",
                            load: function(data) {
                                self.grid.refresh();//recall this is overriden to refresh both tables
                            },
                            error: function (response) {
                                var fileAlert = new Alert({
                                    message: i18n("Error running import: %s", util.escape(response.responseText))
                                });
                                fileAlert.startup();
                            }
                        });
                    }
                }
            });
        }
    });
});

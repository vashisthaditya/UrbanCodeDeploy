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
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/on",
        "deploy/widgets/snapshot/EditSnapshot",
        "deploy/widgets/Formatters",
        "js/util/blocker/BlockingContainer",
        "js/webext/widgets/Alert",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/table/TreeTable",
        "dojo/io/iframe"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        CheckBox,
        declare,
        xhr,
        domClass,
        domConstruct,
        on,
        EditSnapshot,
        Formatters,
        BlockingContainer,
        Alert,
        ColumnForm,
        Dialog,
        GenericConfirm,
        TreeTable,
        ioIframe
) {
    /**
     *
     */
    return declare('deploy.widgets.application.ApplicationSnapshots',[_Widget, _TemplatedMixin], {
        templateString:
            '<div class="snapshots">'+
                '<div class="listTopButtons" data-dojo-attach-point="buttonAttach"></div>'+
                '<div data-dojo-attach-point="gridAttach"></div>'+
                '<div data-dojo-attach-point="activeBoxAttach" style="margin: 2px;"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            var gridRestUrl = bootstrap.restUrl+"deploy/application/"+appState.application.id+"/snapshots/false";
            var gridLayout = [{
                name: i18n("Snapshot"),
                formatter: Formatters.snapshotLinkFormatter,
                orderField: "name",
                filterField: "name",
                filterType: "text"
            },{
                name: i18n("Description"),
                field: "description"
            },{
                name: i18n("Created"),
                field: "created",
                formatter: util.tableDateFormatter,
                orderField: "dateCreated"
            },{
                name: i18n("By"),
                field: "user",
                orderField: "user",
                getRawValue: function(item) {
                    return item.user;
                }
            },{
                name: i18n("Actions"),
                formatter: this.actionsFormatter,
                parentWidget: this
            }];

            this.grid = new TreeTable({
                url: gridRestUrl,
                columns: gridLayout,
                orderField: "dateCreated",
                sortType: "desc",
                hideExpandCollapse: true,
                hidePagination: false,
                tableConfigKey: "snapshots"+appState.application.id,
                noDataMessage: i18n("No application snapshots found."),
                queryData: {outputType: ["BASIC"]}
            });
            this.grid.placeAt(this.gridAttach);

            if (config.data.systemConfiguration.enableInactiveLinks) {
                var activeBox = new CheckBox({
                    checked: false,
                    value: 'true',
                    onChange: function(value) {
                        self.grid.url = bootstrap.restUrl+"deploy/application/"+appState.application.id+"/snapshots/"+value;
                        self.grid.refresh();
                    }
                });
                activeBox.placeAt(this.activeBoxAttach);
                
                var activeLabel = document.createElement("div");
                domClass.add(activeLabel, "inlineBlock");
                activeLabel.style.position = "relative";
                activeLabel.style.top = "2px";
                activeLabel.style.left = "2px";
                activeLabel.innerHTML = i18n("Show Inactive Snapshots");
                this.activeBoxAttach.appendChild(activeLabel);
            }

            if (appState.application.extendedSecurity[security.application.manageSnapshots]) {
                var newSnapshotButton = new Button({
                    label: i18n("Create Snapshot"),
                    showTitle: false,
                    onClick: function() {
                        self.showCreateSnapshotDialog();
                    }
                });
                domClass.add(newSnapshotButton.domNode, "idxButtonSpecial");

                var importSnapshotButton = new Button({
                    label: i18n("Import Snapshots"),
                    showTitle: false,
                    onClick: function() {
                        self.showImportDialog();
                    }
                });

                newSnapshotButton.placeAt(this.buttonAttach);
                importSnapshotButton.placeAt(this.buttonAttach);
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
        actionsFormatter: function(item) {
            var self = this.parentWidget;
            
            var result = document.createElement("div");

            var exportLink = domConstruct.create("a", {
                "class": "actionsLink linkPointer",
                "innerHTML": i18n("Export")
            }, result);
            on(exportLink, "click", function() {
                var downloadUrl = bootstrap.restUrl+"deploy/application/"+appState.application.id+
                            "/exportWithArtifacts?snapshotIds="+item.id;

                util.downloadFile(downloadUrl);
            });

            var compareLink = domConstruct.create("a", {
                "class": "actionsLink linkPointer",
                "innerHTML": i18n("Compare")
            }, result);
            on(compareLink, "click", function() {
                self.showCompareDialog(item);
            });

            if (appState.application.extendedSecurity[security.application.manageSnapshots]) {
                 var editLink = document.createElement("a");
                 editLink.className = "actionsLink";
                 editLink.innerHTML = i18n("Edit");
                 editLink.href = "#snapshot/"+item.id+"/configuration";
                 result.appendChild(editLink);
            }

            if (appState.application.extendedSecurity[security.application.deleteSnapshots]) {
                var deleteLink = domConstruct.create("a", {
                    "class": "actionsLink linkPointer",
                    "innerHTML": i18n("Delete")
                }, result);
                on(deleteLink, "click", function() {
                    self.confirmDelete(item);
                });
            }
            
            return result;
        },

        /**
         * 
         */
        confirmDelete: function(target) {
            var self = this;
            
            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to delete %s? " +
                        "This will permanently delete it from the system.", target.name.escape()),
                action: function() {
                    self.grid.block();
                    xhr.del({
                        url: bootstrap.restUrl+"deploy/snapshot/"+target.id,
                        handleAs: "json",
                        load: function(data) {
                            self.grid.unblock();
                            self.grid.refresh();
                        },
                        error: function(error) {
                            new Alert({
                                title: i18n("Error deleting snapshot"),
                                message: error.responseText
                            }).startup();
                            self.grid.unblock();
                        }
                    });
                }
            });
        },
        
        /**
         * 
         */
        showCompareDialog: function(item) {
            var self = this;
            
            var compareDialog = new Dialog({
                title: i18n("Compare Snapshots"),
                closable: true,
                draggable: true
            });
            
            var compareForm = new ColumnForm({
                onSubmit: function(data) {
                    compareDialog.hide();
                    compareDialog.destroy();
                    navBar.setHash("snapshotComparison/"+item.id+"/"+data.snapshotId);
                },
                onCancel: function() {
                    compareDialog.hide();
                    compareDialog.destroy();
                }
            });
            
            compareForm.addField({
                name: "_sourceSnapshotLabel",
                label: i18n("Snapshot"),
                type: "Label",
                style: {
                    marginTop: "3px"
                },
                value: item.name
            });

            compareForm.addField({
                name: "snapshotId",
                label: i18n("With Snapshot"),
                required: true,
                url: bootstrap.restUrl + "deploy/snapshot/" + item.id + "/exclude",
                type: "TableFilterSelect",
                autoSelectFirst: true
            });

            compareForm.placeAt(compareDialog.containerNode);
            compareDialog.show();
        },
        
        /**
         * 
         */
        showCreateSnapshotDialog: function(snapshot) {
            var self = this;
            var title = i18n("Create Snapshot ");
            var newSnapshotDialog = new Dialog({
                title: title,
                closable: true,
                draggable: true
            });
            
            var newSnapshotForm = new EditSnapshot({
                application: appState.application,
                snapshot: snapshot,
                callback: function() {
                    newSnapshotDialog.hide();
                    newSnapshotDialog.destroy();
                }, 
                onCancel: function() {
                    newSnapshotDialog.hide();
                    newSnapshotDialog.destroy();
                }
            });
            newSnapshotForm.placeAt(newSnapshotDialog.containerNode);
            newSnapshotDialog.show();
        },

        /**
         *
         */
        showImportDialog: function() {
            var self = this;

            var blocker = new BlockingContainer();
            var dialog = new Dialog({
                "title": i18n("Import Snapshots"),
                "closable":true,
                "draggable":true
            });

            blocker.placeAt(dialog.containerNode);

            var sessionValue = util.getCookie(bootstrap.expectedSessionCookieName);
            var form = domConstruct.create("form", {
                target: "formTarget",
                method: "Post",
                enctype: "multipart/form-data",
                encoding: "multipart/form-data",
                action: bootstrap.restUrl + "deploy/snapshot/importWithArtifacts/" + appState.application.id +
                            "?" + bootstrap.expectedSessionCookieName+"="+sessionValue
            });

            var fileInputDiv = domConstruct.create("div", {
                className: "filInputContainer"
            });
            var fileInput = domConstruct.create("input", {
                type: "file",
                name: "file",
                className: "fileInput"
            });
            domConstruct.place(fileInput, fileInputDiv);

            //submit button
            var submitDiv = domConstruct.create("div", {
                style: "display:block; margin-top:10px;"
            });

            var submitButton = new Button({
                label: i18n("Submit"),
                type: "submit"
            });
            submitButton.placeAt(submitDiv);

            //adding all parts to the form
            form.appendChild(fileInputDiv);
            form.appendChild(submitDiv);
            blocker.containerNode.appendChild(form);

            form.onsubmit = function() {
                var result = true;
                if (!fileInput.value) {
                    var fileAlert = new Alert({
                        message: i18n("Please choose a snapshot archive file to import.")
                    });
                    result = false;
                }
                else {
                    blocker.block();

                    ioIframe.send({
                        form: form,
                        handleAs: "json",
                        load: function(response) {
                        console.log("loaded", response);
                            blocker.unblock();
                            if (response.status === "ok") {
                                dialog.hide();
                                dialog.destroy();
                                self.grid.refresh();
                            }
                            else {
                                var msg = response.error || "";
                                var fileAlert = new Alert({
                                    message: i18n("Error importing application: %s", util.escape(msg))
                                });
                                fileAlert.startup();
                            }
                        },
                        error: function(response) {
                        console.log("error", response);
                            blocker.unblock();
                            var msg = response.error || "";
                            var fileAlert = new Alert({
                                message: i18n("Error importing application: %s", util.escape(msg))
                            });
                            fileAlert.startup();
                        }
                    });

                }
                return result;
            };

            dialog.show();
        }
    });
});

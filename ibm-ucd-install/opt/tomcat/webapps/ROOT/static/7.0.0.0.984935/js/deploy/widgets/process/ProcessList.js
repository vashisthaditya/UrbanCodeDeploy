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
        "deploy/widgets/Formatters",
        "deploy/widgets/process/EditProcess",
        "deploy/widgets/process/RunProcess",
        "js/webext/widgets/Alert",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/table/TreeTable",
        "dijit/form/CheckBox",
        "dojo/io/iframe"
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
        Formatters,
        EditProcess,
        RunProcess,
        Alert,
        Dialog,
        GenericConfirm,
        TreeTable,
        CheckBox,
        ioIframe
) {
    /**
     *
     */
    return declare('deploy.widgets.process.ProcessList',  [_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="processList">' +
                '<div class="listTopButtons" data-dojo-attach-point="buttonAttach"></div>' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',
            
        processListHash: null,
        baseGridUrl: null,
        basePasteUrl: null,
        readOnly: false,

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            this.grid = new TreeTable({
                url: bootstrap.restUrl+"process",
                serverSideProcessing: false,
                columns: [{
                    name: i18n("Process"),
                    formatter: Formatters.processLinkFormatter,
                    orderField: "name",
                    filterField: "name",
                    filterType: "text",
                    getRawValue: function(item) {
                        return item.name;
                    }
                },{
                    name: i18n("Description"),
                    field: "description",
                    orderField: "description",
                    filterField: "description",
                    filterType: "text",
                    getRawValue: function(item) {
                        return item.description;
                    }
                },{
                    name: i18n("Actions"),
                    parentWidget: self,
                    formatter: this.actionsFormatter
                }],
                tableConfigKey: "genericProcessList",
                noDataMessage: i18n("No processes found."),
                hideExpandCollapse: true,
                hidePagination: false
            });
            this.grid.placeAt(this.gridAttach);

            if (config.data.permissions[security.system.createProcess]) {
                var newProcessButton = new Button({
                    label: i18n("Create Process"),
                    showTitle: false,
                    onClick: function() {
                        self.showNewProcessDialog();
                    }
                });

                var importProcessButton = {
                    "label": i18n("Import Process"),
                    "showTitle": false,
                    "onClick": function() {
                        self.showImportProcessDialog();
                    }
                };

                newProcessButton.placeAt(this.buttonAttach);
                new Button(importProcessButton).placeAt(this.buttonAttach);
                domClass.add(newProcessButton.domNode, "idxButtonSpecial");
            }
        },

        /**
         *
         */
        showImportProcessDialog: function() {
            var self = this;
            
            var dialog = new Dialog({
                "title": i18n("Import Process"),
                "closable":true,
                "draggable":true
            });
            
            self.importIsUpgrade = false;
            self.importTemplateUpgradeType = "USE_EXISTING_IF_EXISTS";
            var form = document.createElement("form");
            form.target = "formTarget";
            form.method = "POST";
            form.enctype = "multipart/form-data";
            form.encoding = "multipart/form-data";
            dojo.addClass(form, "importForm");
            
            var fileInputDiv = document.createElement("div");
            dojo.addClass(fileInputDiv, "filInputContainer");

            var fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.name = "file";
            fileInputDiv.appendChild(fileInput);
            
            var checkBoxDiv = document.createElement("div");
            dojo.addClass(checkBoxDiv, "labelsAndValues-row");
            var checkBoxLabel = document.createElement("div");
            checkBoxLabel.innerHTML = i18n("Upgrade Process");
            dojo.addClass(checkBoxLabel, "labelsAndValues-labelCell inlineBlock");
            var upgradeDiv = document.createElement("div");
            dojo.addClass(upgradeDiv, "labelsAndValues-valueCell inlineBlock");
            var upgradeInput = new CheckBox({
                name: "upgradeComponent",
                checked: false,
                onChange: function(evt) {
                    self.importIsUpgrade = this.get("checked");
                    self.setFormAction(form);
                }
            });
            upgradeInput.placeAt(upgradeDiv);

            
            //submit button
            var submitDiv = domConstruct.create("div");

            var submitButton = new Button({
                label: i18n("Submit"),
                type: "submit"
            });
            submitButton.placeAt(submitDiv);
            
            checkBoxDiv.appendChild(upgradeDiv);
            checkBoxDiv.appendChild(checkBoxLabel);
            form.appendChild(checkBoxDiv);
            form.appendChild(fileInputDiv);
            form.appendChild(submitDiv);
            dialog.containerNode.appendChild(form);
            
            form.onsubmit = function() {
                var result = true;
                if (!fileInput.value) {
                    var fileAlert = new Alert({
                        message: i18n("Please choose a process json file to import.")
                    });
                    result = false;
                }
                else {
                    self.setFormAction(form);

                    ioIframe.send({
                        form: form,
                        handleAs: "json",
                        load: function(response) {
                            if (response.status === "ok") {
                                dialog.hide();
                                dialog.destroy();
                                self.grid.refresh();
                            }
                            else {
                                var fileAlert = new Alert({
                                    message: i18n("Error importing process: %s", response.error)
                                });
                                fileAlert.startup();
                            }
                        },
                        error: function(response) {
                             var fileAlert = new Alert({
                                 message: i18n("Error importing process: %s", response.error)
                             });
                             fileAlert.startup();
                        }
                    });
                }
                return result;
            };

            dialog.show();
        },

        /**
         *
         */
        setFormAction: function(form) {
            var self = this;
            var sessionValue = util.getCookie(bootstrap.expectedSessionCookieName);

            form.action = bootstrap.restUrl + "process/" + 
                (self.importIsUpgrade === true?"upgrade":"import") + "?"
                    +bootstrap.expectedSessionCookieName+"="+sessionValue;
        },

        /**
         * 
         */
        destroy: function() {
            this.inherited(arguments);
            this.grid.destroy();

            if (this.copyGrid !== undefined) {
                this.copyGrid.destroy();
            }
        },
        
        /**
         * 
         */
        actionsFormatter: function(item) {
            var self = this.parentWidget;
            var result = document.createElement("div");
            
            if (item.security.execute) {
                var runLink = domConstruct.create("a", {
                    "innerHTML": i18n("Run"),
                    "class": "actionsLink linkPointer"
                }, result);
                on(runLink, "click", function() {
                    self.showRunProcessDialog(item);
                });
            }
            if (item.security["Edit Basic Settings"]) {
                var editLink = domConstruct.create("a", {
                    "class": "actionsLink linkPointer",
                    "innerHTML": i18n("Edit"),
                    "href": "#process/"+item.id+"/-1"
                }, result);
            }
            if (item.security.Delete) {
                var deleteLink = domConstruct.create("a", {
                    "class": "actionsLink linkPointer",
                    "innerHTML": i18n("Delete")
                }, result);
                on(deleteLink, "click", function() {
                    self.confirmDelete(item);
                });
            }
            
            if (config.data.permissions[security.system.createProcess]) {
                var copyLink = domConstruct.create("a", {
                    "class": "actionsLink linkPointer",
                    "innerHTML": i18n("Copy")
                }, result);
                on(copyLink, "click", function() {
                    self.showNewProcessDialog(item);
                });
            }

            if (item.security.read) {
                var exportLink = util.createDownloadAnchor({
                    "class": "actionsLink linkPointer",
                    "innerHTML": i18n("Export"),
                    "href": bootstrap.restUrl+"process/"+item.id+"/export"
                }, result);
            }
            
            return result;
        },
        
        /**
         * 
         */
        showNewProcessDialog: function(entry) {
            var self = this;
            
            var newProcessDialog = new Dialog({
                title: i18n("Create Process"),
                closable: true,
                draggable: true
            });
            
            var newProcessForm = new EditProcess({
                source: entry,
                callback: function() {
                    newProcessDialog.hide();
                    newProcessDialog.destroy();
                }
            });
            newProcessForm.placeAt(newProcessDialog.containerNode);
            newProcessDialog.show();
        },
        
        /**
         * 
         */
        showRunProcessDialog: function(item) {
            var self = this;
            
            xhr.get({
                url: bootstrap.restUrl+"process/"+item.id+"/-1",
                handleAs: "json",
                load: function(data) {
                    var newProcessDialog = new Dialog({
                        title: i18n("Run Process"),
                        closable: true,
                        draggable: true
                    });
                    
                    var newProcessForm = new RunProcess({
                        process: data,
                        callback: function() {
                            newProcessDialog.hide();
                            newProcessDialog.destroy();
                        }
                    });
                    newProcessForm.placeAt(newProcessDialog.containerNode);
                    newProcessDialog.show();
                }
            });
        },
        
        /**
         * 
         */
        confirmDelete: function(target) {
            var self = this;
            
            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to delete %s? " +
                        "This will permanently delete it from the system.", target.name),
                action: function() {
                    self.grid.block();
                    xhr.del({
                        url: bootstrap.restUrl+"process/"+target.id,
                        load: function() {
                            self.grid.unblock();
                            self.grid.refresh();
                        },
                        error: function(error) {
                            var alert = new Alert({
                                messages: [i18n("Error: "),
                                           "",
                                           util.escape(error.responseText)]
                            });
                            alert.startup();
                            self.grid.unblock();
                        }
                    });
                }
            });
        }
    });
});

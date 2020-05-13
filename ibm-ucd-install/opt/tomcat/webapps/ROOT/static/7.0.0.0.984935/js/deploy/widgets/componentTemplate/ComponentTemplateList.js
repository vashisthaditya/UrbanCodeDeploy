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
define([
        "dojo/_base/declare",
        "dijit/_Widget",
        "dijit/_TemplatedMixin",
        "dijit/form/Button",
        "dijit/form/CheckBox",
        "dojo/dom-class",
        "dojo/dom-geometry",
        "dojo/dom-construct",
        "dojo/on",
        "dojo/topic",
        "dojo/_base/xhr",
        "dojo/io/iframe",
        "deploy/widgets/Formatters",
        "deploy/widgets/componentTemplate/EditComponentTemplate",
        "deploy/widgets/tag/Tagger",
        "deploy/widgets/tag/TagDisplay",
        "js/webext/widgets/table/TreeTable",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "dijit/form/Select",
        "js/webext/widgets/Alert"
        ],
function(
        declare,
        _Widget,
        _TemplatedMixin,
        Button,
        CheckBox,
        domClass,
        domGeom,
        domConstruct,
        on,
        topic,
        xhr,
        ioIframe,
        Formatters,
        EditComponentTemplate,
        Tagger,
        TagDisplay,
        Table,
        Dialog,
        GenericConfirm,
        Select,
        Alert
){
/**
 *
 */
    return declare(
        [_Widget, _TemplatedMixin],
        {
            templateString: 
                '<div class="componentTemplateList">' +
                    '<div class="listTopButtons" data-dojo-attach-point="buttonTopAttach"></div>' +
                    '<div data-dojo-attach-point="gridAttach"></div>' +
                    '<div data-dojo-attach-point="activeBoxAttach" style="margin: 2px;"></div>' +
                '</div>',
    
            /**
             *
             */
            postCreate: function() {
                this.inherited(arguments);
                var self = this;
                
                var gridRestUrl = bootstrap.restUrl+'deploy/componentTemplate';
                var gridLayout = [{
                    name: i18n("Name"),
                    formatter: function(item, value, cell) {
                        cell.style.position = "relative";

                        var result = domConstruct.create('div', {
                            'class': 'inlineBlock',
                            'style': 'margin-' + (domGeom.isBodyLtr()?"right":"left") + ":78px;"
                        });
                        var itemWrapper = domConstruct.create('div', {
                            'class': 'inlineBlock'
                        });

                        var link = Formatters.componentTemplateLinkFormatter(item);
                        domConstruct.place(link, itemWrapper);

                        domConstruct.place(itemWrapper, result);

                        self.tagger = new Tagger({
                            objectType: "ComponentTemplate",
                            item: item,
                            callback: function() {
                                self.grid.refresh();
                            }
                        });
                        self.tagger.placeAt(result);

                        return result;
                    },
                    orderField: "name",
                    filterField: "name",
                    filterType: "text",
                    getRawValue: function(item) {
                        return item.name;
                    }
                },{
                    name: i18n("Description"),
                    field: "description"
                },{
                    name: i18n("Created"),
                    field: "created",
                    formatter: util.tableDateFormatter,
                    orderField: "created",
                    getRawValue: function(item) {
                        return new Date(item.created);
                    }
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
    
                this.grid = new Table({
                    url: gridRestUrl,
                    serverSideProcessing: false,
                    noDataMessage: i18n("No component templates found."),
                    tableConfigKey: "componentTemplateList",
                    columns: gridLayout,
                    hideExpandCollapse: true,
                    hidePagination: false
                });
                this.grid.placeAt(this.gridAttach);
    
                if (config.data.systemConfiguration.enableInactiveLinks) {
                    var activeBox = new CheckBox({
                        checked: false,
                        value: 'true',
                        onChange: function(value) {
                            if (value) {
                                self.grid.url = bootstrap.restUrl+"deploy/componentTemplate/all";
                            }
                            else {
                                self.grid.url = bootstrap.restUrl+"deploy/componentTemplate";
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
                    activeLabel.innerHTML = i18n("Show Inactive Templates");
                    this.activeBoxAttach.appendChild(activeLabel);
                }
    
                if (config.data.permissions[security.system.createComponentTemplates]) {
                    var newComponentButton = {
                        label: i18n("Create Template"),
                        showTitle: false,
                        onClick: function() {
                            self.showNewComponentTemplateDialog();
                        }
                    };
                    
                    var importComponentButton = {
                        "label": i18n("Import Template"),
                        "showTitle": false,
                        "onClick": function() {
                            self.showImportTemplateDialog();
                        }
                    };

                    var componentButton = new Button(newComponentButton).placeAt(this.buttonTopAttach);
                    new Button(importComponentButton).placeAt(this.buttonTopAttach);
                    domClass.add(componentButton.domNode, "idxButtonSpecial");
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
                
                if (item.security.Delete) {
                    var deleteLink = domConstruct.create("a", {
                        "class": "actionsLink linkPointer",
                        "innerHTML": i18n("Delete")
                    }, result);
                    on(deleteLink, "click", function() {
                        self.confirmDelete(item);
                    });
                }
            
                var exportLink = util.createDownloadAnchor({
                        "class":"actionsLink linkPointer",
                        "innerHTML": i18n("Export"),
                         "href": bootstrap.restUrl+"deploy/componentTemplate/"+item.id
                }, result);
    
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
                            url: bootstrap.restUrl+"deploy/componentTemplate/"+target.id,
                            handleAs: "json",
                            load: function(data) {
                                self.grid.unblock();
                                self.grid.refresh();
                            },
                            error: function(error) {
                                new Alert({
                                    title: i18n("Error deleting component template"),
                                    message: error.responseText
                                }).startup();
                                self.grid.unblock();
                            }
                        });
                    }
                });
            },

            showImportTemplateDialog: function() {
                var self = this;
                
                var dialog = new Dialog({
                    "title": i18n("Import Template"),
                    "closable":true,
                    "draggable":true
                });
                
                self.processUpgradeType = "USE_EXISTING_IF_EXISTS";
                var form = document.createElement("form");
                form.target = "formTarget";
                form.method = "POST";
                form.enctype = "multipart/form-data";
                form.encoding = "multipart/form-data";
                dojo.addClass(form, "importForm");
                
                var fileInput = document.createElement("input");
                fileInput.type = "file";
                fileInput.name = "file";
                fileInput.className = "filInputContainer";
                
                var checkBoxDiv = document.createElement("div");
                dojo.addClass(checkBoxDiv, "labelsAndValues-row");
                var checkBoxLabel = document.createElement("div");
                checkBoxLabel.innerHTML = i18n("Upgrade Template");
                dojo.addClass(checkBoxLabel, "labelsAndValues-labelCell inlineBlock");
                var checkBoxValueDiv = document.createElement("div");
                dojo.addClass(checkBoxValueDiv, "labelsAndValues-valueCell inlineBlock");
                var upgradeInput = new CheckBox({
                    name: "upgradeComponent",
                    checked: false
                });
                upgradeInput.placeAt(checkBoxValueDiv);

                //Add process upgrade type select
                var processSelectBoxDiv = document.createElement("div");
                dojo.addClass(processSelectBoxDiv, "labelsAndValues-row");
                var processSelectBoxLabel = document.createElement("div");
                processSelectBoxLabel.innerHTML = i18n("Generic Process Upgrade Type");
                dojo.addClass(processSelectBoxLabel, "labelsAndValues-labelCell");

                var processUpgradeTypeDiv = document.createElement("div");
                dojo.addClass(processUpgradeTypeDiv, "labelsAndValues-valueCell");
                var processUpgradeTypeInput = new Select({
                    name: "templateUpgradeTypeInput",
                    options: [
                          {label: i18n("Use Existing Template"), value: "USE_EXISTING_IF_EXISTS"},
                          {label: i18n("Create Template"), value: "CREATE_NEW_IF_EXISTS"},
                          {label: i18n("Fail If Template Exists"), value: "FAIL_IF_EXISTS"},
                          {label: i18n("Fail If Template Does Not Exist"), value: "FAIL_IF_DOESNT_EXIST"},
                          {label: i18n("Upgrade Template If Exists"), value: "UPGRADE_IF_EXISTS"}
                    ],
                    onChange: function(evt) {
                      self.processUpgradeType = this.get("value");
                      self.setFormAction(form);
                    }
                });
                processUpgradeTypeInput.placeAt(processUpgradeTypeDiv);


                processSelectBoxDiv.appendChild(processSelectBoxLabel);
                processSelectBoxDiv.appendChild(processUpgradeTypeDiv);

                var submitDiv = domConstruct.create("div");

                var submitButton = new Button({
                    label: i18n("Submit"),
                    type: "submit"
                });
                submitButton.placeAt(submitDiv);
                
                checkBoxDiv.appendChild(checkBoxValueDiv);
                checkBoxDiv.appendChild(checkBoxLabel);
                form.appendChild(checkBoxDiv);
                form.appendChild(processSelectBoxDiv);
                form.appendChild(fileInput);
                form.appendChild(submitDiv);
                dialog.containerNode.appendChild(form);
                
                form.onsubmit = function() {
                    var result = true;
                    if (!fileInput.value) {
                        var fileAlert = new Alert({
                            message: i18n("Please choose a template json file to import.")
                        });
                        result = false;
                    }
                    else {
                        var sessionValue = util.getCookie(bootstrap.expectedSessionCookieName);
                        form.action = bootstrap.restUrl + "deploy/componentTemplate/" +
                                (upgradeInput.checked === true ? "upgrade" : "import") + 
                                "?processUpgradeType=" + self.processUpgradeType + "&" +
                                bootstrap.expectedSessionCookieName+"="+sessionValue;

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
                                        message: i18n("Error importing component template: %s", response.error)
                                    });
                                    fileAlert.startup();
                                }
                            },
                            error: function(response) {
                                var fileAlert = new Alert({
                                    message: i18n("Error importing component template: %s", response.error)
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
            showNewComponentTemplateDialog: function() {
                var self = this;
                
                var newComponentTemplateDialog = new Dialog({
                    title: i18n("Create Component Template"),
                    closable: true,
                    draggable: true
                });
                
                var newComponentTemplateForm = new EditComponentTemplate({
                    callback: function() {
                        newComponentTemplateDialog.hide();
                        newComponentTemplateDialog.destroy();
                    }
                });
                newComponentTemplateForm.placeAt(newComponentTemplateDialog.containerNode);
                newComponentTemplateDialog.show();
            }
        }
    );
});
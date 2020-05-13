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
        "dojo/on",
        "deploy/widgets/component/EditComponent",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/table/TreeTable",
        "js/webext/widgets/Alert"
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
        on,
        EditComponent,
        Dialog,
        GenericConfirm,
        TreeTable,
        Alert
) {
    /**
     *
     */
    return declare('deploy.widgets.componentTemplate.ComponentTemplateComponents',  [_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="componentList">' +
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

            var gridRestUrl = bootstrap.restUrl+"deploy/component/";
            var gridLayout = [{
                name: i18n("Name"),
                formatter: this.componentFormatter,
                orderField: "name",
                filterField: "name",
                filterType: "text",
                getRawValue: function(item) {
                    return item.name;
                }
            },{
                name: i18n("Template Version"),
                formatter: function(item) {
                    var result = item.templateVersion;
                    if (result === -1) {
                        result = i18n("Latest Version");
                    }
                    return result;
                },
                orderField: "templateVersion",
                getRawValue: function(item) {
                    var result = item.templateVersion;
                    if (item.templateVersion === -1) {
                        result = 1000000;
                    }
                    return result;
                }
            },{
                name: i18n("Description"),
                field: "description"
            },{
                name: i18n("Created"),
                field: "created",
                formatter: util.tableDateFormatter,
                orderField: "dateCreated",
                getRawValue: function(item) {
                    return new Date(item.created);
                }
            },{
                name: i18n("By"),
                field: "user.name",
                orderField: "user.name",
                getRawValue: function(item) {
                    return item.user;
                }
            },{
                name: i18n("Actions"),
                formatter: this.actionsFormatter,
                parentWidget: this
            }];

            var activeFilter = {
                    name: "active",
                    type: "eq",
                    className: "Boolean",
                    values: [true]
            };
            
            var componentTemplateComponentFilters = [
                  activeFilter,
                  {
                      name: "templateId",
                      type: "eq",
                      className: "UUID",
                      values: [self.componentTemplate.id]
                  }];

            this.grid = new TreeTable({
                url: gridRestUrl,
                orderField: "name",
                serverSideProcessing: true,
                noDataMessage: i18n("No components found."),
                tableConfigKey: "componentTemplateComponentList",
                columns: gridLayout,
                hidePagination: false,
                hideExpandCollapse: true,
                queryData: {
                    outputType: ["BASIC", "LINKED", "SECURITY"]
                },
                baseFilters: componentTemplateComponentFilters
            });
            this.grid.placeAt(this.gridAttach);

            if (config.data.systemConfiguration.enableInactiveLinks) {
                var activeBox = new CheckBox({
                    checked: false,
                    value: 'true',
                    onChange: function(value) {
                        if (value) {
                            self.grid.baseFilters = array.filter(self.grid.baseFilters, function(filter) {
                                return filter.name !== "active";
                            });
                        }
                        else {
                            self.grid.baseFilters.push(activeFilter);
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
                activeLabel.innerHTML = i18n("Show Inactive Components");
                this.activeBoxAttach.appendChild(activeLabel);
            }
            
            if (config.data.permissions[security.system.createComponentsFromTemplate]) {
                var newComponentButton = {
                    label: i18n("Create Component"),
                    showTitle: false,
                    onClick: function() {
                        self.showNewComponentDialog();
                    }
                };
    
                var topButton = new Button(newComponentButton);
                domClass.add(topButton.domNode, "idxButtonSpecial");
                topButton.placeAt(this.buttonTopAttach);
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
        componentFormatter: function(item) {
            var result = document.createElement("a");
            result.innerHTML = item.name.escape();
            result.href = "#component/"+item.id;
            return result;
        },
        
        /**
         *
         */
        actionsFormatter: function(item) {
            var self = this.parentWidget;
            
            var result = document.createElement("div");
            
            if (config.data.permissions[security.system.createComponents]) {
                var copyLink = domConstruct.create("a", {
                    "class": "actionsLink linkPointer",
                    "innerHTML": i18n("Copy")
                }, result);
                on(copyLink, "click", function() {
                    self.showNewComponentDialog(item);
                });
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
            
            return result;
        },
        
        /**
         * 
         */
        confirmDelete: function(target) {
            var self = this;
            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to delete component %s?", target.name.escape()),
                action: function() {
                    self.grid.block();
                    xhr.del({
                        url: bootstrap.restUrl+"deploy/component/"+target.id,
                        handleAs: "json",
                        load: function(data) {
                            self.grid.unblock();
                            self.grid.refresh();
                        },
                        error: function(error) {
                            new Alert({
                                title: i18n("Error deleting component"),
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
        showNewComponentDialog: function(source) {
            var self = this;
            
            var newComponentDialog = new Dialog({
                title: i18n("Create Component"),
                closable: true,
                draggable: true
            });
            
            var newComponentForm = new EditComponent({
                source: source,
                componentTemplate: this.componentTemplate,
                callback: function() {
                    newComponentDialog.hide();
                    newComponentDialog.destroy();
                }
            });
            newComponentForm.placeAt(newComponentDialog.containerNode);
            newComponentDialog.show();
        }
    });
});

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
        "deploy/widgets/configTemplate/EditConfigTemplate",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/table/TreeTable"
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
        EditConfigTemplate,
        Dialog,
        GenericConfirm,
        TreeTable
) {
    /**
     *
     */
    return declare('deploy.widgets.component.ComponentConfigTemplates',  [_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="componentConfigTemplates">' +
                '<div class="listTopButtons" data-dojo-attach-point="buttonAttach"></div>' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            var gridRestUrl = bootstrap.restUrl+"deploy/component/"+this.component.id+"/configTemplates";
            var gridLayout = [{
                name: i18n("Name"),
                field: "name",
                orderField: "name",
                getRawValue: function(item) {
                    return item.name;
                }
            },{
                name: i18n("Actions"),
                formatter: this.actionsFormatter,
                parentWidget: this
            }];

            this.grid = new TreeTable({
                url: gridRestUrl,
                serverSideProcessing: false,
                columns: gridLayout,
                orderField: "name",
                sortType: "desc",
                tableConfigKey: "configurationTemplateList",
                noDataMessage: i18n("No configuration templates found."),
                hidePagination: false,
                hideExpandCollapse: true
            });
            this.grid.placeAt(this.gridAttach);

            if (this.component.security["Manage Configuration Templates"]) {
                var newConfigTemplateButton = new Button({
                    label: i18n("Create Configuration Template"),
                    showTitle: false,
                    onClick: function() {
                        self.showEditConfigTemplateDialog();
                    }
                });
                domClass.add(newConfigTemplateButton.domNode, "idxButtonSpecial");
                newConfigTemplateButton.placeAt(this.buttonAttach);
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
            
            if (self.component.security["Manage Configuration Templates"]) {
                var editLink = domConstruct.create("a", {
                    "class": "actionsLink linkPointer",
                    "innerHTML": i18n("Edit")
                }, result);
                on(editLink, "click", function() {
                    self.showEditConfigTemplateDialog(item);
                });

                var inactivateLink = domConstruct.create("a", {
                    "class": "actionsLink linkPointer",
                    "innerHTML": i18n("Delete")
                }, result);
                on(inactivateLink, "click", function() {
                    self.confirmDelete(item);
                });
            }
            else {
                var viewLink = domConstruct.create("a", {
                    "class": "actionsLink linkPointer",
                    "innerHTML": i18n("View")
                }, result);
                on(viewLink, "click", function() {
                    self.showEditConfigTemplateDialog(item);
                });
            }
            
            return result;
        },

        /**
         * 
         */
        showEditConfigTemplateDialog: function(configTemplate) {
            var self = this;
            
            var title = i18n("Create Configuration Template");
            if (configTemplate) {
                title = i18n("Edit Configuration Template");
            }
            var newConfigTemplateDialog = new Dialog({
                title: title,
                closable: true,
                draggable: true
            });
            
            var newConfigTemplateForm = new EditConfigTemplate({
                readOnly: !this.component.security["Manage Configuration Templates"],
                component: this.component,
                configTemplate: configTemplate,
                callback: function() {
                    newConfigTemplateDialog.hide();
                    newConfigTemplateDialog.destroy();
                    self.grid.refresh();
                }
            });
            newConfigTemplateForm.placeAt(newConfigTemplateDialog.containerNode);
            newConfigTemplateDialog.show();
        },

        /**
         * 
         */
        confirmDelete: function(target) {
            var self = this;
            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to delete template %s?", target.name.escape()),
                action: function() {
                    self.grid.block();
                    xhr.del({
                        url: bootstrap.restUrl+"deploy/configTemplate/"+self.component.id+"/"+target.name,
                        load: function(data) {
                            self.grid.unblock();
                            self.grid.refresh();
                        }
                    });
                }
            });
        }
    });
});
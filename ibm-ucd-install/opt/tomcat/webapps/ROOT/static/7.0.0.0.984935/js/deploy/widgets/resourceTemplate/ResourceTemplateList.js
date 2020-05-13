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
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/dom-geometry",
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dijit/Tooltip",
        "dijit/form/Button",
        "deploy/widgets/Formatters",
        "deploy/widgets/resourceTemplate/EditResourceTemplate",
        "deploy/widgets/resourceTemplate/ImportResourceTemplate",
        "deploy/widgets/resource/ResourceCompareSelectorDialog",
        "js/webext/widgets/Alert",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/form/MenuButton",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        array,
        declare,
        xhr,
        domClass,
        domConstruct,
        domGeom,
        _TemplatedMixin,
        _Widget,
        Tooltip,
        Button,
        Formatters,
        EditResourceTemplate,
        ImportResourceTemplate,
        ResourceCompareSelectorDialog,
        Alert,
        Dialog,
        GenericConfirm,
        MenuButton,
        TreeTable
) {
    /**
     *
     */
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="resource-template-list">'+
                '<div class="listTopButtons" data-dojo-attach-point="buttonAttach" style="position:relative; z-index=1;"></div>' +
                '<div data-dojo-attach-point="tableAttach"></div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            this.table = new TreeTable({
                url: bootstrap.restUrl+"resource/resourceTemplate",
                orderField: "name",
                tableConfigKey: "resourceTemplateList",
                hidePagination: false, 
                hideExpandCollapse: true,
                baseFilters: [{
                    name: "application",
                    type: "null"
                }],
                queryData: {
                    outputType: [
                        "BASIC",
                        "SECURITY",
                        "LINKED"
                    ]
                },
                columns: [{
                    name: i18n("Name"),
                    orderField: "name",
                    filterField: "name",
                    filterType: "text",
                    formatter: function(item, value, cell) {
                        cell.style.position = "relative";

                        var result = domConstruct.create("div", {
                            "class": "inlineBlock",
                            "style": "margin-" + (domGeom.isBodyLtr()?"right":"left") + ":78px;"
                        });
                        var itemWrapper = domConstruct.create("div", {
                            "class": "inlineBlock"
                        }, result);

                        var link = Formatters.resourceTemplateLinkFormatter(item);
                        var linkDiv = domConstruct.create('div', {
                            "class" : 'inlineBlock'
                        }, itemWrapper);
                        domConstruct.place(link, linkDiv);

                        var actionsContainer = domConstruct.create("div", {
                            "dir": util.getUIDir(),
                            "align": util.getUIDirAlign(),
                            "class": "tableHoverActions"
                        }, result);

                        var menuActions = [
                            {
                                label: i18n("Compare or Synchronize"),
                                onClick: function() {
                                    self.showCompareDialog(item);
                                }
                            }
                        ];

                        if (item.security && item.security.Delete) {
                            menuActions.push({
                                label: i18n("Delete"),
                                onClick: function() {
                                    self.confirmDelete(item);
                                }
                            });
                        }
                        
                        var actionsButton = new MenuButton({
                            options: menuActions,
                            label: i18n("Actions...")
                        });
                        actionsButton.placeAt(actionsContainer);
                        
                        return result;
                    },
                    getRawValue: function(item) {
                        return item.name;
                    }
                },{
                    name: i18n("Parent"),
                    filterField: "parentResourceTemplate.name",
                    filterType: "text",
                    formatter: function(item, value, cell) {
                        return Formatters.resourceTemplateLinkFormatter(item.parent);
                    },
                    getRawValue: function(item) {
                        return item.parent.name;
                    }
                },{
                    name: i18n("Description"),
                    field: "description",
                    filterField: "description",
                    filterType: "text"
                }]
            });
            this.table.placeAt(this.tableAttach);
            
            if (config.data.permissions[security.system.createResourceTemplates]) {
                var createButton = new Button({
                    label: i18n("Create Resource Template"),
                    showTitle: false,
                    onClick: function() {
                        self.showNewTemplateDialog();
                    }
                });
                domClass.add(createButton.domNode, "idxButtonSpecial");
                createButton.placeAt(this.buttonAttach);
                
                // Import
                if (!bootstrap.isFIPSModeEnabled) {
                    var importButton = new Button({
                        label: i18n("Import Template from Cloud"),
                        showTitle: false,
                        onClick: function() {
                            self.showImportTemplateDialog();
                        }
                    });
                    importButton.placeAt(this.buttonAttach);
                }
            }
        },
        
        /**
         * 
         */
        showNewTemplateDialog: function() {
            var self = this;
            
            var newTemplateDialog = new Dialog({
                title: i18n("Create Resource Template"),
                closable: true,
                draggable:true,
                description: i18n("Resource templates define sets of resources which can be applied " +
                        "to the actual resource tree in order to make standardization and initial " +
                        "configuration of target environments easier. To create a resource " +
                        "template, specify the contents and organization of the template, " +
                        "including resources, groups, and agent prototypes.")
            });
            
            var newTemplateForm = new EditResourceTemplate({
                callback: function(data) {
                    newTemplateDialog.hide();
                    newTemplateDialog.destroy();
                    
                    if (data) {
                        navBar.setHash("#resourceTemplate/"+data.id);
                    }
                }
            });
            
            newTemplateForm.placeAt(newTemplateDialog.containerNode);
            newTemplateDialog.show();
        },
        
        /**
         * 
         */
        showImportTemplateDialog: function() {
            var self = this;
            
            var newTemplateDialog = new Dialog({
                title: i18n("Import Resource Template"),
                closable: true,
                draggable:true,
                description: i18n("If you have a virtual system pattern on a cloud system, " +
                        "you can import that pattern as a resource template. This resource " +
                        "template is a pattern from which you can provision cloud resources. " +
                        "Before you can import a pattern as a resource template, you must " +
                        "create a virtual system pattern on a compatible cloud system. Each " +
                        "node in this pattern must include the Install %s " +
                        "Agent script package.", bootstrap.productName)
            });
            
            var newTemplateForm = new ImportResourceTemplate({
                callback: function(data) {
                    newTemplateDialog.hide();
                    newTemplateDialog.destroy();

                    if (data) {
                        navBar.setHash("#resourceTemplate/"+data.id);
                    }
                }
            });
            
            newTemplateForm.placeAt(newTemplateDialog.containerNode);
            newTemplateDialog.show();
        },

        showCompareDialog: function(item) {
            var t = this;
            var resComSelDia = new ResourceCompareSelectorDialog({
                resourceTemplate: item
            });
            resComSelDia.show();
        },
        
        /**
         * 
         */
        confirmDelete: function(entry) {
            var self = this;

            var deleteConfirm = new GenericConfirm({
                message: i18n("Are you sure you want to delete resource template '%s'?", entry.name),
                action: function() {
                    xhr.del({
                        url: bootstrap.restUrl+"resource/resourceTemplate/"+entry.id,
                        handleAs: "json",
                        load: function(data) {
                            self.table.refresh();
                        },
                        error: function(error) {
                            var alert = new Alert({
                                message: error.responseText
                            });
                            alert.startup();
                        }
                    });
                }
            });
        }
    });
});

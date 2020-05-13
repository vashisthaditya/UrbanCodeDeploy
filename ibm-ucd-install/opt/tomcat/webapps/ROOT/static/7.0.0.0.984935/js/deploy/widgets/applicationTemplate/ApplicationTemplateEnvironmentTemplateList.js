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
        "dijit/registry",
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/window",
        "dojo/_base/xhr",
        "dojo/dnd/Source",
        "dojo/dom-class",
        "dojo/dom-geometry",
        "dojo/dom-construct",
        "dojo/dom-style",
        "dojo/dom-attr",
        "dojo/json",
        "dojo/on",
        "deploy/widgets/environmentTemplate/EditEnvironmentTemplate",
        "deploy/widgets/Formatters",
        "js/webext/widgets/color/Color",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/form/MenuButton",
        "js/webext/widgets/table/TreeTable",
        "js/webext/widgets/Alert"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        CheckBox,
        registry,
        array,
        declare,
        lang,
        win,
        xhr,
        Source,
        domClass,
        domGeom,
        domConstruct,
        domStyle,
        domAttr,
        JSON,
        on,
        EditEnvironmentTemplate,
        Formatters,
        Color,
        Dialog,
        GenericConfirm,
        MenuButton,
        TreeTable,
        Alert
) {
    /**
     *
     */
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="applicationEnvironmentList application-environment-list">' +
                '<div class="listTopButtons" data-dojo-attach-point="buttonAttach"></div>' +
                '<div class="environmentTemplateList" data-dojo-attach-point="tableAttach"></div>'+
            '</div>',


        /**
         *
         */
        postCreate: function() {
            var self = this;

            self.showTable();
            self.showAddButton();
        },

        /**
         *
         */
        showTable: function() {
            var self = this;
            var gridUrl = bootstrap.restUrl + "deploy/applicationTemplate/" + self.applicationTemplate.id
                    + "/" + self.applicationTemplate.version + "/environmentTemplates";

            self.readOnly =
                ((self.applicationTemplate.version !== self.applicationTemplate.versionCount)
                || !self.applicationTemplate.security["Manage Environment Templates"]);

            self.gridLayout = [{
                name: i18n("Name"),
                formatter: function(item, value, cell) {
                    cell.style.position = "relative";

                    var result = domConstruct.create("div", {
                        "class": "inlineBlock",
                        "style": "margin-" + (domGeom.isBodyLtr()?"right":"left") + ":78px;"
                    });
                    var itemWrapper = domConstruct.create("div", {
                        "class": "inlineBlock"
                    });
                    domConstruct.place(itemWrapper, result);

                    if (item.security.read) {
                    var link = document.createElement("a");
                        link.href = "#environmentTemplate/" + item.id + "/-1";
                        link.innerHTML = item.name.escape();
                        domConstruct.place(link, itemWrapper);
                        domConstruct.place(self.actionsFormatter(item), result);
                    }
                    else {
                        result.innerHTML = item.name.escape();
                    }

                    return result;
                },
                orderField: "name",
                getRawValue: function(item) {
                    return item.name;
                }
            },{
                name: i18n("Description"),
                field: "description"
            }];

            self.grid = new TreeTable({
                serverSideProcessing: false,
                url: gridUrl,
                tableConfigKey: "environmentTemplateList",
                noDataMessage: i18n("No environment templates found."),
                columns: self.gridLayout,
                hidePagination: false,
                hideExpandCollapse: true,
                orderField: "name",
                sortType: "asc"
            });

            self.grid.placeAt(self.tableAttach);
        },

       /**
        *
        */
        showAddButton: function() {
            var self = this;
            if (!self.readOnly) {
                var newEnvironmentTemplateButton = new Button({
                    label: i18n("Create Environment Template"),
                    showTitle: false,
                    onClick: function() {
                        self.showNewEnvironmentTemplateDialog();
                    }
                });
                domClass.add(newEnvironmentTemplateButton.domNode, "idxButtonSpecial inlineBlock");
                newEnvironmentTemplateButton.placeAt(self.buttonAttach);
            }
        },

       /**
        *
        */
        showNewEnvironmentTemplateDialog: function() {
            var self = this;

            var newEnvironmentTemplateDialog = new Dialog({
                title: i18n("Create Environment Template"),
                closable: true,
                draggable: true
            });

            var editEnvironmentTemplate = new EditEnvironmentTemplate({
                applicationTemplate: self.applicationTemplate,
                callback: function(data) {
                    newEnvironmentTemplateDialog.hide();
                    newEnvironmentTemplateDialog.destroy();
                    navBar.setHash("environmentTemplate/" + data.id + "/-1");
                },
                cancelCallback: function() {
                    newEnvironmentTemplateDialog.hide();
                    newEnvironmentTemplateDialog.destroy();
                }
            });
            editEnvironmentTemplate.placeAt(newEnvironmentTemplateDialog);
            newEnvironmentTemplateDialog.show();
        },

       /**
        *
        */
        showEditEnvironmentTemplate: function(environmentTemplate) {
            var self = this;
            xhr.get({
                url: bootstrap.restUrl + "deploy/environmentTemplate/" + environmentTemplate.id,
                handleAs: "json",
                load: function(data) {
                    var editEnvironmentTemplateDialog = new Dialog({
                        title: i18n("Edit Environment Template"),
                        closable: true,
                        draggable: true
                    });

                    var editEnvironmentTemplate = new EditEnvironmentTemplate({
                        applicationTemplate: self.applicationTemplate,
                        environmentTemplate: data,
                        callback: function(data) {
                            editEnvironmentTemplateDialog.hide();
                            editEnvironmentTemplateDialog.destroy();
                            navBar.setHash("applicationTemplate/" + self.applicationTemplate.id
                                    + "/-1" + "/environmentTemplates", false, true);
                        },
                        cancelCallback: function() {
                            editEnvironmentTemplateDialog.hide();
                            editEnvironmentTemplateDialog.destroy();
                        }
                    });
                    editEnvironmentTemplate.placeAt(editEnvironmentTemplateDialog);
                    editEnvironmentTemplateDialog.show();
                },
                error: function(error) {
                    new Alert({
                        title: i18n("Error retrieving environment template for edit."),
                        message: error.responseText
                    }).startup();
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
                       "This will permanently delete it from the system.", target.name.escape()),
               action: function() {
                   self.grid.block();
                   xhr.del({
                       url: bootstrap.restUrl+"deploy/environmentTemplate/"+target.id,
                       handleAs: "json",
                       load: function(data) {
                           self.grid.unblock();
                           self.grid.refresh();
                           navBar.setHash("applicationTemplate/"+self.applicationTemplate.id+"/-1/environmentTemplates", false, true);
                       },
                       error: function(error) {
                           new Alert({
                               title: i18n("Error deleting environment template"),
                               message: error.responseText
                           }).startup();
                           self.grid.unblock();
                       }
                   });
               }
           });
       },

         /***********************************************************************
          * HOVER ACTIONS
          **********************************************************************/

         /**
          * This is responsible for creating the edit icon for row hover actions
          */
         addEditActions: function(item, result) {
             var self = this;
             if (!self.readOnly) {
                 var editButton = new Button({
                     showTitle: false,
                     iconClass: "editIcon",
                     title: i18n("Edit"),
                     onClick: function() {
                         self.showEditEnvironmentTemplate(item);
                     }
                 });
                 editButton.placeAt(result);
             }
         },

         /**
          * Returns all actions that can be taken on a row that require
          * write permission.
          */
         getRowWriteActions: function(item) {
             var self = this;
             if (!self.readOnly) {
                 return [{
                     label: i18n("Delete"),
                     onClick: function() {
                         self.confirmDelete(item);
                     }
                 }];
             }
         },

         /***********************************************************************
          * FORMATTERS
          **********************************************************************/

         /**
          * Responsible for creating the row hover actions
          */
         actionsFormatter: function(item) {
             var self = this;

             var result = domConstruct.create("div", {
                 "dir": util.getUIDir(),
                 "align": util.getUIDirAlign(),
                 "class": "tableHoverActions"
             });

             var menuActions = [];

             if (item.security["Edit Basic Settings"]) {
                 self.addEditActions(item, result);
                 array.forEach(self.getRowWriteActions(item), function(action) {
                     menuActions.push(action);
                 });
             }

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

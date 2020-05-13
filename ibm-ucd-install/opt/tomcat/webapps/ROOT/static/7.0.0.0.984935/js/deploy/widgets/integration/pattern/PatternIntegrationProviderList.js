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
    "dojo/_base/array",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/dom-geometry",
    "dojo/on",
    "deploy/widgets/Formatters",
    "deploy/widgets/integration/pattern/EditPatternIntegrationProvider",
    "js/webext/widgets/Dialog",
    "js/webext/widgets/GenericConfirm",
    "js/webext/widgets/form/MenuButton",
    "js/webext/widgets/table/TreeTable"],

function (_TemplatedMixin,
          _Widget,
          Button,
          declare,
          xhr,
          array,
          domClass,
          domConstruct,
          domGeom,
          on,
          Formatters,
          EditPatternIntegrationProvider,
          Dialog,
          GenericConfirm,
          MenuButton,
          TreeTable) {
    /**
     *
     */
    return declare('deploy.widgets.integration.pattern.PatternIntegrationProviderList', [_Widget, _TemplatedMixin], {
        templateString: '<div class="integrationProviderList">' + 
                            '<div class="listTopButtons" data-dojo-attach-point="buttonTopAttach"></div>' + 
                            '<div data-dojo-attach-point="integrationProviderList"></div>' + 
                        '</div>',
        /**
         *
         */
        postCreate: function () {
            this.inherited(arguments);
            var self = this;
            
            var gridRestUrl = bootstrap.restUrl + "integration/pattern";
            var gridLayout = [{
                name: i18n("Name"),
                field: "name",
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
                    });
                    domConstruct.place(itemWrapper, result);

                    var nameDiv = domConstruct.create("div");
                    nameDiv.innerHTML = item.name.escape();
                    domConstruct.place(nameDiv, itemWrapper);

                    domConstruct.place(self.actionsFormatter(item), result);

                    return result;
                }
            },{
                name: i18n("Description"),
                field: "description"
            }];

            this.grid = new TreeTable({
                url: gridRestUrl,
                serverSideProcessing: false,
                noDataMessage: i18n("No integration providers have been added yet."),
                tableConfigKey: "integrationProviderList",
                hidePagination: false,
                hideExpandCollapse: true,
                columns: gridLayout
            });
            this.grid.placeAt(this.integrationProviderList);

            if (config.data.permissions[security.system.manageBlueprintDesignIntegrations]) {
                var integrationProviderButton = new Button({
                    label: i18n("New Blueprint Designer Integration"),
                    showTitle: false,
                    onClick: function () {
                        self.showEditIntegrationProviderDialog();
                    }
                });
                domClass.add(integrationProviderButton.domNode, "idxButtonSpecial");
                integrationProviderButton.placeAt(this.buttonTopAttach);
            }
        },

        actionsFormatter: function (item) {
            var self = this;

            var result = domConstruct.create("div", {
                "dir": util.getUIDir(),
                "align": util.getUIDirAlign(),
                "class": "tableHoverActions"
            });

            var menuActions = [];

            if (config.data.permissions[security.system.manageBlueprintDesignIntegrations]) {
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
        },

        getRowWriteActions: function(item) {
            var self = this;
            return [{
                label: i18n("Delete"),
                onClick: function() {
                    self.showDeleteConfirm(item);
                }
            }];
        },

        addEditActions: function(item, result) {
            var self = this;
            var editButton = new Button({
                showTitle: false,
                iconClass: "editIcon",
                title: i18n("Edit"),
                onClick: function() {
                    self.showEditIntegrationProviderDialog(item);
                }
            });
            editButton.placeAt(result);
        },

        /**
         *
         */
        showEditIntegrationProviderDialog: function (item) {
            var self = this;

            var newIntegrationProviderDialog = new Dialog({
                title: (item ? i18n("Edit Blueprint Designer Integration") : i18n("New Blueprint Designer Integration")),
                closable: true,
                draggable: true
            });

            var newIntegrationProviderForm = new EditPatternIntegrationProvider({
                integrationProvider: item,
                callback: function () {
                    newIntegrationProviderDialog.hide();
                    newIntegrationProviderDialog.destroy();
                    self.grid.refresh();
                }
            });

            newIntegrationProviderForm.placeAt(newIntegrationProviderDialog.containerNode);
            newIntegrationProviderDialog.show();
        },

        showDeleteConfirm: function (item) {
            var self = this;
            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to delete this Blueprint Designer Integration?"),
                action: function () {
                    xhr.del({
                        url: bootstrap.restUrl + "integration/pattern/" + item.id,
                        load: function () {
                            self.grid.refresh();
                        }
                    });
                }
            });
        }
    });
});

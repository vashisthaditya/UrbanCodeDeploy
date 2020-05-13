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
        "dojo/aspect",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/on",
        "deploy/widgets/security/resourceRole/EditResourceRole",
        "js/webext/widgets/Alert",
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
        aspect,
        domClass,
        domConstruct,
        on,
        EditResourceRole,
        Alert,
        Dialog,
        GenericConfirm,
        TreeTable
) {
    /**
     *
     */
    return declare('deploy.widgets.security.resourceRole.ResourceRoleList',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="resourceRoleList">'+
                '<div data-dojo-attach-point="buttonAttach"></div>'+
                '<div data-dojo-attach-point="gridAttach"></div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            var gridRestUrl = bootstrap.baseUrl + "security/resourceType/" + self.resourceType.name + "/resourceRoles";
            var gridLayout = [{
                name: i18n("Type"),
                field: "name",
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
                formatter: this.actionsFormatter,
                parentWidget: this
            }];

            var typeName = self.resourceType.name;
            self._hasSplicedIn = false; // For controlling when we want to jerry-rig in the standard type
            var spliceInStandardType = function(data) {
                if (!self._hasSplicedIn) {
                    var standardName = "Standard "+typeName;
                    data.splice(0, 0, {
                        name: i18n(standardName),
                        isStandard: true
                    });
                    self._hasSplicedIn = true;
                }
            };

            self.grid = new TreeTable({
                url: gridRestUrl,
                processXhrResponse: spliceInStandardType,
                serverSideProcessing: false,
                columns: gridLayout,
                orderField: "name",
                tableConfigKey: "resourceRoleList",
                hideExpandCollapse: true,
                hidePagination: false
            });
            self.grid.placeAt(self.gridAttach);
            aspect.before(self.grid, "refresh", function() {
                // Refreshing loses our standard type, so flag it to be placed back in
                self._hasSplicedIn = false;
            });

            var newResourceRoleButton = new Button({
                label: i18n("Create Type"),
                showTitle: false,
                onClick: function() {
                    self.showEditResourceRoleDialog();
                }
            });
            domClass.add(newResourceRoleButton.domNode, "idxButtonSpecial");
            newResourceRoleButton.placeAt(this.buttonAttach);
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
            
            if (!item.isStandard) {
                var editLink = domConstruct.create("a", {
                    "innerHTML": i18n("Edit"),
                    "class": "actionsLink linkPointer"
                }, result);
                on(editLink, "click", function() {
                    self.showEditResourceRoleDialog(item);
                });
                
                var deleteLink = domConstruct.create("a", {
                    "innerHTML": i18n("Delete"),
                    "class": "actionsLink linkPointer"
                }, result);
                on(deleteLink, "click", function() {
                    self.confirmDeletion(item);
                });
            }
            return result;
        },

        /**
         * 
         */
        confirmDeletion: function(item) {
            var self = this;
            
            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to delete type '%s'?", item.name.escape()),
                action: function() {
                    xhr.del({
                        url: bootstrap.baseUrl + "security/resourceRole/" + item.id,
                        load: function() {
                            self.grid.refresh();
                        },
                        error: function(data) {
                            var deleteError = new Alert({
                                message: util.escape(data.responseText)
                            });
                        }
                    });
                }
            });
        },
        
        /**
         * 
         */
        showEditResourceRoleDialog: function(item) {
            var self = this;
            
            var newResourceRoleDialog = new Dialog({
                title: i18n("Create Type"),
                closable: true,
                draggable: true
            });
            
            var newResourceRoleForm = new EditResourceRole({
                resourceRole: item,
                resourceType: self.resourceType,
                callback: function(refresh) {
                    newResourceRoleDialog.hide();
                    newResourceRoleDialog.destroy();
                    if (refresh) {
                        self.grid.refresh();
                    }
                }
            });
            newResourceRoleForm.placeAt(newResourceRoleDialog.containerNode);
            newResourceRoleDialog.show();
        }
    });
});
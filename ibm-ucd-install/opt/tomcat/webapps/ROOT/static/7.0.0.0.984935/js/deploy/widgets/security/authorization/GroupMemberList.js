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
        "deploy/widgets/security/authorization/SelectGroupMemberForm",
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
        SelectGroupMemberForm,
        Dialog,
        GenericConfirm,
        Table
) {
    /**
     *
     */
    return declare('deploy.widgets.security.authorization.GroupMemberList',  [_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="groupMemberList">'+
                '<div data-dojo-attach-point="buttonAttach"></div>'+
                '<div data-dojo-attach-point="gridAttach"></div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            var gridRestUrl = bootstrap.baseUrl + "security/group/" + this.group.id + "/members";
            var gridLayout = [{
                name: i18n("User"),
                field: "displayName",
                orderField: "name",
                filterField: "name",
                filterType: "text",
                getRawValue: function(item) {
                    return item.displayName;
                }
            },{
                name: i18n("Actions"),
                formatter: this.actionsFormatter,
                parentWidget: this
            }];

            this.grid = new Table({
                url: gridRestUrl,
                serverSideProcessing: false,
                columns: gridLayout,
                tableConfigKey: "secGroupMemberList",
                noDataMessage: i18n("No members have been added yet."),
                hideExpandCollapse: true,
                hidePagination: false
            });
            this.grid.placeAt(this.gridAttach);

            var newGroupButton = new Button({
                label: i18n("Add Member"),
                showTitle: false,
                onClick: function() {
                    self.showAddGroupMemberDialog({});
                }
            });
            domClass.add(newGroupButton.domNode, "idxButtonSpecial");
            newGroupButton.placeAt(this.buttonAttach);
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
            
            var result = domConstruct.create("a", {
                "innerHTML": i18n("Remove"),
                "class": "actionsLink linkPointer"
            });
            on(result, "click", function() {
                self.confirmRemoval(item);
            });
            
            return result;
        },

        /**
         * 
         */
        confirmRemoval: function(item) {
            var self = this;
            
            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to remove member '%s'?", item.name.escape()),
                action: function() {
                    xhr.del({
                        url: bootstrap.baseUrl + "security/group/" + self.group.id + "/members/" + item.id,
                        load: function() {
                            self.grid.refresh();
                        }
                    });
                }
            });
        },
        
        /**
         * 
         */
        showAddGroupMemberDialog: function() {
            var self = this;
            
            var selectGroupMemberDialog = new Dialog({
                title: i18n("Add Group Member"),
                closable: true,
                draggable: true
            });
            

            var selectGroupMemberForm = new SelectGroupMemberForm({
                group: self.group,
                saveUrl: bootstrap.baseUrl + "security/group/" + self.group.id + "/members",
                callback: function(selected) {
                    selectGroupMemberDialog.hide();
                    selectGroupMemberDialog.destroy();
                    if (selected) {
                        self.grid.refresh();
                    }
                }
            });
            selectGroupMemberForm.placeAt(selectGroupMemberDialog.containerNode);
            selectGroupMemberDialog.show();
        }
    });
});
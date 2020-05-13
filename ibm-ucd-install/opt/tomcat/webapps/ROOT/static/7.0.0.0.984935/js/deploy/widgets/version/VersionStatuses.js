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
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/on",
        "deploy/widgets/Formatters",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/RestSelect",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        declare,
        xhr,
        domConstruct,
        domClass,
        on,
        Formatters,
        ColumnForm,
        Dialog,
        GenericConfirm,
        RestSelect,
        Table
) {
    /**
     *
     */
    return declare('deploy.widgets.version.VersionStatuses',  [_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="versionStatuses">' +
                '<div class="listTopButtons" data-dojo-attach-point="buttonAttach"></div>' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            var gridLayout = [{
                name: i18n("Status"),
                field: "status",
                formatter: function(item, value, cell) {
                    return Formatters.statusFormatter(item, value, cell);
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

            var gridRestUrl = bootstrap.restUrl+"deploy/version/"+this.version.id+"/status";
            this.grid = new Table({
                url: gridRestUrl,
                serverSideProcessing: false,
                columns: gridLayout,
                tableConfigKey: "versionStatusList",
                noDataMessage: i18n("No statuses have been assigned to this version."),
                hidePagination: false,
                hideExpandCollapse: true
            });
            this.grid.placeAt(this.gridAttach);
            
            if (appState.component.extendedSecurity[security.component.manageVersions]) {
                var newStatusButton = new Button({
                    label: i18n("Add a Status"),
                    showTitle: false,
                    onClick: function() {
                        self.showAddStatus();
                    }
                });
                domClass.add(newStatusButton.domNode, "idxButtonSpecial");
                newStatusButton.placeAt(this.buttonAttach);
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
        actionsFormatter: function(item, value, cell) {
            var self = this.parentWidget;
            var result = document.createElement("div");
            
            if (appState.component.extendedSecurity[security.component.manageVersions]) {
                var removeLink = domConstruct.create("a", {
                    "innerHTML": i18n("Remove"),
                    "class": "actionsLink linkPointer"
                }, result);
                on(removeLink, "click", function() {
                    self.confirmRemoval(item);
                });
            }
            
            return result;
        },
        
        /**
         * 
         */
        confirmRemoval: function(status) {
            var self = this;
            
            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to remove %s?", status.name.escape()),
                action: function() {
                    xhr.del({
                        url: bootstrap.restUrl+"deploy/version/"+self.version.id+"/status/"+util.encodeIgnoringSlash(status.name),
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
        showAddStatus: function() {
            var self = this;
            
            var formDialog = new Dialog({
                title: i18n("Add a Status"),
                closable: true,
                draggable: true
            });
            
            var addForm = new ColumnForm({
                submitUrl: bootstrap.restUrl, // Overridden later depending on the status selected.
                postSubmit: function(data) {
                    formDialog.hide();
                    formDialog.destroy();
                    self.grid.refresh();
                },
                onCancel: function() {
                    formDialog.hide();
                    formDialog.destroy();
                    self.grid.refresh();
                }
            });
            
            var submitUrl = null;
            var statusSelect = new RestSelect({
                restUrl: bootstrap.restUrl+"deploy/version/" + self.version.id + "/possibleStatuses",
                getValue: function(item) {
                    return item.name;
                },
                getStyle: function(item) {
                    return Formatters.conditionFormatter(item);
                },
                allowNone: false,
                onChange: function(value, item) {
                    if (item && item.name) {
                    addForm.submitUrl = bootstrap.restUrl+"deploy/version/"+self.version.id+"/status/"+util.encodeIgnoringSlash(item.name);
                    }
                }
            });
            addForm.addField({
                name: "status",
                label: i18n("Status"),
                required: true,
                widget: statusSelect
            });

            addForm.placeAt(formDialog.containerNode);
            formDialog.show();
        }
    });
});
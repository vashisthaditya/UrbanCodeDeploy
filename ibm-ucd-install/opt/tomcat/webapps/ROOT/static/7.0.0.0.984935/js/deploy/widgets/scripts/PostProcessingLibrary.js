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
        "deploy/widgets/scripts/PostScriptEditorDialog",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/Alert",
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
        PostScriptEditorDialog,
        Dialog,
        Alert,
        GenericConfirm,
        Table
) {
    return declare('deploy.widgets.scripts.PostProcessingLibrary',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="scriptList">' +
                '<div class="listTopButtons" data-dojo-attach-point="buttonTopAttach"></div>' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',

        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            var gridRestUrl = bootstrap.restUrl+'script/postprocessing';
            var gridLayout = [{
                name: i18n("Name"),
                field:"name",
                orderField: "name",
                filterField: "name",
                filterType: "text",
                getRawValue: function(item) {
                    return item.name;
                },
                formatter: this.scriptNameFormatter,
                parentWidget: this

            },{
                name: i18n("Description"),
                field: "description"
            },{
                name: i18n("Actions"),
                formatter: this.actionsFormatter,
                parentWidget: this
            }];

            this.grid = new Table({
                url: gridRestUrl,
                serverSideProcessing: false,
                noDataMessage: i18n("No scripts founds"),
                tableConfigKey: "postProcessScriptList",
                columns: gridLayout,
                hideExpandCollapse: true,
                hidePagination: false
            });
            this.grid.placeAt(this.gridAttach);

            if (self.hasManageScriptPermission()) {
                var newScriptButton = {
                        label: i18n("Create Script"),
                        showTitle: false,
                        onClick: function() {
                            self.showEditScriptDialog();
                        }
                };

                var topButton = new Button(newScriptButton);
                domClass.add(topButton.domNode, "idxButtonSpecial");
                topButton.placeAt(this.buttonTopAttach);
            }
        },

        destroy: function() {
            this.inherited(arguments);
            this.grid.destroy();
        },

        actionsFormatter: function(item) {
            var self = this.parentWidget;

            var result = document.createElement("div");

            if (self.hasManageScriptPermission()) {
                var copyLink = domConstruct.create("a", {
                    "class": "actionsLink linkPointer",
                    "innerHTML": i18n("Copy")
                }, result);
                on(copyLink, "click", function() {
                    self.showEditScriptDialog(undefined, item);
                });

                var editLink = domConstruct.create("a", {
                    "class": "actionsLink linkPointer",
                    "innerHTML": i18n("Edit")
                }, result);
                on(editLink, "click", function() {
                    self.showEditScriptDialog(item);
                });

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

        scriptNameFormatter: function(item) {
            var self = this.parentWidget;

            var result = document.createElement("div");

            var nameLink = domConstruct.create("a", {
                "class": "namesLink linkPointer",
                "innerHTML": i18n(item.name)
            }, result);
            on(nameLink, "click", function() {
                self.showEditScriptDialog(item);
            });

            return result;
        },

        showEditScriptDialog: function(script, source) {
            var self = this;

            var scriptDialog = PostScriptEditorDialog({
                script: script,
                readOnly: !self.hasManageScriptPermission(),
                source: source,
                callback: function(data) {
                    self.grid.refresh();
                }
            });
            scriptDialog.show();
        },

        confirmDelete: function(target) {
            var self = this;
            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to delete %s?", target.name),
                action: function() {
                    self.grid.block();
                    xhr.del({
                        url: bootstrap.restUrl+"script/postprocessing/"+target.id,
                        handleAs: "json",
                        load: function(data) {
                            self.grid.unblock();
                            self.grid.refresh();
                        }
                    });
                }
            });
        },

        hasManageScriptPermission: function() {
            var hasPermission = false;
            if (config && config.data &&
                    config.data.permissions &&
                    config.data.permissions[security.system.managePostProcessingScripts]) {
                hasPermission = true;
            }
            return hasPermission;
        }
    });
});
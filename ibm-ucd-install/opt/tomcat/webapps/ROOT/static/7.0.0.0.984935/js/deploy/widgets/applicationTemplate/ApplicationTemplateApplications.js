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
        "deploy/widgets/application/EditApplication",
        "deploy/widgets/application/wizard/ApplicationWizard",
        "deploy/widgets/application/wizard/WizardProgressVisualization",
        "js/webext/widgets/Dialog",
        "deploy/widgets/wizard/WizardDialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/table/TreeTable"
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
        EditApplication,
        ApplicationWizard,
        WizardProgressVisualization,
        Dialog,
        WizardDialog,
        GenericConfirm,
        TreeTable
) {
    /**
     *
     */
    return declare('deploy.widgets.applicationTemplate.ApplicationTemplateApplications',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="applicationList">' +
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

            var gridRestUrl = bootstrap.restUrl+"deploy/application/";
            var gridLayout = [{
                name: i18n("Name"),
                formatter: this.applicationFormatter,
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

            var applicationTemplateApplicationFilters = [
                  activeFilter,
                  {
                      name: "templateId",
                      type: "eq",
                      className: "UUID",
                      values: [self.applicationTemplate.id]
                  }];

            this.grid = new TreeTable({
                url: gridRestUrl,
                orderField: "name",
                serverSideProcessing: true,
                noDataMessage: i18n("No applications found."),
                tableConfigKey: "applicationTemplateComponentList",
                columns: gridLayout,
                hidePagination: false,
                hideExpandCollapse: true,
                queryData: {
                    outputType: ["BASIC", "LINKED", "SECURITY"]
                },
                baseFilters: applicationTemplateApplicationFilters
            });
            this.grid.placeAt(this.gridAttach);

            if (config.data.permissions[security.system.createApplicationsFromTemplate]) {
                var newApplicationButton = {
                    label: i18n("Create Application"),
                    showTitle: false,
                    onClick: function() {
                        self.showNewApplicationDialog();
                    }
                };

                var topButton = new Button(newApplicationButton);
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
        applicationFormatter: function(item) {
            var result = document.createElement("a");
            result.innerHTML = item.name.escape();
            result.href = "#application/"+item.id;
            return result;
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

            return result;
        },

        /**
         *
         */
        confirmDelete: function(target) {
            var self = this;
            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to delete application %s?", target.name.escape()),
                action: function() {
                    self.grid.block();
                    xhr.del({
                        url: bootstrap.restUrl+"deploy/application/"+target.id,
                        handleAs: "json",
                        load: function(data) {
                            self.grid.unblock();
                            self.grid.refresh();
                        }
                    });
                }
            });
        },

        /**
         *
         */
        showNewApplicationDialog: function(source) {
            // TODO: Source
            var self = this;
            var applicationWizard = new ApplicationWizard({
                applicationTemplate: this.applicationTemplate
            });

            var newApplicationDialog = new WizardDialog({
                title: i18n("Create Application"),
                closable: true,
                draggable: true,
                progressVisualization: WizardProgressVisualization,
                wizard: applicationWizard
            });

            applicationWizard.cleanup = function() {
                newApplicationDialog.hide();
                newApplicationDialog.destroy();
                self.grid.refresh();
            };

            newApplicationDialog.connect(newApplicationDialog, "hide", function(e) {
                applicationWizard.destroy();
                newApplicationDialog.destroy();
            });

            applicationWizard.startup();
            newApplicationDialog.show();
        }
    });
});

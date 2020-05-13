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
        "dijit/form/Button",
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/dom-style",
        "dojo/dom-geometry",
        "dojo/on",
        "dojo/mouse",
        "dojox/html/entities",
        "deploy/widgets/Formatters",
        "deploy/widgets/application/RunApplicationProcess",
        "deploy/widgets/environment/EditEnvironment",
        "deploy/widgets/environment/EnvironmentSummary",
        "deploy/widgets/snapshot/SnapshotRequestHistory",
        "js/webext/widgets/color/Color",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/RestSelect",
        "js/webext/widgets/form/MenuButton"
        ],
function(
        Button,
        array,
        declare,
        xhr,
        domClass,
        domConstruct,
        domStyle,
        domGeom,
        on,
        mouse,
        entities,
        Formatters,
        RunApplicationProcess,
        EditEnvironment,
        EnvironmentSummary,
        SnapshotRequestHistory,
        Color,
        ColumnForm,
        Dialog,
        GenericConfirm,
        RestSelect,
        MenuButton
) {
    /**
     *
     */
    return declare('deploy.widgets.snapshot.SnapshotEnvironmentSummary',  [EnvironmentSummary], {
            templateString:
                '<div class="environment-summary snapshot-environment-summary environmentSummary snapshotEnvironmentSummary">'+
                    '<div class="environment-summary-highlight left" data-dojo-attach-point="highlightAttachLeft"></div>'+
                    '<div class="environment-summary-highlight right" data-dojo-attach-point="highlightAttachRight"></div>'+
                    '<div class="environment-summary-wrapper">'+
                        '<div class="environmentContainer environment-information-container no-double-click-select" data-dojo-attach-point="environmentContainer">'+
                            '<div class="environment-compliancy" data-dojo-attach-point="compliancyBackgroundAttach">'+
                                '<div data-dojo-attach-point="compliancyAttach" class="environment-compliancy-wrapper"></div>'+
                            '</div>'+
                            '<div class="environment-inner-container">'+
                                '<div data-dojo-attach-point="latestSnapshotAttach" class="inlineBlock environmentLatestSnapshot"></div>'+
                                '<div data-dojo-attach-point="blueprintAttach" class="inlineBlock external-blueprint"></div>'+
                            '</div>'+
                        '</div>'+
                        '<div class="environment-name-container" data-dojo-attach-point="nameContainerAttach">'+
                            '<div class="environment-summary-buttons"" data-dojo-attach-point="buttonsAttach">'+
                                '<div data-dojo-attach-point="executeAttach" class="inlineBlock button-container request-process"></div>'+
                                '<div data-dojo-attach-point="previewAttach" class="inlineBlock button-container preview-snapshot"></div>'+
                            '</div>' +
                            '<div data-dojo-attach-point="nameAttach" class="environment-name"></div>'+
                        '</div>'+
                        '<div class="clear"></div>'+
                        '<div data-dojo-attach-point="detailsAttach" class="environment-details">'+
                            '<div data-dojo-attach-point="gridAttach"></div>'+
                        '</div>'+
                    '</div>'+
                '</div>',

        /**
         *
         */
        postCreate: function() {
            var self = this;
            domClass.add(this.domNode, "snapshot-environment-summary snapshotEnvironmentSummary");

            if (this.environment.security.execute) {
                var deployButton = domConstruct.create("div", {
                    className: "environment-summary-button",
                    title: i18n("Request Process")
                }, this.executeAttach);
                domConstruct.create("div", {
                    className: "general-icon executeIcon"
                }, deployButton);
                on(deployButton, "click", function(){
                    self.showRunProcessDialog();
                });
            }

            var previewButton = domConstruct.create("div", {
                className: "environment-summary-button",
                title: i18n("Preview")
            }, this.previewAttach);
            domConstruct.create("div", {
                className: "general-icon preview-icon"
            }, previewButton);
            on(previewButton, "click", function(){
                self.showPreviewDialog();
            });

            this._postCreate();
            var totalCount = this.environment.desiredVersions;
            var compliantCount = this.environment.correctVersions;
            if (totalCount > 0) {
                domConstruct.create("div", {
                    className: "successMeter",
                    style: {
                        width: (compliantCount/totalCount)*100+"%"
                    }
                }, self.compliancyAttach);
                domConstruct.create("div", {
                    className: "failMeter failed-state-color",
                    style: {
                        width: 100-(compliantCount/totalCount)*100+"%"
                    }
                }, self.compliancyAttach);

                var snapshotVersionsLabel = domConstruct.create("div", {
                    className: "compliancy-label"
                }, self.latestSnapshotAttach, "before");
                domConstruct.create("span", {
                    innerHTML: i18n("%s / %s Snapshot Versions Found", compliantCount, totalCount)
                }, snapshotVersionsLabel);

            }
            else {
                var environmentColorObject = Color.getColorOrConvert(self.environment.color);
                if (!environmentColorObject.standard && environmentColorObject.fallback){
                    environmentColorObject = Color.getColor(environmentColorObject.fallback);
                }
                var environmentColor = environmentColorObject.value;
                domStyle.set(self.compliancyBackgroundAttach, "backgroundColor", util.getTint(environmentColor, 0.1));
                domConstruct.create("span", {
                    innerHTML: i18n("%s / %s Snapshot Versions Found", compliantCount, totalCount)
                }, self.compliancyAttach);
            }
        },

        /**
         *
         */
        destroy: function() {
            this.inherited(arguments);
            if (this.historyGrid) {
                this.historyGrid.destroy();
            }
        },

        expandEnvironment: function(){
            domClass.add(this.domNode, "expanded");
            this.showHistoryGrid();
            this.expanded = true;
        },

        /**
         *
         */
        showHistoryGrid: function() {
            if (!this.historyGrid){
                this.historyGrid = new SnapshotRequestHistory({
                    snapshot: this.snapshot,
                    environment: this.environment,
                    application: this.application
                });
                this.historyGrid.placeAt(this.gridAttach);
            }
        },

        /**
         *
         */
        showRunProcessDialog: function() {
            var runProcessDialog = new Dialog({
                title: i18n("Run Process on %s", util.escape(this.environment.name)),
                closable: true,
                draggable: true
            });

            var runProcessForm = new RunApplicationProcess({
                application: this.application,
                environment: this.environment,
                snapshot: this.snapshot,
                callback: function() {
                    runProcessDialog.hide();
                    runProcessDialog.destroy();
                }
            });

            runProcessForm.placeAt(runProcessDialog.containerNode);
            runProcessDialog.show();
        },

        /**
         *
         */
        showPreviewDialog: function() {
            var self = this;

            var dialog = new Dialog({
                title: i18n("Preview Deployment")
            });

            var form = new ColumnForm({
                saveLabel: i18n("OK"),
                onSubmit: function(submitData) {
                    dialog.hide();
                    dialog.destroy();
                    navBar.setHash("deploymentPreview/"+self.snapshot.id+"/"+self.environment.id+"/"+submitData.applicationProcessId, false, true);
                },
                onCancel: function() {
                    dialog.hide();
                    dialog.destroy();
                }
            });

            // Application Process
            var applicationProcessSelect = new RestSelect({
                restUrl: bootstrap.restUrl+"deploy/application/"+this.application.id+"/processes/false",
                allowNone: false
            });
            form.addField({
                name: "applicationProcessId",
                label: i18n("Process"),
                required: true,
                widget: applicationProcessSelect
            });

            form.placeAt(dialog.containerNode);
            dialog.show();
        }
    });
});
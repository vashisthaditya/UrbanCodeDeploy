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
        "dijit/popup",
        "dijit/TooltipDialog",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/dom-attr",
        "dojo/dom-style",
        "dojo/dom-geometry",
        "dojo/on",
        "dojo/mouse",
        "deploy/widgets/Formatters",
        "deploy/widgets/application/RunApplicationProcess",
        "deploy/widgets/environment/EditEnvironment",
        "js/webext/widgets/Alert",
        "js/webext/widgets/color/Color",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/RestSelect",
        "js/webext/widgets/table/TreeTable",
        "js/webext/widgets/form/MenuButton",
        "deploy/widgets/environment/CreateEnvironmentDialog",
        "deploy/widgets/environment/EditLandscaperBlueprintProperties"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        popup,
        TooltipDialog,
        declare,
        xhr,
        domClass,
        domConstruct,
        domAttr,
        domStyle,
        domGeom,
        on,
        mouse,
        Formatters,
        RunApplicationProcess,
        EditEnvironment,
        Alert,
        Color,
        ColumnForm,
        Dialog,
        RestSelect,
        TreeTable,
        MenuButton,
        CreateEnvironmentDialog,
        EditLandscaperBlueprintProperties
) {
    /**
     *
     */
    return declare([_Widget, _TemplatedMixin], {
        templateString:
        '<div class="environment-summary environmentSummary">'+
            '<div class="environment-summary-highlight left" data-dojo-attach-point="highlightAttachLeft"></div>'+
            '<div class="environment-summary-highlight right" data-dojo-attach-point="highlightAttachRight"></div>'+
            '<div class="environment-summary-wrapper">'+
                '<div class="environmentContainer environment-information-container no-double-click-select" data-dojo-attach-point="environmentContainer">'+
                    '<div class="environment-compliancy" data-dojo-attach-point="compliancyBackgroundAttach">'+
                        '<div data-dojo-attach-point="compliancyAttach" class="environment-compliancy-wrapper"></div>'+
                    '</div>'+
                    '<div class="environment-inner-container">'+
                        '<div data-dojo-attach-point="latestSnapshotAttach" class="inlineBlock environment-latest-snapshot"></div>'+
                        '<div data-dojo-attach-point="blueprintAttach" class="inline-block external-blueprint"></div>'+
                    '</div>'+
                '</div>'+
                '<div class="environment-name-container" data-dojo-attach-point="nameContainerAttach">'+
                    '<div class="environment-summary-buttons" data-dojo-attach-point="buttonsAttach">'+
                        '<div data-dojo-attach-point="executeAttach" class="inlineBlock button-container request-process"></div>'+
                        '<div data-dojo-attach-point="snapshotAttach" class="inlineBlock button-container create-snapshot"></div>'+
                        '<div data-dojo-attach-point="actionsAttach" class="inlineBlock button-container environment-actions environmentActions"></div>'+
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
            this.inherited(arguments);
            var self = this;

            if (this.environment.security.execute) {
                var deployButton = domConstruct.create("div", {
                    className: "environment-summary-button",
                    title: i18n("Request Process")
                }, this.executeAttach);
                domConstruct.create("div", {
                    className: "general-icon executeIcon"
                }, deployButton);
                on(deployButton, "click", function(){
                    self.showDeployDialog();
                });
            }

            if (appState.application && appState.application.extendedSecurity &&
                appState.application.extendedSecurity[security.application.manageSnapshots]) {
                var createSnapshotButton = domConstruct.create("div", {
                    className: "environment-summary-button",
                    title: i18n("Create Snapshot")
                }, this.snapshotAttach);
                domConstruct.create("div", {
                    className: "general-icon snapshotIcon"
                }, createSnapshotButton);
                on(createSnapshotButton, "click", function(){
                    self.showNewSnapshotDialog();
                });
            }

            var actionOptions = [{
                label: i18n("Compare To"),
                onClick: function() {
                    self.showCompareDialog();
                }
            }];
            if (appState.application && appState.application.security && appState.application.security["Manage Environments"]) {
                actionOptions.push({
                    label: i18n("Copy"),
                    onClick: function() {
                        self.showCopyDialog();
                    }
                });
            }
            if (this.environment.security["Edit Basic Settings"]) {
                actionOptions.push({
                    label: i18n("Edit"),
                    onClick : function() {
                        self.showEditDialog();
                    }
                });
            }

            var isCloudEnvironment = this.environment.extEnvironment && this.environment.extEnvironment.length > 0;
            if (appState.application && appState.application.security && appState.application.security["Manage Environments"] && isCloudEnvironment) {
                actionOptions.push({
                    label: i18n("Update from Blueprint..."),
                    onClick: function() {
                        self.showUpdateFromBlueprintDialog();
                    }
                });
            }

            if (this.environment.security.Delete) {
                actionOptions.push({
                    label: i18n("Delete"),
                    onClick : function() {
                        self.confirmDelete();
                    }
                });
            }

            var actionsButton = new MenuButton({
                options: actionOptions,
                title: i18n("More..."),
                iconClass: "general-icon more-actions-icon"
            });
            actionsButton.placeAt(this.actionsAttach);

            domConstruct.create("div", {
                innerHTML: i18n("Snapshot:")+"&nbsp;",
                className: "snapshot-label"
            }, this.latestSnapshotAttach);
            if (this.environment.latestSnapshot) {
                domConstruct.create("a", {
                    innerHTML: this.environment.latestSnapshot.name.escape(),
                    href: "#snapshot/"+this.environment.latestSnapshot.id
                }, this.latestSnapshotAttach);
            }
            else {
                domConstruct.create("div", {
                    innerHTML: i18n("None")
                }, this.latestSnapshotAttach);
            }

            this._postCreate();
        },

        _postCreate: function(){
            var self = this;

            var expandNode = domConstruct.create("div", {
                className: "expand-node-container"
            }, this.nameContainerAttach);

            var expandNodeArrow = domConstruct.create("div", {
                "class": "expandNode inline-block"
            }, expandNode);

            // Click on expand node or double click on name / container to expand.
            on(expandNode, "click", function() {
                self.toggleExpand();
            });
            on(this.nameContainerAttach, "dblclick", function() {
                self.toggleExpand();
            });
            on(this.environmentContainer, "dblclick", function() {
                self.toggleExpand();
            });

            // Environment Colors
            var environmentColorObject = Color.getColorOrConvert(this.environment.color);
            if (!environmentColorObject.standard && environmentColorObject.fallback){
                environmentColorObject = Color.getColor(environmentColorObject.fallback);
            }
            var environmentColor = environmentColorObject.value;
            var environmentTint = util.getTint(environmentColor, 0.25);

            domStyle.set(this.detailsAttach, "borderColor", environmentColor);
            domStyle.set(this.detailsAttach, "borderRightColor", environmentTint);
            if (environmentColorObject.light){
                domClass.add(this.domNode, "light-colored-environment");
            }
            if (util.isDarkColor(environmentColor)){
                domClass.add(this.domNode, "dark-colored-environment");
            }
            domStyle.set(this.nameContainerAttach, "backgroundColor", environmentColor);
            domStyle.set(this.highlightAttachLeft, "backgroundColor", environmentColor);
            domStyle.set(this.highlightAttachRight, "backgroundColor", environmentTint);
            domStyle.set(this.environmentContainer, "backgroundColor", environmentTint);
            domStyle.set(this.compliancyBackgroundAttach, "backgroundColor", util.getTint(environmentColor, 0.80));
            var actionsAttach = this.actionsAttach || this.previewAttach;
            if (actionsAttach){
                domStyle.set(actionsAttach, "borderRightColor", environmentTint);
            }

            var environmentDescription = this.environment.description;
            var environmentNameLabel = domConstruct.create("a", {
                innerHTML: this.environment.name.escape(),
                href: "#environment/"+this.environment.id,
                className: "environment-name-label",
                title: this.environment.name + (environmentDescription === "" ? "" : " - (" + environmentDescription + ")")
            }, this.nameAttach);
            domAttr.set(this.nameAttach, "alt", "Environment: " + this.environment.name);

            var isCloudEnvironment = this.environment.extEnvironment && this.environment.extEnvironment.length > 0;
            var hasBlueprint = this.environment.blueprint;
            if (isCloudEnvironment){
                var cloudIcon = domConstruct.create("div", {
                    className: "inline-block cloud-container",
                    style: {
                        backgroundColor: environmentColor
                    }
                }, this.nameAttach, "first");
                domConstruct.create("div", {
                    className: "general-icon cloud-icon"
                }, cloudIcon);
                domClass.add(this.nameAttach, "cloud-environment");
            }
            if (isCloudEnvironment || hasBlueprint){
                var extEnvironment = isCloudEnvironment ? this.environment.extEnvironment[0] : null;
                domConstruct.create("div", {
                    innerHTML: i18n("Blueprint:")
                }, this.blueprintAttach);

                if (extEnvironment){
                    domConstruct.create("a", {
                        innerHTML: extEnvironment.externalBlueprintName.escape(),
                        href: extEnvironment.externalBlueprintUrl
                    }, this.blueprintAttach);
                }
                else {
                    domConstruct.create("div", {
                        innerHTML: this.environment.blueprint.name.escape(),
                        className: "no-link"
                    }, this.blueprintAttach);
                }
                domClass.add(this.latestSnapshotAttach, "blueprint-environment");
            }

            // Scroll Environment Name on Overflow.
            var environmentNameLabelOverflow = domConstruct.create("a", {
                innerHTML: this.environment.name.escape(),
                href: "#environment/"+this.environment.id,
                className: "environment-name-label-overflow hidden",
                title: this.environment.name + (environmentDescription === "" ? "" : " - (" + environmentDescription + ")")
            }, this.nameAttach);
            var intervalId = null;
            var showOverflow = false;
            var showOverflowMargin = 0;
            on(self.domNode, mouse.enter, function(){
                if (self.nameContainerAttach && self.buttonsAttach){
                    var nameContainerPosition = domGeom.position(self.nameContainerAttach);
                    var nameLabelPosition = domGeom.position(environmentNameLabel);
                    var buttonsPosition = domGeom.position(self.buttonsAttach);
                    if (nameContainerPosition && nameLabelPosition){
                        var nameLabelWidth = nameLabelPosition.w;
                        var nameContainerWidth = nameContainerPosition.w - buttonsPosition.w - 15;
                        if (isCloudEnvironment){
                            nameContainerWidth -= 25;
                        }
                        else {
                            nameLabelWidth += 20;
                        }
                        if (nameContainerWidth < nameLabelWidth){
                            var pixelLeft = 1;
                            var pauseDelay = 25;
                            var increment = 1;

                            // Speed up name scroll on shift key.
                            if (document){
                                on(document, "keydown", function(evt){
                                    if (evt.shiftKey){
                                        increment = 5;
                                    }
                                });
                                on(document, "keyup", function(evt){
                                    increment = 1;
                                });
                            }
                            // Clear interval if it exists before creating new interval.
                            if (intervalId){
                                clearInterval(intervalId);
                            }
                            domClass.remove(environmentNameLabelOverflow, "hidden");
                            // Function to scroll name label.
                            intervalId = setInterval(function(){
                                if (pauseDelay < 1){
                                    if (((pixelLeft > nameLabelWidth + 80) && !isCloudEnvironment) ||
                                        ((pixelLeft > nameLabelWidth + 100) && isCloudEnvironment)){
                                        pixelLeft = -1;
                                        showOverflow = false;
                                    }
                                    else {
                                        domStyle.set(environmentNameLabel, "marginLeft", pixelLeft * -1 + "px");
                                        pixelLeft += increment;
                                        if (pixelLeft < 1 && pixelLeft > -1){
                                            pauseDelay = 50;
                                        }
                                    }
                                    // If secondary title label is shown, keep margin for record to scroll on mouseout.
                                    if (isCloudEnvironment && (pixelLeft > nameLabelWidth - nameContainerWidth + 100)){
                                        showOverflow = true;
                                        showOverflowMargin = nameLabelWidth + 100 - pixelLeft;
                                    }
                                    else if (pixelLeft > nameLabelWidth - nameContainerWidth + 80) {
                                        showOverflow = true;
                                        showOverflowMargin = nameLabelWidth + 80 - pixelLeft;
                                    }
                                }
                                else {
                                    pauseDelay--;
                                }
                            }, 15);
                        }
                    }
                }
            });
            // Stop animation on mouse out.
            on(self.domNode, mouse.leave, function(){
                if (intervalId){
                    clearInterval(intervalId);
                    if (showOverflow){
                        domStyle.set(environmentNameLabel, "marginLeft", showOverflowMargin + "px");
                    }
                    setTimeout(function(){
                        domStyle.set(environmentNameLabel, "marginLeft", "");
                        domClass.add(self.nameAttach, "reset-environment-name");
                    }, 50);
                    setTimeout(function(){
                        domClass.remove(self.nameAttach, "reset-environment-name");
                    }, 300);
                }
                showOverflow = false;
                showOverflowMargin = 0;
                domClass.add(environmentNameLabelOverflow, "hidden");
            });

            if (this.draggable) {
                domClass.add(this.domNode, "dojoDndItem");
                domClass.add(this.nameAttach, "dojoDndHandle");
                this.domNode.draggable = false;
            }
        },

        toggleExpand: function(){
            if (this.expanded) {
                this.collapseEnvironment();
            }
            else {
                this.expandEnvironment();
            }
        },

        expandEnvironment: function(){
            domClass.add(this.domNode, "expanded");
            this.showInventoryGrid();
            this.expanded = true;
        },

        collapseEnvironment: function(){
            domClass.remove(this.domNode, "expanded");
            this.expanded = false;
        },

        /**
         *
         */
        showInventoryGrid: function() {
            var self = this;

            var showVersionPopup = function(item, versions, results, attachPoint) {
                var displayTable = function(link) {
                        on(link, "click", function() {
                            var versionDialog = new Dialog({
                                closable: true,
                                draggable: true
                            });
                            var hideDialog = function() {
                                if (versionDialog) {
                                    versionDialog.hide();
                                }
                            };

                            var dialogTitle = domConstruct.create("span", {
                                innerHTML: i18n("Inventory For") + "&nbsp;"
                            }, versionDialog.titleNode);
                            var componentLink = domConstruct.create("a", {
                                href: "#component/" + item.component.id,
                                innerHTML: item.component.name.escape()
                            }, versionDialog.titleNode);
                            on(componentLink, "click", hideDialog);

                            var componentResourceTable = new TreeTable({
                                getData: function(){
                                    var result = [item];
                                    if (!!versions) {
                                       result = result.concat(versions);
                                    }
                                    return result;
                                },
                                serverSideProcessing: false,
                                columns: Formatters.inventoryGridColumnsFormatter(null, hideDialog, true, true),
                                hideExpandCollapse: true
                            });
                            componentResourceTable.placeAt(versionDialog.containerNode);
                            var closeButton = new Button({
                                label: i18n("Close"),
                                onClick: hideDialog
                            }).placeAt(versionDialog.containerNode, "last");
                            domClass.add(closeButton.domNode, "underField");
                            versionDialog.show();
                        });
                    };

                    var detailsLink;
                    if (!!versions) {
                        detailsLink = Formatters.moreVersionsLinkFormatter(versions.length, results);
                    }
                    else {
                        detailsLink = domConstruct.create("a", {
                                          innerHTML: i18n("(View Details)"),
                                          title: i18n("Click to view details"),
                                          className: "linkPointer",
                                          style: "margin-left: 5px;"
                                      }, results);
                    }
                    displayTable(detailsLink);

                    var enteredPopup = false;
                    if (!!versions) {
                        var tooltip = new TooltipDialog({
                            content: Formatters.versionPopupFormatter(versions, false, displayTable),
                            onMouseLeave: function() {
                                popup.close(tooltip);
                                enteredPopup = false;
                            },
                            className: "inventory-popup"
                        });
                        displayTable(tooltip.connectorNode);

                        on(detailsLink, mouse.enter, function() {
                            popup.open({
                                popup: tooltip,
                                around: detailsLink
                            });
                        });
                        var popupClose = function() {
                            popup.close(tooltip);
                        };
                        on(detailsLink, "click", popupClose);
                        on(tooltip.domNode, "click", popupClose);
                        on(tooltip.connectorNode, "click", popupClose);
                        on(tooltip.domNode, mouse.enter, function() {
                            enteredPopup = true;
                        });
                        on(attachPoint, mouse.leave, function() {
                            setTimeout(function() {
                                if (!enteredPopup) {
                                    popupClose();
                                    enteredPopup = false;
                                }
                            }, 100);
                        });
                    }
            };

            if (!this.grid) {
                var gridLayout = Formatters.inventoryGridColumnsFormatter(showVersionPopup);

                var gridRestUrl = bootstrap.restUrl+"deploy/environment/"+this.environment.id+"/latestDesiredInventory/true";
                this.grid = new TreeTable({
                    url: gridRestUrl,
                    serverSideProcessing: false,
                    columns: gridLayout,
                    orderField: "name",
                    sortType: "desc",
                    tableConfigKey: "environmentSummary",
                    noDataMessage: i18n("No components have been installed to this environment."),
                    hideExpandCollapse: true
                });
                this.grid.placeAt(this.gridAttach);
            }
        },

        /**
         *
         */
        destroy: function() {
            this.inherited(arguments);

            if (this.grid) {
                this.grid.destroy();
            }
        },

        /**
         *
         */
        showDeployDialog: function() {
            var self = this;

            var deployForm;
            var deployDialog = new Dialog({
                title: i18n("Run Process on %s", util.escape(this.environment.name)),
                closable: true,
                draggable: true,
                onCancel: function() {
                    // deployForm being destroyed is dependent on the state of deployDialog
                    deployForm.destroy();
                }
            });

            deployForm = new RunApplicationProcess({
                application: this.application,
                environment: this.environment,
                callback: function() {
                    deployDialog.hide();
                    deployDialog.destroy();
                    deployForm.destroy();
                }
            });

            deployForm.placeAt(deployDialog.containerNode);
            deployDialog.show();
        },

        /**
         *
         */
        showCompareDialog: function() {
            var self = this;

            var compareDialog = new Dialog({
                title: i18n("Compare %s", this.environment.name.escape()),
                closable: true,
                draggable: true
            });

            var compareForm = new ColumnForm({
                onSubmit: function(data) {
                    compareDialog.hide();
                    compareDialog.destroy();
                    navBar.setHash("environmentComparison/"+self.environment.id+"/"+data.environmentId);
                },
                onCancel: function() {
                    compareDialog.hide();
                    compareDialog.destroy();
                }
            });

            var environmentSelect = new RestSelect({
                restUrl: bootstrap.restUrl+"deploy/application/"+this.application.id+"/environments/false",
                isValid: function(item) {
                    return (item.id !== self.environment.id);
                },
                allowNone: false
            });
            compareForm.addField({
                name: "environmentId",
                label: i18n("Environment"),
                required: true,
                widget: environmentSelect
            });

            compareForm.placeAt(compareDialog.containerNode);
            compareDialog.show();
        },

        /**
         *
         */
        confirmDelete: function() {
            var self = this;

            var confirmDialog = new Dialog({
                title: i18n("Confirmation")
            });

            var deleteForm = new ColumnForm({
                onSubmit: function(data) {
                    xhr.del({
                        url: bootstrap.restUrl+"deploy/environment/"+self.environment.id,
                        content: data,
                        handleAs: "json",
                        load: function(data) {
                            if (self.onDelete !== undefined) {
                                self.onDelete();
                            }
                        },
                        error: function(error) {
                            var alert = new Alert({
                                messages: [i18n("Error deleting environment:"),
                                           "",
                                           util.escape(error.responseText)]
                            });
                            alert.startup();
                            self.grid.unblock();
                        }
                    });

                    confirmDialog.hide();
                    confirmDialog.destroy();
                },
                onCancel: function() {
                    confirmDialog.hide();
                    confirmDialog.destroy();
                },
                saveLabel: i18n("Delete")
            });

            var isCloudEnvironment = (this.environment.extEnvironment && this.environment.extEnvironment.length > 0);
            var deleteAttachedResourcesField;
            if (isCloudEnvironment || this.environment.instanceId) {
                deleteForm.addField({
                    type: "Checkbox",
                    label: i18n("Delete Cloud Instances"),
                    description: i18n("When checked, any instances in the cloud provider this environment is associated with will be deleted as well."),
                    name: "deleteCloudInstances",
                    value: true,
                    onChange: function (value) {
                         if (deleteAttachedResourcesField && deleteAttachedResourcesField.widget){
                             deleteAttachedResourcesField.widget.set("disabled", value);
                         }
                    }
                });
            }

            deleteAttachedResourcesField = deleteForm.addField({
                type: "Checkbox",
                label: i18n("Delete Attached Resources"),
                description: i18n("When checked, all base resources in this environment will be deleted, as well as their children."),
                name: "deleteAttachedResources",
                value: !!(this.environment.instanceId || isCloudEnvironment),
                readOnly: !!isCloudEnvironment
            });

            domConstruct.create("div", {
                innerHTML: i18n("Are you sure you want to delete environment %s?", this.environment.name.escape()),
                style: {

                }
            }, confirmDialog.containerNode);

            deleteForm.placeAt(confirmDialog.containerNode);
            confirmDialog.show();
        },

        /**
         *
         */
        showCopyDialog: function() {
            var self = this;
            var copyDialog = new Dialog({
                title: i18n("Copy %s", util.escape(this.environment.name)),
                closable: true,
                draggable: true
            });

            var copyForm = new EditEnvironment({
                source: this.environment,
                application: appState.application,
                callback: function(data) {
                    copyDialog.hide();
                    copyDialog.destroy();
                    if (self.onCopy !== undefined) {
                        self.onCopy();
                    }
                }
            });

            copyForm.placeAt(copyDialog.containerNode);
            copyDialog.show();
        },

        /**
         *
         */
        showEditDialog: function() {
            var self = this;
            xhr.get({
                url: bootstrap.restUrl+"deploy/environment/"+this.environment.id,
                handleAs: "json",
                load: function(data) {
                    var editDialog = new Dialog({
                        title: i18n("Edit %s", util.escape(data.name)),
                        closable: true,
                        draggable: true
                    });

                    var application = appState.application;
                    var editForm = new EditEnvironment({
                        environment: data,
                        application: application,
                        callback: function(data) {
                            editDialog.hide();
                            editDialog.destroy();
                            if (self.onEdit !== undefined) {
                                self.onEdit();
                            }
                        }
                    });

                    editForm.placeAt(editDialog.containerNode);
                    editDialog.show();
                }
            });
        },


        showUpdateFromBlueprintDialog: function(){
            var updateEnvDialog = new CreateEnvironmentDialog({
                title: i18n("Update %s from Blueprint", util.escape(this.environment.name)),
                closable: true,
                draggable: true
            });

            var application = appState.application;
            var editForm = new EditLandscaperBlueprintProperties({
                environment: this.environment,
                dialog: updateEnvDialog,
                application: application,
                callback: function(data) {
                    updateEnvDialog.hide();
                    updateEnvDialog.destroy();
                    navBar.setHash("application/"+application.id, false, true);
                }
            });

            editForm.placeAt(updateEnvDialog.containerNode);
            updateEnvDialog.show();
        },


        /**
         *
         */
        showNewSnapshotDialog: function() {
            var self = this;
            var snapshotDialog = new Dialog({
                title: i18n("Create Snapshot"),
                closable: true,
                draggable:true
            });

            var snapshotForm = new ColumnForm({
                submitUrl: bootstrap.restUrl + "deploy/snapshot/fromEnvironment/" + self.environment.id,
                onCancel: function() {
                    snapshotDialog.hide();
                    snapshotDialog.destroy();
                },
                postSubmit: function(data) {
                    snapshotDialog.hide();
                    snapshotDialog.destroy();
                    navBar.setHash("snapshot/"+data.id, false, true);
                }
            });

            snapshotForm.addField({
                name: "name",
                label: i18n("Name"),
                required: true,
                type: "Text"
            });

            snapshotForm.addField({
                name: "description",
                label: i18n("Description"),
                type: "Text"
            });

            snapshotForm.placeAt(snapshotDialog.containerNode);
            snapshotDialog.show();
        }
    });
});

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
/*global define, require, sessionSharedData */

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
        "dojo/dom-construct",
        "dojo/dom-style",
        "dojo/dom-attr",
        "dojo/json",
        "dojo/on",
        "dojo/mouse",
        "dojo/query",
        "deploy/widgets/Formatters",
        "deploy/widgets/environment/EnvironmentSummary",
        "js/util/blocker/_BlockerMixin",
        "js/util/infiniteScroll/_InfiniteScrollJsonRestMixin",
        "js/webext/widgets/color/Color",
        "deploy/widgets/environment/EditEnvironmentWizard",
        "deploy/widgets/environment/EditEnvironmentWizardPane",
        "deploy/widgets/environment/CreateEnvironmentDialog"
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
        domConstruct,
        domStyle,
        domAttr,
        JSON,
        on,
        mouse,
        query,
        Formatters,
        EnvironmentSummary,
        _BlockerMixin,
        _InfiniteScrollMixin,
        Color,
        EditEnvironmentWizard,
        EditEnvironmentWizardPane,
        CreateEnvironmentDialog
) {
    /**
     *
     */
    return declare([_Widget, _TemplatedMixin, _BlockerMixin, _InfiniteScrollMixin], {
        templateString:
            '<div class="applicationEnvironmentList application-environment-list">' +
                '<div class="listTopButtons" data-dojo-attach-point="buttonAttach">' +
                    '<div class="environment-list-help-text">'+
                        '<span class="description-text" data-dojo-attach-point="descriptionAttach"></span>' +
                        '<span class="description-text number-of-environments" data-dojo-attach-point="numberAttach"></span>'+
                    '</div>' +
                    '<div data-dojo-attach-point="savedAttach" class="hide-notification"></div>' +
                    '<div data-dojo-attach-point="savedWarningAttach" class="hide-notification"></div>' +
                '</div>' +
                '<div class="application-environment-list-filter" data-dojo-attach-point="filterAttach">'+
                     '<div class="environments-expand-collapse-all">'+
                        '<a class="linkPointer" data-dojo-attach-point="expandAllLink">' +i18n("Expand All")+ '</a>' +
                        '<a class="linkPointer" data-dojo-attach-point="collapseAllLink">' +i18n("Collapse All")+ '</a>' +
                    '</div>' +
                '</div>' +
                '<div data-dojo-attach-point="activeBoxAttach" style="margin: 3px;"></div>' +
                '<div data-dojo-attach-point="dndAttach" class="environment-list"></div>' +
                '<div data-dojo-attach-point="loadingMoreAttachPoint"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            this.savingCount = 0;
            this.showInactive = false;
            this.environmentSummaries = [];

            if (config.data.systemConfiguration.enableInactiveLinks) {
                var activeBox = new CheckBox({
                    checked: false,
                    value: 'true',
                    onChange: function(value) {
                        self.showInactive = value;
                        self._setupScroll();
                        self.showEnvironments();
                    }
                });
                activeBox.placeAt(this.activeBoxAttach);

                domConstruct.create("div", {
                    innerHTML: i18n("Show Inactive Environments"),
                    "class": "inlineBlock",
                    "style": {
                        position: "relative",
                        top: "2px",
                        left: "2px"
                    }
                }, this.activeBoxAttach);
            }
            this._setupScroll();
            this.showAddButton();
            this.showCompareButton();
            this._postCreate();
        },

        _setupScroll: function() {
            var self = this;
            var filterFields = [ "application.id" ];
            var query = {
                    "filterFields": filterFields,
                    "filterType_application.id": "eq",
                    "filterValue_application.id": this.application.id,
                    "filterClass_application.id": "UUID",
                    outputType: ["BASIC", "SECURITY", "LINKED"],
                    orderField: "order"
            };

            if (!self.showInactive) {
                filterFields.push("active");
                query.filterType_active = "eq";
                query.filterValue_active = true;
                query.filterClass_active = "Boolean";
            }

            self.setupScroll({
                "query": query,
                url: bootstrap.restUrl+"deploy/environment",
                scrollNode: self.dndAttach,
                bottomOffset: 200,
                noItemsLabel: i18n("No Environments Found!")
            });
        },

        _postCreate: function(){
            var self = this;
            this.showEnvironments();
            this.buildFilter();

            on(this.expandAllLink, "click", function(){
                self.expandCollapseAllEnvironments(true);
            });
            on(this.collapseAllLink, "click", function(){
                self.expandCollapseAllEnvironments();
            });
            on(this.savedAttach, mouse.enter, function(){
                domClass.add(self.savedAttach, "hide-notification");
            });
            on(this.savedWarningAttach, mouse.enter, function(){
                domClass.add(self.savedWarningAttach, "hide-notification");
            });
            domAttr.set(this.descriptionAttach, "innerHTML", i18n("Drag environments by their names to re-order them."));
        },

        showAddButton: function(){
            var self = this;
            if (self.application.security["Manage Environments"]) {
                var newEnvironmentButton = new Button({
                    label: i18n("Create Environment"),
                    showTitle: false,
                    onClick: function() {
                        self.showNewEnvironmentDialog();
                    }
                });
                domClass.add(newEnvironmentButton.domNode, "idxButtonSpecial inlineBlock");
                domConstruct.place(newEnvironmentButton.domNode, this.buttonAttach, "first");

                // Create new environment button when filter is docked.
                var addButtonOnFilter = domConstruct.create("div", {
                    className: "general-icon add-item-icon linkPointer",
                    title: i18n("Create Environment")
                }, self.filterAttach);
                this.own(on(addButtonOnFilter, "click", function(){
                    self.showNewEnvironmentDialog();
                }));
            }
        },

        showCompareButton: function() {
            var self = this;

            this.compareEnvironmentsButton = new Button({
                id: "compareButton",
                label: i18n("Compare Environments"),
                disabled: true,
                onClick: function() {
                    var comparePageURL = "multiEnvironmentComparison/"  + self.application.id;
                    navBar.setHash(comparePageURL);
                }
            });

            domClass.add(this.compareEnvironmentsButton.domNode, "inlineBlock");
            domConstruct.place(this.compareEnvironmentsButton.domNode, this.buttonAttach, "first");
        },

        /**
         * Enables the "Compare Environments" button if there are 2 or
         * more environments to compare.
         */
        determineCompareButtonStatus: function() {
            var compButton = dijit.byId("compareButton");
            if (this.environmentIds && this.environmentIds.length >= 2 && !! compButton) {
                compButton.set('disabled', false);
                compButton.set('title', "");
            }
            else if (!!compButton) {
                compButton.set('disabled', true);
                compButton.set('title', i18n("Two or more environments are required to view the multi environment comparison page"));
            }
        },

        /**
         * Loads the environments list.
         */
        showEnvironments: function() {
            var self = this;
            this.resetIndex();
            this.clearList();
            this.environmentSummaries = [];
            this.environmentIds = [];

            this.block();
            this.loadMoreItems();
            this.unblock();
        },

        loadCompliancies: function(){
            var self = this;
            if (this.environmentIds){
                xhr.post({
                    url: bootstrap.restUrl+"deploy/environment/compliancies",
                    postData: JSON.stringify({"environmentIds": self.environmentIds}),
                    headers: {
                        "Content-Type": "application/json"
                    },
                    handleAs: "json",
                    load: function(data) {
                        array.forEach(self.environmentSummaries, function(summary){
                            if (summary.environment && summary.environment.id){
                                var environmentId = summary.environment.id;
                                if (data[environmentId]){
                                    var compliancy = data[environmentId];
                                    self._loadCompliancyForEnvironment(summary, compliancy);
                                }
                            }

                        });
                    }
                });
            }
        },

        _loadCompliancyForEnvironment: function(environmentSummary, compliancy){
            if (environmentSummary.compliancyAttach){
                domConstruct.empty(environmentSummary.compliancyAttach);

                var totalCount = compliancy.desiredCount;
                var compliantCount = compliancy.correctCount;
                if (totalCount > 0) {
                    domConstruct.create("div", {
                        className: "successMeter",
                        style: {
                            width: (compliantCount/totalCount)*100+"%"
                        }
                    }, environmentSummary.compliancyAttach);
                    domConstruct.create("div", {
                        className: "failMeter failed-state-color",
                        style: {
                            width: 100-(compliantCount/totalCount)*100+"%"
                        }
                    }, environmentSummary.compliancyAttach);

                    var compliancyLabel = domConstruct.create("div", {
                        className: "compliancy-label"
                    }, environmentSummary.latestSnapshotAttach, "before");
                    domConstruct.create("div", {
                        innerHTML: i18n("Compliancy")
                    }, compliancyLabel);
                    domConstruct.create("div", {
                        innerHTML: i18n("%s / %s", compliantCount, totalCount)
                    }, compliancyLabel);

                }
                else {
                    var environmentColorObject = Color.getColorOrConvert(environmentSummary.environment.color);
                    if (!environmentColorObject.standard && environmentColorObject.fallback){
                        environmentColorObject = Color.getColor(environmentColorObject.fallback);
                    }
                    var environmentColor = environmentColorObject.value;
                    if (environmentSummary.compliancyAttach){
                        domStyle.set(environmentSummary.compliancyBackgroundAttach, "backgroundColor", environmentColor);
                    }
                    domConstruct.create("span", {
                        innerHTML: i18n("Compliancy: %s / %s", compliantCount, totalCount)
                    }, environmentSummary.compliancyAttach);
                }
            }
        },

        /**
         * Fetches more environments from the store.
         */
        onLoadMoreItems: function(items, total){
            this._createEnvironmentSummaries(items);
            if (this.environmentSummaries && this.domNode){
                domStyle.set(this.domNode, "minHeight", (this.environmentSummaries.length * 38) + 140 + "px");
            }
            if (this.filterTextBox && this.filterTextBox.domNode){
                domClass.remove(this.filterTextBox.domNode, "dijitTextBoxError");
            }
            if (this.numberAttach){
                domAttr.set(this.numberAttach, "innerHTML", total === 1 ? i18n("%s Environment", total) : i18n("%s Environments", total));
            }
            // at this point we know how many environments there are
            // so know if we have 2+ to compare
            this.determineCompareButtonStatus();
            this.loadCompliancies();
            this.environmentIds = [];
        },

        /**
         *
         */
        onNoItemsFound: function(){
            if (this.filterTextBox && this.filterTextBox.get('value') !== ""){
                domClass.add(this.filterTextBox.domNode, "dijitTextBoxError");
            }
        },

        /**
         *
         */
        clearList: function(){
            array.forEach(this.environmentSummaries, function(environmentSummary) {
                environmentSummary.destroy();
            });
            this.environmentSummaries = [];
            this.environmentIds = [];
            this.notLoadingMore = true;
        },

        /**
         *
         */
        expandCollapseAllEnvironments: function(expand){
            array.forEach(this.environmentSummaries, function(environmentSummary) {
                if (expand){
                    setTimeout(function(){
                        environmentSummary.expandEnvironment();
                    }, 500);
                }
                else {
                    environmentSummary.collapseEnvironment();
                }
            });
        },

        /**
         *
         */
        _createEnvironmentSummaries: function(environments){
            var self = this;
            array.forEach(environments, function(environment){
                var environmentSummary = self.createEnvironmentSummary(environment);
                self.environmentSummaries.push(environmentSummary);
                self.environmentIds.push(environment.id);
                domClass.add(environmentSummary.domNode, "initial-hide-environment");
                setTimeout(function(){
                    if (environmentSummary && environmentSummary.domNode){
                        domClass.remove(environmentSummary.domNode, "initial-hide-environment");
                    }
                }, 225);
            });
            if (self.dndContainer){
                self.dndContainer.sync();
            }
            else {
                self.dndContainer = new Source(self.dndAttach, {
                    withHandles: true,
                    copyState: function() {
                        return false;
                    },
                    onSelectStart: function() {
                        // Override this function so that text in DND nodes is selectable
                    }
                });

                // Save the old onDndDrop function - we need to call it as well as performing
                // our extra behavior.
                self.dndContainer.oldOnDrop = self.dndContainer.onDndDrop;
                self.dndContainer.onDndDrop = function(source, nodes, copy, target) {
                    // Don't process the event if it's not for this Source
                    if (self.dndContainer === source && self.dndContainer === target) {
                        this.oldOnDrop(source, nodes, copy, target);
                        if (win.body()){
                            domClass.remove(win.body(), "move-environment");
                        }

                        var orderedEnvironmentIds = [];
                        array.forEach(this.getAllNodes(), function(node) {
                            var widget = registry.byNode(node);
                            orderedEnvironmentIds.push(widget.environment.id);
                        });

                        if (!self._dontSaveOrder && !self.snapshot){
                            xhr.put({
                                url: bootstrap.restUrl+"deploy/application/"+self.application.id+"/orderEnvironments",
                                putData: JSON.stringify(orderedEnvironmentIds),
                                handleAs: "json",
                                load: function(data) {
                                    self.showSaved();
                                }
                            });
                        }
                        else {
                            self.showSaved(true);
                        }
                    }
                };
            }
        },

        /**
         *
         */
        createEnvironmentSummary: function(environment){
            var self = this;
            var environmentSummary = new EnvironmentSummary({
                autoExpandInventory: self.autoExpandInventory,
                environment: environment,
                application: self.application,
                draggable: true,
                showDelete:true,
                onSetActive: function() {
                    self.showEnvironments();
                },
                onDelete: function(domNode) {
                    self.showEnvironments();
                },
                onCopy: function() {
                    self.showEnvironments();
                },
                onEdit: function() {
                    self.showEnvironments();
                }
             });
             if (self.dndAttach){
                 environmentSummary.placeAt(self.dndAttach);
             }

             domConstruct.create("span", {
                innerHTML: i18n("Loading Compliancy..."),
                style: {
                    color: environment.color
                }
            }, environmentSummary.compliancyAttach);

             return environmentSummary;
        },

        /**
         * Builds the filter bar.
         */
        buildFilter: function(){
            var self = this;
            var searching = false;
            var searchTerm = "";
            var tempSearchTerm = "";

            var search = function(textBox, options){
                if (textBox){
                    // Get initial value in textbox.
                    searchTerm = textBox.get("value");
                    setTimeout(function(){
                        // If value is the same after a 0.5 second timeout, perform search.
                        if (textBox && searchTerm === textBox.get("value")) {
                            var query = null;
                            if (options && options.query && searchTerm !== ""){
                                query = options.query;
                                lang.mixin(query, {
                                    outputType: ["BASIC", "SECURITY", "LINKED"],
                                    orderField: "order",
                                    "filterType_application.id": "eq",
                                    "filterValue_application.id": self.application.id,
                                    "filterClass_application.id": "UUID",
                                    "filterType_name": "like",
                                    "filterClass_name": "String",
                                    "filterValue_name": searchTerm
                                });
                            }
                            self.searchItem(searchTerm, {
                                searchAttr: options ? options.searchAttr : "name",
                                query: query
                            });
                            // Reference a variable to determine when to save environment order.
                            if (searchTerm === ""){
                                self._dontSaveOrder = false;
                            }
                            else {
                                self._dontSaveOrder = true;
                            }
                        }
                        // Else, repeat timeout.
                        else {
                            search(textBox, options);
                        }
                    }, 500);
                }
            };

            this.filterTextBox = this.createFilter({
                type: "TEXT",
                placeHolder: i18n("Search by Name"),
                className: "environment-list-search-box environment-list-name-search-box inline-block",
                style: {},
                onChange: function(value){
                    if (value !== ""){
                        search(self.filterTextBox, {
                            query: {filterFields: [ "application.id", "name" ]}
                        });
                    }
                }
            });
            domConstruct.place(this.filterTextBox.domNode, this.filterAttach);
            on(this.filterTextBox, "keyUp", function(event){
                search(self.filterTextBox, {
                      query: {filterFields: [ "application.id", "name" ]}
                 });
            });

            domConstruct.create("span", {
                innerHTML: i18n("or")
            }, this.filterAttach);

            // Blueprint Drop Down Filter
            this.filterBlueprintSelect = this.createFilter({
                type: "TableFilterSelect",
                allowNone: true,
                searchAttr: "name",
                className: "environment-list-search-box inline-block",
                placeHolder: i18n("Search by Blueprint"),
                url: bootstrap.restUrl+"deploy/application/"+self.application.id+"/blueprints/all",
                formatDropDownLabel: Formatters.environmentBlueprintDropDownFormatter,
                onChange: function(value, item){
                    var query = {};
                    if (item && item.integrationProviderId){
                        query = {
                            filterFields: [ "application.id", "externalEnvironment.externalBlueprintName"],
                            "filterType_externalEnvironment.externalBlueprintName": "like",
                            "filterValue_externalEnvironment.externalBlueprintName": item ? item.name : "",
                            "filterClass_externalEnvironment.externalBlueprintName": "String",
                            outputType: ["BASIC", "SECURITY", "LINKED"],
                            orderField: "order"
                        };
                    }
                    else {
                        query = {
                            filterFields: [ "application.id", "blueprint.name"],
                            "filterType_blueprint.name": "like",
                            "filterValue_blueprint.name": item ? item.name : "",
                            "filterClass_blueprint.name": "String",
                            outputType: ["BASIC", "SECURITY", "LINKED"],
                            orderField: "order"
                        };
                    }
                    search(self.filterBlueprintSelect, {
                        query: query
                    });
                },
                style: {}
            });
            domConstruct.place(this.filterBlueprintSelect.domNode, this.filterAttach);

            on(this.filterTextBox, "focus", function(event){
                if (self.filterBlueprintSelect){
                    self.filterBlueprintSelect.dropDown.set('value', '', undefined, undefined, '');
                }
            });
            on(this.filterBlueprintSelect, "focus", function(event){
                if (self.filterTextBox){
                    if (self.filterTextBox.get('value') !== ""){
                        self.filterTextBox.set('value', '');
                        search(self.filterTextBox, "name");
                    }
                }
            });
            this.onHitTop(this.dndAttach, function(){
                domClass.add(self.domNode, "fixed-top");
            }, function(){
                domClass.remove(self.domNode, "fixed-top");
            }, 60);
        },

        /**
         *
         */
        showSaved: function(warning) {
            var self = this;
            var savePopup = warning ? self.savedWarningAttach : self.savedAttach;
            if (self.snapshot){
                savePopup = self.savedWarningAttach;
            }
            if (!this._saveMessage){
                this._saveMessage = domConstruct.create("div", {
                    className: "saved-notification",
                    innerHTML: '<div class="inline-block general-icon check-icon-large"></div>'+ i18n("Environment order saved.")
                }, this.savedAttach);
                var warningMessage = self.snapshot ? i18n("Environment order is only saved on the Environments page!") : i18n("Environment order is only saved in full list view!");
                domConstruct.create("div", {
                    className: "saved-notification notification-warning",
                    innerHTML: '<div class="inline-block general-icon warning-icon-large"></div>'+warningMessage
                }, this.savedWarningAttach);
            }

            this.savingCount++;
            domClass.remove(savePopup, "hide-notification");

            setTimeout(function() {
                self.savingCount--;
                if (self.savingCount > 0) {
                    self.savingCount--;
                }
                else {
                    domClass.add(savePopup, "hide-notification");
                }
            }, 3000);
        },

        /**
         *
         */
        destroy: function() {
            this.inherited(arguments);
            if (this.dndContainer) {
                this.dndContainer.destroy();
            }
        },

        /**
         *
         */
        showNewEnvironmentDialog: function() {
            var newEnvironmentDialog = new CreateEnvironmentDialog({
                title: i18n("Create Environment"),
                closable: true
            });

            var cancelFunction = function() {
                newEnvironmentDialog.hide();
                newEnvironmentDialog.destroy();
            };

            newEnvironmentDialog.show();

            var wizard = new EditEnvironmentWizard({
                doneButtonLabel: i18n("Save"),
                hideDisabled: true,
                cancelFunction: cancelFunction,
                style : "width: 650px;"

            }).placeAt(newEnvironmentDialog.containerNode);
            newEnvironmentDialog.wizard = wizard;
            new EditEnvironmentWizardPane({
               dialog: newEnvironmentDialog,
               application: this.application
            }).placeAt(wizard);

           wizard.startup();

        }
    });
});

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
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dijit/registry",
        "dojo/dnd/Source",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/on",
        "deploy/widgets/Formatters",
        "deploy/widgets/application/ApplicationEnvironmentList",
        "deploy/widgets/snapshot/SnapshotEnvironmentSummary"
        ],
function(
        array,
        declare,
        lang,
        registry,
        Source,
        domClass,
        domConstruct,
        on,
        Formatters,
        ApplicationEnvironmentList,
        EnvironmentSummary
) {
    /**
     *
     */
    return declare([ApplicationEnvironmentList], {

        /**
         *
         */
        postCreate: function() {
            var self = this;

            this.savingCount = 0;
            this.showInactive = false;
            this.environmentSummaries = [];

            this.setupScroll({
                query: {
                    outputType: ["BASIC", "SECURITY", "LINKED"],
                    orderField: "order"
                },
                url: bootstrap.restUrl+"deploy/snapshot/" + self.snapshot.id + "/environments",
                scrollNode: self.dndAttach,
                bottomOffset: 200,
                noItemsLabel: i18n("No Environments Found!")
            });

            this._postCreate();
        },

        /**
         *
         */
        loadCompliancies: function(){
            // Don't load compliancies for snapshots.
        },

        /**
         *
         */
        createEnvironmentSummary: function(environment){
            var self = this;
            var environmentSummary = new EnvironmentSummary({
                draggable: true,
                showDelete:true,
                application: self.application,
                snapshot: self.snapshot,
                environment: environment,
                onApprovalChange: function() {
                    self.snapshotTasks.refresh();
                }
            });
            if (self.dndAttach){
                environmentSummary.placeAt(self.dndAttach);
            }
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
                        if (searchTerm === textBox.get("value")) {
                            var query = null;
                            if (options && options.query && searchTerm !== ""){
                                query = options.query;
                                lang.mixin(query, {
                                    outputType: ["BASIC", "SECURITY", "LINKED"],
                                    orderField: "order",
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
                            query: {filterFields: ["name" ]}
                        });
                    }
                }
            });
            domConstruct.place(this.filterTextBox.domNode, this.filterAttach);
            on(this.filterTextBox, "keyUp", function(event){
                search(self.filterTextBox, {
                      query: {filterFields: ["name" ]}
                 });
            });

            domConstruct.create("span", {
                innerHTML: i18n("or")
            }, this.filterAttach);

            // Blueprint Drop Down Filter
            this.filterBlueprintSelect = this.createFilter({
                type: "TableFilterSelect",
                allowNone: true,
                className: "environment-list-search-box inline-block",
                placeHolder: i18n("Search by Blueprint"),
                url: bootstrap.restUrl+"deploy/application/"+this.application.id+"/blueprints/all",
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
        }
    });
});

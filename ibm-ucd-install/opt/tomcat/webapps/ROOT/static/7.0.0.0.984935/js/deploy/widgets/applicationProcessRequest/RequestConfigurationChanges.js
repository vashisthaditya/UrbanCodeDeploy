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
        "dijit/form/CheckBox",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/dom-style",
        "dojo/json",
        "dojo/on",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        CheckBox,
        declare,
        xhr,
        domClass,
        domConstruct,
        domStyle,
        JSON,
        on,
        Dialog,
        TreeTable
) {
    /**
     *
     */
    return declare([_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="snapshotConfiguration">'+
                '<div data-dojo-attach-point="configTree"></div>'+
            '</div>',
        
        postCreate: function() {
            this.inherited(arguments);

            this.excludeUnchanged = true;
            this.excludeAgentProperties = true;
            
            this.configTree.innerHTML = i18n("Loading...");
            this.makeRequest();
        },
        
        makeRequest: function() {
            var self = this;
            
            xhr.get({
                url: bootstrap.restUrl+"deploy/applicationProcessRequest/"+this.applicationProcessRequest.id+"/configurationChanges",
                handleAs: "json",
                load: function(data) {
                    self.makeTable(data);
                },
                error: function(error) {
                    self.configTree.innerHTML = i18n("Error getting configuration changes: %s",
                            util.escape(error.responseText));
                }
            });
        },
        
        makeTable: function(data) {
            var self = this;
            this.configTree.innerHTML = "";

            var gridLayout = [{
                name: i18n("Name"),
                orderField: "name",
                filterField: "name",
                filterType: "text",
                getRawValue: function(item) {
                    var result;
                    if (item.path) {
                        result = item.path;
                    }
                    else {
                        result = item.id;
                    }
                    
                    return result;
                },
                formatter: function(item, value, cell) {
                    domStyle.set(cell, {
                        wordBreak: "break-all",
                        width: "30%"
                    });
                    
                    var result;
                    if (item.path) {
                        cell.colSpan = 3;
                        result = i18n("Changes to: %s", item.path.escape());
                    }
                    else {
                        result = item.id.escape();
                    }
                    
                    return result;
                }
            },{
                name: i18n("Current Value"),
                orderField: "current",
                filterField: "current",
                filterType: "text",
                getRawValue: function(item) {
                    if (item.old) {
                        return item.old.escape();
                    }
                },
                formatter: function(item, value, cell) {
                    domStyle.set(cell, {
                        wordBreak: "break-all"
                    });

                    if (item.old) {
                        return item.old.escape();
                    }
                }
            },{
                name: i18n("New Value"),
                orderField: "new",
                filterField: "new",
                filterType: "text",
                getRawValue: function(item) {
                    if (item["new"]) {
                        return item["new"].escape();
                    }
                },
                formatter: function(item, value, cell) {
                    domStyle.set(cell, {
                        wordBreak: "break-all"
                    });

                    if (item["new"]) {
                        return item["new"].escape();
                    }
                }
            }];

            self.tree = new TreeTable({
                data: data,
                itemPasses: function(item) {
                    var result = false;
                    
                    if (item.path) {
                        result = true;
                    }
                    else if (!self.excludeUnchanged || item.old !== item["new"]) {
                        if (!self.excludeAgentProperties || item.id.indexOf("agent/") !== 0) {
                            result = true;
                        }
                    }
                    
                    return result;
                },
                serverSideProcessing: false,
                orderField: "name",
                tableConfigKey: "snapshotConfigList",
                noDataMessage: i18n("No configuration found."),
                columns: gridLayout,
                hidePagination: false
            });
            self.tree.placeAt(self.configTree);
    
            
            var onlyChangedBox = new CheckBox({
                checked: true,
                value: 'true',
                onChange: function(value) {
                    self.excludeUnchanged = value;
                    self.tree.refresh();
                }
            });
            onlyChangedBox.placeAt(self.tree.buttonAttach);
            
            var onlyChangedLabel = document.createElement("div");
            domClass.add(onlyChangedLabel, "inlineBlock");
            domClass.add(onlyChangedLabel, "tableHeaderCheckBoxLabel");
            onlyChangedLabel.innerHTML = i18n("Hide Unchanged Properties");
            self.tree.buttonAttach.appendChild(onlyChangedLabel);
            
            
            domConstruct.create("div", {
                style: {
                    height: "5px"
                }
            }, self.tree.buttonAttach);
            
            
            var hideAgentBox = new CheckBox({
                checked: true,
                value: 'true',
                onChange: function(value) {
                    self.excludeAgentProperties = value;
                    self.tree.refresh();
                }
            });
            hideAgentBox.placeAt(self.tree.buttonAttach);
            
            var hideAgentLabel = document.createElement("div");
            domClass.add(hideAgentLabel, "inlineBlock");
            domClass.add(hideAgentLabel, "tableHeaderCheckBoxLabel");
            hideAgentLabel.innerHTML = i18n("Hide Agent Properties");
            self.tree.buttonAttach.appendChild(hideAgentLabel);
        }
    });
});

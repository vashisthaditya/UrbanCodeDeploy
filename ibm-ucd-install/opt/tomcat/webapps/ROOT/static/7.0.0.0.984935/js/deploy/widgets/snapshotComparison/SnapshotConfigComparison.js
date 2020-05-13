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

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            var gridRestUrl = bootstrap.restUrl+"deploy/snapshot/"+this.snapshot1.id+"/compareConfiguration/"+this.snapshot2.id+"/true";
            var gridLayout = [{
                    name: i18n("Name"),
                    field: "name",
                    orderField: "name",
                    filterField: "name",
                    filterType: "text",
                    getRawValue: function(item) {
                        return item.name;
                    }
                },{
                    name: this.snapshot1.name,
                    formatter: function(item, value, cell) {
                        var result;
                        
                        if (item.snapshot1) {
                            var persistent = item.snapshot1;
                            
                            if (persistent.locked === true) {
                                result = persistent.version;
                            }
                            else {
                                if (persistent.version !== undefined && persistent.version !== null) {
                                    result = i18n("Latest (%s)", persistent.version);
                                }
                            }
        
                            if (persistent.commit) {
                                result += " - "+persistent.commit.committer+" ("+util.dateFormatShort(persistent.commit.commitTime)+")";
                            }
                        }
                        else if (item.snapshot2) {
                            result = i18n("N/A");
                        }
    
                        return result;
                    }
                },{
                    name: this.snapshot2.name,
                    formatter: function(item, value, cell) {
                        var result;

                        if (item.snapshot2) {
                            var persistent = item.snapshot2;
                            
                            if (persistent.locked === true) {
                                result = persistent.version;
                            }
                            else {
                                if (persistent.version !== undefined && persistent.version !== null) {
                                    result = i18n("Latest (%s)", persistent.version);
                                }
                            }
        
                            if (persistent.commit) {
                                result += " - "+persistent.commit.committer+" ("+util.dateFormatShort(persistent.commit.commitTime)+")";
                            }
                        }
                        else if (item.snapshot1) {
                            result = i18n("N/A");
                        }
    
                        return result;
                    }
                },{
                    name: i18n("Actions"),
                    formatter: this.actionsFormatter,
                    parentWidget: this
                }];

            this.tree = new TreeTable({
                url: gridRestUrl,
                serverSideProcessing: false,
                orderField: "name",
                tableConfigKey: "snapshotConfigList",
                noDataMessage: i18n("No configuration found."),
                columns: gridLayout
            });
            this.tree.placeAt(this.configTree);
            
            var onlyChangedBox = new CheckBox({
                checked: true,
                value: 'true',
                onChange: function(value) {
                    if (value) {
                        self.tree.url = bootstrap.restUrl+"deploy/snapshot/"+self.snapshot1.id+"/compareConfiguration/"+self.snapshot2.id+"/true";
                    }
                    else {
                        self.tree.url = bootstrap.restUrl+"deploy/snapshot/"+self.snapshot1.id+"/compareConfiguration/"+self.snapshot2.id+"/false";
                    }
                    self.tree.refresh();
                }
            });
            onlyChangedBox.placeAt(this.tree.buttonAttach);
            
            var onlyChangedLabel = document.createElement("div");
            domClass.add(onlyChangedLabel, "inlineBlock");
            onlyChangedLabel.style.position = "relative";
            onlyChangedLabel.style.top = "2px";
            onlyChangedLabel.style.left = "2px";
            onlyChangedLabel.innerHTML = i18n("Only Show Differences");
            this.tree.buttonAttach.appendChild(onlyChangedLabel);
            
            domStyle.set(this.tree.buttonAttach, {
                position: "relative",
                top: "10px"
            });
        },

        /**
         *
         */
        actionsFormatter: function(item) {
            var self = this.parentWidget;
            var result = document.createElement("div");
            
            if (item.snapshot1 && item.snapshot2) {
                if (item.snapshot1.className === "PropSheet") {
                    var compareLink = domConstruct.create("a", {
                        "innerHTML": i18n("View Changes"),
                        "class": "linkPointer actionsLink"
                    }, result);
                    on(compareLink, "click", function() {
                        xhr.get({
                            url: bootstrap.baseUrl+"property/propSheet/"+util.vc.encodeVersionedPath(item.snapshot1.path+"."+item.snapshot1.version)+"/compare/"+util.vc.encodeVersionedPath(item.snapshot2.path+"."+item.snapshot2.version),
                            handleAs: "json",
                            load: function(data) {
                                self.showPropertyChanges(data);
                            }
                        });
                    });
                }
            }

            return result;
        },
        
        /**
         * 
         */
        showPropertyChanges: function(data) {
            var self = this;
            
            var propertyDialog = new Dialog();
            
            var propertyTable = new TreeTable({
                style: {
                    "minWidth": "450px"
                },
                data: data,
                serverSideProcessing: false,
                hideExpandCollapse: true,
                tableConfigKey: "snapshotConfigChangeList",
                noDataMessage: i18n("No changes found."),
                columns: [{
                    name: i18n("Name"),
                    field: "name"
                },{
                    name: this.snapshot1.name,
                    formatter: function(item) {
                        var result = "";
                        if (item.value) {
                            result = item.value.value;
                        }
                        return result;
                    }
                },{
                    name: this.snapshot2.name,
                    formatter: function(item) {
                        var result = "";
                        if (item.otherValue) {
                            result = item.otherValue.value;
                        }
                        return result;
                    }
                }]
            });
            propertyTable.placeAt(propertyDialog.containerNode);
            propertyDialog.show();
        }
    });
});

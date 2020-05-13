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
        "dojo/_base/declare",
        "deploy/widgets/resource/ResourceTree",
        "dijit/form/Button",
        "dojo/_base/array",
        "dojo/_base/xhr",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/json",
        "dojo/on",
        "deploy/widgets/Formatters",
        "js/webext/widgets/Alert",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "deploy/widgets/resource/ResourceSelectList"
        ],
function(
        declare,
        ResourceTree,
        Button,
        array,
        xhr,
        domClass,
        domConstruct,
        JSON,
        on,
        Formatters,
        Alert,
        Dialog,
        GenericConfirm,
        ResourceSelectList
) {
    /**
     *
     */
    return declare([ResourceTree], {
        postCreate: function() {
            var self = this;
            
            this.xhrMethod = "POST";
            this.serverSideProcessing = true;
            this.url = bootstrap.restUrl+"resource/resourceTemplate/"+this.resourceTemplate.id+"/resources";

            this.inherited(arguments);

            this.grid.applyRowStyle = function(item, row) {
                if (item.resourceTemplate.id !== self.resourceTemplate.id) {
                    domClass.add(row, "readOnlyResourceRow");
                }
            };
        },

        getChildUrl: function(item) {
            return bootstrap.restUrl + "resource/resourceTemplate/"+this.resourceTemplate.id+"/resources/"+item.id+"/children";
        },

        getOtherColumns: function() {
            return [{
                name: i18n("Description"),
                formatter: function(item) {
                    var description = item.description ? item.description.escape() : "";
                    if (item.isRoot && item.resourceTemplate){
                        description = item.resourceTemplate.description ? item.resourceTemplate.description.escape() : "";
                    }
                    return domConstruct.create("div", {
                        innerHTML: util.applyBTD(description),
                        title: description,
                        alt: description,
                        className: "resource-template-description one-line-overflow-text-click-to-show"
                    });
                },
                orderField: "description",
                filterField: "description",
                filterType: "text",
                getRawValue: function(item) {
                    return item.description;
                }
            }];
        },

        addTopButtons: function() {
            // No additional top buttons for this tree
        },

        addEditActions: function(item, result) {
            var self = this;

            // Do nothing for root resources, can't modify the base resource for a template
            if (!item.isRoot && item.resourceTemplate.id === self.resourceTemplate.id) {
                return this.inherited(arguments);
            }
        },
        
        getRunnableActions: function(item) {
            var self = this;
            var result = [];
            
            if (!item.isRoot && item.resourceTemplate.id === self.resourceTemplate.id) {
                // Only show this option if it's not a prototype, has a role, and the role isn't
                // something special like "AGENT_PLACEHOLDER"
                if (!item.prototype && item.role && item.role.specialType !== "AGENT_PLACEHOLDER") {
                    result.push({
                        label: i18n("Convert to Prototype"),
                        onClick: function() {
                            self.showConvertToPrototypeDialog(item);
                        }
                    });
                }
            }
            
            return result;
        },

        getDeleteActions: function(item, result) {
            var self = this;

            // Do nothing for root resources, can't modify the base resource for a template
            if (!item.isRoot && item.resourceTemplate.id === self.resourceTemplate.id) {
                return this.inherited(arguments);
            }
        },

        isSelectable: function(item) {
            return !item.isRoot;
        },

        createEditResourceForm: function(options) {
            options.forceSecurityInheritence = true;
            options.resourceTemplate = this.resourceTemplate;
            return this.inherited(arguments);
        },

        getCreateActions: function(item) {
            var self = this;

            var result = [];
            result.push({
                label: i18n("Add Group"),
                onClick: function() {
                    self.showNewResourceDialog(item);
                }
            });

            if (item.hasAgent) {
                result.push({
                    label: i18n("Add Component"),
                    onClick: function() {
                        self.showNewResourceDialog(item, "component");
                    }
                });

                result.push({
                    label: i18n("Add Component Tag"),
                    onClick: function() {
                        self.showNewResourceDialog(item, "componentTag");
                    }
                });
            }
            else {
                result.push({
                    label: i18n("Add Agent Prototype"),
                    onClick: function() {
                        self.showNewResourceDialog(item, "agentPlaceholder");
                    }
                });
            }

            return result;
        },
        
        showConvertToPrototypeDialog: function(item) {
            var self = this;
            
            self.grid.block();
            xhr.get({
                url: bootstrap.restUrl+"resource/resource/"+item.id+"/prototypeCheck",
                handleAs: "json",
                load: function(data) {
                    self.grid.unblock();
                    
                    if (data && data.length > 0) {
                        var messages = [i18n("Converting %s into a resource template will delete " +
                                "all other resources with the same role in the same folder of " +
                                "this template.", item.name.escape()),
                                "",
                                i18n("The following resources will be deleted:"), 
                                ""];
                        array.forEach(data, function(conflictingResource) {
                            messages.push(conflictingResource.name.escape());
                        });
                        
                        var confirm = new GenericConfirm({
                            messages: messages,
                            action: function() {
                                self.promoteToPrototype(item);
                            }
                        });
                    }
                    else {
                        self.promoteToPrototype(item);
                    }
                },
                error: function(response) {
                    self.grid.unblock();
                    var dndAlert = new Alert({
                        message: util.escape(response.responseText)
                    });
                }
            });
        },
        
        promoteToPrototype: function(item) {
            var self = this;
            
            self.grid.block();
            xhr.put({
                url: bootstrap.restUrl+"resource/resource/"+item.id+"/convertToPrototype",
                load: function(data) {
                    self.grid.unblock();
                    self.grid.refreshSiblingsForItem(item);
                },
                error: function(response) {
                    self.grid.unblock();
                    var dndAlert = new Alert({
                        message: util.escape(response.responseText)
                    });
                }
            });
        }
    });
});

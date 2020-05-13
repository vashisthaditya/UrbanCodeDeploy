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
        "dojo/_base/xhr",
        "dojo/dom-construct",
        "deploy/widgets/resourceTemplate/EditResourceTemplate",
        "deploy/widgets/resourceTemplate/ResourceTemplateResourceTree",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/PopDown",
        "js/webext/widgets/TwoPaneListManager"
        ],
function(
        array,
        declare,
        xhr,
        domConstruct,
        EditResourceTemplate,
        ResourceTemplateResourceTree,
        GenericConfirm,
        PopDown,
        TwoPaneListManager
) {
    /**
     *
     */
    return declare([TwoPaneListManager], {
        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            this.showList();
        },
        
        /**
         * 
         */
        showList: function(selectedId) {
            var self = this;

            this.defaultSelectionId = selectedId;

            xhr.get({
                url: bootstrap.restUrl+"deploy/application/"+this.application.id+"/blueprints",
                handleAs: "json",
                load: function(data) {
                    array.forEach(data, function(entry) {
                        var blueprintDiv = document.createElement("div");
                        blueprintDiv.style.position = "relative";
                        
                        var blueprintDivLabel = document.createElement("div");
                        blueprintDivLabel.className = "twoPaneEntryLabel";
                        blueprintDivLabel.innerHTML = entry.name.escape();
                        
                        var optionsContainer = document.createElement("div");
                        optionsContainer.className = "twoPaneActionIcons";
                        
                        if (self.application.security["Manage Blueprints"]) {
                            var deleteLink = document.createElement("div");
                            deleteLink.className = "inlineBlock vAlignMiddle cursorPointer margin2Left iconMinus";
                            deleteLink.onclick = function(event) {
                                util.cancelBubble(event);
                                self.confirmDelete(entry);
                            };
                            optionsContainer.appendChild(deleteLink);
                        }
                        
                        blueprintDiv.appendChild(optionsContainer);
                        blueprintDiv.appendChild(blueprintDivLabel);

                        self.addEntry({
                            id: entry.id,
                            domNode: blueprintDiv,
                            action: function() {
                                self.selectEntry(entry);
                            }
                        });
                    });
                    
                    if (self.application.security["Manage Blueprints"]) {
                        var newBlueprintDiv = document.createElement("div");
                        var newBlueprintIcon = document.createElement("div");
                        newBlueprintIcon.className = "vAlignMiddle inlineBlock iconPlus";
                        newBlueprintDiv.appendChild(newBlueprintIcon);
    
                        var newBlueprintLabel = document.createElement("div");
                        newBlueprintLabel.innerHTML = i18n("Create Blueprint");
                        newBlueprintLabel.className = "vAlignMiddle inlineBlock margin5Left";
                        newBlueprintDiv.appendChild(newBlueprintLabel);
                        
                        self.addEntry({
                            id: null,
                            domNode: newBlueprintDiv,
                            action: function() {
                                self.selectNewBlueprint();
                            }
                        });
                    }
                }
            });
        },
        
        /**
         * 
         */
        refresh: function(newId) {
            var selectedId = newId;
            if (this.selectedEntry && this.selectedEntry.id) {
                selectedId = this.selectedEntry.id;
            }
            
            this.clearDetail();
            this.clearList();
            this.showList(selectedId);
        },
        
        /**
         * Clear out the detail pane and put this component's information there.
         */
        selectEntry: function(entry) {
            var self = this;

            var heading = document.createElement("div");
            heading.className = "containerLabel";
            heading.style.padding = "10px";
            heading.innerHTML = entry.name.escape();
            this.detailAttach.appendChild(heading);
            
            var templateLabelContainer = domConstruct.create("div", {
                style: {
                    marginBottom: "15px"
                }
            }, this.detailAttach);
            
            var resourcesPopdown = new PopDown({
                label: i18n("Blueprint Resource Hierarchy"),
                collapsed: false
            });
            resourcesPopdown.placeAt(this.detailAttach);
            
            var resourceTree = new ResourceTemplateResourceTree({
                resourceTemplate: entry,
                application: this.application
            });
            resourceTree.placeAt(resourcesPopdown.domAttach);
            
            this.registerDetailWidget(resourceTree);
            this.registerDetailWidget(resourcesPopdown);
            
            var userHr = document.createElement("div");
            userHr.className = "hr";
            userHr.style.marginTop = "15px";
            this.detailAttach.appendChild(userHr);
            
            var editFormPopdown = new PopDown({
                label: i18n("Edit")
            });
            editFormPopdown.placeAt(this.detailAttach);

            xhr.get({
                url: bootstrap.restUrl+"resource/resourceTemplate/"+entry.id,
                handleAs: "json",
                load: function(data) {
                    if (data.parent !== undefined) {
                        domConstruct.create("span", {
                            innerHTML: i18n("Resource Template:"),
                            style: {
                                marginLeft: "20px",
                                fontWeight: "bold"
                            }
                        }, templateLabelContainer);
                        domConstruct.create("a", {
                            href: "#resourceTemplate/"+data.parent.id,
                            innerHTML: data.parent.name.escape(),
                            style: {
                                marginLeft: "5px"
                            }
                        }, templateLabelContainer);

                        if (data.parent.deleted) {
                            domConstruct.create("span", {
                                innerHTML: i18n("(Deleted)"),
                                style: {
                                    marginLeft: "5px",
                                    fontWeight: "bold",
                                    color: "#990000"
                                }
                            }, templateLabelContainer);
                        }
                    }
                    var editForm = new EditResourceTemplate({
                        showCancel: false,
                        resourceTemplate: data,
                        callback: function(success) {
                            if (success) {
                                self.refresh();
                            }
                        }
                    });
                    editForm.placeAt(editFormPopdown.domAttach);

                    self.registerDetailWidget(editForm);
                }
            });

            this.registerDetailWidget(editFormPopdown);
        },
        
        /**
         * 
         */
        selectNewBlueprint: function() {
            var self = this;
            
            var heading = document.createElement("div");
            heading.className = "containerLabel";
            heading.style.padding = "10px";
            heading.innerHTML = i18n("Create Blueprint");
            this.detailAttach.appendChild(heading);
            
            var newBlueprintForm = new EditResourceTemplate({
                showCancel: false,
                application: this.application,
                callback: function(data) {
                    if (data) {
                        self.refresh(data.id);
                    }
                }
            });
            newBlueprintForm.placeAt(this.detailAttach);

            this.registerDetailWidget(newBlueprintForm);
        },
        
        /**
         * 
         */
        confirmDelete: function(entry) {
            var self = this;
            
            var deleteConfirm = new GenericConfirm({
                message: i18n("Are you sure you want to delete blueprint '%s'?", entry.name),
                action: function() {
                    xhr.del({
                        url: bootstrap.restUrl+"resource/resourceTemplate/"+entry.id,
                        handleAs: "json",
                        load: function(data) {
                            self.refresh();
                        }
                    });
                }
            });
        }
    });
});
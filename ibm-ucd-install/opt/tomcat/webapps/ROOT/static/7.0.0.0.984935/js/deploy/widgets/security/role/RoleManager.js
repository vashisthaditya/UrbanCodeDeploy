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
        "deploy/widgets/security/role/EditRole",
        "deploy/widgets/security/role/RoleResourceTypeManager",
        "dojo/dom-construct",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/TwoPaneListManager"
        ],
function(
        array,
        declare,
        xhr,
        EditRole,
        RoleResourceTypeManager,
        domConstruct,
        Dialog,
        GenericConfirm,
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
            this.overrideListWidth = "190px";
            this.inherited(arguments);
            var self = this;
            
            this.showList("NONE");
        },
        
        /**
         * 
         */
        showList: function(selectedId) {
            var self = this;

            this.defaultSelectionId = selectedId;

            xhr.get({
                url: bootstrap.baseUrl+"security/role",
                handleAs: "json",
                load: function(data) {
                    var totalEntries = data.length;
                    var ctr = 0;
                    
                    array.forEach(data, function(entry) {
                        ctr++;
                        
                        var roleDiv = document.createElement("div");
                        roleDiv.style.position = "relative";
                        
                        var roleDivLabel = document.createElement("div");
                        roleDivLabel.className = "twoPaneEntryLabel";
                        if (entry.name.escape() === "Administrator") {
                            roleDivLabel.innerHTML = i18n(entry.name.escape());
                        }
                        else {
                            roleDivLabel.innerHTML = entry.name.escape();
                        }
                        var optionsContainer = document.createElement("div");
                        optionsContainer.className = "twoPaneActionIcons";

                        var editLink = document.createElement("div");
                        editLink.className = "inlineBlock vAlignMiddle cursorPointer margin2Left iconPencil";
                        editLink.onclick = function(event) {
                            util.cancelBubble(event);
                            self.showEditRole(entry);
                        };
                        optionsContainer.appendChild(editLink);

                        if (entry.isDeletable) {
                            var deleteLink = document.createElement("div");
                            deleteLink.className = "inlineBlock vAlignMiddle cursorPointer margin2Left iconMinus";
                            deleteLink.onclick = function(event) {
                                util.cancelBubble(event);
                                self.getProcessesRequiringRole(entry);
                            };
                            optionsContainer.appendChild(deleteLink);
                        }

                        //doing it this way seems to get the UI to co-operate and put everything in line
                        roleDiv.appendChild(optionsContainer);
                        domConstruct.place(roleDivLabel, optionsContainer, "after");

                        if (ctr === 1) {
                            // we want to automatically show the first entry in the list
                            self.selectEntry(entry);
                        }

                        self.addEntry({
                            id: entry.id,
                            domNode: roleDiv,
                            action: function() {
                                self.selectEntry(entry);
                            }
                        });
                    });
                    
                    var newRoleDiv = document.createElement("div");
                    var newRoleIcon = document.createElement("div");
                    newRoleIcon.className = "vAlignMiddle inlineBlock iconPlus";
                    newRoleDiv.appendChild(newRoleIcon);

                    var newRoleLabel = document.createElement("div");
                    newRoleLabel.innerHTML = i18n("Create Role");
                    newRoleLabel.className = "vAlignMiddle inlineBlock margin5Left";
                    newRoleDiv.appendChild(newRoleLabel);
                    
                    
                    self.addEntry({
                        id: null,
                        domNode: newRoleDiv,
                        action: function() {
                            self.showEditRole();
                        }
                    });
                }
            });
        },
        
        /**
         * 
         */
        refresh: function(newId) {
            var selectedId = newId;
            if (!newId && this.selectedEntry) {
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

            var typeManager = new RoleResourceTypeManager({
                role: entry,
                overrideListWidth: "165px"
            });
            typeManager.placeAt(this.detailAttach);
            this.registerDetailWidget(typeManager);
        },
        
        /**
         * 
         */
        showEditRole: function(role) {
            var self = this;
            
            var roleDialog = new Dialog({
                title: !!role ? i18n("Edit Role") : i18n("Create User Role"),
                closable: true,
                draggable: true
            });
            
            var roleForm = new EditRole({
                role: role,
                callback: function(success, newId) {
                    if (success) {
                        roleDialog.hide();
                        roleDialog.destroy();

                        self.refresh(newId);
                    }
                }
            });

            roleForm.placeAt(roleDialog.containerNode);
            roleDialog.show();
            
            if (!role) {
                this.clearSelection();
            }
        },
        
        /**
         * 
         */
        confirmDelete: function(entry, message) {
            var self = this;
            
            var deleteConfirm = new GenericConfirm({
                message: message,
                forceRawMessages: true,
                action: function() {
                    xhr.del({
                        url: bootstrap.baseUrl+"security/role/"+entry.id,
                        handleAs: "json",
                        load: function(data) {
                            self.refresh();
                        }
                    });
                }
            });
        },

        /**
         * 
         */
        getProcessesRequiringRole: function(entry) {
            var self = this;
            var message = i18n("Are you sure you want to delete %s? This will permanently delete " +
                    "it from the system.", util.escape(entry.name));
            xhr.get({
               url: bootstrap.restUrl + "security/role/" + entry.id + "/processes",
               handleAs: "json",
               load: function(data) {
                   if (data.componentProcesses && data.componentProcesses.length > 0) {
                       var componentProcessMessage = i18n("The following component processes require " +
                           "this role in order to run:") + "<br/>";
                       array.forEach(data.componentProcesses, function(process) {
                          componentProcessMessage = componentProcessMessage + util.escape(process) + "<br/>"; 
                       });

                       message = componentProcessMessage +"<br/>" + message;
                   }
                   if (data.applicationProcesses && data.applicationProcesses.length > 0) {
                       var applicationProcessMessage = i18n("The following application processes require " +
                           "this role in order to run:") + "<br/>";
                       array.forEach(data.applicationProcesses, function(process) {
                          applicationProcessMessage = applicationProcessMessage + util.escape(process) + "<br/>"; 
                       });

                       message = applicationProcessMessage +"<br/>" + message;
                   }
                   self.confirmDelete(entry, message);
               },
               error: function(data) {
                   message += "<br/>" + i18n("It is unknown if the following role is required by any processes");
                   self.confirmDelete(entry, message);
                }
            });
        }
    });
});

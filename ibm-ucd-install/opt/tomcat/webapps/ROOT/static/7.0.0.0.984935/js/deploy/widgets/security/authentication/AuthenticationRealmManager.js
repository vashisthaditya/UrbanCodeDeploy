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
        "deploy/widgets/security/authentication/AuthenticationRealmUsers",
        "deploy/widgets/security/authentication/EditAuthenticationRealm",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/PopDown",
        "js/webext/widgets/TwoPaneListManager",
        "deploy/widgets/TooltipTitle",
        "dojo/dom-class"
        ],
function(
        array,
        declare,
        xhr,
        AuthenticationRealmUsers,
        EditAuthenticationRealm,
        GenericConfirm,
        PopDown,
        TwoPaneListManager,
        TooltipTitle,
        domClass
) {
    /**
     *
     */
    return declare('deploy.widgets.security.authentication.AuthenticationRealmManager',  [TwoPaneListManager], {
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
                url: bootstrap.baseUrl+"security/authenticationRealm?outputType=BASIC&outputType=LINKED",
                handleAs: "json",
                load: function(data) {
                    var totalEntries = data.length;
                    var ctr = 0;

                    array.forEach(data, function(entry) {
                        ctr++;
                        var realmDiv = document.createElement("div");
                        realmDiv.style.position = "relative";

                        var realmDivLabel = document.createElement("div");
                        realmDivLabel.className = "twoPaneEntryLabel";
                        realmDivLabel.innerHTML = entry.name.escape();

                        var optionsContainer = document.createElement("div");
                        optionsContainer.className = "twoPaneActionIcons";

                        var moveUpLink = document.createElement("div");
                        moveUpLink.className = "inlineBlock vAlignMiddle margin2Left";
                        if (totalEntries > 1 && ctr > 1) {
                            domClass.add(moveUpLink, "iconMoveUp");
                            domClass.add(moveUpLink, "cursorPointer");

                            moveUpLink.onclick = function(event) {
                                util.cancelBubble(event);
                                self.moveUp(entry);
                            };
                        }
                        else {
                            domClass.add(moveUpLink, "iconMoveUpDisabled");

                            moveUpLink.onclick = function(event) {
                                util.cancelBubble(event);
                            };
                        }
                        optionsContainer.appendChild(moveUpLink);

                        var moveDownLink = document.createElement("div");
                        moveDownLink.className = "inlineBlock vAlignMiddle margin2Left";
                        if (totalEntries > 1 && ctr < totalEntries) {
                            domClass.add(moveDownLink, "iconMoveDown");
                            domClass.add(moveDownLink, "cursorPointer");

                            moveDownLink.onclick = function(event) {
                                util.cancelBubble(event);
                                self.moveDown(entry);
                            };
                        }
                        else {
                            domClass.add(moveDownLink, "iconMoveDownDisabled");

                            moveDownLink.onclick = function(event) {
                                util.cancelBubble(event);
                            };
                        }
                        optionsContainer.appendChild(moveDownLink);
                        if (entry.id !== "20000000000000000000000000000001") {
                            var deleteLink = document.createElement("div");
                            deleteLink.className = "inlineBlock vAlignMiddle cursorPointer margin2Left iconMinus";
                            deleteLink.onclick = function(event) {
                                util.cancelBubble(event);
                                self.confirmDelete(entry);
                            };
                            optionsContainer.appendChild(deleteLink);
                        }

                        realmDiv.appendChild(optionsContainer);
                        realmDiv.appendChild(realmDivLabel);

                        self.addEntry({
                            id: entry.id,
                            domNode: realmDiv,
                            action: function() {
                                self.selectEntry(entry);
                            }
                        });
                    });

                    var newRealmDiv = document.createElement("div");
                    var newRealmIcon = document.createElement("div");
                    newRealmIcon.className = "vAlignMiddle inlineBlock iconPlus";
                    newRealmDiv.appendChild(newRealmIcon);

                    var newRealmLabel = document.createElement("div");
                    newRealmLabel.innerHTML = i18n("Create Realm");
                    newRealmLabel.className = "vAlignMiddle inlineBlock margin5Left";
                    newRealmDiv.appendChild(newRealmLabel);


                    self.addEntry({
                        id: null,
                        domNode: newRealmDiv,
                        action: function() {
                            self.selectNewRealm();
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

            var title = new TooltipTitle({
                titleText : entry.name.escape(),
                tooltipText : i18n("Authentication realms manage user identity within authorization realms. " +
                        "Users can be created in Internal Storage and Single Sign-On realms. " +
                        "Users can be imported in LDAP realms.")
            });
            title.placeAt(this.detailAttach);

            var userListPopdown = new PopDown({
                label: i18n("Users"),
                collapsed: false
            });
            userListPopdown.placeAt(this.detailAttach);

            var userList = new AuthenticationRealmUsers({
                authenticationRealm: entry
            });
            userList.placeAt(userListPopdown.domAttach);

            this.registerDetailWidget(userList);
            this.registerDetailWidget(userListPopdown);

            var userHr = document.createElement("div");
            userHr.className = "hr";
            userHr.style.marginTop = "15px";
            this.detailAttach.appendChild(userHr);

            var editFormPopdown = new PopDown({
                label: i18n("Edit")
            });
            editFormPopdown.placeAt(this.detailAttach);

            var editForm = new EditAuthenticationRealm({
                authenticationRealm: entry,
                callback: function(success) {
                    if (success) {
                        self.refresh();
                    }
                }
            });
            editForm.placeAt(editFormPopdown.domAttach);

            this.registerDetailWidget(editForm);
            this.registerDetailWidget(editFormPopdown);
        },

        /**
         *
         */
        selectNewRealm: function() {
            var self = this;

            var heading = document.createElement("div");
            heading.className = "containerLabel";
            heading.style.padding = "10px";
            heading.innerHTML = i18n("Create Authentication Realm");
            this.detailAttach.appendChild(heading);

            var newRealmForm = new EditAuthenticationRealm({
                callback: function(success, newId) {
                    if (success) {
                        self.refresh(newId);
                    }
                }
            });
            newRealmForm.placeAt(this.detailAttach);

            this.registerDetailWidget(newRealmForm);
        },

        /**
         *
         */
        confirmDelete: function(entry) {
            var self = this;

            var deleteConfirm = new GenericConfirm({
                message: i18n("Are you sure you want to delete authentication realm %s?", entry.name),
                action: function() {
                    xhr.del({
                        url: bootstrap.baseUrl+"security/authenticationRealm/"+entry.id,
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
        moveUp: function(entry) {
            var self = this;

            xhr.put({
                url: bootstrap.baseUrl+"security/authenticationRealm/"+entry.id+"/moveUp",
                handleAs: "json",
                load: function() {
                    self.refresh();
                }
            });
        },

        /**
         *
         */
        moveDown: function(entry) {
            var self = this;

            xhr.put({
                url: bootstrap.baseUrl+"security/authenticationRealm/"+entry.id+"/moveDown",
                handleAs: "json",
                load: function() {
                    self.refresh();
                }
            });
        }
    });
});

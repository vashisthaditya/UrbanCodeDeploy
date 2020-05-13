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
        "dojo/_base/xhr",
        "dojo/dom-construct",
        "dojo/on",
        "deploy/widgets/security/authorization/AuthorizationRealmList",
        "deploy/widgets/security/authorization/EditAuthorizationRealm",
        "deploy/widgets/security/authorization/GroupList",
        "deploy/widgets/security/authorization/GroupMemberList",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/PopDown",
        "js/webext/widgets/TwoPaneListManager",
        "deploy/widgets/TooltipTitle"
        ],
function(
        declare,
        xhr,
        domConstruct,
        on,
        AuthorizationRealmList,
        EditAuthorizationRealm,
        GroupList,
        GroupMemberList,
        GenericConfirm,
        PopDown,
        TwoPaneListManager,
        TooltipTitle
) {
    /**
     *
     */
    return declare('deploy.widgets.security.authorization.AuthorizationRealmManager',  [TwoPaneListManager], {
        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            this.addEntry({
                label: i18n("Authorization Realms"),
                action: function() {
                    self.showAuthorizationRealms();
                }
            });
            
            this.addEntry({
                label: i18n("Groups"),
                action: function() {
                    self.showGroups();
                }
            });
        },
        
        /**
         * 
         */
        showAuthorizationRealms: function() {
            var self = this;
            var title = new TooltipTitle({
                titleText : i18n("Authorization Realms"),
                tooltipText : i18n("Authorization realms are used by authentication realms " +
                        "to associate users with groups and to determine user access.")
            });
            title.placeAt(this.detailAttach);

            var realmList = new AuthorizationRealmList();
            realmList.placeAt(this.detailAttach);
            
            this.registerDetailWidget(realmList);
        },
        
        /**
         * 
         */
        showGroups: function() {
            var self = this;
        
            this.clearDetail();

            var heading = document.createElement("div");
            heading.className = "containerLabel";
            heading.style.padding = "10px";
            heading.innerHTML = i18n("Groups");
            this.detailAttach.appendChild(heading);

            var groupList = new GroupList({
                showGroupMembers: function(group) {
                    self.showGroupMembers(group);
                }
            });
            groupList.placeAt(this.detailAttach);
            
            this.registerDetailWidget(groupList);
        },
        
        /**
         * 
         */
        showGroupMembers: function(group) {
            var self = this;
            
            this.clearDetail();
            
            var heading = document.createElement("div");
            heading.className = "containerLabel";
            heading.style.padding = "10px";
            
            var groupsLink = domConstruct.create("a", {
                "innerHTML": i18n("Groups"),
                "class": "linkPointer"
            }, heading);
            on(groupsLink, "click", function() {
                self.showGroups();
            });
            
            util.appendTextSpan(heading, "&nbsp;/ "+group.name.escape());
            this.detailAttach.appendChild(heading);

            var groupMemberList = new GroupMemberList({
                group: group
            });
            groupMemberList.placeAt(this.detailAttach);
            
            this.registerDetailWidget(groupMemberList);
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
            
            var userHr = document.createElement("div");
            userHr.className = "hr";
            userHr.style.marginTop = "15px";
            this.detailAttach.appendChild(userHr);
            
            var editFormPopdown = new PopDown({
                label: i18n("Edit")
            });
            editFormPopdown.placeAt(this.detailAttach);
            
            var editForm = new EditAuthorizationRealm({
                authorizationRealm: entry,
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
            heading.innerHTML = i18n("Create Authorization Realm");
            this.detailAttach.appendChild(heading);
            
            var newRealmForm = new EditAuthorizationRealm({
                callback: function(success) {
                    if (success) {
                        self.refresh();
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
                message: i18n("Are you sure you want to delete authorization realm %s?", entry.name.escape()),
                action: function() {
                    xhr.del({
                        url: bootstrap.baseUrl+"security/authorizationRealm/"+entry.id,
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

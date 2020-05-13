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
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/dom-class",
    "dojo/on",
    "dijit/form/Button",
    "deploy/widgets/security/team/EditTeam",
    "deploy/widgets/security/team/SecuredObjects",
    "deploy/widgets/TooltipTitle",
    "js/webext/widgets/GenericConfirm",
    "js/webext/widgets/TwoPaneListManager"
], function(
    array,
    declare,
    xhr,
    dom,
    domConstruct,
    domClass,
    on,
    Button,
    EditTeam,
    SecuredObjects,
    TooltipTitle,
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
            this.inherited(arguments);
            this._loadPermissions();
            this.rightPanel = false;
            this.showList();
            if (this.initialSelect) {
                this.clearSelection();
                this.selectEntry(this.initialSelect);
            }
        },

        /**
         * Sets the permissions.
         */
        _loadPermissions: function() {
            var p = config.data.permissions;
            this.canAdd = p["Add Team Members"];
            this.canEdit = p["Manage Security"];
            if (this.canEdit) {
                this.url = bootstrap.baseUrl + "security/team";
            }
            else {
                this.url = bootstrap.restUrl + "security/getTeamsForCurrentUser/";
            }
        },

        /**
         *
         */
        showList: function(selectedId) {
            var _this = this;
            this.defaultSelectionId = selectedId;

            xhr.get({
                url: _this.url,
                handleAs: "json",
                load: function(data) {
                    var numberOfEntries = 0;
                    array.forEach(data, function(entry) {
                        numberOfEntries++;
                        var teamDiv = domConstruct.create("div", {
                            style: {
                                position: "relative"
                            }
                        });

                        var optionsContainer = domConstruct.create("div", {
                            className: "twoPaneActionIcons"
                        }, teamDiv);

                        if ((entry.id !== "20000000000000000000000100000000") && _this.canEdit) {
                            var deleteLink = domConstruct.create("div", {
                                className: "inlineBlock vAlignMiddle cursorPointer margin2Left iconMinus"
                            }, optionsContainer);
                            deleteLink.onclick = function(event) {
                                util.cancelBubble(event);
                                _this.confirmDelete(entry);
                            };
                        }

                        //need to force the position of the name after the options container for proper display
                        var name = entry.name.escape();
                        if (name === "System Team") {
                            name = i18n("System Team");
                        }
                        domConstruct.place(domConstruct.create("div", {
                            className: "twoPaneEntryLabel",
                            innerHTML: name
                        }), optionsContainer, "after");

                        _this.addEntry({
                            id: entry.id,
                            domNode: teamDiv,
                            action: function() {
                                _this.selectEntry(entry);
                            }
                        });
                    });
                    if (_this.canEdit) {
                        var newTeamDiv = domConstruct.create("div");

                        domConstruct.create("div", {
                            className: "vAlignMiddle inlineBlock iconPlus"
                        }, newTeamDiv);

                        domConstruct.create("div", {
                            innerHTML: i18n("Create Team"),
                            className: "vAlignMiddle inlineBlock margin5Left"
                        }, newTeamDiv);

                        _this.addEntry({
                            id: null,
                            domNode: newTeamDiv,
                            action: function() {
                                _this.selectNewTeam();
                                domClass.add(_this.domNode, "create-new-team");
                            }
                        });
                    }
                    if (numberOfEntries === 0) {
                        domConstruct.create("div", {
                            className: "containerLabel",
                            innerHTML: i18n("You are currently not in any teams")
                        }, _this.detailAttach);
                    }
                }
            });
        },

        /**
         *
         */
        refresh: function(newId) {
            this._loadPermissions();
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
            var _this = this;

            if (domClass.contains(this.domNode, "create-new-team")) {
                domClass.remove(this.domNode, "create-new-team");
            }

            if (entry.name.escape() === "System Team") {
                entry.name = i18n("System Team");
            }

            var title = new TooltipTitle({
                titleText: entry.name.escape(),
                tooltipText: i18n("Use the Add Users and Groups button to drag users and " +
                    "groups onto roles. You can also add users directly to roles by using the " +
                    "Add button associated with the role.")
            });
            title.placeAt(this.detailAttach);

            xhr.get({
                url: bootstrap.baseUrl + "security/team/" + entry.id,
                handleAs: "json",
                load: function(data) {
                    var editForm = new EditTeam({
                        team: data,
                        showRightPanel: _this.rightPanel,
                        callback: function(success, rightPanel) {
                            _this.rightPanel = rightPanel;
                            if (success) {
                                _this.refresh();
                            }
                        }
                    });
                    editForm.placeAt(_this.detailAttach);
                    _this.registerDetailWidget(editForm);
                    _this.showTeamObjects(entry);
                }
            });
        },

        /**
         *
         */
        selectNewTeam: function() {
            var _this = this;

            domConstruct.create("div", {
                className: "containerLabel",
                innerHTML: i18n("Create Team"),
                style: {
                    padding: "10px"
                }
            }, this.detailAttach);

            var newTeamForm = new EditTeam({
                callback: function(success, rightPanel, newId) {
                    if (success) {
                        _this.refresh(newId);
                    }
                }
            });
            newTeamForm.placeAt(this.detailAttach);

            this.registerDetailWidget(newTeamForm);
        },

        /**
         *
         */
        confirmDelete: function(entry) {
            var _this = this;

            var deleteConfirm = new GenericConfirm({
                message: i18n("Are you sure you want to delete team %s?", entry.name),
                action: function() {
                    xhr.del({
                        url: bootstrap.baseUrl + "security/team/" + entry.id,
                        handleAs: "json",
                        load: function(data) {
                            _this.refresh();
                        }
                    });
                }
            });
        },

        /**
         *
         */
        showTeamObjects: function(entry) {
            var headerRule = domConstruct.create("div", {
                className: "team-object-mapping-divider"
            });
            this.detailAttach.appendChild(headerRule);

            var title = new TooltipTitle({
                titleText: i18n("Team Object Mappings"),
                tooltipText: i18n("When a team is assigned to an object, only team members with the " +
                    "appropriate permissions can interact with the affected object.")
            });
            title.placeAt(this.detailAttach);

            this.securedObjects = new SecuredObjects({
                team: entry.id
            });
            this.securedObjects.placeAt(this.detailAttach);
            this.registerDetailWidget(this.securedObjects);
        }
    });
});

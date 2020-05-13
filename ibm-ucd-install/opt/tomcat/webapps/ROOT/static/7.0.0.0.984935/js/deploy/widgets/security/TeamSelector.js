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
        "js/util/blocker/_BlockerMixin",
        "dijit/form/Select",
        "dijit/form/Button",
        "dojo/_base/declare",
        "dojo/_base/array",
        "dojo/request/xhr",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/on",
        "js/webext/widgets/select/WebextSelect",
        "js/webext/widgets/select/WebextMultiSelect",
        "js/webext/widgets/Alert",
        "js/webext/widgets/FormDelegates"
        ],
function(
        _TemplatedMixin,
        _Widget,
        _BlockerMixin,
        Select,
        Button,
        declare,
        array,
        xhr,
        domConstruct,
        domClass,
        on,
        WebextSelect,
        WebextMultiSelect,
        Alert,
        FormDelegates
) {
    /**
     *
     */
    return declare('js.deploy.widgets.security.TeamSelector',  [_Widget, _TemplatedMixin, _BlockerMixin], {
        templateString:
            '<div class="roleSelector">' +
            '  <div data-dojo-attach-point="teamsAttach" class="tagDisplay"></div>' +
            '  <div data-dojo-attach-point="showTeamAttach" class="showTeam inlineBlock"></div>' +
            '  <div data-dojo-attach-point="teamFormAttach" class="teamForm"> ' +
            '    <div data-dojo-attach-point="closeAttach"></div>' +
            '    <div>' +
            '      <div class="team-selector">' +
            '        <div data-dojo-attach-point="addTeamLabelAttach"></div>' +
            '        <div data-dojo-attach-point="teamListAttach" id="teams"></div>' +
            '      </div>' +
            '      <div class="team-selector">' +
            '        <div data-dojo-attach-point="innerAttach"></div>' +
            '        <div data-dojo-attach-point="resourceRoleAttach"></div>' +
            '      </div>' +
            '    </div>' +
            '    <div data-dojo-attach-point="buttonAttach" class="team-selector-buttons"> ' +
            '      <div data-dojo-attach-point="addButtonAttach" class="inline-block"></div>' +
            '      <div data-dojo-attach-point="cancelButtonAttach" class="inline-block"></div>' +
            '    </div> ' +
            '  </div> ' +
            '</div>',

        selectedTeams: null,

        /**
         *
         */
        postCreate: function() {
            var self = this;
            self.selectedTeams = [];
            self.hide(self.teamFormAttach);

            if(!self.isReadOnly()) {
                var showTeamButton = new Button({
                    showLabel: false,
                    onClick: function() {
                        // We only add the teamselect here because we don't want to get the list of
                        // all available teams until we know the user is trying to add teams.
                        self.addTeamSelect();
                        self.show(self.teamFormAttach);
                    },
                    style: "margin: 0 0 2px;",
                    className: "showTeamButton"
                });
                showTeamButton.placeAt(this.showTeamAttach);

                var hideTeamButton = new Button({
                    label: i18n("Cancel"),
                    onClick: function() {
                        //hide team form
                        self.hide(self.teamFormAttach);
                    },
                    className: "hideTeamButton"
                });
                domClass.add(hideTeamButton.domNode, "idxButtonCompact");
                hideTeamButton.placeAt(self.cancelButtonAttach);

                var addButton = new Button({
                    label: i18n("Add"),
                    onClick: function(){
                        if (!self.teams[0]) {
                            self.teamsAttach.innerHTML = "";
                        }
                        if (self.teamSelect.get("value") !== "") {
                            array.forEach(self.selectedTeams, function(team) {
                                self.addTeamWithResourceRole(team.teamLabel, self.selectedResourceRoleLabel,
                                        team.teamId, self.selectedResourceRoleId, false);
                            });
                        }
                    }
                });
                domClass.add(addButton.domNode, "idxButtonCompact idxButtonSpecial");
                addButton.placeAt(self.addButtonAttach);

                var teamLabel = domConstruct.create("div", {
                    "class": "teamFormLabel",
                    innerHTML: i18n("Team")
                });

                var typeLabel = domConstruct.create("div", {
                    "class": "teamFormLabel",
                    innerHTML: i18n("Type")
                });

                domConstruct.place(teamLabel, this.addTeamLabelAttach);
                domConstruct.place(typeLabel, this.innerAttach);

                var removeTeamFormLink = domConstruct.create("div", {
                    "class": "icon-Icon_close__ui-05 linkPointer",
                    "onclick": function() {
                        self.hide(self.teamFormAttach);
                    }
                }, this.closeAttach);

                self.addResourceRoleSelect();
            }
            self.displayTeams();
        },

        /**
         * Display the Team Select.
         *
         * This is asynchronous, and blocks the widget while we're waiting for the list of teams.
         */
        addTeamSelect: function() {
            var self = this;
            if (!!self.teamSelect) {
                return;
            }

            var teamRequestURL = bootstrap.restUrl + "security/teamsWithCreateAction/" + self.resourceRoleType;
            var teamRequest = xhr.get(teamRequestURL, {
                query: {
                    applyManagePermission: true
                },
                handleAs: "json"
            });

            this.block();

            teamRequest.then(function(data) {
                self.teamSelect = FormDelegates.retrieveDelegate("TableFilterMultiSelect")({
                    data: data,
                    searchAttr: "teamLabel",
                    idAttribute: "teamId",
                    formatDropDownLabel: function(labelDomNode, entry) {
                        return entry.teamLabel;
                    },
                    onAdd: function(entry) {
                        self.selectedTeams.push({
                            teamId: entry.teamId,
                            teamLabel: entry.teamLabel
                        });
                    },
                    onRemove: function(entry) {
                        self.selectedTeams = array.filter(self.selectedTeams, function(item) {
                            return item.teamId !== entry.teamId && item.teamLabel !== entry.teamLabel;
                        });
                    },
                    allowNone: false
                });
                self.teamSelect.placeAt(self.teamListAttach);
            });

            teamRequest.always(function() {
                self.unblock();
            });
        },

        /**
         * Display the Type Select
         */
        addResourceRoleSelect: function() {
            var self = this;
            self.resourceRoleSelect = FormDelegates.retrieveDelegate("TableFilterSelect")({
                url: bootstrap.baseUrl + "security/resourceType/" + self.resourceRoleType + "/resourceRoles",
                onChange: function (value, entry) {
                    if (value) {
                        self.selectedResourceRoleId = value;
                        self.selectedResourceRoleLabel = entry.name;
                    }
                    else {
                        self.selectedResourceRoleId = null;
                        self.selectedResourceRoleLabel = null;
                    }
                },
                allowNone: true,
                placeHolder: i18n("Standard " + self.resourceRoleType)
            });
            self.resourceRoleSelect.placeAt(self.resourceRoleAttach);
        },

        /**
         * Add a mapping and display it.
         */
        addTeamWithResourceRole: function(teamLabel, resourceRoleLabel, teamId, resourceRoleId, preloading) {
            var self = this;
            var displayName = teamLabel;
            if (resourceRoleLabel) {
                displayName += " "+i18n("(as %s)", resourceRoleLabel);
            }
            var mappingExists = false;
            if (!preloading) {
                array.forEach(self.teams, function(team) {
                    if (self.matchResourceRoleIds(team.resourceRoleId, resourceRoleId)
                            && team.teamId === teamId) {
                        mappingExists = true;
                    }
                });
            }

            if (mappingExists === false) {
                var mappingId = teamId + "|" + resourceRoleId + "|" + self.id;
                var mappingBox = domConstruct.create("div", {
                    "class": "inlineBlock tagBox",
                    "id": mappingId
                });
                var mappingName = domConstruct.create("div", {
                    className: "inline-block tagName",
                    innerHTML: displayName.escape()
                }, mappingBox);

                if(!self.isReadOnly()) {
                    var removeLink = domConstruct.create("div", {
                        className: "inline-block tagDelete",
                        innerHTML: "x"
                    }, mappingBox);

                    on(removeLink, "click", function() {
                        self.teams = array.filter(self.teams, function(team) {
                            return (!self.matchResourceRoleIds(team.resourceRoleId, resourceRoleId)
                                    || team.teamId !== teamId);
                        });
                        domConstruct.destroy(mappingId);

                        // Let people on the outside know we updated the list
                        if (!!self.onChanged) {
                            self.onChanged(self.teams);
                        }
                    });
                }

                if (!preloading) {
                    self.teams.push({
                        "resourceRoleId": resourceRoleId,
                        "teamId": teamId
                    });
                }

                domConstruct.place(mappingBox, self.teamsAttach);

                // Let people on the outside know we updated the list
                if (!!self.onChanged) {
                    self.onChanged(self.teams);
                }
            }
            else {
                Alert({
                    message: i18n("A mapping with that team (%1) and subtype (%2) already exists",
                            teamLabel, (!resourceRoleLabel ? i18n("Standard %s", self.resourceRoleType) : resourceRoleLabel))
                });
            }
        },

        /**
         * Display currently added teams
         */
        displayTeams: function() {
            var self = this;
            if (self.teams) {
                array.forEach(self.teams, function(entry) {
                    self.addTeamWithResourceRole(entry.teamLabel, entry.resourceRoleLabel,
                            entry.teamId, entry.resourceRoleId, true);
                });
            }
            else {
                self.teamsAttach.innerHTML = i18n("No Teams");
                self.teams = [];
            }
        },

        /**
         * Check if readOnly is set
         */
        isReadOnly : function() {
            var self = this;
            var result = false;

            if (self.readOnly) {
                result = true;
            }

            return result;
        },

        /**
         * Add hidden attribute to a dom node
         */
        hide: function(item) {
            if (item) {
                domClass.add(item, "hidden");
            }
        },

        /**
         * Remove hidden attribute from a dom node
         */
        show: function(item) {
            if (item) {
                domClass.remove(item, "hidden");
            }
        },

        /**
         * Check two resourceRoles for equality
         */
        matchResourceRoleIds: function(id1, id2) {
            var result = false;
            //if both are either null or undefined they are considered equal
            if ((id1 === id2) || (!id1 && !id2)) {
                result = true;
            }
            return result;
        }
    });
});

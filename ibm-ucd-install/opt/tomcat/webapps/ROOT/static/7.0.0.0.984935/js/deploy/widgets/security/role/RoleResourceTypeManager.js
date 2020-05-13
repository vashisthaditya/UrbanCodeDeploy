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
        "js/webext/widgets/TwoPaneListManager",
        "js/webext/widgets/PopDown",
        "deploy/widgets/security/role/RoleDefaultActions",
        "deploy/widgets/security/role/RoleResourceTypeGrid",
        "dijit/Tooltip"
        ],
function(
        array,
        declare,
        xhr,
        domConstruct,
        TwoPaneListManager,
        PopDown,
        RoleDefaultActions,
        RoleResourceTypeGrid,
        Tooltip
) {
    /**
     *
     */
    return declare("deploy/widgets/security/role/RoleResourceTypeManager", [TwoPaneListManager], {
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
                url: bootstrap.baseUrl+"security/resourceType",
                handleAs: "json",
                load: function(data) {
                    var totalEntries = data.length;

                    array.forEach(data, function(entry) {
                        var itemDiv = document.createElement("div");
                        itemDiv.style.position = "relative";

                        var itemDivLabel = document.createElement("div");
                        itemDivLabel.className = "twoPaneEntryLabel";
                        itemDivLabel.innerHTML = i18n(entry.name.escape());
                        itemDiv.appendChild(itemDivLabel);

                        self.addEntry({
                            id: entry.id,
                            domNode: itemDiv,
                            action: function() {
                                self.selectEntry(entry);
                            }
                        });
                    });
                }
            });
        },

        /**
         *
         */
        refresh: function(newId) {
            var selectedId = newId || this.selectedEntry.id;

            this.clearDetail();
            this.clearList();
            this.showList(selectedId);
        },

        /**
         * Clear out the detail pane and put this component's information there.
         */
        selectEntry: function(entry) {
            var self = this;

            var titleBar = domConstruct.create("div", {
                "class": "resourceRole-tooltipTitle"
            });
            var title = domConstruct.create("h2", {
                "innerHTML": this.header || i18n("Permissions Granted to Role Members"),
                "class": "title-text"
            }, titleBar);
            var tooltipCell = domConstruct.create("div", {
                "class" : "labelsAndValues-helpCell title-helpCell"
            }, titleBar);
            var helpTip = new Tooltip({
                connectId: [tooltipCell],
                label: i18n("When configuring a new role, select which permissions users with " +
                        "the role should have. Users will not be able to interact with those objects " +
                        "in the Web UI unless they are given permission to the correct tabs from the " +
                        "Web UI menu as well."),
                showDelay: 100,
                position: ["after", "above", "below", "before"]
            });
            domConstruct.place(titleBar, this.detailAttach);

            var detailText = i18n("Role name: %s", util.escape(this.role.name));
            if (this.role.description) {
                detailText = detailText + "&nbsp; (" + util.escape(this.role.description) + ")";
            }
            var details = domConstruct.create("div", {
                "innerHTML": detailText,
                "class": "resourceRole-tooltipTitle"
            });
            domConstruct.place(details, this.detailAttach);

            if (entry.name === "Web UI" || entry.name === "Server Configuration") {
                var roleDefaults = new RoleDefaultActions({
                    role: self.role,
                    resourceType: entry
                });
                roleDefaults.placeAt(this.detailAttach);

                this.registerDetailWidget(roleDefaults);
            }
            else {
                var roleTypeGrid = new RoleResourceTypeGrid({
                    role: self.role,
                    resourceType: entry,
                    canEdit: self.canEdit
                });
                roleTypeGrid.placeAt(this.detailAttach);

                this.registerDetailWidget(roleTypeGrid);
            }
        }
    });
});

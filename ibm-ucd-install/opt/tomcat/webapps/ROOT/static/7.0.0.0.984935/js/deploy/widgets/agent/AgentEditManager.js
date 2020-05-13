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
        "dojo/on",
        "dojo/dom-construct",
        "js/webext/widgets/TwoPaneListManager",
        "deploy/widgets/agent/EditAgent",
        "deploy/widgets/property/PropValues",
        "deploy/widgets/agent/AgentSecurityTab"
        ],
function(
        array,
        declare,
        xhr,
        on,
        domConstruct,
        TwoPaneListManager,
        EditAgent,
        PropValues,
        AgentSecurityTab
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

            self.addEntry({
                id: "basic",
                label: i18n("Basic Settings"),
                action: function() {
                    self.addHeading(i18n("Basic Settings"));
                    self.showBasicSettings();
                }
            });

            self.addEntry({
                id: "properties",
                label: i18n("Agent Properties"),
                action: function() {
                    self.addHeading(i18n("Agent Properties"));
                    self.showProperties();
                }
            });

            if (config.data.permissions["Settings Tab"] === true) {
                self.addEntry({
                    id: "security",
                    label: i18n("Agent Security"),
                    action: function() {
                        self.addHeading(i18n("Agent Security"));
                        self.showSecurity();
                    }
                });
            }
        },

        addHeading: function(heading) {
            domConstruct.create("div", {
                innerHTML: heading,
                "class": "containerLabel"
            }, this.detailAttach);
        },

        addDescription: function(description) {
            domConstruct.create("div", {
                innerHTML: description,
                style: {
                    marginBottom: "10px"
                }
            }, this.detailAttach);
        },

        showBasicSettings: function() {
            var editAgent = new EditAgent({
                showCancel: false,
                agent: appState.agent,
                readOnly: !appState.agent.security["Edit Basic Settings"]
            });
            editAgent.placeAt(this.detailAttach);
        },

        showProperties: function() {
            var self = this;

            var propValues = new PropValues({
                propSheet: appState.agent.propSheet,
                readOnly: !appState.agent.security["Manage Properties"]
            });
            propValues.placeAt(self.detailAttach);
        },

        showSecurity: function() {
            var securityTab = new AgentSecurityTab({
                agent: appState.agent
            });
            securityTab.placeAt(this.detailAttach);
        }
    });
});
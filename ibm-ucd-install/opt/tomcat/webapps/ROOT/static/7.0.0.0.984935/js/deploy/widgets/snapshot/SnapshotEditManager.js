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
        "dojo/on",
        "dojo/dom-construct",
        "js/webext/widgets/TwoPaneListManager",
        "deploy/widgets/snapshot/EditSnapshot",
        "deploy/widgets/snapshot/SnapshotConfiguration"
        ],
function(
        array,
        declare,
        on,
        domConstruct,
        TwoPaneListManager,
        EditSnapshot,
        SnapshotConfiguration
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
                id: "advanced",
                label: i18n("Advanced Settings"),
                action: function() {
                    self.addHeading(i18n("Advanced Settings"));
                    self.showAdvancedSettings();
                }
            });
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
            var editSnapshot = new EditSnapshot({
                snapshot: appState.snapshot,
                application: appState.application,
                readOnly: !appState.application.extendedSecurity[security.application.manageSnapshots] || appState.snapshot.versionsLocked || appState.snapshot.configLocked
            });
            editSnapshot.placeAt(this.detailAttach);
        },
        
        showAdvancedSettings: function() {
            var snapshotConfiguration = new SnapshotConfiguration({
                snapshotId: appState.snapshot.id,
                applicationId: appState.application.id,
                readOnly: !appState.application.extendedSecurity[security.application.manageSnapshots] || appState.snapshot.configLocked
            });
            snapshotConfiguration.placeAt(this.detailAttach);
        }
    });
});
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
        "dojo/_base/array",
        "dojo/dom-construct",
        "dojo/on",
        "deploy/widgets/component/VersionHistory",
        "js/webext/widgets/TwoPaneListManager"
        ],
function(
        declare,
        xhr,
        array,
        domConstruct,
        on,
        VersionHistory,
        TwoPaneListManager
) {
    /**
     *
     */
    return declare('deploy.widgets.component.VersionHistoryManager',  [TwoPaneListManager], {
        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            xhr.get({
                url: bootstrap.restUrl+"deploy/component/" + self.component.id + "/applications",
                handleAs: "json",
                load: function(data) {
                    array.forEach(data, function(entry) {
                        self.addEntry({
                            id: entry.id,
                            label: entry.name.escape(),
                            action: function() {
                                self.showApplications(entry);
                            }
                        });
                    });
                }
            });
        },
        
        /**
         * 
         */
        showApplications: function(application) {
            var self = this;
            
            var heading = document.createElement("div");
            heading.className = "containerLabel";
            heading.style.padding = "10px";
            heading.innerHTML = application.name.escape();
            this.detailAttach.appendChild(heading);

            var versionHistory = new VersionHistory({
                application: application,
                component: self.component
                });
            versionHistory.placeAt(this.detailAttach);
            this.registerDetailWidget(versionHistory);
        }
    });
});

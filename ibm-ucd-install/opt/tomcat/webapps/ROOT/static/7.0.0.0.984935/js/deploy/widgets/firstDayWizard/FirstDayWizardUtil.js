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
/*global i18n, define, formatters, navBar */

define(["dojo/_base/array",
        "dojo/query",
        "dojo/dom-attr",
        "dojo/dom-style"
        ],
function(array,
        query,
        domAttr,
        domStyle) {
    return {

        /**
         * Hide the current tab and navigate to a new designated tab.
         * @param {string} toHash - hash string of the top most level tabs, e.g. 'calendar'.
         */
        navigateToAndHideCurrentTab: function(toHash) {
            var currentHash = "#main/" + navBar.recentHash;
            navBar.setHash("main/" + toHash);
            array.forEach(dojo.query(".topLevelTabs .tab"), function(node) {
                var nodeHash = domAttr.get(node, "href");
                if (nodeHash === currentHash) {
                    domStyle.set(node, "display", "none");
                }
            });
        },

        /**
         * Unhide the designated tab and navigate to it.
         * @param {string} toHash - hash string of the top most level tabs, e.g. 'calendar'.
         */
        navigateAndShowTab: function(toHash) {
            var toHashHref = "#main/" + toHash;
            array.forEach(dojo.query(".topLevelTabs .tab"), function(node) {
                var nodeHash = domAttr.get(node, "href");
                if (nodeHash === toHashHref) {
                    domStyle.set(node, "display", "");
                }
            });
            navBar.setHash("main/" + toHash);
        },

        /**
         * Navigate to first displayed tab
         */
        navigateToFirstDisplayedTab: function() {
            var filteredNodes = array.filter(dojo.query(".topLevelTabs .tab"), function(node) {
                return domStyle.get(node, "display") !== "none";
            });
            if (filteredNodes && filteredNodes.length > 0) {
                var nodeHash = domAttr.get(filteredNodes[0], "href");
                navBar.setHash(nodeHash);
            }
        },

        /**
         * Hide a tab. Note this only hides the tab menu at the top.
         * @param {string} hash - hash string of the top most level tabs, e.g. 'calendar'.
         */
        hideMainTab: function(hash) {
            var hashHref = "#main/" + hash;
            array.forEach(dojo.query(".topLevelTabs .tab"), function(node) {
                var nodeHash = domAttr.get(node, "href");
                if (nodeHash === hashHref) {
                    domStyle.set(node, "display", "none");
                }
            });
        },

        /***
         * Make labels of required fields bold in ColumnForm
         */
        boldLabelsOfRequiredFields: function() {
            query(".labelsAndValues-labelCell .required").forEach(function(node) {
                domStyle.set(node.parentNode, "font-weight", "bold");
            });
        }
    };
});

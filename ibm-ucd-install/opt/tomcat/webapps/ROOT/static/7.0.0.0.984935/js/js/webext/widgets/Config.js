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
/*global define */
define([
        "dojo/_base/declare",
        "dojo/_base/array"
        ],
function(
        declare,
        array
) {
    return declare([], {

        "data": null,

        /**
         *
         */
        constructor: function(data) {
            var self = this;
            this.setData(data);
        },

        setData: function(data) {
            var self = this;

            if (!data) {
                this.data = this.defaultRoleConfig;
            }
            else {
                this.data = data;
            }

            // Set tabSet back-reference on every tab
            if (this.data && this.data.tabSets) {
                array.forEach(this.data.tabSets, function (tabSet) {
                    array.forEach(tabSet.tabs, function (tab) {
                        tab.tabSet = tabSet;
                        tab.hashPattern = tabSet.id + "/" + tab.id;
                    });
                });
            }
        },

        /**
         * Return data about a tab given a tab set ID.
         */
        getTabSet: function(tabSetId) {
            if (!tabSetId) {
                tabSetId = this.data.defaultTabSet;
            }

            var result = null;
            array.forEach(this.data.tabSets, function(tabSet) {
                if (tabSet.id === tabSetId) {
                    result = tabSet;
                }
            });

            return result;
        },

        /**
         * Return data about a tab given a tab set and tab ID.
         */
        getTab: function(tabSetId, tabId) {
            var result = null;

            var tabSet = this.getTabSet(tabSetId);
            if (tabSet !== null) {

                if (!tabId) {
                    tabId = tabSet.defaultTab;
                }

                array.forEach(tabSet.tabs, function(tab) {
                    if (tab.id === tabId) {
                        result = tab;
                    }
                });
            }

            return result;
        },

        /**
         * Return data for a breadcrumb by ID.
         */
        getBreadcrumb: function(breadcrumbId) {
            var result = null;

            array.forEach(this.data.breadcrumbItems, function(breadcrumbItem) {
                if (breadcrumbItem.id === breadcrumbId) {
                    result = breadcrumbItem;
                }
            });

            return result;
        },

        /**
         * General purpose function to return a property of the config by name.
         */
        getProperty: function(propertyName) {
            return this.data[propertyName];
        },

        /**
         * General purpose function to return the result of a call to a given function by name.
         */
        getFunctionResult: function(functionName) {
            var result = null;

            var func = this.data[functionName];
            if (func !== undefined) {
                result = func();
            }

            return result;
        }
    });
});
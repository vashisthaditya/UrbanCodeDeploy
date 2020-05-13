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
        "dojo/_base/lang",
        "dojo/json"
        ],
function(
        declare,
        lang,
        JSON
) {
    var lscache = lang.getObject('lscache'); // get from kernel.global.lscache
    var oneYear = 365 * 24 * 60;

    return declare(null,
        {
            _cookieName: "savedTableConfig",
            rowsPerPage: 10,
            pageNumber: 1,
            orderField: null,
            sortType: "asc",
            expandedNodeList: null,

            pageOptions: [10, 25, 50, 100, 250],

            /**
             *
             */
            initConfigMixin: function() {
                this.defaultRowsPerPage = this.rowsPerPage;
                this.defaultPageNumber = this.pageNumber;
                this.defaultOrderField = this.orderField;
                this.defaultSortType = this.sortType;

                var storedTableConfig = this.getStoredConfig();
                if (storedTableConfig !== undefined) {
                    if (storedTableConfig.rowsPerPage !== undefined) {
                        this.rowsPerPage = storedTableConfig.rowsPerPage;
                    }
                    if (storedTableConfig.pageNumber !== undefined) {
                        this.pageNumber = storedTableConfig.pageNumber;
                    }
                    if (storedTableConfig.orderField !== undefined) {
                        this.orderField = storedTableConfig.orderField;
                    }
                    if (storedTableConfig.sortType !== undefined) {
                        this.sortType = storedTableConfig.sortType;
                    }
                    if (storedTableConfig.expandedNodeList !== undefined) {
                        this.expandedNodeList = storedTableConfig.expandedNodeList;
                    }
                }
            },

            /**
             *
             */
            getStoredConfig: function() {
                var result; // = undefined;

                if (this.tableConfigKey) {
                    if (lscache) {
                        var tableConfigJson = lscache.get(this.tableConfigKey);
                        if (typeof tableConfigJson === 'String') {
                            return JSON.parse(tableConfigJson);
                        }
                        if (!!tableConfigJson) {
                            return tableConfigJson;
                        }
                        // fall-back to the older cookie-store
                    }

                    if (!result) {
                        var tableConfig = util.getCookie(this._cookieName);

                        if (tableConfig) {
                            var tableConfigObject = JSON.parse(tableConfig);
                            result = tableConfigObject[this.tableConfigKey];
                        }
                    }
                }

                return result;
            },

            /**
             * A function to save the given object as the configuration of this table.
             */
            storeConfig: function(storedTableConfig) {
                if (!!this.tableConfigKey) {
                    if (lscache) {
                        lscache.set(this.tableConfigKey, JSON.stringify(storedTableConfig), oneYear);
                        return;
                    }

                    var tableConfigObject = {};

                    var currentTableConfig = util.getCookie(this._cookieName);
                    if (currentTableConfig) {
                        tableConfigObject = JSON.parse(currentTableConfig);
                    }

                    tableConfigObject[this.tableConfigKey] = storedTableConfig;

                    // If we've accumulated more than 3900 characters of table config (one cookie), knock
                    // content off in the opposite order it was added.
                    var first;
                    var newTableConfig;
                    var key;
                    while (JSON.stringify(tableConfigObject).length > 3900) {
                        first = true;
                        newTableConfig = {};

                        for (key in tableConfigObject) {
                            if (tableConfigObject.hasOwnProperty(key)) {
                                if (!first) {
                                    newTableConfig[key] = tableConfigObject[key];
                                }
                                first = false;
                            }
                        }
                        tableConfigObject = newTableConfig;
                    }

                    util.setCookie(this._cookieName, JSON.stringify(tableConfigObject));
                }
            },

            /**
             * Get the current configuration of this table and save it in the table config cookie
             */
            saveCurrentSettings: function() {
                if (this.tableConfigKey !== undefined) {
                    var storedTableConfig = {};

                    // Only store settings which deviate from the default for the table.
                    if (this.rowsPerPage !== this.defaultRowsPerPage) {
                        storedTableConfig.rowsPerPage = this.rowsPerPage;
                    }
                    if (this.pageNumber !== this.defaultPageNumber) {
                        storedTableConfig.pageNumber = this.pageNumber;
                    }
                    if (this.orderField !== this.defaultOrderField) {
                        storedTableConfig.orderField = this.orderField;
                    }
                    if (this.sortType !== this.defaultSortType) {
                        storedTableConfig.sortType = this.sortType;
                    }

                    storedTableConfig.expandedNodeList = this.expandedNodeList;
                    this.storeConfig(storedTableConfig);
                }
            }
        }
    );
});

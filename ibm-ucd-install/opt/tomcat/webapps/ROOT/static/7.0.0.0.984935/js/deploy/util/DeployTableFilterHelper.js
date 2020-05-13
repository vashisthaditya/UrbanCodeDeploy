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
        "dojo/request"
        ],
function(
        declare,
        request
) {
    return declare([], {

        /**
         * Given a parameter name and a UUID value, generate a positive matching
         * DeployTableFilter.
         */
        generateUUIDFilter: function(name, value) {
            return {
                name: name,
                values: value,
                type: "EQ",
                className: "UUID"
            };
        },

        /**
         * Given a parameter name and an array of UUIDs, generate a positive
         * membership DeployTableFilter.
         */
        generateUUIDInFilter: function(name, values) {
            return {
                name: name,
                values: values,
                type: "IN",
                className: "UUID"
            };
        },

        /**
         * Given a list of filters, generate a map of query parameters to be
         * passed to a DeployTableFilter backend.
         */
        generateQueryParams: function(filters) {
            var result = {
                filterFields: []
            };

            filters.forEach(function(filter) {
                result.filterFields.push(filter.name);

                result["filterValue_"+filter.name] = filter.values;
                result["filterType_"+filter.name] = filter.type;
                result["filterClass_"+filter.name] = filter.className;
            });

            return result;
        }
    });
});
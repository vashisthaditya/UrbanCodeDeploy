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
/*global define, _*/

define([
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/request",
        "dojo/string",
        "deploy/util/DeployTableFilterHelper"
        ],
function(
        declare,
        lang,
        request,
        string,
        DeployTableFilterHelper
) {
    return declare([], {

        environmentUrl: "/rest/deploy/environment",
        allPropertiesUrl: "/rest/deploy/environment/allProperties",
        environmentPropDefsUrlTemplate: "/rest/deploy/application/${applicationId}/environmentPropDefs",
        csvUrlTemplate: "/rest/deploy/application/${applicationId}/environmentComparisonCSV",

        /**
         * Given some key-value pairs in the following format, generate filters suitable for DeployTableFilter
         *
         * {
         *   ids: [<uuid1>, <uuid2>],
         *   applicationId: <uuid3>
         * }
         */
        generateEnvironmentDeployTableFilters: function(environmentFilters) {
            var filters = [];
            if (_.has(environmentFilters, "ids")) {
                filters.push(new DeployTableFilterHelper().generateUUIDInFilter(
                    "id", environmentFilters.ids));
            }

            if (_.has(environmentFilters, "applicationId")) {
                filters.push(new DeployTableFilterHelper().generateUUIDFilter(
                    "application.id", environmentFilters.applicationId));
            }
            return filters;
        },

        /**
         * Given some key-value pairs (see generateDeployTableFilters for format) and a
         * DeployTableFilter output type, return a Dojo request for a list of environments.
         */
        getEnvironments: function(environmentFilters, outputType) {
            var deployTableFilters = this.generateEnvironmentDeployTableFilters(environmentFilters);
            var query = new DeployTableFilterHelper().generateQueryParams(deployTableFilters);

            if (!outputType) {
                outputType = "BASIC";
            }
            query.outputType = outputType;
            query.orderField = "order";
            return this._normalizedRequest(this.environmentUrl, { query: query });
        },

        /**
         * Given a filter { environmentIds: [<UUID>, <UUID>(, ...)] }, returns
         * a dojo request for all environment Properties.
         */
        getAllProperties: function(allPropertiesFilters) {
            var query = this.generateAllPropertiesQuery(allPropertiesFilters);

            return this._normalizedRequest(this.allPropertiesUrl, { query: query });
        },

        /**
         * AllProperties needs a series of id="<UUID>" parameters.  This
         * generates a query string fulfilling that.
         */
        generateAllPropertiesQuery: function(filters) {
            return filters.environmentIds
                .map(function(id) { return "id=" + id; })
                .join("&");
        },

        /**
         * Generates the url to get all component environment propdefs for an
         * application.
         */
        getEnvironmentPropDefsUrl: function(applicationId) {
            return string.substitute(this.environmentPropDefsUrlTemplate, {applicationId:applicationId});
        },

        /**
         * Given an application id, returns a Dojo request for all component
         * environment property definitions.
         */
        getEnvironmentPropDefs: function(applicationId) {
            return this._normalizedRequest(this.getEnvironmentPropDefsUrl(applicationId));
        },

        generateCsvHref: function(applicationId, environmentFilter) {
            var selectedEnvironmentsArg = "";
            environmentFilter.environmentIds.forEach(function(id){
                if (selectedEnvironmentsArg.length > 0) {
                    selectedEnvironmentsArg += "&id=" + id;
                } else {
                    selectedEnvironmentsArg += "id=" + id;
                }
            });
            return string.substitute(this.csvUrlTemplate, {applicationId:applicationId}) +
                "?" + selectedEnvironmentsArg;
        },




        /**
         * Makes a dojo request, normalized with json handling and corresponding error handling
         */
        _normalizedRequest: function(url, additionalOptions) {
            var options = {handleAs: "json"};
            lang.mixin(options, additionalOptions);
            return request(url, options).then(
                undefined,
                function(err) {
                    // Dojo complains that it's not JSON. Throw the actual error.
                    if (err && err.response && err.response.text) {
                        throw err.response.text;
                    }
                    throw err;
                }
            );
        }
    });
});
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
        "dojo/_base/lang",
        "dojo/_base/declare"
        ],
function(
        lang,
        declare
) {
    /**
     * Configuration for the MultiEnvironmentConfigComparison.  This object has
     * weakly enforced immutability, and relies on developers not to mess with
     * that desired immutability.
     *
     *    applicationId: ID of the encompassing application.
     *
     *    referenceEnvironmentId: ID for the environment against which all other
     *                            environments will be measured.
     *
     *    environmentIds: IDs for the environments to be compared against the
     *                    referenceEnvironment.
     *
     */
    return declare([], {
        MAX_ALLOWED_ENVIRONMENTS: 40,

        constructor: function(args) {
            if (args === undefined) {
                args = {};
            }

            this._applicationId = args.applicationId;
            this._referenceEnvironmentId = args.referenceEnvironmentId;
            this._environmentIds = args.environmentIds;

            // This is clearly not perfect immutability, but it should help
            // serve as a signpost for future devs.
            Object.freeze(this);
        },

        getApplicationId: function() {
            return this._applicationId;
        },

        getReferenceEnvironmentId: function() {
            return this._referenceEnvironmentId;
        },

        /**
         * Returns a defensive copy of the environment ids
         */
        getEnvironmentIds: function() {
            return this._environmentIds.slice();
        },

        /**
         * An environment comparison config is actionable if we have an
         * application, reference environment and at least one other
         * environment.
         */
        isActionable: function() {
            return (!!this._applicationId) &&
                   (!!this._referenceEnvironmentId) &&
                   (this._environmentIds.length > 0) &&
                   (this._environmentIds.length + 1 <= 40);
        }
    });
});

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
/*global define, _ */

define([
        "dojo/_base/declare",
        "dojo/Evented",
        "dojo/promise/all",
        "deploy/widgets/multiEnvironmentComparison/MultiEnvironmentConfigComparisonConfig"
        ],
function(
        declare,
        Evented,
        all,
        MultiEnvironmentConfigComparisonConfig
) {
    return declare('deploy.widgets.multiEnvironmentComparison.MultiEnvironmentConfigComparisonDataManager',  [Evented], {
        constructor: function(args) {
            this._config = args.config || new MultiEnvironmentConfigComparisonConfig({
                applicationId: args.application.id
            });
            this._dataClient = args.dataClient;
            this._application = args.application;

            this._emptyData();
        },

        /**
         * Resets the fetched data to nothing.
         */
        _emptyData: function() {
            this._referenceEnvironment = null;
            this._environments = [];
            this._propData = {};
        },

        /**
         * Returns whether or not the manager has fetched data or not.
         */
        isAllPropertyDataReady: function() {
            return !!this._allPropertyDataCall && this._allPropertyDataCall.isFulfilled();
        },

        isEnvironmentListDataReady:function() {
            return !!this._environmentListDataCall && this._environmentListDataCall.isFulfilled();
        },

        getConfig: function() {
            return this._config;
        },

        setConfig: function(config) {
            this._config = config;
            this.emit("configChanged");
        },

        getReferenceEnvironment: function() {
            if (!this.isEnvironmentListDataReady()) {
                throw "Environment List Data not ready";
            }
            return this._referenceEnvironment;
        },

        areThereAnyProperties: function() {
            var result = false;
            if (this.isAllPropertyDataReady()){
                this._propDefData.forEach(function(propDefSheet){
                    if (propDefSheet.propDefs.length > 0){
                        result = true;
                    }
                });
            }
            return result;
        },

        getOtherEnvironments: function() {
            if (!this.isEnvironmentListDataReady()) {
                throw "Environment List Data not ready";
            }
            return this._environments;
        },

        getAllEnvironments: function() {
            if (!this.isEnvironmentListDataReady()) {
                throw "Environment List Data not ready";
            }
            return this._allEnvironments;
        },

        getPropSheetDefs: function() {
            if (!this.isAllPropertyDataReady()) {
                throw "All Property Data not ready";
            }
            return this._propDefData;
        },

        /**
         * Given one of the pseudo-PropDef structures we created and an
         * environment structure, return back the property that exists at the
         * intersection.
         *
         * We expect the property data (this._propData) to have the structure:
         *   <environmentId>/"componentProperties"/<componentId>
         *
         */
        getProperty: function(propDef, environment) {
            if (!this.isAllPropertyDataReady()) {
                throw "All Property Data not ready!";
            }

            var result;
            var environmentPropSheets = this._propData[environment.id];
            if (propDef.componentId) {
                var componentPropSheet = environmentPropSheets.componentProperties[propDef.componentId];
                var componentProperty = _.find(componentPropSheet, function(prop) {
                    return prop.name === propDef.name;
                });
                result = componentProperty;

            } else if (propDef.environmentTemplateId) {
                var templatePropSheet = environmentPropSheets
                    .environmentTemplateProperties[propDef.environmentTemplateId];

                var templateProperty = _.find(templatePropSheet, function(prop) {
                    return prop.name === propDef.name;
                });
                result = templateProperty;

            } else {
                var propSheet = environmentPropSheets.environmentProperties;
                var property = _.find(propSheet, function(prop) {
                    return prop.name === propDef.name;
                });
                result = property;
            }

            if (!result) {
                result = {};
            }
            return result;
        },

        initEnvironmentListData: function() {
            var applicationId = this._application.id;
            if (this._environmentListDataCall){
                return this._environmentListDataCall;
            }
            this._environmentListDataCall = this._dataClient.getEnvironments({"applicationId":applicationId});

            this._environmentListDataCall.then(
                function (results){
                    this._allEnvironments = results;
                    this.emit("environmentListDataAvailable");
                }.bind(this),
                function(err) {
                    this._emptyData();
                    this.emit("environmentListDataError", err);
                }.bind(this)
            );

            this.emit("environmentListDataLoading");
            return this._environmentListDataCall;
        },

        /**
         * Triggers a series of REST calls, and returns a promise that fulfills
         * when all calls are successful or when any one call has failed.
         */
        refreshData: function() {
            if (!!this._allPropertyDataCall && !this._allPropertyDataCall.isFulfilled()) {
                return this._allPropertyDataCall;
            }

            if (!this._config.isActionable()) {
                throw "Provided config object is not actionable";
            }

            var relevantEnvironmentIds = this._config.getEnvironmentIds();
            relevantEnvironmentIds.push(this._config.getReferenceEnvironmentId());

            // Now start the three underlying REST calls.

            // This may not trigger an actual REST call if the underlying promise already exists.
            var environmentsCall = this.initEnvironmentListData().then(function(environments) {
                var refId = this._config.getReferenceEnvironmentId();
                var comparisonIds = this._config.getEnvironmentIds();

                this._allEnvironments = environments;

                // Separate the reference environment from the rest.
                this._referenceEnvironment = environments.filter(function(env) { return env.id === refId; })[0];

                this._environments = [];
                comparisonIds.forEach(function(id){
                    var fullEnv = _.find(environments, function(env) {return id === env.id; });
                    this._environments.push(fullEnv);
                }.bind(this));
                return this._environments;
            }.bind(this));

            var propertiesCall = this._dataClient.getAllProperties({ "environmentIds":relevantEnvironmentIds })
                .then(function(propData) {
                    this._propData = propData;
                    return propData;
                }.bind(this));

            var propDefsCall = this._dataClient.getEnvironmentPropDefs(this._config.getApplicationId())
                .then(function(propSheetDefs) {
                    return this.augmentPropDefInfoAndAddEnvProps(propSheetDefs, propertiesCall);
                }.bind(this))
                .then(function(augmentedPropSheetDefs) {
                    this._propDefData = augmentedPropSheetDefs;
                    return augmentedPropSheetDefs;
                }.bind(this));

            // Collect the three calls into a single promise.
            this._allPropertyDataCall = all([ environmentsCall, propDefsCall, propertiesCall ]);

            this._allPropertyDataCall
                .then(
                    function() {
                        this.emit("allPropertyDataAvailable");
                    }.bind(this),
                    function(err) {
                        this._emptyData();
                        this.emit("allPropertyDataError", err);
                    }.bind(this)
                );

            this.emit("allPropertyDataLoading");

            return this._allPropertyDataCall;
        },

        /**
         * Returns a link to a CSV version of the data.  Orders environment
         * parameters in the order they are selected, and with the reference environment first.
         */
        getCsvDataLink:function() {
            var environmentIds = this._config.getEnvironmentIds();
            environmentIds.splice(0, 0, this._config.getReferenceEnvironmentId());
            var result = this._dataClient.generateCsvHref(this._config.getApplicationId(), {"environmentIds": environmentIds});
            return result;
        },

        /**
         * returns a promise for a collection of propSheetDefs augmented with
         * ad-hoc environment properties.  In this way, the UI can treat ad-hoc
         * environment properties as just another PropSheetDef.
         */
        augmentPropDefInfoAndAddEnvProps: function(propSheetDefs, propertiesCall) {
            var completePropSheetDefs = [];
            propSheetDefs.forEach(function(propSheetDef) {

                // Attach source object ID to it's propdef
                propSheetDef.propDefs.forEach(function(propDef) {
                    propDef.propSheetDefId = propSheetDef.id;
                    propDef.componentId = propSheetDef.componentId;
                    propDef.environmentTemplateId = propSheetDef.environmentTemplateId;
                });

                // Put environment templates at the front of the line
                if (propSheetDef.componentId){
                    completePropSheetDefs.push(propSheetDef);
                } else if (propSheetDef.environmentTemplateId){
                    completePropSheetDefs.splice(0, 0, propSheetDef);
                }
            });

            // We return a promise because we depend on the property data promise.
            return propertiesCall.then(function(propertyData) {
                var adHocPropSheetDef = this.generatePseudoPropDefSheetForEnvProps(propertyData);
                completePropSheetDefs.splice(0, 0, adHocPropSheetDef);
                return completePropSheetDefs;
            }.bind(this));
        },

        _addPseudoPropDefToSheet: function(pseudoPropDefSheet, property) {
            var pseudoPropDef = {
                name: property.name,
                required: false,
                description: property.description
            };

            pseudoPropDefSheet.propDefs.push(pseudoPropDef);
        },

        /**
         * Generates a psuedo-prop sheet for ad-hoc environment properties.
         */
        generatePseudoPropDefSheetForEnvProps: function(environmentProperties) {
            var pseudoPropDefSheet = {propDefs: []};
            var envPropNameSet = {};

            _.values(environmentProperties).forEach(function(environment) {
                _.values(environment.environmentProperties).forEach(function(property) {
                    if(!_.has(envPropNameSet, property.name)) {
                        this._addPseudoPropDefToSheet(pseudoPropDefSheet, property);
                        envPropNameSet[property.name] = true;
                    }
                }, this);
            }, this);
            return pseudoPropDefSheet;
        }
    });
});
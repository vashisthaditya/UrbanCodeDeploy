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
        "dojo/query",
        "dojo/store/Memory",
        "dojo/store/Observable",
        "deploy/widgets/application/wizard/AppWizProperty",
        "deploy/widgets/application/wizard/AppWizEnvironment"
        ],
function(
        declare,
        query,
        Memory,
        Observable,
        AppWizProperty,
        AppWizEnvironment
) {
    /**
     * Environment page model helper
     */
    return declare([], {

        constructor: function(sharedData) {
            this.sharedData = sharedData;
            this.sequenceNum = -1;
        },

        //precreate as many environments as environment templates
        precreateEnvironments: function() {
            var self = this;
            this.sharedData.environmentTemplates.query().forEach(function(envTemp) {
                self.addEnvironment(envTemp, false);
            });
            var envs = this.sharedData.environments.query();
            if (envs && envs.length > 0) {
                envs[0].set("selected", true);
            }
        },

        addEnvironment: function(tmpl, selected) {
            if (!tmpl) {
                tmpl = this._getFirstEnvironmentTmpl();
            }

            var numEnvironmentsForTemplate = this.sharedData.environments.query({template: tmpl}).length + 1;
            var env = new AppWizEnvironment(this._getEnvironmentUniqId(),
                                            tmpl,
                                            selected);

            env.set("name", env.get("name") + " " + numEnvironmentsForTemplate.toString());
            this.sharedData.environments.put(env);
        },

        cloneEnvironment: function(selectedEnv, selected) {
            var env = new AppWizEnvironment(this._getEnvironmentUniqId(),
                                            selectedEnv.template,
                                            selected);
            env.set("name", selectedEnv.get("name") + " copy");
            env.set("description", selectedEnv.get("description"));
            env.set("props", this.cloneProps(selectedEnv.get("props")));
            this.sharedData.environments.put(env);
        },

        cloneProps: function(appWizProp) {
            var props;

            props = new Observable(new Memory({
                data: appWizProp.query().map(function(prop) {
                    return new AppWizProperty(prop.propDef, prop.currentValue);
                })
            }));

            return props;
        },

        removeEnvironment: function(env) {
            this.sharedData.environments.remove(env.get("uniqId"));
        },

        _getFirstEnvironmentTmpl: function() {
            return this.sharedData.environmentTemplates.query()[0];
        },

        _getEnvironmentUniqId: function() {
            this.sequenceNum += 1;
            return this.sequenceNum;
        }
    });
});

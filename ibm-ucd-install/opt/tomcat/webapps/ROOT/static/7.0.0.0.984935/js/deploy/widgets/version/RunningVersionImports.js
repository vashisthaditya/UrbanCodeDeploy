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
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dojo/_base/declare",
        "deploy/widgets/component/ComponentSourceConfigHistory"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        ComponentSourceConfigHistory
) {
    /**
     *
     */
    return declare('deploy.widgets.version.RunningVersionImports',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="runningVerisonImports">'+
            '    <div data-dojo-attach-point="runningIntegrationAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.showRunningIntegrations();
        },

        /**
         *
         */
        showRunningIntegrations: function() {
            this.compSourceHistory = ComponentSourceConfigHistory({
                gridRestUrl: bootstrap.restUrl+"sourceConfigExecutionRecord/table/all",
                tableConfigKey: "allRunningSourceConfigs",
                showComponentField: true,
                oldestFirst: true
            });
            this.compSourceHistory.placeAt(this.runningIntegrationAttach);
        }
    });
});

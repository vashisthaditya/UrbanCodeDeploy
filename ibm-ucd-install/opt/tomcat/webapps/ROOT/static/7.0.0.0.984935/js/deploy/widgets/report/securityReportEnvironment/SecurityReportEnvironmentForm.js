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
        "dojo/_base/declare"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare
) {
    /**
     *
     */
    return declare('deploy.widgets.report.securityReportEnvironment.SecurityReportEnvironmentForm',  [_Widget, _TemplatedMixin], {
        templateString: '<div></div>',
        constructor: function() {
            var t = this;
        },

        buildRendering: function() {
            this.inherited(arguments);

            var t = this;

        },

        destroy: function() {
            var t = this;
            this.inherited(arguments);
        },

        setProperties: function(/* Array*/ properties) {
            var t = this;
        },

        getProperties: function() {
            var t = this;
            return [];
        }
    });
});
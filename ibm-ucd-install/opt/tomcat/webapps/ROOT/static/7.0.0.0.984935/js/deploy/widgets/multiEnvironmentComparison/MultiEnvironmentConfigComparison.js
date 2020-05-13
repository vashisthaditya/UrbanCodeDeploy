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
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dojo/_base/declare",
        "deploy/widgets/multiEnvironmentComparison/MultiEnvironmentComparisonClient",
        "deploy/widgets/multiEnvironmentComparison/MultiEnvironmentConfigComparisonConfig",
        "deploy/widgets/multiEnvironmentComparison/MultiEnvironmentConfigComparisonDataManager",
        "deploy/widgets/multiEnvironmentComparison/MultiEnvironmentConfigComparisonFilter",
        "deploy/widgets/multiEnvironmentComparison/MultiEnvironmentConfigComparisonGrid",
        "js/webext/widgets/Alert"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        MultiEnvironmentComparisonClient,
        MultiEnvironmentConfigComparisonConfig,
        MultiEnvironmentConfigComparisonDataManager,
        MultiEnvironmentConfigComparisonFilter,
        MultiEnvironmentConfigComparisonGrid,
        Alert
) {
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="multiEnvironmentConfigComparison">' +
                '<div class="preamble clearfix">' +
                    '<div style="float:left;">' +
                        '<div>' +
                        i18n("Select two or more environments to compare the environment properties between them.") +
                        '<br>' +
                        '</div>' +
                        '<div data-dojo-attach-point="filterAttach"></div>' +
                    '</div>' +
                    '<div style="float:right;" data-dojo-attach-point="legendAttach"></div>' +
                '</div>' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',

        postCreate: function() {
            this.inherited(arguments);

            this.dataClient = new MultiEnvironmentComparisonClient();
            this.dataManager = new MultiEnvironmentConfigComparisonDataManager({
                application: appState.application,
                dataClient: this.dataClient
            });

            this.dataManager.on("configChanged", this.dataManager.refreshData.bind(this.dataManager));
            this.dataManager.on("initDataError, refreshedDataError", this.handleError.bind(this));

            this.gridWidget = new MultiEnvironmentConfigComparisonGrid({
                dataManager: this.dataManager
            });
            this.gridWidget.placeAt(this.gridAttach);

            this.filterWidget = new MultiEnvironmentConfigComparisonFilter({
                dataManager: this.dataManager
            });
            this.filterWidget.placeAt(this.filterAttach);

            this.gridWidget.createLegendWidget().placeAt(this.legendAttach);

            this.dataManager.initEnvironmentListData();
        },

        handleError: function(errorText) {
            if (errorText) {
                var alert = new Alert({
                    message: util.escape(errorText)
                });
            }
        }
    });
});

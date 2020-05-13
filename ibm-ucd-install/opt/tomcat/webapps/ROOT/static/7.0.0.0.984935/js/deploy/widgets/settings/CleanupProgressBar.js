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
define([
        "dojo/_base/declare",
        "js/webext/widgets/ProgressBar",
        "deploy/util/TimeUtil"
        ],
  function(
        declare,
        ProgressBar,
        TimeUtil
  ) {

    return declare(
        [ProgressBar],
        {
            _cleanupCountCommonTitle: i18n("Daily Deployment History Cleanup in Progress") + "  -  ",
            _cleanupRecordsRemovedTitle:  i18n("deployment records removed."),
            _cleanupTotalRecordsTitle: i18n('total historical deployment records.'),

            postCreate: function() {
                this.inherited(arguments);
                this.setLabel(i18n("Daily Deployment History Cleanup in Progress"));
                this.setProgressDetailsLabel(i18n("deployment records removed"));
            },

            updateCleanupProgress: function(deletedRecordsCount, totalRecordsCount, timeLeftToCleanup) {

                var progressDetailsTimeInfo = TimeUtil.formatToHrsAndMinsString(timeLeftToCleanup);
                if (progressDetailsTimeInfo !== "" ) {
                    progressDetailsTimeInfo =  progressDetailsTimeInfo + " " + i18n("remaining");
                }

                if (this.showProgressDetailsTimeInfo) {
                    this.setProgressDetailsTimeInfo(progressDetailsTimeInfo);
                }

                this.setProgressCount(deletedRecordsCount);
                this.setTitleForProgressCount(this._cleanupCountCommonTitle + deletedRecordsCount + " " +
                    this._cleanupRecordsRemovedTitle + " " + progressDetailsTimeInfo);
                this.setTotalCount(totalRecordsCount);
                this.setTitleForTotalCount(this._cleanupCountCommonTitle + totalRecordsCount + " " +
                    this._cleanupTotalRecordsTitle + " " + progressDetailsTimeInfo);
                this.setProgressPercent(((deletedRecordsCount * 100) / totalRecordsCount));

            },

            updateProgress: function() {
                var self = this;
                this.getProgress("/rest/historyCleanupRecord/latest").then(
                    function(data){
                        if (data === null || data.dateCleanupFinished) {
                            self.hide();
                            return;
                        }
                        var timeCleanupAlreadyRan =
                            (new Date()).getTime() - data.dateCleanupStarted;
                        var timeLeftToCleanup =
                            data.historyCleanupDuration*60*60*1000 - timeCleanupAlreadyRan;
                        self.updateCleanupProgress(
                            data.deploymentsDeleted,
                            data.totalDeploymentsForCleanup,
                            timeLeftToCleanup);
                        self.show();
                    },
                    function(error) {
                        self.setCleanupError(error);
                    });
            },

            showProgress: function() {
                var self = this;
                this.updateProgress();
                this._cleanupProgressIntervalId = setInterval(
                    function() {
                        self.updateProgress();
                    },
                    30000);
            },

            destroy: function() {
                clearInterval(this._cleanupProgressIntervalId);
            }
        }
    );
});

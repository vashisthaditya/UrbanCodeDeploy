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
        "dojo/dom-style",
        "js/webext/widgets/ProgressBar"
        ],
  function(
        declare,
        domStyle,
        ProgressBar
  ) {

    return declare(
        [ProgressBar],
        {
            postCreate: function() {
                this.inherited(arguments);
                this.setProgressDetailsLabel(i18n("Drafts Created"));
            },

            updateDraftCreationProgress: function(upgraded, total, unupgraded) {
                this.setProgressCount(upgraded);
                this.setTotalCount(total);
                this.setTitleForTotalCount("Draft Process Creation in Progress");
                this.setProgressPercent(((upgraded * 100) / total));

            },

            updateProgress: function() {
                var self = this;
                this.getProgress("/rest/deploy/componentProcess/draftCreationProgress").then(
                    function(data){
                        if (data === null || data.complete) {
                            self.hide();
                            return;
                        }
                        self.updateDraftCreationProgress(
                            data.upgraded,
                            data.total,
                            data.unupgraded);
                        self.show();
                    },
                    function(error) {
                        self.setCleanupError(error);
                    }
                );
            },
        
            showProgress: function() {
                var self = this;
                this.updateProgress();
                this._draftCreationProgressIntervalId = setInterval(
                    function() {
                        self.updateProgress();
                    },
                    30000);
            },

            destroy: function() {
                clearInterval(this._draftCreationProgressIntervalId);
            }
        }
    );
});
        
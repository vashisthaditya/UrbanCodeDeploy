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
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dojo/_base/xhr",
        "dojo/_base/declare",
        "dojo/_base/fx",
        "dojo/dom-construct",
        "dojo/dom-style",
        "dojo/dom-attr",
        "dojo/Deferred"
        ],
  function(
        _TemplatedMixin,
        _Widget,
        xhr,
        declare,
        fx,
        domConstruct,
        domStyle,
        domAttr,
        Deferred
  ) {

    return declare(
        [_Widget, _TemplatedMixin],
        {
            templateString:
                '<div class="webext progressBar" data-dojo-attach-point="progressBar">' +
                    '<div class="caption"> ' +
                        '<span data-dojo-attach-point="label" class="label"> </span>' +
                        '<span data-dojo-attach-point="progressDetailsProgressCount" class="progressDetailsProgressCount"> </span>' + "&nbsp" +
                        '<span data-dojo-attach-point="progressDetailsOutOfLabel" class="progressDetailsOutOfLabel"> </span>' + "&nbsp" +
                        '<span data-dojo-attach-point="progressDetailsTotalCount" class="progressDetailsTotalCount"> </span>' + "&nbsp" +
                        '<span data-dojo-attach-point="progressDetailsLabel" class="progressDetailsLabel"> </span>' +
                        '<span data-dojo-attach-point="progressDetailsTimeInfo" class="progressDetailsTimeInfo"> </span>' +
                    '</div>' +
                    '<div data-dojo-attach-point="progressIndicator" class="progressIndicator">' +
                       '<div data-dojo-attach-point="progressIndicatorFill" class="progressIndicatorFill"> </div>' +
                    '</div>' +
                '</div>',

            showProgressDetailsTimeInfo : true,

            postCreate: function() {
                this.inherited(arguments);
                this.progressDetailsOutOfLabel.innerHTML = i18n("of");
            },

            setProgressDetailsLabel: function(progressDetailsLabel) {
                this.progressDetailsLabel.innerHTML =  progressDetailsLabel;
            },

            setProgressDetailsTimeInfo: function(progressDetailsTimeInfo) {
                this.progressDetailsTimeInfo.innerHTML =  progressDetailsTimeInfo;
            },

            setProgressCount: function(progressCount) {
                this.progressDetailsProgressCount.innerHTML =  progressCount;
            },

            setTitleForProgressCount: function(progressCountTitle) {
                domAttr.set(
                    this.progressIndicatorFill,
                    'title',
                    progressCountTitle);
            },

            setTotalCount: function(totalCount) {
                this.progressDetailsTotalCount.innerHTML =  totalCount;
            },

            setTitleForTotalCount: function(progressInfoTitle) {
                domAttr.set(
                    this.progressIndicator,
                    'title',
                    progressInfoTitle);
            },

            setProgressPercent: function(progressPercentage) {
                domStyle.set(
                     this.progressIndicatorFill,
                     'width',
                     progressPercentage + '%');
            },

            setCleanupError: function(error) {
                //do nothing for now
            },

            setLabel: function(label) {
                this.label.innerHTML = label;
            },

            show : function(){
                fx.fadeIn({
                    node: this.progressBar,
                    duration: 2000
                }).play();
            },

            hide : function(){
                fx.fadeOut({
                    node: this.progressBar,
                    duration: 2000
                }).play();
            },

            disableProgressDetailsTimeInfo: function(disable){
                if (disable) {
                    this.showProgressDetailsTimeInfo = false;
                }
                else {
                    this.showProgressDetailsTimeInfo = true;
                }
            },

            getProgress: function(url) {
                var deferred = new Deferred();
                xhr.get({
                    url: url,
                    handleAs: "json",
                    load: function(data) {
                        deferred.resolve(data);
                    },
                    error: function(error) {
                        deferred.reject(error);
                    }
                });
               return deferred;
            }
        }
    );
});

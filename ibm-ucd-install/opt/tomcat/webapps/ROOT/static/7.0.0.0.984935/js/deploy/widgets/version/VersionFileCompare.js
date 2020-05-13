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
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/RestSelect",
        "deploy/widgets/component/ComponentFileComparison",
        "dojo/_base/array",
        "dojo/_base/xhr",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/DeferredList",
        "dojo/dom-style",
        "dojo/on",
        "dojo/window",
        "deploy/widgets/log/Blocker",
        "js/util/blocker/_BlockerMixin",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/Pager"
        ],
function(
        declare,
        ColumnForm,
        RestSelect,
        ComponentFileComparison,
        Array,
        xhr,
        domClass,
        domConstruct,
        DeferredList,
        domStyle,
        on,
        win,
        Blocker,
        _BlockerMixin,
        Dialog,
        Pager
) {
    /**
     *
     */
    return declare([Dialog], {
        autoRefresh: true,

        lines: null,
        linesOfInterest: null,

        pagerControls: null,

        logText: null, // log-text div
        headerContainer: null,

        /**
        *
        */
        postCreate: function() {
            this.inherited(arguments);
            this.compareDialog = new Dialog({
                title: i18n("File Differences"),
                closable: true,
                heightPercent: 75,
                widthPercent: 75,
                destroyOnHide: true
            });
            domClass.add(this.compareDialog.containerNode, "versionFileCompare");
        },

        /**
        *
        */
        show: function () {
            var t = this;
            t.compContainer = domConstruct.create("div", {"class":"compContainer"}, t.compareDialog.containerNode);
            t.titleContainer = domConstruct.create("div", {"class": "titleContainer", "innerHTML": "<div></div><br>"}, t.compContainer);
            var title1 = domConstruct.create("div", {"class": "title", "innerHTML": t.version1.escape()}, t.titleContainer);
            var titleSpace = domConstruct.create("div", {"class": "titleSpacer", "style": {"width": "2%", display: "inline-block"}}, t.titleContainer);
            var title2 = domConstruct.create("div", {"class": "title", "innerHTML": t.version2.escape()}, t.titleContainer);

            t.showCompText();
            t.compareDialog.show();
        },

       /**
        * Fetch the updated log content from the server.
        *
        */
        showCompText: function() {
            var t = this;

            var colorChange = false;
            if (t.data !== undefined) {
                t.onData(t.data);
            }
            else {
                var loadText = xhr.get({
                    url: t.url,
                    handleAs: "json",
                    load: function(data) {
                        t.onData(data);
                    }
                });
            }
        },

        onData: function(data) {
           var t = this;

           // the div that both comparison panes will sit in
           var comparedLinesContainer = domConstruct.create("div", {
               "class" : "comparedLinesContainer"
           }, t.compContainer);

           // the div that the line count column and div for the original file will sit in
           var originalLineContainer = domConstruct.create("div", {
               "class": "originalLineContainer"
           }, comparedLinesContainer);

           // divs for original text:
           var originalLineCountContainer = domConstruct.create("div", {
               "class":"lineCountContainer"
           }, originalLineContainer);
           var overflowContainer = domConstruct.create("div", {
               "class": "overflowContainer"
           }, originalLineContainer);
           var originalLines = domConstruct.create("div", {
               "class": "originalLines"
           }, overflowContainer);

           // the div that the line count column and div for the changed file will sit in
           var changedLineContainer = domConstruct.create("div", {
               "class": "changedLineContainer"
           }, comparedLinesContainer);

           // divs for changed text:
           var changedLineCountContainer = domConstruct.create("div", {
               "class":"lineCountContainer"
           }, changedLineContainer);
           var changeOverflowContainer = domConstruct.create("div", {
               "class": "overflowContainer"
           }, changedLineContainer);
           var changedLines = domConstruct.create("div", {
               "class": "changedLines"
           }, changeOverflowContainer);

           Array.forEach(data, function (item) {
               if (item.space) {
                   var ellipsisContainer = domConstruct.create(
                       "div", {"class": "ellipsisContainer"
                   }, comparedLinesContainer);
                   domConstruct.create("div", {"class": "leftEll", "innerHTML": "..."}, ellipsisContainer);
                   domConstruct.create("div", {"class": "rightEll", "innerHTML": "..."}, ellipsisContainer);

               // construct new divs for the comparisons and line counts
               originalLineContainer = domConstruct.create("div", {
                   "class": "originalLineContainer"
               }, comparedLinesContainer);
               originalLineCountContainer = domConstruct.create("div", {
                   "class":"lineCountContainer"
               }, originalLineContainer);
               overflowContainer = domConstruct.create("div", {"class": "overflowContainer"}, originalLineContainer);
               originalLines = domConstruct.create("div", {"class": "originalLines"}, overflowContainer);

               changedLineContainer = domConstruct.create("div", {
                   "class": "changedLineContainer"
               }, comparedLinesContainer);
               changedLineCountContainer = domConstruct.create("div", {
                   "class":"lineCountContainer"
               }, changedLineContainer);
               overflowContainer = domConstruct.create("div", {"class": "overflowContainer"}, changedLineContainer);
               changedLines = domConstruct.create("div", {"class": "changedLines"}, overflowContainer);
               }
               else if (item.truncated && !t.truncatedNotifaction) {
                  t.truncatedNotifaction = domConstruct.create("div", {
                      "class" : "truncatedNotification"
                  }, comparedLinesContainer);
                  t.truncatedNotifaction.innerHTML = item.message;
               }
               else {
                   var originalLineCount = domConstruct.create("div", {
                       "class": "lineCountRow"
                   }, originalLineCountContainer);
                   if (item.originalLineNumber >= 0) {
                        originalLineCount.innerHTML = item.originalLineNumber;
                   }

                   // create the line
                   var original = domConstruct.create("div", {"class": "original"}, originalLines);

                   if (item.original) {
                        original.innerHTML = item.original.escape();
                   } else {
                        original.innerHTML = " ";
                   }

                   var changeLineCount = domConstruct.create("div", {
                       "class": "lineCountRow"
                   }, changedLineCountContainer);
                   if (item.changeLineNumber >= 0) {
                        changeLineCount.innerHTML = item.changeLineNumber;
                   }

                   var change = domConstruct.create("div", {"class": "change"}, changedLines);
                   if (item.change) {
                        change.innerHTML = item.change.escape();
                   } else {
                        change.innerHTML = " ";
                   }
                   if (item.type === "CHANGE") {
                       original.style.backgroundColor = "#FFFCDC";
                       change.style.backgroundColor = "#FFFCDC";
                   }
                   else if (item.type === "INSERT") {
                       change.style.backgroundColor = "#F0FFD2";
                   }
                   else if (item.type === "DELETE") {
                       original.style.backgroundColor = "#FFEEEE";
                   }
               }
           });
       },

       /**
       *
       */
        hide: function() {
            this.inherited(arguments);
            if (this.refreshTimer) {
                clearTimeout(this.refreshTimer);
            }
            this.compareDialog.destroy();
        }
    });
});

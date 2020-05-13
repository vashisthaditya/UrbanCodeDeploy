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
/*global define, window */

define([
        "dijit/_Widget",
        "dijit/form/Button",
        "dojo/DeferredList",
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/dom-style",
        "dojo/on",
        "dojo/window",
        "dojox/html/entities",
        "deploy/widgets/log/Blocker",
        "js/util/blocker/_BlockerMixin",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/Pager"
        ],
function(
        _Widget,
        Button,
        DeferredList,
        array,
        declare,
        xhr,
        domClass,
        domConstruct,
        domStyle,
        on,
        win,
        entities,
        Blocker,
        _BlockerMixin,
        Dialog,
        Pager
) {
    /**
     * a stub for a blocker element
     */
    /**
     *
     */
    return declare('deploy.widgets.log.LiveLogViewer',  [_BlockerMixin, _Widget, Dialog], {
        autoRefresh: true,

        lines: null, // log text line array
        linesOfInterest: null,

        pagerControls: null,

        logText: null, // log-text div
        headerContainer: null,
        linesContainer: null, // line-number div
        displayedLines: 0, // index of the last currently-rendered line
        downloadButtonName: "Download Log",
        completedUrl: null,
        isLogFinished: false,

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            this.lines = [];
            this.linesOfInterest = {};
            this.displayedLines = 0;

            // create a liner for css positioning and loading mask
            this.dialogLinerWidget = new Blocker();
            this.dialogLiner = this.dialogLinerWidget.domNode;
            domClass.add(this.dialogLiner, "log-viewer-dialog");
            if (this.header) {
                this.header.placeAt(this.containerNode);
            }
            if (this.paddingTop) {
                this.containerNode.style.paddingTop = this.paddingTop;
            }
            this.dialogLinerWidget.placeAt(this.containerNode);
        },

        /**
         *
         */
        show: function() {
            var t = this;

            // resize dialog to 75% of the window
            var box = win.getBox();
            var initialWidth = box.w*0.75;
            var initialHeight = (box.h*0.75) - 70;
            domStyle.set(t.dialogLiner, {
                "minHeight":initialHeight+"px",
                "minWidth":initialWidth+"px"
            });

            // structure for content
            var logContainer = domConstruct.create("div", {"class":"logContainer"}, t.dialogLiner);
            t.linesContainer = domConstruct.create("div", {"class":"linesContainer"}, logContainer);
            t.logText = domConstruct.create("div", {"class":"logText"}, logContainer);

            // footer area
            var logFooter = domConstruct.create("div", {"class":"logButtons"}, t.dialogLiner);

            var button = new Button({
                label: i18n(this.downloadButtonName),
                showTitle: false,
                onClick: function() { t.downloadLog(); }
            });
            button.placeAt(logFooter);

            t.pagerControls = new Pager({
                totalItems: 0,
                startItem:  0,
                itemsPerPage: 1000,
                totalPages: 0
            });
            t.pagerControls.placeAt(logFooter);

            // detect pager page changes
            on(t.pagerControls, "pageChange", function(){
                t.updateLogText();
            });

            // invoke initial load and display blocking mask
            t.showLogText();
            t.dialogLinerWidget.block();

            this.inherited(arguments);
        },

        /**
         * Initiate a download of the raw log file contents
         */
        downloadLog: function() {
            util.downloadFile(this.url + "?fileDownload=true");
        },

        /**
         * Fetch the updated log content from the server.
         *
         */
        showLogText: function() {
            var t = this;

            var asyncOps = [];

            // handle Lines Of Interest
            if (t.propsUrl) {
                var loadLOI = xhr.get({
                    url: t.propsUrl,
                    handleAs:"json",
                    load: function(data) {
                        t.linesOfInterest={};
                        if (data && data.outputProps) {
                            var linesOfInterestString =  util.getNamedPropertyValue(data.outputProps, "LOI");
                            if (linesOfInterestString) {
                                array.forEach(linesOfInterestString.split(','), function(lineNumber) {
                                    t.linesOfInterest[lineNumber] = true;
                                });
                            }
                        }
                    }
                });
                asyncOps.push(loadLOI);
            }
            else {
                t.linesOfInterest= {};
            }


            if (t.completedUrl) {
                var loadCompletionInfo = xhr.get({
                    url: t.completedUrl,
                    handleAs:"json",
                    load: function(data) {
                        if (!!data.completed) {
                            t.completionData = true;
                        }
                    }
                });
            }

            // handle log content
            var loadText = xhr.get({
                url: t.url,
                load: function(data) {
                    t.lines = data.split(/\r\n|\r|\n/);

                    t.pagerControls.setTotalItems(t.lines.length);
                }
            });
            asyncOps.push(loadText);

            var completeDeferred = new DeferredList(asyncOps);
            completeDeferred.addBoth(function(){
                t.updateLogText();
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
        },

        /**
         * Render the log content for the current page.
         */
        updateLogText: function() {
            var t = this;
            var oldScrollTop = t.logText.scrollTop;

            // TODO tailing mode -
            //   detect if view is scrolled to last line of the last page
            //   when tailing keep, force to stay scrolled to last line of last page

            // redisplay the last line in case it was previously incomplete
            if (t.displayedLines > 0) {
                t.displayedLines--;
                t.logText.removeChild(t.logText.lastChild);
                t.linesContainer.removeChild(t.linesContainer.lastChild);
            }

            // display any new lines
            var startLine = t.pagerControls.startItem;
            var linesPerPage = t.pagerControls.itemsPerPage;
            var endLine = startLine + linesPerPage - 1;

            // if last displayed line is not on current page, throw out lines and start from startLine
            if (t.displayedLines < startLine || t.displayedLines > endLine) {
                domConstruct.empty(t.linesContainer);
                domConstruct.empty(t.logText);
                t.displayedLines = Math.max(startLine - 1, 0);
            }

            var linesHtml = [t.linesContainer.innerHTML];
            var logTextHtml = [t.logText.innerHTML];

            for (t; t.displayedLines < Math.min(endLine, t.lines.length); t.displayedLines++) {
                var lineNumber = t.displayedLines+1;
                var lineOfInterest = t.linesOfInterest[lineNumber];
                var lineInnerHTML = " "; //ensure content is allocated some space

                if (t.lines[t.displayedLines] && t.lines[t.displayedLines] !== "") {
                    lineInnerHTML = t.lines[t.displayedLines];
                }

                lineInnerHTML = t._escapeXml(lineInnerHTML);

                var cssClass = "monospace";
                if (lineOfInterest) {
                    cssClass += " log-viewer-line-of-interest";
                }

                linesHtml.push(t._createDivStringWithInnerHtml(cssClass, lineNumber));
                logTextHtml.push(t._createDivStringWithInnerHtml(cssClass, lineInnerHTML));
            }
            t.linesContainer.innerHTML = linesHtml.join('');
            t.logText.innerHTML = logTextHtml.join('');

            // prevent internal scroll-bars, logContainer is responsible for all scrolling
            domStyle.set(t.logText, "height", t.logText.scrollHeight);

            // preserve the scrolling offset as pixels from top
            setTimeout(function() {
                t.logText.scrollTop = oldScrollTop;
            }, 1);

            if (t.autoRefresh) {
                // daisy-chain invocation the next auto-refresh
                if (!t.refreshTimer) {
                    if (!t.isLogFinished) {
                        t.refreshTimer = setTimeout(function() {
                            t.refreshTimer = null;
                            t.showLogText();
                        }, 5000);
                    }
                }
                if (t.completionData) {
                    t.isLogFinished = true;
                }
            }

            // remove the blocking mask if present
            t.dialogLinerWidget.unblock();
        },

        _escapeXml: function (value){
            // encode all html entities and use nbsp
            return entities.encode(value).replace(" ", "&nbsp;");
        },

        _createDivStringWithInnerHtml: function(classNames, innerHTML) {
            var divHtml = "<div class='"+classNames+"'>"+innerHTML+"</div>";
            return divHtml;
        }
    });
});

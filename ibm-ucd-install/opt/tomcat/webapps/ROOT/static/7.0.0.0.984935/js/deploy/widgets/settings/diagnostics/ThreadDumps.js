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
        "dijit/_Widget",
        "dijit/_TemplatedMixin",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/on",
        "dojo/_base/xhr",
        "dijit/form/Button",
        "deploy/widgets/Formatters",
        "deploy/widgets/log/LiveLogViewer"
        ],
function(
        declare,
        _Widget,
        _TemplatedMixin,
        domClass,
        domConstruct,
        on,
        xhr,
        Button,
        Formatters,
        LiveLogViewer
) {
    
/**
 *
 */
    return declare('deploy.widgets.settings.diagnostics.ThreadDumps', [_Widget, _TemplatedMixin],
        {
            templateString: 
                '<div class="requestList">' +
                    '<div class="listTopButtons" data-dojo-attach-point="buttonTopAttach"></div>' +
                    '<div data-dojo-attach-point="gridAttach"></div>' +
                '</div>',
    
            /**
             *
             */
            postCreate: function() {
                this.inherited(arguments);
                var self = this;

                var newThreadDumpButton = {
                    label: i18n("Generate Thread Dump"),
                    showTitle: false,
                    onClick: function() {
                        self.showThreadDumpWindow(bootstrap.restUrl+"system/configuration/threadDump", i18n("Java Thread Dump"));
                    }
                };

                var threadDumpButton = new Button(newThreadDumpButton);
                domClass.add(threadDumpButton.domNode, "idxButtonSpecial");
                threadDumpButton.placeAt(this.buttonTopAttach);

                var downloadLink = util.createDownloadAnchor({
                    href: bootstrap.restUrl + "system/configuration/threadDump?fileDownload=true",
                    className: "thread-dump-download-link"
                }, this.buttonTopAttach);
                downloadLink.innerHTML= i18n("(Download)");
            },

            showThreadDumpWindow: function(url, title) {
                var threadDumpViewer = new LiveLogViewer({
                    "url" : url,
                    "title" : title,
                    "autoRefresh" : false,
                    "downloadButtonName" : "Download Thread Dump"
                });
                threadDumpViewer.show();
            }
        }
    );
});

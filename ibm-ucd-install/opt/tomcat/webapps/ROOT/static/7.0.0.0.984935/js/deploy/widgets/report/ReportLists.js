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
        "dijit/Tooltip",
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dijit/form/ToggleButton",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/dom-construct",
        "dojo/dom-style",
        "dojo/on",
        "dojox/html/entities",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/PopDown",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        Tooltip,
        _TemplatedMixin,
        _Widget,
        ToggleButton,
        declare,
        xhr,
        domConstruct,
        domStyle,
        on,
        entities,
        GenericConfirm,
        PopDown,
        Table
) {
    /**
     *
     */
    return declare('deploy.widgets.report.ReportLists',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="report-definition-list noPrint">' +
                '<div data-dojo-attach-point="headingSectionAttach"></div>' +
            '</div>',

        reportRestUrlBase: null,
        reportHashBase: null,
        hasReport: false,

        headingSectionAttach: null,

        myRecentReportsTable: null, // Table.js of user's recently run reports
        myReportsTable: null,       // Table.js of current user's reports
        sharedReportsTable: null,   // Table.js of available reports

        recentReportsButton: null,
        myReportsButton: null,
        sharedReportsButton: null,

        constructor: function(/* Object*/ args) {
            if (!args.reportRestUrlBase) {
                this.reportRestUrlBase = bootstrap.restUrl + "report/";
            }
            this.reportHashBase = 'reports/';
        },

        /**
         *
         */
        getButtons: function() {
            var t = this;
            var result = {
                'recentReportsButton': t.recentReportsButton,
                'myReportsButton': t.myReportsButton,
                'sharedReportsButton': t.sharedReportsButton
            };
            return result;
        },

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var t = this;

            // TODO make this into css styling
            var stylePopDown = function (popDown) {
                domStyle.set(popDown, {"margin-bottom": "0.5em"});
                domStyle.set(popDown.domAttach, {
                    "padding":"0.5em 1em",
                    "border": "1px gray solid"
                });
                domStyle.set(popDown.headerAttach, {
                    "font-size":"14px",
                    "background-size": "14px, auto",
                    "padding-left": "16px"
                });
            };

            // column formats for tables
            var nameColumn = {
                    name: i18n("Report Name"),
                    field: "name",
                    orderField: "name",
                    filterField: "name",
                    filterType:"text",
                    getRawValue: function(item) {
                        return item.name;
                    },
                    formatter: function(item) {
                        var itemNameHTML = entities.encode(item.name);
                        var link = domConstruct.create("a", {
                            "href": "#"+t.getHashForReport(item),
                            "innerHTML":itemNameHTML
                        });
                        var toolTip = new Tooltip({
                            connectId: link,
                            label: entities.encode(item.description || "<none>")
                         });
                        return link;
                    }
                };
            var descColumn = { name: i18n("Description"), field: "description" };
            var typeColumn = { name: i18n("Type"), field:"type"};
            var sharedColumn = { name: i18n("Shared"), field: "shared" };
            var ownerColumn = { name: i18n("Owner"), field: "owner" };
            var createdColumn = { name: i18n("Created"), field: "created", orderField: "created",
                    getRawValue: function(item) {
                        return item.created;
                    },
                    formatter: function(item){
                        return item.created && util.dateFormatShort(item.created);
                    }
            };
            var actionsColumn = { name: i18n("Actions"), formatter: function(item) {
                var result = domConstruct.create("span");
                var del = domConstruct.create("a", {"class":"linkPointer", "innerHTML":i18n("Delete")}, result);
                on(del, "click", function(event){ t.deleteReport(item); });
                return result;
              }
            };

            // Buttons
            var recentReportsLabel = t.hasReport ? i18n("Recent Reports") : "<b>"+i18n("Recent Reports")+"</b>";
            t.recentReportsButton = new ToggleButton({
                label: recentReportsLabel,
                checked: !t.hasReport
            });
            t.recentReportsButton.placeAt(t.headingSectionAttach);

            t.myReportsButton = new ToggleButton({
                label: i18n("My Reports")
            });
            t.myReportsButton.placeAt(t.headingSectionAttach);

            t.sharedReportsButton = new ToggleButton({
                label: i18n("Shared Reports")
            });
            t.sharedReportsButton.placeAt(t.headingSectionAttach);


            // recent reports section
            var recentlyRunReportsSection = new PopDown({
                "collapsed": t.hasReport
                //"label": "Recently Run Reports"
            });
            stylePopDown(recentlyRunReportsSection);
            recentlyRunReportsSection.placeAt(t.headingSectionAttach);
            this.myRecentReportsTable = new Table({
                url:  t.reportRestUrlBase+"recent",
                serverSideProcessing:false,
                columns: [nameColumn, descColumn, typeColumn, sharedColumn, ownerColumn, createdColumn],
                noDataMessage: i18n("No recent reports found."),
                orderField: null,
                hideExpandCollapse: true,
                hidePagination: true
            });
            domConstruct.create("div",{"class":"innerContainerLabel", "innerHTML":i18n("Recent Reports")}, recentlyRunReportsSection.domAttach);
            this.myRecentReportsTable.placeAt(recentlyRunReportsSection.domAttach);

            // my reports section
            var myReportsSection = new PopDown({
                "collapsed": true
            });
            stylePopDown(myReportsSection);
            myReportsSection.placeAt(t.headingSectionAttach);
            this.myReportsTable = new Table({
                url: t.reportRestUrlBase + "mine",
                serverSideProcessing:false,
                columns: [nameColumn, descColumn, typeColumn, sharedColumn, createdColumn, actionsColumn],
                noDataMessage:i18n("No shared reports found."),
                orderField:"name",
                hideExpandCollapse: true,
                hidePagination: true
            });
            domConstruct.create("div",{"class":"innerContainerLabel", "innerHTML":i18n("My Reports")}, myReportsSection.domAttach);
            this.myReportsTable.placeAt(myReportsSection.domAttach);

            // shared report section
            var sharedReportsSection = new PopDown({
                "collapsed": true
            });
            stylePopDown(sharedReportsSection);
            sharedReportsSection.placeAt(t.headingSectionAttach);
            this.sharedReportsTable = new Table({
                url: t.reportRestUrlBase +"shared",
                serverSideProcessing:false,
                columns: [nameColumn, descColumn, typeColumn, ownerColumn, createdColumn],
                noDataMessage:i18n("No shared reports found."),
                orderField:"name",
                hideExpandCollapse: true,
                hidePagination: true
            });
            domConstruct.create("div",{"class":"innerContainerLabel", "innerHTML":i18n("Shared Reports")}, sharedReportsSection.domAttach);
            this.sharedReportsTable.placeAt(sharedReportsSection.domAttach);

            t.recentReportsButton.onChange = function() {
                var t = this;
                recentlyRunReportsSection.toggle();

                if (t.get("checked")) {
                    t.set('label', "<b>"+i18n("Recent Reports")+"</b>");

                } else {
                    t.set('label', i18n("Recent Reports"));
                }
            };

            t.myReportsButton.onChange = function() {
                var t = this;
                myReportsSection.toggle();

                if (t.get("checked")) {
                    t.set('label', "<b>"+i18n("My Reports")+"</b>");

                } else {
                    t.set('label', i18n("My Reports"));
                }
            };


            t.sharedReportsButton.onChange = function() {
                var t = this;
                sharedReportsSection.toggle();

                if (t.get("checked")) {
                    t.set('label', "<b>"+i18n("Shared Reports")+"</b>");

                } else {
                    t.set('label', i18n("Shared Reports"));
                }
            };


        },

        getHashForReport: function(report) {
            var t = this;
            var reportType = report.type;
            var result;
            if (report.shared) {
                result = t.reportHashBase +"shared/" + report.name;
            }
            else {
                result = t.reportHashBase + report.name;
            }
                
            return result;
        },

        /**
         *
         */
        destroy: function() {
            this.inherited(arguments);
            this.myRecentReportsTable.destroy();
            this.myReportsTable.destroy();
            this.sharedReportsTable.destroy();
            this.recentReportsButton.destroy();
            this.myReportsButton.destroy();
            this.sharedReportsButton.destroy();

        },

        actionsFormatter : function(item) {
            var a = document.createElement("a");
            a.href="#applicationProcessRequest/" + item.applicationRequestId;
            a.innerHTML = i18n("View Request");
            return a;
        },

        deleteReport: function(item) {
            var t = this;

            var itemNameHTML = entities.encode(item.name);
            var confirm = new GenericConfirm({
                "message": i18n("Are you sure you wish to delete %s?", itemNameHTML),
                "action": function() {
                    xhr.del({
                        "url": t.reportRestUrlBase + item.name,
                        "sync": true,
                        "load": function() {
                            // reload table data, change page if currently on "item"?
                            t.refresh();
                        }
                    });
                }
            });
        },

        refresh: function() {
            this.myRecentReportsTable.refresh();
            this.myReportsTable.refresh();
            this.sharedReportsTable.refresh();
        }
    });
});
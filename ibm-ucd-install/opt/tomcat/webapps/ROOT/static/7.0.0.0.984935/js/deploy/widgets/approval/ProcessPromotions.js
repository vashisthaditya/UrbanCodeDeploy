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
        "dojo/_base/xhr",
        "dojo/dom-construct",
        "dojo/on",
        "js/webext/widgets/table/TreeTable",
        "js/webext/widgets/Alert"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        xhr,
        domConstruct,
        on,
        TreeTable,
        Alert
) {
    /**
     *
     */
    return declare('deploy.widgets.approval.ProcessPromotions',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="tasksForUser">' +
                '<div data-dojo-attach-point="promotionTaskGridAttach"></div>' +
            '</div>',

        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            var gridRestUrl = bootstrap.restUrl + "processPromotion/requested";
            var gridLayout = [{
                name: i18n("Component/Template"),
                formatter: function(item) {
                    var result = document.createElement("div");
                    var componentLink = document.createElement("a");
                    if (item.draftProcess.component) {
                        componentLink.href = "#component/" + item.draftProcess.component.id;
                        componentLink.innerHTML = util.escape(item.draftProcess.component.name);
                    }
                    else if (item.draftProcess.componentTemplate) {
                        componentLink.href = "#componentTemplate/" +
                            item.draftProcess.componentTemplate.id + "/-1";
                        componentLink.innerHTML = util.escape(item.draftProcess.componentTemplate.name);
                    }
                    result.appendChild(componentLink);
                    return result;
                }
            },{
                name: i18n("Existing Process"),
                formatter: function(item) {
                    var result = document.createElement("div");
                    var processLink = document.createElement("a");
                    processLink.href = "#componentProcess/" + item.draftProcess.id + "/-1";
                    processLink.innerHTML = util.escape(item.draftProcess.name);
                    result.appendChild(processLink);
                    return result;
                }
            },{
                name: i18n("Proposed Changes"),
                formatter: function(item) {
                    var result = document.createElement("div");
                    var processLink = document.createElement("a");
                    processLink.href = "#draftComponentProcess/" + item.draftProcess.id +
                        "/" + item.draftProcess.version;
                    processLink.innerHTML = i18n("Draft Process v. %s", item.draftProcess.version);
                    result.appendChild(processLink);
                    return result;
                }
            },{
                name: i18n("Requester"),
                field: "requestUser"
            },{
                name: i18n("Request Date"),
                field: "dateRequested",
                formatter: util.tableDateFormatter
            },{
                name: i18n("Comments"),
                field: "comment"
            },{
                name: i18n("Actions"),
                formatter: this.promotionApproveRejectFormatter,
                parentWidget: this
            }];

            this.grid = new TreeTable({
                url: gridRestUrl,
                noDataMessage: i18n("No draft processes awaiting promotion."),
                orderField: "dateRequested",
                sortType: "desc",
                hidePagination: false,
                hideExpandCollapse: true,
                serverSideProcessing: false,
                columns: gridLayout
            });
            this.grid.parentWidget = this;
            this.grid.placeAt(this.promotionTaskGridAttach);
        },

        respondToPromoteRequest: function(item, responseUrl) {
            var self = this;

            self.grid.block();
            xhr.put({
                url: responseUrl,
                handleAs: "json",
                load: function() {
                    self.grid.unblock();
                    self.grid.refresh();
                },
                error: function(data) {
                    self.grid.unblock();
                    var errorAlert = new Alert({
                        message: util.escape(data.responseText)
                    });
                }
            });
        },

        promotionApproveRejectFormatter: function(item) {
            var self = this;

            var result = document.createElement("div");

            var approveLink = document.createElement("a");
            approveLink.innerHTML = i18n("Approve");
            approveLink.className = "actionsLink linkPointer";
            result.appendChild(approveLink);
            on(approveLink, "click", function() {
                self.parentWidget.respondToPromoteRequest(item, bootstrap.restUrl + "processPromotion/" + item.id + "/approve");
            });

            var rejectLink = document.createElement("a");
            rejectLink.innerHTML = i18n("Reject");
            rejectLink.className = "actionsLink linkPointer";
            result.appendChild(rejectLink);
            on(rejectLink, "click", function() {
                self.parentWidget.respondToPromoteRequest(item, bootstrap.restUrl + "processPromotion/" + item.id + "/reject");
            });

            return result;
        }
    });
});
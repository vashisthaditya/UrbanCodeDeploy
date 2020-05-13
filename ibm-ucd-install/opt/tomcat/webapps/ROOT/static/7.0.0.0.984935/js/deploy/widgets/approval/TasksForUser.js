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
        "dojo/dom-construct",
        "dojo/on",
        "deploy/widgets/approval/TaskResponseDialog",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        domConstruct,
        on,
        TaskResponseDialog,
        TreeTable
) {
    /**
     *
     */
    return declare('deploy.widgets.approval.TasksForUser',  [_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="tasksForUser">' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            var gridRestUrl = bootstrap.restUrl+"approval/task/tasksForUser";
            var gridLayout = [{
                name: i18n("Name"),
                field: "name",
                filterField: "name",
                filterType: "text",
                orderField: "name",
                getRawValue: function(item) {
                    return item.name;
                }
            },{
                name: i18n("Started"),
                field: "startDate",
                formatter: util.tableDateFormatter,
                orderField: "dateStarted",
                getRawValue: function(item) {
                    return new Date(item.startDate);
                }
            },{
                name: i18n("Description"),
                orderField: "description",
                filterField: "description",
                filterType: "text",
                formatter: this.descriptionFormatter,
                getRawValue: function(item) {
                    return self.getDescriptionFromRow(item);
                }
            },{
                name: i18n("Requester"),
                formatter: this.requestedByFormatter
            },{
                name: i18n("Snapshot/Version"),
                formatter: this.versionFormatter
            },{
                name: i18n("Environment/Resource"),
                formatter: this.destinationFormatter
            },{
                name: i18n("Target"),
                formatter: this.targetFormatter
            },{
                name: i18n("Actions"),
                formatter: this.actionsFormatter,
                parentWidget: this
            }];

            this.grid = new TreeTable({
                serverSideProcessing: false,
                url: gridRestUrl,
                noDataMessage: i18n("No work items found."),
                tableConfigKey: "tasksForUser",
                orderField: "dateStarted",
                sortType: "desc",
                columns: gridLayout,
                hidePagination: false,
                hideExpandCollapse: true
            });
            this.grid.parentWidget = this;
            this.grid.placeAt(this.gridAttach);
        },

        /**
         *
         */
        requestedByFormatter: function(item) {
            var result = document.createElement("div");

            if (item.applicationProcessRequest) {
                result.innerHTML = item.applicationProcessRequest.userName ? item.applicationProcessRequest.userName.escape() : "";
            }
            else if (item.componentProcessRequest) {
                result.innerHTML = item.componentProcessRequest.userName ? item.componentProcessRequest.userName.escape() : "";
            }
            return result;
        },

        /**
         * 
         */
        getDescriptionFromRow: function(item) {
            var result = "";
            if (item.applicationProcessRequest) {
                result = item.applicationProcessRequest.description ? item.applicationProcessRequest.description.escape() : "";
            }
            else if (item.componentProcessRequest) {
                result = item.componentProcessRequest.description ? item.componentProcessRequest.description.escape() : "";
            }
            return result;
        },
        
        /**
         * 
         */
        descriptionFormatter: function(item) {
            var result = document.createElement("div");
            
            if (item.applicationProcessRequest) {
                result.innerHTML = item.applicationProcessRequest.description ? item.applicationProcessRequest.description.escape() : "";
            }
            else if (item.componentProcessRequest) {
                result.innerHTML = item.componentProcessRequest.description ? item.componentProcessRequest.description.escape() : "";
            }

            return result;
        },
        
        /**
         * 
         */
        versionFormatter: function(item) {
            var result = document.createElement("div");

            if (item.applicationProcessRequest) {
                if (item.applicationProcessRequest.snapshot) {
                    var snapshotLink = document.createElement("a");
                    snapshotLink.href = "#snapshot/" + item.applicationProcessRequest.snapshot.id;
                    snapshotLink.innerHTML = item.applicationProcessRequest.snapshot.name.escape();
                    result.appendChild(snapshotLink);
                }
            }
            else if (item.componentProcessRequest) {
                if (item.componentProcessRequest.version) {
                    var versionLink = document.createElement("a");
                    versionLink.href = "#version/" + item.componentProcessRequest.version.id;
                    versionLink.innerHTML = item.componentProcessRequest.version.name.escape();
                    result.appendChild(versionLink);
                }
            }
            return result;
        },
        
        /**
         * 
         */
        destinationFormatter: function(item) {
            var result = document.createElement("div");

            if (item.applicationProcessRequest) {
                var environmentLink = document.createElement("a");
                environmentLink.href = "#environment/" + item.applicationProcessRequest.environment.id;
                environmentLink.innerHTML = item.applicationProcessRequest.environment.name.escape();
                result.appendChild(environmentLink);
            }
            else if (item.componentProcessRequest) {
                var resourceLink = document.createElement("a");
                resourceLink.href = "#resource/" + item.componentProcessRequest.resource.id;
                resourceLink.innerHTML = item.componentProcessRequest.resource.name.escape();
                result.appendChild(resourceLink);
            }
            return result;
        },
        
        /**
         * 
         */
        targetFormatter: function(item) {
            var result = document.createElement("div");

            if (item.type === "approval") {
                switch (item.approvalType) {
                    case "APPLICATION":
                        var applicationLink = document.createElement("a");
                        applicationLink.href = "#application/"+item.application.id;
                        applicationLink.innerHTML = item.application.name.escape();
                        result.appendChild(applicationLink);
                        break;
                    case "EACH_COMPONENT":
                        var componentLink = document.createElement("a");
                        componentLink.href = "#component/"+item.component.id;
                        componentLink.innerHTML = item.component.name.escape();
                        result.appendChild(componentLink);
                        break;
                    case "ENVIRONMENT":
                        var environmentLink = document.createElement("a");
                        environmentLink.href = "#environment/"+item.environment.id;
                        environmentLink.innerHTML = item.environment.name.escape();
                        result.appendChild(environmentLink);
                        break;
                }
            }
            else if (item.type === "componentTask") {
                if (item.applicationProcessRequest) {
                    var requestLink = document.createElement("a");
                    requestLink.href = "#applicationProcessRequest/"+item.applicationProcessRequest.id;
                    requestLink.innerHTML = i18n("Application Process Request");
                    result.appendChild(requestLink);
                }
                else if (item.componentProcessRequest) {
                    var compRequestLink = document.createElement("a");
                    compRequestLink.href = "#componentProcessRequest/"+item.componentProcessRequest.id;
                    compRequestLink.innerHTML = i18n("Component Process Request");
                    result.appendChild(compRequestLink);
                }
            }
            else if (item.type === "applicationTask") {
                var appRequestLink = document.createElement("a");
                appRequestLink.href = "#applicationProcessRequest/"+item.applicationProcessRequest.id;
                appRequestLink.innerHTML = i18n("Application Process Request");
                result.appendChild(appRequestLink);
            }
            
            return result;
        },
        
        /**
         * 
         */
        actionsFormatter: function(item) {
            var self = this.parentWidget;
            
            var result = document.createElement("div");
            
            if (item.applicationProcessRequest) {
                var viewLink = document.createElement("a");
                viewLink.innerHTML = i18n("View Request");
                viewLink.className = "actionsLink";
                viewLink.href = "#applicationProcessRequest/"+item.applicationProcessRequest.id;
                result.appendChild(viewLink);
            }
            if (item.componentProcessRequest) {
                var compViewLink = document.createElement("a");
                compViewLink.innerHTML = i18n("View Request");
                compViewLink.className = "actionsLink";
                compViewLink.href = "#componentProcessRequest/"+item.componentProcessRequest.id;
                result.appendChild(compViewLink);
            }
            
            var respondLink = domConstruct.create("a", {
                "innerHTML": i18n("Respond"),
                "className": "linkPointer actionsLink"
            }, result);
            on(respondLink, "click", function() {
                self.showApprovalDialog(item);
            });
            
            return result;
        },
        
        /**
         * 
         */
        showApprovalDialog: function(item) {
            var self = this;
            
            var responseDialog = new TaskResponseDialog({
                task: item,
                callback: function() {
                    self.grid.block();
                    setTimeout(function() {
                        self.grid.unblock();
                        self.grid.refresh();
                    }, 1500);
                }
            });
        }
    });
});
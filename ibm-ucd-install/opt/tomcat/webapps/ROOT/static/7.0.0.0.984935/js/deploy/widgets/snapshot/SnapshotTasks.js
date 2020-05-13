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
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/on",
        "deploy/widgets/approval/TaskResponseDialog",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        domClass,
        domConstruct,
        on,
        TaskResponseDialog,
        Dialog,
        TreeTable
) {
    /**
     *
     */
    return declare('deploy.widgets.snapshot.SnapshotTasks',  [_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="snapshotTasks">' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            
            var gridRestUrl = bootstrap.restUrl+"deploy/snapshot/"+this.snapshot.id+"/tasks";
            var gridLayout = [{
                name: i18n("Name"),
                field: "name"
            },{
                name: i18n("Approval Process"),
                formatter: this.approvalProcessFormatter
            },{
                name: i18n("Target"),
                formatter: this.targetFormatter
            },{
                name: i18n("Status"),
                formatter: this.statusFormatter
            },{
                name: i18n("Completed By"),
                formatter: this.completedByFormatter
            },{
                name: i18n("Actions"),
                formatter: this.actionsFormatter,
                parentWidget: this
            }];

            this.grid = new TreeTable({
                serverSideProcessing: true,
                url: gridRestUrl,
                tableConfigKey: "snapshotTaskList",
                noDataMessage: i18n("No work items found."),
                columns: gridLayout
            });
            this.grid.parentWidget = this;
            this.grid.placeAt(this.gridAttach);
        },

        /**
         *
         */
        refresh: function() {
            this.grid.refresh();
        },
        
        /**
         *
         */
        approvalProcessFormatter: function(item) {
            var result = document.createElement("a");
            result.href = "#applicationProcessRequest/"+item.applicationProcessRequest.id;
            result.innerHTML = item.approval.name.escape();
            return result;
        },
        
        /**
         * 
         */
        targetFormatter: function(item) {
            var result = "";
            switch (item.approvalType) {
                case "APPLICATION":
                    result = document.createElement("a");
                    result.href = "#application/"+item.application.id;
                    result.innerHTML = item.application.name.escape();
                    break;
                case "EACH_COMPONENT":
                    result = document.createElement("a");
                    result.href = "#component/"+item.component.id;
                    result.innerHTML = item.component.name.escape();
                    break;
                case "ENVIRONMENT":
                    result = document.createElement("a");
                    result.href = "#environment/"+item.environment.id;
                    result.innerHTML = item.environment.name.escape();
                    break;
            }
            return result;
        },
        
        /**
         * 
         */
        statusFormatter: function(item, value, cell) {
            cell.style.textAlign = "center";
            var result = "";
            switch (item.status) {
                case "OPEN":
                    domClass.add(cell, "running-state-color");
                    result = i18n("Open");
                    break;
                case "CLOSED":
                    domClass.add(cell, "success-state-color");
                    result = i18n("Complete");
                    break;
                case "FAILED":
                    domClass.add(cell, "failed-state-color");
                    result = i18n("Failed");
                    break;
            }
            return result;
        },
        
        /**
         * 
         */
        completedByFormatter: function(item) {
            var result = "";
            if (item.completedBy) {
                result = item.completedBy;
                if (item.completedOn) {
                    result += " ("+util.dateFormatShort(item.completedOn)+")";
                }
            }
            return result;
        },

        /**
         * 
         */
        actionsFormatter: function(item) {
            var self = this.parentWidget;
            
            var result = document.createElement("div");
            
            if (item.userCanModify && item.status === "OPEN") {
                var respondLink = domConstruct.create("a", {
                    "innerHTML": i18n("Respond"),
                    "class": "linkPointer actionsLink"
                }, result);
                on(respondLink, "click", function() {
                    self.showApprovalDialog(item);
                });
            }
            
            else if (item.comment) {
                var commentDialogLink = domConstruct.create("a", {}, result);
                on(commentDialogLink, "click", function() {
                    var commentDialog = new Dialog();
                    
                    var commentDiv = document.createElement("div");
                    commentDiv.innerHTML = item.comment.escape();
                    commentDialog.containerNode.appendChild(commentDiv);
                    
                    var userDiv = document.createElement("div");
                    userDiv.innerHTML = " - "+item.completedBy.escape()+" ("+util.dateFormatShort(item.completedOn)+")";
                    userDiv.style.marginTop = "8px";
                    userDiv.style.marginLeft = "12px";
                    commentDialog.containerNode.appendChild(userDiv);

                    commentDialog.show();
                });

                var commentDialogImage = document.createElement("img");
                commentDialogImage.src = bootstrap.webextUrl+"images/webext/icons/icon_document_white.gif";
                commentDialogImage.title = i18n("Approval Log");
                commentDialogImage.style.margin = "0px 2px";
                commentDialogLink.appendChild(commentDialogImage);
                
                result.appendChild(commentDialogLink);
            }

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
                        
                        if (self.onTaskClose !== undefined) {
                            self.onTaskClose();
                        }
                    }, 1500);
                }
            });
        }
    });
});

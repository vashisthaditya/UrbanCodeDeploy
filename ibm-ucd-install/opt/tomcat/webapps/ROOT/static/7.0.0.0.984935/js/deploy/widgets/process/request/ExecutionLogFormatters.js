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
        "exports",
        "dijit/form/Button",
        "dijit/_Widget",
        "dijit/_TemplatedMixin",
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/on",
        "deploy/widgets/Popup",
        "deploy/widgets/approval/TaskResponseDialog",
        "deploy/widgets/log/LiveLogViewer",
        "deploy/widgets/patterns/PatternExecutionLogFormatters",
        "deploy/widgets/process/ProcessIconsFormatter",
        "deploy/widgets/resource/TransientResourceCompareTree",
        "js/webext/widgets/Dialog",
        "deploy/util/ErrorUtil",
        "js/webext/widgets/table/TreeTable",
        "deploy/widgets/version/VersionFileCompare",
        "js/webext/widgets/FieldList"
        ],
function(
        exports,
        Button,
        _Widget,
        _TemplatedMixin,
        array,
        declare,
        xhr,
        domClass,
        domConstruct,
        on,
        Popup,
        TaskResponseDialog,
        LiveLogViewer,
        PatternExecutionLogFormatters,
        ProcessIconsFormatter,
        TransientResourceCompareTree,
        Dialog,
        ErrorUtil,
        TreeTable,
        VersionFileCompare,
        FieldList
) {
    /**
     *
     */
    exports.nameFormatter = function(activity, noLink) {
        var result = domConstruct.create("div");

        if (activity.graphPosition) {
            domConstruct.create("span", {
                innerHTML: activity.graphPosition+".&nbsp;"
            }, result);

            result.style.fontWeight = "bold";
        }

        if (activity.specialNameType === "agent") {
            result.appendChild(formatters.createIcon("agentIcon"));
            domConstruct.create("a", {
                "href": "#agent/"+activity.agent.id,
                "innerHTML": activity.agent.name.escape()
            }, result);
            util.appendTextSpan(result, "&nbsp;");
        }
        else if (activity.specialNameType === "tag") {
            result.appendChild(formatters.tagNameFormatter(activity.tag));
        }
        else if (activity.specialNameType === "resource") {
            // We're assuming that all resources targeted here will be for components...
            result.appendChild(formatters.createIcon("componentIcon"));
            var resourceDisplayName = activity.resource.path.replace(/\//g, " / ").escape();
            var popupContents = domConstruct.create("div", {
                innerHTML: resourceDisplayName
            });
            if (noLink){
                resourceDisplayName = activity.resource.name.replace(/\//g, " / ").escape();
            }
            domConstruct.create("a", {
                "href": "#resource/"+activity.resource.id,
                "innerHTML": resourceDisplayName
            }, result);

            if (noLink){
                var popup = new Popup({
                    attachPoint: result,
                    contents: popupContents
                });
            }
            util.appendTextSpan(result, "&nbsp;");
        }
        else if (activity.specialNameType === "componentProcess") {
            result.appendChild(formatters.createIcon("origProcessIcon"));

            var activityName = activity.componentProcess.name.escape();
            if (activity.displayName) {
                activityName = i18n("%s - %s", activity.displayName.escape(), activity.componentProcess.name.escape());
            }

            domConstruct.create("a", {
                "href": "#componentProcess/"+activity.componentProcess.id+"/"+activity.componentProcess.version,
                "innerHTML": activityName
            }, result);

            if (activity.component && activity.version) {
                util.appendTextSpan(result, "&nbsp;(");
                domConstruct.create("a", {
                    "href": "#version/"+activity.version.id,
                    "innerHTML": activity.component.name.escape()+" "+activity.version.name.escape()
                }, result);
                util.appendTextSpan(result, ")&nbsp;");
            }
            else if (activity.resource) {
                util.appendTextSpan(result, "&nbsp;(");
                domConstruct.create("a", {
                    "href": "#resource/"+activity.resource.id,
                    "innerHTML": activity.resource.path.replace(/\//g, " / ").escape()
                }, result);
                util.appendTextSpan(result, ")&nbsp;");
            }
        }
        else if (activity.specialNameType === "plugin") {
            var iconName = ProcessIconsFormatter.getIconForStep(activity, true);
            domConstruct.create("div", {
                className: "inline-block execution-log-process-icon process-icon " + iconName + "-step-icon"
            }, result);

            util.appendTextSpan(result, activity.name.escape()+"&nbsp;");
            if (activity.command) {
                var translatedPluginName = i18n(activity.command.plugin.name);
                var pluginVersion = "";
                if (activity.command.plugin.version === "#RELEASE_VERSION#") {
                    pluginVersion += activity.command.plugin.versionNumber;
                }
                else {
                    pluginVersion += activity.command.plugin.version;
                }
                var pluginLinkText = i18n("(%s v. %s)", util.escape(translatedPluginName), pluginVersion);

                var popupContent = domConstruct.create("div");

                domConstruct.create("a", {
                    "innerHTML": pluginLinkText,
                    "href": "#automationPlugin/"+activity.command.plugin.id,
                    className: "execution-log-process-link"
                }, noLink ? popupContent : result);

                if (noLink){
                    var pluginPopup = new Popup({
                        attachPoint: result,
                        contents: popupContent
                    });
                }
            }
        }
        else if (activity.patternActivity) {
            result = PatternExecutionLogFormatters.nameFormatter(result, activity, noLink);
        }
        else {
            if (activity.type){
                var processIconName = ProcessIconsFormatter.getIconForStep({activity: activity});
                domConstruct.create("div", {
                    className: "inline-block execution-log-process-icon process-icon " + processIconName + "-step-icon"
                }, result);
            }
            var displayName = activity.displayName;
            if (!displayName) {
                displayName = activity.name;
            }

            if (activity.name) {
                util.appendTextSpan(result, displayName.escape()+"&nbsp;");
            }
        }

        return result;
    };

    /**
     *
     */
    exports.roleFormatter = function(activity) {
        var result = i18n("");
        if (activity.role) {
            result = activity.role.name;
        }
        else if (activity.type !== "componentApprovalIterator") {
            result = i18n("Deleted Role");
        }
        return result;
    };

    /**
     *
     */
    exports.approvalTargetFormatter = function(activity) {
        var task = activity.task;

        var result = "";
        if (task) {
            if (task.environment) {
                result = domConstruct.create("a", {
                    innerHTML: task.environment.name.escape(),
                    href: "#environment/"+task.environment.id
                });
            }
            else if (task.application) {
                result = domConstruct.create("a", {
                    innerHTML: task.application.name.escape(),
                    href: "#application/"+task.application.id
                });
            }
            else if (task.component) {
                result = domConstruct.create("a", {
                    innerHTML: task.component.name.escape(),
                    href: "#component/"+task.component.id
                });
            }
        }
        return result;
    };

    /**
     *
     */
    exports.taskCompletedByFormatter = function(activity) {
        var task = activity.task;

        var result = "";
        if (task && task.completedBy) {
            result = task.completedBy;
            if (task.completedOn) {
                result += " ("+util.dateFormatShort(task.completedOn)+")";
            }
        }

        return result;
    };

    /**
     *
     */
    exports.statusFormatter = function(activity, activityStatusCell, activityExtraCell) {
        var cellContents = "";
        var status = activity.state;
        var result = activity.result;

        if (activity.failureCaught) {
            result = "FAULTED";
        }

        activityStatusCell.style.textAlign = "center";
        if (status === "CLOSED" && activity.notNeeded) {
            domClass.add(activityStatusCell, "gray-state-color");

            if (activity.notNeeded === "noResources") {
                cellContents = i18n("Not Mapped");
            }
            else if (activity.notNeeded === "noComponents") {
                cellContents = i18n("No Components Found");
            }
            else if (activity.notNeeded === "noVersionsSelected") {
                cellContents = i18n("No Version Selected");
            }
            else if (activity.notNeeded === "noVersionsNeeded") {
                cellContents = i18n("Already Installed");
            }
            else if (activity.notNeeded === "noConfigurationChanged") {
                cellContents = i18n("Configuration Not Changed");
            }
            else if (activity.notNeeded === "offline") {
                cellContents = i18n("Agent Offline");
            }
            else if (activity.notNeeded === "roleNotFound") {
                cellContents = i18n("Task Role Deleted");
            }
            else if (activity.notNeeded === "componentNotInApp") {
                cellContents = i18n("Component Not Found");
            }
            else if (activity.notNeeded === "componentProcessDeleted") {
                cellContents = i18n("Component Process Deleted");
            }
            else if (activity.notNeeded === "precondition") {
                cellContents = i18n("Precondition Failed");
            }
            else if (activity.notNeeded === "genericProcessDeleted") {
                cellContents = i18n("Generic Process Deleted");
            }
        }
        else if (status === "CLOSED" && result === "SUCCEEDED") {
            domClass.add(activityStatusCell, "success-state-color");
            cellContents = i18n("Success");
        }
        else if (status === "CLOSED" && result === "CANCELED") {
            domClass.add(activityStatusCell, "gray-state-color");
            cellContents = i18n("Canceled");
        }
        else if (status === "EXECUTING") {
            if (activity.paused) {
                domClass.add(activityStatusCell, "gray-state-color");
                cellContents = i18n("Paused");
            }
            else {
                domClass.add(activityStatusCell, "running-state-color");
                cellContents = i18n("Running");
            }
        }
        else if ((status === "CLOSED" && result === "FAULTED")
                || status === "FAULTING") {
            domClass.add(activityStatusCell, "failed-state-color");
            cellContents = i18n("Failed");
        }
        else if (status === "INITIALIZED") {
            domClass.add(activityStatusCell, "gray-state-color");
            cellContents = i18n("Not Started");
        }

        if (activity.task) {
            switch (activity.task.status) {
                case "OPEN":
                    domClass.add(activityStatusCell, "running-state-color");
                    cellContents = i18n("Open");
                    break;
                case "CLOSED":
                    domClass.add(activityStatusCell, "success-state-color");
                    cellContents = i18n("Complete");
                    break;
                case "FAILED":
                    domClass.add(activityStatusCell, "failed-state-color");
                    cellContents = i18n("Failed");
                    break;
                case "CANCELLED":
                    domClass.add(activityStatusCell, "gray-state-color");
                    cellContents = i18n("Cancelled");
                    break;
            }
        }

        return cellContents;
    };

    /**
     *
     */
    exports.actionsFormatter = function(activity) {
        var _this = this;
        var activityActionsCell = domConstruct.create("div");

        if (activity.componentProcessRequest) {
            var viewLink = document.createElement("a");
            viewLink.href = "#componentProcessRequest/"+activity.componentProcessRequest.id;
            viewLink.innerHTML = i18n("Details");
            activityActionsCell.appendChild(viewLink);
        }

        if (activity.fault) {
            var faultDialogLink = domConstruct.create("a", {"class":"linkPointer"});
            faultDialogLink.onclick = function() {
                var faultDialog = new Dialog();

                var messageDiv = document.createElement("div");
                if (activity.fault.message) {
                    messageDiv.innerHTML = util.escape(activity.fault.message);
                }
                else if (activity.fault.type) {
                    messageDiv.innerHTML = activity.fault.type;
                }
                faultDialog.containerNode.appendChild(messageDiv);

                if (activity.fault.trace) {
                    var button = new Button({
                        label: i18n("Full Details..."),
                        onClick: function() {
                            var i;
                            var line;
                            var debugDialog = new Dialog();
                            var debugInfoPre = document.createElement("div");
                            var lines = activity.fault.trace.split(/\r\n|\n|\r/);
                            for (i = 0; i < lines.length; i++) {
                                line = lines[i];
                                line = line.replace(/\&/, "&amp;");
                                line = line.replace(/>/, "&gt;");
                                line = line.replace(/</, "&lt;");
                                line = line.replace(/\t/, "&nbsp;&nbsp;&nbsp;&nbsp;");
                                line = line.replace(/ /, "&nbsp;");
                                line = "<div>" + line + "</div>";
                                lines[i] = line;
                            }
                            debugInfoPre.innerHTML = lines.join("");
                            debugDialog.containerNode.appendChild(debugInfoPre);
                            debugDialog.show();
                        }
                    });
                    button.placeAt(faultDialog.containerNode, "last");
                }

                faultDialog.show();
            };

            var faultDialogImage = document.createElement("img");
            faultDialogImage.src = bootstrap.webextUrl+"images/webext/icons/icon_document_red.gif";
            faultDialogImage.title = i18n("Error Log");
            faultDialogImage.style.margin = "0px 2px";
            faultDialogLink.appendChild(faultDialogImage);

            activityActionsCell.appendChild(faultDialogLink);
        }

        if (activity.task) {
            if (activity.task.status === "OPEN") {
                if (activity.task.userCanModify) {
                    var respondLink = domConstruct.create("a", {
                        "class": "linkPointer",
                        "innerHTML": i18n("Respond")
                    }, activityActionsCell);
                    on(respondLink, "click", function() {
                        _this.showApprovalDialog(activity.task);
                    });
                }
            }
            else if (activity.task.comment) {
                var task = activity.task;

                var commentDialogLink = domConstruct.create("a", {
                    "class": "linkPointer"
                }, activityActionsCell);
                on(commentDialogLink, "click", function() {
                    var commentDialog = new Dialog();

                    var commentDiv = document.createElement("div");
                    commentDiv.innerHTML = task.comment ? task.comment.escape() : "";
                    commentDialog.containerNode.appendChild(commentDiv);

                    var userDiv = document.createElement("div");
                    userDiv.innerHTML = "by "+util.escape(task.completedBy)+" on "+util.dateFormatShort(task.completedOn);
                    userDiv.style.marginTop = "8px";
                    userDiv.style.marginLeft = "12px";
                    commentDialog.containerNode.appendChild(userDiv);

                    commentDialog.show();
                });

                var commentDialogImage = document.createElement("img");
                commentDialogImage.src = bootstrap.webextUrl+"images/webext/icons/icon_document_white.gif";
                commentDialogImage.title = i18n("Comment");
                commentDialogImage.style.margin = "0px 2px";
                commentDialogLink.appendChild(commentDialogImage);
            }
            else if (activity.task.status === "CLOSED") {
                var completedSpan = document.createElement("span");
                completedSpan.innerHTML = i18n("Completed by %s", util.escape(activity.task.completedBy));
                activityActionsCell.appendChild(completedSpan);
            }
            else if (activity.task.status === "FAILED") {
                var failedSpan = document.createElement("span");
                failedSpan.innerHTML = i18n("Failed by %s", util.escape(activity.task.completedBy));
                activityActionsCell.appendChild(failedSpan);
            }
        }
        else if (activity.type === "plugin") {
            if (activity.state !== "INITIALIZED") {
                var headerDiv = new FieldList();
                domClass.add(headerDiv.domNode, "logHeader");
                var i = 0;
                headerDiv.insertDiv(i18n("Working Directory"), util.escape(activity.workingDir), i);
                i++;
                if (activity.username) {
                    headerDiv.insertDiv(i18n("Impersonation User"), util.escape(activity.username), i);
                    i++;
                }
                if (activity.password) {
                    headerDiv.insertDiv(i18n("Impersonation Password"), activity.password, i);
                    i++;
                }
                if (activity.group) {
                    headerDiv.insertDiv(i18n("Impersonation Group"), util.escape(activity.group), i);
                    i++;
                }
                if (activity.useSudo !== null && activity.useSudo !== undefined) {
                    headerDiv.insertDiv(i18n("Use Sudo"), activity.useSudo, i);
                    i++;
                }

                if (activity.exception) {
                    var exceptionLogLink = domConstruct.create("a", {
                        "class": "linkPointer"
                    }, activityActionsCell);
                    on(exceptionLogLink, "click", function() {
                        _this.showErrorDialog(activity);
                    });
                }
                else {
                    var outLogLink = domConstruct.create("a", {
                        "class": "linkPointer"
                    }, activityActionsCell);
                    on(outLogLink, "click", function() {
                        var logViewer = new LiveLogViewer({
                            url: bootstrap.restUrl + "logView/trace/" + activity.workflowTraceId +
                                "/" + activity.id + "/stdOut.txt",
                            propsUrl: bootstrap.restUrl + "workflow/" + activity.workflowTraceId +
                                "/" + activity.id + "/properties",
                            completedUrl: bootstrap.restUrl + "workflow/" +
                                activity.workflowTraceId + "/" + activity.id + "/completed",
                            title: i18n("Output Log"),
                            autoRefresh: activity.state === "EXECUTING",
                            header: headerDiv,
                            paddingTop: "0px"
                        });
                        logViewer.show();
                    });

                    var outLogImage = document.createElement("img");
                    outLogImage.src = bootstrap.imageUrl+"icons/icon_output.gif";
                    outLogImage.title = i18n("Output Log");
                    outLogImage.style.margin = "0px 2px";
                    outLogLink.appendChild(outLogImage);

                    var errLogLink;
                    if (activity.error) {
                        errLogLink = domConstruct.create("a", {
                            "class": "linkPointer"
                        }, activityActionsCell);
                        on(errLogLink, "click", function() {
                            _this.showErrorDialog(activity);
                        });
                    }
                    else {
                        errLogLink = domConstruct.create("a", {
                            "class": "linkPointer"
                        }, activityActionsCell);
                        on(errLogLink, "click", function() {
                            var logViewer = new LiveLogViewer({
                                url: bootstrap.restUrl+"logView/trace/"+activity.workflowTraceId+"/"+activity.id+"/log.txt",
                                completedUrl: bootstrap.restUrl + "workflow/" +
                                    activity.workflowTraceId + "/" + activity.id + "/completed",
                                title: i18n("Error Log"),
                                autoRefresh: activity.state === "EXECUTING"
                            });
                            logViewer.show();
                        });
                    }

                    var errLogImage = document.createElement("img");
                    errLogImage.src = bootstrap.webextUrl+"images/webext/icons/icon_document_red.gif";
                    errLogImage.title = i18n("Error Log");
                    errLogImage.style.margin = "0px 2px";
                    errLogLink.appendChild(errLogImage);

                    var propertiesDialogLink = domConstruct.create("a", {
                        "class": "linkPointer"
                    }, activityActionsCell);
                    on(propertiesDialogLink, "click", function() {
                        _this.showPropertiesDialog(activity);
                    });

                    var propertiesDialogImage = document.createElement("img");
                    propertiesDialogImage.src = bootstrap.webextUrl+"images/webext/icons/icon_document_white.gif";
                    propertiesDialogImage.title = i18n("Input/Output Properties");
                    propertiesDialogImage.style.margin = "0px 2px";
                    propertiesDialogLink.appendChild(propertiesDialogImage);
                }

                if(activity.detailsLink) {
                    var viewPluginDetailsLink = document.createElement("a");
                    viewPluginDetailsLink.href = activity.detailsLink;
                    viewPluginDetailsLink.innerHTML = i18n("Details");
                    activityActionsCell.appendChild(viewPluginDetailsLink);
                }
            }
        }
        else if (activity.type === "switch") {
            if (activity.state !== "INITIALIZED") {
                var switchDialogLink = domConstruct.create("a", {
                    "class": "linkPointer"
                }, activityActionsCell);
                on(switchDialogLink, "click", function() {
                    var switchDialog = new Dialog();

                    var fieldList = new FieldList();
                    fieldList.placeAt(switchDialog.containerNode);

                    fieldList.insertDiv(i18n("Property Name"), activity.propertyName.escape());
                    fieldList.insertDiv(i18n("Value at Runtime"), activity.value.escape());

                    switchDialog.show();
                });

                var switchDialogImage = document.createElement("img");
                switchDialogImage.src = bootstrap.webextUrl+"images/webext/icons/icon_document_white.gif";
                switchDialogImage.title = i18n("Error Log");
                switchDialogImage.style.margin = "0px 2px";
                switchDialogLink.appendChild(switchDialogImage);
            }
        }
        else if (activity.type === "acquireLock" || activity.type === "releaseLock") {
            if (activity.state !== "INITIALIZED") {
                var lockDialogLink = domConstruct.create("a", {
                    "class": "linkPointer"
                }, activityActionsCell);
                on(lockDialogLink, "click", function() {
                    var lockDialog = new Dialog();

                    var fieldList = new FieldList();
                    fieldList.placeAt(lockDialog.containerNode);

                    fieldList.insertDiv(i18n("Lock Name"), activity.lockName.escape());

                    lockDialog.show();
                });

                var lockDialogImage = document.createElement("img");
                lockDialogImage.src = bootstrap.webextUrl+"images/webext/icons/icon_document_white.gif";
                lockDialogImage.title = i18n("Details");
                lockDialogImage.style.margin = "0px 2px";
                lockDialogLink.appendChild(lockDialogImage);
            }
        }
        else if (activity.type === "runProcess") {
            var requestId = activity.childRequestId;
            if (requestId) {
                domConstruct.create("a", {
                    "innerHTML": i18n("View Child Execution"),
                    "href": "#processRequest/"+requestId
                }, activityActionsCell);
            }
        }
        else if (activity.type === "componentProcess") {
            var componentProcessRequestId = activity.componentProcessRequestId;
            if (componentProcessRequestId) {
                domConstruct.create("a", {
                    "innerHTML": i18n("View Child Execution"),
                    "href": "#componentProcessRequest/"+componentProcessRequestId
                }, activityActionsCell);
            }
        }
        // for pattern activities delegate it to PatternExecutionLogFormatters
        if (activity.patternActivity) {
            PatternExecutionLogFormatters.actionsFormatter(activity, activityActionsCell);
        }


        return activityActionsCell;
    };

    /**
     *
     */
    exports.actionsMenuFormatter = function(activity, container) {
        var _this = this;
        var result = [];
        var createIcon = function(name){
            return '<div class="inlineBlock general-icon ' + name + '" ></div>';
        };

        if (activity.componentProcessRequest) {
            result.push({
                label: i18n("Details"),
                showLabel: true,
                icon: createIcon("pageIcon"),
                href: "#componentProcessRequest/"+activity.componentProcessRequest.id
            });
        }

        if (activity.error) {
            result.push({
                label: i18n("Error Log"),
                icon: createIcon("pageIconRed"),
                onClick: function() {
                    _this.showErrorDialog(activity);
                }
            });
        }
        else if (activity.fault) {
            result.push({
                label: i18n("Error Log"),
                icon: createIcon("pageIconRed"),
                onClick: function() {
                    var faultDialog = new Dialog();

                    var messageDiv = document.createElement("div");
                    if (activity.fault.message) {
                        messageDiv.innerHTML = util.escape(activity.fault.message);
                    }
                    else if (activity.fault.type) {
                        messageDiv.innerHTML = activity.fault.type;
                    }
                    faultDialog.containerNode.appendChild(messageDiv);

                    if (activity.fault.trace) {
                        var button = new Button({
                            label: i18n("Full Details..."),
                            onClick: function() {
                                var i;
                                var line;
                                var debugDialog = new Dialog();
                                var debugInfoPre = document.createElement("div");
                                var lines = activity.fault.trace.split(/\r\n|\n|\r/);
                                for (i = 0; i < lines.length; i++) {
                                    line = lines[i];
                                    line = line.replace(/\&/, "&amp;");
                                    line = line.replace(/>/, "&gt;");
                                    line = line.replace(/</, "&lt;");
                                    line = line.replace(/\t/, "&nbsp;&nbsp;&nbsp;&nbsp;");
                                    line = line.replace(/ /, "&nbsp;");
                                    line = "<div>" + line + "</div>";
                                    lines[i] = line;
                                }
                                debugInfoPre.innerHTML = lines.join("");
                                debugDialog.containerNode.appendChild(debugInfoPre);
                                debugDialog.show();
                            }
                        });
                        button.placeAt(faultDialog.containerNode, "last");
                        domClass.add(container, "always-show-actions");
                    }
                    faultDialog.show();
                }
            });
        }

        if (activity.patternActivity){
            PatternExecutionLogFormatters.actionsMenuFormatter(activity, container, result);
        }
        else if (activity.task) {
            if (activity.task.status === "OPEN") {
                if (activity.task.userCanModify) {
                    result.push({
                        label: i18n("Respond"),
                        showLabel: true,
                        onClick: function() {
                            _this.showApprovalDialog(activity.task);
                        }
                    });
                    domClass.add(container, "always-show-actions");
                }
            }
            else if (activity.task.comment) {
                var task = activity.task;
                result.push({
                    label: i18n("Completion Log"),
                    icon: createIcon("pageIcon"),
                    onClick: function() {
                        var commentDialog = new Dialog();

                        var commentDiv = document.createElement("div");
                        commentDiv.innerHTML = task.comment ? util.escape(task.comment) : "";
                        commentDialog.containerNode.appendChild(commentDiv);

                        var userDiv = document.createElement("div");
                        userDiv.innerHTML = "by "+util.escape(task.completedBy)+" on "+util.dateFormatShort(task.completedOn);
                        userDiv.style.marginTop = "8px";
                        userDiv.style.marginLeft = "12px";
                        commentDialog.containerNode.appendChild(userDiv);

                        commentDialog.show();
                    }
                });
            }
            else if (activity.task.status === "CLOSED") {
                result.push({
                    label: i18n("Completed by %s on %s", activity.task.completedBy, util.dateFormatShort(activity.task.completedOn)),
                    showLabel: true
                });
            }
            else if (activity.task.status === "FAILED") {
                result.push({
                    label: i18n("Failed by %s on %s", activity.task.completedBy, util.dateFormatShort(activity.task.completedOn)),
                    showLabel: true
                });
            }
        }
        else if (activity.type === "plugin") {
            if (activity.state !== "INITIALIZED") {
                var headerDiv = new FieldList();
                domClass.add(headerDiv.domNode, "logHeader");
                var i = 0;
                headerDiv.insertDiv(i18n("Working Directory"), util.escape(activity.workingDir), i);
                i++;
                if (activity.username) {
                    headerDiv.insertDiv(i18n("Impersonation User"), util.escape(activity.username), i);
                    i++;
                }
                if (activity.password) {
                    headerDiv.insertDiv(i18n("Impersonation Password"), activity.password, i);
                    i++;
                }
                if (activity.group) {
                    headerDiv.insertDiv(i18n("Impersonation Group"), util.escape(activity.group), i);
                    i++;
                }
                if (activity.useSudo !== null && activity.useSudo !== undefined) {
                    headerDiv.insertDiv(i18n("Use Sudo"), activity.useSudo, i);
                    i++;
                }

                if (!activity.error || activity.result === "CANCELED") {
                    result.splice(0, 0, {
                        label: i18n("Output Log"),
                        icon: createIcon("consoleIcon"),
                        onClick: function() {
                            var logViewer = new LiveLogViewer({
                                url: bootstrap.restUrl+"logView/trace/"+activity.workflowTraceId+"/"+activity.id+"/stdOut.txt",
                                propsUrl: bootstrap.restUrl+"workflow/"+activity.workflowTraceId+"/"+activity.id+"/properties",
                                completedUrl: bootstrap.restUrl + "workflow/" +
                                    activity.workflowTraceId + "/" + activity.id + "/completed",
                                title: i18n("Output Log"),
                                autoRefresh: activity.state === "EXECUTING",
                                header: headerDiv,
                                paddingTop: "0px"
                            });
                            logViewer.show();
                        }
                    });
                }

                if (!activity.fault && !activity.error && activity.errorLogExists) {
                    result.push({
                        label: i18n("Error Log"),
                        icon: createIcon("pageIconRed"),
                        onClick: function() {
                            var logViewer = new LiveLogViewer({
                                url: bootstrap.restUrl+"logView/trace/"+activity.workflowTraceId+"/"+activity.id+"/log.txt",
                                completedUrl: bootstrap.restUrl + "workflow/" +
                                    activity.workflowTraceId + "/" + activity.id + "/completed",
                                title: i18n("Error Log"),
                                autoRefresh: activity.state === "EXECUTING"
                            });
                            logViewer.show();
                        }
                    });
                }

                result.push({
                    label: i18n("Input/Output Properties"),
                    icon: createIcon("pageIcon"),
                    onClick: function() {
                        _this.showPropertiesDialog(activity);
                    }
                });

                // Create extra icons as necessary for any extra step logs
                array.forEach(activity.extraLogs, function(fileName) {
                    if (activity.extraLogs.indexOf(fileName + ".compare") !== -1) {
                        result.push({
                            label: fileName,
                            icon: createIcon("compareIcon"),
                            onClick: function() {
                                xhr.get({
                                    url: bootstrap.restUrl+"logView/trace/compare/" + activity.workflowTraceId + "/" + activity.id + "/" + fileName,
                                    handleAs: "json",
                                    load: function(data) {

                                        if (data.type === "resource") {
                                            var dialog = new Dialog({
                                                title: i18n("Differences"),
                                                closable: true,
                                                draggable: false,
                                                width: -50
                                            });

                                            var resourceCompareTree = new TransientResourceCompareTree({
                                                readOnly: true,
                                                data:data.data
                                            });
                                            resourceCompareTree.placeAt(dialog.containerNode);
                                            dialog.show();
                                        }
                                        else if (data.type === "file") {
                                            var compareDialog = new VersionFileCompare({
                                                data: data.data,
                                                title: i18n("File Differences"),
                                                version1: fileName,
                                                version2: fileName + ".compare"
                                            });
                                            compareDialog.show();
                                        }
                                    }
                                });
                            }
                        });
                    }
                    else if (
                        fileName.indexOf(".compare", fileName.length - ".compare".length) === -1 ||
                        activity.extraLogs.indexOf(fileName.substring(0, fileName.length - ".compare".length)) === -1
                    ) {
                        result.push({
                            label: fileName,
                            icon: createIcon("extraLogIcon"),
                            onClick: function() {
                                var logViewer = new LiveLogViewer({
                                    url: bootstrap.restUrl+"logView/trace/" + activity.workflowTraceId +
                                            "/" + activity.id + "/" + fileName,
                                    completedUrl: bootstrap.restUrl + "workflow/" +
                                        activity.workflowTraceId + "/" + activity.id + "/completed",
                                    title: fileName,
                                    autoRefresh: activity.state === "EXECUTING"
                                });
                                logViewer.show();
                            }
                        });
                    }
                });

                if (activity.detailsLink) {
                    result.push({
                        label: i18n("Details"),
                        showLabel: true,
                        href: activity.detailsLink,
                        handleNavigationError: function(){
                            if (navBar.lastNotFoundAppReqHash === this.href.substr(1)) {
                                 ErrorUtil.showErrorDialog(
                                         i18n("Deployment history details were deleted"),
                                         i18n("No deployment history is available for this application process request, " +
                                             "because daily cleanup removed all the details."));
                            }
                        }
                    });
                }
            }
        }
        else if (activity.type === "switch") {
            if (activity.state !== "INITIALIZED" && activity.result !== "FAULTED") {
                result.push({
                    label: i18n("Output Log"),
                    icon: createIcon("pageIcon"),
                    onClick: function() {
                        var switchDialog = new Dialog({
                            title: i18n("%s Output", util.escape(activity.name))
                        });

                        var fieldList = new FieldList();
                        fieldList.placeAt(switchDialog.containerNode);

                        fieldList.insertDiv(i18n("Property Name"), activity.propertyName.escape());
                        fieldList.insertDiv(i18n("Value at Runtime"), activity.value.escape());

                        switchDialog.show();
                    }
                });
            }
        }
        else if ((activity.type === "acquireLock" || activity.type === "releaseLock")
            && activity.state !== "INITIALIZED" && activity.result !== "FAULTED") {
            result.push({
                label: i18n("More Info"),
                icon: createIcon("pageIcon"),
                onClick: function () {
                    var lockDialog = new Dialog();

                    var fieldList = new FieldList();
                    fieldList.placeAt(lockDialog.containerNode);

                    fieldList.insertDiv(i18n("Lock Name"), activity.lockName.escape());

                    lockDialog.show();
                }
            });
        }

        else if (activity.type === "runProcess") {
            var requestId = activity.childRequestId;
            if (requestId) {
                result = [{
                    label: i18n("View Child Execution"),
                    showLabel: true,
                    href: "#processRequest/"+requestId
                }];
            }
        }
        else if (activity.type === "componentProcess") {
            var componentProcessRequestId = activity.componentProcessRequestId;
            if (componentProcessRequestId) {
                result = [{
                    label: i18n("View Child Execution"),
                    showLabel: true,
                    href: "#componentProcessRequest/"+componentProcessRequestId
                }];
            }
        }
        else if (activity.type === "resourceDiscovery") {
            if (!activity.error) {
                result.splice(0, 0, {
                    label: i18n("Output Log"),
                    icon: createIcon("consoleIcon"),
                    onClick: function() {
                        var logViewer = new LiveLogViewer({
                            url: bootstrap.restUrl+"logView/resourceDiscovery/" + activity.logReferenceId + "/stdOut.txt",
                            completedUrl: bootstrap.restUrl + "workflow/" +
                                activity.workflowTraceId + "/" + activity.id + "/completed",
                            title: i18n("Output Log"),
                            autoRefresh: activity.state === "EXECUTING",
                            paddingTop: "0px"
                        });
                        logViewer.show();
                    }
                });
            }

            if (activity.actionType === "COMPARE" && activity.result === "SUCCEEDED") {
                result.push({
                    label: i18n("Compare with Live Cell"),
                    icon: createIcon("compareIcon"),
                    onClick: function() {
                        var dialog = new Dialog({
                            title: i18n("Compare with Live Cell"),
                            closable: true,
                            draggable: false,
                            width: -50
                        });

                        var resourceCompareTree = new TransientResourceCompareTree({
                            readOnly: true,
                            url: bootstrap.restUrl + "resource/resource/transientCompare/" + activity.resource.id + "/" + activity.logReferenceId
                        });
                        resourceCompareTree.placeAt(dialog.containerNode);
                        dialog.show();
                    }
                });
            }
        }

        if (activity.iterationProperties) {
            result.push({
                label: i18n("Iteration Properties"),
                icon: createIcon("pageIcon"),
                onClick: function() {
                    _this.showIterationPropertiesDialog(activity);
                }
            });
        }

        return result;
    };

    /**
     *
     */
    exports.showPropertiesDialog = function(activity) {
        var _this = this;
        var activityId = activity.id;

        var propertiesDialog = new Dialog();

        var inputContainer = document.createElement("div");

        var outputContainer = document.createElement("div");
        outputContainer.className = "hidden";

        var currentView = "input";

        var currentViewSpan = document.createElement("span");
        currentViewSpan.innerHTML = i18n("Input Properties");

        var alternateViewLink = domConstruct.create("a", {
            "class": "linkPointer",
            "innerHTML": i18n("View Output Properties")
        });
        on(alternateViewLink, "click", function() {
            if (currentView === "output") {
                domClass.add(outputContainer, "hidden");
                domClass.remove(inputContainer, "hidden");

                currentViewSpan.innerHTML = i18n("Input Properties");
                alternateViewLink.innerHTML = i18n("View Output Properties");

                currentView = "input";
            }
            else {
                domClass.add(inputContainer, "hidden");
                domClass.remove(outputContainer, "hidden");

                currentViewSpan.innerHTML = i18n("Output Properties");
                alternateViewLink.innerHTML = i18n("View Input Properties");

                currentView = "output";
            }
        });

        var containerLabelDiv = document.createElement("div");
        containerLabelDiv.className = "containerLabel";
        containerLabelDiv.appendChild(currentViewSpan);
        util.appendTextSpan(containerLabelDiv, "&nbsp; - &nbsp;");
        containerLabelDiv.appendChild(alternateViewLink);

        var innerContainerDiv = document.createElement("div");
        innerContainerDiv.className = "innerContainer";

        innerContainerDiv.appendChild(outputContainer);
        innerContainerDiv.appendChild(inputContainer);

        var propertiesDialogScroller = document.createElement("div");
        propertiesDialogScroller.style.maxWidth = "700px";
        propertiesDialogScroller.style.maxHeight = "500px";
        propertiesDialogScroller.style.overflow = "auto";

        propertiesDialogScroller.appendChild(containerLabelDiv);
        propertiesDialogScroller.appendChild(innerContainerDiv);

        propertiesDialog.containerNode.appendChild(propertiesDialogScroller);

        propertiesDialog.show();

        xhr.get({
            url: bootstrap.restUrl+"workflow/"+activity.workflowTraceId+"/"+activityId+"/properties",
            handleAs: "json",
            load: function(activity) {
                if (activity.properties) {
                    var inputPropertiesTable = new TreeTable({
                        data: activity.properties,
                        serverSideProcessing: false,
                        columns: [{
                            name: i18n("Name"),
                            field: "name",
                            "class": "activity-property-name",
                            orderField: "name",
                            getRawValue: function(item) {
                                return item.name;
                            }
                        },{
                            name: i18n("Value"),
                            field: "value",
                            "class": "activity-property-value",
                            formatter: function(item, value) {
                                var result = domConstruct.create("div");
                                if (value) {
                                    array.forEach(value.split("\n"), function(line) {
                                        domConstruct.create("div", {
                                            innerHTML: line.escape()
                                        }, result);
                                    });
                                }
                                return result;
                            }
                        }],
                        orderField: "name",
                        hidePagination: true,
                        hideExpandCollapse: true,
                        hideFooter: true,
                        style: {
                            maxWidth: "640px"
                        }
                    });
                    inputPropertiesTable.placeAt(inputContainer);
                }
                else {
                    util.appendTextSpan(outputContainer, i18n("No input properties are available at this time."));
                }

                if (activity.outputProps) {
                    var outputPropertiesTable = new TreeTable({
                        data: activity.outputProps,
                        serverSideProcessing: false,
                        columns: [{
                            name: i18n("Name"),
                            field: "name",
                            "class": "activity-property-name",
                            orderField: "name",
                            getRawValue: function(item) {
                                return item.name;
                            }
                        },{
                            name: i18n("Value"),
                            field: "value",
                            "class": "activity-property-value",
                            formatter: function(item, value) {
                                var result = domConstruct.create("div");
                                if (value) {
                                    array.forEach(value.split("\n"), function(line) {
                                        domConstruct.create("div", {
                                            innerHTML: line.escape()
                                        }, result);
                                    });
                                }
                                return result;
                            }
                        }],
                        orderField: "name",
                        hidePagination: true,
                        hideExpandCollapse: true,
                        hideFooter: true,
                        style: {
                            maxWidth: "640px"
                        }
                    });
                    outputPropertiesTable.placeAt(outputContainer);
                }
                else {
                    util.appendTextSpan(outputContainer, i18n("No output properties are available at this time."));
                }
            }
        });
    };

    /**
     *
     */
    exports.showIterationPropertiesDialog = function(activity) {
        var _this = this;
        var activityId = activity.id;

        var propertiesDialog = new Dialog({
            title: i18n("Iteration Properties")
        });

        var propertiesDialogScroller = domConstruct.create("div", {
            style: {
                maxWidth: "700px",
                maxHeight: "500px",
                overflow: "auto"
            }
        }, propertiesDialog.containerNode);

        var innerContainerDiv = domConstruct.create("div", {
            className: "innerContainer"
        }, propertiesDialogScroller);


        // Convert the JSONObject of properties into an array for the table
        var tableData = [];
        var propertyName;
        for (propertyName in activity.iterationProperties) {
            if (activity.iterationProperties.hasOwnProperty(propertyName)) {
                tableData.push({
                    name: propertyName,
                    value: activity.iterationProperties[propertyName]
                });
            }
        }

        domConstruct.create("div", {
            innerHTML: i18n("These properties can be referenced by any steps inside this iteration " +
                    "using ${p:&lt;name&gt;}.")
        }, innerContainerDiv);

        var inputPropertiesTable = new TreeTable({
            data: tableData,
            serverSideProcessing: false,
            columns: [{
                name: i18n("Name"),
                field: "name",
                "class": "activity-property-name",
                orderField: "name",
                getRawValue: function(item) {
                    return item.name;
                }
            },{
                name: i18n("Value"),
                field: "value",
                "class": "activity-property-value",
                formatter: function(item, value) {
                    var result = domConstruct.create("div");
                    if (value) {
                        array.forEach(value.split("\n"), function(line) {
                            domConstruct.create("div", {
                                innerHTML: line.escape()
                            }, result);
                        });
                    }
                    return result;
                }
            }],
            orderField: "name",
            noDataMessage: i18n("No iteration properties found."),
            hidePagination: true,
            hideExpandCollapse: true,
            hideFooter: true,
            style: {
                maxWidth: "640px"
            }
        });
        inputPropertiesTable.placeAt(innerContainerDiv);

        propertiesDialog.show();
    };

    /**
     *
     */
    exports.showErrorDialog = function(activity) {
        var propertiesDialog = new Dialog();

        var propertiesDialogScroller = domConstruct.create("div", {
            style: {
                maxWidth: "700px",
                maxHeight: "500px",
                overflow: "auto"
            }
        }, propertiesDialog.containerNode);

        domConstruct.create("div", {
            innerHTML: i18n("Error")
        }, propertiesDialog.titleNode);

        var inputContainer = domConstruct.create("div", {}, propertiesDialogScroller);
        util.appendTextSpan(inputContainer, i18n(util.escape(activity.exception) || util.escape(activity.error)));

        propertiesDialog.show();
    };

    /**
     *
     */
    exports.showApprovalDialog = function(item) {
        var _this = this;

        var responseDialog = new TaskResponseDialog({
            task: item
        });
    };

    /**
     *
     */
    exports.progressFormatter = function(activity, activityProgressCell, returnValue) {
        var searchTypes = ["plugin", "componentProcess", "runProcess", "patternResource" ];

        var activityProgressContainer = domConstruct.create("div", {
            className: "inlineBlock progressContainer"
        });

        domClass.add(activityProgressCell, "progressCell");
        var totalChildren = this.getTotalChildCount(activity, searchTypes);
        var closedChildren = this.getClosedChildCount(activity, searchTypes);
        var succeededChildren = this.getSucceededChildCount(activity, searchTypes);
        var failedChildren = this.getFailedChildCount(activity, searchTypes);

        if (succeededChildren > 0 || totalChildren === 0) {
            var progressSuccessMeter = domConstruct.create("div", {
                className: "inlineBlock progressMeter success-state-color"
            }, activityProgressContainer);
            if (totalChildren === 0) {
                progressSuccessMeter.style.width = "100%";
            }
            else {
                progressSuccessMeter.style.width = (succeededChildren/totalChildren)*100+"%";
            }
        }

        if (failedChildren > 0) {
            var progressFailureMeter = domConstruct.create("div", {
                className: "inlineBlock progressMeter failed-state-color"
            }, activityProgressContainer);
            progressFailureMeter.style.width = (failedChildren/totalChildren)*100+"%";
        }

        if (closedChildren < totalChildren) {
            var incompleteCount = totalChildren-closedChildren;
            var progressRunningMeter = domConstruct.create("div", {
                className: "inlineBlock progressMeter running-state-color"
            }, activityProgressContainer);
            progressRunningMeter.style.width = (incompleteCount/totalChildren)*100+"%";
        }

        var progressLabel = domConstruct.create("div", {
            className: "progressLabel",
            innerHTML: closedChildren+" / "+totalChildren
        }, activityProgressContainer);

        var result = activityProgressContainer;
        if (returnValue) {
            result = progressLabel.innerHTML;
        }
        return result;
    };

    /**
     *
     */
    exports.getTotalChildCount = function(activity, searchTypes) {
        var _this = this;
        var result = 0;

        array.forEach(activity.children, function(child) {
            if (searchTypes.indexOf(child.type) > -1) {
                result++;
            }
            result += _this.getTotalChildCount(child, searchTypes);
        });

        return result;
    };

    /**
     *
     */
    exports.getClosedChildCount = function(activity, searchTypes) {
        var _this = this;
        var result = 0;

        array.forEach(activity.children, function(child) {
            if (searchTypes.indexOf(child.type) > -1
                    && child.state === "CLOSED") {
                result++;
            }
            result += _this.getClosedChildCount(child, searchTypes);
        });

        return result;
    };

    /**
     *
     */
    exports.getSucceededChildCount = function(activity, searchTypes) {
        var _this = this;
        var result = 0;

        array.forEach(activity.children, function(child) {
            if (searchTypes.indexOf(child.type) > -1
                    && child.state === "CLOSED"
                    && child.result === "SUCCEEDED") {
                result++;
            }
            result += _this.getSucceededChildCount(child, searchTypes);
        });

        return result;
    };

    /**
     *
     */
    exports.getFailedChildCount = function(activity, searchTypes) {
        var _this = this;
        var result = 0;

        array.forEach(activity.children, function(child) {
            if (searchTypes.indexOf(child.type) > -1
                    && child.state === "CLOSED"
                    && child.result === "FAULTED") {
                result++;
            }
            result += _this.getFailedChildCount(child, searchTypes);
        });

        return result;
    };
});

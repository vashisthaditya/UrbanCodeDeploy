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
        "deploy/widgets/patterns/PatternProcessIconsFormatter",
        "deploy/widgets/resource/TransientResourceCompareTree",
        "js/webext/widgets/Dialog",
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
        PatternProcessIconsFormatter,
        TransientResourceCompareTree,
        Dialog,
        FieldList
) {
    /**
     *
     */
    exports.nameFormatter = function(result, activity, noLink) {
        if (activity.resourceType === "OS::Nova::Server") {
            result.appendChild(formatters.createIcon("agentIcon"));
        }
        else {
            var image = null;
            if (activity.type === "patternDeployment"){
                image = "deploy";
            } else if (activity.type === "patternStackExecution"){
                image = "process";
            }
            if (image !== null){
                domConstruct.create("div", {
                    className: "inline-block execution-log-process-icon process-icon " + image + "-step-icon"
                }, result);
            } else {
                var processIconName = PatternProcessIconsFormatter.getIconForStep({activity: activity});
                domConstruct.create("div", {
                    className: "inline-block execution-log-process-icon pattern-process-icon " + processIconName + "-step-icon"
                }, result);
            }
        }
        var displayName = activity.displayName;
        if (!displayName) {
            displayName = activity.name;
        }
        if (activity.resourceType
                && activity.resourceType !== "configurationResourceGroup"
                && activity.resourceType !== "serverResourceGroup"
                && activity.resourceType !== "server"){
            displayName += " (" + activity.resourceType +")";
        }
        if (displayName) {
            util.appendTextSpan(result, displayName.escape()+"&nbsp;");
        }
        return result;
    };

    exports.actionsMenuFormatter = function(activity, container, result) {
        var resourceType = activity.resourceType;
        var createIcon = function(name){
            return '<div class="inlineBlock general-icon ' + name + '" ></div>';
        };
        if (resourceType === "OS::Nova::Server"){
            if (activity.state !== "INITIALIZED") {
                if (!activity.error || activity.result === "CANCELED") {
                    result.splice(0, 0, {
                        label: i18n("Output Log"),
                        icon: createIcon("consoleIcon"),
                        onClick: function() {
                            var logViewer = new LiveLogViewer({
                                url: bootstrap.restUrl+"integration/pattern/"+activity.integrationProviderId+"/environment/"+activity.stackId+"/instance/" + activity.physicalResourceId + "/consoleOutput",
                                title: i18n("Output Log"),
                                autoRefresh: activity.state === "EXECUTING" || activity.state === "SUCCEEDED",
                                paddingTop: "0px"
                            });
                            logViewer.show();
                        }
                    });
                }
            }
        }
    };
});

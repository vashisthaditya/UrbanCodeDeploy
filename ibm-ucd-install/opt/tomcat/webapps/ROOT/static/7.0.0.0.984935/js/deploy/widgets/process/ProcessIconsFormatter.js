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
/*global i18n, define, formatters */

define(["dojo/_base/array",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/dom-style",
        "dojo/mouse",
        "dojo/on",
        "dijit/form/Button",
        "dijit/TooltipDialog",
        "dijit/popup",
        "deploy/widgets/tag/TagDisplay",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/table/TreeTable"
        ],
function(array,
        domConstruct,
        domClass,
        domStyle,
        mouse,
        on,
        Button,
        TooltipDialog,
        popup,
        TagDisplay,
        Dialog,
        TreeTable) {
    return {

        /**
         *
         */
        getIconForTree: function(item) {
            var icon = "process-icon ";
            if (item.type){
                if (item.type === "folder"){
                    icon += "process-folder-icon";
                }
                else {
                    icon += item.type + "-step-icon";
                }
            }
            else {
                icon += this.getIconForStep(item) + "-step-icon";
            }
            return domConstruct.create("div", {
                className: "inline-block " + icon
            });

        },

        getIconForStep: function(item, fromName) {
            var image = "process";
            var processName = item.id;
            var ucdType = false;
            if (fromName){
                processName = item.name;
            }
            if (item.activity){
                if (item.activity.type){
                    processName = item.activity.type;
                    ucdType = true;
                }

            }
            if (item.plugin){
                processName = item.name;
            }
            if (item.data){
                processName = item.data.commandName;
                if (!processName){
                    processName = item.data.type;
                    if (!processName){
                        processName = item.id;
                        ucdType = false;
                    }
                    else if (processName.indexOf("EnvironmentIterator") !== -1 ||
                        processName === "touchedResourceIterator"){
                        processName = item.id;
                    }
                    else if (processName.indexOf("ManualTask") !== -1 ||
                             processName.indexOf("ResourceInventory") !== -1 ||
                             processName.indexOf("rollback") !== -1 ||
                             processName.indexOf("Approval") !== -1 ||
                             processName === "componentProcess" ||
                             processName === "resourceDiscovery"){
                                 ucdType = false;
                    }
                    else {
                        ucdType = true;
                    }
                }
            }
            if (!processName){
                processName = item.id || "";
                ucdType = false;
            }

            if (ucdType){
                image = processName;
            }
            else {
                if (item.command && item.command.name){
                    processName = item.command.name;
                }
                // Capitalize first character of name
                else if (processName.charAt(0) && processName.length > 0){
                    processName = processName.charAt(0).toUpperCase() + processName.slice(1);
                }
                switch (processName){
                    case "Run Groovy Script":
                        image = "runScript";
                        break;
                    case "Shell":
                        image = "shell";
                        break;
                    case "Shell (with xargs)":
                        image = "shellArgs";
                        break;
                    case "Unzip":
                        image = "unzip";
                        break;
                    case "Untar Tarball":
                        image = "unzip";
                        break;
                    default:
                        // Do nothing
                }
                var nameStarts = function(name, contains){
                    var pName = processName.toLowerCase();
                    name = name.toLowerCase();
                    var result = pName.indexOf(name) === 0;
                    if (contains){
                        result = pName.indexOf(name) !== -1;
                    }
                    return result;
                };
                if (image === "process"){
                    if (nameStarts("DesiredInventoryActivity", 1)
                            || nameStarts("DesiredSnapshotInventoryActivity", 1)) {
                        image = "process";
                    }
                    else if (nameStarts("Add")){
                        image = "add";
                    }
                    else if (nameStarts("Allocate")){
                        image = "allocate";
                    }
                    else if (nameStarts("AppCmd")){
                        image = "shellArgs";
                    }
                    else if (nameStarts("Approval", 1) || nameStarts("Submit")){
                        image = "setStatus";
                    }
                    else if (nameStarts("Assign")){
                        image = "set";
                    }
                    else if (nameStarts("Associate") || nameStarts("Link")){
                        image = "link";
                    }
                    else if (nameStarts("Check") || nameStarts("Verify")){
                        image = "check";
                    }
                    else if (nameStarts("Configure")){
                        image = "configure";
                    }
                    else if (nameStarts("Copy")){
                        image = "copy";
                    }
                    else if (nameStarts("Create")){
                        image = "create";
                    }
                    else if (nameStarts("Delete")){
                        image = "delete";
                    }
                    else if (nameStarts("Deregister")){
                        image = "cancel";
                    }
                    else if (nameStarts("Disable")){
                        image = "stop";
                    }
                    else if (nameStarts("Download")){
                        image = "download";
                    }
                    else if (nameStarts("Enable") || nameStarts("Execute")){
                        image = "start";
                    }
                    else if (nameStarts("Export")){
                        image = "export";
                    }
                    else if (nameStarts("Flip")){
                        image = "flip";
                    }
                    else if (nameStarts("FTP")){
                        image = "ftp";
                    }
                    else if (nameStarts("Get")){
                        image = "read";
                    }
                    else if (nameStarts("Import") || nameStarts("Batch Import")){
                        image = "import";
                    }
                    else if (nameStarts("Install", 1)){
                        image = "install";
                    }
                    else if (nameStarts("Launch")){
                        image = "deploy";
                    }
                    else if (nameStarts("Modify") || nameStarts("Change") || nameStarts("Define")){
                        image = "modify";
                    }
                    else if (nameStarts("Monitor") || nameStarts("View")){
                        image = "monitor";
                    }
                    else if (nameStarts("Move")){
                        image = "move";
                    }
                    else if (nameStarts("ManualTask", 1)){
                        image = "manualTask";
                    }
                    else if (nameStarts("Publish")){
                        image = "publish";
                    }
                    else if (nameStarts("Read")){
                        image = "read";
                    }
                    else if (nameStarts("Recycle")){
                        image = "recycle";
                    }
                    else if (nameStarts("Register")){
                        image = "create";
                    }
                    else if (nameStarts("Remove")){
                        image = "remove";
                    }
                    else if (nameStarts("Replace")){
                        image = "replace";
                    }
                    else if (nameStarts("Receive") || nameStarts("Retrieve")){
                        image = "receive";
                    }
                    else if (nameStarts("Restart") || nameStarts("Reboot")){
                        image = "restart";
                    }
                    else if (nameStarts("Revert") || nameStarts("Rollback", 1)){
                        image = "revert";
                    }
                    else if (nameStarts("Set")){
                        image = "set";
                    }
                    else if (nameStarts("Run", 1) || nameStarts("Each", 1) || nameStarts("Process", 1)){
                        image = "runProcess";
                    }
                    else if (nameStarts("Script", 1)){
                        image = "runScript";
                    }
                    else if (nameStarts("Send")){
                        image = "send";
                    }
                    else if (nameStarts("Start") || nameStarts("Activate")){
                        image = "start";
                    }
                    else if (nameStarts("Stop") || nameStarts("Terminate") || nameStarts("Cancel")){
                        image = "stop";
                    }
                    else if (nameStarts("Sync")){
                        image = "sync";
                    }
                    else if (nameStarts("Undeploy")){
                        image = "undeploy";
                    }
                    else if (nameStarts("Uninstall", 1)){
                        image = "uninstall";
                    }
                    else if (nameStarts("Untar", 1)){
                        image = "unzip";
                    }
                    else if (nameStarts("Update")){
                        image = "sync";
                    }
                    else if (nameStarts("Upgrade")){
                        image = "upgrade";
                    }
                    else if (nameStarts("Upload")){
                        image = "upload";
                    }
                    else if (nameStarts("Validate")){
                        image = "setStatus";
                    }
                    else if (nameStarts("Wait")){
                        image = "wait";
                    }
                    else if (nameStarts("WebSphere", 1)){
                        image = "websphere";
                    }
                    else if (nameStarts("Deploy") || nameStarts("Launch")){
                        image = "deploy";
                    }
                    else if (nameStarts("Iterator", 1)){
                        image = "componentApprovalIterator";
                    }
                }
            }
            return image;
        }
    };
});

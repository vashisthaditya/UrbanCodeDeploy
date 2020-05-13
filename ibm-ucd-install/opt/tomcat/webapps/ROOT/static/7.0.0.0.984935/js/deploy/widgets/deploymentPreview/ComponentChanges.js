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
        "js/webext/widgets/table/TreeTable",
        "deploy/widgets/Formatters"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        TreeTable,
        formatters
) {
    return declare('deploy.widgets.deploymentPreview.ComponentChanges',  [_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="componentChanges">' + 
                '<div data-dojo-attach-point="treeAttach"></div>' +
            '</div>',

        /**
         * 
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            var gridLayout = [{
                name: i18n("Component/Resource"),
                formatter: function(item, result, cellDom) {
                    var name;

                    if (item.resource) {
                        name = util.getOnClickLink("resource/"+item.resource.id, item.resource.path);
                    }
                    else {
                        name = formatters.componentLinkFormatter(item);
                    }
                    return name;
                },
                getRawValue: function(item) {
                    return item.name;
                },
                field: "name"
            },{
                name: i18n("Process"),
                formatter: function(item, result, cellDom) {
                    if (item.version) {
                        return formatters.componentProcessLinkFormatter(item.componentProcess);
                    }
                }
            },{
                name: i18n("Version"),
                formatter: function(item, result, cellDom) {
                    if (item.version) {
                        return formatters.versionLinkFormatter(item.version);
                    }
                }
            },{
                name: i18n("Change Type"),
                formatter: function(item, result, cellDom) {
                    var finalResult;
                    if (item.version && item.type) {
                        var installTypeDiv = document.createElement("div");
                        var icon = document.createElement("img");
                        if (item.type === "ADD") {
                            icon.src = bootstrap.webextUrl+"images/webext/icons/icon_plus.gif";
                        }
                        else {
                            icon.src = bootstrap.webextUrl+"images/webext/icons/icon_minus.gif";
                        }
                        installTypeDiv.appendChild(icon);
                        
                        var statusDiv = document.createElement("div");
                        statusDiv.innerHTML = item.status.name.escape();
                        statusDiv.style.backgroundColor = item.status.color;
                        statusDiv.className = "statusLabel";
                        installTypeDiv.appendChild(statusDiv);
                        finalResult = installTypeDiv;
                    }                     
                    return finalResult;
                }
            }];
            
            var tableUrl;
            if (self.applicationProcessRequest) {
                tableUrl = bootstrap.restUrl+"deploy/applicationProcessRequest/"+self.applicationProcessRequest.id+"/changesByComponent";
            }
            else {
                tableUrl = bootstrap.restUrl+"deploy/snapshot/"+self.snapshot.id+"/changesByComponent"+
                        "?environmentId="+self.environment.id+"&applicationProcessId="+self.applicationProcess.id;
            }

            this.tree = new TreeTable({
                url: tableUrl,
                columns: gridLayout,
                serverSideProcessing: false,
                orderField: "name",
                tableConfigKey: "resourceChangesList"
            });
            this.tree.placeAt(this.treeAttach);
        },

        /**
         * 
         */
        destroy: function() {
            this.inherited(arguments);

            this.tree.destroy();
        }
    });
});
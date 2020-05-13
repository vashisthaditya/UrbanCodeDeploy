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
        "dojo/dom-class",
        "dojo/has",
        "dojo/on",
        "dijit/form/Button",
        "dijit/form/CheckBox",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Alert",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/table/TreeTable",
        "deploy/widgets/Formatters"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        domConstruct,
        domClass,
        has,
        on,
        Button,
        CheckBox,
        ColumnForm,
        Alert,
        Dialog,
        GenericConfirm,
        TreeTable,
        formatters
) {
    /**
     *
     */
    return declare('deploy.widgets.version.VersionArtifacts',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="versionArtifacts">'+
                '<div data-dojo-attach-point="countAttach"></div>'+
                '<div data-dojo-attach-point="treeAttach" class="fileTree"></div>'+
                '<div class="archiveAttach" data-dojo-attach-point="archiveAttach"></div>'+
            '</div>',

        emptyTreeMessage: null,

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            var sourceType;
            var useVfs;

            if (appState.component.sourceConfigPlugin) {
                sourceType = appState.component.sourceConfigPlugin.name;
                useVfs = appState.component.useVfs;
            }
            var anthillUrl, buildLifeId, linkContainer, anthillLink, uBuildUrl, uBuildLink;
            if (sourceType === "AnthillPro") {
                anthillUrl = util.getNamedPropertyValue(appState.component.properties, "AnthillComponentProperties/anthillUrl");
                buildLifeId = appState.version.name;

                linkContainer = domConstruct.create("div", null, self.treeAttach);
                linkContainer.style.paddingBottom = ".5em";

                anthillLink = document.createElement("a");
                anthillLink.innerHTML = i18n("View artifacts in Anthill");
                anthillLink.href = anthillUrl+"/tasks/project/BuildLifeTasks/viewArtifactList?buildLifeId="+buildLifeId;
                anthillLink.target = "_blank";

                linkContainer.appendChild(anthillLink);
            } else if (sourceType === "uBuild") {
                uBuildUrl = util.getNamedPropertyValue(appState.component.properties, "uBuildComponentProperties/uBuildUrl");
                buildLifeId = appState.version.name;

                linkContainer = domConstruct.create("div", null, self.treeAttach);
                linkContainer.style.paddingBottom = ".5em";

                uBuildLink = document.createElement("a");
                uBuildLink.innerHTML = i18n("View artifacts in uBuild");
                uBuildLink.href = uBuildUrl+"/tasks/project/BuildLifeTasks/viewArtifactList?buildLifeId="+buildLifeId;
                uBuildLink.target = "_blank";

                linkContainer.appendChild(uBuildLink);
            }
            this.showZosSysProperties = false;

            this.showTree();
        },

        /**
         *
         */
        destroy: function() {
            this.inherited(arguments);

            if (this.tree) {
                this.tree.destroy();
            }
        },

        /**
         *
         */
        showTree: function() {
            var self = this;

            if (appState.version.archived) {
                var archiveLabel = domConstruct.create("div", {
                    "innerHTML": i18n("This version's artifacts have been archived."),
                    "class": "inlineBlock actionsLink"
                }, this.archiveAttach);
                var restoreLink = domConstruct.create("a", {
                    "innerHTML": i18n("Restore from Backup"),
                    "class": "linkPointer actionsLink"
                }, this.archiveAttach);
                on(restoreLink, "click", function() {
                    self.showRestoreDialog();
                });
            }

            if (appState.version.totalCount !== undefined) {
                var totalLabel = document.createElement("div");

                if (appState.component.componentType && appState.component.componentType === "ZOS") {
                    var totalAdd = "";
                    var totalDel = "";
                    var totalGeneric = "";
                    if (appState.version.totalZosAddPdsCount>0 ||
                        appState.version.totalZosAddSequentialCount>0 ||
                        appState.version.totalZosAddUssDirectoryCount>0) {

                        if (appState.version.totalZosAddPdsCount>0
                            && appState.version.totalZosAddSequentialCount>0
                            && appState.version.totalZosAddUssDirectoryCount>0) {
                            totalAdd = i18n("Total add: %s members in %s data sets, %s sequential data sets, %s files in %s directories", 
                                appState.version.totalZosAddPdsMemberCount, appState.version.totalZosAddPdsCount,
                                appState.version.totalZosAddSequentialCount,
                                appState.version.totalZosDelUssFileCount, appState.version.totalZosAddUssDirectoryCount);
                        }

                        if (appState.version.totalZosAddPdsCount>0
                                && appState.version.totalZosAddSequentialCount<=0
                                && appState.version.totalZosAddUssDirectoryCount>0) {
                                totalAdd = i18n("Total add: %s members in %s data sets, %s files in %s directories",
                                    appState.version.totalZosAddPdsMemberCount, appState.version.totalZosAddPdsCount,
                                    appState.version.totalZosAddUssFileCount, appState.version.totalZosAddUssDirectoryCount);
                        }

                        if (appState.version.totalZosAddPdsCount>0
                                && appState.version.totalZosAddSequentialCount<=0
                                && appState.version.totalZosAddUssDirectoryCount<=0) {
                                totalAdd = i18n("Total add: %s members in %s data sets",
                                    appState.version.totalZosAddPdsMemberCount, appState.version.totalZosAddPdsCount);
                        }

                        if (appState.version.totalZosAddPdsCount>0
                                && appState.version.totalZosAddSequentialCount>0
                                && appState.version.totalZosAddUssDirectoryCount<=0) {
                                totalAdd = i18n("Total add: %s members in %s data sets, %s sequential data sets",
                                    appState.version.totalZosAddPdsMemberCount, appState.version.totalZosAddPdsCount,
                                    appState.version.totalZosAddSequentialCount);
                        }

                        if (appState.version.totalZosAddPdsCount<=0
                                && appState.version.totalZosAddSequentialCount>0
                                && appState.version.totalZosAddUssDirectoryCount>0) {
                                totalAdd = i18n("Total add: %s sequential data sets, %s files in %s directories",
                                    appState.version.totalZosAddSequentialCount,
                                    appState.version.totalZosAddUssFileCount, appState.version.totalZosAddUssDirectoryCount);
                        }

                        if (appState.version.totalZosAddPdsCount<=0
                                && appState.version.totalZosAddSequentialCount>0
                                && appState.version.totalZosAddUssDirectoryCount<=0) {
                                totalAdd = i18n("Total add: %s sequential data sets", appState.version.totalZosAddSequentialCount);
                        }

                        if (appState.version.totalZosAddPdsCount<=0
                                && appState.version.totalZosAddSequentialCount<=0
                                && appState.version.totalZosAddUssDirectoryCount>0) {
                                totalAdd = i18n("Total add: %s files in %s directories",
                                    appState.version.totalZosAddUssFileCount, appState.version.totalZosAddUssDirectoryCount);
                        }
                    }

                    if (appState.version.totalZosDelPdsCount>0 ||
                        appState.version.totalZosDelSequentialcount>0 ||
                        appState.version.totalZosDelUssDirectoryCount>0) {

                        if (appState.version.totalZosDelPdsCount>0
                                && appState.version.totalZosDelSequentialcount>0
                                && appState.version.totalZosDelUssDirectoryCount>0) {
                                totalDel = i18n("Total delete: %s members in %s data sets, %s sequential data sets, %s files in %s directories",
                                    appState.version.totalZosDelPdsMemberCount, appState.version.totalZosDelPdsCount,
                                    appState.version.totalZosDelSequentialcount,
                                    appState.version.totalZosDelUssFileCount, appState.version.totalZosDelUssDirectoryCount);
                        }

                        if (appState.version.totalZosDelPdsCount>0
                                && appState.version.totalZosDelSequentialcount<=0
                                && appState.version.totalZosDelUssDirectoryCount>0) {
                                totalDel = i18n("Total delete: %s members in %s data sets, %s files in %s directories",
                                    appState.version.totalZosDelPdsMemberCount, appState.version.totalZosDelPdsCount,
                                    appState.version.totalZosDelUssFileCount, appState.version.totalZosDelUssDirectoryCount);
                        }

                        if (appState.version.totalZosDelPdsCount>0
                                && appState.version.totalZosDelSequentialcount<=0
                                && appState.version.totalZosDelUssDirectoryCount<=0) {
                                totalDel = i18n("Total delete: %s members in %s data sets",
                                    appState.version.totalZosDelPdsMemberCount, appState.version.totalZosDelPdsCount);
                        }

                        if (appState.version.totalZosDelPdsCount>0
                                && appState.version.totalZosDelSequentialcount>0
                                && appState.version.totalZosDelUssDirectoryCount<=0) {
                                totalDel = i18n("Total delete: %s members in %s data sets, %s sequential data sets",
                                    appState.version.totalZosDelPdsMemberCount, appState.version.totalZosDelPdsCount,
                                    appState.version.totalZosDelSequentialcount);
                        }

                        if (appState.version.totalZosDelPdsCount<=0
                                && appState.version.totalZosDelSequentialcount>0
                                && appState.version.totalZosDelUssDirectoryCount>0) {
                                totalDel = i18n("Total delete: %s sequential data sets, %s files in %s directories",
                                    appState.version.totalZosDelSequentialcount,
                                    appState.version.totalZosDelUssFileCount, appState.version.totalZosDelUssDirectoryCount);
                        }

                        if (appState.version.totalZosDelPdsCount<=0
                                && appState.version.totalZosDelSequentialcount>0
                                && appState.version.totalZosDelUssDirectoryCount<=0) {
                                totalDel = i18n("Total delete: %s sequential data sets", appState.version.totalZosDelSequentialcount);
                        }

                        if (appState.version.totalZosDelPdsCount<=0
                                && appState.version.totalZosDelSequentialcount<=0
                                && appState.version.totalZosDelUssDirectoryCount>0) {
                                totalDel = i18n("Total delete: %s files in %s directories",
                                    appState.version.totalZosDelUssFileCount, appState.version.totalZosDelUssDirectoryCount);
                        }
                    }

                    if(appState.version.totalZosGenericCount > 0) {
                        totalGeneric = i18n("Total generic artifacts: %s artifacts in %s containers", appState.version.totalZosGenericMemberCount, appState.version.totalZosGenericCount);
                    }

                    var summary = totalAdd;
                    if (summary && totalDel) {
                        summary = summary + "<br/>" + totalDel;
                    } else {
                        summary = summary + totalDel;
                    }
                    if (summary && totalGeneric) {
                        summary = summary + "<br/>" + totalGeneric;
                    } else {
                        summary = summary + totalGeneric;
                    }

                    totalLabel.innerHTML = summary;
                } else {
                    totalLabel.innerHTML = i18n("Total: %s (%s files)", util.fileSizeFormat(appState.version.totalSize), appState.version.totalCount);
                }

                this.countAttach.className = "innerContainerLabel";

                this.countAttach.appendChild(totalLabel);
            }

            self.showTableTree();
        },

        showTableTree: function() {
            var self = this;

            if (this.tree) {
                this.tree.destroy();
            }
            var gridLayout = [            {
                name: i18n("Last Modified"),
                formatter: function(item, result, cellDom) {
                    if (item.lastModified !== 0 && item.type === "file") {
                        return util.dateFormatShort(item.lastModified);
                    }
                }
            }];
            var standardName = {
                    name: i18n("Name"),
                    formatter: function(item, result, cellDom) {
                        return formatters.artifactFormatter(item);
                    },
                    orderField: "name",
                    filterField: "name",
                    filterType: "text",
                    getRawValue: function(item) {
                        return item.name;
                    },
                    field: "name"
            };
            var zosName = {
                    name: i18n("Name"),
                    formatter: function(item, result, cellDom) {
                        var baseUrl = util.getNamedPropertyValue(appState.component.properties, "custom/input.baseurl");
                        return formatters.zosArtifactFormatter(item, baseUrl);
                    },
                    orderField: "name",
                    filterField: "name",
                    filterType: "text",
                    getRawValue: function(item) {
                        return item.name;
                    },
                    field: "name"
            };
            var zosArtifactsType = {
                    name: i18n("Artifact Type"),
                    formatter: function(item, result, cellDom) {
                        var formatResult = "";
                        if (item.type === "folder") {
                            if (item.zosContainerType && item.zosDeployAction) {
                                if (item.zosContainerType && "GENERIC" === item.zosContainerType.toUpperCase()) {
                                    formatResult = "[GENERIC]";
                                } else {
                                    formatResult = "[" + item.zosContainerType + "," + item.zosDeployAction + "]";
                                }
                            }
                            else {
                                formatResult = "[PDS,ADD]";
                            }
                        }
                        return formatResult;
                    },
                    orderField: "zosContainerType",
                    filterField: "zosContainerType",
                    filterType: "text",
                    getRawValue: function(item) {
                        var result = "";
                        if (item.type === "folder") {
                            if (item.zosContainerType && item.zosDeployAction) {
                                result = "[" + item.zosContainerType + "," + item.zosDeployAction + "]";
                            }
                            else {
                                result = "[PDS,ADD]";
                            }
                        }
                        return result;
                    },
                    field: "zosContainerType",
                    width : "120px"
            };
            var deployType = {
                name: i18n("Deploy Type"),
                orderField: "deployType",
                filterField: "deployType",
                filterType: "text",
                getRawValue: function(item) {
                    var result = item.deployType;
                    if (!result) {
                        result = "";
                    }
                    return result;
                },
                field: "deployType",
                width : "120px"
            };

            var inputs = {
                name: i18n("Inputs"),
                filterField: "inputNames",
                filterType: "text",
                formatter: function(item, result, cellDom) {
                    if (item.userAttributes &&
                        item.userAttributes.zOSResourceInputsKey &&
                        item.userAttributes.zOSResourceInputsKey.zOSResourceInputs &&
                        item.userAttributes.zOSResourceInputsKey.zOSResourceInputs.length > 0){
                        var returnDom = domConstruct.create("div");
                        var inputs = item.userAttributes.zOSResourceInputsKey.zOSResourceInputs;
                        var inputIndex = 0;
                        var baseUrl = util.getNamedPropertyValue(appState.component.properties, "custom/input.baseurl");
                        while(inputIndex<inputs.length) {
                            var input = inputs[inputIndex];
                            var displayText = input.name;
                            if(input.version) {
                                displayText = displayText + "(" + input.version + ")";
                            }
                            var url = input.url;
                            if(url) {
                                if(url.trim().toUpperCase().indexOf("HTTP") !== 0 && baseUrl) {
                                    url = baseUrl + url;
                                }
                                domConstruct.create("a", {
                                        "class": "linkPointer",
                                        "href" : url,
                                        "target" : "_blank",
                                        "innerHTML": displayText}, returnDom);
                            } else {
                                domConstruct.create("div",{
                                    "title" : displayText,
                                    "innerHTML" : displayText
                                }, returnDom);
                            }

                            if (inputIndex + 1 < inputs.length) {
                                domConstruct.create("br", {}, returnDom);
                            }
                            inputIndex++;
                        }

                        return returnDom;
                    }

                    return "";
                }
            };

            var zOSCustomerProperties = {
                    name : i18n("Properties"),
                    formatter : function(item, result, cellDom) {
                        var customerPropertiesData = [];
                        if (item.userAttributes && item.userAttributes.zOSCustomerPropertiesKey) {
                            customerPropertiesData = item.userAttributes.zOSCustomerPropertiesKey;
                        }
                        if (!self.showZosSysProperties) {
                            var custkeys = [];
                            customerPropertiesData.forEach(function(property) {
                                if (!property.name.startsWith("SYS.")) {
                                    custkeys.push(property);
                                }
                            });
                            customerPropertiesData = custkeys;
                        }

                        var customeDataLength = customerPropertiesData.length;
                        if (customeDataLength > 0) {
                            var showPropertiesPairNumMax = 5;
                            var displayPropertiesPairNum = showPropertiesPairNumMax;
                            if (customeDataLength < showPropertiesPairNumMax) {
                                displayPropertiesPairNum = customeDataLength;
                            }
                            var returnDom = domConstruct.create("div");

                            var displayPropertiesPairIndex = 0;
                            while (displayPropertiesPairIndex < displayPropertiesPairNum) {
                                var propertyName = customerPropertiesData[displayPropertiesPairIndex].name.escape();
                                var propertyValue = customerPropertiesData[displayPropertiesPairIndex].value.escape();
                                var propertiesNameValuePair = propertyName + "=" + propertyValue;
                                if (propertyValue.toUpperCase().indexOf("HTTP") === 0) {
                                    var httpTypeValueLink = domConstruct.create("a", {
                                        "class": "linkPointer",
                                        "href" : propertyValue,
                                        "target" : "_blank",
                                        "innerHTML": i18n(propertyName)}, returnDom);
                                }
                                else {
                                    domConstruct.create("div",{
                                        "title" : propertiesNameValuePair,
                                        "innerHTML" : propertiesNameValuePair
                                    }, returnDom);
                                }
                                if (displayPropertiesPairIndex + 1 < displayPropertiesPairNum) {
                                    domConstruct.create("br", {}, returnDom);
                                }
                                displayPropertiesPairIndex++;
                            }

                            if (customeDataLength > showPropertiesPairNumMax) {
                                var morePropertiesNum = customeDataLength-showPropertiesPairNumMax;
                                var propertiesLinkTitle = " (+" + morePropertiesNum + i18n(" more") + ")";
                                var showPropertiesLink = domConstruct.create("a", {
                                                                "class": "linkPointer",
                                                                "title": i18n("Click to view all"),
                                                                "innerHTML": i18n(propertiesLinkTitle)}, returnDom);
                                on(showPropertiesLink, "click", function() {
                                        var artifactDisplayName = item.path;
                                        if (artifactDisplayName.indexOf("/")>0) {
                                            artifactDisplayName = artifactDisplayName.replace(/\//g, "(");
                                            artifactDisplayName += ")";
                                        }
                                        var dialogTitle = i18n("Properties for Artifact %s", artifactDisplayName);
                                        var propertiesDialog = new Dialog({
                                            title: dialogTitle,
                                            closable: true,
                                            draggable: true
                                        });
                                        var customerPropertiesTable = new TreeTable({
                                                data: customerPropertiesData,
                                                serverSideProcessing: false,
                                                columns: [{
                                                            name: i18n("Name"),
                                                            field: "name",
                                                            orderField: "name",
                                                            getRawValue: function(item) {
                                                                    return item.name;
                                                                },
                                                            style : {"word-break" : "break-all"}
                                                            },{
                                                            name: i18n("Value"),
                                                            field: "value",
                                                            getRawValue: function(item) {
                                                                return item.value;
                                                            },
                                                            formatter : function(item, result, cellDom) {
                                                                var propertyName = item.name.escape();
                                                                var propertyValue = item.value.escape();
                                                                if (propertyValue.toUpperCase().indexOf("HTTP") === 0) {
                                                                    var link = domConstruct.create("a", {
                                                                        "class": "linkPointer",
                                                                        "href" : propertyValue,
                                                                        "target" : "_blank",
                                                                        "innerHTML": i18n(propertyName)});
                                                                    result = link;
                                                                }
                                                                else {
                                                                    result = propertyValue;
                                                                }
                                                                return result;
                                                            },
                                                            style : {"word-break" : "break-all"}
                                                        }],
                                                orderField: "name",
                                                hidePagination: true,
                                                hideFooter: true,
                                                hideExpandCollapse: true,
                                                style: {
                                                          maxWidth: "640px"
                                                        }
                                              });
                                        customerPropertiesTable.placeAt(propertiesDialog);
                                        propertiesDialog.show();
                                });
                            }

                            return returnDom;
                        }
                    },
                    style : {"word-break" : "break-all"},
                    width : "410px"
            };
            var actions = {
                name: i18n("Actions"),
                formatter: function(item, result, cellDom) {
                    if (item.type === "file" && !item.isSymlink) {
                        if (!appState.version.archived) {
                            var downloadLink = domConstruct.create("a", {
                                "class": "linkPointer",
                                "innerHTML": i18n("Download")
                            });
                            on(downloadLink, "click", function() {
                                util.downloadFile(bootstrap.restUrl+"deploy/version/"+appState.version.id+"/downloadArtifact/"+util.encodeIgnoringSlash(item.path));
                            });
                            return downloadLink;
                        }
                    }
                }
            };
            var sizeColumn = {
                name: i18n("Size"),
                formatter: function(item, result, cellDom) {
                    var finalResult;
                    if (item.isSymlink) {
                        finalResult = i18n("N/A (Symbolic Link)");
                    }
                    else if (item.type === "file") {
                        finalResult = util.fileSizeFormat(item.length);
                    }
                    else {
                        finalResult = i18n("%s (%s files)", util.fileSizeFormat(item.totalSize), item.totalCount);
                    }
                    return finalResult;
                }
            };

            if (appState.component.componentType && appState.component.componentType === "ZOS") {
                gridLayout.splice(0,0,zosName);
                gridLayout.splice(1,0,zosArtifactsType);
                gridLayout.splice(2,0,deployType);
                gridLayout.splice(3,0,inputs);
                gridLayout.push(zOSCustomerProperties);
            }
            else {
                gridLayout.splice(0,0,standardName);
                gridLayout.splice(1,0,sizeColumn);
                gridLayout.push(actions);
            }

            this.tree = new TreeTable({
                url: bootstrap.restUrl+"deploy/version/"+appState.version.id+"/fileTree",
                columns: gridLayout,
                serverSideProcessing: false,
                orderField: "name",
                noDataMessage: i18n("No artifacts have been added yet"),
                tableConfigKey: "artifactList",
                getChildUrl: function(item) {
                    return bootstrap.restUrl+"deploy/version/"+appState.version.id+"/fileTree/"+util.encodeIgnoringSlash(item.$ref);
                }
            });

            if (appState.component.componentType === "ZOS") {
                var displayText = i18n("Show SYS properties");
                if (self.showZosSysProperties) {
                    displayText = i18n("Hide SYS properties");
                }
                var showPropertiesLink = domConstruct.create("a", {
                    "class": "linkPointer",
                    "title": displayText,
                    "style": "margin-left: 10px;",
                    "innerHTML": displayText}, this.tree.expandCollapseAttach);

                on(showPropertiesLink, "click", function() {
                    self.showZosSysProperties = !self.showZosSysProperties;
                    this.innerHTML = displayText;
                    this.title = displayText;
                    self.showTableTree();
                });
            }

            if (appState.component.componentType !== "ZOS") {
                var downloadAllButton = new Button({
                    label: i18n("Download All"),
                    showTitle: false,
                    onClick: function() {
                        var timeAlert = new GenericConfirm({
                            message: i18n("For large files, this operation make take some time. Please be patient while your download begins."),
                            action: function() {
                                util.downloadFile(bootstrap.restUrl+"deploy/version/"+appState.version.id+"/downloadArtifacts");
                            }
                        });
                    }
                });
                domClass.add(downloadAllButton.domNode, "idxButtonSpecial");
                downloadAllButton.placeAt(this.tree.buttonAttach);
            }
            this.tree.placeAt(this.treeAttach);
        },

        showRestoreDialog: function() {
            var self = this;
            var restoreDialog = new Dialog({
                title: i18n("Restore Version Artifacts"),
                closable: true,
                draggable: true
            });

            var restoreForm = new ColumnForm({
                submitUrl: bootstrap.restUrl+"deploy/version/"+appState.version.id+"/restoreArtifacts",
                postSubmit: function(data) {
                    restoreDialog.hide();
                    restoreDialog.destroy();

                    navBar.setHash("#version/"+appState.version.id, false, true);
                },
                onCancel: function() {
                    restoreDialog.hide();
                    restoreDialog.destroy();
                }
            });

            restoreForm.addField({
                name: "path",
                label: i18n("Path to Backup Zip"),
                description: i18n("The path relative to the Archive Path of the backup .zip file " +
                    "containing the artifacts for this version."),
                value: self.getArchiveZipName(),
                type: "Text",
                bidiDynamicSTT: "FILE_PATH",
                required: true
            });

            restoreForm.placeAt(restoreDialog.containerNode);
            restoreDialog.show();
        },

        getArchiveZipName: function() {
            var zipName = appState.component.name;
            zipName += "_";
            zipName += appState.version.name;
            zipName += ".zip";
            zipName = zipName.replace("/", "_").replace("\\", "_");
            return zipName;
        }
    });
});

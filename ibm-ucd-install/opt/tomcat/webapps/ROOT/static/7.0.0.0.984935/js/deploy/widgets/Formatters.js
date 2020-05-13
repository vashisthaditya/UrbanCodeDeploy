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
    "dojo/_base/xhr",
    "dojo/Deferred",
    "dojo/dom-construct",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/mouse",
    "dojo/on",
    "dijit/form/Button",
    "dijit/Tooltip",
    "dijit/TooltipDialog",
    "dijit/popup",
    "deploy/widgets/tag/TagDisplay",
    "js/webext/widgets/Dialog",
    "js/webext/widgets/table/TreeTable"
],
function(array,
    xhr,
    Deferred,
    domConstruct,
    domClass,
    domStyle,
    mouse,
    on,
    Button,
    Tooltip,
    TooltipDialog,
    popup,
    TagDisplay,
    Dialog,
    TreeTable) {
    return {

        /**
         *
         */
        applicationLinkFormatter: function(item) {
            var result = "";
            if (item) {
                if (item.deleted) {
                    result = i18n("%s (Deleted)", item.name);
                }
                else if (!item.security || item.security.read) {
                    result = document.createElement("a");
                    result.innerHTML = item.name.escape();
                    result.href = "#application/" + item.id;
                }
                else {
                    result = item.name;
                }
            }
            return result;
        },

        /**
         *
         */
        applicationTemplateLinkFormatter: function(item) {
            var result = "";
            if (item) {
                if (!item.security || item.security.read) {
                    result = document.createElement("a");
                    result.innerHTML = item.name.escape();
                    result.href = "#applicationTemplate/" + item.id + "/-1";
                }
                else {
                    result = item.name.escape();
                }
            }
            return result;
        },

        /**
         *
         */
        environmentLinkFormatter: function(item) {
            var result = "";
            if (item) {
                if (!item.security || item.security.read) {
                    result = document.createElement("a");
                    result.innerHTML = item.name.escape();
                    result.href = "#environment/" + item.id;
                }
                else {
                    result = item.name.escape();
                }
            }
            return result;
        },

        environmentBlueprintDropDownFormatter: function(menuItem, item) {
            if (item.source === "landscaper") {
                domConstruct.create("div", {
                    "class": "inlineBlock general-icon cloud-icon dark-cloud-icon"
                }, menuItem, "first");
            }
        },

        applicationProcessDropDownFormatter: function(menuItem, item) {
            if (item.metadataType === "patternApplicationProcess"){
                domConstruct.create("div", {
                    "class": "inlineBlock general-icon cloud-icon dark-cloud-icon"
                }, menuItem, "first");
            }
        },

        /**
         *
         */
        applicationProcessLinkFormatter: function(item) {
            var result = domConstruct.create("div");
            var link = domConstruct.create("a", {}, result);
            if (item) {
                link.innerHTML = item.name.escape();
                if (item.metadataType === "patternApplicationProcess"){
                    if (item.blueprint){
                        link.href = item.blueprint.url;
                    }
                    domConstruct.create("div", {
                        "class": "inlineBlock general-icon cloud-icon dark-cloud-icon"
                    }, link, "first");
                }
                else {
                    link.className = "actionsLink";
                    link.href = "#applicationProcess/"+item.id+"/"+(item.version || "-1");

                    if (item.applicationTemplate) {
                        var templateLabel = domConstruct.create("span");
                        templateLabel.innerHTML = "(" + item.applicationTemplate.name.escape() + ")";
                        result.appendChild(templateLabel);
                    }
                }
            }
            return result;
        },

        /**
         *
         */
        applicationTemplateProcessLinkFormatter: function(item) {
            var result = domConstruct.create("div");
            var link = domConstruct.create("a", {}, result);

            link.innerHTML = item.name.escape();
            link.className = "actionsLink";
            link.href = "#applicationProcess/"+item.id+"/"+(item.version || "-1");

            return result;
        },

        /**
         *
         */
        genericProcessLinkFormatter: function(item) {
            var result = "";
            if (item) {
                if (!item.security || item.security.read) {
                    result = document.createElement("a");
                    result.innerHTML = item.name.escape();
                    result.href = "#process/"+item.id+"/"+(item.version || "-1");
                }
                else {
                    result = item.name.escape();
                }
            }
            return result;
        },

        /**
         *
         */
        snapshotLinkFormatter: function(item) {
            var result = domConstruct.create("div");
            if (item) {
                domConstruct.create("a", {
                    "innerHTML": item.name.escape(),
                    "class": "actionsLink",
                    "href": "#snapshot/" + item.id
                }, result);

                if (item.versionsLocked || item.configLocked) {
                    domConstruct.create("span", {
                        "innerHTML": i18n("(Locked)")
                    }, result);
                }
            }
            return result;
        },

        /**
         *
         */
        componentLinkFormatter: function(item) {
            var result = "";
            if (item) {
                if (item.deleted) {
                    result = document.createElement("div");
                    result.innerHTML = i18n("%s (Deleted)", item.name.escape());
                }
                else if (!item.security || item.security.read) {
                    result = document.createElement("a");
                    result.innerHTML = item.name.escape();
                    result.href = "#component/" + item.id;
                }
                else {
                    result = document.createElement("div");
                    result.innerHTML = item.name.escape();
                }
            }
            return result;
        },

        /**
         *
         */
        componentTemplateLinkFormatter: function(item) {
            var result = "";
            if (item) {
                if (!item.security || item.security.read) {
                    result = document.createElement("a");
                    result.innerHTML = item.name.escape();
                    result.href = "#componentTemplate/"+item.id+"/"+item.version;
                }
                else {
                    result = item.name.escape();
                }
            }
            return result;
        },

        /**
         *
         */
        componentProcessLinkFormatter: function(item) {
            var result = document.createElement("div");
            if (item) {
                var componentProcessLink = document.createElement("a");
                componentProcessLink.className = "actionsLink";
                componentProcessLink.innerHTML = item.name.escape();
                componentProcessLink.href = "#componentProcess/"+item.id+"/"+(item.version || "-1");

                result.appendChild(componentProcessLink);

                if (item.componentTemplate) {
                    var templateLabel = document.createElement("span");
                    templateLabel.innerHTML = "(" + item.componentTemplate.name.escape() + ")";
                    result.appendChild(templateLabel);
                }
            }
            return result;
        },

        /**
         *
         */
        componentTemplateProcessLinkFormatter: function(item) {
            var result = document.createElement("a");
            if (item) {
                result.innerHTML = item.name.escape();
                result.href = "#componentProcess/"+item.id+"/"+(item.version || "-1");
            }
            return result;
        },

        /**
         *
         */
        versionLinkFormatter: function(item, onClick) {
            var result = document.createElement("div");
            if (item) {
                if (!item.component || (!item.component.security || item.component.security.read)) {
                    var versionLink = domConstruct.create("a", {
                        innerHTML: item.name.escape(),
                        href: "#version/" + item.id,
                        className: "linkPointer"
                    }, result);
                    if (onClick) {
                        on(versionLink, "click", function(evt) {
                            onClick(evt);
                        });
                    }
                }
                else {
                    domConstruct.create("span", {
                        "innerHTML": name
                    }, result);
                }

                if (item.archived) {
                    domConstruct.create("span", {
                        "innerHTML": i18n(" (archived)"),
                        "class": "actionsLink"
                    }, result);
                }
            }
            return result;
        },

        versionPopupFormatter: function(versions, skipFirst, viewAllClick) {
            var self = this;
            var result = domConstruct.create("div", {
                className: "inventory-popup-contents"
            });
            var limit = skipFirst ? 6 : 5;
            array.forEach(versions, function(item, i) {
                if (!skipFirst && i < limit) {
                    var version = item.version || item;
                    var versionLink = self.versionLinkFormatter(version);
                    domStyle.set(versionLink, "display", "block");
                    result.appendChild(versionLink);
                }
                else {
                    skipFirst = false;
                }
            });
            if (viewAllClick) {
                var viewAllLink = domConstruct.create("a", {
                    innerHTML: versions.length > 5 ? i18n("%s More...", versions.length - 5) : i18n("View All"),
                    className: "linkPointer",
                    style: "display: block;"
                }, result);
                viewAllClick(viewAllLink);
            }
            return result;
        },

        moreVersionsLinkFormatter: function(quantity, attachPoint) {
            return domConstruct.create("a", {
                innerHTML: i18n("(+ %s more)", quantity),
                title: i18n("Click to view all"),
                className: "linkPointer",
                style: "margin-left: 5px;"
            }, attachPoint);
        },

        /**
         *
         */
        versionTypeFormatter: function(item) {
            var result = domConstruct.create("div");
            if (item.type) {
                var type = item.type;
                switch (type) {
                    case "FULL":
                        type = i18n("Full");
                        break;
                    case "INCREMENTAL":
                        type = i18n("Incremental");
                        break;
                    default:
                }
                domConstruct.create("span", {
                    innerHTML: type
                }, result);
            }
            return result;
        },

        inventoryGridColumnsFormatter: function(showVersionPopup, callback, showType, showSnapshotsAndPropsVersions) {
            var self = this;
            var grid = [];
            if (showVersionPopup) {
                grid = [{
                    name: i18n("Component"),
                    orderField: "component",
                    filterField: "component",
                    filterType: "text",
                    getRawValue: function(item) {
                        return item.component.name;
                    },
                    formatter: function(item) {
                        return self.componentLinkFormatter(item.component);
                    }
                }];
            }
            grid = grid.concat([{
                name: i18n("Version"),
                orderField: "version",
                filterField: "version",
                filterType: "text",
                getRawValue: function(item) {
                    return item.version.name;
                },
                formatter: function(item, result, cell) {
                    var results = domConstruct.create("div");
                    var versionLink = self.versionLinkFormatter(item.version, callback);
                    results.appendChild(versionLink);

                    if (showVersionPopup) {
                        domClass.add(versionLink, "inlineBlock");
                        showVersionPopup(item, item.additionalVersions, results, cell);
                    }
                    return results;
                }
            }, {
                name: i18n("Date Deployed"),
                orderField: "date",
                filterField: "date",
                filterType: "date",
                getRawValue: function(item) {
                    return item.date;
                },
                formatter: function(item) {
                    return util.dateFormatShort(item.date);
                }
            }]);
            if (showType) {
                grid = grid.concat([{
                    name: i18n("Type"),
                    formatter: function(item) {
                        return self.versionTypeFormatter(item.version);
                    }
                }]);
            }
            if (showSnapshotsAndPropsVersions) {
                grid = grid.concat([{
                    name: i18n("Snapshot"),
                    orderField: "snapshot",
                    filterField: "snapshot",
                    filterType: "text",
                    getRawValue: function(item) {
                        var result = "";
                            if (item.snapshot) {
                            result = item.snapshot.name;
                        }
                        return result;
                    },
                    formatter: function(item) {
                        return self.snapshotLinkFormatter(item.snapshot);
                    }
                }, {
                    name: i18n("Properties"),
                    formatter: function(item) {
                        var result = document.createElement("a");

                        if (item.propVersion !== undefined) {
                            result.innerHTML = i18n("Version %s", item.propVersion);
                            result.href = "#environmentPropSheet/" + item.environment.id + "/" + item.component.id + "/" + item.propVersion;
                            if (callback) {
                                on(result, "click", function() {
                                    callback();
                                });
                            }
                        }

                        return result;
                    }
                }, {
                    name: i18n("Status"),
                    orderField: "status",
                    filterField: "status",
                    filterType: "text",
                    getRawValue: function(item) {
                        return item.status.name;
                    },
                    formatter: function(item, value, cell) {
                        return self.statusFormatter(item.status, value, cell);
                    }
                }]);
            }
            grid = grid.concat([{
                name: i18n("Compliancy"),
                field: "status",
                formatter: function(item, value, cell) {
                    var desired = item.compliancy.desiredCount;
                    var missing = item.compliancy.missingCount;
                    var correct = item.compliancy.correctCount;

                    var versions = item.additionalVersions;
                    if (versions && !showType) {
                        array.forEach(versions, function(version) {
                            if (version.compliancy) {
                                var comp = version.compliancy;
                                desired += comp.desiredCount;
                                missing += comp.missingCount;
                                correct += comp.correctCount;
                            }
                        });
                    }

                    var result = "";
                    if (desired === correct) {
                        result = i18n("Compliant (%s/%s)", String(correct), String(desired));
                        domClass.add(cell, "success-state-color");
                    }
                    else {
                        result = i18n("Noncompliant (%s/%s)", String(correct), String(desired));
                        domClass.add(cell, "failed-state-color");
                    }
                    cell.style.textAlign = "center";

                    if (!showType) {
                        var resultContainer = domConstruct.create("div", {
                            className: "inlineBlock environment-compliancy"
                        });
                        var successWidth = (correct / desired) * 100;
                        var failedWidth = 100 - successWidth;
                        domConstruct.create("div", {
                            className: "successMeter success-state-color",
                            style: {
                                width: successWidth + "%"
                            }
                        }, resultContainer);
                        domConstruct.create("div", {
                            className: "failMeter failed-state-color",
                            style: {
                                width: failedWidth + "%"
                            }
                        }, resultContainer);
                        domConstruct.create("span", {
                            innerHTML: result
                        }, resultContainer);
                        result = resultContainer;
                    }
                    return result;
                }
            }, {
                name: i18n("Actions"),
                formatter: function(item) {
                    var result = "";
                    if (item.deploymentRequestId) {
                        result = document.createElement("a");
                        result.innerHTML = i18n("View Request");
                        result.href = "#deploymentRequest/" + item.deploymentRequestId;
                        if (callback) {
                            on(result, "click", function() {
                                callback();
                            });
                        }
                    }
                    return result;
                }
            }]);
            return grid;
        },

        /**
         *
         */
        resourceLinkFormatter: function(item) {
            var result = document.createElement("div");
            if (item) {
                domConstruct.place(this.getResourceIcon(item), result);

                var readOnly = item.security && !item.security.read;
                if (item.role && item.role.name === "Agent Placeholder") {
                    readOnly = true;
                }

                var nameNode = this.resourceNameFormatter(item);

                if (readOnly) {
                    result.appendChild(nameNode);
                }
                else {
                    var resourceLink = document.createElement("a");
                    resourceLink.appendChild(nameNode);
                    resourceLink.href = "#resource/" + item.id;
                    result.appendChild(resourceLink);
                }
            }

            var isComponent = false;
            if (item.role && item.role.specialType && item.role.specialType === "COMPONENT") {
                isComponent = true;
            }

            if (item.agent || item.agentPool || item.prototype || isComponent) {
                domConstruct.place(this.resourceParentFormatter(item), result);
            }

            return result;
        },

        /**
         * item: Resource to display, with option of showing tooltip
         */
        resourceNonLinkFormatter: function(item, showTooltip) {
            var result = document.createElement("div");
            if (item) {
                domConstruct.place(this.getResourceIcon(item), result);
                domConstruct.place(this.resourceNameFormatter(item), result);
                if (showTooltip && item.description) {
                    on(result, mouse.enter, function() {
                        Tooltip.show(util.escape(item.description), this);
                    });
                    on(result, mouse.leave, function() {
                        Tooltip.hide(this);
                    });
                }
            }

            return result;
        },

        /**
         * Generates a non-link DOM node just showing a resource's name (or component tag if
         * relevant)
         */
        resourceNameFormatter: function(item) {
            var nameNode;
            if (item.componentTag) {
                var componentTagDisplay = new TagDisplay({
                    readOnly: true,
                    tags: [item.componentTag],
                    style: {
                        marginLeft: "-15px"
                    }
                });
                nameNode = componentTagDisplay.domNode;
            }
            else {
                nameNode = domConstruct.create("span", {
                    innerHTML: item.name.escape()
                });
            }

            return nameNode;
        },

        /**
         * Generates a non-link DOM node just showing a resource's tag
         */
        tagNameFormatter: function(item) {
            var resourceTagDisplay = new TagDisplay({
                readOnly: true,
                tags: [item],
                style: {
                    marginLeft: "-15px"
                }
            });

            return resourceTagDisplay.domNode;
        },

        resourcePathFormatter: function(item) {
            var result = document.createElement("div");
            if (item) {
                var readOnly = item.security && !item.security.read;
                if (item.role && item.role.name === "Agent Placeholder") {
                    readOnly = true;
                }

                if (readOnly) {
                    domConstruct.create("span", {
                        innerHTML: item.path.replace(/\//g, " / ").escape()
                    }, result);
                }
                else {
                    var resourceLink = document.createElement("a");
                    resourceLink.innerHTML = item.path.replace(/\//g, " / ").escape();
                    resourceLink.href = "#resource/" + item.id;
                    result.appendChild(resourceLink);
                }
            }

            if (item.agent || item.agentPool || item.prototype) {
                domConstruct.place(this.resourceParentFormatter(item), result);
            }

            return result;
        },

        /**
         * Show a link to a resource, but also include its full hierarchy path with links
         * to the parent resources as well
         */
        resourceLinkFormatterWithPath: function(item) {
            var result = document.createElement("div");
            if (item) {
                domConstruct.place(this.getResourceIcon(item), result);

                if (!item.security || item.security.read) {
                    var resourceLink = document.createElement("a");
                    resourceLink.innerHTML = item.name.escape();
                    resourceLink.href = "#resource/" + item.id;
                    result.appendChild(resourceLink);

                    array.forEach(item.roles, function(role) {
                        var roleLabel = document.createElement("div");
                        roleLabel.innerHTML = role.name.escape();
                        roleLabel.style.backgroundColor = role.color;
                        roleLabel.className = "roleLabel";
                        result.appendChild(roleLabel);
                    });
                }
                else {
                    domConstruct.create("span", {
                        "innerHTML": item.name.escape()
                    }, result);
                }

                if (item.parent) {
                    var parentDom = this.resourceLinkFormatterWithPath(item.parent);

                    domClass.add(parentDom, "inlineBlock");

                    var slashDom = domConstruct.create("span", {
                        "innerHTML": "&nbsp;/&nbsp;"
                    });
                    domConstruct.place(slashDom, result, "first");
                    domConstruct.place(parentDom, result, "first");
                }
            }

            if (item.agent || item.agentPool || item.prototype) {
                domConstruct.place(this.resourceParentFormatter(item), result);
            }

            return result;
        },

        /**
         * Generates display of the versions currently in a resource's inventory, and returns a div
         * containing the generated DOM nodes.
         *
         *          item: Object representing the resource, including a "versions" array
         *   attachPoint: DOM node which will contain the content, for event handling
         * linkToVersion: Whether the version should be shown as a link or simply text
         */
        resourceInventoryFormatter: function(item, attachPoint, linkToVersion) {
            var self = this;
            var results = domConstruct.create("div");
            var versions = item.versions || item.version;

            var createLink = function(version, attachPoint, inlineBlock) {
                var showLink = !item.component || (!item.component.security || item.component.security.read);
                showLink = showLink && linkToVersion;

                var innerHTML = version.name.escape();

                if (version.archived) {
                    innerHTML += i18n(" %s (archived)", version.name.escape());
                }
                domConstruct.create(showLink ? "a" : "div", {
                    innerHTML: innerHTML,
                    className: showLink ? "linkPointer" : "",
                    href: showLink ? "#version/" + version.id : undefined,
                    style: "display: " + (inlineBlock ? "inline-block;" : "block;")
                }, attachPoint);
            };

            if (versions && Array.isArray(versions)) {
                var firstElement = versions[0];
                if (firstElement) {
                    createLink(firstElement, results, true);
                }

                if (versions.length > 1) {
                    var displayTable = function(link) {
                        on(link, "click", function() {
                            var versionDialog = new Dialog({
                                title: i18n("Inventory for %s", item.name),
                                closable: true,
                                draggable: true
                            });

                            var gridLayout = [{
                                name: i18n("Component"),
                                formatter: function(item) {
                                    var component = "";
                                    if (item.component) {
                                        component = self.componentLinkFormatter(item.component);
                                    }
                                    return component;
                                }
                            }, {
                                name: i18n("Version"),
                                formatter: function(item) {
                                    return self.versionLinkFormatter(item, function() {
                                        versionDialog.hide();
                                    });
                                }
                            }, {
                                name: i18n("Date Created"),
                                formatter: function(item) {
                                    return util.tableDateFormatter(null, item.created);
                                }
                            }, {
                                name: i18n("Type"),
                                formatter: function(item) {
                                    return self.versionTypeFormatter(item);
                                }
                            }];

                            var componentResourceTable = new TreeTable({
                                getData: function() {
                                    return item.versions || item.version;
                                },
                                serverSideProcessing: false,
                                hideExpandCollapse: true,
                                hideFooterLinks: true,
                                columns: gridLayout
                            });
                            componentResourceTable.placeAt(versionDialog.containerNode);

                            var closeButton = new Button({
                                label: i18n("Close"),
                                onClick: function() {
                                    versionDialog.hide();
                                }
                            }).placeAt(versionDialog.containerNode, "last");

                            domClass.add(closeButton.domNode, "underField");
                            versionDialog.show();
                        });
                    };

                    var moreLink = self.moreVersionsLinkFormatter(versions.length - 1, results);
                    displayTable(moreLink);

                    var enteredPopup = false;
                    var tooltip = new TooltipDialog({
                        content: self.versionPopupFormatter(versions, true, linkToVersion ? displayTable : null),
                        onMouseLeave: function() {
                            popup.close(tooltip);
                            enteredPopup = false;
                        },
                        className: "inventory-popup"
                    });
                    displayTable(tooltip.connectorNode);

                    on(moreLink, mouse.enter, function() {
                        popup.open({
                            popup: tooltip,
                            around: moreLink
                        });
                    });
                    var popupClose = function() {
                        popup.close(tooltip);
                    };
                    on(moreLink, "click", popupClose);
                    on(tooltip.domNode, "click", popupClose);
                    on(tooltip.connectorNode, "click", popupClose);
                    on(tooltip.domNode, mouse.enter, function() {
                        enteredPopup = true;
                    });
                    on(attachPoint, mouse.leave, function() {
                        setTimeout(function() {
                            if (!enteredPopup) {
                                popupClose();
                                enteredPopup = false;
                            }
                        }, 100);
                    });
                }
            }
            return results;
        },

        /**
         * Get a string containing the full path to the resource
         */
        getResourceNameRawValue: function(item) {
            var getValue;
            getValue = function(resource) {
                var result = resource.name;

                if (resource.parent) {
                    result = getValue(resource.parent) + "/" + result;
                }

                return result;
            };

            return getValue(item);
        },

        /**
         * Shows a parenthetical extra bit of information about a resource, such as its agent or
         * agent pool, or whether it's a prototype resource
         */
        resourceParentFormatter: function(item) {
            var self = this;
            var result = domConstruct.create("div", {
                "class": "inlineBlock"
            });

            var isComponent = item.role && item.role.specialType && item.role.specialType === "COMPONENT";
            var showAgent = item.agent && (!item.agent.security || item.agent.security.read);
            var showAgentPool = item.agentPool && (!item.agentPool.security || item.agentPool.security.read);
            var showPrototype = item.prototype;

            if (showAgent) {
                var agentContainer = domConstruct.create("a", {
                    "href": "#agent/" + item.agent.id,
                    "innerHTML": "&nbsp;&nbsp;" + i18n("(View Agent)")
                }, result);
            }
            else if (showAgentPool) {
                var agentPoolContainer = domConstruct.create("a", {
                    "href": "#agentPool/" + item.agentPool.id,
                    "innerHTML": "&nbsp;&nbsp;" + i18n("(View Agent Pool)")
                }, result);
            }
            else if (showPrototype) {
                domConstruct.create("span", {
                    "innerHTML": "&nbsp;&nbsp;" + i18n("(Prototype)")
                }, result);
            }
            else if (isComponent) {
                self.canGetComponent(item.role.id).then(function(canViewComponent){
                    if(canViewComponent){
                        var componentContainer = domConstruct.create("a", {
                            "href": "#componentResourceRole/" + item.role.id,
                            "innerHTML": "&nbsp;&nbsp;" + i18n("(View Component)")
                        }, result);
                    }
                });
            }

            return result;
        },

        canGetComponent: function(resourceRoleId) {
            var self = this;
            var deferred = new Deferred();
            self.getComponentIdFromResourceRoleId(resourceRoleId).then(function(response){
                if (response){
                    var url = bootstrap.restUrl + 'deploy/component/'+ response.componentId;
                     xhr.get({
                        url: url,
                        handleAs: "json",
                        load: function(data) {
                            deferred.resolve(true);
                        },
                        error: function(error) {
                            deferred.resolve(false);
                        }
                    });
                } else {
                    deferred.resolve(false);
                }
            });
            return deferred;
        },

        getComponentIdFromResourceRoleId: function(resourceRoleId){
            var deferred = new Deferred();
            var url = bootstrap.restUrl + 'resource/resourceRole/component/' + resourceRoleId;
            xhr.get({
               url: url,
               handleAs: "json",
               load: function(id) {
                   deferred.resolve(id);
               },
               error: function(error) {
                   deferred.resolve(false);
               }
           });
           return deferred;
        },

        getResourceIcon: function(item) {
            var iconClass;

            if (item.agent) {
                iconClass = "glyph-Glyph_database__ui-05";
            }
            else if (item.agentPool) {
                iconClass = "glyph-Glyph_database__ui-05";
            }
            else if (item.componentTag) {
                iconClass = "glyph-Glyph_component__ui-05";
            }
            else if (item.role) {
                if (item.role.specialType === "COMPONENT") {
                    iconClass = "glyph-Glyph_component__ui-05";
                }
                else if (item.role.specialType === "DYNAMIC_GROUP") {
                    iconClass = "glyph-Glyph_folder__ui-05";
                }
                else if (item.role.specialType === "AGENT_PLACEHOLDER") {
                    iconClass = "glyph-Glyph_database__ui-05";
                }
                else if (item.role.name.indexOf("WebSphere") > -1) {
                    iconClass = "websphere-icon";
                }
                else if (item.role.name.indexOf("zOSMFService") > -1) {
                    iconClass = "zosmfservice-icon";
                }
                else if (item.role.name.indexOf("zOSMFSoftwareInstance") > -1) {
                    iconClass = "zosmfsoftwareinstance-icon";
                }
                else {
                    iconClass = "glyph-Glyph_folder__ui-05";
                }
            }
            else {
                iconClass = "glyph-Glyph_folder__ui-05";
            }

            var result;
            if (iconClass) {
                result = this.createIcon(iconClass);
                domClass.add(result, "inline-table-icon");
            }
            else {
                result = domConstruct.create("span");
            }

            return result;
        },

        /**
         * Standard function to produce an icon with the appropriate class
         */
        createIcon: function(iconClass, altText, sheetClass) {
            var classString ="inlineBlock general-icon " + iconClass;
            if (!!sheetClass) {
                classString = "inlineBlock " + sheetClass + " " + iconClass;
            }

            var result = domConstruct.create("div", {
                "class": classString,
                "title": altText || ""
            });

            return result;
        },

        /**
         * A generic formatter to handle resource/agent status
         */
        resourceStatusFormatter: function(item, value, cell) {
            var resultDiv = document.createElement("div");
            resultDiv.style.textAlign = "center";

            // We can only show something interesting here if the resource points to an agent or pool
            if (item.status && (item.type === "agent" || item.type === "agentPool")) {
                resultDiv = formatters.agentStatusFormatter(item, value, cell);
            }
            else {
                domClass.add(cell, "statusNotApplicable");
            }

            return resultDiv;
        },

        /**
         * A generic formatter for agent status
         */
        agentStatusFormatter: function(item, value, cell) {
            var resultDiv = document.createElement("div");
            resultDiv.style.textAlign = "center";

            if (item.status === "ONLINE") {
                resultDiv.innerHTML = i18n("Online");
                domClass.add(cell, "connected-state-color");
            }
            else if (item.status === "CONNECTING") {
                resultDiv.innerHTML = i18n("Connecting");
                domClass.add(cell, "running-state-color");
            }
            else if (item.status === "UPGRADE_REQUIRED") {
                resultDiv.innerHTML = i18n("Upgrade Required");
                domClass.add(cell, "warning-state-color");
            }
            else if (item.status === "UPGRADE_RECOMMND") {
                resultDiv.innerHTML = i18n("Upgrade Recommended");
                domClass.add(cell, "running-state-color");
            }
            else if (item.status === "OFFLINE") {
                resultDiv.innerHTML = i18n("Offline");
                domClass.add(cell, "disconnected-state-color");
            }
            else if (item.status === "ERROR") {
                resultDiv.innerHTML = i18n("Error");
                domClass.add(cell, "disconnected-state-color");
            }
            else if (item.status === "INSTALLABLE") {
                resultDiv.innerHTML = i18n("Installable");
                domClass.add(cell, "installable-state-color");
            }
            else {
                resultDiv.innerHTML = i18n("N/A");
                domClass.add(cell, "gray-state-color");
            }

            return resultDiv;
        },

        /**
         *
         */
        agentLinkFormatter: function(item) {
            var result = document.createElement("div");
            if (item) {
                var agentLink = document.createElement("a");
                agentLink.innerHTML = item.name.escape();
                agentLink.href = "#agent/" + item.id;
                result.appendChild(agentLink);
            }

            return result;
        },

        /**
         *
         */
        relayLinkFormatter: function(item) {
            var result = document.createElement("div");
            if (item) {
                var relayLink = document.createElement("a");
                relayLink.innerHTML = item.name.escape();
                relayLink.href = "#relay/" + item.id;
                result.appendChild(relayLink);
            }

            return result;
        },

        /**
         *
         */
        agentPoolLinkFormatter: function(item) {
            var result = document.createElement("div");
            if (item) {
                var agentPoolLink = document.createElement("a");
                agentPoolLink.innerHTML = item.name.escape();
                agentPoolLink.href = "#agentPool/" + item.id;
                result.appendChild(agentPoolLink);
            }

            return result;
        },

        /**
         *
         */
        resourceRoleFormatter: function(item, value, cell) {
            var result = i18n("All");
            cell.style.textAlign = "center";
            if (item) {
                result = item.name.escape();
                cell.style.backgroundColor = item.color;
            }
            return result;
        },

        /**
         *
         */
        resourceRoleLinkFormatter: function(item, value, cell) {
            cell.style.backgroundColor = item.color;

            var result = document.createElement("a");
            if (item) {
                result.innerHTML = item.name.escape();
                result.href = "#resourceRole/" + item.id;
            }
            return result;
        },

        /**
         *
         */
        resourceTemplateLinkFormatter: function(item) {
            var result = domConstruct.create("div");

            if (item) {
                var templateLink = domConstruct.create("a", {
                    innerHTML: item.name.escape(),
                    href: "#resourceTemplate/" + item.id
                }, result);
            }

            return result;
        },

        /**
         *
         */
        processLinkFormatter: function(item) {
            var result = document.createElement("div");
            if (item) {
                var processLink = document.createElement("a");
                processLink.innerHTML = item.name.escape();
                processLink.href = "#process/"+item.id+"/"+item.version;

                result.appendChild(processLink);
            }

            return result;
        },

        requestStatusFormatter: function(item, value, cell) {
            var result = i18n("Unknown");
            cell.style.textAlign = "center";
            if (item.failed) {
                domClass.add(cell, "failed-state-color");
                result = i18n("Failed");
            }
            else if (item.rootTrace || item.state) {
                // The request object may have a rootTrace, which we'll use if available. Otherwise,
                // all request objects should have their workflow state and result as direct
                // properties from associated workflow metadata.
                result = this.activityStatusFormatter(item.rootTrace || item, value, cell);
            }
            else if (!item.traceId && item.result === "FAULTED") {
                domClass.add(cell, "failed-state-color");
                result = i18n("Could Not Start");
            }
            else if (item.approval) {
                result = this.approvalStatusFormatter(item.approval, value, cell);
            }
            else if(item.status){
                result = this.applicationProcessStatusFormatter(item.status, value, cell);
            }
            else if (item.entry && !item.entry.fired) {
                domClass.add(cell, "gray-state-color");
                result = i18n("Scheduled");
            }
            else if (item.entry && item.entry.fired) {
                //if entry was fired then it was cancelled
                domClass.add(cell, "failed-state-color");
                result = i18n("Cancelled");
            }

            return result;
        },

        /**
         * This should be used when a application process status needs to be displayed.
         */
        applicationProcessStatusFormatter: function(item, value, cell) {
            var result = i18n("Unknown");
            cell.style.textAlign = "center";
            if (item === "FAILURE") {
                result = i18n("Failed");
                domClass.add(cell, "failed-state-color");
            }
            else if (item === "RUNNING") {
                result = i18n("Executing");
                domClass.add(cell, "running-state-color");
            }
            else if (item === "SUCCESS") {
                result = i18n("Success");
                domClass.add(cell, "success-state-color");
            }
            else if (item === "SCHEDULED") {
                result = i18n("Scheduled");
                domClass.add(cell, "gray-state-color");
            }
            else if (item === "CANCELLED") {
                result = i18n("Cancelled");
                domClass.add(cell, "grey-state-color");
            }
            else if (item === "AWAITING_APPROVAL") {
                result = i18n("Awaiting Approval");
                domClass.add(cell, "grey-state-color");
            }
            else if (item === "APPROVAL_REJECTED") {
                result = i18n("Approval Rejected");
                domClass.add(cell, "failed-state-color");
            }

            return result;
        },

        /**
         *
         */
        sourceConfigStatusFormatter: function(item, value, cell) {
            var result = i18n("Unknown");
            cell.style.textAlign = "center";
            if (item.status === "FAILURE") {
                result = i18n("Failed");
                domClass.add(cell, "failed-state-color");
            }
            else if (item.status === "EXECUTING") {
                result = i18n("Executing");
                domClass.add(cell, "running-state-color");
            }
            else if (item.status === "SUCCESS") {
                result = i18n("Success");
                domClass.add(cell, "success-state-color");
            }
            else if (item.status === "WAITING") {
                result = i18n("Waiting");
                domClass.add(cell, "running-state-color");
            }
            else if (item.status === "CANCELLED") {
                result = i18n("Cancelled");
                domClass.add(cell, "grey-state-color");
            }

            return result;
        },

        /**
         *
         */
        activityStatusFormatter: function(item, value, cell) {
            var status = item.state;
            var result = item.result;
            var textResult = "";

            var failureCaught = util.getNamedProperty(item.properties, "_SYS_FAILURE_CAUGHT");
            if (failureCaught !== undefined && failureCaught.value === "true") {
                result = "FAULTED";
            }

            cell.style.textAlign = "center";
            if (status === "CLOSED" && result === "SUCCEEDED") {
                if (item.metadata && item.metadata.notNeeded) {
                    domClass.add(cell, "gray-state-color");
                    textResult = i18n("Not Needed");
                }
                else {
                    domClass.add(cell, "success-state-color");
                    textResult = i18n("Success");
                }
            }
            else if (status === "CLOSED" && result === "CANCELED") {
                domClass.add(cell, "gray-state-color");
                textResult = i18n("Canceled");
            }
            else if (status === "EXECUTING") {
                if (item.paused) {
                    domClass.add(cell, "gray-state-color");
                    textResult = i18n("Paused");
                }
                else {
                    domClass.add(cell, "running-state-color");
                    textResult = i18n("Running");
                }
            }
            else if ((status === "CLOSED" && result === "FAULTED") || status === "FAULTING") {
                domClass.add(cell, "failed-state-color");
                textResult = i18n("Failed");
            }

            return textResult;
        },

        /**
         *
         */
        approvalStatusFormatter: function(item, value, cell) {
            var textResult = "";
            cell.style.textAlign = "center";

            if (item.failed) {
                textResult = i18n("Approval Failed");
                domClass.add(cell, "failed-state-color");
            }
            else if (item.finished) {
                textResult = i18n("Approved");
                domClass.add(cell, "success-state-color");
            }
            else if (item.cancelled) {
                textResult = i18n("Approval Cancelled");
                domClass.add(cell, "gray-state-color");
            }
            else {
                textResult = i18n("Approval In Progress");
                domClass.add(cell, "running-state-color");
            }

            return textResult;
        },

        /**
         *
         */
        statusFormatter: function(item, value, cell) {
            var result = "";
            if (item) {
                result = formatters.statusTranslator(item.name);

                cell.style.backgroundColor = item.color;
                cell.style.textAlign = "center";
                if (util.isDarkColor(item.color)) {
                    cell.style.color = "#FFF";
                }
                else {
                    cell.style.color = "#000";
                }
            }

            return result;
        },

        /**
         * Formats a status condition in the drop down menu of environmentConditions.js
         * As well as in the statuses tables in settings
         **/
        conditionFormatter: function(item) {
            var result = "";
            if (item) {
                result = {
                    //NOTE: we left this inline because there is no nice way to abstract colors
                    "backgroundColor": item.color
                };
                domClass.add(item, "statusBox");
                if (util.isDarkColor(item.color)) {
                    result.color = "#FFF";
                }
            }
            return result;
        },

        /**
         * Formats the status when it is attached to an environmentCondition.js
         **/
        conditionAttachBoxFormatter: function(item) {
            var result = "";
            if (item) {
                result = {
                    "backgroundColor": item.color
                };
                if (util.isDarkColor(item.color)) {
                    result.color = "#FFF";
                }
            }
            return result;
        },

        /**
         * Handles the x button that appears in environmentCondition.js
         **/
        conditionXButtonFormatter: function(statusBox, status) {
            var result = "";
            if (status && statusBox) {
                result = domConstruct.create("div", {
                    "class": "linkPointer environmentStatusButton"
                }, statusBox);
            }
            return result;
        },

        statusTranslator: function(value) {
            return (value === "Active" ? i18n("Active") : value);
        },

        /**
         *
         */
        artifactFormatter: function(item) {
            var result = document.createElement("div", {
                "class": "inlineBlock"
            });
            if (item) {
                domConstruct.place(this.getArtifactIcon(item), result);
            }
            domConstruct.create("span", {
                innerHTML: item.name.escape()
            }, result);
            return result;
        },

        booleanTranslator: function(item) {
            var result = null;
            if (item) {
                result = i18n("true");
            }
            else {
                result = i18n("false");
            }

            return result;
        },

        zosArtifactFormatter: function(item, baseUrl) {
            var result = document.createElement("div", {
                "class": "inlineBlock"
            });

            if (item.userAttributes &&
                item.userAttributes.zOSResourceInputsKey &&
                item.userAttributes.zOSResourceInputsKey.url) {

                var inputsUrl = item.userAttributes.zOSResourceInputsKey.url;
                if (inputsUrl.trim().toUpperCase().indexOf("HTTP") !== 0 && baseUrl) {
                    inputsUrl = baseUrl + inputsUrl;
                }
                domConstruct.create("a", {
                    "class": "linkPointer",
                    "href" : inputsUrl,
                    "target" : "_blank",
                    "innerHTML": item.name.escape()}, result);
                return result;
            }

            if (item) {
                domConstruct.place(this.getNoIcon(item), result);
            }
            domConstruct.create("span", {
                innerHTML: item.name.escape()
            }, result);
            return result;
        },
        getNoIcon: function(item) {
            var iconClass = "dijitIcon dijitTreeIcon dijitLeaf";
            var result = this.createIcon(iconClass);
            result = domConstruct.create("span");
            return result;
        },

        /**
         *
         */
        getArtifactIcon: function(item) {
            var iconClass;
            if (item.type === "file") {
                iconClass = "artifactIcon dijitIcon dijitTreeIcon dijitLeaf";
            }
            else {
                iconClass = "folderIcon";
            }

            var result;
            if (iconClass) {
                result = this.createIcon(iconClass);
            }
            else {
                result = domConstruct.create("span");
            }
            return result;
        }
    };
});

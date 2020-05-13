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
define(["dojo/_base/kernel",
        "dojox/html/entities"],
function(dojo,
         entities) {
    dojo.provide("deploy.widgets.navigation.Components");

    config.data.tabSets.push({
        id: "components",
        hashPattern: ["tab"],
        breadcrumbs: ["home", "topLevelTab"],
        selectedTopLevelTab: "components",

        defaultTab: "components",
        tabs: [{
            id: "components",
            label: i18n("Components"),
            view: "deploy/views/component/componentList"
        },{
            id: "templates",
            label: i18n("Templates"),
            view: "deploy/views/componentTemplate/componentTemplateList"
        }]
    });

    //this is a "transient tab" such that #componentResourceRole/{role_id}
    //will be redirected to #component/{component_id} tab after a REST call
    config.data.tabSets.push({
        id: "componentResourceRole",
        hashPattern: ["componentResourceRole", "tab"],
        selectedTopLevelTab: "components",
        defaultTab: "component",
        tabs: [{
            id: "component",
            label: i18n("Component"),
            view: "deploy/views/component/componentDashboard"
        }],
        stateCalls: [{
            targetAppStateEntry: "componentResourceRole",
            getUrl: function(appStateTargets, newAppState) {
                return bootstrap.restUrl+"resource/resourceRole/component/"+appStateTargets.componentResourceRole;
            },
            postGet: function(data, newAppState) {
                var navHash = "component/" + data.componentId;
                navBar.setHash(navHash);
            }
        }]
    });

    config.data.tabSets.push({
        id: "component",
        hashPattern: ["component", "tab"],
        breadcrumbs: ["home", "topLevelTab", "component"],
        selectedTopLevelTab: "components",

        getDetailTitle: function() {
            return i18n("Component: %s", appState.component.name.escape());
        },
        getDetailFields: function() {
            var detailFields = [{
                label: i18n("Created By"),
                value: entities.encode(appState.component.user)
            },{
                label: i18n("Created On"),
                value: util.dateFormatShort(appState.component.created)
            }];

            if (appState.component.template) {
                var template = appState.component.template;

                if (appState.component.hasTemplateRead) {
                    detailFields.push({
                        label: i18n("Template"),
                        value: "<a href=\"#componentTemplate/"+template.id+"/"+template.version+"\">"+entities.encode(template.name)+"</a>"
                    });
                }
                else {
                    detailFields.push({
                        label: i18n("Template"),
                        value: entities.encode(template.name)
                    });
                }
            }

            if (appState.component.applications.length > 0) {
                var applicationLinks = "";
                dojo.forEach(appState.component.applications, function(application) {
                    if (applicationLinks.length > 0) {
                        applicationLinks += ", ";
                    }

                    if (!application.active) {
                        applicationLinks += "<i>";
                    }
                    applicationLinks += "<a href=\"#application/"+application.id+"\">"+entities.encode(application.name)+"</a>";
                    if (!application.active) {
                        applicationLinks += i18n(" (Inactive)")+"</i>";
                    }
                });
                detailFields.push({
                    label: i18n("Used By"),
                    value: applicationLinks
                });
            }

            return detailFields;
        },
        getPageAlerts: function() {
            var alerts = [];

            dojo.forEach(appState.component.sourceConfigAlerts, function(alert) {
                alerts.push({
                    className: "errorText",
                    text: entities.encode(alert)
                });
            });

            if (appState.component.integrationFailed) {
                alerts.push({
                    className: "errorText",
                    text: i18n("A version import failed. Check the component's configuration for more details.")
                });
            }

            if (appState.component.sourceConfigPluginNameMatchesPlugin === false) {
                alerts.push({
                    className: "errorText",
                    text: i18n("The source configuration was modified on this component's template. Please make any" +
                        " necessary updates to this component's configuration and save.  You will not be able to do" +
                        " version imports for this component until you reconfigure.")
                });
            }

            return alerts;
        },
        getDetailDescription: function() {
            return entities.encode(appState.component.description);
        },

        stateCalls: [{
            targetAppStateEntry: "component",
            getUrl: function(appStateTargets, newAppState) {
                return bootstrap.restUrl+"deploy/component/"+appStateTargets.component;
            }
        }],

        defaultTab: "dashboard",
        tabs: [{
            id: "dashboard",
            label: i18n("Dashboard"),
            view: "deploy/views/component/componentDashboard"
        },{
            id:"usage",
            label: i18n("Usage"),
            view: "deploy/views/component/versionHistoryManager"
        },{
            id: "configuration",
            label: i18n("Configuration"),
            className: "configurationTab",
            view: "deploy/views/component/componentConfiguration"
        },{
            id: "calendar",
            label: i18n("Calendar"),
            view: "deploy/views/component/componentCalendar"
        },{
            id: "versions",
            label: i18n("Versions"),
            view: "deploy/views/component/componentVersions"
        },{
            id: "processes",
            label: i18n("Processes"),
            view: "deploy/views/component/componentProcesses"
        },{
            id: "changes",
            label: i18n("Changes"),
            view: "deploy/views/component/componentChangelog"
        }]
    });

    config.data.tabSets.push({
        id: "componentTemplate",
        hashPattern: ["componentTemplate", "componentTemplateVersion", "tab", "navData"],
        breadcrumbs: ["home", "componentTemplates", "componentTemplate"],
        selectedTopLevelTab: "components",

        getDetailTitle: function() {
            return i18n("Component Template: %s", appState.componentTemplate.name.escape());
        },
        getDetailFields: function() {
            var detailFields = [];

            detailFields.push({
                label: i18n("Version"),
                value: entities.encode(i18n("%s of %s", appState.componentTemplate.version, appState.componentTemplate.versionCount))
            });

            detailFields.push({
                label: "",
                value: util.vc.generateVersionControls(appState.componentTemplate, function(version) {
                    return "componentTemplate/"+appState.componentTemplate.id+"/"+version;
                })
            });

            return detailFields;
        },
        getDetailDescription: function() {
            return entities.encode(appState.componentTemplate.description);
        },

        stateCalls: [{
            targetAppStateEntry: "componentTemplate",
            getUrl: function(appStateTargets, newAppState) {
                newAppState.componentTemplateVersion = {
                    id: appStateTargets.componentTemplateVersion
                };

                return bootstrap.restUrl+"deploy/componentTemplate/"+appStateTargets.componentTemplate+"/"+appStateTargets.componentTemplateVersion;
            }
        },{
            getUrl: function(appStateTargets, newAppState) {
                newAppState.goBack = {
                    id: appStateTargets.navData
                };
            }
        }],

        defaultTab: "components",
        tabs: [{
            id: "components",
            label: i18n("Components"),
            view: "deploy/views/componentTemplate/componentTemplateComponents"
        },{
            id: "configuration",
            label: i18n("Configuration"),
            className: "configurationTab",
            view: "deploy/views/componentTemplate/componentTemplateConfiguration"
        },{
            id: "processes",
            label: i18n("Processes"),
            view: "deploy/views/componentTemplate/componentTemplateProcesses"
        },{
            id: "changes",
            label: i18n("Changes"),
            view: "deploy/views/componentTemplate/componentTemplateChangelog"
        }]
    });

    require(["js/webext/widgets/Link", "js/webext/widgets/Dialog",
             "js/webext/widgets/ColumnForm", "dojo/_base/url",
             "js/webext/widgets/RestSelect", "dojo/dom-construct",
             "dojo/_base/xhr"],
            function(Link, Dialog, ColumnForm, url, RestSelect, domConstruct, xhr) {
                config.data.tabSets.push({
                    id: "version",
                    hashPattern: ["version", "tab"],
                    breadcrumbs: ["home", "topLevelTab", "component", "versions", "version"],
                    selectedTopLevelTab: "components",

                    getDetailTitle: function() {
                        return i18n("Version: %s",entities.encode(appState.version.name));
                    },
                    getDetailFields: function() {
                        var detailProperties = [];

                        if (appState.version.creator) {
                            detailProperties.push({
                                label: i18n("Created By"),
                                value: entities.encode(appState.version.creator)
                            });
                        }

                        detailProperties.push({
                            label: i18n("Created On"),
                            value: util.dateFormatShort(appState.version.created)
                        });

                        if (appState.component.componentType === "ZOS") {
                            var repoType = util.getNamedProperty(appState.version.properties, "ucd.repository.type");
                            var repoTypeValue = "";
                            if (repoType) {
                                if (repoType.value === "HFS") {
                                    repoTypeValue = repoType.value;
                                } else if (repoType.value === "CODESTATION") {
                                    repoTypeValue = "CodeStation";
                                } else {
                                    repoTypeValue = "UNKNOWN";
                                }
                            } else {
                                repoTypeValue = "HFS";
                            }

                            detailProperties.push({
                                label: i18n("Repository Type"),
                                value: entities.encode(repoTypeValue)
                            });

                            var isMergedVersion = util.getNamedProperty(appState.version.properties, "ucd.version.ismerged");
                            if (isMergedVersion) {
                                detailProperties.push({
                                    label: i18n("Merged version"),
                                    value: isMergedVersion.value
                                });
                            }
                        }

                        if(appState.version.propSheets) {
                            var backlinks = util.getNamedProperty(appState.version.propSheets, "backlinks");
                            if( backlinks ) {
                                backlinks.properties.forEach(function(item) {
                                    var href = item.value;

                                    // if link does not contain a scheme then we need to default to http
                                    // otherwise the link we put into the page will resolve as a relative link
                                    var scheme = (new url(href)).scheme;
                                    if( !scheme ) {
                                        href = "http://" + href;
                                    }

                                    detailProperties.push({
                                        value: "<a href=\"" + href + "\" target=\"_blank\">" + entities.encode(item.name) + "</a>"
                                    });
                                });
                            }
                        }

                        if (!!appState.component.sourceConfigPlugin) {
                            var sourceType = appState.component.sourceConfigPlugin.name;
                            var anthillUrl, buildLifeId, uBuildUrl;
                            if (sourceType === "AnthillPro") {
                                anthillUrl = util.getNamedPropertyValue(appState.component.properties, "AnthillComponentProperties/anthillUrl");
                                buildLifeId = appState.version.name;

                                detailProperties.push({
                                    value: "<a href=\""+anthillUrl+"/tasks/project/BuildLifeTasks/viewBuildLife?buildLifeId="+buildLifeId+"\" target=\"_blank\">"+i18n("View Build Life %s in Anthill", entities.encode(buildLifeId))+"</a>"
                                });
                            } else if (sourceType === "uBuild") {
                                uBuildUrl = util.getNamedPropertyValue(appState.component.properties, "uBuildComponentProperties/uBuildUrl");
                                buildLifeId = appState.version.name;

                                detailProperties.push({
                                    value: "<a href=\""+uBuildUrl+"/tasks/project/BuildLifeTasks/viewBuildLife?buildLifeId="+buildLifeId+"\" target=\"_blank\">"+i18n("View Build Life %s in uBuild", entities.encode(buildLifeId))+"</a>"
                                });
                            }
                        }

                        if (appState.component.extendedSecurity[security.component.manageVersions]) {
                            var addLink = new Link({
                                labelText: i18n("add"),
                                onClick: function(evt){
                                    var newLinkDlg = new Dialog({
                                        title: i18n("Add Link"),
                                        closable: true,
                                        draggable:true
                                    });

                                    this.form = new ColumnForm({
                                        submitUrl: bootstrap.restUrl+"deploy/version/"+appState.version.id+"/link/",
                                        postSubmit: function(data) {
                                            newLinkDlg.hide();
                                            newLinkDlg.destroy();
                                            navBar.setHash(navBar.recentHash, false, true);
                                        },
                                        onCancel: function() {
                                            newLinkDlg.hide();
                                            newLinkDlg.destroy();
                                        }
                                    });

                                    this.form.addField({
                                        name: "name",
                                        label: i18n("Name"),
                                        required: true,
                                        textDir: util.getBaseTextDir(),
                                        type: "Text"
                                    });
                                    this.form.addField({
                                        name: "url",
                                        label: i18n("URL"),
                                        required: true,
                                        type: "Text",
                                        bidiDynamicSTT: "URL",
                                        value: "<url>"
                                    });
                                    this.form.placeAt(newLinkDlg.containerNode);

                                    newLinkDlg.show();
                                }
                            });

                            var removeLink = new Link({
                                labelText: i18n("remove"),
                                "class": "margin5Left link",
                                onClick: function(evt){
                                    var delLinkDlg = new Dialog({
                                        title: i18n("Remove Link"),
                                        closable: true,
                                        draggable:true
                                    });
                                    this.form = new ColumnForm({
                                        saveLabel: i18n("Delete"),
                                        onSubmit: function(data) {
                                            xhr.del({
                                                url: bootstrap.restUrl+"deploy/version/"+appState.version.id+"/link/"+this.getValue("name"),
                                                handleAs: "json"
                                            });
                                        },
                                        postSubmit: function(data) {
                                            delLinkDlg.hide();
                                            delLinkDlg.destroy();
                                            navBar.setHash(navBar.recentHash, false, true);
                                        },
                                        addData: function(data) {
                                        },
                                        onCancel: function() {
                                            delLinkDlg.hide();
                                            delLinkDlg.destroy();
                                        }
                                    });

                                    this.form.addField({
                                        name: "name",
                                        label: i18n("Link"),
                                        required: true,
                                        type: "Select",
                                        widget: new RestSelect({
                                            restUrl: bootstrap.restUrl+"deploy/version/"+appState.version.id+"/link/",
                                            getValue: function(item) {
                                                return item.name;
                                            },
                                            allowNone: false
                                        })
                                    });

                                    this.form.placeAt(delLinkDlg.containerNode);

                                    delLinkDlg.show();
                                }
                            });

                            var node = domConstruct.create("div");
                            addLink.placeAt(node);
                            removeLink.placeAt(node);
                            detailProperties.push({
                                label: i18n("Links"),
                                value: node
                            });
                        }


                        return detailProperties;
                    },
                    getDetailDescription: function() {
                        return entities.encode(appState.version.description);
                    },

                    stateCalls: [{
                        targetAppStateEntry: "version",
                        getUrl: function(appStateTargets, newAppState) {
                            return bootstrap.restUrl+"deploy/version/"+appStateTargets.version;
                        },
                        stateCalls: [{
                            targetAppStateEntry: "component",
                            getUrl: function(appStateTargets, newAppState) {
                                return bootstrap.restUrl+"deploy/component/"+newAppState.version.component.id;
                            }
                        }]
                    }],

                    defaultTab: "main",
                    tabs: [{
                        id: "main",
                        label: i18n("Main"),
                        view: "deploy/views/version/versionMain"
                    },{
                        id: "configuration",
                        label: i18n("Configuration"),
                        className: "configurationTab",
                        view: "deploy/views/version/versionConfiguration"
                    },{
                        id: "history",
                        label: i18n("History"),
                        view: "deploy/views/version/versionHistory"
                    }]
                });
    });

    config.data.tabSets.push({
        id: "componentProcess",
        hashPattern: ["componentProcess", "componentProcessVersion", "tab", "navData"],
        breadcrumbs: ["home", "topLevelComponentsOrTemplates", "componentOrTemplate", "componentProcesses", "componentProcess"],
        selectedTopLevelTab: "components",

        // details moved into editor

        stateCalls: [{
            targetAppStateEntry: "componentProcess",
            getUrl: function(appStateTargets, newAppState) {
                newAppState.componentProcessVersion = {
                    id: appStateTargets.componentProcessVersion
                };
                return bootstrap.restUrl+"deploy/componentProcess/"+appStateTargets.componentProcess+"/"+appStateTargets.componentProcessVersion;
            },
            postGet: function(data, newAppState) {
                newAppState.component = data.component;
                newAppState.componentTemplate = data.componentTemplate;
            }
        },{
            getUrl: function(appStateTargets, newAppState) {
                newAppState.goBack = {
                    id: appStateTargets.navData
                };
            }
        }],

        defaultTab: "activities",
        tabs: [{
            id: "activities",
            label: i18n("Design"),
            view: "deploy/views/componentProcess/componentProcessActivities"
        },{
            id: "configuration",
            label: i18n("Configuration"),
            className: "configurationTab",
            view: "deploy/views/componentProcess/componentProcessConfiguration"
        },{
            id: "changes",
            label: i18n("Changes"),
            view: "deploy/views/componentProcess/componentProcessChangelog"
        }]
    });

    config.data.tabSets.push({
        id: "draftComponentProcess",
        hashPattern: ["componentProcess", "componentProcessVersion", "tab", "navData"],
        breadcrumbs: ["home", "topLevelComponentsOrTemplates", "componentOrTemplate", "componentProcesses", "componentProcess"],
        selectedTopLevelTab: "components",

        // details moved into editor

        stateCalls: [{
            targetAppStateEntry: "componentProcess",
            getUrl: function(appStateTargets, newAppState) {
                newAppState.componentProcessVersion = {
                    id: appStateTargets.componentProcessVersion
                };
                return bootstrap.restUrl+"deploy/componentProcess/draft/"+appStateTargets.componentProcess+"/"+appStateTargets.componentProcessVersion;
            },
            postGet: function(data, newAppState) {
                newAppState.component = data.component;
                newAppState.componentTemplate = data.componentTemplate;
            }
        },{
            getUrl: function(appStateTargets, newAppState) {
                newAppState.goBack = {
                    id: appStateTargets.navData
                };
            }
        }],

        defaultTab: "activities",
        tabs: [{
            id: "activities",
            label: i18n("Design"),
            view: "deploy/views/componentProcess/draftComponentProcessActivities"
        },{
            id: "configuration",
            label: i18n("Configuration"),
            className: "configurationTab",
            view: "deploy/views/componentProcess/draftComponentProcessConfiguration"
        },{
            id: "changes",
            label: i18n("Changes"),
            view: "deploy/views/componentProcess/draftComponentProcessChangelog"
        }]
    });

    config.data.breadcrumbItems.push({
        id: "component",
        getHash: function() {
            return "component/"+appState.component.id;
        },
        isUserData: true,
        getLabel: function() {
            return entities.encode(appState.component.name);
        }
    });

    config.data.breadcrumbItems.push({
        id: "componentTemplate",
        getHash: function() {
            return "componentTemplate/"+appState.componentTemplate.id+"/-1";
        },
        isUserData: true,
        getLabel: function() {
            return entities.encode(appState.componentTemplate.name);
        }
    });

    config.data.breadcrumbItems.push({
        id: "topLevelComponentsOrTemplates",
        getHash: function() {
            var result = "";
            if (appState.component) {
                result = "components";
            }
            else if (appState.componentTemplate) {
                result = "components/templates";
            }
            return result;
        },
        isUserData: true,
        getLabel: function() {
            var result = "";
            if (appState.component) {
                result = i18n("Components");
            }
            else if (appState.componentTemplate) {
                result = i18n("Component Templates");
            }
            return result;
        }
    });

    config.data.breadcrumbItems.push({
        id: "componentOrTemplate",
        getHash: function() {
            var result = "";
            if (appState.component) {
                result = "component/"+appState.component.id;
            }
            else if (appState.componentTemplate) {
                result = "componentTemplate/"+appState.componentTemplate.id+"/-1";
            }
            return result;
        },
        isUserData: true,
        getLabel: function() {
            var result = "";
            if (appState.component) {
                result = entities.encode(appState.component.name);
            }
            else if (appState.componentTemplate) {
                result = entities.encode(appState.componentTemplate.name);
            }
            return result;
        }
    });

    config.data.breadcrumbItems.push({
        id: "componentTemplates",
        getHash: function() {
            return "components/templates";
        },
        isUserData: false,
        getLabel: function() {
            return i18n("Component Templates");
        }
    });

    config.data.breadcrumbItems.push({
        id: "componentProcesses",
        getHash: function() {
            var result = "";
            if (appState.component) {
                result = "component/"+appState.component.id+"/processes";
            }
            else if (appState.componentTemplate) {
                result = "componentTemplate/"+appState.componentTemplate.id+"/-1/processes";
            }
            return result;
        },
        isUserData: false,
        getLabel: function() {
            return i18n("Processes");
        }
    });

    config.data.breadcrumbItems.push({
        id: "versions",
        getHash: function() {
            return "component/"+appState.component.id+"/versions";
        },
        isUserData: false,
        getLabel: function() {
            return i18n("Versions");
        }
    });

    config.data.breadcrumbItems.push({
        id: "version",
        getHash: function() {
            return "version/"+appState.version.id;
        },
        isUserData: false,
        getLabel: function() {
            return i18n("Version: %s", entities.encode(appState.version.name));
        }
    });

    config.data.breadcrumbItems.push({
        id: "componentProcess",
        getHash: function() {
            return "componentProcess/"+appState.componentProcess.id;
        },
        isUserData: false,
        getLabel: function() {
            return i18n("Process: %s", appState.componentProcess.name.escape());
        }
    });
});

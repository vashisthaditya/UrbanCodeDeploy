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
        "dojo/_base/xhr",
        "dojo/_base/fx",
        "dojo/_base/declare",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/on",
        "deploy/widgets/log/LiveLogViewer",
        "deploy/widgets/settings/CleanupProgressBar",
        "js/webext/widgets/Link"
        ],
function(
        _TemplatedMixin,
        _Widget,
        xhr,
        fx,
        declare,
        domConstruct,
        domClass,
        on,
        LiveLogViewer,
        CleanupProgressBar,
        Link
) {
    return declare('deploy.widgets.settings.SettingsIndex',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="settings-index">'+
            '  <div data-dojo-attach-point="settingsAttach"></div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            //
            // Automation
            //
            (function() {
                var categoryContainer = domConstruct.create("div", {
                    className: "category inline-block"
                }, self.settingsAttach);
                var category = domConstruct.create("div", {
                    className: "category-wrapper"
                }, categoryContainer);

                var header = domConstruct.create("div", {
                    className: "category-label"
                }, category);
                domConstruct.create("div", {
                    className: "inline-block",
                    innerHTML: i18n("Automation")
                }, header);

                var links = domConstruct.create("div", {className: "category-links"}, category);

                links.appendChild(self.createLink("#automation/automationPlugins", i18n("Automation Plugins"), "automated-plugins"));
                links.appendChild(self.createLink("#automation/sourceConfigPlugins", i18n("Source Configuration Plugins"), "source-config-plugins"));
                links.appendChild(self.createLink("#automation/runningSourceConfigs", i18n("Running Version Imports"), "running-source-configs"));

                var canViewLocks = config.data.permissions[security.system.viewLocks];
                if (canViewLocks) {
                    links.appendChild(self.createLink("#automation/locks", i18n("Locks"), "locks"));
                }

                var canViewDesignIntegrations = config.data.permissions[security.system.manageBlueprintDesignIntegrations];
                if (canViewDesignIntegrations) {
                    links.appendChild(self.createLink("#automation/blueprintdesignerIntegrations", i18n("Blueprint Designer Integrations"), "blueprint-designer-integrations"));
                }

                links.appendChild(self.createLink("#automation/postProcessingScripts", i18n("Post Processing Scripts"), "post-processing-scripts"));
                links.appendChild(self.createLink("#automation/statuses", i18n("Statuses"), "statuses"));
            }());


            //
            // Security
            //
            this.generateSecurityLinks();


            //
            // System
            //
            (function() {
                domConstruct.create("div", {className: "category-divider inline-block"}, self.settingsAttach);
                var categoryContainer = domConstruct.create("div", {
                    className: "category inline-block"
                }, self.settingsAttach);
                var category = domConstruct.create("div", {
                    className: "category-wrapper"
                }, categoryContainer);

                var header = domConstruct.create("div", {
                    className: "category-label"
                }, category);
                domConstruct.create("div", {
                    className: "inline-block",
                    innerHTML: i18n("System")
                }, header);

                var links = domConstruct.create("div", {className: "category-links"}, category);

                var canViewLogging = config.data.permissions[security.system.manageLogging];
                if (canViewLogging) {
                    links.appendChild(self.createLink("#system/logging", i18n("Logging"), "logging"));
                }

                var canViewNetworkTab = config.data.permissions[security.system.viewNetworkSettings];
                if (canViewNetworkTab) {
                    links.appendChild(self.createLink("#system/network", i18n("Network"), "network"));
                }

                links.appendChild(self.createLink("#system/notification", i18n("Notification Schemes"), "notification-schemes"));

                var canViewOutputLog = config.data.permissions[security.system.viewOutputLog];
                if (canViewOutputLog) {
                    var outLogLinkContainer = domConstruct.create("div", {"class":"link-container"}, links);
                    var outLogLink = new Link({
                        label: '<div class="settings-icon output-log-icon"></div><div class="inner-link-text">' + i18n("Output Log") + '</div>'
                    });
                    on(outLogLink, "click", function() {
                        self.showLogViewer(bootstrap.restUrl+"logView/serverOut", i18n("Output Log"));
                    });
                    outLogLink.placeAt(outLogLinkContainer);

                    var downloadLink = util.createDownloadAnchor({
                        href: bootstrap.restUrl + "logView/serverOut?fileDownload=true",
                        className: "output-log-download-link"
                    }, outLogLinkContainer);
                    downloadLink.innerHTML= i18n("(Download)");
                }

                var canViewAuditLog = config.data.permissions[security.system.viewAuditLog];
                if (canViewAuditLog) {
                    links.appendChild(self.createLink("#system/auditLog", i18n("Audit Log"), "audit-log"));
                }

                var canManageDiagnostics = config.data.permissions[security.system.manageDiagnostics];
                if (canManageDiagnostics) {
                    var diagnosticsLink = self.createLink("#diagnostics", i18n("Diagnostics"), "diagnostics");
                    var diagnosticsDownloadLink = util.createDownloadAnchor({
                        href: bootstrap.restUrl + "system/configuration/diagnosticsFile",
                        className: "output-log-download-link",
                        innerHTML: i18n("(Download)")
                    }, diagnosticsLink);
                    links.appendChild(diagnosticsLink);
                }

                links.appendChild(self.createLink("#system/patches", i18n("Patches"), "patches"));
                links.appendChild(self.createLink("#system/properties", i18n("Properties"), "properties"));
                links.appendChild(self.createLink("#system/artifactRepo", i18n("CodeStation"), "artifact-repo"));

                var canViewBasicSystemSettings = config.data.permissions[security.system.viewBasicSystemSettings];
                if (canViewBasicSystemSettings) {
                    links.appendChild(self.createLink("#system/settings", i18n("System Settings"), "system-settings-item"));
                }

                category.appendChild(links);
            }());

            this.addProgressBar();
        },

        showLogViewer : function(url, title) {

            var logViewer = new LiveLogViewer({
                "url" : url,
                "title" : title,
                "autoRefresh" : false
            });

            logViewer.show();
        },

        /**
         *
         */
        generateSecurityLinks: function() {
            var self = this;
            var hasManageSecurity = config.data.permissions[security.system.manageSecurity];
            var canManageAuthTokenRestrictions = config.data.permissions[security.system.manageAuthTokenRestrictions];
            if (hasManageSecurity || canManageAuthTokenRestrictions) {
                (function() {
                    domConstruct.create("div", {className: "category-divider inline-block"}, self.settingsAttach);
                    var categoryContainer = domConstruct.create("div", {
                        className: "category inline-block"
                    }, self.settingsAttach);
                    var category = domConstruct.create("div", {
                        className: "category-wrapper"
                    }, categoryContainer);

                    var header = domConstruct.create("div", {
                        className: "category-label"
                    }, category);
                    domConstruct.create("div", {
                        className: "inline-block",
                        innerHTML: i18n("Security")
                    }, header);

                    var links = domConstruct.create("div", {className: "category-links"}, category);

                    if (hasManageSecurity) {
                        links.appendChild(self.createLink("#security/keys", i18n("API Keys And Certificates"), "key-configuration"));
                        links.appendChild(self.createLink("#security/authentication", i18n("Authentication (Users)"), "authentication"));
                        links.appendChild(self.createLink("#security/authorization", i18n("Authorization (Groups)"), "authorization"));
                        links.appendChild(self.createLink("#security/teams", i18n("Teams"), "teams"));
                        links.appendChild(self.createLink("#security/tokens", i18n("Tokens"), "tokens"));
                    }

                    if (canManageAuthTokenRestrictions) {
                        links.appendChild(self.createLink("#security/authTokenRestrictions", i18n("Token Restrictions"), "locks"));
                    }

                    if (hasManageSecurity) {
                        links.appendChild(self.createLink("#security/roles", i18n("Role Configuration"), "role-configuration"));
                        links.appendChild(self.createLink("#security/types", i18n("Type Configuration"), "type-configuration"));
                    }

                    category.appendChild(links);

                    domClass.add(self.domNode, "all-settings");
                }());
            }
        },

        /**
         *
         */
        createLink: function(href, text, icon) {
            var linkContainer = domConstruct.create("div", {
                className: "link-container"
            });

            var link = domConstruct.create("a", {
                href: href
            }, linkContainer);

            if (icon){
                domConstruct.create("div", {
                    className: "settings-icon " + icon + "-icon"
                }, link);
            }
            domConstruct.create("div", {
                className: "inner-link-text",
                innerHTML: text
            }, link);

            return linkContainer;
        },

        addProgressBar: function() {
            var self = this;
            this._cleanupProgressBar = new CleanupProgressBar({
                show: function() {
                    fx.animateProperty({
                        node: this.progressBar,
                        properties: { bottom: 0 },
                        duration: 800
                    }).play();
                },
                hide: function() {
                    fx.animateProperty({
                        node: this.progressBar,
                        properties: { bottom: -60 },
                        duration: 800
                    }).play();
                }
            });
            this._cleanupProgressBar.placeAt(this.settingsAttach);
            this._cleanupProgressBar.showProgress();
        }
    });
});

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
/*global define, require, deploy */
define([
        "dijit/TitlePane",
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojox/widget/TitleGroup",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/Alert"
        ],
function(
        TitlePane,
        _TemplatedMixin,
        _Widget,
        array,
        declare,
        xhr,
        domClass,
        domConstruct,
        TitleGroup,
        Dialog,
        Alert
) {
    /**
     *
     */
    return declare('deploy.widgets.report.ReportSidebar',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div>' +
                '<div data-dojo-attach-point="sidebarAttach"></div>' +
            '</div>',

        sideBarAttach: null,

        typeSelect: null, // report type select input
        typeForm: null,   // report settings form widget

        report : null,
        reload: null,

        constructor: function(/* Object*/ args) {
            if (!args.reportRestUrlBase) {
                this.reportRestUrlBase = bootstrap.restUrl + "report/";
            }
            if (!args.reportHashBase) {
                this.reportHashBase = 'reports/';
            }
            if (args.report) {
                this.report = args.report;
            }
        },

        /**
        *
        */
       postCreate: function() {
           this.inherited(arguments);
           this.renderAccordions();
       },

       renderAccordions : function () {
           var _this = this;
           domConstruct.empty(_this.sidebarAttach);
           _this.systemContainer = new TitleGroup({'class':'report-accordion'});
           _this.savedContainer = new TitleGroup({'class':'report-accordion'});
           _this.callsNeeded = 1;
           _this.mine = [];

           xhr.get({
                   url: _this.reportRestUrlBase + "system",
                   handleAs: "json",
                   load: function(data) {
                       _this.loadSystemAccordion(data);
                   }
           });

           xhr.get({
                   url: _this.reportRestUrlBase + "mine",
                   handleAs: "json",
                   load: function(data) {
                       _this.loadSavedAccordion(data, "mine");
                   }
           });

           _this.systemContainer.placeAt(_this.sidebarAttach);
           _this.savedContainer.placeAt(_this.sidebarAttach);
       },

        buildRendering: function() {
            this.inherited(arguments);
        },

        loadSavedAccordion : function(data, scope) {
            var _this = this;
            array.forEach(data, function(item) {
                _this[scope].push(item.name);
            });
            _this.callsNeeded--;
            if (_this.callsNeeded === 0) {
                _this._loadSavedAccordion();
            }
        },

        _loadSavedAccordion : function() {
            var _this = this;
            var mine = domConstruct.create("div");
            var mineSelected = false;
            var count = 0;
            array.forEach(_this.mine, function(item) {
                var curClass = 'report-link-div';
                var curLinkClass = "inlineBlock report-link";
                if (_this.report) {
                    if (_this.report.name === item) {
                        curClass = 'report-link-div-selected';
                        curLinkClass = 'report-link-selected';
                        mineSelected=true;
                    }
                }
                var href = _this.reportHashBase + util.encodeIgnoringSlash(item);
                var newDiv = domConstruct.create("div", {'class':curClass}, mine);
                var a = domConstruct.create("a", {
                            onclick: function() {_this.loadReport(href,item);},
                            innerHTML: item.escape(),
                            'class':curLinkClass
                        }, newDiv);
                domClass.add(a,"linkPointer");
                
                var deleteLink = domConstruct.create("a", {
                    onclick:function() {
                        _this.deleteSavedReport(item);
                    },
                    "class": "inlineBlock iconMinus"
                }, newDiv);
                count++;
            });
            count = "&nbsp;(" + count + ")";

            _this.minePane = new TitlePane({
                title: i18n("My Reports") + count,
                content: mine,
                style:"height:auto"});
            
            _this.minePane.placeAt(_this.savedContainer);
            
            if (!mineSelected) {
                _this.minePane.set("open", false);
                if (_this.deploymentPane && _this.securityPane){
                    if (!_this.deploymentPane.open && !_this.securityPane.open) {
                        _this.deploymentPane.set("open", true);
                    }
                }
            }
        },

        loadSystemAccordion : function(data) {
            var _this = this;
            var security = domConstruct.create("div");
            var deployment = domConstruct.create("div");
            var securitySelected = false;
            var deploymentSelected = false;
            array.forEach(data, function(item) {
                var curClass = "report-link-div";
                var curLinkClass = "report-link";
                if (_this.report) {
                    if (_this.report.name === item.name) {
                        curClass = 'report-link-div-selected';
                        curLinkClass = 'report-link-selected';
                    }
                }
                var href = _this.reportHashBase + "system/" + util.encodeIgnoringSlash(item.name);
                var newDiv;
                var a;
                if (item.name.indexOf("Security") !== -1) {
                    if (curClass === "report-link-div-selected") {
                        securitySelected=true;
                    }
                    newDiv = domConstruct.create("div", {'class':curClass}, security);
                    a = domConstruct.create("a", {onclick: function() {_this.loadReport(href, item.name);},
                            innerHTML: i18n(item.name.escape()), 'class':curLinkClass}, newDiv);
                    domClass.add(a,"linkPointer");
                }
                
                if (item.name.indexOf("Deployment") !== -1) {
                    if (curClass === "report-link-div-selected") {
                        deploymentSelected=true;
                    }
                    newDiv = domConstruct.create("div", {'class':curClass}, deployment);
                    a = domConstruct.create("a", {onclick: function() {_this.loadReport(href, item.name);},
                            innerHTML: i18n(item.name.escape()), 'class':curLinkClass}, newDiv);
                    domClass.add(a,"linkPointer");
                }
            });
            
            _this.securityPane = new TitlePane({
                title: i18n("Security"),
                content: security,
                style:"height:auto"
            });
            _this.deploymentPane = new TitlePane({
                title: i18n("Deployment"),
                content: deployment,
                style:"height:auto"
            });
            
            _this.deploymentPane.placeAt(_this.systemContainer);
            _this.securityPane.placeAt(_this.systemContainer);
            
            if (!deploymentSelected) {
                _this.deploymentPane.set("open", false);
            }
            if (!securitySelected) {
                _this.securityPane.set("open", false);
            }
        },

        _getFormForType: function(type) {
            var widgetClass;
            if (type === 'com.urbancode.ds.subsys.report.domain.deployment_report.DeploymentReport') {
                widgetClass = deploy.widgets.report.deploymentReport.DeploymentReportForm;
            }   
            else if (type === 'com.urbancode.ds.subsys.report.domain.deployment_count.DeploymentCountReport') {
                widgetClass = deploy.widgets.report.deploymentCount.DeploymentCountReportForm;
            }   
            else if (type === 'com.urbancode.ds.subsys.report.domain.security_report.application.SecurityReportApplication') {
                widgetClass = deploy.widgets.report.securityReportApplication.SecurityReportApplicationForm;
            }   
            else if (type === 'com.urbancode.ds.subsys.report.domain.security_report.component.SecurityReportComponent') {
                widgetClass = deploy.widgets.report.securityReportComponent.SecurityReportComponentForm;
            }   
            else if (type === 'com.urbancode.ds.subsys.report.domain.security_report.resource.SecurityReportResource') {
                widgetClass = deploy.widgets.report.securityReportResource.SecurityReportResourceForm;
            }   
            else if (type === 'com.urbancode.ds.subsys.report.domain.security_report.environment.SecurityReportEnvironment') {
                widgetClass = deploy.widgets.report.securityReportEnvironment.SecurityReportEnvironmentForm;
            }   
            else if (type === 'com.urbancode.ds.subsys.report.domain.security_report.user.SecurityReportUser') {
                widgetClass = deploy.widgets.report.securityReportUser.SecurityReportUserForm;
            }
            return widgetClass;
        },

        getReportDisplayWidget: function(type) {
            var widgetClass;
            if (type === 'com.urbancode.ds.subsys.report.domain.deployment_report.DeploymentReport') {
                widgetClass = deploy.widgets.report.deploymentReport.DeploymentReportTable;
            }   
            else if (type === 'com.urbancode.ds.subsys.report.domain.deployment_count.DeploymentCountReport') {
                widgetClass = deploy.widgets.report.deploymentCount.DeploymentCountReportTable;
            }   
            else if (type === 'com.urbancode.ds.subsys.report.domain.security_report.application.SecurityReportApplication') {
                widgetClass = deploy.widgets.report.securityReportApplication.SecurityReportApplicationTable;
            }   
            else if (type === 'com.urbancode.ds.subsys.report.domain.security_report.environment.SecurityReportEnvironment') {
                widgetClass = deploy.widgets.report.securityReportEnvironment.SecurityReportEnvironmentTable;
            }   
            else if (type === 'com.urbancode.ds.subsys.report.domain.security_report.resource.SecurityReportResource') {
                widgetClass = deploy.widgets.report.securityReportResource.SecurityReportResourceTable;
            }   
            else if (type === 'com.urbancode.ds.subsys.report.domain.security_report.component.SecurityReportComponent') {
                widgetClass = deploy.widgets.report.securityReportComponent.SecurityReportComponentTable;
            }   
            else if (type === 'com.urbancode.ds.subsys.report.domain.security_report.user.SecurityReportUser') {
                widgetClass = deploy.widgets.report.securityReportUser.SecurityReportUserTable;
            }   
            return widgetClass;
        },

        /**
         *
         */
        destroy: function() {
            var _this = this;
            // null-safe destroy for widgets
            var d = function(w) {
                if (w) {
                    w.destroy();
                }
            };
            d(_this.systemContainer);
            d(_this.minePane);
            d(_this.securityPane);
            d(_this.deploymentPane);
            this.inherited(arguments);
        },

        closePane: function(pane) {
            if (pane) {
                if(pane.open) {
                    pane.toggle();
                }
            }
        },

        deleteSavedReport : function (name) {
            var _this = this;
            xhr.del({
                url: _this.reportRestUrlBase+name,
                load: function() { _this.renderAccordions(); },
                error: function(e) {
                    new Alert({
                        "title": i18n("An error occured while trying to delete this report"),
                        "message": e.message
                    }).startup();
                }
            });
        },

        loadReport : function (href, reportName) {
            navBar.setHash(href);
            if (this.report && this.report.name === reportName) {
                if (this.reload) {
                    this.reload();
                }
            }
        }
    });
});

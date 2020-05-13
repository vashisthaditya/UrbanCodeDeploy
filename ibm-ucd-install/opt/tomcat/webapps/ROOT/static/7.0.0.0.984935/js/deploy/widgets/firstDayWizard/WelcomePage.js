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
/*global define, require, bootstrap, sessionSharedData:true */

define([
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dijit/_Container",
        "dijit/registry",
        "dijit/form/CheckBox",
        "dijit/form/Button",
        "dojo/_base/declare",
        "dojo/_base/array",
        'dojo/_base/xhr',
        "dojo/on",
        "dojo/dom",
        "dojo/Deferred",
        "dojo/DeferredList",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/dom-attr",
        "dojo/dom-style",

        "js/webext/widgets/Alert",
        "js/util/blocker/_BlockerMixin",
        "deploy/widgets/GetStartedPopup",
        "deploy/widgets/firstDayWizard/FirstDayWizardUtil",
        "deploy/widgets/TooltipTitle",
        "deploy/widgets/firstDayWizard/WizardPage"
        ],
function(
        _TemplatedMixin,
        _Widget,
        _Container,
        registry,
        CheckBox,
        Button,
        declare,
        array,
        xhr,
        on,
        dom,
        Deferred,
        DeferredList,
        domClass,
        domConstruct,
        domAttr,
        domStyle,
        Alert,
         _BlockerMixin,
        GetStartedPopup,
        FirstDayWizardUtil,
        TooltipTitle,
        WizardPage
) {
    return declare([_Widget, _TemplatedMixin, _BlockerMixin, _Container], {
        name: 'welcome',
        dismissedPrefix: 'dismissed_',
        hideWelcomeTab: false,
        templateString:
            '<div class="fdw-welcome-page">' +
            '    <div data-dojo-attach-point="headingAttach" class="fdw-heading1"></div>' +
            '    <div class="fdw-text-column">' +
            '      <div data-dojo-attach-point="section1Attach" class="fdw-emphasis2"></div>' +
            '      <div data-dojo-attach-point="section2Attach" class="fdw-emphasis2"></div>' +
            '      <div data-dojo-attach-point="section3Attach" class="fdw-emphasis2">' +
                     i18n("You can find additional educational and information materials in the Getting Started page, here:") +
            '        <a class="linkPointer" data-dojo-attach-point="getStartedAttach">' +
                       i18n("Getting Started") + '</a>'  +
            '      </div>' +
            '    </div>' +
            '    <div id="hide-welcome-tab-launch-wizard-container">' +
            '        <span id="hide-welcome-tab-checkbox" data-dojo-attach-point="checkboxAttach"></span>' +
            '            <label id="hide-welcome-tab-label" for="hide-welcome-tab-checkbox">' +
                     i18n("Hide the Welcome tab next time I log in. (You can display this tab again from the help menu)") +
            '            </label>' +
            '        <span data-dojo-attach-point="buttonAttach" id="launch-wizard"></span>' +
            '    </div>' +
            '</div>',

        postCreate: function() {
            var self = this;
            this.inherited(arguments);

            //If "welcome" tab is hidden, redirect user to the first visible tab
            var filteredNodes = array.filter(dojo.query(".topLevelTabs .tab"), function(node) {
                var nodeHash = domAttr.get(node, "href");
                return nodeHash === "#main/welcome";
            });
            if (!filteredNodes || filteredNodes.length === 0 || domStyle.get(filteredNodes[0], "display") === "none") {
                FirstDayWizardUtil.navigateToFirstDisplayedTab();
            } else {
                domStyle.set("first-day-wizard", "display", "none");

                domConstruct.place('<span class="fdw-emphasis1">' +
                                   i18n('Welcome %s', bootstrap.userFullName.escape()) +
                                   '</span>', this.headingAttach);

                domConstruct.place('<div>' + 
                        i18n("Looks like you are new to UrbanCode Deploy. UrbanCode Deploy is a deployment " + 
                        "automation solution. With UrbanCode Deploy you can:") +
                        '</div>', this.section1Attach);

                domConstruct.place('<ul><li>' + i18n("Model your application for deployment automation.") + '</li>' +
                                   '<li>' + i18n("Deploy application components to target environments.") + '</li>' +
                                   '<li>' + i18n("Monitor application deployments.") + '</li></ul>', this.section2Attach);

                self.block();
                new DeferredList([  this._getUserPreferences(),
                                    this._getUseWizardPermission(),
                                    this._getAgentsForCreatingResources()]).then(
                        function(data) {
                    self.unblock();
                    var pref = data[0][1];
                    var perm = data[1][1];
                    var agentAvailable = JSON.parse(data[2][1]).length > 0;
                    var hideWelcomeTab = false;
                    if (pref && pref.dismissedUserAlerts &&
                        pref.dismissedUserAlerts.dismissed_welcome) {
                        hideWelcomeTab = true;
                    }
                    var checkBox = new CheckBox({
                        checked: hideWelcomeTab,
                        onChange: function() {
                            self.hideWelcomeTab = this.checked;
                            self._saveHideWelcomeTabPreference();
                        }
                    });
                    domConstruct.place(checkBox.domNode, self.checkboxAttach);
                    var launchWizardButton = {
                        label: i18n("Create an application"),
                        showTitle: false,
                        onClick: function() {
                            self._launchWizard();
                        }
                    };
                    var wizardButton = new Button(launchWizardButton).placeAt(self.buttonAttach);
                    domClass.add(wizardButton.domNode, "idxButtonSpecial");

                    var oldIE;

                    //Check for version of IE based on functionality available.
                    if (document.all && !window.atob){
                        oldIE = true;
                    }

                    if (!perm.result || oldIE || !agentAvailable) {
                        wizardButton.set("disabled", true);
                        domClass.remove(wizardButton.domNode, "idxButtonSpecial");
                        if (oldIE){
                            wizardButton.set("title", i18n("The application wizard does not support Internet Explorer 9 and earlier."));
                        } else if (!agentAvailable) {
                            wizardButton.set("title", i18n("Please ensure that you have view & create resource permissions for at least one agent to launch the wizard."));
                        } else {
                            wizardButton.set("title", i18n("Please ensure that you have the proper permissions for the wizard."));
                        }
                    }
                });

                on(this.getStartedAttach, "click", function() {
                    var gsPopup = new GetStartedPopup({ name: "gs" });
                    gsPopup.open(true);
                });

                //User has visited first-day-wizard before, skip showing welcome page.
                if (sessionSharedData && sessionSharedData.wizardData) {
                    this._launchWizard();
                }
            }
        },

        _getUserPreferences: function() {
            var deferred = new Deferred();
            var url = bootstrap.restUrl + 'security/userPreferences';
            xhr.get({
                url: url,
                handleAs: "json",
                load: function(data) {
                    deferred.resolve(data);
                },
                error: function(error) {
                    deferred.reject(error);
                }
            });
            return deferred;
        },

        _getAgentsForCreatingResources: function() {
            var deferred = new Deferred();
            var url = bootstrap.restUrl + 'agent';
            xhr.get({
                url:url,
                content: {
                    filterFields: ["requiredActions"],
                    filterType_requiredActions: "eq",
                    filterValue_requiredActions: ["Create Resources"]
                },
                handleas: "json",
                load: function(data) {
                    deferred.resolve(data);
                },
                error: function(error){
                    deferred.reject(error);
                }
            });
            return deferred;
        },

        _getUseWizardPermission: function() {
            var deferred = new Deferred();
            var url = bootstrap.restUrl + 'deploy/firstDay/userHavePerms';
            xhr.get({
                url: url,
                handleAs: "json",
                load: function(data) {
                    deferred.resolve(data);
                },
                error: function(error) {
                    deferred.reject(error);
                }
            });
            return deferred;
        },

        _launchWizard: function() {
            //hide welcome page, show paginator
            domStyle.set("fdw-welcome", "display", "none");
            domStyle.set("first-day-wizard", "display", "");

            //start wizard
            var wizardPage = new WizardPage();
        },

        _saveHideWelcomeTabPreference: function() {
            var userPreferencesUrl = bootstrap.restUrl + 'security/userPreferences';
            var alertName = this.dismissedPrefix + this.name;

            var dismissUrl = userPreferencesUrl + '/dismissAlert/' + alertName;
            var resetUrl = userPreferencesUrl + '/resetAlert/' + alertName;

            var url;
            if (this.hideWelcomeTab) {
                url = dismissUrl;
            } else {
                url = resetUrl;
            }

            xhr.post({
                url: url,
                headers: { 'Content-Type': 'application/json' },
                rror: function(response) {
                    var dismissalError = new Alert({
                        messages: [i18n('Error saving hide welcome tab preferences:'),
                                   '',
                                   util.escape(response.responseText)]
                    });
                }
            });
        }
    });
});

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
/*global bootstrap, appState: true, js, util */
/*global define */
define([
        "dojo/_base/declare",
        "dijit/_WidgetBase",
        "dojo/_base/array",
        "dojo/_base/config",
        "dojo/_base/lang",
        "dojo/aspect",
        "dojo/dom",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/dom-style",
        "dojo/on",
        "dojo/query",
        "dojo/_base/xhr",
        "dojox/html/entities",
        "dijit/registry",
        "dojo/hash", // needed for topic to have access to /dojo/onhashchange
        "dojo/topic",
        "js/webext/widgets/TabManager",
        "js/webext/widgets/GenericDetail",
        "js/webext/widgets/Alert",
        "js/webext/widgets/PageAlerts",
        "dijit/layout/ContentPane",
        "idx/widget/Breadcrumb"
        ],
function(
        declare,
        _WidgetBase,
        array,
        dojoConfig, // usually named config, but collides with our config global
        lang,
        aspect,
        dom,
        domClass,
        domConstruct,
        domStyle,
        on,
        query,
        baseXhr,
        entities,
        registry,
        hash,
        topic,
        TabManager,
        GenericDetail,
        Alert,
        PageAlerts,
        ContentPane,
        Breadcrumb
) {

    var cacheBust = "", fixupUrl;
    if(dojoConfig.cacheBust){
        if (lang.isString(dojoConfig.cacheBust)) {
            // string truthful value, use it
            cacheBust = dojoConfig.cacheBust;
        }
        else {
            // non-string truthful value, current timestamp
            cacheBust = String((new Date()).getTime());
        }
    }
    // from dojo.js
    fixupUrl= function(url){
        url += ""; // make sure url is a Javascript string (some paths may be a Java string)
        return url + (cacheBust ? ((/\?/.test(url) ? "&" : "?") + cacheBust) : "");
    };

    /**
     * NavigationBar is available as the global variable "navBar" in standard implementations.
     *
     * It relies on configuration objects matching the following:
     *  config.data: {
     *      tabSets: [{
     *          // ID of this tabset
     *          id: String,
     *
     *          // Array of strings which denote which sement of the URL refers to which object
     *          hashPattern: [String],
     *
     *          // Array of strings corresponding to breadcrumbItems by ID, in order in which they
     *          // should appear in the breadcrumb
     *          breadcrumbs: [String],
     *
     *          // ID of the tab from the top-level tabset to select
     *          selectedTopLevelTab: String,
     *
     *          // Function to generate the main page header text
     *          getDetailTitle: function() returns String,
     *
     *          // Function to generate the main page description
     *          getDetailDescription: function() returns String,
     *
     *          // Function to generate the label/value pairs shown under the main page header
     *          getDetailFields: function() returns [{
     *                  label: String,
     *                  description: String
     *              }],
     *
     *          // Function to generate the alerts shown under the details area
     *          getPageAlerts: function() returns [{
     *                  text: String,
     *                  className: String
     *              }],
     *
     *          // Describes how to construct the global appState, based on the hashPattern and the
     *          // contents of the URL
     *          stateCalls: [{
     *              // The property name of global appState to populate with the results of the URL
     *              targetAppStateEntry: String,
     *
     *              // Returns the URL to call to populate the global appState. appStateTargets has
     *              // as properties the values corresponding to the hashPattern, and newAppState can
     *              // be modified in-place to make custom modifications to the resultant appState.
     *              getUrl: function(appStateTargets, newAppState) returns String,
     *
     *              // Some custom functionality to build appState. "data" is the result of getting the
     *              // URL contents, and newAppState can be modified in-place to make modifications to
     *              // the resultant appState
     *              postGet: function(data, newAppState)
     *          }],
     *
     *          // The default child tab to select if none is provided on the URL
     *          defaultTab: String,
     *
     *          // Child tabs to show when in this tabset.
     *          tabs: [{
     *              // ID of this tab, used in URLs
     *              id: String,
     *
     *              // Path to the HTML file to show in the content area for this tab (without .html)
     *              view: String,
     *
     *              // String to show on this tab
     *              label: String,
     *
     *              // Function to determine whether this tab should be visible
     *              isVisible: function() returns Boolean
     *          }]
     *      }],
     *
     *      // BreadcrumbItems construct segments of the breadcrumb bar.
     *      breadcrumbItems: [{
     *          // ID of this breadcrumbItem, referenced by "breadcrumbs" properties in tabSets.
     *          id: String,
     *
     *          // Function to produce the hash to navigate to if this breadcrumb is clicked
     *          getHash: function() returns String,
     *
     *          // Function to produce the text to show for this breadcrumb
     *          // if this retuns null or undefined, no breadcrumb is shown
     *          getLabel: function() returns String
     *      }],
     *
     *      // An array of widget "classnames" to include for usage in extraFormDelegates.
     *      extraFormIncludes: [String],
     *
     *      // Additional delegates to make available in ColumnForm
     *      extraFormDelegates: [{
     *          // The name of this delegate, usable as field types in ColumnForm.
     *          name: String,
     *
     *          // The function to call to produce a widget to show in the form. "entry" is the data for
     *          // this form field.
     *          delegateFunction: function(entry) returns Widget
     *      }]
     *  }
     *
     */
    return declare(
        'js.webext.widget.NavigationBar',
        [_WidgetBase],
        {

        recentHash: null,           // the most recent url hash (used to test for change)
        changeFunction: null,       // function to check if navigation should require a confirm
        tabManager: null,           // TabManager of the secondLevelTabs
        topLevelTabLinks: null,     // an Array of <a> elements for the top level tabset
        topLevelTab: null,          // the tab configuration selected as top level tab
        stateCallTracking: {        // An object that tracks state calls globally so that
            pendingCalls: [],       //    they may be viewed and canceled from anywhere.
            newAppState: {},
            parameters: null,
            view: null,
            tabSet: null,
            tab: null
        },

        // elements which this widget interacts with by ID:
        //    _webext_second_level_tabs  // where the second-level tabs are placed
        //    _webext_breadcrumbs        // the breadcrumb bar
        //    _webext_detail_header      // where ahp announcements are displayed


        /**
         *
         */
        postCreate: function() {
            this.inherited("postCreate", arguments);

            this.tabManager = new TabManager({
                tabSet: config.getTabSet(bootstrap.initialState.tabSetId),
                tab: config.getTab(bootstrap.initialState.tabSetId, bootstrap.initialState.tabId)
            });

            this.breadcrumbs = new Breadcrumb({}, "_webext_breadcrumbs");
            // Monkey-patch "/" instead of ">" for breadcrumbs
            aspect.after(this.breadcrumbs, "_generateSeparator", function(seperator) {
              seperator.res.arrowSeparater = "/";
              return seperator;
            });
        },

        /**
         *
         */
        startup: function() {
            this.inherited("startup", arguments);
            this.tabManager.placeAt("secondLevelTabs");
            this.tabManager.startup();
        },

        /**
         * Start up the navigation manager and session state checker.
         */
        startManager: function() {
            var self = this;

            this.setState();
            setTimeout(function() {self.hasChecked = true;}, 20000);

            // dojo will fall back to a timer for browsers which do not support this event (IE7)
            topic.subscribe("/dojo/hashchange", function(changedHash) {
                self.setState();
            });
        },

        /**
         * Sets up a notification which will be used when the user changes the page or leaves. The
         * provided function should return true when there are changes.
         */
        setPageChangeNotification: function(changeFunction) {
            this.changeNotificationEnabled = false;
            this.changeFunction = changeFunction;
        },

        /**
         *
         */
        cancelPageChangeNotification: function() {
            this.changeNotificationEnabled = false;
            this.changeFunction = null;
        },

        /**
         * If a page change notification has been set, this will check it. Returns true if the user
         * opts to remain on the page, false otherwise.
         */
        checkPreventPageChange: function() {
            var result = true;
            if (!!this.changeFunction) {
                if (this.changeFunction() && !this.checkChangeFunction) {
                    this.checkChangeFunction = true; // Prevent multiple confirms.
                    if (!confirm(i18n("Are you sure you want to navigate away from this page?") + "\n\n"+
                                i18n("You have unsaved changes which will be lost.") + "\n\n"+
                                i18n("Press OK to continue, or Cancel to stay on the current page."))) {
                        result = true; // stay on page
                    }
                    else {
                        result = false;
                    }
                    delete this.checkChangeFunction;
                }
                else {
                    result = false; // leave page
                }
                if (!result) {
                    this.cancelPageChangeNotification();
                }
            }
            else {
                result = false; // leave page
            }

            return result;
        },

        /**
         * Ping a rest service to check on the user's session - refresh the page if their
         * session has timed out.
         * On TeamForge, this will result in a reload of the session from TeamForge, or a message
         * if the user's TeamForge session has also timed out.
         * On normal WebExt, it will push them to the login page.
         */
        checkExpired: function() {
            var self = this;
            self.hasChecked = true;
            var url = config.getFunctionResult("getSessionCheckUrl");
            baseXhr.get({
                url: url,
                handleAs: "json",
                load: function(data) {
                    // nothing to do, we have a valid session unless we get a 401
                },

                error: function(response, ioArgs) {
                    var status = ioArgs.xhr.status;
                    var statusText = ioArgs.xhr.statusText;

                    if (status === 401) {
                        self.onSessionExpired();
                    }
                }
            });
        },

        /**
         * This is called periodically to pick up changes in the URL (when back/forward are used).
         * It will pull out elements from the URL's hash string and set the application state
         * accordingly.
         */
        setState: function() {
            var self = this;
            var targetState = hash() || "";

            // If we're trying to navigate to the URL we were already at, do nothing.
            if (targetState !== this.recentHash) {

                // Perform any special checks to determine if page navigation should be prevented.
                var skip = this.checkPreventPageChange();
                if (!skip) {
                    var lastHash = this.recentHash;
                    this.recentHash = targetState;
                    targetState = targetState.split("/");

                    //Tab Set is the set of tabs that reside under a top level tab
                    var tabSetId = "";
                    var tabSet = null;
                    //Tab id is the current tab you are looking at
                    var tabId = "";
                    var tab = null;
                    var appStateTargets = {};
                    var hasAppStateTargets = false;
                    var newView = "";


                    // Get the tab set ID (the first string in the split)
                    if (targetState.length > 0) {
                        tabSetId = targetState[0];

                        tabSet = config.getTabSet(tabSetId);

                        // Parse the remainder of the hash according to the pattern specified in the
                        // configuration of the tabset.
                        if (tabSet !== null) {
                            targetState.splice(0, 1);

                            array.forEach(tabSet.hashPattern, function(pattern, index) {
                                if (targetState.length > index) {
                                    if (pattern === "tab") {
                                        tabId = targetState[index];
                                    }
                                    else {
                                        appStateTargets[pattern] = targetState[index];
                                    }
                                }
                            });

                            tab = config.getTab(tabSetId, tabId);

                            // If the tab is not found we should log and return.
                            if (!tab) {
                                console.log("tab not found in tabset ", tabSetId, tabId);
                                return;
                            }

                            // Handle tabs set to redirect to another hash.
                            if (tab.hash) {
                                setTimeout(function() {
                                    self.setHash(tab.hash, false, true);
                                }, 10);
                                return;
                            }

                            newView = tab.view;
                        }

                        // Make sure that the user has access to the top-level tab for this tabset.
                        var hasValidTopLevelTab;
                        if (tabSet !== null) {
                            if (tabSet.id === "main") {
                                hasValidTopLevelTab = true;
                            }
                            else {
                                var topLevelTabSet = config.getTabSet("main");
                                if (topLevelTabSet) {
                                    var topLevelTabId = tabSet.selectedTopLevelTab;
                                    hasValidTopLevelTab = array.some(topLevelTabSet.tabs, function(topLevelTab) {
                                        return topLevelTab.id === topLevelTabId;
                                    });
                                }
                            }
                        }
                        else {
                            hasValidTopLevelTab = false;
                        }

                        if (tabSet === null || tab === null || !hasValidTopLevelTab) {
                            var alert = new Alert({
                                message: i18n("The page you are trying to access has not been configured properly, or you do not have access to view it."),
                                title: i18n("Navigation Error")
                            });
                            alert.startup();

                            return;
                        }
                    }


                    // Check to see if the application state needs to be changed - compare URL
                    // target state IDs with current IDs in the application state.
                    var refreshNeeded = false;

                    // Always refresh app state when there is no app state target.
                    if (!hasAppStateTargets) {
                        refreshNeeded = true;
                    }

                    // Check all entries in appState to compare them with the target appState.
                    array.forEach(appState, function(item) {
                        if (appStateTargets[item] === undefined) {
                            refreshNeeded = true;
                        }
                        else if (appStateTargets[item] !== appState[item].id) {
                            refreshNeeded = true;
                        }
                    });
                    // Check all entries in the target appState to compare them with appState.
                    // This only needs to check for things which appStateTargets has but appState
                    // does not, since anything they both have has already been caught by the
                    // previous loop.
                    array.forEach(appStateTargets, function(item) {
                        if (appState[item] === undefined) {
                            refreshNeeded = true;
                        }
                    });

                    if (bootstrap.forceRefreshState) {
                        refreshNeeded = true;
                        bootstrap.forceRefreshState = false;
                    }

                    // If the application state is different than it was before, rebuild the navigation
                    // and tab bars.
                    if (refreshNeeded) {
                        util.clearAppState();

                        // Notify the UI that a call is in progress.
                        topic.publish("NavigationBar/loading");

                        // Get data from the application state rest service and set all application state
                        // information at once.
                        this.setApplicationState(appStateTargets, newView, tabSet, tab);
                    }
                    // Navigation state unchanged - just set a view and make sure the correct tab is selected.
                    else {
                        if (tab) {
                            this.tabManager.tabContainer.selectChild(this.tabManager.getTabById(tab.id));
                            this.tabManager.tab = tab;
                        }
                        this.setView(newView);
                    }

                }
                else {
                    if (hash() !== this.recentHash) {
                        this.setHash(this.recentHash, true);
                    }
                    this.setBreadcrumbs(this.breadcrumbs.prevBreadcrumbs);
                }
            }

        },

        /**
         * Create the navigation bar based on the configuration of the tab the user is viewing.
         */
        setBreadcrumbs: function(breadcrumbArray) {
            var self = this;
            //store the current breadcrumbs to be available if they must be rolled back
            this.breadcrumbs.prevBreadcrumbs = breadcrumbArray;
            // Clear any existing breadcrumbs
            this.breadcrumbs._clearContent();
            this.breadcrumbs.breadcrumbs = [];

            var lastBreadcrumbLabel;
            array.forEach(breadcrumbArray, function(breadcrumbId) {
                var breadcrumbData = config.getBreadcrumb(breadcrumbId);
                if (breadcrumbData) {

                    // Determine if this breadcrumb should be shown based on the function
                    // defined in the breadcrumb config.
                    var showBreadcrumb = true;
                    if (breadcrumbData.isVisible !== undefined) {
                        showBreadcrumb = breadcrumbData.isVisible();
                    }

                    var firstBreadcrumb = true;
                    if (showBreadcrumb) {
                        var breadcrumbLabel = breadcrumbData.getLabel();
                        if (breadcrumbLabel !== null && breadcrumbLabel !== undefined) {
                            var breadcrumbHash = breadcrumbData.getHash();

                            if (breadcrumbData.isUserData !== undefined) {
                                if (breadcrumbData.isUserData) {
                                    breadcrumbLabel = util.applyBTD(breadcrumbLabel);
                                }
                            }

                            self.breadcrumbs.push(new Breadcrumb.Crumb({
                                label: breadcrumbLabel,
                                title: breadcrumbLabel,
                                onClick: function() {
                                    navBar.setHash(breadcrumbHash);
                                }
                            }));

                            lastBreadcrumbLabel = breadcrumbLabel;
                        }
                    }
                }
            });

            if (bootstrap.productName) {
                var newTitle = bootstrap.productName;
                if (lastBreadcrumbLabel){
                    newTitle = newTitle + ": "+entities.decode(lastBreadcrumbLabel);
                }
                document.title = newTitle;
            }
        },

        /**
         * Set the hash on the URL, consequently resulting in a change (or at least a check) of the
         * currently displayed view/tabs.
         * Mainly just a shortcut function for standardization.
         *
         * @param hashString The new string to set after the URL.
         * @param urlOnly Override default behavior if true - do not cause a parse of the hashstring.
         * @param forceClear Clear the bootstrap before setting the hash to force a reload of all data.
         */
        setHash: function(hashString, urlOnly, forceClear) {
            if (urlOnly) {
                this.recentHash = hashString;
            }
            if (forceClear) {
                this.recentHash = "BLANK_HASH_OVERWRITE";
                bootstrap.forceRefreshState = true;
                util.clearAppState();
            }

            hash(hashString, true);
            this.setState();
        },

        /**
         * Query the rest services for application state information based on a set of IDs,
         * place the resulting data into the bootstrap, and optionally redirect to a view.
         */
        setApplicationState: function(parameters, view, tabSet, tab) {
            var self = this;

            // Make sure to cancel previous state calls before proceeding with a new one.
            if (self.stateCallTracking.pendingCalls.length > 0) {
                self.cancelAllStateCalls();
            }

            // Set up the object to be passed around to all recursive calls - this contains
            // recursion progress information as well as all information necessary to go to
            // the desired page after loading is complete.

            self.stateCallTracking = {
                pendingCalls: [],
                newAppState: {},
                parameters: parameters,
                view: view,
                tabSet: tabSet,
                tab: tab
            };

            if (tabSet.stateCalls) {
                array.forEach(tabSet.stateCalls, function(stateCall) {
                    self.makeStateCall(stateCall);
                });
            }
            // No state calls for this tabset. Just show content, clear appState, and hide the
            // loading image.
            else {
                this.checkExpired();

                util.clearAppState();
                self.setTabs(tabSet, tab);
                self.setDetailHeader(tabSet);
                self.setBreadcrumbs(tabSet.breadcrumbs);
                self.setView(view);

                // Notify the UI that the call has finished.
                topic.publish("NavigationBar/doneLoading");
            }
        },

        /**
         * Recursively cascade down all levels/groups of stateCalls.
         */
        makeStateCall: function(stateCall) {
            var self = this;

            var url = stateCall.getUrl(self.stateCallTracking.parameters, self.stateCallTracking.newAppState);
            if (url) {
                var call = baseXhr.get({
                    url: url,
                    handleAs: "json",
                    load: function(data, ioArgs) {
                        // Remove the state call from the global array.
                        self.removeStateCall(ioArgs);

                        self.stateCallTracking.newAppState[stateCall.targetAppStateEntry] = data;
                        // Call custom post-get function.
                        if (stateCall.postGet !== undefined) {
                            stateCall.postGet(data, self.stateCallTracking.newAppState);
                        }

                        // Make any child stateCalls.
                        if (stateCall.stateCalls) {
                            array.forEach(stateCall.stateCalls, function(stateCall) {
                                self.makeStateCall(stateCall);
                            });
                        }

                        // If this was the last state call, set the new app state and send the
                        // user to the requested page.
                        if (self.stateCallTracking.pendingCalls.length === 0) {
                            util.clearAppState();
                            appState = self.stateCallTracking.newAppState;
                            self.setTabs(self.stateCallTracking.tabSet, self.stateCallTracking.tab);
                            self.setDetailHeader(self.stateCallTracking.tabSet);
                            self.setBreadcrumbs(self.stateCallTracking.tabSet.breadcrumbs);
                            self.setView(self.stateCallTracking.view);

                            // Notify the UI that the call has finished.
                            topic.publish("NavigationBar/doneLoading");
                        }
                    },

                    error: function(response, ioArgs) {
                        // Remove the state call from the global array.
                        self.removeStateCall(ioArgs);

                        var status = ioArgs.xhr.status;
                        var statusText = ioArgs.xhr.statusText;

                        if (status === 401) {
                            self.onSessionExpired();
                        }
                        else {
                            //as to not disturb onSessionExpired() for code 401's
                            topic.publish("navigationError", response, ioArgs);
                        }

                        // Notify the UI that the call has finished.
                        topic.publish("NavigationBar/doneLoading");
                    }
                });

                // Add the hxr.get response to the list of pending calls.
                self.stateCallTracking.pendingCalls.push(call);
            }
        },

       /**
        * Iterates over all state calls in progress and cancels them.
        */
        cancelAllStateCalls: function() {
            if (this.stateCallTracking.pendingCalls) {
                var callArrayLength = this.stateCallTracking.pendingCalls.length;
                var i;
                for (i = 0; i < callArrayLength; i++) {
                    var call = this.stateCallTracking.pendingCalls.pop();
                    call.cancel();
                }
            }
        },

        /**
         * Clear tabs and set new ones based on arguments.
         */
        setTabs: function(tabSet, tab) {
            var self = this;

            this.tabManager.destroy();

            // Set the correct top-level tab if the user is in the main tabset.
            var topTabId;
            if (tabSet.id === "main") {
                topTabId = tab.id;
            }
            else if (tabSet.selectedTopLevelTab) {
                topTabId = tabSet.selectedTopLevelTab;
            }

            array.forEach(config.getTabSet("main").tabs, function(topLevelTab) {
                if (topTabId === topLevelTab.id) {
                    self.topLevelTab = topLevelTab;
                }
            });
            if (this.topLevelTabManager) {
                this.topLevelTabManager.markTabSelected(topTabId);
            }

            this.tabManager = new TabManager({
                tabSet: tabSet,
                tab: tab
            });
            this.tabManager.placeAt("secondLevelTabs");
            this.tabManager.startup();
        },

        /**
         * Set the detail box above second level tabs.
         */
        setDetailHeader: function(tabSet) {
            var detailDiv = dom.byId("_webext_detail_header");

            if (detailDiv) {
                domConstruct.empty(detailDiv);

                var detailContainer = document.createElement("div");
                detailContainer.className = "heading";

                var showDetails = false;
                var hasDetails = false;
                var detailTitle;

                if (tabSet.getDetailTitle !== undefined) {
                    showDetails = true;

                    detailTitle = document.createElement("h1");
                    detailTitle.innerHTML = tabSet.getDetailTitle();
                    detailContainer.appendChild(detailTitle);
                }

                var genericDetailData = {};
                if (tabSet.getDetailFields !== undefined) {
                    genericDetailData.properties = tabSet.getDetailFields();
                }

                if (tabSet.getDetailDescription !== undefined) {
                    genericDetailData.description = tabSet.getDetailDescription();
                }

                if ((genericDetailData.properties && genericDetailData.properties.length > 0)
                        || genericDetailData.description) {
                    var details = new GenericDetail(genericDetailData);

                    details.placeAt(detailContainer);
                    details.startup();
                    hasDetails = true;
                }

                detailDiv.appendChild(detailContainer);

                if (this.toggleDetails) {
                    this.handleToggleDetails(hasDetails, detailTitle, detailContainer);
                }

                var pageAlerts = new PageAlerts();
                pageAlerts.placeAt(detailDiv);

                if (tabSet.getPageAlerts) {
                    array.forEach(tabSet.getPageAlerts(), function(alert) {
                        pageAlerts.addAlert(alert);
                    });
                }

                if (!tabSet.hideGlobalMsgs) {
                    var globalUrls = config.getFunctionResult("getGlobalMessageUrls");
                    if (globalUrls !== null) {
                        showDetails = true;

                        array.forEach(globalUrls, function(url) {
                            baseXhr.get({
                                url: url,
                                handleAs: "json",
                                sync: true,
                                load: function(data) {
                                    array.forEach(data, function(current) {

                                        var className = "errorText";
                                        if (current.priority === "high") {
                                            className = "highPriority";
                                        }
                                        else if (current.priority === "low") {
                                            className = "lowPriority";
                                        }
                                        else if (current.priority === "note") {
                                            className = "notePriority";
                                        }

                                        var alert = {
                                            data: current,
                                            className: className,
                                            userCanDismiss: current.canDismiss
                                        };

                                        if (current.messageId && config.data && config.data.alerts) {
                                            alert.messageId = current.messageId;
                                        }
                                        else {
                                            alert.text = current.message;
                                        }

                                        pageAlerts.addAlert(alert);
                                    });
                                    pageAlerts.cleanAlertBlocks(data);
                                }
                            });
                        });
                    }
                }

            }
        },

        /**
         * Shortcut for setContent - add the base views path to a given view URL. Because all
         * view files end in .html, adding .html to the argument is optional (mostly for clean
         * URL hashes).
         */
        setView: function(viewFile) {
            if (viewFile.length > 5) {
                if (viewFile.substring(viewFile.length-5) !== ".html") {
                    viewFile += ".html";
                }
            }
            this.setContent(bootstrap.jsUrl+viewFile);
        },

        /**
         * Reset the URL of the main content pane to the argument given. This also includes code
         * to clear out any Dojo widgets that may be causing problems if they avoid recursive
         * deletion.
         */
        setContent: function(url) {
            var contentContainer = registry.byId("_webext_content");
            contentContainer.destroyDescendants();

            contentContainer.set('href', fixupUrl(url));

            if (this.hasChecked) {
                this.checkExpired();
            }
        },

        /**
         * Function called when a 401 is detected from a state-call or page load.  It is assumed that this indicates
         * that a re-authentication is required.
         * By default this method reloads the window.
         */
        onSessionExpired: function() {
            // reload in order to bring up login screen?
            window.location.reload();
        },

       /**
         * Function called whenever a state call is finished that removes the call from the array
         * of state calls and notifies the UI that the loading images should be hidden.
         */
        removeStateCall: function(ioArgs) {
            var self = this;
            var callsToDelete = array.filter(self.stateCallTracking.pendingCalls, function(call) {
                return call.ioArgs === ioArgs;
            });

            if (callsToDelete && callsToDelete.length > 0) {
                array.forEach(callsToDelete, function(call) {
                    var index = array.indexOf(self.stateCallTracking.pendingCalls, call);
                    self.stateCallTracking.pendingCalls.splice(index, 1);
                });
            }
        },

        handleToggleDetails: function(hasDetails, detailTitle, detailContainer) {
            var showDetailsText = '&nbsp;' + i18n("Show details");
            var hideDetailsText = '&nbsp;' + i18n("Hide details");
            var showHideDetailLink = domConstruct.toDom(
                    '<div class="linkPointer" id="toggle-header-link">' +
                    showDetailsText +
                    '</div>');
            if (hasDetails) {
                if (detailTitle) {
                    domConstruct.place(showHideDetailLink, detailContainer, 1);
                    domStyle.set(detailTitle, "display", "inline");
                    domStyle.set(showHideDetailLink, "display", "inline");
                } else {
                    domConstruct.place(showHideDetailLink, detailContainer, 0);
                    domStyle.set(showHideDetailLink, "display", "block");
                    domClass.add(showHideDetailLink, "margin-left-30px");
                }
                this.own(on(dom.byId("toggle-header-link"), "click", function(e) {
                    query(".genericDetail").forEach(function(node) {
                        if (domStyle.get(node, "display") === "none") {
                            domStyle.set(node, "display", "block");
                            dom.byId("toggle-header-link").innerHTML = hideDetailsText;
                        } else {
                            domStyle.set(node, "display", "none");
                            dom.byId("toggle-header-link").innerHTML = showDetailsText;
                        }
                    });
                }));
            }
        }
    });
});

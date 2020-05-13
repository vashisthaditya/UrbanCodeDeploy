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
/*global define */
define([
        "dojo/_base/declare",
        "dojo/_base/array",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/dom-style",
        "dojo/dom-geometry",
        "dojo/on",
        "dojo/query",
        "dijit/_TemplatedMixin",
        "dijit/_WidgetBase"
        ],
function(
        declare,
        array,
        domClass,
        domConstruct,
        domStyle,
        domGeom,
        on,
        query,
        _TemplatedMixin,
        _WidgetBase
) {

    return declare(
        [_WidgetBase, _TemplatedMixin],
        {
            templateString:
                '<div data-dojo-attach-point="tabContainerAttach" class="tabManager">'+
                '</div>',

            // parentTabManager?
            // parentSelectedTab?
            tabContainerClass: "secondLevelTabs",
            isTopLevelTabs: false,

            /**
             * Initialize the tab manager. From initialization onward, the tabmanager requires a
             * specific tabset and tab, so it can only be created after the NavigationBar has read and
             * handled this information.
             *
             * Initialization happens at first, and whenever the application "category" is changed -
             * when changing from workflow to buildlife, etc.
             */
            postCreate: function() {
                var self = this;
                self.inherited(arguments);

                if (self.tabSet.selectedTopLevelTab) {
                    array.forEach(navBar.topLevelTabLinks, function(topTabLink) {
                        if (topTabLink.tab.id === self.tabSet.selectedTopLevelTab) {
                            domClass.add(topTabLink, "selected");

                            // Track the top level tab currently selected.
                            navBar.topLevelTab = topTabLink.tab;
                        }
                        else {
                            domClass.remove(topTabLink, "selected");
                        }
                    });
                }

                self.arrayOfTabLinks = [];

                // Never show the main tabset from here.
                if (self.tabSet.id !== "main" || self.isTopLevelTabs) {
                    var activeTabId = self.tab.activeTabId || self.tab.id;
                    array.forEach(self.tabSet.tabs, function(tab) {
                        var tabIsVisible = true;
                        var isDisabled = false;

                        if (tab.isVisible !== undefined) {
                            tabIsVisible = tab.isVisible();
                        }

                        if (tab.isDisabled !== undefined) {
                            isDisabled = tab.isDisabled();
                        }

                        if (tabIsVisible) {
                            var tabLink = domConstruct.create("a", {
                                "class": "tab"
                            }, self.tabContainerAttach);
                            var tabLabel = domConstruct.create("span", {
                                "class": "tabLabel",
                                "innerHTML": tab.label
                            }, tabLink);
                            tabLink.tab = tab;

                            if (!isDisabled) {
                                tabLink.tabIndex = 0; // make focusable with keyboard in document order

                                domClass.add(tabLink, "linkPointer");
                                if (tab === self.tab) {
                                    domClass.add(tabLink, "selected");
                                }

                                var tabHash = self.getHashForTab(self.tabSet.id, tab.id);
                                var doChangeTab = function() {
                                    return !navBar.checkPreventPageChange();
                                };
                                tabLink.href = "#"+tabHash;
                                tabLink.onclick = doChangeTab;
                            }
                            else {
                                domStyle.set(tabLink, {
                                    backgroundColor:"#D3D3D3", // lightGray
                                    color:"black"
                                });
                            }

                            if (tab.help !== undefined) {
                                self.tabHelp = domConstruct.create("a");
                            }

                            self.arrayOfTabLinks.push(tabLink);

                            if (tab.style !== undefined) {
                                domStyle.set(tabLink, tab.style);
                            }
                            if (tab.className !== undefined) {
                                domClass.add(tabLink, tab.className);
                            }

                            if (tab.width !== undefined) {
                                domStyle.set(tabLink, "width", tab.width);
                            }

                            if (tab.backgroundColor !== undefined) {
                                domStyle.set(tabLink, "backgroundColor", tab.backgroundColor);
                            }

                            if (tab.color !== undefined) {
                                domStyle.set(tabLink, "color", tab.color);
                            }
                        }
                    });
                }

                var arrayOfTabLinksLength = self.arrayOfTabLinks.length;
                if (arrayOfTabLinksLength > 1) {
                    if (!self.isTopLevelTabs) {
                        array.forEach(query("body"), function(bodyNode) {
                            domClass.remove(bodyNode, "noSecondLevelTabs");
                        });
                    }
                    else {
                        setTimeout(function(){
                            var last = self.arrayOfTabLinks[arrayOfTabLinksLength - 1];
                            var lastPosition = domGeom.position(last);
                            var width = lastPosition.x + lastPosition.w;
                            if (width > 1000){
                                domClass.add(self.domNode, "overflow-tabs");
                                if (width > 1200){
                                    domClass.add(self.domNode, "overflow-tabs-1200");
                                    if (width > 1600){
                                        domClass.add(self.domNode, "overflow-tabs-1600");
                                    }
                                    else if (width > 1400){
                                        domClass.add(self.domNode, "overflow-tabs-1400");
                                    }
                                }
                                else if (width > 1100){
                                    domClass.add(self.domNode, "overflow-tabs-1100");
                                }
                            }
                       }, 0);
                    }
                    domClass.remove(self.domNode, "hidden");
                }
                else {
                    if (!self.isTopLevelTabs) {
                        array.forEach(query("body"), function(bodyNode) {
                            domClass.add(bodyNode, "noSecondLevelTabs");
                        });
                    }
                    domClass.add(self.domNode, "hidden");
                }
            },

            /**
             * Given a tab set and tab ID, construct the hash string that would be used if this tab
             * were to be selected.
             */
            getHashForTab: function(tabSetId, tabId) {
                var tabSet = config.getTabSet(tabSetId);
                var tab = config.getTab(tabSetId, tabId);

                var hash = "";
                if (tabSet.getTabHash !== undefined) {
                    hash += tabSet.getTabHash(tab);
                }
                else {
                    hash += tabSet.id;
                    array.forEach(tabSet.hashPattern, function(pattern) {
                        if (pattern === "tab") {
                            hash += "/"+tab.id;
                        }
                        else {
                            if (appState[pattern]) {
                                hash += "/"+appState[pattern].id;
                            }
                        }
                    });
                }

                return hash;
            },

            /**
             * Apply the normal selected class to the given tab ID
             */
            markTabSelected: function(tabId) {
                var self = this;

                array.forEach(this.arrayOfTabLinks, function(tabLink) {
                    if (tabLink.tab.id === tabId) {
                       //Select new div
                        domClass.add(tabLink, "selected");
                    }
                    else {
                        domClass.remove(tabLink, "selected");
                    }
                });
            }
        }
    );
});

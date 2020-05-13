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
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/query",
        "dojo/topic",
        "dijit/_WidgetBase"
        ],
function(
        declare,
        domConstruct,
        domClass,
        query,
        topic,
        _WidgetBase
) {

    return declare(
        "deploy.widgets.navigation.LoadingIndicator",
        [_WidgetBase],
        {

        topLevelLoadingIcon: null,

        // Global variables that this dojo class makes use of:
        //      navBar

        postCreate: function() {
            // Add a loading image at the right end of the top level tab container.
            this.topLevelLoadingIcon = domConstruct.create("span", {
                "class": "top-level-loading-image"
            }, query(".topLevelTabs .tabManager")[0]);

            topic.subscribe("NavigationBar/loading", this.startLoadingIndicators.bind(this));
            topic.subscribe("NavigationBar/doneLoading", this.stopLoadingIndicators.bind(this));
        },

        startLoadingIndicators: function() {
            var fadeArgs = {
                node: this.topLevelLoadingIcon,
                duration: 700
            };
            dojo.fadeIn(fadeArgs).play();
            domClass.add(document.body, "busy");
        },

        stopLoadingIndicators: function() {
            if (navBar.stateCallTracking.pendingCalls.length === 0) {
                var fadeArgs = {
                    node: this.topLevelLoadingIcon,
                    duration: 700
                };
                dojo.fadeOut(fadeArgs).play();
                domClass.remove(document.body, "busy");
            }
        }
    });
});
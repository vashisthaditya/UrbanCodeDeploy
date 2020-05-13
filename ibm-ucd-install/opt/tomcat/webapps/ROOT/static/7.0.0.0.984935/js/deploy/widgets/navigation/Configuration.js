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
define(["dojo/_base/kernel",
        "dojox/html/entities"],
function(dojo,
         entities) {
    dojo.provide("deploy.widgets.navigation.Configuration");

    config.data.tabSets.push({
        id: "configuration",
        hashPattern: ["tab"],
        breadcrumbs: ["home", "topLevelTab"],
        selectedTopLevelTab: "configuration",
        
        defaultTab: "tree",
        tabs: [{
            id: "tree",
            label: i18n("Tree"),
            view: "deploy/views/configuration/configurationTree"
        }]
    });
});
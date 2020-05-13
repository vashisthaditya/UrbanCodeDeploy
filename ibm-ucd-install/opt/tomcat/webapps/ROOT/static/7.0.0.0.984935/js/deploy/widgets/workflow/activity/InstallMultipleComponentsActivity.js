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
        "dojo/_base/declare",
        "deploy/widgets/workflow/activity/MultipleComponentsActivity"
        ],
function(
        declare,
        MultipleComponentsActivity
) {
    return declare('deploy.widgets.workflow.activity.InstallMultipleComponentsActivity',  [MultipleComponentsActivity], {

        statusLabel: i18n("Use Versions Without Status"),

        /**
         * Get the label to be shown by the UI.
         */
        getLabel: function() {
            var result = "";

            if (!this.initialized) {
                result += i18n("Install Multiple Components");
            }
            else {
                var childChildData = this.getChildChildData();
                var childChildChildData;
                if (childChildData && childChildData.children) {
                    childChildChildData = childChildData.children[0];
                }
                result += this.getDisplayName(childChildChildData.name, "", i18n("Install"));
                if (childChildChildData.componentProcessName) {
                    result += "\n"+i18n("Process: %s", childChildChildData.componentProcessName);
                }

            }

            return result;
        },

        /**
         * Get the child data for the installMultipleComponentActivity object.
         */
        getSelfChildData: function(data, componentProcessProperties) {
            return [{
                       "name": util.randomString(30),
                       "type": "componentEnvironmentIterator",
                       "tagId": data.tagId,
                       "runOnlyOnFirst": data.runOnlyOnFirst,
                       "children": [
                       {
                           "name": util.randomString(30),
                           "type": "inventoryVersionDiff",
                           "status": data.status,
                           "children": [{
                               "name": data.name,
                               "type": "componentProcess",
                               "componentProcessName": data.componentProcessName,
                               "allowFailure": data.allowFailure,
                               "properties": componentProcessProperties
                           }]
                       }]
                   }];
        },

        getDefaultName: function(tagName) {
            return i18n("Install Tagged: \"%s\"", tagName);
        }
    });
});

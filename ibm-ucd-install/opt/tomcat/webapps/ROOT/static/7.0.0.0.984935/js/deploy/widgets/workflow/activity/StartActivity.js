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
        "deploy/widgets/workflow/activity/BaseActivity"
        ],
function(
        declare,
        BaseActivity
) {
    return declare('deploy.widgets.workflow.activity.StartActivity',  [BaseActivity], {
        getLabel: function() {
            return i18n("Start");
        },
        
        getName: function() {
            return null;
        },
        
        getStyle: function() {
            return "utilityStyle";
        },
        
        canEdit: function() {
            return false;
        },
        
        canDelete: function() {
            return false;
        },

        canCopy: function() {
            return false;
        },
        
        isUtilityCell: function() {
            return true;
        }
    });
});
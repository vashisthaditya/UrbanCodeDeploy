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
        "dijit/_Widget",
        "dojo/_base/declare",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Dialog"
        ],
function(
        _Widget,
        declare,
        ColumnForm,
        Dialog
) {
    return declare('deploy.widgets.approval.ApprovalRevocationDialog',  [_Widget], {
        /**
         * 
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            var dialog = new Dialog({
                closable: true,
                draggable: true
            });
            
            var submitUrl = "";
            if (this.applicationProcessRequestId) {
                submitUrl = bootstrap.restUrl+"deploy/applicationProcessRequest/"+this.applicationProcessRequestId+"/revokeApproval";
            }
            else if (this.componentProcessRequestId) {
                submitUrl = bootstrap.restUrl+"deploy/componentProcessRequest/"+this.componentProcessRequestId+"/revokeApproval";
            }
            
            var responseForm = new ColumnForm({
                submitUrl: submitUrl,
                saveLabel: i18n("Submit"),
                onCancel: function() {
                    dialog.hide();
                    dialog.destroy();
                },
                postSubmit: function() {
                    dialog.hide();
                    dialog.destroy();
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                }
            });
            
            responseForm.addField({
                name: "comment",
                label: i18n("Comment"),
                required: false,
                type: "Text Area"
            });
            responseForm.placeAt(dialog.containerNode);
            dialog.show();
        }
    });
});
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
        "dojo/_base/array",
        "dojo/_base/declare",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Dialog"
        ],
function(
        _Widget,
        array,
        declare,
        ColumnForm,
        Dialog
) {
    return declare('deploy.widgets.approval.TaskResponseDialog',  [_Widget], {
        /**
         * 
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            var dialog = new Dialog({
                title:i18n("Respond"),
                closable: true,
                draggable: true
            });
            
            var responseForm = new ColumnForm({
                submitUrl: bootstrap.restUrl+"approval/task/"+this.task.id+"/close",
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
                name: "passFail",
                type: "Radio",
                label: i18n("Response"),
                required: true,
                allowedValues: [{
                    label: i18n("Approve"),
                    value: "passed"
                },{
                    label: i18n("Reject"),
                    value: "failed"
                }]
            });
            
            if (this.task.commentPrompt) {
                responseForm.addField({
                    name: "commentPrompt",
                    value: this.task.commentPrompt,
                    type: "Label"
                });
            }
            
            responseForm.addField({
                name: "comment",
                label: i18n("Comment"),
                required: this.task.commentRequired,
                type: "Text Area"
            });
            
            array.forEach(this.task.propDefs, function(propDef) {
                if (!propDef.label) {
                    propDef.label = propDef.name;
                }
                propDef.name = "p:"+propDef.name;
                
                responseForm.addField(propDef);
            });
            
            responseForm.placeAt(dialog.containerNode);
            dialog.show();
        }
    });
});
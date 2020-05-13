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
    /**
     *
     */
    return declare('deploy.widgets.application.SingleComponentSelector',  [_Widget], {
        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            // Create the dialog.
            this.dialog = new Dialog({
                title: i18n("Add a Component"),
                closable: true,
                draggable: true,
                "class": "addAppComponentsDialog"
            });

            // Create the form.
            this.form = new ColumnForm({
                submitUrl: bootstrap.restUrl+"deploy/application/"+appState.application.id+"/addComponents",
                addData: function(data) {
                    data.components = data.component;
                    delete data.component;
                },
                postSubmit: function(data) {
                    self.dialog.hide();
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                onCancel: function() {
                    self.dialog.hide();
                }
            });

            this.form.addField({
                name: "component",
                type: "TableFilterMultiSelect",
                url: bootstrap.restUrl+"deploy/application/"+appState.application.id+"/unusedComponents",
                label: i18n("Select a Component"),
                description: i18n("Start typing to filter results. Use * as a wildcard."),
                required: true
            });

            this.form.placeAt(this.dialog.containerNode);

            this.dialog.show();
        },

        /**
         *
         */
        destroy: function() {
            this.inherited(arguments);
        }
    });
});
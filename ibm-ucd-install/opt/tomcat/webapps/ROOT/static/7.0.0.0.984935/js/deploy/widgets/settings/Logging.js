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
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "js/webext/widgets/Alert",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Dialog"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        xhr,
        Alert,
        ColumnForm,
        Dialog
) {
    return declare('deploy.widgets.settings.Logging',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="logging">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            this.existingValues = {};
            if (this.version) {
                this.existingValues = this.version;
            }

            xhr.get({
                url: bootstrap.restUrl+"system/configuration/logconfig",
                load: function(data) {
                    var form = new ColumnForm({
                        cancelLabel: null,
                        submitUrl: bootstrap.restUrl+"system/configuration/logconfig",
                        postSubmit: function(data) {
                            var savedAlert = new Alert({
                                message: i18n("Settings saved successfully.")
                            });
                        }
                    });


                    form.addField({
                        name: "logconfig",
                        label: "",
                        description: i18n("Log config"),
                        value: data,
                        required: false,
                        style: {width: "500px", height: "500px"},
                        type: "Text Area"
                    });

                    form.placeAt(self.formAttach);
                },
                error: function(response) {
                    self.showDisabledUIDialog();
                }
            });
        },

        showDisabledUIDialog: function() {
            var disabledUIDialog = new Dialog({
                title: i18n("Logging Tab"),
                content: i18n("This tab has been disabled. Please contact your system administrator for more information."),
                closable: true,
                draggable: true
            });
            disabledUIDialog.show();
        }
    });
});
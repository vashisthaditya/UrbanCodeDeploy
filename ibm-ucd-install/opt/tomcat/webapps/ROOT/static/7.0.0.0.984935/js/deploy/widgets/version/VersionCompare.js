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
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Alert",
        "deploy/widgets/component/ComponentFileComparison",
        "deploy/widgets/component/ComponentVersionPropSheetDiffReportTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        ColumnForm,
        Alert,
        ComponentFileComparison,
        ComponentVersionPropSheetDiffReportTable
) {
    /**
     *
     */
    return declare('deploy.widgets.version.versionCompare',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class = "versionCompare">'+
              '<div data-dojo-attach-point="formAttach" style="max-height: 500px; overflow: hidden;"></div>'+
              '<div data-dojo-attach-point="tableAttach"></div>'+
              '<div data-dojo-attach-point="propTableAttach"></div>'+
            '</div>',

        /**
         * 
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            this.form = new ColumnForm({
                onSubmit: function (data) {
                    dojo.empty(self.tableAttach);
                    dojo.empty(self.propTableAttach);
                    var otherVersion = data.version;
                    var fileCompare = new ComponentFileComparison({
                        version: self.version,
                        otherVersion: otherVersion
                    });
                    fileCompare.placeAt(self.tableAttach);

                    var propDiffTable = new ComponentVersionPropSheetDiffReportTable({
                        version:self.version,
                        otherVersion: otherVersion
                    });
                    propDiffTable.placeAt(self.propTableAttach);
                },
                preSubmit :function(data){},
                postSubmit: function(data){
                    self.form.unblock();
                },
                cancelLabel: null,
                onError: function(error) {
                    var errorAlert = new Alert({
                        title: i18n("Error"),
                        messages: [i18n("An error has occurred while submitting the compare request:"),
                                   "",
                                   util.escape(error.responseText)]
                    });
                },
                saveLabel: i18n("Submit")
            });

            this.form.addField({
                name: "version",
                label: i18n("Version"),
                required: true,
                type: "TableFilterSelect",
                url: bootstrap.restUrl + "deploy/version",
                defaultQuery: {
                    filterFields: ["component.id", "id", "active"],
                    filterType_id: "ne",
                    filterValue_id: self.version.id,
                    "filterType_component.id": "eq",
                    "filterValue_component.id": appState.component.id,
                    filterType_active: "eq",
                    filterValue_active: true,
                    filterClass_active: "Boolean"
                },
                allowNone: false
            });
            this.form.placeAt(this.formAttach);
            
        },
        
        /**
         * 
         */
        destroy: function() {
            this.inherited(arguments);
            this.form.destroy();
        }
    });
});

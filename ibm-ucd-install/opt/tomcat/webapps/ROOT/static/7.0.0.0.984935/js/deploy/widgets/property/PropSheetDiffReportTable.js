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
define ([
         "dijit/_Widget",
         "dijit/_TemplatedMixin",
         "dojo/_base/declare",
         "dojo/dom-class",
         "dojo/dom-construct",
         "js/webext/widgets/table/TreeTable"
         ],
function(_Widget,
         _TemplatedMixin,
         declare,
         domClass,
         domConstruct,
         TreeTable) {
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="prop-sheet-diff-report-table">'+
              '<div class="containerLabel" data-dojo-attach-point="labelAttach"> </div>'+
              '<div data-dojo-attach-point="treeAttach" class="diffReportTable"></div>'+
            '</div>',

        leftColumnName: i18n("Left"),
        rightColumnName: i18n("Right"),

        applyStatusColor: function(item, cell) {
            if (item.errored) {
                domClass.add(cell, "table-compare-error");
            }
            else if (item.different) {
                domClass.add(cell, "table-compare-changed");
            }
        },
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            this.labelAttach.innerHTML = i18n("Property Difference Report");

            var dataToUse;
            var urlToUse;
            if (self.propSheetDiffReport !== null && self.propSheetDiffReport !== undefined) {
                dataToUse = self.propSheetDiffReport;
            }
            else {
                urlToUse = self.url;
            }
            self.tree = new TreeTable({
                data: dataToUse,
                url: urlToUse,
                hideExpandCollapse: true,
                hidePagination: false,
                hideFooterLinks: true,
                columns: [{
                    name: i18n("Name"),
                    formatter: function(item, value, cell) {
                        self.applyStatusColor(item, cell);
                        return self.getDisplayName(item);
                    }
                },{
                    name: self.leftColumnName,
                    formatter: function(item, value, cell) {
                        self.applyStatusColor(item, cell);
                        return self.getLeftValue(item);
                    }
                },{
                    name: self.rightColumnName,
                    formatter: function(item, value, cell) {
                        self.applyStatusColor(item, cell);
                        return self.getRightValue(item);
                    }
                }]
            });
            self.tree.placeAt(self.treeAttach);
        },

        getDisplayName: function(item) {
            var name = item.name;
            if (item.leftPropDef) {
                name = i18n(item.leftPropDef.label);
            }
            else if (item.rightPropDef) {
                name = i18n(item.rightPropDef.label);
            }
            return name;
        },

        getLeftSecurity: function(item) {
            var result = "";
            if (item.leftPropValue) {
                result = item.leftPropValue.secure;
            }
            else if (item.leftPropDef) {
                result = item.leftPropDef.secure;
            }
        },

        getRightSecurity: function(item) {
            var result = "";
            if (item.rightPropValue) {
                result = item.rightPropValue.secure;
            }
            else if (item.rightPropDef) {
                result = item.rightPropDef.secure;
            }
        },

        getLeftValue: function(item) {
            var result = "";
            if (item.leftPropValue) {
                result = item.leftPropValue.value;
            }
            else if (item.leftPropDef) {
                result = item.leftPropDef.value;
            }

            return result;
        },

        getRightValue: function(item) {
            var result = "";
            if (item.rightPropValue) {
                result = item.rightPropValue.value;
            }
            else if (item.rightPropDef) {
                result = item.rightPropDef.value;
            }

            return result;
        }
    });
});

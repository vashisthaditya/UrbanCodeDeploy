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
         "dojo/_base/declare",
         "dojo/dom-class",
         "dojo/dom-construct",
         "dojo/on",
         "js/webext/widgets/Dialog",
         "deploy/widgets/Formatters",
         "deploy/widgets/resource/ResourceCompareTree",
         "deploy/widgets/property/TransientPropSheetDiffReportTable"
         ],
function(
        declare,
        domClass,
        domConstruct,
        on,
        Dialog,
        Formatters,
        ResourceCompareTree,
        TransientPropSheetDiffReportTable
        ) {
    return declare([ResourceCompareTree], {
        readOnly: true,
        leftColumnName: i18n("Local Resources"),
        rightColumnName: i18n("Discovered Resources"),
        selectable: false,

        postCreate: function() {
            this.inherited(arguments);
        },

        viewPropertiesFormatter: function(item, value, cell) {
            var result = domConstruct.create("a", {
                className: "linkPointer",
                innerHTML: i18n("View Properties")
            });
            
            on(result, "click", function() {
                var dialog = new Dialog({
                    title: i18n("Compare Properties")
                });
                
                var diffTable = new TransientPropSheetDiffReportTable({
                    propSheetDiffReport: item.propertyComparison
                });
                diffTable.placeAt(dialog.containerNode);
                
                dialog.show();
            });
            
            return result;
        },

        differenceFormatter: function(item, value, cell) {
            var result = domConstruct.create("div");
            
            if (item.pathChangeType === "EQUIVALENT") {
                domConstruct.create("div", {
                    innerHTML: i18n("No Change")
                }, result);
            }
            else if (item.pathChangeType === "RIGHT_ONLY") {
                domConstruct.create("div", {
                    innerHTML: i18n("Cell Only")
                }, result);
                domClass.add(cell, "table-compare-changed");
            }
            else if (item.pathChangeType === "LEFT_ONLY") {
                domConstruct.create("div", {
                    innerHTML: i18n("Local Only")
                }, result);
                domClass.add(cell, "table-compare-changed");
            }
            else if (item.pathChangeType === "PROPERTY_DIFFERENCE") {
                domConstruct.create("div", {
                    innerHTML: i18n("Properties Changed")
                }, result);
                domClass.add(cell, "table-compare-changed");
            }
            else if (item.pathChangeType === "CHILDREN_CHANGED") {
                domConstruct.create("div", {
                    innerHTML: i18n("Children Changed")
                }, result);
                domClass.add(cell, "table-compare-children-changed");
            }

            return result;
        },

        rightResourceLinkformatter: function(item, value, cell) {
            var result = "";
            if (item.rightResource) {
                result = Formatters.resourceNonLinkFormatter(item.rightResource);
            }

            if (item.pathChangeType === "LEFT_ONLY") {
                domClass.add(cell, "resource-compare-placeholder-cell");
            }
            return result;
        }
    });
});
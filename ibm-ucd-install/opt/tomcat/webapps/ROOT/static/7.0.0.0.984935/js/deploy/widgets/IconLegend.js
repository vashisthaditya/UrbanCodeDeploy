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
/*global define*/


define([
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dojo/_base/declare",
        "dojo/dom-construct",
        "dojo/string"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        domConstruct,
        string
) {
    /**
     * Icon Legend Widget - Displays a little grid of icons and their legends.
     * Icon size defaults to 28px square;
     *
     * Requires an "iconData" parameter with the a 2D grid of icon attributes:
     *
     * [columnIndex][rowIndex]["iconClass"] == "my-icon-class";
     * [columnIndex][rowIndex]["legend"] == "My icon legend";
     *
     * i.e:
     * [
     *
     * iconData: [
     *       // First Column
     *       [
     *           {iconClass: "match", legend: i18n("Equal value")},
     *           {iconClass: "no-match", legend: i18n("Not equal")},
     *       ],
     *       // Second Column
     *       [
     *           {iconClass: "missing", legend: i18n("Property Undefined")},
     *           {iconClass: "no-value-required", legend: i18n("Missing required value")}
     *       ],
     *       // Third Column
     *       [
     *           {iconClass: "secure", legend: i18n("Secure property")}
     *       ]
     *   ]
     *
     * Also can accept an optional "staticIconClass" if all icons need a particular class.
     */
    return declare('deploy.widgets.IconLegend',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="legend-container">' +
                '<div class="legend-title">'+i18n('Key')+'</div>' +
                '<div class="legend-table" data-dojo-attach-point="legendTable"></div>' +
            '</div>',


        postCreate: function() {
            this.inherited(arguments);

            this.staticIconClass = this.staticIconClass || "";

            this.redraw();
        },

        redraw: function() {
            this.legendTable.innerHTML = "";
            this.iconData.forEach(function(columnData) {
                domConstruct.place(this.generateLegendColumnDom(columnData), this.legendTable);
            }, this);
        },

        keyTableTemplate: '<div class="legend-column"></div>',

        generateLegendColumnDom: function(columnData) {
            var columnDom = domConstruct.toDom(string.substitute(this.keyTableTemplate, {}));

            columnData.forEach(function(keyDatum) {
                domConstruct.place(this.generateKeyRowDom(keyDatum), columnDom);
            }, this);

            return columnDom;
        },

        keyRowTemplate:
            '<div class="legend-row">' +
                '<div class="legend-cell">' +
                    '<div class="legend-icon ${staticIconClass} ${iconClass}"></div>' +
                    '<div class="legend-icon-legend">' +
                        '<span>${iconLabel}</span>' +
                    '</div>' +
                '</div>' +
            '</div>',

        generateKeyRowDom: function(keyDatum) {
            return domConstruct.toDom(string.substitute(this.keyRowTemplate, {
                iconLabel: keyDatum.legend,
                iconClass: keyDatum.iconClass,
                staticIconClass: this.staticIconClass
            }));
        }
    });
});

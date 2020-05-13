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
    "dojo/string",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojox/html/entities"
], function(
    _TemplatedMixin,
    _Widget,
    declare,
    string,
    domClass,
    domConstruct,
    entities
) {
    /**
     * Little side-by-side comparison of actual properties from Environments.  Designed for use in a tooltip or dialog.
     */
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="property-comparison-popup">' +
            '    <div class="title" data-dojo-attach-point="titleDiv"></div>' +
            '    <table>' +
            '        <thead>' +
            '            <tr data-dojo-attach-point="headerRow"></tr>' +
            '        </thead>' +
            '        <tbody>' +
            '            <tr data-dojo-attach-point="propertyValueRow"></tr>' +
            '        </tbody>' +
            '    </table>' +
            '</div>',

        postCreate: function() {
            this.inherited(arguments);

            this.titleDiv.innerText = i18n("Property Comparison Detail");

            this.generateEnvironmentHeaders();
            this.generateBody();
        },

        generateEnvironmentHeaders: function() {
            this.headerRow.innerHTML = "";

            domConstruct.place('<td></td>', this.headerRow);
            domConstruct.place(this.generateEnvironmentHeaderDom(this.referenceEnvironment), this.headerRow);
            domConstruct.place(this.generateEnvironmentHeaderDom(this.environment), this.headerRow);
        },

        environmentHeaderTemplate: '<td>${environmentName}</td>',

        generateEnvironmentHeaderDom: function(environment) {
            return domConstruct.toDom(string.substitute(this.environmentHeaderTemplate, {
                environmentName: entities.encode(environment.name)
            }));
        },

        generateBody: function() {
            this.propertyValueRow.innerHTML = "";

            domConstruct.place('<th>' + entities.encode(this.propDef.name) + '</th>', this.propertyValueRow);
            domConstruct.place(this.generatePropertyCellDom(this.referenceEnvironment, this.propDef), this.propertyValueRow);
            domConstruct.place(this.generatePropertyCellDom(this.environment, this.propDef), this.propertyValueRow);
        },

        propertyCellTemplate: '<td class="${cellClass}">${propertyValue}</td>',

        generatePropertyCellDom: function(environment, propDef) {
            var property = this.dataManager.getProperty(propDef, environment);

            var escapedValue = entities.encode(property.value || "");
            var cellClass = "";
            if (!escapedValue) {
                escapedValue = '(' + i18n("Empty") +')';
                cellClass = "empty";
            }

            escapedValue = escapedValue.replace("\n", "<br>");

            return domConstruct.toDom(string.substitute(this.propertyCellTemplate, {
                cellClass: cellClass,
                propertyValue: escapedValue
            }));
        }
    });
});

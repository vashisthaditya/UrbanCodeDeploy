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
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/dom-construct",
        "deploy/widgets/environmentComparison/ComponentPropertiesTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        array,
        declare,
        xhr,
        domConstruct,
        ComponentPropertiesTable
) {
    return declare('deploy.widgets.environmentComparison.EnvironmentConfigComparison',  [_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="environmentConfigComparison">' + 
                '<div data-dojo-attach-point="tableAttach"></div>' +
            '</div>',

        /**
         * 
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            this.componentPropertiesTables = [];

            xhr.get({
                url: bootstrap.restUrl+"deploy/component",
                content: {
                    filterFields: ["applications.id"],
                    "filterValue_applications.id": self.application.id,
                    "filterType_applications.id": "eq",
                    "filterClass_applications.id": "UUID"
                },
                handleAs: "json",
                load: function(data) {
                    if (data && data.length < 1) {
                        var notFoundDiv = domConstruct.create("div", {
                            innerHTML: i18n("No configuration comparisons found."),
                            style: "margin:10px;"
                        });
                        domConstruct.place(notFoundDiv, self.tableAttach);
                    }
                    array.forEach(data, function(component) {
                        if (self.componentPropertiesTables.length !== 0) {
                            domConstruct.create("div", {
                                "class": "hr",
                                style: {
                                    "marginTop": "15px"
                                }
                            }, self.tableAttach);
                        }

                        var componentPropertiesTable = new ComponentPropertiesTable({
                            component: component,
                            environment1: self.environment1,
                            environment2: self.environment2
                        });
                        self.componentPropertiesTables.push(componentPropertiesTable);
                        
                        componentPropertiesTable.placeAt(self.tableAttach);
                    });
                }
            });
        },

        /**
         * 
         */
        destroy: function() {
            this.inherited(arguments);
            
            array.forEach(this.componentPropertiesTables, function(componentPropertiesTable) {
                componentPropertiesTable.destroy();
            });
        }
    });
});
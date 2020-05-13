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
        "deploy/widgets/component/ComponentFileTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Array,
        declare,
        xhr,
        domConstruct,
        ComponentFileTable
) {
    return declare('deploy.widgets.component.EnvironmentFileComparison',  [_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="environmentFileComparison">' + 
                '<div data-dojo-attach-point="tableAttach"></div>' +
            '</div>',

        /**
         * 
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            this.componentFileTables = [];

            xhr.get({
                url: bootstrap.restUrl+"deploy/component",
                content: {
                    filterFields: ["applications.id"],
                    "filterValue_applications.id": self.application.id,
                    "filterType_applications.id": "eq",
                    "filterClass_applications.id": "UUID",
                    "outputType": ["BASIC", "LINKED"]
                },
                handleAs: "json",
                load: function(data) {
                    if (data && data.length < 1) {
                        var noDataDiv = domConstruct.create("div", {
                            innerHTML: i18n("No files found."),
                            style: "margin:10px;"
                        });
                        domConstruct.place(noDataDiv, self.tableAttach);
                    }
                    Array.forEach(data, function(component) {
                        xhr.get({
                            url: bootstrap.restUrl+"deploy/environment/"+self.environment1.id+"/compareFiles/"+self.environment2.id+"/"+component.id,
                            handleAs: "json",
                            load: function(item) {
                                if (self.componentFileTables.length !== 0) {
                                    domConstruct.create("div", {
                                        "class": "hr",
                                        style: {
                                            "marginTop": "15px"
                                        }
                                    }, self.tableAttach);
                                }
                                
                                if (item.tooMany) {
                                    domConstruct.create("div", {
                                        "class": "containerLabel",
                                        innerHTML: i18n("File Difference Report for %s", component.name.escape())+"<br/><br/>"
                                    }, self.tableAttach);
                                    domConstruct.create("div", {
                                        innerHTML: i18n("One or both environments contain more than one version of component %s", component.name.escape()),
                                        style: {
                                            marginLeft: "40px"
                                        }
                                    }, self.tableAttach);
                                }
                                else if (!item.environment1Version) {
                                    domConstruct.create("div", {
                                        "class": "containerLabel",
                                        innerHTML: i18n("File Difference Report for %s", component.name.escape())+"<br/><br/>"
                                    }, self.tableAttach);
                                    domConstruct.create("div", {
                                        innerHTML: i18n("No version of component %s has been deployed to %s.", component.name.escape(), self.environment1.name.escape()),
                                        style: {
                                            marginLeft: "40px"
                                        }
                                    }, self.tableAttach);
                                }
                                else if (!item.environment2Version) {
                                    domConstruct.create("div", {
                                        "class": "containerLabel",
                                        innerHTML: i18n("File Difference Report for %s", component.name.escape())+"<br/><br/>"
                                    }, self.tableAttach);
                                    domConstruct.create("div", {
                                        innerHTML: i18n("No version of component %s has been deployed to %s.", component.name.escape(), self.environment2.name.escape()),
                                        style: {
                                            marginLeft: "40px"
                                        }
                                    }, self.tableAttach);
                                }
                                else {
                                    var fileCompare = new ComponentFileTable({
                                        component: component,
                                        version: item.environment1Version,
                                        otherVersion: item.environment2Version,
                                        title1: "Environment: "+self.environment1.name,
                                        title2: "Environment: "+self.environment2.name
                                    });
                                    self.componentFileTables.push(fileCompare);
                                    fileCompare.placeAt(self.tableAttach);
                                }
                            }
                        });
                    });
                }
            });
        },

        /**
         * 
         */
        destroy: function() {
            this.inherited(arguments);
            Array.forEach(this.componentFileTables, function(componentFileTable) {
                componentFileTable.destroy();
            });
        }
    });
});
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
         "dojo/_base/array",
         "dojo/_base/declare",
         "dojo/_base/xhr",
         "dojo/dom-construct",
         "dojo/dom-class",
         "js/webext/widgets/table/TreeTable",
         "deploy/widgets/component/ComponentConfigTemplates",
         "deploy/widgets/environment/EnvironmentResourceTree",
         "deploy/widgets/property/PropDefs",
         "deploy/widgets/property/PropValues",
         "deploy/widgets/property/PropSheetDefValues"
         ],
function(
        _Widget,
        _TemplatedMixin,
        array,
        declare,
        xhr,
        domConstruct,
        domClass,
        TreeTable,
        ComponentConfigTemplates,
        EnvironmentResourceTree,
        PropDefs,
        PropValues,
        PropSheetDefValues
){

/**
 *
 */
    return declare(
        [_Widget, _TemplatedMixin],
        {
            templateString:
                '<div class="configurationTree">'+
                    '<div class="configurationTreeContainer">'+
                      '<div class="configurationTreeDiv" data-dojo-attach-point="treeAttach"></div>'+
                      '<div class="configurationDetail">'+
                          '<div data-dojo-attach-point="detailAttach"></div>'+
                      '</div>'+
                    '</div>'+
                '</div>',

            /**
             *
             */
            postCreate: function() {
                this.inherited(arguments);
                this.showTree();
            },

            /**
             * 
             */
            destroy: function() {
                this.inherited(arguments);
                this.tree.destroy();
            },

            /**
             *
             */
            showTree: function() {
                var self = this;

                if (this.tree !== undefined) {
                    this.tree.destroy();
                }
                var gridLayout = [{
                    name: i18n("Application, Component, or Environment"),
                    formatter: function(item, result, cellDom) {
                        cellDom.onclick = function() {
                            self.loadConfigurationDetails(item);
                        };
                        return item.name;
                    },
                    orderField: "name",
                    filterField: "name",
                    filterType: "text",
                    getRawValue: function(item) {
                        return item.name;
                    },
                    field: "name",
                    style: { 'word-break': 'break-word' }
                }];

                this.tree = new TreeTable({
                    url: bootstrap.restUrl+"deploy/configuration/configurationTree",
                    columns: gridLayout,
                    serverSideProcessing: false,
                    orderField: "name",
                    noDataMessage: i18n("No Applications, Environments or Components have been configured yet."),
                    tableConfigKey: "configurationTreeTable",
                    style: {
                        "wordBreak": "normal"
                    }
                });
                domClass.add(this.tree.expandCollapseAttach, "centered-expand-collapse"); 
                this.tree.placeAt(this.treeAttach);
            },

            /**
             * 
             */
            showSelectedArrow: function(rowArrowContainer) {
                if (this.selectedArrow !== undefined) {
                    this.selectedArrow.className = "hidden";
                }
                rowArrowContainer.className = "";
                this.selectedArrow = rowArrowContainer;
            },

            /**
             * 
             */
            loadConfigurationDetails: function(item) {
                var self = this;

                domConstruct.empty(this.detailAttach);
                array.forEach(this.detailWidgets, function(widget) {
                    widget.destroy();
                });
                this.detailWidgets = [];

                var title = "";
                if (item.objectType === "Application") {
                    title = i18n("Application: %s", item.name);
                }
                else if (item.objectType === "Component") {
                    title = i18n("Component: %s", item.name);
                }
                else if (item.objectType === "Environment") {
                    title = i18n("Configuration of %s in %s", item.component.name, item.name);
                }

                var heading = document.createElement("div");
                heading.className = "containerLabel";
                heading.style.padding = "10px";
                heading.innerHTML = title.escape();
                this.detailAttach.appendChild(heading);

                var headingHr = document.createElement("div");
                headingHr.className = "hr";
                this.detailAttach.appendChild(headingHr);

                var propValues, propsHeading; // = undefined
                if (item.objectType === "Application") {
                    propsHeading = document.createElement("div");
                    propsHeading.className = "containerLabel";
                    propsHeading.innerHTML = i18n("Properties");
                    propsHeading.style.padding = "5px 0px 10px 0px";
                    this.detailAttach.appendChild(propsHeading);

                    propValues = new PropValues({
                        propSheet: item.propSheet,
                        readOnly: !item.security["Manage Properties"]
                    });
                    propValues.placeAt(this.detailAttach);
                    this.detailWidgets.push(propValues);
                }
                else if (item.objectType === "Component") {
                    xhr.get({
                        url: bootstrap.restUrl+"deploy/component/"+item.id,
                        handleAs: "json",
                        load: function(data) {
                            propsHeading = document.createElement("div");
                            propsHeading.className = "containerLabel";
                            propsHeading.innerHTML = i18n("Properties");
                            propsHeading.style.padding = "5px 0px 10px 0px";
                            self.detailAttach.appendChild(propsHeading);

                            propValues = new PropValues({
                                propSheet: data.propSheet,
                                readOnly: !data.security["Manage Properties"]
                            });
                            propValues.placeAt(self.detailAttach);
                            self.detailWidgets.push(propValues);

                            var propDefsHeadingHr = document.createElement("div");
                            propDefsHeadingHr.className = "hr";
                            self.detailAttach.appendChild(propDefsHeadingHr);

                            var propDefsHeading = document.createElement("div");
                            propDefsHeading.className = "containerLabel";
                            propDefsHeading.innerHTML = i18n("Environment Property Definitions");
                            propDefsHeading.style.padding = "5px 0px 10px 0px";
                            self.detailAttach.appendChild(propDefsHeading);

                            var descriptionDiv = document.createElement("div");
                            descriptionDiv.className = "description";
                            descriptionDiv.innerHTML = i18n("Define properties here to be given values on each environment the component is used in.");
                            self.detailAttach.appendChild(descriptionDiv);

                            var environmentPropDefs = new PropDefs({
                                propSheetDef: data.environmentPropSheetDef,
                                readOnly: !data.security["Manage Properties"]
                            });
                            environmentPropDefs.placeAt(self.detailAttach);
                            self.detailWidgets.push(environmentPropDefs);

                            var templatesHeadingHr = document.createElement("div");
                            templatesHeadingHr.className = "hr";
                            self.detailAttach.appendChild(templatesHeadingHr);

                            var templatesHeading = document.createElement("div");
                            templatesHeading.className = "containerLabel";
                            templatesHeading.innerHTML = i18n("Configuration Templates");
                            templatesHeading.style.padding = "5px 0px 10px 0px";
                            self.detailAttach.appendChild(templatesHeading);

                            var configTemplates = new ComponentConfigTemplates({
                                component: data
                            });
                            configTemplates.placeAt(self.detailAttach);
                            self.detailWidgets.push(configTemplates);
                        }
                    });
                }
                else if (item.objectType === "Environment") {
                    xhr.get({
                        url: bootstrap.restUrl+"deploy/component/"+item.component.id,
                        handleAs: "json",
                        load: function(component) {
                            var groupListHeading = document.createElement("div");
                            groupListHeading.className = "containerLabel";
                            groupListHeading.innerHTML = i18n("Resources");
                            groupListHeading.style.padding = "5px 0px 10px 0px";
                            self.detailAttach.appendChild(groupListHeading);

                            var resourceList = new EnvironmentResourceTree({
                                environment: item,
                                rightPanelClass: "configuration-table"
                            });
                            resourceList.placeAt(self.detailAttach);
                            self.detailWidgets.push(resourceList);

                            var propertiesHr = document.createElement("div");
                            propertiesHr.className = "hr";
                            self.detailAttach.appendChild(propertiesHr);

                            propsHeading = document.createElement("div");
                            propsHeading.className = "containerLabel";
                            propsHeading.innerHTML = i18n("Environment Properties");
                            propsHeading.style.padding = "5px 0px 10px 0px";
                            self.detailAttach.appendChild(propsHeading);

                            var propertyFormHolder = domConstruct.create("div");
                            domConstruct.place(propertyFormHolder, self.detailAttach);
                            xhr.get({
                                url: bootstrap.restUrl+"deploy/environment/"+item.id+"/mappingProperties/"+component.id,
                                load: function() {
                                    var propertiesForm = new PropSheetDefValues({
                                        propSheetDefPath: component.environmentPropSheetDef.path,
                                        propSheetPath: "applications/"+item.application.id+"/environments/"+item.id+"/properties/"+component.id,
                                        getValuesUrl: bootstrap.restUrl+"deploy/environment/"+item.id+"/mappingProperties/"+component.id,
                                        noPropertiesMessage: i18n("No environment properties have been defined by this component."),
                                        readOnly: !item.security["Manage Properties"]
                                    });
                                    self.detailWidgets.push(propertiesForm);
                                    propertiesForm.placeAt(propertyFormHolder);
                                }
                            });

                            var allPropertiesHr = document.createElement("div");
                            allPropertiesHr.className = "hr";
                            self.detailAttach.appendChild(allPropertiesHr);
                            
                            var allPropsHeading = document.createElement("div");
                            allPropsHeading.className = "containerLabel";
                            allPropsHeading.innerHTML = i18n("Environment Properties (All Components)");
                            allPropsHeading.style.padding = "5px 0px 10px 0px";
                            self.detailAttach.appendChild(allPropsHeading);

                            propValues = new PropValues({
                                propSheet: item.propSheet,
                                readOnly: !item.security["Manage Properties"]
                            });
                            propValues.placeAt(self.detailAttach);
                            self.detailWidgets.push(propValues);
                        }
                    });
                }
            }
        }
    );
});

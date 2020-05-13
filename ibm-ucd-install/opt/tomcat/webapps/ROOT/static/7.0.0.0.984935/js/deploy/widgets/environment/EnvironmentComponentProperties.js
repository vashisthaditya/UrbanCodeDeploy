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
        "dojo/dom-construct",
        "dojo/_base/lang",
        "dojo/_base/xhr",
        "deploy/widgets/environment/EnvironmentComponentProperty",
        "js/webext/widgets/Alert",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/FieldList",
        "js/webext/widgets/select/WebextSelect",
        "dojox/data/JsonRestStore",
        "deploy/widgets/property/PropSheetDefValues"
        ],
function(
        _TemplatedMixin,
        _Widget,
        array,
        declare,
        domConstruct,
        lang,
        xhr,
        EnvironmentComponentProperty,
        Alert,
        ColumnForm,
        FieldList,
        WebextSelect,
        JsonRestStore,
        PropSheetDefValues
) {
    return declare('deploy.widgets.environment.EnvironmentComponentProperties',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="environmentComponentProperties">'+
                '<div data-dojo-attach-point="filterScrollAttach" style="margin-bottom: 20px;"></div>' +
                '<hr>' +
                '<div data-dojo-attach-point="noDataMessageAttach" style="margin-top: 20px; font-size: 14px; text-align: center;"></div>' +
                '<div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        form: null,
        componentPropSheetForm: null,
        /**
         * 
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            var selectStore = new JsonRestStore({
                target: bootstrap.restUrl+"deploy/application/"+this.environment.application.id+"/components",
                idAttribute: 'id'
            });

            var filter = new WebextSelect({
                store: selectStore,
                onChange: function(value) {
                    if (!!self.componentPropSheetForm) {
                        self.componentPropSheetForm.destroy();
                    }
                    if (!!self.form) {
                        self.form.destroy();
                    }
                    if (!!self.noDataMessageAttach) {
                        domConstruct.empty(self.noDataMessageAttach);
                    }
                    if (!!value && value!=="") {
                        self.showComponentProperties(value);
                    }
                    else {
                        xhr.get({
                            url: bootstrap.restUrl+"deploy/environment/"+self.environment.id+"/componentProperties",
                            handleAs: "json",
                            load: function(data) {
                                self.showAllProperties(data);
                            }
                        });
                    }
                },
                allowNone: true,
                pageSize: 10,
                label: i18n("Filter By Component")
            });

            this.filterContainer = new FieldList();
            this.filterContainer.insertField(filter);
            this.filterContainer.placeAt(this.filterScrollAttach);

            xhr.get({
                url: bootstrap.restUrl+"deploy/environment/"+self.environment.id+"/componentProperties",
                handleAs: "json",
                load: function(data) {
                    self.showAllProperties(data);
                }
            });
        },

        showComponentProperties: function(component) {
            var self = this;

            xhr.get({
                url: bootstrap.restUrl+"deploy/environment/"+self.environment.id + "/componentPropertySheets/"+component,
                handleAs: "json",
                load: function(data) {
                    self.componentPropSheetForm = new PropSheetDefValues({
                        propSheetDefPath: data.propSheetDef.path,
                        propSheetPath: data.propSheet.path,
                        showVersions: true,
                        propSheetVersion: data.propSheet.version,
                        propSheetVersionCount: data.propSheet.versionCount,
                        readOnly: !self.environment.extendedSecurity["Manage Properties"]
                    });
                    self.componentPropSheetForm.placeAt(self.formAttach);
                }
            });
        },

        showAllProperties: function(propertyDataArray) {
            var self = this;
            var propertyWidgets = [];

            if (propertyDataArray[0]) {
                this.form = new ColumnForm({
                    submitUrl: bootstrap.restUrl+"deploy/environment/"+this.environment.id+"/componentProperties",
                    validateFields: function() {
                        var result = [];

                        array.forEach(propertyWidgets, function(propertyWidget) {
                            if (propertyWidget.form.validateRequired().length > 0) {
                                result.push(i18n("Missing required value for field %s", propertyWidget.getLabel()));
                            }
                            //Check that the PropertyDef patterns are respected
                            propertyWidget.validatePattern(result);
                        });

                        return result;
                    },
                    readOnly: !this.environment.security["Manage Properties"],
                    cancelLabel: null,
                    addData: function(data) {
                        self.flattenProperties(data);
                    },
                    postSubmit: function(data) {
                        var savedAlert = new Alert({
                            message: i18n("Properties saved.")
                        });
                    }
                });

                array.forEach(propertyDataArray, function(propertyData) {
                    var propertyWidget = new EnvironmentComponentProperty({
                        readOnly: !self.environment.security["Manage Properties"],
                        propertyData: propertyData
                    });
                    propertyWidgets.push(propertyWidget);

                    self.form.addField({
                        name: propertyData.name,
                        widget: propertyWidget
                    });
                });

                this.form.placeAt(this.formAttach);
            }
            else {
                this.noDataMessageAttach.innerHTML = i18n("There are no Component Environment Properties to display.");
            }
        },

        flattenProperties: function(data) {
            var sourceData = lang.clone(data);
            
            var propertyName;
            for (propertyName in sourceData) {
                if (sourceData.hasOwnProperty(propertyName)) {
                    delete data[propertyName];
                    
                    var propertyData = sourceData[propertyName];
                    
                    var subPropertyName;
                    for (subPropertyName in propertyData) {
                        if (propertyData.hasOwnProperty(subPropertyName)) {
                            data[subPropertyName] = propertyData[subPropertyName];
                        }
                    }
                }
            }
        }
    });
});
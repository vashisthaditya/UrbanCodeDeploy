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
        "dijit/_Templated",
        "dijit/_Widget",
        "dijit/form/Button",
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/xhr",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/json",
        "dojo/on",
        "js/webext/widgets/Alert",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _Templated,
        _Widget,
        Button,
        array,
        declare,
        lang,
        xhr,
        domClass,
        domConstruct,
        JSON,
        on,
        Alert,
        ColumnForm,
        Dialog,
        Table
) {
    /**
     *
     */
    return declare('deploy.widgets.resource.ResourceRolePropertyEditor',  [_Widget, _Templated], {
        templateString:
            '<div class="resourceRolePropertyEditor">' +
                '<div data-dojo-attach-point="titleAttach" class="resourceRolePropertyEditorTitle"></div>' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            var self = this;
            var form = new ColumnForm();

            var resetLinks = {};
            var defaultLabels = {};

            this.titleAttach.innerHTML = i18n("Role Properties: %s", self.role.name.escape());

            var gridRestUrl = bootstrap.restUrl+"resource/resourceRole/"+self.role.id+"/propertiesForTableEditor";
            if (self.resource && self.resource.id) {
                gridRestUrl = bootstrap.restUrl+"resource/resource/"+self.resource.id+"/propertiesForRole/"+self.role.id;
            }
            var gridLayout = [{
                    name: i18n("Property"),
                    orderField: "label",
                    filterField: "label",
                    filterType: "text",
                    getRawValue: function(item) {
                        return item.propDef.label;
                    },
                    formatter: function(item, value, cell) {
                        var result = document.createElement("div");

                        result.innerHTML = item.propDef.label ? item.propDef.label.escape() : "";

                        if (item.propDef.required) {
                            cell.style.fontWeight = "bold";

                            var required = document.createElement("span");
                            required.className = "required";
                            required.innerHTML = "*";
                            result.appendChild(required);
                        }

                        return result;
                    }
                },{
                    name: i18n("Description"),
                    formatter: function(item) {
                        return item.propDef.description;
                    }
                },{
                    name: i18n("Value"),
                    formatter: function(item, value, cell) {
                        var fieldPropDef = lang.clone(item.propDef);
                        fieldPropDef.value = self.getValueForItem(item);
                        if (item.propValue) {
                            fieldPropDef.defaultLabel = item.propValue.label;
                        } else {
                            fieldPropDef.defaultLabel = item.propDef.defaultLabel;
                        }
                        fieldPropDef.onChange = function(value, selectedItem) {
                            item.value = value;
                            item.label = selectedItem.label;

                            var resetLink = resetLinks[item.propDef.name];
                            var defaultLabel = defaultLabels[item.propDef.name];
                            if (resetLink && defaultLabel) {
                                if (item.value === item.propDef.value) {
                                    domClass.add(resetLink, "hidden");
                                    domClass.remove(defaultLabel, "hidden");
                                }
                                else {
                                    domClass.remove(resetLink, "hidden");
                                    domClass.add(defaultLabel, "hidden");
                                }
                            }
                        };
                        if (fieldPropDef.type === "HTTP_MULTI_SELECT") {
                            util.updateWebextMultiSelectData(fieldPropDef, item,
                                "value", "label", false);
                        }

                        var field = form.delegates.delegates[item.propDef.type](fieldPropDef);
                        return field;
                    }
                },{
                    name: i18n("Actions"),
                    formatter: function(item) {
                        var result = document.createElement("div");

                        if (item.propDef.type !== "SECURE") {
                            var resetLink = domConstruct.create("a", {
                                "innerHTML": i18n("Reset to Default"),
                                "class": "linkPointer"
                            }, result);
                            on(resetLink, "click", function() {
                                item.value = item.propDef.value;
                                self.propertyGrid.loadTable();
                            });

                            var defaultLabel = document.createElement("span");
                            defaultLabel.innerHTML = i18n("Using Default");
                            result.appendChild(defaultLabel);

                            resetLinks[item.propDef.name] = resetLink;
                            defaultLabels[item.propDef.name] = defaultLabel;

                            if (self.getValueForItem(item) === item.propDef.value) {
                                domClass.add(resetLinks[item.propDef.name], "hidden");
                                domClass.remove(defaultLabels[item.propDef.name], "hidden");
                            }
                            else {
                                domClass.remove(resetLinks[item.propDef.name], "hidden");
                                domClass.add(defaultLabels[item.propDef.name], "hidden");
                            }
                        }

                        return result;
                    }
                }];

            this.propertyGrid = new Table({
                url: gridRestUrl,
                serverSideProcessing: false,
                tableConfigKey: "resourceRolePropList",
                noDataMessage: i18n("No properties are available on this role."),
                columns: gridLayout,
                hideExpandCollapse: true,
                hidePagination: false,
                style: {
                    minWidth: "650px"
                }
            });

            self.propertyGrid.placeAt(self.gridAttach);
        },

        getValueForItem: function(item) {
            var value = item.value;
            if (value === undefined && item.propValue !== undefined) {
                value = item.propValue.value;
            }
            if (value === undefined) {
                value = item.propDef.value;
            }
            if (item.propDef.type === "MULTI_SELECT") {
                if (lang.isArray(value)) {
                    value = value.join(",");
                }
            }

            return value;
        },

        _getValueAttr: function() {
            var self = this;

            var submitData = {};
            array.forEach(self.propertyGrid.cachedData, function(item) {
                var value = self.getValueForItem(item);
                submitData[item.propDef.name] = value;
                var labelName = item.propDef.name +  '/HTTP_SELECT_LABEL';
                submitData[labelName] = item.label;
            });

            return submitData;
        },

        getValidationErrors: function() {
            var self = this;
            var offendingFields = [];

            array.forEach(self.propertyGrid.cachedData, function(item) {
                var value = self.getValueForItem(item);

                if (!value && item.propDef.required) {
                    offendingFields.push(i18n("%s is a required field.", item.propDef.label));
                }
            });

            return offendingFields;
        }
    });
});

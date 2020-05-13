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
        "dijit/form/Select",
        "dojo/_base/declare",
        "js/webext/widgets/FormDelegates",
        "js/webext/widgets/RestSelect"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Select,
        declare,
        FormDelegates,
        RestSelect
        ) {
    /**
     *
     */
    return declare('deploy.widgets.version.VersionSelector',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="versionSelector">' +
                '<div data-dojo-attach-point="typeAttach" class="versionSelectorComponent"></div>' +
                '<div data-dojo-attach-point="valueAttach" class="versionSelectorComponent" style="vertical-align: bottom" ></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            var valueSelect = null;
            var typeSelect = new Select({
                options: [{
                    label: i18n("None"),
                    value: "none"
                },{
                    label: i18n("Specific Version"),
                    value: "version"
                },{
                    label: i18n("Latest Version"),
                    value: "latestVersion"
                },{
                    label: i18n("Latest With Status"),
                    value: "latestWithStatus"
                },{
                    label: i18n("All With Status"),
                    value: "allWithStatus"
                },{
                    label: i18n("All In Environment"),
                    value: "allInEnvironment"
                },{
                    label: i18n("All In Environment (Reversed)"),
                    value: "reverseAllInEnvironment"
                }],
                onChange: function(typeValue) {
                    if (valueSelect !== null) {
                        valueSelect.destroy();
                        self.value = undefined;
                    }

                    if (typeValue.toLowerCase() === "version") {
                        var restUrl;

                        if (self.environment) {
                            restUrl = bootstrap.restUrl+"deploy/environment/"+self.environment.id+"/versions/"+self.component.id;
                            valueSelect = new RestSelect({
                                "restUrl": restUrl,
                                value: self.subValue,
                                allowNone: false,
                                noIllegalValues: true,
                                onChange: function(value) {
                                    if (value) {
                                        self.value = typeValue+"/"+value;
                                    }
                                    else {
                                        self.value = undefined;
                                    }
                                }
                            });
                        }
                        else {
                            restUrl = bootstrap.restUrl + "deploy/version/";

                            valueSelect = FormDelegates.retrieveDelegate("TableFilterSelect")({
                                url: restUrl,
                                value: self.subValue,
                                allowNone: false,
                                defaultQuery: {
                                    filterFields: [ "component.id" ],
                                    "filterType_component.id": "eq",
                                    "filterValue_component.id": self.component.id,
                                    "filterClass_component.id": "UUID"
                                },
                                onChange: function(value) {
                                    var item = this.get("item");
                                    if (value) {
                                        self.value = typeValue + "/" + item.id;
                                    }
                                    else {
                                        self.value = undefined;
                                    }
                                }
                            });
                        }

                        valueSelect.placeAt(self.valueAttach);
                    }
                    else if (typeValue === "allWithStatus" || typeValue === "latestWithStatus") {
                        valueSelect = new RestSelect({
                            restUrl: bootstrap.restUrl+"deploy/status/versionStatuses",
                            getValue: function(item) {
                                return item.name;
                            },
                            value: self.subValue,
                            getStyle: function(item) {
                                var result = {
                                    backgroundColor: item.color
                                };
                                return result;
                            },
                            allowNone: false,
                            noIllegalValues: true,
                            onChange: function(value) {
                                if (value) {
                                    self.value = typeValue+"/"+value;
                                }
                                else {
                                    self.value = undefined;
                                }
                            }
                        });
                        valueSelect.placeAt(self.valueAttach);
                    }
                    else if (typeValue === "allInEnvironment" || typeValue === "reverseAllInEnvironment") {
                        valueSelect = new RestSelect({
                            restUrl: bootstrap.restUrl+"deploy/status/inventoryStatuses",
                            getValue: function(item) {
                                return item.name;
                            },
                            value: self.subValue,
                            getStyle: function(item) {
                                var result = {
                                    backgroundColor: item.color
                                };
                                return result;
                            },
                            allowNone: false,
                            noIllegalValues: true,
                            onChange: function(value) {
                                if (value) {
                                    self.value = typeValue+"/"+value;
                                }
                                else {
                                    self.value = undefined;
                                }
                            }
                        });
                        valueSelect.placeAt(self.valueAttach);
                    }
                    else {
                        self.value = typeValue+"/";
                    }
                }
            });
            typeSelect.placeAt(this.typeAttach);

            if (this.value) {
                //we need to handle both V and v because either could be stored in the db
                //due to a legacy bug where single version selectors were created with
                //V instead of v. preferred is to use lowercase v.
                var valueParts = this.value.split("/");
                this.subValue = valueParts[1];
                if (valueParts[0] === "Version") {
                    this.value = "version/" + valueParts[1];
                    valueParts[0] = "version";
                }
                typeSelect.set("value", valueParts[0]);
            }
        }
    });
});

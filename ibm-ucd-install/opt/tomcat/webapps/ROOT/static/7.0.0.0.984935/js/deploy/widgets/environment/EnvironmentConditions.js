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
        "dojo/dom-class",
        "dojo/dom-construct",
        "deploy/widgets/environment/EnvironmentCondition",
        "deploy/widgets/Formatters",
        "js/webext/widgets/RestSelect"
        ],
function(
        _TemplatedMixin,
        _Widget,
        array,
        declare,
        domClass,
        domConstruct,
        EnvironmentCondition,
        Formatters,
        RestSelect
) {
    /**
     *
     */
    return declare('deploy.widgets.environment.EnvironmentConditions',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="environmentSummary inlineBlock">'+
              '<table><tr>'+
                '<td style="width: 110px;">'+
                  '<div data-dojo-attach-point="infoAttach" class="environmentSummaryBox" style="text-align:center;font-size: 11pt;font-weight: bold;">'+
                '</td><td style="min-width: 300px; vertical-align: top;">'+
                    '<div data-dojo-attach-point="conditionAttach"></div>'+
                    '<div style="margin-top: 3px;" data-dojo-attach-point="newConditionAttach"></div>'+
                '</td>'+
              '</tr></table>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            if (this.application) {
                self.readOnly = !(this.application.security["Manage Environments"] &&
                                this.environment.security["Edit Basic Settings"]);
            }
            else if (this.applicationTemplate) {
                if (this.applicationTemplate.version === this.applicationTemplate.versionCount) {
                    self.readOnly = !this.applicationTemplate.security["Manage Environment Templates"];
                }
                else {
                    self.readOnly = true;
                }
            }

            if (this.application && this.applicationTemplate && this.environment.templateId) {
                // Don't allow editing a templates conditions from the application view.
                // If the environment is not based on a template, conditionally allow editing.
                self.readOnly = true;
            }

            var environmentLink = document.createElement("span");
            environmentLink.innerHTML = this.environment.name.escape();
            this.infoAttach.appendChild(environmentLink);

            this.conditions = [];
            array.forEach(self.environment.conditions, function(status, i){
                var conditionWidget = new EnvironmentCondition({
                    statuses: status,
                    readOnly: self.readOnly,
                    parent: self
                });
                conditionWidget.placeAt(self.conditionAttach);
                self.conditions.push(conditionWidget);
            });

            if (self.readOnly) {
                if (self.conditions.length) {
                    domClass.add(self.conditions[self.conditions.length-1].orAttach, "hidden");
                }
                else {
                   domConstruct.create("div", { innerHTML: i18n("No conditions defined")}, self.conditionAttach);
               }
            }
            else {
                var statusSelect = new RestSelect({
                    restUrl: bootstrap.restUrl+"deploy/status/versionStatuses",
                    getValue: function(item) {
                        return item.name;
                    },
                    getStyle: function(item) {
                        return Formatters.conditionFormatter(item);
                    },
                    noneLabel: i18n("Add a new condition..."),
                    onChange: function(value, item) {
                        if (item) {
                            var conditionWidget = new EnvironmentCondition({
                                statuses: [item],
                                readOnly: self.readOnly,
                                parent: self
                            });
                            conditionWidget.placeAt(self.conditionAttach);
                            self.conditions.push(conditionWidget);

                            statusSelect.setValue("");
                        }
                    }
                });
                statusSelect.placeAt(this.newConditionAttach);
            }
        },

        /**
         *
         */
        removeCondition: function(condition) {
            util.removeFromArray(this.conditions, condition);
            condition.destroy();
        },

        /**
         *
         */
        getValue: function() {
            var result = {
                environmentId: this.environment.id,
                conditions: []
            };
            array.forEach(this.conditions, function(condition) {
                result.conditions.push(condition.getValue());
            });

            return result;
        }
    });
});
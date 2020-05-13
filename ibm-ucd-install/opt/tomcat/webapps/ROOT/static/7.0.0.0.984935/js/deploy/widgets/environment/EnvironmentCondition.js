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
        "dojo/on",
        "js/webext/widgets/RestSelect",
        "deploy/widgets/Formatters"
        ],
function(
        _TemplatedMixin,
        _Widget,
        array,
        declare,
        domConstruct,
        on,
        RestSelect,
        Formatters
) {
    return declare('deploy.widgets.environment.EnvironmentCondition',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="environmentCondition">'+
                '<div data-dojo-attach-point="statusesAttach" class="statusesAttach inlineBlock align-top"></div>' +
                '<div data-dojo-attach-point="newStatusAttach" class="newStatusAttach inlineBlock align-top"></div>' +
                '<div data-dojo-attach-point="orAttach">- '+i18n("or")+' -</div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            self.trackedStatuses = [];
            array.forEach(this.statuses, function(status) {
                self.addStatus(status);
            });

            if (!this.readOnly) {
                var statusSelect = new RestSelect({
                    restUrl: bootstrap.restUrl+"deploy/status/versionStatuses",
                    getValue: function(item) {
                        return item.name;
                    },
                    getStyle: function(item) {
                        return Formatters.conditionFormatter(item);
                    },
                    noneLabel: i18n("And..."),
                    onChange: function(value, item) {
                        if (item) {
                            var statusFound = false;
                            array.forEach(self.statuses, function(status) {
                                if (status.name === item.name) {
                                    statusFound = true;
                                }
                            });

                            if (!statusFound) {
                                self.addStatus(item);
                                self.statuses.push(item);
                            }

                            statusSelect.setValue("");
                        }
                    }
                });
                statusSelect.placeAt(this.newStatusAttach);
            }
        },

        /**
         *
         */
        addStatus: function(status) {
            var self = this;

            var statusBox = domConstruct.create("div", {
                "class": "inlineBlock environmentStatusBoxAttached",
                style: Formatters.conditionAttachBoxFormatter(status),
                innerHTML: status.name.escape()
            }, this.statusesAttach);

            if (!this.readOnly) {
                var removeLink = Formatters.conditionXButtonFormatter(statusBox, status);

                on(removeLink, "click", function() {
                    domConstruct.destroy(statusBox);
                    util.removeFromArray(self.statuses, status);

                    if (self.statuses.length === 0) {
                        self.parent.removeCondition(self);
                    }
                });
            }
        },

        /**
         * 
         */
        getValue: function() {
            var result = [];

            array.forEach(this.statuses, function(status) {
                result.push(status.name);
            });

            return result;
        }
    });
});
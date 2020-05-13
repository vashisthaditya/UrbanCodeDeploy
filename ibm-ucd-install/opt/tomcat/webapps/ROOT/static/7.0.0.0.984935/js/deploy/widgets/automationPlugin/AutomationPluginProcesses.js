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
        "deploy/widgets/Formatters",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        array,
        declare,
        Formatters,
        Table
) {
    /**
     *
     */
    return declare('deploy.widgets.automationPlugin.AutomationPluginProcesses',  [_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="automationPluginProcesses">' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            var gridRestUrl = bootstrap.restUrl+"plugin/automationPlugin/"+this.automationPlugin.id+"/processes";
            var gridLayout = [{
                name: i18n("Component or Component Template"),
                formatter: function(item) {
                    if (!!item.componentTemplate) {
                        return Formatters.componentTemplateLinkFormatter(item.componentTemplate);
                    }
                    return Formatters.componentLinkFormatter(item.component);
                },
                filterField: "componentName",
                filterType: "text",
                getRawValue: function(item) {
                    var retVal = "";
                    if (!!item.componentTemplate) {
                        retVal = item.componentTemplate.name;
                    }
                    if (!!item.component) {
                        retVal = item.component.name;
                    }
                    return retVal;
                }
            },{
                name: i18n("Process"),
                formatter: function(item) {
                    var result;
                    if (item.component) {
                        result = Formatters.componentProcessLinkFormatter(item.process);
                    }
                    else if (item.componentTemplate) {
                        result = Formatters.componentTemplateProcessLinkFormatter(item.process);
                    }
                    else { // generic process
                        result = Formatters.genericProcessLinkFormatter(item.process);
                    }
                    return result;
                },
                filterField: "processName",
                filterType: "text",
                getRawValue: function(item) {
                    return item.name;
                }
            },{
                name: i18n("Commands Used"),
                field: "commandName",
                filterField: "commandName",
                filterType: "text",
                getRawValue: function(item) {
                    return item.commandName;
                }
            }];

            this.grid = new Table({
                url: gridRestUrl,
                serverSideProcessing: true,
                columns: gridLayout,
                hidePagination: false,
                tableConfigKey: "pluginProcessList",
                noDataMessage: i18n("This plugin is not used in any processes.")
            });
            this.grid.placeAt(this.gridAttach);
        },

        /**
         *
         */
        destroy: function() {
            this.inherited(arguments);
            this.grid.destroy();
        }
    });
});
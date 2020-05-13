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
        "dojo/dom-construct",
        "dojo/on",
        "deploy/widgets/property/PropValues",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        domConstruct,
        on,
        PropValues,
        Dialog,
        TreeTable
) {
    /**
     *
     */
    return declare('deploy.widgets.resource.ResourceConfigInventory',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="resourceConfigInventory">'+
                '<div data-dojo-attach-point="configTree"></div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            var gridRestUrl = bootstrap.restUrl+"inventory/resourceConfiguration/"+this.resourceId;
            var gridLayout = [{
                    name: i18n("Name"),
                    field: "name",
                    orderField: "name",
                    filterField: "name",
                    filterType: "text",
                    getRawValue: function(item) {
                        return item.name;
                    }
                },{
                    name: i18n("Version"),
                    field: "version"
                },{
                    name: i18n("Commit"),
                    formatter: function(item) {
                        var result = "";
                        if (item.commit) {
                            result = item.commit.committer+" on "+util.dateFormatShort(item.commit.commitTime);
                        }
                        return result;
                    }
                },{
                    name: i18n("Actions"),
                    formatter: this.actionsFormatter,
                    parentWidget: this
                }];

            this.tree = new TreeTable({
                url: gridRestUrl,
                serverSideProcessing: false,
                orderField: "name",
                tableConfigKey: "resourceConfigList",
                noDataMessage: i18n("No configuration has been deployed yet."),
                columns: gridLayout
            });
            this.tree.placeAt(this.configTree);
        },

        /**
         *
         */
        actionsFormatter: function(item) {
            var self = this.parentWidget;
            var result = document.createElement("div");

            if (item.propSheet) {
                var viewLink = domConstruct.create("a", {
                    "innerHTML": i18n("View"),
                    "class": "linkPointer actionsLink"
                }, result);
                on(viewLink, "click", function() {
                    self.showProperties(item.name, item.propSheet);
                });
            }

            return result;
        },

        /**
         *
         */
        showProperties: function(name, propSheet) {
            var propertiesDialog = new Dialog({
                title: i18n("Property Details: %s", util.escape(name)),
                closable: true,
                draggable: true,
                style: {
                    "width": "500px"
                }
            });

            var propertyList = new PropValues({
                propSheet: propSheet,
                showDescription: false,
                readOnly: true
            });

            propertyList.placeAt(propertiesDialog.containerNode);
            propertiesDialog.show();
        }
    });
});

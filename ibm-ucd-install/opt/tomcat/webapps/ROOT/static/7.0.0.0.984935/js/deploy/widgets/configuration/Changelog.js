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
        "dojo/dom-geometry",
        "dojo/dom-construct",
        "dojo/on",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        array,
        declare,
        xhr,
        domGeom,
        domConstruct,
        on,
        Dialog,
        TreeTable
) {
    /**
     *
     */
    return declare('deploy.widgets.configuration.Changelog',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="changelog">'+
                '<div data-dojo-attach-point="gridAttach"></div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            var gridLayout = [{
                name: i18n("Commit ID"),
                field: "commitId",
                orderField: "commitId",
                getRawValue: function(item) {
                    return item.commitId;
                }
            },{
                name: i18n("User"),
                field: "committer",
                orderField: "committer",
                filterField: "committer",
                filterType: "text",
                getRawValue: function(item) {
                    return item.committer;
                }
            },{
                name: i18n("Date"),
                field: "commitTime",
                formatter: util.tableDateFormatter,
                orderField: "date",
                getRawValue: function(item) {
                    return new Date(item.commitTime);
                }
            },{
                name: i18n("Changes"),
                formatter: function(item) {
                    var result = domConstruct.create("div");

                    array.forEach(item.friendlyPathsModified, function(pathObject) {
                        var translatedPath = pathObject.path;
                        if (pathObject.persistent && pathObject.persistent.className === "PropSheet") {
                            translatedPath = i18n(translatedPath);
                        }

                        var pathDiv = domConstruct.create("div", {
                            "innerHTML": i18n("%s v.%s", util.escape(translatedPath), pathObject.version)
                        }, result);

                        if (pathObject.persistent && pathObject.persistent.className === "PropSheet") {
                            var compareLink = domConstruct.create("a", {
                                "innerHTML": i18n("(Changes)"),
                                "style": domGeom.isBodyLtr()?{
                                    "marginLeft": "5px"
                                }:{
                                    "marginRight": "5px"
                                },
                                "class": "linkPointer actionsLink"
                            }, pathDiv);
                            on(compareLink, "click", function() {
                                xhr.get({
                                    url: bootstrap.baseUrl+"property/propSheet/"+util.vc.encodeVersionedPath(pathObject.persistent.path+"#"+(item.commitId-1))+"/compare/"+util.vc.encodeVersionedPath(pathObject.persistent.path+"#"+item.commitId),
                                    handleAs: "json",
                                    load: function(data) {
                                        self.showPropertyChanges(data);
                                    }
                                });
                            });
                        }
                    });

                    array.forEach(item.friendlyPathsDeleted, function(pathObject) {
                        domConstruct.create("div", {
                            "innerHTML": i18n("(Deleted) %s", util.escape(pathObject.path))
                        }, result);
                    });

                    return result;
                }
            }];

            this.grid = new TreeTable({
                url: this.url,
                serverSideProcessing: false,
                columns: gridLayout,
                orderField: "date",
                sortType: "desc",
                tableConfigKey: "changelogList",
                noDataMessage: i18n("No changes found.")
            });
            this.grid.placeAt(this.gridAttach);
        },

        /**
         *
         */
        destroy: function() {
            this.inherited(arguments);
            this.grid.destroy();
        },

        /**
         *
         */
        showPropertyChanges: function(data) {
            var self = this;

            var propertyDialog = new Dialog({width:800});

            var propertyTable = new TreeTable({
                style: {
                    "minWidth": "450px"
                },
                hidePrintLink: true,
                data: data,
                serverSideProcessing: false,
                tableConfigKey: "changelogList",
                noDataMessage: i18n("No changes found."),
                columns: [{
                    name: i18n("Name"),
                    field: "name"
                },{
                    name: i18n("Before"),
                    formatter: function(item) {
                        var result = "";
                        if (item.value) {
                            result = item.value.value;
                        }
                        return result;
                    }
                },{
                    name: i18n("After"),
                    formatter: function(item) {
                        var result = "";
                        if (item.otherValue) {
                            result = item.otherValue.value;
                        }
                        return result;
                    }
                }]
            });
            propertyTable.placeAt(propertyDialog.containerNode);
            propertyDialog.show();
        }
    });
});

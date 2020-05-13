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
        "dijit/form/TextBox",
         "dijit/_Widget",
         "dijit/_TemplatedMixin",
         "dojo/_base/array",
         "dojo/_base/declare",
         "dojo/_base/event",
         "dojo/dom-construct",
         "dojo/dom-style",
         "js/webext/widgets/table/TreeTable",
         "deploy/widgets/component/ComponentConfigTemplates",
         "deploy/widgets/environment/EnvironmentResourceTree",
         "deploy/widgets/property/PropDefs",
         "deploy/widgets/property/PropValues",
         "deploy/widgets/Formatters",
         "deploy/widgets/tag/Tagger",
         "deploy/widgets/property/PropSheetDefValues",
         "dojo/on",
         "dijit/form/FilteringSelect",
         "dojox/data/JsonRestStore",
         "js/webext/widgets/ColumnForm",
         "js/webext/widgets/Dialog",
         "deploy/widgets/resource/ResourceVarianceBrowser",
        "js/webext/widgets/RestSelect",
         "deploy/widgets/resource/ResourceSelector",
         "deploy/widgets/resource/ResourceTree"
         ],
function(
        TextBox,
        _Widget,
        _TemplatedMixin,
        array,
        declare,
        event,
        domConstruct,
        domStyle,
        TreeTable,
        ComponentConfigTemplates,
        EnvironmentResourceTree,
        PropDefs,
        PropValues,
        Formatters,
        Tagger,
        PropSheetDefValues,
        on,
        FilteringSelect,
        JsonRestStore,
        ColumnForm,
        Dialog,
        ResourceVarianceBrowser,
        RestSelect,
        ResourceSelector,
        ResourceTree
) {

/**
 *
 */
    return declare(
        [_Widget, _TemplatedMixin],
        {
            templateString:
                '<div class="resourceConfigurationTree">'+
                    '<div class="resourceConfigurationTreeContainer">'+
                      '<div class="resourceConfigurationTreeDiv" data-dojo-attach-point="treeAttach"></div>'+
                      '<div class="resourceConfigurationDetail">'+
                          '<div data-dojo-attach-point="detailAttach"></div>'+
                      '</div>'+
                    '</div>'+
                '</div>',

            /**
             *
             */
            postCreate: function() {
                this.inherited(arguments);

                if (!this.url) {
                    this.url = bootstrap.restUrl+"resource/resource/tree";
                }

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
                this.tree = new ResourceTree({
                    showTags: function() {
                    },
                    getOtherColumns: function() {
                        return [];
                    },
                    getActionsOptions: function() {
                        return [];
                    },
                    getSelectOptions: function() {
                        return [];
                    },
                    actionsFormatter: function(item) {
                        return domConstruct.create("div");
                    },
                    getNameColumn: function() {
                        return self.getNameColumn();
                    },
                    hideTopButtons: "true",
                    xhrMethod: "POST",
                    serverSideProcessing: true,
                    onRowSelect : function(item, row) {
                        self.loadConfigurationDetails(item);
                    }
                });

                this.tree.placeAt(this.treeAttach);
            },

            getNameColumn: function() {
                var self = this;

                return {
                    name: i18n("Name"),
                    formatter: function(item, value, cell) {
                        cell.style.position = "relative";

                        var result;
                        if (item.isRoot) {
                            result = Formatters.resourceLinkFormatterWithPath(item);
                        }
                        else {
                            result = Formatters.resourceLinkFormatter(item);
                        }
                        self.showTags(item, result);

                        self.showDiff(item, result);

                        return result;
                    },
                    orderField: "name",
                    filterField: "name",
                    filterType: "text",
                    getFilterFields: function() {
                        var nameFilter = new TextBox({
                            name: "name",
                            "class": "filter",
                            style: { "width": "45%" },
                            placeHolder: i18n("Resource Name"),
                            type: "like"
                        });

                        return [nameFilter];
                    },
                    getRawValue: function(item) {
                        return item.path;
                    }
                };
            },

            /**
             *
             */
            showDiffResourceSelect : function(item, result) {
                var self = this;
                var diffDialog = new Dialog({
                    title: i18n("Diff Resource %s", util.escape(item.path)),
                    closable: true,
                    draggable: true
                });

                var resourceSelect;
                var versionSelect;
                var localVersionSelect;
                var form = new ColumnForm({
                    saveLabel : i18n("Diff"),
                    cancelLabel : i18n("Cancel"),
                    onSubmit : function(data) {
                        var url = bootstrap.restUrl+"resource/resource/" + item.id;
                        var firstColHeading = data.resource.path;
                        var secColHeading = item.path;
                        if (data.localVersion) {
                            url = url + "/" + data.localVersion + "/variance/" + data.resource.id;
                            secColHeading = secColHeading + " - " + data.localVersion;
                        }
                        else {
                            url = url + "/variance/" + data.resource.id;
                        }
                        if (data.version) {
                            url = url + "/" + data.version;
                            firstColHeading = firstColHeading + " - " + data.version;
                        }
                        self.loadConfigurationDetailsByUrl(url, firstColHeading, secColHeading);
                    },
                    postSubmit : function() {
                        if (resourceSelect) {
                            resourceSelect.destroy();
                        }
                        if (versionSelect) {
                            versionSelect.destroy();
                        }
                        form.destroy();
                        diffDialog.destroy();
                    },
                    onCancel : function() {
                        if (resourceSelect) {
                            resourceSelect.destroy();
                        }
                        if (versionSelect) {
                            versionSelect.destroy();
                        }
                        form.destroy();
                        diffDialog.destroy();
                    },
                    onError : function() {
                        if (resourceSelect) {
                            resourceSelect.destroy();
                        }
                        if (versionSelect) {
                            versionSelect.destroy();
                        }
                        form.destroy();
                        diffDialog.destroy();
                    }
                });

                var versionLabelAdded = false;
                resourceSelect = new ResourceSelector({
                    resourceSelectTitle: i18n("Select resource to diff with %s", util.escape(item.path)),
                    returnEntireObject:true,
                    onChange: function(newValue) {
                        if (versionSelect) {
                            versionSelect.destroy();
                            form.removeField("version");
                        }
                        versionSelect = new RestSelect({
                            restUrl: bootstrap.restUrl +
                                         "resource/resource/" +
                                         newValue.id + "/configuration/versions",
                            getValue: function(item) {
                                return item;
                            },
                            getLabel: function(item) {
                                return item;
                            },
                            allowNone:true,
                            noneLabel: i18n("Latest")
                        });

                        form.addField({
                            name: "version",
                            label: i18n("Version for %s", util.escape(newValue.path)),
                            widget:versionSelect
                        }, "_versionInsert");
                    }
                });
                localVersionSelect = new RestSelect({
                    restUrl: bootstrap.restUrl +
                                 "resource/resource/" +
                                 item.id + "/configuration/versions",
                    getValue: function(item) {
                        return item;
                    },
                    getLabel: function(item) {
                        return item;
                    },
                    allowNone: true,
                    noneLabel: i18n("Latest")
                });

                form.addField({
                    name: "localVersion",
                    label: i18n("Version for %s", util.escape(item.path)),
                    widget:localVersionSelect
                });

                form.addField({
                    name: "resource",
                    label: i18n("Resource"),
                    required: true,
                    widget: resourceSelect
                });

                form.addField({
                    name: "_versionInsert",
                    type: "Invisible"
                });

                form.placeAt(diffDialog);
                diffDialog.show();
            },

            /**
             *
             */
            showDiff: function(item, result) {
                var self = this;

                var divNode = dojo.create("div", {"class":"resourceVarianceDiff link"});
                divNode.innerHTML = "diff";
                on(divNode, "click", function(e) {
                    event.stop(e);
                    self.showDiffResourceSelect(item, result);
                });

                result.appendChild(divNode);
            },

            /**
             *
             */

            showTags: function(item, result) {
                var self = this;
                self.tagger = new Tagger({
                    allowTagAdd : false,
                    objectType: "Resource",
                    item: item,
                    callback: function() {
                        self.tree.expand(parent);
                        self.tree.refresh();
                    }
                });
                self.tagger.placeAt(result);
            },

            /**
             *
             */
            loadConfigurationDetailsByUrl: function(url, newValColHead, oldValColHead) {
                var self = this;

                if (self.configurationBrowser) {
                    self.configurationBrowser.destroy();
                }
                domConstruct.empty(this.detailAttach);
                self.configurationBrowser = new ResourceVarianceBrowser({
                    "url" : url,
                    "newValueColumnHeading" : newValColHead,
                    "oldValueColumnHeading" : oldValColHead
                });

                self.configurationBrowser.placeAt(self.detailAttach);
            },
            /**
             *
             */
            loadConfigurationDetails: function(item) {
                var self = this;

                if (self.configurationBrowser) {
                    self.configurationBrowser.destroy();
                }
                domConstruct.empty(this.detailAttach);
                self.configurationBrowser = new ResourceVarianceBrowser({
                    resource : item
                });

                self.configurationBrowser.placeAt(self.detailAttach);
            }
        }
    );
});

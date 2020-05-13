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
/*global define, sfInfo */
define([
        "dojo/_base/declare",
        "dojo/_base/array",
        "dojo/aspect",
        "dojo/dom-style",
        "dojo/on",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dijit/_WidgetsInTemplateMixin",
        "dijit/form/Button",
        "dijit/form/TextBox",
        "dijit/Tree",
        "dijit/tree/ForestStoreModel",
        "dojox/data/JsonRestStore",
        "js/webext/widgets/Link",
        "dijit/Tooltip", // in template
        "js/webext/widgets/Dialog" // in template
        ],
function(
        declare,
        array,
        aspect,
        domStyle,
        on,
        _WidgetBase,
        _TemplatedMixin,
        _WidgetsInTemplateMixin,
        Button,
        TextBox,
        Tree,
        ForestStoreModel,
        JsonRestStore,
        Link,
        Tooltip,
        Dialog
) {


    return declare(
        [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],
        {
            templateString: '<div class="sourceBrowser">' +
                                '<div data-dojo-type="js/webext/widgets/Dialog" '+
                                  ' data-dojo-attach-point="sourceDialog" '+
                                  ' data-dojo-props="title:\''+i18n("Select a Source Path")+'\'" '+
                                  ' style="width: 50%">'+
                                  '<img id="${id}_tooltip" data-dojo-attach-point="helpImg" '+
                                    ' src="${_blankGif}" alt="?" class="helpImage"/>'+
                                  '<div data-dojo-attach-point="helpText" data-dojo-type="dijit/Tooltip" '+
                                     ' data-dojo-props="connectId:\'${id}_tooltip\'" '+
                                  '  >'+i18n("When selected, arrow keys may be used to open/navigate the file tree")+'</div>'+
                                  '<div data-dojo-attach-point="dialogContent" class="sourceBrowser"></div>'+
                                '</div>'+
                                '<div data-dojo-attach-point="textBoxAttach" style="float:left"></div>' +
                                '<div data-dojo-attach-point="sourceBrowserButtonAttach" style="float:left"></div>' +
                                '<div data-dojo-attach-point="errorAttach"></div>' +
                            '</div>',

            //------------------------------------------------------------------------------------------
            startup: function() {
                var self = this;
                self.inherited(arguments);

                self.workflowId = appState.templateId;

                if (appState.workflow && appState.workflow.id) {
                    self.workflowId = appState.workflow.id;
                }
                
                // Dialog widgets do not get owned correctly by WidgetsInTemplateMixin because 
                //  they self-relocate to the top of dom
                self.own(self.sourceDialog);

                self.textBox = new TextBox({
                    label: self.label,
                    name: self.name,
                    value: self.value,
                    disabled: self.disabled,
                    onChange: function() {
                        self.set("value", self.textBox.get("value"));
                    }
                });
                self.own(self.textBox);

                self.set("value", self.textBox.get("value"));
                self.textBox.placeAt(self.textBoxAttach);

                self.initSourceTree();

                self.initialized = false;
            },

            //------------------------------------------------------------------------------------------
            initSourceTree: function() {
                var self = this;

                //
                // Create components
                //

                self.showSourceBrowserButton = new Button({
                    label: "Select a Path",
                    "class": "raisedFormElement",
                    onClick: function() {
                        var sourcePath = self.textBox.get("value");
                        sourcePath = sourcePath.replace(/^\/+/, ''); // trim leading slash
                        sourcePath = sourcePath.replace(/\/+$/, ''); // trim trailing slash

                        var path = [''];
                        array.forEach(sourcePath.split('/'), function (segment, i){
                            path.push(path[i]+'/'+segment);
                        });
                        path[0] = 'root'; // special root node id
                        //path.splice(0, 1); // remove special seed node

                        //console.log("path", path);
                        //console.log("sourcePath", sourcePath);

                        self.tree.set('path', path).then(function() {
                            self.tree.set('selectedItem', "/"+sourcePath);
                        },
                        function(err) {
                            // couldn't expand path
                            console.error("error expanding path", err);
                        });

                        self.sourceDialog.show();
                    }
                });
                self.own(self.showSourceBrowserButton);

                /**
                 * update the value using the selected item from the tree
                 */
                var updateSourcePathFromTree = function (){
                    var item = self.tree.get('selectedItem');
                    var sourcePath = (item.path || item.fullPath || '' );
                    if (sourcePath.indexOf('/') !== 0) {
                        sourcePath =  '/' + sourcePath;
                    }
                    bootstrap.sourceRoot = sourcePath;
                    self.textBox.set("value", sourcePath);
                };

                var dataUrl = bootstrap.restUrl + "repository/svn/files/"+String(self.workflowId);
                var idAttrib = 'fullPath';
                if (bootstrap.sfInfo) {
                    dataUrl = bootstrap.restUrl + 'tfprojects/svn/' + self.workflowId + '/' + bootstrap.sfInfo.sfProjectId;
                    idAttrib = 'path';
                }
                self.treeData = new JsonRestStore({
                    target: dataUrl,
                    labelAttribute: 'name',
                    idAttribute: idAttrib
                });
                self.treeModel = new ForestStoreModel({
                    store: self.treeData,
                    rootId: "root",
                    rootLabel: "/",
                    query: {"childrenOf":""},
                    childrenAttrs: ["children"],
                    deferItemLoadingUntilExpand: true,
                    getChildren: function (/*dojo.data.Item*/ parentItem, /*function(items)*/ callback, /*function*/ onError){
                        var filterChildrenCallback = function (items) {
                            var children = array.filter(items, function (item) {
                                return item.nodeType !== 'file';
                            });
                            callback(children);
                        };
                        var superGetChildren = ForestStoreModel.prototype.getChildren;
                        return superGetChildren.apply(this, [parentItem, filterChildrenCallback, onError]);
    //                    return this.inherited(arguments, [parentItem, filterChildrenCallback, onError]);
                    }
                });
                self.own(self.treeModel);

                self.tree = new Tree({
                    "class":"treeInput",
                    "model": self.treeModel,
                    "showRoot": false,
                    "persist": false,
                    "style": "width: auto; height: 250px; overflow: auto; overflow-x: hidden",
                    "_createTreeNode": function(data) {
                        var item = data.item;
                        /*
                        item: item,
                        tree: tree,
                        isExpandable: model.mayHaveChildren(item),
                        label: tree.getLabel(item),
                        tooltip: tree.getTooltip(item),
                        dir: tree.dir,
                        lang: tree.lang,
                        textDir: tree.textDir,
                        indent: this.indent + 1
                        */
                        var node = new Tree._TreeNode(data);

                        // position relative so that link can be right aligned against it
                        domStyle.set(node.rowNode, {
                            "position":"relative"
                        });

                        var link = new Link({
                            "iconClass": "icon_select_row",
                            "showLabel": false,
                            "labelText": "Select "+(item.path || item.fullPath),
                            "tabIndex": -1,
                            "style": {
                                "position":"absolute",
                                "right":"0px",
                                "top":"1px"
                            }
                        });
                        node.own(link);
                        node.own(aspect.after(node, "setFocusable", function(selected) {
                            link.set("tabIndex", selected ? 0 : -1);
                        }, true));
                        link.on('click', function (){
                            updateSourcePathFromTree();
                            self.sourceDialog.hide();
                        });
                        link.placeAt(node.labelNode);

                        return node;
                    },
                    onDblClick: function() {
                        updateSourcePathFromTree();
                        self.sourceDialog.hide();
                    }
                });
                self.own(self.tree);

                self.tree.on("click", function(item, node, evt) {
                    if (evt && evt.keyIdentifier === 'Enter') {
                        updateSourcePathFromTree();
                        self.sourceDialog.hide();
                    }
                });

                //
                // Place components
                //

                self.tree.placeAt(self.dialogContent);
                self.showSourceBrowserButton.placeAt(self.sourceBrowserButtonAttach);
            }
        }
    );
});

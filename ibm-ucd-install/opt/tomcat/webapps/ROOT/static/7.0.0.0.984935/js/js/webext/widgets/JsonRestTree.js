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
/*global define, clearTimeout, setTimeout */
define([
        "dojo/_base/declare",
        "dojo/_base/kernel",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dojo/_base/array",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/on",
        "dojo/dom-style",
        "dojo/_base/lang",
        "js/util/blocker/_BlockerMixin",
        "dojox/data/JsonRestStore",
        "dojo/data/ItemFileReadStore",
        "dijit/Tooltip",
        "dijit/tree/ForestStoreModel",
        "dijit/Tree",
        "dojox/rpc/Rest",
        "dijit/tree/_dndContainer",
        "js/webext/widgets/LocalStorageTree"
        ],
function(
        declare,
        kernel,
        _WidgetBase,
        _TemplatedMixin,
        array,
        domClass,
        domConstruct,
        on,
        domStyle,
        lang,
        _BlockerMixin,
        JsonRestStore,
        ItemFileReadStore,
        Tooltip,
        ForestStoreModel,
        Tree,
        Rest,
        dndContainer,
        LocalStorageTree
) {

    // _dndContainer is a basic stub dnd controller, but lacks a few methods called by dijit/Tree
    // _dndSelector creates an auto-named cookie if the tree is persist:true, this can make too many cookies
    // dndSource (extends _dndSelector) makes a dnd avatar when a user drags an item, and still makes a cookie.
    var stubDndController = declare("js.webext.widgets._JsonRestTreeDndController", dndContainer, {
        "_getSavedPaths": function() {return [];},
        "setSelection": function(){},
        "userSelect": function(){},
        "removeTreeNode": function(){},
        "singular": true
    });
    
    /**
     * An general form widget which takes an array of fields and creates a form in a single-column
     * table format.
     *
     * Supported properties:
     *  baseUrl / String            The URL to make all requests relative to.
     *  rootQuery / String          The request to make to generate the root node list.
     *  lazyLoad / Boolean          If true, the tree will lazy load children.
     *  persist / Boolean           Whether to save the expanded state in a cookie. Default: False
     *  treeData / Array            Preloaded data for populating the tree.
     *  treeStore / dojox.data.ServiceStore A datastore fore the tree (overrides treeData attribute).
     *  idAttribute / String        The property of node objects to use as the ID.
     *  labelAttribute / String     The property of node objects to use as the label.
     *  emptyTreeMessage / String   The string to display if the tree has no data.
     *  rowLevelClasses / Array     An array (one member per level of hierarchy) determining row classes:
     *      odd / String            The class to apply if a row is odd.
     *      even / String           The class to apply if a row is even.
     *      all / String            The class to apply to all rows.
     *      inherit / Boolean       If true, the row will always use its parent row's classes.
     *  columnHeadings / Array      The column headings to show.
     *      innerHTML / Text        Header text.
     *      description / Text      Help text to show in a tooltip in the column heading.
     *      width / Text            The text of the desired width style.
     *  getIconClass / Function     The function to run to get the class used to show icons for nodes.
     *  getNodeColumns / Function   The function to run to generate the cells for a particular node.
     *                              Given the node data as an argument. Should return an array of
     *                              objects, one for each cell, supporting the following properties:
     *      iconUrl / Text          The URL to use to show an icon before the cell contents.
     *      domNode / DOM Node      The DOM node to place in the cell.
     *      innerHTML / Text        Cell text.
     *      width / Text            The text of the desired width style of the cell.
     *      minWidth / Text         The text of the desired minimum width style of the cell.
     *      backgroundColor / Text  The text of the desired background-color style of the cell.
     *  style / Object              The styling object to apply to the tree.
     *  width / Text                The text of the desired width style of the tree's container.
     *
     *  draggable / Boolean         Whether this tree should support drag and drop.
     *                              Default: false
     *  dndController / String      The full widget name to use as the drag and drop source.
     *                              Default: dijit.tree.dndSource
     *  pasteItem / Function        Function to use to handle dropped rows.
     *                              Signature: pasteItem(child, oldParent, newParent, isCopy)
     */
    return declare(
        [_WidgetBase, _TemplatedMixin, _BlockerMixin],
        {
            templateString:
                '<div class="jsonRestTree treeTableCont">' +
                '   <div data-dojo-attach-point="headerAttach" style="display: none;"></div>' +
                '   <div data-dojo-attach-point="emptyAttach" style="display: none;"></div>' +
                '   <div data-dojo-attach-point="clearAttach" class="clear" style="display: none;"></div>' +
                '   <div data-dojo-attach-point="treeAttach"></div>' +
                '</div>',
    
            emptyTree: true,
            emptyTreeMessage: i18n("No Data Found."),
            width: '850px',
            lazyLoad: true,
            persist: false,
            cookieName: null,
            idAttribute: "$ref",
            labelAttribute: "name",
            draggable: false,
            dndController: null,
            pasteItem: function() {},
    
            /**
             *
             */
            constructor: function() {
                this.lastIndent = 0;
                this.lastRowEven = false;
            },
    
            /**
             *
             */
            postCreate: function() {
                var self = this;
                self.inherited(arguments);
    
                // Generate the column headings if they have been provided.
                if (self.columnHeadings !== undefined) {
                    self.headerAttach.style.display = "";
                    self.headerAttach.className = "treeTableHeader";
                    self.clearAttach.style.display = "";
    
                    array.forEach(self.columnHeadings, function(heading) {
                        var columnHeadingDiv = domConstruct.create("div");
                        columnHeadingDiv.className = "th";
    
                        if (heading.style) {
                            domStyle.set(columnHeadingDiv, heading.style);
                        }
    
                        if (heading.className) {
                            domClass.add(columnHeadingDiv, heading.className);
                        }
    
                        columnHeadingDiv.innerHTML = heading.innerHTML;
    
                        if (heading.description) {
                            var helpImage = domConstruct.create("img");
                            helpImage.src = bootstrap.imageUrl+"webext/icon_help.png";
                            helpImage.className = "helpImage";
    
                            columnHeadingDiv.appendChild(helpImage);
    
                            var helpTip = new Tooltip({
                                connectId: [helpImage],
                                label: heading.description,
                                showDelay: 200,
                                position: ["after", "above", "below", "before"]
                            });
                            self.own(helpTip);
                        }
    
                        // replaced with heading.style object properties
                        if (heading.width !== undefined) {
                            columnHeadingDiv.style.width = heading.width;
                        }
    
                        self.headerAttach.appendChild(columnHeadingDiv);
                    });
                }
    
                if (!self.treeStore) {
                    if (self.treeData !== undefined) {
                        self.lazyLoad = false;
                        self.treeStore = new ItemFileReadStore({
                            data: {
                                items: self.treeData
                            }
                        });
                    }
                    else {
                        self.treeStore = new JsonRestStore({
                            target: self.baseUrl,
                            labelAttribute: self.labelAttribute,
                            idAttribute: self.idAttribute
                        });
                    }
                }
    
                self.treeModel = new ForestStoreModel({
                    store: self.treeStore,
                    deferItemLoadingUntilExpand: self.lazyLoad,
                    pasteItem: self.pasteItem,
                    query: self.rootQuery,
                    childrenAttrs: ["children"]
                });
                self.own(self.treeModel);
    
                // Remove any cached data in the store.
                var storeTarget = self.treeModel.store.target;
                (function (){
                    /*jslint forin: true */
    
                    var index = null;
                    for (index in Rest._index) {
                        if (index.indexOf(storeTarget) === 0) {
                            delete Rest._index[index];
                        }
                    }
                }());
    
                var treeStyle = {};
                if (self.style !== undefined) {
                    treeStyle = self.style;
                }
                else {
                    treeStyle.width = self.width;
                }
                

                var treeArgs = {
                    model: self.treeModel,
                    showRoot: false,
                    persist: self.persist,
                    cookieName: self.cookieName,
                    style: treeStyle,
                    _createTreeNode: function(nodeData) {
                        var tnode = new Tree._TreeNode(nodeData);
    
                        // Generate the label node and attach a clear element to it.
                        var labelNode = domConstruct.create("div");
                        labelNode.className = "treeTableRow";
    
                        if (nodeData.indent !== -1) {
                            self.emptyTree = false;
                            //self.emptyAttach.style.display = "none";
                        }
                        if (nodeData.indent >= 0) {
                            var expandoWidth = 23; // not sure value, expando is 16, must be more padding contributing to it
                            var indentWidth = nodeData.indent*19; // .claro .dijitTreeIndent{width:19px}
                            nodeData.indentPx = expandoWidth+indentWidth;
                        }
                        else {
                            nodeData.indentPx = 0;
                        }
    
                        var nodeColumns = self.getNodeColumns(nodeData);
                        array.forEach(nodeColumns, function(nodeColumn) {
                            var columnDiv = domConstruct.create("div");
                            columnDiv.className = "treeTableCell";
    
                            if (nodeColumn.iconUrl !== undefined) {
                                var icon = domConstruct.create("img");
                                icon.src = nodeColumn.iconUrl;
                                columnDiv.appendChild(icon);
                            }
    
                            if (nodeColumn.style) {
                                domStyle.set(columnDiv, nodeColumn.style);
                            }
    
                            if (nodeColumn.className) {
                                domClass.add(columnDiv, nodeColumn.className);
                            }
    
                            if (nodeColumn.innerHTML !== undefined) {
                                var htmlContainer = domConstruct.create("span");
                                htmlContainer.innerHTML = nodeColumn.innerHTML;
                                columnDiv.appendChild(htmlContainer);
                            }
    
                            if (nodeColumn.domNode !== undefined) {
                                columnDiv.appendChild(nodeColumn.domNode);
                            }
    
                            // This should be replaced with style object on nodeColumn
                            if (nodeColumn.width !== undefined) {
                                kernel.deprecated("use the style object to set width");
                                columnDiv.style.width = nodeColumn.width;
                            }
    
                            // 125px should be replaced with style object on nodeColumn
                            if (nodeColumn.minWidth !== undefined) {
                                kernel.deprecated("use the style object to set minWidth");
                                columnDiv.style.minWidth = nodeColumn.minWidth;
                            }
    
                            // 125px should be replaced with style object on nodeColumn
                            if (nodeColumn.backgroundColor !== undefined) {
                                kernel.deprecated("use the style object to set backgroundColor");
                                columnDiv.style.backgroundColor = nodeColumn.backgroundColor;
                            }
    
                            labelNode.appendChild(columnDiv);
                        });
    
    //                    var clearDiv = domConstruct.create("div");
    //                    clearDiv.className = "clear";
    //                    labelNode.appendChild(clearDiv);
                        tnode.labelNode.innerHTML = "";
                        tnode.labelNode.appendChild(labelNode);
    
                        // Initialize even/odd tracking if this is the first row of this indentation.
                        if (self.lastIndent !== nodeData.indent) {
                            self.lastIndent = nodeData.indent;
                            self.lastRowEven = false;
                        }
    
                        // If class data has been provided for the given indentation level, assign it
                        // based on row even/oddness.
                        var nodeClasses = tnode.domNode.children[0].className;
                        if (self.rowLevelClasses !== undefined) {
                            var rowClassData = self.rowLevelClasses[nodeData.indent];
                            if (rowClassData !== undefined) {
                                if (rowClassData.inherit) {
    
                                    // This must be delayed because we can't access the parent nodes
                                    // until this node has been added to the DOM, which occurs after
                                    // this function.
                                    setTimeout(function() {
                                        var inheritedClasses = tnode.domNode.parentNode.parentNode.firstChild.className;
                                        tnode.domNode.firstChild.className = inheritedClasses;
                                    }, 5);
                                }
                                else {
                                    if (self.lastRowEven && rowClassData.odd !== undefined) {
                                        nodeClasses += " " + rowClassData.odd;
                                    }
                                    else if (rowClassData.even !== undefined) {
                                        nodeClasses += " " + rowClassData.even;
                                    }
    
                                    if (rowClassData.all !== undefined) {
                                        nodeClasses += " " + rowClassData.all;
                                    }
                                    domClass.add(tnode.domNode.firstChild, nodeClasses);
                                }
                            }
                        }
                        else {
                            domClass.add(tnode.domNode.firstChild, "evenTreeRow");
                        }
                        self.lastRowEven = !self.lastRowEven;
    
                        return tnode;
                    }
                };
                if (self.draggable && self.dndController) {
                    treeArgs.dndController = self.dndController;
                }
                else {
                    treeArgs.dndController = stubDndController;
                }

                self.tree = new LocalStorageTree(treeArgs, self.treeAttach);
                self.own(self.tree);
    
                if (self.getIconClass !== undefined) {
                    self.tree.getIconClass = self.getIconClass;
                }
    
                self.tree.onLoadDeferred.then(function() {
                    self.unblock();
                    if (self.emptyTree) {
                        self.emptyAttach.style.display = "";
                    }
                    self.onLoad();
                });
    
                self.block();
    
                self.emptyMessageDiv = domConstruct.create("div");
                self.emptyMessageDiv.innerHTML = self.emptyTreeMessage;
                self.emptyMessageDiv.style.textAlign = "center";
                self.emptyMessageDiv.style.padding = "1em";
    
                self.emptyAttach.className = "treeTableEmpty";
                self.emptyAttach.appendChild(domConstruct.create("br"));
                self.emptyAttach.appendChild(domConstruct.create("br"));
                self.emptyAttach.appendChild(self.emptyMessageDiv);
    
                self.tree.startup();
            },
    
            /**
             * Stub for event of the underlying tree being done loading data
             */
            onLoad: function() {},
            
            /**
             * 
             */
            expandAll: function() {
                var tree = this.tree;
                
                function expand(node) {
                    tree._expandNode(node);
                    
                    array.forEach(node.getChildren(), function(child) {
                        if (child.isExpandable) {
                            expand(child);
                        }
                    });
                }
                
                expand(tree.rootNode);
            }
        }
    );
});

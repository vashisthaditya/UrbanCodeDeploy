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
/*global define, require, mxUtils, _ */

define([
    "dijit/_TemplatedMixin",
    "dijit/_Widget",
    "dijit/focus",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/_base/event",
    "dojo/_base/declare",
    "dojo/_base/xhr",
    "dojo/request/xhr",
    "dijit/Tree",
    "dijit/layout/ContentPane",
    "dojo/dom-construct",
    "dojo/dom-attr",
    "dojo/dom-style",
    "dojo/dom-class",
    "dojo/dom-geometry",
    "dojo/on",
    "dojo/mouse",
    "dojo/query",
    "dojo/_base/Deferred",
    "dijit/form/TextBox",
    "js/webext/widgets/Alert",
    "js/webext/widgets/Dialog",
    "js/webext/widgets/ColumnForm",
    "js/webext/widgets/RadioButtonGroup",
    "js/webext/widgets/GenericConfirm",
    "deploy/widgets/process/ProcessIconsFormatter",
    "dijit/tree/ObjectStoreModel",
    "dojo/store/Memory",
    "dojo/store/Observable"
], function(
    _TemplatedMixin,
    _Widget,
    focusUtil,
    array,
    lang,
    event,
    declare,
    xhrBase,
    xhr,
    Tree,
    ContentPane,
    domConstruct,
    domAttr,
    domStyle,
    domClass,
    domGeo,
    on,
    mouse,
    query,
    Deferred,
    TextBox,
    Alert,
    Dialog,
    ColumnForm,
    RadioButtonGroup,
    GenericConfirm,
    ProcessIconsFormatter,
    ObjectStoreModel,
    Memory,
    Observable) {
    return declare('deploy.widgets.workflow.GraphPaletteWidget', [_Widget, _TemplatedMixin], {
        templateString: '<div class="graphPalette">' +
            '<div data-dojo-attach-point="searchAttach" class="smallerSearch"></div>' +
            '<div data-dojo-attach-point="collapseAllBtnAttach"></div>' +
            '<div data-dojo-attach-point="treeAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            this.initSearchTextBox();
            this.initCollapseAllButton();
            this.initTreeContainer();

            this.initStore();
            this.initModel();
            this.initTree();

            this.tree.startup();
        },

        initSearchTextBox: function() {
            var self = this;
            this.filterTextBox = new TextBox({
                name: "search",
                style: {
                    position: "relative",
                    width: this.searchBoxWidth !== undefined ? this.searchBoxWidth : "360px",
                    margin: "2px auto",
                    display: "block"
                },
                placeHolder: i18n("Type to filter"),
                intermediateChanges: true,
                onChange: _.debounce(function(value) {
                    this._updatePlaceHolder();
                    if (!self.tree.initialized) {
                        self.tree.expandAllAndInitialize();
                        setTimeout(function() {
                            self.filterPalette();
                        }, 0);
                    } else {
                        // filter if no changes for a few clicks
                        if (self.typingTimeout) {
                            clearTimeout(self.typingTimeout);
                        }
                        self.typingTimeout = setTimeout(function() {
                            self.filterPalette();
                        }, 0);
                    }
                }, 100, false)
            });
            this.filterTextBox.placeAt(this.searchAttach);

            // create eraser/search button
            this.eraserBtn = domConstruct.create("div", {
                "class": "input-search",
                style: {
                    position: "absolute",
                    cursor: "pointer",
                    right: "4px",
                    top: "8px"
                }
            }, this.filterTextBox.domNode);
            on(this.eraserBtn, "click", function(e) {
                self.filterTextBox.set("value", "");
            });
        },

        initCollapseAllButton: function() {
            // create collapse all button
            var self = this;
            domStyle.set(this.searchAttach, {
                display: "inline-block",
                width: "calc(100% - 22px)"
            });
            domStyle.set(this.collapseAllBtnAttach, {
                display: "inline-block",
                width: "22px",
                position: "relative",
                height: "20px"
            });
            this.collapseAllBtn = domConstruct.create("div", {
                "class": "palette-minus",
                title: i18n("Collapse all"),
                style: {
                    position: "absolute",
                    cursor: "pointer",
                    left: "50%",
                    top: "25%",
                    transform: "translate(-50%, -50%)"
                }
            }, this.collapseAllBtnAttach);
            on(this.collapseAllBtn, "click", function(e){
                event.stop(e);
                self.expandCollapsePalette(true);
            });
        },

        expandCollapsePalette: function(collapse) {
            if (collapse) {
                this.tree.collapseAll();
            } else {
                this.tree.expandAll();
            }

            // fix styles on any drawers
            var topLevelDrawers = this.tree.getListFromQuery(this.store.query({
                parent: this.model.root.id
            }));
            var drawerIndex;
            for (drawerIndex in topLevelDrawers) {
                if (topLevelDrawers.hasOwnProperty(drawerIndex)) {
                    var drawer = topLevelDrawers[drawerIndex];
                    var node = this.tree._itemNodesMap[drawer.id][0];
                    this.tree.select(node, !collapse);
                }
            }

        },

        initTreeContainer: function() {
            this.paletteContainer = domConstruct.create("div", {
                "class": "stepPaletteWidget",
                style: {
                    border: this.paletteBorder !== undefined ? this.paletteBorder : "1px solid #808080",
                    width: "360px",
                    height: "320px"
                }
            });
            domConstruct.place(this.paletteContainer, this.treeAttach);
            domConstruct.create('div', {
                "class": "paletteWaitingIcon"
            }, this.paletteContainer);
        },

        initStore: function() {
            this.store = new Observable(new Memory({
                data: [{
                    id: 1
                }],
                getChildren: function(object) {
                    return this.query({
                        parent: object.id
                    });
                }
            }));
        },

        initModel: function() {
            var self = this;
            self.model = new ObjectStoreModel({
                store: self.store,
                query: {
                    id: 1
                }
            });
        },

        initTree: function() {
            var self = this;
            this.tree = new Tree({
                model: self.model,
                showRoot: false,
                autoExpand: false,
                // overriding method so that we can also set selected value
                _onExpandoClick: _.debounce(function(message) {
                    var node = message.node;
                    if (node.item.id !== this.model.root.id) {
                        this.focusNode(node);

                        node.item.selected = !node.item.selected;

                        if (node.isExpanded) {
                            this._collapseNode(node);
                        } else {
                            this._expandNode(node);

                            // scroll palette to show most of drawer
                            setTimeout(function() {
                                if (self.tree.domNode.scrollTop + self.tree.domNode.clientHeight <
                                        node.containerNode.offsetTop + node.containerNode.offsetHeight) {
                                    self.tree.domNode.scrollTop = node.containerNode.offsetTop-100;
                                }
                            }, 200);
                        }
                        this.select(node, node.item.selected);
                    }
                }, 200, true),
                onClick: function(item, node, evt) {
                    this._onExpandoClick({
                        node: node
                    });
                },
                onOpen: function(item, node) {
                    var rootID = this.model.root.id;
                    if (item.id !== rootID) {
                        if (item.parent === rootID) {
                            this.widget.populateDrawer(item, this.paletteMap);
                            var subdrawers = this.getListFromQuery(this.model.store.query({
                                parent: item.id
                            }));
                            this.expandAllSubdrawers(subdrawers);
                        } else {
                            if (item.type !== "container") {
                                var itemParent = this.getListFromQuery(
                                    this.model.store.query({
                                        id: item.parent
                                    }))[0];
                                this.widget.populateSubdrawer(item, itemParent, this.paletteMap);
                            }
                        }
                    }
                },
                //our select function to apply the class for our needs correctly
                select: function(node, selected) {
                    var rootID = this.model.root.id;
                    if (node.item.parent === rootID) {
                        // If clicking on top level drawer we want the drawer to inherit out own css
                        // class so that it's selected color is not overridden when clicking on other
                        // drawers.
                        domClass.toggle(node.rowNode, "dijitTreeRowSelectedWithClick", selected);
                    } else {
                        // If clicking on a subdrawer, we do not want it to gain the tree's default
                        // "selected" property because it will prevent the node from being highlighted
                        node.setSelected(false);
                    }
                },
                expandAllAndInitialize: function() {
                    this.expandAll();
                    this.initialized = true;
                },
                getListFromQuery: function(queryResult) {
                    var result = [];
                    var index;
                    for (index = 0; index < queryResult.total; index++) {
                        result.push(queryResult[index]);
                    }
                    return result;
                },
                expandAllSubdrawers: function(subdrawers) {
                    var subdrawerIndex;
                    for (subdrawerIndex in subdrawers) {
                        if (subdrawers.hasOwnProperty(subdrawerIndex)) {
                            var subdrawer = subdrawers[subdrawerIndex];
                            var subdrawerNode = this._itemNodesMap[subdrawer.id][0];
                            if (subdrawer.type !== "container") {
                                if (subdrawer.selected === true) {
                                    this._expandNode(subdrawerNode);
                                } else {
                                    this._collapseNode(subdrawerNode);
                                }
                            }
                        }
                    }
                },
                resetToSelectedDrawers: _.debounce(function() {
                    var itemNodesMap = this.tree._itemNodesMap;
                    var rootID = this.model.root.id;
                    var drawerID;
                    for (drawerID in itemNodesMap) {
                        if (itemNodesMap.hasOwnProperty(drawerID)) {
                            var drawerNode = itemNodesMap[drawerID][0];
                            if (drawerNode.item.id !== rootID &&
                                drawerNode.item.type !== "container") {
                                if (drawerNode.item.selected === true) {
                                    this._expandNode(drawerNode);
                                } else {
                                    this._collapseNode(drawerNode);
                                }
                            }
                        }
                    }
                }, 0, true)
            });
            this.tree.widget = this;
            this.tree.initialized = false;
            domClass.add(this.tree.domNode, "dijitTreePalette");
            this.tree.placeAt(this.paletteContainer);
            this.paletteContainer.tree = this.tree;
        },

        filterPalette: function() {
            var filterValue = this.filterTextBox.get("value");
            var isSearch = (filterValue && filterValue.length > 0);
            if (isSearch) {
                filterValue = filterValue.toLowerCase();
                if (!this.filtering) {
                    this.filtering = true;
                    this.tree.expandAll();
                    domClass.add(this.eraserBtn, "input-eraser");
                    domClass.remove(this.eraserBtn, "input-search");
                    domClass.add(this.collapseAllBtnAttach, "hidden");
                }
                this.searchAndHideDrawers(filterValue);
            } else {
                if (this.filtering) {
                    this.filtering = false;
                    this.removeHiddenFromAllNodes();
                    this.tree.resetToSelectedDrawers();
                    domClass.remove(this.eraserBtn, "input-eraser");
                    domClass.add(this.eraserBtn, "input-search");
                    domClass.remove(this.collapseAllBtnAttach, "hidden");
                }
            }
            this.tree.resize();
        },

        searchAndHideDrawers: function(filterValue) {
            var rootID = this.model.root.id;
            var topLevelDrawers = this.tree.getListFromQuery(this.store.query({
                parent: rootID
            }));
            var drawerIndex;
            for (drawerIndex in topLevelDrawers) {
                if (topLevelDrawers.hasOwnProperty(drawerIndex)) {
                    var drawer = topLevelDrawers[drawerIndex];
                    var atLeastOneVisibleSubdrawer;
                    var drawerMatch = drawer.drawerSearchName &&
                        drawer.drawerSearchName.indexOf(filterValue) !== -1;
                    var subdrawers = this.tree.getListFromQuery(this.store.query({
                        parent: drawer.id
                    }));
                    // If the drawer has no subdrawers, search the items in the drawer
                    if (subdrawers.length === 1 && subdrawers[0].type === "container") {
                        atLeastOneVisibleSubdrawer = this.searchAndHideItems(
                            subdrawers[0],
                            drawerMatch,
                            filterValue);
                    } else {
                        atLeastOneVisibleSubdrawer = this.searchAndHideSubdrawers(
                            subdrawers,
                            drawerMatch,
                            filterValue);
                    }
                    // hide/show drawer
                    var drawerNode = this.tree._itemNodesMap[drawer.id][0];
                    this.setVisibilityOfNode(drawerNode, atLeastOneVisibleSubdrawer || drawerMatch);
                }
            }
        },

        searchAndHideSubdrawers: function(subdrawers, drawerMatch, filterValue) {
            // Search the subdrawers
            var atLeastOneVisibleSubdrawer = false;
            var atLeastOneVisibleItem = false;
            var subdrawerIndex;
            for (subdrawerIndex in subdrawers) {
                if (subdrawers.hasOwnProperty(subdrawerIndex)) {
                    var subdrawer = subdrawers[subdrawerIndex];
                    var subDrawerMatch = drawerMatch ||
                        (subdrawer.drawerSearchName &&
                        subdrawer.drawerSearchName.indexOf(filterValue) !== -1);
                    var subdrawerContainer = this.getDrawer(subdrawer.id);
                    if (subdrawerContainer) {
                        atLeastOneVisibleItem = this.searchAndHideItems(
                            subdrawerContainer,
                            subDrawerMatch,
                            filterValue);
                        if (!atLeastOneVisibleSubdrawer) {
                            atLeastOneVisibleSubdrawer = subDrawerMatch ||
                                atLeastOneVisibleItem;
                        }
                        var subdrawerNode = this.tree._itemNodesMap[subdrawer.id][0];
                        // hide/show subdrawer
                        this.setVisibilityOfNode(
                            subdrawerNode,
                            atLeastOneVisibleItem);
                    } else {
                        // This is for supporting drawers that have both subdrawers and
                        // uncatogorized items
                        atLeastOneVisibleItem = this.searchAndHideItems(
                            subdrawer,
                            subDrawerMatch,
                            filterValue);
                        if (!atLeastOneVisibleSubdrawer) {
                            atLeastOneVisibleSubdrawer = subDrawerMatch ||
                                atLeastOneVisibleItem;
                        }
                    }
                }
            }
            return atLeastOneVisibleSubdrawer;
        },

        searchAndHideItems: function(container, drawerMatch, filterValue) {
            var atLeastOneVisibleItem = false;
            if (container && container.itemsDiv) {
                var i;
                for (i = 0; i < container.itemsDiv.length; i++) {
                    var div = container.itemsDiv[i];
                    if (drawerMatch || div.stepSearchName.indexOf(filterValue) !== -1) {
                        domClass.remove(div, "hidden");
                        atLeastOneVisibleItem = true;
                    } else {
                        domClass.add(div, "hidden");
                    }
                }
            }
            return atLeastOneVisibleItem;
        },

        setVisibilityOfNode: function(node, visible) {
            if (visible) {
                node.domNode.children[0].style.display = "";
            } else {
                node.domNode.children[0].style.display = "none";
            }
        },

        removeHiddenFromAllNodes: function() {
            var itemNodesMap = this.tree._itemNodesMap;
            var rootID = this.model.root.id;
            var drawerID;
            for (drawerID in itemNodesMap) {
                if (itemNodesMap.hasOwnProperty(drawerID)) {
                    var drawerNode = itemNodesMap[drawerID][0];
                    if (drawerNode.item.id !== rootID) {
                        if (drawerNode.item.type !== "container") {
                            drawerNode.domNode.children[0].style.display = "";
                        } else {
                            var container = drawerNode.item;
                            var i;
                            for (i = 0; i < container.itemsDiv.length; i++) {
                                var div = container.itemsDiv[i];
                                domClass.remove(div, "hidden");
                            }
                        }
                    }
                }
            }
        },

        resetSearch: function() {
            if (this.filterTextBox) {
                this.filterTextBox.reset();
                this.filterPalette();
                this.filterTextBox.focus();
                this.paletteContainer.scrollTop = 0;
                this.filtering = false;
            }
        },

        /**
         * Provide all the data for creating a drawer. If drawer already exists, clear contents
         * If drawer does not exist, create the drawer.
         * @param  {String} drawerName     [Name of the drawer to be displayed]
         * @param  {boolean} selected      [whether the drawer is selected on not]
         * @param  {float} parentID        [ID of the parent drawer]
         * @param  {int} index             [index of the drawer in the palette map. Only subdrawers will have an index]
         * @param  {drawer} existingDrawer [Optional param to skip the check for existing drawers by passing in your own]
         * @param  {String} displayName    [Optional param to manually set the display name of the drawer]
         * @return {float}                 [Return the ID of the drawer we just created/cleared]
         */
        generateOrClearDrawer: function(drawerName, selected, parentID, index, existingDrawer, displayName) {
            var drawer;
            var drawerID;
            if (existingDrawer) {
                drawer = existingDrawer;
            } else {
                drawer = this.getDrawer(parentID, drawerName);
            }
            if (!drawer) {
                var name = i18n(drawerName);
                if (displayName) {
                    name = displayName;
                }
                drawerID = this.store.put({
                    name: name,
                    paletteName: drawerName,
                    parent: parentID,
                    type: "drawer",
                    selected: selected,
                    initialized: false,
                    paletteMapIndex: index,
                    drawerSearchName: (drawerName === "" ? undefined : name.toLowerCase())
                });
                this.setNodeStyle(this.tree._itemNodesMap[drawerID][0]);
            } else {
                // If drawer exists, attempt to clear out drawer contents to be refereshed
                var containerDrawer = this.getDrawer(drawer.id);
                if (containerDrawer) {
                    this.store.remove(containerDrawer.id);
                }
                // else:
                // The drawer was created but never populated, do nothing because it is already prepped for data.
                drawerID = drawer.id;
                drawer.initialized = false;
            }
            return drawerID;
        },

        setNodeStyle: function(node) {
            if (!node) {
                return;
            }
            this.removeNode(node.iconNode);
            this.removeNode(node.expandoNode);
            this.removeNode(node.expandoNodeText);
            if (node.item.parent === this.model.root.id) {
                domClass.add(node.domNode, "dijitTreeDrawer");
            } else {
                domClass.add(node.domNode, "dijitTreeSubdrawer");
            }
        },

        removeNode: function(node) {
            domConstruct.destroy(node);
        },

        /**
         * [get a drawer when you dont know its ID by using its parent ID and its name]
         * @param  {float} parentID    [ID of parent drawer]
         * @param  {String} drawerName [Optional name of drawer we are looking for (if parent only has 1 child
         *                              drawer then that drawer is returned by defuault since no filtering by
         *                              name will be required.)]
         * @return {drawer}            [Return the drawer we found or undefined if we found nothing]
         */
        getDrawer: function(parentID, drawerName) {
            var drawer;
            var existingDrawers = this.tree.getListFromQuery(this.store.query({
                parent: parentID
            }));
            // if parent only has 1 subdrawer and drawerName was not provided, return that subdrawer
            if (!drawerName && existingDrawers.length === 1) {
                drawer = existingDrawers[0];
            } else {
                // find subdrawer by name amoungst existing subdrawers
                var existingDrawerIndex = -1;
                if (drawerName) {
                    var index;
                    for (index in existingDrawers) {
                        if (existingDrawers.hasOwnProperty(index)) {
                            var currDrawer = existingDrawers[index];
                            if (currDrawer.name === drawerName) {
                                existingDrawerIndex = index;
                                break;
                            }
                        }
                    }
                }
                if (existingDrawerIndex !== -1) {
                    drawer = existingDrawers[existingDrawerIndex];
                }
            }
            return drawer;
        },

        addSteps: function(subdrawerData, drawer, drawerTip) {
            var containerID = this.store.put({
                name: "",
                parent: drawer.id,
                drawerSearchName: drawer.drawerSearchName,
                type: "container",
                itemsDiv: []
            });
            // Append an empty domNode to drawer to contain children
            var container = this.store.query({
                id: containerID
            })[0];
            var containerNode = this.tree._itemNodesMap[containerID][0].domNode;
            var drawerNode = domConstruct.create("div", {}, containerNode);

            containerNode.children[0].style.display = "none";
            // add steps
            var inx = 0;
            for (inx = 0; inx < subdrawerData.children.length; inx++) {
                var item = subdrawerData.children[inx];
                item.displayName = i18n(item.name);
                if (item.prepend && item.prepend.length > 0) {
                    var j = 0;
                    for (j = 0; j < item.prepend.length; j++) {
                        item.displayName = i18n(item.prepend[j]) + ' / ' + item.displayName;
                    }
                }
                item.drawerTip = drawerTip;
                var stepDiv = this.populatePaletteStep(drawerNode, item);
                if (this.postStepCreate) {
                    this.postStepCreate(stepDiv);
                }
                container.itemsDiv.push(stepDiv);
            }
            drawer.initialized = true;
        },

        populateDrawer: function(drawer, paletteMap) {
            // Populate the subdrawers of the current drawer, or if there are no subdrawers, fill it with items
            if (!drawer.initialized) {
                var drawerTip = drawer.name;
                var subdrawerIndex;
                for (subdrawerIndex in paletteMap[drawer.paletteName]) {
                    if (paletteMap[drawer.paletteName].hasOwnProperty(subdrawerIndex)) {
                        var subdrawerData = paletteMap[drawer.paletteName][subdrawerIndex];
                        // check if we need a subdrawer or not
                        if (subdrawerData.hasOwnProperty("subdrawerName")) {
                            // If the higher level drawer already existed, clear contents.
                            // then, generate all contents
                            var subdrawer = this.getDrawer(drawer.id, subdrawerData.subdrawerName);
                            this.generateOrClearDrawer(
                                subdrawerData.subdrawerName,
                                true,
                                drawer.id,
                                subdrawerIndex,
                                subdrawer,
                                subdrawerData.subdrawerDisplayName);
                            if (subdrawer) {
                                drawerTip += " / " + subdrawer.name;
                                this.addSteps(subdrawerData, subdrawer, drawerTip);
                                subdrawer.initialized = true;
                            }
                        } else {
                            this.addSteps(subdrawerData, drawer, drawerTip);
                        }
                        drawer.initialized = true;
                    }
                }
            }
        },

        populateSubdrawer: function(subdrawer, drawer, paletteMap) {
            if (!subdrawer.initialized) {
                var subdrawerData = paletteMap[drawer.paletteName][subdrawer.paletteMapIndex];
                var drawerTip = i18n(drawer.paletteName + " / " + subdrawer.name);
                this.addSteps(subdrawerData, subdrawer, drawerTip);
            }
        },

        populateTopLevelDrawers: function(paletteMap, topStepDrawerLabel, lazyChildrenDrawer,
            openClipboard) {
            this.tree.paletteMap = paletteMap;
            var rootID = this.model.root.id;
            // what drawer is opened initially?
            var drawerName;
            var openDrawer = topStepDrawerLabel;
            var openDrawerID;
            if (openClipboard) {
                openDrawer = i18n("Clipboard");
            } else if (this.drawerMap) {
                for (drawerName in this.drawerMap) {
                    if (this.drawerMap.hasOwnProperty(drawerName)) {
                        if (this.drawerMap[drawerName].selected) {
                            openDrawer = drawerName;
                            break;
                        }
                    }
                }
            }
            this.lazyChildrenDrawer = lazyChildrenDrawer;

            // create top level drawers
            for (drawerName in paletteMap) {
                if (paletteMap.hasOwnProperty(drawerName)) {
                    if (paletteMap[drawerName].length > 1 || paletteMap[drawerName][0].children.length >
                        0 || drawerName === i18n("Clipboard")) {
                        // create/reuse drawer
                        var drawerID = this.generateOrClearDrawer(
                            drawerName,
                            drawerName === openDrawer,
                            rootID,
                            null);
                        if (drawerName === openDrawer) {
                            openDrawerID = drawerID;
                        }
                    }
                }
            }
            this.tree.resetToSelectedDrawers();
            this.tree.select(this.tree._itemNodesMap[openDrawerID][0], true);
        },

        populatePaletteStep: function(drawer, item, paletteDialog) {
            var self = this;
            var resultNode = domConstruct.create("div", {
                'class': 'paletteItemContainer'
            });
            drawer.appendChild(resultNode);

            // add delete icon for clipboard items
            if (item.copy) {
                domConstruct.create("div", {
                    className: "closeStepIcon inline-block",
                    title: i18n("Delete"),
                    onmousedown: function(e) {
                        event.stop(e);
                    },
                    onclick: function(e) {
                        var parentNode = e.currentTarget.parentNode;
                        var removeConfirm = new GenericConfirm({
                            message: i18n(
                                "Are you sure you want to remove the step '%s' from your Clipboard?",
                                item.label),
                            action: function() {
                                xhrBase.del({
                                    url: bootstrap.restUrl + "copiedStep/" + item.id,
                                    handleAs: "json",
                                    load: function(data) {
                                        // search for the item in the tree and delete it there.
                                        var clipboardDrawerID = self.tree.model.store.query({
                                            name:"Clipboard"
                                        })[0].id;
                                        var clipboardItemContainer = self.tree.model.store.query({
                                            parent:clipboardDrawerID
                                        })[0];
                                        var divIndex = clipboardItemContainer.itemsDiv.indexOf(
                                                parentNode);
                                        if (divIndex !== -1) {
                                            clipboardItemContainer.itemsDiv.splice(divIndex, 1);
                                            domConstruct.destroy(parentNode);
                                        } else {
                                            this.error({
                                                message: i18n("No such step in tree directory.")
                                            });
                                        }
                                    },
                                    error: function(error) {
                                        var alert = new Alert({
                                            message: i18n("Error deleting copied step.") +
                                                (error && error.message ? (" "+error.message) : "")
                                        });
                                        alert.startup();
                                    }
                                });
                            }
                        });
                    }
                }, resultNode);
            }

            // icon
            var iconContainer = domConstruct.create("div", {
                className: "iconContainer inline-block"
            }, resultNode);
            var tootip = this.editor.tooltips.get(item);
            if (tootip) {
                domAttr.set(resultNode, "title", i18n(tootip));
            }
            var icon = ProcessIconsFormatter.getIconForTree(item);
            domConstruct.place(icon, iconContainer);

            // step label
            var stepNameLabel = "";
            if (item.copy && item.label) {
                // no need to translate--label saved with translation
                stepNameLabel = item.label;
                if (item.label.indexOf('\n') !== -1) {
                    domClass.add(resultNode, "copy");
                }
            } else {
                stepNameLabel = i18n(item.displayName || item.name);
            }
            var processNameContainer = domConstruct.create("div", {
                className: "processActivityName draggableProcessStepName " + (item.copy ?
                    "copy" : "")
            }, resultNode);
            domConstruct.create("div", {
                className: "process-name-wrapper process-name-wrapper-draggable",
                innerHTML: stepNameLabel.escape()
            }, processNameContainer);
            resultNode.stepSearchName = stepNameLabel.toLowerCase();

            // Creates the image which is used as the sidebar icon (drag source)
            var releaseFunction = function(graph, evt, cell, x, y, dlg) {

                // if this has lazy children, throw them in a dialog and let user pick actual item
                var deferred = new Deferred();
                var itm = item;
                if (itm.hasChildren && self.lazyChildrenDrawer) {
                    var dialog = new Dialog({
                        title: i18n("Component Process for '%s'", util.escape(itm.name)),
                        closable: true,
                        draggable: true
                    });
                    var note = domConstruct.create("div", {
                        innerHTML: i18n("No process steps found"),
                        style: {
                            display: "none",
                            paddingBottom: "12px"
                        }
                    }, dialog.containerNode);
                    var spinner = domConstruct.create("div", {
                        "class": "loading-spinner"
                    }, dialog.containerNode);
                    dialog.show();

                    if (self.editor.mode === 'firstDayWizard') {
                        domClass.add(spinner, "hidden");
                        var compProcesses = self.editor.firstDayWizardModel.getComponentProcessesForDesigner(
                            item);
                        if (compProcesses.length > 0) {
                            var allowedValues = [];
                            array.forEach(compProcesses, function(proc) {
                                allowedValues.push({
                                    "label": proc.name,
                                    "value": proc
                                });
                            });
                            var radioButtonGroup = new RadioButtonGroup({
                                name:"pickProcess",
                                options: allowedValues,
                                hideLabel: true,
                                doubleWidth: true,
                                disabled:false,
                                enabled:true,
                                onChange: function(value) {
                                    itm = value;
                                    dialog.hide();
                                    dialog.destroy();
                                    deferred.resolve();
                                 }
                            });
                            radioButtonGroup.placeAt(dialog.containerNode);
                        } else {
                            domStyle.set(note, "display", "inline");
                        }
                    } else {
                        xhr(self.lazyChildrenDrawer.getUrl(item), {
                            handleAs: "json"
                        }).then(function(data) {
                            domClass.add(spinner, "hidden");
                            if (data.length > 0) {
                                var allowedValues = [];
                                array.forEach(data, function(item) {
                                    allowedValues.push({
                                        "label": item.name,
                                        "value": item
                                    });
                                });
                                var radioButtonGroup = new RadioButtonGroup({
                                    name:"pickProcess",
                                    options: allowedValues,
                                    hideLabel: true,
                                    doubleWidth: true,
                                    disabled:false,
                                    enabled:true,
                                    onChange: function(value) {
                                        itm = value;
                                        dialog.hide();
                                        dialog.destroy();
                                        deferred.resolve();
                                     }
                                });
                                radioButtonGroup.placeAt(dialog.containerNode);
                            } else {
                                domStyle.set(note, "display", "inline");
                            }
                        });
                    }
                } else {
                    deferred.resolve();
                }

                deferred.then(function() {
                    if (itm) {
                        // due to getCellDropTarget we ensure that
                        //cell will be either be
                        // 1: null to put on the main pallette
                        // 2: a container cell (like Run For Each Agent)
                        var model = self.editor.graph.getModel();
                        itm.process = self.process;

                        model.beginUpdate();
                        x -= 80;
                        y -= 20;

                        // if dropping on a container, adjust x,y
                        var parent = cell;
                        if (cell && cell.edge) {
                            parent = itm.type==='note'?null:(parent.source || parent.target || {parent:parent}).parent;
                        }
                        if (parent && parent.activity && parent.activity.isContainer) {
                            var geo = parent.getGeometry();
                            x -= geo.x;
                            y -= geo.y;
                        }

                        // don't split if added from popup dialog
                        self.editor.disableSplitting = dlg;
                        if (itm.copy && itm.activity) {
                            self.editor.activityCreator.addSavedActivity(
                                lang.clone(itm.activity),
                                x,
                                y,
                                cell);
                        } else {
                            self.editor.activityCreator.addNewActivity(itm, x, y, cell);
                        }
                        self.editor.disableSplitting = false;
                        model.endUpdate();
                    }
                });
            };

            resultNode.releaseFunction = releaseFunction;

            if (!this.nodrag) {
                resultNode.ds = mxUtils.makeDraggable(
                    resultNode,
                    self.editor.graph,
                    releaseFunction,
                    icon,
                    null,
                    null,
                    null,
                    null,
                    true,
                    self.editor.getCellDropTarget);
            }

            return resultNode;
        },


        createPaletteMap: function(topStepDrawerLabel, lazyChildrenDrawer, data) {
            var self = this;
            var map = {};
            // loose palette items go in utility drawer
            map[topStepDrawerLabel] = [];
            map[i18n("Clipboard")] = [];
            var lazyChildrenDrawerLabel = null;
            if (lazyChildrenDrawer) {
                lazyChildrenDrawerLabel = lazyChildrenDrawer.label;
                map[lazyChildrenDrawerLabel] = [];
            }
            var cnt = [0];
            this.flatten(data, map, topStepDrawerLabel, lazyChildrenDrawerLabel, [], cnt, 0);
            this.drawerCnt = cnt[0];
            var needMisc = this.drawerCnt > 14;

            // sort top level/lazy drawers
            if (lazyChildrenDrawerLabel) {
                map[lazyChildrenDrawerLabel].sort(function(a, b) {
                    return a.name.localeCompare(b.name);
                });
            }

            // for each drawer, see if we: 1) consolidate small drawers into a misc drawer or
            //                             2) create an accordian of sub-drawers from the first segment of the prepend
            var i = 0;
            var child = null;
            var drawerName = null;
            var paletteMap = {};
            var miscArr = [];
            var toparray = [];
            var subdrawerMap = {};
            for (drawerName in map) {
                if (map.hasOwnProperty(drawerName)) {
                    toparray = [];
                    subdrawerMap = {};

                    // if too many drawers, consolidate smaller ones into a misc drawer
                    // drawer name becomes first segment of item name
                    if (needMisc &&
                        drawerName !== i18n("Clipboard") &&
                        drawerName !== lazyChildrenDrawerLabel &&
                        map[drawerName].length < 4) {
                        for (i = 0; i < map[drawerName].length; i++) {
                            child = map[drawerName][i];
                            child.prepend.unshift(drawerName);
                            miscArr.push(child);
                        }
                        delete map[drawerName];
                        this.drawerCnt--;
                    } else {
                        // else if an item has a prepended name, create a subdrawer from that
                        for (i = 0; i < map[drawerName].length; i++) {
                            child = map[drawerName][i];
                            if (child.prepend && child.prepend.length > 0) {
                                var subdrawers = subdrawerMap[child.prepend[0]];
                                if (!subdrawers) {
                                    subdrawers = subdrawerMap[child.prepend[0]] = [];
                                }
                                child.prepend.shift();
                                subdrawers.push(child);
                            } else {
                                toparray.push(child);
                            }
                        }
                    }

                    // only if this drawer has subdrawers....
                    var arr = paletteMap[drawerName] = [];
                    arr.push({
                        children: toparray
                    });
                    var subdrawerName = null;
                    for (subdrawerName in subdrawerMap) {
                        if (subdrawerMap.hasOwnProperty(subdrawerName)) {
                            var subdrawerArr = subdrawerMap[subdrawerName];

                            // if every child in this subdrawer has the same prepend, put it in drawer name
                            var name = subdrawerName;
                            var displayName = i18n(name);
                            if (subdrawerArr[0].prepend.length > 0) {
                                var inx = 0;
                                var seg = subdrawerArr[0].prepend[0];
                                var all = true;
                                for (inx = 0; inx < subdrawerArr.length; inx++) {
                                    if (subdrawerArr[inx].prepend[0] !== seg) {
                                        all = false;
                                        break;
                                    }
                                }
                                if (all) {
                                    name += ' / ' + seg;
                                    displayName += ' / ' + i18n(seg);
                                    for (inx = 0; inx < subdrawerArr.length; inx++) {
                                        subdrawerArr[inx].prepend.shift();
                                    }
                                }
                            }
                            arr.push({
                                subdrawerName: name,
                                subdrawerDisplayName: displayName,
                                children: subdrawerArr
                            });
                        }
                    }
                }
            }
            // add misc drawer at end
            if (miscArr.length > 0) {
                var itm = paletteMap[i18n("Miscellaneous")];
                if (!itm) {
                    itm = paletteMap[i18n("Miscellaneous")] = [{
                        children: []
                    }];
                }
                itm[0].children = itm[0].children.concat(miscArr);
            }
            return paletteMap;
        },

        flatten: function(children, map, parent, lazyDrawerLabel, prepend, cnt, level) {
            var self = this;
            array.forEach(children, function(child) {
                if (child.type === "folder") {
                    // top level folder is a palette drawer
                    if (level === 0) {
                        // lazy loaded drawer
                        if (child.hasChildren && lazyDrawerLabel) {
                            map[lazyDrawerLabel].push(child);
                        } else {
                            if (!map[child.name]) {
                                map[child.name] = [];
                            }
                            self.flatten(
                                child.children,
                                map,
                                child.name,
                                lazyDrawerLabel,
                                [],
                                level + 1);
                        }
                        cnt[0]++;
                    } else {
                        // else add to same drawer but prepend child names with folder name
                        var pre = prepend.slice();
                        pre.push(child.name);
                        self.flatten(
                            child.children,
                            map,
                            parent,
                            lazyDrawerLabel,
                            pre,
                            level + 1);
                    }
                } else {
                    child.prepend = prepend.slice();
                    map[parent].push(child);
                }
            });
        }
    });
});

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
/*global define, lscache */
define([
        "dojo/_base/declare",
        "dojo/_base/kernel",
        "dojo/_base/array",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/on",
        "dojo/dom-style",
        "dojo/_base/lang",
        "dijit/Tree",
        "dijit/tree/_dndContainer",
        "dojox/lang/functional"
        ],
function(
        declare,
        kernel,
        array,
        domClass,
        domConstruct,
        on,
        domStyle,
        lang,
        Tree,
        dndContainer,
        functional
) {

    var global = kernel.global;
    var lscache = global.lscache;
    if (!lscache) {
        console.warn("Please load lscache library, falling back to cookie based storage");
    }

    // _dndContainer is a basic stub dnd controller, but lacks a few methods called by dijit/Tree
    // _dndSelector creates an auto-named cookie if the tree is persist:true, this can make too many cookies
    // dndSource (extends _dndSelector) makes a dnd avatar when a user drags an item, and still makes a cookie.
    var stubDndController = declare("js.util.webext.widgets.localstoragetree._DndController", dndContainer, {
        "_getSavedPaths": function() {return [];},
        "setSelection": function(){},
        "userSelect": function(){},
        "removeTreeNode": function(){},
        "singular": true
    });

    // possibly make dndController also use lscache?
    // possibly allow parameter to supply persistence mechanism

    /**
     * A tree extension that persists to local-storage instead of a cookie
     *
     * @param persistExpire: time, in minutes, to cache the state of the tree
     */
    return declare('js.util.webext.widgets.LocalStorageTree', [Tree], {

        //dndController: stubDndController,
        persistExpire: 4*60,

        // taken from dijit/Tree, but using lscache instead of dojo/cookie
        _initState: function(){
            if (!lscache) {
                return this.inherited("_initState", arguments);
            }

            this._openedNodes = {};
            if(this.persist && this.cookieName){
                var oreo = lscache.get(this.cookieName);
                if(oreo){
                    array.forEach(oreo.split(','), function(item){
                        this._openedNodes[item] = true;
                    }, this);
                }
            }
        },

        // taken from dijit/Tree, but using lscache instead of dojo/cookie
        _state: function(node, expanded){
            if (!lscache) {
                return this.inherited("_state", arguments);
            }

            if(!this.persist){
                return false;
            }
            var path = array.map(node.getTreePath(), function(item){
                    return this.model.getIdentity(item);
                }, this).join("/");
            if(arguments.length === 1){
                return this._openedNodes[path];
            }

            if(expanded){
                this._openedNodes[path] = true;
            }
            else {
                delete this._openedNodes[path];
            }
            if(this.persist && this.cookieName){
                var ary = [], id;
                functional.forIn(this._openedNodes, function(expanded, id) {
                    ary.push(id);
                });
                // expire after 4 hours
                lscache.set(this.cookieName, ary.join(","), this.persistExpire);
            }
        }
    });
});

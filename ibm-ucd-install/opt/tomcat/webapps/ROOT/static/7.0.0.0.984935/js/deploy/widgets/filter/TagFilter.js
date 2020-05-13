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
/**
 * 
 */
define([
        "dijit/form/TextBox",
        "dojo/_base/declare",
        "dojo/_base/array"
        ],
function(
    TextBox,
    declare,
    array
) {
    return declare([TextBox], {

        /**
         * default type: "like"
         */
        postCreate: function() {
            this.inherited(arguments);
            
            if (!this.type || this.type === "like") {
                this._filter = this._filterLike;
            }
            else if (this.type === "eq") {
                this._filter = this._filterExact;
            }
            else {
                throw "Unknown type for TagFilter: "+this.type;
            }
        },
        
        /**
         * return a list of tag names
         */
        getRawValue: function(item) {
            return array.map(item.tags, function(tag) {
                return tag.name.toLowerCase();
            });
        },
        
        /**
         * 
         */
        filterPass: function(item, values) {
            return this._filter(this.getRawValue(item), values);
        },
        
        /**
         * 
         */
        _getValuesAttr: function() {
            /*jslint regexp:true */
            var value = this.get("value").trim().toLowerCase();
            var values;
            var finalValues = [];

            if (value) {
                //get all values in quotes
                values = value.match(/"[^"]+"/g);
                array.forEach(values, function(val) {
                    value = value.replace(val, "");
                    //for some reason this only replaces one instance of the string.
                    //so we need to call this twice
                    val = val.replace("\"", "").replace("\"", "").trim();
                    if (val !== "") {
                        finalValues.push(val);
                    }
                });

                //get the rest of the space separated values
                array.forEach(value.trim().split(" "), function(val) {
                    //if we wrap a value in quotes we'll always get empty string
                    //which will never match any name
                    val = val.trim();
                    if (val !== "") {
                        finalValues.push(val);
                    }
                });
            }
            else {
                finalValues = null;
            }

            return finalValues;
        },
        
        /**
         * Return true if the list of tags on the item contains at least one
         * of the specified tags.
         * 
         *      i.e.  tag1 OR tag2 OR tag3 ...
         */
        _filterLike: function(tagNames, values) {
            var pass = false;
            array.forEach(values, function(v) {
                if (array.indexOf(tagNames, v) !== -1) {
                    pass = true;
                }
            });
            return pass;
        },
        
        /**
         * Returns true if the list of tags on the items contains all of the 
         * specified tags.
         * 
         *      i.e.  tag1 AND tag2 AND tag3 ...
         */
        _filterExact: function(tagNames, values) {
            var pass = true;
            array.forEach(values, function(v) {
                if (array.indexOf(tagNames, v) === -1) {
                    pass = false;
                }
            });
            return pass;
        }
    });
});
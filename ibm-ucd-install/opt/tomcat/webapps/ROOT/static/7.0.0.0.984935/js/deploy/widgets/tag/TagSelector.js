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
 **/
define([
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dojo/_base/declare",
        "dojo/json",
        "dojo/store/Memory",
        "dojo/_base/xhr",
        "dojo/dom-style",
        "dijit/form/ComboBox",
        "js/webext/widgets/Alert",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/ColumnForm",
        "dojo/cookie"
        ],
function(
    _TemplatedMixin,
    _Widget,
    declare,
    JSON,
    Memory,
    xhr,
    domStyle,
    ComboBox,
    Alert,
    Dialog,
    ColumnForm,
    cookie
) {
	
    /**
     * item - (default: none)
     * array of objects to tag
     * 
     * objectType - (required) (default: none)
     * Note: is case-sensitive
     * 
     * callback - (optional) (default: none)
     * callback function to call when dialog closes
     * 
     * 
     */
    return declare([_Widget, _TemplatedMixin], {
            templateString: 
                '<div class="tagSelector">'+
                    '<div data-dojo-attach-point="formAttach" ></div>'+
                '</div>',
            
            /**
             * 
             */
            postCreate: function() {
                this.inherited(arguments);
                var self = this;

                this.existingValues = {
                    color: "#ffffff"
                };
                
                if (!self.item.length) {
                    if (self.item.id) {
                        var tmp = self.item.id;
                        self.item = [];
                        self.item.push(tmp);
                    }
                }
                
                /* Grab all existing tags for this resource and store them in a
                 * MemoryStore. This way we do not have to make a REST call each
                 * time we want to check to see if something exists.
                 */
                var existingTags = [];
                xhr.get({
                    url: bootstrap.restUrl+"tag/type/"+self.objectType,
                    sync: true,
                    handleAs: "json",
                    load: function(results) {
                        existingTags = results;
                    }
                });
                var mStore = new Memory( { "data": existingTags } );
                
                /*
                 * Create the Column form that will hold the fields
                 * sends a POST to add a tag to the given objectType.
                 * e.g. rest/resource/resource/{resourceId}/tag
                 */
                self.form = new ColumnForm({
                    postSubmit: function(data) {
                        if (self.callback !== undefined) {
                            self.callback();
                        }
                    },
                    /**
                     * put the data in a JSON object. This object contains the
                     * common data between a single and bulk tagging. 
                     */
                    addData: function(data) {
                        data.url = bootstrap.restUrl+"tag/"+self.objectType;
                        data.objectType = self.item.objectType;
                        data.ids = self.item;
                        
                        return data;
                    },
                    onCancel: function() {
                        if (self.callback !== undefined) {
                            self.callback();
                        }
                    },
                    onSubmit: function(data) {
                        xhr.put({
                            url: data.url,
                            sync: true,
                            putData: JSON.stringify(data),
                            handleAs: "json",
                            headers: { "Content-Type": "application/json" },
                            error: function(response) {
                                var dndAlert = new Alert({
                                    message: util.escape(response.responseText)
                                });
                            }
                        });
                    },
                    validateFields: function(data) {
                        var results = mStore.query( { "name" : data.name } );
                        // if the current tag does not exist, it needs to have 
                        // a color selected.
                        if (results.length < 1 && !data.color) {
                            return [ i18n("You must select a color.") ];
                        }
                    }
                });
                
                /* 
                 * Set up the filtering ComboBox 
                 * We can use the memory store to query for results
                 * This will hide or show the description and color boxes for 
                 * creating a new tag.
                 * 
                 * Note: onChange fires once the user leaves the "name" field,
                 * not after a character is entered like the filtering.
                 * 
                 */
                var tagSelect = new ComboBox({
                    store: mStore,
                    searchAttr: "name",
                    noDataMessage: i18n("No tags found."),
                    autoComplete: false,
                    selectOnClick: true,
                    pageSize: "30",
                    onChange: function(value) {
                        var results = mStore.query( { "name": value } );
                        if (results.length > 0) {
                            self._removeOptionalForms();
                        }
                        else {
                            self._createOptionalForms();
                        }
                    }
                });
                
                /* add the required name field */
                var fName = self.form.addField({
                    name: "name",
                    label: i18n("Name"),
                    required: true,
                    widget: tagSelect
                });
                this._createOptionalForms();
                
                self.form.placeAt(self.formAttach);
            },
            
            /**
             * Creates the description and color fields if they do not yet exist
             */
            _createOptionalForms: function() {
                var self = this;
             
                /* Create description field if it doesn't exist */
                if (!self.fDescription) {
                    self.fDescription = self.form.addField({
                        name: "description",
                        label: i18n("Description"),
                        type: "Text"
                    });
                }
                /* create color field if it doesn't exist */
                if (!self.fColor) {
                    self.fColor = self.form.addField({
                        name: "color",
                        label: i18n("Color"),
                        type: "ColorPicker",
                        value: this.existingValues.color
                    });
                }
            },
            
            /**
             * Removes the description and color fields from the form, calls
             * destroy() on their widgets, and sets the variables to null to 
             * allow for recreation later.
             */
            _removeOptionalForms: function() {
                var self = this;
             
                if (self.fDescription) {
                    self.form.removeField("description");
                    self.fDescription.widget.destroy();
                    self.fDescription = null;
                }
            }
    });
});

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
        "dojo/_base/xhr",
        "dojo/store/Memory",
        "dojo/json",
        "dijit/form/FilteringSelect",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Alert",
        "js/webext/widgets/GenericConfirm"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        xhr,
        Memory,
        JSON,
        FilterSelect,
        ColumnForm,
        Alert,
        GenericConfirm
) {
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="tagDisplay">'+
                '<div data-dojo-attach-point="formAttach"></div>'+
            '</div>',
            
            /**
             * 
             */
            postCreate: function() {
                this.inherited(arguments);
                var self = this;
                
                var data = {
                    ids: self.ids
                };
                var baseDelUrl = bootstrap.restUrl+"tag/"+self.objectType+"/";
                var rurl = bootstrap.restUrl+"tag/"+self.objectType+"/unique";
                var uniqueTags = [];
                xhr.post({
                    url: rurl,
                    putData: JSON.stringify(data),
                    sync: true,
                    headers: { "Content-Type": "application/json" },
                    handleAs: "json",
                    load: function(results) {
                        uniqueTags = results;
                    },
                    error: function(response) {
                        var dndAlert = new Alert({
                            message: util.escape(response.responseText)
                        });
                    }
                });
                var tagStore = new Memory( { "data": uniqueTags } );
                
                self.form = new ColumnForm({
                    postSubmit: function(data) {
                        if (self.callback !== undefined) {
                            self.callback();
                        }
                    },
                    addData: function(data) {
                        data.ids = self.ids;
                        data.objectType = self.objectType;
                    },
                    onCancel: function() {
                        if (self.callback !== undefined) {
                            self.callback();
                        }
                    },
                    onSubmit: function(data) {
                        xhr.del({
                            url: baseDelUrl+data.name,
                            sync: true,
                            putData: JSON.stringify(data),
                            headers: { "Content-Type": "application/json" },
                            load: function() {},
                            error: function(response) {
                                var dndAlert = new Alert({
                                    message: util.escape(response.responseText)
                                });
                            }
                        });
                    }
                });
                
                var tagSelect = new FilterSelect({
                    store: tagStore,
                    searchAttr: "name",
                    noDataMessage: i18n("No tags found."),
                    selectOnClick: true
                });
                
                self.form.addField({
                    name: "name",
                    label: i18n("Name"),
                    required: true,
                    widget: tagSelect
                });
                self.form.placeAt(self.formAttach);
            }
    });
});
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
        "dijit/_Widget",
        "dijit/form/FilteringSelect",
        "dojo/_base/declare",
        "dojox/data/JsonRestStore",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Dialog"
        ],
function(
        _Widget,
        FilteringSelect,
        declare,
        JsonRestStore,
        ColumnForm,
        Dialog
) {
    /**
     * Takes properties:
     *  resourceGroup           The resource group object to build this popup around.
     * ------ or all of ------
     *  submitUrl               The URL to post to on submission.
     *  storeUrl                The URL to obtain the list of resources from.
     *  storeData               Data to add with form submission.
     *  
     *  callback                The function to call on submission/cancellation.
     */
    return declare('deploy.widgets.resource.SingleResourceSelector',  [_Widget], {
        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            if (this.resourceGroup) {
                this.submitUrl = bootstrap.restUrl+"resource/resGroup/static/"+this.resourceGroup.id+"/addResources";
                this.storeUrl = bootstrap.restUrl+"resource/resGroup/static/"+this.resourceGroup.id+"/unusedResources";
            }
            
            // Create the dialog.
            this.dialog = new Dialog({
                title: i18n("Add a Resource"),
                closable: true,
                draggable: true
            });
            
            // Create the select box.
            var selectStore = new JsonRestStore({
                target: this.storeUrl,
                idAttribute: 'id'
            });
            
            this.select = new FilteringSelect({
                store: selectStore,
                autoComplete: false
            });

            // Create the form.
            this.form = new ColumnForm({
                submitUrl: this.submitUrl,
                getData: function() {
                    var resourceArray = [];
                    resourceArray.push(self.select.value);
                    
                    var result = {};
                    if (self.storeData !== undefined) {
                        result = self.storeData;
                    }
                    
                    result.resources = resourceArray;
                    
                    return result;
                },
                postSubmit: function(data) {
                    self.dialog.hide();
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                onCancel: function() {
                    self.dialog.hide();
                }
            });
            
            this.form.addField({
                name: "resource",
                label: i18n("Select a Resource"),
                description: i18n("Start typing to filter results. Use * as a wildcard."),
                required: true,
                widget: this.select
            });

            this.form.placeAt(this.dialog.containerNode);
            this.dialog.show();
        }
    });
});
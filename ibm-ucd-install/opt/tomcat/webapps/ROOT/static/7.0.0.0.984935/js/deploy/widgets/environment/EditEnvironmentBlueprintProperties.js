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
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/DialogMultiSelect",
        "js/webext/widgets/RestSelect",
        "deploy/widgets/resource/ResourceSelector",
        "deploy/widgets/environment/EditCloudResourceParameters",
        "deploy/widgets/resourceTemplate/SmartCloudDeploymentSelector"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        xhr,
        ColumnForm,
        DialogMultiSelect,
        RestSelect,
        ResourceSelector,
        EditCloudResourceParameters,
        SmartCloudDeploymentSelector
) {
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="editEnvironment">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        /**
         * 
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            this.form = new ColumnForm({
                submitUrl: bootstrap.restUrl+"deploy/environment", 
                readOnly: self.readOnly,
                showButtons: false,
                postSubmit: function(data) {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                addData: function(data) {
                    var key;
                    
                    for (key in self.environmentData) {
                        if (self.environmentData.hasOwnProperty(key)) {
                            data[key] = self.environmentData[key];
                        }
                    }
                    if(self.cloudDeploymentSelector.environmentProfile) {
                        data.environment_profile = self.cloudDeploymentSelector.environmentProfile;
                        
                    } else {
                        data.cloud_group = self.cloudDeploymentSelector.cloudGroup;
                    }
                    data.nodeProperties = {};
                    for (key in data) {
                        if (data.hasOwnProperty(key)) {
                            if (key.indexOf("properties_") === 0) {
                                var resourcePath = key.substring("properties_".length);
                                data.nodeProperties[resourcePath] = data[key];
                            }
                        }
                    }
                },
                
                onCancel: function() {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                    if (self.onCancel !== undefined) {
                        self.onCancel();
                    }
                }
            });
            this.form.placeAt(this.formAttach);
            
            this.form.addField({
                name: "name",
                label: i18n("Name"),
                required: true,
                type: "Text",
                readOnly: true,
                value: this.environmentData.name
            });
            
            this.form.addField({
                name: "description",
                label: i18n("Description"),
                type: "Text",
                readOnly: true,
                value: this.environmentData.description
            });
            
            this.cloudDeploymentSelector = new SmartCloudDeploymentSelector({ 
                form: self.form,
                blueprintId: self.blueprintId
            });
            
            this.form.addField({
                name: "propSectionLabel",
                type: "SectionLabel",
                value: i18n("Set property values for nodes to be created for this environment"),
                style: {
                    fontWeight: "bold"
                }
            });
            
            dojo.forEach(this.requiredValues, function(requiredValueSet) {
                var propDefPopupValues = new EditCloudResourceParameters({
                    propDefs: requiredValueSet.propDefs,
                    popupLabel: requiredValueSet.nodePath.escape(),
                    cloudDeploymentSelector: self.cloudDeploymentSelector
                });
                self.form.addField({
                    name: "properties_"+requiredValueSet.nodePath,
                    label: "",
                    widget: propDefPopupValues
                });
            });
        },
        
        setData: function(data){
            this.environmentData = data; 
            this.form.setValue("name", this.environmentData.name) ; 
            this.form.setValue("description", this.environmentData.description) ;
        },
        
        submitForm: function(){
            this.form.submitForm();
        }
    });
});

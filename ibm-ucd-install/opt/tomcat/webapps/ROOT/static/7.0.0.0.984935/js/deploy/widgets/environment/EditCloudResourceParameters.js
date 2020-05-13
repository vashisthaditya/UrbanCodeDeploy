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
        "dojo/_base/declare",
        "dojo/on",
        "deploy/widgets/property/PropDefPopupValues",
        "dijit/form/FilteringSelect",
        "dojox/data/JsonRestStore",
        "deploy/widgets/resourceTemplate/SmartCloudDeploymentSelector"
        ],
function(
        declare,
        on,
        PropDefPopupValues,
        FilteringSelect,
        JsonRestStore,
        SmartCloudDeploymentSelector
) {
    /**
     * A popup form for showing required parameters for a deployment to the cloud.
     * 
     * Takes properties:
     *  propDefs / Array                : An array of PropDefs to use for this
     *  label / String                  : The label to show in the popup link text
     */
    return declare([PropDefPopupValues], {

        _multipleNICCount: 0,

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            self.dialog.connect(self.dialog, "show", function() {
                self.addCloudGroupField();
            });
        },

        displayPropDef: function(propDef) {
            var self = this;

            var prefix = null;
            var attrName = null;
            var attrIndex = propDef.name.lastIndexOf('/');
            if(attrIndex > -1 && attrIndex < propDef.name.length) {
                // composite property name like "scriptPackage/attr"
                prefix = propDef.name.substring(0, attrIndex);
                attrName = propDef.name.substring(attrIndex+1);
            } else {
                prefix = propDef.name;
                attrName = propDef.name;
            }

            // this is the name propDef
            if (propDef.name === "name"){ 
                self.form.addField({
                    name: "name",
                    label: i18n("Name"),
                    readOnly: true,
                    type: "SectionLabel",
                    value: i18n("Image Part")
                });
            }
            else if (attrName === "name"){
                if (self.startsWith(prefix, "default_add_nic")) {
                    // Needs special behavior - set a flag
                    self._multipleNICCount = self._multipleNICCount + 1;
                }
                else {
                    self.form.addField({
                        name: "name",
                        label: i18n("Name"),
                        readOnly: true,
                        type: "SectionLabel",
                        value: prefix
                    });
                }
            }
            else if (attrName === "description") {
                // Ignore the NIC script package - it's a special case
                if (!self.startsWith(prefix, "default_add_nic")) {
                    self.form.addField({
                        name: "description",
                        label: i18n("Description"),
                        type: "Label",
                        value: propDef.value,
                        style: { marginTop: "0px", marginBottom: "5px", 
                            width: "300px" }
                    });
                }
            }
            else if (attrName === "cloud_group") {

                self.form.addField({
                    name: "_cloudGroupInsertionPoint",
                    type: "Invisible"
                });
            }
            else if (attrName === "ip_group") {

                self.form.addField({
                    name: "_ipGroupInsertionPoint",
                    type: "Invisible"
                });
                self.form.addField({
                    name: "_extraNICInsertionPoint",
                    type: "Invisible"
                });
            }
            else if (attrName !== "extra_ip_groups") {
                if (!propDef.label) {
                    propDef.label = attrName;
                }
                self.form.addField(propDef);
                if (propDef.required && !propDef.value) {
                    self.isValid = false;
                }
            }

        },

        addCloudGroupField: function() {
            var self = this;
            if(self.cloudDeploymentSelector.environmentProfile) {
                // be smarter here: don't change the field unless 
                // the last connectionId is different than the current
                self.cloudCloudGroupsStore = new JsonRestStore({
                    target : bootstrap.restUrl
                            + "resource/cloud/connection/"
                            + self.cloudDeploymentSelector.connectionId
                            + "/environmentProfile/"
                            + self.cloudDeploymentSelector.environmentProfile
                            + "/cloudGroup",
                    idAttribute : 'id'
                });

                self.cloudGroupSelector = new FilteringSelect({
                    store : self.cloudCloudGroupsStore,
                    searchAttr : "name",
                    labelAttr : "name",
                    noDataMessage : i18n("No resources found."),
                    autoComplete : false,
                    intermediateChanges : true,
                    onChange: function(val) {
                        self.cloudGroup = val;

                        self.addIPGroupField();
                    }
                });

                if(self.form.hasField("cloud_group")) {
                    self.form.removeField("cloud_group");
                }

                self.form.addField({
                    name : "cloud_group",
                    label : i18n("Cloud Group"),
                    required : false, // don't require unless the user has chosen Environment Profile
                    widget : self.cloudGroupSelector
                }, "_cloudGroupInsertionPoint");
            }
        },

        addIPGroupField: function() {
            var self = this;
            var i = 0;

            if(self.cloudDeploymentSelector.environmentProfile) {
                var mainCloudIPGroupSelector = self._generateIPGroupWidget();
                if(self.form.hasField("ip_group")) {
                    self.form.removeField("ip_group");
                }
                var group0Label = self._multipleNICCount ? i18n("IP Group 0") : i18n("IP Group");
                self.form.addField({
                    name : "ip_group",
                    label : group0Label,
                    required : false, // don't require unless the user has chosen Environment Profile
                    widget : mainCloudIPGroupSelector
                }, "_ipGroupInsertionPoint");

                // Extra NICs
                if (self._multipleNICCount) {
                    for (i = 0; i < self._multipleNICCount; i++) {
                        var fieldName = "extra_ip_groups[" + i + "]";
                        if(self.form.hasField(fieldName)) {
                            self.form.removeField(fieldName);
                        }
                        var cloudIPGroupSelector = self._generateIPGroupWidget();
                        self.form.addField({
                            name : fieldName,
                            label : i18n("IP Group " + (i + 1)),
                            required : false, // don't require unless the user has chosen Environment Profile
                            widget : cloudIPGroupSelector
                        }, "_extraNICInsertionPoint");
                    }
                }
            }
        },

        _generateIPGroupWidget: function() {
            var self = this;

            if (!self.cloudIPGroupsStore) {
                // be smarter here: don't change the field unless 
                // the last connectionId is different than the current
                self.cloudIPGroupsStore = new JsonRestStore({
                    target : bootstrap.restUrl
                    + "resource/cloud/connection/" + 
                    self.cloudDeploymentSelector.connectionId
                    + "/environmentProfile/"
                    + self.cloudDeploymentSelector.environmentProfile
                    + "/cloudGroup/"
                    + self.cloudGroup
                    + "/ipGroup",
                    idAttribute : 'id'
                });
            }

            return new FilteringSelect({
                store : self.cloudIPGroupsStore,
                searchAttr : "name",
                labelAttr : "name",
                noDataMessage : i18n("No resources found."),
                autoComplete : false,
                intermediateChanges : true
            });
        },

        startsWith: function(string, startsWith) {
            return (string.substring(0, startsWith.length) === startsWith);
        }
    });
});

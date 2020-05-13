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
/*global define */
define([
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/aspect",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/store/JsonRest",
        "dijit/form/Button",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/RestSelect",
        "js/webext/widgets/select/WebextSelect",
        "deploy/widgets/resourceTemplate/CloudConnectionSelect"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        lang,
        aspect,
        domConstruct,
        domClass,
        JsonRest,
        Button,
        Dialog,
        ColumnForm,
        RestSelect,
        WebextSelect,
        CloudConnectionSelect
) {

    /**
     * An general form widget which takes an array of fields and creates a form
     * in a single-column table format.
     *
     * Supported properties: form The ColumnForm to be enhanced by this widget.
     */
    return declare(
        [_Widget, _TemplatedMixin],
        {

        templateString:
            '<div class="collectionSelector">' +
            '  <div data-dojo-attach-point="selectorAttach" class="versionSelectorComponent"></div>' +
            '</div>',

            postCreate: function() {
                var self = this;
                this.inherited(arguments);

                self.connectionSelector = new CloudConnectionSelect({
                  store : self.connectionStore,
                  searchAttr : "name",
                  labelAttr : "name",
                  noDataMessage : i18n("No resources found."),
                  autoComplete : false,
                  intermediateChanges : true,
                  blueprintId: self.blueprintId,
                  onChange : function(val) {
                      self.connectionId = val;

                      if (self.form.hasField("cloudQuotaSpace")) {
                          self.form.removeField("cloudQuotaSpace");
                      }

                      self.addCloudQuotaField(val);

                  }
                });


                self.form.addField({
                    name: "connection",
                    label: i18n("Cloud Connection"),
                    required: true,
                    widget: self.connectionSelector
                });


                self.form.addField({
                    name: "_cloudLocationInsertionPoint",
                    type: "Invisible"
                });
            },

            addCloudQuotaField: function(connectionId) {
                var self = this;

                self.cloudQuotaSpaceField = self.form.addField({
                    name : "cloudQuotaSpace",
                    label : i18n("Choose Location"),
                    type : "Select",
                    readOnly : false,
                    intermediateChanges : true,
                    value : "environment_profile",
                    allowedValues : [{
                        label : i18n("Environment Profile"),
                        value : "environment_profile"
                    }, {
                        label : i18n("Cloud Group"),
                        value : "cloud_group"
                    }],
                    onChange : function(val) {
                        if (val === "cloud_group") {
                            self.addCloudGroupField(connectionId);
                        } else if (val === "environment_profile") {
                            self.addCloudEnvironmentProfilesField(connectionId);
                        }
                    }
                }, "_cloudLocationInsertionPoint");

                if (self.form.hasField("cloud_group")) {
                    self.form.removeField("cloud_group");

                    self.addCloudGroupField(connectionId);
                    self.cloudQuotaSpaceField.widget.set('value', "cloud_group");

                } else if (self.form.hasField("environment_profile")) {
                    self.form.removeField("environment_profile");
                    self.cloudQuotaSpaceField.widget.set('value', "environment_profile");

                } else {
                    // default is Environment Profiles; add the initial field
                    self.addCloudEnvironmentProfilesField(connectionId);
                }

            },

            addCloudGroupField: function(connectionId) {

                var self = this;
                self.cloudGroup = undefined;

                if (self.form.hasField("environment_profile")) {
                    self.form.removeField("environment_profile");
                    self.environmentProfile = undefined;
                }

                self.cloudCloudGroupsStore = new JsonRest({
                    target : bootstrap.restUrl
                            + "resource/cloud/connection/" + connectionId
                            + "/cloudGroup",
                    idAttribute : 'id'
                });

                  self.cloudGroupSelector = new WebextSelect({
                      store : self.cloudCloudGroupsStore,
                      searchAttr : "name",
                      labelAttr : "name",
                      noDataMessage : i18n("No resources found."),
                      autoComplete : false,
                      intermediateChanges : true,
                      onChange : function(val) {
                          self.cloudGroup = val;
                      }
                  });

                  self.cloudGroupField = self.form.addField({
                      name : "cloud_group",
                      label : i18n("Cloud Group"),
                      required : true,
                      widget : self.cloudGroupSelector
                  }, "_cloudLocationInsertionPoint");
            },

            addCloudEnvironmentProfilesField: function(connectionId) {

                var self = this;
                self.environmentProfile = undefined;

                if (self.form.hasField("cloud_group")) {
                    self.form.removeField("cloud_group");
                    self.cloudGroup = undefined;
                }

                self.cloudEnvironmentProfilesStore = new JsonRest({
                    target : bootstrap.restUrl
                            + "resource/cloud/connection/" + connectionId
                            + "/environmentProfile",
                    idAttribute : 'id'
                });


                self.cloudEnvironmentProfilesSelector = new WebextSelect({
                    store : self.cloudEnvironmentProfilesStore,
                    searchAttr : "name",
                    labelAttr : "name",
                    noDataMessage : i18n("No resources found."),
                    autoComplete : false,
                    intermediateChanges : true,
                    onChange : function(val) {
                        self.environmentProfile = val;
                    }
                });

                self.form.addField({
                    name : "environment_profile",
                    label : i18n("Environment Profile"),
                    type : "Select",
                    readOnly : false,
                    required : true,
                    widget : self.cloudEnvironmentProfilesSelector

                }, "_cloudLocationInsertionPoint");
            }
    });
});

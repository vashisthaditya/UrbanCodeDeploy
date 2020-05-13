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
        "deploy/widgets/security/_LdapConnectionPropertiesMixin",
        "dojo/_base/array",
        "dojo/_base/declare",
        "js/webext/widgets/ColumnForm"
        ],
function(
        _TemplatedMixin,
        _Widget,
        _LdapConnectionPropertiesMixin,
        array,
        declare,
        ColumnForm
) {
    return declare('deploy.widgets.security.authorization.EditAuthorizationRealm',  [_Widget, _TemplatedMixin, _LdapConnectionPropertiesMixin], {
        templateString:
            '<div class="editAuthorizationRealm">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            this.existingValues = {
                properties: {}
            };
            if (this.authorizationRealm) {
                this.existingValues = this.authorizationRealm;
            }
            this.extraPropertyNames = [];

            this.form = new ColumnForm({
                submitUrl: bootstrap.baseUrl+"security/authorizationRealm"+(this.authorizationRealm ? "/"+this.authorizationRealm.id : ""),
                submitMethod: this.authorizationRealm ? "PUT" : "POST",
                postSubmit: function(data) {
                    if (self.callback !== undefined) {
                        self.callback(true);
                    }
                },
                addData: function(data) {
                    if (self.authorizationRealm) {
                        data.existingId = self.authorizationRealm.id;
                    }

                    data.properties = {};
                    array.forEach(self.extraPropertyNames, function(extraPropertyName) {
                        var propName = "property/"+extraPropertyName;
                        var propValue = data[propName];

                        data.properties[extraPropertyName] = propValue;
                        delete data[propName];
                    });
                    data.properties["group-mapper"] = "00000000000000000000000000000000";
                },
                onCancel: function() {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                }
            });

            this.form.addField({
                name: "name",
                label: i18n("Name"),
                required: true,
                type: "Text",
                value: this.existingValues.name
            });

            this.form.addField({
                name: "description",
                label: i18n("Description"),
                type: "Text",
                value: this.existingValues.description
            });

            this.form.addField({
                name: "authorizationModuleClassName",
                label: i18n("Type"),
                value: this.existingValues.authorizationModuleClassName,
                type: "Select",
                required: true,
                onChange: function(value) {
                    self.typeChanged(value);
                },
                allowedValues: [{
                    label: i18n("LDAP or Active Directory"),
                    value: "com.urbancode.security.authorization.ldap.LdapAuthorizationModule"
                },{
                    label: i18n("Internal Storage"),
                    value: "com.urbancode.security.authorization.internal.InternalAuthorizationModule"
                },{
                    label: i18n("SSO"),
                    value: "com.urbancode.security.authorization.sso.SingleSignOnAuthorizationModule"
                }]
            });
            this.typeChanged(this.existingValues.authorizationModuleClassName || "com.urbancode.security.authorization.ldap.LdapAuthorizationModule");

            this.form.placeAt(this.formAttach);
        },

        typeChanged: function(value) {
            var self = this;

            array.forEach(this.extraPropertyNames, function(extraPropertyName) {
                if (self.form.hasField("property/"+extraPropertyName)) {
                    self.form.removeField("property/"+extraPropertyName);
                }
                if (self.form.hasField(extraPropertyName)) {
                    self.form.removeField(extraPropertyName);
                }
            });
            this.extraPropertyNames = [];

            // change the display of fields
            if ("com.urbancode.security.authorization.ldap.LdapAuthorizationModule" === value) {

                var requiredFields = [];
                this.addLdapConnectionFields(requiredFields);

                //fields for searching for roles
                var groupSearchTypeLabel = self.form.addField({
                    name: "groupSearchTypeLabel",
                    label: "",
                    type: "Label",
                    value: i18n("Specify how to search LDAP for roles. (See documentation for examples.)")
                });
                this.extraPropertyNames.push("groupSearchTypeLabel");

                self.form.addField({
                    name: "_groupSearchInsertPoint",
                    type: "Invisible"
                });
                this.extraPropertyNames.push("_groupSearchInsertPoint");

                var groupSearchTypeChanged = function(value) {
                    if (self.form.hasField("property/group-base")) {
                        self.form.removeField("property/group-base");
                        self.form.removeField("property/group-search");
                        self.form.removeField("property/group-name");
                        self.form.removeField("property/group-search-subtree");
                    }
                    if (self.form.hasField("property/group-attribute")) {
                        self.form.removeField("property/group-attribute");
                    }

                    if (value === "userAttribute") {
                        self.form.addField({
                            type: "Invisible",
                            name: "property/group-base",
                            value: ""
                        });
                        self.form.addField({
                            type: "Invisible",
                            name: "property/group-search",
                            value: ""
                        });
                        self.form.addField({
                            type: "Invisible",
                            name: "property/group-name",
                            value: ""
                        });
                        self.form.addField({
                            type: "Invisible",
                            name: "property/group-search-subtree",
                            value: ""
                        });

                        self.form.addField({
                            name: "property/group-attribute",
                            label: i18n("User Group Attribute"),
                            description: i18n("The name of the attribute that contains group names in the user directory entry."),
                            type: "Text",
                            required: true,
                            textDir: "ltr",
                            placeholder: "cn",
                            value: self.existingValues.properties['group-attribute']
                        }, "_groupSearchInsertPoint");
                    }
                    else if (value === "roleSearch") {
                        self.form.addField({
                            type: "Invisible",
                            name: "property/group-attribute",
                            value: ""
                        });

                        self.form.addField({
                            name: "property/group-base",
                            label: i18n("Group Search Base"),
                            description: i18n("The base directory to execute group searches in."),
                            required: true,
                            type: "Text",
                            textDir: "ltr",
                            placeholder: "ou=groups,dc=mydomain,dc=com",
                            value: self.existingValues.properties['group-base']
                        }, "_groupSearchInsertPoint");
                        self.form.addField({
                            name: "property/group-search",
                            label: i18n("Group Search Filter"),
                            description: i18n("The LDAP filter expression to use when searching for group entries. The username will be put in place of {1} in the search pattern and the full user DN will be put in place of {0}."),
                            required: true,
                            type: "Text",
                            textDir: "ltr",
                            placeholder: "member={0}",
                            value: self.existingValues.properties['group-search']
                        }, "_groupSearchInsertPoint");
                        self.form.addField({
                            name: "property/group-name",
                            label: i18n("Group Name"),
                            description: i18n("The name of the entry that contains the user's group names in the directory entries returned by the group search. If this is not specified, no group search will take place."),
                            required: true,
                            type: "Text",
                            placeholder: "cn",
                            value: self.existingValues.properties['group-name']
                        }, "_groupSearchInsertPoint");
                        self.form.addField({
                            name: "property/group-search-subtree",
                            label: i18n("Search Group Subtree"),
                            description: i18n("Search the full subtree for the groups, as opposed to a single-level search only covering groups directly inside the specified search base."),
                            type: "Checkbox",
                            value: self.existingValues.properties['group-search-subtree'] || true
                        }, "_groupSearchInsertPoint");
                    }
                };

                var groupSearchType;
                if (self.existingValues.properties["group-base"]) {
                    groupSearchType = "roleSearch";
                }
                else if (self.existingValues.properties["group-attribute"]) {
                    groupSearchType = "userAttribute";
                }

                self.form.addField({
                    name: "groupSearchType",
                    type: "Radio",
                    label: "",
                    value: groupSearchType,
                    required: true,
                    allowedValues: [{
                        "label": i18n("Roles in LDAP reference their members; look up group membership by searching for roles."),
                        "value": "roleSearch"
                    },{
                        "label": i18n("User roles are defined as an attribute on that user; look up group membership using this attribute."),
                        "value": "userAttribute"
                    }],
                    onChange: groupSearchTypeChanged
                }, "_groupSearchInsertPoint");
                groupSearchTypeChanged(groupSearchType);
                self.extraPropertyNames.push("groupSearchType");
                self.extraPropertyNames.push("group-attribute");
                self.extraPropertyNames.push("group-base");
                self.extraPropertyNames.push("group-search");
                self.extraPropertyNames.push("group-name");
                self.extraPropertyNames.push("group-search-subtree");
            }
            else if ("com.urbancode.security.authorization.sso.SingleSignOnAuthorizationModule" === value) {
                self.form.addField({
                    name: "property/groups-header",
                    label: i18n("Groups Header"),
                    description: i18n("The header name that denotes the user groups to which user will be added."),
                    type: "Text",
                    placeholder: i18n("Group"),
                    value: self.existingValues.properties['groups-header']
                 });
                this.extraPropertyNames.push("groups-header");

                self.form.addField({
                    name: "property/groups-delim",
                    label: i18n("Groups Delimiter"),
                    description: i18n("A string that acts as the delimiter between groups that are passed in the headers. For example, if the user should be added to groups GROUP1 and GROUP2, and the header value was GROUP=GROUP1;GROUP=GROUP2 the delimiter would be ; Note: special regex characters such as + must be escaped with one backslash &Backslash;"),
                    type: "Text",
                    textDir: "ltr",
                    placeholder: ",",
                    value: self.existingValues.properties['groups-delim']
                 });
                this.extraPropertyNames.push("groups-delim");

                self.form.addField({
                    name: "property/groups-regex",
                    label: i18n("Groups Regex"),
                    description: i18n("The regular expression to find the groups in the header value. If a capturing group is specified, only the first will be caught (per delimited string). If no capturing group is specified with parentheses, then the whole delimited string will be captured."),
                    type: "Text",
                    textDir: "ltr",
                    value: self.existingValues.properties['groups-regex']
                 });
                this.extraPropertyNames.push("groups-regex");
            }
        }
    });
});
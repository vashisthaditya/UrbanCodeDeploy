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
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/RestSelect"
        ],
function(
        _TemplatedMixin,
        _Widget,
        _LdapConnectionPropertiesMixin,
        array,
        declare,
        ColumnForm,
        RestSelect
) {
    return declare('deploy.widgets.security.authentication.EditAuthenticationRealm',  [_Widget, _TemplatedMixin, _LdapConnectionPropertiesMixin], {
        templateString:
            '<div class="editAuthenticationRealm">'+
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
            if (this.authenticationRealm) {
                this.existingValues = this.authenticationRealm;
            }
            this.extraPropertyNames = [];
            
            this.form = new ColumnForm({
                submitUrl: bootstrap.baseUrl+"security/authenticationRealm"+(this.authenticationRealm ? "/"+this.authenticationRealm.id : ""),
                submitMethod: this.authenticationRealm ? "PUT" : "POST",
                addData: function(data) {
                    if (self.authenticationRealm) {
                        data.existingId = self.authenticationRealm.id;
                    }
                    
                    data.properties = {};
                    array.forEach(self.extraPropertyNames, function(extraPropertyName) {
                        var propName = "property/"+extraPropertyName;
                        var propValue = data[propName];
                        
                        data.properties[extraPropertyName] = propValue;
                        delete data[propName];
                    });
                },
                postSubmit: function(data) {
                    if (self.callback !== undefined) {
                        var newId = data ? data.id : null;
                        self.callback(true, newId);
                    }
                },
                cancelLabel:null
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
                name: "allowedAttempts",
                label: i18n("Allowed Login Attempts"),
                description: i18n("The number of invalid login attempts before a user account is locked.  Leave blank or enter 0 to allow an unlimited number of attempts."),
                type: "Number",
                textDir: "ltr",
                value: this.existingValues.allowedAttempts
            });
            
            if (this.existingValues.id === "20000000000000000000000000000001") {
                this.form.addField({
                    name: "loginClassName",
                    type: "Invisible",
                    value: this.existingValues.loginModuleClassName
                });
                this.form.addField({
                    name: "authorizationRealm",
                    type: "Invisible",
                    value: this.existingValues.authorizationRealmId
                });
            }
            else {
                this.form.addField({
                    name: "loginClassName",
                    label: i18n("Type"),
                    value: this.existingValues.loginModuleClassName,
                    type: "Select",
                    required: true,
                    onChange: function(value) {
                        self.typeChanged(value);
                    },
                    allowedValues: [{
                        label: i18n("LDAP or Active Directory"),
                        value: "com.urbancode.security.authentication.ldap.LdapLoginModule"
                    },{
                        label: i18n("Single Sign-On"),
                        value: "com.urbancode.security.authentication.sso.SingleSignOnLoginModule"
                    },{
                        label: i18n("Internal Storage"),
                        value: "com.urbancode.security.authentication.internal.InternalLoginModule"
                    }]
                });
                this.typeChanged(this.existingValues.loginModuleClassName || "com.urbancode.security.authentication.ldap.LdapLoginModule"); //THIS IS THE PROBLEM!!!
            }
            
            this.form.placeAt(this.formAttach);
        },
        
        typeChanged: function(value) {
            var self = this;

            if (this.form.hasField("authorizationRealms")) {
                this.form.removeField("authorizationRealms");
            }
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
            if ("com.urbancode.security.authentication.ldap.LdapLoginModule" === value) {
                self.showLDAPFields();
            }
            else if ("com.urbancode.security.authentication.internal.InternalLoginModule" === value) {
                self.showInternalFields();
            }
            else if ("com.urbancode.security.authentication.sso.SingleSignOnLoginModule" === value) {
                self.showSSOFields();
            }
        },
        
        /**
         * Show fields specific to LDAP realms
         */
        showLDAPFields: function() {
            var self = this;

            this.form.addField({
                name: "authorizationRealms",
                label: i18n("Authorization Realm"),
                required: true,
                type: "TableFilterMultiSelect",
                url: bootstrap.baseUrl + "security/authorizationRealm",
                value: self.existingValues.authorizationRealms,
                defaultQuery: {
                    filterFields: "authorizationModuleClassName",
                    filterType_authorizationModuleClassName: "ne",
                    filterValue_authorizationModuleClassName: "com.urbancode.security.authorization.sso.SingleSignOnAuthorizationModule"
                },
                allowNone: false
            });

            var requiredFields = ["property/context-factory", 
                "property/url", 
                "property/connection-name",
                "property/user-pattern",
                "property/user-base",
                "property/user-search",
                "userSearchType"];
            this.addLdapConnectionFields(requiredFields);

            self.form.addField({
                name: "attributesLabel",
                type: "Label",
                label: "",
                value: i18n("Enter the names of attributes in LDAP which contain the following information (optional)")
            });
            this.extraPropertyNames.push("attributesLabel");
            
            self.form.addField({
                name: "property/name-attribute",
                label: i18n("Name Attribute"),
                description: i18n("The attribute name containing user names."),
                required: false,
                type: "Text",
                textDir: "ltr",
                placeholder: "cn",
                value: self.existingValues.properties['name-attribute']
            });
            this.extraPropertyNames.push("name-attribute");

            self.form.addField({
                name: "property/email-attribute",
                label: i18n("Email Attribute"),
                description: i18n("The attribute name containing the users' email."),
                required: false,
                type: "Text",
                textDir: "ltr",
                placeholder: i18n("email"),
                value: self.existingValues.properties['email-attribute']
            });
            this.extraPropertyNames.push("email-attribute");
        },
        
        /**
         * Show fields specific to internal realms
         */
        showInternalFields: function() {
            this.form.addField({
                name: "authorizationRealms",
                label: i18n("Authorization Realm"),
                required: true,
                type: "TableFilterMultiSelect",
                url: bootstrap.baseUrl + "security/authorizationRealm",
                value: this.existingValues.authorizationRealms,
                allowNone: false,
                defaultQuery: {
                    filterFields: "authorizationModuleClassName",
                    filterType_authorizationModuleClassName: "eq",
                    filterValue_authorizationModuleClassName: "com.urbancode.security.authorization.internal.InternalAuthorizationModule"
                }
            });
        },
        
        /**
         * Show fields specific to SSO realms
         */
        showSSOFields: function() {
            var self = this;

            this.form.addField({
                name: "authorizationRealms",
                label: i18n("Authorization Realm"),
                required: true,
                type: "TableFilterMultiSelect",
                url: bootstrap.baseUrl + "security/authorizationRealm",
                value: self.existingValues.authorizationRealms,
                allowNone: false
            });

            self.form.addField({
                type: "Label",
                label: "",
                name: "headersLabel",
                value: i18n("The SSO authentication integration works by looking for request headers to be set by the SSO mechanism. Please provide the names of headers which contain the necessary information.")
            });
            this.extraPropertyNames.push("headersLabel");
            
            self.form.addField({
               name: "property/user-header",
               label: i18n("User Header Name"),
               description: i18n("The name of the header that contains the list of users."),
               required: true,
               type: "Text",
               textDir: "ltr",
               placeholder: "HTTP_USERNAME",
               value: self.existingValues.properties['user-header']
            });
            this.extraPropertyNames.push("user-header");
            
            self.form.addField({
                name: "property/email-header",
                label: i18n("Email Header Name"),
                description: i18n("The name of the header that contains the list of user email addresses."),
                required: false,
                type: "Text",
                placeholder: "HTTP_EMAIL",
                value: self.existingValues.properties['email-header']
            });
            this.extraPropertyNames.push("email-header");

            self.form.addField({
                name: "property/fullname-header",
                label: i18n("Full Name Header Name"),
                description: i18n("The name of the header that contains the user's full name."),
                required: false,
                type: "Text",
                placeholder: "HTTP_FULLNAME",
                value: self.existingValues.properties['fullname-header']
            });
            this.extraPropertyNames.push("fullname-header");
            
            self.form.addField({
                name: "property/logout-url",
                label: i18n("Logout URL"),
                description: i18n("The URL where users are redirected after they log out of UrbanCode Deploy."),
                required: true,
                type: "Text",
                textDir: "ltr",
                placeholder: "https://www.example.com",
                value: self.existingValues.properties['logout-url']
             });
            this.extraPropertyNames.push("logout-url");
        }
    });
});
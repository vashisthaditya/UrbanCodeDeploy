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
 /*global define, _, require */
define(["dojo/_base/declare"],

function (declare) {

    /**
     * A mixin for collecting LDAP connection properties. This intended to tie into 2 classes: 
     *  EditAuthenticationRealm.js and EditAuthorizationRealm.js
     *
     * The following attributes may be supplied:
     *  requiredFields / List Object      List of required field names.
     *
     * The following attributes are required:
     *  form / Form Object                      Object representing the form
     *  existingValues / Properties Object      Object containing the properties dictionary
     *  
     * We define the following methods for inheriting widgets:
     *  addLdapConnectionFields()   Adds the fields required for LDAP connection properties to the form
     *       / requiredFields        List of required field names
     */
    return declare([], {
        addLdapConnectionFields: function(requiredFields) {
            var self = this;
            //
            // LDAP search type - search or user attribute
            //
            self.form.addField({
                name: "property/url",
                label: i18n("LDAP URL"),
                description: i18n("The URL of the LDAP server. It should begin with 'ldap://' or 'ldaps://'. Failover servers can be added by separating the URLs with a space. Example: ldap://ldap.mydomain.com:389 ldap://ldap.mydomain2.com"),
                required: _.contains(requiredFields, "property/url"),
                type: "Text",
                textDir: "ltr",
                placeholder: "ldap(s)://example.com",
                value: self.existingValues.properties.url
            });
            this.extraPropertyNames.push("url");

            // add ldap fields
            self.form.addField({
                name: "property/context-factory",
                label: i18n("Context Factory"),
                description: i18n("The context factory class to use to connect. This may vary depending upon your specific Java implementation. The default for Sun Java implementations: com.sun.jndi.ldap.LdapCtxFactory"),
                required: _.contains(requiredFields, "property/context-factory"),
                type: "Invisible", // No reason the user should have to worry about this
                value: self.existingValues.properties['context-factory'] || 'com.sun.jndi.ldap.LdapCtxFactory'
            });
            this.extraPropertyNames.push("context-factory");

            //
            // LDAP search connection type - anonymous or user/password
            //
            self.form.addField({
                name: "_connectionInsertPoint",
                type: "Invisible"
            });
            this.extraPropertyNames.push("_connectionInsertPoint");

            var connectionTypeChanged = function(value) {
                if (self.form.hasField("property/connection-name")) {
                    self.form.removeField("property/connection-name");
                    self.form.removeField("property/connection-password");
                }
                if (value) {
                    self.form.addField({
                        type: "Invisible",
                        name: "property/connection-name",
                        value: ""
                    });
                    self.form.addField({
                        type: "Invisible",
                        name: "property/connection-password",
                        value: ""
                    });
                }
                else {
                    self.form.addField({
                        name: "property/connection-name",
                        label: i18n("Search Connection DN"),
                        description: i18n("The complete directory name to use when binding to LDAP for searches. If not specified, an anonymous connection is made."),
                        required: _.contains(requiredFields, "property/connection-name"),
                        type: "Text",
                        textDir: "ltr",
                        placeholder:  "cn=admin,dc=mydomain,dc=com",
                        value: self.existingValues.properties['connection-name']
                    }, "_connectionInsertPoint");

                    self.form.addField({
                        name: "property/connection-password",
                        label: i18n("Search Connection Password"),
                        description: i18n("The password to use when binding to LDAP for searches.  Used with the Search Connection DN field."),
                        type: "Secure",
                        value: self.existingValues.properties['connection-password']
                    }, "_connectionInsertPoint");
                }
            };

            var anonymousConnection = !self.existingValues.properties['connection-name'];
            self.form.addField({
                name: "anonymousConnection",
                type: "Checkbox",
                value: anonymousConnection,
                onChange: connectionTypeChanged,
                label: i18n("Search Anonymously"),
                description: i18n("Select if LDAP accepts anonymous queries. If cleared, specify the LDAP directory with the Search Connection DN field, and associated password. Checked by default.")
            }, "_connectionInsertPoint");
            connectionTypeChanged(anonymousConnection);

            this.extraPropertyNames.push("anonymousConnection");
            this.extraPropertyNames.push("connection-password");
            this.extraPropertyNames.push("connection-name");

            //fields for searching for users
            self.form.addField({
                name: "userSearchTypeLabel",
                type: "Label",
                label: "",
                value: i18n("Specify how to search LDAP for users. (See documentation for examples.)")
            });
            this.extraPropertyNames.push("userSearchTypeLabel");

            self.form.addField({
                name: "_userSearchInsertPoint",
                type: "Invisible"
            });
            this.extraPropertyNames.push("_userSearchInsertPoint");

            var userSearchTypeChanged = function(value) {
                if (self.form.hasField("property/user-base")) {
                    self.form.removeField("property/user-base");
                    self.form.removeField("property/user-search");
                    self.form.removeField("property/user-search-subtree");
                }
                if (self.form.hasField("property/user-pattern")) {
                    self.form.removeField("property/user-pattern");
                }
                
                if (value === "searchPattern") {
                    self.form.addField({
                        type: "Invisible",
                        name: "property/user-base",
                        value: ""
                    });
                    self.form.addField({
                        type: "Invisible",
                        name: "property/user-search",
                        value: ""
                    });
                    self.form.addField({
                        type: "Invisible",
                        name: "property/user-search-subtree",
                        value: ""
                    });

                    self.form.addField({
                        name: "property/user-pattern",
                        label: i18n("User DN Pattern"),
                        description: i18n("When you search a single directory, the name is substituted in place of {0} in the pattern, for example, cn={0},ou=employees,dc=yourcompany,dc=com."),
                        required: _.contains(requiredFields, "property/user-pattern"),
                        type: "Text",
                        textDir: "ltr",
                        placeholder:  "cn={0},ou=employees,dc=mydomain,dc=com",
                        value: self.existingValues.properties['user-pattern']
                    }, "_userSearchInsertPoint");
                }
                else if (value === "searchBase") {
                    self.form.addField({
                        type: "Invisible",
                        name: "property/user-pattern",
                        value: ""
                    });

                    self.form.addField({
                        name: "property/user-base",
                        label: i18n("User Search Base"),
                        description: i18n("When you search multiple directories, specify the starting directory that is used for searches, such as ou=employees,dc=mydomain,dc=com."),
                        required: _.contains(requiredFields, "property/user-base"),
                        type: "Text",
                        textDir: "ltr",
                        placeholder: "ou=employees,dc=mydomain,dc=com",
                        value: self.existingValues.properties['user-base']
                    }, "_userSearchInsertPoint");
    
                    self.form.addField({
                        name: "property/user-search",
                        label: i18n("User Search Filter"),
                        description: i18n("The LDAP filter expression to use when searching for user directory entries. The username is put in place of {0} in the search pattern. If this is an attribute and not part of the user DN, wrap in parentheses. E.g. uid={0} or (sAMAccountName={0})"),
                        type: "Text",
                        textDir: "ltr",
                        placeholder: "uid={0}",
                        required: _.contains(requiredFields, "property/user-search"),
                        value: self.existingValues.properties['user-search']
                    }, "_userSearchInsertPoint");
    
                    self.form.addField({
                        name: "property/user-search-subtree",
                        label: i18n("Search User Subtree"),
                        description: i18n("Search the full subtree for the user, as opposed to a single-level search only covering users directly inside the specified search base."),
                        type: "Checkbox",
                        value: self.existingValues.properties['user-search-subtree'] || true
                    }, "_userSearchInsertPoint");
                }
            };

            var userSearchType;
            if (self.existingValues.properties["user-base"]) {
                userSearchType = "searchBase";
            }
            else if (self.existingValues.properties["user-pattern"]) {
                userSearchType = "searchPattern";
            }
            
            self.form.addField({
                name: "userSearchType",
                type: "Radio",
                label: "",
                value: userSearchType,
                required: _.contains(requiredFields, "userSearchType"),
                allowedValues: [{
                    "label": i18n("LDAP users may exist in many directories; search across LDAP using a criteria."),
                    "value": "searchBase"
                },{
                    "label": i18n("LDAP users exist in a single directory; use a pattern to create the DN for users."),
                    "value": "searchPattern"
                }],
                onChange: userSearchTypeChanged
            }, "_userSearchInsertPoint");
            userSearchTypeChanged(userSearchType);
            this.extraPropertyNames.push("user-pattern");
            this.extraPropertyNames.push("user-base");
            this.extraPropertyNames.push("user-search");
            this.extraPropertyNames.push("user-search-subtree");
            this.extraPropertyNames.push("userSearchType");
        }
    });
});

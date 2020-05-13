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
        "dijit/form/Button",
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        'dojo/dom-class',
        "dojo/dom-construct",
        "dojo/on",
        "deploy/widgets/security/token/AuthTokenRestriction",
        "js/webext/widgets/Alert",
        "js/webext/widgets/ColumnForm",
        'js/webext/widgets/DomNode',
        "js/webext/widgets/RestSelect"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        Array,
        declare,
        xhr,
        domClass,
        domConstruct,
        on,
        AuthTokenRestriction,
        Alert,
        ColumnForm,
        DomNode,
        RestSelect
) {
    return declare('deploy.widgets.security.token.EditAuthTokenRestriction',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="editUser">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            var form = new ColumnForm({
                submitUrl: bootstrap.baseUrl+"security/authTokenRestriction",
                readOnly: !!self.readOnly,
                submitMethod: "PUT",
                cancelLabel: i18n("Cancel"),
                postSubmit: function(data) {
                    if (self.callback !== undefined) {
                        self.callback(data);
                    }
                },
                onCancel: function() {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                addData: function(data) {
                    data.restrictions = [];
                    data.existingId = self.authTokenRestriction ? self.authTokenRestriction.id : null;
                    Array.forEach(self.restrictions, function(item) {
                        data.restrictions.push(item.getValue());
                    });
                },
                validateFields: function(data) {
                    var result = [];
                    Array.forEach(self.restrictions, function(item) {
                        var error = item.validateURI();
                        if (error !== null) {
                            if (result.length === 0) {
                                result.push(error);
                            }
                        }
                    });
                    return result;
                }
            });

            form.addField({
                name: "name",
                label: i18n("Name"),
                required: true,
                type: "Text",
                value: this.authTokenRestriction ? i18n(this.authTokenRestriction.name) : null
            });

            form.addField({
                name: "description",
                label: i18n("Description"),
                type: "Text",
                value: this.authTokenRestriction ? i18n(this.authTokenRestriction.description) : null
            });

            this.addLabelWidgetToForm(form);

            form.addField({
                name: "_restrictionInsert",
                type: "Invisible"
            });

            form.addField({
                name: "_buttonInsert",
                type: "Invisible"
            });

            this.addNewRestrictionButtonToForm(form);

            this.restrictions = [];
            if (!this.authTokenRestriction) {
                this.addNewRestriction(form, true);
            }
            else {
                this.populateRestrictions();
                var hideRemoveButton = true;
                Array.forEach(this.authTokenRestriction.restrictions, function(item) {
                    self.addNewRestriction(form, hideRemoveButton, item);
                    // Hide button if is first in list or in read only mode
                    hideRemoveButton = self.readOnly || false;
                });
            }

            form.placeAt(self.formAttach);
        },

        addLabelWidgetToForm: function(form) {
            var labelDom = new DomNode({
                name: "",
                label: ""
            });

            var methodLabel = domConstruct.create("div");
            methodLabel.innerHTML = i18n("Method");
            domClass.add(methodLabel, "sectionLabel authTokenRestriction-mode");
            labelDom.domAttach.appendChild(methodLabel);

            var urlLabel = domConstruct.create("div");
            urlLabel.innerHTML = i18n("URI");
            domClass.add(urlLabel, "sectionLabel authTokenRestriction-url");
            labelDom.domAttach.appendChild(urlLabel);

            form.addField({
                name: "", // Hides the label in the form
                widget: labelDom,
                description: i18n("Define a list of valid requests. Each request combines a method with a URI. A URI starts with '/' and can contain the wildcard character '*' as the last character. For example, /rest/deploy/component/my*."),
                tooltipIcon: "true"
            });
        },

        addNewRestrictionButtonToForm: function(form) {
            var self = this;

            var labelDom = new DomNode({
                name: "",
                label: ""
            });

            if (!this.readOnly) {
                var addDiv = domConstruct.create("div");
                domClass.add(addDiv, "authTokenRestriction-plusIcon");
                labelDom.domAttach.appendChild(addDiv);
                
                form.addField({
                    name: "", // Hides the label in the form
                    widget: labelDom
                }, "buttonInsert");
                
                on(addDiv, 'click', function() {
                    self.addNewRestriction(form, false);
                });
            }

            return labelDom;
        },

        addNewRestriction: function(form, hideRemoveButton, item) {
            var self = this;
            var restriction = new AuthTokenRestriction({
                restriction: item,
                readOnly: self.readOnly,
                firstInList: hideRemoveButton,
                onDestroy: function() {
                    form.removeField(this);
                    var ind = self.restrictions.indexOf(restriction);
                    self.restrictions.splice(ind, 1);
                }
            });

            this.restrictions.push(restriction);

            form.addField({
                widget: restriction
            }, "_restrictionInsert");
        },

        populateRestrictions: function() {
            var self = this;
            var id = this.authTokenRestriction.id;
            xhr.get({
                url: bootstrap.baseUrl+"security/authTokenRestriction/"+id,
                handleAs: "json",
                load: function(data) {
                    // get the linked json
                    self.authTokenRestriction = data;
                    if (self.isCopy) {
                        // Remove the id so we can create a new record.
                        self.authTokenRestriction.id = undefined;
                    }
                },
                sync: true
            });
        }
    });
});

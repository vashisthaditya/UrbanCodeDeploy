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
define([
        "dojo/_base/declare",
        "dojo/_base/array",
        "dijit/_Widget",
        "dijit/_TemplatedMixin",
        "dojo/dom-construct",
        "js/webext/widgets/FormDelegates"
        ],
function(
        declare,
        array,
        _Widget,
        _TemplatedMixin,
        domConstruct,
        FormDelegates
) {

    return declare(
        [_Widget, _TemplatedMixin],
        {
            templateString: '<div></div>',
            authRealmAttach: null,
            authRealmSelect: null,
            groupSelect: null,
            groupAttach: null,

            constructor: function() {
                var t = this;
                t.authRealmRestUrl = bootstrap.baseUrl+"security/authenticationRealm";
                t.groupRestUrl = bootstrap.baseUrl+"security/group";
            },

            buildRendering: function() {
                this.inherited(arguments);
                var t = this;
                var authDiv = domConstruct.create("div", {'class':'inlineBlock', style: "margin-right: 5px;"}, t.domNode);
                domConstruct.create("div", {"innerHTML":i18n("Authentication Realm")}, authDiv);
                t.authRealmSelect = FormDelegates.retrieveDelegate("TableFilterMultiSelect")({
                    "url": t.authRealmRestUrl,
                    "idAttribute": "id",
                    "name": "authRealm",
                    "placeHolder": i18n("Any"),
                    "formatDropDownLabel": function(labelDomNode, item) { labelDomNode.innerHTML = item.name.escape(); }
                });
                t.authRealmSelect.placeAt(authDiv);

                var groupDiv = domConstruct.create("div", {'class':'inlineBlock'}, t.domNode);
                domConstruct.create("div", {"innerHTML":i18n("Group")}, groupDiv);
                t.groupSelect = FormDelegates.retrieveDelegate("TableFilterMultiSelect")({
                    "url": t.groupRestUrl,
                    "idAttribute": "id",
                    "name": "groups",
                    "placeHolder": i18n("Any"),
                    "formatDropDownLabel": function(labelDomNode, item) { labelDomNode.innerHTML = item.name.escape(); }
                });
                t.groupSelect.placeAt(groupDiv);

                t.setProperties(t.report.properties);
            },

            destroy: function() {
                var t = this;
                this.inherited(arguments);
                t.authRealmSelect.destroy();
                t.groupSelect.destroy();
            },

            setProperties: function(/*Array*/ properties) {
                var t = this;

                var setFormWidgetProp = function(formWidget, name, value) {
                    if (formWidget.get("name") === name) {
                        formWidget.set("value", value);
                    }
                };

                array.forEach(properties, function(prop){
                    var propName = prop.name;
                    var propValue = prop.value;

                    setFormWidgetProp(t.authRealmSelect, propName, propValue);
                    setFormWidgetProp(t.groupSelect, propName, propValue);
                });
            },

            getProperties: function() {
                var t = this;

                var properties = [];
                var addFormWidgetProp = function(formWidget) {
                    var name = formWidget.get('name');
                    var value = formWidget.get('value');
                    if (name && value) {
                        properties.push({"name": name, "value": value });
                    }
                };

                addFormWidgetProp(t.authRealmSelect);
                addFormWidgetProp(t.groupSelect);

                return properties;
            }
        });
});
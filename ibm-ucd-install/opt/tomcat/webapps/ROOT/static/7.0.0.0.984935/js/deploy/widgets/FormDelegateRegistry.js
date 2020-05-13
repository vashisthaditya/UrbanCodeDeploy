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
/*global i18n, define */

define([
        "dojo/dom-style",
        "dojo/store/JsonRest",
        "deploy/widgets/scripts/Editor",
        "deploy/widgets/version/VersionSelector",
        "js/webext/widgets/FormDelegates",
        "js/webext/widgets/select/WebextSelect",
        "js/webext/widgets/select/WebextMultiSelect",
        "js/webext/widgets/color/Color"
        ],
function(domStyle,
        JsonRest,
        Editor,
        VersionSelector,
        FormDelegates,
        WebextSelect,
        WebextMultiSelect,
        WebextColor) {

        FormDelegates.registerDelegate('CodeEditor', function(entry) {
            var editor = new Editor({
                name: entry.name,
                label: entry.label,
                language: entry.language,
                fontSize: entry.fontSize,
                syntaxCheck: entry.syntaxCheck,
                existingValue: entry.value,
                colorTheme: entry.colorTheme,
                hasToolbar: entry.hasToolbar
            });
            if (entry.onChange !== undefined) {
                editor.onChange = entry.onChange;
            }
            return editor;
        });

        /*
         * Create a Tag Dropdown widget containing all tags for a specific type of object.
         */
        FormDelegates.registerDelegate('TagDropDown', function(entry) {
            entry.disabled = !!entry.readOnly;
            entry.allowNone = true;
            entry.defaultQuery = {
                filterFields: ["objectType"],
                "filterType_objectType": "eq",
                "filterValue_objectType": entry.objectType
            };
            entry.formatDropDownLabel = function(labelDomNode, item) {
                domStyle.set(labelDomNode, "borderLeft", "thick solid " + item.color);
            };
            entry.store = new JsonRest({
                target: bootstrap.restUrl + "tag/",
                idProperty: entry.idProperty || "id"
            });

            return new WebextSelect(entry);
        });

        /*
         * Create a Tag Multi Dropdown widget containing all tags for a specific type of object.
         */
        FormDelegates.registerDelegate('TagMultiDropDown', function(entry) {
            entry.disabled = !!entry.readOnly;
            entry.allowNone = true;
            entry.defaultQuery = {
                filterFields: ["objectType"],
                "filterType_objectType": "eq",
                "filterValue_objectType": entry.objectType
            };
            entry.formatDropDownLabel = function(labelDomNode, item) {
                domStyle.set(labelDomNode, "borderLeft", "thick solid " + item.color);
            };
            entry.formatSelectedItem = function(selectedItem, item, label, removeItem) {
                if (item.color) {
                    if (!WebextColor.isDark(item.color)) {
                        domStyle.set(selectedItem, "color", "black");
                    }
                    domStyle.set(selectedItem, "background-color", item.color);
                }
            };
            entry.store = new JsonRest({
                target: bootstrap.restUrl + "tag/",
                idProperty: entry.idProperty || "id"
            });

            return new WebextMultiSelect(entry);
        });

        /*
         * Create a widget for fetching an application's components. Extends TableFilterSelect.
         * Params:
         *   applicationId (String): Id of the application. Required.
         *   multi (Boolean): If true, uses TableFilterMultiSelect instead of TableFilterSelect.
         *   idAttribute (String): Same as TableFilterSelect's, but defaults to "name".
         */
        FormDelegates.registerDelegate('ApplicationComponentSelect', function(entry) {
            if (!entry.applicationId) {
                console.error("Param 'applicationId' not set on ApplicationComponentSelect.");
            }
            var type = entry.multi ? 'TableFilterMultiSelect' : 'TableFilterSelect';

            // Set default URL to standard component url.
            if (!entry.url) {
                entry.url = bootstrap.restUrl+"deploy/component";
            }

            // Override default value. "name" is more common for uses of this widget.
            if (!entry.idAttribute) {
                entry.idAttribute = "id";
            }
            entry.searchAttr = "name";

            // Set up filtering on application ID
            if (!entry.defaultQuery) {
                entry.defaultQuery = {};
            }
            if (!entry.defaultQuery.filterFields) {
                entry.defaultQuery.filterFields = [];
            }
            entry.defaultQuery.filterFields.push("applications.id");
            entry.defaultQuery["filterValue_applications.id"] = entry.applicationId;
            entry.defaultQuery["filterType_applications.id"] = "eq";
            entry.defaultQuery["filterClass_applications.id"] = "UUID";

            return FormDelegates.retrieveDelegate(type)(entry);
        });

        FormDelegates.registerDelegate('VersionPropDef', function(entry) {
            if (!entry.context || !entry.context.component) {
                console.error("No component in the given to the form delegate for VersionPropDef \""+entry.name+"\".");
                return null;
            }

            if (entry.allowNone !== false) {
                entry.allowNone = true;
            }

            var versionSelect = FormDelegates.retrieveDelegate("TableFilterSelect")({
                url: bootstrap.restUrl + "deploy/version",
                label: entry.label,
                noneLabel: entry.noneLabel,
                allowNone: entry.allowNone,
                name: entry.name,
                value: entry.value,
                defaultQuery: {
                    filterFields: [ "component.id" ],
                    "filterType_component.id": "eq",
                    "filterValue_component.id": entry.context.component.id,
                    "filterClass_component.id": "UUID"
                }
            });

            if (entry.onChange !== undefined) {
                versionSelect.onChange = entry.onChange;
            }

            return versionSelect;
        });

        FormDelegates.registerDelegate('VersionSelector', function(entry) {
            if (!entry.context || !entry.context.component) {
                console.error("No component in the given to the form delegate for VersionSelector \""+entry.name+"\".");
                return null;
            }

            var versionSelect = new VersionSelector({
                component: entry.context.component,
                environment: entry.context.environment,
                label: entry.label,
                noneLabel: entry.noneLabel,
                name: entry.name,
                value: entry.value
            });
            if (entry.onChange !== undefined) {
                versionSelect.onChange = entry.onChange;
            }

            return versionSelect;
        });
});
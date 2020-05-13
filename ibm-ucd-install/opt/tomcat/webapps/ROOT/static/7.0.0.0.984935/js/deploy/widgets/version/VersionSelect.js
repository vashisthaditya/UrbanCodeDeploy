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
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/on",
        "dojo/_base/array",
        "js/webext/widgets/select/WebextSelect",
        "dojo/store/Memory",
        "js/webext/widgets/FormDelegates"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        xhr,
        domConstruct,
        domClass,
        on,
        array,
        WebextSelect,
        Memory,
        FormDelegates
) {
    /**
      * A widget to select component versions.
      *
      * Supported properties:
      *  component / Object                  (Required) The component to select from
      *  environment / Object                A predefined environment to limit selections
      *  this.allowInvalidVersions / Bool    [used by versionselection] When false, limits
      *                                      selections based on things like environment gates.
      *  this.allowInactiveVersions / Bool   Allows selection of inactive versions.
      */
    return declare('deploy.widgets.version.VersionSelect',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="versionSelect" data-dojo-attach-point="versionAttach">' +
                '<div data-dojo-attach-point="versionSelectAttach" class="inline-block version-select-drop-down"></div>' +
                '<div data-dojo-attach-point="latestAttach" class="inline-block latest-version-link"></div>' +
            '</div>',

        extraSimpleLinkToHandlers: [],
        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            var component = this.component;
            var restUrl;
            var defaultQuery;

            if (this.environment && !this.allowInvalidVersions) {
                restUrl = bootstrap.restUrl+"deploy/component/"+component.id+"/versionsByEnvironment/"+this.environment.id;
            }
            else {
                restUrl = bootstrap.restUrl+"deploy/version";
                defaultQuery = {
                    filterFields: [ "component.id" ],
                    "filterType_component.id": "eq",
                    "filterValue_component.id": component.id,
                    "filterClass_component.id": "UUID"
                };

                if ( !this.allowInactiveVersions ) {
                    defaultQuery.filterFields.push( "active" );
                    defaultQuery.filterType_active = "eq";
                    defaultQuery.filterValue_active = true;
                    defaultQuery.filterClass_active = "Boolean";
                }
            }

            this.versionSelect = FormDelegates.retrieveDelegate("TableFilterMultiSelect")({
                url: restUrl,
                value: self.value,
                defaultQuery: defaultQuery
            });

            this.versionSelect.placeAt(this.versionSelectAttach);

            if (this.versionSelect.dropDown){
                var dropDown = this.versionSelect.dropDown;
                domClass.add(dropDown.textbox, "versionSelectTextBox");
            }


            if (this.extraSimpleLinkToHandlers && this.extraSimpleLinkToHandlers.length !== 0) {
                var options = [];
                var handlers = {};

                options.push({
                   label:i18n("Version Lookups"),
                   value:i18n("Version Lookups")
                });

                array.forEach(self.extraSimpleLinkToHandlers, function(item) {
                    handlers[item.name] = item.handler;
                    options.push({
                        label: item.name,
                        value: item.name
                    });
                });

                var memStore = new Memory({
                    data: options,
                    idProperty:"value"
                });

                this.extraSelect = new WebextSelect({
                    autoSelectFirst: true,
                    name: "SelectorSelector",
                    store: memStore,
                    searchAttr: "value",
                    onChange: function(item) {
                        if (handlers.hasOwnProperty(item)) {
                            handlers[item]();
                        }
                    }
                });

                this.extraSelect.placeAt(this.latestAttach);
            }
            else {
                this.latest = domConstruct.create("a", {
                    innerHTML: i18n("Latest Available"),
                    "class": "inline-block linkPointer"
                }, this.latestAttach);
            }
        }
    });
});

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
        "dijit/form/Select",
        "dijit/form/Button",
        "dojo/_base/declare",
        "dojo/_base/array",
        "dojo/_base/xhr",
        "dojo/dom-construct",
        "dojo/on",
        "js/webext/widgets/Dialog",
        "deploy/widgets/resource/ResourceSelectList"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Select,
        Button,
        declare,
        array,
        xhr,
        domConstruct,
        on,
        Dialog,
        ResourceSelectList
) {
    /**
     * Wraps the ResourceSelectList widget in a pop-up which is activated on clicking a button. This
     * can be added to normal forms to provide a compact mechanism for letting users select a
     * resource.
     *
     * Supported properties:
     *  url                         : URL to load resource tree from
     *  radioSelect                 : Whether to allow only single selection or multiple (Default: true)
     *  isSelectable                : Function which takes a resource object as an argument and
     *                                determines whether the resource should be selectable
     */
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="resourceSelector">' +
            '  <div class="inlineBlock resourceSelectorValue" data-dojo-attach-point="resourcePathAttach"></div>' +
            '  <div class="inlineBlock" data-dojo-attach-point="buttonAttach"></div>' +
            '</div>',

        returnEntireObject: false,
        resourceSelectTitle: i18n("Select Resource"),
        radioSelect: true,

        /**
         *
         */
        postCreate: function() {
            var self = this;

            var selectButton = new Button({
                label: i18n("Set"),
                onClick: function(){
                    self.showResourceSelectorDialog();
                }
            });
            selectButton.placeAt(self.buttonAttach);

            this.selectResource(this.selectedResource);
        },

        /**
         *
         */
        showResourceSelectorDialog: function() {
            var self = this;

            var newResourceDialog = new Dialog({
                title: util.escape(self.resourceSelectTitle),
                closable: true,
                draggable:true,
                width: -100
            });

            var resourceSelectTree = new ResourceSelectList({
                gridRestUrl: this.url,
                childUrlBase: this.childUrlBase,
                tableConfigKey: this.tableConfigKey,
                radioSelect: this.radioSelect,
                onCancel: function() {
                    newResourceDialog.hide();
                    newResourceDialog.destroy();
                },
                isSelectable: function(resource) {
                    return self.isSelectable(resource);
                },
                onSave: function(resources) {
                    var selectedResource;
                    array.forEach(resources, function(resource) {
                        selectedResource = resource;
                    });

                    self.selectResource(selectedResource);

                    if (self.onChange !== undefined) {
                        self.onChange(self._getValueAttr());
                    }

                    newResourceDialog.hide();
                    newResourceDialog.destroy();
                }
            });
            dojo.addClass(resourceSelectTree.domNode, "radioButtonGroup");
            resourceSelectTree.placeAt(newResourceDialog.containerNode);

            newResourceDialog.show();
        },

        /**
         * Overridable function to determine whether a given resource should be selectable
         */
        isSelectable: function(resource) {
            return true;
        },

        /**
         *
         */
        selectResource: function(resource) {
            if (!resource) {
                this.resourcePathAttach.innerHTML = i18n("None Selected");
            }
            else {
                this.resourcePathAttach.innerHTML = resource.path.escape();
            }

            this.selectedResource = resource;
        },

        _getValueAttr: function() {
            var result;

            if (this.selectedResource) {
                if (this.returnEntireObject) {
                    result = this.selectedResource;
                }
                else {
                    result = this.selectedResource.id;
                }
            }

            return result;
        },
        
        _setValueAttr: function(value) {
            var self = this;
            
            if (value) {
                xhr.get({
                    url: bootstrap.restUrl+"resource/resource/"+value,
                    handleAs: "json",
                    load: function(data) {
                        self.selectResource(data);
                    }
                });
            }
            else {
                self.selectResource(undefined);
            }
        }
    });
});

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
define(["dojo/_base/declare",
        "dojo/_base/array",
        "deploy/widgets/rightPanel/RightPanel",
        "deploy/widgets/resource/EditResource",
        "dojo/dom-class",
        "dojo/dom-style",
        "dojo/dom-construct",
        "dojo/dom-geometry",
        "dojo/on",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Switch",
        "js/webext/widgets/table/TreeTable"
        ],
        function(
            declare,
            array,
            RightPanel,
            EditResource,
            domClass,
            domStyle,
            domConstruct,
            geo,
            on,
            Dialog,
            ColumnForm,
            Switch,
            TreeTable
        ){
    /**
     * Resource Right Panel
     *
     * Widget for displaying a hovering side panel on the right side of the window with a table.
     *
     * Use: new ResourceRightPanel(options{});
     *
     * options: {
     *  header: (string) The header title of the right panel.
     *  subheader: (string) The subheader or description text of the right panel.
     *  width: (integer) The width of the right panel. Default is 500px;
     *  titleContent: (domNode) Any additional domNode to add to the header.
     *  content: (domNode) The content to display in the right panel.
     *  defaultSpeed: (integer) The default speed for the animation show/hide. Default is 180.
     *  slowSpeed: (integer) The slowest speed for the animation show/hide. Default is 1000.
     *  url: REST url to load data into the table.
     *  baseFilters: Array of objects specifying filters to add to the table REST call (optional)
     *  showSwitch: Show an options switch to use as a flag for drop events. Default: true. Can also use a string to change the switch label.
     *  getColumns: Function that returns the columns to display for the table.
     *  onDrop: function to run when item is drop. (Enables drag and drop if defined)
     * }
     */
    return declare('deploy.widgets.resource.ResourceRightPanel',  [RightPanel], {
        url: null,
        showSwitch: true,

        postCreate: function() {
            this.inherited(arguments);
            this._buildPanel();
            if (this.attachPoint){
                this.placeAt(this.attachPoint);
            }
        },

        /**
         * Returns the columns for the table to use.
         */
        getColumns: function(){
            // no-op by default
        },

        /**
         * Refreshes the contents of the table.
         */
        refresh: function(){
            if (this.table){
                this.table.refresh();
            }
        },

        /**
         * Builds and loads a table provided a url.
         */
        loadTable: function(){
            var _this = this;
            if (this.url){
                this.table = new TreeTable({
                    url: _this.url,
                    baseFilters: _this.baseFilters,
                    serverSideProcessing: true,
                    orderField: "name",
                    noDataMessage: _this.noDataMessage || i18n("No resources found."),
                    tableConfigKey: "rightPanelList",
                    selectorField: "id",
                    columns: _this.getColumns(),
                    hideExpandCollapse: true,
                    hidePagination: false,
                    selectable: _this.selectable || false,
                    draggable: _this.onDrop ? true : false,
                    copyOnly: true,
                    suppressDefaultOnDrop: true,
                    onDrop: function(sources, target, node){
                        // This function and the on drop function (in ResourceTree.js) run at the same time.
                        // which sets the target needed for the item being dropped.
                        setTimeout(function(){
                            _this.onDrop(sources, target, node);
                        }, 100);
                    },
                    onDisplayTable: function(){
                        _this.table.dndContainer.checkAcceptance = function(){
                            return false;
                        };
                        _this.loaded = true;
                        _this.content = _this.table.domNode;
                    }
                }).placeAt(this.contentAttach);
            }
            if (this.showSwitch){
                this.showOptionsBox();
            }
        },

        /**
         * Additional switch in the right panel.
         */
        showOptionsBox: function(){
            var _this = this;
            // Building the options check box to use as a flag to determine if options dialog is shown on item drop.
            this.titleContent = domConstruct.create("div", {
                className: "show-drop-options"
            });
            this.optionsSwitch = new Switch({
                labelText: (typeof this.showSwitch === "string") ? this.showSwitch : i18n("Show options on drop"),
                labelPlacement: "before",
                value: false
            }).placeAt(this.titleContentAttach);
        },

        /**
         * Function called when item is dropped from the table in the right panel.
         */
        onDrop: function(sources, target, node){
            // no-op by default
        },

        /**
         * When dropping onto a resource, save data on drop or show a edit resource dialog.
         *  @param type: data name of resource being saved.
         *  @param parent: the parent element of the resource being saved.
         *  @param value: the data of the resource being saved.
         *  @param showDialog: Show a dialog when dropping on a resource.
         *  @param resourceData: A partially constructed object conforming to the typical expected
         *                       data for resources. This will be used as existingData and sent
         *                       along with the form data when creating new resources. 
         */
        submitData: function(type, parent, value, showDialog, resourceData) {
            var _this = this;
            // Shows a dialog if item is dropped onto a resource.
            if (showDialog){
                var newResourceDialog = new Dialog({
                    title: i18n("Create Resource"),
                    closable: true,
                    draggable:true
                });
                // A refresh function to call after resource has been successfully added.
                var onSubmit = function(){
                    newResourceDialog.hide();
                    newResourceDialog.destroy();
                    _this.parent.grid.refreshRowChildrenForItem(parent);
                };
                var newResourceForm = new EditResource({
                    parent: parent,
                    type: type,
                    callback: function() {
                        onSubmit();
                    },
                    existingData: resourceData,
                    selectedValue: value
                });
                newResourceForm.placeAt(newResourceDialog.containerNode);
                newResourceDialog.show();
            }
            else {
                var form = new ColumnForm({
                    submitUrl: bootstrap.restUrl+"resource/resource",
                    readOnly: _this.readOnly,
                    postSubmit: function(data) {
                        if (_this.parent && _this.parent.grid) {
                            var parentGridTargetRowItem = null;
                            array.forEach(_this.parent.grid.rowObjectList, function(thisRowObject) {
                                if (thisRowObject.item && thisRowObject.item.id === parent.id) {
                                    parentGridTargetRowItem = thisRowObject.item;
                                }
                            });

                            _this.parent.grid.refreshRowChildrenForItem(parentGridTargetRowItem);
                        }
                    },
                    addData: function(data) {
                        // Apply existing resourceData to the data we're about to submit.
                        if (resourceData) {
                            var resourceDataPropName;
                            for (resourceDataPropName in resourceData) {
                                if (resourceData.hasOwnProperty(resourceDataPropName)) {
                                    data[resourceDataPropName] = resourceData[resourceDataPropName];
                                }
                            }
                        }
                        
                        if (parent) {
                            data.parentId = parent.id;
                        }
                        if (_this.blueprint && _this.blueprint.id){
                            data.blueprintId = _this.blueprint.id;
                        }
                    },
                    onCancel: function() {
                        if (_this.callback !== undefined) {
                            _this.callback();
                        }
                    }
                });
                form.addField({
                    name: "name",
                    value: value.name,
                    type: "Invisible"
                });
                form.addField({
                    name: type + "Id",
                    value: value.id,
                    type: "Invisible"
                });
                form.submitForm();
            }
        }
    });
});
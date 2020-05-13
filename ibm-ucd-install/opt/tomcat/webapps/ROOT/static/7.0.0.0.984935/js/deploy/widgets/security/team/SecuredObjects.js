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
        "dojo/_base/xhr",
        "dojo/_base/array",
        "dojo/dom-class",
        "dojo/dom-geometry",
        "dojo/dom-construct",
        "dojo/on",
        "js/webext/widgets/table/TreeTable",
        "js/webext/widgets/DialogMultiSelect",
        "js/webext/widgets/form/MenuButton",
        "js/webext/widgets/RestSelect",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Alert",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "deploy/widgets/Formatters"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Select,
        Button,
        declare,
        xhr,
        array,
        domClass,
        domGeom,
        domConstruct,
        on,
        TreeTable,
        DialogMultiSelect,
        MenuButton,
        RestSelect,
        ColumnForm,
        Alert,
        Dialog,
        GenericConfirm,
        Formatters
) {
    /**
     *
     */
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div>' +
                '<div data-dojo-attach-point="toolbarAttach">' +
                    '<div data-dojo-attach-point="viewBox" class="object-view-box inline-block">' +
                        '<b><div data-dojo-attach-point="objectLabel" style="margin-bottom: 5px;"></div></b>' +
                        '<div data-dojo-attach-point="secureResourceTypeAttach" class="inlineBlock"  style="margin-' + (domGeom.isBodyLtr()?'left':'right') + ': -5px;"></div>' +
                    '</div>' +
                    '<div data-dojo-attach-point="addBox" class="object-view-box inline-block" style="margin-' + (domGeom.isBodyLtr()?'left':'right') + ': 25px;">' +
                        '<b><div data-dojo-attach-point="addLabel" style="margin-bottom: 5px;"></div></b>' +
                        '<b><div data-dojo-attach-point="typeLabel" class="inlineBlock" style="margin-' + (domGeom.isBodyLtr()?'right':'left') + ': 10px;"></div></b>' +
                        '<div data-dojo-attach-point="typeSelectAttach" class="inlineBlock" style="margin: ' + (domGeom.isBodyLtr()?'0 4px -9px 0':'0 0 -9px 4px') + ';"></div>' +
                        '<div data-dojo-attach-point="addSecureResourceAttach" class="inlineBlock"></div>' +
                    '</div>' +
                '</div>' +
                '<div data-dojo-attach-point="tableAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this._loadPermissions();
            this._loadMappings();
        },

        /**
         * Sets the permissions.
         */
        _loadPermissions: function(){
            var p = config.data.permissions;
            this.canEdit = p["Manage Security"];
        },

        /**
         * Loads the data for the mapping table.
         */
        _loadMappings: function(){
            var self = this;
            this.addLabel.innerHTML = i18n("Add Object Mapping: ");
            this.typeLabel.innerHTML = i18n("Type: ");
            this.objectLabel.innerHTML = i18n("View: ");
            xhr.get({
                url: bootstrap.baseUrl + "security/resourceType",
                handleAs: "json",
                load: function(data) {
                    var options = [];
                    data = array.filter(data, function(item) {
                        return (item.name !== "Web UI" && item.name !== "Server Configuration"
                            && item.name !== "Server");
                    });
                    var mappingType = util.getCookie("teamResourceMapping");
                    if (!mappingType){
                        mappingType = data[0].name;
                    }
                    self.resourceType = mappingType;
                    array.forEach(data, function(item) {
                        options.push({
                            label: i18n(item.name),
                            onClick: function() {
                                util.setCookie("teamResourceMapping", item.name);
                                self.secureResourceType.set('label', i18n(item.name));
                                self.resourceType = item.name;
                                self.getUnmappedUrl = bootstrap.restUrl + "security/team/"
                                + self.team + "/unmappedResources/" + self.resourceType;
                                self.addSecureResource.url = self.getUnmappedUrl;
                                self.refreshTable();
                                self.refreshTypeSelect();
                                self.addSecureResource._setValueAttr();
                            }
                        });
                    });
                    self.secureResourceType = new MenuButton({
                        label: i18n(mappingType),
                        options: options
                    });
                    self.secureResourceType.placeAt(self.secureResourceTypeAttach);
                    self.showTable();
                    self.showForm();
                }
             });
        },

        showTable: function() {

            var self = this;
            var gridLayout = [{
                name: i18n("Name"),
                field: "name",
                formatter: function(item, result, domNode) {
                    if (item.name) {
                        if (item.path) {
                            result = Formatters.resourceLinkFormatter(item);
                        }
                        else {
                          result = item.name;
                        }
                    }
                    else {
                        result = item.resource.name;
                    }
                    return result;
                },
                orderField: "name",
                filterField: "name",
                filterType: "text",
                getRawValue: function(item) {
                    var result = "";
                    if (item.name) {
                        result = item.name;
                    }
                    else {
                        result = item.resource.name;
                    }
                    return result;
                }
            },{
                name: i18n("Types"),
                field: "types",
                formatter: function (item, result, domNode) {
                    return self.formatResourceRoles(item);
                }
            }];

            this.table = new TreeTable({
                url: bootstrap.restUrl + "security/team/"+ self.team + "/resourceMappings/" + self.resourceType,
                columns: gridLayout,
                serverSideProcessing: false,
                orderField: "name",
                tableConfigKey: "securedObjectsList",
                selectable: self.canEdit,
                rowsPerPage: 10,
                hidePagination:false,
                isSelectable: function(item){
                    return true;
                },
                getTreeNodeId: function(data, parent){
                    var id = data.id;
                    if (data.resource && data.resource.id){
                        id = data.resource.id;
                    }
                    return id;
                },
                getChildUrl: function(item) {
                    return bootstrap.restUrl + "security/team/"+ self.team + "/resourceMappings/"
                        + self.resourceType + "?parent=" + item.id;
                },
                hasChildren: function(item) {
                    return item.hasChildren;
                }
            });
            this.table.placeAt(this.tableAttach);
            domConstruct.place(this.toolbarAttach, this.table.aboveTreeOptions);

            if (this.canEdit){
                var actionsButton = new MenuButton({
                    options: [{
                        label: i18n("Remove From Team"),
                        onClick: function(evt){
                            self.removeSelectedItems(self.table.getSelectedItems());
                        }
                    }],
                    label: i18n("Actions...")
                });
                actionsButton.placeAt(this.addSecureResourceAttach);

                var onSelectChange = function() {
                    var selectCount = self.table.getSelectedItems().length;
                    if (selectCount === 0) {
                        actionsButton.set("label", i18n("Actions..."));
                        actionsButton.set("disabled", true);
                    }
                    else {
                        actionsButton.set("label", i18n("Actions... (%s)", selectCount));
                        actionsButton.set("disabled", false);
                    }
                };
                this.table.on("selectItem", onSelectChange);
                this.table.on("deselectItem", onSelectChange);
                this.table.on("displayTable", onSelectChange);
            }
        },

        getChildren: function(children){
            var self = this;
            var results = [];
            array.forEach(children, function(item){
                if (item.children){
                    var childrenId = self.getChildren(item.children);
                    array.forEach(childrenId, function(childId){
                        results.push(childId);
                    });
                }
                    var id = "";
                    if (item.resource){
                        id = item.resource.id;
                    }
                    else if (item.id){
                        id = item.id;
                    }
                    results.push(id);

            });
            return results;
        },

        removeSelectedItems: function(items){
            var self = this;
            var dataArray = [];
            var dataObject = {};
            array.forEach(items, function(item){
                var id = "";
                if (item.resource){
                    id = item.resource.id;
                }
                else if (item.id){
                    id = item.id;
                }
                if (item.children){
                    var childrenId = self.getChildren(item.children);
                    array.forEach(childrenId, function(childId){
                        if (!dataObject[childId]){
                            dataObject[childId] = true;
                            dataArray.push(childId);
                        }
                    });
                }
                // Prevent duplicates from removing a parent element and children.
                if (!dataObject[id]){
                    dataObject[id] = true;
                    dataArray.push(id);
                }
            });
            var data = {resources: dataArray};
            if (self.typeSelect.value !== "standard") {
                data.resourceRole = self.typeSelect.value;
            }
            if (!items.length) {
                var alert = new Alert({
                    message: i18n("Please select at least one resource to remove.")
                });
                alert.startup();
            }
            else {
                var confirm = new GenericConfirm({
                    message: i18n("Are you sure you want to remove the selected objects from this team?"),
                    action: function() {
                        xhr.del({
                            url: bootstrap.baseUrl + "security/team/" + self.team + "/batchResourceMappings",
                            headers: { "Content-Type": "application/json" },
                            putData: JSON.stringify(data),
                            load: function() {
                                self.table.refresh();
                            },
                            error: function(error) {
                                new Alert({
                                    title: i18n("Error removing object"),
                                    message: error.responseText
                                }).startup();
                                self.table.unblock();
                                self.table.refresh();
                            }
                        });
                    }
                });
            }
        },

        showForm: function() {
            var self = this;
            this.form = new ColumnForm({
                submitUrl: bootstrap.baseUrl + "security/team/" + self.team + "/batchResourceMappings",
                cancelLabel: null,
                showButtons: false,
                addData: function(data) {
                    data.resources = data.resources.split(",");
                    data.resourceRole = self.typeSelect.get("value");
                    if (data.resourceRole === "standard") {
                        data.resourceRole = null;
                    }
                },
                postSubmit: function() {
                    self.table.refresh();
                    self.addSecureResource._setValueAttr();
                }
            });
            this.getUnmappedUrl = bootstrap.restUrl + "security/team/" + self.team + "/unmappedResources/" + self.resourceType;

            this.addSecureResource = new DialogMultiSelect({
                url: self.getUnmappedUrl,
                getLabel: function(item) {
                    return item.name;
                },
                getValue: function(item) {
                    return item.id;
                },
                onClose: function() {
                    self.form.submitForm();
                },
                noSelectionsLabel: i18n("None Selected")
            });
            this.form.addField({
                name: "resources",
                widget: self.addSecureResource
            });

            this.typeSelect = new Select();
            this.typeSelect.on("change", function(){
                self.addSecureResource.url = self.getUnmappedUrl;
                if (self.typeSelect.value !== "standard") {
                    self.addSecureResource.url = self.getUnmappedUrl + "/" + self.typeSelect.value;
                }
            });
            this.typeSelect.placeAt(this.typeSelectAttach);

            this.addButton = new Button( {
                label: i18n("Add"),
                onClick: function() {
                    self.addSecureResource.fieldAttach.onclick();
                }
            });
            domClass.add(this.addButton.domNode, "idxButtonSpecial idxButtonCompact");
            if (this.canEdit){
                domConstruct.place(this.addButton.domNode, this.addSecureResourceAttach, "first");
            }

            this.refreshTypeSelect();

        },

        refreshTable: function() {
            this.table.url = bootstrap.restUrl + "security/team/" + this.team + "/resourceMappings/" +
                    this.resourceType;
            this.table.refresh();
        },

        /**
         *
         */
        destroy: function() {
            this.inherited(arguments);
            this.table.destroy();
        },

        refreshTypeSelect: function() {
            var self = this;
            xhr.get({
                url: bootstrap.baseUrl + "security/resourceType/" + self.resourceType + "/resourceRoles",
                handleAs: "json",
                load: function(data) {
                    var oldOptions = self.typeSelect.getOptions();
                    array.forEach(oldOptions, function(item) {
                        self.typeSelect.removeOption(item.value);
                    });

                    var standardName = "Standard "+self.resourceType;
                    self.typeSelect.addOption({
                        "value": "standard",
                        "label": i18n(standardName)
                    });
                    array.forEach(data, function(item) {
                        self.typeSelect.addOption({
                            "value": item.id,
                            "label": util.escape(item.name)
                        });
                    });
                }
            });

        },

        formatResourceRoles: function(item) {
            var self = this;
            var result = "";
            if (item.resourceRoles) {
                var isFirst = true;
                array.forEach(item.resourceRoles, function(role) {
                    if (!isFirst) {
                        result += ", ";
                    }
                    isFirst = false;

                    var name = "";
                    if (role !== null) {
                        name = util.escape(role.name);
                    }
                    else {
                        var standardName = "Standard "+self.resourceType;
                        name += i18n(standardName);
                    }
                    result += name;
                });
            }

            return result;
        }
    });
});
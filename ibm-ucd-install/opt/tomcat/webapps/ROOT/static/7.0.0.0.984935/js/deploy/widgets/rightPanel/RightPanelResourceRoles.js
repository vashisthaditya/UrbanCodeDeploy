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
        "dojo/_base/lang",
        "deploy/widgets/rightPanel/ResourceRightPanel",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dijit/form/TextBox",
        "deploy/widgets/Formatters",
        "deploy/widgets/tag/Tagger",
        "deploy/widgets/filter/TagFilter",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/table/TreeTable"
        ],
        function(
            declare,
            array,
            lang,
            RightPanel,
            domClass,
            domConstruct,
            TextBox,
            Formatters,
            Tagger,
            TagFilter,
            ColumnForm,
            Dialog,
            TreeTable
        ){
    /**
     * Right Panel Resource Roles
     *
     * Widget for displaying a hovering side panel on the right side of the window with a drag and
     * drop table containing standard resource roles.
     *
     * Use: new RightPanelResourceRoles(options);
     *
     * options: {
     *  parent: reference to the parent (this) using this widget. This MUST be a ResourceTree.
     * }
     */
    return declare('deploy.widgets.resource.RightPanelResourceRoles',  [RightPanel], {
        header: i18n("Resource Roles"),
        subheader: i18n("Drag and drop new resource roles under existing resources"),
        url: bootstrap.restUrl + "resource/resourceRole/",

        postCreate: function() {
            this.baseFilters = [{
                name: "specialType",
                type: "null"
            }];

            this.inherited(arguments);
        },

        /**
         * Setting up the columns for the tree table to use for the agents.
         */
        getColumns: function(){
            var _this = this;
            return [{
                name: i18n("Name"),
                formatter: function(item, value, cell) {
                    cell.style.positon = "relative";
                    var result = domConstruct.create("div", {
                        innerHTML: item.name.escape()
                    });

                    var icon = Formatters.getResourceIcon({
                        role: item
                    });
                    domConstruct.place(icon, result, "first");

                    return result;
                },
                orderField: "name",
                filterField: "name",
                filterType: "text"
            },{
                name: i18n("Description"),
                field: "description"
            }];
        },

        /**
         * Prepares data and permission when a resource role is dropped
         */
        onDrop: function(sources) {
            var _this = this;
            var target = this.parent.target;
            var acttarget = _this.parent.grid._getRowObjectForItem(target);
            var parRole = _this.parent.getLowestParentRole(acttarget);

            array.forEach(sources, function(source){
                // Determine if the agent in the right panel can be dropped.
                var allowDnd = target && (target.hasAgent || target.resourceTemplate);
                if (allowDnd) {
                    if (_this.optionsSwitch.value) {
                        //set the parentRole so we can show allowedNames if appropriate
                        source.parentRole = parRole;
                        // User wants to show full options panel, which will include fields for all
                        // prop defs on the resource role
                        _this.submitData("role", target, source, _this.optionsSwitch.value);
                    }
                    else if (source.propDefs) {
                        // If this resource role has PropDefs, prompt for values to them now in an
                        // abbreviated form instead of the full EditResource form.
                        var newResourceDialog = new Dialog({
                            title: i18n("Create New Resource"),
                            closable: true,
                            draggable: true
                        });

                        var cleanupForm = function() {
                            newResourceDialog.hide();
                            newResourceDialog.destroy();
                        };

                        var propDefsForm = new ColumnForm({
                            onSubmit: function(data) {
                                var name = data.name;
                                if (source.defaultNameProperty) {
                                    name = data[source.defaultNameProperty];
                                }

                                var newResourceData = {
                                    roleProperties: data,
                                    name: name
                                };
                                _this.submitData("role", target, source, false, newResourceData);

                                cleanupForm();
                            },
                            onCancel: function() {
                                cleanupForm();
                            }
                        });

                        propDefsForm.placeAt(newResourceDialog.containerNode);

                        var allowedNames;
                        if (parRole) {
                            allowedNames = _this.getAllowedNames(source.allowedParentResourceRoles, parRole.name);
                        }
                        if (!source.defaultNameProperty) {
                            _this.createNameWidget(allowedNames, i18n(source.name), propDefsForm);
                        }

                        array.forEach(source.propDefs, function(propDef) {
                            var propDefCopy = lang.clone(propDef);
                            propDefCopy.translate = true;
                            if (propDef.name === source.defaultNameProperty) {
                                propDefCopy.required = true;
                                if (allowedNames !== undefined && allowedNames.length !== 0) {
                                    propDefCopy.type = 'Select';
                                    propDefCopy.allowedValues = allowedNames;
                                }
                            }

                            propDefsForm.addField(propDefCopy);
                        });
                        newResourceDialog.show();
                    }
                    else {
                        _this.submitData("role", target, source, false);
                    }
                }
            });
        },

         getAllowedNames: function(allowedParentResourceRoles, parentRoleName) {
             var self = this;
             var investigateAllowedNames = true;
             var allowedNames = [];
             var i = 0;
             array.forEach(allowedParentResourceRoles, function(role) {
                 if (investigateAllowedNames === true) {
                     if (role.name === parentRoleName) {
                         if (role.allowedName === undefined || role.allowedName === null || role.allowedName === '') {
                             investigateAllowedNames = false;
                             allowedNames = undefined;
                         }
                         else {
                             allowedNames[allowedNames.length] = role.allowedName;
                         }
                     }
                 }
             });
             return allowedNames;
         },

         createNameWidget: function(allowedNames, curName, form) {
             var self = this;
             if (allowedNames !== undefined && allowedNames.length !== 0) {
                 form.addField({
                     'allowedValues':allowedNames,
                     name: "name",
                     label: i18n("Resource Name"),
                     required: true,
                     value: curName,
                     type: "Select"
                 });
             }
             else {
                 form.addField({
                     name: "name",
                     label: i18n("Resource Name"),
                     required: true,
                     value: curName,
                     type: "Text"
                 });
             }
          }
    });
});

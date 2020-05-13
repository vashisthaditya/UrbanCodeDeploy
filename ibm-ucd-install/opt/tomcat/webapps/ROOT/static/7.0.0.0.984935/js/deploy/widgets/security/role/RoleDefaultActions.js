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
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/json",
        "js/util/blocker/_BlockerMixin",
        "js/webext/widgets/Alert",
        "js/webext/widgets/FieldList",
        "js/webext/widgets/Switch"
        ],
function(
        _TemplatedMixin,
        _Widget,
        array,
        declare,
        xhr,
        JSON,
        _BlockerMixin,
        Alert,
        FieldList,
        Switch
) {
    /**
     *
     */
    return declare([_Widget, _TemplatedMixin, _BlockerMixin], {
        templateString:
            '<div class="roleDefaultActions">'+
                '<div data-dojo-attach-point="actionsAttach"></div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            var p = config.data.permissions;
            this.canEdit = p["Manage Security"];

            this.fieldList = new FieldList();
            this.fieldList.placeAt(this.actionsAttach);

            xhr.get({
                url: bootstrap.baseUrl+"security/role/"+this.role.id+"/actionMappings",
                handleAs: "json",
                load: function(actionMappings) {
                    self.role.actions = actionMappings;

                    xhr.get({
                        url: bootstrap.baseUrl+"security/resourceType/"+self.resourceType.name+"/actions",
                        handleAs: "json",
                        load: function(actions) {
                            self.showCheckboxes(actions);
                        }
                    });
                }
            });
        },

        /**
         *
         */
        showCheckboxes: function(actions) {
            var self = this;

            array.forEach(actions, function(action) {
                var hasAction = false;
                array.forEach(self.role.actions, function(roleAction) {
                    if (roleAction.action.name === action.name) {
                        hasAction = true;
                    }
                });

                var toggle = new Switch({
                    labelText: i18n(action.name),
                    labelPlacement: "before",
                    hideLabel: true,
                    value: hasAction,
                    focusOnHover: true,
                    disabled: !self.canEdit,
                    onChange: function(value) {
                        var putData = {
                            resourceType: self.resourceType.name,
                            action: action.name
                        };

                        self.block();

                        if (value) {
                            xhr.post({
                                url: bootstrap.baseUrl+"security/role/"+self.role.id+"/actionMappings",
                                handleAs: "json",
                                putData: JSON.stringify(putData),
                                load: function(data) {
                                    self.unblock();
                                },
                                error: function(data) {
                                    self.unblock();
                                    var alert = new Alert({
                                        message: util.escape(data.responseText)
                                    });
                                }
                            });
                        }
                        else {
                            xhr.del({
                                url: bootstrap.baseUrl+"security/role/"+self.role.id+"/actionMappings",
                                handleAs: "json",
                                putData: JSON.stringify(putData),
                                load: function(data) {
                                    self.unblock();
                                },
                                error: function(data) {
                                    self.unblock();
                                    var alert = new Alert({
                                        message: util.escape(data.responseText)
                                    });
                                }
                            });
                        }
                    }
                });
                self.fieldList.insertField(toggle, null, i18n(action.description), null);
            });
        },

        /**
         *
         */
        destroy: function() {
            this.inherited(arguments);
            this.fieldList.destroy();
        }
    });
});

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
        "js/webext/widgets/RestSelect"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Select,
        Button,
        declare,
        xhr,
        array,
        RestSelect
) {
    /**
     *
     */
    return declare('js.deploy.widgets.task.TaskApprovalSelector',  [_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="roleSelector">' +
              '  <div data-dojo-attach-point="roleAttach" class="teamSelectorComponent"></div>' +
              '  <span data-dojo-attach-point="innerAttach"></span>' + 
              '  <div data-dojo-attach-point="resourceAttach" class="teamSelectorComponent"></div>' +
              '  <div data-dojo-attach-point="removeAttach" style="display: inline-block; vertical-align: top"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            var self = this;

            var removeButton = new Button({
                label: i18n("Remove"),
                onClick: function(){
                    self.form.selectors[self.number] = {};
                    self.form.removeField(self);
                }
            });

            removeButton.placeAt(self.removeAttach);
            this.removeAttach.style.visibility = "hidden";

            if (!self.form.initialized) {
                self.form.selectors = [];
                self.form.initialized = true;
            }
            self.addField();
        },

        addField: function() {
            var self = this;
            self.resourceSelect = null;
            var roleId;
            if (self.preloading){
                roleId = self.selector.roleId;
                self.roleSelect = new RestSelect({
                    restUrl: "/security/role",
                    onChange: function(roleValue) {
                        if (roleValue !== "") {
                            self.changeRole(roleValue);
                        }
                    },
                    allowNone: false,
                    value: roleId

                });
                self.resourceSelect = new RestSelect({
                    restUrl: self.restUrl,
                    onChange: function(resource) {
                        self.changeResource(resource);
                    },
                    noneLabel: i18n("Standard %s", self.approvalType),
                    value: self.selector.resourceRoleId
                });
                self.resourceSelect.number = self.number;
                self.resourceSelect.placeAt(self.resourceAttach);
                self.showRemove();
            }
            else {
                self.roleSelect = new RestSelect({
                    restUrl: "/security/role",
                    onChange: function(roleValue) {
                        if (roleValue !== "") {
                            self.changeRole(roleValue);
                        }
                    },
                    noneLabel: i18n("Add Role..."),
                    value: roleId

                });
            }
            self.roleSelect.number = self.number;
            self.roleSelect.placeAt(this.roleAttach);
        },

        showRemove: function() {
            var self = this;
            self.removeAttach.style.visibility = "visible";
            this.innerAttach.innerHTML = i18n("for");
        },

        makeSelector: function(roleValue, resourceValue) {
            return {"roleId": roleValue, "resourceRoleId": resourceValue};
        },

        changeRole: function(roleValue) {
            var self = this;
            if (self.number === self.form.selectors.length) {
                self.resourceSelect = new RestSelect({
                    restUrl: self.restUrl,
                    onChange: function(resource) {
                        self.changeResource(resource);
                    },
                    noneLabel: i18n("Standard %s", self.approvalType)
                });
                self.resourceSelect.number = self.number;
                self.resourceSelect.placeAt(self.resourceAttach);

                self.addRow(self.form, self.number+1, null, self.restUrl, self.approvalType);
                self.form.selectors.push(self.makeSelector(roleValue, self.resourceSelect.value));
                self.roleSelect.selectWidget.removeOption(0);
                self.showRemove();
            }
            else {
                var selector = self.form.selectors[self.number];
                var resourceRoleId = null;
                if (selector) {
                    resourceRoleId = selector.resourceRoleId;
                }
                self.form.selectors[self.number] = self.makeSelector(roleValue, resourceRoleId);
            }
        },

        changeResource: function(resource) {
            var self = this;
            var selector = self.form.selectors[this.number];
            self.form.selectors[this.number] = self.makeSelector(selector.roleId, resource);
        }
    });
});

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
        "dojo/dom-class",
        "dojo/dom-construct",
        "js/webext/widgets/RestSelect"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        array,
        declare,
        domClass,
        domConstruct,
        RestSelect
) {
    /**
     *
     */
    return declare('deploy.widgets.resourceRole.RolePicker',  [_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="rolePicker">' +
                '<div data-dojo-attach-point="buttonAttach"></div>' +
                '<div data-dojo-attach-point="listAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            if (this.roles !== undefined) {
                this.value = this.roles;
            }
            else {
                this.value = [];
            }
            
            
            this.listAttach.style.paddingTop = "5px";
            
            array.forEach(this.value, function(role) {
                self.showRole(role);
            });
            
            this.buttonAttach.style.paddingBottom = "7px";

            var roleSelect = new RestSelect({
                restUrl: bootstrap.restUrl+"resource/resourceRole",
                onChange: function(id, role) {
                    if (role) {
                        var skip = false;
                        array.forEach(this.roles, function(existingRole) {
                            if (existingRole.id === role.id) {
                                skip = true;
                            }
                        });
                        
                        if (!skip) {
                            self.value.push(role);
                            self.showRole(role);
                        }

                        this.setValue("none");
                    }
                }
            });
            roleSelect.placeAt(this.buttonAttach);

            var clearRolesButton = new Button({
                label: i18n("Remove All"),
                showTitle: false,
                onClick: function() {
                    self.clearAll();
                }
            });
            clearRolesButton.placeAt(this.buttonAttach);
        },
        
        /**
         * 
         */
        clearAll: function() {
            domConstruct.empty(this.listAttach);
            this.value = [];
        },

        /**
         * 
         */
        showRole: function(role) {
            var roleDiv = document.createElement("div");
            roleDiv.innerHTML = role.name.escape();
            domClass.add(roleDiv, "inlineBlock");
            roleDiv.style.padding = "3px";
            roleDiv.style.marginLeft = "3px";
            roleDiv.style.marginBottom = "3px";
            roleDiv.style.backgroundColor = role.color;
            this.listAttach.appendChild(roleDiv);
        }
    });
});
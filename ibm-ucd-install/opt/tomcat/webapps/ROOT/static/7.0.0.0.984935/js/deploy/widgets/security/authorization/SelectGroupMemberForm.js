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
        "dijit/form/FilteringSelect",
        "dojo/_base/declare",
        "dojox/data/JsonRestStore",
        "js/webext/widgets/ColumnForm"
        ],
function(
        _TemplatedMixin,
        _Widget,
        FilteringSelect,
        declare,
        JsonRestStore,
        ColumnForm
) {
    return declare('deploy.widgets.security.authorization.SelectGroupMemberForm',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="selectGroupMemberForm">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        /**
         * 
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            this.form = new ColumnForm({
                submitUrl: this.saveUrl,
                preSubmit: function() {
                    var id = self.groupMemberSelect.item.id;
                    this.submitUrl = self.saveUrl + "/" + id;
                },
                postSubmit: function(data) {
                    if (self.callback !== undefined) {
                        self.callback(true);
                    }
                },
                onCancel: function() {
                    if (self.callback !== undefined) {
                        self.callback(false);
                    }
                }
            });
            
            this.groupMembersStore = new JsonRestStore({
                target: bootstrap.baseUrl + "security/user",
                idAttribute: 'id'
            });
            this.groupMemberSelect = new FilteringSelect({
                store: this.groupMembersStore,
                searchAttr: "name"
            });
            this.form.addField({
                name: "groupMemberId",
                label: i18n("Group Member"),
                required: true,
                widget: this.groupMemberSelect
            });

            this.form.placeAt(this.formAttach);
        }
    });
});
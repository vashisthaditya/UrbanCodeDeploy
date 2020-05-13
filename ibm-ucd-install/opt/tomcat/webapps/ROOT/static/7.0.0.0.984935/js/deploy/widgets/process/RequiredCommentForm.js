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
        "dojo/_base/declare",
        "dijit/_Widget",
        "dijit/_TemplatedMixin",
        "dojo/dom-construct",
        "js/webext/widgets/ColumnForm"
        ],
function(
        declare,
        _Widget,
        _TemplatedMixin,
        domConstruct,
        ColumnForm
) {
    return declare('deploy.widgets.process.RequiredCommentForm',  [_Widget, _TemplatedMixin], {
        templateString:
                '<div class="requiredCommentForm">' +
                    '<div data-dojo-attach-point="formAttach"></div>' +
                '</div>',
        postCreate: function() {
            var self = this;
            var commentForm = new ColumnForm({
                onSubmit: function(data) {
                    self.callback(data);
                    commentForm.destroy();
                },
                onCancel: function() {
                    commentForm.destroy();
                    self.callback();
                },
                validateFields: function(data) {
                    var result = [];
                    if (data && data.comment &&
                        (data.comment.length < 1 || data.comment.length > 1000)) {
                        result.push(i18n("A commit message must be provided containing less than 1,000 characters."));
                    }
                    return result;
                }
            });

            commentForm.addField({
                name: "comment",
                label: i18n("Comment"),
                description: i18n("Provide a comment describing your changes."),
                required: true,
                type: "Text Area"
            });

            commentForm.placeAt(this.formAttach);
        }
    });
});
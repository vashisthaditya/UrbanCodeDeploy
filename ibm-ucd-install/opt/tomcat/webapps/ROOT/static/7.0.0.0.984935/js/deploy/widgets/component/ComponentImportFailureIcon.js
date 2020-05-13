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
        "dijit/Tooltip",
        "dojo/_base/declare"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Tooltip,
        declare
) {
    /**
     * Dead-simple widget to show a component import failure.
     */
    return declare('deploy.widgets.component.ComponentFileTable',  [_Widget, _TemplatedMixin], {

        templateString: '<div class="general-icon failed-icon inlineBlock"></div>',

        postCreate: function() {
            this.inherited(arguments);

            if (!this.label) {
                this.label = i18n("A version import failed. Check the component's configuration for more details.");
            }

            var tooltip = new Tooltip({
                connectId: [this.domNode],
                label: this.label,
                showDelay: 100,
                position: ["after", "above", "below", "before"]
            });
        }
    });
});

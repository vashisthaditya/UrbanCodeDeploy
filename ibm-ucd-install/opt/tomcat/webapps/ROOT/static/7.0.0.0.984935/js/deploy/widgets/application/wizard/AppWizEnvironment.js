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
define([
        "dojo/Stateful",
        "dojo/store/Memory",
        "dojo/store/Observable",
        "dojo/_base/declare",
        "deploy/widgets/application/wizard/AppWizProperty"
        ],
function(
        Stateful,
        Memory,
        Observable,
        declare,
        AppWizProperty
) {
    /**
     * Stateful data model backing for an Environment.
     * @field  name         The name of this environment.
     * @field  description  The description of this environment.
     * @field  template
     */
    return declare([Stateful], {
        uniqId: null,
        name: null,
        description: null,
        template: null,
        props: null,
        selected: null,

        /**
         * Initializes each property to its respective default value.
         * @param  uniqId    Unique Id.
         * @param  template  The template with which this environment is
         *                   associated.
         * @param  selected  Whether this environment is selected
         */
        constructor: function(uniqId, template, selected) {
            var self = this;

            this.uniqId = uniqId;
            this.name = template.name;
            this.description = "";
            this.template = template;
            if (!selected) {
                selected = false;
            }
            this.selected = selected;

            this._reflectTemplate();
            this.watch("template", function(propName, oldValue, newValue) {
                if (oldValue !== newValue) {
                    self._reflectTemplate();
                }
            });
        },

        _reflectTemplate: function() {
            var self = this;
            this.props = new Observable(new Memory({
                data: self.template.get("propDefs").map(function(propDef) {
                    return new AppWizProperty(propDef);
                })
            }));
        }
    });
});

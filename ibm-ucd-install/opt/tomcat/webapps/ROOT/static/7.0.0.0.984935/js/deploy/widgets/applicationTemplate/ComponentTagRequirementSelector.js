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
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dijit/_Container",
        "dojo/_base/lang",
        "dojo/store/Memory",
        "dojo/store/Observable",
        "dojo/_base/declare",
        "dojo/dom-style",
        "deploy/widgets/ModelWidgetList",
        "deploy/widgets/applicationTemplate/ComponentTagRequirement",
        "js/webext/widgets/FormDelegates"
        ],
function(
    _TemplatedMixin,
    _Widget,
    _Container,
    lang,
    Memory,
    Observable,
    declare,
    domStyle,
    ModelWidgetList,
    ComponentTagRequirement,
    FormDelegates
) {
    /**
     * A widget for the display and selection of tag requirements.  Currently written for
     * components, but should be attractable for things other than components.
     */
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="tagRequirementSelector">' +
                '<div data-dojo-attach-point="tagRequirementAddAttach"></div>' +
                '<div class="tagRequirementList" data-dojo-attach-point="tagRequirementListAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);

            if (!this.value) {
                this.value = [];
            }
            //insures alignment is reasonable (top) if Tag Selectors have multiple things beneath them.
            this.rowClass="labelsAndValues-row labelsAndValues-row-verticalAlign-top";

            this.initRequirementList();
            if (!this.readOnly) {
                this.addRequirementSelector();
            }
        },

        /**
         * Initializes the data model around a list of tag requirements and
         * attaches observers.
         */
        initRequirementList: function() {
            this.requirementsModel = new Observable(new Memory({
                idProperty:"name"
            }));

            this.value.forEach(function(requirement) {
                this.addRequirement(requirement);
            },this);

            this.tagRequirementList = new ModelWidgetList({
                model: this.requirementsModel,
                widgetFactory: lang.hitch(this, this.createRequirementWidget)
            });

            this.tagRequirementList.placeAt(this.tagRequirementListAttach);
        },

        /**
         * Given a tag requirement, create a widget for it.
         */
        createRequirementWidget: function(requirement) {
            var self = this;
            var options = {
                readOnly: this.readOnly,
                deleteHandler: function() {
                    var objectId = self.requirementsModel.getIdentity(requirement);
                    self.requirementsModel.remove(objectId);
                }
            };
            lang.mixin(options, requirement);

            return new ComponentTagRequirement(options);
        },

        /**
         * Given a tag, add a tag requirement with useful defaults / normalizations. Idempotent, won't add duplicates.
         *
         * Expects requirement to have at *least* a tag object.
         */
        addRequirement: function(requirement) {
            if (!requirement.name) {
                requirement.name = requirement.tag.name;
            }
            if (!requirement.type) {
                requirement.type = "GREATER_THAN";
            }
            if (requirement.number === undefined) {
                requirement.number = 0;
            }
            this.requirementsModel.put(requirement);
        },

        addRequirementSelector: function() {
            var self = this;
            this.tagSelector = new FormDelegates().getDelegate("TagDropDown") ({
                idProperty: "name",
                searchAttr: "name",
                placeHolder: i18n("Select Component Tags"),
                allowNone: true,
                selectOnClick: true,
                objectType: "Component",
                onChange: function(tagName, tag) {
                    if (!tag) {
                        return;
                    }
                    self.addRequirement({tag:tag});
                    // XXX: Brittle -- Should be a WebextSelect method.
                    self.tagSelector.dropDown.set('value', '', undefined, undefined, '');
                }
            });

            self.tagSelector.placeAt(self.tagRequirementAddAttach);
        },

        /**
         * We define this so ColumnForms can poll for the value using their regular methodology.
         */
        _getValueAttr: function() {
            return this.tagRequirementList.getChildren().map(function(requirementWidget) {
                return requirementWidget.get("value");
            });
        }
    });
});
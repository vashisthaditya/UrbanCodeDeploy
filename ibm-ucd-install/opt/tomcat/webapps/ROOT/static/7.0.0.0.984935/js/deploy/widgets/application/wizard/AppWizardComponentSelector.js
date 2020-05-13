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
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/dom-attr",
        "dojo/dom-construct",
        "dojo/mouse",
        "dojo/on",
        "dojox/data/JsonRestStore",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/select/WebextSelect",
        "deploy/widgets/ModelWidgetList",
        "deploy/widgets/SimpleTag",
        "deploy/widgets/component/EditComponent"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Tooltip,
        declare,
        lang,
        domAttr,
        domConstruct,
        mouse,
        on,
        JsonRestStore,
        Dialog,
        WebextSelect,
        ModelWidgetList,
        SimpleTag,
        EditComponent
) {
    /**
     * A component selector, to satisfy a tag requirement. Pretty tightly integrated with ComponentPage
     *
     * Parameters:
     *      tagRequirement:
     *          A tag requirement json.
     *
     *      components:
     *          A model that we add and remove components from, and use to display components.
     */
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="appComponentSelector">' +
            '  <div data-dojo-attach-point="selectorControls" class="selectorControls">' +
            '    <div class="requirementLabel" data-dojo-attach-point="requirementLabel"></div>' +
            '    <div data-dojo-attach-point="createComponentNode" class="createComponent"></div>' +
            '    <div class="selectAttach" data-dojo-attach-point="selectAttach"></div>' +
            '  </div>' +
            '  <div data-dojo-attach-point="componentListAttach" class="componentList"></div>' +
            '  <div data-dojo-attach-point="requirementDescription" class="requirementDescription"></div>' +
            '</div>',

        postCreate: function() {
            var self = this;
            this.inherited(arguments);
            this.requirementLabel.textContent = this.tagRequirement.tag.name;
            domAttr.set(this.requirementLabel, "title", this.tagRequirement.tag.name);

            // Init select.
            var selectStore = new JsonRestStore({
                target: '/rest/deploy/component',
                idAttribute: 'id'
            });

            var resourceRoleSelect = new WebextSelect({
                placeHolder: i18n("Add Component"),
                allowNone: true,
                store: selectStore,
                searchAttr: "name",
                // Only show tags that fit the requirement
                defaultQuery: {
                    filterFields: "tags",
                    filterValue_tags: this.tagRequirement.tag.name,
                    filterType_tags: "eq",
                    filterClass_tags: "String"
                },
                pageSize: 10,
                onChange: function(id, component) {
                    if (!component) {
                        return;
                    }
                    // Add to model, clear select.
                    self.components.put(component);
                    // XXX: Brittle -- Should be a WebextSelect method.
                    resourceRoleSelect.dropDown.set('value', '', undefined, undefined, '');
                },
                formatDropDownLabel: function(labelDomNode, item) {
                    if (item.description) {
                        on(labelDomNode, mouse.enter, function(){
                            Tooltip.show(util.escape(item.description), this);
                        });
                        on(labelDomNode, mouse.leave, function(){
                            Tooltip.hide(this);
                        });
                    }
                }
            }).placeAt(this.selectAttach);

            // Init list. List contains all selected components that have the tag requirement
            function componentModelQuery(component) {
                return component.tags.some(function(tag) {
                    return tag.name === self.tagRequirement.tag.name;
                });
            }

            this.componentList = new ModelWidgetList({
                model: this.components,
                query: componentModelQuery,
                widgetFactory: lang.hitch(this, this.createComponentWidget)
            }).placeAt(this.componentListAttach);

            // Watch components and update requirement text accordingly
            this.components.query(componentModelQuery).observe(lang.hitch(this, this.updateRequirementDescription));

            // Currently only allow creating new components with templates that have the related tag.
            if (config.data.permissions[security.system.createComponentsFromTemplate]) {
                domConstruct.create("a", {
                        "class": "linkPointer",
                        innerHTML: i18n("Create Component")
                    }, this.createComponentNode);

                // Create new component click handler.
                on(this.createComponentNode, "click", lang.hitch(this, this.createComponent));
            }

            // Finish rendering
            this.updateRequirementDescription();
        },

        /**
         * Given a component, create a little display widget for it.
         */
        createComponentWidget: function(component) {
            var self = this;
            return new SimpleTag({
                name: component.name,
                description: component.description,
                color: "#00B2EF",
                readOnly: this.readOnly,
                deleteHandler: function() {
                    var objectId = self.components.getIdentity(component);
                    self.components.remove(objectId);
                }
            });
        },

        /**
         * Give the user a chance to make a new component from a template that has the right tagRequirement
         */
        createComponent: function() {
            var self = this;
            var editComponentDialog = new Dialog({
                title: i18n("Edit Component"),
                closable: true,
                draggable: true
            });

            var editComponent = new EditComponent({
                noRedirect: true,
                requireTemplateTag: this.tagRequirement.tag,
                callback: function(resultingComponent) {
                    editComponentDialog.hide();
                    editComponentDialog.destroy();

                    // Tag the component with the appropriate tag.
                    if (resultingComponent) {
                        self.components.add(resultingComponent);
                    }
                }
            });

            editComponent.placeAt(editComponentDialog);
            editComponentDialog.show();
        },

        /**
         * Show the requirement for the tag if the requirement hasn't been satisfied.
         */
        updateRequirementDescription: function() {
            // If requirement hasn't been fulfilled, show the requirement.
            // This makes an un-ensured assumption that this will be called after the componentList has been updated.
            if (this.isRequirementSatisfied()) {
                this.requirementDescription.style.display = "none";
            }
            else {
                var description = this.getRequirementDescription();
                this.requirementDescription.textContent = i18n("Components Required: ") + description;
                this.requirementDescription.style.display = "";
            }
        },

        isRequirementSatisfied: function() {
            var existingComponents = this.componentList.getChildren().length;

            // XXX: This logic shouldn't live here.
            var satisfied;
            if (this.tagRequirement.type === "EQUALS") {
                satisfied = (existingComponents === this.tagRequirement.number);
            }
            else if (this.tagRequirement.type === "GREATER_THAN") {
                satisfied = (existingComponents > this.tagRequirement.number);
            }
            else if (this.tagRequirement.type === "LESS_THAN") {
                satisfied = (existingComponents < this.tagRequirement.number);
            }
            else {
                throw "Unknown tag requirement type: " + this.tagRequirement.type;
            }

            return satisfied;
        },

        getRequirementDescription: function() {
            // XXX: This logic shouldn't live here. Create TagRequirement class?
            var number = this.tagRequirement.number;
            if (this.tagRequirement.type === "EQUALS") {
                return i18n("Needs %1 components with \"%2\" tag.", String(number),  this.tagRequirement.tag.name);
            }
            if (this.tagRequirement.type === "GREATER_THAN") {
                return i18n("Needs %1 or more components with \"%2\" tag.", String(number + 1),  this.tagRequirement.tag.name);
            }
            if (this.tagRequirement.type === "LESS_THAN") {
                return i18n("Needs %1 or fewer components with \"%2\" tag.", String(number - 1),  this.tagRequirement.tag.name);
            }
            throw "Unknown tag requirement type: " + this.tagRequirement.type;
        },

        getRequirementDescriptionWithTagName: function() {
            return this.getRequirementDescription();
        }
    });
});

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
/*global define */

define([
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dijit/form/Button",
        "dojo/_base/declare",
        "dojo/on",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/dom-style",
        "dojo/string",
        "dojox/html/entities",
        "deploy/widgets/multiEnvironmentComparison/MultiEnvironmentConfigComparisonConfig",
        "js/webext/widgets/ColumnForm",
        "js/util/blocker/_BlockerMixin"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        declare,
        on,
        domClass,
        domConstruct,
        domStyle,
        string,
        entities,
        MultiEnvironmentConfigComparisonConfig,
        ColumnForm,
        _BlockerMixin
) {
    return declare('deploy.widgets.multiEnvironmentComparison.EnvironmentComparisonSelector',  [_Widget, _TemplatedMixin, _BlockerMixin], {
        templateString:
            '<div class="environmentSelectionWidget">' +
            '   <div data-dojo-attach-point="environmentSelectionFormAttach"></div>' +
            '   <div data-dojo-attach-point="compareButtonAttach"></div>' +
            '</div>',

        comparisonEnvContainsReferenceError: i18n("Your comparison environments cannot contain the reference environment."),
        tooManyEnvironmentsError: i18n("Only ${maxAllowed} environments can be compared at a time. (You have selected ${numEnvs}.)"),

        postCreate: function(maxNumEnvs) {
            this.inherited(arguments);

            this.envSelectionForm = new ColumnForm({
                showButtons: false,
                validateFields: this.validateData.bind(this),
                onSubmit: this.submitNewConfig.bind(this),
                postSubmit: function(data){
                    if (this.callback !== undefined) {
                        this.callback(data);
                    }
                }.bind(this)
            });

            this.selectAll = this.generateSelectAllDOM();
            domConstruct.place(this.selectAll, this.envSelectionForm.formAttach,"after");

            this.envSelectionForm.addField(this.createReferenceEnvironmentField());
            this.envSelectionForm.addField(this.createInitialComparisonEnvironmentsField());
            this.envSelectionForm.placeAt(this.environmentSelectionFormAttach);

            var compareButton = this.createCompareButton().placeAt(this.compareButtonAttach);
        },

        selectAllTemplate:
            '<div>' +
            '    <div class="selectAllLabel">' + i18n('Select All') + '</div>' +
            '</div>',

        generateSelectAllDOM: function() {
            var selectAllDOM = domConstruct.toDom(this.selectAllTemplate);
            on(selectAllDOM, "click", function() {
                var refId = this.envSelectionForm.getData().refEnvSelect;
                var selected = this.dataManager.getAllEnvironments().filter(function(env){
                    return env.id !== refId;
                }.bind(this));
                var newField = this.createComparisonEnvironmentsField(selected, selected);

                this.envSelectionForm.removeField("compEnvSelect");
                this.envSelectionForm.addField(newField);
            }.bind(this));
            return selectAllDOM;
        },

        createReferenceEnvironmentField: function() {
            var data = this.dataManager;
            var envSelectField = ({
                name: "refEnvSelect",
                label: i18n("Reference Environment"),
                required: true,
                description: i18n("Select the environment to use as the base of the comparison."),
                type: "TableFilterSelect",
                value: (data.getReferenceEnvironment()) ? data.getReferenceEnvironment().id : undefined,
                data: data.getAllEnvironments(),
                onSetItem: function(value, item){
                    var form = this.envSelectionForm;
                    var compEnvSelectData = form.getData().compEnvSelect;
                    // Only act if a new environment was chosen and if the column field knows
                    // about comparison environment multi-selector.
                    if (value && form.fieldsArray.length>1) {
                        var prevSelection = compEnvSelectData.split(",");
                        var selected = data.getAllEnvironments().filter(function(env){
                            return env.id !== item.id && prevSelection.indexOf(env.id) > -1;
                        });
                        var available = data.getAllEnvironments().filter(function(prevVal){
                            return prevVal.id !== item.id;
                        });
                        var newField = this.createComparisonEnvironmentsField(selected, available);

                        form.removeField("compEnvSelect");
                        form.addField(newField);
                    }

                }.bind(this)
            });
            return envSelectField;
        },

        createComparisonEnvironmentsField: function(compEnvsSelected, availableEnvs) {
            var compEnvSelectField = ({
                name:"compEnvSelect",
                label: i18n("Comparison Environments"),
                required: true,
                description: i18n("Select the environments to compare."),
                type: "OrderedColoredMultiSelect",
                value: compEnvsSelected,
                data: availableEnvs,
                onAdd: function(value, item) {
                    domStyle.set(this.selectAll, "display", "none");
                }.bind(this),
                onRemove: function(value, item) {
                    if (this.envSelectionForm.getData().compEnvSelect){
                        domStyle.set(this.selectAll, "display", "none");
                    } else {
                        domStyle.set(this.selectAll, "display", "inline-block");
                    }
                }.bind(this)
            });

            if (!compEnvsSelected || compEnvsSelected.length === 0){
                domStyle.set(this.selectAll, "display", "inline-block");
            }
            return compEnvSelectField;
        },

        createInitialComparisonEnvironmentsField: function() {
            var data = this.dataManager;
            var selected = data.getOtherEnvironments() || undefined;
            var available = data.getAllEnvironments().filter(function(env){
                return env.id !== this.envSelectionForm.getData().refEnvSelect;
            }.bind(this));

            return this.createComparisonEnvironmentsField(selected, available);
        },

        createCompareButton: function() {
            var button = new Button({
                label: i18n("Compare Environments"),
                showTitle: false,
                onClick: function() {
                    this.envSelectionForm.submitForm();
                }.bind(this)
            });
            domClass.add(button.domNode, "idxButtonSpecial");
            return button;
        },

        validateData: function(data) {
            var errorMessages = [];
            var refEnvId = data.refEnvSelect;
            var compEnvs = data.compEnvSelect.split(",");

            if (dojo.indexOf(compEnvs, refEnvId) > -1){
                errorMessages.push(this.comparisonEnvContainsReferenceError);
            }

            var numEnvs = compEnvs.length + 1;
            var maxAllowed = this.dataManager.getConfig().MAX_ALLOWED_ENVIRONMENTS;
            if (numEnvs > maxAllowed) {
                errorMessages.push(
                    string.substitute(this.tooManyEnvironmentsError, {maxAllowed: maxAllowed, numEnvs:numEnvs}));
            }

            return errorMessages;
        },

        submitNewConfig: function(data) {
            var oldConfig = this.dataManager.getConfig();
            var compEnvs = data.compEnvSelect.split(",");

            var newConfig = new MultiEnvironmentConfigComparisonConfig({
                applicationId: oldConfig.getApplicationId(),
                referenceEnvironmentId: data.refEnvSelect,
                environmentIds: compEnvs
            });
            this.dataManager.setConfig(newConfig);
        }
    });
});
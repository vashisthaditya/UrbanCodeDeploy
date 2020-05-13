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
        "dojo/dom",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/dom-style",
        "dojo/on",
        "dojo/query",
        "dojox/html/entities",
        "deploy/widgets/multiEnvironmentComparison/EnvironmentComparisonSelector",
        "js/webext/widgets/Alert",
        "js/webext/widgets/Dialog"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        declare,
        dom,
        domClass,
        domConstruct,
        domStyle,
        on,
        query,
        entities,
        EnvironmentComparisonSelector,
        Alert,
        Dialog
) {
    return declare(  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="environmentPropertyComparisonConfigureCompare">' +
            '   <div data-dojo-attach-point="configurationButtonAttach"></div>' +
            '</div>',
        invalidConfigurationError: i18n("Please supply a valid configuration."),

        postCreate: function() {
            this.inherited(arguments);
            this.dataManager.on("environmentListDataAvailable", this.redraw.bind(this));
        },

        redraw: function(){
            domConstruct.empty(this.configurationButtonAttach);
            this.configurationButton = this.createConfigureComparisonButton();
            this.configurationButton.placeAt(this.configurationButtonAttach);

            if (!this.dataManager.getReferenceEnvironment() || !this.dataManager.getOtherEnvironments()){
                this.launchConfigurationDialog();
            }
        },

        createConfigureComparisonButton: function(){
            var compareButton = new Button({
                label: i18n("Select Environments"),
                showTitle: false,
                onClick: function() {
                    this.launchConfigurationDialog();
                }.bind(this)
            });
            domClass.add(compareButton.domNode, "idxButtonSpecial");

            return compareButton;
        },

        launchConfigurationDialog: function(){
            var newConfigurationDialog = new Dialog({
                    title: i18n("Select Environments"),
                    closable: true,
                    draggable: false
            });
            this.environmentSelector = new EnvironmentComparisonSelector({
                dataManager: this.dataManager,
                callback: function() {
                    newConfigurationDialog.hide();
                    newConfigurationDialog.destroy();
                }
            });

            this.environmentSelector.placeAt(newConfigurationDialog.containerNode);
            newConfigurationDialog.show();
        }
    });
});

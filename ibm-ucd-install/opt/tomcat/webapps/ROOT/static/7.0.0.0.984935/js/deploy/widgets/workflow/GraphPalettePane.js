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
/*global define, require, mxUtils */

define([
    "dojo/_base/declare",
    "dijit/layout/ContentPane",
    "dojo/_base/array",
    "dojo/_base/xhr",
    "dojo/_base/event",
    "dojo/request/xhr",
    "dojo/window",
    "dojo/_base/Deferred",
    "dojo/DeferredList",
    "js/webext/widgets/Alert",
    "js/webext/widgets/Dialog",
    "js/webext/widgets/ColumnForm",
    "js/webext/widgets/RadioButtonGroup",
    "js/webext/widgets/GenericConfirm",
    "deploy/widgets/process/ProcessIconsFormatter",
    "deploy/widgets/workflow/GraphPaletteWidget"
], function(
    declare,
    ContentPane,
    array,
    xhrBase,
    event,
    xhr,
    win,
    Deferred,
    DeferredList,
    Alert,
    Dialog,
    ColumnForm,
    RadioButtonGroup,
    GenericConfirm,
    ProcessIconsFormatter,
    GraphPaletteWidget) {
    /**
     * This widget provides some skeleton for mxGraph implementations, as well as utility methods.
     */
    return declare('deploy.widgets.workflow.GraphPalettePane', [ContentPane], {

        widget: null,

        postCreate: function() {
            this.inherited(arguments);

            this.domNode.style.padding = 0;
            this.domNode.style.overflow = "hidden";

            this.paletteWidget = new GraphPaletteWidget({
                editor: this.editor,
                searchBoxWidth: "98%",
                paletteBorder: 0
            });
            this.paletteWidget.startup();
            this.addChild(this.paletteWidget);
        },

        refreshStepPalette: function(config, openClipboard) {
            var self = this;
            if (config) {
                this.config = config;
                this.topStepDrawerLabel = config.topStepDrawerLabel || i18n("Utility Steps");
            }
            var dataSetPromise = xhr(this.config.url + "?rowsPerPage=10000&pageNumber=1", {
                handleAs: "json"
            }).then(function(data) {
                self.data = data;
            });

            new DeferredList([dataSetPromise, this.resizePalettePromise]).then(function() {
                if (self.spinner && self.spinner.parentNode) {
                    self.spinner.parentNode.removeChild(self.spinner);
                }

                //For firstDayWizard, inject a list of components, as if from server
                //to be picked up in createPaletteMap->flatten
                if (self.editor.mode === 'firstDayWizard') {
                    self.data = self.data.concat(
                        self.editor.firstDayWizardModel.getComponentsForApplicationProcessNav()
                    );
                }

                // flatten steps/populate palettes
                var paletteMap = self.paletteWidget.createPaletteMap(
                    self.topStepDrawerLabel,
                    self.lazyChildrenDrawer,
                    self.data);
                self.paletteWidget.populateTopLevelDrawers(
                    paletteMap,
                    self.topStepDrawerLabel,
                    self.lazyChildrenDrawer,
                    openClipboard);
                self.paletteDialog.paletteWidget.populateTopLevelDrawers(
                    paletteMap,
                    self.topStepDrawerLabel,
                    self.lazyChildrenDrawer,
                    openClipboard);
                self.myPane.domNode.style.visibility = "visible";
            });
        },

        resize: function(dim) {
            this.inherited(arguments);
            this.paletteWidget.tree.domNode.style.height = dim.h - 26 + "px";
            this.paletteWidget.tree.domNode.style.width = dim.w + "px";
            this.paletteWidget.tree.resize();
        }

    });
});

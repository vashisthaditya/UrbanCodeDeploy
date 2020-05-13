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
    "dijit/TooltipDialog",
    "dijit/popup",
    "dojo/_base/declare",
    "dojo/on",
    "dojo/sniff",
    "dojo/string",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/dom-geometry",
    "dojo/dom-style",
    "dojox/html/entities",
    "deploy/widgets/IconLegend",
    "deploy/widgets/multiEnvironmentComparison/PropertyComparison",
    "js/util/blocker/_BlockerMixin"
], function(
    _TemplatedMixin,
    _Widget,
    TooltipDialog,
    popup,
    declare,
    on,
    has,
    string,
    dom,
    domClass,
    domConstruct,
    domGeom,
    domStyle,
    entities,
    IconLegend,
    PropertyComparison,
    _BlockerMixin
) {
    return declare([_Widget, _TemplatedMixin, _BlockerMixin], {
        iconData: {
            match: {iconClass: "match", legend: i18n("Equal")},
            noMatch: {iconClass: "no-match", legend: i18n("Not equal")},
            missing: {iconClass: "missing", legend: i18n("No property")},
            missingRequired: {iconClass: "no-value-required", legend: i18n("Missing required value")},
            secure: {iconClass: "secure", legend: i18n("Secure property")}
        },

        notConfiguredMessage: i18n("Comparison not yet configured"),
        dataErrorMessage: i18n("An error has occurred"),
        noPropertyErrorMessage: i18n("There are no properties to compare in the selected environments"),
        headerRotation: Math.PI/6,

        templateString:
            '<div class="environmentPropertyComparisonGrid">' +
            '    <div class="notReadyMessage" data-dojo-attach-point="notReadyMessageAttach"></div>' +
            '    <div data-dojo-attach-point="downloadCSVLink" class="downloadCSV"></div>' +
            '    <div data-dojo-attach-point="horizontalScrollContainer" class="horizontalScrollContainer">' +
            '      <div data-dojo-attach-point="environmentHeadersContainer">' +
            '          <ul class="environmentHeaders" data-dojo-attach-point="environmentHeaders"></ul>' +
            '          <div class="environmentHeadersVerticalSpacer" data-dojo-attach-point="headerSpacer" style="display:none;"></div>' +
            '      </div>' +
            '      <div class="body" data-dojo-attach-point="body"></div>' +
            '    </div>' +
            '</div>',

        postCreate: function() {
            this.inherited(arguments);

            this._actualPropertyNameWidth = 240; //px
            this._actualPropertyNameMargin = 20; //px
            this._actualValueWidth = 280; //px
            this.maxIconColWidth = 140; //px
            this.minIconColWidth = 70; //px
            this._actualIconColMargin = 10; //px

            this.environmentHeadersFloating = false;
            this.setUpEventListeners();

            this.showNotReadyMessage(this.notConfiguredMessage);

            if (this.dataManager.isAllPropertyDataReady()) {
                this.redraw();
            }
        },

        setUpEventListeners: function() {
            // Double scroll handlers, because scroll doesn't bubble
            this.docScrollHandler = on(this.domNode.ownerDocument, "scroll", this.manageEnvironmentHeaders.bind(this));
            this.scrollHandler = on(this.horizontalScrollContainer, "scroll", this.manageEnvironmentHeaders.bind(this));

            // redraw when new data is available
            this.dataManager.on("allPropertyDataAvailable", this.redraw.bind(this));
            this.dataManager.on("allPropertyDataError, environmentListDataError", function() {
                this.showNotReadyMessage(this.dataErrorMessage);
            }.bind(this));
            this.dataManager.on("allPropertyDataLoading", this.block.bind(this));

            // Dojo provides the delegated target to the event handler as
            // "this". We do a little binding backflip to accommodate.
            var setupPopover = this.setupPopover.bind(this);
            this.on(".property-cell:click", function(e) {
                var propCell = this;
                setupPopover(propCell);
            });
        },

        hideNotReadyMessage: function() {
            domStyle.set(this.notReadyMessageAttach, "display", "none");
        },

        // Reset DOM for new draw
        _erase: function() {
            domConstruct.empty(this.environmentHeaders);
            domConstruct.empty(this.downloadCSVLink);
            domConstruct.empty(this.body);
            this.hideNotReadyMessage();
            this.unblock();
        },

        addDownloadCSVIcon: function() {
            var hrefForCsv = this.dataManager.getCsvDataLink();
            var csvLink = util.createDownloadAnchor({
                href: hrefForCsv
            }, this.downloadCSVLink);
            var csvIcon = domConstruct.create("div", {
                className: "linkPointer general-icon download-icon envCompareDownloadCSV",
                title: i18n("Download CSV"),
                alt: i18n("Download CSV")
            }, csvLink);
            var nameDiv = '<div class="downloadCSVText">' + i18n("Download") + "</div>";
            domConstruct.place(nameDiv, csvIcon, "before");
        },

        showNotReadyMessage: function(message) {
            this._erase();

            this.notReadyMessageAttach.innerText = message;
            domStyle.set(this.notReadyMessageAttach, "display", "block");
        },

         redraw:function() {
            if (this.dataManager.areThereAnyProperties()) {
                this._drawGrid();
            } else {
                this.showNotReadyMessage(this.noPropertyErrorMessage);
            }
         },

        _drawGrid: function() {
            this._erase();

            this.addDownloadCSVIcon();
            this.determineWidths();
            var environmentHeaderDOMs = this.generateHeaderDOMs();
            var bodyDOMs = this.generateBodyDOMs();

            this.environmentHeaders.style.paddingLeft =
                (this._actualPropertyNameWidth + this._actualPropertyNameMargin) + "px";

            environmentHeaderDOMs.forEach(function(environmentHeaderDOM) {
                domConstruct.place(environmentHeaderDOM, this.environmentHeaders);
            }, this);

            this._rotateAndRepositionHeaders();

            bodyDOMs.forEach(function(bodyDOM) {
                domConstruct.place(bodyDOM, this.body);
            }, this);

            this._applyHorizontalOverflow();
        },

        _rotateHeaders:function() {
            var rotate = this.headerRotation;
            dojo.query(".environmentPropertyComparisonGrid li.environmentHeader > div").forEach(function(node) {
                domStyle.set(node, "-ms-transform", "rotate(" + rotate + "rad)");
                domStyle.set(node, "transform", "rotate(" + rotate + "rad)");
            });

        },

        _translateHeaders: function() {
            dojo.query(".environmentPropertyComparisonGrid li.environmentHeader > div").forEach(function(node) {
                var width = domGeom.getContentBox(node).w * Math.cos(this.headerRotation);
                var xTrans = width - domStyle.get(node.parentElement, "width")/2;
                var prevTransform = domStyle.get(node, "-ms-transform");
                domStyle.set(node, "-ms-transform", "translate(-" + xTrans + "px, 0px)" + prevTransform);
                domStyle.set(node, "-ms-transform-origin", "bottom left");
                domStyle.set(node, "transform", "translate(-" + xTrans + "px, 0px)" + prevTransform);
                domStyle.set(node, "transform-origin", "bottom left");
            }.bind(this));
        },

        /**
        *
        * This method handles the overall positioning of the environment headers. 1) Rotate them,
        * because we need to look at the actual height (width of the rendered string * sin of the
        * rotation angle) of the tilted environment headers 2) Move them up using a negative margin
        * if necessary to minimize white space at the top of the environment headers. 3) Translate
        * them to the center of the underlying bar.
        *
        **/
        _rotateAndRepositionHeaders: function() {
            var maxHeight = 0;
            this._rotateHeaders();

            dojo.query(".environmentPropertyComparisonGrid li.environmentHeader > div > span").forEach(function(node) {
                var width = domGeom.getContentBox(node).w;
                maxHeight = Math.max(maxHeight, width * Math.sin(this.headerRotation));
            }.bind(this));

            var curHeight = domStyle.get(this.environmentHeaders, "height");
            if (maxHeight + 35 < curHeight) {
                var margin = (maxHeight - curHeight + 35);
                dojo.query(".environmentHeaders>li").forEach(function (node){
                    domStyle.set(node, "margin-top", margin + "px");
                });
            }

            domStyle.set(this.headerSpacer, "height", this.environmentHeaders.clientHeight + "px");
            this._translateHeaders(Math.min());
        },

        /**
         * Handles docking and undocking of environment headers based their position in the client window.
         */
        manageEnvironmentHeaders: function() {
            var environmentHeadersYValue = this.getEnvironmentHeadersYValue();
            if (this.environmentHeadersFloating) {
                if (environmentHeadersYValue > 0) {
                    this.dockEnvironmentHeaders();
                } else {
                    this.adjustFloatingEnvironmentHeadersXPosition();
                }
            } else if (environmentHeadersYValue < 0) {
                this.floatEnvironmentHeaders();
                this.adjustFloatingEnvironmentHeadersXPosition();
            }
        },

        /**
         * If the headers are docked then they are used as reference.
         * If they are not then the y value is taken from the spacer
         * which is placed where the headers would have been.
         *
         * getBoundingClientRect() returns the coordinates of the 4 corners of the
         * div as they appear in the browser window (top of the screen being 0).
         *
         * @return {int} [The Y value of headers as if they are docked to the list at all times]
         */
        getEnvironmentHeadersYValue: function() {
            if (this.environmentHeadersFloating) {
                return this.headerSpacer.getBoundingClientRect().top;
            }
            return this.environmentHeaders.getBoundingClientRect().top;
        },

        floatEnvironmentHeaders: function() {
            this.environmentHeadersFloating = true;
            this.headerSpacer.style.display = "";
            domClass.add(this.environmentHeaders, "environmentHeadersFloating");
        },

        dockEnvironmentHeaders: function() {
            this.environmentHeadersFloating = false;
            this.headerSpacer.style.display = "none";
            domClass.remove(this.environmentHeaders, "environmentHeadersFloating");
        },

        /**
         * If headers are floating and window has horizontal scroll the environment
         * headers should continue to line up with the contents of the page.
         */
        adjustFloatingEnvironmentHeadersXPosition: function() {
            var environmentHeadersXValue = this.body.getBoundingClientRect().left - 1;
            this.environmentHeaders.style.left = environmentHeadersXValue + "px";
        },

        /**
         * We want to keep the icon column widths within a certain range, while
         * respecting requirements for the first two column widths.  If the
         * window is small enough, we may decide to overflow.  This method
         * performs some small maths to achieve that.
         */
        determineWidths: function() {
            var availableWidth = this.domNode.offsetWidth;
            var numEnvironments = this.dataManager.getOtherEnvironments().length;

            var availableForIconCols = availableWidth - this._actualPropertyNameWidth - this._actualPropertyNameMargin - this._actualValueWidth;
            var availableForIconCol = availableForIconCols / numEnvironments;

            var actualIconColWidth = Math.min(this.maxIconColWidth, availableForIconCol);
            actualIconColWidth = Math.max(this.minIconColWidth, actualIconColWidth) - this._actualIconColMargin;

            this._actualIconColWidth = actualIconColWidth;
        },

        generateHeaderDOMs: function() {
            var headerDOMs = [];
            headerDOMs.push(this.generateEnvironmentHeaderCellDOM(
                this.dataManager.getReferenceEnvironment(), this._actualValueWidth - 22));

            this.dataManager.getOtherEnvironments().forEach(function(environment) {
                headerDOMs.push(this.generateEnvironmentHeaderCellDOM(environment, this._actualIconColWidth - 10));
            },this);
            return headerDOMs;
        },

        environmentHeaderTemplate:
            '<li class="environmentHeader" style="width:${width}px; border-color:${color}">' +
            '    <div class="${divClass}">' +
            '        <span title="${title}">${name}</span>' +
            '    </div>' +
            '</li>',

        generateEnvironmentHeaderCellDOM: function(environment, width) {
            var isReferenceEnvironment = this.dataManager.getReferenceEnvironment().id === environment.id;
            return this.templateToDom(this.environmentHeaderTemplate, {
                width: width,
                color: environment.color,
                name: environment.name,
                title: environment.description ? environment.name + ':\n' + environment.description : environment.name,
                divClass: isReferenceEnvironment ? "referenceHeaderDiv" : "headerDiv"
            });
        },

        generateBodyDOMs: function() {
            var propSheetDefData = this.dataManager.getPropSheetDefs();

            var prevEnvGroupDom;
            var bodyDoms = [];
            propSheetDefData.forEach(function(propSheetDef) {
                if (!propSheetDef.componentId){
                    if (!prevEnvGroupDom){
                        prevEnvGroupDom = this.generatePropSheetRowGroupDOM(propSheetDef);
                        bodyDoms.push(prevEnvGroupDom);
                    } else {
                        bodyDoms.push(this.generatePropSheetRowGroupDOM(propSheetDef,prevEnvGroupDom));
                    }
                } else {
                    bodyDoms.push(this.generatePropSheetRowGroupDOM(propSheetDef));
                }
            }, this);
            return bodyDoms;
        },

        propSheetRowGroupTemplate: '<div class="propSheetRowGroup"></div>',

        emptyPropSheetRowTemplate: '<div class="propSheetRowEmpty">' + i18n("No properties") + '</div>',

        generatePropSheetRowGroupDOM: function(propSheetDef, prevDom) {
            var propSheetRowGroupDOM;
            if (!prevDom){
                propSheetRowGroupDOM = this.templateToDom(this.propSheetRowGroupTemplate, {});
            } else {
                propSheetRowGroupDOM = prevDom;
            }
            if (propSheetDef.componentName){
                domConstruct.place(this.generatePropSheetHeaderDOM(propSheetDef), propSheetRowGroupDOM);
                if (propSheetDef.propDefs.length === 0) {
                    domConstruct.place(this.emptyPropSheetRowTemplate, propSheetRowGroupDOM);
                }
            }
            

            propSheetDef.propDefs.forEach(function(propDef) {
                domConstruct.place(this.generatePropertyRowDOM(propDef), propSheetRowGroupDOM);
            }, this);

            return propSheetRowGroupDOM;
        },

        propSheetHeaderTemplate:
            '<div class="propSheetRowGroupHeader">' +
            '    <div class="generalIcon componentIcon"></div>' +
            '    <div class="propSheetRowGroupHeaderLabel" style="width:${width}px;">${name}</div>' +
            '</div><div></div>',

        generatePropSheetHeaderDOM: function(propSheetDef) {
            if (!propSheetDef.componentName) {
                return "";
            }

            return this.templateToDom(this.propSheetHeaderTemplate, {
                width: this._actualPropertyNameWidth,
                name: entities.encode(propSheetDef.componentName),
                title: entities.encode(propSheetDef.componentName)
            });
        },

        propertyRowTemplate:
            '<div class="propertyRow">' +
            '    <div class="rowHeader" title="${title}" style="width:${rowHeaderWidth}px;">${label}</div>' +
            '</div>',

        generatePropertyRowDOM: function(propDef) {
            var propertyRowDOM = this.templateToDom(this.propertyRowTemplate, {
                rowHeaderWidth: this._actualPropertyNameWidth,
                label: entities.encode(propDef.label || propDef.name),
                title: entities.encode(propDef.description || propDef.label || propDef.name)
            });

            var referenceEnvironment = this.dataManager.getReferenceEnvironment();
            domConstruct.place(this.generateReferencePropertyCell(propDef, referenceEnvironment), propertyRowDOM);

            var environments = this.dataManager.getOtherEnvironments();
            environments.forEach(function(environment) {
                domConstruct.place(
                    this.generatePropertyRowCell(propDef, environment, referenceEnvironment),
                    propertyRowDOM);
            }, this);

            return propertyRowDOM;
        },

        referencePropertyCellTemplate: '<div class="referenceValue" style="width:${width}px;">${value}</div>',

        generateReferencePropertyCell: function(propDef, referenceEnvironment) {
            var referenceProp = this.dataManager.getProperty(propDef, referenceEnvironment);

            return this.templateToDom(this.referencePropertyCellTemplate, {
                width: this._actualValueWidth,
                value: entities.encode(referenceProp.value || "")
            });
        },

        propertyRowCellTemplate:
            '<div class="property-cell" style="width:${width}px;">' +
                '<div class="${iconClass}"></div>' +
                '<div class="show-data" style="display:none;"></div>' +
            '</div>',

        generatePropertyRowCell: function(propDef, environment, referenceEnvironment) {
            var envProp = this.dataManager.getProperty(propDef, environment);
            var referenceProp = this.dataManager.getProperty(propDef, referenceEnvironment);

            // All the code in this module is here to enable these if statements.
            var icon = {iconClass: ""};
            if ((!envProp || !envProp.value) && propDef.required) {
                icon = this.iconData.missingRequired;
            } else if (propDef.type === "SECURE" || envProp.secure) {
                icon = this.iconData.secure;
            } else if (envProp.value === undefined) {
                icon = this.iconData.missing;
            } else if (envProp.value === referenceProp.value) {
                icon = this.iconData.match;
            } else if (envProp.value !== referenceProp.value) {
                icon = this.iconData.noMatch;
            }

            var propCellDOM = this.templateToDom(this.propertyRowCellTemplate, {
                iconClass: icon.iconClass,
                width: this._actualIconColWidth - 1 // Trim border-width
            });

            propCellDOM.propDef = propDef;
            propCellDOM.environment = environment;
            propCellDOM.referenceEnvironment = referenceEnvironment;

            return propCellDOM;
        },

        _applyHorizontalOverflow: function() {
            domClass.toggle(this.domNode, "overflowed", this._isOverflowing());
        },

        _isOverflowing: function() {
            return (this.horizontalScrollContainer.clientWidth < this.horizontalScrollContainer.scrollWidth);
        },


        setupPopover: function(propCell) {
            var comparison = new PropertyComparison({
                dataManager: this.dataManager,
                propDef: propCell.propDef,
                environment: propCell.environment,
                referenceEnvironment: propCell.referenceEnvironment
            });

            var tooltip = new TooltipDialog({
                content: comparison
            });

            popup.open({
                parent: this,
                popup: tooltip,
                around: propCell,
                orient: ["above-centered", "before-centered"],
                onCancel: function() {
                    popup.close(tooltip);
                },
                onClose: function() {
                    tooltip.destroyRecursive();
                }
            });

            // Watch for clicks outside of the popup
            var localBodyClickHandlerReference = on(this.domNode.ownerDocument, "click", function(e) {
                // Ignore if the user clicked the cell. (This always happens the first time)
                if (dom.isDescendant(e.target, propCell)) {
                    return;
                }
                // Ignore if user clicked the tooltip itself.
                if (dom.isDescendant(e.target, tooltip.domNode)) {
                    return;
                }

                popup.close(tooltip);
                localBodyClickHandlerReference.remove();
            }.bind(this));

            this.bodyClickHandler = localBodyClickHandlerReference;
        },

        templateToDom: function(template, substituteHash) {
            var html = string.substitute(template, substituteHash);
            return domConstruct.toDom(html);
        },

        /**
         * Creates and returns a new unattached Legend Widget that the caller can place themselves.
         */
        createLegendWidget: function() {
            var i = this.iconData;
            return new IconLegend({
                iconData: [
                    [ i.match, i.noMatch ],
                    [ i.missing, i.missingRequired ],
                    [ i.secure ]
                ],
                staticIconClass: "comparison-icon"
            });
        },

        destroy: function() {
            this.inherited(arguments);
            if (this.bodyClickHandler) {
                this.bodyClickHandler.remove();
            }

            if (this.docScrollHandler) {
                this.docScrollHandler.remove();
            }

            if (this.scrollHandler) {
                this.scrollHandler.remove();
            }
        }
    });
});

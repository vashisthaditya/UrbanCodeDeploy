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
/*global bootstrap, appState: true, js, util */
/*global define */
define([
        "dojo/_base/declare",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dojo/dom-attr",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/dom-style",
        "dojo/on",
        "dijit/form/TextBox"
        ],
function(
        declare,
        _WidgetBase,
        _TemplatedMixin,
        domAttr,
        domClass,
        domConstruct,
        domStyle,
        on,
        TextBox
) {

    /**
     *
     * Create a Page Number control,
     *
     */
    return declare(
        [_WidgetBase, _TemplatedMixin],
        {

            templateString:
                '<span style="display: inline-block; position:absolute; right: 6px; bottom: 0px;">'+
                    '<div data-dojo-attach-point="pageNumbers" class="pageNumbers"></div>'+
                '</span>',

            // DOM Nodes
            pageNumbers: null,
            pageCountLabel: null,
            pageBox: null, // input for skip to page number
            firstImg: null,
            backImg: null,
            nextImg: null,
            lastImg: null,

            // Fields
            disabled: false,
            itemsPerPage: 50,
            totalItems: 0,
            pageNumber: null,
            totalPages: null,
            startItem: 0,
    //        pageOptions: [10, 25, 50, 100, 250],

            /**
             *
             */
            buildRendering: function() {
                var self = this;
                self.inherited("buildRendering", arguments);

                self.totalPages = Math.ceil(self.totalItems/self.itemsPerPage);

                //
                // Create Back Arrows
                //

                var firstLink = domConstruct.create("a", {"class":"linkPointer pagerItem"});
                on(firstLink, "click", function() { self.setPageNumber(0); });
                self._setupEnterToDoClick(firstLink);
                self.firstImg = self._createImg("arrow_fastBackwards", {"alt":"first page"}, firstLink);
                self.pageNumbers.appendChild(firstLink);

                var previousLink = domConstruct.create("a", {"class":"linkPointer pagerItem"});
                on(previousLink, "click", function() { self.setPageNumber(self.pageNumber-1); });
                self._setupEnterToDoClick(previousLink);
                self.backImg = self._createImg("arrow_backwards", {"alt":"previous page"}, previousLink);
                self.pageNumbers.appendChild(previousLink);

                //
                // Create Page Number Input
                //

                self.pageBox = new TextBox({
                    title: i18n("current page"),
                    name: "page",
                    value: '',
                    style: {"width": "40px"},
                    onKeyPress: function(event) {
                        if (event.charOrCode === 13) {
                            var newPage = parseInt(self.pageBox.textbox.value, 10) - 1;
                            if (isNaN(newPage)) {
                                // revert page number box
                                this.set("value", isNaN(self.pageNumber) ? '' : self.pageNumber + 1);
                            }
                            else if (newPage !== self.pageNumber) {
                                self.setPageNumber(newPage);
                            }
                        }
                    },
                    onFocus: function() {
                        self.pageBox.textbox.select();
                    }
                });
                self.pageBox.textbox.style.textAlign = "center";
                self.pageBox.placeAt(self.pageNumbers);

                self.pageCountLabel = domConstruct.create("span", {"class":"pagerItem"}, self.pageNumbers);

                //
                // Create Forward Arrows
                //

                var nextLink = domConstruct.create("a", {"class":"linkPointer pagerItem"});
                on(nextLink, "click", function() { self.setPageNumber(self.pageNumber + 1); });
                self._setupEnterToDoClick(nextLink);
                self.nextImg = self._createImg("arrow_forward", {"alt":i18n("next page")}, nextLink);
                self.pageNumbers.appendChild(nextLink);

                var lastLink = domConstruct.create("a", {"class":"linkPointer pagerItem"});
                on(lastLink, "click", function() { self.setPageNumber(self.totalPages - 1); });
                self._setupEnterToDoClick(lastLink);
                self.lastImg = self._createImg("arrow_fastForward", {"alt":i18n("last page")}, lastLink);
                self.pageNumbers.appendChild(lastLink);

                // initialize controls
                self.updateRendering();
            },

            setItemsPerPage: function(itemsPerPage) {
                var self = this;

                self.itemsPerPage = itemsPerPage;
                self.pageNumber = Math.ceil(self.startRecord/self.itemsPerPage);
                self.totalPages = Math.ceil(self.totalItems/self.itemsPerPage);

                self.updateRendering();
            },

            setTotalItems: function(totalItems) {
                var self = this;
                self.totalItems = totalItems;

                self.totalPages = Math.ceil(self.totalItems/self.itemsPerPage);

                var pageDigits = String(self.totalPages).length;
                var charWidth = 10; // 10 pixels per digit
                domStyle.set(self.pageBox.domNode, {"width": (charWidth*(pageDigits+2))+"px"});

                // run through re-rending to cap page number to valid range and update controls
                self.setPageNumber(self.pageNumber);
            },

            /**
             * Updates the UI of the pager to match the current configuration selecting the given page number.
             */
            setPageNumber: function(pageNum) {
                var self = this;
                pageNum = Number(pageNum);

                if (self.disabled || isNaN(pageNum)) {
                    return;
                }

                pageNum = Math.min(pageNum, self.totalPages - 1);
                pageNum = Math.max(pageNum, 0);

                var oldPageNumber = self.pageNumber;
                self.pageNumber = pageNum;
                self.startItem = self.pageNumber * self.itemsPerPage;
                if (isNaN(self.startItem)) {
                    self.startItem = 0;
                }

                // redraw
                self.updateRendering();

                if (oldPageNumber !== self.pageNumber) {
                    self.onPageChange();
                }
            },

            /**
             * Update all UI components and enable/disable controls as appropriate
             */
            updateRendering: function() {
                var self = this;

                // hide all controls if there are no items being paginated
                if (self.totalItems) {
                    domStyle.set(self.pageNumbers, {"display":"block"});
                }
                else {
                    domStyle.set(self.pageNumbers, {"display":"none"});
                }

                // disable/enable back page links
                var canBack = !isNaN(self.pageNumber) && (self.pageNumber > 0);
                self._enablePaggerControl(self.firstImg, canBack);
                self._enablePaggerControl(self.backImg, canBack);
                // disable/enable forward page links
                var canForward = !isNaN(self.pageNumber) && (self.pageNumber < self.totalPages - 1);
                self._enablePaggerControl(self.nextImg, canForward);
                self._enablePaggerControl(self.lastImg, canForward);

                // update the current-page text box
                self.pageBox.set("value", isNaN(self.pageNumber) ? '' : self.pageNumber + 1);
                self.pageCountLabel.innerHTML = "/ "+self.totalPages;
            },

            /**
             * Update the styling and alt text (if present) of the given image and it's parent link
             * to reflect the given enabled status.  If it is disabled:
             * 1) the arrow_disabled class will be applied
             * 2) the alt text will append "disabled"
             * 3) the iamge's parent link will have linkPionter removed
             * Otherwise the reverse is done.
             *
             * @param img the image for the control, assumes that parent is the link for the control
             * @param enabled, if the image should be enabled (undefined or any true value will enable it)
             *
             */
            _enablePaggerControl: function(img, enabled) {
                enabled = (enabled === undefined || !!enabled);

                var link = img.parentNode;
                link.tabIndex =  enabled ? 0 : -1;
                domClass.toggle(img, "arrow_disabled", !enabled);
                domClass.toggle(link, "linkPointer", enabled);

                // update alt text
                var altText = domAttr.get(img, 'alt');
                if (!!altText) {
                    if (enabled) {
                        domAttr.set(img, 'alt', altText.replace(/page disabled$/, 'page'));
                    }
                    else {
                        domAttr.set(img, 'alt', altText.replace(/page$/, 'page disabled'));
                    }
                }
            },

            /**
             * Event seam for listeners to detect when controls are manipulated.
             * Fires whenever the page selection changes.
             */
            onPageChange: function() {
                // user should override this method
            },

            /**
             * Convenience method for creating img elements using the blankGif with a given css class name
             *
             * @param imgClass
             * @param attributes (Optional)
             * @param refNode (Optional)
             * @param pos  (Optional)
             * @return a new img Element using the dojo.config.blankGif src a ttribute
             */
            _createImg: function(imgClass, attributes, refNode, pos) {

                if (!attributes) {
                    attributes = {};
                }
                attributes.src = this._blankGif;

                var result = domConstruct.create('img', attributes, refNode, pos);
                domClass.add(result, imgClass);
                return result;
            },

            /**
             * Treat an enter key press same as clicking the target
             * @param element the element to map enter keystroke to click event
             * @return the listener link (used for dojo.disconnect(link))
             */
            _setupEnterToDoClick: function (element) {
                return on(element, "keypress", function (event) {
                    if (event.charOrCode === 13) {
                        if (document.createEvent) {
                            var clickEvent = document.createEvent("HTMLEvents");
                            clickEvent.initEvent("click", true, true);
                            this.dispatchEvent(clickEvent);
                        }
                        else if (this.fireEvent) {
                            this.fireEvent("onclick");
                        }
                        else {
                            // not supported?
                            console.debug('Creating events is not supported in this browser');
                        }
                    }
                });
            }
        }
    );
});
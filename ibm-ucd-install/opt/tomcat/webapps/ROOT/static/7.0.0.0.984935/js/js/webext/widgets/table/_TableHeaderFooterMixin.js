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
        "dojo/_base/declare",
        "dojo/_base/array",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/dom-style",
        "dojo/keys",
        "dojo/on",
        "dojox/html/entities",
        "dijit/form/Select",
        "dijit/form/TextBox",
        "dijit/Tooltip",
        "dijit/_WidgetBase"
        ],
function(
        declare,
        array,
        domClass,
        domConstruct,
        domStyle,
        keys,
        on,
        entities,
        Select,
        TextBox,
        Tooltip,
        _WidgetBase
) {
    return declare(null,
        {
        totalPages: undefined,
        pageOptions: [10, 25, 50, 100, 250],
        prevPage: undefined,

        /**
         *
         */
        drawHeadings: function() {
            var self = this;
            domConstruct.empty(this.theadAttach);

            if (this.draggable) {
                domConstruct.create("th", {}, this.theadAttach);
            }

            array.forEach(this.columns, function(column) {
                var columnHeading = domConstruct.create("th");
                if (column.style) {
                    domStyle.set(columnHeading, column.style);
                }
                if (column.styleHeading) {
                    domStyle.set(columnHeading, column.styleHeading);
                }
                if (column.width !== undefined) {
                    columnHeading.style.width = column.width;
                }

                if (column['class']) {
                    domClass.add(columnHeading,column['class']);
                }

                if (column.headingFormatter) {
                    var formatterResult = column.headingFormatter(columnHeading);

                    // Handle the type of the result of the formatter, and use the appropriate
                    // method to add the result to the cell.
                    if (formatterResult instanceof _WidgetBase) {
                        formatterResult.placeAt(columnHeading);
                    }
                    else if ((typeof formatterResult === "object") && (formatterResult.nodeType === 1) &&
                             (typeof formatterResult.style === "object") && (typeof formatterResult.ownerDocument ==="object")) {
                        columnHeading.appendChild(formatterResult);
                    }
                    else if (formatterResult !== undefined && typeof formatterResult !== "object") {
                        columnHeading.innerHTML = entities.encode(String(formatterResult));
                    }
                }
                else {
                    // Wrap the contents of the cell in a relatively positioned div to allow absolute
                    // positioning of child elements.
                    var columnHeadingWrapper = domConstruct.create("div", {
                        "style": {"position":"relative"}
                    });

                    var columnLabel = domConstruct.create("span");
                    columnLabel.innerHTML = entities.encode(String(column.name));
                    columnHeadingWrapper.appendChild(columnLabel);

                    if (column.description) {
                        var helpImage = self._createImg("helpImage", columnHeadingWrapper);
                        var helpTip = new Tooltip({
                            connectId: [helpImage],
                            label: column.description,
                            showDelay: 200,
                            position: ["after", "above", "below", "before"]
                        });
                    }

                    if (column.orderField) {
                        // make the columnHeadingWrapper focusable
                        domClass.add(columnHeading, "sortableColumn");
                        columnHeadingWrapper.tabIndex = 0;

                        var matchesTopField = column.orderField === self.orderField
                            || (self.orderField instanceof Array && self.orderField.length > 0 && column.orderField === self.orderField[0]);
                        if (matchesTopField) {
                            if (self.sortImageContainer && self.sortImageContainer.parentNode) {
                                self.sortImageContainer.parentNode.removeChild(self.sortImageContainer);
                                self.sortImageContainer = undefined;
                            }

                            var sortImageContainer = domConstruct.create("div", {
                                "class":"sortImageWrapper"
                            });

                            // reflect current sort state
                            var sortImage = self._createImg("sortImage", sortImageContainer);
                            domClass.toggle(sortImage, "arrow_asc", self.sortType === "asc");
                            domClass.toggle(sortImage, "arrow_desc", self.sortType === "desc");
                            sortImage.alt = ( self.sortType === "asc" ? 'ascending' : 'descending');

                            sortImageContainer.appendChild(sortImage);
                            columnHeadingWrapper.appendChild(sortImageContainer);

                            self.sortImageContainer = sortImageContainer;
                        }

                        var doSort = function() {
                            // Destroy an existing sort image if one exists.
                            if (self.sortImageContainer) {
                                self.sortImageContainer.parentNode.removeChild(self.sortImageContainer);
                                self.sortImageContainer = null;
                            }

                            var sortImageContainer = domConstruct.create("div", {
                                "class":"sortImageWrapper"
                            }, columnHeadingWrapper);
                            var sortImage = self._createImg("sortImage", sortImageContainer);
                            sortImageContainer.appendChild(sortImage);

                            if (matchesTopField && self.sortType === "asc") {
                                // detect if we are re-sorting (reversing) the current column
                                self.sortType = "desc";
                            }
                            else {
                                self.sortType = "asc";
                            }

                            domClass.toggle(sortImage, "arrow_asc", self.sortType === "asc");
                            domClass.toggle(sortImage, "arrow_desc", self.sortType === "desc");
                            sortImage.alt = ( self.sortType === "asc" ? 'ascending' : 'descending');

                            self.sortImageContainer = sortImageContainer;
                            self.sortColumn = column;
                            // Ignore whether we're sorting on multiple levels. Clicking the header overrides the multilevel sorting.
                            self.orderField = column.orderField;

                            self.redraw();
                            matchesTopField = column.orderField === self.orderField ||
                                (self.orderField instanceof Array && self.orderField.length > 0 && column.orderField === self.orderField[0]);
                        };
                        on(columnHeading, "click", doSort);
                        on(columnHeading, "keypress", function (event) {
                            if (event.charOrCode === 13) {
                                doSort();
                            }
                        });
                    }
                    columnHeading.appendChild(columnHeadingWrapper);
                }

                self.theadAttach.appendChild(columnHeading);
            });
        },

        /**
         *
         */
        showFooter: function() {
            var self = this;

            if (self.totalRecords !== undefined) {
                self.totalPages = Math.ceil(self.totalRecords/self.rowsPerPage);
            }
            else {
                self.totalPages = undefined;
            }

            if (!this.hideFooter) {
                domConstruct.empty(self.tfootAttach);
                var footerRow = domConstruct.create("tr");
                var footerCell = domConstruct.create("td");
                footerCell.className = "webextTableFooter";
                footerCell.colSpan = self.columns.length;
                if (self.draggable) {
                    footerCell.colSpan++;
                }

                var footerWrapper = domConstruct.create("div");

                domClass.remove(this.tableAttach, "no-items-in-table");
                var perPageDivContainer = domConstruct.create("div");
                if (self.totalRecords !== 0 && !this.hidePagination) {
                    // -- Rows Per Page selector
                    perPageDivContainer.className = "perPage";

                    // Establish a list of numbers of rows to show based on configured options.
                    var pageOptions = [];
                    array.forEach(this.pageOptions, function(pageOption) {
                        pageOptions.push({
                            label: String(pageOption),
                            value: String(pageOption),
                            selected: self.rowsPerPage === pageOption
                        });
                    });

                    var perPageLabel = domConstruct.create("span");
                    perPageLabel.style.paddingTop = "2px";
                    perPageLabel.innerHTML = util.i18n("Items per page: ");
                    perPageDivContainer.appendChild(perPageLabel);
                    footerWrapper.appendChild(perPageDivContainer);

                    var perPageSelect = new Select({
                        options: pageOptions,
                        onChange: function(value) {
                            value = Number(value);

                            if (self.rowsPerPage !== value) {
                                var startRecord = (self.pageNumber - 1) * self.rowsPerPage + 1;
                                self.rowsPerPage = value;
                                self.pageNumber = Math.ceil(startRecord/self.rowsPerPage);
                                self.loadTable();
                            }
                        }
                    });
                    domStyle.set(perPageSelect.domNode, "display", "inline-Block");
                    perPageSelect.placeAt(perPageDivContainer);
                    self.own(perPageSelect);

                    var pageNumberContainer = self.createPageNumberContainer();
                    footerWrapper.appendChild(pageNumberContainer);
                }
                footerWrapper.appendChild(perPageDivContainer);

                var totalResultsContainer = perPageDivContainer;
                var totalResultsLabel = domConstruct.create("span", {"class": "numRecords"}, totalResultsContainer);
                if (self.totalRecords === 0 && self.noDataMessage !== undefined && !self.hasFilterValues()) {
                    var noDataRow = domConstruct.create("tr", {
                        "class": "noDataRow"
                    }, self.tfootAttach);
                    var noDataCell = domConstruct.create("td", {
                        colSpan: footerCell.colSpan
                    }, noDataRow);

                    domConstruct.create("span", {
                        innerHTML: self.noDataMessage
                    }, noDataCell);
                    domClass.add(self.tableAttach, "no-items-in-table");
                }
                else if (!self.hidePagination) {
                    if (this.totalRecords === 1) {
                        totalResultsLabel.innerHTML = i18n("%s record", this.totalRecords);
                    }
                    else if (self.totalRecords) {
                        totalResultsLabel.innerHTML = i18n("%s records", this.totalRecords);
                    }
                }

                if (!self.hideFooterLinks) {
                    if (!self.hidePagination && self.totalRecords) {
                        var refreshSpacer = domConstruct.create("span", {}, totalResultsContainer);
                        refreshSpacer.innerHTML = "-";
                    }

                    var refreshLink = domConstruct.create("a", {}, totalResultsContainer);
                    domClass.add(refreshLink, 'linkPointer');
                    refreshLink.onclick = function() {
                        self.refresh();
                    };
                    refreshLink.innerHTML = i18n("Refresh");

                    if (!this.hidePrintLink) {
                        // printer link
                        var printLink = domConstruct.create("a", {"class": "linkPointer", "innerHTML":util.i18n("Print")}, totalResultsContainer);
                        on(printLink, "click", function(){self.print();});
                    }
                }

                footerCell.appendChild(footerWrapper);

                footerRow.appendChild(footerCell);
                self.tfootAttach.appendChild(footerRow);
            }
        },

        createPageNumberContainer: function() {
            var self = this;
            // -- Page number / navigation selector
            var pageNumberContainer = domConstruct.create("div", {
                className: "pageNumbers inline-block"
            });

            var pageCountLabel = domConstruct.create("span");
            if (self.totalPages) {
                pageCountLabel.innerText = self.pageNumber + " of " + self.totalPages + " pages";
                pageNumberContainer.appendChild(pageCountLabel);
            }


            var firstPrevLinksEnabled = this.pageNumber > 1;
            var firstLink =  self.createFirstLink(firstPrevLinksEnabled);
            var previousLink = self.createPreviousLink(firstPrevLinksEnabled);
            pageNumberContainer.appendChild(firstLink);
            pageNumberContainer.appendChild(previousLink);

            if (self.totalPages && this.pageNumber > self.totalPages) {
                this.pageNumber = self.totalPages;
            }
            var pageBox = new TextBox({
                title: util.i18n("current page"),
                name: "page",
                value: this.pageNumber,
                onKeyPress: function(event) {
                    if (self._isEnterKeyPressed(event)) {
                        self.prevPage = self.pageNumber;
                        // Ensure that we are comparing integers.
                        var newPage = parseInt(pageBox.textbox.value, 10);

                        if (newPage >= 1 && newPage !== self.pageNumber) {
                            if (self.totalPages && newPage > self.totalPages) {
                                newPage = self.totalPages;
                            }
                            self.pageNumber = newPage;
                            self.loadTable();
                        }
                    }
                },
                onFocus: function() {
                    pageBox.textbox.select();
                }
            });
            var pageDigits = String(this.totalPages).length;
            domStyle.set(pageBox.domNode, "width", (10 + pageDigits * 10) + "px");
            pageBox.placeAt(pageNumberContainer);
            self.own(pageBox);
            pageBox.textbox.style.textAlign = "center";

            // totalPages will be undefined if totalRecords was undefined. totalRecords is undefined where we do not
            // know exactly how many items are in the paginated table. If totalRecords has a value, totalPages will be a
            // positive integer determined by totalRecords / numPerPage
            var pagesRemain = this.pageNumber < self.totalPages;
            var nextLinkEnabled = self.totalPages ? pagesRemain : true;
            var lastLinkEnabled = self.totalPages ? pagesRemain : false;
            var nextLink = self.createNextLink(nextLinkEnabled);
            var lastLink = self.createLastLink(lastLinkEnabled);
            pageNumberContainer.appendChild(nextLink);
            pageNumberContainer.appendChild(lastLink);

            return pageNumberContainer;
        },

        createFirstLink: function(enabled) {
            var self = this;
            var firstLink;

            if (enabled) {
                firstLink = domConstruct.create("a", {"class":"linkPointer", "tabindex": "0"});
                this._createImg("arrow_fastBackwards", firstLink, {"alt": util.i18n("first page")});
                var firstClick = function() {
                    self.pageNumber = 1;
                    self.loadTable();
                };
                firstLink.onclick = firstClick;
                firstLink.onkeyup = function (event) {
                    if (self._isEnterKeyPressed(event)) {
                        firstClick();
                    }
                };
            }
            else {
                firstLink = domConstruct.create("span");
                this._createImg("arrow_fastBackwards_grey", firstLink, {"alt": util.i18n("first page disabled")});
            }

            return firstLink;
        },

        createPreviousLink: function(enabled) {
            var self = this;
            var previousLink;

            if (enabled) {
                previousLink = domConstruct.create("a", {"class":"linkPointer", "tabindex": "0"});
                this._createImg("arrow_backwards", previousLink, {"alt": util.i18n("previous page")});
                var prevClick = function() {
                    self.prevPage = self.pageNumber;
                    self.pageNumber--;
                    self.loadTable();
                };
                previousLink.onclick = prevClick;
                previousLink.onkeyup = function (event) {
                    if (self._isEnterKeyPressed(event)) {
                        prevClick();
                    }
                };
            }
            else {
                previousLink = domConstruct.create("span");
                this._createImg("arrow_backwards_grey", previousLink, {"alt": util.i18n("previous page disabled")});
            }

            return previousLink;
        },

        createNextLink: function(enabled) {
            var self = this;
            var nextLink;

            if (enabled) {
                nextLink = domConstruct.create("a", {"class":"linkPointer", "tabindex": "0"});
                this._createImg("arrow_forward", nextLink, {"alt": util.i18n("next page")});
                var nextClick = function() {
                    self.prevPage = self.pageNumber;
                    self.pageNumber++;
                    self.loadTable();
                };
                nextLink.onclick = nextClick;
                nextLink.onkeyup = function (event) {
                    if (self._isEnterKeyPressed(event)) {
                        nextClick();
                    }
                };
            }
            else {
                nextLink = domConstruct.create("span");
                this._createImg("arrow_forward_grey", nextLink, {"alt": util.i18n("next page disabled")});
            }

            return nextLink;
        },

        createLastLink: function(enabled) {
            var self = this;
            var lastLink;

            if (enabled) {
                lastLink = domConstruct.create("a", {"class":"linkPointer", "tabindex": "0"});
                this._createImg("arrow_fastForward", lastLink, {"alt": util.i18n("last page")});
                var lastClick = function() {
                    self.pageNumber = self.totalPages;
                    self.loadTable();
                };
                lastLink.onclick = lastClick;
                lastLink.onkeyup = function (event) {
                    if (self._isEnterKeyPressed(event)) {
                        lastClick();
                    }
                };
            }
            else {
                lastLink = domConstruct.create("span");
                this._createImg("arrow_fastForward_grey", lastLink, {"alt": util.i18n("last page disabled")});
            }

            return lastLink;
        },

        _isEnterKeyPressed: function (event) {
            var key = event.charCode || event.keyCode;
            return key === keys.ENTER;
        }
    });
});

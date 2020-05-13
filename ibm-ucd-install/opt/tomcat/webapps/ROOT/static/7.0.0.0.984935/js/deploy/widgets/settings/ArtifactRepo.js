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
        "dojo/_base/declare",
        "dijit/_Widget",
        "dijit/_TemplatedMixin",
        "dojo/_base/xhr",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/on",
        "dojo/number",
        "dijit/ProgressBar",
        "js/webext/widgets/table/TreeTable"
],
function(
        declare,
        _Widget,
        _TemplatedMixin,
        xhr,
        domClass,
        domConstruct,
        on,
        number,
        ProgressBar,
        TreeTable
        ) {
        return declare([_Widget, _TemplatedMixin], {

            templateString:
                '<div>' +
                    '<div>' +
                      '<div class="artifactProgressBarText" data-dojo-attach-point="pbTextAttach"></div>' +
                      '<div class="artifactDescription" data-dojo-attach-point="pbDescrAttach"></div>' +
                      '<div class="artifactProgressBar" data-dojo-attach-point="progressBarAttach"></div>' +
                    '</div>' +
                    '<div data-dojo-attach-point="sizeTableAttach"></div>' +
                '</div>',


            postCreate: function() {
                this.inherited(arguments);
                var self = this;

                // Add treetable of components and versions
                if (this.tree !== undefined) {
                    this.tree.destroy();
                }

                this.tree = new TreeTable({
                    url: bootstrap.restUrl+"deploy/component/componentSizeReport",
                    serverSideProcessing: false,
                    noDataMessage: i18n("No components found."),
                    columns: self._getTableColumns(),
                    hidePagination: false,
                    orderField: "sizeOnDisk",
                    sortType: "desc",
                    getChildUrl: function(item) {
                        if (!item.component) {
                            return bootstrap.restUrl+'deploy/component/' + item.id + '/versions/false';
                        }
                    },
                    getChildOutputType: function(item) {
                        return {rowsPerPage:10};
                    },
                    hasChildren: function(item) {
                        return !!item.sizeOnDisk && item["class"] === "Component";
                    }
                });
                this.tree._defaultToggle = this.tree._toggle;
                this.tree._toggle = function(rowObject, expandAll) {
                    // Decide if message should be displayed
                    if (rowObject.hasChildren &&
                        rowObject.children.length >= 10) {
                        // Reposition divs if necessary
                        var overflowMessageDivContainer = rowObject.domNode.firstChild.firstChild;
                        var overflowMessageDiv = overflowMessageDivContainer.lastChild;
                        if (overflowMessageDiv.value !== "overflowMessage"){
                            overflowMessageDiv = overflowMessageDivContainer.firstChild;
                            overflowMessageDiv.style.marginLeft = "10px";
                            overflowMessageDivContainer.removeChild(overflowMessageDiv);
                            overflowMessageDivContainer.appendChild(overflowMessageDiv);
                        }
                        // Display logic
                        if (rowObject.expanded) {
                            overflowMessageDiv.style.display = "none";
                        } else {
                            overflowMessageDiv.innerHTML = i18n(
                                    "(Only 10 largest versions displayed)");
                            overflowMessageDiv.style.display = "inline";
                        }
                    }
                    // Super call
                    this._defaultToggle(rowObject, expandAll);
                };
                this.tree.placeAt(this.sizeTableAttach);

                // Add progress bar of version migration
                xhr.get({
                    url: bootstrap.restUrl + 'deploy/version/upgrades',
                    handleAs: 'json',
                    load: function(data) {
                        self._createProgressBar(data);
                    },
                    error: function(response) {
                        console.log('Error getting VFS version upgrade data', response);
                    }
                });

            },

            _createProgressBar: function(data) {
                var self = this;
                if (data.remaining === 0) {
                    return;
                }

                self.pbDescrAttach.innerHTML = i18n("The server is currently re-organizing " +
                    " version artifacts. This process will only occur once and the " +
                    "server can continue to be used as normal. This re-organization " +
                    "may allow for faster artifact resolution.");

                self.pbTextAttach.innerHTML = i18n("Artifact Upgrade Status: ");

                self._updateProgressBar();

                self.bar = new ProgressBar({
                    style: 'width: 100%',
                    indeterminate: true
                }).placeAt(this.progressBarAttach);

                var i = 0;
                setInterval(function() {
                    self._updateProgressBar();
                }, 10000);
            },

            _updateProgressBar: function() {
                var self = this;
                xhr.get({
                    url: bootstrap.restUrl + 'deploy/version/upgrades',
                    handleAs: 'json',
                    load: function(data) {
                        var result = 1 - (data.remaining / data.total);
                        self.bar.set('value', result * 100);
                    },
                    error: function(response) {
                        console.log('Error getting VFS version upgrade data', response);
                    }
                });
            },

            _getTableColumns: function() {
                var self = this;
                var columns = [];
                columns.push({
                    name: i18n("Component / Version"),
                    formatter: function(item, value, cell) {
                        var overflowMessageDiv = domConstruct.create("div", {
                            style: {
                                'display': 'none'
                            }
                        });
                        overflowMessageDiv.value = "overflowMessage";
                        cell.firstChild.appendChild(overflowMessageDiv);
                        return item.name;
                    },
                    getRawValue: function(item) {
                        return item.name;
                    },
                    orderField: "name",
                    filterField: "name",
                    filterType: "text"
                });

                columns.push({
                    name: i18n("Size"),
                    orderField: "sizeOnDisk",
                    formatter: function(item, value, cell) {
                        return self._formatSize(item.sizeOnDisk || -1);
                    },
                    getRawValue: function(item) {
                        return item.sizeOnDisk || 0;
                    }
                });

                return columns;
            },

            _formatSize: function(size) {
                var result = i18n("N/A");
                if (size > -1) {
                    result = util.fileSizeFormat(size);
                }
                return result;
            }
        }
    );
});

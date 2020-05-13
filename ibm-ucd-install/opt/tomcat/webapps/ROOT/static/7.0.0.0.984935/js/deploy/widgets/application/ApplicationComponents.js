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
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/Deferred",
        "dojo/dom-construct",
        "dojo/dom-geometry",
        "dojo/json",
        "dojo/on",
        "deploy/widgets/component/RunComponentProcess",
        "deploy/widgets/component/ComponentImportFailureIcon",
        "deploy/widgets/Formatters",
        "js/webext/widgets/Alert",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        xhr,
        Deferred,
        domConstruct,
        domGeom,
        JSON,
        on,
        RunComponentProcess,
        ComponentImportFailureIcon,
        Formatters,
        Alert,
        Dialog,
        GenericConfirm,
        TreeTable
) {
    /**
     *
     */
    return declare('deploy.widgets.application.ApplicationComponents',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="applicationComponents">' +
                '<div data-dojo-attach-point="statAttach" class="statAttach">' +
                '  <div class="tile tile-border">' +
                '    <div class="stat-tile-number" data-dojo-attach-point="failedStatAttach"></div>' +
                '    <div class="stat-tile-label">' + i18n("Failed Version Import") + '</div>' +
                '  </div>' +
                '  <div class="tile tile-border">' +
                '    <div class="stat-tile-number" data-dojo-attach-point="importingStatAttach"></div>' +
                '    <div class="stat-tile-label">' + i18n("Importing Version") + '</div>' +
                '  </div>' +
                '  <div class="tile tile-border">' +
                '    <div class="stat-tile-number" data-dojo-attach-point="noVersionStatAttach"></div>' +
                '    <div class="stat-tile-label">' + i18n("No Version") + '</div>' +
                '  </div>' +
                '  <div class="tile">' +
                '    <div class="stat-tile-number" data-dojo-attach-point="successStatAttach"></div>' +
                '    <div class="stat-tile-label">' + i18n("Successful") + '</div>' +
                '  </div>' +
                '</div>' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            var self = this;
            this.inherited(arguments);

            var gridRestUrl = bootstrap.restUrl+'deploy/component/details';
            var gridLayout = [];

            gridLayout.push(this.getNameColumn());
            gridLayout.push({
                name: i18n("Actions"),
                formatter: this.actionsFormatter,
                parentWidget: this
            });
            gridLayout.push({
                name: i18n("Last Import"),
                field: "status",
                formatter: function(item) {
                    var result;
                    if (item.status === "SUCCESS") {
                        result = i18n("Successful");
                    }
                    else if (item.status === "FAILURE") {
                        result =  i18n("Failed Import");
                    }
                    else {
                        result = i18n("No Import Data Available");
                    }
                   return result;
                }
            });
            gridLayout.push({
                name: i18n("Last Version"),
                field: "versionName",
                formatter: function(item) {
                    if (!item.objectType) {
                        if (!item.versionName || (item.versionName === "null")) {
                            return i18n("NO VERSION");
                        }
                    }
                  return item.versionName;
                }
            });
            gridLayout.push({
                name: i18n("Description"),
                field: "description"
            });

            this.grid = new TreeTable({
                serverSideProcessing: true,
                url: gridRestUrl,
                tableConfigKey: "applicationComponentsList",
                noDataMessage: i18n("No components have been added to this application."),
                columns: gridLayout,
                hidePagination: false,
                hideExpandCollapse: true,
                orderField: "name",
                sortType: "asc",
                baseFilters: [{
                    name: "applications.id",
                    type: "eq",
                    className: "UUID",
                    values: [appState.application.id]
                }],
                processXhrResponse: function() {
                    self.showStats();
                }
            });
            this.grid.placeAt(this.gridAttach);
            this.showStats();
        },

        /**
         *
         */
        getNameColumn: function() {
            var self = this;
            return {
                name: i18n("Name"),
                orderField: "name",
                formatter: function(item, value, cell) {
                    cell.style.position = "relative";

                    var result = domConstruct.create("div", {
                        "class": "inlineBlock",
                        "style": "margin-" + (domGeom.isBodyLtr()?"right":"left") + ":78px;"
                    });
                    var itemWrapper = domConstruct.create("div", {
                        "class": "inlineBlock"
                    });
                    domConstruct.place(itemWrapper, result);

                    if (item.integrationFailed) {
                        var importFailureIcon = new ComponentImportFailureIcon({
                            label: i18n("A version import failed. Check the component's configuration for more details or use the Actions menu to dismiss this error.")
                        });

                        domConstruct.place(importFailureIcon.domNode, itemWrapper);
                    }
                    var link = Formatters.componentLinkFormatter(item);
                    var linkDiv = domConstruct.create('div', { "class" : 'inlineBlock'});
                    linkDiv.appendChild(link);
                    domConstruct.place(linkDiv, itemWrapper);

                    if (item.importing) {
                        var importingDiv = domConstruct.create("div", {
                            "class": "inline-block component-importing-text",
                            "innerHTML": "Importing..."
                         }, result);
                    }
                    return result;
                }
            };
        },

        /**
         *
         */
        actionsFormatter: function(item) {
            var self = this.parentWidget;
            var result = document.createElement("span");

            if (appState.application.extendedSecurity[security.application.runComponentProcesses]) {
                var deployLink = domConstruct.create("a", {
                    "innerHTML": i18n("Run Process"),
                    "class": "actionsLink linkPointer"
                }, result);
                on(deployLink, "click", function() {
                    self.showComponentDeploymentDialog(item);
                });
            }

            if (appState.application.security["Manage Components"]) {
                var removeLink = domConstruct.create("a", {
                    "innerHTML": i18n("Remove"),
                    "class": "actionsLink linkPointer"
                }, result);
                on(removeLink, "click", function() {
                    self.confirmRemoval(item);
                });
            }

            return result;
        },

        /**
         *
         */
        confirmRemoval: function(component) {
            var self = this;

            var submitData = {};
            submitData.components = [];
            submitData.components.push(component.id);

            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to remove component '%s' from this application?", component.name.escape()),
                action: function() {
                    xhr.put({
                        url: bootstrap.restUrl+"deploy/application/"+appState.application.id+"/removeComponents",
                        putData: JSON.stringify(submitData),
                        load: function() {
                            self.grid.refresh();
                        },
                        error: function(response) {
                            var dndAlert = new Alert({
                                message: response.responseText
                            });
                        }
                    });
                }
            });
        },

        /**
         *
         */
        showComponentDeploymentDialog: function(component) {
            var deployDialog = new Dialog({
                closable: true,
                draggable: true
            });

            var deployForm = new RunComponentProcess({
                application: appState.application,
                component: component,
                callback: function() {
                    deployDialog.hide();
                    deployDialog.destroy();
                }
            });
            deployForm.placeAt(deployDialog.containerNode);
            deployDialog.show();
        },

        showStats: function() {
            var self = this;
            this.getStats().then(function(data) {
                self.successStatAttach.textContent = data.SUCCESS;
                self.importingStatAttach.textContent = data.IMPORTING;
                self.noVersionStatAttach.textContent = data["NO VERSION"];
                self.failedStatAttach.textContent = data.FAILURE;
            });
        },

        getStats: function() {
            var url = bootstrap.restUrl + "deploy/component/stats" + this.buildQueryString();
            var deferred = new Deferred();
            xhr.get({
                url: url,
                handleAs: "json",
                load: function(data) {
                    deferred.resolve(data);
                },
                error: function(error) {
                    deferred.reject(error);
                }
            });
            return deferred;
        },

        /**
         * Manually build the filter to only show stats for components in the application.
         */
        buildQueryString: function() {
            var queryString  = "?filterFields=applications.id";
            queryString += "&filterValue_applications.id=" + appState.application.id;
            queryString += "&filterType_applications.id=eq";
            queryString += "&filterClass_applications.id=UUID";
            return queryString;
        }
    });
});
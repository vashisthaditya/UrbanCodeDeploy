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
        "dijit/form/Button",
        "dijit/form/CheckBox",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/_base/array",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/request/iframe",
        "dojo/on",
        "js/webext/widgets/Alert",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "js/util/blocker/BlockingContainer",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        CheckBox,
        declare,
        xhr,
        array,
        domClass,
        domConstruct,
        iframe,
        on,
        Alert,
        Dialog,
        GenericConfirm,
        BlockingContainer,
        TreeTable
) {
    /**
     *
     */
    return declare('deploy.widgets.sourceConfigPlugin.SourceConfigPluginList',  [_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="pluginList">' +
                '<div class="listTopButtons" data-dojo-attach-point="buttonTopAttach"></div>' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            var gridRestUrl = bootstrap.restUrl+"plugin/sourceConfigPlugin";
            var gridLayout = [{
                name: i18n("Plugin"),
                field: "name",
                orderField: "name",
                filterField: "name",
                getRawValue: function(item) {
                    return item.name;
                },
                filterType: "text"
            },{
                name: i18n("Description"),
                formatter: function(item) {
                    return i18n(item.description);
                }
            },{
                name: i18n("Version"),
                formatter: this.versionFormatter,
                orderField: "pluginVersion",
                filterField: "releaseVersion",
                getRawValue: function(item) {
                    return item.version;
                },
                filterType: "text"
            },{
                name: i18n("Actions"),
                formatter: this.actionsFormatter,
                parentWidget: this
            }];

            this.grid = new TreeTable({
                url: gridRestUrl,
                serverSideProcessing: true,
                hideExpandCollapse: true,
                hidePagination: false,
                columns: gridLayout,
                tableConfigKey: "pluginList",
                noDataMessage: i18n("No plugins have been loaded.")
            });
            this.grid.placeAt(this.gridAttach);

            if (config.data.permissions[security.system.managePlugins]) {
                var importButton = {
                    label: i18n("Load Plugin"),
                    showTitle: false,
                    onClick: function() {
                        self.showNewPluginForm();
                    }
                };
                var loadButton = new Button(importButton).placeAt(this.buttonTopAttach);
                domClass.add(loadButton.domNode, "idxButtonSpecial");
                loadButton.placeAt(this.buttonTopAttach);
            }
        },

        /**
         *
         */
        destroy: function() {
            this.inherited(arguments);
            this.grid.destroy();
        },

        versionFormatter: function(item) {
            return item.version;
        },

        /**
         *
         */
        actionsFormatter: function(item) {
            var self = this.parentWidget;

            var result = domConstruct.create("div");

            if (config.data.permissions[security.system.managePlugins]) {
                var deleteLink = domConstruct.create("a", {
                    "innerHTML": i18n("Delete"),
                    "class": "actionsLink linkPointer"
                }, result);
                on(deleteLink, "click", function() {
                    self.getComponentsUsingPluginAndDelete(item);
                });
            }

            return result;
        },

        /**
         * 
         */
        showPluginDeletionConfirm: function(item, message) {
            var self = this;

            var confirm = new GenericConfirm({
                message: i18n(message),
                forceRawMessages: true,
                action: function() {
                    self.grid.block();
                    var deleteUrl = bootstrap.restUrl + "plugin/sourceConfigPlugin/" + item.id;
                    xhr.del({
                        url: deleteUrl,
                        handleAs: "json",
                        load: function(data) {
                            self.grid.refresh();
                        },
                        error: function(error) {
                            var alert = new Alert({
                                messages: [i18n("Error deleting plugin:"),
                                           "",
                                           util.escape(error.responseText)]
                            });
                            alert.startup();
                            self.grid.unblock();
                        }
                    });
                }
            });
        },

        /**
         * 
         */
        getComponentsUsingPluginAndDelete: function(item) {
            var self = this;
            var message = i18n("Are you sure you want to delete %s? " +
                    "This will permanently delete it from the system. ",
                    i18n(util.escape(item.name)) + " " + item.version);
            xhr.get({
                url: bootstrap.restUrl + "plugin/sourceConfigPlugin/" + item.id + "/components",
                handleAs: "json",
                load: function(data, ioArgs) {
                    if (data && data.length > 0) {
                        var m = i18n("The source config is using the following components:") + "<br/>";
                        array.forEach(data, function (name) {
                            m += name.escape() + "<br/>";
                        });
                        message = m + "<br/>" + message;
                    }
                    self.showPluginDeletionConfirm(item, message);
                },
                error: function(data) {
                    message += "<br/>" + i18n("It is unknown if the source config is being used by any components.");
                    self.showPluginDeletionConfirm(item, message);
                }
            });
        },
        /**
         * 
         */
        showNewPluginForm: function() {
            var self = this;
            var blocker = new BlockingContainer();
            var dialog = new Dialog({
                title: i18n("Load Plugin"),
                closable: true,
                draggable: true
            });

            var form = document.createElement("form");
            form.target = "formTarget";
            form.method = "POST";
            form.enctype = "multipart/form-data";
            form.encoding = "multipart/form-data";
            dojo.addClass(form, "importForm");

            blocker.placeAt(dialog.containerNode);

            var fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.name = "file";

            var submitDiv = domConstruct.create("div");

            var submitButton = new Button({
                label: i18n("Submit"),
                type: "submit"
            });
            submitButton.placeAt(submitDiv);

            form.appendChild(fileInput);
            form.appendChild(submitDiv);
            blocker.containerNode.appendChild(form);

            form.onsubmit = function() {
                if (!fileInput.value) {
                    var fileAlert = new Alert({
                        message: i18n("Please choose a plugin file to import.")
                    });
                    fileAlert.startup();
                }
                else {
                    blocker.block();
                    
                    var sessionValue = util.getCookie(bootstrap.expectedSessionCookieName);
                    iframe(bootstrap.restUrl+"plugin/sourceConfigPlugin/ui?"+bootstrap.expectedSessionCookieName+"="+sessionValue, {
                        form: form,
                        handleAs: "json"
                    }).then(function(response) {
                        // On success...
                        if (response.status === "ok") {
                            blocker.unblock();
                            dialog.hide();
                            dialog.destroy();
                            self.grid.refresh();
                        }
                        else {
                            blocker.unblock();
                            var fileAlert = new Alert({
                                message: i18n("Error loading plugin: %s", response.error)
                            });
                            fileAlert.startup();
                        }
                    }, function(response) {
                        // On error...
                        blocker.unblock(); 
                        var fileAlert = new Alert({
                            message: i18n("Error loading plugin: %s", response.error)
                        });
                        fileAlert.startup();
                    });
                }
                return false;
            };

            dialog.show();
        }
    });
});

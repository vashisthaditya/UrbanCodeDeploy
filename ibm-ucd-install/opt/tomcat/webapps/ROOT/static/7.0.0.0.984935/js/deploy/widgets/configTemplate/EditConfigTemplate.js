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
        "dojo/dom-construct",
        "dojo/on",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Alert",
        "js/webext/widgets/GenericConfirm"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        xhr,
        domConstruct,
        on,
        ColumnForm,
        Alert,
        GenericConfirm
) {
    return declare('deploy.widgets.configTemplate.EditConfigTemplate',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="editConfigTemplate">'+
            '  <div class="versionToggle" data-dojo-attach-point="versionAttach"></div>'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            this.existingValues = {};
            if (this.configTemplate) {
                this.existingValues = this.configTemplate;

                if (this.component === undefined) {
                    this.component = this.configTemplate.component;
                }
                this.showVersionLinks();
            }

            this.showForm(this.readOnly);
        },

        /**
         * Display the config template edit form
         */
        showForm: function(readOnly) {
            var self = this;
            var version = this.existingValues.version;
            this.form = new ColumnForm({
                readOnly: readOnly,
                cancelLabel: (this.callback !== undefined) ? i18n("Cancel") : null,
                submitUrl: bootstrap.restUrl+"deploy/configTemplate",
                postSubmit: function(data) {
                    if (self.callback !== undefined) {
                       self.callback();
                    }
                    else if (self.configTemplate) {
                        navBar.setHash("configTemplate/"+self.component.id+"/"+self.existingValues.name+"/-1", false, true);
                    }
                },
                addData: function(data) {
                    data.componentId = self.component.id;
                    if (version === null){
                        data.previousVersion = 0;
                    }
                    else {
                        data.previousVersion = version;
                    }
                },
                onError: function(response) {
                    if (response.responseText) {
                        if (response.status === 409) {
                            var modificationAlert = new Alert({
                                message: i18n("Modifications have occured since you loaded this page please refresh.")
                            });
                        }
                        else {
                            var otherAlert = new Alert({
                                message: util.escape(response.responseText)
                            });
                        }
                    }
                    else {
                        var unknownAlert = new Alert({
                            message: i18n("An error occured.")
                        });
                    }
                },
                onCancel: function() {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                }
            });

            this.form.addField({
                name: "name",
                label: i18n("Name"),
                required: true,
                readOnly: (this.configTemplate !== undefined),
                type: "Text",
                value: this.existingValues.name
            });

            this.form.addField({
                name: "data",
                label: i18n("Template"),
                type: "Text Area",
                style: {
                    width: "400px",
                    height: "400px"
                },
                value: this.existingValues.data
            });
            this.form.placeAt(this.formAttach);
        },

        /**
         * Display the version link arrows
         */
        showVersionLinks: function() {
            var self = this;

            domConstruct.empty(this.versionAttach);

            var versionLabel = domConstruct.create("div", {
                "innerHTML": i18n("Version %s of %s", this.existingValues.version, this.existingValues.versionCount)
            }, this.versionAttach);

            var versionLinks = domConstruct.create("div", {
            }, this.versionAttach);

            if (this.existingValues.version === 1) {
                var greyBackLink = domConstruct.create("div", {
                    className: "arrow_backwards_grey inlineBlock"
                }, versionLinks);
            }
            else {
                var backLink = domConstruct.create("div", {
                    className: "arrow_backwards inlineBlock"
                }, versionLinks);

                on(backLink, "click", function() {
                    self.existingValues.version--;
                    self.refresh();
                });
            }

            domConstruct.create("span", {
                "innerHTML": "&nbsp;&nbsp;&nbsp;"
            }, versionLinks);

            if (this.existingValues.version === this.existingValues.versionCount) {
                var greyForwardLink = domConstruct.create("div", {
                    className: "arrow_forward_grey inlineBlock"
                }, versionLinks);

                domConstruct.create("span", {
                    "innerHTML": "&nbsp;&nbsp;"
                }, versionLinks);

                var greyHeadLink = domConstruct.create("div", {
                    className: "arrow_fastForward_grey inlineBlock"
                }, versionLinks);
            }
            else {
                var forwardLink = domConstruct.create("div", {
                    className: "arrow_forward inlineBlock"
                }, versionLinks);

                on(forwardLink, "click", function() {
                    self.existingValues.version++;
                    self.refresh();
                });

                domConstruct.create("span", {
                    "innerHTML": "&nbsp;&nbsp;"
                }, versionLinks);

                var headLink = domConstruct.create("div", {
                    className: "arrow_fastForward inlineBlock"
                }, versionLinks);

                on(headLink, "click", function() {
                    self.existingValues.version = self.existingValues.versionCount;
                    self.refresh();
                });

                if (!this.readOnly) {
                    domConstruct.create("span", {
                        "innerHTML": "&nbsp;&nbsp;"
                    }, versionLinks);

                    var resetLink = domConstruct.create("a", {
                        "innerHTML": i18n("Reset Latest to This Version")
                    }, versionLinks);
                    on(resetLink, "click", function() {
                        var resetConfirm = new GenericConfirm({
                            "message": i18n("Are you sure you want to reset to version %s?",
                                    self.existingValues.version),
                            "action": function() {
                                xhr.put({
                                    url: bootstrap.restUrl+"vc/persistent/"+util.vc.encodeVersionedPath(self.existingValues.path)+"."+self.existingValues.version+"/setAsLatest",
                                    load: function() {
                                        self.existingValues.versionCount++;
                                        self.existingValues.version = self.existingValues.versionCount;
                                        self.refresh();
                                    },
                                    error: function(data) {
                                        var errorAlert = new Alert({
                                            message: i18n("Error: %s", util.escape(data.responseText))
                                        });
                                    }
                                });
                            }
                        });
                    });
                }
            }
        },

        /**
         * refresh the config template form with the correct data
         */
        refresh: function() {
            var self = this;
            var restUrl = bootstrap.restUrl+"deploy/configTemplate/"+self.existingValues.componentId +
                "/" + util.encodeIgnoringSlash(self.existingValues.name) + "/" + self.existingValues.version;

            xhr.get({
                url: restUrl,
                handleAs: "json",
                load: function(data) {
                    self.existingValues = data;
                    self.form.destroy();
                    if (!self.readOnly) {
                        self.showForm(self.existingValues.version !== self.existingValues.versionCount);
                    }
                    else {
                        self.showForm(true);
                    }
                    self.showVersionLinks();
                },
                error: function(data) {
                    var errorAlert = new Alert({
                        message: i18n("Error: %s", util.escape(data.responseText))
                    });
                }
            });
        }
    });
});

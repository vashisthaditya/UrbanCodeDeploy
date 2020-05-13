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
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/on",
        "deploy/widgets/Formatters",
        "deploy/widgets/applicationProcess/EditApplicationProcess",
        "js/webext/widgets/Alert",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        CheckBox,
        declare,
        xhr,
        domClass,
        domConstruct,
        on,
        Formatters,
        EditApplicationProcess,
        Alert,
        Dialog,
        GenericConfirm,
        TreeTable
) {
    /**
     *
     */
    return declare('deploy.widgets.applicationProcess.ApplicationProcessList',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="applicationProcesses">' +
                '<div class="listTopButtons" data-dojo-attach-point="buttonAttach"></div>' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
                '<div data-dojo-attach-point="activeBoxAttach" style="margin: 2px;"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            if (self.application) {
                self.gridRestUrl = bootstrap.restUrl + "deploy/application/"
                        + self.application.id + "/processes/false";
                self.processFormatter = Formatters.applicationProcessLinkFormatter;
            }

            // If we have both an application and a template something is wrong,
            // template should take precedence though.
            if (self.applicationTemplate) {
                self.gridRestUrl = bootstrap.restUrl + "deploy/applicationTemplate/"
                        + self.applicationTemplate.id + "/" + self.applicationTemplate.version
                        + "/processes";
                self.processFormatter = Formatters.applicationTemplateProcessLinkFormatter;

                self.readOnly =
                    ((self.applicationTemplate.version !== self.applicationTemplate.versionCount)
                    || !self.applicationTemplate.security["Manage Processes"]);
            }

            var gridLayout = [{
                name: i18n("Process"),
                formatter: self.processFormatter
            },{
                name: i18n("Description"),
                field: "description"
            },{
                name: i18n("Actions"),
                formatter: this.actionsFormatter,
                parentWidget: this
            }];

            this.grid = new TreeTable({
                url: self.gridRestUrl,
                serverSideProcessing: false,
                columns: gridLayout,
                tableConfigKey:"appProcListKey",
                noDataMessage: i18n("No processes have been added to this application."),
                hideExpandCollapse: true,
                hidePagination: false
            });
            this.grid.placeAt(this.gridAttach);

            // No inactive concept for applicationTemplates
            if (config.data.systemConfiguration.enableInactiveLinks && self.application) {
                var activeBox = new CheckBox({
                    checked: false,
                    value: 'true',
                    onChange: function(value) {
                        self.grid.url = bootstrap.restUrl+"deploy/application/"+appState.application.id+"/processes/"+value;
                        self.grid.refresh();
                    }
                });
                activeBox.placeAt(this.activeBoxAttach);

                var activeLabel = document.createElement("div");
                domClass.add(activeLabel, "inlineBlock");
                activeLabel.style.position = "relative";
                activeLabel.style.top = "2px";
                activeLabel.style.left = "2px";
                activeLabel.innerHTML = i18n("Show Inactive Processes");
                this.activeBoxAttach.appendChild(activeLabel);
            }

            if (!self.readOnly) {
                var newApplicationProcessButton = new Button({
                    label: i18n("Create Process"),
                    showTitle: false,
                    onClick: function() {
                        self.showNewApplicationProcessDialog({});
                    }
                });
                domClass.add(newApplicationProcessButton.domNode, "idxButtonSpecial");
                newApplicationProcessButton.placeAt(this.buttonAttach);
            }
        },

        /**
         *
         */
        destroy: function() {
            this.inherited(arguments);
            this.grid.destroy();
        },

        /**
        *
        */
       applicationProcessLinkFormatter: function(item) {
           var self = this.parentWidget;
           var result = document.createElement("a");
           if (item) {
               result.innerHTML = item.name.escape();
               if (item.metadataType === "patternApplicationProcess"){
                   if (item.blueprint){
                       result.href = item.blueprint.url;
                   }
               } else {
                   result.href = "#applicationProcess/"+item.id+"/"+item.version;
               }
           }
           return result;
       },

        /**
         *
         */
        actionsFormatter: function(item) {
            var self = this.parentWidget;
            var result = document.createElement("div");

            if (!self.readOnly) {
                var display = "inline";

                if(item.applicationTemplate && !item.applicationTemplate.security["Manage Processes"]) {
                    display = "none";
                }
                var editLink = document.createElement("a");
                editLink.className = "actionsLink linkPointer";
                editLink.innerHTML = i18n("Edit");
                editLink.style.display = display;
                if (item.metadataType === "patternApplicationProcess"){
                    if (item.blueprint){
                        editLink.href = item.blueprint.url;
                    }
                } else {
                    editLink.href = "#applicationProcess/"+item.id+"/-1";
                }
                result.appendChild(editLink);

                if (item.metadataType !== "patternApplicationProcess"){
                    var duplicateLink = domConstruct.create("a", {
                        "class": "actionsLink linkPointer",
                        "innerHTML": i18n("Copy")
                    }, result);
                    on(duplicateLink, "click", function() {
                        self.duplicate(item);
                    });

                    // If the process is an application template process, and
                    // we're viewing an application, don't include the delete button
                    if (item.application || self.applicationTemplate) {
                        var deleteLink = domConstruct.create("a", {
                            "class": "actionsLink linkPointer",
                            "innerHTML": i18n("Delete"),
                            "style": {"display": display}
                        }, result);
                        on(deleteLink, "click", function() {
                            self.confirmDelete(item);
                        });
                    }
                }
            }
            return result;
        },

        /**
         *
         */
        confirmDelete: function(target) {
            var self = this;
            var warningMessage = i18n(
                "If you delete this application process, scheduled instances of the process " +
                "are also removed from the calendar, if any. However, the application " +
                "process run history, including past calendar entries, is preserved. Delete %s?", 
                target.name.escape());

            // if self.applicationTemplate exists, the process being deleted is being deleted from the template's process list page
            // if target.applicationTemplate exists, it is being deleted from an application that uses that template for that process 
            var applicationTemplate = self.applicationTemplate || target.applicationTemplate;

            if (applicationTemplate) {
                xhr.get({
                    url: bootstrap.restUrl + "deploy/applicationTemplate/" + applicationTemplate.id + "/numApplications",
                    handleAs: "text",
                    load: function(data) {
                        var numApplicationsUsingTemplate = parseInt(data, 10);
                        if (numApplicationsUsingTemplate > 0) {
                            warningMessage= i18n(
                                "This is an application template process. All %s applications that rely on this template will be affected. " +
                                "Also, if you delete this application process, scheduled instances of the process " +
                                "are also removed from the calendar, if any. However, the application " +
                                "process run history, including past calendar entries, is preserved. Delete %s?",
                                numApplicationsUsingTemplate, target.name.escape());
                        }
                        self.showDeleteApplicationProcessConfirmation(target, warningMessage);
                    }
                });
            } else {
                self.showDeleteApplicationProcessConfirmation(target, warningMessage);
            }
        },

        /**
         * 
         */
        showDeleteApplicationProcessConfirmation: function(target, warningMessage) {
            var self = this;
            var confirm = new GenericConfirm({
                message: warningMessage,
                action: function() {
                    self.grid.block();
                    xhr.del({
                        url: bootstrap.restUrl+"deploy/applicationProcess/"+target.id,
                        handleAs: "json",
                        load: function(data) {
                            self.grid.unblock();
                            self.grid.refresh();
                            if (self.applicationTemplate) {
                                navBar.setHash("applicationTemplate/"+self.applicationTemplate.id+"/-1/processes", false, true);
                            }
                        }
                    });
                }
            });
        },

        /**
         *
         */
        showNewApplicationProcessDialog: function() {
            var self = this;

            var newApplicationProcessDialog = new Dialog({
                title: i18n("Create an Application Process"),
                closable: true,
                draggable: true
            });

            var newApplicationProcessForm = new EditApplicationProcess({
                application: self.application,
                applicationTemplate: self.applicationTemplate,
                callback: function() {
                    newApplicationProcessDialog.hide();
                    newApplicationProcessDialog.destroy();
                }
            });
            newApplicationProcessForm.placeAt(newApplicationProcessDialog.containerNode);
            newApplicationProcessDialog.show();
        },

        /**
         *
         */
        duplicate: function(target) {
            var self = this;

            var restUrl;
            if (self.application) {
                restUrl = bootstrap.restUrl + "deploy/application/" + self.application.id
                        + "/pasteProcess/" + target.id;
            }

            // If we have both an application and a template something is wrong,
            // template should take precedence though.
            if (self.applicationTemplate) {
                restUrl = bootstrap.restUrl + "deploy/applicationTemplate/" + self.applicationTemplate.id
                        + "/pasteProcess/" + target.id;
            }

            self.grid.block();
            xhr.get({
                url: restUrl,
                handleAs: "json",
                load: function() {
                    self.grid.unblock();
                    self.grid.refresh();
                    if (self.applicationTemplate) {
                        navBar.setHash("applicationTemplate/"+self.applicationTemplate.id+"/-1/processes", false, true);
                    }
                },
                error: function(data) {
                    self.grid.unblock();
                    var errorAlert = new Alert({
                        message: util.escape(data.responseText)
                    });
                }
            });
        }
    });
});
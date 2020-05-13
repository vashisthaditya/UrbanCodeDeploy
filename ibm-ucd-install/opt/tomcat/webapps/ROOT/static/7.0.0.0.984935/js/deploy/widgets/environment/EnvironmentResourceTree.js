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
        "dojo/_base/declare",
        "deploy/widgets/resource/ResourceTree",
        "dijit/form/Button",
        "dojo/_base/array",
        "dojo/_base/xhr",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/json",
        "dojo/on",
        "deploy/widgets/Formatters",
        "js/webext/widgets/Alert",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "deploy/widgets/resource/ResourceSelectList"
        ],
function(
        declare,
        ResourceTree,
        Button,
        array,
        xhr,
        domClass,
        domConstruct,
        JSON,
        on,
        Formatters,
        Alert,
        Dialog,
        GenericConfirm,
        ResourceSelectList
) {
    /**
     *
     */
    return declare([ResourceTree], {
       postCreate: function() {
            var self = this;

            if (!self.environment) {
                self.environment = appState.environment;
            }
            this.url = bootstrap.restUrl+"deploy/environment/"+self.environment.id+"/resources";
            this.inherited(arguments);
        },

        addTopButtons: function() {
            var self = this;

            if (self.environment.security["Manage Base Resources"]) {
                var createButton = new Button({
                    label: i18n("Add Base Resources"),
                    showTitle: false,
                    onClick: function() {
                        self.showAddResourceDialog();
                    }
                });
                domClass.add(createButton.domNode, "idxButtonSpecial");
                createButton.placeAt(this.buttonAttach);
            }
        },

        /**
         *
         */
        showAddResourceDialog: function(source) {
            var self = this;

            var newResourceDialog = new Dialog({
                title: i18n("Add Resource to Environment"),
                closable: true,
                draggable:true,
                width: -100
            });

            var resourceSelectTree = new ResourceSelectList({
                onCancel: function() {
                    newResourceDialog.hide();
                    newResourceDialog.destroy();
                },
                onSave: function(resources) {
                    var resourceIds = [];
                    array.forEach(resources, function(resource) {
                        resourceIds.push(resource.id);
                    });

                    self.grid.block();
                    var saveUrl;

                    if (self.environment !== undefined) {
                        saveUrl = bootstrap.restUrl+"deploy/environment/"+self.environment.id+"/resources";
                    }
                    else {
                        saveUrl = bootstrap.restUrl+"deploy/environment/"+appState.environment.id+"/resources";
                    }

                    xhr.post({
                        url: saveUrl,
                        putData: JSON.stringify(resourceIds),
                        headers:  {"Content-Type":"application/json"},
                        load: function() {
                            self.grid.refresh();
                        },
                        error: function(error) {
                            var alert = new Alert({
                                messages: [i18n("Error adding resources:"),
                                           "",
                                           util.escape(error.responseText)]
                            });
                            self.grid.unblock();
                        }
                    });

                    newResourceDialog.hide();
                    newResourceDialog.destroy();
                }
            });
            resourceSelectTree.placeAt(newResourceDialog.containerNode);

            newResourceDialog.show();
        },

        getDeleteActions: function(item) {
            var self = this;

            var result;
            if (item.isRoot) {
                result = [{
                    label: i18n("Remove from Environment"),
                    onClick: function() {
                        self.confirmRemove(item);
                    }
                }];
            }
            else {
                result = this.inherited(arguments);
            }

            return result;
        },

        confirmRemove: function(item) {
            var self = this;

            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to remove %s from this environment?", item.name),
                action: function() {
                    self.grid.block();
                    var deleteUrl;
                    if (self.environment !== undefined) {
                        deleteUrl = bootstrap.restUrl+"deploy/environment/"+self.environment.id+"/resources/"+item.id;
                    }
                    else {
                        deleteUrl = bootstrap.restUrl+"deploy/environment/"+appState.environment.id+"/resources/"+item.id;
                    }

                    xhr.del({
                        url: deleteUrl,
                        handleAs: "json",
                        load: function(data) {
                            self.grid.refresh();
                        },
                        error: function(error) {
                            var alert = new Alert({
                                messages: [i18n("Error removing resource:"),
                                           "",
                                           util.escape(error.responseText)]
                            });
                            self.grid.unblock();
                        }
                    });
                }
            });
        },

        isSelectable: function(item) {
            return !item.isRoot;
        }
    });
});
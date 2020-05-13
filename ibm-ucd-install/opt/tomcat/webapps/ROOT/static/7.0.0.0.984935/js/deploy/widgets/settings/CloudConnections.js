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
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/on",
        "dijit/form/Button",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/Alert",
        "js/webext/widgets/table/TreeTable",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/ColumnForm",
        "deploy/widgets/security/TeamSelector"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        xhr,
        domClass,
        domConstruct,
        on,
        Button,
        Dialog,
        Alert,
        Table,
        GenericConfirm,
        ColumnForm,
        TeamSelector
) {
    return declare('deploy.widgets.settings.CloudConnections',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="cloudConnections">'+
            '  <div class="listTopButtons" data-dojo-attach-point="buttonTopAttach"></div>'+
            '  <div data-dojo-attach-point="gridAttach"></div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            xhr.get({
                "url": bootstrap.restUrl + "security/teamsWithCreateAction/Cloud Connection",
                "handleAs": "json",
                "sync": true,
                "load": function(data) {
                    var extendedSecurity = {"teams": data};
                    self.extendedSecurity = extendedSecurity;
                }
            });

            var gridRestUrl = bootstrap.restUrl+"resource/cloud/connection";
            var gridLayout = [{
                name: i18n("Name"),
                field: "name"
            },{
                name: i18n("Hostname"),
                field: "url"
            },{
                name: i18n("Username"),
                field: "username"
            },{
                name: i18n("Description"),
                field: "description"
            },{
                name: i18n("Actions"),
                formatter: function(item) {
                    return self.actionsFormatter(item);
                }
            }];

            this.grid = new Table({
                url: gridRestUrl,
                serverSideProcessing: false,
                columns: gridLayout,
                tableConfigKey: "cloudConnectionList",
                noDataMessage: i18n("No cloud connections have been created yet."),
                hideExpandCollapse: true,
                hidePagination: false
            });
            this.grid.placeAt(this.gridAttach);

            this.newConnectionBtn = new Button({
                label: i18n('New Connection...'),
                onClick: function(evt){ 
                    var newConnectionDlg = new Dialog({
                        title: i18n("New Cloud Connection"),
                        closable: true,
                        draggable:true,
                        description: i18n("To create a cloud connection, specify the cloud system " +
                                "to connect to and the credentials for that cloud system. Make " +
                                "sure that you have a user account on the cloud system and that " +
                                "you have the permissions to read information about virtual system " +
                                "patterns, IP groups, cloud groups, and environment profiles.")
                    });
                    
                    this.form = new ColumnForm({
                        submitUrl: bootstrap.restUrl+"resource/cloud/connection",
                        postSubmit: function(data) {
                            newConnectionDlg.hide();
                            newConnectionDlg.destroy();
                            if (self.callback !== undefined) {
                                self.callback(data);
                            }
                        }, 
                        addData: function(data) {
                            data.teamMappings = self.teamSelector.teams;
                        },
                        onError: function(error) {
                            if (error.responseText) {
                                var wrongNameAlert = new Alert({
                                    message: util.escape(error.responseText)
                                });
                            }
                        },
                        onCancel: function() {
                            newConnectionDlg.hide();
                            newConnectionDlg.destroy();
                            if (self.callback !== undefined) {
                                self.callback();
                            } 
                        }
                    });
                    
                    this.form.addField({
                        name: "name",
                        label: i18n("Name"),
                        required: false,
                        type: "Text"
                    });
                    this.form.addField({
                        name: "url",
                        label: i18n("Management Console"),
                        required: true,
                        type: "Text",
                        textDir: "ltr",
                        placeholder: "<hostname>",
                        description: i18n("Specify the host name of the cloud system.")
                    });
                    this.form.addField({
                        name: "username",
                        label: i18n("Username"),
                        required: true,
                        type: "Text"
                    });
                    this.form.addField({
                        name: "password",
                        label: i18n("Password"),
                        required: true,
                        type: "Secure"
                    });
                    this.form.addField({
                        name: "description",
                        label: i18n("Description"),
                        required: false,
                        type: "Text"
                    });

                    var currentTeams = [];
                    if (!!self.extendedSecurity && !!self.extendedSecurity.teams) {
                        currentTeams = self.extendedSecurity.teams;
                    }
                    self.teamSelector = new TeamSelector({
                        resourceRoleType: "Cloud Connection",
                        noneLabel: i18n("Standard Cloud Connection"),
                        teams: currentTeams
                    });
                    this.form.addField({
                        name: "teams",
                        label: i18n("Teams"),
                        type: "Text",
                        widget: self.teamSelector
                    });
                    this.form.placeAt(newConnectionDlg.containerNode);
                    
                    newConnectionDlg.show();
                }
            });
            domClass.add(this.newConnectionBtn.domNode, "idxButtonSpecial");
            this.newConnectionBtn.placeAt(this.buttonTopAttach);
            
            // add the button as well
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
        cloudConnectionsFormatter: function(item) {
           var result = document.createElement("a");
           result.href = "resource/cloud/connection/"+item.id;
           result.innerHTML = item.name.escape();
           return result;
       },
       
       callback: function() {
           this.grid.refresh();
       },
       
       /**
       *
       */
       actionsFormatter: function(item) {
           var self = this;
           
           var result = document.createElement("div");
           if (item.security["Edit Basic Settings"]) {
               var editLink = domConstruct.create("a", {
                   "innerHTML": i18n("Edit"),
                   "class": "actionsLink linkPointer"
               }, result);
               on(editLink, "click", function() {
                   
                   var innerSelf = this;
                   
                   xhr.get({
                       url: bootstrap.restUrl+"resource/cloud/connection/"+item.id,
                       handleAs: "json",
                       sync: true,
                       load: function(data) {
                           var extendedSecurity = data.extendedSecurity;
                           innerSelf.extendedSecurity = extendedSecurity;
                       }
                   });
                   
                   var editConnectionDlg = new Dialog({
                       title: i18n("Edit Cloud Connection"),
                       closable: true,
                       draggable:true
                   });
                   
                   this.form = new ColumnForm({
                       submitUrl: bootstrap.restUrl+"resource/cloud/connection",
                       postSubmit: function(data) {
                           editConnectionDlg.hide();
                           editConnectionDlg.destroy();
                           if (self.callback !== undefined) {
                               self.callback(data);
                           }
                       }, 
                       addData: function(data) {
                           data.teamMappings = innerSelf.teamSelector.teams;   
                       },
                       onCancel: function() {
                           editConnectionDlg.hide();
                           editConnectionDlg.destroy();
                           if (self.callback !== undefined) {
                               self.callback();
                           } 
                       }
                   });
                   
                   this.form.addField({
                       name: "name",
                       label: i18n("Name"),
                       required: false,
                       type: "Text",
                       value: item.name
                   });
                   this.form.addField({
                       name: "url",
                       label: i18n("Management Console"),
                       required: true,
                       type: "Text",
                       textDir: "ltr",
                       value: item.url
                   });
                   this.form.addField({
                       name: "username",
                       label: i18n("Username"),
                       required: true,
                       type: "Text",
                       value: item.username
                   });
                   this.form.addField({
                       name: "password",
                       label: i18n("Password"),
                       required: true,
                       type: "Secure",
                       value: "****"
                   });
                   this.form.addField({
                       name: "description",
                       label: i18n("Description"),
                       required: false,
                       type: "Text",
                       value: item.description
                   });
                   var currentTeams = [];
                   if (innerSelf.extendedSecurity.teams) {
                       currentTeams = innerSelf.extendedSecurity.teams;
                   }
                   this.teamSelector = new TeamSelector({
                       resourceRoleType: "Cloud Connection",
                       noneLabel: i18n("Standard Cloud Connection"),
                       teams: currentTeams
                   });
                   this.form.addField({
                       name: "teams",
                       label: i18n("Teams"),
                       type: "Text",
                       widget: this.teamSelector
                   });
                   this.form.addField({
                       name: "existingId",
                       label: i18n("Id"),
                       required: false,
                       type: "Hidden",
                       value: item.id
                   });
                   this.form.placeAt(editConnectionDlg.containerNode);
                   
                   editConnectionDlg.show();
               });
           }
           if (item.security.Delete) {
               var deleteLink = domConstruct.create("a", {
                   "innerHTML": i18n("Delete"),
                   "class": "actionsLink linkPointer"
               }, result);
               on(deleteLink, "click", function() {
                   self.confirmDelete(item);
               });
           }

           return result;
      },
      
      confirmDelete: function(target) {
          var self = this;
          
          var confirm = new GenericConfirm({
              message: i18n("Are you sure you want to delete %s? This will permanently delete it from the system.",
                       util.escape(target.name)),
              action: function() {
                  self.grid.block();
                  xhr.del({
                      url: bootstrap.restUrl+"resource/cloud/connection/"+target.id,
                      handleAs: "json",
                      load: function(data) {
                          self.grid.unblock();
                          self.grid.refresh();
                      },
                      error: function(error) {
                          var alert = new Alert({
                              messages: [i18n("Error deleting cloud connection:"),
                                         "",
                                         util.escape(error.responseText)]
                          });
                          alert.startup();
                          self.grid.unblock();
                      }
                  });
              }
          });
      }
    });
});
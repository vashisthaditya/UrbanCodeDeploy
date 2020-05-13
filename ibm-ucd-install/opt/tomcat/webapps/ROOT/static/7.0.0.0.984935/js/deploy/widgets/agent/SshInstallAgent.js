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
        "dijit/form/Button",
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/on",
        "dojo/json",
        "js/util/blocker/_BlockerMixin",
        "js/webext/widgets/Alert",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/RestSelect",
        "dojo/dom-construct",
        "js/webext/widgets/DomNode",
        "js/webext/widgets/Dialog",
        "deploy/widgets/agent/EditAgentInstallProps",
        "deploy/widgets/security/TeamSelector"
        ],
function(
        Button,
        _TemplatedMixin,
        _Widget,
        declare,
        xhr,
        on,
        JSON,
        _BlockerMixin,
        Alert,
        ColumnForm,
        RestSelect,
        domConstruct,
        DomNode,
        Dialog,
        EditAgentInstallProps,
        TeamSelector
) {
    return declare('deploy.widgets.agent.SshInstallAgent',  [_Widget, _TemplatedMixin, _BlockerMixin], {
        templateString:
            '<div class="installAgent">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        /**
         *
         */

        agent: undefined,
        type: "ssh",
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            var submitUrl = bootstrap.restUrl + "agent/" + this.type + "InstallAgent";
            if (self.agent) {
                submitUrl += "/" + self.agent.id;
            }
            this.form = new ColumnForm({
                "submitUrl": submitUrl,
                preSubmit: function(data) {
                    self.block();
                },
                addData: function(data) {
                    data.teamMappings = self.teamSelector.teams;
                },
                postSubmit: function () {
                    self.unblock();
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                },
                onError: function(response) {
                    self.unblock();
                    var alert = new Alert({
                        message: util.escape(response.responseText)
                    });
                    alert.startup();
                },
                onCancel: function() {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                }
            });
            

            if (!self.agent) {
                this.form.addField({
                    name: "hosts",
                    label: i18n("Target Hosts"),
                    required: true,
                    type: "Text Area",
                    placeholder: "localhost\n10.10.10.10",
                    description: i18n("Enter the host name or IP address of the system where you want to install the agent. To specify multiple entries, type each one on a separate line. On Windows, agent names are the same as the host names or IP addresses that you enter.")
                });

                if (self.type === "ssh") {
                    this.form.addField({
                        name: "port",
                        label: i18n("SSH Port"),
                        required: true,
                        type: "Text",
                        textDir: "ltr",
                        value: "22",
                        description: i18n("The SSH port address of the target system.")
                    });
                }
            }

            this.form.addField({
                name: "username",
                label: i18n("Username"),
                required: true,
                type: "Text",
                description: i18n("Enter the name of the user with appropriate permissions on the target host.")
            });

            var usePublicKeyField;
            if (this.type === "ssh" || !this.type) {
                usePublicKeyField = this.form.addField({
                    name: "usePublicKey",
                    label: i18n("Use Public Key Authentication"),
                    type: "Checkbox",
                    description: i18n("Select the <b>Use Public Key Authentication</b> check box to use public key authentication instead of a password.")
                });
            }

            this.form.addField({
                name: "password",
                label: i18n("Password"),
                required: true,
                type: "Secure",
                description: i18n("Enter the password that is associated with the user in the <b>Password</b> field.")
            });

            if (usePublicKeyField) {
                on(usePublicKeyField.widget, "change", function(){
                    var passwordRow;
                    if (usePublicKeyField.widget.checked) {
                        self.form.removeField("password");
                    } else {
                        self.form.addField({
                            name: "password",
                            label: i18n("Password"),
                            required: true,
                            type: "Secure",
                            description: i18n("Password to use to ssh/winrs to the agent machine.")
                        }, "name");
                    }
                });
            }

            if (!self.agent && self.type === "ssh") {
                this.form.addField({
                    //Changing this field name / location will affect password field upon publickey checkbox toggle
                    name: "name",
                    label: i18n("Agent Name"),
                    required: true,
                    type: "Text",
                    description: i18n("Name for the agent. If you enter multiple hosts in the <b>Target Hosts</b> field, the agent name is appended with a number. The number is incremented for each host after the first one. For example, if you enter my_agent as the agent name and specify three hosts, the name of the agent for the first host is my_agent, the name of the agent for the second host is my_agent1, and the name of the third agent is my_agent2. Host names are processed from beginning of the list to the end.")
                });
            }

            self.createAgentInstallPropsSelect();

            this.form.addField({
                name: "agentInstallProps",
                label: i18n("Agent Installation Properties") ,
                description: i18n("Select an agent installation property sheet from the <b>Agent Installation Properties</b> list, or use <b>New</b> to create a property sheet. Agent installation property sheets are templates that can be saved and used to install agents. You can create any number of agent installation property sheets."),
                required: true,
                widget: self.agentInstallPropsDomNode
            });

            var defaultTeams = [];
            xhr.get({
                url: bootstrap.restUrl+"security/teamsWithCreateAction/Agent",
                handleAs: "json",
                sync: true,
                load: function(data) {
                    defaultTeams = data;
                }
            });
            
            self.teamSelector = new TeamSelector({
                resourceRoleType: "Agent",
                noneLabel: i18n("Standard Agent"),
                teams: defaultTeams
            });
            self.form.addField({
                name: "teams",
                label: i18n("Teams"),
                type: "Text",
                widget: self.teamSelector
            });
        },

        createAgentInstallPropsSelect: function(value) {
            var self = this;
            if (self.agentInstallPropsDomNode && self.agentInstallPropsDomNode.domAttach) {
                domConstruct.empty(this.agentInstallPropsDomNode.domAttach);
            }
            else {
                self.agentInstallPropsDomNode = new DomNode({});
            }

            self.agentInstallPropsSelect = new RestSelect({
                restUrl: bootstrap.restUrl + "agent/installprops/" + self.type,
                required : true,
                onChange: function(value) {
                    self.addEditAgentInstallPropsButton(self.agentInstallPropsDomNode.domNode);
                    self.agentInstallPropsDomNode.set("value", value);
                },
                "value":value,
                style: {
                    verticalAlign: "bottom"
                }
            });

            var newAgentInstallPropsButton = {
                label: i18n("New"),
                showTitle: false,
                onClick: function() {
                    self.showEditAgentInstallPropsDialog();
                }
            };

            var createButton = new Button(newAgentInstallPropsButton);

            self.agentInstallPropsSelect.placeAt(self.agentInstallPropsDomNode.domAttach);
            self.addEditAgentInstallPropsButton();
            createButton.placeAt(self.agentInstallPropsDomNode.domAttach);
        },

        addEditAgentInstallPropsButton : function() {
            var self = this;
            if (self.agentInstallPropsEditButton) {
                self.agentInstallPropsEditButton.destroy();
            }
            if (self.agentInstallPropsSelect && self.agentInstallPropsSelect.get('value')) {
                var editAgentInstallPropsButton = {
                    label: i18n("Edit"),
                    showTitle: false,
                    onClick: function() {
                        self.showEditAgentInstallPropsDialog(self.agentInstallPropsSelect._getItemAttr());
                    }
                };

                self.agentInstallPropsEditButton = new Button(editAgentInstallPropsButton);
                self.agentInstallPropsEditButton.placeAt(self.agentInstallPropsDomNode.domAttach);
            }
        },

        showEditAgentInstallPropsDialog: function(props) {
            var self = this;

            var newAgentInstallPropsDialog = new Dialog({
                title: i18n("Edit Agent Installation Properties"),
                closable: true,
                draggable: true
            });

            var editAgentInstallPropsForm = new EditAgentInstallProps({
                'type':self.type,
                agentInstallProps: props,
                callback: function(data) {
                    newAgentInstallPropsDialog.hide();
                    newAgentInstallPropsDialog.destroy();
                    self.createAgentInstallPropsSelect(data ? data.id : (props ? props.id : undefined));
                }
            });
            editAgentInstallPropsForm.placeAt(newAgentInstallPropsDialog.containerNode);
            newAgentInstallPropsDialog.show();
        },
        /**
         *
         */
        startup: function() {
            this.inherited(arguments);

            this.form.startup();
            this.form.placeAt(this.formAttach);
        }
    });
});

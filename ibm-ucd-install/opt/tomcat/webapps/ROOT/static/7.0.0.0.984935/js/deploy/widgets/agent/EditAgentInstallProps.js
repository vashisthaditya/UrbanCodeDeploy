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
        "js/webext/widgets/ColumnForm"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        ColumnForm
) {
    return declare('deploy.widgets.agent.EditAgentInstallProps',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="editScript">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        type: "ssh",
        /**
         * 
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            
            if (this.agentInstallProps) {
                this.existingValues = this.agentInstallProps;
            }
            else if (this.source) {
                this.existingValues = this.source;
                
                this.existingValues.name = undefined;
                this.existingValues.id = undefined;
            }
            
            this.form = new ColumnForm({
                submitUrl: bootstrap.restUrl+"agent/installprops/" + self.type,
                postSubmit: function(data) {
                    if (self.callback !== undefined) {
                        self.callback(data);
                    }
                },
                addData: function(data) {
                    if (self.agentInstallProps && self.agentInstallProps.id) {
                        data.id = self.agentInstallProps.id;
                    }
                },
                onCancel: function() {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                }
            });
            var SSH = "ssh";

            var name;
            var description;
            var agentDir;
            var javaHomePath;
            var tempDirPath;
            var serverHost;
            var serverPort;
            var proxyPort;
            var autoStart;
            var serviceName;
            var serviceUser;
            var servicePassword;
            
            
            if (this.existingValues) {
                name = this.existingValues.name;
                description = this.existingValues.description;
                agentDir = this.existingValues.agentDir;
                javaHomePath = this.existingValues.javaHomePath;
                tempDirPath = this.existingValues.tempDirPath;
                serverHost = this.existingValues.serverHost;
                serverPort = this.existingValues.serverPort;
                proxyPort = this.existingValues.proxyPort;
                autoStart = this.existingValues.autoStart;
                serviceName = this.existingValues.serviceName;
                serviceUser = this.existingValues.serviceUser;
                servicePassword = this.existingValues.servicePassword;
            }
            
            this.form.addField({
                name: "name",
                label: i18n("Name"),
                required: true,
                type: "Text",
                description: i18n("Name of the agent installation property sheet."),
                value: name
            });
            
            this.form.addField({
                name: "description",
                label: i18n("Description"),
                type: "Text",
                description: i18n("Property sheet description."),
                value: description
            });
            
            this.form.addField({
                name: "agentDir",
                label: i18n("Agent Dir"),
                required: true,
                type: "Text",
                textDir: "ltr",
                value: agentDir || (self.type === SSH ? "/opt/ucd/agent" : "C:\\Program Files\\agent"),
                description: i18n("Directory on the target where the agent is installed.")
            });

            this.form.addField({
                name: "javaHomePath",
                label: i18n("Java Home Path"),
                required: true,
                type: "Text",
                textDir: "ltr",
                value: javaHomePath || (self.type === SSH ? "/usr/lib/jvm/default-java" : "C:\\Program Files\\Java\\jre"),
                description: i18n("Literal path to Java on the target, such as C:\\Program Files\\Java\\jre or /usr/lib/jvm/default-java. Do not use any variables in this field, including the $JAVA_HOME variable.")
            });

            this.form.addField({
                name: "tempDirPath",
                label: i18n("Temp Dir Path"),
                required: true,
                type: "Text",
                textDir: "ltr",
                value: tempDirPath || (self.type === SSH ? "/tmp" : "%tmp%"),
                description: i18n("Path to the directory that is used during installation for temporary files.")
            });

            this.form.addField({
                name: "serverHost",
                label: i18n("Server Host"),
                required: true,
                type: "Text",
                textDir: "ltr",
                value: serverHost || config.data.systemConfiguration.externalHost,
                description: i18n("Host name or IP of the %s server or agent relay to which the agent connects.", bootstrap.productName)
            });

            this.form.addField({
                name: "serverPort",
                label: i18n("Server Port"),
                required: true,
                type: "Text",
                textDir: "ltr",
                value: serverPort || "7918",
                description: i18n("The port that is used by the %s server or agent relay to connect to the agent. The default value is 7918 for the server, and 7916 for the agent relay.", bootstrap.productName)
            });

            this.form.addField({
                name: "proxyPort",
                label: i18n("Proxy Port"),
                type: "Text",
                textDir: "ltr",
                value: proxyPort,
                description: i18n("HTTP port of the agent relay, if used. The default value is 20080.")
            });
            
            if (self.type === "winrs") {
                this.form.addField({
                    name: "autoStart",
                    label: i18n("Auto Start"),
                    type: "Checkbox",
                    value: autoStart,
                    description: i18n("If you want to install the agent as a service, select <b>Auto Start</b> to run the agent automatically when Windows starts. Windows only.")
                });
                
                this.form.addField({
                    name: "serviceName",
                    label: i18n("Service Name"),
                    type: "Text",
                    value: serviceName || "ucdagent",
                    description: i18n("If the agent is installed as a service, enter a name for the agent service. Windows only.")
                });
                
                this.form.addField({
                    name: "serviceUser",
                    label: i18n("Service User"),
                    type: "Text",
                    value: serviceUser || ".\\localsystem",
                    description: i18n("If the agent is installed as a service, enter a user name that has appropriate permission to run a service. Windows only.")
                });
                
                this.form.addField({
                    name: "servicePass",
                    label: i18n("Service Password"),
                    type: "Secure",
                    value: servicePassword || "",
                    description: i18n("If the agent is installed as a service, enter the password that is associated with the service user. Windows only.")
                });
            }
            
            this.form.placeAt(this.formAttach);
        }
    });
});

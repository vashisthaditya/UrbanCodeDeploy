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
        "dojo/_base/xhr",
        "dojo/dom-class",
        "dojo/_base/array",
        "dojo/_base/declare",
        "js/webext/widgets/Alert",
        "js/webext/widgets/GenericConfirm"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        xhr,
        domClass,
        array,
        declare,
        Alert,
        GenericConfirm
) {
    return declare('deploy.widgets.agent.EditAgent',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div>' +
            '  <div style="display:inline-block;">' +
            '  <div>' +
            '    <span data-dojo-attach-point="apiKeyLabelAttach" class="agent-security-label"></span>' +
            '    <span data-dojo-attach-point="apiKeyValueAttach" class="agent-security-value"></span>' +
            '  </div>' +
            '    <div data-dojo-attach-point="revokeApiKeyButtonAttach" style="padding-bottom:32px;"></div>' +
            '  <div>' +
            '    <span data-dojo-attach-point="subjectLabelAttach" class="agent-security-label"></span>' +
            '    <span data-dojo-attach-point="subjectValueAttach" class="agent-security-value"></span>' +
            '  </div>' +
            '  <div>' +
            '    <span data-dojo-attach-point="issuingAuthorityLabelAttach" class="agent-security-label"></span>' +
            '    <span data-dojo-attach-point="issuingAuthorityValueAttach" class="agent-security-value"></span>' +
            '  </div>' +
            '  <div>' +
            '    <span data-dojo-attach-point="notBeforeLabelAttach" class="agent-security-label"></span>' +
            '    <span data-dojo-attach-point="notBeforeValueAttach" class="agent-security-value"></span>' +
            '  </div>' +
            '  <div>' +
            '    <span data-dojo-attach-point="notAfterLabelAttach" class="agent-security-label"></span>' +
            '    <span data-dojo-attach-point="notAfterValueAttach" class="agent-security-value"></span>' +
            '  </div>' +
            '  <div>' +
            '    <span data-dojo-attach-point="fingerprintLabelAttach" class="agent-security-label"></span>' +
            '    <span data-dojo-attach-point="fingerprintValueAttach" class="agent-security-value"></span>' +
            '  </div>' +
            '  <div data-dojo-attach-point="revokeIdentityCertButtonAttach"></div>' +
            '  </div>' +
            '</div>',

        /**
         * This requires a value for agent to be passed via TemplatedMixin.
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            if (config.data.permissions["Manage Security"]) {
                xhr.get({
                    url: bootstrap.restUrl + "agent/" + self.agent.id + "/jmsCertificate",
                    handleAs: "json",
                    load: function(response) {
                        if (!!response.subject) {
                            if (config.data.permissions["Manage Security"]) {
                                self.revokeIdentityCertButton = self.createRevokeIdentityCertButton();
                                self.revokeIdentityCertButton.placeAt(self.revokeIdentityCertButtonAttach);

                                self.agent.jmsSubject = response.subject;
                                self.agent.jmsIssuingAuthority = response.issuingAuthority;
                                self.agent.jmsNotBefore = response.notBefore;
                                self.agent.jmsNotAfter = response.notAfter;
                                self.agent.jmsFingerprint = response.fingerprint;

                                self.subjectLabelAttach.innerHTML = i18n("Subject: ");
                                self.subjectValueAttach.innerHTML = util.escape(self.agent.jmsSubject);

                                self.issuingAuthorityLabelAttach.innerHTML = i18n("Issuing Authority: ");
                                self.issuingAuthorityValueAttach.innerHTML = util.escape(self.agent.jmsIssuingAuthority);

                                self.notBeforeLabelAttach.innerHTML = i18n("Not Before: ");
                                self.notBeforeValueAttach.innerHTML = util.escape(util.dateFormatShort(self.agent.jmsNotBefore));

                                self.notAfterLabelAttach.innerHTML = i18n("Not After: ");
                                self.notAfterValueAttach.innerHTML = util.escape(util.dateFormatShort(self.agent.jmsNotAfter));

                                self.fingerprintLabelAttach.innerHTML = i18n("SHA256 Fingerprint: ");
                                self.fingerprintValueAttach.innerHTML = util.escape(self.agent.jmsFingerprint);
                            }
                        }
                    },
                    error: function(error) {
                        var alert = new Alert({
                            messages: [i18n("Error determining if JMS Certificate exists"),
                                       "",
                                       util.escape(error.responseText)]
                        });
                        alert.startup();
                    }
                });
            }

            xhr.get({
                url: bootstrap.restUrl + "agent/" + self.agent.id + "/apiKey",
                handleAs: "json",
                load: function(response) {
                    if (response.apiKey) {
                        self.agent.apiKey = response.apiKey;
                        if (self.agent.apiKey && config.data.permissions["Manage Security"]) {
                            self.revokeApiKeyButton = self.createRevokeApiKeyButton();
                            self.revokeApiKeyButton.placeAt(self.revokeApiKeyButtonAttach);

                            self.apiKeyLabelAttach.innerHTML = i18n("API Key: ");
                            self.apiKeyValueAttach.innerHTML = util.escape(self.agent.apiKey);
                        }
                    }
                },
                error: function(error) {
                    var alert = new Alert({
                        messages: [i18n("Error retrieving API Key"),
                                   "",
                                   util.escape(error.responseText)]
                    });
                    alert.startup();
                }
            });
        },

        createRevokeIdentityCertButton: function() {
            var self = this;

            var button = new Button({
                showTitle:true,
                label: i18n("Forget JMS certificate"),
                onClick: function() {
                    self.confirmRevokeIdentityCert();
                }
            });

            domClass.add(button.domNode, "idxButtonSpecial");

            return button;
        },

        confirmRevokeIdentityCert: function() {
            var self = this;

            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to revoke this agent's JMS certificate? " +
                        "This will permanently remove it from the system."),
                confirmLabel: i18n("Revoke"),
                cancelLabel: i18n("Do not revoke"),
                action: function() {
                    xhr.del({
                        url: bootstrap.restUrl + "agent/" + self.agent.id + "/jmsCert",
                        handleAs: "json",
                        load: function(response) {
                            self.revokeIdentityCertButton.destroy();
                            self.agent.hasJmsCertificate = undefined;
                        },
                        error: function(error) {
                            var alert = new Alert({
                                messages: [i18n("Error revoking certificate"),
                                           "",
                                           util.escape(error.responseText)]
                            });
                            alert.startup();
                        }
                    });
                }
            });
        },

        createRevokeApiKeyButton: function() {
            var self = this;

            var button = new Button({
                showTitle: true,
                label: i18n("Forget API Key"),
                onClick: function() {
                    self.confirmRevokeApiKey();
                }
            });

            domClass.add(button.domNode, "idxButtonSpecial");

            return button;
        },

        confirmRevokeApiKey: function() {
            var self = this;

            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to revoke this agent's API Key? " +
                        "This will permanently remove it from the system."),
                confirmLabel: i18n("Revoke"),
                cancelLabel: i18n("Do not revoke"),
                action: function() {
                    xhr.del({
                        url: bootstrap.restUrl + "apikey/agent/" + self.agent.id,
                        handleAs: "json",
                        load: function(response) {
                            self.agent.apiKey = undefined;
                            self.revokeApiKeyButton.destroy();
                            self.apiKeyLabelAttach.innerHTML = "";
                            self.apiKeyValueAttach.innerHTML = "";
                        },
                        error: function(error) {
                            var alert = new Alert({
                                messages: [i18n("Error revoking API Key"),
                                           "",
                                           util.escape(error.responseText)]
                            });
                            alert.startup();
                        }
                    });
                }
            });
        }
    });
});
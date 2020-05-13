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
define(['dojo/_base/declare',
        'dojo/request/xhr',
        'dijit/_WidgetBase',
        'dojo/on',
        'dojo/dom-class',
        'dojo/dom-construct',
        'dijit/focus',
        'js/webext/widgets/Dialog'],
        function (
            declare,
            xhr,
            _WidgetBase,
            on,
            domClass,
            domConstruct,
            focusUtil,
            Dialog) {
    /**
     *
     * Supported public properties/functions:
     *  name / String                   (required) The name of the alert. The name is important for determining user
     *                                  preference of when to show or not show the popup. It is saved in the backend.
     *
     *  open / Function                 Function to show the popup
     *
     *  close / Function                Function to hide the popup
     *
     */
    return declare('deploy.widgets.firstDayWizard.WhatsNextPopup',
            [_WidgetBase], {

        name: undefined,

        /**
         * create dialog
         * check backend to determine whether to automatically show the get-started dialog
         * @private
         */
        postCreate: function() {
            var self = this;

            this.createDialog();
        },

        /**
         * @private
         */
        createDialog: function() {
            var self = this;
            this.wnDialog = new Dialog({
                className: 'whats-next-popup'
            });

            var whatsNextCloseButton = domConstruct.create('div', {
                className: 'close-popup-button',
                title: i18n('Close')
            }, this.wnDialog.titleNode);
            on(whatsNextCloseButton, 'click', function() {
                self.close();
            });

            domConstruct.create('div', {
               innerHTML: '<h1 class="title">' + i18n("What's Next?") + '</h1>' +
                              '<br><br>' +
                              '<div class="content">' +
                                '<span>'+ i18n("Congratulations on completing an application in UrbanCode Deploy!") + '</span>' +
                                '<br><br>' +
                                '<span>'+ i18n("Before you run this application, you may want to undertake these actions:") + '</span>' +
                                '<br><br>' +
                                '<ul><li>' + i18n("Bring the importing and target agents online. ") +
                                    '<a class="linkPointer" href="' + config.docLinks.howToRunAgentUrl + '" target="_blank">'+ i18n("Starting agents") + '</a></li>' +
                                '<br>' +
                                '<li>' + i18n("Wait for component versions to be transferred.  You can check the status of import on the Components tab. ") + '</li>' +
                                '<br>' +
                                '<li>' + i18n("Set any required properties on environments or components. ") +
                                    '<a class="linkPointer" href="' + config.docLinks.propertiesOverviewUrl + '" target="_blank">'+ i18n("Properties") + '</a></li>' +
                                '<br>' +
                                '<li>' + i18n("Finishing the process designs for the components and application. ") +
                                    '<a class="linkPointer" href="' + config.docLinks.howToDesignWorkflowUrl + '" target="_blank">'+ i18n("Processes") + '</a></li>' +
                                '<br>' +
                                '<li>' + i18n("Set up teams and configure security for the new application, environments, and components that you created. ") +
                                    '<a class="linkPointer" href="' + config.docLinks.howToSetupRolesAndPermissionsUrl + '" target="_blank">' + i18n("Roles and permissions") + "</a> " + 
                                    '<a class="linkPointer" href="' + config.docLinks.howToSetupTeamSecurityUrl + '" target="_blank">' + i18n("Security teams") + '</a></li>' +
                                '<br>' +
                                '<li>' + i18n("For best results and the most up-to-date artifact availability, configure your build integration tools to push artifacts to the UrbanCode Deploy server. For Example: ") +
                                    '<a class="linkPointer" href="' + config.docLinks.jenkinsIntegrationUrl + '" target="_blank">'+ i18n("Integrating Jenkins and IBM UrbanCode Deploy") + '</a></li>' +
                                '<br>' +
                                '<div class="message">' + i18n("Access this at anytime from the banner help menu") + '</div>' +
                              '</div>'
            }, this.wnDialog.containerNode);
        },

        /**
         * Used to allow for accessibility.
         * @private
         */
        a11yClick: function(event) {
            if (event.type === 'click') {
                return true;
            }
            if (event.type === 'keypress') {
                //covers space and enter
                var code = event.charCode || event.keyCode;
                if ((code === 32) || (code === 13)) {
                    return true;
                }
            }
            return false;
        },


        /**
         * @public
         */
        open: function() {
            if (this.wnDialog) {
                this.wnDialog.show();
            }
        },

        /**
         * @public
         */
        close: function() {
            if (this.wnDialog) {
               this.wnDialog.hide();
            }
        }

    });
});

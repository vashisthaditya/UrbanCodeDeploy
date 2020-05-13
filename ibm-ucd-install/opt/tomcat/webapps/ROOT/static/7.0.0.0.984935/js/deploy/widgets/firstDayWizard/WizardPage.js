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
/*global define, require, wizardData */
define([
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dijit/_Container",
        "dojo/_base/connect",
        "dojo/_base/declare",
        "dojo/_base/array",
        "dojo/dom-construct",
        "dojo/dom-attr",
        "dojo/dom-style",
        "dojo/on",
        "dojox/widget/WizardPane",
        "deploy/widgets/firstDayWizard/FirstDayWizard",
        "deploy/widgets/firstDayWizard/Paginator"
        ],
function(
        _TemplatedMixin,
        _Widget,
        _Container,
        connect,
        declare,
        array,
        domConstruct,
        domAttr,
        domStyle,
        on,
        WizardPane,
        FirstDayWizard,
        Paginator
) {
    return declare([_Widget], {

        postCreate: function() {
            this.inherited(arguments);

            domConstruct.empty("fdw-light-title");
            domConstruct.place('<span>' + i18n("Create an Application") + '</span>',
                               "fdw-light-title");

            domConstruct.empty("fdw-wizard");
            var wizard = new FirstDayWizard();
            domConstruct.place(wizard.domNode, "fdw-wizard");

            domConstruct.empty("fdw-paginator");
            var paginator = new Paginator({wizardModel:wizard.model});
            domConstruct.place(paginator.containerNode, "fdw-paginator");

            wizard.startup();
            wizard.resize();
        }
    });
});

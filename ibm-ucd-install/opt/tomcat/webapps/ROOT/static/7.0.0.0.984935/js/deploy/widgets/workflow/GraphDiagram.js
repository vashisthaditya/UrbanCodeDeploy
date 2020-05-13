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
    "dijit/_TemplatedMixin",
    "dijit/_Widget"],

function(
    declare,
    _TemplatedMixin,
    _Widget) {

    return declare('deploy.widgets.workflow.GraphDiagram', [_Widget, _TemplatedMixin], {
        templateString:
         '<div data-dojo-attach-point="graphContainer">' +
            '<div data-dojo-attach-point="dialogAttach" class="hide-notification process-save-dialog"></div>' +
            '<div>' +
                '<div data-dojo-attach-point="toolbarAttach"></div>' +
                '<div data-dojo-attach-point="mxgraphAttach" class="graphView"></div>' +
            '</div>' +
            '<div data-dojo-attach-point="magnifyAttach" class="graphMagnify"></div>' +
            '<div data-dojo-attach-point="outlineAttach" class="graphOutline"></div>' +
            '<div data-dojo-attach-point="helpAttach" class="designer-help">' +
            '  <div>' +
            '    <a class="linkPointer" data-dojo-attach-point="hideHelpAttach">' +
                       i18n("Hide Help") + '</a>' +
            '  </div>' +
            '  <h2>' + i18n("About the Process Flow Designer") + '</h2>' +
            '  <p>' +
                 i18n("Before you design a process, you must understand the sequence of tasks that the process models. For example, in a deployment task, you might need to know the source and destination locations of a WAR file or prepare a script that the process runs.") +
            '  </p>' +
            '  <p>' +
                 i18n("To define a process:") +
            '    <ul>' +
            '     <li>' + i18n("Add a step. Take the following actions:") + '</li>' +
            '       <ul>' +
            '         <li>' + i18n("Locate the appropriate step in the palette. If you know the name of the step, you can search for it.") + '</li>' +
            '         <li>' + i18n("Drag the step from the palette into the design space.") + '</li>' +
            '         <li>' + i18n("Provide values for all required properties.") + '</li>' +
            '       </ul>' +
            '     <li>' + i18n("In this manner, add all the required steps to the process.") + '</li>' +
            '     <li>' + i18n("Connect the steps in the order that they run. Each step in the process must connect to other steps. You can set steps to run in sequence or in parallel, but each step must be included in the process flow. You must include the Start and Finish step in the sequence of process steps.") + '</li>' +
            '       <ul>' +
            '         <li>' + i18n("Hover the cursor over the step that you want to use as the origin of the connection. The connection tool is displayed.") + '</li>' +
            '         <li>' + i18n("Drag the connection tool over the target step. The step beneath the connection tool is highlighted.") + '</li>' +
            '         <li>' + i18n("Release the connection tool over the target step to complete the connection.") + '</li>' +
            '       </ul>' +
            '     <li>' + i18n("When your process is complete, click Done to return to wizard.") + '</li>' +
            '    </ul>' +
            '  </p>' +
            '  <p>&nbsp;</p>' +
            '</div>' +
        '</div>',

        postCreate: function() {
            this.inherited(arguments);
            this.editor.createGraph(this);
        }
    });
});

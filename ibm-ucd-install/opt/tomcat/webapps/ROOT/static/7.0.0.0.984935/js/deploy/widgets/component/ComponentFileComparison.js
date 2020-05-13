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
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "deploy/widgets/component/ComponentFileTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        array,
        declare,
        xhr,
        ComponentFileTable
) {
    return declare('deploy.widgets.component.ComponentFileComparison',  [_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="componentFileComparison">' + 
                '<div data-dojo-attach-point="tableAttach"></div>' +
            '</div>',

        /**
         * 
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            this.versionId = self.otherVersion;
            self.getVersion(this.versionId);
        },
        
        /**
         * 
         */
        
        getVersion: function(versionId) {
            var self = this;
            xhr.get({
                url: bootstrap.restUrl+"deploy/version/"+versionId,
                handleAs: "json",
                load: function(data) {
                    var componentFileTable = new ComponentFileTable({
                        component: appState.component,
                        version: self.version,
                        otherVersion: data
                    });
                    componentFileTable.placeAt(self.tableAttach); 
                }
            });
        },
        
        /**
         *
         */
        
        destroy: function() {
            this.inherited(arguments);
            
            array.forEach(this.componentFileTables, function(componentFileTable) {
                componentFileTable.destroy();
            });
        }
    });
});
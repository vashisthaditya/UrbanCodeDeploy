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
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/on",
        "js/webext/widgets/Dialog",
        "deploy/widgets/component/ComponentFileTable",
        "deploy/widgets/snapshotComparison/SnapshotZOSFileTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Array,
        declare,
        xhr,
        domClass,
        domConstruct,
        on,
        Dialog,
        ComponentFileTable,
        SnapshotZOSFileTable
) {
    /**
     *
     */
    return declare([_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="snapshotFiles">'+
                '<div data-dojo-attach-point="tableAttach"></div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;
            this.componentFileTables = [];
            xhr.get({
                url: bootstrap.restUrl+"deploy/snapshot/"+self.snapshot1.id+"/compareFiles/"+self.snapshot2.id,
                handleAs: "json",
                load: function(data) {
                    Array.forEach(data, function (item) {
                        if (item.tooMany) {
                            if (item.componentType === "ZOS") {
                                var zosFileCompare = new SnapshotZOSFileTable({
                                            componentName: item.component,
                                            artifacts: item.artifacts,
                                            snapshotName: self.snapshot1.name,
                                            otherSnapshotName: self.snapshot2.name
                                        });
                                self.componentFileTables.push(zosFileCompare);
                                zosFileCompare.placeAt(self.tableAttach);
                            }
                            else {
                                domConstruct.place('<div class="containerLabel">File Difference Report for '+item.component+'</div><div class="innerContainer" style="width: 1000px;"><div><br>' + item.tooMany + '<br></div></div>', self.tableAttach);
                            }
                        }
                        else {
                            var fileCompare = new ComponentFileTable({
                                component: item.component,
                                version: item.version1,
                                otherVersion: item.version2,
                                title1: "Snapshot: "+self.snapshot1.name + " ",
                                title2: "Snapshot: "+self.snapshot2.name + " "
                            });
                            self.componentFileTables.push(fileCompare);
                            fileCompare.placeAt(self.tableAttach);
                        }
                    });
                }
            });
        },

        /**
         *
         */
        destroy: function () {
             dojo.empty(this.tableAttach);
        }
    });
});

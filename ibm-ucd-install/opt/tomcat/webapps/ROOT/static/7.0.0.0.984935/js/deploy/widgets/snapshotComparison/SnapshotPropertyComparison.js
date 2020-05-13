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
        "dijit/form/CheckBox",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/dom-class",
        "dojo/dom-construct",
        "js/webext/widgets/table/TreeTable"
        ],
function(
        _TemplatedMixin,
        _Widget,
        CheckBox,
        declare,
        xhr,
        domClass,
        domConstruct,
        TreeTable
) {
    /**
     *
     */
    return declare([_Widget, _TemplatedMixin], {
        templateString: 
            '<div class="snapshotConfiguration">'+
            '    <div data-dojo-attach-point="checkboxAttach"></div>' +
                '<div data-dojo-attach-point="propertyComparison"></div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            var self = this;
            var resturl = bootstrap.restUrl + "deploy/snapshot/" + this.snapshot1.id + "/compareProperties/" + this.snapshot2.id + "/true";
            self.table = new TreeTable({
                url: resturl,
                noDataMessage: i18n("No changes found."),
                serverSideProcessing: false,
                tableConfigKey: "snapshotPropertyComparison",
                columns: [{
                    name: i18n("Property Name"),
                    field: "name"
                },{
                    name: this.snapshot1.name,
                    formatter: function(item) {
                        var result = "";
                        if (item.value) {
                            result = item.value;
                        }
                        return result;
                    }
                },{
                    name: this.snapshot2.name,
                    formatter: function(item) {
                        var result = "";
                        if (item.otherValue) {
                            result = item.otherValue;
                        }
                        return result;
                    }
                }]
            });
            
            self.table.placeAt(self.propertyComparison);
            
            var onlyChangedBox = new CheckBox({
                checked: true,
                value: 'true',
                onChange: function(value) {
                    if (value) {
                        self.table.url = bootstrap.restUrl+"deploy/snapshot/"+self.snapshot1.id+"/compareProperties/"+self.snapshot2.id+"/true";
                    }
                    else {
                        self.table.url = bootstrap.restUrl+"deploy/snapshot/"+self.snapshot1.id+"/compareProperties/"+self.snapshot2.id+"/false";
                    }
                    self.table.refresh();
                }
            });
            onlyChangedBox.placeAt(self.checkboxAttach);
            
            var onlyChangedLabel = document.createElement("div");
            domClass.add(onlyChangedLabel, "inlineBlock");
            onlyChangedLabel.style.position = "relative";
            onlyChangedLabel.style.top = "2px";
            onlyChangedLabel.style.left = "2px";
            onlyChangedLabel.innerHTML = i18n("Only Show Differences");
            this.checkboxAttach.appendChild(onlyChangedLabel);
        }
    });
});

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
        "js/webext/widgets/table/TreeTable",
        "deploy/widgets/Formatters"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        xhr,
        domClass,
        TreeTable,
        formatters
) {
    return declare('deploy.widgets.environment.EnvironmentCompliancy',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="environmentCompliancy">' +
                '<div class="compliancyHeaderContainer inline-block" data-dojo-attach-point="containerAttach">' +
                    '<div class="compliancyHeader" data-dojo-attach-point="headerAttach"></div>' +
                '</div>' +
                '<div data-dojo-attach-point="treeAttach"></div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            var compUrl = bootstrap.restUrl + "deploy/environment/"+appState.environment.id+"/compliancy";
            xhr.get({
                url:compUrl,
                handleAs:"json",
                load:function(data) {
                    var desired = data.compliancy.desiredCount;
                    var missing = data.compliancy.missingCount;
                    var correct = data.compliancy.correctCount;

                    var compliancyLabel = document.createElement("div");
                    var detailsLabel = document.createElement("span");
                    if (correct < desired) {
                        compliancyLabel.innerHTML = i18n("Noncompliant: ");
                        domClass.add(self.containerAttach, "failed-state-color");
                        self.containerAttach.style.marginBottom = "-2px";
                        detailsLabel.innerHTML = i18n("%s/%s (%s missing)", String(correct), String(desired), String(missing));

                        self.showTree();
                    }
                    else if (desired === 0) {
                        compliancyLabel.innerHTML = i18n("No Desired Inventory");
                        domClass.add(self.containerAttach, "gray-state-color");
                    }
                    else if (correct === desired) {
                        compliancyLabel.innerHTML = i18n("Compliant: ");
                        domClass.add(self.containerAttach, "success-state-color");
                        detailsLabel.innerHTML = String(correct)+"/"+String(desired);
                    }
                    compliancyLabel.appendChild(detailsLabel);
                    self.headerAttach.appendChild(compliancyLabel);
                }
            });
        },

        /**
         *
         */
        destroy: function() {
            this.inherited(arguments);
            if (this.tree) {
                this.tree.destroy();
            }
        },

        /**
         *
         */
        showTree: function() {

            var gridLayout = [{
                name: i18n("Resource/Component"),
                formatter: function(item, result, cellDom) {
                    var name;
                    if (item.version) {
                        name = formatters.componentLinkFormatter(item.version.component);
                    }
                    else {
                        name = formatters.resourcePathFormatter(item);
                    }
                    return name;
                },
                field: "name"
            },{
                name: i18n("Version"),
                formatter: function(item, result, cellDom) {
                    if (item.version) {
                        return formatters.versionLinkFormatter(item.version);
                    }
                }
            }];

            this.tree = new TreeTable({
                url: bootstrap.restUrl+"deploy/environment/"+appState.environment.id+"/noncompliantResources",
                columns: gridLayout,
                serverSideProcessing: false,
                orderField: "name",
                tableConfigKey: "environmentCompliancyList"
            });

            this.tree.placeAt(this.treeAttach);
        }
    });
});
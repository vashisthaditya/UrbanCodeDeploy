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
define(["dojo/_base/declare",
        "dojo/_base/array",
        "deploy/widgets/rightPanel/ResourceRightPanel",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dijit/form/TextBox",
        "deploy/widgets/Formatters",
        "deploy/widgets/tag/Tagger",
        "deploy/widgets/filter/TagFilter",
        "js/webext/widgets/table/TreeTable"
        ],
        function(
            declare,
            array,
            RightPanel,
            domClass,
            domConstruct,
            TextBox,
            Formatters,
            Tagger,
            TagFilter,
            TreeTable
        ){
    /**
     * Right Panel Agents
     *
     * Widget for displaying a hovering side panel on the right side of the window with a drag and
     * drop table containing agents.
     *
     * Use: new RightPanelAgents(options);
     *
     * options: {
     *  parent: reference to the parent (this) using this widget.
     * }
     */
    return declare('deploy.widgets.resource.RightPanelAgents',  [RightPanel], {
        header: i18n("Agents"),
        subheader: i18n("Drag and drop agents into resources"),
        url: bootstrap.restUrl + "agent/",

        /**
         * Setting up the columns for the tree table to use for the agents.
         */
        getColumns: function(){
            var _this = this;
            return [{
                name: i18n("Name"),
                formatter: function(item, value, cell) {
                    cell.style.positon = "relative";
                    var result = Formatters.agentLinkFormatter(item);
                    domConstruct.place(Formatters.createIcon("agentIcon"), result, "first");
                    _this.tagger = new Tagger({
                        objectType: "Agent",
                        item: item,
                        callback: function() {
                            _this.rightPanel.grid.refresh();
                        }
                    });
                    _this.tagger.placeAt(result);
                    return result;
                },
                orderField: "name",
                filterField: "name",
                filterType: "custom",
                getRawValue: function(item) {
                    return item.name;
                },
                getFilterFields: function() {
                    var nameFilter = new TextBox({
                        name: "name",
                        "class": "filter",
                        style: { "width": "45%" },
                        placeHolder: i18n("Agent Name"),
                        type: "like"
                    });
                    var tagFilter = new TagFilter({
                        name: "tags",
                        "class": "filter",
                        style: { width: "45%" },
                        placeHolder: i18n("Tags"),
                        type: "like"
                    });
                    return [nameFilter, tagFilter];
                }
            },{
                name: i18n("Status"),
                orderField: "status",
                filterField: "status",
                filterType: "select",
                filterOptions: [{
                    label: i18n("Online"),
                    value: "ONLINE"
                },{
                    label: i18n("Offline"),
                    value: "OFFLINE"
                },{
                    label: i18n("Connecting"),
                    value: "CONNECTING"
                }],
                getRawValue: function(item) {
                    return item.status;
                },
                formatter: Formatters.agentStatusFormatter
            },{
                name: i18n("Version"),
                field: "version"
            }];
        },

        /**
         * Prepares data and permission when an agent is dropped
         */
        onDrop: function(sources){
            var _this = this;
            var target = this.parent.target;
            array.forEach(sources, function(source){
                // Determine if the agent in the right panel can be dropped.
                var allowDnd = target;
                if (allowDnd){
                    allowDnd = (target.type !== "agent" && target.type !== "agent pool") && !target.role;
                }
                if (allowDnd){
                    _this.submitData("agent", target, source, _this.optionsSwitch.value);
                }
                else {
                    _this.table.refresh();
                }
            });
        }
    });
});

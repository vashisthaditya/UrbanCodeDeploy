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
        "js/webext/widgets/Alert",
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
            Alert,
            TreeTable
        ){
    /**
     * Right Panel Components
     * 
     * Widget for displaying a hovering side panel on the right side of the window with a drag and
     * drop table containing agents with no resource.
     * 
     * Use: new RightPanelComponents(options);
     * 
     * options: {
     *  parent: reference to the parent (this) using this widget.
     * }
     */
    return declare('deploy.widgets.resource.RightPanelComponents',  [RightPanel], {
        header: i18n("Components"),
        subheader: i18n("Drag and drop components into agents"),
        url: bootstrap.restUrl + "resource/resourceRole/componentRoles",
        selectable: true,
        
        /**
         * Setting up the columns for the tree table to use for the components.
         */
        getColumns: function(){
            var _this = this;
            return [{
                name: i18n("Name"),
                formatter: function(item, value, cell) {
                    cell.style.positon = "relative";
                    var result = domConstruct.create("span", {
                        innerHTML: item.name.escape()
                    });
                    domConstruct.place(Formatters.createIcon("componentIcon"), result, "first");
                    return result;
                },
                orderField: "name",
                filterField: "name",
                filterType: "text"
            }];
        },
        
        /**
         * Prepares data and permission when a component is dropped
         */
        onDrop: function(sources){
            var _this = this;
            //target = parent to drop resource in
            var target = this.parent.target;
            array.forEach(sources, function(source){
                // Determine if the component in the right panel can be dropped.
                var allowDnd = target;
                if (allowDnd){
                    allowDnd = target.hasAgent || target.resourceTemplate;
                }
                if (allowDnd){
                    var type = _this.optionsSwitch.value ? "component" : "role";
                    _this.submitData(type, target, source, _this.optionsSwitch.value);
                }
                else {
                    var dndAlert = new Alert({
                        message: i18n("Invalid component resource location")
                    });
                }
            });
        }
    });
});
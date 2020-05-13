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
define(["dijit/_Widget",
        "dojo/_base/declare",
        "deploy/widgets/rightPanel/RightPanelAgents",
        "deploy/widgets/rightPanel/RightPanelAgentsWithNoResource",
        "deploy/widgets/rightPanel/RightPanelComponents",
        "deploy/widgets/rightPanel/RightPanelResourceRoles",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/dom-geometry",
        "dojo/on",
        "dijit/form/Button",
        "js/webext/widgets/form/MenuButton"
        ],
        function(
            _Widget,
            declare,
            RightPanelAgent,
            RightPanelAgentNoResource,
            RightPanelComponent,
            RightPanelResourceRoles,
            domClass,
            domConstruct,
            domGeom,
            on,
            Button,
            MenuButton
        ){
    /**
     * Resource Right Panel Container
     * 
     * Widget for displaying a hovering side panel on the right side of the window with a table on the resources page.
     * 
     * Use: new ResourceRightPanelContainer(options{});
     * 
     * options: {
     *  parent: Reference to the widget (ex. ResourceTree) that is using this widget.
     *  attachPoint: The attachPoint to place the right panel.
     *  buttonAttachPoint: The attachPoint to place the show and hide buttons.
     * }
     */
    return declare('deploy.widgets.resource.ResourceRightPanelContainer',  [_Widget], {
        
        attachPoint: null,
        buttonAttachPoint: null,
        parent: null,
        
        postCreate: function() {
            this.inherited(arguments);
            this._buildHideButton();
            this.buildPanels();
        },
        
        /**
         * Creates a menu button displaying the types of right panels to show.
         */
        _buildShowButton: function(options){
            this.showButton = new MenuButton({
                options: options,
                label: i18n("Show")
            });
            domClass.add(this.showButton.domNode, "idxButtonCompact");
            if (this.buttonAttachPoint){
                this.showButton.placeAt(this.buttonAttachPoint);
            }
            this._buildHideButton();
        },
        
        /**
         * Creates the hide button when the right panel is shown.
         */
        _buildHideButton: function(){
            var self = this;
            if (!this.hideButton){
                this.hideButton = new Button({
                    label: i18n("Hide Panel")
                });
                domClass.add(this.hideButton.domNode, "idxButtonCompact");
            }
            else {
                if (this.buttonAttachPoint){
                    on(this.hideButton, "click", function(evt){
                        self.current.hide(evt.shiftKey);
                    });
                    this.hideButton.placeAt(this.buttonAttachPoint);
                }
            }
        },

        /**
         * Builds the panels and options in the show button.
         */
        buildPanels: function(){
            var self = this;
            var parent = this.parent;
            var blueprint = parent ? parent.blueprint : null;
            var showButtonOptions = [];
            this.panel = {};

            var panelOptions = {
                    parent: parent,
                    blueprint: blueprint,
                    attachPoint: self.parent.panelAttach,
                    onShow: function(duration){
                        if (!this.loaded){
                            this.loadTable();
                        }
                        if (self.parent && self.parent.domNode){
                            // Add class when panel is shown. SetTimeout for toggle between panels.
                            setTimeout(function(){
                                domClass.add(self.parent.domNode, "table-show-right-panel");
                            }, 10);
                        }
                        domClass.remove(self.hideButton.domNode, "hidden"); // Show "Hide Panel" button.
                    },
                    onHide: function(duration){
                        if (self.parent && self.parent.domNode){
                            domClass.remove(self.parent.domNode, "table-show-right-panel");
                        }
                        domClass.add(self.hideButton.domNode, "hidden"); // Hide "Hide Panel" button and clear table in the right panel.
                    }
                };

            var buildPanel = function(panel, option){
                self.panel[option] = panel;
                showButtonOptions.push({
                    label: i18n(panel.header),
                    onClick: function(evt){
                        panel.show(evt.shiftKey);
                        if (self.current && self.current !== panel){
                            self.current.hide(evt.shiftKey|| 0);
                        }
                        domClass.remove(self.hideButton.domNode, "hidden");
                        // Keep track and set the current right panel shown.
                        self.current = panel;
                    }
                });
            };

            if ((parent.resource && !parent.resource.hasAgent) || domClass.contains(parent.domNode, "all-resources") || parent.environment){
                buildPanel(new RightPanelAgent(panelOptions), "agent");
                buildPanel(new RightPanelAgentNoResource(panelOptions), "agentnoresource");
            }
            // When viewing an environment in an application, show components associated with the application.
            // componentPanelOptions allows url customization for the components widget without affecting
            // panelOptions.
            var componentPanelOptions = Object.create(panelOptions);
            var application = null;
            if (parent.environment && parent.environment.application){
                componentPanelOptions.url = bootstrap.restUrl + "resource/resourceRole/componentRolesForApplication/" + parent.environment.application.id;
                application = parent.environment.application;
            }
            else if (parent.application){
                application = parent.application;
            }
            if (application && application.id){
                componentPanelOptions.url = bootstrap.restUrl + "resource/resourceRole/componentRolesForApplication/" + application.id;
            }
            buildPanel(new RightPanelComponent(componentPanelOptions), "component");
            buildPanel(new RightPanelResourceRoles(panelOptions), "resourceroles");


            this._buildShowButton(showButtonOptions);

            // If right panel reaches top of screen, dock it to the right.
            if (window && self.parent.domNode){
                on(window, "scroll", function(evt){
                    if (self.current && !self.current.isHidden()){
                        try {
                            var position = domGeom.position(self.parent.domNode);
                            if (position && position.y < 14){
                                if (!domClass.contains(self.parent.panelAttach, "right-panel-top")){
                                    domClass.add(self.parent.panelAttach, "right-panel-top");
                                }
                            }
                            else if (domClass.contains(self.parent.panelAttach, "right-panel-top")){
                                domClass.remove(self.parent.panelAttach, "right-panel-top");
                            }
                        }
                        catch (e){
                            // Geo-position cannot find owner document. Somehow not caught by dojo.
                            // None blocking error, so we don't need to show it to console.
                        }
                    }
                });
            }
        }
    });
});
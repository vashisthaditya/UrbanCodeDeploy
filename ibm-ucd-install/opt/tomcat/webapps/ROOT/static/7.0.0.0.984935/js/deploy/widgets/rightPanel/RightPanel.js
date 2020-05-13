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
define(["dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dojo/_base/declare",
        "dojo/_base/fx",
        "dojo/fx",
        "dojo/dom-class",
        "dojo/dom-style",
        "dojo/dom-construct",
        "dojo/dom-geometry",
        "dojo/on",
        "dijit/Tooltip"
        ],
        function(
            _TemplatedMixin,
            _Widget,
            declare,
            fx,
            coreFx,
            domClass,
            domStyle,
            domConstruct,
            geo,
            on,
            Tooltip
        ){
    /**
     * Right Panel
     *
     * Widget for displaying a hovering side panel on the right side of the window.
     *
     * Use: new RightPanel(options{});
     *
     * options: {
     *  header: (string) The header title of the right panel.
     *  subheader: (string) The subheader or description text of the right panel.
     *  width: (integer) The width of the right panel. Default is 500px;
     *  titleContent: (domNode) Any additional domNode to add to the header.
     *  content: (domNode) The content to display in the right panel.
     *  defaultSpeed: (integer) The default speed for the animation show/hide. Default is 180.
     *  slowSpeed: (integer) The slowest speed for the animation show/hide. Default is 1000.
     * }
     */
    return declare('deploy.widgets.rightPanel.RightPanel',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="right-panel">' +
                '<div class="panel-header">' +
                    '<div class="panel-close-button icon-Icon_close__brand-01_2x inlineBlock linkPointer" data-dojo-attach-point="closeAttach" title="'+i18n("Hide Panel")+'"></div>' +
                    '<div class="rightPanel-tooltipTitle">' +
                        '<span class="containerLabel title-text" data-dojo-attach-point="titleAttach"></span>' +
                        '<div data-dojo-attach-point="tooltip" class="labelsAndValues-helpCell title-helpCell inlineBlock"></div>' +
                    '</div>' +
                    '<div class="panel-subtitle" data-dojo-attach-point="subtitleAttach"></div>' +
                    '<div class="panel-title-contents inlineBlock" data-dojo-attach-point="titleContentAttach"></div>' +
                    '<div class="clear"></div>' +
                '</div>' +
                '<div class="panel-content" data-dojo-attach-point="contentAttach"></div>' +
            '</div>',

        header: "",
        subheader: "",
        description: null,
        width: 500,
        titleContent: null,
        content: null,
        panelHidden: true,
        defaultSpeed: 180,
        slowSpeed: 1000,

        postCreate: function() {
            this.inherited(arguments);
            this._buildPanel();
        },

        /**
         * Creates the right panel.
         */
        _buildPanel: function(){
            var _this = this;

            this.titleAttach.innerHTML = this.header;
            this.subtitleAttach.innerHTML = this.subheader;

            if (!!this.description) {
                var helpTip = new Tooltip({
                    connectId: [this.tooltip],
                    label: this.description,
                    showDelay: 100,
                    position: ["after", "above", "below", "before"]
                });
                domClass.remove(this.tooltip, "tooltipHidden");
            }
            else {
                domClass.add(this.tooltip, "tooltipHidden");
            }

            if (this.titleContent){
                domConstruct.place(this.titleContent, this.titleContentAttach);
            }
            if (this.content){
                domConstruct.place(this.content, this.contentAttach);
            }
            if (this.contentClass){
                domClass.add(this.contentAttach, this.contentClass);
            }
            on(this.closeAttach, "click", function(evt){
                if (!_this.panelHidden){
                    // Option to use slowSpeed holding the shift key.
                    _this.hide(evt.shiftKey);
                }
            });
            // Move the right panel into a hidden state.
            this.panelHidden = false;
            if (!this.display){
                domClass.add(_this.domNode, "hidden");
                this.hide(0);
            }
            else {
                this.domNode.style.width = this.width + "px";
            }
        },

        /**
         * Update the header of the right panel
         *  @param header: The text to display as the header.
         */
        setHeader: function(header){
            this.titleAttach.innerHTML = header;
        },

        /**
         * Update the subheader of the right panel
         *  @param header: The text to display as the subheader.
         */
        setSubheader: function(subheader){
            this.subtitleAttach.innerHTML = subheader;
        },

        /**
         * Update the contents of the right panel
         *  @param header: The domNode of the contents to set as the right panel contents.
         */
        setContent: function(content){
            domConstruct.place(content, this.contentAttach);
        },

        /**
         * Slides the panel in
         *  @param duration: how long the transition to show the panel. If boolean true, will use slow speed.
         */
        show: function(duration){
            var _this = this;
            // Show panel only if it is currently hidden.
            if (this.panelHidden){
                this.panelHidden = false;
                var speed = duration || _this.defaultSpeed;
                // Option to set speed as slowSpeed if duration is a "true" boolean value
                if (typeof speed === "boolean"){
                    speed = this.slowSpeed;
                }
                domClass.remove(this.domNode, "hidden");
                coreFx.slideTo({
                    node: this.domNode,
                    top: 0,
                    left: (geo.getMarginBox(_this.domNode).l - (_this.width - 100)).toString(),
                    unit: "px",
                    duration: speed
                }).play();
                fx.animateProperty({
                    node: _this.domNode,
                    properties: {
                        width: _this.width
                    },
                    duration: speed
                }).play();
                _this.onShow(speed);
            }
            else {
                this.onShow();
            }
        },

        /**
         * Additional function to call when showing the panel.
         */
        onShow: function(duration){

        },

        /**
         * Slides the panel out
         *  @param duration: how long the transition to hide the panel. If boolean true, will use slow speed.
         */
        hide: function(duration){
            var _this = this;
            // Hide panel only if it is currently shown.
            if (!this.panelHidden){
                this.panelHidden = true;
                // Option to set speed as slowSpeed if duration is a "true" boolean value
                var speed = duration || _this.defaultSpeed;
                if (typeof speed === "boolean"){
                    speed = this.slowSpeed;
                }
                coreFx.slideTo({
                    node: this.domNode,
                    top: 0,
                    left: (geo.getMarginBox(_this.domNode).l + (_this.width - 100)).toString(),
                    unit: "px",
                    duration: speed
                }).play();
                fx.animateProperty({
                    node: this.domNode,
                    properties: {
                        width: 0
                    },
                    duration: speed
                }).play();
                setTimeout(function(){
                    domClass.add(_this.domNode, "hidden");
                }, speed);
                _this.onHide(speed);
            }
        },

        /**
         * Additional function to call when hiding the panel.
         */
        onHide: function(duration){

        },

        /**
         * Helper method to place the domNode of this widget at a given node.
         */
        placeAt: function(node){
            domConstruct.place(this.domNode, node);
        },

        /**
         * @return If right panel is in a hidden state;
         */
        isHidden: function(){
            return this.panelHidden;
        }
    });
});
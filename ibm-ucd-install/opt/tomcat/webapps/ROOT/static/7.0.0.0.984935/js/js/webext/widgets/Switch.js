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
/*global define */
define([
        "dojo/_base/declare",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/dom-style",
        "dojo/dom-attr",
        "dojo/dom-geometry",
        "dojo/on",
        "dojo/mouse",
        "dojo/_base/array"
], function(
        declare,
        _WidgetBase,
        _TemplatedMixin,
        domConstruct,
        domClass,
        domStyle,
        domAttr,
        domGeom,
        on,
        mouse,
        array
) {

    /**
     * On/Off switch. Use for toggling single values, otherwise use checkboxes with long lists of values.
     *
     * options {
     *    value [boolean]: true - on
     *                     false - off
     *                     "middle" - tri-state (String) - Please DON'T set. For master switches only.
     *                                Clicking on middle state will turn true.
     *
     *    color [string]:               Color on the on state. Options: red, orange, yellow, green,
     *                                  blue, purple. Default: blue
     *
     *    onTitle [string]:             Hover title when switch is on. Default: "On"
     *    middleTitle [string]:         Hover title when switch is on. Default: "Middle"
     *    offTitle [string]:            Hover title when switch is off. Default: "Off"
     *    showSwitchLabels [boolean]:   Show on & off titles as labels in switch. Default: false
     *    showOnSwitchLabel [boolean]:  Show on titles as labels in switch. Default: false
     *    showOffSwitchLabel [boolean]: Show off titles as labels in switch. Default: false
     *
     *    focusOnHover [boolean]:       If switch is focused on hover. Default: false
     *
     *    labelText [string]:           Display a label for switch. Default: null (Don't show).
     *    labelPlacement [string]:      Placement of label.
     *                                      "before": Place in front of switch
     *                                      "after" (Default): Place after switch
     *
     *    master [boolean]:             If switch acts as a master switch. e.g. The value of this
     *                                  switch changes the value of children (see property below)
     *                                  and the value of this switch changes depending on the values
     *                                  of the children.
     *                                 
     *    children [array]:             An array of switches dependent on the master switch.
     *
     *    sameWidth [boolean]:          Make all children and master switches the same width if
     *                                  switch labels are used. Default: true.
     * }
     */
    return declare('js.webext.widgets.Switch', [_WidgetBase, _TemplatedMixin], {
        _colors: ["red", "orange", "yellow", "green", "blue", "purple"],
        color: "blue",
        value: false,
        focusOnHover: false,
        showSwitchLabels: false,
        showOnSwitchLabel: false,
        showOffSwitchLabel: false,
        labelText: null,
        labelPlacement: "after",
        master: false,
        children: null,
        sameWidth: true,
        disabled: false,

        templateString:
            '<div class="webext-switch noSelect" tabindex="0">'+
                '<input class="webext-switch-checkbox" tabindex="-1" type="checkbox" role="checkbox" data-dojo-attach-point="checkboxAP"></input>' +
                '<div class="webext-switch-wrapper inline-block" data-dojo-attach-point="wrapperAP">'+
                    '<div class="webext-switch-container" data-dojo-attach-point="containerAP"></div>' +
                    '<div class="webext-switch-handle inline-block" data-dojo-attach-point="handleAP"></div>'+
                '</div>' +
            '</div>',

        /**
         *
         */
        postCreate: function(){
            this.inherited(arguments);
            var self = this;

            if (!this.onTitle){
                this.onTitle = this.master ? i18n("All On") : i18n("On");
            }
            if (!this.offTitle){
                this.offTitle = this.master ? i18n("All Off") : i18n("Off");
            }
            if (!this.middleTitle){
                this.middleTitle = i18n("Middle");
            }

            this.set("value", this.value);
            this.set("color", this.color);
            this.set("disabled", this.disabled);

            this._setEvents();
            if (this.labelText){
                this._setLabel();
            }
            if (self.master){
                self._setMasterEvents();
            }
            if (this.showSwitchLabels || this.showOnSwitchLabel || this.showOffSwitchLabel){
                this._setSwitchLabel();
            }
        },

        /**
         *
         */
        set: function(attr, value){
            this.inherited(arguments);
            if (attr === "value"){
                if (value){
                    if (value === "middle"){
                        this._setSwitch(this.middleTitle, "switch-middle", "middle");
                    }
                    else {
                        this._setSwitch(this.onTitle, "switch-on", "true");
                    }
                }
                else {
                    this._setSwitch(this.offTitle, "switch-off", "false");
                }
            }
            else if (attr === "color"){
                this._setColor();
            }
            else if (attr === "disabled"){
                if (value){
                    domClass.add(this.domNode, "webext-switch-disabled");
                }
                else {
                    domClass.remove(this.domNode, "webext-switch-disabled");
                }
            }
            else if (attr === "width" && !this.master){
                this._calculateLabelSize(this.switchLabelContainer, this.width);
            }
        },

        /**
         * Sets the switch class name on/off state.
         */
        _setSwitch: function(title, className, state){
            domAttr.set(this.domNode, "title", title);
            domAttr.set(this.domNode, "aria-checked", state);
            domAttr.set(this.checkboxAP, "aria-checked", state);
            domClass.remove(this.domNode, "switch-on");
            domClass.remove(this.domNode, "switch-middle");
            domClass.remove(this.domNode, "switch-off");
            domClass.add(this.domNode, className);
            if (this.showSwitchLabels || this.showOnSwitchLabel || this.showOffSwitchLabel){
                this._setSwitchWithLabel(className);
            }
        },

        /**
         * Creates and places the label of the switch if specified.
         */
        _setSwitchLabel: function(){
            var self = this;
            this.switchLabelContainer = domConstruct.create("div", {
                className: "webext-switch-container-labels inline-block"
            }, this.containerAP);
            var onWidth = 0;
            var offWidth = 0;

            this.onSwitchLabel = domConstruct.create("div", {
                className: "webext-switch-on-label inline-block",
                innerHTML: (this.showSwitchLabels || this.showOnSwitchLabel) ? this.onTitle : " "
            }, self.switchLabelContainer);

            this.offSwitchLabel = domConstruct.create("div", {
                className: "webext-switch-off-label inline-block",
                innerHTML: (this.showSwitchLabels || this.showOffSwitchLabel) ? this.offTitle : " "
            }, self.switchLabelContainer);
            if (self.value === false){
                domConstruct.place(this.offSwitchLabel, this.switchLabelContainer, "first");
            }

            setTimeout(function(){
                self._calculateLabelSize(self.switchLabelContainer);
            }, 0);
        },

        /**
         * If switch labels are on, calculate label size and make switch as wide as the widest label.
         */
        _calculateLabelSize: function(labelContainer, largestWidth){
            var self = this;
            var width = 0;
            if (!largestWidth){
                if (this.onSwitchLabel){
                    width = domGeom.getMarginBox(this.onSwitchLabel).w;
                }
                if (this.offSwitchLabel){
                    var offSize = domGeom.getMarginBox(this.offSwitchLabel).w;
                    if (offSize > width){
                        width = offSize;
                    }
                }
                
                if (this.master){
                    width += 10;
                    // If switch labels are shown and master switch has children, make all switches
                    // the widest width;
                    if (this.children && this.sameWidth){
                        var largeWidth = width;
                        array.forEach(this.children, function(child){
                            var tempWidth = child.get("width");
                            if (tempWidth && tempWidth > width){
                                width = tempWidth;
                            }
                        });
                        array.forEach(this.children, function(child){
                            child.set("width", width);
                            // Set blank labels for child switches with labels that are off.
                            if (!child.onSwitchLabel && !child.offSwitchLabel){
                                child._setSwitchLabel();
                            }
                            child.set("showSwitchLabels", true);
                        });
                    }
                }
            }
            else {
                width = largestWidth;
            }
            if (this.onSwitchLabel){
                domStyle.set(this.onSwitchLabel, "width", width + "px");
            }
            if (this.offSwitchLabel){
                domStyle.set(this.offSwitchLabel, "width", width + "px");
            }

            if (labelContainer){
                domStyle.set(labelContainer, "width", width + "px");
            }
            if (width > 10){
                // 28 for the width of the switch handle.
                domStyle.set(this.containerAP, "width", width + 28 + "px");
                this.width = width;

                // Calculate position of switch handle. [hover] for master switches.
                var switchLocation = function(hover){
                    var onValue = hover ? 0 : 6;
                    var midValue = hover ? 2 : 5;
                    if (self.value === true){
                        domStyle.set(self.handleAP, "left", self.width + onValue + "px");
                    }
                    else if (self.value === "middle"){
                        domStyle.set(self.handleAP, "left", (self.width / 2) + midValue + "px");
                    }
                };
                switchLocation();

                // If master switch, calculate hover position of switch.
                if (this.master){
                    this.own(on(self.domNode, mouse.enter, function(){
                        switchLocation(true);
                        self.hover = true;
                    }));
                    this.own(on(self.domNode, mouse.leave, function(){
                        switchLocation();
                        self.hover = false;
                    }));
                }
            }
        },

        /**
         * Calculate position of switch slider if using switch labels.
         */
        _setSwitchWithLabel: function(className){
            var self = this;
            domStyle.set(this.handleAP, "left", "");
            if (this.switchLabelContainer){
                if ((this.onSwitchLabel || this.showSwitchLabels) && (className === "switch-on")){
                    domConstruct.place(this.onSwitchLabel, this.switchLabelContainer, "first");
                    var onSwitchValue = (this.master && this.hover) ? 0 : 6;
                    domStyle.set(this.handleAP, "left", this.width + onSwitchValue + "px");
                }
                if ((this.offSwitchLabel || this.showSwitchLabels) && (className === "switch-off")){
                    domConstruct.place(this.offSwitchLabel, this.switchLabelContainer, "first");
                }
                if (className === "switch-middle"){
                    if (this.width){
                        domStyle.set(this.handleAP, "left", (this.width / 2) + 5 + "px");
                    }
                }
            }
        },

        /**
         * Sets the color class of the switch.
         */
        _setColor: function(){
            var self = this;
            var colorChoice = "blue";
            array.forEach(self._colors, function(color){
                if (self.color === color){
                    colorChoice = color;
                }
            });
            if (!this.currentColor){
                this.currentColor = colorChoice;
            }
            else {
                domClass.remove(this.domNode, this.currentColor);
            }
            this.currentColor = colorChoice + "-switch-color";
            domClass.add(this.domNode, this.currentColor);
        },

        /**
         * Sets the click and keyboard events.
         */
        _setEvents: function(){
            var self = this;
            // Toggle switch state on mouse and keyboard events.
            var changeSwitch = function(value){
                if (!self.disabled){
                    if (self.get("value") === "middle"){
                        value = true;
                    }
                    else if (value === undefined){
                        value = !self.get("value");
                    }
                    self.set("value", value);
                    self._onChange(value);
                    self.onChange(value);
                    if (self.master){
                        self._setMaster(value);
                    }
                }
            };
            on(this.domNode, "click", function(evt){
                changeSwitch();
            });
            // Keyboard accessibility. Press enter to toggle. Left = off, right = on.
            on(this.domNode, "keydown", function(evt){
                if (evt.keyIdentifier === "Enter" || evt.keyCode === 13){
                    changeSwitch();
                }
                else if (evt.keyIdentifier === "Left" || evt.keyCode === 37){
                    changeSwitch(false);
                }
                else if (evt.keyIdentifier === "Right" || evt.keyCode === 39){
                    changeSwitch(true);
                }
            });
            on(this.domNode, mouse.enter, function(evt){
                if (self.focusOnHover){
                    self.domNode.focus();
                }
            });
            on(this.domNode, mouse.leave, function(evt){
                self.domNode.blur();
            });
        },

        /**
         * Sets the behavior of a master switch.
         */
        _setMasterEvents: function(){
            var self = this;
            this.initialize = true;
            this.childrenValues = [];
            if (self.children){
                var onCount = 0;
                var offCount = 0;
                // Function sets the value of the master switch.
                var childSetMaster = function(){
                    onCount = 0;
                    offCount = 0;
                    array.forEach(self.childrenValues, function(childValue){
                        if (childValue){
                            onCount++;
                        }
                        else {
                            offCount++;
                        }
                    });
                    if (onCount === 0 && offCount > 0){
                        self.set("value", false);
                    }
                    else if (onCount > 0 && offCount === 0){
                        self.set("value", true);
                    }
                    else {
                        self.set("value", "middle");
                    }
                };
                // Set the _onChange of the children to change the value of the master switch if
                // their value changes.
                var childOnChange = function(){
                    self.childrenValues = [];
                    array.forEach(self.children, function(child){
                        var switchValue = child.get("value");
                        self.childrenValues.push(switchValue);
                    });
                    childSetMaster();
                };
                // Gather up all values on first run.
                if (this.initialize){
                    if (this.value){
                        this._setMaster(this.value);
                    }
                    else {
                        childOnChange();
                    }
                    this.initialize = false;
                    delete this.initialize;
                }
                array.forEach(self.children, function(child){
                    child._onChange = function(value){
                        childOnChange();
                    };
                });
            }
            domClass.add(this.domNode, "webext-switch-master");
        },

        /**
         * If the value of the master switch is change, set all the values of the children to the
         * master value.
         * @param value: Value of the master switch.
         */
        _setMaster: function(value){
            var self = this;
            array.forEach(self.children, function(child){
                child.set("value", value);
            });
        },

        /**
         * Creates and places the label of the switch if specified.
         */
        _setLabel: function(){
            var labelPlacement = "after";
            if (this.labelPlacement !== "after"){
                labelPlacement = "before";
                domClass.add(this.domNode, "webext-switch-label-before");
            }
            var label = domConstruct.create("div", {
                innerHTML: this.labelText.escape(),
                className: "webext-switch-label inline-block"
            }, this.wrapperAP, labelPlacement);
        },

        /**
         * Private onChange event.
         */
        _onChange: function(value){},

        /**
         * Function to run when state of switch is changed.
         * @param {boolean} value: Switch is on or off.
         */
        onChange: function(value){}

    }); // End declare
});

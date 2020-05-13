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
        "dijit/form/TimeTextBox",
        "dijit/form/DateTextBox"
        ],
function(
        declare,
        _WidgetBase,
        _TemplatedMixin,
        TimeTextBox,
        DateTextBox
) {
    /**
     * A combined TimeTextBox & DateTextBox widget
     */
    return declare([_WidgetBase, _TemplatedMixin],
        {
            templateString:
                '<div class="dateTimePicker">'+
                '    <div dojoAttachPoint="dateAttach"></div>'+
                '    <div dojoAttachPoint="timeAttach"></div>'+
                '</div>',

            /**
             * default to a false value, since timeTextBox handles
             * disabled: undefined, and no definition of disabled differently.
             */
            disabled: false,

            postCreate : function () {
                this.inherited(arguments);

                this.showWidget();
            },

            /**
             * @param num a number
             * @returns undefined or a Date object, possible 'Invalid Date'
             */
            numberToDate : function(num) {
                var number = Number(num);
                var retVal;
                if (!isNaN(number)) {
                    retVal = new Date(number);
                }
                return retVal;
            },

            /**
             * NOTE: this function is biased and try input as an epoch time first
             * @param val can be a number, e.g. 12345, Unix epoch time
             *            or a string of format '12345'
             *            or a string, e.g. 02/09/2016
             * @returns a valid Date object or current Date
             **/
            coerceToDate : function(val) {
                var retVal;
                if (typeof val === 'number') {
                    retVal = this.numberToDate(val);
                } else if (typeof val === 'string') {
                    if (val && val.trim()) {
                        //try as a number first, otherwise it might return different result
                        retVal = this.numberToDate(val.trim());
                        if (!retVal) {
                            retVal = new Date(val.trim());
                        }
                    }
                }
                //prevents 'Invalid Date' being returned
                if ( (!(retVal instanceof Date)) || (!isFinite(retVal)) ) {
                   retVal = new Date();
                }
                return retVal;
            },

            showWidget: function() {
                var _this = this;

                this.date = new DateTextBox({
                    value: this.coerceToDate(this.value),
                    disabled: this.disabled,
                    datePackage: this.datePackage,
                    onChange: function() {
                        _this.onChange(_this.get("value"));
                    }
                }, this.dateAttach);
                this.date.domNode.style.width = "110px";
                this.date.domNode.className += " date-box-picker";
                this.time = new TimeTextBox({
                    value: this.coerceToDate(this.value),
                    disabled: this.disabled,
                    onChange: function() {
                        _this.onChange(_this.get("value"));
                    }
                }, this.timeAttach);
                this.time.domNode.className += " time-box-picker";
            },

            onChange: function() {
                // no-op by default
            },

            _getValueAttr: function() {
                var date = this.date.get("value");
                var time = this.time.get("value");
                var dateTime = null;
                if(date && time) {
                    dateTime = util.combineDateAndTime(date, time).valueOf();
                }
                else if (date) {
                    dateTime = date.valueOf();
                }
                else if (time) {
                    var now = new Date();
                    var midnight = new Date(now.getFullYear(), now.getMonth(),now.getDate(), 0, 0, 0, 0);
                    dateTime = util.combineDateAndTime(midnight, time).valueOf();
                }
                return dateTime;
            },

            _setValueAttr: function(value) {
                this.value = value;
                if (this.date) {
                    this.date.set("value", new Date(value));
                }
                if (this.time) {
                    this.time.set("value", new Date(value));
                }
            },

            destroy : function () {
                this.date.destroy();
                this.time.destroy();
                this.inherited(arguments);
            }
        }
    );
});

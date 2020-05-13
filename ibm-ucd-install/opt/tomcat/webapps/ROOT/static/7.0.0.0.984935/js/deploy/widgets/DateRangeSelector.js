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
        "dijit/form/DateTextBox",
        "dijit/form/Select",
        "dijit/form/TextBox",
        "dijit/popup",
        "dojo/_base/declare",
        "dojo/date",
        "dojo/dom-construct",
        "dojo/on"
        ],
function(
        _TemplatedMixin,
        _Widget,
        DateTextBox,
        Select,
        TextBox,
        popup,
        declare,
        date,
        domConstruct,
        on
) {
    return declare('deploy.widgets.DateRangeSelector',  [_Widget, _TemplatedMixin], {
        templateString: '<div class="date-range-selector">' +
                            '<div class="inlineBlock" data-dojo-attach-point="selectAttach"></div>' +
                            '<div class="inlineBlock date-range-wrapper">' +
                              '<div data-dojo-attach-point="startDateAttach" class="inlineBlock selectedDate"></div>' +
                              '<div data-dojo-attach-point="endDateAttach" class="inlineBlock selectedDate"></div>' +
                              '<div data-dojo-attach-point="timeUnitAttach" class="inlineBlock selectedDate"></div>' +
                            '</div>' +
                            '<div id="customDateRangeDropDown" class="dateRangeDropDown" data-dojo-attach-point="dropDownAttach"></div>' +
                        '</div>',

        startDateAttach : null,
        endDateAttach : null,
        timeUnitAttach : null,
        startDateSelector : null,
        endDateSelector : null,
        selectAttach : null,
        dropDownAttach : null,
        rangeSelect : null,
        timeUnitSelect : null,
        startDate : null,
        endDate : null,
        customDateRangeSelector : null,
        value : "currentMonth",
        popup : null,
        timeUnit: "TIME_UNIT_DAY",
        constructor : function(/*object*/args) {
            this.inherited(arguments);
        },

        buildRendering: function() {
            this.inherited(arguments);

            var t = this;
            //The min-width is done to prevent resizing due to contents from cause the second line of the form
            //from coming up to the first line on small values in the range selector
            t.rangeSelect = new Select({
                name:'dateRange',
                options:[
                         {label: i18n("Current Week"), value:'currentWeek'},
                         {label: i18n("Prior Week"), value:'priorWeek'},
                         {label: i18n("Current Month"), value:'currentMonth', selected: true},
                         {label: i18n("Prior Month"), value:'priorMonth'},
                         {label: i18n("Current Quarter"), value:'currentQuarter'},
                         {label: i18n("Prior Quarter"), value:'priorQuarter'},
                         {label: i18n("Current Year"), value:'currentYear'},
                         {label: i18n("Prior Year"), value:'priorYear'},
                         {label: i18n("Custom"), value:'custom'}
                ],
                onChange : function(value) {
                    t.rangeSelectChanged(value);
                },
                style: {width: "200px"}
            });
            t.rangeSelect.placeAt(t.selectAttach);
            t.timeUnitSelect= new Select({
                "name": "time_unit",
                "options": [
                  { "label": "<img src=\"" + bootstrap.imageUrl + "icons/icon_month_picker.gif\"/>"+i18n("Months"), "value":"TIME_UNIT_MONTH"},
                  { "label": "<img src=\"" + bootstrap.imageUrl + "icons/icon_week_picker.gif\"/>"+i18n("Weeks"), "value": "TIME_UNIT_WEEK" },
                  { "label": "<img src=\"" + bootstrap.imageUrl + "icons/icon_day_picker.gif\"/>"+i18n("Days"), "value": "TIME_UNIT_DAY"}
                ],
                value: t.timeUnit,
                onChange : function(value) {
                    t.timeUnit = value;
                }
            });
            t.timeUnitSelect.placeAt(t.timeUnitAttach);

            var startDateOptions = {
                "name": "startDate",
                forceWidth:false,
                style: {width: "120px"},
                format: function(date) {
                    return util.dayFormatShort(date);
                },
                onChange: function(value) {
                    t.startDate = new Date(value);
                }
            };

            var endDateOptions = {
                forceWidth:false,
                "name": "endDate",
                style: {width: "120px"},
                format: function(date) {
                    return util.dayFormatShort(date);
                },
                onChange: function(value) {
                    t.endDate = new Date(value);
                }
            };

            t.startDateSelector = new DateTextBox(startDateOptions);
            t.startDateSelector.placeAt(t.startDateAttach);

            t.endDateSelector = new DateTextBox(endDateOptions);
            t.endDateSelector.placeAt(t.endDateAttach);

            t.disableDateEntry();
            t.setDisplayedValue();
        },

        destroy : function() {
            var t= this;
            this.inherited(arguments);
            var d = function(widget) {
                if (widget) {
                    widget.destroy();
                }
            };

            d(t.timeUnitSelect);
            d(t.startDateSelect);
            d(t.endDateSelect);
            d(t.rangeSelect);
        },

        rangeSelectChanged : function(value) {
            var t = this;
            t.value=value;
            if (value === "currentWeek" ||
                value === "priorWeek" ||
                value === "currentMonth" ||
                value === "priorMonth")
            {
                t.timeUnit = "TIME_UNIT_DAY";
                t.setDisplayedValue();
                t.disableDateEntry();
            }
            else if (value === "currentQuarter" || value === "priorQuarter") {
                t.timeUnit = "TIME_UNIT_WEEK";
                t.setDisplayedValue();
                t.disableDateEntry();
            }
            else if (value === "currentYear" || value === "priorYear") {
                t.timeUnit = "TIME_UNIT_MONTH";
                t.setDisplayedValue();
                t.disableDateEntry();
            }
            else {
                //custom selected
                if (!t.fromSetValue) {
                    t.enableDateEntry();
                }
            }
            t.fromSetValue=false;
        },

        getStartDate : function () {
            this.switchDatesIfNecessary();
            return this.startDate;
        },

        getEndDate : function () {
            this.switchDatesIfNecessary();
            var date = this.endDate;
            date.setHours(23);
            date.setMinutes(59);
            date.setSeconds(59);
            date.setMilliseconds(999);
            return this.endDate;
        },

        getTimeUnit : function() {
            return this.timeUnit;
        },

        fromSetValue : false,

        _getStartOfWeek : function(/*Date*/date) {
            date.setDate(date.getDate() - date.getDay());
            return date;
        },

        _getEndOfWeek : function(/*Date*/date) {
            date.setDate(date.getDate() + (6 - date.getDay()));
            return date;
        },

        setDisplayedValue: function() {
            var t = this;
            var start;
            var end;
            var curStartDate = new Date();
            var curEndDate = new Date();
            switch (t.value) {
                case "priorWeek":
                    curStartDate = date.add(curStartDate, "day", -7);
                    curEndDate = date.add(curEndDate, "day", -7);
                    curStartDate = t._getStartOfWeek(curStartDate);
                    curEndDate = t._getEndOfWeek(curEndDate);
                    start = curStartDate;
                    end = curEndDate;
                    break;
                case "currentWeek":
                    curStartDate = t._getStartOfWeek(curStartDate);
                    curEndDate = t._getEndOfWeek(curEndDate);
                    start = curStartDate;
                    end = curEndDate;
                    break;
                case "currentMonth":
                    curStartDate.setDate(1);
                    curEndDate.setDate(date.getDaysInMonth(curEndDate));
                    start = curStartDate;
                    end = curEndDate;
                    break;
                case "priorMonth":
                    curStartDate.setDate(15); //every month has a 15
                    curEndDate.setDate(15);
                    curStartDate = date.add(curStartDate, "month", -1);
                    curEndDate = date.add(curEndDate, "month", -1);
                    curStartDate.setDate(1);
                    curEndDate.setDate(date.getDaysInMonth(curEndDate));
                    start = curStartDate;
                    end = curEndDate;
                    break;
                case "currentYear":
                    curStartDate.setMonth(0);
                    curStartDate.setDate(1);
                    curEndDate.setMonth(11);
                    curEndDate.setDate(date.getDaysInMonth(curEndDate));
                    start = curStartDate;
                    end = curEndDate;
                    break;
                case "priorYear":
                    curStartDate = date.add(curStartDate, "year", -1);
                    curEndDate = date.add(curEndDate, "year", -1);
                    curStartDate.setMonth(0);
                    curStartDate.setDate(1);
                    curEndDate.setMonth(11);
                    curEndDate.setDate(date.getDaysInMonth(curEndDate));
                    start = curStartDate;
                    end = curEndDate;
                    break;
                case "currentQuarter":
                    curStartDate = t._getStartOfQuarter(curStartDate);
                    curEndDate = t._getEndOfQuarter(curEndDate);
                    start = curStartDate;
                    end = curEndDate;
                    break;
                case "priorQuarter":
                    curStartDate.setDate(15); //every month has a 15
                    curEndDate.setDate(15);
                    curStartDate = date.add(curStartDate, "month", -3);//jump to last quarter
                    curEndDate = date.add(curEndDate, "month", -3);
                    curStartDate = t._getStartOfQuarter(curStartDate);
                    curEndDate = t._getEndOfQuarter(curEndDate);
                    start = curStartDate;
                    end = curEndDate;
                    break;
                case "custom":
                    start = t.startDate;
                    end = t.endDate;
                    break;
            }

            t.startDateSelector.set('value', start);
            t.endDateSelector.set('value', end);
            t.timeUnitSelect.set('value', t.timeUnit);
        },

        _getStartOfQuarter : function(/*date*/startDate) {
            startDate.setDate(1);
            //0-2 , 3-5, 6-8, 9-11
            if (startDate.getMonth() <= 2) {
                startDate.setMonth(0);
            }
            else if (startDate.getMonth() <= 5) {
                startDate.setMonth(3);
            }
            else if (startDate.getMonth() <= 8) {
                startDate.setMonth(6);
            }
            else {
                startDate.setMonth(9);
            }
            return startDate;
        },
        _getEndOfQuarter : function(/*date*/endDate) {
            endDate.setDate(1);
            //0-2 , 3-5, 6-8, 9-11
            if (endDate.getMonth() <= 2) {
                endDate.setMonth(2);
            }
            else if (endDate.getMonth() <= 5) {
                endDate.setMonth(5);
            }
            else if (endDate.getMonth() <= 8) {
                endDate.setMonth(8);
            }
            else {
                endDate.setMonth(11);
            }
            endDate.setDate(date.getDaysInMonth(endDate));
            return endDate;
        },

        disableDateEntry: function() {
            this.startDateSelector.set("disabled", true);
            this.endDateSelector.set("disabled", true);
        },

        enableDateEntry: function() {
            this.startDateSelector.set("disabled", false);
            this.endDateSelector.set("disabled", false);
        },

        switchDatesIfNecessary: function(){
            if (this.value === "custom") {
                if(this.startDate > this.endDate){
                    this.switchDates();
                }
            }
        },
        switchDates: function() {
            var self = this;
            var tmp = self.endDate;
            self.endDate = self.startDate;
            self.startDate = tmp;
            self.setDisplayedValue();
        }
    });
});

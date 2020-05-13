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
        "dijit/form/Button",
        "dijit/form/DateTextBox",
        "dijit/form/Select",
        "dojo/_base/declare",
        "dojo/date",
        "dojo/dom-construct",
        "js/webext/widgets/BidiDateUtil"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        DateTextBox,
        Select,
        declare,
        date,
        domConstruct,
        BidiDateUtil
) {
    return declare('deploy.widgets.CustomDateRangeSelector',  [_Widget, _TemplatedMixin], {
        templateString: '<div class="customDateRangeSelector">' +
                          '<div data-dojo-attach-point="startDateAttach" class="inlineBlock"></div>' +
                          '<div class="inlineBlock">&nbsp;-&nbsp;</div>' +
                          '<div data-dojo-attach-point="endDateAttach" class="inlineBlock"></div>' +
                          '<div>' +
                            '<div class="inlineBlock">' +
                              '<div>'+i18n("Increments")+'</div>' +
                              '<div data-dojo-attach-point="tuSelectAttach"></div>' +
                            '</div>' +
                            '<div data-dojo-attach-point="buttonAttach" class="inlineBlock"></div>' +
                          '</div>' +
                        '</div>',

        doneButton : null,
        startDateAttach : null,
        endDataAttach : null,
        tuSelectAttach : null,
        buttonAttach : null,
        timeUnit : "TIME_UNIT_MONTH",
        timeUnitSelect : null,
        startDateSelect : null,
        endDateSelect : null,
        startDate : null,
        endDate : null,
        startDateBackup : new Date(),
        endDateBackup : new Date(),

        constructor : function(/*object*/args) {
            this.inherited(arguments);
            if (args.endDate) {
                this.endDateBackup = args.endDate;
            }

            if (args.startDate) {
                this.startDateBackup =  args.startDate;
            }
        },

        buildRendering: function() {
            this.inherited(arguments);

            var t = this;

            t.createTimeUnitWidget();
            t.createDateWidgets();
            t.createDoneButton();
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
        },

        createDateWidgets : function(type) {
            var t = this;

            domConstruct.empty(t.startDateAttach);
            domConstruct.empty(t.endDateAttach);

            var startDateOptions = {
                    "name": "startDate",
                    forceWidth:false,
                    style: {width: "7em"},
                    format: t.dateFormatter
            };

            var endDateOptions = {
                    forceWidth:false,
                    "name": "endDate",
                    style: {width: "7em"},
                    format: t.dateFormatter
            };

            if (t.timeUnit === "TIME_UNIT_MONTH") {
                t.endDateBackup.setDate(1);
                t.startDateBackup.setDate(1);

                startDateOptions.rangeCheck = t.monthRangeCheck;
                endDateOptions.rangeCheck = t.monthRangeCheck;
            }
            else if (t.timeUnit === "TIME_UNIT_WEEK") {
                var offset = t.startDateBackup.getDay();
                t.startDateBackup = date.add(t.startDateBackup, "day", -offset);

                offset = t.endDateBackup.getDay();
                t.endDateBackup = date.add(t.endDateBackup, "day", -offset);

                startDateOptions.rangeCheck = t.weekRangeCheck;
                endDateOptions.rangeCheck = t.weekRangeCheck;
            }

            startDateOptions.value = t.startDateBackup;
            endDateOptions.value = t.endDateBackup;

            startDateOptions.datePackage = BidiDateUtil.getDatePackage();
            endDateOptions.datePackage = BidiDateUtil.getDatePackage();

            t.startDateSelect = new DateTextBox(startDateOptions);
            t.startDateSelect.placeAt(t.startDateAttach);
            t.endDateSelect = new DateTextBox(endDateOptions);
            t.endDateSelect.placeAt(t.endDateAttach);
        },

        createTimeUnitWidget : function() {
            var t = this;
            t.timeUnitSelect= new Select({
                "name": "time_unit",
                "required": true,
                "options": [
                  { "label": "<img src=\"" + bootstrap.imageUrl + "icons/icon_month_picker.gif\"/>"+i18n("Months"), "value":"TIME_UNIT_MONTH"},
                  { "label": "<img src=\"" + bootstrap.imageUrl + "icons/icon_week_picker.gif\"/>"+i18n("Weeks"), "value": "TIME_UNIT_WEEK" },
                  { "label": "<img src=\"" + bootstrap.imageUrl + "icons/icon_day_picker.gif\"/>"+i18n("Days"), "value": "TIME_UNIT_DAY"}
                ],
                value: t.timeUnit,
                onChange : function(value) {
                    t.timeUnit = value;
                    t.createDateWidgets(value);
                }
            });
            t.timeUnitSelect.placeAt(t.tuSelectAttach);
        },

        createDoneButton : function() {
            var t = this;

            domConstruct.empty(t.buttonAttach);

            t.doneButton = new Button({
                label : i18n("OK"),
                showTitle: false,
                onClick : function() {
                   t.finished();
                }
            });

            t.doneButton.placeAt(t.buttonAttach);
        },

        monthRangeCheck: function(date) {
            return date.getDate() === 1;
        },

        weekRangeCheck: function(date) {
            return date.getDay() === 0;
        },

        getStartDate : function() {
            return this.startDateSelect.get('value');
        },

        getEndDate : function() {
            var date = this.endDateSelect.get('value');
            date.setHours(23);
            date.setMinutes(59);
            date.setSeconds(59);
            date.setMilliseconds(999);
            return date;
        },

        getTimeUnit : function() {
            return this.timeUnitSelect.get('value');
        },
        
        dateFormatter: function(date) {
            return util.dayFormatShort(date);
        }
    });
});
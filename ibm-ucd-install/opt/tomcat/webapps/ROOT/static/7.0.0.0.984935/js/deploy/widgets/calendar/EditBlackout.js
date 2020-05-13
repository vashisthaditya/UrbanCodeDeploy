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
        "js/webext/widgets/ColumnForm"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        ColumnForm
) {
    return declare('deploy.widgets.calendar.EditBlackout',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="editBlackout">'+
                '<div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            var existingValues = {};
            if (this.blackout) {
                if (this.blackout.id !== "noId"){
                    this.calendarId = this.blackout.calendarId;
                }
                existingValues.name = this.blackout.name;

                // Pull time and date apart.
                var tempStartDate = new Date(this.blackout.startDate);
                var startTimeOffset = tempStartDate.getHours()*util.msPerHour;
                startTimeOffset += tempStartDate.getMinutes()*util.msPerMinute;
                startTimeOffset += tempStartDate.getSeconds()*util.msPerSecond;
                startTimeOffset += tempStartDate.getMilliseconds();

                // Add the timezone at the actual UTC date represented by the time. This is needed
                // to account in differences in the DST change date since 1970.
                var startTimezoneOffset = new Date(startTimeOffset).getTimezoneOffset()*util.msPerMinute;
                existingValues.startTime = new Date(startTimeOffset+startTimezoneOffset);

                var startYear = tempStartDate.getFullYear();
                var startMonth = tempStartDate.getMonth();
                var startDay = tempStartDate.getDate();
                existingValues.startDate = new Date(startYear, startMonth, startDay);

                // Pull time and date apart.
                var tempEndDate = new Date(this.blackout.endDate);
                var endTimeOffset = tempEndDate.getHours()*util.msPerHour;
                endTimeOffset += tempEndDate.getMinutes()*util.msPerMinute;
                endTimeOffset += tempEndDate.getSeconds()*util.msPerSecond;
                endTimeOffset += tempEndDate.getMilliseconds();

                // Add the timezone at the actual UTC date represented by the time. This is needed
                // to account in differences in the DST change date since 1970.
                var endTimezoneOffset = new Date(endTimeOffset).getTimezoneOffset()*util.msPerMinute;
                existingValues.endTime = new Date(endTimeOffset+endTimezoneOffset);

                var endYear = tempEndDate.getFullYear();
                var endMonth = tempEndDate.getMonth();
                var endDay = tempEndDate.getDate();
                existingValues.endDate = new Date(endYear, endMonth, endDay);
            }

            var item = {};

            this.form = new ColumnForm({
                submitUrl: bootstrap.restUrl + "deploy/schedule/blackout",
                addData: function(submitData) {
                    if (self.blackout && self.blackout.id && self.blackout.id !== "noId") {
                        submitData.blackoutId = self.blackout.id;
                    }
                    submitData.calendarId = self.calendarId;

                    if (submitData.startDate && submitData.startTime) {
                        submitData.startDate = util.combineDateAndTime(
                                submitData.startDate,
                                submitData.startTime).valueOf();
                    }
                    if (submitData.endDate && submitData.endTime) {
                        submitData.endDate = util.combineDateAndTime(
                                submitData.endDate,
                                submitData.endTime).valueOf();
                    }
                    item = submitData;
                },
                validateFields: function(submitData) {
                    var result = [];
                    if (submitData.startDate >= submitData.endDate) {
                        result.push(i18n("The end date must be greater than the start date."));
                    }
                    return result;
                },
                postSubmit: function(data) {
                    if (self.callback !== undefined) {
                        self.callback(true);
                    }
                },
                onCancel: function() {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                }
            });

            this.form.addField({
                name: "name",
                label: i18n("Name"),
                required: false,
                value: existingValues.name,
                type: "Text"
            });

            this.form.addField({
                name: "startDate",
                label: i18n("Start Date"),
                required: true,
                value: existingValues.startDate,
                type: "Date"
            });

            this.form.addField({
                name: "startTime",
                label: i18n("Start Time"),
                required: true,
                value: existingValues.startTime,
                type: "Time"
            });

            this.form.addField({
                name: "endDate",
                label: i18n("End Date"),
                required: true,
                value: existingValues.endDate,
                type: "Date"
            });

            this.form.addField({
                name: "endTime",
                label: i18n("End Time"),
                required: true,
                value: existingValues.endTime,
                type: "Time"
            });
            this.form.placeAt(this.formAttach);
        }
    });
});
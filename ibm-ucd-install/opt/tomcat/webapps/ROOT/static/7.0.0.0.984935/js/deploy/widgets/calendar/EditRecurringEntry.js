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
        "js/webext/widgets/ColumnForm",
        "dojo/_base/array"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        ColumnForm,
        arrayUtil
) {
    return declare('deploy.widgets.calendar.EditRecurringEntry',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="editEntry">'+
                '<div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        /**
         * 
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            var existingValues = {};
            if (this.entry) {
                existingValues = this.entry;
                
                // Pull time and date apart.
                var tempStartDate = new Date(this.entry.scheduledDate);
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
            }
            
            this.form = new ColumnForm({
                submitUrl: bootstrap.restUrl+"calendar/recurring",
                addData: function(data) {
                    data.existingId = existingValues.id;
                    
                    data.date = util.combineDateAndTime(
                            data.startDate,
                            data.startTime).valueOf();
                            
                    if (self.entry.eventData.versions) {
                        data.versions = [];
                        arrayUtil.forEach(self.entry.eventData.versions, function(selector) {
                            var name = "ver_"+selector.componentId;
                                    
                            var versionSelector = data[name];
                            delete data[name];

                            if (versionSelector) {
                                var selectedVersionEntry = {
                                    versionSelector: versionSelector,
                                    componentId: selector.componentId
                                };
                                data.versions.push(selectedVersionEntry);
                            }
                        });     
                    }
                },
                postSubmit: function(data) {
                    if (self.callback !== undefined) {
                        self.callback();
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
                name: "dateLabel",
                label: "",
                value: i18n("Choose a new base date for this recurring event. This should be the next "+
                        "time the event should occur. The next scheduled occurrence of this event "+
                        "will not be affected."),
                type: "Label"
            });

            this.form.addField({
                name: "startDate",
                label: i18n("Base Date"),
                required: true,
                value: existingValues.startDate,
                type: "Date"
            });

            this.form.addField({
                name: "startTime",
                label: i18n("Base Time"),
                required: true,
                value: existingValues.startTime,
                type: "Time"
            });
            
            this.form.addField({
                name: "recurrencePattern",
                label: i18n("Pattern"),
                type: "Select",
                allowedValues: [{
                    value: "M",
                    label: i18n("Monthly")
                },{
                    value: "W",
                    label: i18n("Weekly")
                },{
                    value: "D",
                    label: i18n("Daily")
                }],
                value: existingValues.recurrencePattern,
                required: true
            });
            
            arrayUtil.forEach(existingValues.eventData.versions, function(selector) {
                var labelSpan = document.createElement("span");
                var componentSpan = document.createElement("span");
                componentSpan.innerHTML = i18n("Version for %s", selector.component.name.escape());
                labelSpan.appendChild(componentSpan);
                var name = "ver_"+selector.componentId;
                
                self.form.addField({
                            label: labelSpan,
                            name: name,
                            type: "VersionSelector",
                            value: selector.versionSelector,
                            context: {
                                component: selector.component,
                                environment: self.environment
                            },
                            required: false
                        }, "_versionInsert");
            });

            this.form.placeAt(this.formAttach);
        }
    });
});
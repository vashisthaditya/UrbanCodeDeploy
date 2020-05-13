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
        "dojo/_base/array",
        "dojo/_base/declare",
        "js/webext/widgets/Alert",
        "js/webext/widgets/ColumnForm"
        ],
function(
        _TemplatedMixin,
        _Widget,
        array,
        declare,
        Alert,
        ColumnForm
) {
    return declare('deploy.widgets.calendar.EditEntry',  [_Widget, _TemplatedMixin], {
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
                this.entryId = this.entry.id;
                
                // Pull time and date apart.
                var tempStartDate = new Date(this.entry.startDate);
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
                submitUrl: bootstrap.restUrl+"calendar/entry",
                addData: function(submitData) {
                    submitData.existingId = self.entryId;

                    submitData.date = util.combineDateAndTime(
                            submitData.startDate,
                            submitData.startTime).valueOf();

                    if (self.entry.versions) {
                        submitData.versions = [];
                        array.forEach(self.entry.versions, function(selector) {
                            var name = "ver_"+selector.componentId;
                                    
                            var versionSelector = submitData[name];
                            delete submitData[name];

                            if (versionSelector) {
                                var selectedVersionEntry = {
                                    versionSelector: versionSelector,
                                    componentId: selector.componentId
                                };
                                submitData.versions.push(selectedVersionEntry);
                            }
                        });     
                    }
                },
                postSubmit: function(data) {
                    // If the rest service returns blackouts, the move failed. Show error message.
                    if (data.blackouts !== undefined) {
                        var errorMessage = i18n("The event cannot be moved to that time because it conflicts with a blackout")+":<br/>";
                        if (data.blackouts.length > 1) {
                            errorMessage = i18n("The event cannot be moved to that time because it conflicts with blackouts")+":<br/>";
                        }
                        
                        array.forEach(data.blackouts, function(blackout) {
                            errorMessage += "<br/><b>"+util.escape(blackout.name)+"</b><br/>";
                            if (blackout.environment !== undefined) {
                                errorMessage += "&nbsp; &nbsp; <b>"+i18n("Application Environment")+"</b>: "+util.escape(blackout.environment.name)+"<br/>";
                            }
                            errorMessage += "&nbsp; &nbsp; "+util.dateFormatShort(blackout.startDate)+" - "+util.dateFormatShort(blackout.endDate)+"<br/>";
                        });

                        var alert = new Alert({
                            title: i18n("Schedule Error"),
                            forceRawMessages: true,
                            message: errorMessage
                        });
                    }
                    else {
                        if (self.callback !== undefined) {
                            self.callback();
                        }
                    }
                },
                onCancel: function() {
                    if (self.callback !== undefined) {
                        self.callback();
                    }
                }
            });

            this.form.addField({
                name: "dateLabel",
                label: "",
                value: i18n("Choose a date for this event."),
                type: "Label"
            });
            
            this.form.addField({
                name: "startDate",
                label: i18n("Date"),
                required: true,
                value: existingValues.startDate,
                type: "Date"
            });

            this.form.addField({
                name: "startTime",
                label: i18n("Time"),
                required: true,
                value: existingValues.startTime,
                type: "Time"
            });
            
            array.forEach(self.entry.versions, function(selector) {
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
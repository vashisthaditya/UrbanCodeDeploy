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
/*global define, require, i18n */

define([
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/_base/Color",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/dom-geometry",
        "dojo/on",
        "dojo/has",
        "dojo/mouse",
        "deploy/widgets/Popup",
        "js/webext/widgets/color/Color"
        ],
function(
        _TemplatedMixin,
        _Widget,
        array,
        declare,
        xhr,
        Color,
        domClass,
        domConstruct,
        geo,
        on,
        has,
        mouse,
        Popup,
        WebextColor
) {
    return declare([_Widget, _TemplatedMixin], {
        templateString:
            '<div class="version-history-calendar">'+
              '<div class="inlineBlock version-calendar">' +
                '<div data-dojo-attach-point="keyAttach" class="version-calendar-key"></div>' +
                '<div data-dojo-attach-point="titleAttach" class="version-calendar-title"></div>' +
                '<div data-dojo-attach-point="buttonAttach" class="version-calendar-buttons"></div>' +
                '<div data-dojo-attach-point="headerAttach" class="version-calendar-header"></div>' +
                '<div data-dojo-attach-point="calendarAttach" class="version-calendar-contents"></div>' +
                '<div data-dojo-attach-point="calendarBlocker" class="version-calendar-right-blocker"></div>' +
              '</div>' +
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.dayWidth = 3.13;
            this.versionHeight = 26;
            this.environmentHeight = 46;
            this.environmentsExpandedState = {};
            this.today = this._getBeginningOfDay(new Date());
            this.showKey();
            this._createCalendar();
        },

        showKey: function(){
            domConstruct.create("div", {
                className: "version-calendar-key-label inlineBlock",
                innerHTML: i18n("Key: ")
            }, this.keyAttach);
            domConstruct.create("div", {
                className: "version-calendar-version current-version inlineBlock",
                innerHTML: i18n("Environment Inventory for Component")
            }, this.keyAttach);
        },

        /**
         * Refreshes and builds the calendar and sets up navigation arrows
         *  @param day: The day to show on calendar. (Shifted 28 places to the right. Default: Today)
         */
        _createCalendar: function(day){
            var _this = this;
            domConstruct.empty(this.buttonAttach);
            domConstruct.empty(this.headerAttach);
            domConstruct.empty(this.calendarAttach);
            this.environmentRows = [];

            var backArrow = '<div class="inlineBlock arrow back-arrow"></div>';
            var forwardArrow = '<div class="inlineBlock arrow forward-arrow"></div>';
            var controlContainer = domConstruct.create("div", {
                className: "calendar-control-container"
            }, this.buttonAttach);
            var buttonContainer = domConstruct.create("div", {
                className: "calendar-button-container"
            }, controlContainer);
            on(buttonContainer, mouse.leave, function(evt){
                _this.down = false;
            });

            var viewDay = day || this.today;
            var backwardMonth = domConstruct.create("div", {
                className: "inlineBlock linkPointer no-double-click-select calendar-arrow back-month",
                innerHTML: backArrow + backArrow,
                title: i18n("Move back 1 month")
            }, buttonContainer);
            on(backwardMonth, "mousedown", function(){
                _this._createCalendar(util.shiftMonths(viewDay, -1));
            });

            var backwardDay = domConstruct.create("div", {
                className: "inlineBlock linkPointer no-double-click-select calendar-arrow back-day",
                innerHTML: backArrow,
                title: i18n("Move back 1 day")
            }, buttonContainer);
            // If user hold arrow down, scroll through.
            on(backwardDay, "mousedown", function(evt){
                _this.firstHold = false;
                _this.down = -1;
                _this._createCalendar(util.shiftDays(viewDay, -1));
            });
            on(backwardDay, "mouseup", function(evt){
                _this.down = false;
            });
            on(backwardDay, mouse.leave, function(evt){
                _this.down = false;
            });

            var forwardDay = domConstruct.create("div", {
                className: "inlineBlock linkPointer no-double-click-select calendar-arrow forward-day",
                innerHTML: forwardArrow,
                title: i18n("Move forward 1 day")
            }, buttonContainer);
            // If user hold arrow down, scroll through.
            on(forwardDay, "mousedown", function(){
                _this.firstHold = false;
                _this.down = 1;
                _this._createCalendar(util.shiftDays(viewDay, 1));
            });
            on(forwardDay, "mouseup", function(evt){
                _this.down = false;
            });
            on(forwardDay, mouse.leave, function(evt){
                _this.down = false;
            });

            var forwardMonth = domConstruct.create("div", {
                className: "inlineBlock linkPointer no-double-click-select calendar-arrow forward-month",
                innerHTML: forwardArrow + forwardArrow,
                title: i18n("Move forward 1 month")
            }, buttonContainer);
            on(forwardMonth, "mousedown", function(){
                _this._createCalendar(util.shiftMonths(viewDay, 1));
            });

            var goToToday = domConstruct.create("a", {
                className: "inlineBlock linkPointer today-link",
                innerHTML: i18n("Today"),
                title: i18n("Bring current day into view")
            }, controlContainer);
            on(goToToday, "click", function(){
                _this._createCalendar(_this.today);
            });

            var expandContainer = domConstruct.create("div", {
                className: "no-double-click-select calendar-expander"
            }, this.buttonAttach);

            var expandAll = domConstruct.create("a", {
                className: "inlineBlock linkPointer environment-expander",
                innerHTML: i18n("Expand All"),
                title: i18n("Expand All Environment Rows")
            }, expandContainer);
            on(expandAll, "click", function(){
                _this._expandCollapseAllRows(true);
            });
            var collapseAll = domConstruct.create("a", {
                className: "inlineBlock linkPointer environment-expander",
                innerHTML: i18n("Collapse All"),
                title: i18n("Collapse All Environment Rows")
            }, expandContainer);
            on(collapseAll, "click", function(){
                _this._expandCollapseAllRows();
            });

            var numberOfDays = 32;
            var start = util.shiftDays(this.today, -28);
            var end = util.shiftDays(start, numberOfDays);

            if (day){
                start = util.shiftDays(day, -28);
                end = util.shiftDays(start, numberOfDays);
            }
            this.loadEnvironments(start, end);
            this.showDateHeaders(start, numberOfDays);

            //If increment/decrement day is held down, continue to move calendar.
            // Pause after first click, then scroll at faster speed.
            if (this.down){
                var timeout = 60;
                if (!this.firstHold){
                    timeout = 300;
                    this.firstHold = true;
                }
                setTimeout(function(){
                    if (_this.down){
                        _this._createCalendar(util.shiftDays(day, _this.down));
                    }
                }, timeout);
            }

            // When button controls reach the top of the page, dock it to the top;
            if (window){
                on(window, "scroll", function(evt){
                    try {
                        var position = geo.position(_this.domNode);
                        if (position && position.y < 22){
                            if (!domClass.contains(_this.buttonAttach, "calendar-fixed-control")){
                                domClass.add(_this.buttonAttach, "calendar-fixed-control");
                            }
                        }
                        else if (domClass.contains(_this.buttonAttach, "calendar-fixed-control")){
                            domClass.remove(_this.buttonAttach, "calendar-fixed-control");
                        }
                    }
                    catch(ignore) {
                        // Geo-position cannot find owner document. Somehow not caught by dojo.
                        // None blocking error, so we don't need to show it to console.
                    }
                });
            }
        },

        /**
         * Sets the height of the calendar.
         */
        _setCalendarHeight: function(){
            //Minimum height of calendar is 450px;
            var minHeight = 450;
            var height = 80;
            array.forEach(this.environmentRows, function(row){
                height += geo.getMarginBox(row).h;
            });

            if (height < minHeight){
                height = minHeight;
            }
            this.headerAttach.style.height = height + "px";
        },

        /**
         * Loads the environments.
         *  @param start: The start of the given month.
         *  @param end: The end of the given month.
         */
        loadEnvironments: function(start, end) {
            var _this = this;
            if (!this.versions){
                //Get the list of versions of the Component.
                xhr.get({
                    //rest/deploy/application/{applicationid}/versionHistory/{componentId}
                    url: bootstrap.restUrl+"deploy/application/" + _this.application.id + "/versionHistory/" + _this.component.id,
                    handleAs: "json",
                    load: function(environments) {
                        _this.versions = environments;
                        _this._showEnvironments(start, end);
                    }
                });
            }
            else {
                _this._showEnvironments(start, end);
            }
        },

        /**
         * Display the environment rows.
         *  @param start: The start of the given month.
         *  @param end: The end of the given month.
         */
        _showEnvironments: function(start, end){
            var _this = this;
            array.forEach(this.versions, function(environment){
                _this._createEnvironmentRow(environment, start, end);
            });
            _this._setCalendarHeight();
        },

        /**
         * Creates a row for an environment
         *  @param environment: Environment model.
         *  @param start: The start time of the calendar.
         *  @param end: The end time of the calendar.
         */
        _createEnvironmentRow: function(environment, start, end){
            var _this = this;
            this.count = 0;
            var environmentColorObject = WebextColor.getColorOrConvert(environment.color || "#d3d3d3");
            if (!environmentColorObject.standard && environmentColorObject.fallback){
                environmentColorObject = WebextColor.getColor(environmentColorObject.fallback);
            }
            var environmentColor = environmentColorObject.value;
            // Color of the row. If white, use light gray color instead;
            var rowColor = new Color(environmentColor === "#ffffff" ? "#d3d3d3" : environmentColor).toRgb();
            var environmentRow = domConstruct.create("div");
            // IE 8 and below doesn't support rgba colors. Use a filter to display translucent colors.
            if (has("ie") < 9){
                var ieColor = new Color(rowColor).toHex().substring(1);
                environmentRow = domConstruct.create("div", {
                    className: "version-calendar-row",
                    style: {
                        filter: "progid:DXImageTransform.Microsoft.gradient(GradientType=0," +
                                "startColorstr='#4c" + ieColor + "', endColorstr='#4c"+ ieColor + "')"
                    }
                }, _this.calendarAttach);
            }
            else {
                environmentRow = domConstruct.create("div", {
                    className: "version-calendar-row",
                    style: {
                        background: "rgba(" + rowColor + ", 0.20)"
                    }
                }, _this.calendarAttach);
            }

            this._setExpandEnvironmentRow(environmentRow, environment.id);
            // Store a reference to the environment row.
            this.environmentRows.push(environmentRow);
            // Store the expand/collapse state of the environment.
            if (!this.environmentsExpandedState[environment.id]){
                this.environmentsExpandedState[environment.id] = "environment-expanded";
            }

            var environmentName = environment.name;
            if (environmentName.length > 18){
                environmentName = environmentName.substring(0, 18) + "...";
            }
            var environmentNameContainer = domConstruct.create("div", {
                className: "version-calendar-environment inlineBlock",
                title: environment.name
            }, environmentRow);

            domConstruct.create("div", {
                className: "inlineBlock linkPointer environment-expander"
            }, environmentNameContainer);
            on(environmentNameContainer, "click", function(){
                _this._toggleExpandEnvironmentRow(environmentRow, environment.id);
            });

            domConstruct.create("div", {
                className: "inlineBlock linkPointer color-box",
                style: {
                    backgroundColor: environmentColor
                }
            }, environmentNameContainer);

            domConstruct.create("div", {
                className: "inlineBlock environment-name",
                title: environment.name,
                innerHTML: environmentName.escape(),
                style: {
                    color: environmentColor,
                    backgroundColor: _this.getTextBackgroundColor(environmentColor)
                }
            }, environmentNameContainer);

            array.forEach(environment.history, function(version){
                var extraClass = "";
                var previousVersion = null;
                var versionData = version.history;
                array.forEach(versionData, function(versionInfo){
                    var startTime = new Date(versionInfo.start);
                    var endTime = new Date(versionInfo.end);
                    if (startTime <= end && (endTime >= start || versionInfo.end === 0)){
                        if (previousVersion){
                            extraClass = "same-version";
                            var previousStart = new Date(previousVersion.start);
                            if (previousStart.getDate() === startTime.getDate()){
                                extraClass += " same-day";
                            }
                        }
                        else {
                            previousVersion = versionInfo;
                        }
                        _this._createVersionBar(start, end, version, versionInfo, environmentRow, environmentColor, extraClass);
                    }
                });
            });
        },

        /**
         * Expand or collapse environment rows.
         *  @param environmentRow: The environment row to set the expanded or collapsed state
         *  @param environmentId: The Id of the environment.
         */
        _toggleExpandEnvironmentRow: function(environmentRow, environmentId){
            if (this.environmentsExpandedState[environmentId]){
                domClass.remove(environmentRow, "environment-expanded");
                domClass.remove(environmentRow, "environment-collapsed");
                if (this.environmentsExpandedState[environmentId] === "environment-expanded"){
                    this.environmentsExpandedState[environmentId] = "environment-collapsed";
                    domClass.add(environmentRow, "environment-collapsed");
                }
                else {
                    this.environmentsExpandedState[environmentId] = "environment-expanded";
                    domClass.add(environmentRow, "environment-expanded");
                }
            }
            else {
                if (domClass.contains(environmentRow, "environment-expanded")){
                    domClass.remove(environmentRow, "environment-expanded");
                    domClass.add(environmentRow, "environment-collapsed");
                }
                else {
                    domClass.remove(environmentRow, "environment-expanded");
                    domClass.remove(environmentRow, "environment-collapsed");
                    domClass.add(environmentRow, "environment-expanded");
                }
            }
            this._setCalendarHeight();
        },

        /**
         * Expand / Collapse all environment rows.
         *  @param expand: True to expand all rows.
         */
        _expandCollapseAllRows: function(expand){
            var _this = this;
            array.forEach(this.environmentRows, function(row){
                domClass.remove(row, "environment-expanded");
                domClass.remove(row, "environment-collapsed");
                if (expand){
                    domClass.add(row, "environment-expanded");
                }
                else {
                    domClass.add(row, "environment-collapsed");
                }
            });
            var environmentId = "";
            for(environmentId in _this.environmentsExpandedState) {
                if (_this.environmentsExpandedState.hasOwnProperty(environmentId)) {
                    if (expand){
                        _this.environmentsExpandedState[environmentId] = "environment-expanded";
                    }
                    else {
                        _this.environmentsExpandedState[environmentId] = "environment-collapsed";
                    }
                }
             }
            this._setCalendarHeight();
        },

        /**
         * When switching days or months on the calendar, retain expand/collapse state of environments
         *  @param environmentRow: The environment row to set the expanded or collapsed state
         *  @param environmentId: The Id of the environment.
         */
        _setExpandEnvironmentRow: function(environmentRow, environmentId){
            if (this.environmentsExpandedState[environmentId]){
                if (this.environmentsExpandedState[environmentId] === "environment-expanded"){
                    domClass.add(environmentRow, "environment-expanded");
                }
                else {
                    domClass.add(environmentRow, "environment-collapsed");
                }
            }
            else {
                domClass.add(environmentRow, "environment-expanded");
            }
        },

        /**
         * Generate a version bar for a particular environment
         *  @param start: The start time of the calendar.
         *  @param end: The end time of the calendar.
         *  @param version: The version associated with this environment.
         *  @param versionInfo: Object of start and end times of the version.
         *  @param environmentRow: The environment row domNode.
         *  @param extraClass: Additional class to add to version bar.
         */
        _createVersionBar: function(start, end, version, versionInfo, environmentRow, environmentColor, extraClass){
            var _this = this;
            var dateStart = new Date(versionInfo.start);
            var dateEnd = _this.today;
            if (versionInfo.end !== 0){
                dateEnd = new Date(versionInfo.end);
            }
            else {
                extraClass += " current-version";
            }

            if (!(dateEnd < start || dateStart > end)){
                if (start > dateStart){
                    dateStart = start;
                }
                if (end < dateEnd){
                    dateEnd = end;
                }
                dateStart = _this._getBeginningOfDay(dateStart);
                dateEnd = _this._getBeginningOfDay(dateEnd);

                //Get the difference between the start and end times and sets the length and
                //position of the version bar.
                var oneDay = 24*60*60*1000;
                var barLength = Math.round(Math.abs((dateStart.getTime() - dateEnd.getTime())/oneDay)) + 1;
                var marginLeft = Math.round(Math.abs((start.getTime() - dateStart.getTime())/oneDay));
                if (end <= dateEnd){
                    barLength--;
                }
                var borderColor = _this.getShade(environmentColor);
                var darkColor = _this.isDarkColor(environmentColor);
                var environmentVersion = null;
                // With the problems safari & ie7 has with percentage width divs, instead of a margin left
                // to place the bar, create divs left of the version bar to position the version bar.
                if (has("safari") || has("ie") < 8){
                    var i = 0;
                    domConstruct.create("div", {}, environmentRow);
                    for (i; i < marginLeft; i++){
                        domConstruct.create("div", {
                            className: "inlineBlock",
                            style: {
                                width: _this.dayWidth + "%"
                            }
                        }, environmentRow);
                    }
                    environmentVersion = domConstruct.create("div", {
                        className: "inlineBlock version-calendar-version" + (darkColor ? " dark-color-environment" : "") +  " " + extraClass,
                        innerHTML: version.name.escape(),
                        style: {
                            marginLeft: "0",
                            width: barLength * _this.dayWidth + "%",
                            backgroundColor: environmentColor

                        }
                    }, environmentRow);
                }
                else {
                    environmentVersion = domConstruct.create("div", {
                        className: "version-calendar-version" + (darkColor ? " dark-color-environment" : "") +  " " + extraClass,
                        innerHTML: version.name.escape(),
                        style: {
                            marginLeft: marginLeft * _this.dayWidth + "%",
                            width: barLength * _this.dayWidth + "%",
                            backgroundColor: environmentColor

                        }
                    }, environmentRow);
                }
                if (has("ie") < 9){
                    environmentVersion.style.outline = "1px solid " + (environmentColor === "#ffffff" ? "#D3D3D3" : borderColor);
                }

                var versionPopup = _this._createVersionPopupContainer(version, versionInfo);
                var popup = new Popup({
                    attachPoint: environmentVersion,
                    contents: versionPopup
                });
            }
        },

        /**
         * Builds the inner contents of the version popups.
         *  @param version: The version associated with an environment.
         *  @param versionInfo: Object of start and end times of the version.
         *  @return A domNode of the version name & start/end times.
         */
        _createVersionPopupContainer: function(version, versionInfo){
            var versionPopup = domConstruct.create("div", {className: "calendar-popup"});

            var versionName = version.name.escape();

            domConstruct.create("div", {
                innerHTML: versionName
            }, versionPopup);

            var dateStartContainer = domConstruct.create("div", {}, versionPopup);
            domConstruct.create("div", {
                className: "inlineBlock version-date-label",
                innerHTML: i18n("Start Date:")
            }, dateStartContainer);
            domConstruct.create("div", {
                className: "inlineBlock",
                innerHTML: util.dateOnlyFormat(new Date(versionInfo.start), "M/d/yyyy hh:mm a")
            }, dateStartContainer);

            var dateEndContainer = domConstruct.create("div", {}, versionPopup);
            domConstruct.create("div", {
                className: "inlineBlock version-date-label",
                innerHTML: i18n("End Date:")
            }, dateEndContainer);
            var endTime = i18n("Currently Deployed");
            if (versionInfo.end !== 0){
                endTime = util.dateOnlyFormat(new Date(versionInfo.end), "M/d/yyyy hh:mm a");
            }
            domConstruct.create("div", {
                className: "inlineBlock",
                innerHTML: endTime
            }, dateEndContainer);
            return versionPopup;
        },

        /**
         * Creates the date columns of the calendar.
            @param start: The start time of the calendar.
         *  @param numberOfDays: The number of column days to display.
         */
        showDateHeaders: function(start, numberOfDays) {
            var _this = this;
            var currentDay = start;

            var dateContents = null;
            var dayCount = 0;
            var currentMonth = "Calendar";
            var tomorrow = false;
            var todayClass,
            dateColumn,
            showMonth,
            monthContainer;

            while (dayCount < numberOfDays) {
                todayClass = "";
                if (_this.today.getMonth() === currentDay.getMonth() && _this.today.getDate() === currentDay.getDate()
                        && _this.today.getYear() === currentDay.getYear()){
                    todayClass = " current-day";
                    tomorrow = true;
                }
                else if (tomorrow){
                    todayClass = " tomorrow-day";
                    tomorrow = false;
                }

                dateColumn = domConstruct.create("div", {
                    className: "version-date-column inlineBlock" + todayClass
                }, _this.headerAttach);

                domConstruct.create("div", {
                    className: "version-date-label",
                    innerHTML: util.dateOnlyFormat(currentDay, "EEE")
                }, dateColumn);

                domConstruct.create("div", {
                    className: "version-date-number",
                    innerHTML: currentDay.getDate()
                }, dateColumn);

                dateContents = domConstruct.create("div", {
                    className: "version-date-contents"
                }, dateColumn);

                domConstruct.create("div", {
                    className: "version-date-number bottom-date-number",
                    innerHTML: currentDay.getDate()
                }, dateColumn);

                domConstruct.create("div", {
                    className: "version-date-label bottom-date-label",
                    innerHTML: util.dateOnlyFormat(currentDay, "EEE")
                }, dateColumn);

                showMonth = false;
                if (currentMonth !== util.dateOnlyFormat(currentDay, "MMMM yyyy")){
                    showMonth = true;
                }
                currentMonth = util.dateOnlyFormat(currentDay, "MMMM yyyy");

                if (showMonth){
                    monthContainer = domConstruct.create("div", {
                        className: "version-date-month-header"
                    }, dateColumn);
                    domConstruct.create("div", {
                        className: "version-date-month",
                        innerHTML: currentMonth
                    }, monthContainer);
                    domClass.add(dateColumn, "current-month");
                }

                currentDay = new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate() + 1);
                dayCount++;
            }
            if (dateContents){
                dateContents.style.borderRightWidth = "2px";
            }
        },

        /**
         * Sets the time of a given day to 0:00.00.0000
         *  @param day: The day to set the time
         *  @return The given day with the new time.
         */
        _getBeginningOfDay: function(day){
            var date = day;
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);
            date.setMilliseconds(0);
            return date;
        },

        /**
         * Determines if a given color is dark.
         */
        isDarkColor : function(color) {
            var rgbColor = new Color(color).toRgb();
            var colorWeight = 1 - (0.25 * rgbColor[0] + 0.6 * rgbColor[1] + 0.1 * rgbColor[2]) / 255;
            return colorWeight > 0.25;
        },

        /**
         * Determines if a given color is too light to be displayed on an almost white background and returns
         * a shade of color to set as the text background.
         */
        getTextBackgroundColor : function(color) {
            var rgbColor = new Color(color).toRgb();
            var colorWeight = (300 * rgbColor[0] + 580 * rgbColor[1] + 110 * rgbColor[2]) / 1000;
            var colorText = "";
            if (colorWeight > 200){
                colorText = this.getTint(color, 0.82);
            }
            return colorText;
        },

        /**
         * Returns a lighter tint of a given color.
         */
        getTint : function(color, delta) {
            delta = delta || 1.2;
            return this._alterColor(color, delta);
        },

        /**
         * Returns a darker shade of a given color.
         */
        getShade : function(color, delta) {
            delta = delta || 0.6;
            return this._alterColor(color, delta);
        },
        _alterColor : function (color, delta) {
            var rgbColor = new Color(color).toRgb(),
                tint = [];
            array.forEach(rgbColor, function(hue){
                tint.push(delta * hue);
            });
            return Color.fromArray(tint).toHex();
        }
    });
});
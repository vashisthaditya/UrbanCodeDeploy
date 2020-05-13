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
/*global define, escape, unescape, document, appState:true, config: true */
define([
        "dojo/_base/declare",
        "dojo/_base/array",
        "dojo/_base/Color",
        "dojo/_base/kernel",
        "dojo/_base/lang",
        "dojo/_base/sniff",
        "dojo/_base/window",
        "dojo/_base/xhr", // legacy dojo.xhr backing for dojo.xhr* methods
        "dojo/request/xhr",
        "dojo/Deferred",
        "dojo/aspect",
        "dojo/dom-attr",
        "dojo/dom-construct",
        'dojo/dom-class',
        "js/webext/widgets/Config",
        "js/webext/widgets/Dialog",
        "dojox/html/entities",
        "dojo/json",
        "dojo/cookie",
        "dojo/dom-geometry",
        "dijit/_BidiSupport",
        "js/webext/widgets/BidiDateUtil",
        "js/webext/widgets/Alert"
        ],
function(
        declare,
        array,
        Color,
        kernel,
        lang,
        sniff,
        win,
        baseXhr,
        requestXhr,
        Deferred,
        aspect,
        domAttr,
        domConstruct,
        domClass,
        Config,
        Dialog,
        entities,
        JSON,
        cookie,
        geometry,
        bidi,
        BidiDateUtil,
        Alert
) {

    // shared state for i18n global function
    var i18nData = null;
    var defaultLocaleData = null;
    if (!kernel.global.config) {
        // deprecated
        kernel.global.config = new Config();
    }

    var noop = function () {
        // intentionally empty, for jslint checks
        return undefined;
    };

    var Util = declare(
        [],
        {

        /**
         * @private internal deferred object, to handle resolution
         */
        _i18nLoaded: null,
        /**
         * reference to the i18nLoaded promise so that
         * `util.i18nLoaded.then()` can chain activity that depends
         * on util.loadI18n() having completed
         */
        i18nLoaded: null,
        /**
         *
         */
        timeFormatPattern : undefined,
        dateFormatPattern : undefined,
        baseTextDir       : undefined,
        calendar          : undefined,

        constructor: function() {

            this._i18nLoaded = new Deferred();
            this.i18nLoaded = this._i18nLoaded.promise;

            this.msPerSecond = 1000;
            this.msPerMinute = this.msPerSecond*60;
            this.msPerHour = this.msPerMinute*60;
            this.msPerDay = this.msPerHour*24;
            this.msPerWeek = this.msPerDay*7;
            this.msTimezoneOffset = new Date().getTimezoneOffset()*this.msPerMinute;

        },

        /**
         * Determines whether an object has any keys.
         */
        isEmpty: function(object) {
            /*jslint forin:true */
            var empty = true;
            var i = null;

            for (i in object) {
                empty = false;
                if (i) {
                    break;
                }
            }

            return empty;
        },

        /**
         * A no-op function.
         */
        noop: noop,


        /**
         * Given date objects representing separate date and time fields, merge the
         * values and account for any potential timezone issues.
         */
        combineDateAndTime: function(dateIn, timeIn) {
            var date = new Date(dateIn);
            var time = new Date(timeIn);
            var startYear = date.getFullYear();
            var startMonth = date.getMonth();
            var startDay = date.getDate();
            var startHours = time.getHours();
            var startMinutes = time.getMinutes();
            var result = BidiDateUtil.fromGregorian(new Date(startYear, startMonth, startDay, startHours, startMinutes));
            return result;
        },

        /**
         * Given any date, return the date representing 00:00 of the first day of
         * that week.
         */
        getStartOfWeek: function(dateIn) {
            var date = new Date(dateIn);
            while (date.getDay() > 0) {
                // Move in 23 hour increments to avoid skipping days when DST
                // changes.
                date = new Date(date.valueOf() - (util.msPerHour*23));
            }
            var year = date.getFullYear();
            var month = date.getMonth();
            var day = date.getDate();
            var result = BidiDateUtil.fromGregorian(new Date(year, month, day));
            return result;
        },

        /**
         * Given any date, return the date representing 23:59:59.999 of the monday
         * of that week. Assumes a calendar where monday is the first day.
         */
        getStartOfWorkWeek: function(dateIn) {
            var date = new Date(dateIn);
            while (date.getDay() !== 1) {
                // Move in 23 hour increments to avoid skipping days when DST
                // changes.
                date = new Date(date.valueOf()-(util.msPerHour*23));
            }
            var year = date.getFullYear();
            var month = date.getMonth();
            var day = date.getDate();
            var result = BidiDateUtil.fromGregorian(new Date(year, month, day));
            return result;
        },

        /**
         * Given any date, return the date representing 23:59:59.999 of the last day
         * of that week.
         */
        getEndOfWeek: function(dateIn) {
            var date = new Date(dateIn);
            while (date.getDay() < 6) {
                // Move in 23 hour increments to avoid skipping days when DST
                // changes.
                date = new Date(date.valueOf() + (util.msPerHour*23));
            }
            var year = date.getFullYear();
            var month = date.getMonth();
            var day = date.getDate();
            var result = BidiDateUtil.fromGregorian(new Date(year, month, day, 23, 59, 59, 999));
            return result;
        },

        /**
         * Given any date, return the date representing 23:59:59.999 of the sunday
         * of that week. Assumes a calendar where monday is the first day.
         */
        getEndOfWorkWeek: function(dateIn) {
            var date = new Date(dateIn);
            while (date.getDay() > 0) {
                // Move in 23 hour increments to avoid skipping days when DST
                // changes.
                date = new Date(date.valueOf()+(util.msPerHour*23));
            }
            var year = date.getFullYear();
            var month = date.getMonth();
            var day = date.getDate();
            var result = BidiDateUtil.fromGregorian(new Date(year, month, day));
            return result;
        },

        /**
         * Given any date, return the date representing 00:00 of the first day of
         * that month.
         */
        getStartOfMonth: function(dateIn) {
            var date = new Date(dateIn);
            var year = date.getFullYear();
            var month = date.getMonth();
            var day = 1;
            var result = BidiDateUtil.fromGregorian(new Date(year, month, day));
            return result;
        },
        /**
         * Given any date, return the date representing 23:59:59.999 of the last day
         * of that month.
         */
        getEndOfMonth: function(dateIn) {
            var date = new Date(dateIn);
            var year = date.getFullYear();
            var month = date.getMonth();
            var day = 32 - new Date(year, month, 32).getDate();
            var result = BidiDateUtil.fromGregorian(new Date(year, month, day));
            return result;
        },

        /**
         * Move by some number of months, leaving the day and time unchanged.
         */
        shiftMonths: function(dateIn, monthCount) {
            var date = new Date(dateIn);
            var year = date.getFullYear();
            var month = date.getMonth() + monthCount;
            var day = date.getDate();
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var seconds = date.getSeconds();
            var milliseconds = date.getMilliseconds();

            var result = BidiDateUtil.fromGregorian(new Date(year, month, day, hours, minutes, seconds, milliseconds));
            return result;
        },

        /**
         * Move by some number of weeks, leaving the weekday and time unchanged.
         */
        shiftWeeks: function(dateIn, weekCount) {
            var date = new Date(dateIn);
            var year = date.getFullYear();
            var month = date.getMonth();
            var day = date.getDate() + (weekCount * 7);
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var seconds = date.getSeconds();
            var milliseconds = date.getMilliseconds();

            var result = BidiDateUtil.fromGregorian(new Date(year, month, day, hours, minutes, seconds, milliseconds));
            return result;
        },

        /**
         * Move by some number of days, leaving the time unchanged.
         */
        shiftDays: function(dateIn, dayCount) {
            var date = new Date(dateIn);
            var year = date.getFullYear();
            var month = date.getMonth();
            var day = date.getDate() + dayCount;
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var seconds = date.getSeconds();
            var milliseconds = date.getMilliseconds();

            var result = BidiDateUtil.fromGregorian(new Date(year, month, day, hours, minutes, seconds, milliseconds));
            return result;
        },

        /**
         * Move by some number of hours.
         */
        shiftHours: function(dateIn, hourCount) {
            var date = new Date(dateIn);
            var year = date.getFullYear();
            var month = date.getMonth();
            var day = date.getDate();
            var hours = date.getHours()+hourCount;
            var minutes = date.getMinutes();
            var seconds = date.getSeconds();
            var milliseconds = date.getMilliseconds();

            var result = BidiDateUtil.fromGregorian(new Date(year, month, day, hours, minutes, seconds, milliseconds));
            return result;
        },

        /**
         * Move by some number of minutes.
         */
        shiftMinutes: function(dateIn, minuteCount) {
            var date = new Date(dateIn);
            var year = date.getFullYear();
            var month = date.getMonth();
            var day = date.getDate();
            var hours = date.getHours();
            var minutes = date.getMinutes()+minuteCount;
            var seconds = date.getSeconds();
            var milliseconds = date.getMilliseconds();

            var result = BidiDateUtil.fromGregorian(new Date(year, month, day, hours, minutes, seconds, milliseconds));
            return result;
        },

        /**
         * Formats a given date reference in the user long format
         */
        formatDateTime: function(date) {
            var t = this;
            if (!date) {
                // falsey value, treat as empty
                return "";
            }
            if (typeof date === 'string') {
                // pre-formatted value
                return date;
            }
            if (typeof date === 'number') {
                // number, treat as unix time
                date = new Date(date);
            }
            var format = t.dateFormatPattern + " " + t.timeFormatPattern;
            return t.dateOnlyFormat(date, format);
        },

        // -------------------------------------------------------------------------------
        // General formatters for use in grids.
        // -------------------------------------------------------------------------------

        /**
         * Format as a short date/time format.
         */
        dateFormatter: function(arg) {
            var result = "";

            if (!!arg) {
                result = util.dateFormatShort(arg);
            }

            result = util.wrapCell(result);
            return result;
        },

        /**
         * Format as a short date/time format, taking arguments for the table
         * widget.
         */
        tableDateFormatter: function(item, arg) {
            var result = "";

            if (!!arg) {
                result = util.dateFormatShort(arg);
            }

            return result;
        },

        /**
         * Convert a date string/code to a short date format.
         */
        dateFormatShort: function(dateString) {
            var self = this;
            var result = null;

            var date = new Date(dateString);

            //if the date is invalid(such as non expiring auth tokens which overruns js allowed max integer
            // then date.valueOf() will return "Invalid Date"
            if (date !== null && !isNaN(date.valueOf())) {
                result = BidiDateUtil.formatBidiDate(date, {
                            formatLength: "short",
                            fullYear: true,
                            datePattern: self.dateFormatPattern,
                            timePattern: self.timeFormatPattern
                        });
            }

            return result;
        },

        /**
         * Convert a date string/code to a short date format with seconds.
         */
        dateFormatShortSeconds: function(dateString) {
            var result = null;

            var date = new Date(dateString);

            if (date !== null) {
                result = BidiDateUtil.formatBidiDate(date, {
                            selector: "time",
                            formatLength: "medium"
                        });
            }
            return result;
        },

        /**
         * Convert a date string/code to a short day format.
         */
        dayFormatShort: function(dateString) {
            var self = this;
            var result = null;

            var date = new Date(dateString);

            if (date !== null) {
                result = BidiDateUtil.formatBidiDate(date, {
                            selector: "date",
                            formatLength: "short",
                            fullYear: true,
                            datePattern: self.dateFormatPattern
                        });
            }
            return result;
        },

        /**
         * Convert a date string/code to a specified pattern.
         */
        dateOnlyFormat: function(dateString, pattern) {
            var result = null;

            var date = new Date(dateString);

            if (date !== null) {
                result = BidiDateUtil.formatBidiDate(date, {
                            selector: "date",
                            datePattern: pattern
                });
            }
            return result;
        },

        /**
         * Convert a date string/code to an hour format.
         */
        timeOnlyFormat: function(dateString, pattern) {
            var result = null;

            var date = new Date(dateString);

            if (date !== null) {
                result = BidiDateUtil.formatBidiDate(date, {
                            selector: "time",
                            timePattern: pattern
                        });
            }
            return result;
        },

        /**
         * Format a size in bytes as whatever size measurement is appropriate.
         */
        fileSizeFormat: function(size, precision) {
            if (typeof precision !== "number") {
                precision = 1;
            }
            else if (precision < 0) {
                precision = 0;
            }
            else if (precision > 20) {
                precision = 20;
            }

            var sizeBytes = parseFloat(size);
            var sizeKB = (sizeBytes/1024).toFixed(precision);
            var sizeMB = (sizeKB/1024).toFixed(precision);
            var sizeGB = (sizeMB/1024).toFixed(precision);
            var sizeTB = (sizeGB/1024).toFixed(precision);

            var result = "";
            if (sizeKB < 1) {
                result = i18n("%s bytes", sizeBytes);
            }
            else if (sizeMB < 1) {
                result = i18n("%s KB", sizeKB);
            }
            else if (sizeGB < 1) {
                result = i18n("%s MB", sizeMB);
            }
            else if (sizeTB < 1) {
                result = i18n("%s GB", sizeGB);
            }
            else {
                result = i18n("%s TB", sizeTB);
            }
            return result;
        },

        /**
         * Format as a short date/time format, taking arguments for the table
         * widget.
         */
        durationFormatter: function(item, arg) {
            var result = "";

            if (!!arg) {
                result = util.formatDuration(arg);
            }

            return result;
        },

        /**
         * Format a number of milliseconds as a duration.
         * time is a number of milliseconds
         * roundToNearestSecond is a boolean. if true, result will round up or down to nearest second.
         * if false, it will always round down (default behavior), effectively truncating string at the second.
         */
        formatDuration: function(time, options) {
            var hours = 0;
            var minutes = 0;
            var seconds = 0;
            var roundToNearestSec = options && options.roundToNearestSecond;

            while (time >= 3600000) {
                hours++;
                time -= 3600000;
            }
            while (time >= 60000) {
                minutes++;
                time -= 60000;
            }
            while (time >= 1000) {
                seconds++;
                time -= 1000;
            }
            if (roundToNearestSec && time >= 500) {
                seconds++;
            }

            var hoursString = String(hours);
            var minutesString = String(minutes);
            var secondsString = String(seconds);

            if (minutesString.length === 1) {
                minutesString = "0" + minutesString;
            }
            if (secondsString.length === 1) {
                secondsString = "0" + secondsString;
            }

            return hoursString + ":" + minutesString + ":" + secondsString;
        },

        /**********************************************************************
        * THESE METHODS SHOULD NOT BE REMOVED, THEY BREAK UCD IF THEY ARE     *
        * - workflowIdNameFormatter                                           *
        * - projectIdNameFormatter                                            *
        * - buildLifeIdFormatter                                              *
        * - buildLifeOrRequestFormatter                                       *
        *                                                                     *
        * .wrapCell is being injected, we think, in UCD when Util is created  *
        * This is bad, very bad, and should not be done ever. This needs to be*
        * fixed in the future at some point                                   *
        * ********************************************************************/

        /**
         * Format a specifically formatted string (workflowId:workflowName) as a
         * link to that workflow.
         *
         * @Deprecated
         */
        workflowIdNameFormatter: function(arg) {
            var idEnd = arg.indexOf(":");
            var workflowId = arg.substring(0, idEnd);
            var workflowName = arg.substring(idEnd + 1, arg.length);
            var result = "<a href=\"#configuration/" + workflowId + "\">" + workflowName + "</a>";
            result = util.wrapCell(result);
            return result;
        },

        projectIdNameFormatter: function(arg) {
            var idEnd = arg.indexOf(":");
            var projectId = arg.substring(0, idEnd);
            var projectName = arg.substring(idEnd + 1, arg.length);
            var result = "<a href=\"#project/" + projectId + "\">" + projectName + "</a>";
            result = util.wrapCell(result);
            return result;
        },

        /**
         * Format a build life ID as a link to that build life.
         */
        buildLifeIdFormatter: function(arg) {
            var result = "<a href=\"#build/"+arg+"\">"+arg+"</a>";
            return util.centerCell(result);
        },

        /**
         * Format a build life/request ID (using expected formatting) as a link to
         * it.
         */
        buildLifeOrRequestFormatter: function(arg) {
            var delimiter = arg.indexOf("d");
            var id;
            var result;

            if (arg.substring(delimiter + 2, delimiter + 3) === "L") {
                id = arg.substring(delimiter + 7, arg.length);
                result = "<a href=\"#build/" + id + "\">" + arg + "</a>";
            }
            else {
                id = arg.substring(delimiter + 10, arg.length);
                result = "<a href=\"#buildRequest/" + id + "\">" + arg + "</a>";
            }

            return util.centerCell(result);
        },

        /**
         * Clear the global application state tracking object.
         */
        clearAppState: function() {
            appState = {};
        },

        /**
         * Return the set of label/value pairs used as a header on all pages about a
         * workflow.
         */
        generateWorkflowDetails: function() {
            var result = [];

            if (appState.workflow !== undefined) {
                if (!appState.workflow.active) {
                    result.push({
                        hideLabel: true,
                        value: "This configuration has been deactivated, and is read-only.",
                        className: "redNotice"
                    });
                }

                if (appState.workflow.deactivatedDependencies) {
                    result.push({
                        hideLabel: true,
                        value: "One or more of this configuration's dependencies have been deleted.<br/>"+
                               "View the dependency configuration page to view or remove these dependencies.",
                        className: "redNotice"
                    });
                }

                result.push({label: "Name:", value: appState.workflow.name});
                result.push({label: "Description:", value: appState.workflow.description});
                result.push({label: "Template:", value: appState.workflow.templateName});
                result.push({label: "ID:", value: appState.workflow.id});
                result.push({label: "Source Config:", value: appState.workflow.sourceConfig});
                result.push({label: "Last Modified By:", value: appState.workflow.userWhoLastModified});
                result.push({label: "Created By:", value: appState.workflow.createdBy});
            }

            return result;
        },

        /**
         * Setup of the User Preference DateFormat and TimeFormat patterns
         */
        setupTimeDateFormat: function(timeFormat, dateFormat) {
            if (dateFormat) {
                this.dateFormatPattern = dateFormat;
            }
            else {
                this.dateFormatPattern = undefined;
            }

            if (timeFormat) {
                this.timeFormatPattern = timeFormat;
            }
            else {
                this.timeFormatPattern = undefined;
            }
        },
        /**
         * Attempt to load internationalization data. If the user has no i18n
         * settings, the default file will be used.
         */
        loadI18n: function(locale, onLoad) {
            var self = this;
            onLoad = onLoad || noop;
            var localeUrl = bootstrap.contentUrl+"conf/locale/"+locale+".json";
            var defaultLocaleUrl = bootstrap.contentUrl+"conf/locale/default.json";

            var localeFailed = false;

            if (locale) {
                baseXhr.get({
                    "url": localeUrl,
                    handleAs: "json",
                    method: "GET",
                    load: function(data) {
                        i18nData = data;
                        self._i18nLoaded.resolve();
                        onLoad();
                    },
                    error: function(error) {
                        if (defaultLocaleData !== null) {
                            i18nData = defaultLocaleData;
                            self._i18nLoaded.resolve();
                            onLoad();
                        }
                        localeFailed = true;
                    }
                });
            }

            baseXhr.get({
                url: defaultLocaleUrl,
                handleAs: "json",
                method: "GET",
                load: function(data) {
                    if (!locale || localeFailed) {
                        i18nData = data;
                        self._i18nLoaded.resolve();
                        onLoad();
                    }
                    defaultLocaleData = data;
                }
            });

            // returning promise to allow `util.loadI18n().then()`
            return this._i18nLoaded.promise;
        },

        /**
         * Attempt to load a config based on the user's role from a .json file. If
         * it doesn't exist, the default config will be used.
         */
        loadConfig: function(role, onLoad) {
            onLoad = onLoad || noop;

            var configUrl = bootstrap.configUrl;
            if (role) {
                configUrl = bootstrap.contentUrl+"conf/roles/"+role+".json";
            }
            var defaultConfigUrl = bootstrap.contentUrl+"conf/roles/default.json";

            var roleFailed = false;

            var defaultConfigData = null;

            if (configUrl) {
                baseXhr.get( {
                    url: configUrl,
                    handleAs: "json",
                    method: "GET",
                    sync: true,
                    load: function(data) {
                        config.setData(data);
                        onLoad();
                    },
                    error: function(error) {
                        if (defaultConfigData !== null) {
                            config.setData(defaultConfigData);
                            onLoad();
                        }
                        roleFailed = true;
                    }
                });
            }

            if (!configUrl || roleFailed) {
                baseXhr.get({
                    url: defaultConfigUrl,
                    handleAs: "json",
                    method: "GET",
                    load: function(data) {
                        config.setData(data);
                        onLoad();
                        defaultConfigData = data;
                    }
                });
            }
        },

        /**
         * Remove the first instance of an element from the given array.
         *
         * @param {Array}    array: the array from which to remove the item.
         * @param {*}        value: the value that we are looking for in the array.
         * @param {Function} (optional) comparatorFunction: a comparison
         *                   function that defines equality  for removeFromArray.
         *                   parameter {*} a: an element in the array.
         *                   parameter {*} b: the item to remove from the array.
         *                   returns {Boolean} when a match is found.
         * //XXX disabled @param {Boolean}  firstOnly (optional) whether or not
         * to remove only the first match from that array.
         *
         * NOTE:  If you do not define a comparator function when comparing objects
         * javascript will default to comparing by reference, meaning that the value
         * will be removed from the array ONLY if it references the same object
         * instance as is referenced in an index in the array.
         */
        removeFromArray: function(array, value, comparatorFunction, firstOnly) {
            var foundElement = false,
                elementCounter = 0;

            firstOnly = true; //TODO remove this when we differentiate between remove first and remove all

            if (!comparatorFunction) {
                comparatorFunction = function(a, b) {
                    return a === b;
                };
            }
            for (elementCounter = 0; elementCounter < array.length; elementCounter++) {
                if (!!comparatorFunction(array[elementCounter], value)) {
                    foundElement = true;
                    array.splice(elementCounter, 1);
                    if (firstOnly) {
                        break;
                    }
                }
            }
            return foundElement;
        },

        /**
         * remove only the first match from the array
         * @param @see removeFromArray
         */
        removeFirstMatchFromArray: function(array, value, comparatorFunction) {
            this.removeFromArray(array, value, comparatorFunction, true);
        },

        /**
         * Search an array of objects with name/value properties by name.
         */
        getNamedProperty: function(propertyArray, name) {
            var result; // undefined

            array.forEach(propertyArray, function(item) {
                if (item.name === name) {
                    result = item;
                }
            });

            return result;
        },

        /**
         * Search an array of objects with name/value properties by name to return
         * the value.
         */
        getNamedPropertyValue: function(array, name) {
            var result; // undefined

            var property = this.getNamedProperty(array, name);
            if (property !== undefined) {
                result = property.value;
            }

            return result;
        },

        /**
         * @param {array} properties - An object's properties
         * @param {Object} propDef - A PropDef object in UCD, which has type, name, value and maybe defaultLabel
         */
        populatePropValueAndLabel: function(properties, propDef) {
            var existingObj = this.getNamedProperty(properties, propDef.name);
            // If existingObj has a property named 'value', we should override
            // propDef's value attribute with it even if it is an empty string
            if (existingObj && (existingObj.value || existingObj.value === "")) {
                propDef.value = existingObj.value;
                if ((propDef.type === 'HTTP_SELECT') || (propDef.type === 'HTTP_MULTI_SELECT')) {
                    propDef.defaultLabel = existingObj.label;
                }
            }
        },

        /**
         * WebextMultiSelect widget is unique that it does not fire onChange event,
         * need to listen to onAdd and onRemove to keep data in sync.
         * @param {Object} widget - a webExtMultiSelect widget
         * @param {Object} dataObj - dataObj that keeps track of selected values and labels
         * @param {String} labelName - key used in dataObj for label
         * @param {String} valueName - key used in dataObj for value
         * @param {Boolean} isStateful - whether dataObj is a dojo Stateful object
         */
        updateWebextMultiSelectData: function(widget, dataObj, valueName, labelName, isStateful) {
            widget.onAdd = function(selectedItem) {
                var currentValArray = [];
                var currentLabelArray = [];
                if (dataObj[valueName] && dataObj[labelName]) {
                    currentValArray = dataObj[valueName].split(",");
                    currentLabelArray = dataObj[labelName].split(",");
                }
                var idx = array.indexOf(currentValArray, selectedItem.value);
                if (idx === -1) {
                    currentValArray.push(selectedItem.value);
                    currentLabelArray.push(selectedItem.label);
                    if (isStateful) {
                        dataObj.set(valueName, currentValArray.join(","));
                        dataObj.set(labelName, currentLabelArray.join(","));
                    } else {
                        dataObj[valueName] = currentValArray.join(",");
                        dataObj[labelName] = currentLabelArray.join(",");
                    }
                }
            };
            widget.onRemove = function(selectedItem) {
                var currentValArray = [];
                var currentLabelArray = [];
                if (dataObj[valueName] && dataObj[labelName]) {
                    currentValArray = dataObj[valueName].split(",");
                    currentLabelArray = dataObj[labelName].split(",");
                }
                var idx = array.indexOf(currentValArray, selectedItem.value);
                if (idx !== -1) {
                    currentValArray.splice(idx, 1);
                    currentLabelArray.splice(idx, 1);
                    if (isStateful) {
                        dataObj.set(valueName, currentValArray.join(","));
                        dataObj.set(labelName, currentLabelArray.join(","));
                    } else {
                        dataObj[valueName] = currentValArray.join(",");
                        dataObj[labelName] = currentLabelArray.join(",");
                    }
                }
            };
        },

        /**
         * Determines is given color is dark.
         */
        isDarkColor : function(color) {
            var rgbColor = new Color(color).toRgb();
            //
            var colorWeight = 1 - (0.25 * rgbColor[0] + 0.6 * rgbColor[1] + 0.1 * rgbColor[2]) / 255;
            return colorWeight > 0.5;
        },

        /**
         * Returns a lighter tint of a given color.
         */
        getTint : function(color, delta) {
            delta = delta || 0.6;
            return this._alterColor(color, delta, true);
        },

        /**
         * Returns a darker shade of a given color.
         */
        getShade : function(color, delta) {
            delta = delta || 0.6;
            return this._alterColor(color, delta);
        },
        _alterColor : function(color, delta, tint) {
            var rgbColor = new Color(color).toRgb(),
                rgbValues = [];
            array.forEach(rgbColor, function(hue){
                if (tint){
                    rgbValues.push((delta * (255 - hue)) + hue);
                }
                else {
                    rgbValues.push(delta * hue);
                }
            });
            return Color.fromArray(rgbValues).toHex();
        },

        /**
         * Calculates current mouse coordinates on window basing on a mouse event.
         *
         * @param ev
         *            a mouse event
         * @return an associative array [x, y]
         */
        mouseCoords: function(ev) {
            if (ev.pageX || ev.pageY) {
                return {x: ev.pageX, y: ev.pageY};
            }

            return {
                x: ev.clientX + win.body().scrollLeft - win.body().clientLeft,
                y: ev.clientY + win.body().scrollTop - win.body().clientTop
            };
        },

        /**
         * Calculates object's top left corner position in a document
         *
         * @param object
         *            an HTML object/element
         * @return an associative array [x, y]
         */
        getPosition: function(object) {
            var left = 0;
            var top = 0;

            while (object.offsetParent) {
                left += object.offsetLeft;
                top += object.offsetTop;
                object = object.offsetParent;
            }

            left += object.offsetLeft;
            top += object.offsetTop;

            return {x: left, y: top};
        },

        /**
         * Calculates a mouse position offset respectively to a given target basing
         * on a mouse event.
         *
         * @param target
         *            a target object
         * @param ev
         *            a mouse event
         * @return an associative array [x, y]
         */
        getMouseOffset: function(target, ev) {
            ev = ev || kernel.global.event;

            var docPos = this.getPosition(target);
            var mousePos = this.mouseCoords(ev);
            return {x: mousePos.x - docPos.x, y: mousePos.y - docPos.y};
        },

        /**
         * Calculates object bounds.
         *
         * @param object
         *            an HTML object/element
         * @return an associative array [x1, y1, x2, y2]
         */
        getObjectBounds: function(object) {
            var position = this.getPosition(object);
            var width = object.offsetWidth;
            var height = object.offsetHeight;

            return {x1: position.x, y1: position.y, x2: position.x + width, y2: position.y + height};
        },

        /**
         * Checks if an element is a child of a parent.
         *
         * @param element
         *            an element to check
         * @param parentId
         *            a parent element id
         * @return is a child?
         */
        isChild: function(element, parentId) {
            var parentNode = element.parentNode;
            if (parentNode) {
                if (parentId === parentNode.id) {
                    return true;
                }
                return this.isChild(parentNode, parentId);
            }
            return false;
        },

        /**
         * Returns browser's timezone offset in milliseconds comparing to the GMT
         * time.
         */
        getGmtOffset: function() {
            // JavaScript returns timezone offset as a difference in minutes
            // comparing to GMT
            // http://www.w3schools.com/jsref/jsref_gettimezoneoffset.asp, e.g.
            // GMT+2 results in -120
            var offset = -1 * new Date().getTimezoneOffset() * 60 * 1000;
            return offset;
        },

        /**
         * Returns an onClick link dom node around a given URL and text.
         */
        getOnClickLink: function(hash, text) {
            var linkNode = domConstruct.create("a");
            linkNode.className = 'link';
            linkNode.onclick = function() {
                navBar.setHash(hash);
            };
            if (text) {
                linkNode.innerHTML = text.escape();
            }

            return linkNode;
        },

        /**
         * Store a string as a cookie with the specified name. If the value fits in
         * a single cookie, only one cookie will be used, and it will take the given
         * name. If not, the cookie will be split into chunks named as such: name_1
         * name_2 ...
         *
         * Each chunk may only contain a 3900-character string (standard maximum is
         * 4000, but we'll leave a little room)
         */
        setCookie: function(name, value, days, index) {
            var cookieName = name;
            if (!!index) {
                cookieName += "_" + index;
            }
            else {
                // Delete any existing values first.
                this.clearCookie(name);
                index = 0;
            }

            if (value) {
                var maxLength = 3900;

                var cookieProps = {
                     'path': '/'
                };
                if (!!days) {
                    cookieProps.expires = days;
                }
                if (document.location.protocol === 'https:') {
                    cookieProps.secure = true;
                }

                var i = 0;
                var cookieValue = value.substr(0, maxLength);
                while (cookieValue.length > 0) {
                    // set cookie
                    cookie(cookieName, cookieValue, cookieProps);

                    // set up next cookie
                    index = index + 1;
                    cookieName = name + "_" + String(index);
                    i = i + maxLength;
                    cookieValue = value.substr(i, maxLength);
                }
            }
        },

        /**
         * Returns the value of a cookie by name, including any chunks created by
         * large cookies.
         */
        getCookie: function(name, index) {
            var cookieName = name;
            if (!!index) {
                cookieName += "_" + index;
            }
            else {
                index = 0;
            }

            var result; // undefined

            var cookieValue = cookie(cookieName);
            if (!!cookieValue) {
                // init result to non-undefined value for concatination
                result = '';
            }
            while (!!cookieValue) {
                result = result + cookieValue;

                // set up next read
                index = index + 1;
                cookieName = name + "_" + String(index);
                cookieValue = cookie(cookieName);
            }

            return result;
        },

        /**
         * Deletes a cookie and all of its potential chunks.
         */
        clearCookie: function(name, index) {
            var matchName = name;
            if (index !== undefined) {
                matchName = name + "_" + index;
            }

            var result = cookie(matchName); // undefined
            if (!!result) {
                var deleteDate = new Date(0);
                cookie(matchName, 'DELETED', {"expires": deleteDate.toUTCString()});

                var nextIndex = (index || 0) + 1;
                this.clearCookie(name, nextIndex);
            }
        },

        /**
         * @Deprecated use dojo.addClass
         */
        addClass: function(domNode, className) {
            kernel.deprecated("js.webext.widgets.Util#addClass", "Use dojo.addClass instead");
            domClass.add(domNode, className);
        },

        /**
         * @Deprecated use dojo.removeClass
         */
        removeClass: function(domNode, className) {
            kernel.deprecated("js.webext.widgets.Util#removeClass", "Use dojo.removeClass instead");
            domClass.remove(domNode, className);
        },

        /**
         *
         */
        appendTextSpan: function(domNode, text) {
            var span = domConstruct.create("span");
            span.innerHTML = text;
            domNode.appendChild(span);
        },

        /**
         *
         */
        randomString: function(length) {
            var chars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];

            var result = "";
            var i = 0;
            for (i = 0; i < length; i++) {
                result += chars[Math.floor(Math.random() * chars.length)];
            }
            return result;
        },

        /**
         *
         */
        clone: function(target) {
            return lang.clone(target);
        },

        /**
         *
         */
        log: function() {
            if (sniff("ie")) {
                var logArray = [];
                array.forEach(arguments, function(arg) {
                    logArray.push(JSON.stringify(arg));
                });
                console.log(logArray.join(" , "));
            }
            else {
                console.log(arguments);
            }
        },

        /**
         *
         */
        cancelBubble: function(event) {
            if (kernel.global.event) {
                kernel.global.event.cancelBubble = true;
            }
            else {
                event.stopPropagation();
            }
        },


        setBaseTextDir: function(val) {
            Util.baseTextDir = val;
        },

        getBaseTextDir: function() {
            return Util.baseTextDir;
        },

        /**
         * Alias for Util#getBaseTextDir, match global name
         */
        getBTD: function() {
            return this.getBaseTextDir();
        },

        /**
         * Alias for Util#getResolvedBaseTextDir, match global name
         */
        getResolvedBTD: function(str) {
            return this.getResolvedBaseTextDir(str);
        },

        getResolvedBaseTextDir: function(str) {
           /*jslint regexp:true */
           if (Util.baseTextDir === "auto") {
               if (str.indexOf(">") > -1) {
                   //strip HTML tags
                   str = str.replace(/<\/?[^>]+(>|$)/g, "");
               }
               return bidi.prototype._checkContextual(str);
           }
           return Util.baseTextDir;
        },

        applyBTD: function(str) {
            if (!Util.baseTextDir || !str) {
                 return str;
            }
            if (str.indexOf("\u202A") > -1 || str.indexOf("\u202B") > -1) {
                 return str;
            }
            var dir = Util.prototype.getResolvedBaseTextDir(str);
            var str1 = (dir === "rtl" ? '\u202B':'\u202A') + str + '\u202C';
            return str1;
        },

        getUIDirAlign: function() {
            return geometry.isBodyLtr()? "left" : "right";
        },

        getUIDir: function() {
            return geometry.isBodyLtr()? "ltr" : "rtl";
        },

        setCalendar: function(val) {
            Util.calendar = val;
        },

        getCalendar: function() {
            return Util.calendar;
        },

        // Helper function to get version of IE. Current version of dojo can't detect IE 11, so use
        // this as a workaround.
        getIE: function(){
            var version = null;

            var userAgent = window.navigator.userAgent;
            var index = userAgent.indexOf("MSIE");

            // If IE, return version number.
            if (index > 0) {
              version = parseInt(userAgent.substring(index + 5, userAgent.indexOf(".", index)), 10);
            }
            else if (!!userAgent.match(/Trident\/7\./) || !!userAgent.match(/Trident\/4\./)) {
                // If IE 11 then look for Updated user agent string. Search Trident/7.0 or Trident/4.0 (Windows 8.1 Enterprise Mode Enabled)
              version = 11;
            }

            return version;
        },

        // Helper function to normalize regExp pattern string by forcing in ^ and $
        // so it can be more consistent with java backend regExp.match,
        // which matches the entire string.
        // Also replace invalid pattern with a regExp that matches nothing
        getNormalizedRegExp: function(pattern) {
            var regExp;
            if (pattern[0] !== '^') {
                pattern = '^' + pattern;
            }
            if (pattern[pattern.length-1] !== '$') {
                pattern = pattern + '$';
            }
            try {
                regExp = new RegExp(pattern);
            } catch(err) {
                regExp = /^a/;
            }
            return regExp;
        },

        // Helper function to allow IE 11 to download a file via a redirect without breaking dojo.
        downloadFile: function(url) {
            // IE 11 will cause dojo to go into an infinite loop on a dojo click event after
            // a page redirect for a download. This is because dojo cannot recognize IE 11.
            if (this.getIE() === 11) {
                window.open(url);
            }
            else {
                // Any other browser should not need to have a popup for a download.
                window.location.href = url;
            }
        },

        // Helper function to allow IE 11 to download a file via an anchor without breaking dojo.
        createDownloadAnchor: function(anchorObj, parent) {
            // IE 11 will cause dojo to go into an infinite loop on a dojo click event after
            // a page redirect for a download. This is because dojo cannot recognize IE 11.
            if (this.getIE() === 11) {
                // Add argument to start download in a different tab
                anchorObj.target = "_blank";
            }
            return domConstruct.create("a", anchorObj, parent);
        },

        /**
         * Get a translated string based on an ID.
         *  printf-like substitution works with %s - all substitutes go after the original string as arguments
         */
        i18n: function(id) {
            var translatedString = null,
                result = "";
            if (!id) {
                // Protect ourselves from bad values.
                return id;
            }

            if (i18nData) {
                translatedString = i18nData[id];
                if (!translatedString) {
                    // consolidate repeated white spaces
                    // into a single space for the cache index
                    translatedString = i18nData[id.replace(/(\s)+/g, "$1")];
                }
            }

            if (defaultLocaleData && !translatedString) {
                translatedString = defaultLocaleData[id];
                if (!translatedString) {
                    // consolidate repeated white spaces
                    // into a single space for the cache index
                    translatedString = defaultLocaleData[id.replace(/(\s)+/g, "$1")];
                }
            }

            if (!translatedString) {
                translatedString = id;
            }

            if (translatedString) {
                var origArgs = arguments,
                    scount = 0;
                // replace all %s followed by one or more digits or an 's'....
                result = translatedString.replace(/%([0-9]+|s)/g, function(s, index) {
                    var i;
                    if ( index === "s") {
                        i = ++scount;
                    }
                    else {
                        i = parseInt(index, 10);
                    }

                    if (i > origArgs.length || i < 1) {
                        // valid range is the non-0 argument positions
                        return s;
                    }
                    return origArgs[i];
                });
            }


            /*
             * In some languages (eg. French) ":" is translated to " :" which can result in the translated string
             * breaking on the space before the ':'. To prevent this the ' ' is replaced with the unicode
             * representation of non-breaking space (\u00A0).
             */
            result = result.replace(" :", "\u00A0:");

            // add more special rules here.

            return result;
        },

        /**
         * Escapes the given text as long as it's non-empty
         */
        escape: function(text) {
            var result = text;
            if (!!text) {
                result = text.escape();
            }
            return result;
        },

        /**
         * Sets the "data-test-id" attribute on a DOM node or widget so that it can more easily be
         * located during testing.
         */
        setTestId: function(domOrWidget, testId) {
            domAttr.set(domOrWidget, "data-test-id", testId);
        },

       /**
        * Convert URI path to a string we can pass through a URL without encoding slashes so REST calls
        * remain unaffected (encodes for URI with the exception of slashes)
        */
        encodeIgnoringSlash: function(arg) {
           return !!arg ? encodeURIComponent(arg).replace(/%2F/g,"/") : arg;
        }
    });

    //
    // Convenience methods added to various object types
    //

    if (!Array.prototype.indexOf) {
        // Don't say this is deprecated, it's just a convenience method.
        Array.prototype.indexOf = function(obj) {
            return array.indexOf(this, obj);
        };
    }

    if (!Array.prototype.lastIndexOf) {
        Array.prototype.lastIndexOf = function(obj) {
            kernel.deprecated("Array::lastIndexOf", "see dojo/_base/array::lastIndexOf");
            return array.lastIndexOf(this, obj);
        };
    }
    // Capitalize the first letter of a string.
    String.prototype.cap = function() {
        return this.charAt(0).toUpperCase()+this.slice(1);
    };

    String.prototype.escape = function() {
        // Don't say this is deprecated, it's just a convenience method.
        return entities.encode(this);
    };

    // Replaces < and > characters
    String.prototype.escapeHTML = function() {
        return this.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    };

    var redirectToLogin = function() {
        navBar.onSessionExpired();
    };

    /**
     * Add custom logic to be added to every XHR request
     */
    var addCustomXhrHandling = function(arg) {
        var origErrorFunction = arg.error;

        if (!origErrorFunction) {
            arg.error = function(data) {
                if (data.status === 401) {
                    redirectToLogin();
                }
            };
        }
        else {
            arg.error = function(data) {
                if (data.status === 401) {
                    redirectToLogin();
                }
                else {
                    origErrorFunction.apply(this, arguments);
                }
            };
        }

        if (!arg.headers) {
            arg.headers = {};
        }

        if (!!bootstrap) {
            var apiTokenName = bootstrap.apiTokenName || bootstrap.expectedSessionCookieName;
            if (apiTokenName) {
                var apiToken = util.getCookie(apiTokenName);
                if (!!apiToken) {
                    arg.headers[apiTokenName] = apiToken;
                }
            }
        }
    };

    // Should we do similar override with dojo/request/xhr::get?
    (function(){
        /*global dojo */
        var origXhrGet = baseXhr.get;
        dojo.xhrGet = dojo.xhr.get = function(arg) {
            addCustomXhrHandling(arg);
            return origXhrGet.apply(this, arguments);
        };

        var origXhrPost = baseXhr.post;
        dojo.xhrPost = dojo.xhr.post = function(arg) {
            addCustomXhrHandling(arg);
            return origXhrPost.apply(this, arguments);
        };

        var origXhrPut = baseXhr.put;
        dojo.xhrPut = dojo.xhr.put = function(arg) {
            addCustomXhrHandling(arg);
            return origXhrPut.apply(this, arguments);
        };

        var origXhrDelete = baseXhr.del;
        dojo.xhrDelete = dojo.xhr.del = function(arg) {
            addCustomXhrHandling(arg);
            return origXhrDelete.apply(this, arguments);
        };
    }());

    // map to global i18n for back compatibility
    kernel.global.i18n = function() {
        return Util.prototype.i18n.apply(null, arguments);
    };

    function addApiTokenNameToHeader(header) {
        if (!header) {
            header = {};
        }
        if (!!bootstrap) {
            var apiTokenName = bootstrap.apiTokenName || bootstrap.expectedSessionCookieName;
            if (apiTokenName) {
                var apiToken = util.getCookie(apiTokenName);
                if (!!apiToken) {
                    header[apiTokenName] = apiToken;
                }
            }
        }
        return header;
    }

    var handleXhrError = function(error) {
        console.error("Error processing result from load:", error,error.message);
        var errorStatus = error.response.status || error.status;
        if (errorStatus === 401) {
            new Alert({title:i18n("Authentication Error"), message:i18n("401: User not authenticated.  Log in to continue.")}).startup();
        }
    };

    var handleDojoRequestXhrRequest = function(origXhr) {
        return function(uri, args) {
            if (!args) {
                args = {};
            }
            args.headers = addApiTokenNameToHeader(args.headers);
            var deferred = origXhr(uri, args);
            deferred.then(noop,
                function(error) {
                    handleXhrError(error);
            });
            return deferred;
        };
    };

    aspect.around(requestXhr, "put", handleDojoRequestXhrRequest);
    aspect.around(requestXhr, "post", handleDojoRequestXhrRequest);
    aspect.around(requestXhr, "del", handleDojoRequestXhrRequest);

    return Util;
});

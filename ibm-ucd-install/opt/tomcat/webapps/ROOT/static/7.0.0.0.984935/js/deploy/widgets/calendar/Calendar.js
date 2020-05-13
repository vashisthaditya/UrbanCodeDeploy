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
        "dojo/_base/declare",
        "dojo/_base/array",
        "dojo/_base/xhr",
        "dojo/dom-construct",
        "dojo/dom-class",
        "dojo/dom-style",
        "dojo/mouse",
        "dojo/on",
        "deploy/widgets/application/RunApplicationProcess",
        "deploy/widgets/calendar/CalendarBase",
        "deploy/widgets/calendar/EditBlackout",
        "deploy/widgets/calendar/EditRecurringEntry",
        "js/webext/widgets/Alert",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/FormDelegates",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/table/TreeTable",
        "js/webext/widgets/color/Color",
        "deploy/widgets/Formatters",
        "dijit/form/TextBox",
        "dijit/form/DateTextBox",
        "dijit/form/TimeTextBox",
        "dijit/form/Select",
        "js/webext/widgets/BidiDateUtil"
        ],
function(
        declare,
        array,
        xhr,
        domConstruct,
        domClass,
        domStyle,
        mouse,
        on,
        RunApplicationProcess,
        CalendarBase,
        EditBlackout,
        EditRecurringEntry,
        Alert,
        ColumnForm,
        Dialog,
        FormDelegates,
        GenericConfirm,
        Table,
        Color,
        Formatters,
        TextBox,
        DateTextBox,
        TimeTextBox,
        Select,
        BidiDateUtil
) {
    /**
     * Calendar widget for deploy server calendar entries.
     *
     * Supported properties:
     *  serviceUrlPattern / String              The pattern used to build the rest URL.
     *  showCreateRequest / Boolean             Whether to show the button to add a request
     */
    return declare('deploy.widgets.calendar.Calendar',  [CalendarBase], {

        /**
         * Add a class name to an item in the calendar.
         * @param item: A calendar item
         * @return The class name to add to this item.
         */
        itemClassName: function(item){
            var cssClass = item.eventType;
            if (item.fired){
                cssClass += " no-move";
            }
            if (item.color){
                cssClass += " " + Color.getBasicColorName(item.color) + "-color";
                if (util.isDarkColor(item.color)){
                    cssClass += " dark-color";
                }
            }
            return cssClass;
        },

        /**
         * Determine if calendar item can be moved
         * @param item: A calendar item
         * @return Whether the calendar item can be moved.
         */
        canMoveItem: function(item){
            // Entries that are run, or before current time should not be movable/editable.
            var cssClass = item.cssClass || "";
            var move = cssClass.indexOf("no-move") === -1;
            var child = cssClass.indexOf("child") === -1;
            var blackout = cssClass.indexOf("blackout") === -1;
            return (item.startTime >= this.now.valueOf() || !blackout) && move && this.displayActions() && child;
        },

        /**
         * Determine if calendar item can be resized
         * @param item: A calendar item
         * @return Whether the calendar item can be resized.
         */
        canResizeItem: function(item){
            // Only blackouts can be resized.
            return item.cssClass && item.cssClass.indexOf("blackout") !== -1;
        },

        onItemCreate: function(item, render){
            if (item.eventType === "child"){
                if (this.calendar && this.calendar.dateInterval === "month"){
                    domClass.add(render.renderer.endTimeLabel, "general-icon");
                    domConstruct.place(render.renderer.summaryLabel, render.renderer.endTimeLabel, "after");
                }
                else if (render.renderer.afterIcon){
                    domClass.add(render.renderer.afterIcon, "general-icon");
                }

            }
        },

        /**
         * Format the loaded data
         * @param data: The resource containing the items for the calendar.
         * @param monthly: True if monthly calendar
         */
        formatData: function(data, monthly){
            var entries = this.formatAndFilterItems(data.entries, undefined, monthly);
            var blackouts = this.formatAndFilterItems(data.blackouts, "blackout");
            return entries.concat(blackouts);
        },

        /**
         * Formats one calendar entry to use in the calendar.
         * @param entry: The calendar entry
         * @param type: The type of calendar entry (Optional)
         * @param monthly: True if monthly calendar (Optional)
         * @return The formatted calendar entry
         */
        formatItem: function(item, type, monthly){
            item.name = util.escape(item.name);
            if (type === "blackout"){
                item.eventType = type;
            }
            if (item.eventType === "child"){
                if (!this.recurringItems){
                    this.recurringItems = [];
                }
                this.recurringItems.push(item);
            }
            if (item.scheduledDate){
                var time = item.scheduledDate;
                item.startDate = new Date(time);
                if (monthly || (this.calendar && this.calendar.dateInterval === "month")) {
                    item.endDate = new Date(item.scheduledDate + 1);
                }
                else {
                    item.endDate = util.shiftMinutes(time, 90);
                }
            }
            if (item.startDate){
                item.startDate = new Date(item.startDate);
            }
            if (item.endDate){
                item.endDate = new Date(item.endDate);
            }
            if (item.environment && item.environment.color){
                var environmentColorObject = Color.getColorOrConvert(item.environment.color);
                if (!environmentColorObject.standard && environmentColorObject.fallback){
                    environmentColorObject = Color.getColor(environmentColorObject.fallback);
                }
                item.color = environmentColorObject.value;
            }
            return item;
        },

        /**
         * Function when ending moving or resizing an item.
         * @param: dataItem with item containing new start and end times.
         * @param start: The original start time of the item.
         * @param end: The original end time of the item.
         */
        itemEndEdit: function(dataItem, start, end){
            if (new Date(dataItem.item.startDate).valueOf() < this.now.valueOf() && (dataItem.item.eventType === "entry" || dataItem.item.eventType === "child")){
                // Cancel default behavior (i.e. applying changes to store)
                dataItem.preventDefault();
                // Set the previously values to revert changes on the render item
                dataItem.item.originalDate = start;
                dataItem.item.originalEndDate = end;
                this.updateItem(dataItem.item, {
                    updateType: "move-before-time",
                    date: start
                });
            }
            else {
                this.updateSidebar(dataItem);
                dataItem.item.originalDate = start;
                dataItem.item.originalEndDate = end;
                if (dataItem.item.eventType === "entry" || dataItem.item.eventType === "child"){
                    this.updateItem(dataItem.item, {
                        updateType: "move",
                        date: dataItem.item.startDate
                    });
                }
                else {
                    this.updateItem(dataItem.item, {
                        updateType: "move",
                        date: dataItem.item.startDate,
                        endDate: dataItem.item.endDate
                    });
                }
            }
        },

        /**
         * Function to determine if shift/double click is enabled
         */
        enableCreateOnShiftDoubleClick: function(){
            return this.showCreateRequest || this.calendarId !== undefined;
        },

        /**
         * Function to determine if control/alt click is enabled
         */
        enableCreateOnControlAltClick: function(){
            return this.calendarId && this.displayActions();
        },

        /**
        * Sets the function when single/double clicking on the calendar grid or with shift key held down.
        */
        addCreateOnShiftDoubleClick: function(){
            var self = this;
            var gridClickFunc = function(grid, doubleClick){
                self.calendar.gridClick = true;
                if (grid.triggerEvent.shiftKey || doubleClick){
                    var month = self.calendar.dateInterval === "month";
                    var time = month ? util.shiftHours(new Date(), 1) : grid.date;
                    self.showCreateRequestDialog(grid.date, time, month);
                }
                else if ((grid.triggerEvent.altKey || grid.triggerEvent.ctrlKey) && self.enableCreateOnControlAltClick()){
                    self.updateItem(self.tempCreateItem);
                }
                self.updateSidebar(grid, true);
                self.calendar.gridClick = false;
            };
            // Schedule Processes on a shift click or double click.
            this.calendar.on("gridClick", function(grid){
                gridClickFunc(grid);
                self.onGridClick(grid);
            });
            this.calendar.on("gridDoubleClick", function(grid){
                gridClickFunc(grid, true);
            });
        },

       /**
        * Create an event while holding down the control or alt key and clicking in the calendar grid.
        * @param view: The current view of the calendar
        * @param date: The current date of the calendar view.
        * @return The object of the new item.
        */
        addCreateOnControlAltClick: function(view, date){
            var start, end;
            var colView = this.calendar.columnView;
            var cal = this.calendar.dateModule;
            if (view === colView){
                start = this.calendar.floorDate(date, "minute", colView.timeSlotDuration);
                end = cal.add(start, "minute", colView.timeSlotDuration);
            }
            else {
                start = this.calendar.floorToDay(date);
                end = cal.add(start, "day", 1);
            }
            // Create temporary item to put into data store (visual aid).
            var newName = i18n("New Blackout");
            var color = "#000000";
            if (this.environment && this.environment.name){
                if (this.application && this.application.name){
                    newName = i18n("%s: %s - Blackout", this.environment.name, this.application.name);
                }
                else {
                    newName = i18n("%s Blackout", this.environment.name);
                }
                color = this.environment.color || "#000000";
            }
            var item = {
                id: "noId",
                summary: util.escape(newName),
                name: util.escape(newName),
                startDate: start,
                endDate: end,
                clickCreate: true,
                calendarId: this.calendarId,
                environment: {color: color}
            };
            return item;
        },

        /**
         * Add create buttons to the sideBar by defining them using the createSidebarCreateButton function.
         */
        addSidebarCreateButtons: function(){
            var self = this;

            // Create Schedule Process Button
            if (this.showCreateRequest) {
                this.createSidebarCreateButton({
                    label: i18n("Schedule Process"),
                    onClick: function(){
                        var currentTime = BidiDateUtil.getNewDate();
                        self.showCreateRequestDialog(currentTime, new Date(util.shiftHours(currentTime, 1)), true);
                    },
                    hoverMessage: i18n("You can also schedule a process by holding down the shift key and clicking on a day or double click on a day you want to schedule your process."),
                    highlight: true
                });
            }
            // Create Add Blackout Button
            if (this.calendarId !== undefined) {
                if (self.displayActions()) {
                    this.createSidebarCreateButton({
                        label: i18n("Add Blackout"),
                        onClick: function(){
                            self.showBlackoutDialog({});
                        },
                        hoverMessage: i18n("You can also schedule a blackout by holding down either the control or alt key then clicking on a start day then dragging the length of the blackout.")
                    });
                }
            }
        },

        /**
         * Updates the calendar side bar
         * @param data: {
         *                  application
         *                  component
         *                  environment
         *              }
         * @param grid: Date - If a grid is click, display date
         */
        updateSidebar: function(data, grid){
            var self = this;
            var item = data.item || null;
            this.clearSidebar();
            this.showTab();

            var updated, nameChanged = false;
            var runUpdate = function(nameUpdated){
                if (self.updateButton){
                    updated = true;
                    if (nameUpdated){
                        nameChanged = true;
                    }
                }
            };

            var addClassAndOnChange = function(node, time, noClass){
                node.on("change", function(value){
                    runUpdate();
                });
                if (!noClass){
                    var className = time ? "calendar-time-drop-down" : "calendar-date-drop-down";
                    domClass.add(node.domNode, className);
                }
            };

            // Show date in side bar if empty grid is clicked
            if (grid){
                var gridDate = data.date;
                self.sidebar.calendar.set("value", gridDate);
                // Not useful feature, but saving for possible list view when clicking on date grid.
                // if (self.calendar.dateInterval === "month"){
                    // this.createSidebarTitle(util.dateOnlyFormat(gridDate));
                // }
                // else {
                    // this.createSidebarTitle(util.dateFormatShort(gridDate));
                // }
            }
            else if ((item && item.eventType === "entry") || (item.eventType === "child")){
                var isRecurring = item.eventType === "child";
                if (item.name || isRecurring){
                    if (isRecurring){
                        var nameContainer = self.createSidebarLabelContainer(i18n("Name"));
                        self.nameBox = new TextBox({
                            value: item.name
                        }).placeAt(nameContainer);
                        self.nameBox.on("change", function(value){
                            runUpdate(true);
                        });
                    }
                    else {
                        this.createSidebarTitle(item.name);
                    }
                }

                if (item.application){
                    this.createSidebarLink(i18n("Application"), util.escape(item.application.name), "#application/"+item.application.id);
                    if (item.applicationProcess) {
                        this.createSidebarLink(i18n("Process Version"), i18n("Version %s", item.applicationProcess.version), "#applicationProcess/"+item.applicationProcess.id+"/"+item.applicationProcess.version);
                    }
                    if (item.snapshot) {
                        this.createSidebarLink(i18n("Snapshot"), util.escape(item.snapshot.name), "#snapshot/"+item.snapshot.id);
                    }
                }

                if (item.component){
                    this.createSidebarLink(i18n("Component"), util.escape(item.component.name), "#component/"+item.component.id);
                    if (item.componentProcess){
                        this.createSidebarLink(i18n("Component Process"), i18n("Version %s", item.componentProcess.version), "#componentProcess/"+item.componentProcess.id+"/"+item.componentProcess.version);
                    }
                    if (item.version) {
                        this.createSidebarLink(i18n("Version"), util.escape(item.version.name), "#version/"+item.version.id);
                    }
                }

                var environmentColor = '<div class="calendar-sidebar-environment-color inline-block" style="background-color:' + item.environment.color + '"></div>';
                this.createSidebarLink(i18n("Environment"), environmentColor + util.escape(item.environment.name), "#environment/"+item.environment.id);

                if (item.resource) {
                    this.createSidebarLink(i18n("Resource"), util.escape(item.resource.name), "#resource/"+item.resource.id);
                }

                if (item.recurrencePattern){
                    var rPatternContainer = this.createSidebarLabelContainer(i18n("Recurrence Pattern"));
                    self.recurrencePattern = new Select({
                        options: [{
                            label: i18n("Daily"),
                            value: "D"
                        },{
                            label: i18n("Weekly"),
                            value: "W"
                        },{
                            label: i18n("Monthly"),
                            value: "M"
                        }],
                        value: item.recurrencePattern
                    });
                    domConstruct.place(self.recurrencePattern.domNode, rPatternContainer);
                    addClassAndOnChange(self.recurrencePattern, null, true);
                }

                var allowEdit = item.startDate >= self.now.valueOf() && !item.fired && item.executeEnvironment;
                if (allowEdit){
                    var dateLabel = isRecurring ? i18n("Base Date & Time") : i18n("Date");
                    var startDate = isRecurring ? new Date(item.parent.scheduledDate) : item.startDate;
                    var dateContainer = this.createSidebarLabelContainer(dateLabel);
                    self.dateBox = new DateTextBox({
                        datePackage: BidiDateUtil.getDatePackage(),
                        value: BidiDateUtil.getNewDate(startDate),
                        constraints: { format: "short" }
                    }).placeAt(dateContainer);
                    addClassAndOnChange(self.dateBox);

                    self.timeBox = new TimeTextBox({
                        value: item.startDate
                    }).placeAt(dateContainer);
                    addClassAndOnChange(self.timeBox, true);
                }
                else {
                    this.createSidebarText(i18n("Date"), util.dateFormatShort(item.startDate));
                }

                if (item.eventType === "child"){
                    self.componentVersions = [];
                    array.forEach(item.eventData.versions, function(selector) {
                        var versionContainer = self.createSidebarLabelContainer(i18n("Version for %s", selector.component.name.escape()));
                        var delegates = new FormDelegates();
                        var versionSelector = delegates.getDelegate("versionSelector")({
                            name: "ver_"+selector.componentId,
                            type: "VersionSelector",
                            value: selector.versionSelector,
                            context: {
                                component: selector.component,
                                environment: self.environment
                            },
                            required: false
                        });
                        versionSelector.placeAt(versionContainer);
                        self.componentVersions.push(versionSelector);
                    });
                }

                if (item.request) {
                    this.createSidebarText(i18n("User"), item.request.userName);
                }

                var linkSection = this.createSidebarSection();
                if (item.request) {
                    var requestType = item.request.type === "appRequest" ? "#applicationProcessRequest/" : "#componentProcessRequest/";
                    this.createSidebarButton(i18n("More Details"), "inline-block",
                                            function(){
                                                window.location.href = requestType+item.request.id;
                                            }, linkSection, true);
                }
                if (allowEdit){
                    this.createSidebarButton(i18n("See Versions"), "inline-block",
                                            function(){
                                                self.showVersionDialog(item);
                                            }, linkSection, true);

                    var buttonContainer = domConstruct.create("div", {
                        className: "calendar-sidebar-modify-button-container"
                    }, this.sidebarContainer);

                    this.createSidebarButton(i18n("Cancel Process"), " calendar-cancel-button",
                                            function(){
                                                self.showCancelConfirm(item);
                                            }, buttonContainer);
                    this.updateButton = this.createSidebarButton(i18n("Update Process"), "idxButtonSpecial calendar-update-button",
                                            function(){
                                                if (self.dateBox && self.timeBox && (updated ||isRecurring)){
                                                    var options = {
                                                        updateType: "sidebar",
                                                        date: util.combineDateAndTime(self.dateBox.value, self.timeBox.value),
                                                        name: self.nameBox ? self.nameBox.value : null
                                                    };
                                                    if (isRecurring){
                                                        options.startDate = self.dateBox.value;
                                                        options.startTime = self.timeBox.value;
                                                        options.recurrencePattern = self.recurrencePattern.value;
                                                        options.componentVersions = self.componentVersions;
                                                    }
                                                    self.updateItem(item, options);
                                                }
                                            }, buttonContainer);
                }
            }
            else if (item && item.eventType === "blackout"){
                if (item.name){
                    if (self.displayActions()){
                        var blackoutNameContainer = self.createSidebarLabelContainer(i18n("Name"));
                        self.nameBox = new TextBox({
                            value: item.name
                        }).placeAt(blackoutNameContainer);
                        self.nameBox.on("change", function(value){
                            runUpdate(true);
                        });
                    }
                    else {
                        this.createSidebarTitle(item.name);
                    }
                }

                if (item.environment !== undefined){
                    var environmentBlackoutColor = '<div class="calendar-sidebar-environment-color inline-block" style="background-color:' + item.environment.color + '"></div>';
                    this.createSidebarLink(i18n("Affects Environment"), environmentBlackoutColor + util.escape(item.environment.name), "#environment/"+item.environment.id);
                }

                if (self.displayActions()){
                    var startDateContainer = this.createSidebarLabelContainer(i18n("Start Date"));

                    self.dateBox = new DateTextBox({
                        datePackage: BidiDateUtil.getDatePackage(),
                        value: item.startDate,
                        constraints: { format: "short" }
                    }).placeAt(startDateContainer);
                    addClassAndOnChange(self.dateBox);

                    self.timeBox = new TimeTextBox({
                        value: item.startDate
                    }).placeAt(startDateContainer);
                    addClassAndOnChange(self.timeBox, true);

                    var endDateContainer = this.createSidebarLabelContainer(i18n("End Date"));
                    self.endDateBox = new DateTextBox({
                        datePackage: BidiDateUtil.getDatePackage(),
                        value: item.endDate,
                        constraints: { format: "short" }
                    }).placeAt(endDateContainer);
                    addClassAndOnChange(self.endDateBox);

                    self.endTimeBox = new TimeTextBox({
                        value: item.endDate
                    }).placeAt(endDateContainer);
                    addClassAndOnChange(self.endTimeBox, true);

                    var modifyButtonContainer = domConstruct.create("div", {
                        className: "calendar-sidebar-modify-button-container"
                    }, this.sidebarContainer);
                    this.createSidebarButton(i18n("Delete Blackout"), "calendar-cancel-button",
                                             function(){
                                                 self.showBlackoutDeleteWarning(item);
                                             }, modifyButtonContainer);
                    this.updateButton = this.createSidebarButton(
                        i18n("Update Blackout"),
                        "idxButtonSpecial calendar-update-button",
                        function(){
                            if (self.dateBox && self.timeBox && self.endDateBox && self.endTimeBox && updated){
                                self.updateItem(item, {
                                    updateType: "sidebar",
                                    date: util.combineDateAndTime(self.dateBox.value, self.timeBox.value),
                                    endDate: util.combineDateAndTime(self.endDateBox.value, self.endTimeBox.value),
                                    name: (nameChanged && self.nameBox) ? self.nameBox.value : null
                                });
                            }
                        }, modifyButtonContainer);
                }
                else {
                    this.createSidebarText(i18n("Start Date"), util.dateFormatShort(item.startDate));
                    this.createSidebarText(i18n("End Date"), util.dateFormatShort(item.endDate));
                }
            }
        },

        /**
         * Updates a calendar item when the item's date has changed
         * @param item: The item to update
         * @param updateType: can determine how item was updated (drag and drop, side bar, other, etc...)
         * @param date: new date for the item
         * @param endDate: new end date
         * @param name: new name
         */
        updateItem: function(item, options){
            var self = this;
            var errorMessage = null;
            var store = this.calendar.store;

            if (item.clickCreate){
                item.itemId = item.id;
                self.showBlackoutDialog(item);
            }

            if ((new Date(options.date).valueOf() < self.now.valueOf() && item.eventType === "entry") || options.updateType === "move-before-time") {
                errorMessage = i18n("Events cannot be moved before the current time");
            }
            if (new Date(options.date).valueOf() > new Date(options.endDate).valueOf() && item.eventType === "blackout"){
                errorMessage = i18n("The end date must be greater than the start date");
            }

            if (errorMessage !== null) {
                self._resetCalendar(item, errorMessage, self.calendar);
            }
            else if (item.eventType === "entry") {
                var startDate = new Date(options.date).valueOf();
                xhr.get({
                    url: bootstrap.restUrl+"deploy/schedule/"+item.eventType+"/"+item.id+"/moveTo/"+startDate,
                    handleAs: "json",
                    load: function(data) {
                        // If the rest service returns blackouts, the move failed. Show error message.
                        if (data.blackouts !== undefined) {
                            var errorMessage = i18n("The event cannot be moved to that time because it conflicts with a blackout:")+"<br/>";
                            if (data.blackouts.length > 1) {
                                errorMessage = i18n("The event cannot be moved to that time because it conflicts with blackouts:")+"<br/>";
                            }

                            array.forEach(data.blackouts, function(blackout) {
                                errorMessage += "<br/><b>"+util.escape(blackout.name)+"</b><br/>";
                                if (blackout.environment !== undefined) {
                                    errorMessage += "&nbsp; &nbsp; <b>"+i18n("Application Environment")+"</b>: "+util.escape(blackout.environment.name)+"<br/>";
                                }
                                errorMessage += "&nbsp; &nbsp; "+util.dateFormatShort(blackout.startDate)+" - "+util.dateFormatShort(blackout.endDate)+"<br/>";
                            });

                            var errorAlert = new Alert({
                                title: i18n("Schedule Error"),
                                forceRawMessages: true,
                                message: errorMessage
                            });
                            if (item.originalDate && item.originalEndDate){
                                item.startDate = item.originalDate;
                                item.endDate = item.originalEndDate;
                            }
                            store.put(item);
                        }
                        else {
                            item.startDate = options.date;
                            item.endDate = options.endDate;
                            if (!item.endDate) {
                                if (self.calendar && self.calendar.dateInterval === "month") {
                                    item.endDate = new Date(options.date.valueOf() + 1);
                                }
                                else {
                                    item.endDate = util.shiftMinutes(options.date, 90);
                                }
                            }
                            item.originalDate = item.startDate;
                            item.originalEndDate = item.endDate;
                            store.put(item);
                            self.showSaveMessage();
                        }
                    },
                    error: function(data) {
                        self._resetCalendar(item, data.responseText, self.calendar);
                    }
                });
            }
            else if (item.eventType === "child"){
                var form = new ColumnForm({
                    submitUrl: bootstrap.restUrl+"calendar/recurring",
                    addData: function(data) {
                        data.existingId = item.parent.id;
                        data.name = options.name;
                        data.date = new Date(options.date).valueOf();
                        data.recurrencePattern = options.recurrencePattern;

                        if (options.componentVersions) {
                            data.versions = [];
                            array.forEach(options.componentVersions, function(selector) {

                                var selectedVersionEntry = {
                                    versionSelector: selector.value,
                                    componentId: selector.component.id
                                };
                                data.versions.push(selectedVersionEntry);
                            });
                        }
                },
                    postSubmit: function(data) {
                        if (self.callback !== undefined) {
                            self.callback();
                        }
                        self.refresh();
                        self.showSaveMessage();
                    },
                    onCancel: function() {
                        if (self.callback !== undefined) {
                            self.callback();
                        }
                    }
                });
                form.submitForm();
            }
            else if (item.eventType === "blackout") {
                var startTime = new Date(options.date).valueOf();
                var endTime = new Date(options.endDate).valueOf();
                if (options.name){
                    var blackoutItem = item;
                    blackoutItem.name = options.name;
                    var blackoutForm = new EditBlackout({
                        calendarId: this.calendarId,
                        blackout: blackoutItem,
                        callback: function() {
                            blackoutItem.startDate = options.date;
                            blackoutItem.endDate = options.endDate;
                            store.put(blackoutItem);
                            self.showSaveMessage();
                        }
                    });
                    blackoutForm.form.submitForm();
                }
                else {
                    xhr.get({
                        url: bootstrap.restUrl+"deploy/schedule/blackout/"+item.id+"/moveTo/"+startTime+"/"+endTime,
                        load: function() {
                            item.startDate = options.date;
                            item.endDate = options.endDate;
                            store.put(item);
                            self.showSaveMessage();
                        }
                    });
                }
            }
        },

        /**
         * Add filters to the calendar
         */
        addCalendarFilters: function(){
            var self = this;
            var filterID = 0;
            this.calendar.numberOfFilters = 0;
            this.calendar.filters = {};
            this.calendar.allFilters = {filters: {}};

            var bottomFilterContainer = domConstruct.create("div", {
                className: "calendar-sidebar-bottom-filter-container"
            }, this.calendarSidebarFilterAttachPoint, "last");

            // Process Type and Entry Type Filters Container
            var allFilterContainer =  domConstruct.create("div", {
                className: "calendar-filter-section"
            }, bottomFilterContainer, "first");

            // Add Filter Button (Don't Show on Applications and Environments Calendar)
            if (!this.application){
                var addFilterContainer = domConstruct.create("div", {
                    className: "add-filter-container"
                }, allFilterContainer);
                var label = domConstruct.create("div", {
                    className: "add-filter-label",
                    innerHTML: "Add Filter"
                }, addFilterContainer);

                // We want the label to create a new filter on click too
                // So make the click function its own variable
                var createNewFilterFunction = function() {
                    if (self.calendar.numberOfFilters === 9) {
                        domClass.add(addFilterContainer, "hidden");
                    }
                    filterID++;
                    self.calendar.filters[filterID] = self.addCalendarFilterSection(filterID, bottomFilterContainer, addFilterContainer);
                };

                on(label, "click", function() {
                    createNewFilterFunction();
                });

                this.createSidebarButton("", "iconPlus inline-block add-filter-icon",
                    createNewFilterFunction, addFilterContainer, true, i18n("Add Filter"));
            }

            if (!this.environment){
                this.calendar.filters[filterID] = this.addCalendarFilterSection(filterID, bottomFilterContainer);
            }

            var buttonContainer = domConstruct.create("div", {
                className: "calendar-sidebar-filter-button-container"
            }, bottomFilterContainer);

            if (!this.component){
                // Create the process type filter. Don't need to show in component view.
                this.calendar.allFilters.filters.processTypeFilter = this.createCalendarFilterSection({
                        label: i18n("Process Type"),
                        className: "calendar-process-filter-box",
                        options: [{
                            label: i18n("All"),
                            value: "",
                            selected: "selected"
                        },{
                            label: i18n("Application Process"),
                            value: "appRequest"
                        },{
                            label: i18n("Component Process"),
                            value: "compRequest"
                        }],
                        value: i18n("All"),
                        placeAt: allFilterContainer
                });
                // Create the event type filter. Don't need to show in component view.
                this.calendar.allFilters.filters.eventTypeFilter = this.createCalendarFilterSection({
                        label: i18n("Entry Type"),
                        className: "calendar-event-filter-box",
                        options: [{
                            label: i18n("All"),
                            value: "",
                            selected: "selected"
                        },{
                            label: i18n("Processes"),
                            value: "entry"
                        },{
                            label: i18n("Blackouts"),
                            value: "blackout"
                        },{
                            label: i18n("Recurring"),
                            value: "child"
                        }],
                        value: i18n("All"),
                        placeAt: allFilterContainer
                });
            }

            // Refresh calendar when applying filters
            var applyFilters = function(show){
                if (self.calendar){
                    self.refresh();
                }
                if (show){
                    self.showSaveMessage(i18n("Filters Applied"), self.calendarSidebarFilterAttachPoint);
                }
                self.applyFilters = show;
            };

            // Create the buttons to apply or clear the calendar filters.
            this.createSidebarButton(i18n("Clear All"), "idxButtonCompact inline-block calendar-cancel-button",
                                    function(){
                                        if (self.applyFilters){
                                            applyFilters(false);
                                        }
                                        if (self.environmentFilter){
                                            self.environmentFilter.value = "";
                                        }
                                        domConstruct.empty(self.calendarSidebarFilterAttachPoint);
                                        self.calendar.numberOfFilters = 1;
                                        self.addCalendarFilters();
                                    }, buttonContainer);
            this.createSidebarButton(i18n("Apply"), "idxButtonSpecial idxButtonCompact inline-block calendar-update-button",
                                    function(){
                                        applyFilters(true);
                                    }, buttonContainer);
        },

        /**
         * Adds a filter section to a given container.
         * @param filterID: The id of the filter section,
         * @param container: Places the filter section on this node.
         * @param addButtonContainer: Reference to the add filter button. (Hides the button when total filters reach 10).
         */
        addCalendarFilterSection: function(filterID, container, addButtonContainer){
            var self = this;
            var filter = {};
            this.calendar.numberOfFilters++;

            var getEnvironmentColor = function(item){
                var environmentColor = "#00B2EF";
                if (item.color){
                    var environmentColorObject = Color.getColorOrConvert(item.color);
                    if (!environmentColorObject.standard && environmentColorObject.fallback){
                        environmentColorObject = Color.getColor(environmentColorObject.fallback);
                    }
                    environmentColor = environmentColorObject.value;
                }
                return environmentColor;
            };

            var formatDropDown = function(menuItem, item){
                domConstruct.create("div", {
                    className: "inlineBlock filter-dropdown-color",
                    style: {
                        backgroundColor: getEnvironmentColor(item)
                    }
                }, menuItem, "first");
            };

            var formatSelected = function(selectedItem, item, label, removeItem){
                if (item.color){
                    domClass.add(selectedItem, Color.getBasicColorName(item.color) + "-color");
                }
                domConstruct.create("div", {
                    className: "inlineBlock filter-dropdown-color",
                    style: {
                        backgroundColor: getEnvironmentColor(item)
                    }
                }, label, "first");
            };

            var filterSection = domConstruct.create("div", {
                className: "calendar-filter-section"
            }, container, "before");

            if (!this.application){
                var removeFilter = domConstruct.create("div", {
                    className: "inline-block iconMinus remove-filter-icon linkPointer",
                    title: i18n("Remove Filter")
                }, filterSection);
                on(removeFilter, "click", function(){
                    self.calendar.numberOfFilters--;
                    if (self.calendar.numberOfFilters < 1){
                        domConstruct.empty(self.calendarSidebarFilterAttachPoint);
                        self.addCalendarFilters();
                    }
                    else {
                        delete self.calendar.filters[filterID];
                        domConstruct.destroy(filterSection);
                    }
                    if (self.calendar.numberOfFilters < 10 && addButtonContainer){
                        domClass.remove(addButtonContainer, "hidden");
                    }
                });
            }

            // Create the application filter
            if (!this.application){
                var url = this.component ? "deploy/component/" + this.component.id +"/applications" : "deploy/application";
                filter.environmentFilterContainer = this.createSidebarSection();
                filter.applicationFilter = this.createCalendarFilterSection({
                    "url": bootstrap.restUrl+url,
                    "label": i18n("Application"),
                    "placeHolder": i18n("All Applications"),
                    "className": "calendar-application-filter-box",
                    "onChange": function(value, item) {
                        // Show environment filter only if an application is selected in the application filter.
                        domConstruct.empty(filter.environmentFilterContainer);
                        if (!self.environment && item){
                            domConstruct.place(self.createSidebarLabel(i18n("Environment")), filter.environmentFilterContainer);
                            filter.environmentFilter = self.createCalendarFilterSection({
                                "url": bootstrap.restUrl+"deploy/application/"+item.id+"/environments/false",
                                "placeHolder": i18n("All Environments"),
                                "className": "calendar-environment-filter-box",
                                "section": filter.environmentFilterContainer,
                                "noPlace": true,
                                "multiple": true,
                                "formatDropDownLabel": formatDropDown,
                                "formatSelectedItem": formatSelected
                            });
                        }
                    },
                    "placeAt": filterSection
                });
                domConstruct.place(filter.environmentFilterContainer, filterSection);
            }
            // Create the environment filter. Show by default if viewing calendar in an application
            else if (!this.environment && this.application){
                filter.environmentFilter = this.createCalendarFilterSection({
                    "url": bootstrap.restUrl+"deploy/application/"+this.application.id+"/environments/false",
                    "label": i18n("Environment"),
                    "placeHolder": i18n("All Environments"),
                    "className": "calendar-environment-filter-box",
                    "multiple": true,
                    "formatDropDownLabel": formatDropDown,
                    "formatSelectedItem": formatSelected,
                    "placeAt": filterSection
                });
            }

            return filter;
        },

        removeCalendarFilterSection: function(topFilter){},

        /**
         * Runs all filters for an item to determine if it is shown.
         * @param Item: The item to filter
         * @return If item is displayed
         */
        filterCalendar: function(item){
            var self = this;
            var result = false;
            var filterCalendar = function(filters, all) {
                var tempResult = false;
                var key = "";
                var filter;
                for (key in filters){
                    if (filters.hasOwnProperty(key)) {
                        filter = filters[key];
                        tempResult = self.applyFilter(filter, item, all);
                        if (tempResult){
                            result = true;
                        }
                    }
                }
                return tempResult;
            };
            filterCalendar(this.calendar.filters);
            if (result || this.environment){
                result = false;
                result = filterCalendar(this.calendar.allFilters, true);
            }
            return result;
        },

        /**
         * Determine if item is shown.
         * @param filter: Filter options
         * @param item: An item in the calendar
         * @param all: If current filter option applies to all filter options
         * @return If item is displayed
         */
        applyFilter: function(filter, item, all){
            var show = true;
            var filterExists = false;

            var checkFilter = function(filterItem){
                var filterNode = filter[filterItem.filterName + "Filter"];
                if (filterNode) {
                    if (filterNode.dropDown) {
                        var values;
                        if (filterItem.multiple) {
                            values = filterNode.items;
                        }
                        else {
                            values = filterNode.dropDown.value || filterNode.dropDown.values;
                        }
                        if (values && show) {
                            var itemData = item[filterItem.dataName];
                            filterExists = true;
                            if (filterItem.dataName2 && filterItem.dataName && itemData){
                                show = itemData[filterItem.dataName2] === values || values === "";
                            }
                            else if (filterItem.dataName && itemData){
                                show = itemData === values || values === "";
                            }
                            else if (item[filterItem.filterName]){
                                if (filterItem.multiple){
                                    var tempShow = false;
                                    array.forEach(values, function(value){
                                        if (item[filterItem.filterName].id === value.id){
                                            tempShow = true;
                                        }
                                        show = tempShow;
                                    });
                                }
                                else {
                                    show = item[filterItem.filterName].id === values;
                                }
                            }
                            else {
                                show = false;
                            }
                        }
                    }
                }
            };

            var checkFilterValues = [
                {filterName: "application"},
                {filterName: "environment", multiple: true},
                {filterName: "component"}
            ];
            var checkFilterValuesAll = [
                {filterName: "processType", dataName: "request", dataName2: "type"},
                {filterName: "eventType", dataName: "eventType"}
            ];
            array.forEach(all ? checkFilterValuesAll : checkFilterValues, function(filterValue){
                checkFilter(filterValue);
            });

            // Show all entries if no filter value is present.
            if (!filterExists){
                show = true;
            }
            if (!show){
                if (this.calendar){
                    this.calendar.store.remove(item.id);
                }
            }
            return show;
        },

        /**
         * Show a warning message for a blackout deletion
         */
        showBlackoutDeleteWarning : function(event) {
            var self = this;
            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to delete this blackout entry?"),
                action: function() {
                    var deleteUrl = bootstrap.restUrl+"deploy/schedule/blackout/"+event.id;
                    xhr.del({
                        url: deleteUrl,
                        load: function() {
                            self.calendar.store.remove(event.id);
                        }
                    });
                }
            });
        },

        /**
         *
         */
        showBlackoutDialog: function(blackout, start, end) {
            var self = this;

            var blackoutDialog = new Dialog({
                title: i18n("Create Blackout"),
                closable: true,
                draggable: true
            });

            var blackoutForm = new EditBlackout({
                calendarId: this.calendarId,
                blackout: blackout.id ? blackout : undefined,
                callback: function(refresh) {
                    blackoutDialog.hide();
                    blackoutDialog.destroy();
                    self.calendar.store.remove(blackout.itemId);
                    if (refresh){
                        self.refresh();
                    }
                }
            });
            blackoutForm.placeAt(blackoutDialog.containerNode);
            blackoutDialog.show();
        },

        /**
         * Display a confirm dialog before cancelling a process.
         * @param entry: The calendar entry to cancel.
         */
        showCancelConfirm: function(entry) {
            var self = this;
            var confirm = new GenericConfirm({
                message: i18n("Are you sure you want to cancel this process request?"),
                action: function() {
                    var deleteUrl = bootstrap.restUrl+"calendar/entry/"+entry.id;
                    if (entry.eventType === "child") {
                        deleteUrl = bootstrap.restUrl+"calendar/recurring/"+entry.parent.id;
                    }
                    xhr.del({
                        url: deleteUrl,
                        load: function() {
                            self.calendar.store.remove(entry.id);
                            self.refresh();
                        },
                        error: function(data) {
                            var alert = new Alert({
                                message: util.escape(data.responseText)
                            });
                            alert.startup();
                        }
                    });
                }
            });
        },

        /**
         * Displays the component versions of a given process.
         * @param entry: The calendar entry to show the component process.
         */
        showVersionDialog: function(entry) {
            var versionDialog = new Dialog({
                title: i18n("Component Versions"),
                closable: true,
                draggable: true
            });

            var gridLayout = [{
                name: i18n("Component"),
                formatter: function(item) {
                    return Formatters.componentLinkFormatter(item.component);
                }
            },{
                name: i18n("Version for Request"),
                formatter: Formatters.versionLinkFormatter
            },{
                name: i18n("Type"),
                formatter: this.typeFormatter
            },{
                name: i18n("Description"),
                field: "description"
            }];

            var gridRestUrl;
            if (entry.request) {
                gridRestUrl = bootstrap.restUrl+"deploy/applicationProcessRequest/"+entry.request.id+"/versions";
            }
            else {
                gridRestUrl = bootstrap.restUrl+"deploy/schedule/calendar/application/"+entry.parent.id+"/versions";
            }
            var warningDiv = domConstruct.create("div", {id:"warningDiv", innerHTML: i18n("* These versions may change before the process executes.")});
            var versionTableDiv = domConstruct.create("div", {id:"versionTableDiv", style: {minWidth: "400px"} } );
            domConstruct.place(warningDiv, versionDialog.containerNode, 0);
            domConstruct.place(versionTableDiv, versionDialog.containerNode, 1);

            xhr.get({
                url: gridRestUrl,
                handleAs: "json",
                load: function(data) {
                    var versionTable = new Table({
                        serverSideProcessing: false,
                        data: data.versions,
                        rowsPerPage: 10,
                        columns: gridLayout,
                        tableConfigKey: "componentVersionRequestList",
                        noDataMessage: i18n("No component versions found."),
                        hideExpandCollapse: true,
                        hidePagination: false
                    });
                    versionTable.placeAt(versionTableDiv);
                    versionDialog.show();
                }
            });
        },

        /**
         *
         */
        displayActions: function() {
            var display = false;
            var view = false;
            if (appState.environment) {
                if (appState.environment.security) {
                    var execute = appState.environment.security["Execute on Environments"];
                    view = appState.environment.security["View Environments"];
                    display = view && execute;
                }
            }
            else if (appState.application) {
                if (appState.application.security) {
                    view = appState.application.security["View Applications"];
                    display = view;
                }
            }
            else {
                /* For the general Calendar page, this means that a User with View Only
                 * permissions will be able to drag around items; however, the backend
                 * will prevent the changes from being made.
                 */
                display = true;
            }
            return display;
         },

        /**
         * Displays a dialog to create a process request.
         * @param date: (Optional / Pre-populate) The date to create the process on
         * @param: (Optional / Pre-populate) The time to create the process on.
         * @param monthView: If process created using create button or on a calendar monthView.
         */
        showCreateRequestDialog: function(date, time, monthView) {
            var self = this;
            var store, tempDate, endDate, tempItem;
            if (date){
                store = this.calendar.store;
                tempDate = monthView ? util.combineDateAndTime(date, util.shiftHours(new Date(), 1)) : date;
                if (self.calendar && self.calendar.dateInterval === "month") {
                    endDate = new Date(tempDate.valueOf() + 1);
                }
                else {
                    endDate = util.shiftMinutes(tempDate, 90);
                }
                tempItem = {
                    name: i18n("New Process"),
                    id: BidiDateUtil.getNewDate().valueOf(),
                    startDate: tempDate,
                    endDate: new Date(tempDate.valueOf() + 1),
                    color: "#87CEEB"
                };
                store.put(tempItem);
            }

            var lastCalendarDate = this.calendar.get("date");

            var deployDialog = new Dialog({
                title: i18n("Schedule a Process"),
                closable: true,
                draggable: true,
                onCancel: function() {
                    if (store && tempItem){
                        store.remove(tempItem.id);
                    }
                    self.calendar.set("date", lastCalendarDate);
                }
            });

            var deployForm = new RunApplicationProcess({
                application: this.application,
                environment: this.environment,
                snapshot: this.snapshot,
                forceSchedule: true,
                date: date,
                time: time,
                callback: function() {
                    deployDialog.hide();
                    deployDialog.destroy();
                    if (store && tempItem){
                        store.remove(tempItem.id);
                    }
                    self.calendar.set("date", lastCalendarDate);
                }
            });

            deployForm.placeAt(deployDialog.containerNode);
            deployDialog.show();
        },

        /**
         *
         */
        typeFormatter: function(item) {
            var result = "";
            if (item.type === "FULL") {
                result = i18n("Full");
            }
            else if (item.type === "INCREMENTAL") {
                result = i18n("Incremental");
            }
            return result;
        },

        _resetItemTime: function(item, errorMessage, calendar) {
            var scheduleAlert = new Alert({
                title: i18n("Schedule Error"),
                message: errorMessage
            });

            if (calendar) {
                if (item.originalDate){
                    item.startDate = item.originalDate;
                }
                if (item.originalEndDate){
                    item.endDate = item.originalEndDate;
                }
                calendar.store.put(item);

                /* On the week and day views of the calendar, store.put(item) does not
                 * actually reset the position in the week view. Refreshing the page
                 * will default to the Month tab. But upon visiting the other tabs,
                 * the entry will be in the correct position
                 */
                if (calendar.dateInterval !== "month") {
                    navBar.setHash("main/calendar", false, true);
                }
            }
        }
    });
});

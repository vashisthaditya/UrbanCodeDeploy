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
        "dijit/form/Button",
        "dijit/form/TextBox",
        "dijit/form/DateTextBox",
        "dijit/form/TimeTextBox",
        "dijit/form/Select",
        "dijit/Calendar",
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/xhr",
        "dojo/cldr/supplemental",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dojo/dom-style",
        "dojo/on",
        "dojo/mouse",
        "dojo/date/locale",
        "dojox/calendar/Calendar",
        "dojo/store/JsonRest",
        "dojo/store/Memory",
        "dojo/store/Observable",
        "dojo/date/stamp",
        "js/util/blocker/_BlockerMixin",
        "js/webext/widgets/select/WebextSelect",
        "js/webext/widgets/select/WebextMultiSelect",
        "js/webext/widgets/BidiDateUtil"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        TextBox,
        DateTextBox,
        TimeTextBox,
        Select,
        MiniCalendar,
        array,
        declare,
        xhr,
        cldr,
        domClass,
        domConstruct,
        domStyle,
        on,
        mouse,
        locale,
        Calendar,
        JsonRest,
        Memory,
        Observable,
        stamp,
        _BlockerMixin,
        WebextSelect,
        WebextMultiSelect,
        BidiDateUtil
) {
    /**
     * Calendar widget for calendar entries.
     *
     * height (Integer)                 The height of the calendar in pixels. Default: 640
     * labelHeight (Integer)            The height in pixels of the label renderer in the matrix view. Default: 14
     *
     * itemStartAttr (String)           The start time object attribute of the item. Default: startDate
     * itemEndAttr (String)             The end time object attribute of the item. Default: endDate
     * itemNameAttr (String)            The name/label object attribute of the item. Default: name
     *
     * initialView (String)             The initial view of the calendar on first load. Default: month
     *                                  Possible Values: month, week, fourDays, day
     *
     * startHours (Integer)             First hour to show on calendar. Applies to week, fourDays and day views. Default: 0
     * endHours (Integer)               Last hour to show on calendar. Applies to week, fourDays and day views. Default: 24
     * hourSize (Integer)               The height in pixels of an hour. Applies to week, fourDays and day views. Default: 40
     *
     * serviceUrlPattern (String)       The pattern used to build the rest URL.
     * showCreateRequest (Boolean)      Whether to show the button to add a request. Default: true
     */
    return declare('deploy.widgets.calendar.CalendarBase',  [_Widget, _TemplatedMixin, _BlockerMixin], {
        templateString:
            '<div class="calendar">'+
                '<div class="calendar-sidebar">' +
                    '<div class="calendar-sidebar-tabs" data-dojo-attach-point="calendarSidebarTabsAttachPoint"></div>' +
                    '<div data-dojo-attach-point="calendarSidebarAttachPoint"></div>' +
                    '<div data-dojo-attach-point="calendarSidebarPanel" class="calendar-sidebar-panel">' +
                        '<div data-dojo-attach-point="calendarSidebarCreateButtonAttachPoint"></div>'+
                        '<div data-dojo-attach-point="calendarSidebarPanelAttachPoint"></div>' +
                    '</div>' +
                    '<div class="calendar-sidebar-panel calendar-sidebar-panel-filters hidden" data-dojo-attach-point="calendarSidebarFilterAttachPoint"></div>' +
                '</div>'+
                '<div class="calendar-contents">'+
                    '<div data-dojo-attach-point="calendarAttachPoint"></div>' +
                '</div>'+
            '</div>',

        height: 640,
        labelHeight: 14,
        itemStartAttr: "startDate",
        itemEndAttr: "endDate",
        itemNameAttr: "name",
        initialView: "month",
        startHours: 0,
        endHours: 24,
        hourSize: 40,
        showCreateRequest: true,
        serviceUrlPattern: null,
        serviceUrlPatterns: {
            startTime: "{startTime}",
            endTime: "{endTime}"
        },

        postCreate: function(){
            this.inherited(arguments);
            this.now = BidiDateUtil.getNewDate();
            this.months = BidiDateUtil.getLocale().getNames("months", "wide", "standAlone","",BidiDateUtil.getNewDate());
            var firstDayOfWeek = cldr.getFirstDayOfWeek();
            if (firstDayOfWeek === 0){
                domClass.add(this.calendarAttachPoint, "sunday-first-day-of-week");
            }
            else if (firstDayOfWeek === 1){
                domClass.add(this.calendarAttachPoint, "monday-first-day-of-week");
            }
            this._createCalendar();
        },

        /**
         * Builds the calendar
         * @param data: The data to display in the calendar. If no data is given (Initial Load), it will load the data before building the calendar.
         */
        _createCalendar: function(data){
            var self = this;
            if (!data){
                this.loadData();
            }
            else {
                this.calendar = new Calendar({
                    datePackage: BidiDateUtil.getDatePackage(),
                    date: BidiDateUtil.getNewDate(),
                    startTimeAttr: self.itemStartAttr,
                    endTimeAttr: self.itemEndAttr,
                    summaryAttr: self.itemNameAttr,
                    store: new Observable(
                        new Memory({
                            data: data
                        })
                    ),
                    cssClassFunc: function(item){
                        return self.itemClassName(item);
                    },
                    columnViewProps:{
                        minHours: self.startHours,
                        maxHours: self.endHours,
                        hourSize: self.hourSize
                    },
                    onCurrentViewChange: function(view){
                        self._highlightCurrentTime(view);
                        self.onChangeCalendarView(view);
                    },
                    dateInterval: self.initialView,
                    isItemMoveEnabled: function(item){
                        return self.canMoveItem(item);
                    },
                    isItemResizeEnabled: function(item){
                        return self.canResizeItem(item);
                    },
                    onRenderersLayoutDone: function(view){
                        self._onItemCreate(view, this.store);
                    },
                    onItemRollOver: function(item){
                        self._onItemHover(item, item.source.itemToRenderer[item.item.id]);
                    },
                    onItemRollOut: function(item){
                        self._onItemHover(item, item.source.itemToRenderer[item.item.id], true);
                    },
                    onItemClick: function(item){
                        self.updateSidebar(item);
                        self._onItemClick(item, item.source.itemToRenderer[item.item.id]);
                    },
                    style: "position:relative; height:" + self.height + "px;"
                }).placeAt(this.calendarAttachPoint);
                this._addCalendarTitle();
                this._addCalendarToolbarHighlight();
                this._addCalendarEditConditions();
                this._addEntryOnClick();
                this._createSidebar();
                this.calendar.matrixView.labelRendererHeight = this.labelHeight;
                this.calendar.matrixView.roundToDay = this.roundToDay || false;
                this.calendar.columnView.scrollMethod = "dom";
            }
        },

        _onItemCreate: function(view, store){
            var self = this;
            array.forEach(view.rendererList, function(render){
                var item = store.get(render.renderer.item.id);
                self.onItemCreate(item, render);
            });
        },
        onItemCreate: function(item, render){},

        _onItemHover: function(item, renderList, rollOver){
            var self = this;
            array.forEach(renderList, function(render){
                self.onItemHover(item, render, rollOver);
            });
        },
        onItemHover: function(item, render, rollOver){},

        _onItemClick: function(item, renderList){
            var self = this;
            array.forEach(renderList, function(render){
                self.onItemClick(item, render);
            });
            this.lastItemClicked = {
                item: item,
                renderList: renderList
            };
        },
        onItemClick: function(item, render){},

        onGridClick: function(grid){},

        /**
         * Display horizontal line representing the current time on the column view calendar.
         */
        _highlightCurrentTime: function(view){
            var self = this;
            if (view.newView.secondarySheet){
                if (!this.currentTimeBar){
                    this.currentTimeBar = domConstruct.create("div", {
                        className: "current-time-bar"
                    }, view.newView.grid, "first");
                }
                var moveTimeLine = function(){
                    var currentTime = new Date();
                    var currentHour = currentTime.getHours();
                    var currentMinute = currentTime.getMinutes();
                    var currentSecond = currentTime.getSeconds();
                    var minuteSize = 60 / self.hourSize;
                    var pixelOffset = (currentHour * self.hourSize) + (currentMinute / minuteSize) + (currentSecond / (minuteSize * 60)) - 1;
                    domStyle.set(self.currentTimeBar, "top", pixelOffset + "px");
                };
                moveTimeLine();
                // Refresh current time line every 10 seconds.
                setInterval(function(){
                    moveTimeLine();
                }, 10000);
            }
        },

        /**
         * Function when changing calendar views. Default: none.
         */
        onChangeCalendarView: function(view){},

        /**
         * Add a class name to an item in the calendar.
         * @param item: A calendar item
         * @return The class name to add to this item. Default: entry
         */
        itemClassName: function(item){
            return "entry";
        },

        /**
         * Determine if calendar item can be moved
         * @param item: A calendar item
         * @return Whether the calendar item can be moved.
         */
        canMoveItem: function(item){
            return true;
        },

        /**
         * Determine if calendar item can be resized
         * @param item: A calendar item
         * @return Whether the calendar item can be resized.
         */
        canResizeItem: function(item){
            return true;
        },

        /**
         * Refreshes the calendar
         * @param start: The start time to fetch calendar data.
         * @param end: The end time to fetch calendar data.
         */
        refreshCalendar: function(start, end){
            this.loadData(start, end);
        },

        /**
         * Refreshes the calendar with the current calendar date.
         */
        refresh: function(){
            var date = this.calendar ? new Date(this.calendar.date) : null;
            this.loadData(date);
        },

        /**
         * Loads the data from a given URL specified in the getServiceUrl function.
         * @param start: The start time to fetch calendar data.
         * @param end: The end time to fetch calendar data.
         */
        loadData: function(start, end){
            var self = this;
            var monthly;
            if (!self.calendar) {
                monthly = self.initialView === "month";
            }
            else {
                monthly = self.calendar.dateInterval === "month";
            }
            this.block();
            xhr.get({
                url: self.getCalendarUrl(start, end),
                handleAs: "json",
                load: function(data) {
                    self.unblock();
                    self.addItemsToCalendar(self.formatData(data, monthly));
                }
            });
        },

        /**
         * Get the appropriate REST URL to pull calendar data
         * @param start: Start time to fetch calendar entries.
         * @param end: End time to fetch calendar entries.
         * @return REST url for the calendar data.
         */
        getCalendarUrl: function(start, end) {
            var result = this.serviceUrlPattern;
            var replaceStartTime, replaceEndTime = null;

            if (start && end) {
                replaceStartTime = new Date(start);
                replaceEndTime = new Date(end);
            }
            else {
                if (start) {
                    replaceStartTime = new Date(
                        start.getFullYear(),
                        start.getMonth());
                    replaceEndTime = util.shiftMonths(replaceStartTime, 1);
                }
                else {
                    var now = new Date();
                    var startTime = new Date(
                        now.getFullYear(),
                        now.getMonth());
                    replaceStartTime = startTime;
                    replaceEndTime = util.shiftMonths(startTime, 1);
                }
            }

            // Adjust Time period overlay since month views return 1st and last day of month and not
            // the date on the first and last calendar boxes.
            replaceStartTime = util.getStartOfWeek(replaceStartTime);
            replaceEndTime = util.getEndOfWeek(replaceEndTime);

            result = result.replace(this.serviceUrlPatterns.startTime, replaceStartTime.valueOf());
            result = result.replace(this.serviceUrlPatterns.endTime, replaceEndTime.valueOf());

            return result;
        },

        /**
         * Format the loaded data
         * @param data: The resource containing the items for the calendar.
         */
        formatData: function(data) {
            return this.formatAndFilterItems(data, "entry");
        },

        /**
         * Formats and filters an item to add to the calendar.
         * @param items: The calendar items.
         * @param type (Optional): The type of calendar items.
         * @param monthly (Optional): True if monthly calendar
         * @return The formatted and filtered calendar items.
         */
        formatAndFilterItems: function(items, type, monthly) {
            var self = this;
            var calendarItems = [];
            array.forEach(items, function(item){
                var tempItem = self.formatItem(item, type, monthly);
                if (!self.applyFilters || self.filterCalendar(tempItem)){
                    calendarItems.push(tempItem);
                }
            });
            return calendarItems;
        },

        /**
         * Formats one calendar entry to use in the calendar.
         * @param entry: The calendar entry
         * @param type: The type of calendar entry (Optional)
         * @param monthly: True if monthly calendar (Optional)
         * @return The formatted calendar entry
         */
        formatItem: function(item, type, monthly) {
            return item;
        },

        /**
         * Adds items to the calendar.
         * @param entries: Formatted calendar entries to add to the calendar.
         */
        addItemsToCalendar: function(items) {
            var self = this;
            // Create calendar on page load (if it does not exist).
            if (!this.calendar){
                this._createCalendar(items);
            }
            // Else, replace current store with new store.
            else {
                self.calendar.set("store", new Memory({data: items}));
            }
        },

        /**
         * Adds the month and year to the top of the calendar.
         */
        _addCalendarTitle: function() {
            var self = this;
            this.calendar.calendarTitle = domConstruct.create("div", {
                innerHTML: self.months[self.calendar.date.getMonth()],
                className: "calendar-title"
            });
            domConstruct.place(this.calendar.calendarTitle, this.calendar.buttonContainer, "first");
        },

        /**
         * Function to highlight the current calendar view in the top bar.
         */
        _addCalendarToolbarHighlight: function() {
            var calendar = this.calendar;
            var currentlySelected = calendar.monthButton;
            var hightlightView = function(){
                domClass.add(currentlySelected.domNode, "current-calendar-view");
            };
            hightlightView();
            var calendarButtons = [calendar.todayButton, calendar.dayButton, calendar.fourDaysButton, calendar.weekButton, calendar.monthButton];
            array.forEach(calendarButtons, function(button){
                on(button, "click", function(){
                    domClass.remove(currentlySelected.domNode, "current-calendar-view");
                    currentlySelected = button === calendar.todayButton ? calendarButtons[1] : button;
                    hightlightView();
                });
            });
        },

        /**
         * Function to add conditions when an item in the calendar is moved or resized.
         * @param item: The item that is being moved or resized.
         */
        _addCalendarEditConditions: function(item) {
            var self = this;
            var startTime, endTime;
            this.calendar.on("itemEditBegin", function(e){
                // Save initial values
                startTime = e.item.startTime;
                endTime = e.item.endTime;
            });

            this.calendar.on("itemEditEnd", function(item){
                self.itemEndEdit(item, startTime, endTime);
            });
        },

        /**
         * Function when ending moving or resizing an item.
         * @param: dataItem with item containing new start and end times.
         * @param start: The original start time of the item.
         * @param end: The original end time of the item.
         */
        itemEndEdit: function(dataItem, start, end) {
            this.updateSidebar(dataItem);
            dataItem.item.originalDate = start;
            dataItem.item.originalEndDate = end;
            this.updateItem(dataItem.item, "move", dataItem.item.startDate, dataItem.item.endDate);
        },

        /**
         * Function to determine if shift/double click is enabled
         */
        enableCreateOnShiftDoubleClick: function() {
            return true;
        },

        /**
         * Function to determine if control/alt click is enabled
         */
        enableCreateOnControlAltClick: function() {
            return true;
        },

       /**
        * Sets the function when clicking on the calendar grid.
        */
        _addEntryOnClick: function() {
            var self = this;
            if (this.enableCreateOnShiftDoubleClick()) {
                this.addCreateOnShiftDoubleClick();
            }
            if (this.enableCreateOnControlAltClick()) {
                var createItem = function(view, date, event) {
                    // Check if control or alt key held
                    if (event.ctrlKey || event.altKey){
                        self.tempCreateItem = self.addCreateOnControlAltClick(view, date);
                        return self.tempCreateItem;
                    }
                };
                this.calendar.set("createOnGridClick", true);
                this.calendar.set("createItemFunc", createItem);
            }
        },

       /**
        * Sets the function when single/double clicking on the calendar grid or with shift key held down.
        */
        addCreateOnShiftDoubleClick: function() {
            var self = this;
            var gridClickFunc = function(grid, doubleClick) {
                self.calendar.gridClick = true;
                self.updateSidebar(grid, true);
                self.calendar.gridClick = false;
            };
            // Schedule Processes on a shift click or double click.
            this.calendar.on("gridClick", function(grid) {
                gridClickFunc(grid);
                self.onGridClick(grid);
            });
            this.calendar.on("gridDoubleClick", function(grid) {
                gridClickFunc(grid, true);
            });
        },

       /**
        * Create an event while holding down the control or alt key and clicking in the calendar grid.
        * @param view: The current view of the calendar
        * @param date: The current date of the calendar view.
        * @return The object of the new item.
        */
        addCreateOnControlAltClick: function(view, date) {
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
            var newName = i18n("New Entry");
            var item = {
                id: "noId",
                summary: newName,
                name: newName,
                startDate: start,
                endDate: end,
                clickCreate: true,
                calendarId: this.calendarId
            };
            return item;
        },

        /**
         * Creates the calendar sidebar
         */
        _createSidebar: function() {
            var self = this;
            this.calendar.gridClick = false; // Variable changed to true if grid click.

            this.sidebar = {};

            // Create the sidebar tabs
            this._addSidebarTabs();

            this.addSidebarCreateButtons();
            this.addCalendarFilters();

            // Create the side bar calendar
            this.sidebar.calendar = new MiniCalendar({
                datePackage: BidiDateUtil.getDatePackage(),
                minDate: null,
                maxDate: null,
                getClassForDate: function(date, locale){
                    // Highlight days that are in view in the side bar calendar.
                    if (this.minDate && this.maxDate){
                        var cal = this.dateModule;
                        if (cal.compare(date, this.minDate) >= 0 && cal.compare(date, this.maxDate) <= 0){
                            return "highlighted-date";
                        }
                    }
                    return null;
                },
                updateSideCalendar: function(startTime, endTime) {
                    this.set("currentFocus", startTime, false);
                    this.set("minDate", startTime);
                    this.set("maxDate", endTime);
                    this._populateGrid();
                }
            }, this.calendarSidebarAttachPoint);

            this.sidebar.calendar.on("change", function(date) {
                // If date is clicked in the side bar calendar, update view in main calendar.
                if (!!self.calendar && !self.calendar.gridClick) {
                    self.calendar.set("date", date);
                }
            });

            this.calendar.on("timeIntervalChange", function(e) {
                // If view on main calendar changes, update side bar calendar.
                self.sidebar.calendar.updateSideCalendar(e.startTime, e.endTime);
                if (e.oldStartTime && e.oldEndTime){
                    self.refreshCalendar(e.startTime, e.endTime);
                }
                // Update calendar month and year.
                self.calendar.calendarTitle.innerHTML = self.months[self.calendar.date.getMonth()] + " " + self.calendar.date.getFullYear();
            });

            // Side Bar panel
            this.sidebarContainer = domConstruct.create("div", {
                className: "calendar-sidebar-panel-container"
            }, this.calendarSidebarPanelAttachPoint);

        },

        /**
         * Creates the tabs in the sidebar to toggle filter view.
         */
        _addSidebarTabs: function() {
            var self = this;
            var currentTab, currentView;

            // Create the tabs
            var mainTab = domConstruct.create("div", {
                innerHTML: i18n("Details"),
                className: "calendar-sidebar-tab current-calendar-tab inline-block"
            }, this.calendarSidebarTabsAttachPoint);
            currentTab =  mainTab;
            currentView = self.calendarSidebarPanel;

            var filterTab = domConstruct.create("div", {
                innerHTML: i18n("Filters"),
                className: "calendar-sidebar-tab inline-block"
            }, this.calendarSidebarTabsAttachPoint);

            // Define functions to display contents of tabs when clicked on.
            this.showTab = function(tab, view) {
                domClass.remove(currentTab, "current-calendar-tab");
                domClass.add(currentView, "hidden");
                currentTab = tab || mainTab;
                currentView = view || self.calendarSidebarPanel;
                domClass.add(currentTab, "current-calendar-tab");
                domClass.remove(currentView, "hidden");
            };
            on(mainTab, "click", function() {
                self.showTab();
            });
            on(filterTab, "click", function() {
                self.showTab(filterTab, self.calendarSidebarFilterAttachPoint);
            });
        },

        /**
         * Add create buttons to the sideBar by defining them using the createSidebarCreateButton function.
         */
        addSidebarCreateButtons: function(){
        },

        /**
         * Creates a button to add an item to the calendar.
         * @param options:
         *      label: The button label
         *      onClick: Action to perform when button is clicked
         *      hoverMessage: (Optional) If provided, a help text is displayed when button is hovered.
         *      hightlighButton: (Optional) Adds CSS class idxButtonSpecial to the button.
         */
        createSidebarCreateButton: function(options) {
            var buttonContainer = domConstruct.create("div", {
                className: "calendar-sidebar-create-button-container"
            }, this.calendarSidebarCreateButtonAttachPoint);

            var button = new Button({
                label: options.label,
                onClick: options.onClick
            }).placeAt(buttonContainer);

            if (options.highlight){
                domClass.add(button.domNode, "idxButtonSpecial");
            }

            if (options.hoverMessage){
                var hoverMessage = domConstruct.create("div", {
                      innerHTML: options.hoverMessage,
                      className: "calendar-sidebar-hover-container hidden"
                }, this.calendarSidebarPanelAttachPoint);

                on(button, mouse.enter, function(){
                    domClass.remove(hoverMessage, "hidden");
                });
                on(button, mouse.leave, function(){
                    domClass.add(hoverMessage, "hidden");
                });
            }
            return button;
        },

        /**
         * Display the calendar save pop up.
         * @param text: Text to show in the save message (default: Calendar Saved)
         * @param attachPoint: (Optional) Node to attach message to.
         */
        showSaveMessage: function(text, attachPoint) {
            var self = this;
            var attach = attachPoint || this.calendarSidebarPanelAttachPoint;
            if (!this.calendarSaveMessage){
                // Create calendar save message pop up
                this.calendarSaveMessage = domConstruct.create("div", {
                    className: "calendar-sidebar-save-message hidden"
                });
                on(this.calendarSaveMessage, mouse.enter, function(){
                    domClass.add(self.calendarSaveMessage, "hidden");
                });
            }
            this.calendarSaveMessage.innerHTML = text || i18n("Calendar Saved");
            domConstruct.place(this.calendarSaveMessage, attach, "first");
            domClass.remove(this.calendarSaveMessage, "hidden");
            setTimeout(function(){
                domClass.add(self.calendarSaveMessage, "hidden");
            }, 2500);
        },

        /**
         * Creates an item in the calendar side bar
         * @param item {
         *              className: Class of the item
         *              innerHTML: Contents (text) of the item
         *              attachPoint: Node to place item. Default CalendarSidebarPanel
         *              type: "div" (default), "span" or "a"
         *              href: URL if type is specified as "a"
         * @return The side bar item
         * }
         */
        createSidebarItem: function(item) {
            var type = item.type || "div";
            var returnItem = domConstruct.create(type, {
                className: item.className || "",
                innerHTML: item.innerHTML || ""
            }, item.attachPoint || this.sidebarContainer || "");
            if (type === "a" && item.href){
                returnItem.href = item.href;
            }
            return returnItem;
        },

        /**
         * Generates the object needed to build a side bar item
         * @param innerHTML: Contents (text) of the item
         * @param attachPoint: Node to place item. Default CalendarSidebarPanel
         * @className: Class of the item
         * @return The item object
         */
        _createItemForSidebar: function(innerHTML, attachPoint, className) {
            var self = this;
            return {
                innerHTML: innerHTML || "",
                attachPoint: attachPoint || self.sidebarContainer || "",
                className: className || ""
            };
        },

        /**
         * Creates a section container for a side bar item
         * @param innerHTML: Contents (text) of the item
         * @param attachPoint: Node to place item. Default CalendarSidebarPanel
         * @return The side bar section container
         */
        createSidebarSection: function(innerHTML, attachPoint) {
            return this.createSidebarItem(this._createItemForSidebar(innerHTML, attachPoint, "calendar-sidebar-panel-section"));
        },

        /**
         * Creates a label for a side bar item
         * @param innerHTML: Contents (text) of the label
         * @param attachPoint: Node to place item. Default CalendarSidebarPanel
         * @return The side bar label
         */
        createSidebarLabel: function(innerHTML, attachPoint) {
            return this.createSidebarItem(this._createItemForSidebar(innerHTML, attachPoint, "calendar-sidebar-panel-label"));
        },

        /**
         * Creates a label for a side bar item
         * @param innerHTML: Contents (text) of the item
         * @param attachPoint: Node to place item. Default Automatically creates a section.
         * @return The side bar section container with the label attached inside
         */
        createSidebarLabelContainer: function(label, attachPoint) {
            var attach = attachPoint || this.createSidebarSection();
            this.createSidebarLabel(label, attach);
            return attach;
        },

        /**
         * Creates a text item for a side bar item
         * @param label: Title of label for the text item
         * @param innerHTML: Contents (text) of the item
         * @param attachPoint: Node to place item. Default Automatically creates a section.
         */
        createSidebarText: function(label, innerHTML, attachPoint) {
            attachPoint = this.createSidebarLabelContainer(label, attachPoint);
            this.createSidebarItem(this._createItemForSidebar(innerHTML, attachPoint, "calendar-sidebar-panel-text"));
        },

        /**
         * Creates a link item for a side bar item
         * @param label: Title of label for the text item
         * @param innerHTML: Contents (text) of the item
         * @param href: The URL of the link.
         * @param attachPoint: Node to place item. Default Automatically creates a section.
         */
        createSidebarLink: function(label, innerHTML, href, disableLink, attachPoint) {
            if (disableLink){
                this.createSidebarText(label, innerHTML, attachPoint);
            }
            else {
                attachPoint = this.createSidebarLabelContainer(label, attachPoint);
                this.createSidebarItem({
                    innerHTML: innerHTML,
                    attachPoint: attachPoint,
                    className: "calendar-sidebar-panel-text calendar-sidebar-panel-link",
                    href: href,
                    type: "a"
                });
            }
        },

        /**
         * Creates the title for the side bar
         * @param innerHTML: Contents (text) of the side bar
         * @param attachPoint: Node to place item. Default CalendarSidebarPanel
         */
        createSidebarTitle: function(innerHTML, attachPoint) {
            var attach = attachPoint || this.createSidebarSection();
            this.createSidebarItem(
                this._createItemForSidebar(innerHTML, attach, "calendar-sidebar-panel-title")
            );
        },

        /**
         * Creates a text item for a side bar item
         * @param label: Title of label for the text item
         * @className: Class of the item
         * @param action: Action to take when button is clicked
         * @param linkButton: Use a link instead of a button style
         */
        createSidebarButton: function(label, className, action, attachPoint, linkButton, title) {
            var attach = attachPoint || this.sidebarContainer;
            var button = linkButton ? domConstruct.create("a", {
                    innerHTML: label,
                    title: title || label,
                    className: "calendar-sidebar-button-link linkPointer " + className
                }, attach) : new Button({
                    label: label
                }).placeAt(attach);
                if (!linkButton){
                    domClass.add(button.domNode, className + " calendar-sidebar-button");
                }
                on(button, "click", function(){
                    action();
                });
            return button;
        },

        /**
         * Run this function to clear the side bar before updating the side bar.
         */
        clearSidebar: function() {
            domConstruct.empty(this.sidebarContainer);
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
        updateSidebar: function(data, grid) {
            var item = data.item || null;
            this.clearSidebar();
            this.showTab();
            if (item){
                if (item.name){
                    this.createSidebarTitle(item.name);
                }

                if (item.startDate) {
                    var dateContainer = this.createSidebarLabelContainer(item.endDate ? i18n("Start Date") : i18n("Date"));
                    new DateTextBox({
                        datePackage: BidiDateUtil.getDatePackage(),
                        value: BidiDateUtil.getNewDate(item.startDate)
                    }).placeAt(dateContainer);

                    new TimeTextBox({
                        value: item.startDate
                    }).placeAt(dateContainer);
                }
                if (item.endDate) {
                    var endDateContainer = this.createSidebarLabelContainer(i18n("End Date"));
                    new DateTextBox({
                        datePackage: BidiDateUtil.getDatePackage(),
                        value: BidiDateUtil.getNewDate(item.endDate)
                    }).placeAt(endDateContainer);

                    new TimeTextBox({
                        value: item.endDate
                    }).placeAt(endDateContainer);
                }
            }
        },

        /**
         * Updates a calendar item when the item's date has changed
         * @param item: The item to update
         * @param options: {} Updated data to send.
         */
        updateItem: function(item, options) {
            var self = this;
            var store = this.calendar.store;

            if (options.date){
                item.startDate = options.date;
            }
            if (options.endDate){
                item.endDate = options.endDate;
            }
            store.put(item);
            self.showSaveMessage();
        },

        /**
         * Creates a filtering select box
         * @param options: {
         *      url: The url to populate the select box
         *      label: Label for the filter box
         *      placeHolder: Place holder text when filter box is empty (All)
         *      className: Additional class for the filter box
         *      multiple: If true, display checkBoxes in select dropDown.
         *
         *      options: If url is null, provide an array of options for a drop down
         *      value: If url is null, provide a default value for the drop down
         *      noPlace: Newly created filter should not be automatically placed in the sidebar
         * }
         * @return The created filter box.
         */
        createCalendarFilterSection: function(options) {
            var section = options.section || this.createSidebarLabelContainer(options.label);

            if (options.placeAt) {
                domConstruct.place(section, options.placeAt);
            }
            else if (!options.noPlace) {
                domConstruct.place(section, this.calendarSidebarFilterAttachPoint);
            }

            var filter = null;
            var store = null;
            var filterOpts;
            // Create the filter
            if (options.url){
                store = new JsonRest({
                    "target": options.url,
                    "idProperty": "id"
                });
                filterOpts = {
                        "store": store,
                        "placeHolder": options.placeHolder || i18n("All"),
                        "pageSize": "10",
                        "listClassName": options.listClassName
                };
            }
            else if (options.options && options.value) {
                // If options and a value are provide with no URL, create a regular drop down select.
                store = new Memory({"data": options.options, "idProperty": "value"});
                filterOpts = {
                    "store": store,
                    "placeHolder": options.placeHolder || i18n("All"),
                    "searchAttr": "label"
                };
            }
            if (options.onChange) {
                filterOpts.onChange = options.onChange;
            }
            if (options.formatDropDownLabel) {
                filterOpts.formatDropDownLabel = options.formatDropDownLabel;
            }
            if (options.multiple) {
                if (options.formatSelectedItem){
                    filterOpts.formatSelectedItem = options.formatSelectedItem;
                }
                filter = new WebextMultiSelect(filterOpts);
            }
            else {
                filter = new WebextSelect(filterOpts);
            }
            filter.placeAt(section);
            if (options.className){
                domClass.add(filter.domNode, options.className);
            }
            return filter;
        },

        /**
         * Add filters to the calendar. Use function createCalendarFilterSection() to create a filter.
         */
        addCalendarFilters: function() {
        },

        /**
         * Determine if item is shown.
         * @param item: An item in the calendar
         * @return If item is displayed
         */
        filterCalendar: function(item) {
            return true;
        }
    });
});

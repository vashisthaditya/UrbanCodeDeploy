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
        "dojo/_base/xhr",
        "js/webext/widgets/Alert",
        "js/webext/widgets/ColumnForm",
        "js/webext/widgets/RestSelect"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        xhr,
        Alert,
        ColumnForm,
        RestSelect
) {
    return declare('deploy.widgets.security.EditUserPreferences',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="editUser">'+
            '  <div data-dojo-attach-point="formAttach"></div>'+
            '</div>',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            var self = this;

            xhr.get({
                url: bootstrap.restUrl+"security/userPreferences",
                handleAs: "json",
                load: function(data) {
                    var form = new ColumnForm({
                        submitUrl: bootstrap.restUrl+"security/userPreferences",
                        submitMethod: "PUT",
                        cancelLabel: null,
                        postSubmit: function(data) {
                            var savedAlert = new Alert({
                                message: i18n("Preferences saved successfully."),
                                onClose: function() {
                                    location.reload(true);
                                }
                            });
                        }
                    });

                    var userLocale = null;
                    if (!!data.hasUserDefinedLocale) {
                        userLocale = data.locale;
                    }

                    var localeSelect = new RestSelect({
                        restUrl: bootstrap.restUrl+"security/userPreferences/availableLocales",
                        getLabel: function(item) {
                            return item.displayName;
                        },
                        getValue: function(item) {
                            return item.value;
                        },
                        allowNone: true,
                        noneLabel: i18n("No Default Set"),
                        escapeHTMLLabel: false,
                        value: userLocale
                    });
                    form.addField({
                        name: "locale",
                        label: i18n("Locale"),
                        widget: localeSelect
                    }, "_type");

                    var datePatternSelect = new RestSelect({
                        restUrl: bootstrap.restUrl+"security/userPreferences/availableDatePatterns",
                        getLabel: function(item) {
                            return item;
                        },
                        getValue: function(item) {
                            return item;
                        },
                        allowNone: true,
                        noneLabel: i18n("Default for Locale"),
                        value: data.datePattern
                    });
                    form.addField({
                        name: "datePattern",
                        label: i18n("Date Format"),
                        widget: datePatternSelect
                    }, "_type");

                    var timePatternSelect = new RestSelect({
                        restUrl: bootstrap.restUrl+"security/userPreferences/availableTimePatterns",
                        getLabel: function(item) {
                            return item;
                        },
                        getValue: function(item) {
                            return item;
                        },
                        allowNone: true,
                        noneLabel: i18n("Default for Locale"),
                        value: data.timePattern
                    });
                    form.addField({
                        name: "timePattern",
                        label: i18n("Time Format"),
                        widget: timePatternSelect
                    }, "_type");

                    var btdSelect = new RestSelect({
                        restUrl: bootstrap.restUrl+"security/userPreferences/availableBTDValues",
                        getLabel: function(item) {
                            return i18n(item);
                        },
                        getValue: function(item) {
                            return item;
                        },
                        allowNone: true,
                        noneLabel: i18n("Default"),
                        value: data.btdValue
                    });
                    form.addField({
                        name: "btdValue",
                        label: i18n("Base Text Direction"),
                        widget: btdSelect
                    }, "_type");

                    var calendarSelect = new RestSelect({
                        restUrl: bootstrap.restUrl+"security/userPreferences/availableCalendarValues",
                        getLabel: function(item) {
                            return i18n(item);
                        },
                        getValue: function(item) {
                            return item;
                        },
                        allowNone: false,
                        noneLabel: i18n("Default"),
                        value: data.calendar
                    });
                    form.addField({
                        name: "calendar",
                        label: i18n("Calendar"),
                        widget: calendarSelect
                    }, "_type");

                    form.addField({
                        name: "_defaultTeamMappingInsert",
                        type: "Invisible"
                    });

                    form.addField({
                        name: "defaultTeamMappingType",
                        label: i18n("Default Teams for New Objects"),
                        description: i18n("This determines which teams should be added to new " +
                                "objects by default. Normally, all teams where you have permission " +
                                "to create objects are automatically selected for new objects " +
                                "you're creating, but you can override this behavior if you " +
                                "belong to many teams or do not want to have any teams appear " +
                                "by default."),
                        type: "SELECT",
                        value: data.defaultTeamMappingType,
                        allowedValues: [{
                            label: i18n("All Available Teams"),
                            value: "DEFAULT_TEAM_MAPPINGS_ALL"
                        },{
                            label: i18n("Specific Teams"),
                            value: "DEFAULT_TEAM_MAPPINGS_SPECIFIC_TEAMS"
                        },{
                            label: i18n("None"),
                            value: "DEFAULT_TEAM_MAPPINGS_NONE"
                        }],
                        onChange: function(value) {
                            self.showOrHideTeamSelect(form, value, data.defaultTeamMappings);
                        }
                    }, "_defaultTeamMappingInsert");
                    self.showOrHideTeamSelect(form, data.defaultTeamMappingType, data.defaultTeamMappings);

                    form.placeAt(self.formAttach);
                }
            });
        },

        showOrHideTeamSelect: function(form, defaultTeamMappingType, existingValue) {
            if (defaultTeamMappingType === "DEFAULT_TEAM_MAPPINGS_SPECIFIC_TEAMS") {
                var defaultQuery = {};
                if (!config.data.permissions[security.system.manageSecurity]) {
                    defaultQuery = {
                        filterFields: ["username"],
                        filterValue_username: [bootstrap.username],
                        filterType_username: "eq",
                        filterClass_username: "String"
                    };
                }

                form.addField({
                    name: "defaultTeamMappings",
                    label: i18n("Choose Default Team(s)"),
                    type: "TableFilterMultiSelect",
                    required: true,
                    defaultQuery: defaultQuery,
                    url: bootstrap.baseUrl+"security/team",
                    value: existingValue
                }, "_defaultTeamMappingInsert");
            }
            else {
                if (form.hasField("defaultTeamMappings")) {
                    form.removeField("defaultTeamMappings");
                }
            }
        }
    });
});

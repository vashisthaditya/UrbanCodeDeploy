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
        "dijit/form/CheckBox",
        "dijit/registry",
        "dijit/Tooltip",
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/xhr",
        "dojo/dnd/Source",
        "dojo/dom",
        "dojo/dom-construct",
        "dojo/dom-geometry",
        "dojo/dom-style",
        "dojo/dom-class",
        "dojo/on",
        "dojo/mouse",
        "dojo/query",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/table/TreeTable",
        "js/webext/widgets/form/MenuButton",
        "js/webext/widgets/ColumnForm",
        "deploy/widgets/version/VersionSelect",
        "deploy/widgets/version/VersionDisplay",
        "js/webext/widgets/RestSelect"
        ],
function(
        _TemplatedMixin,
        _Widget,
        Button,
        CheckBox,
        registry,
        Tooltip,
        array,
        declare,
        lang,
        xhr,
        Source,
        dom,
        domConstruct,
        domGeometry,
        domStyle,
        domClass,
        on,
        mouse,
        query,
        Dialog,
        TreeTable,
        MenuButton,
        ColumnForm,
        VersionSelect,
        VersionDisplay,
        RestSelect
) {
    /**
     * A widget to select component versions for an application process request.
     *
     * Supported properties:
     *  applicationProcess /                A predefined application process
     *  environment / Object                A predefined environment to select
     *  componentVersionsMap / Object       A map created to keep track of the versions selected in the form:
     *                                      { "<component 1 id>": ["<version 1 object>", "<version 2 object>", ...],
     *                                      "<component 2 id>": [...], ...}
     *  versionSelectorMap / Object         A map created to keep track of version selectors for components.
     *                                      { "comp_1_id>": "versionSelector",...}
     *                                      No component at any time should have both a selector and versions in the versionsmap
     */
    return declare('deploy.widgets.application.VersionSelection',  [_Widget, _TemplatedMixin], {
        templateString:
            '<div class="versionSelector" data-dojo-attach-point="formAttach">'+
                '<div data-dojo-attach-point="selectAllAttach" class="inlineBlock" style="margin-right:50px;"></div>' +
                '<div data-dojo-attach-point="checkboxAttach" class="inlineBlock"></div>' +
                '<div data-dojo-attach-point="gridAttach"></div>' +
            '</div>',

        componentVersionsMap: {},
        versionSelectorMap: {},

        versionDisplays: {},

        postCreate: function() {
            this._changeCount();
            this.createVersionForm();
        },

        //creates the dialog and calls all other functions to populate it
        createVersionForm: function () {
            this.addCheckBoxOptions();
            this.createVersionTable();
            this.addSelectForAll();
        },

        addCheckBoxOptions: function() {
            var self = this;

            var onlyChangedOptionContainer = domConstruct.create("div", {
                className: "inline-block version-secetion-checkbox-option"
            }, this.checkboxAttach);

            this.onlyChangedOption = new CheckBox({
                label: i18n("Show only changed components"),
                name: "onlyChanged",
                checked: false,
                value: false,
                onChange: function(value) {
                    this.set('value', value);
                    if(self.grid) {
                        self.grid.destroy();
                        self.createVersionTable(value);
                        self._changeCount();
                    }
                }
            }).placeAt(onlyChangedOptionContainer);
            domConstruct.create("label", {
                "for": this.onlyChangedOption.id,
                "innerHTML": i18n("Show only changed components")
            }, onlyChangedOptionContainer);

            var helpCell = domConstruct.create("div", {
                "class": "labelsAndValues-helpCell inlineBlock"
            }, onlyChangedOptionContainer);
            var helpTip = new Tooltip({
                connectId: [helpCell],
                label: i18n("This will only show components which contain newer versions " +
                        "than the current environment inventory as long as there is a newer version "+
                        "that passes the environment gates for the application."),
                showDelay: 100,
                position: ["after", "above", "below", "before"]
            });

            var onlyPassingGatesCheckboxContainer = domConstruct.create("div", {
                className: "inline-block version-secetion-checkbox-option"
            }, this.checkboxAttach);
            var onlyPassingGatesCheckbox = new CheckBox({
                onChange: function(value) {
                    self.allowInvalidVersions = !!value;
                }
            }).placeAt(onlyPassingGatesCheckboxContainer);
            domConstruct.create("label", {
                "for": onlyPassingGatesCheckbox.id,
                "innerHTML": i18n("Allow invalid versions")
            }, onlyPassingGatesCheckboxContainer);

            var allowInvalidHelpCell = domConstruct.create("div", {
                "class": "labelsAndValues-helpCell inlineBlock"
            }, onlyPassingGatesCheckboxContainer);
            var allowInvalidHelpTip = new Tooltip({
                connectId: [allowInvalidHelpCell],
                label: i18n("This will allow selection of versions even if they have not "+
                        "achieved the statuses required of versions being deployed to this "+
                        "environment."),
                showDelay: 100,
                position: ["after", "above", "below", "before"]
            });
        },

        showStatusDialog: function(selectCallBack) {
            var self = this;
            var dia = new Dialog({title: i18n("Select Status")});
            var form = new ColumnForm({
                onSubmit: function(data) {
                    dia.destroy();
                    form.destroy();
                    if (data.status) {
                        selectCallBack(data.status);
                    }
                },
                onCancel: function(data) {
                    dia.destroy();
                    form.destroy();
                }
            });


            var valueSelect = new RestSelect({
                restUrl: bootstrap.restUrl+"deploy/status/versionStatuses",
                getValue: function(item) {
                    return item.name;
                },
                getStyle: function(item) {
                    var result = {
                        backgroundColor: item.color
                    };
                    return result;
                },
                allowNone: false,
                noIllegalValues: true,
                onChange: function(value) {
                    if (value) {
                        self.value = value;
                    }
                    else {
                        self.value = undefined;
                    }
                }
            });
            form.addField({
                name: "status",
                label: "Status",
                description: i18n("Status"),
                widget: valueSelect
            });

            form.placeAt(dia.containerNode);
            dia.show();
        },

        showNameDialog: function(requestUrlBase) {
            // create a dialog with a field for name of version to add to the components
            var self = this;
            if (this.nameDialog) {
                this.nameDialog.destroy();
            }
            if (this.nameForm) {
                this.nameForm.destroy();
            }

            this.nameDialog = new Dialog({
                title: i18n("Add Versions With Name...")
            });

            this.nameForm = new ColumnForm({
                postSubmit: function(data) {
                    self.nameDialog.destroy();
                    self.nameForm.destroy();
                },
                onCancel: function() {
                    self.nameDialog.destroy();
                    if (self.nameForm) {
                        self.nameForm.destroy();
                    }
                },
                onSubmit: function(data) {
                    if (data) {
                        var requestUrl = requestUrlBase+'/'+data.name;
                        if (data.mustPassGates) {
                            requestUrl += '/'+data.mustPassGates;
                        }
                        xhr.get({
                            url: requestUrl,
                            handleAs: "json",
                            load: function(data) {
                                if (data) {
                                    array.forEach(self.grid.cachedData, function(item) {
                                        array.forEach(data, function(versionItem) {
                                            if (versionItem.component.id === item.id) {
                                                self.addVersion(versionItem, item, self._getTagAttachElement(item.id));
                                            }
                                        });
                                    });
                                    self.displayVersions();
                                }
                            }
                        });
                    }
                }
            });

            this.nameForm.addField({
                name: "mustPassGates",
                label: "Passes Gates",
                description: i18n("Use only versions that pass environment gates"),
                type: "Checkbox",
                value: true
            });

            /* add the required name field */
            this.nameForm.addField({
                name: "name",
                label: i18n("Name"),
                required: true,
                type: "Text",
                description: i18n("Use * as a wildcard. Without wildcard character, exact match is used.")
            });

            this.nameForm.placeAt(this.nameDialog.containerNode);
            this.nameDialog.show();
        },

        /* Creates the menu button to apply options to all components
         * Options include:
         *      Latest versions - finds the latest version for each component and adds them, if it exists
         *      Latest versions at execution time - the latestVersion/ selector so that latest version will be picked up when the process actually executes.
         *      Latest versions with status - finds the latest version for each component with a status and adds them, if it exists.
         *      Latest versions with status at execution time - finds the latest version for each component with a status and adds them, if it exists.
         *      TODO All with status - finds all the versions for each component with a status and adds them.
         *      TODO All with status at exeuction time- finds all the versions for each component with a status and adds them.
         *      Current Environment Inventory - adds all the latest desired versions in the inventory in the environment
         *      Current Environment Inventory at execution time - adds all the latest desired versions in the inventory in the environment
         *      None (Clear All) - this removes all versions the user has selected so far
         */
        addSelectForAll: function() {
            //create a select for choosing latest version for all
            var self = this;

            var selectAllOptions = [{
                label: i18n("Latest Available"),
                onClick: function() {
                    self.addLatestVersions(bootstrap.restUrl+'deploy/applicationProcess/'+self.applicationProcess.id+'/'
                            +self.applicationProcess.version+'/'+self.environment.id+'/latestVersions');
                }
            },{
                label: i18n("Latest with Status"),
                onClick: function() {
                    var onSelection = function(item) {
                        self.addLatestVersions(bootstrap.restUrl+'deploy/applicationProcess/'+self.applicationProcess.id+'/'
                                +self.applicationProcess.version+'/'+self.environment.id+'/latestVersions?status=' + item);
                    };
                    self.showStatusDialog(onSelection);
                }
            },{
                label: i18n("Versions With Name..."),
                onClick: function() {
                    self.showNameDialog(bootstrap.restUrl+'deploy/applicationProcess/'+self.applicationProcess.id+'/'
                            +self.applicationProcess.version+'/'+self.environment.id+'/versions');
                }
            },{
                label: i18n("Current Environment Inventory"),
                onClick: function() {
                    array.forEach(self.grid.cachedData, function(item) {
                        self.removeAllVersions(item.id);

                        //since incremental versions are displayed from latest to earliest,
                        //we reverse them so we deploy from earliest to latest
                        var desiredVersions = lang.clone(item.desiredVersions);
                        desiredVersions.reverse();
                        self.addCurrentInventory(item, self._getTagAttachElement(item.id), false, desiredVersions);
                    });
                }
            },{
                label: i18n("Latest Available at Execution Time"),
                onClick: function() {
                    self.addLatestVersionsAtExecutionTime();
                }
            },{
                label: i18n("Latest with Status at Execution Time"),
                onClick: function() {
                    var onSelection = function(item) {
                        self.addLatestWithStatusAtExecutionTime(item);
                    };
                    self.showStatusDialog(onSelection);
                }
            },{
                label: i18n("Current Environment Inventory at Execution Time"),
                onClick: function() {
                    self.addCurrentInventoryAtExecutionTime();
                }
            },{
                label: i18n("None (Clear All)"),
                onClick: function() {
                    array.forEach(self.grid.cachedData, function(item) {
                        self.removeAllVersions(item.id);
                    });
                }
            }];
            this.applyAllSelect = new MenuButton({
                options: selectAllOptions,
                label: i18n("Select For All...")
            });
            this.applyAllSelect.placeAt(self.selectAllAttach);
        },

        /* Creates the table for viewing components, current environment inventory,
         * and column to select versions to deploy in the application process
         * This is where all the event listeners for the version select reside
         *
         * --> OVERRIDE THIS IF NOT ON APPLICATION PROCESS DIALOG
         */
        createVersionTable: function(onlyChanged) {
            var self = this;
            self.componentVersionsMap = {};
            self.versionSelectorMap = {};
            var gridRestUrl = bootstrap.restUrl+'deploy/applicationProcess/'+this.applicationProcess.id+'/'
                    +this.applicationProcess.version+'/'+this.environment.id+'/components';
            var noDataMessage = i18n("No components found on the environment.");
            if(onlyChanged) {
                gridRestUrl = bootstrap.restUrl+'deploy/applicationProcess/'+this.applicationProcess.id+'/'+
                                    this.applicationProcess.version+'/'+this.environment.id+'/changedComponents';
                noDataMessage = i18n("No changed components found.");
            }
            var gridLayout = [{
                name: i18n("Component"),
                field: "name",
                orderField: "name",
                filterField: "name",
                filterType: "text",
                getRawValue: function(item) {
                    return item.name;
                }
            },{
                name: i18n("Current Environment Inventory"),
                formatter: function(item, value, cell) {
                    //if no version, show "none"
                    //for each version that is currently deployed, show in cell
                    var versionDiv = domConstruct.create("div");
                    self.addCurrentInventory(item, versionDiv, true);

                    return versionDiv;
                }
            },{
                name: i18n("Versions to Deploy"),
                formatter: function(item, value, cell) {
                    if(!self.componentVersionsMap.hasOwnProperty(item.id)) {
                        self.componentVersionsMap[item.id] = [];
                        self.versionSelectorMap[item.id] = undefined;
                    }

                    var result = domConstruct.create("div", {className: "component-version-selection"});
                    var tagAttach = domConstruct.create("div", {
                        "class": "inlineBlock tagAttach_" + item.id
                    }, result);
                    var tagAttachSource = new Source(tagAttach, {
                        item: item,
                        copyOnly: false,
                        copyState: function() {
                            return false;
                        },
                        horizontal: true,
                        onDndDrop: function(source, nodes, copy, target) {
                            // Don't process the event if it's not for this Source
                            if(this === source && this === target){
                                var versionList = self.componentVersionsMap[this.item.id];
                                // There can be only one
                                var node = nodes[0];
                                var currentVersion = registry.byId(node.id).version;
                                var currentIndex = array.indexOf(versionList, currentVersion);
                                // Index should never be -1
                                if (currentIndex !== -1) {
                                    versionList.splice(currentIndex, 1);
                                }
                                var targetVersion = registry.byId(target.current.id).version;
                                var insertIndex = array.indexOf(versionList, targetVersion);
                                if (insertIndex !== -1) {
                                    // Index should never be -1
                                    if (!target.before) {
                                        insertIndex++;
                                    }
                                    // Insert the dragged item
                                    versionList.splice(insertIndex, 0, currentVersion);
                                }
                                self.displayVersions();
                            }
                            this.onDndCancel();
                        }
                    });
                    tagAttach.source = tagAttachSource;

                    var add = domConstruct.create("a", {
                        "innerHTML": i18n("Add..."),
                        "class": "inlineBlock linkPointer"
                    }, result);

                    //for each version that is already selected, put here
                    self.clearDisplays(item.id);
                    array.forEach(self.componentVersionsMap[item.id], function(version) {
                        self.displayVersion(version, item.id, tagAttach);
                    });
                    if (self.versionSelectorMap[item.id]) {
                        var selector = self.versionSelectorMap[item.id];
                        self.displayVersion({
                               "name": self.getDisplayNameForVersionSelector(selector),
                               "id": item.id + "-" + selector
                            },
                            item.id,
                            tagAttach);
                    }

                    //attach the version selection widget
                    self.addEvent = self.own(on(add, "click", function(e) {
                        //bring up the selector widget
                        var _this = this;

                        if (_this.selector) {
                            _this.selector.destroy();
                        }

                        var extraLinks = [
                            {
                                name: i18n("Latest Available"),
                                handler: function() {
                                    self.addLatestVersion(bootstrap.restUrl+"deploy/component/"+
                                        item.id+"/latestVersionByEnvironment/"+
                                        self.environment.id, item, self._getTagAttachElement(item.id));
                                        self.displayVersions();
                                        _this.selector.destroy();
                                }
                            },{
                                name: i18n("Latest With Status"),
                                handler: function() {
                                    var onSelection = function(status) {
                                        self.addLatestVersion(bootstrap.restUrl+"deploy/component/"+
                                                item.id+"/latestVersionByEnvironment/"+
                                                self.environment.id + "?statusName=" + status, item, self._getTagAttachElement(item.id));
                                        self.displayVersions();
                                        _this.selector.destroy();
                                    };
                                    self.showStatusDialog(onSelection);
                                }
                            },{
                                name: i18n("Latest Available at Execution Time"),
                                handler: function() {
                                    self.addVersionSelector("latestVersion/", item, self._getTagAttachElement(item.id));
                                    self.displayVersions();
                                    _this.selector.destroy();
                                }
                            },{
                                name: i18n("Latest With Status At Execution Time"),
                                handler: function() {
                                    var onSelection = function(status) {
                                        self.addVersionSelector("latestWithStatus/" + status, item, self._getTagAttachElement(item.id));
                                        self.displayVersions();
                                        _this.selector.destroy();
                                    };
                                    self.showStatusDialog(onSelection);
                                }
                            },{
                                name: i18n("Current Environment Inventory at Execution Time"),
                                handler: function(){
                                    self.addVersionSelector("allInEnvironment/", item, self._getTagAttachElement(item.id));
                                    self.displayVersions();
                                    _this.selector.destroy();
                                }
                            }
                        ];

                        _this.selector = new VersionSelect({
                            component: item,
                            environment: self.environment,
                            allowInvalidVersions: self.allowInvalidVersions,
                            extraSimpleLinkToHandlers: extraLinks
                        });

                        _this.selector.placeAt(dojo.body());

                        var pos = domGeometry.position(add);
                        var bodyPos = domGeometry.position(dojo.body());
                        var selectorW = 0;
                        array.forEach(this.selector.versionAttach.children, function(child) {
                           var childPos = domGeometry.position(child);
                           selectorW += childPos.w;
                        });
                        selectorW+=22;

                        var minLeft = (bodyPos.w - selectorW) - 8;
                        var left = Math.min(pos.x, minLeft);
                        dojo.style(this.selector.versionAttach,  {
                            position: "absolute",
                            top: pos.y + "px",
                            left: left + "px"
                        });

                        if (_this.selector.versionSelect && _this.selector.versionSelect.dropDown){
                            var dropDown = _this.selector.versionSelect.dropDown;
                            if (dropDown.focusNode){
                                dropDown.focusNode.focus();
                            }
                        }

                        //connect to the rest select change
                        on(_this.selector.versionSelect, "add", function(value) {
                            if (value) {
                                self.addVersion(value, item, tagAttach);
                            }
                        });

                        on(_this.selector.versionSelect, "remove", function(value) {
                            self.removeVersion(value, item, tagAttach);
                        });

                        // Set a time threshold to hide version selector if it is clicked again.
                        // Mainly to help out tests so that the version selection dialog does not
                        // disappear.
                        var timeOutHide = false;
                        setTimeout(function(){
                            timeOutHide = true;
                        }, 300);

                        if (_this.selector.latest) {
                            on(_this.selector.latest, "click", function(e) {
                                self.addLatestVersion(bootstrap.restUrl+"deploy/component/"+
                                        item.id+"/latestVersionByEnvironment/"+
                                        self.environment.id, item, tagAttach);
                                if(_this.selector && timeOutHide) {
                                    self.displayVersions();
                                    _this.selector.destroy();
                                }
                            });
                        }

                        on(this.selector, "click", function(e) {
                            if (_this.selector && !_this.selector.versionSelect.focused && !_this.selector.extraSelect.focused && timeOutHide) {
                                self.displayVersions();
                                _this.selector.destroy();
                            }
                        });

                        on(this.selector, "blur", function(e) {
                            if(_this.selector && timeOutHide) {
                                self.displayVersions();
                                _this.selector.destroy();
                            }
                        });
                    }));

                    return result;
                }
            }];

            self.grid = new TreeTable({
                url: gridRestUrl,
                serverSideProcessing: false,
                columns: gridLayout,
                noDataMessage: noDataMessage,
                hidePagination: false,
                hideFooterLinks: true,
                hideExpandCollapse: true
            });

            self.grid.placeAt(self.gridAttach);
        },

        addLatestWithStatusAtExecutionTime: function(status) {
            var self = this;
            self.addAllVersionSelectors("latestWithStatus/" + status);
        },

        addCurrentInventoryAtExecutionTime: function() {
            var self = this;
            self.addAllVersionSelectors("allInEnvironment/");
        },

        addLatestVersionsAtExecutionTime: function() {
            var self = this;
            self.addAllVersionSelectors("latestVersion/");
        },

        addAllVersionSelectors: function(selector) {
            var self = this;
            array.forEach(self.grid.cachedData, function(item) {
                self.addVersionSelector(selector, item, self._getTagAttachElement(item.id));
            });
            self.displayVersions();
        },

        /* Adds a version selector to the map, listens for delete. will wipe out other versions/version selectors for this component
         * versionSelector - the version selector to be added. String
         * compItem  - the component object that hte selector is being added to
         * attach - the HTML element to place the new selector display tag
         */
        addVersionSelector: function(versionSelector, compItem, attach) {
            var self = this;
            if (versionSelector) {
                self.componentVersionsMap[compItem.id] = [];
                self.versionSelectorMap[compItem.id] = versionSelector;
                self._changeCount();
            }
        },

        /* Adds a version to the componentVersionsMap, increments the count, listens for delete
         * versionItem  the version object
         * compItem     the component object that the version is being added to
         * attach       the HTML element to place the new version display tag
         */
        addVersion: function(versionItem, compItem, attach) {
            var self = this,
            match,
            startDateComparator;

            if (versionItem) {
                self.versionSelectorMap[compItem.id] = undefined;
                //add tag
                match = array.some(self.componentVersionsMap[compItem.id], function(version) {
                    return version.id === versionItem.id;
                });
                if (!match) {
                    self.componentVersionsMap[compItem.id].push(versionItem);
                }

                self._changeCount();
            }
        },

        removeVersion: function(versionItem, compItem, attach) {
            var self = this,
            match,
            startDateComparator;

            if (versionItem) {
                var indexToDelete = self.componentVersionsMap[compItem.id].indexOf(versionItem);
                self.componentVersionsMap[compItem.id].splice(indexToDelete, 1);
                self._changeCount();
            }
        },

        displayVersion: function(versionData, compId, attach) {
            var self = this;
            var versionDisplay = new VersionDisplay({
                version: versionData,
                readOnly: false,
                onDelete: function(div) {
                    if (self.versionSelectorMap !== undefined) {
                        self.componentVersionsMap[compId] = array.filter(self.componentVersionsMap[compId], function(version) {
                            return version.id !== versionDisplay.version.id;
                        });
                    }
                    else {
                        self.versionSelectorMap = undefined;
                    }
                    self.versionDisplays[compId] = array.filter(self.versionDisplays[compId], function(display) {
                        return display.version.id !== versionDisplay.version.id;
                    });
                    versionDisplay.destroy();
                    self._changeCount();
                }
            });
            versionDisplay.placeAt(attach, "last");
            self.versionDisplays[compId].push(versionDisplay);
            attach.source.setItem(versionDisplay.id, {"type": ["text"]});
        },

        getDisplayNameForVersionSelector: function(selector) {
            var result = selector;
            if (selector === "latestVersion/") {
               result = "Latest Version";
            }
            else if (selector.substring(0, "latestWithStatus/".length) === "latestWithStatus/") {
               result = "Latest With Status " + selector.substring(selector.indexOf("/")+1);
            }
            else if (selector.substring(0, "allInEnvironment/".length) === "allInEnvironment/") {
               result = "Environment Inventory " + selector.substring(selector.indexOf("/")+1);
            }
            return result;
        },

        displayVersions: function() {
            var self = this;
            var componentId,
            attach;

            var createVersionDisplayForComp = function(versionData) {
                self.displayVersion(versionData, componentId, attach);
            };
            for (componentId in self.componentVersionsMap) {
                if (self.componentVersionsMap.hasOwnProperty(componentId)) {
                    attach = self._getTagAttachElement(componentId);
                    if (attach) {
                        self.clearDisplays(componentId);
                        array.forEach(self.componentVersionsMap[componentId], createVersionDisplayForComp);
                        if (self.versionSelectorMap[componentId] !== undefined) {
                            var displayObj = {
                               "name": self.getDisplayNameForVersionSelector(self.versionSelectorMap[componentId]),
                               "id": componentId + "-" + self.versionSelectorMap[componentId]
                            };
                            self.displayVersion(displayObj, componentId, attach);
                        }
                    }
                }
            }
        },

        /* adds the latest version of a component (calls addVersion)
         * compItem         the component object to add the latest version to
         * attach           HTML element to place the new version display tag
         *
         */
        addLatestVersions: function(/* String */ latestVersionsUrl) {
            var self = this;

            array.forEach(self.grid.cachedData, function(item) {
                self.removeAllVersions(item.id);
            });

            xhr.get({
                url: latestVersionsUrl,
                handleAs: "json",
                load: function(data) {
                    if (data) {
                        array.forEach(self.grid.cachedData, function(item) {
                            array.forEach(data, function(versionItem) {
                                if (versionItem.component.id === item.id) {
                                    self.addVersion(versionItem, item, self._getTagAttachElement(item.id));
                                }
                            });
                        });
                        self.displayVersions();
                    }
                }
            });
        },

        addLatestVersion: function(latestUrl, compItem, attach) {
            var self = this;
            xhr.get({
                url: latestUrl,
                handleAs: "json",
                load: function(data) {
                    if (data) {
                        self.addVersion(data, compItem, attach);
                        self.displayVersions();
                    }
                }
            });
        },

        addCurrentInventory: function(compItem, attach, readOnly, versionArray) {
            var self = this;
            var versions = versionArray || compItem.desiredVersions;

            if ((!versions || (versions.length < 1)) && readOnly) {
                attach.innerHTML = i18n("None");
            }
            else if (versions && readOnly) {
                var versions2Display = versions.length > 5 ? versions.slice(0, 5) : versions;
                array.forEach(versions2Display, function(version) {
                    var versionDisplay = new VersionDisplay({
                        version: version,
                        readOnly: readOnly
                    });
                    versionDisplay.placeAt(attach);
                });
                if (versions.length > 5) {
                    var moreNumber = versions.length - 5;
                    var moreLink = domConstruct.create("a", {
                        "innerHTML": i18n("(+ %s more)", moreNumber),
                        "title": i18n("Click to view all"),
                        "class": "inlineBlock linkPointer"
                    }, attach);
                    on(moreLink, "click", function() {
                        var versionDialog = new Dialog({
                            closable: true,
                            draggable: true
                        });
                        var hideDialog = function() {
                            if (versionDialog) {
                                versionDialog.hide();
                            }
                        };

                        var dialogTitle = domConstruct.create("span", {
                            innerHTML: i18n("Current Environment Inventory For %s", compItem.name.escape()) + "&nbsp;"
                        }, versionDialog.titleNode);
                        var gridLayout = [ {
                            name: i18n("Version"),
                            formatter: function(item) {
                                return item.name.escape();
                            }
                        }];

                        var componentInventoryTable = new TreeTable({
                            getData: function() {
                                return versions;
                            },
                            serverSideProcessing: false,
                            hideExpandCollapse: true,
                            hideFooterLinks: true,
                            hidePagination: false,
                            columns: gridLayout
                        });
                        componentInventoryTable.placeAt(versionDialog.containerNode);

                        var closeButton = new Button({
                            label: i18n("Close"),
                            onClick: hideDialog
                        }).placeAt(versionDialog.containerNode, "last");
                        domClass.add(closeButton.domNode, "underField");
                        versionDialog.show();
                    });
                }
            }
            else if (versions) {
                array.forEach(versions, function(version) {
                    self.addVersion(version, compItem, attach);
                });
                self.displayVersions();
            }
        },

        removeAllVersions: function(compId) {
            var self = this;
            var tagAttachElement = self._getTagAttachElement(compId);
            if (tagAttachElement !== null) {
                domConstruct.empty(tagAttachElement);
            }
            self.componentVersionsMap[compId] = [];
            self.versionSelectorMap[compId] = undefined;
            self.clearDisplays(compId);
            this._changeCount();
        },

        clearDisplays: function(compId) {
            var self = this;
            array.forEach(self.versionDisplays[compId], function(display) {
                display.destroy();
            });
            self.versionDisplays[compId] = [];
        },

        _changeCount: function() {
            var self = this;
            var count = 0;
            if (self.grid) {
                array.forEach(self.grid.cachedData, function (item) {
                    if (self.componentVersionsMap.hasOwnProperty(item.id)) {
                        count += self.componentVersionsMap[item.id].length;
                    }
                    if (self.versionSelectorMap[item.id] !== undefined) {
                        count++;
                    }
                });
            }
            this.count = count;
        },

        getCount: function() {
            if (!this.count) {
                this.count = 0;
            }
            return this.count;
        },

        _getValueAttr: function() {
            var self = this;
            var compVersionIdMap = {};

            // need a component id to list of version ids map, so filter out version objects to ids without
            // affecting the original map
            if (this.grid) {
                array.forEach(self.grid.cachedData, function (item) {
                    if (self.versionSelectorMap[item.id] !== undefined) {
                        compVersionIdMap[item.id] = self.versionSelectorMap[item.id];
                    }
                    else if (self.componentVersionsMap.hasOwnProperty(item.id)) {
                        compVersionIdMap[item.id] = array.map(self.componentVersionsMap[item.id], function (version) {
                            return version.id;
                        });
                    }
                });
            }

            return compVersionIdMap;
        },

        /**
         * A rushed bandage around the fact that this widget needs to defend again external dom
         * nodes having classes we're also using. want.
         *
         * Given a CSS selector, return the first dom node we find within this.domNode, or null if no results.
         */
        _getTagAttachElement: function(componentId) {
            var element = null;
            var queryResult = query(".tagAttach_"+componentId, this.domNode);
            if (queryResult.length > 0) {
                element = queryResult[0];
            }
            return element;
        }
    });
});

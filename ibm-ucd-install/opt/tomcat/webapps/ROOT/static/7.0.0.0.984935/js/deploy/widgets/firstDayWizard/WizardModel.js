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
/*global define, require, _ */
define([
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/array",
        "dojo/Stateful",
        "dojo/store/Memory",
        "dojo/store/Observable",
        "deploy/widgets/firstDayWizard/DataModel",
        "deploy/widgets/firstDayWizard/ApplicationModel"
        ],
function(
        declare,
        lang,
        array,
        Stateful,
        Memory,
        Observable,
        DataModel,
        ApplicationModel
) {
    /**
     * Data model for first-day wizard.
     */
    return declare([DataModel], {
        PageIds: {
                 CreateApplication: 0,
                 CreateTemplateBasedApplication: 1,
                 AddOrCreateComponents: 2,
                 AddOrCreateTemplatedBasedComponents: 3,
                 DefineProcesses: 4,
                 CreateEnvironments: 5,
                 CreateTemplateBasedEnvironment: 6,
                 AgentMapping: 7},
        PageNameById: {
                 0: 'About Applications',
                 1: 'About Applications',
                 2: 'Specify Components',
                 3: 'Specify Components',
                 4: 'Define Processes',
                 5: 'Create Environments',
                 6: 'Create Environments',
                 7: 'Mapping Components to Agents'},
        props: {
            sequenceNum: undefined,
            pageIds: undefined,
            pre_selectedPageIndex: undefined,
            selectedPageIndex: undefined,
            furthestEnabledPageIndex: undefined,
            application: undefined,
            components: undefined,
            selectedComponent: undefined,
            processes: undefined,
            processDesigns: undefined,
            selectedObjForProcess: undefined,
            selectedProcess: undefined,
            environments: undefined,
            selectedEnvironment: undefined,
            agentMapping: undefined,
            agentsTotal: undefined,
            pre_addAComponent: undefined,
            pre_selectAComponent: undefined,
            pre_addAProcess: undefined,
            pre_selectAProcess: undefined,
            pre_selectAComponentAnchor: undefined,
            pre_selectAnApplicationAnchor: undefined,
            pre_addAnEnvironment: undefined,
            pre_selectAnEnvironment: undefined,
            pre_setComponentName: undefined,
            pre_setProcessName: undefined,
            pre_setEnvironmentName: undefined,
            processDesignerSaveBtnState: 'disabled'
        },

        getUniqId: function() {
            this.sequenceNum += 1;
            return this.sequenceNum;
        },

        addObj: function(objType, tmpl, selected, parentObjId, parentObjType) {
            var storageName = objType + "s";
            if (objType === "process") {
                storageName = "processes";
            }

            var newId = this.getUniqId();
            var obj;
            if (objType === "component") {
                obj = new DataModel({props: {id: newId,
                                            useVfs: true,
                                            template: tmpl}});
            } else if (objType === "process") {
                var props = {id: newId,
                             useDesigner: true,
                             parentObjId: parentObjId,
                             parentObjType: parentObjType};
                if (parentObjType === "component") {
                    props.defaultWorkingDir = "${p:resource/work.dir}/${p:component.name}";
                }
                obj = new DataModel({props:props});
            } else if (objType === "environment") {
                obj = new DataModel({props: {id: newId,
                                             color:"#00B2EF",
                                             template: tmpl,
                                             expanded: false,
                                             children: []}});
            }

            this[storageName].put(obj);
            if (selected) {
                this.setSelectedObj(objType, obj);
            }
            return obj;
        },

        removeObj: function(objType, obj) {
            var storageName = objType + "s";
            if (objType === "process") {
                storageName = "processes";
            }

            this[storageName].remove(obj.id);
        },

        setSelectedObj: function(objType, obj) {
            var storageName = objType + "s";
            if (objType === "process") {
                storageName = "processes";
            }

            this[storageName].query().forEach(function(o) {
                if (obj.id === o.id) {
                    o.set("selected", true);
                } else {
                    o.set("selected", false);
                }
            });
        },

        getSelectedObj: function(objType) {
            var storageName = objType + "s";
            if (objType === "process") {
                storageName = "processes";
            }

            var selected = this[storageName].query({selected: true});
            if (selected && selected.length > 0) {
                return selected[0];
            }
            return null;
        },

        getObjById: function(objType, id) {
            var storageName = objType + "s";
            if (objType === "process") {
                storageName = "processes";
            }

            return this[storageName].get(id);
        },

        getFirstComponent:function() {
            var firstComponent;
            if (this.components.query().length > 0) {
                firstComponent = this.components.query()[0];
            }
            return firstComponent;
        },

        getComponentProcesses:function(comp) {
            return this.processes.query().filter(function(proc) {
                return (proc.parentObjType === "component") && (proc.parentObjId === comp.id);
            });
        },

        getAllComponentProcesses: function() {
            return this.processes.query().filter(function(proc) {
                return proc.parentObjType === "component";
            });
        },

        getAllApplicationProcesses: function() {
            return this.processes.query().filter(function(proc) {
                return proc.parentObjType === "application";
            });
        },

        /**
         * @returns {Array} component list with attributes injected to feed
         *                  application process navigation menu
         */
        getComponentsForApplicationProcessNav: function() {
            var comps = [];
            this.components.query().forEach(function(com) {
                var comp = _.clone(com);
                comp.hasChildren = true;
                comp.type = "folder";
                comps.push(comp);
            });
            return comps;
        },

        /**
         * Given comp, find all processes related to the comp,
         * injecting attributes to make it similar to what you get from server
         */
        getComponentProcessesForDesigner: function(comp) {
            var results = [];
            this.processes.query().filter(function(proc) {
                if ((proc.parentObjType === "component") && (proc.parentObjId === comp.id) && !proc.props.takesVersion) {
                    var result = _.clone(proc);
                    result.type = "componentProcess";
                    result.component = comp;
                    results.push(result);
                }
            });
            return results;
        },

        isEveryComponentHasAProcess: function() {
            var ret = true;
            var self = this;
            var i;
            for (i = 0; i < this.components.query().length; i++) {
                var com = this.components.query()[i];
                var processesForCom = self.getComponentProcesses(com);
                if (!processesForCom || processesForCom.length === 0) {
                    ret = false;
                    break;
                }
            }
            return ret;
        },

        unSelectAllObjs: function(objType) {
            var storageName = objType + "s";
            if (objType === "process") {
                storageName = "processes";
            }

            this[storageName].query({selected: true}).forEach(function(obj) {
                obj.set("selected", false);
            });
        },

        saveProcessDesign: function(objType, process, data) {
            if (!this.processDesigns) {
                this.processDesigns = [];
            }
            var processDesign = data;
            processDesign.parentObjType = objType;
            processDesign.parentObjId = process.id;
            var savedDesign = this.getProcessDesign(objType, process);
            if (savedDesign) {
                var idx = this.processDesigns.indexOf(savedDesign);
                this.processDesigns[idx] = processDesign;
            } else {
                this.processDesigns.push(processDesign);
            }
        },

        getProcessDesign: function(objType, process) {
            var design;
            var designs = array.filter(this.processDesigns, function(processDesign) {
                return ( (processDesign.parentObjType === objType) &&
                         (processDesign.parentObjId === process.id) );
            });
            if (designs.length > 0) {
                design = designs[0];
            }
            return design;
        },

        removeProcessDesign: function(processDesign) {
            var idx = this.processDesigns.indexOf(processDesign);
            if (idx > -1) {
                this.processDesigns.splice(idx, 1);
            }
        },

        getPostData: function() {
            var postData;
            postData = {application: this.applicationSerializer(),
                        components: this.getComponentsPostData(),
                        componentProcesses: this.componentProcessesSerializer(),
                        componentProcessDesigns: this.componentProcessDesignsSerializer(),
                        applicationProcesses: this.applicationProcessesSerializer(),
                        applicationProcessDesigns: this.applicationProcessDesignsSerializer(),
                        environments: this.environmentsSerializer(),
                        agentMapping: {}
                       };
            return postData;
        },

        applicationDeserializer: function(val) {
            var app = new ApplicationModel({});
            app.deserialize(val);
            this.set('application', app);
        },

        applicationSerializer: function() {
            var app = "";
            if (this.application) {
                app = this.application.serialize();
            }
            return app;
        },

        componentsDeserializer: function(val) {
            this.set('components', new Observable(new Memory({
                data: val.map(function(com) {
                           return new DataModel({props: com});
                      })
            })));
        },

        componentsSerializer: function() {
            var components = [];
            if (this.components) {
                this.components.query().forEach(function(com) {
                    components.push(com.serialize());
                });
            }
            return components;
        },

        getComponentsPostData: function() {
            var components = [];
            if (this.components) {
                this.components.query().forEach(function(com) {
                    var comp = com.serialize();
                    delete comp.existingId;
                    components.push(comp);
                });
            }
            return components;
        },

        processesDeserializer: function(val) {
            this.set('processes', new Observable(new Memory({
                data: val.map(function(proc) {
                           return new DataModel({props: proc});
                      })
            })));
        },

        processesSerializer: function() {
            var processes = [];
            if (this.processes) {
                this.processes.query().forEach(function(proc) {
                    processes.push(proc.serialize());
                });
            }
            return processes;
        },

        componentProcessesSerializer: function() {
            var processes = [];
            this.processes.query().forEach(function(proc) {
                if (proc.parentObjType === "component") {
                    processes.push(proc.serialize());
                }
            });
            return processes;
        },

        applicationProcessesSerializer: function() {
            var processes = [];
            this.processes.query().forEach(function(proc) {
                if (proc.parentObjType === "application") {
                    processes.push(proc.serialize());
                }
            });
            return processes;
        },

        processDesignsDeserializer: function(val) {
            this.set('processDesigns', val);
        },

        processDesignsSerializer: function() {
            return this.processDesigns;
        },

        componentProcessDesignsSerializer: function() {
            var designs = [];
            array.forEach(this.processDesigns, function(processDesign) {
                if (processDesign.parentObjType === 'component') {
                    designs.push(processDesign);
                }
            });
            return designs;
        },

        applicationProcessDesignsSerializer: function() {
            var designs = [];
            array.forEach(this.processDesigns, function(processDesign) {
                if (processDesign.parentObjType === 'application') {
                    designs.push(processDesign);
                }
            });
            return designs;
        },

        environmentsDeserializer: function(val) {
            this.set('environments', new Observable(new Memory({
                data: val.map(function(env) {
                           return new DataModel({props: env});
                      })
            })));
        },

        environmentsSerializer: function() {
            var environments = [];
            if (this.environments) {
                this.environments.query().forEach(function(env) {
                    environments.push(env.serialize());
                });
            }
            return environments;
        }
    });
});

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
import groovy.sql.Sql
import com.urbancode.ds.upgrade.upgrade602.Action602
import java.util.List
import java.util.ArrayList
import java.util.Map
import java.util.HashMap

def connection = this.binding['CONN']
def sql = new Sql(connection)


def executeQueries(def sql, def actionList, def writeActionId) {
    //insert new actions with their category
    def insertActionQuery = "insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category) values (?, 0, ?, ?, 'Y', 'Y', ?, ?)"
    //select edit action permissions for the correct resource type
    def roleActionSelectQuery = "select version, sec_role_id, sec_resource_role_id from sec_role_action where sec_action_id=?"
    //grant permissions for edit sub-actions to users who already have edit access
    def roleActionInsertQuery = "insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values (?, ?, ?, ?, ?)"
    for (action in actionList) {
        sql.execute(insertActionQuery, [action.actionId, action.name, action.description, action.typeId, action.category])
    }
    
    sql.eachRow(roleActionSelectQuery, [writeActionId]) { row ->
        for (action in actionList) {
            def uuid = UUID.randomUUID().toString()
            sql.execute(roleActionInsertQuery, [uuid, row.version, row.sec_role_id, action.actionId, row.sec_resource_role_id])
        }
    }
    
    def deleteRoleActionQuery = "delete from sec_role_action where sec_action_id=?"
    def deleteActionQuery = "delete from sec_action where id=?"
    sql.execute(deleteRoleActionQuery, [writeActionId])
    sql.execute(deleteActionQuery, [writeActionId])
}

def addEditCategory(def sql, String actionId) {
    def query = "update sec_action set category='Edit' where id=?"
    sql.execute(query, [actionId])
}

//--- Agents
def agentTypeId = "20000000000000000000000000000106"
def agentActions = []
agentActions << new Action602("20000000000000000000000000110003", "Add to Agent Pool", "Add agents to agent pools.", agentTypeId, "Edit")
agentActions << new Action602("20000000000000000000000000110004", "Create Resources", "Create resources that are children of agents.", agentTypeId, "Edit")
agentActions << new Action602("20000000000000000000000000110005", "Delete", "Delete agents.", agentTypeId, "Edit")
agentActions << new Action602("20000000000000000000000000110006", "Edit Basic Settings", "Edit basic settings for agents.", agentTypeId, "Edit")
agentActions << new Action602("20000000000000000000000000110007", "Manage Impersonation", "Manage impersonation settings for agents.", agentTypeId, "Edit")
agentActions << new Action602("20000000000000000000000000110008", "Manage Properties", "Manage properties for agents.", agentTypeId, "Edit")
agentActions << new Action602("20000000000000000000000000110009", "Manage Teams", "Manage teams for agents.", agentTypeId, "Edit")
agentActions << new Action602("2000000000000000000000000011000a", "Manage Version Imports", "Manage which agents import component versions.", agentTypeId, "Edit")

def agentWriteActionId = "20000000000000000000000000110002"
executeQueries(sql, agentActions, agentWriteActionId)

//--- Agent Pools
def agentPoolTypeId = "20000000000000000000000000000107"
def agentPoolActions = []
agentPoolActions << new Action602("20000000000000000000000000120004", "Create Resources", "Create resources that are children of agent pools.", agentPoolTypeId, "Edit")
agentPoolActions << new Action602("20000000000000000000000000120005", "Delete", "Delete agent pools.", agentPoolTypeId, "Edit")
agentPoolActions << new Action602("20000000000000000000000000120006", "Edit Basic Settings", "Edit basic settings for agent pools.", agentPoolTypeId, "Edit")
agentPoolActions << new Action602("20000000000000000000000000120007", "Manage Pool Members", "Add or remove agents from the agent pool.", agentPoolTypeId, "Edit")
agentPoolActions << new Action602("20000000000000000000000000120008", "Manage Teams", "Manage teams for agent pools.", agentPoolTypeId, "Edit")

def agentPoolWriteActionId = "20000000000000000000000000120003"
executeQueries(sql, agentPoolActions, agentPoolWriteActionId)

//--- Applications
def applicationTypeId = "20000000000000000000000000000100"
def applicationActions = []
applicationActions << new Action602("20000000000000000000000000130006", "Delete", "Delete applications.", applicationTypeId, "Edit")
applicationActions << new Action602("20000000000000000000000000130007", "Edit Basic Settings", "Edit basic settings for applications.", applicationTypeId, "Edit")
applicationActions << new Action602("20000000000000000000000000130008", "Manage Blueprints", "Manage blueprints for applications.", applicationTypeId, "Edit")
applicationActions << new Action602("20000000000000000000000000130009", "Manage Components", "Add components to applications or remove them.", applicationTypeId, "Edit")
applicationActions << new Action602("2000000000000000000000000013000a", "Manage Environments", "Create and delete environments for applications.", applicationTypeId, "Edit")
applicationActions << new Action602("2000000000000000000000000013000b", "Manage Processes", "Manage application processes.", applicationTypeId, "Edit")
applicationActions << new Action602("2000000000000000000000000013000c", "Manage Properties", "Manage properties for applications.", applicationTypeId, "Edit")
applicationActions << new Action602("2000000000000000000000000013000d", "Manage Teams", "Manage teams for applications.", applicationTypeId, "Edit")

def applicationWriteActionId = "20000000000000000000000000130003"
executeQueries(sql, applicationActions, applicationWriteActionId)

//update Run Component Processes and Manage Snapshot actions
addEditCategory(sql, '20000000000000000000000000130004')
addEditCategory(sql, '20000000000000000000000000130005')

//--- Cloud Connections
def cloudConnectionTypeId = "20000000000000000000000000000111"
def cloudConnectionActions = []
cloudConnectionActions << new Action602("200000000000000000000000001d0007", "Delete", "Delete cloud connections.", cloudConnectionTypeId, "Edit")
cloudConnectionActions << new Action602("200000000000000000000000001d0008", "Edit Basic Settings", "Edit basic settings for cloud connections.", cloudConnectionTypeId, "Edit")
cloudConnectionActions << new Action602("200000000000000000000000001d0009", "Manage Teams", "Manage teams for cloud connections.", cloudConnectionTypeId, "Edit")

def cloudConnectionWriteActionId = "200000000000000000000000001d0006"
executeQueries(sql, cloudConnectionActions, cloudConnectionWriteActionId)

//--- Components
def componentTypeId = "20000000000000000000000000000101"
def componentActions = []
componentActions << new Action602("20000000000000000000000000140005", "Delete", "Delete components.", componentTypeId, "Edit")
componentActions << new Action602("20000000000000000000000000140006", "Edit Basic Settings", "Edit basic settings for components.", componentTypeId, "Edit")
componentActions << new Action602("20000000000000000000000000140007", "Manage Configuration Templates", "Install and manage configuration templates for components.", componentTypeId, "Edit")
componentActions << new Action602("20000000000000000000000000140008", "Manage Processes", "Manage component processes.", componentTypeId, "Edit")
componentActions << new Action602("20000000000000000000000000140009", "Manage Properties", "Manage properties for components.", componentTypeId, "Edit")
componentActions << new Action602("2000000000000000000000000014000a", "Manage Teams", "Manage teams for components.", componentTypeId, "Edit")

def componentWriteActionId = "20000000000000000000000000140003"
executeQueries(sql, componentActions, componentWriteActionId)

//update Manage Versions action
addEditCategory(sql, '20000000000000000000000000140004')

//--- Component Templates
def componentTemplateTypeId = "20000000000000000000000000000102"
def componentTemplateActions = []
componentTemplateActions << new Action602("20000000000000000000000000150004", "Delete", "Delete component templates.", componentTemplateTypeId, "Edit")
componentTemplateActions << new Action602("20000000000000000000000000150005", "Edit Basic Settings", "Edit basic settings for component templates.", componentTemplateTypeId, "Edit")
componentTemplateActions << new Action602("20000000000000000000000000150006", "Manage Processes", "Manage component template processes.", componentTemplateTypeId, "Edit")
componentTemplateActions << new Action602("20000000000000000000000000150007", "Manage Properties", "Manage component template properties.", componentTemplateTypeId, "Edit")
componentTemplateActions << new Action602("20000000000000000000000000150008", "Manage Teams", "Manage component template teams.", componentTemplateTypeId, "Edit")

def componentTemplateWriteActionId = "20000000000000000000000000150003"
executeQueries(sql, componentTemplateActions, componentTemplateWriteActionId)

//--- Environments
def environmentTypeId = "20000000000000000000000000000103"
def environmentActions = []
environmentActions << new Action602("20000000000000000000000000160005", "Delete", "Delete environment.", environmentTypeId, "Edit")
environmentActions << new Action602("20000000000000000000000000160006", "Edit Basic Settings", "Edit basic settings for environments.", environmentTypeId, "Edit")
environmentActions << new Action602("20000000000000000000000000160007", "Manage Approval Processes", "Manage approval processes for environments.", environmentTypeId, "Edit")
environmentActions << new Action602("20000000000000000000000000160008", "Manage Base Resources", "Add and remove base resources from environments.", environmentTypeId, "Edit")
environmentActions << new Action602("20000000000000000000000000160009", "Manage Properties", "Manage properties for environments.", environmentTypeId, "Edit")
environmentActions << new Action602("2000000000000000000000000016000a", "Manage Teams", "Manage teams for environments.", environmentTypeId, "Edit")

def environmentWriteActionId = "20000000000000000000000000160003"
executeQueries(sql, environmentActions, environmentWriteActionId)

//--- Processes
def processTypeId = "20000000000000000000000000000109"
def processActions = []
processActions << new Action602("20000000000000000000000000180005", "Delete", "Delete generic processes.", processTypeId, "Edit")
processActions << new Action602("20000000000000000000000000180006", "Edit Basic Settings", "Edit basic settings and workflows for generic processes.", processTypeId, "Edit")
processActions << new Action602("20000000000000000000000000180007", "Manage Properties", "Manage generic process properties.", processTypeId, "Edit")
processActions << new Action602("20000000000000000000000000180008", "Manage Teams", "Manage teams for generic processes.", processTypeId, "Edit")

def processWriteActionId = "20000000000000000000000000180003"
executeQueries(sql, processActions, processWriteActionId)

//--- Resources
def resourceTypeId = "20000000000000000000000000000104"
def resourceActions = []
resourceActions << new Action602("20000000000000000000000000190005", "Delete", "Delete resources.", resourceTypeId, "Edit")
resourceActions << new Action602("20000000000000000000000000190006", "Edit Basic Settings", "Edit basic settings for resources.", resourceTypeId, "Edit")
resourceActions << new Action602("20000000000000000000000000190007", "Manage Children", "Manage settings of child resources.", resourceTypeId, "Edit")
resourceActions << new Action602("20000000000000000000000000190008", "Manage Impersonation", "Manage impersonation settings for resources.", resourceTypeId, "Edit")
resourceActions << new Action602("20000000000000000000000000190009", "Manage Properties", "Manage properties for resources.", resourceTypeId, "Edit")
resourceActions << new Action602("2000000000000000000000000019000a", "Manage Teams", "Manage teams for resources.", resourceTypeId, "Edit")

def resourceWriteActionId = "20000000000000000000000000190003"
executeQueries(sql, resourceActions, resourceWriteActionId)

//--- Resource Templates
def resourceTemplateTypeId = "20000000000000000000000000000110"
def resourceTemplateActions = []
resourceTemplateActions << new Action602("200000000000000000000000001d000a", "Delete", "Delete resource templates.", resourceTemplateTypeId, "Edit")
resourceTemplateActions << new Action602("200000000000000000000000001d000b", "Edit Basic Settings", "Edit basic settings for resource templates.", resourceTemplateTypeId, "Edit")
resourceTemplateActions << new Action602("200000000000000000000000001d000c", "Manage Resources", "Add and remove resources from resource templates.", resourceTemplateTypeId, "Edit")
resourceTemplateActions << new Action602("200000000000000000000000001d000d", "Manage Teams", "Manage teams for resource templates.", resourceTemplateTypeId, "Edit")

def resourceTemplateWriteActionId = "200000000000000000000000001d0003"
executeQueries(sql, resourceTemplateActions, resourceTemplateWriteActionId)

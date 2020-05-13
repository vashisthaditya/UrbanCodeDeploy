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

def connection = this.binding['CONN']
def sql = new Sql(connection)

def LICENSE_RESOURCE_TYPE_ID = '20000000000000000000000000000108'

/** Get needed ids **/
def getAllResources = '''
    select id
    from sec_resource
    where sec_resource_type_id = '20000000000000000000000000000108'
'''

def getAllActions = '''
    select id
    from sec_action
    where sec_resource_type_id = '20000000000000000000000000000108'
'''

/** delete sqls **/
def deleteResForTeam = '''
    delete from sec_resource_for_team
    where sec_resource_id = ?
'''

def deleteRoleAction = '''
    delete from sec_role_action
    where sec_action_id = ?
'''

def deleteAction = '''
    delete from sec_action
    where sec_resource_type_id = ?
'''

def deleteResource = '''
    delete from sec_resource
    where sec_resource_type_id = ?
'''

def deleteResourceRole = '''
    delete from sec_resource_role
    where sec_resource_type_id = ?
'''

def deleteResourceType = '''
    delete from sec_resource_type
    where id = ?
'''

def dropResColumn = '''
    alter table ds_license
    drop column sec_resource_id
'''

sql.eachRow(getAllResources) { it ->
    def resourceId = it['id']
    sql.executeUpdate(deleteResForTeam, [resourceId])
}
sql.executeUpdate(deleteResource, [LICENSE_RESOURCE_TYPE_ID])

sql.eachRow(getAllActions) { it ->
    def actionId = it['id']
    sql.executeUpdate(deleteRoleAction, [actionId])
}
sql.executeUpdate(deleteAction, [LICENSE_RESOURCE_TYPE_ID])
sql.executeUpdate(deleteResourceRole, [LICENSE_RESOURCE_TYPE_ID])

sql.executeUpdate(deleteResourceType, [LICENSE_RESOURCE_TYPE_ID])

sql.executeUpdate(dropResColumn)

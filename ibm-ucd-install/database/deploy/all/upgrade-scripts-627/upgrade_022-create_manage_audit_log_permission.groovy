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

def connection = this.binding['CONN'];
def sql = new Sql(connection)

def createViewAuditLogPermissionSQL = '''
    insert into sec_action(id, version, name, description, enabled, cascading, sec_resource_type_id, category)
    values ('200000000000000000000000001b0013', 0, 'View Audit Log', 'View the audit log', 'Y', 'Y', '20000000000000000000000000000201', null)
'''

def createManageAuditLogPermissionSQL = '''
    insert into sec_action(id, version, name, description, enabled, cascading, sec_resource_type_id, category)
    values ('200000000000000000000000001b0014', 0, 'Manage Audit Log', 'Manage audit log configuration and cleanup', 'Y', 'Y', '20000000000000000000000000000201', null)
'''

def getSettingsTabRolesSQL = '''
    select sec_role_id
    from sec_role_action
    where sec_action_id = '200000000000000000000000001c0006'
'''

def addActionSQL = '''
    insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id)
    values (?, 0, ?, ?, ?)
'''

// Gets the roles that have settings tab permissions
def getRoleIds = { ->
    List<String> roles = new ArrayList<String>()
    sql.eachRow(getSettingsTabRolesSQL) { row ->
        roles.add(row.sec_role_id)
    }

    return roles
}

sql.execute(createViewAuditLogPermissionSQL)
sql.execute(createManageAuditLogPermissionSQL)

List<String> roles = getRoleIds()

for (String role : roles) {
    sql.execute(addActionSQL, UUID.randomUUID().toString(), role, '200000000000000000000000001b0013', null)
    sql.execute(addActionSQL, UUID.randomUUID().toString(), role, '200000000000000000000000001b0014', null)
}
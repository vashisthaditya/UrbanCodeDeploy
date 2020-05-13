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

def createDeleteSnapshotsPermissionSQL = '''
    insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
    values ('2000000000000000000000000013000f', 0, 'Delete Snapshots', 'Delete snapshots for applications.', 'Y', 'Y', '20000000000000000000000000000100', 'Edit')
'''

def getRolesAndTypesThatHaveManageSnapshotsPermissions = '''
    select sec_role_id, sec_resource_role_id
    from sec_role_action
    where sec_action_id = '20000000000000000000000000130005'
'''

def addActionSQL = '''
    insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id)
    values (?, 0, ?, ?, ?)
'''

// Gets the roles and the types the roles have manage snapshots permission on.
def getRoleAndTypeIds = { ->
    Map<String, List<String>> roles = new HashMap<String, List<String>>();
    sql.eachRow(getRolesAndTypesThatHaveManageSnapshotsPermissions) { row ->
        def role = row.sec_role_id
        def type = row.sec_resource_role_id
        List<String> types = roles.get(role);
        if (types == null) {
            types = new ArrayList<String>();
            roles.put(role, types);
        }
        types.add(type);
    }

    return roles
}

sql.execute(createDeleteSnapshotsPermissionSQL)

Map<String, List<String>> roles = getRoleAndTypeIds()

for (String role : roles.keySet()) {
    for (String type : roles.get(role)) {
        sql.execute(addActionSQL, UUID.randomUUID().toString(), role, '2000000000000000000000000013000f', type)
    }
}
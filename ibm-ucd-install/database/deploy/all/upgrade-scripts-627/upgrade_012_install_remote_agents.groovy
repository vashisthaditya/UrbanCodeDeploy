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

def createInstallRemoteAgentsPermissionSQL = '''
    insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
    values ('2000000000000000000000000011000d', 0, 'Install Remote Agents', 'Allow Installing of agents via SSH.', 'Y', 'Y', '20000000000000000000000000000106', null)
'''

def getRelevantRolesSQL = '''
    select ra1.sec_role_id, ra1.sec_resource_role_id
    from sec_role_action ra1, sec_role_action ra2
    where ra1.sec_role_id = ra2.sec_role_id and
    ra1.sec_action_id = '20000000000000000000000000110004' and
    ra2.sec_action_id = '200000000000000000000000001c0006'
'''

def addActionSQL = '''
    insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id)
    values (?, 0, ?, ?, ?)
'''

// Gets the roles that have access to the settings tab and create resources
def getRoleIds = { ->
    HashMap<String, List<String>> roleIdsToResourceRoleId =
        new HashMap<String, List<String>>()
    sql.eachRow(getRelevantRolesSQL) { row ->
        List<String> resourceRoleIds = roleIdsToResourceRoleId.get(row.sec_role_id)
        if (resourceRoleIds == null) {
            resourceRoleIds = new ArrayList<String>()
            roleIdsToResourceRoleId.put(row.sec_role_id, resourceRoleIds)
        }
        resourceRoleIds.add(row.sec_resource_role_id)
    }
    return roleIdsToResourceRoleId
}

sql.execute(createInstallRemoteAgentsPermissionSQL)

HashMap<String, List<String>> roles = getRoleIds()

for (String role : roles.keySet()) {
    List<String> resourceRoleIds = roles.get(role)
    for (String resourceRoleId : resourceRoleIds) {
        sql.execute(addActionSQL, UUID.randomUUID().toString(), role, '2000000000000000000000000011000d', resourceRoleId)
    }
}

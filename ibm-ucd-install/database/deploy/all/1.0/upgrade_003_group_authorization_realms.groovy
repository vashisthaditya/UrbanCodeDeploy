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
import groovy.sql.Sql;
import java.util.UUID;

def connection = this.binding['CONN'];
def sql = new Sql(connection)

final String getEmptyGroups = '''
    select id
    from sec_group g
    where g.id not in (
        select sec_group_id
        from sec_user_to_group
        where sec_group_id = g.id
    )
'''

final String deleteGroupAssociations = '''
    delete from sec_group_role_on_resource
    where sec_group_id = ?
'''

final String deleteGroup = '''
    delete from sec_group
    where id = ?
'''

sql.eachRow(getEmptyGroups) { group ->
    def groupId = group['id']
    sql.executeUpdate(deleteGroupAssociations, [groupId])
    sql.executeUpdate(deleteGroup, [groupId])
}



final String getAllGroups = '''
    select * from sec_group
'''

final String getAuthorizationRealmsForGroup = '''
    select aor.id as id, aor.name as name
    from sec_authorization_realm aor
    where aor.id in (
        select distinct(ar.sec_authorization_realm_id) as id
        from sec_user u
            join sec_user_to_group u2g on u2g.sec_user_id = u.id
            join sec_group g on g.id = u2g.sec_group_id
            join sec_authentication_realm ar on ar.id = u.sec_authentication_realm_id
        where g.id = ?
    )
'''

final String updateGroupAuthorizationRealmId = '''
    update sec_group
    set sec_authorization_realm_id = ?
    where id = ?
'''

final String insertGroup = '''
    insert into sec_group
    (id, version, name, sec_authorization_realm_id, enabled)
    values
    (?, 0, ?, ?, ?)
'''

final String changeGroupMappings = '''
    update sec_user_to_group
    set sec_group_id = ?
    where sec_group_id = ?
        and sec_user_id in (
            select u.id
            from sec_user u
            join sec_authentication_realm aer on aer.id = u.sec_authentication_realm_id
            join sec_authorization_realm aor on aor.id = aer.sec_authorization_realm_id
            where aor.id = ?
        )
'''

final String getSourceRoleMappings = '''
    select *
    from sec_group_role_on_resource
    where sec_group_id = ?
'''

final String insertRoleMapping = '''
    insert into sec_group_role_on_resource
    (id, version, sec_group_id, sec_role_id, sec_resource_id)
    values
    (?, 0, ?, ?, ?)
'''

final String getDynamicRoles = '''
    select dr.*
    from sec_dynamic_role dr
    join sec_dynamic_role_prop drp on drp.sec_dynamic_role_id = dr.id
    where drp.name = 'groupId'
    and drp.value = ?
'''

final String getDynamicRoleActions = '''
    select dra.sec_action_id as action_id
    from sec_dynamic_role_to_action dra
    where dra.sec_dynamic_role_id = ?
'''

final String updateDynamicRoleNames = '''
    update sec_dynamic_role
    set name = ?
    where name = ?
'''

final String insertDynamicRole = '''
    insert into sec_dynamic_role
    (id, version, name, description, enabled, class_name, sec_resource_type_id)
    values
    (?, 0, ?, ?, ?, ?, ?)
'''

final String insertDynamicRoleProperty = '''
    insert into sec_dynamic_role_prop
    (sec_dynamic_role_id, name, value)
    values
    (?, ?, ?)
'''

final String insertDynamicRoleAction = '''
    insert into sec_dynamic_role_to_action
    (sec_dynamic_role_id, sec_action_id)
    values
    (?, ?)
'''


sql.eachRow(getAllGroups) { group ->
    def groupId = group['id']
    def groupName = group['name']
    def first = true;

    sql.eachRow(getAuthorizationRealmsForGroup, [groupId]) { authorizationRealm ->
        def authorizationRealmId = authorizationRealm['id']
        def authorizationRealmName = authorizationRealm['name']
        def newDynamicRoleName = 'Default permissions for '+groupName+' ('+authorizationRealmName+')'
        
        if (first) {
            sql.executeUpdate(updateGroupAuthorizationRealmId, [authorizationRealmId, groupId])
            
            def oldDynamicRoleName = 'Default permissions for '+groupName
            
            sql.executeUpdate(updateDynamicRoleNames, [oldDynamicRoleName, newDynamicRoleName])
        }
        else {
            def newGroupId = UUID.randomUUID().toString()
            def enabled = group['enabled']
            
            // Insert new group
            sql.executeUpdate(insertGroup, [newGroupId, groupName, authorizationRealmId, enabled])

            // Move users from this authorization realm to the new group; remove from old group
            sql.executeUpdate(changeGroupMappings, [newGroupId, groupId, authorizationRealmId])
            
            // Duplicate role mappings
            sql.eachRow(getSourceRoleMappings, [groupId]) { mapping ->
                def newMappingId = UUID.randomUUID().toString()
                def roleId = mapping['sec_role_id']
                def resourceId = mapping['sec_resource_id']
                
                sql.executeUpdate(insertRoleMapping, [newMappingId, newGroupId, roleId, resourceId])
            }
            
            // Duplicate dynamic roles
            sql.eachRow(getDynamicRoles, [groupId]) { dynamicRole ->
                def dynamicRoleId = dynamicRole['id']
                def newDynamicRoleId = UUID.randomUUID().toString()
                def dynamicRoleDescription = dynamicRole['description']
                def dynamicRoleEnabled = dynamicRole['enabled']
                def dynamicRoleClassName = dynamicRole['class_name']
                def dynamicRoleResourceType = dynamicRole['sec_resource_type_id']
                
                sql.executeUpdate(insertDynamicRole, [newDynamicRoleId, newDynamicRoleName,
                        dynamicRoleDescription, dynamicRoleEnabled, dynamicRoleClassName,
                        dynamicRoleResourceType])
                
                sql.executeUpdate(insertDynamicRoleProperty, [newDynamicRoleId, 'groupId',
                        newGroupId])

                sql.eachRow(getDynamicRoleActions, [dynamicRoleId]) { action ->
                    def actionId = action['action_id']
                    
                    sql.executeUpdate(insertDynamicRoleAction, [newDynamicRoleId, actionId])
                }
            }
        }
        first = false;
    }
}

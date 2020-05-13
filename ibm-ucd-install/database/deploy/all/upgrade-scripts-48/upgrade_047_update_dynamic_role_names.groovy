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

def groupSelect = '''select * from sec_group'''
def dynamicRoleNameUpdate = '''update sec_dynamic_role set name=? where id=?'''
def dynamicRolePropSelect = '''select * from sec_dynamic_role_prop'''

def groupList = [];
def dynamicRoleGroupIdsMap = [:]
def groupIdsMap = [:]

sql.eachRow(dynamicRolePropSelect) { rolePropRow ->
    if (rolePropRow['name'].equals('groupId')) {        
        dynamicRoleGroupIdsMap.put(rolePropRow['sec_dynamic_role_id'], rolePropRow['value'])
    }
}
sql.eachRow(groupSelect) { groupRow ->
    groupIdsMap.put(groupRow['id'], groupRow['name'])
}

dynamicRoleGroupIdsMap.each { role, group ->
    def roleName = "Default Permissions for " + groupIdsMap[group]
    
    sql.executeUpdate(dynamicRoleNameUpdate, [roleName, role])
}
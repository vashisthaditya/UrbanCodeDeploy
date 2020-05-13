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

def createNewViewPermission = '''
    insert into sec_action
      (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
    values
      ('200000000000000000000000001b0008', 0, 'View Basic System Settings', 'View basic system settings', 'Y', 'Y', '20000000000000000000000000000201', null)
'''

def deleteOldViewPermission = '''
    delete from
      sec_action
    where
      id = '200000000000000000000000001b0009'
'''

def getInvalidPermission = '''
    select
      1
    from
      sec_action
    where
      id = '200000000000000000000000001b000a'
'''

def updateViewPermissionMappings = '''
    update
      sec_role_action
    set
      sec_action_id = '200000000000000000000000001b0008'
    where
      sec_action_id = '200000000000000000000000001b0009'
'''

def shouldUpdate = false;
sql.eachRow(getInvalidPermission) { row ->
    // If we get any results we need to run update statements.
    shouldUpdate = true;
}

if (shouldUpdate) {
    sql.executeUpdate(createNewViewPermission);
    sql.executeUpdate(updateViewPermissionMappings);
    sql.executeUpdate(deleteOldViewPermission);
}
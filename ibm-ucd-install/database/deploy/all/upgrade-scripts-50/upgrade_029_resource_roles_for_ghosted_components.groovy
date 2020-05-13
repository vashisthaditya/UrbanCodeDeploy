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

def getAllComponents = '''
    select id, name, ghosted_date
    from ds_component
    where ghosted_date > 0
'''

def createResourceRole = '''
    insert into ds_resource_role
    (id, version, name, description, prop_sheet_def_id, component_id)
    values
    (?, 0, ?, '', ?, ?)
'''

def createPropSheetDef = '''
    insert into ps_prop_sheet_def
    (id, version, name, description, prop_sheet_group_id, template_handle, template_prop_sheet_def_id)
    values
    (?, 0, ?, null, null, null, null)
'''

sql.eachRow(getAllComponents) { componentRow ->
    def componentId = componentRow['id']
    def name = componentRow['name']
    def ghostedDate = componentRow['ghosted_date']
    name = name+" "+ghostedDate
    
    def roleId = UUID.randomUUID().toString()
    def psdId = UUID.randomUUID().toString()
    
    sql.executeUpdate(createPropSheetDef, [psdId, name])
    sql.executeUpdate(createResourceRole, [roleId, name, psdId, componentId])
}
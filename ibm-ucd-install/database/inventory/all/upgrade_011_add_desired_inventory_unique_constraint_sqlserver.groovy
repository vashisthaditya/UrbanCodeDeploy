/*
* Licensed Materials - Property of IBM* and/or HCL**
* UrbanCode Deploy
* UrbanCode Build
* UrbanCode Release
* AnthillPro
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

def connection = this.binding['CONN'];
def properties = this.binding['ANT_PROPERTIES'];

def createIndex = '''
      create unique index inv_unique_desired_entry
        on inv_desired_inventory(environment_id, role_id, version_id, component_id, status, ghosted_date)
'''

def createTempTable = '''
      create table temp_desired_inventory (
        id nvarchar(36) not null primary key
      )
'''

def insertIntoTempTable = '''
      insert into
        temp_desired_inventory
        select
          min(id)
        from
          inv_desired_inventory inv1
            group by environment_id,
            role_id, version_id,
            component_id,
            status,
            ghosted_date
'''

def deleteFromDesiredInventory = '''
      delete from inv_desired_inventory
      where id not in (
        select id from temp_desired_inventory
      )
'''

def dropTempTable = '''
      drop table temp_desired_inventory
'''

def sql = new Sql(connection)
def connMetaData = connection.getMetaData()
def catalogName = null
def schemaName = properties["default_schema"];
def inventoryTableName = null
def tableNameFilter = null
def tableTypes = null
def tableRS = connMetaData.getTables(catalogName, schemaName, tableNameFilter, tableTypes)
while (tableRS.next()) {
    def tableName = tableRS.getString('TABLE_NAME')
    if (tableName.equalsIgnoreCase('inv_desired_inventory')) {
        inventoryTableName = tableName
        break;
    }
}

def constraintFound = false
def indexRS = connMetaData.getIndexInfo(catalogName, schemaName, inventoryTableName, true, false)
while (indexRS.next()) {
    def constraintName = indexRS.getString('INDEX_NAME')
    def columnName = indexRS.getString('COLUMN_NAME')
    if (constraintName != null && columnName != null) {
        // Null values are a special case indicating statistics. we don't care
        if (constraintName.equalsIgnoreCase('inv_unique_desired_entry')) {
            constraintFound = true;
        }
    }
}

if (!constraintFound) {
    sql.executeUpdate(createTempTable);
    sql.executeUpdate(insertIntoTempTable);
    sql.executeUpdate(deleteFromDesiredInventory);
    sql.executeUpdate(dropTempTable);
    sql.executeUpdate(createIndex);
}
// Otherwise we already had the index so everything is fine.
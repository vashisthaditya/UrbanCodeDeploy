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

def connection = this.binding['CONN'];
def properties = this.binding['ANT_PROPERTIES'];

def sql = new Sql(connection)
def connMetaData = connection.metaData
def catalogName = null
def schemaName = null
def secUserTableName = null
def tableRS = connMetaData.getTables(null, null, null, null)
while (tableRS.next()) {
    def tableName = tableRS.getString('TABLE_NAME')
    if (tableName.equalsIgnoreCase('SEC_USER')) {
        secUserTableName = tableName
        break;
    }
}

println "catalog: ${catalogName}"
println "schema: ${schemaName}"
println "table: ${secUserTableName}"

def constraintFound = false
def indexRS = connMetaData.getIndexInfo(catalogName, schemaName, secUserTableName, true, false)
while (indexRS.next()) {
    def constraintName = indexRS.getString('INDEX_NAME')
    def columnName = indexRS.getString('COLUMN_NAME')
    println "found constraint: ${constraintName} on ${columnName}"
    
    if ('NAME'.equalsIgnoreCase(columnName)) {
        println "dropping constraint: ${constraintName}"
        constraintFound = true
        
        try {
            sql.executeUpdate("ALTER TABLE sec_user DROP CONSTRAINT " + constraintName)
        }
        catch (Exception e1) {
            try {
                sql.executeUpdate("ALTER TABLE sec_user DROP INDEX " + constraintName)
            }
            catch (Exception e2) {
                try {
                    sql.executeUpdate("DROP INDEX sec_user." + constraintName)
                }
                catch (Exception e3) {
                    try {
                        sql.executeUpdate("ALTER TABLE sec_user DROP UNIQUE " + constraintName)
                    }
                    catch (Exception e4) {
                        throw new Exception("Failed to drop unique constraint ${constraintName}")
                    }
                }
            }
        }
        break
    }
}

if (!constraintFound) {
    throw new Exception("No unique constraint found on ${secUserTableName}")
}

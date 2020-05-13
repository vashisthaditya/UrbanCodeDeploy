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

def selectStatement = """
    select
        comp.ghosted_date as ghostedDate,
        role.id as id
    from
        ds_component comp
        join ds_resource_role role on role.id = comp.resource_role_id
    where
        role.ghosted_date = 0
        and comp.ghosted_date != 0"""

def updateStatement = """
    update
        ds_resource_role
    set
        ghosted_date = ?
    where
        id = ?"""

def getIdsToDelete = { ->
    def result = [:];
    sql.eachRow(selectStatement) { row ->
        result[row.id] = row.ghostedDate;
    }
    return result;
}

def toDelete = getIdsToDelete();
if (toDelete.size() != 0) {
    toDelete.each { id, ghostedDate ->
        def params = [ghostedDate, id];
        sql.executeUpdate(updateStatement, params);
    }
}

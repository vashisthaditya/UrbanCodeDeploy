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
        child.id
    from
        ds_resource child, ds_resource parent
    where
        child.ghosted_date = 0
        and child.parent_id = parent.id
        and parent.ghosted_date != 0"""

def ghostResourcesStatement = """
    update
        ds_resource
    set
        ghosted_date = ?
    where
        id = ?"""

def getIdsToDelete = { ->
    def result = [];
    sql.eachRow(selectStatement) { row ->
        result.add(row.id);
    }
    return result;
}

def toDelete = getIdsToDelete();
while (toDelete.size() != 0) {
    for (def id : toDelete) {
        // ghosted_date set to 4219 so we can easily find resources ghosted this way
        def params = [4219, id];
        sql.executeUpdate(ghostResourcesStatement, params);
    }
    toDelete = getIdsToDelete();
}
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
Sql sql = new Sql(connection);

def getIndex = '''
    SELECT *
    FROM sys.indexes
    WHERE name = 'ds_resource_ghosted_path'
'''

def dropIndex = '''
    DROP INDEX ds_resource.ds_resource_ghosted_path
'''

def result = sql.firstRow(getIndex);
if (result != null) {
    sql.execute(dropIndex);
}
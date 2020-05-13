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

def connection = this.binding["CONN"];
def sql = new Sql(connection)

def table = "rt_property_context"
def column = "next_mapping_index"

def columnIdRow = sql.firstRow("select column_id from sys.columns " +
        "where name = '$column' " +
        "and object_id = object_id('$table')")

if (!!columnIdRow && !!columnIdRow['column_id']) {
    sql.eachRow("select name from sys.default_constraints " +
            "where parent_object_id = object_id('$table') " +
            "and parent_column_id = ${columnIdRow['column_id']}") { constraintRow ->

        sql.execute('alter table ' + table + ' drop constraint ' + constraintRow['name'])

    }

    sql.execute('alter table ' + table + ' drop column ' + column)
}
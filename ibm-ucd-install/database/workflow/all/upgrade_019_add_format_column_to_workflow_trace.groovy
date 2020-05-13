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


import groovy.sql.Sql
import java.sql.ResultSet
import java.sql.DatabaseMetaData

// ------------------------------------------------------------------------------------------------
// SET UP
// ------------------------------------------------------------------------------------------------

def connection = this.binding['CONN']
def properties = this.binding['ANT_PROPERTIES'];
def dbName = properties['database.type']
def sql = new Sql(connection)

def queries = [:];

queries['derby'] = """
      alter table wf_workflow_trace add column format integer
"""
queries['db2'] = """
      alter table wf_workflow_trace add column format integer
""";
queries['db2zos'] = queries['db2']
queries['mysql'] = """
      alter table wf_workflow_trace add column format numeric
""";
queries['oracle'] = """
      alter table wf_workflow_trace add format numeric
""";
queries['postgres'] = """
      alter table wf_workflow_trace add column format numeric;
""";
queries['sqlserver'] = """
      alter table wf_workflow_trace add format int;
""";

def hasColumn = { tableName, columnName ->
    DatabaseMetaData md = connection.getMetaData();
    ResultSet rs = md.getColumns(null, null, null, null);
    while (rs.next()) {
        String curTableName = rs.getString(3);
        String curColumnName = rs.getString(4);
        if (curTableName.equalsIgnoreCase(tableName) && curColumnName.equalsIgnoreCase(columnName)) {
            return true;
        }
    }
    return false;
}

if (!hasColumn("wf_workflow_trace", "format")) {
    sql.execute(queries[dbName]);
}

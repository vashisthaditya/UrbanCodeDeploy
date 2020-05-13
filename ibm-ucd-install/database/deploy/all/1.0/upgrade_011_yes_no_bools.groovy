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
import com.urbancode.cm.db.updater.ApplyException;
import java.sql.SQLDataException;

def connection = this.binding['CONN'];
def properties = this.binding['ANT_PROPERTIES'];

def sql = new Sql(connection)

def updateCmd = { tableName, columnName, newColumnName ->
     return "update $tableName set $newColumnName = ? where $columnName = ?"
}

def remakeBooleanColumnsNumeric = { tableName, columnName, newColumnName ->
    sql.execute(updateCmd(tableName, columnName, newColumnName), ['N', 0]);
    sql.execute(updateCmd(tableName, newColumnName, newColumnName), ['Y', 'P']); //update scripts should default to P for the varchar1 column
}
def remakeBooleanColumns = { tableName, columnName, newColumnName ->
    sql.execute(updateCmd(tableName, columnName, newColumnName), ['N', '0']); 

    sql.execute(updateCmd(tableName, columnName, newColumnName), ['N', 'n']);
    sql.execute(updateCmd(tableName, columnName, newColumnName), ['N', 'N']);
    sql.execute(updateCmd(tableName, columnName, newColumnName), ['N', 'f']);
    sql.execute(updateCmd(tableName, columnName, newColumnName), ['N', 'F']);


    sql.execute(updateCmd(tableName, newColumnName, newColumnName), ['Y', 'P']); //update scripts should default to P for the varchar1 column
}

remakeBooleanColumnsNumeric("sec_action", "enabled", "enabledtemp");
remakeBooleanColumnsNumeric("sec_action", "cascading", "cascadingtemp");
remakeBooleanColumnsNumeric("sec_authentication_realm", "enabled", "enabledtemp");
remakeBooleanColumnsNumeric("sec_authentication_realm", "read_only", "read_onlytemp");
remakeBooleanColumnsNumeric("sec_group", "enabled", "enabledtemp");
remakeBooleanColumnsNumeric("sec_resource", "enabled", "enabledtemp");
remakeBooleanColumnsNumeric("sec_resource_role", "enabled", "enabledtemp");
remakeBooleanColumnsNumeric("sec_resource_type", "enabled", "enabledtemp");
remakeBooleanColumnsNumeric("sec_role", "enabled", "enabledtemp");
remakeBooleanColumnsNumeric("sec_team_space", "enabled", "enabledtemp");
remakeBooleanColumnsNumeric("sec_user", "enabled", "enabledtemp");

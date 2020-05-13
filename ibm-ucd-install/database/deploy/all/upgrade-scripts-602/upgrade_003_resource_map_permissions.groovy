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

import java.util.List
import java.util.ArrayList
import java.util.Map
import java.util.HashMap

def connection = this.binding['CONN'];
def sql = new Sql(connection)


def newActionId = "20000000000000000000000000190004"
def writeActionId = "20000000000000000000000000190003"
def secResourceTypeId = "20000000000000000000000000000104"

//insert new permission row
def insertActionQuery = "insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category) values (?, 0, ?, ?, 'Y', 'Y', ?, ?)"
sql.execute(insertActionQuery, [newActionId, "Map to Environments", "Map base resources to environments", secResourceTypeId, "Edit"])

//grant everyone with write permissions the permission to map rows to environments
sql.eachRow("select version, sec_role_id, sec_resource_role_id from sec_role_action where sec_action_id=?", [writeActionId]) { row ->
    def uuid = UUID.randomUUID().toString()
    def query = "insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values (?, ?, ?, ?, ?)"
    sql.execute(query, [uuid, row.version, row.sec_role_id, newActionId, row.sec_resource_role_id])
}


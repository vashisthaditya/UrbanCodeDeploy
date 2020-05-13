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
import groovy.xml.XmlUtil

import java.util.List
import java.util.ArrayList
import java.util.Map
import java.util.HashMap
import java.sql.Clob
import java.util.UUID;

def connection = this.binding["CONN"];
def sql = new Sql(connection)

def idToInstanceId = [:]
sql.eachRow("select resource_role_id, allowed_parent_id from ds_res_role_allowed_parent") { row ->
    sql.execute("update ds_res_role_allowed_parent set id = ? where resource_role_id = ? and allowed_parent_id = ?",
           [UUID.randomUUID().toString(), row.resource_role_id, row.allowed_parent_id]);
}

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

def connection = this.binding["CONN"];
def sql = new Sql(connection)

def idToInstanceId = [:]
sql.eachRow("select id, instance_id from ds_environment") { row ->
    idToInstanceId[row.id] = row.instance_id
}

idToInstanceId.each{id, iid ->
    if (iid) {
        def iidVarchar = Sql.VARCHAR(iid)
        sql.execute("update ds_environment set instance_id_temp=? where id=?", [iidVarchar, id])
    }
    else {
        sql.execute("update ds_environment set instance_id_temp=null where id=?", [id])
    }
}


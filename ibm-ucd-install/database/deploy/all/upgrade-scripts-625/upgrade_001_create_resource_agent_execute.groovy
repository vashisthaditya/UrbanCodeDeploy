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
import org.apache.commons.codec.binary.Base64;
import com.urbancode.commons.util.crypto.CryptStringUtil

def connection = this.binding['CONN'];
def sql = new Sql(connection)

def createAgentActionSQL = """
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('2000000000000000000000000011000b', 0, 'Execute on Agents', 'Execute processes on agents.', 'Y', 'Y', '20000000000000000000000000000106', null)"""

def createResourceActionSQL = """
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('2000000000000000000000000019000b', 0, 'Execute on Resources', 'Execute processes on resources.', 'Y', 'Y', '20000000000000000000000000000104', null)"""

def addActionSQL = """
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id)
values (?, 0, ?, ?, ?)
"""

def getRoleIds = { ->
    def result = [];
    sql.eachRow("""select id from sec_role""") { row ->
         result.add(row.id);
    }
    return result;
}

def getResourceTypeIds = { ->
    def result = [];
    sql.eachRow("""select id from sec_resource_role where sec_resource_type_id = '20000000000000000000000000000104'""") { row ->
         result.add(row.id);
    }
    return result;
}

def getAgentTypeIds = { ->
    def result = [];
    sql.eachRow("""select id from sec_resource_role where sec_resource_type_id = '20000000000000000000000000000106'""") { row ->
         result.add(row.id);
    }
    return result;
}

sql.execute(createAgentActionSQL);
sql.execute(createResourceActionSQL);

def roles = getRoleIds();
def resTypes = getResourceTypeIds();
def agnTypes = getAgentTypeIds();
for (def role in roles) {
  //add to default type for role
  sql.execute(addActionSQL, UUID.randomUUID().toString(), role, '2000000000000000000000000011000b', null);
  sql.execute(addActionSQL, UUID.randomUUID().toString(), role, '2000000000000000000000000019000b', null);
  for (def type : resTypes) {
      sql.execute(addActionSQL, UUID.randomUUID().toString(), role, '2000000000000000000000000019000b', type);
  }
  for (def type : agnTypes) {
      sql.execute(addActionSQL, UUID.randomUUID().toString(), role, '2000000000000000000000000011000b', type);
  }
}
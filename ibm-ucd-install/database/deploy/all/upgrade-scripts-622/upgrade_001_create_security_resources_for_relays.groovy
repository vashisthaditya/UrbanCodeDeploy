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

sql.eachRow("SELECT id, version, name FROM ds_agent_relay") { relayRow ->
    def secResourceId = UUID.randomUUID().toString();
    def createSecResourceQuery = "INSERT INTO sec_resource (id, version, name, enabled, sec_resource_type_id) VALUES (?, ?, ?, ?, ?)";
    sql.execute(createSecResourceQuery,
        [secResourceId, relayRow.version, relayRow.name, 'Y', '20000000000000000000000000000114']);

    def backFillQuery = "UPDATE ds_agent_relay SET sec_resource_id = ? WHERE id = ?";
    sql.execute(backFillQuery,
        [secResourceId, relayRow.id]);

    def secTeamId = UUID.randomUUID().toString();
    def addSystemTeamMappingQuery = "INSERT INTO sec_resource_for_team (id, version, sec_resource_id, sec_team_space_id, sec_resource_role_id) VALUES (?, ?, ?, ?, ?)";
    sql.execute(addSystemTeamMappingQuery,
        [secTeamId, relayRow.version, secResourceId, '20000000000000000000000100000000', null]);
}


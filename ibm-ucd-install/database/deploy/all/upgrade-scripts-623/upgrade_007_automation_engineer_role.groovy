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

def permsActionList = [
//Resource
    //Create children of agents
    '20000000000000000000000000110004',
    //Generic Create
    '20000000000000000000000000190001',
    //View Resource
    '20000000000000000000000000190002',
    //Manage Properties
    '20000000000000000000000000190009',
    //Manage Teams
    '2000000000000000000000000019000a',
//View Tabs
    //Processes
    '200000000000000000000000001c000a',
    //Dashboard
    '200000000000000000000000001c0007',
    //Resources
    '200000000000000000000000001c0003',
    //Applications
    '200000000000000000000000001c0002',
    //Components
    '200000000000000000000000001c0001',
//Application
    //Create
    '20000000000000000000000000130001',
    //Edit Basic Settings
    '20000000000000000000000000130007',
    //Manage Teams
    '2000000000000000000000000013000d',
    //Manage Processes
    '2000000000000000000000000013000b',
    //Manage Components for app
    '20000000000000000000000000130009',
    //Manage Envs for app
    '2000000000000000000000000013000a',
    //View
    '20000000000000000000000000130002',
    //Manage Snapshots
    '20000000000000000000000000130005',
    //Manage Properties
    '2000000000000000000000000013000c',
    //Create Applications From Template
    '2000000000000000000000000013000e',
//Component
    //Create
    '20000000000000000000000000140001',
    //Edit basic settings
    '20000000000000000000000000140006',
    //Manage Teams
    '2000000000000000000000000014000a',
    //Manage Processes
    '20000000000000000000000000140008',
    //View
    '20000000000000000000000000140002',
    //Create Components From Template
    '2000000000000000000000000014000b',
    //Manage Properties
    '20000000000000000000000000140009',
    //Manage Versions
    '20000000000000000000000000140004',
//Environment
    //Create
    '20000000000000000000000000160001',
    //Edit basic settings
    '20000000000000000000000000160006',
    //Manage Teams
    '2000000000000000000000000016000a',
    //View
    '20000000000000000000000000160002',
    //Execute processes on
    '20000000000000000000000000160004',
    //Manage Base Resources
    '20000000000000000000000000160008',
    //Create Environments From Template
    '2000000000000000000000000016000b',
    //Manage Properties
    '20000000000000000000000000160009',
    //Manage Approval Processes
    '20000000000000000000000000160007',
//Processes
    //Execute
    '20000000000000000000000000180004',
    //View
    '20000000000000000000000000180002',
    //Edit Basic Settings
    '20000000000000000000000000180006',
    //Manage Properties
    '20000000000000000000000000180007',
//Agent
    //View
    '20000000000000000000000000110001'];

// check if automation engineer role exists
if (sql.rows("select * from sec_role where name like 'Automation Engineer'").size() <= 0) {
    def roleId = "152af02e-1c31-4d8c-95bf-36e20851a83d";
    def createSecRoleQuery = "INSERT INTO sec_role (id, version, name, description, enabled, ghosted_date) VALUES (?, ?, ?, ?, ?, ?)";
    sql.execute(createSecRoleQuery,
            [roleId, 0, 'Automation Engineer', null, 'Y', 0]);

    permsActionList.each() { permsRow ->
        def actionId = UUID.randomUUID().toString();
        def createRoleActionQuery = "INSERT INTO sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) VALUES (?, ?, ?, ?, ?)";
        sql.execute(createRoleActionQuery,
                [actionId, 0, roleId, permsRow, null]);
    }
}

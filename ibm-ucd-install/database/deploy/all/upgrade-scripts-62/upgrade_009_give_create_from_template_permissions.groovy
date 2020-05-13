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
import com.urbancode.persistence.IDGenerator

def sql = new Sql(this.binding['CONN'])

def getRelevantIds = '''
SELECT id
FROM sec_role_action
WHERE sec_action_id IN (
    SELECT create_entity
    FROM create_temp_action_map)
'''

def seedUUID = '''
INSERT INTO uuid_map (original_id, new_id) VALUES (?, ?)
'''

def addCreateFromTemplatePermission = '''
INSERT INTO sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id)
SELECT
    new_id,
    version,
    sec_role_id,
    create_from_template,
    sec_resource_role_id
FROM sec_role_action sra
INNER JOIN create_temp_action_map am
    ON am.create_entity = sra.sec_action_id
INNER JOIN uuid_map um
    ON um.original_id = sra.id
WHERE sra.sec_action_id IN (
    SELECT create_entity
    FROM create_temp_action_map)
'''

// figure out which rows are relevant (just grab the id of each one)
def relevantIds = sql.rows(getRelevantIds);

// create a new UUID for each of the relevant rows to avoid breaking
// primary key constraint in next step
relevantIds.each {
    def newId = IDGenerator.createID().toString();
    sql.execute(seedUUID, [(Object)it.getProperty("ID"), (Object)newId]);
}

// for each relevant row, insert a duplicate row with the action changed to the
// "create from template" version of the original action
sql.execute(addCreateFromTemplatePermission);

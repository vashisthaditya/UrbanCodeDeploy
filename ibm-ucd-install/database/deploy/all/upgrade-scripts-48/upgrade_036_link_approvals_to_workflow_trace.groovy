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
/*
 * Created by aorlando on 1/3/14.
 */
import groovy.sql.Sql
import groovy.json.JsonSlurper

import java.sql.Clob

def connection = this.binding['CONN']
def sql = new Sql(connection)

def WORKFLOW_ID = "workflowId"
def getApprovalPropSheet = '''select * from tsk_approval where id=?'''
def getPropValues = '''select * from ps_prop_value where name=? and value=? and prop_sheet_id=?'''
def insertPropValuesForApprovalPropSheet = '''insert into ps_prop_value(id, version, name, value, long_value, description, secure, prop_sheet_id)
                                                values (?, 0, 'workflowId', ?, null, null, 'N', ?)'''
def workflowText = ""

sql.eachRow( 'select * from wf_workflow_trace' ) { workflow ->
    workflowId = workflow.id
    if (workflow.workflow_trace_data) {
        //Get the workflow trace JSON
        if (workflow.workflow_trace_data instanceof Clob) {
            java.sql.Clob clob = (java.sql.Clob) workflow.workflow_trace_data
            workflowText = clob.getCharacterStream().getText()
        }
        else {
            workflowText = workflow.workflow_trace_data
        }
        workflowJson = new JsonSlurper().parseText(workflowText);
        //Check for approval
        if (workflowJson != null &&
                workflowJson.rootActivityTrace != null &&
                workflowJson.rootActivityTrace.properties != null &&
                workflowJson.rootActivityTrace.properties.approvalId != null) {
            approvalId = workflowJson.rootActivityTrace.properties.approvalId
            sql.eachRow(getApprovalPropSheet, [approvalId]) { approval ->
                propSheetId = approval.prop_sheet_id

                //insert record for workflowId in the approval prop sheet - if it does not exist
                if (sql.rows(getPropValues, [WORKFLOW_ID, workflowId, propSheetId]).isEmpty()) {
                    sql.executeUpdate(insertPropValuesForApprovalPropSheet, [UUID.randomUUID().toString(), workflowId, propSheetId])
                }
            }
        }
    }
}
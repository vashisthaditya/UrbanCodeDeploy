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


import groovy.sql.BatchingPreparedStatementWrapper
import groovy.sql.Sql
import org.codehaus.jettison.json.JSONObject
import java.sql.Clob

// ------------------------------------------------------------------------------------------------
// SET UP
// ------------------------------------------------------------------------------------------------

def connection = this.binding['CONN']
def sql = new Sql(connection)

// Used only for batching the writes for mysql
def MAX_NUM_ROWS = 10000
def paramsArray = []
def finishedCount = 0
def startTime = System.currentTimeMillis()
def boolean mysql = sql.getConnection().getMetaData().getURL().contains("jdbc:mysql")
def boolean sqlserver = sql.getConnection().getMetaData().getURL().contains("jdbc:sqlserver")

if (mysql) {
    // Mysql will load all entries of a table into memory, unless we tell it
    // to only load 1 entry at a time.
    sql.withStatement { stmt -> stmt.fetchSize = Integer.MIN_VALUE }
}

def getWorkflowTracesJson = '''
    select wt.workflow_trace_data as wt_json, wt.id as wt_id
    from wf_workflow_trace wt
'''

def createWorkflowMetadataEntry = '''
    insert into wf_workflow_metadata (workflow_trace_id, status, start_time, paused)
        select wf.id, 'EXECUTING', ?, 'N'
        from wf_workflow wf
        where wf.id not in (select wt.id from wf_workflow_trace wt)
'''

def createTraceMetadataEntry = '''
    insert into wf_workflow_metadata (workflow_trace_id, result, status, start_time, end_time, duration_time, paused)
    values (?, ?, ?, ?, ?, ?, ?)
'''

def getNumTraces = '''
    select count(id) as num_traces from wf_workflow_trace
'''

def Closure createTraceMetadataWithBatch = {
    sql.withBatch(MAX_NUM_ROWS, createTraceMetadataEntry) { BatchingPreparedStatementWrapper ps ->
        for (j = 0; j < paramsArray.size(); j++) {
            ps.addBatch(paramsArray[j])
        }
    }
}

// ------------------------------------------------------------------------------------------------
// RUNNING QUERIES
// ------------------------------------------------------------------------------------------------

def totalCount = sql.firstRow(getNumTraces)['num_traces']

println " This upgrade may take some time to complete. Please do not end the upgrade prematurely."

println " Step 1 of 2: Writing new workflow metadata. " + totalCount + " metadata entries to create..."

sql.eachRow(getWorkflowTracesJson) { traceRow ->
    def workflowText = traceRow['wt_json']
    if (traceRow['wt_json'] instanceof Clob) {
        java.sql.Clob clob = (java.sql.Clob) traceRow['wt_json']
        workflowText = clob.getCharacterStream().getText()
    }
    def traceJson = new JSONObject(workflowText)
    def params = []

    // Not Null
    def traceId = traceRow['wt_id']
    def tracePaused = 'N'

    // Nullable
    def traceStart = null
    def traceEnd = null
    def traceResult = null
    def traceStatus = null
    def traceDuration = null

    try {
        def root = traceJson.optJSONObject("rootActivityTrace")
        if (root != null) {
            if (root.has("startDate") && !root.isNull("startDate")) {
                traceStart = root.getLong("startDate")
            }
            if (root.has("endDate") && !root.isNull("endDate")) {
                traceEnd = root.getLong("endDate")
            }
            if (root.has("result") && !root.isNull("result")) {
                traceResult = root.get("result")
            }
            if (root.has("status") && !root.isNull("status")) {
                traceStatus = root.get("status")
            }
            if (traceJson.has("paused") && !traceJson.isNull("paused")) {
                tracePaused = traceJson.getBoolean("paused") ? 'Y' : 'N'
            }
            if (traceEnd != null && traceStart != null) {
                traceDuration = traceEnd - traceStart
            }
        }

        //(workflow_trace_id, result, status, start_time, end_time, duration_time, paused)
        params.add(traceId)
        params.add(traceResult)
        params.add(traceStatus)
        params.add(traceStart)
        params.add(traceEnd)
        params.add(traceDuration)
        params.add(tracePaused)

        if (mysql || sqlserver) {
            paramsArray.add(params)
        }
        else {
            sql.execute(createTraceMetadataEntry, params)
        }
    }
    catch (Exception e) {
        println "Failed to process trace " + traceId + " with data " + traceJson
        throw e
    }

    finishedCount++;
    if (finishedCount % 500 == 0) {
        def elapsedTime = System.currentTimeMillis() - startTime
        def remainingCount = totalCount - finishedCount
        def timePerWorkflow = elapsedTime / finishedCount
        def timeRemaining = Math.floor(timePerWorkflow * remainingCount / 1000)
        def hoursRemaining = Math.floor(timeRemaining / 3600)
        timeRemaining -= hoursRemaining * 3600
        def minutesRemaining = Math.floor(timeRemaining / 60)
        timeRemaining -= minutesRemaining * 60

        println sprintf("                 " + remainingCount + " remaining - estimated time left (h:mm:ss): %1.0f:%02.0f:%02.0f", hoursRemaining, minutesRemaining, timeRemaining);
    }

}

if (mysql || sqlserver) {

    // Because mysql can't do another sql call while it's doing a streaming read
    // we are batch sending all the collected data from the closure above.
    sql.withTransaction(createTraceMetadataWithBatch)
}

print "        Number of entries created: " + finishedCount + "\r"

println "    Step 2 of 2: Writing new workflow metadata for running workflow records..."
sql.execute(createWorkflowMetadataEntry, startTime)

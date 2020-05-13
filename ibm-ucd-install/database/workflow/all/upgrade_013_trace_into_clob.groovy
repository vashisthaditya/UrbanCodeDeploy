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
import groovy.sql.Sql;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONObject;

def connection = this.binding['CONN'];
def sql = new Sql(connection)
def getActivityTraceJson = null
def finishedCount = 0;
def totalCount = 0;
def startTime = 0;

def getWorkflowTraces = '''
    select wt.id as wt_id, wtr.activity_trace_id as at_id
    from wf_workflow_trace wt
    join wf_workflow_trace_root wtr
        on wtr.workflow_trace_id = wt.id 
'''

def getStatuses = '''
    select ats.activity_trace_id as at_id, ats.status as at_status
    from wf_activity_trace_status ats
    where ats.created_ts = (
        select max(ats2.created_ts)
        from wf_activity_trace_status ats2
        where ats2.activity_trace_id = ats.activity_trace_id)
'''

def getResults = '''
    select ats.activity_trace_id as at_id, ats.result as at_result
    from wf_activity_trace_result ats
    where ats.created_ts = (
        select max(ats2.created_ts)
        from wf_activity_trace_result ats2
        where ats2.activity_trace_id = ats.activity_trace_id)
'''

def getStarted = '''
    select ats.activity_trace_id as at_id, ats.started_ts as at_started
    from wf_activity_trace_start ats
    where ats.created_ts = (
        select max(ats2.created_ts)
        from wf_activity_trace_start ats2
        where ats2.activity_trace_id = ats.activity_trace_id)
'''

def getEnded = '''
    select ats.activity_trace_id as at_id, ats.ended_ts as at_ended
    from wf_activity_trace_end ats
    where ats.created_ts = (
        select max(ats2.created_ts)
        from wf_activity_trace_end ats2
        where ats2.activity_trace_id = ats.activity_trace_id)
'''

def getProperties = '''
    select ats.activity_trace_id as at_id, ats.property_key as at_key, ats.property_value as at_value
    from wf_activity_trace_prop ats
    where ats.created_ts = (
        select max(ats2.created_ts)
        from wf_activity_trace_prop ats2
        where ats2.activity_trace_id = ats.activity_trace_id
            and ats2.property_key = ats.property_key)
    and ats.activity_trace_id = ?
'''

def getActivityTraces = '''
    select act.id as at_id, act.name as at_name, act.parent_activity_trace_id as parent_id, act.activity_classname as at_classname
    from wf_activity_trace act
    order by created_ts
'''

def setWorkflowTraceData = '''
    update wf_workflow_trace
    set workflow_trace_data = ?
    where id = ?
'''

println "    This upgrade may take some time to complete. Please do not end the upgrade prematurely."

println "    Step 1 of 7: Gathering workflow records..."
def workflowTraceRows = []
sql.eachRow(getWorkflowTraces) { traceRow ->
    workflowTraceRows.add([traceRow['wt_id'], traceRow['at_id']])
}

println "    Step 2 of 7: Gathering activity records..."
def activityTraceRows = new HashMap<String, Object>()
def activityTracesToChildren = new HashMap<String, Object>()
sql.eachRow(getActivityTraces) { traceRow ->
    def traceId = traceRow['at_id']
    def parentId = traceRow['parent_id']
    
    activityTraceRows.put(traceId, [traceRow['at_name'], traceRow['at_classname']])
    
    def childIdList = activityTracesToChildren.get(parentId)
    if (childIdList == null) {
        childIdList = []
        activityTracesToChildren.put(parentId, childIdList)
    }
    childIdList.add(traceId)
}

println "    Step 3 of 7: Gathering activity statuses..."
def activityTraceStatusRows = new HashMap<String, String>()
sql.eachRow(getStatuses) { traceRow ->
    activityTraceStatusRows.put(traceRow['at_id'], traceRow['at_status'])
}

println "    Step 4 of 7: Gathering activity results..."
def activityTraceResultRows = new HashMap<String, String>()
sql.eachRow(getResults) { traceRow ->
    activityTraceResultRows.put(traceRow['at_id'], traceRow['at_result'])
}

println "    Step 5 of 7: Gathering activity start times..."
def activityTraceStartRows = new HashMap<String, String>()
sql.eachRow(getStarted) { traceRow ->
    activityTraceStartRows.put(traceRow['at_id'], traceRow['at_started'])
}

println "    Step 6 of 7: Gathering activity end times..."
def activityTraceEndRows = new HashMap<String, String>()
sql.eachRow(getEnded) { traceRow ->
    activityTraceEndRows.put(traceRow['at_id'], traceRow['at_ended'])
}


startTime = new Date().getTime();
totalCount = workflowTraceRows.size();
System.out.println("    Step 7 of 7: Writing new workflow data. "+totalCount+" workflows to process...")


getActivityTraceJson = { traceId ->
    JSONObject result = new JSONObject();
    
    def traceData = activityTraceRows.get(traceId)
    
    result.put("id", traceId)
    result.put("status", activityTraceStatusRows.get(traceId))
    result.put("result", activityTraceResultRows.get(traceId))
    result.put("startDate", activityTraceStartRows.get(traceId))
    result.put("endDate", activityTraceEndRows.get(traceId))
    result.put("name", traceData == null ? null:traceData[0])
    result.put("activityClassName", traceData == null ? null:traceData[1])
    
    JSONArray childrenJson = new JSONArray()
    def childIds = activityTracesToChildren.get(traceId)
    if (childIds != null) {
        childIds.each() { childId ->
            childrenJson.put(getActivityTraceJson(childId))
        }
    }
    result.put("children", childrenJson)
    
    JSONObject propertiesJson = new JSONObject();
    sql.eachRow(getProperties, [traceId]) { propertyRow ->
        def key = propertyRow['at_key']
        def value = propertyRow['at_value']
        
        propertiesJson.put(key, value)
    }
    result.put("properties", propertiesJson);
}

workflowTraceRows.each() { traceRow ->
    def workflowTraceId = traceRow[0]
    def rootActivityTraceId = traceRow[1]
    
    JSONObject workflowTraceJson = new JSONObject();
    workflowTraceJson.put("id", workflowTraceId)
    workflowTraceJson.put("paused", false)
    workflowTraceJson.put("rootActivityTrace", getActivityTraceJson(rootActivityTraceId))
    
    sql.executeUpdate(setWorkflowTraceData, [workflowTraceJson.toString(), workflowTraceId])
    
    finishedCount++;
    if (finishedCount % 500 == 0) {
        def elapsedTime = new Date().getTime()-startTime;
        def remainingCount = totalCount-finishedCount;
        def timePerWorkflow = elapsedTime/finishedCount;
        def timeRemaining = Math.floor(timePerWorkflow*remainingCount/1000);
        def hoursRemaining = Math.floor(timeRemaining/3600);
        timeRemaining -= hoursRemaining*3600;
        def minutesRemaining = Math.floor(timeRemaining/60);
        timeRemaining -= minutesRemaining*60;
        
        println sprintf("                 "+remainingCount+" remaining - estimated time left (h:mm:ss): %1.0f:%02.0f:%02.0f", hoursRemaining, minutesRemaining, timeRemaining);
    }
}

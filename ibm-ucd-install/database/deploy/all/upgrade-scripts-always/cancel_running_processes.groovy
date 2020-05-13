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
import com.urbancode.air.workflow.ExecutionContext;
import com.urbancode.air.workflow.ExecutionResult;
import com.urbancode.air.workflow.ExecutionStatus;
import com.urbancode.air.workflow.Workflow;
import com.urbancode.air.workflow.WorkflowRecord;
import com.urbancode.air.workflow.trace.WorkflowTrace;
import com.urbancode.air.workflow.trace.WorkflowTraceRecord;
import java.sql.Connection;
import java.sql.Clob;
import java.sql.ResultSet;
import java.sql.Statement;
import java.sql.PreparedStatement;
import java.sql.Blob;
import java.util.Properties;
import java.io.Reader;
import java.io.StringReader;
import java.lang.reflect.Field;
import java.util.UUID;
import java.io.ByteArrayOutputStream;
import java.sql.DatabaseMetaData;

Properties properties = this.binding['ANT_PROPERTIES'];
String dbtype = properties['database.type'];
Connection con = this.binding['CONN'];
DatabaseMetaData md = con.getMetaData();
ResultSet mdRs = md.getTables(null, null, null, null);


def getWorkflows = """
select
  id,
  workflow_data
from
  wf_workflow wf
""";

// MySQL will not respect FetchSize we need to handle paging in SQL
def getWorkflowsMysql = """
select
  id,
  workflow_data
from
  wf_workflow wf
  limit 500 offset ?
""";

def mysqlCountStatement = """
select
  count(*)
from 
  wf_workflow wf
""";

def insertTrace = "insert into wf_workflow_trace (id, workflow_trace_data) values (?, ?)";
def updateMetadata = "update wf_workflow_metadata set result = ?, status = ?, end_time = ?, duration_time = ?, paused = ? where workflow_trace_id = ?"

def doesWorkflowTraceExist = "select id from wf_workflow_trace where id = ?";
def metadataClosed = "select workflow_trace_id from wf_workflow_metadata where workflow_trace_id = ? and status = ?"

def deleteStmt = "delete from wf_workflow";
def deleteLocks = "delete from ds_lock";
def truncateDispatchedTask = "truncate table wf_dispatched_task";
//db2 requires the immediate keyword in versions 9.7+(which is all we support anyways)
if (dbtype && dbtype.startsWith("db2")) {
    truncateDispatchedTask = truncateDispatchedTask + " immediate";
}

//do this first and make sure clean transaction so db2 works
//truncate dispatched task table first
con.commit();
con.createStatement().execute(truncateDispatchedTask);
con.commit();

Long endTime = System.currentTimeMillis();
Statement queryStmt = con.createStatement();
queryStmt.setFetchSize(500);
PreparedStatement traceInsert = con.prepareStatement(insertTrace);

def hasTable = { tableName ->
    while(mdRs.next()) {
        String curTableName = mdRs.getString(3);
        if (curTableName.equalsIgnoreCase(tableName)) {
            return true;
        }
    }
    return false;
}

def hasMetadataTable = hasTable("wf_workflow_metadata");

PreparedStatement metadataUpdate = null;
PreparedStatement metadataClosedStatement = null;
if (hasMetadataTable) {
    metadataUpdate = con.prepareStatement(updateMetadata);
    metadataClosedStatement = con.prepareStatement(metadataClosed);
}


Field idField = WorkflowRecord.class.getDeclaredField("id")
idField.setAccessible(true);
Field dataField = WorkflowRecord.class.getDeclaredField("data")
dataField.setAccessible(true);
Field traceDataField = WorkflowTraceRecord.class.getDeclaredField("data")
traceDataField.setAccessible(true);

Field exeConResultField = ExecutionContext.class.getDeclaredField("result")
exeConResultField.setAccessible(true);

Field exeConEndedField = ExecutionContext.class.getDeclaredField("endedOn")
exeConEndedField.setAccessible(true);

PreparedStatement doesTraceExistStatement = con.prepareStatement(doesWorkflowTraceExist);

def boolean traceExists(PreparedStatement doesTraceExistStatement, String id) {
    doesTraceExistStatement.setString(1, id.toString());
    ResultSet traceExistsResultSet = doesTraceExistStatement.executeQuery();
    if (traceExistsResultSet.next()) {
        return true;
    }
    return false;
}

def boolean isMetadataClosed(PreparedStatement metadataClosedStatement, String id) {
    metadataClosedStatement.setString(1, id);
    metadataClosedStatement.setString(2, "CLOSED");
    ResultSet results = metadataClosedStatement.executeQuery();
    if (results.next()) {
        return true;
    }
    return false;
}

def boolean isMySql(String dbType) {
    return "mysql".equals(dbType);
}

def doUpdate = { resultSet ->
    UUID id = UUID.fromString(resultSet.getString(1));
    Blob wfData = resultSet.getBlob(2);

    InputStream is = wfData.getBinaryStream();
    byte[] data;
    byte[] buf = new byte[1024];
    int n = -1;
    ByteArrayOutputStream os = new ByteArrayOutputStream();
    while ((n = is.read(buf, 0, buf.length)) != -1) {
         os.write(buf, 0, n);
    }
    os.flush();
    data = os.toByteArray();
    WorkflowRecord rec = new WorkflowRecord();
    idField.set(rec, id);
    dataField.set(rec, data);

    ExecutionContext context;
    Long startTime;
    Workflow wf;
    try {
        wf = rec.getWorkflow();
        context = wf.getRootExecutionContext();
        startTime = context.getStartedOn(); // Ensure we have this if we need to update metadata.
    }
    catch (InvalidClassException e) {
        // This workflow was broken by a previous upgrade
        // We'll skip it and let it get deleted at the end of the script
    }

    // If the trace already exists don't bother trying to move it.
    if (wf != null && !traceExists(doesTraceExistStatement, id.toString())) {
        context.setExecutionStatus(ExecutionStatus.CLOSED);
        exeConResultField.set(context, ExecutionResult.CANCELED);
        exeConEndedField.set(context, endTime);
        WorkflowTrace trace = WorkflowTrace.fromWorkflow(wf);
        WorkflowTraceRecord traceRec = new WorkflowTraceRecord(trace);
        String traceData = traceDataField.get(traceRec);
        traceInsert.setString(1, id.toString());
        traceInsert.setCharacterStream(2, new StringReader(traceData), traceData.length());
        traceInsert.execute();
    }

    // Only update the metadata if its status is not already set to closed.
    if (hasMetadataTable && !isMetadataClosed(metadataClosedStatement, id.toString())) {
        long duration = 0;
        if (startTime != null) {
            duration = endTime - startTime;
        }
        metadataUpdate.setString(1, "CANCELED");
        metadataUpdate.setString(2, "CLOSED");
        metadataUpdate.setLong(3, endTime);
        metadataUpdate.setLong(4, duration);
        metadataUpdate.setString(5, "N");
        metadataUpdate.setString(6, id.toString());
        metadataUpdate.execute();
    }
}

if (isMySql(dbtype)) {
    PreparedStatement getWorkflowsStatement = con.prepareStatement(getWorkflowsMysql);
    PreparedStatement getCountStatement = con.prepareStatement(mysqlCountStatement);
    ResultSet resultCount = getCountStatement.executeQuery();
    resultCount.next();
    int count = resultCount.getInt(1);

    for (int i = 0; i < count; i += 500) {
        getWorkflowsStatement.setInt(1, i);
        ResultSet rs = getWorkflowsStatement.executeQuery();
        while (rs.next()) {
            doUpdate(rs);
        }
        rs.close();
    }


}
else {
    queryStmt.execute(getWorkflows);
    ResultSet rs = queryStmt.getResultSet();
    if (rs != null) {
        while (rs.next()) {
            doUpdate(rs);
        }
        rs.close();
    }
}

//commit here because db2 can only use truncate when it is the first stmt in a transaction
con.commit();
con.createStatement().execute(deleteStmt);
con.createStatement().execute(deleteLocks);

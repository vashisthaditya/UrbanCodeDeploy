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
import java.lang.Number;
import java.util.HashMap
import java.util.Map
import java.sql.Clob

def connection = this.binding['CONN'];
def sql = new Sql(connection)

String countPersistentRecords = "select count(*) from vc_persistent_record"

//rnum = offset, rownum = limit
String selectPersistentRecords =
''' select * from (
        select id, path, relative_version, persistent_data, rownum as rnum
        from vc_persistent_record
        order by id
    )
    where rnum > ? and rownum <= 100
'''

String updatePersistentRecord = '''
update vc_persistent_record
    set persistent_data = ?
    where path=? and relative_version=?
''';

String getAllTaskDefs = '''select * from tsk_task_definition '''



def updateAppProcess(String xmlString, String path, int version, def taskDefinitions) {
    def root = new XmlParser().parseText(xmlString);
    def activity = root.activityGraph.activity.children.activity.findAll{ it.@class == "com.urbancode.ds.subsys.task.domain.activity.ApplicationManualTaskActivity" }

    if (activity.size() > 0) {
        activity.each{ act ->
            def props = act.properties[0];
            def taskDef = props.property.find{it.@name == "taskDefinitionId"};
            def currentTask;
            taskDefinitions.each{ task ->
                if (task.id.equals(taskDef.@value.toString()) ) {
                    currentTask = task.template_name;
                }
            }
            props.remove(taskDef);
            Map newNodeProps = new HashMap();
            newNodeProps.put('name', 'templateName');
            newNodeProps.put('value', currentTask);
            props.appendNode('property', newNodeProps);
        }
        def edittedProcess = XmlUtil.serialize(root);
        return edittedProcess;
    }
}

def updateCompProcess(String xmlString, String path, int version, def taskDefinitions) {
    def root = new XmlParser().parseText(xmlString);
    def activity = root.activityGraph.activity.children.activity.findAll{ it.@class == "com.urbancode.ds.subsys.task.domain.activity.ComponentManualTaskActivity" }

    if (activity.size() > 0) {
        activity.each{ act ->
            def props = act.properties[0];
            def taskDef = props.property.find{it.@name == "taskDefinitionId"};
            def currentTask;
            taskDefinitions.each{ task ->
                if (task.id.equals(taskDef.@value.toString()) ) {
                    currentTask = task.template_name;
                }
            }
            props.remove(taskDef);
            Map newNodeProps = new HashMap();
            newNodeProps.put('name', 'templateName');
            newNodeProps.put('value', currentTask);
            props.appendNode('property', newNodeProps);
        }
        def edittedProcess = XmlUtil.serialize(root);
        return edittedProcess;
    }
}


println "Updating persistent records. Current time: ${new Date()}";
Number persistentRowCount = sql.firstRow(countPersistentRecords)[0];
println "($persistentRowCount rows found)";

def taskDefinitions = sql.rows(getAllTaskDefs);

def rangeMax = 100;
long countDown = persistentRowCount.longValue();
def firstIteration = true;
while (rangeMax < persistentRowCount || firstIteration) {
    def results = sql.rows(selectPersistentRecords, [rangeMax]);
    results.each{ row ->
        int version = row.relative_version
        String path = row.path;
        String xmlString;
        if (row.persistent_data instanceof Clob) {
            xmlString = row.persistent_data.getCharacterStream().getText();
        } else {
            xmlString = row.persistent_data;
        }

        def updatedProcess;
        if (path.matches("^applications/[a-zA-Z0-9-]{36}/processes/[a-zA-Z0-9-]{36}")) {
            updatedProcess = updateAppProcess(xmlString, path, version, taskDefinitions);
        }

        if (path.matches("^components/[a-zA-Z0-9-]{36}/processes/[a-zA-Z0-9-]{36}")) {
            updatedProcess = updateCompProcess(xmlString, path, version, taskDefinitions);
        }

        if (updatedProcess != null) {
            sql.execute(updatePersistentRecord, [updatedProcess, path, version]);
        }

        countDown--;
        if (countDown % 500 == 0) {
            println "${new Date()} $countDown rows left.";
        }
    }
    rangeMax += 100;
    firstIteration = false;
}
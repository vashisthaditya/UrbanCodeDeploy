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
import java.util.HashMap
import java.util.Map
import java.sql.Clob

def connection = this.binding['CONN'];
def sql = new Sql(connection)

def commitId = sql.firstRow('select max(id) as id from vc_commit').id+1

String selectAllRecordsPath = '''select distinct path from vc_persistent_record where path like 'reports/%' '''
String selectRecordClob = '''select persistent_data from vc_persistent_record where path=?'''
String selectDeletedPath = '''select * from vc_persistent_record where path=? and relative_version=(select max(relative_version) as relative_version from vc_persistent_record where path=?)'''

String insertRecordPath = '''insert into vc_persistent_record (id, path, commit_id, relative_version, directory, persistent_data, deleted) values (?, ?, ?, ?, ?, ?, 'Y')'''
String insertCommitPath = '''insert into vc_commit_path_entry (id, commit_id, path, entry_type) values (?, ?, ?, 'DELETED')'''
String insertCommit = '''insert into vc_commit (id, commit_time, commit_user, commit_comment) values (?, ?, 'admin', '')'''

def allReportPaths = []
def customPaths = []

sql.eachRow(selectAllRecordsPath) { it ->
    if (!it.path.contains("reports/system") && !it.path.contains("reports/default")) {
        allReportPaths << it.path
    }
}

for (def path : allReportPaths) {
    String xmlString
    
    def row = sql.firstRow(selectRecordClob, [path])
    if (row.persistent_data instanceof Clob) {
        xmlString = row.persistent_data.getCharacterStream().getText();
    }
    else {
        xmlString = row.persistent_data;
    }
    
    def root = new XmlParser().parseText(xmlString);
    if (root.@class.equals("com.urbancode.ds.subsys.report.domain.security_report.role.SecurityReportRole")) {
        customPaths << path
    }
}

boolean firstRun = true;

for (def path : customPaths) {
    def row = sql.firstRow(selectDeletedPath, [path, path])
    if (row.deleted.equals("N")) {
        if (firstRun) {
            sql.execute(insertCommit, [commitId, System.currentTimeMillis()])
            firstRun = false
        }
        sql.execute(insertRecordPath, [UUID.randomUUID().toString(), row.path, commitId, row.relative_version+1, row.directory, row.persistent_data])
        sql.execute(insertCommitPath, [UUID.randomUUID().toString(), commitId, row.path])
    }
}


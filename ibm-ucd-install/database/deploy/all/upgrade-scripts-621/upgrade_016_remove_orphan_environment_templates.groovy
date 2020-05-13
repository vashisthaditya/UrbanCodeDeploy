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
import java.sql.Clob

def sql = new Sql(this.binding['CONN']);

def addCommit = '''
    INSERT INTO vc_commit
    (id, commit_time, commit_user, commit_comment)
    VALUES
    (?, ?, 'admin', '')
''';

def addPersistentRecord = '''
    INSERT INTO vc_persistent_record
    (id, path, commit_id, relative_version, directory, persistent_data, deleted)
    VALUES (?, ?, ?, ?, ?, ?, 'Y')
''';

def addCommitPathEntry = '''
    INSERT INTO vc_commit_path_entry
    (id, commit_id, path, entry_type)
    VALUES
    (?, ?, ?, 'DELETED')
''';

def deletedAppTemplatesQuery = '''
    SELECT *
    FROM vc_persistent_record
    WHERE path LIKE 'applicationTemplates/________-____-____-____-____________'
    AND deleted = 'Y'
''';

def updateLatestVersionEntry = '''
    UPDATE vc_latest_version_entry
    SET persistent_record_id = ?
    WHERE path = ?
''';

def row = sql.firstRow('SELECT max(id) AS id FROM vc_commit');
// If row.id is null then that means there are no entries in vc_commit or vc_persistent_record
// and so we can assert there is no work that needs to be done.
if (row.id != null) {
    def commitId = row.id + 1;

    sql.execute(addCommit, [commitId, System.currentTimeMillis()]);

    sql.eachRow(deletedAppTemplatesQuery) { appTemplate ->
        def environmentTemplatesQuery = '''
            SELECT *
            FROM vc_persistent_record
            WHERE path LIKE ?
        ''';

        def envTemplatePath = appTemplate.getProperty('path') + '/environmentTemplates/________-____-____-____-____________';

        def environmentTemplateDir = appTemplate.getProperty('path') + '/environmentTemplates';

        sql.eachRow(environmentTemplatesQuery, [envTemplatePath]) { environmentTemplate ->
            def path = environmentTemplate.getProperty('path');
            def relativeVersion = environmentTemplate.getProperty('relative_version') + 1;

            def persistentClobData;
            if (environmentTemplate.persistent_data instanceof Clob) {
                persistentClobData =  environmentTemplate.persistent_data.getCharacterStream().getText();
            } else {
                persistentClobData = environmentTemplate.persistent_data;
            }

            def persistentXmlData = new XmlParser().parseText(persistentClobData);
            def persistentData = XmlUtil.serialize(persistentXmlData);

            def persistentRecordUUID = UUID.randomUUID().toString();
            sql.execute(addPersistentRecord, [persistentRecordUUID, path, commitId, relativeVersion, environmentTemplateDir, persistentData]);
            sql.execute(updateLatestVersionEntry, [persistentRecordUUID, path]);

            def commitPathEntryUUID = UUID.randomUUID().toString();
            sql.execute(addCommitPathEntry, [commitPathEntryUUID, commitId, path]);
        }
    }
}
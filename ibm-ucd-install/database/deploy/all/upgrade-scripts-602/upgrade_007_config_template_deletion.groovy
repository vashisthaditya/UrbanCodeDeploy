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
import java.sql.Clob
import java.util.List
import java.util.ArrayList
import java.util.Map
import java.util.HashMap

def connection = this.binding['CONN']
def sql = new Sql(connection)

def getConfigTemplateRecords = '''
    select id, path, commit_id, persistent_data
    from vc_persistent_record
    where path like 'components/%/configTemplates/%'
'''

def markDeletedCommitPathEntry = '''
    update vc_commit_path_entry
    set entry_type = 'DELETED'
    where path = ? and commit_id = ?
'''

def markDeletedPersistentRecord = '''
    update vc_persistent_record
    set deleted = 'Y'
    where id = ?
'''

def idsToMarkDeleted = [];
sql.eachRow(getConfigTemplateRecords) { row ->
    def xmlString;
    if (row.persistent_data instanceof Clob) {
        xmlString = row.persistent_data.getCharacterStream().getText();
    }
    else {
        xmlString = row.persistent_data;
    }
    
    def configTemplateElementStart = xmlString.indexOf("<configTemplate");
    def configTemplateElementEnd = xmlString.indexOf(">", configTemplateElementStart);
    
    // Look for active="false" inside the <configTemplate> element's attributes
    def activeFalseIndex = xmlString.indexOf("active=\"false\"");
    if (activeFalseIndex > 0 && activeFalseIndex < configTemplateElementEnd) {
        idsToMarkDeleted.add(row.id);

        // Update the commit path entry for this commit to show that it deleted this record
        sql.executeUpdate(markDeletedCommitPathEntry, [row.path, row.commit_id]);
    }
}

idsToMarkDeleted.each() { id ->
    sql.executeUpdate(markDeletedPersistentRecord, [id]);
}
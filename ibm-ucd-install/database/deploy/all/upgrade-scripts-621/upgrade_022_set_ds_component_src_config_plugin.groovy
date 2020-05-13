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

import java.sql.Clob

import groovy.sql.Sql

def connection = this.binding['CONN'];
Sql sql = new Sql(connection);

final String getRelevantComponents = '''
SELECT *
FROM ds_component
WHERE template_id IS NOT NULL
AND source_config_plugin IS NULL
'''

final String getPersistentRecordById = '''
SELECT *
FROM vc_persistent_record
WHERE id = ?
'''

final String getComponentTemplatePersistentRecordByPathAndVersion = '''
SELECT *
FROM vc_persistent_record
WHERE path = ?
AND relative_version = ?
'''

def getLatestVersionEntry = '''
SELECT *
FROM vc_latest_version_entry
WHERE path = ?
''';

final String updateComponentSourceConfigPluginName = '''
UPDATE ds_component
SET source_config_plugin = ?
WHERE id = ?
'''

public String getPathForComponentTemplateId(String id) {
    return "componentTemplates/" + id;
}

public Node getXMLNodeFromPersistentRow(def row) {
    String persistentClobData;
    if (row.persistent_data instanceof Clob) {
        persistentClobData = row.persistent_data.getCharacterStream().getText();
    }
    else {
        persistentClobData = row.persistent_data;
    }

    return new XmlParser().parseText(persistentClobData);
}

sql.eachRow(getRelevantComponents) { row ->
    String templateId = row['template_id'];
    Integer templateVersion = (Integer)row['template_version'];
    String templatePath = getPathForComponentTemplateId(templateId);
    String templateQuery;
    def templateQueryParams;

    if (templateVersion == -1) {
        latestVersionEntry = sql.firstRow(getLatestVersionEntry, [templatePath]);
        persistentRecordId = latestVersionEntry['persistent_record_id'];

        templateQuery = getPersistentRecordById;
        templateQueryParams = [persistentRecordId];
    }
    else {
        templateQuery = getComponentTemplatePersistentRecordByPathAndVersion;
        templateQueryParams = [templatePath, templateVersion];
    }

    // Using foreach keeps the transaction open long enough to get the clobs in db2.  (Hack around db2's progressive clob thing)
    Node templateNode = null;
    sql.eachRow(templateQuery, templateQueryParams) { templateRow ->
        if (templateNode == null) {
            templateNode = getXMLNodeFromPersistentRow(templateRow);
        }
    }
    if (templateNode != null) {
        String srcConfigPluginName = templateNode.attribute("sourceConfigPluginName");

        if (srcConfigPluginName != null && !srcConfigPluginName.isEmpty()) {
            sql.executeUpdate(updateComponentSourceConfigPluginName, [srcConfigPluginName, row['id']]);
        }
    }
}

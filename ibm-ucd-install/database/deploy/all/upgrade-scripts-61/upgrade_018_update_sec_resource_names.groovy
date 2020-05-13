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

import java.util.List
import java.util.ArrayList
import java.util.Map
import java.util.HashMap
import java.sql.Clob

def connection = this.binding['CONN'];
def sql = new Sql(connection)


String updateSecuredResource = '''update sec_resource set name = ? where id = ?'''

sql.eachRow('select path, max(commit_id) as commitId from vc_persistent_record where directory=? group by path ', ["processes"]) { record ->
    sql.eachRow('select persistent_data from vc_persistent_record where deleted = ? and path=? and commit_id=?', ["N", record.path, record.commitId]) { row ->
        if (row.persistent_data instanceof Clob) {
            xmlString = row.persistent_data.getCharacterStream().getText();
        } else {
            xmlString = row.persistent_data;
        }
        def root = new XmlParser().parseText(xmlString);
        def resourceId = root.@resourceId;
        def resourceName = root.@name
        sql.execute(updateSecuredResource, [resourceName, resourceId]);
    }
}
sql.eachRow('select path, max(commit_id) as commitId from vc_persistent_record where directory=? group by path ', ["componentTemplates"]) { record ->
    sql.eachRow('select persistent_data from vc_persistent_record where deleted = ? and path=? and commit_id=?', ["N", record.path, record.commitId]) { row ->
        if (row.persistent_data instanceof Clob) {
            xmlString = row.persistent_data.getCharacterStream().getText();
        } else {
            xmlString = row.persistent_data;
        }
        def root = new XmlParser().parseText(xmlString);
        def resourceId = root.@resourceId;
        def resourceName = root.@name
        sql.execute(updateSecuredResource, [resourceName, resourceId]);
    }
}


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
import com.urbancode.ds.upgrade.upgrade50.*
import java.util.List
import java.util.ArrayList
import java.util.Map
import java.util.HashMap
import java.sql.Clob

def connection = this.binding['CONN'];
def sql = new Sql(connection)


String updateSecuredResource = '''update sec_resource set enabled = 'N' where id = ?'''

sql.eachRow('select persistent_data from vc_persistent_record where directory = ? and deleted = ?', ["processes", "Y"]) { row ->
    if (row.persistent_data instanceof Clob) {
        xmlString = row.persistent_data.getCharacterStream().getText();
    } else {
        xmlString = row.persistent_data;
    }
    def root = new XmlParser().parseText(xmlString);
    def resourceId = root.@resourceId;
    sql.execute(updateSecuredResource, [resourceId]);
}
sql.eachRow('select persistent_data from vc_persistent_record where directory = ? and deleted = ?', ["componentTemplates", "Y"]) { row ->
    if (row.persistent_data instanceof Clob) {
        xmlString = row.persistent_data.getCharacterStream().getText();
    } else {
        xmlString = row.persistent_data;
    }
    def root = new XmlParser().parseText(xmlString);
    def resourceId = root.@resourceId;
    sql.execute(updateSecuredResource, [resourceId]);
}
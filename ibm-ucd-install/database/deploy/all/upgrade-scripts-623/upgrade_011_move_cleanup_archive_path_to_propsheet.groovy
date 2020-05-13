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
import com.urbancode.commons.util.SortedProperties
import groovy.sql.Sql

def connection = this.binding['CONN'];
def sql = new Sql(connection)

def properties = this.binding['ANT_PROPERTIES'];
def installDir = properties["install.dir"];

def SQL_QUERY = '''
    INSERT INTO ps_prop_value (id, version, name, value, long_value, label, long_label, description, secure, prop_sheet_id)
    VALUES (?, 0, 'cleanup.archive.path', ?, null, null, null, null, 'N', '00000000-0000-0000-0000-000000000001')
''';

File propertiesFile = new File(installDir + "/conf/server/installed.properties");
InputStream inputStream = new FileInputStream(propertiesFile);

try {
    def props = new SortedProperties();
    props.load(inputStream);
    String value = props.get("cleanup.archive.path");

    sql.execute(SQL_QUERY, [UUID.randomUUID().toString(), value]);
}
finally {
    inputStream.close();
}
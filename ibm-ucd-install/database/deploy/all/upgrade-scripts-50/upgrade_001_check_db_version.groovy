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

def connection = this.binding['CONN'];
def sql = new Sql(connection)

def getDbVersion = '''
    select ver from ds_db_version where release_name = '4.8'
'''

def validVersion = false;
sql.eachRow(getDbVersion) { versionRow ->
    if (versionRow['ver'] >= 38) {
        validVersion = true;
    }
}

if (!validVersion) {
    throw new RuntimeException("uDeploy must be upgraded to 4.8.3 or greater before this upgrade can be applied.")
}
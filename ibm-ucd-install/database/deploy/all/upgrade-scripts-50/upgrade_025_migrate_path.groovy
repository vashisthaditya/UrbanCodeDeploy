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


def getResources = '''
    select id, name, parent_id from ds_resource
'''


def setPath = '''
   update ds_resource
   set path = ?
   where id = ? 
'''




def rows = sql.rows(getResources);
def rowMap = [:];

rows.each { row ->
    def resId = row['id']
    def resName = row['name']
    def parentId = row['parent_id']
    def propMap = [:];
    propMap['name'] = resName;
    propMap['parentId'] = parentId;
    rowMap[resId] = propMap;
}

def getParentPath;
getParentPath = { resId ->
    def result = "";
    def propMap = rowMap[resId]
    if (propMap['parentId'] != null) {
        result = getParentPath(propMap['parentId']) + "/" + propMap['name'];
    }
    else {
        result = "/" + propMap['name'];
    }
    
    return result;
}

rowMap.each { id, propMap ->
    def resId = id
    
    def resPath = getParentPath(resId);
    
    sql.executeUpdate(setPath, [resPath,resId])
}

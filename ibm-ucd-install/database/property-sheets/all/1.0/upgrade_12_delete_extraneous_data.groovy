/*
* Licensed Materials - Property of IBM* and/or HCL**
* UrbanCode Deploy
* UrbanCode Build
* UrbanCode Release
* AnthillPro
* (c) Copyright IBM Corporation 2011, 2017. All Rights Reserved.
* (c) Copyright HCL Technologies Ltd. 2018. All Rights Reserved.
*
* U.S. Government Users Restricted Rights - Use, duplication or disclosure restricted by
* GSA ADP Schedule Contract with IBM Corp.
*
* * Trademark of International Business Machines
* ** Trademark of HCL Technologies Limited
*/
import groovy.sql.Sql;
import groovy.sql.BatchingPreparedStatementWrapper

def connection = this.binding['CONN'];
def sql = new Sql(connection)

def boolean mysql = sql.getConnection().getMetaData().getURL().contains("jdbc:mysql")

if (mysql) {
    // Mysql will load all entries of a table into memory, unless we tell it
    // to only load 1 entry at a time.
    sql.withStatement { stmt -> stmt.fetchSize = Integer.MIN_VALUE }
}

final String getAllowedValues = '''
    select *
    from ps_prop_def_allowed_value
    order by prop_def_id, index_order asc
'''

final String deleteEntry = '''
    delete from ps_prop_def_allowed_value
    where id = ?
'''

def previousPropDefId = ""
def deletableIds = []
def currentIndex = -1

sql.eachRow(getAllowedValues) { group ->
    def propDefId = group['prop_def_id']
    def id = group['id']
    def index = group['index_order']
    if (propDefId != previousPropDefId) {
        previousPropDefId = propDefId
        currentIndex = index
    }
    else if (index == currentIndex) {
        deletableIds.add(id)
    }
    else {
        currentIndex = index
    }
}

for (def i = 0; i < deletableIds.size(); i++) {
    sql.execute(deleteEntry, [deletableIds[i]])
}
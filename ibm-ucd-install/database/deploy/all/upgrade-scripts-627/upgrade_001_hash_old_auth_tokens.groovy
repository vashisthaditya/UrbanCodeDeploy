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
import java.sql.Connection
import java.sql.PreparedStatement
import java.sql.ResultSet

import com.urbancode.security.AuthToken

Connection connection = this.binding['CONN']
connection.setAutoCommit(false)

int commitSize = 500

def deleteTokenSql = '''
    delete from
        sec_auth_token
    where
        expiration < ?
        or
            (expiration = ? and (description is null or description != 'Pattern Token'))
'''

def getTokensSql = '''
    select
        token, id
    from
        sec_auth_token
'''

def addHashedTokenSQL = '''
    update
        sec_auth_token
    set
        token = ?
    where
        id = ?
'''

def boolean isUUID(String s) {
    return s.charAt(8) == '-' as char
}

PreparedStatement deleteInvalidTokens = connection.prepareStatement(deleteTokenSql)
deleteInvalidTokens.setLong(1, System.currentTimeMillis())
deleteInvalidTokens.setLong(2, Long.MAX_VALUE)
deleteInvalidTokens.executeUpdate()

HashMap<String, String> idToToken = new HashMap<String, String>()
PreparedStatement getTokensStatement = connection.prepareStatement(getTokensSql)
ResultSet resultSet = getTokensStatement.executeQuery()

if (resultSet != null) {
    while (resultSet.next()) {
        idToToken.put(resultSet.getString("id"), resultSet.getString("token"))
    }
}

resultSet.close()

long count = 0L
PreparedStatement addTokenStatement
for (String id : idToToken.keySet()) {
    String possibleUnhashedToken = idToToken.get(id)

    if (isUUID(possibleUnhashedToken)) {
        count++
        if (count % commitSize == 1) {
            addTokenStatement = connection.prepareStatement(addHashedTokenSQL)
        }

        String hashedToken = AuthToken.hash(possibleUnhashedToken)
        addTokenStatement.setString(1, hashedToken)
        addTokenStatement.setString(2, id)
        addTokenStatement.addBatch()

        if (count % commitSize == 0) {
            addTokenStatement.executeBatch()
            addTokenStatement.close()
            connection.commit()
        }
    }
}

// There are tokens that still need to be updated between the last batch size
// and the end of the table
if (addTokenStatement != null) {
    addTokenStatement.executeBatch()
    addTokenStatement.close()
    connection.commit()
}
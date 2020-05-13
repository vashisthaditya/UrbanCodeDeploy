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
import groovy.sql.Sql;
import java.util.UUID;
import com.urbancode.commons.util.crypto.CryptStringUtil;

def connection = this.binding['CONN'];
def sql = new Sql(connection)

final String getUsers = 'select * from sec_user'
final String updateUserPassword = 'update sec_user set password = ? where id = ?'

sql.eachRow(getUsers) { userRow ->
    def userId = userRow['id']
    def pbePassword = userRow['password']
    if (pbePassword) {
        def clearPassword = CryptStringUtil.getDefaultInstance().decrypt(pbePassword)
        def hashPassword = CryptStringUtil.getDefaultInstance().hash(clearPassword)
        sql.executeUpdate(updateUserPassword, [hashPassword, userId])
    }
}

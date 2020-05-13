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
import org.apache.commons.codec.binary.Base64;
import com.urbancode.commons.util.crypto.CryptStringUtil

def connection = this.binding['CONN'];
def sql = new Sql(connection)

def createUserSQL = """
insert into sec_user (id, version, name, enabled, password, sec_authentication_realm_id)
values (?, 0, ?, 'Y', ?, ?)"""

byte[] randBytes = new byte[128];
Random rand = new Random();
rand.nextBytes(randBytes);
String builtInPassword = Base64.encodeBase64String(randBytes);
builtInPassword = CryptStringUtil.hash(builtInPassword);

sql.execute(createUserSQL, ['cb696ca8-108c-4418-8aee-8e8cc7482078', 'UC No Permissions', builtInPassword, '20000000000000000000000000000001']);

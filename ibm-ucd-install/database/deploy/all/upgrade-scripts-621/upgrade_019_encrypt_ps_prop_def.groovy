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
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.sql.PreparedStatement;
import java.sql.Clob;
import com.urbancode.persistence.IDGenerator
import com.urbancode.commons.util.crypto.CryptStringUtil;
import com.urbancode.commons.util.crypto.algs.Crypt1Alg;
import com.urbancode.commons.util.crypto.algs.CryptStringAlgorithm;
import java.util.Properties;
import java.util.Map;
import java.util.HashMap;
import javax.crypto.SecretKey;
import java.security.KeyStore;
import java.security.Key;
import java.io.InputStream;
import java.io.FileInputStream;
import java.io.File;
import java.io.Reader;
import java.io.StringReader;

Properties properties = this.binding['ANT_PROPERTIES'];
Connection con = this.binding['CONN'];

String encKeyFileLoc = properties["encryption.keystore.file"];
if (encKeyFileLoc == null) {
    encKeyFileLoc = properties["encryption.keystore"];
}
File keyStoreFile = new File(encKeyFileLoc);
String keyStorePassword = properties["encryption.keystore.password"]
if (keyStorePassword == null) {
    keyStorePassword = properties["server.keystore.password"]
}
String keyAlias = properties["encryption.keystore.alias"];
if (keyAlias == null || keyAlias.length() < 0) {
    keyAlias = "desedekey";//versions 4.8.3 and less always used desedekey as default
}

def loadKeyStore = { keyStore, storePassword ->
    KeyStore store = KeyStore.getInstance("JCEKS");
    InputStream is = new FileInputStream(keyStore);
    store.load(is, storePassword.toCharArray());
    is.close();
    return store;
}

def retrieveAliasToSecretKeyMap = { keyStore, storePassword ->
    Map<String, SecretKey> map = new HashMap<String, SecretKey>();
    KeyStore store = loadKeyStore(keyStore, storePassword);
    store.aliases().each { alias ->
        Key key = store.getKey(alias, storePassword.toCharArray());
        if (key instanceof SecretKey) {
            map.put(alias, (SecretKey) key);
        }
    }
    return map;
}

Map<String, SecretKey> keys = retrieveAliasToSecretKeyMap(keyStoreFile, CryptStringUtil.decrypt(keyStorePassword));
String encryptAlg = keys.get(keyAlias).getAlgorithm();
if (encryptAlg.equals("AES")) {
    encryptAlg = "AES/CBC/PKCS5Padding";
}
else {
    encryptAlg = "DESede/CBC/PKCS5Padding";
}
CryptStringAlgorithm encAlg = new Crypt1Alg(keyAlias, encryptAlg, keys);
CryptStringUtil.registerCryptStringAlgorithm(encAlg);
CryptStringUtil.getDefaultInstance().setDefaultCryptAlg(encAlg);

def getUnencryptPropDefs = """
select
  pd.id as id,
  pd.default_value as default_value,
  pd.long_default_value as long_default_value
from
  ps_prop_def pd
where
  (
    pd.default_value not like 'crypt_v%'
    or pd.default_value is null 
  )
  and property_type = 'SECURE'
""";

def updatePropDef = """
update
  ps_prop_def
set
  default_value = ?,
  long_default_value = ?
where
  id =?
""";

Statement queryStmt = con.createStatement();
queryStmt.setFetchSize(500);

PreparedStatement updateStmt = con.prepareStatement(updatePropDef);


def doUpdate = { resultSet, stmt ->
    String propDefId = resultSet.getString(1);
    //curDefValue xor longDefClob should actually hold data
    String curDefValue = resultSet.getString(2);
    Clob longDefClob = resultSet.getClob(3);
    String longDef = null;
    //read the clob

    if (longDefClob != null) {
        StringBuilder builder = new StringBuilder();
        char[] buf = new char[1024];
        Reader reader = longDefClob.getCharacterStream();
        while (reader.read(buf) != -1) {
            builder.append(buf);
        }
        reader.close();
        longDef = builder.toString();
    }

    if (longDef != null && (longDef.length() > 0 && (curDefValue == null || curDefValue.length() < 1))) {
        curDefValue = longDef;
    }

    //go ahead and encrypt pbe values while we are here
    if (curDefValue != null && (!CryptStringUtil.isEncrypted(curDefValue) || curDefValue.startsWith("pbe{"))) {
        //encrypt it and store it in the correct column depending on resulting size
        String newValue = CryptStringUtil.encrypt(CryptStringUtil.decrypt(curDefValue));
        if (newValue.length() > 4000) {
            stmt.setString(1, null);
            stmt.setClob(2, new StringReader(newValue));
            stmt.setString(3, propDefId);
        }
        else {
            stmt.setString(1, newValue);
            stmt.setClob(2, null);
            stmt.setString(3, propDefId);
        }
        stmt.executeUpdate();
    }
}

queryStmt.execute(getUnencryptPropDefs);
ResultSet rs = queryStmt.getResultSet();
if (rs != null) {
    while (rs.next()) {
        doUpdate(rs, updateStmt);
    }
    rs.close();
}

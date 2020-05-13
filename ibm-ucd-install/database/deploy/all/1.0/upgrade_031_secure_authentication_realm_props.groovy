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

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.GeneralSecurityException;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

import javax.crypto.SecretKey;

import com.urbancode.commons.util.crypto.CryptStringUtil;
import com.urbancode.commons.util.crypto.algs.Crypt1Alg;
import com.urbancode.commons.util.crypto.algs.CryptStringAlgorithm;
import com.urbancode.security.AuthenticationRealm

import groovy.sql.Sql

def initializeEncryptionKey(def properties) {
    String keyAlias = properties.get("encryption.keystore.alias");
    String encKeyPass = properties.get("encryption.keystore.password");
    if (encKeyPass == null) {
        println "Property encryption.keystore.password" +
                " not set. Using value from property server.keystore.password";
        encKeyPass = properties.get("server.keystore.password");
    }
    String keyStorePath  = properties.get("encryption.keystore.file");
    if (keyStorePath == null) {
        keyStorePath = (String) properties.get("encryption.keystore");
    }

    // Check that the secret key can be retrieved successfully
    assertSecretKeyExists(keyStorePath,
            keyAlias, CryptStringUtil.decrypt(encKeyPass));

    Map<String, SecretKey> keys = retrieveAliasToSecretKeyMap(
            keyStorePath,
            CryptStringUtil.decrypt(encKeyPass));
    String encryptAlg = keys.get(keyAlias).getAlgorithm();
    if (encryptAlg.equals("AES")) {
        encryptAlg = "AES/CBC/PKCS5Padding";
    }
    else {
        encryptAlg = "DESede/CBC/PKCS5Padding";
    }
    CryptStringAlgorithm aesAlg = new Crypt1Alg(keyAlias, encryptAlg, keys);
    CryptStringUtil.registerCryptStringAlgorithm(aesAlg);
    CryptStringUtil.getDefaultInstance().setDefaultCryptAlg(aesAlg);
}

def retrieveAliasToSecretKeyMap(String keyStorePath, String keyStorePassword) {
    Map<String, SecretKey> keys = new HashMap<String, SecretKey>();
    KeyStore keyStore = loadKeyStore(keyStorePath, keyStorePassword);
    Enumeration<String> aliases = keyStore.aliases();
    while(aliases.hasMoreElements()){
        String alias = aliases.nextElement();
        java.security.Key key = keyStore.getKey(alias, keyStorePassword.toCharArray());
        if (key instanceof SecretKey){
            keys.put(alias, (SecretKey) key);
        }
    }
    return keys;
}

def loadKeyStore(String keyStoreFilePath, String keyStorePassword) {
    String type = "JCEKS";
    KeyStore keyStore = null;
    try {
        keyStore = KeyStore.getInstance(type);
    }
    catch (KeyStoreException e) {
        throw new RuntimeException("Key store type \"" + type + "\" is not available", e);
    }
    File file = new File(keyStoreFilePath);
    InputStream inStream = new FileInputStream(file);
    try {
        keyStore.load(inStream, keyStorePassword.toCharArray());
    }
    finally {
        inStream.close();
    }
    return keyStore;
}

def assertSecretKeyExists(String keyStorePath, String alias, String keyStorePassword) {
    KeyStore keyStore = loadKeyStore(keyStorePath, keyStorePassword);
    java.security.Key key = keyStore.getKey(alias, keyStorePassword.toCharArray());
    if (key == null) {
        throw new GeneralSecurityException("Could not retrieve encryption key from keystore. Shutting down.");
    }
    else if (!(key instanceof SecretKey)) {
        StringBuilder builder = new StringBuilder();
        builder.append("Stored key was not of the expected type!");
        builder.append("\nExpected type: ");
        builder.append(SecretKey.class.getCanonicalName());
        builder.append("\nReturned type: ");
        builder.append(key.getClass().getCanonicalName());
        throw new GeneralSecurityException(builder.toString());
    }
}

boolean propertyShouldBeSecure(String propertyName) {
    return AuthenticationRealm.getSecurePropertyNames().contains(propertyName);
}

def properties = this.getBinding().getVariable("ANT_PROPERTIES");
def connection = this.binding['CONN'];
Sql sql = new Sql(connection)

final String getAuthenticationRealmProperties = '''
SELECT *
FROM sec_authentication_realm_prop
'''

initializeEncryptionKey(properties);

final String updateWithEncryptedValue = '''
UPDATE sec_authentication_realm_prop
SET value = ?
WHERE sec_authentication_realm_id = ?
    AND name = ?
    AND value = ?
'''

// figure out which rows are relevant (just grab the id and value of each one)
sql.eachRow(getAuthenticationRealmProperties) { row ->
    String propName = row['name'];
    if (propertyShouldBeSecure(propName)) {
        String currentValue = (String)row['value'];
        if (!CryptStringUtil.isEncrypted(currentValue)) {
            String encryptedValue = CryptStringUtil.encrypt(currentValue);
            sql.executeUpdate(
                updateWithEncryptedValue,
                [encryptedValue, row['sec_authentication_realm_id'], row['name'], currentValue]);
        }
    }
}

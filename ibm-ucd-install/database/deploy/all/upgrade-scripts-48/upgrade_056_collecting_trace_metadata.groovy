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


import groovy.sql.BatchingPreparedStatementWrapper
import groovy.sql.Sql
import org.codehaus.jettison.json.JSONObject
import java.sql.Clob
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
import com.urbancode.ds.subsys.system.SystemConfiguration


// ------------------------------------------------------------------------------------------------
// KeyStore Method Declarations
// ------------------------------------------------------------------------------------------------

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

// ------------------------------------------------------------------------------------------------
// SET UP
// ------------------------------------------------------------------------------------------------

def connection = this.binding['CONN']
def sql = new Sql(connection)

// Used only for batching the writes for mysql
def MAX_NUM_ROWS = 10000
def paramsArray = []
def finishedCount = 0
def startTime = System.currentTimeMillis()
def boolean mysql = sql.getConnection().getMetaData().getURL().contains("jdbc:mysql")
def boolean sqlserver = sql.getConnection().getMetaData().getURL().contains("jdbc:sqlserver")

if (mysql) {
    // Mysql will load all entries of a table into memory, unless we tell it
    // to only load 1 entry at a time.
    sql.withStatement { stmt -> stmt.fetchSize = Integer.MIN_VALUE }
}

def getWorkflowTracesJson = '''
    select wt.workflow_trace_data as wt_json, wt.id as wt_id
    from wf_workflow_trace wt
'''

def createWorkflowMetadataEntry = '''
    insert into wf_workflow_metadata (workflow_trace_id, status, start_time, paused)
        select wf.id, 'EXECUTING', ?, 'N'
        from wf_workflow wf
        where wf.id not in (select wt.id from wf_workflow_trace wt)
'''

def createTraceMetadataEntry = '''
    insert into wf_workflow_metadata (workflow_trace_id, result, status, start_time, end_time, duration_time, paused)
    values (?, ?, ?, ?, ?, ?, ?)
'''

def getNumTraces = '''
    select count(id) as num_traces from wf_workflow_trace
'''

def Closure createTraceMetadataWithBatch = {
    sql.withBatch(MAX_NUM_ROWS, createTraceMetadataEntry) { BatchingPreparedStatementWrapper ps ->
        for (j = 0; j < paramsArray.size(); j++) {
            ps.addBatch(paramsArray[j])
        }
    }
}

def properties = this.getBinding().getVariable("ANT_PROPERTIES");
initializeEncryptionKey(properties);

// ------------------------------------------------------------------------------------------------
// RUNNING QUERIES
// ------------------------------------------------------------------------------------------------


def totalCount = sql.firstRow(getNumTraces)['num_traces']

println " This upgrade may take some time to complete. Please do not end the upgrade prematurely."

println " Step 1 of 2: Writing new workflow metadata. " + totalCount + " metadata entries to create..."

sql.eachRow(getWorkflowTracesJson) { traceRow ->
    def workflowText = traceRow['wt_json']
    if (traceRow['wt_json'] instanceof Clob) {
        java.sql.Clob clob = (java.sql.Clob) traceRow['wt_json']
        workflowText = clob.getCharacterStream().getText()
    }

    if (CryptStringUtil.isEncrypted(workflowText)) {
        workflowText = CryptStringUtil.decrypt(workflowText);
    }
    def traceJson = new JSONObject(workflowText)
    def params = []

    // Not Null
    def traceId = traceRow['wt_id']
    def tracePaused = 'N'

    // Nullable
    def traceStart = null
    def traceEnd = null
    def traceResult = null
    def traceStatus = null
    def traceDuration = null

    try {
        def root = traceJson.optJSONObject("rootActivityTrace")
        if (root != null) {
            if (root.has("startDate") && !root.isNull("startDate")) {
                traceStart = root.getLong("startDate")
            }
            if (root.has("endDate") && !root.isNull("endDate")) {
                traceEnd = root.getLong("endDate")
            }
            if (root.has("result") && !root.isNull("result")) {
                traceResult = root.get("result")
            }
            if (root.has("status") && !root.isNull("status")) {
                traceStatus = root.get("status")
            }
            if (traceJson.has("paused") && !traceJson.isNull("paused")) {
                tracePaused = traceJson.getBoolean("paused") ? 'Y' : 'N'
            }
            if (traceEnd != null && traceStart != null) {
                traceDuration = traceEnd - traceStart
            }
        }

        //(workflow_trace_id, result, status, start_time, end_time, duration_time, paused)
        params.add(traceId)
        params.add(traceResult)
        params.add(traceStatus)
        params.add(traceStart)
        params.add(traceEnd)
        params.add(traceDuration)
        params.add(tracePaused)

        if (mysql || sqlserver) {
            paramsArray.add(params)
        }
        else {
            sql.execute(createTraceMetadataEntry, params)
        }
    }
    catch (Exception e) {
        println "Failed to process trace " + traceId + " with data " + traceJson
        throw e
    }

    finishedCount++;
    if (finishedCount % 500 == 0) {
        def elapsedTime = System.currentTimeMillis() - startTime
        def remainingCount = totalCount - finishedCount
        def timePerWorkflow = elapsedTime / finishedCount
        def timeRemaining = Math.floor(timePerWorkflow * remainingCount / 1000)
        def hoursRemaining = Math.floor(timeRemaining / 3600)
        timeRemaining -= hoursRemaining * 3600
        def minutesRemaining = Math.floor(timeRemaining / 60)
        timeRemaining -= minutesRemaining * 60

        println sprintf("                 " + remainingCount + " remaining - estimated time left (h:mm:ss): %1.0f:%02.0f:%02.0f", hoursRemaining, minutesRemaining, timeRemaining);
    }

}

if (mysql || sqlserver) {

    // Because mysql can't do another sql call while it's doing a streaming read
    // we are batch sending all the collected data from the closure above.
    sql.withTransaction(createTraceMetadataWithBatch)
}

print "        Number of entries created: " + finishedCount + "\r"

println "    Step 2 of 2: Writing new workflow metadata for running workflow records..."
sql.execute(createWorkflowMetadataEntry, startTime)

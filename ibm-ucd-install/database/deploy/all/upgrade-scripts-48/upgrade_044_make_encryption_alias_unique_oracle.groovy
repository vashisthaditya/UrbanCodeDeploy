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
import groovy.xml.XmlUtil
import groovy.util.XmlParser

import com.urbancode.cm.db.updater.ApplyException;
import com.urbancode.commons.util.crypto.CryptStringUtil

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.Number;
import java.security.GeneralSecurityException;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.sql.SQLDataException;
import java.sql.Clob;
import java.util.HashMap;
import java.util.Map;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.apache.commons.codec.binary.Base64;
import org.apache.commons.io.FileUtils;

def properties = this.binding['ANT_PROPERTIES'];
oldAlias = "desEdeKey"
keyAlias = properties["key.store.des.alias"];
File keyStoreFile = new File((String) properties["encryption.keystore.file"]);
def keyStorePassword = properties["key.store.password"]
def connection = this.binding['CONN'];
def sql = new Sql(connection)

//rnum = offset, rownum = limit
String selectPersistentRecords =
'''select * from (
     select id, persistent_data, rownum as rnum
     from vc_persistent_record 
     order by id
 )
 where rnum > ? and rownum <= 100'''

String selectSecurePropDef =
'''select * from (
     select id, default_value, long_default_value, property_type, rownum as rnum
     from ps_prop_def
     order by id
 )
 where rnum > ? and rownum <= 100'''

String selectSecureUsers =
'''select * from (
     select id, password, rownum as rnum
     from sec_user
     order by id
 )
 where rnum > ? and rownum <= 100'''

String selectAgentData =
'''select * from (
     select agent_data, rownum as rnum
     from ds_agent_data
     order by agent_data
 )
 where rnum > ? and rownum <= 100'''

String selectResource =
'''select * from (
     select id, impersonation_password, rownum as rnum
     from ds_resource
     order by id
 )
 where rnum > ? and rownum <= 100'''

String selectAgents =
'''select * from (
     select id, impersonation_password, rownum as rnum
     from ds_agent
     order by id
 )
 where rnum > ? and rownum <= 100'''

String updateSecurePersistentRecord = "update vc_persistent_record set persistent_data=? where id=?"
String updateSecurePropDef = "update ps_prop_def set default_value=?,long_default_value=? where id=?"
String updateSecureLongPropDef = "update ps_prop_def set long_default_value=? where id=?"
String updateSecureUsers = "update sec_user set password=? where id=?"
String updateAgentData = "update ds_agent_data set agent_data=? where agent_data=?"
String updateResource = "update ds_resource set impersonation_password=? where id=?"
String updateAgent = "update ds_agent set impersonation_password=? where id=?"

String countPersistentRecords = "select count(*) from vc_persistent_record"
String countSecurePropDef = "select count(*) from ps_prop_def where property_type='SECURE'"
String countSecureUsers = "select count(*) from sec_user"
String countAgentData = "select count(*) from ds_agent_data"
String countResource = "select count(*) from ds_resource"
String countAgents = "select count(*) from ds_agent"

def updateVCPersistentRecord(def recordAsXml ) {
    def persistentDataAsXml
    if (recordAsXml instanceof Clob) {
        persistentDataAsXml = recordAsXml.getCharacterStream().getText().toString()
    }
    else {
        persistentDataAsXml = recordAsXml
    }
    def persistentData = updateAlias(persistentDataAsXml)
    try {
        if (persistentData) {
            return XmlUtil.serialize(persistentData)
        }
    }
    catch (GroovyRuntimeException e) {
        println persistentData
        throw e
    }
}

def updateAlias(String encryptedValue) {
    if (encryptedValue != null) {
        def regex = "crypt_v1\\{DESede/CBC/PKCS5Padding\\|desEdeKey\\|"
        def replacement = "crypt_v1{DESede/CBC/PKCS5Padding|${keyAlias}|".toString()
        encryptedValue = encryptedValue.replaceAll(regex, replacement)
    }   
    return encryptedValue
}



println "Updating persistent records. Current time: ${new Date()}";
Number persistentRowCount = sql.firstRow(countPersistentRecords)[0];
println "($persistentRowCount rows found)";

def rangeMax = 0;
long countDown = persistentRowCount.longValue();
def firstIteration = true;
while (rangeMax < persistentRowCount || firstIteration) {
    def results = sql.rows(selectPersistentRecords, [rangeMax]);
    results.each{ row ->
        def id = row.id;
        def oldPersistentData = row.persistent_data;
        def newPersistentData = updateVCPersistentRecord(oldPersistentData);
        if (newPersistentData) {
            sql.executeUpdate(updateSecurePersistentRecord, [newPersistentData, id]);
        }
        countDown--;
        if (countDown % 500 == 0) {
            println "${new Date()} $countDown rows left.";
        }
    }
    rangeMax += 100;
    firstIteration = false;
}



println "Updating secure prop defs. Current time : ${new Date()}";
Number securePropDefCount = sql.firstRow(countSecurePropDef)[0];
println "($securePropDefCount rows found)";

rangeMax = 0;
firstIteration = true;
countDown = securePropDefCount.longValue()
while (rangeMax < securePropDefCount || firstIteration) {
    def results = sql.rows(selectSecurePropDef, [rangeMax]);
    results.each{ row ->
        def id = row.id;
        def default_value = row.default_value;
        def long_default_value = row.long_default_value;
        def oldValue = null
        if (long_default_value) {
            oldValue = long_default_value
        }
        else if (default_value) {
            oldValue = default_value
        }
        def newValue = updateAlias(oldValue)
        if (newValue) {
            if (newValue.size() > 4000) {
                sql.executeUpdate(updateSecurePropDef, ["", newValue, id]);
            }
            else {
                sql.executeUpdate(updateSecurePropDef, [newValue, "", id]);
            }
        }
        
        countDown--;
        if (countDown % 500 == 0) {
            println "${new Date()} $countDown rows left.";
        }
    }
    rangeMax += 100;
    firstIteration = false;
}



println "Updating secure users. Current time: ${new Date()}";
Number secureUsersCount = sql.firstRow(countSecureUsers)[0];
println "($secureUsersCount rows found)";

rangeMax = 0;
firstIteration = true;
countDown = secureUsersCount.longValue()
while (rangeMax < secureUsersCount || firstIteration) {
    def results = sql.rows(selectSecureUsers, [rangeMax]);
    results.each{ row ->
        def id = row.id
        def password = row.password
        def newValue = updateAlias(password)
        if (newValue) {
            sql.executeUpdate(updateSecureUsers, [newValue, id]);
        }
        
        countDown--;
        if (countDown % 500 == 0) {
            println "${new Date()} $countDown rows left.";
        }
    }
    rangeMax += 100;
    firstIteration = false;
}



println "Updating secure agent data. Current time: ${new Date()}";
Number secureAgentCount = sql.firstRow(countAgentData)[0];
println "($secureAgentCount rows found)";

rangeMax = 0;
firstIteration = true;
countDown = secureAgentCount.longValue()
while (rangeMax < secureAgentCount || firstIteration) {
    def results = sql.rows(selectAgentData, [rangeMax]);
    results.each{ row ->
        def oldValue = row.agent_data;
        def newValue = updateAlias(oldValue)
        if (newValue) {
            sql.executeUpdate(updateAgentData, [newValue, oldValue]);
        }
    
        countDown--;
        if (countDown % 500 == 0) {
            println "${new Date()} $countDown rows left.";
        }
    }
    rangeMax += 100;
    firstIteration = false;
}



println "Updating resources. Current time: ${new Date()}";
Number resourceCount = sql.firstRow(countResource)[0];
println "($resourceCount rows found.)"

rangeMax = 0;
firstIteration = true;
countDown = resourceCount.longValue()
while (rangeMax < resourceCount || firstIteration) {
    def results = sql.rows(selectResource, [rangeMax]);
    results.each{ row ->
        def id = row.id;
        def oldPassword = row.impersonation_password;
        def newPassword = updateAlias(oldPassword)
        if (newPassword) {
            sql.executeUpdate(updateResource, [newPassword, id])
        }
        
        countDown--;
        if (countDown % 500 == 0) {
            println "${new Date()} $countDown rows left.";
        }
    }
    rangeMax += 100;
    firstIteration = false;
}



println "Updating agents. Current time: ${new Date()}";
Number agentCount = sql.firstRow(countAgents)[0];
println "($agentCount rows found.)";

rangeMax = 0;
firstIteration = true;
countDown = agentCount.longValue()
while (rangeMax < agentCount || firstIteration) {
    def results = sql.rows(selectAgents, [rangeMax]);
    results.each{ row ->
        def id = row.id;
        def oldPassword = row.impersonation_password;
        def newPassword = updateAlias(oldPassword)
        if (newPassword) {
            sql.executeUpdate(updateAgent, [newPassword, id])
        }
        
        countDown--;
        if (countDown % 500 == 0) {
            println "${new Date()} $countDown rows left.";
        }
    }
    rangeMax += 100;
    firstIteration = false;
}

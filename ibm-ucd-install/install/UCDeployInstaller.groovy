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

import java.security.GeneralSecurityException
import java.security.KeyStore
import java.security.KeyStoreException
import java.security.NoSuchAlgorithmException
import java.security.SecureRandom
import java.sql.ResultSet
import java.sql.SQLException
import java.util.regex.Matcher
import java.util.regex.Pattern

import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.xml.parsers.DocumentBuilder
import javax.xml.parsers.DocumentBuilderFactory
import javax.xml.transform.OutputKeys
import javax.xml.transform.Transformer
import javax.xml.transform.TransformerFactory
import javax.xml.transform.dom.DOMSource
import javax.xml.transform.stream.StreamResult

import org.apache.commons.lang.RandomStringUtils
import org.apache.tools.ant.taskdefs.condition.Os
import org.w3c.dom.Document
import org.w3c.dom.DocumentType
import org.w3c.dom.Element
import org.w3c.dom.NodeList

import com.urbancode.commons.util.IO
import com.urbancode.commons.util.SortedProperties;
import com.urbancode.commons.util.crypto.CryptStringUtil
import com.urbancode.commons.util.crypto.SecureRandomHelper
import com.urbancode.ds.ServerConstants
import com.urbancode.installer.HACapableInstaller

import org.apache.commons.codec.binary.Base64;

import groovy.sql.GroovyRowResult
import groovy.sql.Sql
import groovy.xml.XmlUtil

public class UCDeployInstaller implements HACapableInstaller {
    /**
     * Properties copied from the installer at some point
     */
    def installer = null
    def ant = null

    def installServerWebAlwaysSecure = null
    def portValidator = null
    def yesNoValidator = null
    def optionalValidator = null
    def requiredValidator = null
    def numberValidator = null
    def webUriValidator = null

    def doUpgrade = false
    def srcDir = null
    def appStorageDir = null
    def useExistingStorage = false
    def installDir = null

    /**
     * Properties given by existing installations or by the user during install
     */
    def externalUrl = null

    def adminPassword = null

    def jmsPort = null
    def jmsMutualAuth = null


    def agentCommUri = null
    def webAgentKeystore = null
    def webAgentKeystorePassword = null

    def dbType = null
    def dbUsername = null
    def dbPassword = null
    def dbUrl = null
    def dbSchema = null
    def dbDriver = null
    def dbDatabaseName = null // This is used for DB2 on zOS
    def dbDerbyPort = null
    def isDerby = false
    def isHAInstall = false
    def skipDBInstall = null
    def skipDbConfig = null
    def firstNode = true

    // Classpath used for performing database actions
    def extclasspath = null

    def keyStorePath = null
    def encryptionKeyStorePath = null
    def keyStorePassword = null
    def encryptionKeyStorePassword = null
    def oldAlias = "desEdeKey"

    def activemqServerMemory = null;
    def activemqTopicMemory = null;
    def activemqQueueMemory = null;

    def notificationTemplatesPath = null

    def installAcceptLicense = ''
    def licenseString = null
    def licenseFile = null

    def licenseServerUrl = null
    def javaLibPath = null
    def indexedFkCheck = null

    /*
     * Constants
     */
    final String DBTYPE_DB2_ON_LUW  = "db2"
    final String DBTYPE_DB2_ON_ZOS  = "db2zos"
    final String DBTYPE_DERBY       = "derby"
    final String DBTYPE_MYSQL       = "mysql"
    final String DBTYPE_ORACLE      = "oracle"
    final String DBTYPE_POSTGRES    = "postgres"
    final String DBTYPE_SQLSERVER   = "sqlserver"
    final int MIN_DB2ZOS_VERSION    = 11

    /**
     * Constructor - set initial values taken from the container installer
     */
    UCDeployInstaller(ContainerInstaller installer) {
        this.installer = installer
        ant = installer.ant

        portValidator = installer.portValidator
        yesNoValidator = installer.yesNoValidator
        optionalValidator = installer.optionalValidator
        requiredValidator = installer.requiredValidator
        numberValidator = installer.numberValidator
        webUriValidator = installer.webUriValidator
    }

    private String getAntProperty(String name) {
        return installer.getAntProperty(name)
    }

    public void init() {
        verifyJava();

        def isYes = { answer -> ["Y", "YES"].find{ it.equalsIgnoreCase(answer) } != null }

        installAcceptLicense = this.installer.nonInteractive ? 'y' : ''
        def defaultAccept = installAcceptLicense ?: ''

        ConsolePager pager = new ConsolePager()
        pager.init()

        def supPager = Boolean.valueOf(getAntProperty('ucd.install.suppresspager'));
        pager.doPause = (!this.installer.nonInteractive || !isYes(defaultAccept)) && !supPager

        def licenseFileName = "LA_"+Locale.getDefault()
        def secondaryLicenseFileName = "LA_"+Locale.getDefault().getLanguage()
        def fallbackLicenseFileName = "LA_en"

        def license = this.class.classLoader.getResourceAsStream(licenseFileName)
        if (license == null) {
            license = this.class.classLoader.getResourceAsStream(secondaryLicenseFileName)
        }
        if (license == null) {
            license = this.class.classLoader.getResourceAsStream(fallbackLicenseFileName)
        }

        if (license == null) {
            println "Error: Could not locate a license file. Expected names: "+licenseFileName+", "+
                    secondaryLicenseFileName+", "+fallbackLicenseFileName;
            System.exit(1);
        }

        def licenseText = IO.readText(license, "UTF-8");
        pager.printText(licenseText)

        def answer = installer.prompt(null, "Do you accept the license? [y,n]", defaultAccept, yesNoValidator)
        if (!isYes(answer)) {
            System.out.println("License must be accepted to proceed with installation.");
            System.exit(1);
        }
    }

    void verifyJava() {
        try {
            // Enforce Java version by checking for new classes available to 1.8.0
            getClass().getClassLoader().loadClass("java.util.Base64");
        }
        catch (ClassNotFoundException e) {
            throw new RuntimeException("Java 1.8.0 or greater required for UrbanCode Deploy. " +
            "Installer initialized with ${System.getProperty('java.version')}")
        }
    }

    /**
     * Initialize the uDeploy installer from existing properties if present.
     */
    void initProperties() {
        srcDir = installer.srcDir;
        doUpgrade = installer.doUpgrade
        externalUrl = getAntProperty('server.external.web.url')

        adminPassword = getAntProperty('server.initial.password')
        if (adminPassword) {
            Properties props = new Properties()
            File propsFile = new File(srcDir, 'install.properties')
            props.load(propsFile.newDataInputStream())
            props.setProperty('server.initial.password', "")
            props.store(propsFile.newWriter(), null)
        }

        jmsPort = getAntProperty('server.jms.port')
        jmsMutualAuth = getAntProperty('server.jms.mutualAuth')

        agentCommUri = getAntProperty('agentcomm.uri')
        if (agentCommUri == null) {
            // Try to load from experimental properties
            def agentCommHost = getAntProperty('experimental.comm2017.server.agentcomm.host')
            def agentCommPort = getAntProperty('experimental.comm2017.server.agentcomm.port')
            if (agentCommPort != null && agentCommHost != null) {
                agentCommUri = "wss://" + agentCommHost + ":" + agentCommPort
            }
        }

        if (agentCommUri == null && this.installer.nonInteractive) {
            println("An address for the server to listen at for agent communication is required.")
            println("Please provide a property for 'agentcomm.uri'")
            System.exit(1);
        }

        webAgentKeystore = getAntProperty('agentcomm.keystore')
        if (webAgentKeystore == null) {
            webAgentKeystore = getAntProperty('experimental.comm2017.server.keystore2017') ?: "../conf/server/s2s-client-identity.keystore"
        }

        webAgentKeystorePassword = CryptStringUtil.class.decrypt(getAntProperty('agentcomm.keystore.password'))
        if (webAgentKeystorePassword == null) {
            webAgentKeystorePassword = CryptStringUtil.class.decrypt(getAntProperty('experimental.comm2017.server.keystore2017.password')) ?: "changeit"
        }

        dbType = getAntProperty('database.type')
        dbDerbyPort = getAntProperty('database.derby.port')
        dbUsername = getAntProperty('hibernate.connection.username')
        dbPassword = CryptStringUtil.class.decrypt(getAntProperty('hibernate.connection.password'))
        dbUrl = getAntProperty('hibernate.connection.url')
        dbSchema = getAntProperty('hibernate.default_schema')
        dbDatabaseName = getAntProperty('database.databasename')
        dbDriver = getAntProperty('hibernate.connection.driver_class')

        isHAInstall = getAntProperty('com.urbancode.ds.UDeployServer.multiserver')
        skipDBInstall = getAntProperty('skip.db.install')
        keyStorePath = getAntProperty('server.keystore')
        encryptionKeyStorePath = getAntProperty('encryption.keystore')
        keyStorePassword = CryptStringUtil.class.decrypt(getAntProperty('server.keystore.password')) ?: "changeit"
        encryptionKeyStorePassword = CryptStringUtil.class.decrypt(getAntProperty('encryption.keystore.password')) ?: keyStorePassword
        activemqServerMemory = getAntProperty('server.activemq.system.memory') ?: "512 mb"
        activemqTopicMemory = getAntProperty('server.activemq.topic.memory') ?: "100 mb"
        activemqQueueMemory = getAntProperty('server.activemq.queue.memory') ?: "100 mb"

        licenseServerUrl = getAntProperty('license.server.url')
        indexedFkCheck = getAntProperty('check.indexed.fks')

        // Completely skip all DB configuration. Must run the config-db-from-properties script following installation
        skipDbConfig = getAntProperty('skip.db.config')
        if (skipDbConfig != null) {
            if ('Y'.equalsIgnoreCase(skipDbConfig) || "YES".equalsIgnoreCase(skipDbConfig)) {
                skipDbConfig = true
            }
            else {
                skipDbConfig = false
            }
        }
        else {
            skipDbConfig = false
        }
    }

    /**
     * Prompt for any values needed by the installer.
     */
    void getInput() {
        initProperties()

        installDir = installer.installServerDir
        appStorageDir = installer.appStorageDir
        isHAInstall = isHAInstall ?: installer.isHAInstall
        firstNode = installer.firstNode
        useExistingStorage = installer.useExistingStorage
        doUpgrade = installer.doUpgrade
        def targetVersion = getAntProperty('version');

        if (isHAInstall && !doUpgrade && !firstNode) {
            Properties props = new Properties()
            File propsFile = new File(appStorageDir, '/conf/installed.version')
            props.load(propsFile.newDataInputStream())
            def version = props.getProperty('installed.version')
            if (version != targetVersion) {
                println "Version mismatch between existing node ($version)" +
                        "and installation (${targetVersion})."
                println 'The upgrade is canceled.'
                System.exit(1)
            }
        }

        if (doUpgrade) {
            installer.prompt("NOTICE: Upgrading the server while there are processes currently running "+
                    "is not supported. Before proceeding with an upgrade, verify that there are no "+
                    "running processes on the Current Activity page.\n\nServer upgrades cannot "+
                    "be rolled back. Please ensure that you have backed up the server's database and "+
                    "filesystem before proceeding. (press enter to continue)");
        }
        else if (firstNode && !skipDbConfig) {
            adminPassword = installer.promptForPassword(
                    adminPassword,
                    "Enter the initial password for the admin user.",
                    requiredValidator)
        }

        jmsPort = installer.prompt(
                jmsPort,
                "Enter the port to use for JMS agent communication. [Default: 7918]",
                "7918",
                portValidator)

        if (!doUpgrade) {
            def jmsAuthMessagePrefix = "Do you want ";
            if (!firstNode) {
                jmsAuthMessagePrefix = "Do the existing nodes in the cluster expect ";
            }
            jmsMutualAuth = installer.prompt(
                    jmsMutualAuth,
                    jmsAuthMessagePrefix + "the Server and Agent communication to require mutual authentication? " +
                    "This requires a manual key exchange between the server and each agent. See the documentation for " +
                    "more details. y,N [Default: N]",
                    "N",
                    yesNoValidator)
            jmsMutualAuth = "Y".equalsIgnoreCase(jmsMutualAuth) || "YES".equalsIgnoreCase(jmsMutualAuth)
        }

        def defaultAgentCommHost = null
        try  {
            // this is what we use in tomcat container to pick a default web UI address
            defaultAgentCommHost = InetAddress.localHost.canonicalHostName
        }
        catch (Exception e) {
        }
        if (defaultAgentCommHost == null) {
            defaultAgentCommHost = "localhost"
        }

        println("UCD's web-based replacement for JMS agent communication requires a URL that is " +
                "used to set a listening port and to allow servers to exchange agent messages.")
        println("The URL has the following requirements:")
        println("1) The URL must have the form \"wss://<host-or-ip>:<port>\". Example: wss://ucd1.example.org:7919")
        println("2) The URL port must not conflict with ports for the UI or JMS.")
        println("3) Each server must have a distinct URL.")
        println("4) Every server in an HA cluster must be able to connect directly to this server with the URL.")
        println("5) Agents and relays must be able to connect to one or more servers at their respective URL port.")
        println("Agents and relays may be configured to use a common URL shared by all servers " +
                "(for example, one provided by a load balancer), but servers must be configured " +
                "with direct URLs.")
        agentCommUri = installer.prompt(
            agentCommUri,
            "Enter the web agent communication URL for this server. [Default: wss://${defaultAgentCommHost}:7919]",
            "wss://${defaultAgentCommHost}:7919",
            webUriValidator)

        if (!doUpgrade) {
            if (firstNode) {
                licensePrompts() // do the vendor specific licensing
            }

            println("When installing a server as a part of an existing cluster or when using a pre-populated database, it is " +
                    "not necessary to create the database schema. This step must be performed when installing a standalone server " +
                    "to a fresh database or when installing the first server in a cluster.")

            if (!skipDbConfig) {
                getDbInput()
            }
        }
        else if (DBTYPE_DB2_ON_ZOS.equalsIgnoreCase(dbType) && (dbDatabaseName == null || dbDatabaseName.trim() == "")) {
            dbDatabaseName = installer.prompt(
                    dbDatabaseName,
                    "Enter the database name. (Note: Not necessarily the database location)",
                    null,
                    requiredValidator)
        }

        if (dbDriver.equals("org.apache.derby.jdbc.ClientDriver")) {
            isDerby = true
        }

    }

    void licensePrompts() {
        def vendor = getAntProperty("vendor.name")
        if ('ibm'.equalsIgnoreCase(vendor)) {
            ibmLicensePrompts()
        }
        else if ('hcl'.equalsIgnoreCase(vendor)) {
            hclLicensePrompts()
        }
        else {
            throw new Exception("Unknown vendor")
        }
    }

    void hclLicensePrompts() {
        licenseServerUrl = installer.prompt(
                licenseServerUrl,
                "Enter the URL of the License Server for ${ServerConstants.PRODUCT_NAME_NORMAL}, in the form of " +
                "https://hclsoftware.compliance.flexnetoperations.com/instances/YOUR_SERVER_ID/request. Alternatively, " +
                "you may leave this blank to begin a 60-day evaluation period. [Default: none]",
                "",
                optionalValidator)
    }

    void ibmLicensePrompts() {
        licenseServerUrl = installer.prompt(
                licenseServerUrl,
                "Enter the port and hostname of a Rational License Key Server containing product licenses "+
                "for ${ServerConstants.PRODUCT_NAME_NORMAL}, in the form of port@hostname. "+
                "(e.g. 27000@licenses.example.com) Alternatively, you may leave this blank to begin "+
                "a 60-day evaluation period. [Default: none]",
                "27000@licenses.example.com",
                requiredValidator)
    }

    void getDbInput() {

        String defaultDbUsername = ServerConstants.PRODUCT_NAME_SIMPLE.replace("-", "_");

        def createDbSchema;
        if (skipDBInstall != null) {
            if ('Y'.equalsIgnoreCase(skipDBInstall) || "YES".equalsIgnoreCase(skipDBInstall)) {
                createDbSchema = "N"
            }
            else {
                createDbSchema = "Y"
            }
        }

        createDbSchema = installer.prompt(
                createDbSchema,
                "Create database schema? (For high availability servers, this should only be done for the first server in the cluster) " +
                "Y,n [Default: Y]",
                "Y",
                yesNoValidator)

        skipDBInstall = 'N'.equalsIgnoreCase(createDbSchema) || "NO".equalsIgnoreCase(createDbSchema)

        if (skipDBInstall) {
            println("Please enter the database connection information for this server to use when connecting to the existing database:")
        }

        def dbDefault = DBTYPE_DERBY
        def supportedMsg = "The following database types are supported: derby, mysql, oracle, sqlserver, db2, db2zos."
        if (isHAInstall) {
            dbDefault = DBTYPE_MYSQL
            supportedMsg = "The following database types are supported for high availability installs: mysql, oracle, sqlserver, db2, db2zos."
        }
        println(supportedMsg)
        dbType = installer.prompt(
                dbType,
                "Enter the database type to use. [Default: $dbDefault]",
                dbDefault,
                requiredValidator).toLowerCase()

        if (!isHAInstall && DBTYPE_DERBY.equalsIgnoreCase(dbType)) {
            dbDriver = "org.apache.derby.jdbc.ClientDriver"
            if (dbDerbyPort == null) {
                dbDerbyPort = "11377"
            }
            dbUrl = "jdbc:derby://localhost:$dbDerbyPort/data"
        }
        else if (DBTYPE_ORACLE.equalsIgnoreCase(dbType)) {
            dbDriver = installer.prompt(
                    dbDriver,
                    "Enter the database driver. [Default: oracle.jdbc.driver.OracleDriver]",
                    "oracle.jdbc.driver.OracleDriver",
                    requiredValidator)
            dbUrl = installer.prompt(
                    dbUrl,
                    "Enter the database connection string, including hostname, port, and SID." +
                    " Eg. jdbc:oracle:thin:@localhost:1521:ORCL",
                    null,
                    requiredValidator)
            dbSchema = installer.prompt(
                    dbSchema,
                    "Enter the database schema name. (required if user has DBA role)",
                    null,
                    optionalValidator)
            if (dbSchema != null) {
                dbSchema = String.valueOf(dbSchema).toUpperCase()
            }
        }
        else if (DBTYPE_MYSQL.equalsIgnoreCase(dbType)) {
            dbDriver = installer.prompt(
                    dbDriver,
                    "Enter the database driver. [Default: com.mysql.jdbc.Driver]",
                    "com.mysql.jdbc.Driver",
                    requiredValidator)
            dbUrl = installer.prompt(
                    dbUrl,
                    "Enter the database connection string. Eg. jdbc:mysql://localhost:3306/$defaultDbUsername",
                    null,
                    requiredValidator)
        }
        else if (DBTYPE_SQLSERVER.equalsIgnoreCase(dbType)) {
            dbDriver = installer.prompt(
                    dbDriver,
                    "Enter the database driver. [Default: com.microsoft.sqlserver.jdbc.SQLServerDriver]",
                    "com.microsoft.sqlserver.jdbc.SQLServerDriver",
                    requiredValidator)
            dbUrl = installer.prompt(
                    dbUrl,
                    "Enter the database connection string. Eg. jdbc:sqlserver://localhost:1433;DatabaseName=$defaultDbUsername",
                    null,
                    requiredValidator)
        }
        else if (DBTYPE_DB2_ON_LUW.equalsIgnoreCase(dbType)
                || DBTYPE_DB2_ON_ZOS.equalsIgnoreCase(dbType)) {
            dbDriver = installer.prompt(
                    dbDriver,
                    "Enter the database driver. [Default: com.ibm.db2.jcc.DB2Driver]",
                    "com.ibm.db2.jcc.DB2Driver",
                    requiredValidator)
            dbUrl = installer.prompt(
                    dbUrl,
                    "Enter the database connection string. Eg. jdbc:db2://localhost:50000/$defaultDbUsername",
                    null,
                    requiredValidator)

            if (DBTYPE_DB2_ON_ZOS.equalsIgnoreCase(dbType)) {
                dbDatabaseName = installer.prompt(
                        dbDatabaseName,
                        "Enter the database name. (Note: Not necessarily the database location)",
                        null,
                        requiredValidator)
            }
        }
        else {
            println("$dbType is not a supported database type.")
            System.exit(1)
        }
        dbUsername = installer.prompt(
                dbUsername,
                "Enter the database username. [Default: $defaultDbUsername]",
                defaultDbUsername,
                requiredValidator)
        dbPassword = installer.prompt(
                dbPassword,
                "Enter the database password. [Default: password]",
                "password",
                requiredValidator)

        if (dbDriver.equals("org.apache.derby.jdbc.ClientDriver")) {
            isDerby = true
        } else {
            try {
                Class.forName(dbDriver)
            }
            catch (ClassNotFoundException e) {
                println("Error: The JDBC driver was not located in lib/ext. If you have added the jar file after "+
                        "starting the installer, simply restart the installation. If you had already "+
                        "placed the jar file in lib/ext prior to this installation attempt, the "+
                        "JDBC driver class you indicated was not found in the driver jar.")
                System.exit(1)
            }
        }
    }

    void postContainerInstall() {
        if (skipDbConfig){
            println ("The database configuration has been skipped. Run the install-database script to finalize the Installation.")
        } else {
            println("After starting the server, you may access the web UI by pointing your web-browser at")
            println(externalUrl+" "+(!doUpgrade ? "to complete the Installation." : ""))
        }
    }

    void postDatabaseOnlyInstall() {
        println("Installation and configuration of the datatabase is successful.")
        println("After starting the server, you may access the web UI by pointing your web-browser at")
        println(externalUrl+" to complete the Installation.")
    }

    /**
     * Perform any steps needed before the container installs.
     */
    void preContainerFileInstall() {
        installDir = installer.installServerDir;
        // Remove static content for any previous versions
        ant.delete(dir: installDir+"/opt/tomcat/webapps/ROOT/static")

        // Overwrite software scripts from tomcat server container
        ant.copy(todir: srcDir + "/bin/server", overwrite: 'true', encoding: "UTF-8") {
            fileset(dir: srcDir + "/overlay/bin") {
                include(name: "server")
                include(name: "server.cmd")
            }
        }

        //mark currently running processes as cancelled
        if (doUpgrade) {
            markProcessesCancelled();
        }
    }

    boolean doesDbNeedUpgrades() {
        def seedDataVersions = getVersionsForReleaseNamesFromSeedData();
        def databaseVersions = getVersionsForReleaseNamesFromDatabase();
        for (seedDataMapping in seedDataVersions) {
            def seedDataReleaseName = seedDataMapping.key;
            def seedDataVersion = seedDataMapping.value;
            if (databaseVersions.containsKey(seedDataReleaseName)) {
                if (databaseVersions[seedDataReleaseName] < seedDataVersion) {
                    return true;
                }
            }
            else {
                // If release_name exists in seed data, but not the database,
                // upgrade unless there are no changes
                if (seedDataVersion > 0) {
                    return true;
                }
            }
        }
        return false;
    }

    Map getVersionsForReleaseNamesFromSeedData() {
        Pattern insertDbVersionPattern =
            Pattern.compile("insert into ds_db_version\\s+\\(release_name,\\s+ver\\)\\s+values\\s+\\('(.*?)',\\s*([0-9]+)\\)");
        def seedDataFile = new File(ant.project.baseDir, "ud-seed-data.sql");
        def seedDataVersions = [:];

        // Create the release_name -> version mapping which is generated for seed data
        seedDataFile.eachLine { line, lineNumber ->
            Matcher match = insertDbVersionPattern.matcher(line);
            while (match.find()) {
                def relName = match.group(1);
                def version = Integer.valueOf(match.group(2));

                seedDataVersions[relName] = version;
            }
        }
        return seedDataVersions;
    }

    Map getVersionsForReleaseNamesFromDatabase() {
        def databaseVersions = [:]

        // Ant's SQL calls will treat $ specially. They need to be escaped by turning them into $$
        // Plus, $ is special in Groovy so we have to treat it differently than any other char
        def dollarSign = "\$"
        def antDBPassword = dbPassword.replaceAll("\\"+dollarSign, "\\"+dollarSign+"\\"+dollarSign)

        def sqlOutputFile = "sqlOutput.csv";
        ant.sql("select release_name, ver from ds_db_version",
            driver:    this.dbDriver,
            url:       this.dbUrl,
            userid:    this.dbUsername,
            password:  antDBPassword,
            classpath: getExternalClasspath(),
            output:    sqlOutputFile,
            print:     true);

        def outFile = new File(ant.project.baseDir, sqlOutputFile);
        outFile.eachLine { line ->
            def releaseLine = line.split(",");
            if (releaseLine.size() == 2 && releaseLine[1].isInteger()) {
                databaseVersions[releaseLine[0]] = releaseLine[1].toInteger();
            }
        }
        return databaseVersions;
    }

    void markProcessesCancelled() {
        installDir = installer.installServerDir;
        ant.property(name: "install.dir", value: installer.installServerDir)

        // Make temporary copy of old libraries to support deserialization.
        // We can't use the instllation lib directory because if we did, once
        // the files are loaded by the JVM, we cannot replace them because of
        // file locks.
        ant.delete(dir: srcDir + "/.tmp-old-lib")
        ant.copy(todir: srcDir + "/.tmp-old-lib", overwrite: 'true') {
            fileset(dir: installDir + "/lib") {
                include(name: "ext/*.jar")
                include(name: "ext/*.zip")
                include(name: "*.jar")
                include(name: "*.zip")
                exclude(name: "cm-db-updater.jar")
            }
        }

        def oldclasspath = ant.path() {
            fileset(dir: srcDir + "/.tmp-old-lib")
            fileset(dir: srcDir + "/lib/install-only") {
                include(name: "*.jar")
                include(name: "*.zip")
            }
            //use most recent cm-db-updater.jar in case we are using new features
            fileset(dir: srcDir + "/lib") {
                include(name: "cm-db-updater.jar")
            }
        }

        // run the upgrades
        ant.taskdef(
                name: "upgrade",
                classname: "com.urbancode.cm.db.updater.DbUpgradeTask",
                classpath: oldclasspath)
        def oldBaseDir = ant.project.baseDir
        try {
            ant.project.baseDir = new File(oldBaseDir, "database/deploy")
            def props = [:];
            props['driver'] = dbDriver;
            props['url'] = dbUrl;
            props['userid'] = dbUsername;
            props['password'] = dbPassword;
            /*
            * We pass in false queries for the dbupgrader to do the always things to ensure that we don't
            * 1) skip any of those tests
            * 2) update any of the dbversion rows with the values from the always upgrades
            */
            props['currentVersionSql'] = "SELECT 0 FROM ds_db_version WHERE release_name = ? and release_name = 'foo'";
            props['deleteVersionSql'] = "delete FROM ds_db_version WHERE release_name = ? and release_name = 'foobar'";
            props['updateVersionSql'] = "update ds_db_version set ver = 0 WHERE release_name = 'foobar' and release_name = ? and ver = ?";
            props['classpath'] = oldclasspath;
            boolean started = true;
            if (isDerby) {
                println("Starting embedded database ...")

                if (waitForDerby(0)) {
                    throw new Exception('Embedded database is already running, please shutdown before proceeding')
                }

                startDerby()

                started = waitForDerby(60)
                if (!started) {
                    println('Could not start database')
                }
                else {
                    println("Database Started")
                }
            }

            if (DBTYPE_DB2_ON_ZOS.equalsIgnoreCase(dbType)) {
                // add the lib/ext jars from the previous installation to this thread's classpath
                // and force static initialization of the specified driver class in order to ensure
                // that the driver registers itself with DriverManager
                ClassLoader parentClassLoader = Thread.currentThread().getContextClassLoader();
                ClassLoader libExtClassLoader = getLibExtClassLoader(parentClassLoader);
                Class dbDriverClass = Class.forName(dbDriver, true, libExtClassLoader);
                Thread.currentThread().setContextClassLoader(libExtClassLoader);
                dbDriverClass.newInstance();
                props['connectionInitSql'] = "SET CURRENT RULES = 'STD'";

                // For DB2 on zOS, we need to autocommit after every statement. This is
                // so we do not get lock contention on the System Tables, specifically
                // the system 'resource table' that controls all table structures.
                props['autocommit'] = "true";
            }

            // Only run the always_sql if there are other DB upgrades to do
            if (doesDbNeedUpgrades()) {
                println("Found database upgrades, cancelling currently running processes")
                ant.project.baseDir = new File(oldBaseDir, "database/deploy");
                ant.upgrade(props) {
                    fileset(dir: srcDir + "/database/deploy/always/all/") {
                        include(name: "always_sql.xml")
                    }
                }
            }
            else {
                println("No database upgrades found, leaving processes running")
            }
       }
       catch (Exception e) {
           throw new Exception("Error trying to cancel currently running processes", e);
       }
       finally {
            if (isDerby) {
                stopDerby()
            }
           ant.project.baseDir = oldBaseDir;
       }
    }

    private def getExternalClasspath() {
        return ant.path() {
            fileset(dir: installDir) {
                include(name: "lib/ext/*.jar")
                include(name: "lib/ext/*.zip")
            }
            fileset(dir: srcDir + "/lib/ext") {
                include(name: "*.jar")
                include(name: "*.zip")
            }
            fileset(dir: srcDir + "/lib/install-only") {
                include(name: "*.jar")
                include(name: "*.zip")
            }
            fileset(dir: srcDir + "/lib") {
                include(name: "*.jar")
                include(name: "*.zip")
            }
        }
    }

    /**
     * Perform the actual installation/upgrade, after the container installs.
     */
    void postContainerFileInstall() {
        installDir = installer.installServerDir;
        srcDir = installer.srcDir;

        if (!externalUrl) {
            def isHttps = "Y".equalsIgnoreCase(installer.installServerWebAlwaysSecure) || "YES".equalsIgnoreCase(installer.installServerWebAlwaysSecure)
            externalUrl = isHttps ? "https://" : "http://"
            externalUrl += installer.installServerWebHost + ":"
            externalUrl += installer.installServerWebHttpsPort ?: installer.installServerWebPort
        }

        extclasspath = getExternalClasspath()

        def confZip = srcDir + "/udconf.zip"
        def unpackDir = File.createTempFile("install-", ".tmp")
        unpackDir.delete()
        unpackDir.mkdirs()
        unpackDir = unpackDir.getCanonicalPath()
        installer.unpack(confZip, unpackDir)

        // Don't overwrite the existing installed.properties or secured-installed.properties
        // files if this is an upgrade.
        if (doUpgrade) {
            ant.delete(file: unpackDir+"/conf/server/installed.properties")
            ant.delete(file: unpackDir + "/conf/server/secured-installed.properties")
        }

        def installedPropertiesFilePath = installDir + "/conf/server/installed.properties"
        def securedInstalledPropertiesFilePath = installDir + "/conf/server/secured-installed.properties"

        try {
            ant.copy(todir: installDir + "/conf", overwrite: 'true') {
                fileset(dir: unpackDir + "/conf") {
                    include(name: "server/**/*")
                    exclude(name: "server/log4j.properties")
                    exclude(name: "server/notification-templates/**/*")
                    exclude(name: "server/getting-started-custom-urls.properties")
                }
            }
            if (!useExistingStorage || doUpgrade) {
                ant.copy(todir: appStorageDir + "/conf", overwrite: !useExistingStorage) {
                    fileset(dir: unpackDir + "/conf") {
                        include(name: "server/log4j.properties")
                        include(name: "server/notification-templates/**/*")
                        include(name: "collectors/**/*")
                        exclude(name: "server/getting-started-custom-urls.properties")
                    }
                }
            }

            ant.copy(todir: installDir + "/database", overwrite: 'true', includeEmptyDirs: 'false') {
                fileset(dir: srcDir + "/database") {
                    include(name: "**/*")
                }
            }

            ant.copy(todir: installDir + "/database", overwrite: 'true', includeEmptyDirs: 'false') {
                fileset(dir: srcDir + "/database/deploy") {
                    include(name: "initdb.ant")
                }
            }

            ant.copy(todir: installDir, overwrite: 'true') {
                fileset(dir: srcDir + "/overlay") {
                    include(name: "bin/**/*")
                    exclude(name: "bin/repl-tool")
                    exclude(name: "bin/repl-tool.cmd")
                    exclude(name: "bin/server")
                    exclude(name: "bin/server.cmd")
                }
            }

            // Copy overlay files
            ant.copy(todir: installDir, overwrite: 'true') {
                fileset(dir: srcDir + "/overlay") {
                    include(name: "**/*")
                    exclude(name: "var/**/*")
                    exclude(name: "bin/repl-tool")
                    exclude(name: "bin/repl-tool.cmd")
                    exclude(name: "bin/server")
                    exclude(name: "bin/server.cmd")
                }
            }
            if (doUpgrade) {
                // When upgrading, leave certain files in case they have been customized.
                ant.copy(todir: appStorageDir, overwrite: 'true') {
                    fileset(dir: srcDir + "/overlay") {
                        include(name: "var/**/*")
                        exclude(name: "var/plugins/status/repo/Default.xml")
                    }
                }

                // If no specific templates path is specified, move the templates to the appStorageDir
                // We should only end up doing this if the server is going from 6.1.1.5-6.1.2 to 6.1.3+
                def defaultNotificationPath = "/conf/server/notification-templates"
                def defaultNotificationDir = new File(installDir, defaultNotificationPath)
                def appStorageNotificationDir = new File(appStorageDir, defaultNotificationPath)
                if (!notificationTemplatesPath && defaultNotificationDir.isDirectory() &&
                        !defaultNotificationDir.getCanonicalPath()
                        .equals(appStorageNotificationDir.getCanonicalPath())) {
                    // Copy the directory over
                    ant.copy(todir: appStorageDir + defaultNotificationPath, overwrite: 'true') {
                        fileset(dir: installDir + defaultNotificationPath)
                    }
                    // Remove the old directory
                    ant.delete(dir: installDir + defaultNotificationPath)
                }
            }
            else {
                ant.copy(todir: appStorageDir, overwrite: !useExistingStorage) {
                    fileset(dir: srcDir + "/overlay") {
                        include(name: "var/**/*")
                    }
                }
            }

            //copy tftool executables
            ant.copy(todir: installDir + "/bin", overwrite: 'true') {
                fileset(dir: srcDir + "/bin") {
                    include(name: "tftool*.exe")
                }
            }

            if (!encryptionKeyStorePath) {
                encryptionKeyStorePath = appStorageDir + "/conf/encryption.keystore";
                def relativeKeyStorePath = encryptionKeyStorePath
                if (relativeKeyStorePath.startsWith(installDir)) {
                    relativeKeyStorePath = relativeKeyStorePath.replaceAll(Pattern.quote(installDir), '..')
                }
                ant.propertyfile(file: installedPropertiesFilePath) {
                    entry(key: "encryption.keystore", value: relativeKeyStorePath)
                }
            }
            else if (encryptionKeyStorePath.startsWith("../") || encryptionKeyStorePath.startsWith("..\\")) {
                encryptionKeyStorePath = encryptionKeyStorePath.replaceFirst(Pattern.quote(".."),
                        Matcher.quoteReplacement(installDir));
            }

            def classpathConf = new File(installDir, "bin/classpath.conf");
            def text = classpathConf.text;
            def patches = "patches";

            //Add !fail-on-conflict flag if it does not exist to stop a server from starting with patch conflicts
            def failOnConflict = " !fail-on-conflict";
            if (!text.contains(patches + failOnConflict)) {
                if (installer.isWindows){
                    def compatibleInstallDir = installDir.replace('\\','\\\\');
                    classpathConf.withWriter { writer ->
                        writer << text.replaceAll(Pattern.quote(installDir + '\\' + patches),
                            compatibleInstallDir + '\\\\' + patches + failOnConflict);
                    }
                }
                else
                {
                    classpathConf.withWriter { writer ->
                        writer << text.replaceAll(Pattern.quote(installDir + '/' + patches),
                            installDir + '/' + patches + failOnConflict);
                    }
                }
            }

            text = classpathConf.text;
            if (installDir != appStorageDir) {
                // Overwrite default patches directory lines in classpath.conf if using new structure
                // and add log4j.properties to the path
                if(installer.isWindows){
                    classpathConf.withWriter { writer ->
                        def compatibleAppStorageDir = appStorageDir.replace('\\','\\\\');
                        writer << text.replaceAll(Pattern.quote(installDir + '\\' + patches),
                            compatibleAppStorageDir + '\\\\' + patches);
                    }
                }
                else
                {
                    classpathConf.withWriter { writer ->
                        writer << text.replaceAll(Pattern.quote(installDir + '/' + patches),
                            appStorageDir + '/' + patches);
                    }
                }
                classpathConf.append("dir " + appStorageDir + "/conf" + System.getProperty("line.separator"));
                classpathConf.append("dir " + appStorageDir + "/conf/server" + System.getProperty("line.separator"));
            }

            // Copy custom overide properties over to appStorageDir directory only if file does not exist
            def gettingStartedCustomUrlsFile = new File(appStorageDir
                + "/conf/server/getting-started-custom-urls.properties");
            if (!gettingStartedCustomUrlsFile.exists()) {
                ant.copy(file: unpackDir + "/conf/server/getting-started-custom-urls.properties",
                    tofile: appStorageDir + "/conf/server/getting-started-custom-urls.properties")
            }

            makeJavaLibraryPath()
        }
        finally {
            ant.delete(dir: unpackDir)
        }

        //create key if it does not exist
        createSecretKey();

        if (doUpgrade) {
            Properties props = new Properties()
            File propsFile = new File(installDir, '/conf/installed.version')
            props.load(propsFile.newDataInputStream())
            def version = props.getProperty('installed.version')
            if ((version as String).compareTo("6.1.0.4") < 0) {
                println("Disabling SSLv3 ...")
                disableSSLv3();
            }

            if ((version as String).compareTo("6.2.5.1") < 0) {
                updateKeystorePassToReference();
            }
        }

        if (!skipDbConfig) {
            installOrUpgradeDatabase()
        }

        ant.propertyfile(file: installedPropertiesFilePath) {
            if (isHAInstall) {
                entry(key: 'com.urbancode.ds.UDeployServer.multiserver', value: 'true')
            }
            entry(key: "vendor.name", value:getAntProperty("vendor.name"))
            entry(key: "server.external.web.url", value: externalUrl)
            entry(key: "server.jms.port", value: jmsPort)
            entry(key: "server.jms.mutualAuth", value: jmsMutualAuth)
            entry(key: "agentcomm.uri", value: agentCommUri)
            entry(key: "agentcomm.keystore", value: webAgentKeystore)
            entry(key: "server.activemq.system.memory", value: activemqServerMemory)
            entry(key: "server.activemq.topic.memory", value: activemqTopicMemory)
            entry(key: "server.activemq.queue.memory", value: activemqQueueMemory)
            if (!doUpgrade && firstNode) {
                entry(key: "server.enable.welcome.tab", value: 'true')
            }
        }

        ant.propertyfile(file: securedInstalledPropertiesFilePath) {
            entry(key: "agentcomm.keystore.password", value: CryptStringUtil.class.encrypt(webAgentKeystorePassword))
        }

        removeExperimentalProperties()

        // run platform specific install
        if (Os.isFamily("unix")) {
            postContainerFileInstallUnix()
        }
        else if (Os.isFamily("windows")) {
            postContainerFileInstallWindows()
        }
    }

    void installOrUpgradeDatabase() {

        if (!installDir) {
            installDir = installer.installServerDir
        }
        if (!appStorageDir) {
            appStorageDir = installer.appStorageDir
        }

        def installedPropertiesFilePath = installDir + "/conf/server/installed.properties"
        def securedInstalledPropertiesFilePath = installDir + "/conf/server/secured-installed.properties"

        try {
            boolean started = true;
            if (isDerby) {
                println("Starting embedded database ...")

                if (waitForDerby(0)) {
                    throw new Exception('Embedded database is already running, please shutdown before proceeding')
                }

                startDerby()

                started = waitForDerby(60)
                if (!started) {
                    println('Could not start database')
                }
                else {
                    println("Database Started")
                }
            }

            if (started) {
                if (doUpgrade) {
                    upgradeDatabase()
                }
                else if (!skipDBInstall) {
                    installDatabase()
                }

                if (!skipDBInstall && indexedFkCheck) {
                    testForeignKeysIndexed()
                }
            }
        }
        finally {
            if (isDerby) {
                stopDerby()
            }
        }

        def hAStoragePropDir = appStorageDir;
        if (appStorageDir.startsWith(installer.installServerDir)) {
            hAStoragePropDir = hAStoragePropDir.replaceAll(Pattern.quote(installer.installServerDir), '..')
        }
        ant.propertyfile(file: installedPropertiesFilePath) {
            entry(key: "database.type", value: dbType)
            entry(key: "database.derby.port", value: dbDerbyPort)
            entry(key: "derby.system.home", value: hAStoragePropDir + '/var/db')
            entry(key: "hibernate.connection.username", value: dbUsername)
            entry(key: "database.databasename", value: dbDatabaseName)
            entry(key: "hibernate.connection.url", value: dbUrl)
            entry(key: "hibernate.connection.driver_class", value: dbDriver)
        }

        ant.propertyfile(file: securedInstalledPropertiesFilePath) {
            entry(key: "hibernate.connection.password", value: CryptStringUtil.class.encrypt(dbPassword))
            entry(key: "server.keystore.password", value: CryptStringUtil.class.encrypt(keyStorePassword))
            entry(key: "encryption.keystore.password", value: CryptStringUtil.class.encrypt(encryptionKeyStorePassword))
        }

        if (dbSchema != null) {
            ant.propertyfile(file: installedPropertiesFilePath) {
                entry(key: "hibernate.default_schema", value: dbSchema)
            }
        }

        if (!doUpgrade && DBTYPE_ORACLE.equalsIgnoreCase(dbType) && isOracle12(dbUrl, dbUsername, dbPassword, dbDriver)) {
            ant.propertyfile(file: installedPropertiesFilePath) {
                entry(key: "hibernate.dialect", value: "org.hibernate.dialect.Oracle10gDialect")
            }
        }
    }

    void postContainerFileInstallUnix() {
        installDir = installer.installServerDir;
        srcDir = installer.srcDir;

        ant.filterset(id: "ucd-unix-filterset") {
            filter(token: "SERVER_HOME", value: installDir)
        }

        ant.copy(todir: installDir, overwrite: 'true', encoding: "UTF-8") {
            fileset(dir: srcDir + "/overlay") {
                include(name: "bin/repl-tool")
            }

            filterset(refid: "ucd-unix-filterset")
        }

        ant.chmod(dir: installDir, perm: "+x") {
            include(name: "bin/repl-tool")
        }
    }

    void postContainerFileInstallWindows() {
        installDir = installer.installServerDir;
        srcDir = installer.srcDir;

        ant.filterset(id: "ucd-windows-filterset") {
            filter(token: "SERVER_HOME", value: installDir)
        }

        ant.copy(todir: installDir, overwrite: 'true', encoding: "UTF-8") {
            fileset(dir: srcDir + "/overlay") {
                include(name: "bin/repl-tool.cmd")
            }

            filterset(refid: "ucd-windows-filterset")
        }

        ant.fixcrlf(srcDir: installDir) {
            include(name: "bin/repl-tool.cmd")
        }
    }

    /**
     *
     */
    void testForeignKeysIndexed() {
        println('Checking that all foreign keys are indexed...')

        def ddlFile,
        connString = this.dbUrl,
        username = this.dbUsername,
        password = this.dbPassword,
        driver = this.dbDriver,
        schema = this.dbSchema
        boolean verbose = false;

        final def actualSchema   = [:]
        final def expectedSchema = [:]

        def rsEach = {rs, work ->
            def rsMd = rs.metaData;
            while (rs.next()) {
                if (work.maximumNumberOfParameters == 1) {
                    work(rs);
                }
                else {
                    work(rs, rsMd);
                }
            }
            rs.close();
        }

        //
        // Connect to DB and get Active Schema
        //

        def catalog = null;
        def sql = Sql.newInstance(connString, username, password, driver)
        def conn = sql.connection
        def md = conn.metaData
        def fks = [];
        def idx = [];

        rsEach(md.getTables(catalog, schema, "%", ['TABLE'] as String[])) { java.sql.ResultSet rs ->
            def cat = rs.getString('TABLE_CAT');
            def sch = rs.getString('TABLE_SCHEM');
            def tbl = rs.getString('TABLE_NAME');
            def typ = rs.getString('TABLE_TYPE');
            def tblFQN = "${sch ?: cat}.${tbl}"; // mysql returns schema name as catalog

            if (tbl ==~ /^(?i)module_.*/) {
                println "Skipping module table $tblFQN"
                return
            }
            else if ('RESOURCE_INVENTORY_ENTRY'.equalsIgnoreCase(tbl)) {
                println "Skipping inventory table $tblFQN"
                return
            }
            if (verbose) {
                println "processing table $cat.$sch.$tbl"
            }
            rsEach(md.getImportedKeys(cat, sch, tbl)) { ResultSet keyRs ->
                def fkSchema = keyRs.getString('FKTABLE_SCHEM') ?: keyRs.getString('FKTABLE_CAT')
                def fkTable = keyRs.getString('FKTABLE_NAME');
                def fkCol = keyRs.getString('FKCOLUMN_NAME')
                def fkName = keyRs.getString('FK_NAME')
                if (verbose) {
                    println "found fk $fkName on $fkSchema.$fkTable.$fkCol to ${keyRs.getString('PKTABLE_NAME')}.${keyRs.getString('PKCOLUMN_NAME')}"
                }
                fks << String.valueOf("$fkSchema.$fkTable.$fkCol")
            }
            rsEach(md.getIndexInfo(cat, sch, tbl, false, false)) { ResultSet idxRs ->
                def ixSchema = idxRs.getString('TABLE_SCHEM') ?: idxRs.getString('TABLE_CAT')
                def ixTable = idxRs.getString('TABLE_NAME');
                def ixCol = idxRs.getString('COLUMN_NAME');
                def ixName = idxRs.getString('INDEX_NAME');
                boolean nonUnique = idxRs.getBoolean('NON_UNIQUE')
                if (verbose) {
                    println "found index $ixName on $ixSchema.$ixTable.$ixCol"
                }
                idx << String.valueOf("$ixSchema.$ixTable.$ixCol")
            }
        }

        def missing = (fks - idx).sort().unique();
        println "Found ${fks.size()} FKs"
        println "Found ${idx.size()} IDXs"
        println "Missing ${missing.size()} IDXs on fk'd columns:"
        missing.each{
            println "\t$it"
        }
        assert missing.size() == 0;
    }

    /**
     * Upgrade an existing database
     */
    void upgradeDatabase() {
        // Postgres support has been removed, fail out explicitly if someone tries to upgrade it.
        if (DBTYPE_POSTGRES.equalsIgnoreCase(dbType)) {
            println("$dbType is no longer a supported database type.")
            System.exit(1)
        }

        // Provide location of install to upgrade scripts
        ant.property(name: "install.dir", value: installer.installServerDir)

        // run the upgrades
        extclasspath = getExternalClasspath()
        ant.taskdef(
                name: "upgrade",
                classname: "com.urbancode.cm.db.updater.DbUpgradeTask",
                classpath: extclasspath)

        // change the base dir to the database directory while running the upgrade because the upgrade files reference
        // file relative to it
        def oldBaseDir = ant.project.baseDir
        try {
            // Generate the db2zos scripts if needed
            if (DBTYPE_DB2_ON_ZOS.equalsIgnoreCase(dbType)) {
                // add the lib/ext jars from the previous installation to this thread's classpath
                // and force static initialization of the specified driver class in order to ensure
                // that the driver registers itself with DriverManager
                ClassLoader parentClassLoader = Thread.currentThread().getContextClassLoader();
                ClassLoader libExtClassLoader = getLibExtClassLoader(parentClassLoader);
                Class dbDriverClass = Class.forName(dbDriver, true, libExtClassLoader);
                Thread.currentThread().setContextClassLoader(libExtClassLoader);
                dbDriverClass.newInstance();

                checkMinimumDb2zOsDatabaseVersion(dbUrl, dbUsername, dbPassword, dbDriver) // Throws Exception

                generateReorgTableSpaceSP(dbDriver, dbUrl, dbUsername, dbPassword, extclasspath)
                generateDb2ZosUpgradeScripts(srcDir, "deploy", "db2", dbDatabaseName);
                generateDb2ZosUpgradeScripts(srcDir, "agent-topology", "db2", dbDatabaseName);
                generateDb2ZosUpgradeScripts(srcDir, "halock", "db2", dbDatabaseName);
                generateDb2ZosUpgradeScripts(srcDir, "inventory", "db2", dbDatabaseName);
                generateDb2ZosUpgradeScripts(srcDir, "property-sheets", "db2", dbDatabaseName);
                generateDb2ZosUpgradeScripts(srcDir, "security", "db2", dbDatabaseName);
                generateDb2ZosUpgradeScripts(srcDir, "vc", "db2", dbDatabaseName);
                generateDb2ZosUpgradeScripts(srcDir, "workflow", "db2", dbDatabaseName);
            }

            // uDeploy Schema
            println('Upgrading '+ServerConstants.PRODUCT_NAME_NORMAL+' Database Schema...')
            ant.project.baseDir = new File(oldBaseDir, "database/deploy")
            def props = [:];
            props['driver'] = dbDriver;
            props['url'] = dbUrl;
            props['userid'] = dbUsername;
            props['password'] = dbPassword;
            props['currentVersionSql'] = "SELECT ver FROM ds_db_version WHERE release_name = ?";
            props['deleteVersionSql'] = "DELETE FROM ds_db_version WHERE release_name = ?";
            props['updateVersionSql'] = "INSERT INTO ds_db_version (release_name, ver) VALUES (?, ?)";
            props['classpath'] = extclasspath;

            if (DBTYPE_DB2_ON_ZOS.equalsIgnoreCase(dbType)) {
                // We need this statement to tell DB2 zOS we are using standard SQL
                props['connectionInitSql'] = "SET CURRENT RULES = 'STD'";

                // For DB2 on zOS, we need to autocommit after every statement. This is
                // so we do not get lock contention on the System Tables, specifically
                // the system 'resource table' that controls all table structures.
                props['autocommit'] = "true";
            }

            ant.upgrade(props)
            {
                fileset(dir: srcDir + "/database/deploy/" + dbType) {
                    include(name: "upgrade_sql_*.xml")
                }
            }

            // Ant's SQL calls will treat $ specially. They need to be escaped by turning them into $$
            // Plus, $ is special in Groovy so we have to treat it differently than any other char
            def dollarSign = "\$"
            def antDBPassword = dbPassword.replaceAll("\\"+dollarSign, "\\"+dollarSign+"\\"+dollarSign)

            println('Seeding new UCD Version Stamp ...')
            ant.sql(
                """update ds_database_version set stamp = '${getAntProperty('version')}'
where id = '00000000-0000-0000-0000-000000000000'
""",
                driver:    dbDriver,
                url:       dbUrl,
                userid:    dbUsername,
                password:  antDBPassword,
                classpath: extclasspath)

        }
        finally {
            ant.project.baseDir = oldBaseDir
        }
    }

    /**
     * Get a URLClassLoader with a classpath of all the jars in
     * "$installDir/lib/ext".
     *
     * Suppress warnings about File.toURL() being deprecated because
     * File.toURI().toURL() can give bad results.
     */
    @SuppressWarnings(["Deprecated"])
    private URLClassLoader getLibExtClassLoader(ClassLoader parentClassLoader) {
        // add all of the jars in existing installation's lib/ext directory to the ClassLoader's
        // classpath
        File libExtDir = new File(installDir + "/lib/ext");
        String[] libExtDirContents = libExtDir.list();
        if (libExtDirContents == null) {
            throw new RuntimeException(installDir + "/lib/ext is not a directory");
        }
        List<URL> loaderClassPath = new ArrayList<URL>(libExtDirContents.length);
        for (String fileName : libExtDirContents) {
            if (fileName.endsWith(".jar")) {
                String newPath = libExtDir.getAbsolutePath() + "/" + fileName;
                loaderClassPath.add(new File(newPath).toURL());
            }
        }

        return new URLClassLoader((URL[])loaderClassPath.toArray(), parentClassLoader);
    }

    /**
     * Install a new database
     */
    void installDatabase() {
        def firstConnectUrl = dbUrl + (isDerby ? ';create=true' : '')

        extclasspath = getExternalClasspath()

        // Ant's SQL calls will treat $ specially. They need to be escaped by turning them into $$
        // Plus, $ is special in Groovy so we have to treat it differently than any other char
        def dollarSign = "\$"
        def antDBPassword = dbPassword.replaceAll("\\"+dollarSign, "\\"+dollarSign+"\\"+dollarSign)

        // Convert the schema over to work properly with DB2 on zOS
        if (DBTYPE_DB2_ON_ZOS.equalsIgnoreCase(dbType)) {
            checkMinimumDb2zOsDatabaseVersion(dbUrl, dbUsername, antDBPassword, dbDriver) // Throws Exception

            generateReorgTableSpaceSP(dbDriver, dbUrl, dbUsername, antDBPassword, extclasspath)

            generateSchemaFileForDB2OnZOS(srcDir, dbDatabaseName,
                    ServerConstants.PRODUCT_NAME_NORMAL, "deploy", "ud-schema")

            generateSchemaFileForDB2OnZOS(srcDir, dbDatabaseName,
                    "Versioned Configuration", "vc", "vc-schema")

            generateSchemaFileForDB2OnZOS(srcDir, dbDatabaseName,
                    "Property", "property-sheets", "property-schema")

            generateSchemaFileForDB2OnZOS(srcDir, dbDatabaseName,
                    "Inventory", "inventory", "inv-schema")

            generateSchemaFileForDB2OnZOS(srcDir, dbDatabaseName,
                    "Workflow Engine", "workflow", "wf-schema")

            generateSchemaFileForDB2OnZOS(srcDir, dbDatabaseName,
                    "Agent Topology", "agent-topology", "top-schema")

            generateSchemaFileForDB2OnZOS(srcDir, dbDatabaseName,
                    "HA Lock", "halock", "hlk-schema")
        }

        println('Creating Versioned Configuration Database Schema ...')
        ant.sql(
                driver:    dbDriver,
                url:       firstConnectUrl,
                userid:    dbUsername,
                password:  antDBPassword,
                classpath: extclasspath,
                src:       srcDir + '/database/vc/' + dbType + '/vc-schema.ddl')

        String foreignKeysDdl = generateForeignKeysSchema(srcDir, "Versioned Configuration",
                "vc", "vc-foreign-keys", dbType)
        println('Creating Versioned Configuration Foreign Keys ...')
        ant.sql(
                driver:    dbDriver,
                url:       dbUrl,
                userid:    dbUsername,
                password:  antDBPassword,
                classpath: extclasspath,
                src:       foreignKeysDdl)

        println('Seeding Versioned Configuration Database ...')
        ant.sql(
                driver:    dbDriver,
                url:       dbUrl,
                userid:    dbUsername,
                password:  antDBPassword,
                classpath: extclasspath,
                src:       srcDir + '/database/vc/vc-seed-data.sql')

        println('Creating Property Database Schema ...')
        ant.sql(
                driver:    dbDriver,
                url:       dbUrl,
                userid:    dbUsername,
                password:  antDBPassword,
                classpath: extclasspath,
                src:       srcDir + '/database/property-sheets/' + dbType + '/property-schema.ddl')

        foreignKeysDdl = generateForeignKeysSchema(srcDir, "Property Database", "property-sheets",
                "ps-foreign-keys", dbType)
        println('Creating Property Database Foreign Keys ...')
        ant.sql(
                driver:    dbDriver,
                url:       dbUrl,
                userid:    dbUsername,
                password:  antDBPassword,
                classpath: extclasspath,
                src:       foreignKeysDdl)

        println('Seeding Property Database ...')
        ant.sql(
                driver:    dbDriver,
                url:       dbUrl,
                userid:    dbUsername,
                password:  antDBPassword,
                classpath: extclasspath,
                src:       srcDir + '/database/property-sheets/ps-seed-data.sql')

        println('Creating Inventory Database Schema ...')
        ant.sql(
                driver:    dbDriver,
                url:       dbUrl,
                userid:    dbUsername,
                password:  antDBPassword,
                classpath: extclasspath,
                src:       srcDir + '/database/inventory/' + dbType + '/inv-schema.ddl')

        foreignKeysDdl = generateForeignKeysSchema(srcDir, "Inventory", "inventory",
                "inv-foreign-keys", dbType)
        println('Creating Inventory Foreign Keys ...')
        ant.sql(
                driver:    dbDriver,
                url:       dbUrl,
                userid:    dbUsername,
                password:  antDBPassword,
                classpath: extclasspath,
                src:       foreignKeysDdl)

        println('Seeding Inventory Database ...')
        ant.sql(
                driver:    dbDriver,
                url:       dbUrl,
                userid:    dbUsername,
                password:  antDBPassword,
                classpath: extclasspath,
                src:       srcDir + '/database/inventory/inv-seed-data.sql')

        println('Creating Workflow Engine Database Schema ...')
        ant.sql(
                driver:    dbDriver,
                url:       dbUrl,
                userid:    dbUsername,
                password:  antDBPassword,
                classpath: extclasspath,
                src:       srcDir + '/database/workflow/' + dbType + '/wf-schema.ddl')

        foreignKeysDdl = generateForeignKeysSchema(srcDir, "Workflow Engine", "workflow",
                "wf-foreign-keys", dbType)
        println('Creating Workflow Engine Foreign Keys ...')
        ant.sql(
                driver:    dbDriver,
                url:       dbUrl,
                userid:    dbUsername,
                password:  antDBPassword,
                classpath: extclasspath,
                src:       foreignKeysDdl)

        println('Seeding Workflow Engine Database ...')
        ant.sql(
                driver:    dbDriver,
                url:       dbUrl,
                userid:    dbUsername,
                password:  antDBPassword,
                classpath: extclasspath,
                src:       srcDir + '/database/workflow/wf-seed-data.sql')

        println('Creating Agent Topology Database Schema ...')
        ant.sql(
                driver:    dbDriver,
                url:       dbUrl,
                userid:    dbUsername,
                password:  antDBPassword,
                classpath: extclasspath,
                src:       srcDir + '/database/agent-topology/' + dbType + '/top-schema.ddl')

        foreignKeysDdl = generateForeignKeysSchema(srcDir, "Agent Topology", "agent-topology",
                "top-foreign-keys", dbType)
        println('Creating Agent Topology Foreign Keys ...')
        ant.sql(
                driver:    dbDriver,
                url:       dbUrl,
                userid:    dbUsername,
                password:  antDBPassword,
                classpath: extclasspath,
                src:       foreignKeysDdl)

        println('Seeding Agent Topology Database ...')
        ant.sql(
                driver:    dbDriver,
                url:       dbUrl,
                userid:    dbUsername,
                password:  antDBPassword,
                classpath: extclasspath,
                src:       srcDir + '/database/agent-topology/top-seed-data.sql')

        println('Creating HA Lock Database Schema ...')
        ant.sql(
                driver:    dbDriver,
                url:       dbUrl,
                userid:    dbUsername,
                password:  antDBPassword,
                classpath: extclasspath,
                src:       srcDir + '/database/halock/' + dbType + '/hlk-schema.ddl'
        )

        foreignKeysDdl = generateForeignKeysSchema(srcDir, "HA Lock", "halock",
                "hlk-foreign-keys", dbType)
        println('Creating HA Lock Foreign Keys ...')
        ant.sql(
                driver:    dbDriver,
                url:       dbUrl,
                userid:    dbUsername,
                password:  antDBPassword,
                classpath: extclasspath,
                src:       foreignKeysDdl)

        println('Seeding HA Lock Database ...')
        ant.sql(
                driver:    dbDriver,
                url:       dbUrl,
                userid:    dbUsername,
                password:  antDBPassword,
                classpath: extclasspath,
                src:       srcDir + '/database/halock/hlk-seed-data.sql'
        )

        // create the database tables, foreign keys and indexes
        println('Creating '+ServerConstants.PRODUCT_NAME_NORMAL+' Database Schema ...')
        ant.sql(
                driver:    dbDriver,
                url:       dbUrl,
                userid:    dbUsername,
                password:  antDBPassword,
                classpath: extclasspath,
                src:       srcDir + '/database/deploy/' + dbType + '/ud-schema.ddl')

        String extensionsFilePath = srcDir + '/database/deploy/' + dbType + '/schema-extensions.ddl';
        File extensionsFile = new File(extensionsFilePath)
        if (extensionsFile.isFile()) {
            println('Running '+ServerConstants.PRODUCT_NAME_NORMAL+' Database Schema extensions...')
            ant.sql(
                    driver:    dbDriver,
                    url:       dbUrl,
                    userid:    dbUsername,
                    password:  antDBPassword,
                    classpath: extclasspath,
                    src:       extensionsFilePath)
        }

        foreignKeysDdl = generateForeignKeysSchema(srcDir,
                ServerConstants.PRODUCT_NAME_NORMAL, "deploy", "ud-foreign-keys", dbType)
        println('Creating '+ServerConstants.PRODUCT_NAME_NORMAL+' Foreign Keys ...')
        ant.sql(
                driver:    dbDriver,
                url:       firstConnectUrl,
                userid:    dbUsername,
                password:  antDBPassword,
                classpath: extclasspath,
                src:       foreignKeysDdl)


        println('Seeding '+ServerConstants.PRODUCT_NAME_NORMAL+' Database ...')
        ant.sql(
                driver:    dbDriver,
                url:       dbUrl,
                userid:    dbUsername,
                password:  antDBPassword,
                classpath: extclasspath,
                src:       srcDir + '/database/deploy/ud-seed-data.sql')

        println('Seeding UCD Version Stamp ...')
        ant.sql(
                """insert into ds_database_version (id, stamp)
values ('00000000-0000-0000-0000-000000000000', '${getAntProperty('version')}');
""",
                driver:    dbDriver,
                url:       dbUrl,
                userid:    dbUsername,
                password:  antDBPassword,
                classpath: extclasspath)

        println('Updating External URLS ...')
        ant.sql(
                """insert into ps_prop_value (id, version, name, value, long_value, description, secure, prop_sheet_id)
values ('00000000-0000-0000-0000-000000000001', 0, 'server.external.web.url', '${externalUrl}', null, null, 'N', '00000000-0000-0000-0000-000000000001');
insert into ps_prop_value (id, version, name, value, long_value, description, secure, prop_sheet_id)
values ('00000000-0000-0000-0000-000000000011', 0, 'server.external.user.url', '${externalUrl}', null, null, 'N', '00000000-0000-0000-0000-000000000001');
""",
                driver:    dbDriver,
                url:       dbUrl,
                userid:    dbUsername,
                password:  antDBPassword,
                classpath: extclasspath)

        println('Updating License Server URL ...')
        ant.sql(
                """insert into ps_prop_value (id, version, name, value, long_value, description, secure, prop_sheet_id)
values ('00000000-0000-0000-0000-000000000014', 0, 'license.server.url', '${licenseServerUrl}', null, null, 'N', '00000000-0000-0000-0000-000000000001');
""",
                driver:    dbDriver,
                url:       dbUrl,
                userid:    dbUsername,
                password:  antDBPassword,
                classpath: extclasspath)
        println('Setting up admin login credentials ...')
        String adminPasswordEncrypted = CryptStringUtil.class.hash(adminPassword);
        setUserPassword('20000000000000000000000001000000', adminPasswordEncrypted,  dbDriver, dbUrl, dbUsername, antDBPassword, extclasspath, ant);

        byte[] randomBytes = new byte[128];
        new Random().nextBytes(randomBytes);
        String builtInUserPassword = Base64.encodeBase64String(randomBytes);
        builtInUserPassword = CryptStringUtil.class.hash(builtInUserPassword);
        setUserPassword('3bc38da4-4811-4aa6-bef3-05d87d34d0b5', builtInUserPassword, dbDriver, dbUrl, dbUsername, antDBPassword, extclasspath, ant);
        setUserPassword('fcb9ec26-4f0d-4c8a-83df-2a55afcb7153', builtInUserPassword, dbDriver, dbUrl, dbUsername, antDBPassword, extclasspath, ant);
        setUserPassword('79f349d5-0c10-476b-a8ca-35367cf689c9', builtInUserPassword, dbDriver, dbUrl, dbUsername, antDBPassword, extclasspath, ant);
        setUserPassword('cb696ca8-108c-4418-8aee-8e8cc7482078', builtInUserPassword, dbDriver, dbUrl, dbUsername, antDBPassword, extclasspath, ant);
    }

    private void setUserPassword(String userid, String password, def driv, def dburl, def dbuser, def dbpass, def extclasspath, def ant) {
        ant.sql(
                """update sec_user set password = '${password}' where id = '${userid}'""",
                driver:    driv,
                url:       dburl,
                userid:    dbuser,
                password:  dbpass,
                classpath: extclasspath)
    }

    private void checkMinimumDb2zOsDatabaseVersion(String url, String username, String password, String driver) {
        int db2zOSVersion = getDB2zOSVersion(url, username, password, driver)
        if (db2zOSVersion < MIN_DB2ZOS_VERSION) {
            throw new SQLException(
                String.format(
                    "%s is not compatible with DB2 Version %d on z/OS. Must be a minimum version of %d",
                    ServerConstants.PRODUCT_NAME_NORMAL, db2zOSVersion, MIN_DB2ZOS_VERSION))
        }
    }

    /**
     * Start derby using the given directory and port
     */
    void startDerby() {
        new File(appStorageDir, "var/db/").mkdirs()
        ant.java(
                classname: "org.apache.derby.drda.NetworkServerControl",
                fork:      'true',
                spawn:     'true',
                dir:       "$appStorageDir/var/db/"
        ) {
            arg(value:'start')
            arg(value:'-h')
            arg(value:'localhost')
            arg(value:'-p')
            arg(value:dbDerbyPort)
            arg(value:'-noSecurityManager')
            classpath(){
                pathelement( location: "$srcDir/lib/derbynet.jar")
                pathelement( location: "$srcDir/lib/derby.jar")
            }
        }
    }

    /**
     * Stop derby using the given directory and port
     */
    void stopDerby() {
        println('Stopping embedded database ...')
        ant.java(
                classname: 'org.apache.derby.drda.NetworkServerControl',
                fork:      'true',
                inputstring: '',
                dir:       "$appStorageDir/var/db/"
        ) {
            arg(value:'shutdown')
            arg(value:'-h')
            arg(value:'localhost')
            arg(value:'-p')
            arg(value:dbDerbyPort)
            classpath() {
                pathelement( location: srcDir + '/lib/derbynet.jar')
                pathelement( location: srcDir + '/lib/derby.jar')
            }
        }
    }

    /**
     * Pause until Derby has started up.
     */
    boolean waitForDerby(Integer numSeconds) {
        def control = new org.apache.derby.drda.NetworkServerControl(InetAddress.getByName('localhost'), Integer.valueOf(dbDerbyPort))
        boolean started = false
        int waitSeconds = numSeconds
        while (!started && waitSeconds >= 0) {
            try {
                control.ping() // throws exception if not started
                started = true
            }
            catch (Exception e) {
            }

            if (started || waitSeconds == 0) {
                break
            }

            // sleep at most 3 seconds between database tests
            long sleepTime = Math.min(waitSeconds, 3)
            println("\twaiting for db to start - $waitSeconds seconds remaining")
            Thread.sleep(sleepTime * 1000L)
            waitSeconds -= sleepTime
        }
        return started;
    }

    /**
     * Wrapper for println to channel through ant
     */
    private void println(displayText) {
        if (displayText != null) {
            ant.echo(displayText)
        }
    }

    void migrateDatabase() {
        initProperties()

        installDir = installer.installServerDir
        appStorageDir = installer.appStorageDir
        srcDir = installer.srcDir
        doUpgrade = installer.doUpgrade

        extclasspath = getExternalClasspath()

        if (!doUpgrade) {
            println('Server not found to migrate')
        }
        else {
            def migrateFromDbDataFactory = "org.dbunit.dataset.datatype.DefaultDataTypeFactory"
            def migrateToDbDataFactory = "org.dbunit.dataset.datatype.DefaultDataTypeFactory"
            def migrateDbType
            def migrateDbDriver
            def migrateDerbyPort
            def migrateDbUrl
            def migrateDbSchema
            def migrateDbUser
            def migrateDbPwd
            def migrateDbDatabaseName

            if (DBTYPE_DERBY.equalsIgnoreCase(dbType)) {
                dbDriver = 'org.apache.derby.jdbc.EmbeddedDriver'
                dbUrl = 'jdbc:derby:' + appStorageDir + File.separatorChar + 'var' +
                        File.separatorChar + 'db' + File.separatorChar + 'data'
            }
            else if (DBTYPE_ORACLE.equalsIgnoreCase(dbType)) {
                migrateFromDbDataFactory = "org.dbunit.ext.oracle.Oracle10DataTypeFactory"
            }
            else if (DBTYPE_MYSQL.equalsIgnoreCase(dbType)) {
                migrateFromDbDataFactory = "org.dbunit.ext.mysql.MySqlDataTypeFactory"
            }
            else if (DBTYPE_SQLSERVER.equalsIgnoreCase(dbType)) {
                migrateFromDbDataFactory = "org.dbunit.ext.mssql.MsSqlDataTypeFactory"
            }
            else if (DBTYPE_POSTGRES.equalsIgnoreCase(dbType)) {
                // allow migration off of postgres for now
                migrateFromDbDataFactory = "org.dbunit.ext.postgresql.PostgresqlDataTypeFactory"
            }
            else if (DBTYPE_DB2_ON_LUW.equalsIgnoreCase(dbType)
                || DBTYPE_DB2_ON_ZOS.equalsIgnoreCase(dbType)) {
                migrateFromDbDataFactory = "org.dbunit.ext.db2.Db2DataTypeFactory"
            }

            migrateDbType = installer.prompt(
                    migrateDbType,
                    'Enter the database type '+ServerConstants.PRODUCT_NAME_NORMAL+' should migrate to. [derby, mysql, oracle, sqlserver, db2]',
                    'mysql',
                    requiredValidator)
            if (DBTYPE_DERBY.equalsIgnoreCase(migrateDbType)) {
                migrateDbDriver = 'org.apache.derby.jdbc.ClientDriver'
                if (migrateDerbyPort == null) {
                    migrateDerbyPort = '11366'
                }
                migrateDbUrl = 'jdbc:derby://localhost:' + migrateDerbyPort + '/data'
            }
            else if (DBTYPE_ORACLE.equalsIgnoreCase(migrateDbType)) {
                migrateDbDriver = installer.prompt(
                        migrateDbDriver,
                        'Enter the database driver. [Default: oracle.jdbc.driver.OracleDriver]',
                        'oracle.jdbc.driver.OracleDriver',
                        requiredValidator)
                installer.prompt('Please place the jar file containing the driver for your '+
                        'database inside the lib/ext directory in the '+ServerConstants.PRODUCT_NAME_NORMAL+' installer. '+
                        '(press enter to continue)')
                migrateDbUrl = installer.prompt(
                        migrateDbUrl,
                        'Enter the database connection string. Eg. jdbc:oracle:thin:@localhost:1521:sid',
                        null,
                        requiredValidator)
                migrateDbSchema = installer.prompt(
                        migrateDbSchema,
                        'Enter the database schema name. (required if user has DBA role)',
                        null,
                        optionalValidator)
                if (migrateDbSchema != null) {
                    migrateDbSchema = String.valueOf(migrateDbSchema).toUpperCase()
                }
                migrateToDbDataFactory = "org.dbunit.ext.oracle.Oracle10DataTypeFactory"
            }
            else if (DBTYPE_MYSQL.equalsIgnoreCase(migrateDbType)) {
                migrateDbDriver = installer.prompt(
                        migrateDbDriver,
                        'Enter the database driver. [Default: com.mysql.jdbc.Driver]',
                        'com.mysql.jdbc.Driver',
                        requiredValidator)
                migrateDbUrl = installer.prompt(
                        migrateDbUrl,
                        'Enter the database connection string. Eg. jdbc:mysql://localhost:3306/'+ServerConstants.PRODUCT_NAME_SIMPLE,
                        null,
                        requiredValidator)
                migrateToDbDataFactory = "org.dbunit.ext.mysql.MySqlDataTypeFactory"
            }
            else if (DBTYPE_SQLSERVER.equalsIgnoreCase(migrateDbType)) {
                migrateDbDriver = installer.prompt(
                        migrateDbDriver,
                        'Enter the database driver. [Default: com.microsoft.sqlserver.jdbc.SQLServerDriver]',
                        'com.microsoft.sqlserver.jdbc.SQLServerDriver',
                        requiredValidator)
                installer.prompt('Please place the jar file containing the driver for your '+
                        'database inside the lib/ext directory in the '+ServerConstants.PRODUCT_NAME_NORMAL+' installer. '+
                        '(press enter to continue)')
                migrateDbUrl = installer.prompt(
                        migrateDbUrl,
                        'Enter the database connection string. Eg. jdbc:sqlserver://localhost:1433;DatabaseName='+ServerConstants.PRODUCT_NAME_SIMPLE,
                        null,
                        requiredValidator)
                migrateToDbDataFactory = "org.dbunit.ext.mssql.MsSqlDataTypeFactory"
            }
            else if (DBTYPE_DB2_ON_LUW.equalsIgnoreCase(migrateDbType)
                || DBTYPE_DB2_ON_ZOS.equalsIgnoreCase(migrateDbType)) {

                migrateDbDriver = installer.prompt(
                        migrateDbDriver,
                        "Enter the database driver. [Default: com.ibm.db2.jcc.DB2Driver]",
                        "com.ibm.db2.jcc.DB2Driver",
                        requiredValidator)
                installer.prompt('Please place the jar file containing the driver for your '+
                        'database inside the lib/ext directory in the '+ServerConstants.PRODUCT_NAME_NORMAL+' installer. '+
                        '(press enter to continue)')
                migrateDbUrl = installer.prompt(
                        migrateDbUrl,
                        "Enter the database connection string. Eg. jdbc:db2://localhost:50000/"+ServerConstants.PRODUCT_NAME_SIMPLE,
                        null,
                        requiredValidator)

                if (DBTYPE_DB2_ON_ZOS.equalsIgnoreCase(migrateDbType)) {
                    migrateDbDatabaseName = installer.prompt(
                            migrateDbDatabaseName,
                            "Enter the database name. (Note: Not necessarily the database location)",
                            null,
                            requiredValidator)
                }
                migrateToDbDataFactory = "org.dbunit.ext.db2.Db2DataTypeFactory"
            }

            String defaultDbUsername = ServerConstants.PRODUCT_NAME_SIMPLE.replace("-", "_");
            migrateDbUser = installer.prompt(
                    migrateDbUser,
                    "Enter the database username. [Default: "+defaultDbUsername+"]",
                    defaultDbUsername,
                    requiredValidator)
            migrateDbPwd = installer.prompt(
                    migrateDbPwd,
                    'Enter the database password. [Default: password]',
                    'password',
                    requiredValidator)

            ant.taskdef(
                    name:       'dbunit',
                    classname:  'org.dbunit.ant.DbUnitTask',
                    classpath: extclasspath)

            // Ant's SQL calls will treat $ specially. They need to be escaped by turning them into $$
            // Plus, $ is special in Groovy so we have to treat it differently than any other char
            def dollarSign = "\$"
            def antDBPassword = dbPassword.replaceAll("\\"+dollarSign, "\\"+dollarSign+"\\"+dollarSign)
            def antMigrateDbPwd = migrateDbPwd.replaceAll("\\"+dollarSign, "\\"+dollarSign+"\\"+dollarSign)

            // The MySQL driver defaults to retrieving all rows into memory, so if that's what we're
            // using, we need to explicitly tell it to retrieve each record individually, which is
            // evidently the effect of setting fetch size to Integer.MIN_VALUE.
            def fetchSize = 100;
            if (DBTYPE_MYSQL.equalsIgnoreCase(dbType)) {
                fetchSize = Integer.MIN_VALUE
            }

            // export the data
            println('\nExporting the current '+ServerConstants.PRODUCT_NAME_NORMAL+' database...\n')
            final def exportXmlFile = new File(srcDir + '/database/export.xml')
            if (exportXmlFile.exists()) {
                println('\nSkipping database export. Export file already exists: ' + exportXmlFile + '\n')
            }
            else if (dbSchema != null && dbSchema.length() > 0) {
                ant.dbunit(
                        driver:    dbDriver,
                        url:       dbUrl,
                        userid:    dbUsername,
                        password:  antDBPassword,
                        schema:    dbSchema,
                        classpath: extclasspath
                ) {
                    export(dest: exportXmlFile, format:'xml')
                    dbconfig {
                        property(name: "datatypeFactory", value: migrateFromDbDataFactory)
                        property(name: "fetchSize", value: fetchSize)
                    }
                }
            }
            else {
                ant.dbunit(
                        driver:    dbDriver,
                        url:       dbUrl,
                        userid:    dbUsername,
                        password:  antDBPassword,
                        classpath: extclasspath
                ) {
                    export(dest: exportXmlFile, format:'xml')
                    dbconfig {
                        property(name: "datatypeFactory", value: migrateFromDbDataFactory)
                        property(name: "fetchSize", value: fetchSize)
                    }
                }
            }
            println('\n'+ServerConstants.PRODUCT_NAME_NORMAL+' database exported\n')


            if (DBTYPE_DB2_ON_ZOS.equalsIgnoreCase(migrateDbType)) {

                generateReorgTableSpaceSP(migrateDbDriver, migrateDbUrl, migrateDbUser, antMigrateDbPwd, extclasspath)

                generateSchemaFileForDB2OnZOS(srcDir, migrateDbDatabaseName,
                        ServerConstants.PRODUCT_NAME_NORMAL, "deploy", "ud-schema")

                generateSchemaFileForDB2OnZOS(srcDir, migrateDbDatabaseName,
                        "Versioned Configuration", "vc", "vc-schema")

                generateSchemaFileForDB2OnZOS(srcDir, migrateDbDatabaseName,
                        "Property", "property-sheets", "property-schema")

                generateSchemaFileForDB2OnZOS(srcDir, migrateDbDatabaseName,
                        "Inventory", "inventory", "inv-schema")

                generateSchemaFileForDB2OnZOS(srcDir, migrateDbDatabaseName,
                        "Workflow Engine", "workflow", "wf-schema")

                generateSchemaFileForDB2OnZOS(srcDir, migrateDbDatabaseName,
                        "Agent Topology", "agent-topology", "top-schema")

                generateSchemaFileForDB2OnZOS(srcDir, migrateDbDatabaseName,
                        "HA Lock", "halock", "hlk-schema")
            }

            println('Creating Database ...')
            final def firstConnectUrl = migrateDbUrl + (DBTYPE_DERBY.equalsIgnoreCase(migrateDbType) ? ';create=true' : '')

            // create the database tables, foreign keys and indexes
            println('Creating '+ServerConstants.PRODUCT_NAME_NORMAL+' Database Schema ...')
            ant.sql(
                    driver:    migrateDbDriver,
                    url:       firstConnectUrl,
                    userid:    migrateDbUser,
                    password:  antMigrateDbPwd,
                    classpath: extclasspath,
                    src:       srcDir + '/database/deploy/' + migrateDbType + '/ud-schema.ddl')

            String extensionsFilePath = srcDir + '/database/deploy/' + dbType + '/schema-extensions.ddl';
            File extensionsFile = new File(extensionsFilePath)
            if (extensionsFile.isFile()) {
                println('Running '+ServerConstants.PRODUCT_NAME_NORMAL+' Database Schema extensions...')
                ant.sql(
                        driver:    dbDriver,
                        url:       dbUrl,
                        userid:    dbUsername,
                        password:  antDBPassword,
                        classpath: extclasspath,
                        src:       extensionsFilePath)
            }

            println('Creating Versioned Configuration Database Schema ...')
            ant.sql(
                    driver:    migrateDbDriver,
                    url:       migrateDbUrl,
                    userid:    migrateDbUser,
                    password:  antMigrateDbPwd,
                    classpath: extclasspath,
                    src:       srcDir + '/database/vc/' + migrateDbType + '/vc-schema.ddl')

            println('Creating Property Database Schema ...')
            ant.sql(
                    driver:    migrateDbDriver,
                    url:       migrateDbUrl,
                    userid:    migrateDbUser,
                    password:  antMigrateDbPwd,
                    classpath: extclasspath,
                    src:       srcDir + '/database/property-sheets/' + migrateDbType + '/property-schema.ddl')

            println('Creating Inventory Database Schema ...')
            ant.sql(
                    driver:    migrateDbDriver,
                    url:       migrateDbUrl,
                    userid:    migrateDbUser,
                    password:  antMigrateDbPwd,
                    classpath: extclasspath,
                    src:       srcDir + '/database/inventory/' + migrateDbType + '/inv-schema.ddl')

            println('Creating Workflow Engine Database Schema ...')
            ant.sql(
                    driver:    migrateDbDriver,
                    url:       migrateDbUrl,
                    userid:    migrateDbUser,
                    password:  antMigrateDbPwd,
                    classpath: extclasspath,
                    src:       srcDir + '/database/workflow/' + migrateDbType + '/wf-schema.ddl')

            println('Creating Agent Topology Database Schema ...')
            ant.sql(
                    driver:    migrateDbDriver,
                    url:       migrateDbUrl,
                    userid:    migrateDbUser,
                    password:  antMigrateDbPwd,
                    classpath: extclasspath,
                    src:       srcDir + '/database/agent-topology/' + migrateDbType + '/top-schema.ddl')

            println('Creating HA Lock Database Schema ...')
            ant.sql(
                    driver:    migrateDbDriver,
                    url:       migrateDbUrl,
                    userid:    migrateDbUser,
                    password:  antMigrateDbPwd,
                    classpath: extclasspath,
                    src:       srcDir + '/database/halock/' + migrateDbType + '/hlk-schema.ddl'
            )

            println('Importing Database ...')
            if (migrateDbSchema != null) {
                ant.dbunit(
                        driver:    migrateDbDriver,
                        url:       migrateDbUrl,
                        userid:    migrateDbUser,
                        password:  antMigrateDbPwd,
                        schema:    migrateDbSchema,
                        datatypeFactory: migrateToDbDataFactory,
                        classpath: extclasspath
                ) {
                    operation(type: 'INSERT', src: exportXmlFile, format:'xml')
                    dbconfig {
                        property(name: "datatypeFactory", value: migrateToDbDataFactory)
                    }
                }
            }
            else {
                ant.dbunit(
                        driver:    migrateDbDriver,
                        url:       migrateDbUrl,
                        userid:    migrateDbUser,
                        password:  antMigrateDbPwd,
                        classpath: extclasspath
                ) {
                    operation(type: 'INSERT', src: exportXmlFile, format:'xml')
                    dbconfig {
                        property(name: "datatypeFactory", value: migrateToDbDataFactory)
                    }
                }
            }

            String foreignKeysDdl = generateForeignKeysSchema(srcDir,
                    ServerConstants.PRODUCT_NAME_NORMAL, "deploy", "ud-foreign-keys", migrateDbType)
            println('Creating Foreign Keys ...')
            ant.sql(
                    driver:    migrateDbDriver,
                    url:       migrateDbUrl,
                    userid:    migrateDbUser,
                    password:  antMigrateDbPwd,
                    classpath: extclasspath,
                    src:       foreignKeysDdl)

            foreignKeysDdl = generateForeignKeysSchema(srcDir, "Property Database",
                    "property-sheets", "ps-foreign-keys", migrateDbType)
            println('Creating Property Database Foreign Keys ...')
            ant.sql(
                    driver:    migrateDbDriver,
                    url:       migrateDbUrl,
                    userid:    migrateDbUser,
                    password:  antMigrateDbPwd,
                    classpath: extclasspath,
                    src:       foreignKeysDdl)

            foreignKeysDdl = generateForeignKeysSchema(srcDir, "Inventory",
                    "inventory", "inv-foreign-keys", migrateDbType)
            println('Creating Inventory Foreign Keys ...')
            ant.sql(
                    driver:    migrateDbDriver,
                    url:       migrateDbUrl,
                    userid:    migrateDbUser,
                    password:  antMigrateDbPwd,
                    classpath: extclasspath,
                    src:       foreignKeysDdl)

            foreignKeysDdl = generateForeignKeysSchema(srcDir, "Versioned Configuration",
                    "vc", "vc-foreign-keys", migrateDbType)
            println('Creating Versioned Configuration Foreign Keys ...')
            ant.sql(
                    driver:    migrateDbDriver,
                    url:       migrateDbUrl,
                    userid:    migrateDbUser,
                    password:  antMigrateDbPwd,
                    classpath: extclasspath,
                    src:       foreignKeysDdl)

            foreignKeysDdl = generateForeignKeysSchema(srcDir, "Agent Topology",
                    "agent-topology", "top-foreign-keys", migrateDbType)
            println('Creating Agent Topology Foreign Keys ...')
            ant.sql(
                    driver:    migrateDbDriver,
                    url:       migrateDbUrl,
                    userid:    migrateDbUser,
                    password:  antMigrateDbPwd,
                    classpath: extclasspath,
                    src:       foreignKeysDdl)

            foreignKeysDdl = generateForeignKeysSchema(srcDir, "HA Lock",
                    "halock", "hlk-foreign-keys", migrateDbType)
            println('Creating HA Lock Foreign Keys ...')
            ant.sql(
                    driver:    migrateDbDriver,
                    url:       migrateDbUrl,
                    userid:    migrateDbUser,
                    password:  antMigrateDbPwd,
                    classpath: extclasspath,
                    src:       foreignKeysDdl)

            println('\n'+ServerConstants.PRODUCT_NAME_SIMPLE+' database imported\n')

            def installedPropertiesFilePath = installDir + "/conf/server/installed.properties"
            ant.propertyfile(file: installedPropertiesFilePath) {
                entry(key: "database.type", value: migrateDbType)
                entry(key: "database.derby.port", value: migrateDerbyPort)
                entry(key: "hibernate.connection.username", value: migrateDbUser)
                entry(key: "hibernate.connection.password", value: CryptStringUtil.class.encrypt(migrateDbPwd))
                entry(key: "hibernate.connection.url", value: migrateDbUrl)
                entry(key: "hibernate.connection.driver_class", value: migrateDbDriver)
            }
            if (migrateDbSchema != null) {
                ant.propertyfile(file: installedPropertiesFilePath) {
                    entry(key: "hibernate.default_schema", value: migrateDbSchema)
                }
            }
            if ("oracle".equalsIgnoreCase(migrateDbType) && isOracle12(migrateDbUrl, migrateDbUser, migrateDbPwd, migrateDbDriver)) {
                ant.propertyfile(file: installedPropertiesFilePath) {
                    entry(key: "hibernate.dialect", value: "org.hibernate.dialect.Oracle10gDialect")
                }
            }
            else {
                ant.replace(file: installedPropertiesFilePath) {
                    replaceFilter(token: "hibernate.dialect", value: "#hibernate.dialect")
                }
            }

            ant.mkdir(dir: installDir + "/lib/ext")
            ant.copy(todir: installDir + "/lib/ext", overwrite: 'true') {
                fileset(dir: srcDir + "/lib/ext") {
                    include(name: "*.jar")
                    include(name: "*.zip")
                }
            }
        }

        println("\n"+ServerConstants.PRODUCT_NAME_SIMPLE+" database migration complete.\n")
    }

    //----------------------------------------------------------------------------------------------
    def createSecretKey() {
        String aesAlias = ""
        String desedeAlias = ""
        def installedPropertiesFilePath = installDir + "/conf/server/installed.properties"
        File keyStoreFile = new File(encryptionKeyStorePath)
        ant.property(name: "encryption.keystore.file", value: keyStoreFile.absolutePath)

        KeyStore keyStore = loadKeyStore(keyStoreFile)

        Enumeration<String> aliases = keyStore.aliases()
        while(aliases.hasMoreElements()) {
            String alias = aliases.nextElement()
            java.security.Key key = keyStore.getKey(alias, encryptionKeyStorePassword.toCharArray())
            if (key != null && key instanceof SecretKey && alias.startsWith("aes128key")) {
                aesAlias = alias
            }
            if (key != null && key instanceof SecretKey && alias.startsWith("${oldAlias}")) {
                desedeAlias = alias
            }
        }

        def uniquePart = RandomStringUtils.randomAlphanumeric(4)
        if ("${oldAlias}".equals(desedeAlias)) {
            println "Updating the alias of the old DESede secret key."
            SecretKey desKey = keyStore.getKey(oldAlias, encryptionKeyStorePassword.toCharArray())
            desedeAlias = "${oldAlias}${uniquePart}".toLowerCase()
            keyStore.setKeyEntry(desedeAlias, desKey, encryptionKeyStorePassword.toCharArray(), null)
            isKeyStoredNow = keyStore.isKeyEntry(desedeAlias);
        }
        if (!aesAlias) {
            println "Creating new AES encryption key."
            try {
                aesAlias = "aes128key${uniquePart}".toLowerCase()
                SecureRandom sr = SecureRandomHelper.getSecureRandom();
                KeyGenerator keygen = KeyGenerator.getInstance("AES")
                keygen.init(128, sr)
                SecretKey aes128Key = keygen.generateKey()
                keyStore.setKeyEntry(aesAlias, aes128Key, encryptionKeyStorePassword.toCharArray(), null)
                //throw KeyStoreException if keystore was not initialized
                def isKeyStoredNow = keyStore.isKeyEntry(aesAlias);
            }
            catch (NoSuchAlgorithmException impossible) {
                throw new RuntimeException(impossible)
            }
            catch (UnsupportedEncodingException impossible) {
            }
            catch (IOException e) {
                throw new SecurityException(e)
            }

            OutputStream output = new FileOutputStream(keyStoreFile)
            try {
                keyStore.store(output, encryptionKeyStorePassword.toCharArray())
            }
            finally {
                output.close()
            }
        }
        else {
            println "Encryption key retrieved from keystore. Proceeding..."
        }

        //ensure installed.properties references the correct AES key alias and not an imported key alias
        def existingAlias = getAntProperty('encryption.keystore.alias')
        if (!(existingAlias && existingAlias.startsWith("aes128key"))) {
            ant.propertyfile(file: installedPropertiesFilePath) {
                entry(key: "encryption.keystore.alias", value: aesAlias)
            }
        }

        //these properties are used for database upgrades, they are not written out to installed.properties
        ant.property(name: "encryption.keystore.alias", value: aesAlias)
        ant.property(name: "key.store.password", value: encryptionKeyStorePassword)
        ant.property(name: "key.store.des.alias", value: desedeAlias)
    }

    //----------------------------------------------------------------------------------------------
    def loadKeyStore(File keyStoreFile)
    throws GeneralSecurityException, IOException {

        String type = "JCEKS"
        KeyStore keyStore = null
        try {
            keyStore = KeyStore.getInstance(type)
        }
        catch (KeyStoreException e) {
            throw new RuntimeException("Key store type \"" + type + "\" is not available", e)
        }

        if (keyStoreFile.exists()) {
            InputStream input = new FileInputStream(keyStoreFile)
            try {
                def retries = 4
                while (retries > 0) {
                    try {
                        keyStore.load(input, encryptionKeyStorePassword.toCharArray())
                        retries = 0
                    }
                    catch (KeyStoreException e) {
                        // Password was wrong
                        encryptionKeyStorePassword = installer.promptForPassword(
                                encryptionKeyStorePassword,
                                "The password used was incorrect. Please enter the keystore password.",
                                requiredValidator
                                )
                        retries--
                        if (retries == 0) {
                            println("Error: The provided keystore password is incorrect.")
                            System.exit(1)
                        }
                    }
                }
            }
            finally {
                input.close()
            }
        }
        else {
            //new keystores are loaded with null for first arg
            keyStore.load(null, encryptionKeyStorePassword.toCharArray())
        }

        return keyStore
    }


    private makeJavaLibraryPath() {
        // vendor specific library path
        def vendor = getAntProperty("vendor.name")
        if ('ibm'.equalsIgnoreCase(vendor)) {
            makeJavaLibraryPathForRcl()
        } else {
            makeJavaLibraryPathForFlexera()
        }
    }

    private makeJavaLibraryPathForRcl() {
        def slash = File.separator;
        def supportedOs = [
            aix:     [ppc: "aix"+slash+"32",          ppc64: "aix"+slash+"64"],
            linux:   [x86: "linux"+slash+"x386_32",   x64: "linux"+slash+"x386_64",
                      ppc: "linux-ppc"+slash+"32",    ppc64:"linux-ppc"+slash+"64"],
            macosx:  [x86: "mac"+slash+"x86",         x64: "mac"+slash+"x86"],
            solaris: [x86: "solaris"+slash+"x386_32", x64: null],
            windows: [x86: "win"+slash+"x386_32",     x64: "win"+slash+"x386_64"]
        ]

        def javaLibraryPathCmd = null
        try {
            println("OS: " + installer.installOs)
            println("Architecture: " + installer.installArch)
            if (installer.installOs.equals("unknown")) {
                throw RuntimeException("Unknown OS")
            }
            def supportedArch = supportedOs.getAt(installer.installOs)
            if (supportedArch == null) {
                throw RuntimeException("OS may not be supported.")
            }
            def toUse = supportedArch.getAt(installer.installArch)
            if (toUse == null) {
                throw RuntimeException("Architecture may not be supported.")
            }

            javaLibraryPathCmd = "-Djava.library.path="

            // Sticking to filepath convention in ContainerInstaller
            def suffixUnix =  "\\\"" + installDir + "/lib/rcl/" + toUse + "\\\""
            def suffixWin = '"' + installDir + "\\lib\\rcl\\" + toUse + '"'
            def suffix = installer.isWindows ? suffixWin : suffixUnix

            def javaOptsFile = installDir+"/bin/set_env"
            if (installer.isWindows) {
                // Windows uses .cmd extension for set_env file
                javaOptsFile += ".cmd"

                // Update service files
                def serviceFile = installDir+"/bin/service/service.cmd"
                updateJavaOpts(serviceFile, ';', javaLibraryPathCmd + suffix.substring(1, suffix.size() - 1))
                serviceFile = installDir+"/bin/service/_service.cmd"
                updateJavaOpts(serviceFile, ';', javaLibraryPathCmd + suffix.substring(1, suffix.size() - 1))
            }

            if (!doUpgrade) {
                // Update set_env file
                updateJavaOpts(javaOptsFile, ' ', javaLibraryPathCmd + suffix)
                replaceJavaOpts(javaOptsFile, /(-XX:MaxPermSize=)(.*?)\ /, '');
            }
        }
        catch (RuntimeException e) {
            // Only display warning on new install
            if (!doUpgrade) {
                installer.prompt("[WARNING]  The detected operating system ("
                        + installer.installOs+") and architecture ("+installer.installArch
                        + ") may not be supported by the Rational Licensing server. You"
                        + " will need to supply the java.library.path argument and point"
                        + " it to the RCL API native library when starting your server."
                        + " You can do this by adding -Djava.library.path=\"path/to/library\""
                        + " in " + installDir + "/bin/set_env."
                        + "\n(press enter to continue)")
            }
        }
    }

    private makeJavaLibraryPathForFlexera() {
        def slash = File.separator;
        def supportedOs = [
            linux:   [x86: "linux"+slash+"x86", x64: "linux"+slash+"x64"],
            windows: [x86: "windows"+slash+"x86", x64: "windows"+slash+"x64"]
        ]

        def javaLibraryPathCmd = null
        try {
            println("OS: " + installer.installOs)
            println("Architecture: " + installer.installArch)
            if (installer.installOs.equals("unknown")) {
                throw RuntimeException("Unknown OS")
            }
            def supportedArch = supportedOs.getAt(installer.installOs)
            if (supportedArch == null) {
                throw RuntimeException("OS may not be supported.")
            }
            def toUse = supportedArch.getAt(installer.installArch)
            if (toUse == null) {
                throw RuntimeException("Architecture may not be supported.")
            }

            javaLibraryPathCmd = "-Djava.library.path="

            // Sticking to filepath convention in ContainerInstaller
            def suffixUnix =  "\\\"" + installDir + "/lib/flexera/" + toUse + "\\\""
            def suffixWin = '"' + installDir + "\\lib\\flexera\\" + toUse + '"'
            def suffix = installer.isWindows ? suffixWin : suffixUnix

            def javaOptsFile = installDir+"/bin/set_env"
            if (installer.isWindows) {
                // Windows uses .cmd extension for set_env file
                javaOptsFile += ".cmd"

                // Update service files
                def serviceFile = installDir+"/bin/service/service.cmd"
                updateJavaOpts(serviceFile, ';', javaLibraryPathCmd + suffix.substring(1, suffix.size() - 1))
                serviceFile = installDir+"/bin/service/_service.cmd"
                updateJavaOpts(serviceFile, ';', javaLibraryPathCmd + suffix.substring(1, suffix.size() - 1))
            }

            if (!doUpgrade) {
                // Update set_env file
                updateJavaOpts(javaOptsFile, ' ', javaLibraryPathCmd + suffix)
                replaceJavaOpts(javaOptsFile, /(-XX:MaxPermSize=)(.*?)\ /, '');
            }
        }
        catch (RuntimeException e) {
        }
    }

    private updateJavaOpts(javaOptsFile, separator, dswitch) {
        def javaLibPath = "-Djava.library.path"

        def setenv = new File(javaOptsFile)
        if (!setenv.getText("UTF-8").contains(javaLibPath)) {
            def replaced = setenv.getText("UTF-8").replaceAll(/(JAVA_OPTS=)(.*)/, {
                if (installer.isWindows) {
                    return it[0] + separator + dswitch
                }
                else {
                    return it[0].substring(0, it[0].size() - 1) + separator + dswitch + "\""
                }
            })
            setenv.withWriter("UTF-8") { out ->
                out.write(replaced);
            }
        }
    }

    private replaceJavaOpts(javaOptsFile, regex, replacement) {
        def setenv = new File(javaOptsFile)
        def replaced = setenv.getText("UTF-8").replaceAll(regex, replacement)
        setenv.withWriter("UTF-8") { out ->
            out.write(replaced);
        }
    }

    private boolean isOracle12(String url, String username, String password, String driver) {
        boolean result = false;
        Sql sql = Sql.newInstance(url, username, password, driver);
        GroovyRowResult sqlRow = sql.firstRow('SELECT * FROM PRODUCT_COMPONENT_VERSION WHERE PRODUCT LIKE \'%Oracle%\'');
        String version = sqlRow.getProperty('VERSION');
        if (version.startsWith('12')) {
            result = true;
        }
        return result;
    }

    private int getDB2zOSVersion(String url, String username, String password, String driver) {
        int result = -1;
        Sql sql = Sql.newInstance(url, username, password, driver);
        GroovyRowResult sqlRow = sql.firstRow("SELECT GETVARIABLE('SYSIBM.VERSION') FROM SYSIBM.SYSDUMMY1")
        if (!sqlRow.isEmpty()) {
            String version = (String)sqlRow.getAt(0)
            // We grab the DB product info, parse out the version number and check to ensure it is less than
            // supported DB2 version of 11. The first 3 chars are the product ID, next 2 numbers are DB version,
            // last 3 are revision number.
            version = version.substring(3, 5)
            result = Integer.parseInt(version)
        }
        return result;
    }

    boolean isHAInstall() {
        return isHAInstall
    }

    String getAppStorageDir() {
        return appStorageDir
    }

    private generateSchemaFileForDB2OnZOS(sourceDir, databaseName, schemaName, schemaDirName, ddlName) {
        println('Generating DB2 zOS ' + schemaName + ' Database Schema ...')

        File sourceDb2File = new File(sourceDir + '/database/' + schemaDirName + '/' + DBTYPE_DB2_ON_LUW + '/' + ddlName + '.ddl')
        File destDb2ZosFile = new File(sourceDir + '/database/' + schemaDirName + '/' + DBTYPE_DB2_ON_ZOS + '/' + ddlName + '.ddl')

        // Ensure the directory exists
        IO.mkdirs(destDb2ZosFile.getParentFile())
        // Make sure we delete any prior file
        destDb2ZosFile.delete()

        BufferedWriter db2ZosBufferedWriter = IO.openOutputText(destDb2ZosFile)

        db2ZosBufferedWriter.write("SET CURRENT RULES = 'STD';")
        db2ZosBufferedWriter.newLine()

        BufferedReader db2BufferedReader = IO.openInputText(sourceDb2File)

        boolean foundCreateTable = false;
        String currentStatement = null
        while ((currentStatement = db2BufferedReader.readLine()) != null) {
            if (databaseName != null && !currentStatement.trim().startsWith("--")) {
                // If it contains create, the first paren, and no commas to see if it is
                // a new CREATE statement
                if (currentStatement.toUpperCase().startsWith("CREATE ") &&
                        currentStatement.indexOf("(") != -1 &&
                        currentStatement.indexOf(",") == -1) {
                    // See if it has ' TABLE ' in the statement to make sure it is not a create index
                    foundCreateTable = (currentStatement.toUpperCase().indexOf(" TABLE ") != -1)
                }

                // Only try to replace if we have found the create table statement in a line prior to this one
                if (foundCreateTable) {
                    // We have to add 'IN DATABASE x' at the end of the create tables statements
                    // So use regex: ) ;      replaced with:    ) in database x;
                    String compareStatement = currentStatement.replaceFirst("\\)\\s*;\\s*\$", ") in database " + databaseName + ";")

                    // If the statement doesnt equal the same, we must have replaced the create table statement.
                    if (!compareStatement.equalsIgnoreCase(currentStatement)) {
                        foundCreateTable = false
                        // Set it to the new IN DATABASE version
                        currentStatement = compareStatement
                    }
                }
            }
            db2ZosBufferedWriter.write(currentStatement)
            db2ZosBufferedWriter.newLine()
        }

        db2ZosBufferedWriter.close()
        db2BufferedReader.close()
    }

    private String generateForeignKeysSchema(sourceDir, schemaName, schemaDirName, ddlName, inDbType) {
        String foreignKeysDdl = sourceDir + '/database/' + schemaDirName + '/' + ddlName + '.ddl'

        if (DBTYPE_DB2_ON_ZOS.equalsIgnoreCase(inDbType)) {
            println('Generating DB2 on zOS '+schemaName+' Foreign Keys ...')

            // Update the keys from db2 to the db2zos
            String db2ZosKeysDdl = srcDir + '/database/' + schemaDirName + '/' + DBTYPE_DB2_ON_ZOS + '/' + ddlName + '.ddl'

            File sourceDb2File = new File(foreignKeysDdl)
            File destDb2ZosFile = new File(db2ZosKeysDdl)

            // Ensure the directory exists
            IO.mkdirs(destDb2ZosFile.getParentFile())
            // Make sure we delete any prior file
            destDb2ZosFile.delete()

            BufferedWriter db2ZosBufferedWriter = IO.openOutputText(destDb2ZosFile)

            db2ZosBufferedWriter.write("SET CURRENT RULES = 'STD';")
            db2ZosBufferedWriter.newLine()

            BufferedReader db2BufferedReader = IO.openInputText(sourceDb2File)

            // Just copy the entire file to disk after we prepend the SET CURRENT RULES
            IO.copy(db2BufferedReader, db2ZosBufferedWriter)

            db2ZosBufferedWriter.close()
            db2BufferedReader.close()

            foreignKeysDdl = db2ZosKeysDdl
        }

        return foreignKeysDdl
    }

    private void generateDb2ZosUpgradeScripts(sourceDir, schemaName, schemaDirName, databaseName) {
        // Create a filter for all .XML files
        FilenameFilter xmlSqlFilesFilter = new FilenameFilter() {
            public boolean accept(File dir, String name) {
                name = name.toLowerCase()
                return name.startsWith("upgrade_") && name.endsWith(".xml")
            }
        }

        File db2FileDirectory = new File(sourceDir + '/database/' + schemaName + "/" + schemaDirName)

        // Generate all the XML files
        for (String currentFile : db2FileDirectory.list(xmlSqlFilesFilter)) {
            generateSql(sourceDir, schemaName, schemaDirName, currentFile, databaseName)
        }
    }

    // This is only called when generating DB2 ZOS scripts
    private String generateSql(sourceDir, schemaName, schemaDirName, upfileName, databaseName) {
        String sqlUpgrade = sourceDir + '/database/' + schemaName + "/" + schemaDirName + '/' + upfileName
        String db2ZosSqlUpgrade = srcDir + '/database/' + schemaName + '/' + DBTYPE_DB2_ON_ZOS + '/' + upfileName
        String baseReorgTableRegex = "(\\s*)call\\s+sysproc\\.admin_cmd\\s*\\(\\s*\\'reorg\\s+table\\s+([a-zA-Z0-9_]+)\\s*\\'\\s*\\)";
        String createTableRegex = "(?s)(?i)(CREATE TABLE [^;]*)";
        String baseDropColumnPattern = "(?i)(\\s*)alter\\s+table\\s+([a-zA-Z0-9_]+)\\s+drop\\s+column\\s+([a-zA-Z0-9_]+)\\s*";
        final int PATTERN_FLAGS = Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE;

        println('Generating DB2 on zOS '+schemaName+' Upgrade Script ...')

        File sourceDb2File = new File(sqlUpgrade)
        File destDb2ZosFile = new File(db2ZosSqlUpgrade)

        IO.mkdirs(destDb2ZosFile.getParentFile())
        destDb2ZosFile.delete()

        def xml = new XmlSlurper().parse(sourceDb2File);
        xml.change.each { changeXml ->
            changeXml.sql.each { sqlXml ->
                def delim = sqlXml.@separator.text();
                def sqlText = sqlXml.text();
                Pattern reorgTablePattern = Pattern.compile(baseReorgTableRegex+delim, PATTERN_FLAGS);
                Pattern createTablePattern = Pattern.compile(createTableRegex+delim, PATTERN_FLAGS);
                Pattern dropColumnPattern = Pattern.compile(baseDropColumnPattern+delim, PATTERN_FLAGS);
                if (sqlXml.@file != "") {
                    //all file paths appear to be relative to the directory of the schema
                    String fileLoc = sqlXml.@file;
                    File sqlFile = new File(sourceDb2File.parentFile.parentFile, fileLoc);
                    int endSlashLoc = fileLoc.lastIndexOf("/");
                    String newFileLoc = sourceDir + '/database/' + schemaName + '/' + DBTYPE_DB2_ON_ZOS + '/' + fileLoc.substring(endSlashLoc+1);
                    File newFile = new File(newFileLoc);
                    String sqlFileText = sqlFile.text;
                    sqlFileText = sqlFileText.replaceAll(createTablePattern, "\$1 IN DATABASE ${databaseName}${delim}");
                    sqlFileText = sqlFileText.replaceAll(dropColumnPattern, "\$1alter table \$2 drop column \$3 restrict${delim}");
                    sqlFileText = writeReorgStatements(sqlFileText, databaseName, delim, reorgTablePattern);
                    newFile << sqlFileText;
                    sqlXml.@file = newFile.absolutePath;
                }
                else {
                    sqlText = sqlText.replaceAll(createTablePattern, "\$1 IN DATABASE ${databaseName}${delim}");
                    sqlText = sqlText.replaceAll(dropColumnPattern, "\$1alter table \$2 drop column \$3 restrict${delim}");
                    sqlText = writeReorgStatements(sqlText, databaseName, delim, reorgTablePattern);
                    sqlXml.replaceBody(sqlText);
                }
            }
        }
        //rewrite the library paths to be correct
        xml.library.each { libraryXml ->
            def libFileLoc = libraryXml.@file.text();
            libraryXml.@file = libFileLoc.replaceAll("db2", "db2zos");
        }
        destDb2ZosFile << XmlUtil.serialize(xml);

        return db2ZosSqlUpgrade;
    }

    private String writeReorgStatements(String input, String databaseName, String delim, Pattern pattern) {
        Matcher matcher = pattern.matcher(input);
        StringBuffer result = new StringBuffer();
        while (matcher.find()) {
            String leadingWhiteSpace = matcher.group(1);
            String tablename = matcher.group(2).toUpperCase();
            matcher.appendReplacement(result, "${leadingWhiteSpace}call ucd_reorg_ts('${databaseName.toUpperCase()}', '${tablename}')${delim}");
        }
        matcher.appendTail(result);
        return result.toString();
    }

    private void generateReorgTableSpaceSP(driver, url, user, pass, classPath) {
        String delimiter = "#";
        try {
            println('Attempting to drop Reorg Tablespace Stored Procedure ...')
            ant.sql(
                    driver:    driver,
                    url:       url,
                    userid:    user,
                    password:  pass,
                    classpath: classPath,
                    delimiter: delimiter,
                    src:       generateReorgTablespaceSPFile(/*dropProcedure*/ true, delimiter)
            )
        } catch (Exception exception) {
            // If the message contains the error code and state of the stored procedure not existing
            // Then we just want to swallow the exception, if it doesnt contain it, then throw
            // the exception because its one that we wernt expecting.
            String exMessage= exception.getMessage();
            if (exMessage == null ||
                (!exMessage.contains("SQLCODE=-551") && !exMessage.contains("SQLSTATE=42501"))) {
                throw exception
            }

            println('Reorg Tablespace Stored Procedure does not exist ...')
        }

        println('Creating Reorg Tablespace Stored Procedure ...')
        ant.sql(
                driver:    driver,
                url:       url,
                userid:    user,
                password:  pass,
                classpath: classPath,
                delimiter: delimiter,
                src:       generateReorgTablespaceSPFile(/*dropProcedure*/ false, delimiter)
        )
    }

    private String generateReorgTablespaceSPFile(boolean dropProcedure, String delimiter) {

        File spFile = File.createTempFile("install-SP-", ".tmp")
        BufferedWriter db2ZosBufferedWriter = IO.openOutputText(spFile)

        db2ZosBufferedWriter.write("SET CURRENT RULES = 'STD';\n")
        db2ZosBufferedWriter.write(delimiter + "\n") // End of first statement execution

        if (dropProcedure) {
            db2ZosBufferedWriter.write("DROP PROCEDURE ucd_reorg_ts;\n")
            db2ZosBufferedWriter.write(delimiter + "\n") // End of second statement execution
        } else {
            db2ZosBufferedWriter.write("CREATE PROCEDURE ucd_reorg_ts(IN databasename VARCHAR(16), IN tablename VARCHAR(30))\n");
            db2ZosBufferedWriter.write("LANGUAGE SQL\n");
            db2ZosBufferedWriter.write("BEGIN\n");
            // Declare all the SP member variables
            db2ZosBufferedWriter.write("DECLARE copyTemplate VARCHAR(150) DEFAULT 'TEMPLATE TCCCOPY DSN &DB..&TS..P&PART..D&JDAY.&HOUR.&MINUTE..&LOCREM.&PRIBAC..COPY1';\n");
            db2ZosBufferedWriter.write("DECLARE sortTemplate VARCHAR(150) DEFAULT 'TEMPLATE TSORTOUT DSN &DB..&TS..P&PART..D&JDAY.&HOUR.&MINUTE..SORTOUT ';\n");
            db2ZosBufferedWriter.write("DECLARE sysOutTemplate VARCHAR(150) DEFAULT 'TEMPLATE TSYSUT1 DSN &DB..&TS..P&PART..D&JDAY.&HOUR.&MINUTE..SYSUT1 ';\n");
            db2ZosBufferedWriter.write("DECLARE sysErrTemplate VARCHAR(150) DEFAULT 'TEMPLATE TSYSERR DSN &DB..&TS..P&PART..D&JDAY.&HOUR.&MINUTE..SYSERR ';\n");
            db2ZosBufferedWriter.write("\n");
            db2ZosBufferedWriter.write("DECLARE retcode INTEGER DEFAULT 0;\n");
            db2ZosBufferedWriter.write("\n");
            db2ZosBufferedWriter.write("DECLARE tablespace_name VARCHAR(24);\n");

            // Find the tablespace name for the database & table name combination
            db2ZosBufferedWriter.write("SELECT TSNAME INTO tablespace_name FROM SYSIBM.SYSTABLES WHERE DBNAME = " +
                "databasename AND NAME = tablename;\n");
            db2ZosBufferedWriter.write("\n");

            // We are calling a utility to run another utility.
            // - The first part ['UCDR' || tablespace_name] is the name of the job that
            //   will run the command [reorg tablespace].
            // - We use a template [copyTemplate] above that tells DB2 zOS how to copy the
            //   data (one partition at a time).
            db2ZosBufferedWriter.write("CALL SYSPROC.DSNUTILU ('UCDRT' || tablespace_name, 'NO', copyTemplate || " +
                "' REORG TABLESPACE ' || databasename || '.' || tablespace_name || ' LOG NO COPYDDN(TCCCOPY)" +
                " SHRLEVEL REFERENCE SORTDATA YES AUX YES NOSYSREC SORTKEYS FORCE NONE', retcode);\n");
            db2ZosBufferedWriter.write("\n");

            // We need to call CHECK INDEX prior to CHECK DATA as required by the documentation
            db2ZosBufferedWriter.write(
                "CALL SYSPROC.DSNUTILU ('UCDCI' || tablespace_name, 'NO', " +
                    "' CHECK INDEX ALL TABLESPACE ' || databasename || '.' || tablespace_name || " +
                    "' SHRLEVEL REFERENCE', retcode);\n");

            // This will call CHECK DATA which is sometimes needed for when we add indexes. It
            // performs a literal check on the data to ensure it is valid for what the new table
            // restrictions are.
            // - We specify INCLUDE XML TABLESPACES ALL to include XML/CLOB columns
            // - We include SCOPE PENDING to only do this on tablespaces that require it
            db2ZosBufferedWriter.write("CALL SYSPROC.DSNUTILU ('UCDCD' || tablespace_name, 'NO', " +
                "sortTemplate || sysOutTemplate || sysErrTemplate || ' CHECK DATA " +
                "TABLESPACE ' || databasename || '.' || tablespace_name || ' ERRDDN(TSYSERR) WORKDDN(TSYSUT1, TSORTOUT) " +
                "INCLUDE XML TABLESPACES ALL SCOPE PENDING', retcode);\n");
            db2ZosBufferedWriter.write("\n");

            db2ZosBufferedWriter.write("END\n");
            db2ZosBufferedWriter.write(delimiter + "\n");  // End of second statement execution
        }
        db2ZosBufferedWriter.close();

        return spFile.getCanonicalPath();
    }

    private void updateKeystorePassToReference() {
        def newWrite = false
        def serverXmlFile = new File(installDir + "/opt/tomcat/conf/server.xml")

        DocumentBuilderFactory docBuilderFactory = DocumentBuilderFactory.newInstance()
        DocumentBuilder builder = docBuilderFactory.newDocumentBuilder()
        Document doc = builder.parse(serverXmlFile)
        Element docEl = doc.getDocumentElement()

        NodeList connectorNodes = docEl.getElementsByTagName("Connector")
        def tomcatKeystorePassword = null;
        connectorNodes.each {
            if (it.hasAttribute("keystorePass")) {
                tomcatKeystorePassword = it.getAttribute("keystorePass");
                it.removeAttribute("keystorePass");
                it.setAttribute("keystorePass", '${tomcat.keystore.password}');
                newWrite = true
            }
        }

        if (newWrite) {
            writeDocToFile(serverXmlFile, doc)
        }

        def hibernatePassword = null;
        def encryptionPassword = null;
        def serverKeystorePassword = null;
        def serverKeyPassword = null;
        File installedPropertiesFile = new File(installDir + "/conf/server/installed.properties");
        File tempFile = new File(installedPropertiesFile.getParentFile(), 'tempFile' + UUID.randomUUID());
        installedPropertiesFile.withInputStream { input ->
            tempFile.withOutputStream { output ->
                Properties installedProperties = new Properties()
                installedProperties.load(input)
                hibernatePassword = installedProperties.remove('hibernate.connection.password')
                encryptionPassword = installedProperties.remove('encryption.keystore.password')
                serverKeystorePassword = installedProperties.remove('server.keystore.password')
                serverKeyPassword = installedProperties.remove('server.key.password')
                installedProperties.store(output, null)
            }
        }
        installedPropertiesFile.delete();
        tempFile.renameTo(installedPropertiesFile);

        File securedInstalledPropertiesFile = new File(installDir + "/conf/server/secured-installed.properties")
        securedInstalledPropertiesFile.createNewFile()
        File tempSecuredFile = new File(securedInstalledPropertiesFile.getParentFile(), 'tempFile' + UUID.randomUUID());

        securedInstalledPropertiesFile.withInputStream { input ->
            tempSecuredFile.withOutputStream { output ->
                Properties securedProperties = new Properties()
                securedProperties.load(input)
                if (serverKeystorePassword != null) {
                    securedProperties.put('server.keystore.password', serverKeystorePassword)
                }
                else {
                    securedProperties.put('server.keystore.password', "changeit")
                }
                if (serverKeyPassword != null) {
                    securedProperties.put('server.key.password', serverKeyPassword)
                }
                else {
                    securedProperties.put('server.key.password', "changeit")
                }
                if (tomcatKeystorePassword != null) {
                    securedProperties.put('tomcat.keystore.password', tomcatKeystorePassword)
                }
                else {
                    securedProperties.put('tomcat.keystore.password', "changeit")
                }
                if (hibernatePassword != null) {
                    securedProperties.put('hibernate.connection.password', hibernatePassword)
                }
                else {
                    securedProperties.put('hibernate.connection.password', "changeit")
                }
                if (encryptionPassword != null) {
                    // Server was never started...
                    securedProperties.put('encryption.keystore.password', encryptionPassword)
                }
                else {
                    securedProperties.put('encryption.keystore.password', "changeit")
                }
                securedProperties.store(output, null);
            }
        }

        if (!tempSecuredFile.renameTo(securedInstalledPropertiesFile)) {
            securedInstalledPropertiesFile.delete()
            tempSecuredFile.renameTo(securedInstalledPropertiesFile)
        }
    }

    private void disableSSLv3() {
        //------------------------------------------------------------------------------
        // Inject sslEnabledProtocols attribute into server.xml if it doesn't exist
        // Remove sslProtocol attribute from server.xml if it does exist
        //------------------------------------------------------------------------------

        def serverXmlFile = new File(installDir + "/opt/tomcat/conf/server.xml")

        def newWrite = false

        DocumentBuilderFactory docBuilderFactory = DocumentBuilderFactory.newInstance()
        DocumentBuilder builder = docBuilderFactory.newDocumentBuilder()
        Document doc = builder.parse(serverXmlFile)
        Element docEl = doc.getDocumentElement()

        NodeList connectorNodes = docEl.getElementsByTagName("Connector")
        connectorNodes.each {
            if (it.hasAttribute("SSLEnabled")) {
                if (it.hasAttribute("sslProtocol")) {
                    it.removeAttribute("sslProtocol")
                }

                it.setAttribute("sslEnabledProtocols", '${install.server.ssl.enabledProtocols}')
                it.setAttribute("ciphers", '${install.server.ssl.enabledCiphers}')
                newWrite = true
            }
        }

        if (newWrite) {
            writeDocToFile(serverXmlFile, doc)
        }

        // Remove ciphers from properties file. Cipher list will be implicitly loaded during startup now.
        File installedPropertiesFile = new File(installDir + "/conf/server/installed.properties");
        File tempFile = new File(installedPropertiesFile.getParentFile(), 'tempFile' + UUID.randomUUID());

        installedPropertiesFile.withInputStream { input ->
            tempFile.withOutputStream { output ->
                Properties installedProperties = new Properties();
                installedProperties.load(input);
                installedProperties.remove('server.ssl.enabledCiphers');
                installedProperties.store(output, null);
            }
        }
        installedPropertiesFile.delete();
        tempFile.renameTo(installedPropertiesFile);
    }

    private void writeDocToFile(file, doc) {
        TransformerFactory transformerFactory = TransformerFactory.newInstance()
        Transformer transformer = transformerFactory.newTransformer()
        transformer.setOutputProperty(OutputKeys.INDENT, "yes")
        transformer.setOutputProperty("{http://xml.apache.org/xslt}indent-amount", "4");
        transformer.setOutputProperty(OutputKeys.ENCODING, "UTF-8");
        transformer.setOutputProperty(OutputKeys.STANDALONE, "no");
        // preserve doctype
        DocumentType documentType = doc.getDoctype();
        if (documentType != null) {
            transformer.setOutputProperty(OutputKeys.DOCTYPE_SYSTEM, documentType.getSystemId());
            transformer.setOutputProperty(OutputKeys.DOCTYPE_PUBLIC, documentType.getPublicId());
        }
        StringWriter sw = new StringWriter()
        StreamResult result = new StreamResult(sw)
        DOMSource source = new DOMSource(doc)
        transformer.transform(source,result)
        String xmlString = sw.toString()

        // Delete the file.
        file.delete()
        // Write out our modified DOM to the file with Logger elements stripped.
        file.createNewFile()
        OutputStream outputStream = new FileOutputStream(file,false)
        try {
            outputStream.write( xmlString.getBytes() )
        } finally {
            if (outputStream != null) { outputStream.close() }
        }
    }

    private void removeExperimentalProperties() {
        def installedPropertiesFilePath = installDir + "/conf/server/installed.properties"
        def tempInstalledPropertiesFilePath = installDir + "/conf/server/temp-installed.properties"

        File tempFile = new File(tempInstalledPropertiesFilePath)
        File installPropsFile = new File(installedPropertiesFilePath)

        SortedProperties props = new SortedProperties();
        FileInputStream inStream = new FileInputStream(installPropsFile);
        try {
            props.load(inStream);
        }
        finally {
            inStream.close();
        }

        props.remove("experimental.comm2017.enabled")
        props.remove("experimental.comm2017.server.agentcomm.port")
        props.remove("experimental.comm2017.server.agentcomm.host")
        props.remove("experimental.comm2017.server.keystore2017")

        FileOutputStream outStream = new FileOutputStream(tempFile);
        try {
            props.store(outStream);
        }
        finally {
            outStream.close();
        }
        installPropsFile.delete();
        tempFile.renameTo(installPropsFile);

        def securedInstalledPropertiesFilePath = installDir + "/conf/server/secured-installed.properties"
        def tempSecuredInstalledPropertiesFilePath = installDir + "/conf/server/temp-secured-installed.properties"

        File tempSecuredFile = new File(tempSecuredInstalledPropertiesFilePath)
        File securedInstallPropsFile = new File(securedInstalledPropertiesFilePath)

        SortedProperties securedProps = new SortedProperties();
        FileInputStream securedInStream = new FileInputStream(securedInstallPropsFile);
        try {
            securedProps.load(securedInStream);
        }
        finally {
            securedInStream.close();
        }

        securedProps.remove("experimental.comm2017.server.keystore2017.password")

        FileOutputStream securedOutStream = new FileOutputStream(tempSecuredFile);
        try {
            securedProps.store(securedOutStream);
        }
        finally {
            securedOutStream.close();
        }
        securedInstallPropsFile.delete();
        tempSecuredFile.renameTo(securedInstallPropsFile);
    }
}

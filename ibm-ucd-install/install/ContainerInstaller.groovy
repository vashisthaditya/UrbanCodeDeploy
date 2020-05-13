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
/*
 This script requires the Groovy scripting language.  You can find Groovy at
 http://groovy.codehaus.org/.  Download Groovy at http://dist.codehaus.org/groovy/distributions/.
 To install it, follow the instructions at http://groovy.codehaus.org/install.html.
 Automatic import packages & classes:
 java.io/lang/net/util
 java.math.BigDecimal/BigInteger
 groovy.lang/util
 */

import java.lang.reflect.Constructor
import java.security.KeyPair
import java.security.KeyStore
import java.security.PrivateKey
import java.security.Provider
import java.security.PublicKey
import java.security.Security
import java.security.cert.Certificate
import java.util.regex.*

import javax.xml.parsers.DocumentBuilder
import javax.xml.parsers.DocumentBuilderFactory
import javax.xml.transform.OutputKeys
import javax.xml.transform.Transformer
import javax.xml.transform.TransformerFactory
import javax.xml.transform.dom.DOMSource
import javax.xml.transform.stream.StreamResult

import org.apache.commons.lang.StringEscapeUtils
import org.apache.commons.lang.StringUtils
import org.apache.tools.ant.taskdefs.condition.Os
import org.w3c.dom.Document
import org.w3c.dom.Element
import org.w3c.dom.Node
import org.w3c.dom.NodeList

import com.urbancode.air.keytool.Extension
import com.urbancode.air.keytool.KeytoolHelper
import com.urbancode.commons.util.ssl.SSLContextProtocolDetector
import com.urbancode.commons.validation.ValidationException
import com.urbancode.commons.validation.ValidationRules
import com.urbancode.commons.validation.format.JreHomeValidationRule
import com.urbancode.commons.validation.format.RequiredValueValidationRule
import com.urbancode.commons.validation.format.SocketPortValidationRule
import com.urbancode.commons.validation.format.WebUriValidationRule
import com.urbancode.commons.validation.format.YesNoValidationRule
import com.urbancode.commons.validation.rules.NumericValueRule
import com.urbancode.installer.HACapableInstaller

public class ContainerInstaller {
    boolean isUnix = Os.isFamily("unix")
    boolean isWindows = Os.isFamily("windows")

    def systemIn = System.in.newReader()

    def NL = System.getProperty('line.separator')

    def nonInteractive = false

    def ant = null

    def componentName = null
    def componentDirectoryName = null
    def versionName = null

    def srcDir = null
    def unpackDir = null
    def javaHome = null
    def installedJavaHome = null
    def javaSystemProperties = null

    def doUpgrade = false
    def useExistingStorage = false
    def incompleteInstallTmpFile = null
    def firstNode = true

    def installOs = null
    def installArch = null

    def installAsService = null
    def installServiceName = null
    def installServiceLogin = null
    def installServicePassword = null
    def installServiceAutostart = null
    def installServiceStatus = null
    def doServiceInstall = null

    def installServerDir = null
    def appStorageDir = null
    def installServerWebIp = "0.0.0.0"
    def installServerWebAlwaysSecure = null
    def installServerWebHttpsPort = null
    def installServerWebPort = null
    def installServerWebHost = null
    def serverKeystorePath = null
    def useExistingAppdataDir = 'Y'
    def createAppdataDir = 'Y'

    def portValidator = null
    def yesNoValidator = null
    def jreHomeValidator = null
    def optionalValidator = null
    def requiredValidator = null
    def numberValidator = null
    def webUriValidator = null
    def expectsInstallation = false
    def isHACapable = false
    def isHAInstall = false
    def doHA = 'N'

    def installedPropertiesFilePath = null

    def val = null // for groovy bug work-around

    def classpath = null
    def subInstallerArray = []

    def isFIPS = false;
    def final useFips = " -Dcom.ibm.jsse2.usefipsprovider=true";

    ContainerInstaller(classpath) {
        configureFIPS();
        def requiredValidationRule = new RequiredValueValidationRule()

        optionalValidator = new ValidationRules()

        requiredValidator = new ValidationRules()
        requiredValidator.addRule(requiredValidationRule)

        portValidator = new ValidationRules()
        portValidator.addRule(requiredValidationRule)
        portValidator.addRule(new SocketPortValidationRule())

        yesNoValidator = new ValidationRules()
        yesNoValidator.addRule(requiredValidationRule)
        yesNoValidator.addRule(new YesNoValidationRule())

        jreHomeValidator = new ValidationRules()
        jreHomeValidator.addRule(requiredValidationRule)
        jreHomeValidator.addRule(new JreHomeValidationRule());

        def numericValidationRule = new NumericValueRule()
        numericValidationRule.setLowerBound(1)
        numericValidationRule.setUpperBound(Integer.MAX_VALUE)
        numberValidator = new ValidationRules()
        numberValidator.addRule(requiredValidationRule)
        numberValidator.addRule(numericValidationRule)

        webUriValidator = new ValidationRules()
        webUriValidator.addRule(requiredValidationRule)
        webUriValidator.addRule(new WebUriValidationRule())

        this.classpath = classpath
    }

    public String getAntProperty(String name) {
        return ant.project.properties[name]?.trim()
    }

    void setAntBuilder(antBuilder) {
        ant = new AntBuilder(antBuilder.project)
        // have to do this, otherwise properties don't work right
        antBuilder.project.copyInheritedProperties(ant.project)
        antBuilder.project.copyUserProperties(ant.project)

        installServerDir = getAntProperty('install.server.dir')
        if (installServerDir != null) {
            installServerDir = new File(installServerDir).getAbsolutePath()
        }
        initProperties()
    }

    void initProperties() {
        componentName = getAntProperty('component.name')
        componentDirectoryName = getAntProperty('component.directory')
        versionName = getAntProperty('version')

        srcDir = getAntProperty('src.dir')
        appStorageDir = getAntProperty('server.appdata.dir')
        // Check for relative path used by default and get absolute
        if (appStorageDir?.startsWith("..")) {
            appStorageDir = installServerDir + appStorageDir.substring(2)
        }

        javaHome = getAntProperty('install.java.home')
        installedJavaHome = javaHome

        if (getAntProperty('install.server.web.ip') != null) {
            installServerWebIp = getAntProperty('install.server.web.ip')
        }
        installServerWebAlwaysSecure = getAntProperty('install.server.web.always.secure')
        installServerWebHttpsPort = getAntProperty('install.server.web.https.port')
        installServerWebPort = getAntProperty('install.server.web.port')
        installServerWebHost = getAntProperty('install.server.web.host')

        installAsService = getAntProperty('install.service')
        installServiceName = getAntProperty('install.service.name')
        installServiceLogin = getAntProperty('install.service.login')
        installServicePassword = getAntProperty('install.service.password')
        installServiceAutostart = getAntProperty('install.service.autostart')

        doHA = getAntProperty('install.ha')
        useExistingAppdataDir = getAntProperty('server.use.existing.appdata.dir')
        createAppdataDir = getAntProperty('server.create.appdata.dir')

        if (javaHome == null) {
            javaHome = getAntProperty('java.home')
        }
        if (javaHome == null) {
            javaHome= getAntProperty('env.JAVA_HOME')
        }
        if (!(new File(javaHome + '/lib/tools.jar'.replace((char)'/', File.separatorChar)).exists())) {
            if (new File(javaHome + '/../lib/tools.jar'.replace((char)'/', File.separatorChar)).exists()) {
                javaHome = new File(javaHome).getParent()
            }
        }
    }

    void setDoUpgrade(mode) {
        this.doUpgrade = mode
    }

    void setNonInteractive(mode) {
        this.nonInteractive = mode
    }

    void unpack(src, dst) {
        ant.unzip(src: src, dest: dst)
    }

    void init() {
        if (ant == null) {
            ant = new AntBuilder()
        }

        def confZip = srcDir + "/conf.zip"
        unpackDir = File.createTempFile("install-", ".tmp")
        unpackDir.delete()
        unpackDir.mkdirs()
        unpackDir = unpackDir.getCanonicalPath()
        unpack(confZip, unpackDir)

        // get a list of all classes in the install directory and call init methods on each one if available
        new File(srcDir, 'install').canonicalFile.listFiles().each { file ->
            if (!file.name.startsWith(this.class.name) && file.isFile()) {
                println "Found sub-installer ${file.name}"
                def clazz = this.class.forName(file.name.replace(".groovy", ""))
                def constructor = clazz.getConstructor([this.class] as Class[])
                def classInstance = constructor.newInstance(this)
                subInstallerArray << classInstance
            }
        }
        isHACapable = subInstallerArray.any { it instanceof HACapableInstaller }
        subInstallerArray.each { callSubInstallerMethod(it, 'init', [] as Object[])}
    }

    void install() {
        init()

        try {
            this.installServer()
            prompt('Installer Complete. (press return to exit installer)') // wait for user input
        }
        catch (Exception e) {
            e.printStackTrace()
            prompt('Install Failed. (press return to exit installer)') // wait for user input
            throw e;
        }
        finally {
            ant.delete(dir: unpackDir)
            def timestamp = new Date().format('yyyyMMdd-HHmmss')
            def logFile = new File(srcDir + "/install.log")
            if (logFile.exists()) {
                ant.copy(
                    file: logFile.getAbsolutePath(),
                    tofile: installServerDir + "/var/install-log/install-" + timestamp + ".log")
            }
        }
    }

    void migrateDatabase() {
        init()

        try {
            // set the mode to expect an existing installation
            expectsInstallation = false

            installServerDir = getInstallDir(installServerDir)

            // read old properties
            if (new File(installServerDir + "/conf/server/installed.properties").exists()) {
                ant.property(file: installServerDir + "/conf/server/installed.properties")
                ant.property(file: installServerDir + "/conf/server/secured-installed.properties")
                initProperties()
            }

            doUpgrade = true
            println("Migrating " + componentName + " at: " + installServerDir + "\n")

            // run sub-installer getInput method
            subInstallerArray.each {callSubInstallerMethod(it, 'migrateDatabase', [] as Object[])}

            prompt('Database Migration Complete. (press return to exit installer)') // wait for user input
        }
        catch (Exception e) {
            e.printStackTrace()
            prompt('Database Migration Failed. (press return to exit installer)') // wait for user input
            throw e;
        }
        finally {
            ant.delete(dir: unpackDir)
        }
    }

    void installServer() {
        // set the mode to expect an existing installation
        expectsInstallation = false

        if (nonInteractive) {
            println("\nInstalling " + componentName + " version " + versionName + " (non-interactive)\n")
        }
        else {
            println("\nInstalling " + componentName + " version " + versionName + "\n")
        }

        installServerDir = getInstallDir(installServerDir)

        doUpgrade = checkForUpgrade(installServerDir)

        println("\nInstalling " + componentName + " to: " + installServerDir + "\n")

        if (doUpgrade) {
            // read old properties
            if (new File(installServerDir + "/conf/server/installed.properties").exists()) {
                ant.property(file: installServerDir + "/conf/server/installed.properties")
                ant.property(file: installServerDir + "/conf/server/secured-installed.properties")
                initProperties()
            }

            //stopping service if running
            if (installServiceName != null && (Os.isFamily('windows'))) {
                println('\nYour ' + componentName + ' is installed as "' + installServiceName + '" service.\n\n')
                ant.exec(dir: './bin/server/service', executable: 'cscript.exe') {
                    arg(value:'//I')
                    arg(value:'//Nologo')
                    arg(value:'srvc_stop.vbs')
                    arg(value:installServiceName)
                }
            }
        }

        // make sure we have the JAVA_HOME
        final def jreDir = new File(srcDir + File.separator + 'java')
        if (jreDir.exists()) {
            javaHome = installServerDir + File.separator + 'java'
            javaHome = new File(javaHome).absolutePath
        }
        else {
            if (!installedJavaHome || !javaHome) {
                javaHome = prompt(
                        null,
                        "Please enter the home directory of the JRE/JDK used to run the server. [Default: " +
                        javaHome + "]",
                        javaHome,
                        jreHomeValidator)
            }
            javaHome = new File(javaHome).absolutePath

            //
            // JVM version check: style 1, use the output of "java -version"
            //
            if (getAntProperty('skip.jvm.version.check') == null) {
                def cmdResult = null
                String javaCmd = new File(javaHome+File.separator+"bin", "java").getAbsolutePath()
                try {
                    def getVerCommand = [javaCmd, "-version"]
                    cmdResult = runCommand(getVerCommand)
                }
                catch (java.io.IOException e) {
                    // could not create process?
                    //throw e
                    throw new Exception("Could not create a java process using "+javaCmd, e)
                }

                if ((int)cmdResult["exit"] != 0) {
                    throw new Exception("A problem was encountered detecting the version of "+javaCmd)
                }

                // "\s" is regex for any whitespace character
                def verPtrn = Pattern.compile('(?i)(?:java|jdk)\\s*version\\s*"(.*)"')
                def matcher = verPtrn.matcher(cmdResult["err"])
                if (!matcher.find()) {
                    matcher.reset(cmdResult["out"])
                    if (!matcher.find()) {
                        // could not find version in output
                        // throw exception?
                    }
                }

                String ver = matcher.group(1)
                println("JVM Version detected: "+ver)
                String minimumVer = "1.6.0"

                def verArray = ver.split("\\D") // split on non-digits
                def minVerArray = minimumVer.split("\\D") // split on non-digits
                if (! versionMeetsOrExceeds(verArray, minVerArray)) {
                    throw new Exception("Version $ver does not meet required minimum $minimumVer")
                }
            }
            else {
                println("skipping jvm version check of $javaHome")
            }
        }

        println("JAVA_HOME: " + javaHome + "\n")

        def defaultHost = null
        try  {
            defaultHost = InetAddress.localHost.canonicalHostName
        }
        catch (UnknownHostException e) {
            println "Unknown host name for machine. Defaulting to localhost"
            defaultHost = "localhost"
        }

        if (!appStorageDir) {
            appStorageDir = installServerDir
            if (!doUpgrade && isHACapable) {
                appStorageDir += '/appdata'
            }
        }

        if (!doUpgrade && isHACapable) {
            def installHA = prompt(
                    doHA,
                    "Will this server be used as a node in a high availability cluster? y,N [Default: N]",
                    "N",
                    yesNoValidator)
            isHAInstall = 'Y'.equalsIgnoreCase(installHA) || "YES".equalsIgnoreCase(installHA)

            def storageDirMsg = "Where should the server store application data such as logs, plugins, and keystores? "
            if (isHAInstall) {
                storageDirMsg += storageDirMsg + "For every node in the HA cluster, this location must be the same, " +
                        "must be accessible, and must have the proper permissions. "
            }
            appStorageDir = prompt(
                    null,
                    storageDirMsg + "[Default: $installServerDir/appdata]",
                    appStorageDir,
                    requiredValidator)

            File appStorageDirFile = new File(appStorageDir)
            File[] appStorageDirFileList = appStorageDirFile.listFiles()
            incompleteInstallTmpFile = new File(appStorageDirFile, 'incomplete.tmp')
            if (!appStorageDirFile.exists()) {
                def createStorage = prompt(
                        createAppdataDir,
                        "The specified directory for application data ($appStorageDir) doesn't " +
                        "exist. Do you want to create it? Y,n [Default Y]",
                        'Y',
                        yesNoValidator)
                def createStorageDir = 'Y'.equalsIgnoreCase(createStorage) || "YES".equalsIgnoreCase(createStorage)
                if (!createStorageDir) {
                    println 'Installation aborted.'
                    System.exit(1)
                }
                appStorageDirFile.mkdirs()
                incompleteInstallTmpFile.createNewFile()
            }
            else if (appStorageDirFileList == null) {
                // The provided directory is a file.  Bail out.
                println 'Installation aborted. The provided application data location either exists and is not a ' +
                        'directory or the current user does not have read permission to that directory.'
                System.exit(1)
            }
            else if (appStorageDirFileList.length > 0 && !incompleteInstallTmpFile.exists()) {
                def useExisting = prompt(
                        useExistingAppdataDir,
                        "The specified directory for application data ($appStorageDir) already " +
                        "exists and is non-empty. Do you want to use the existing data? Y,n [Default Y]",
                        'Y',
                        yesNoValidator)
                useExistingStorage = 'Y'.equalsIgnoreCase(useExisting) || "YES".equalsIgnoreCase(useExisting)
                if (!useExistingStorage) {
                    println 'Installation aborted to protect existing data. Please delete or empty the directory if ' +
                            'you wish to use it as the application data directory for a new node.'
                    System.exit(1)
                }
                firstNode = false
            }
        }

        def hostNameMsg = "What host name will users access the Web UI at? "
        if (isHAInstall) {
            hostNameMsg += "(For high availability servers, specify the host name of the load balancer, not the " +
                    "computer that hosts the server.) "
        }
        installServerWebHost = prompt(
                installServerWebHost,
                hostNameMsg + "[Default: ${defaultHost}]",
                defaultHost,
                requiredValidator)
        installServerWebAlwaysSecure = prompt(
                installServerWebAlwaysSecure,
                "Do you want the Web UI to always use secure connections using SSL? Y,n [Default: Y]",
                "Y",
                yesNoValidator)
        String httpPortMsg = "Enter the port on which the Web UI should redirect unsecured HTTP requests from. [Default: 8080]"
        if ("Y".equalsIgnoreCase(installServerWebAlwaysSecure) || "YES".equalsIgnoreCase(installServerWebAlwaysSecure)) {
            installServerWebHttpsPort = prompt(
                    installServerWebHttpsPort,
                    "Enter the port on which the Web UI should listen for secure HTTPS requests. " +
                    "[Default: 8443]",
                    "8443",
                    portValidator)
        }
        else {
            httpPortMsg = "Enter the port on which the Web UI should listen for HTTP requests. [Default: 8080]"
        }
        installServerWebPort = prompt(
                installServerWebPort,
                httpPortMsg,
                "8080",
                portValidator)

        // run sub-installer getInput method
        subInstallerArray.each { callSubInstallerMethod(it, 'getInput', [] as Object[])}

        // run sub-installer preContainerFileInstall method
        subInstallerArray.each { callSubInstallerMethod(it, 'preContainerFileInstall', [] as Object[])}

        // copy files
        copyServerFiles(installServerDir, doUpgrade)

        installedPropertiesFilePath = installServerDir + "/conf/server/installed.properties"

        // run sub-installer postContainerFileInstall method
        subInstallerArray.each { callSubInstallerMethod(it, 'postContainerFileInstall', [] as Object[])}

        //install service
        if (Os.isFamily("windows") && !doUpgrade) {
            doServiceInstall = false
            if (installServiceName != null) {
                doServiceInstall = true

                if ("N".equalsIgnoreCase(installAsService)) {
                    doServiceInstall = false;
                }
            }
            else {
                installAsService = prompt(
                        installAsService,
                        "Do you want to install the Server as Windows service? y,N [Default: N]",
                        "N",
                        yesNoValidator)
                if ("Y".equalsIgnoreCase(installAsService) || "YES".equalsIgnoreCase(installAsService)) {
                    doServiceInstall = true
                }
            }

            if (doServiceInstall) {
                def strLocalsystem = ".\\localsystem"
                def strPath = "'.\\'"
                def serviceDefault = componentName.toLowerCase().replace(" ", "-")

                installServiceName = prompt(installServiceName,
                        "Enter a unique service name. No spaces allowed. [Default: "+serviceDefault+"]",
                        serviceDefault,
                        requiredValidator)

                try {
                    def process = [
                        installServerDir + "/bin/service/service.cmd",
                        "remove",
                        installServiceName
                    ].execute()
                    process.consumeProcessOutput()
                }
                catch (Exception e) {
                }

                installServiceLogin = prompt(installServiceLogin,
                        "Enter the user account name including domain path to run the service as "+
                        "(for local use "+strPath+" before login). The local system account will "+
                        "be used by default. [Default: "+strLocalsystem+"]",
                        strLocalsystem,
                        requiredValidator)
                if (installServiceLogin != strLocalsystem) {
                    installServicePassword = prompt(
                            installServicePassword,
                            "Please enter your password for desired account.",
                            "nopass",
                            requiredValidator)
                }
                else {
                    installServicePassword = "nopass"
                }

                installServiceAutostart = prompt(
                        installServiceAutostart,
                        "Do you want to start the '" + installServiceName + "' service automatically? y,N " +
                        "[Default: N]",
                        "N",
                        yesNoValidator)

                ant.exec(dir: installServerDir + "\\bin\\service", executable:"cscript.exe") {
                    arg(value:"//I")
                    arg(value:"//Nologo")
                    arg(value:installServerDir + "\\bin\\service\\srvc_install.vbs")
                    arg(value:installServiceName)
                    arg(value:installServiceLogin)
                    arg(value:installServicePassword)
                    arg(value:installServiceAutostart)
                }

                // read service installation status properties
                if (new File(installServerDir + "\\bin\\service\\srvc.properties").exists()) {
                    ant.property(file: installServerDir + "\\bin\\service\\srvc.properties")
                    installServiceStatus = getAntProperty('install.service.status')
                    if (installServiceStatus == "OK") {
                        ant.propertyfile(file: installedPropertiesFilePath) {
                            entry(key: "install.service.name", value: installServiceName)
                        }
                    }
                    ant.delete(file: installServerDir + "\\bin\\service\\srvc.properties")
                }
            }
            else {
                println("\nYou can install service manually (see documentation).\n\n")
            }
        }

        File installPropsFile = new File(installedPropertiesFilePath);
        File varDir = new File(installPropsFile.getParentFile().getParentFile().getParentFile(), "var");
        File tempDir = new File(varDir, "temp");
        def keystorePropPath = serverKeystorePath;
        if (serverKeystorePath.startsWith(installServerDir)) {
            keystorePropPath = keystorePropPath.replaceAll(Pattern.quote(installServerDir), '..')
        }
        def appStoragePropDir = appStorageDir;
        if (appStorageDir.startsWith(installServerDir)) {
            appStoragePropDir = appStoragePropDir.replaceAll(Pattern.quote(installServerDir), '..')
        }
        if (installServerWebHost && installServerWebHost.contains(":")){
            installServerWebHost = installServerWebHost.substring(0, installServerWebHost.indexOf(":"))
        }

        // the installed.properties file must be updated
        ant.propertyfile(file: installedPropertiesFilePath) {
            entry(key: "install.java.home", value: javaHome)
            entry(key: "java.io.tmpdir", value: tempDir.getAbsolutePath());
            entry(key: "install.server.web.ip", value: installServerWebIp)
            entry(key: "install.server.web.always.secure", value: installServerWebAlwaysSecure)
            entry(key: "install.server.web.port", value: installServerWebPort)
            entry(key: "install.server.web.host", value: installServerWebHost)
            entry(key: "server.keystore", value: keystorePropPath)
            entry(key: 'server.appdata.dir', value: appStoragePropDir)
            if (installServerWebHttpsPort != null && installServerWebHttpsPort.trim() != "") {
                entry(key: "install.server.web.https.port", value: installServerWebHttpsPort)
            }
        }

        // write the installed version to <installDir>/conf
        ant.propertyfile(file: installServerDir + "/conf/installed.version") {
            entry(key: "installed.version", value: versionName)
        }

        // write the installed appdata version to <appdata>/conf
        ant.propertyfile(file: appStorageDir + "/conf/installed.version") {
            entry(key: "installed.version", value: versionName)
        }

        // run sub-installer postContainerFileInstall method
        subInstallerArray.each { callSubInstallerMethod(it, 'postContainerInstall', [] as Object[])}

        // remove incomplete installation temp file
        if (incompleteInstallTmpFile != null && incompleteInstallTmpFile.exists()) {
            incompleteInstallTmpFile.delete()
        }
    }

    public void installDatabase() {

        init()

        try {
            // set the mode to expect an existing installation
            expectsInstallation = true

            // read old properties
            if (new File(installServerDir + "/conf/server/installed.properties").exists()) {
                ant.property(file: installServerDir + "/conf/server/installed.properties")
                ant.property(file: installServerDir + "/conf/server/secured-installed.properties")
                initProperties()
            }

            installServerDir = getInstallDir(installServerDir)

            println("Installing database " + componentName + " at: " + installServerDir + "\n")

            // retrieve all properties
            subInstallerArray.each { callSubInstallerMethod(it, 'initProperties', [] as Object[])}

            // retreive user input
            subInstallerArray.each { callSubInstallerMethod(it, 'getDbInput', [] as Object[])}

            // install database for new ucd server
            subInstallerArray.each { callSubInstallerMethod(it, 'installOrUpgradeDatabase', [] as Object[])}

            // run sub-installer postDatabaseOnlyInstall method
            subInstallerArray.each { callSubInstallerMethod(it, 'postDatabaseOnlyInstall', [] as Object[])}

            prompt('Database Installation Complete. (press return to exit installer)') // wait for user input
        }
        catch (Exception e) {
            e.printStackTrace()
            prompt('Database Installation Failed. (press return to exit installer)') // wait for user input
            throw e;
        }
        finally {
            ant.delete(dir: unpackDir)
        }
    }

    private void copyServerFiles(installServerDir, doUpgrade) {

        // disable all existing active patches
        if (doUpgrade && new File(appStorageDir + "/patches").exists()) {
            ant.move(todir: appStorageDir + "/patches", includeemptydirs: 'false', verbose: 'true') {
                fileset(dir: appStorageDir + "/patches") { include(name: "**/*.jar") }
                mapper(type: 'glob', from: '*.jar', to: '*.jar.off')
            }
        }

        ant.delete(dir: installServerDir + "/lib", quiet: 'true', failonerror: 'false') { exclude(name: 'ext/**/*') }
        ant.delete(dir: installServerDir + "/endorsed", quiet: 'true', failonerror: 'false')

        // create directory structure
        ant.mkdir(dir: installServerDir + "/bin")
        ant.mkdir(dir: installServerDir + "/conf/server")
        ant.mkdir(dir: installServerDir + "/endorsed")
        ant.mkdir(dir: installServerDir + "/lib")
        ant.mkdir(dir: installServerDir + "/licenses")
        ant.mkdir(dir: installServerDir + "/native")
        ant.mkdir(dir: installServerDir + "/extensions")
        ant.mkdir(dir: installServerDir + "/var/log")
        ant.mkdir(dir: installServerDir + "/var/temp")
        ant.mkdir(dir: appStorageDir    + "/patches")
        ant.mkdir(dir: appStorageDir    + "/var")
        ant.mkdir(dir: appStorageDir    + "/conf/server")

        final def jreDir = new File(srcDir + '/java')
        if (jreDir.exists()) {
            ant.delete(dir: installServerDir + "/java", quiet: 'true', failonerror: 'false')
            ant.copy(todir: installServerDir + "/java") {
                fileset(dir: srcDir + "/java") { include(name: "**/*") }
            }
            ant.chmod(perm: "+x", type: "file", dir: installServerDir + "/java/bin", includes: "**")
        }

        // these need to run after the embedded Java is copied so it can be used.
        installOs = getOs(javaHome, classpath)
        installArch = getArch(javaHome, classpath)
        // copy conf files
        ant.copy(todir: installServerDir + "/conf", overwrite: 'true') {
            fileset(dir: unpackDir + "/conf") {
                include(name: "server/**/*")
                exclude(name: "server/log4j.properties")
                exclude(name: "server/urbancode.key")
            }
        }
        serverKeystorePath = appStorageDir + "/conf/server.keystore";
        File serverKeystoreFile = new File(serverKeystorePath);
        if (!serverKeystoreFile.exists()) {
            generateKeyManually(serverKeystoreFile)
        }

        // copy lib files (remove any old files, except for within /lib/ext)
        ant.sync(todir: installServerDir + '/lib', overwrite: 'true') {
            fileset(dir: srcDir + "/lib") {
                include(name: "*.jar")
                include(name: "bsf/*.jar")
                include(name: "thirdparty/*.jar")
                include(name: "smartcloud/*.jar")
                include(name: "rcl/**/*")
                include(name: "flexera/**/*")
            }
            preserveintarget { include(name: "ext/**/*") }
        }

        ant.copy(todir: installServerDir + '/lib/ext', overwrite: 'false') {
            fileset(dir: srcDir + "/lib/ext") { include(name: "**/*") }
        }

        // copy 3rd-party licenses
        File licensesSrcDir = new File(srcDir + "/licenses")
        if (licensesSrcDir.isDirectory()) {
            ant.sync(todir: installServerDir + '/licenses', overwrite: 'true') { fileset(dir: licensesSrcDir) }
        }

        // copy native files
        File nativeSrcDir = new File(srcDir + "/native/" + installOs)
        if (nativeSrcDir.isDirectory()) {
            ant.sync(todir: installServerDir + "/native", overwrite: 'true', failonerror: 'false') {
                fileset(dir: srcDir + "/native/" + installOs) { include(name: "**") }
            }
        }

        // copy tomcat files (and ROOT webapp)
        copyTomcatFiles( installServerDir )

        // copy app launcher
        ant.copy(todir: installServerDir + "/bin", overwrite: 'true', file: srcDir + "/lib/launcher.jar")

        // create keystore
        File tomcatKeystoreFile = new File(installServerDir + "/opt/tomcat/conf/tomcat.keystore");
        if (!tomcatKeystoreFile.exists()) {
            generateKeyManually(tomcatKeystoreFile)
        }

        // copy tomcat server file
        if (!doUpgrade) {
            ant.delete(file: installServerDir + "/opt/tomcat/conf/server.xml")
            def serverXmlName = "server.xml"
            if ("Y".equalsIgnoreCase(installServerWebAlwaysSecure)) {
                serverXmlName = "server-https.xml"
            }
            ant.copy(file: srcDir + "/opt/tomcat/conf/" + serverXmlName,
            tofile: installServerDir + "/opt/tomcat/conf/server.xml",
            encoding: "UTF-8")
        }
        // run platform specific install
        if (Os.isFamily("unix")) {
            copyServerFilesUnix(installServerDir)
        }
        else if (Os.isFamily("windows")) {
            copyServerFilesWindows(installServerDir)
        }
    }

    private String getJavaVendor(javaHome, classpath) {
        def result = null
        try {
            def process = [
                "${javaHome}" + File.separator + "bin" + File.separator + "java",
                "-classpath",
                classpath,
                "com.urbancode.commons.detection.GetJVMVendor"
            ].execute()
            process.consumeProcessErrorStream(System.err)
            result = process.text.trim()
        }
        catch (Exception e) {
            println "Error retrieving Java Vendor. Installation may not complete correctly. Error: ${e.message}"
        }
        return result
    }

    private List<String> getHeapOnOOMOpts(javaHome, classpath) {
        String vend = getJavaVendor(javaHome, classpath);
        List<String> result = new ArrayList<String>();
        if (vend == "ibm") {
            result.add("-Xdump:heap:none");
            result.add("-Xdump:system:events=systhrow,filter=java/lang/OutOfMemoryError,priority=999");
            result.add("-Xdump:java:events=user,priority=100");
        }
        else {
            result.add("-XX:+HeapDumpOnOutOfMemoryError");
        }
        return result;
    }

    /**
     * Copy the unix specific files to the server directory.  Make any necessary substitutions and file permission
     * alterations.
     */
    private void copyServerFilesUnix(installServerDir) {

        // create a directory for the init script
        ant.mkdir(dir: installServerDir + "/bin/init")

        def serverJavaOpts = "-Xmx2048m -XX:MaxPermSize=192m " +
                "-XX:-OmitStackTraceInFastThrow " +
                getHeapOnOOMOpts(javaHome, classpath).join(" ") + " " +
                "-Dcatalina.base=\\\"$installServerDir/opt/tomcat\\\" " +
                "-Dcatalina.home=\\\"$installServerDir/opt/tomcat\\\" " +
                "-Djava.awt.headless=true " +
                "-Djava.endorsed.dirs=\\\"$installServerDir/endorsed\\\" " +
                "-Dfile.encoding=UTF-8"

        if (isFIPS) {
            serverJavaOpts += useFips;
        }

        def serverJavaDebugOpts = '-Xdebug -Xrunjdwp:transport=dt_socket,address=localhost:10000,server=y,suspend=n -Dcom.sun.management.jmxremote'

        // create a shared filter set
        ant.filterset(id: "server-unix-filterset") {
            filter(token: "SERVER_HOME",     value: installServerDir)
            filter(token: "JAVA_HOME",       value: javaHome)
            filter(token: "ARCH",            value: installArch)
            filter(token: "JAVA_OPTS",       value: serverJavaOpts)
            filter(token: "JAVA_DEBUG_OPTS", value: serverJavaDebugOpts)
            filter(token: "SERVICE_USER",    value: "")
            filter(token: "SERVICE_GROUP",   value: "")
            filter(token: "SERVER_PROG",     value: "server")

            if (new File(srcDir + '/common-filters.properties').exists()) {
                filtersfile(file: srcDir + '/common-filters.properties')
            }
            if (new File(srcDir + '/unix-filters.properties').exists()) {
                filtersfile(file: srcDir + '/unix-filters.properties')
            }
        }

        //
        // Copy Files
        //

        // create the "run" and "init" scripts and classpath conf
        ant.copy(todir: installServerDir + "/bin", overwrite: 'true', encoding: "UTF-8") {
            fileset (dir: srcDir +'/bin/server') {
                include(name:'server')
                include(name:'init/server')
            }
            filterset(refid: 'server-unix-filterset')
        }

        // Do not overwrite in any case if its an upgrade

        if (!doUpgrade) {
            ant.copy(todir: installServerDir + "/bin", overwrite: 'false', encoding: "UTF-8") {
                fileset (dir: srcDir +'/bin/server') { include(name:'set_env') }
                filterset(refid: 'server-unix-filterset')
            }
        }

        ant.copy(todir: installServerDir + "/bin", overwrite: 'true', encoding: "UTF-8") {
            fileset (dir: srcDir +'/bin/server') { include(name:'classpath.conf.UNIX') }
            filterset(refid: 'server-unix-filterset')
            mapper(type:'regexp', from:'^(.*)\\.UNIX$', to:'\\1')
        }

        //
        // Fix line endings and permissions
        //

        // fix line endings - must be done before chmod
        ant.fixcrlf(srcDir: installServerDir, eol: "lf") {
            include(name: "bin/server")
            include(name: "bin/set_env")
            include(name: "bin/classpath.conf")
            include(name: "bin/init/server")
        }

        // adjust modes on scripts
        ant.chmod(perm: "+x", type: "file") {
            fileset(dir: installServerDir) {
                include(name: "bin/server")
                include(name: "bin/set_env")
                include(name: "bin/init/server")
            }
        }
        ant.chmod(perm: "+x", type: "file", dir: installServerDir + "/native", includes: "**")
    }

    /**
     * Copy the Windows specific files to the server directory.  Make any necessary substitutions and file permission
     * alterations.
     */
    private void copyServerFilesWindows(installServerDir) {
        // create a directory for the service script and exe
        ant.mkdir(dir: installServerDir + "\\bin\\service")

        def serverJavaOpts = "-Xmx2048m -XX:MaxPermSize=192m " +
                "-XX:-OmitStackTraceInFastThrow " +
                getHeapOnOOMOpts(javaHome, classpath).join(" ") + " " +
                "-Dcatalina.base=\"$installServerDir\\opt\\tomcat\" " +
                "-Dcatalina.home=\"$installServerDir\\opt\\tomcat\" " +
                "-Djava.endorsed.dirs=\"$installServerDir\\endorsed\" " +
                "-Dfile.encoding=UTF-8"

        def serverJavaOptsNonQuote = "-Xmx2048m;-XX:MaxPermSize=192m;" +
                "-XX:-OmitStackTraceInFastThrow;" +
                getHeapOnOOMOpts(javaHome, classpath).join(";") + ";" +
                "-Dcatalina.base=$installServerDir\\opt\\tomcat;" +
                "-Dcatalina.home=$installServerDir\\opt\\tomcat;" +
                "-Djava.endorsed.dirs=$installServerDir\\endorsed;" +
                "-Dfile.encoding=UTF-8"

        if (isFIPS) {
            serverJavaOpts += useFips;
            serverJavaOptsNonQuote += useFips;
        }

        def serverJavaDebugOpts = '-Xdebug -Xrunjdwp:transport=dt_socket,address=10000,server=y,suspend=n -Dcom.sun.management.jmxremote'

        // create a shared filter set
        ant.filterset(id: "server-windows-filterset") {
            filter(token: "SERVER_HOME", value: installServerDir)
            filter(token: "JAVA_HOME", value: javaHome)
            filter(token: "ARCH", value: installArch)
            filter(token: "TEMPLATE", value: "server")
            filter(token: "JAVA_OPTS",       value: serverJavaOpts)
            filter(token: "JAVA_DEBUG_OPTS", value: serverJavaDebugOpts)

            if (new File(srcDir + '/common-filters.properties').exists()) {
                filtersfile(file: srcDir + '/common-filters.properties')
            }
            if (new File(srcDir + '/windows-filters.properties').exists()) {
                filtersfile(file: srcDir + '/windows-filters.properties')
            }
        }

        // create basic, run, start, stop scripts
        ant.copy(todir: installServerDir + "\\bin", overwrite: 'true', encoding: "UTF-8") {
            fileset(dir: srcDir+'\\bin\\server') {
                include(name:'server.cmd')
                include(name:'service\\_service.cmd')
                include(name:'service\\service.cmd')
                include(name:'service\\srvc_configurator.vbs')
                include(name:'service\\srvc_stop.vbs')
                include(name:'service\\srvc_install.vbs')
            }

            filterset(refid: "server-windows-filterset")
        }

        // Do not overwrite in any case if its an upgrade

        if (!doUpgrade) {
            ant.copy(todir: installServerDir + "\\bin", overwrite: 'false', encoding: "UTF-8") {
                fileset(dir: srcDir+'\\bin\\server') { include(name:'set_env.cmd') }
                filterset(refid: "server-windows-filterset")
            }
        }

        ant.copy(todir: installServerDir + "\\bin", overwrite: 'true', encoding: "UTF-8") {
            fileset(dir: srcDir+'\\bin\\server') { include(name:'classpath.conf.WIN') }

            filterset(refid: "server-windows-filterset")
            mapper(type:'regexp', from:'^(.*)\\.WIN$', to:'\\1')
        }
        ant.copy(todir: installServerDir + "\\bin", overwrite: 'true', encoding: "UTF-8") {
            fileset(dir: srcDir+'\\bin') {
                include(name:'TEMPLATE_run.cmd')
                include(name:'TEMPLATE_start.cmd')
                include(name:'TEMPLATE_stop.cmd')
            }
            filterset(refid: "server-windows-filterset")
            mapper(type:'regexp', from:'^TEMPLATE_(.*)\\.cmd$', to:'\\1_server.cmd')
        }

        // create the service install script
        // do NOT attempt to quote spaces in JAVA_OPTS here
        ant.copy(todir: installServerDir + "\\bin\\service", overwrite: 'true', encoding: "UTF-8") {
            fileset(dir: srcDir+"\\bin\\server\\service") {
                include(name:'service.cmd')
                include(name:'_service.cmd')
            }
            filterset { filter(token: "JAVA_OPTS", value: serverJavaOptsNonQuote) }
            filterset(refid: "server-windows-filterset")
        }

        // fix line endings - must be done before chmod
        ant.fixcrlf(srcDir: installServerDir) {
            include(name: "bin\\**.cmd")
            include(name: "bin\\**.vbs")
            include(name: "bin\\classpath.conf")
        }
    }

    private String getInstallDir(installDir) {
        String defaultDir =  null
        if (Os.isFamily('mac')) {
            defaultDir = '/Library/'+componentDirectoryName
        }
        else if (Os.isFamily('unix')) {
            defaultDir = '/opt/'+componentDirectoryName
        }
        else if (Os.isFamily('windows')) {
            String progFiles = getAntProperty('ProgramFiles')
            if (progFiles != null && progFiles.length() > 0 ) {
                defaultDir = progFiles+'\\'+componentDirectoryName.replace('/', '\\')
            }
            else {
                defaultDir = "C:\\Program Files" + File.separator + componentDirectoryName.replace('/', '\\')
            }
        }

        String message = expectsInstallation ? 'Enter the directory where the ' + componentName + ' is installed.' :
                'Enter the directory where the ' + componentName + ' should be installed.'
        message += (defaultDir == null ? '' : ' [Default: '+defaultDir+']')

        installDir = prompt(
                installDir,
                message,
                defaultDir,
                requiredValidator)

        // In Korean systems on Windows, the file separator character comes through as this character.
        // Replace it so it doesn't break the final server path.
        installDir = installDir.replace(""+(char)8361, File.separator)

        if (!new File(installDir).exists()) {
            if (expectsInstallation) {
                ant.fail("Selected installation directory does not exist.")
            }

            String createDir = prompt(
                    null,
                    'The specified directory does not exist. Do you want to create it? Y,n [Default: Y]',
                    'Y',
                    yesNoValidator)
            if ('Y'.equalsIgnoreCase(createDir) || 'YES'.equalsIgnoreCase(createDir)) {
                new File(installDir).mkdirs()
            }
            else {
                ant.fail('Can not install without creating installation directory.')
            }
        }

        def installDirFile = new File(installDir);
        if (!installDirFile.isDirectory() && !installDirFile.mkdirs()) {
            ant.fail("The directory entered cannot be created. This may be because your user account does not have the required permissions.");
        }

        return installDirFile.getAbsolutePath()
    }

    private boolean checkForUpgrade(installDir) {
        if (new File(installDir + '/conf/installed.version').exists()) {
            ant.property(file: installDir + '/conf/installed.version')

            File pidFile = new File(installDir + '/var/server.pid');
            if (pidFile.exists()) {
                ant.fail('Found pid file at ' + pidFile.getAbsolutePath() + '. Ensure ${component.name} is shutdown, ' + pidFile.getAbsolutePath() + ' is removed ' +
                        ', then start the installation again.')
            }

            if (new File(installDir + '/conf/server/installed.properties').exists()) {
                ant.property(file: installDir + '/conf/server/installed.properties')

                try {
                    def alwaysSecure = getAntProperty('install.server.web.always.secure')
                    def webHost = getAntProperty('install.server.web.host')
                    def port

                    if (alwaysSecure?.equalsIgnoreCase("Y")) {
                        port = (getAntProperty('install.server.web.https.port')).toInteger()
                    }
                    else {
                        port = (getAntProperty('install.server.web.port')).toInteger()
                    }

                    if (webHost && webHost.contains(":")){
                        webHost = webHost.substring(0, webHost.indexOf(":"))
                    }

                    // Legacy servers may not have the install.server.web.host property
                    if (!webHost) {
                        def serverUrl = getAntProperty('install.server.external.web.url')
                        if (!serverUrl) {
                            serverUrl = getAntProperty('server.external.web.url')
                        }

                        if (serverUrl) {
                            if (!serverUrl.startsWith("http")) {
                                serverUrl = "http://" + serverUrl
                            }
                            webHost = new URI(serverUrl).getHost()
                        }
                    }

                    if (webHost && port) {
                        try {
                            def clientSocket = new Socket()
                            clientSocket.connect(new InetSocketAddress(webHost, port), 5000)
                            clientSocket.close()

                            prompt("A connection can be made to configured server host and port. This is a common scenario when going through a load balancer." +
                                    "Please ensure ALL server processes are stopped before continuing. (press enter to continue)") // wait for user input
                        }
                        catch (java.net.SocketTimeoutException e) {
                            // not running
                        }
                        catch (java.net.NoRouteToHostException e) {
                            //udeploy servers now store this information in the database. old servers may
                            //still contain the same property, but it may be out of date or invalid.
                            println("\n" + e.getMessage());
                            println("Could not determine if server is running.");
                            prompt("Please ensure server process is stopped before continuing. (press enter to continue)") // wait for user input
                        }
                        catch (java.net.UnknownHostException e) {
                            //some load balancers will drop the host from DNS when nothing is connected to them
                            //allow the install to continue if the host cant be found
                            //also possible that install.properties not updated now that server url is stored in db
                            println("\n" + e.getMessage());
                            println("Could not determine if server is running.");
                            prompt("Please ensure server process is stopped before continuing. (press enter to continue)") // wait for user input
                        }
                    }
                }
                catch (ConnectException e) {
                }
            }

            if (nonInteractive) {
                return true
            }

            def installedVersion = getAntProperty('installed.version')
            def thisVersion = getAntProperty('version')
            def doUpgrade = prompt(
                    null,
                    'A previous version (' + installedVersion + ') ' +
                    'exists in the specified directory. Do you want to upgrade the currently ' +
                    'installed version? Y,n [Default Y]',
                    'Y',
                    yesNoValidator)
            if (!(doUpgrade == 'Y' || doUpgrade == 'y')) {
                println 'Upgrade aborted.'
                System.exit(1)
            }

            def installedVersionComparable = installedVersion.tokenize('.')
            def thisVersionComparable = thisVersion.tokenize('.')
            def needToCheckVersions = (installedVersion != "dev" && thisVersion != "dev")
            if (needToCheckVersions && !versionMeetsOrExceeds(thisVersionComparable, installedVersionComparable)) {
                def doDowngrade = prompt(null,
                        'WARNING: You appear to be downgrading from ' +
                        installedVersion + ' to ' + thisVersion +'. This is ' +
                        'an unsupported operation. Are you sure you want to ' +
                        'attempt this downgrade? [Type "yes" to confirm]',
                        'N',
                        yesNoValidator)
                if (doDowngrade != "yes") {
                    println "Downgrade aborted."
                    System.exit(1)
                }
            }

            return true
        }

        return false
    }

    private boolean serverExists(installDir) {
        if (new File(installDir + '/conf/installed.version').exists()) {
            ant.property(file: installDir + '/conf/installed.version')
            return true
        }
        return false
    }

    //
    // General utility methods
    //

    /**
     * Compares two versions.
     *
     * A version is an indexable collection of segments. Segments are strings that can contain
     * integers or alphanumeric. Alphanumeric segments are those that cannot be converted to a
     * 32-bit signed integer. Alphanumeric segments are considered greater than numeric segments.
     * Comparisons between alphanumeric segments are lexicographic and case-insensitive.
     *
     *    @param v1 A version, as described above.
     *    @param v2 A version, as described above
     *    @return -1 if v1 is less than v2, 0 if v1 is equal to v2, and 1 if v1 is greater than v2.
     */
    def compareVersions(v1, v2) {
        def cmpint = { x, y ->
            if (x < y) {
                return -1
            }
            if (x == y) {
                return 0
            }
            return 1
        }
        def n1 = v1.size()
        def n2 = v2.size()
        def n = Math.min(n1, n2)
        for (def i = 0; i < n; i++) {
            def p1 = v1[i]
            def p2 = v2[i]
            def p1alpha = !p1.isInteger()
            def p2alpha = !p2.isInteger()
            if (p1alpha && p2alpha) {
                def c = (p1 as String).compareToIgnoreCase((p2 as String))
                if (c != 0) {
                    return cmpint(c, 0) // ensure result is -1, 0, or 1
                }
            }
            else if (p1alpha) {
                return 1
            }
            else if (p2alpha) {
                return -1
            }
            else {
                def c = cmpint(p1 as int, p2 as int)
                if (c != 0) {
                    return c
                }
            }
        }
        return cmpint(n1, n2)
    }

    private String prompt(promptText) {
        return prompt(null, promptText, null)
    }

    private String prompt(curValue, promptText) {
        return prompt(curValue, promptText, null)
    }

    private String prompt(curValue, promptText, defaultValue) {
        return prompt(curValue, promptText, defaultValue, null)
    }

    private String prompt(curValue, promptText, defaultValue, validator) {
        return prompt(curValue, promptText, defaultValue, validator, false)
    }

    private String promptForPassword(curValue, promptText, validator) {
        return prompt(curValue, promptText, null, validator, true)
    }

    private String prompt(curValue, promptText, defaultValue, validator, isPassword) {
        // use curValue if not null and not empty
        if (curValue != null && curValue.trim()) {
            return curValue
        }

        if (nonInteractive) {
            println(promptText)

            if (validator != null) {
                try {
                    validator.validate(defaultValue)
                } catch (ValidationException ve) {
                    throw new IllegalArgumentException(
                    "Non-Interactive Mode: problem with default value of '${defaultValue}' " +
                    "for '${promptText}' - " + ve.getValidationMessageArray().join(' '))
                }
            }
            return defaultValue
        }

        def userValue = null
        def valid = false
        while (!valid) {
            println(promptText)
            if (isPassword) {
                def matching = false
                while (!matching) {
                    userValue = String.valueOf(System.console().readPassword())
                    println("Please type password again.")
                    def passwordMatch = String.valueOf(System.console().readPassword())
                    matching = (passwordMatch==userValue)
                    if (!matching) {
                        println("Passwords do not match. "+promptText)
                    }
                }
            }
            else {
                userValue = read(defaultValue)
            }

            if (validator != null) {
                try {
                    validator.validate(userValue)
                    valid = true
                }
                catch (ValidationException ve) {
                    for (message in ve.getValidationMessageArray()) {
                        println(message)
                    }
                }
            }
            else {
                valid = true
            }
        }

        return userValue
    }

    private String read(defaultValue) {
        def line = systemIn.readLine()?.trim()
        return line ?: defaultValue
    }

    private void println(displayText) {
        if (displayText != null) {
            ant.echo(displayText)
        }
    }

    // command is a string or string array
    private Map runCommand(command) {
        def proc = command.execute()
        proc.waitFor()
        def result = [:] // empty map
        result["out"] = proc.in.text // std output of the process
        result["err"] = proc.err.text
        result["exit"] = proc.exitValue()
        return result
    }

    private Map getSystemPropertiesForRuntime(javaHome, classpath) {
        def result = [:]
        try {
            def process = [
                "${javaHome}" + File.separator + "bin" + File.separator + "java",
                "-classpath",
                classpath,
                "com.urbancode.commons.detection.GetSystemProperties"
            ].execute()
            process.consumeProcessErrorStream(System.err)
            process.in.eachLine {
                def prop = it.split("=", 2)
                result[prop[0]] = StringEscapeUtils.unescapeJava(prop[1])
            }
        }
        catch (Exception e) {
            result = null
        }
        return result
    }

    private String getOs(javaHome, classpath) {
        def result = null
        try {
            def process = [
                "${javaHome}" + File.separator + "bin" + File.separator + "java",
                "-classpath",
                classpath,
                "com.urbancode.commons.detection.GetOs"
            ].execute()
            process.consumeProcessErrorStream(System.err)
            result = process.text.trim()
        }
        catch (Exception e) {
            println "Error retrieving OS. Installation may not complete correctly. Error: ${e.message}"
        }
        return result
    }

    private String getArch(javaHome, classpath) {
        def result = null
        try {
            def process = [
                "${javaHome}" + File.separator + "bin" + File.separator + "java",
                "-classpath",
                classpath,
                "com.urbancode.commons.detection.GetArch"
            ].execute()
            process.consumeProcessErrorStream(System.err)
            result = process.text.trim()
        }
        catch (Exception e) {
            println "Error retrieving system architecture. Installation may not complete correctly. Error: ${e.message}"
        }
        return result
    }

    /**
     * Compare two versions, and return whether or not the second version meets
     * or exceeds the first version.
     *
     *    @param version Version to test. Array of integers, most significant version first.
     *    @param min Version to meet or exceed. Array of integers, most significant version first.
     *    @return Whether or not the second version meets or exceeds the first version
     */
    private boolean versionMeetsOrExceeds(version, min) {
        return (compareVersions(version,min) >= 0)
    }

    //
    // Tomcat Methods
    //

    private Integer getTomcatMajorVersion( installServerDir ) {
        return getTomcatServerVersionChunk( installServerDir, 0 )
    }

    private Integer getTomcatMinorVersion( installServerDir ) {
        return getTomcatServerVersionChunk( installServerDir, 1 )
    }

    private Integer getTomcatPatchVersion( installServerDir ) {
        return getTomcatServerVersionChunk( installServerDir, 2 )
    }

    private Integer getTomcatServerVersionChunk( installServerDir, index ) {
        Integer result = null
        String version = getTomcatServerVersion( installServerDir )
        if (version != null ) {
            String[] chunks = version.split( "\\." )
            if (chunks.length >= (index + 1) ) {
                result = chunks[index].trim()?.toInteger()
            }
        }
        return result
    }

    /**
     * This method will return the contents of the installServerDir + "/opt/tomcat/tomcat.version"
     * as a string, this should be the currently installed version of tomcat.
     * If this file is not found, we return null.
     *
     *    @param installServerDir The directory where the  is installed.
     *    @return The contents of the tomcat.version file.
     */
    private String getTomcatServerVersion( installServerDir ) {
        File tomcatVersion = new File( installServerDir + "/opt/tomcat/tomcat.version" )
        if ( !tomcatVersion.exists() ) {
            return null
        }
        String version = tomcatVersion.text
        return version
    }

    /**
     * Copy new tomcat files and the updated AHP webapps to the installServerDir tomcat directory
     */
    private void copyTomcatFiles( installServerDir ) {
        String sessionTimeoutValue = getTomcatSessionTimeout(installServerDir) ?: "30"

        ant.sync(todir: installServerDir + "/opt/tomcat", overwrite: 'true') {
            fileset(dir: "$srcDir/opt/tomcat") {
                include(name: '**')
                exclude(name: 'conf/server.xml')
                exclude(name: 'conf/server-*.xml')
                exclude(name: 'conf/tomcat.keystore')
            }
            preserveintarget{
                include(name: 'conf/server.xml')
                include(name: 'conf/tomcat.keystore')
            }
        }

        // update security section of web.xml
        if (new File(installServerDir + "/opt/tomcat/webapps/ROOT/WEB-INF/web.xml").exists()) {
            if ("Y".equalsIgnoreCase(installServerWebAlwaysSecure)) {
                ant.replace(file: installServerDir + "/opt/tomcat/webapps/ROOT/WEB-INF/web.xml") {
                    // constraints are in a xml comment block '<!-- @@SECURE_START@@ ... @@SECURE_END@@ -->'
                    replacefilter(token:"@@SECURE_START@@", value:"@@SECURE_START@@ -->")
                    replacefilter(token:"@@SECURE_END@@", value:"<!-- @@SECURE_END@@")
                }
            }
        }

        ant.delete(dir: "$installServerDir/opt/tomcat/work")

        setTomcatSessionTimeout(installServerDir, sessionTimeoutValue)
    }

    /**
     * Read the session-timout value from the tomcat/conf/web.xml file
     */
    private String getTomcatSessionTimeout(installServerDir) {
        String sessionTimeoutValue = null
        File webXmlFile = new File( installServerDir + "/opt/tomcat/conf/web.xml" )
        if (webXmlFile.exists()) {
            DocumentBuilderFactory docBuilderFactory = DocumentBuilderFactory.newInstance()
            DocumentBuilder builder = docBuilderFactory.newDocumentBuilder()
            Document doc = builder.parse( webXmlFile )

            NodeList nodeList = doc.getElementsByTagName( "session-timeout" )
            if (nodeList.getLength() > 0) {
                Node sessionTimeout = nodeList.item(0)
                if (sessionTimeout.hasChildNodes()) {
                    Node childText = sessionTimeout.getFirstChild()

                    String t = childText.getNodeValue()
                    if (t.isInteger()) {
                        sessionTimeoutValue = t
                    }
                }
            }
        }
        return sessionTimeoutValue
    }

    /**
     * Write the session-timout value to the tomcat/conf/web.xml file.
     * It does not modify the file if the value is equal to our default of "30"
     */
    private void setTomcatSessionTimeout(installServerDir, sessionTimeoutValue) {
        File webXmlFile = new File( installServerDir + "/opt/tomcat/conf/web.xml" )
        if (!sessionTimeoutValue.equals("30")) {

            DocumentBuilderFactory docBuilderFactory = DocumentBuilderFactory.newInstance()
            DocumentBuilder builder = docBuilderFactory.newDocumentBuilder()
            Document doc = builder.parse( webXmlFile )

            NodeList nodeList = doc.getElementsByTagName( "session-timeout" )
            if (nodeList.getLength() > 0) {
                Element sessionTimeout = (Element)nodeList.item(0)
                while( sessionTimeout.hasChildNodes() ) {
                    Node child = sessionTimeout.getLastChild()
                    sessionTimeout.removeChild(child)
                }
                sessionTimeout.appendChild( doc.createTextNode(sessionTimeoutValue) )

                TransformerFactory transformerFactory = TransformerFactory.newInstance()
                Transformer transformer = transformerFactory.newTransformer()
                transformer.setOutputProperty(OutputKeys.INDENT, "yes")
                StringWriter sw = new StringWriter()
                StreamResult result = new StreamResult(sw)
                DOMSource source = new DOMSource(doc)
                transformer.transform(source,result)
                String xmlString = sw.toString()

                // Delete the file.
                webXmlFile.delete()
                // Write out our modified DOM to the file with Logger elements stripped.
                webXmlFile.createNewFile()
                OutputStream outputStream = new FileOutputStream(webXmlFile,false)
                try {
                    outputStream.write( xmlString.getBytes() )
                } finally {
                    if (outputStream != null) { outputStream.close() }
                }
            }
        }
    }

    private void callSubInstallerMethod(Object instance, String methodName, Object[] args) {
        Class[] classArray = []
        if (args != null && args.size() > 0) {
            classArray = new Class[args.size()]
            for (int i; i < args.size(); i++) {
                classArray[i] = args[i].class
            }
        }

        try {
            instance.class.getMethod(methodName, classArray)
            instance.invokeMethod(methodName, args)
        }
        catch (NoSuchMethodException e) {
            // Swallow exception when this sub-installer doesn't use this method.
            e.printStackTrace()
        }
    }

    /*
     * code to manually generate a key. Just here for backup in case we want ant to generate the key in the future
     */
    private void generateKey(String keystoreLocation) {
        ant.genkey(alias: "server",
        keystore: keystoreLocation,
        storetype: "JKS",
        storepass: "changeit",
        keypass: "changeit",
        keyalg: "RSA",
        sigalg: "SHA256withRSA",
        keysize: "2048",
        validity: "7305",
        dname: "CN=" + installServerWebHost)
    }

    /*
     * Method to generate key using air-keytool. Needed when installing to a location with foreign
     * character sets
     */
    private void generateKeyManually(File keystoreLocation) {
        File keyStoreFile = keystoreLocation;
        Date from = new Date();
        Date to = new Date(from.getTime() + (7305 * 86400000l));

        KeytoolHelper keyHelper = new KeytoolHelper();
        KeyStore ks = keyHelper.generateKeyStore(keyStoreFile, "JKS", "changeit");
        KeyPair pair = keyHelper.generateKeyPair("RSA", 2048);

        PrivateKey privKey = pair.getPrivate();
        PublicKey pubKey = pair.getPublic();

        Extension extension = new Extension(pubKey, false);
        extension.SetExtensionIdentifierAsSubjectKey();
        List<Extension> extensions = new ArrayList<Extension>();
        extensions.add(extension);

        Certificate cert = keyHelper.buildWithExtensions("CN=" + installServerWebHost, from, to,
                pair, "SHA256WithRSA", extensions);

        ks.setKeyEntry("server", privKey, "changeit".toCharArray(), [cert ] as Certificate[]);
        ks.store(new FileOutputStream(keyStoreFile.getAbsolutePath()), "changeit".toCharArray());
    }

    void configureFIPS() {
        // If the user wants a FIPS-compliant install, then we must set those providers.
        if (Boolean.valueOf(System.getProperty('com.ibm.jsse2.usefipsprovider'))) {
            // Validate Java distribution
            def javaVendor = System.getProperty('java.vendor');
            if (javaVendor == null || !javaVendor.toLowerCase().contains('ibm')) {
                throw new RuntimeException(
                "IBM Java is required for FIPS compliance, but the detected vendor was $javaVendor");
            }
            Security.setProperty('ssl.SocketFactory.provider', 'com.ibm.jsse2.SSLSocketFactoryImpl');
            Security.setProperty('ssl.ServerSocketFactory.provider', 'com.ibm.jsse2.SSLServerSocketFactoryImpl');

            def ibmjcefips;
            try {
                ibmjcefips = (Constructor<Provider>) Class.forName('com.ibm.crypto.fips.provider.IBMJCEFIPS')
                        .getConstructor();
                Security.insertProviderAt(ibmjcefips.newInstance(), 1);
            } catch (Exception e) {
                throw new RuntimeException('An error occurred while trying configure'
                + ' the server for FIPS compliance.', e);
            }
            isFIPS = true;
            System.out.println('*******************************');
            System.out.println('Installing server in FIPS Mode.');
            System.out.println('*******************************');
        }
    }
}

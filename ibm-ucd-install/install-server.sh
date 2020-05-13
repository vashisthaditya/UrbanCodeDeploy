#!/bin/sh
# Licensed Materials - Property of IBM* and/or HCL**
# UrbanCode Deploy
# UrbanCode Build
# UrbanCode Release
# AnthillPro
# (c) Copyright IBM Corporation 2011, 2017. All Rights Reserved.
# (c) Copyright HCL Technologies Ltd. 2018. All Rights Reserved.
#
# U.S. Government Users Restricted Rights - Use, duplication or disclosure restricted by
# GSA ADP Schedule Contract with IBM Corp.
#
# * Trademark of International Business Machines
# ** Trademark of HCL Technologies Limited

# save current state
PREVIOUS_DIR=`pwd`
PREVIOUS_ANT_HOME=$ANT_HOME
OUR_ANT_VERSION=1.7.1

# now change the dir to the root of the installer
SHELL_NAME=$0
SHELL_PATH=`dirname ${SHELL_NAME}`
FIPS_ARG=$1

if [ "." = "$SHELL_PATH" ]
then
   SHELL_PATH=`pwd`
fi
cd "${SHELL_PATH}"

# set ANT_HOME
ANT_HOME=opt/apache-ant-${OUR_ANT_VERSION}
export ANT_HOME

# set heap memory to 2gb
ANT_OPTS="-Xmx2048m"

# set fips if enabled
if [ "-fips" = "$FIPS_ARG" ]
then
   ANT_OPTS=$ANT_OPTS" -Dcom.ibm.jsse2.usefipsprovider=true"
fi

OLD_JHOME="${JAVA_HOME}"

promptForJavaHome() {
    # get the java home that the server will run on top of
    echo "Enter the home directory for the JRE/JDK that the new server or already installed server uses. Default [${JAVA_HOME}]:"
    read JAVA_HOME
    if [ -z "${JAVA_HOME}" ] ; 
    then
      JAVA_HOME="${OLD_JHOME}"
    fi
}

getJavaHome() {
    #get current installation directory
    echo "Enter the directory of the server to upgrade(leave blank for installing to a clean directory)."
    read INSTALL_SERVER_DIR
    if [ -z "${INSTALL_SERVER_DIR}" ] ;
    then
        promptForJavaHome
    else 
        ANT_OPTS="${ANT_OPTS} -Dinstall.server.dir=\"${INSTALL_SERVER_DIR}\""
        if [ -e "${INSTALL_SERVER_DIR}/bin/set_env" ] ;
        then
            . "${INSTALL_SERVER_DIR}/bin/set_env"
        else
            promptForJavaHome
        fi
    fi
}

getJavaHome
while [ -z "${JAVA_HOME}" ] ;
do
    echo "Could not find java home and one not specified."
    getJavaHome
done

ANT_OPTS="${ANT_OPTS} -Dinstall.java.home=\"${JAVA_HOME}\""

export JAVA_HOME
export ANT_OPTS

# run the install
chmod +x "opt/apache-ant-${OUR_ANT_VERSION}/bin/ant"
opt/apache-ant-${OUR_ANT_VERSION}/bin/ant -nouserlib -noclasspath -f install.with.groovy.xml install

# restore previous state
cd "${PREVIOUS_DIR}"
ANT_HOME=${PREVIOUS_ANT_HOME}
export ANT_HOME

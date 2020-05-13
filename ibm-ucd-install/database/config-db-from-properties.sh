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

set -e

# save current state
PREVIOUS_DIR=`pwd`
PREVIOUS_ANT_HOME=$ANT_HOME
PREVIOUS_CLASSPATH=$CLASSPATH
OUR_ANT_VERSION=1.7.1

# now change the dir to the root of the installer
SHELL_NAME=$0
SHELL_PATH=`dirname ${SHELL_NAME}`

if [ "." = "$SHELL_PATH" ]
then
   SHELL_PATH=`pwd`
fi
cd "${SHELL_PATH}/.."

# set ANT_HOME
ANT_HOME=opt/apache-ant-${OUR_ANT_VERSION}
export ANT_HOME

# overwrite CLASSPATH for Ant
CLASSPATH=
export CLASSPATH

# increase memory to 1gb
ANT_OPTS="-Xmx1024m"
export ANT_OPTS

# run the install
chmod +x "opt/apache-ant-${OUR_ANT_VERSION}/bin/ant"
sync
opt/apache-ant-${OUR_ANT_VERSION}/bin/ant -nouserlib -f install.with.groovy.xml install-database

# restore previous state
cd "${PREVIOUS_DIR}"
ANT_HOME=${PREVIOUS_ANT_HOME}
export ANT_HOME
CLASSPATH=${PREVIOUS_CLASSPATH}
export CLASSPATH

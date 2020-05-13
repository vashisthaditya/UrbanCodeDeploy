@echo off
REM Licensed Materials - Property of IBM* and/or HCL**
REM UrbanCode Deploy
REM UrbanCode Build
REM UrbanCode Release
REM AnthillPro
REM (c) Copyright IBM Corporation 2011, 2017. All Rights Reserved.
REM (c) Copyright HCL Technologies Ltd. 2018. All Rights Reserved.
REM
REM U.S. Government Users Restricted Rights - Use, duplication or disclosure restricted by
REM GSA ADP Schedule Contract with IBM Corp.
REM
REM * Trademark of International Business Machines
REM ** Trademark of HCL Technologies Limited

setlocal

cd %~dp0

set ANT_HOME=opt\apache-ant-1.7.1
set CLASSPATH=
set ANT_OPTS="-Xmx1024m"

opt\apache-ant-1.7.1\bin\ant.bat -f install.with.groovy.xml migrate-database

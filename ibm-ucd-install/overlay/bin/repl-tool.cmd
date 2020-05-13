@echo off
REM Licensed Materials - Property of IBM* and/or HCL**
REM UrbanCode Deploy
REM (c) Copyright IBM Corporation 2011, 2017. All Rights Reserved.
REM (c) Copyright HCL Technologies Ltd. 2018. All Rights Reserved.
REM
REM U.S. Government Users Restricted Rights - Use, duplication or disclosure restricted by
REM GSA ADP Schedule Contract with IBM Corp.
REM
REM * Trademark of International Business Machines
REM ** Trademark of HCL Technologies Limited

setlocal
set SERVER_HOME=@SERVER_HOME@
call "%SERVER_HOME%\bin\set_env.cmd"

set JAVACMD=%JAVA_HOME%\bin\java
pushd "%SERVER_HOME%\bin"
"%JAVACMD%" %REPL_TOOL_JAVA_OPTS% -jar "%SERVER_HOME%\bin\launcher.jar" "%SERVER_HOME%\bin\classpath.conf" com.urbancode.ds.repl.tool.Tool %*
popd
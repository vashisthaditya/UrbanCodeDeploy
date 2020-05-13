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

rem == BEGIN INSTALL MODIFICATIONS =============================================

set SERVER_HOME=@SERVER_HOME@
set ARCH=@ARCH@
set JAVA_OPTS=@JAVA_OPTS@
set JAVA_HOME=@JAVA_HOME@

rem == END INSTALL MODIFICATIONS ===============================================

set SRV=%SERVER_HOME%\native\%ARCH%\winservice.exe

set SERVICE_NAME=@DEFAULT_SERVICE_NAME@
set DISPLAY_NAME=@DISPLAY_SERVICE_NAME@
set DESCRIPTION=@SERVICE_DESCRIPTION@

if ""%1"" == ""install"" goto installService
if ""%1"" == ""remove"" goto removeService
if ""%1"" == ""uninstall"" goto removeService

echo Usage: %SERVICE_NAME% {install^|remove [servicename]}
goto end

rem -- Remove Service ----------------------------------------------------------

:removeService
if ""%2"" == """" goto removeDefaultService
set SERVICE_NAME=%2

:removeDefaultService
cscript "%SERVER_HOME%\bin\service\srvc_stop.vbs" //I //Nologo %SERVICE_NAME%
"%SRV%" //DS//%SERVICE_NAME%
echo '%SERVICE_NAME%' service has been removed.
goto end

rem -- Install Service ---------------------------------------------------------

:installService
set JVM_DLL=auto

if ""%2"" == """" goto installDefaultService

set SERVICE_NAME=%2
set DISPLAY_NAME=%DISPLAY_NAME% %2
set DESCRIPTION=%DESCRIPTION% %2


:installDefaultService 
call :getJvmDll
set SVCPATH=%JVM_BASE%\..
set SVCPATH=%SVCPATH:"=%
set SVCPATH=%SVCPATH:;=';'%
set SVCPATH=%SVCPATH:#='#'%

"%SRV%" //IS//%SERVICE_NAME% --DisplayName "%DISPLAY_NAME%" --Install "%SRV%" || goto installFailed
"%SRV%" //US//%SERVICE_NAME% --Description "%DESCRIPTION%" || goto configFailed

"%SRV%" //US//%SERVICE_NAME% --Jvm "%JVM_DLL%" || goto configFailed
"%SRV%" //US//%SERVICE_NAME% --JavaHome "%JAVA_HOME%" || goto configFailed
"%SRV%" //US//%SERVICE_NAME% --JvmOptions "%JAVA_OPTS%" || goto configFailed

"%SRV%" //US//%SERVICE_NAME% --Environment "PATH=%SVCPATH%';'%%PATH%%;JAVA_HOME=%JAVA_HOME%" || goto configFailed

"%SRV%" //US//%SERVICE_NAME% --StartMode jvm || goto configFailed
"%SRV%" //US//%SERVICE_NAME% --StartClass com.urbancode.launcher.Launcher || goto configFailed
"%SRV%" //US//%SERVICE_NAME% --StartParams "%SERVER_HOME%\bin\classpath.conf;com.urbancode.ds.UDeployServer" || goto configFailed
"%SRV%" //US//%SERVICE_NAME% --StartPath "%SERVER_HOME%\bin" || goto configFailed

"%SRV%" //US//%SERVICE_NAME% --StopMode jvm || goto configFailed
"%SRV%" //US//%SERVICE_NAME% --StopClass com.urbancode.launcher.Launcher || goto configFailed
"%SRV%" //US//%SERVICE_NAME% --StopParams "%SERVER_HOME%\bin\classpath.conf;com.urbancode.container.tomcat.ContainerShutdown" || goto configFailed
"%SRV%" //US//%SERVICE_NAME% --StopPath "%SERVER_HOME%\bin" || goto configFailed

"%SRV%" //US//%SERVICE_NAME% --LogPath "%SERVER_HOME%\var\log" || goto configFailed
"%SRV%" //US//%SERVICE_NAME% --StdOutput auto || goto configFailed
"%SRV%" //US//%SERVICE_NAME% --StdError auto || goto configFailed

"%SRV%" //US//%SERVICE_NAME% --Classpath "%SERVER_HOME%\bin\launcher.jar" || goto configFailed

rem -- SrvcConfigurator ---------------------------------------------------------

cscript "%SERVER_HOME%\bin\service\srvc_configurator.vbs" //I //Nologo %SERVICE_NAME%

goto end

rem -- Subroutines -------------------------------------------------------------

:getJvmDll
    if exist "%JAVA_HOME%\bin\client\jvm.dll" set JVM_BASE=%JAVA_HOME%\bin\client
    if exist "%JAVA_HOME%\bin\server\jvm.dll" set JVM_BASE=%JAVA_HOME%\bin\server
    if exist "%JAVA_HOME%\bin\j9vm\jvm.dll" set JVM_BASE=%JAVA_HOME%\bin\j9vm
    if exist "%JAVA_HOME%\jre\bin\client\jvm.dll" set JVM_BASE=%JAVA_HOME%\jre\bin\client
    if exist "%JAVA_HOME%\jre\bin\server\jvm.dll" set JVM_BASE=%JAVA_HOME%\jre\bin\server
    if exist "%JAVA_HOME%\jre\bin\j9vm\jvm.dll" set JVM_BASE=%JAVA_HOME%\jre\bin\j9vm
    set JVM_DLL=%JVM_BASE%\jvm.dll
goto :eof

:installFailed
    echo Service installation failed
    exit /b 1
goto :eof

:configFailed
    echo Service configuration failed
    exit /b 1
goto :eof

:end

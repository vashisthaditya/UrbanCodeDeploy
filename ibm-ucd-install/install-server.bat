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

setlocal enabledelayedexpansion

REM If we can't find a codepage, fall back to UTF-8.
set ENCODING=UTF-8

set CODEPAGE=UNKNOWN
for /f "tokens=3*" %%x in ('reg query "HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Control\Nls\CodePage" /v OEMCP') do set CODEPAGE=%%x

REM This is the exhaustive list of all supported OEM code pages.

REM By default, use the Java encoding "CP<codepage>"
if NOT %CODEPAGE%==UNKNOWN set ENCODING=CP%CODEPAGE%

REM Multilingual Latin I + Euro (Indirect match to Charset CP850)
if %CODEPAGE%==858 set ENCODING=CP850

REM Japanese codepage requires a specific encoding name
if %CODEPAGE%==932 set ENCODING=Shift_JIS

cd %~dp0

set ANT_HOME=opt\apache-ant-1.7.1
set CLASSPATH=
set ANT_OPTS=-Xmx2048m -Dfile.encoding=%ENCODING%

REM Get the real java to use for install/upgrade instead of relying on what crap is on path/env
set OLD_JHOME=%JAVA_HOME%
:prompt
echo Enter the home directory for the JRE/JDK that the new server or already installed server uses. Default [%JAVA_HOME%]:
set /p JAVA_HOME=

call :empstr %JAVA_HOME% 
IF %ERRORLEVEL% == 1 set JAVA_HOME=%OLD_JHOME%

call :empstr %JAVA_HOME% 
IF %ERRORLEVEL% == 1 (
  echo Must specify a valid java home
  goto :prompt
)
set JAVA_HOME=!JAVA_HOME:"=!

if "%1"=="-fips" set ANT_OPTS=%ANT_OPTS% -Dcom.ibm.jsse2.usefipsprovider=true
set ANT_OPTS=%ANT_OPTS% -Dinstall.java.home="%JAVA_HOME%"

opt\apache-ant-1.7.1\bin\ant.bat -f -nouserlib -noclasspath install.with.groovy.xml install
set JAVA_HOME=%OLD_JHOME%

goto :EOF

REM returns 1 if first argument is empty string. 0 otherwise
:empstr
  if "%~1" == "" exit /B 1
  exit /B 0

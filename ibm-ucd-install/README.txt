Readme file for the IBM UrbanCode Deploy installer

For full documentation and installation instructions, see IBM Knowledge Center:
http://www-01.ibm.com/support/knowledgecenter/SS4GSP/ucd_welcome.html


Basic system requirements

For evaluation purposes:
- The server requires Java 8 or later. Set the JAVA_HOME environment variable to the location of the JRE.
- The installer can install a Derby database for you.
- You can install a trial license.

For a production installation:
- The server requires Java 8 or later. Set the JAVA_HOME environment variable to the location of the JRE.
- You must install a separate database. See the full installation instructions.
- Place the JAR file for the database driver in the lib/ext folder of the installation program.
- If you are installing on AIX(R), the unzip program is required.
- You must have a license server with available licenses.
- To provision environments on clouds via OpenStack Heat, you must install the blueprint design server and its heat engine.


For complete system requirements, see the following document:
http://www-01.ibm.com/support/docview.wss?uid=swg27038801


Installation

On Windows, run the install-server.bat file. On Linux, run ./install-server.sh. Then, follow the prompts in the installation program. For complete instructions, including how to run the installer in silent mode, see IBM Knowledge Center:
http://www-01.ibm.com/support/knowledgecenter/SS4GSP/ucd_welcome.html


Next steps

To start the server, run the following command:
On Linux, run [server_installation]/bin/server start, where [server_installation] is the server installation folder. On Windows, run [server_installation]\bin\run_server.cmd. The default server installation directory is /opt/ibm-ucd/server on Linux and C:\Program Files\ibm-ucd\server on Windows.

To access the server, open a web browser to the following URL: https://[hostname]:[port], where [hostname] is the host name of the system on which you installed the server and [port] is the HTTPS port that you specified when you installed the server. The default HTTPS port is 8443. Then, log in to the server by using the default credentials. The default user name is admin and you specified the password when you installed the server.

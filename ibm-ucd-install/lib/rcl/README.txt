A note about using RCL API:

In order to gain access to the server, one needs to have certain system property flags set. They are as follows:

-Djava.library.path=<path to this rlc directory in webapps root/OS specific directory/[sub directory for 32 or 64 bit]/>
-Dlicense.server.url='<port@hostAddress>'

As an example:

-Djava.library.path=/usr/share/tomcat7/webapps/appName/WEB-INF/lib/rlc/mac/
-Dlicense.server.url='27000@rcl.server.com'

These flags can be added into the catalina.sh(.bat) bash script by adding them to the JAVA_OPTS property.
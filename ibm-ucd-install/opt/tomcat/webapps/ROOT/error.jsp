<%--
- Licensed Materials - Property of IBM* and/or HCL**
- UrbanCode Deploy
- (c) Copyright IBM Corporation 2011, 2017. All Rights Reserved.
- (c) Copyright HCL Technologies Ltd. 2018. All Rights Reserved.
-
- U.S. Government Users Restricted Rights - Use, duplication or disclosure restricted by
- GSA ADP Schedule Contract with IBM Corp.
-
- * Trademark of International Business Machines
- ** Trademark of HCL Technologies Limited
--%>
<%@page contentType="text/html" %>
<%@page autoFlush="false"%>
<%@page pageEncoding="UTF-8" %>
<%@page import="com.sun.jersey.api.NotFoundException"%>
<%@page import="com.urbancode.air.i18n.TranslatableException"%>
<%@page import="com.urbancode.air.i18n.TranslateUtil"%>
<%@page import="com.urbancode.ds.web.util.TextareaWrappedException"%>
<%@page import="com.urbancode.commons.web.WebConstants"%>
<%@taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>

<%
  Throwable exception = (Throwable)request.getAttribute("javax.servlet.error.exception");
  if (exception == null) {
      exception = (Throwable)request.getAttribute(WebConstants.EXCEPTION);
  }
  response.setHeader("Cache-Control", "no-cache");

  Integer statusCode = (Integer)request.getAttribute("javax.servlet.error.status_code");
  if (exception != null) {
      Throwable rootCause = exception;
      while (rootCause.getCause() != null && !(rootCause instanceof TextareaWrappedException)) {
          rootCause = rootCause.getCause();
      }
      pageContext.setAttribute("rootCause", rootCause);
      
      if (rootCause instanceof NotFoundException) {
%>
<%= TranslateUtil.getInstance().getValue("Resource not found:") %> <c:out value="${requestScope['javax.servlet.error.request_uri']}" escapeXml="true"/>
<%
      }
      else if (rootCause instanceof TextareaWrappedException) {
%>
<html>
<!-- This is dummy text so we get past IE's default error pages for responses less than 512 bytes -->
<!-- This is dummy text so we get past IE's default error pages for responses less than 512 bytes -->
<!-- This is dummy text so we get past IE's default error pages for responses less than 512 bytes -->
<!-- This is dummy text so we get past IE's default error pages for responses less than 512 bytes -->
<!-- This is dummy text so we get past IE's default error pages for responses less than 512 bytes -->
<!-- This is dummy text so we get past IE's default error pages for responses less than 512 bytes -->
<body><textarea><c:out value="${rootCause.message}" escapeXml="true"/></textarea></body>
</html>
<%
      }
      else if (rootCause instanceof TranslatableException) {
%>
<c:out value="${rootCause.translatedMessage}" escapeXml="true"/>
<%
      }
      else {
%>
<c:out value="${rootCause.message}" escapeXml="true"/>
<%
      }
  }
  else if (statusCode != null && statusCode == 404) {
%>
<%= TranslateUtil.getInstance().getValue("Resource not found:") %> <c:out value="${requestScope['javax.servlet.error.request_uri']}" escapeXml="true"/>
<%
  }
  else {
%>
<%= TranslateUtil.getInstance().getValue("Error") %><c:out value="${requestScope['javax.servlet.error.status_code']}" escapeXml="true"/>
<%
  }
%>

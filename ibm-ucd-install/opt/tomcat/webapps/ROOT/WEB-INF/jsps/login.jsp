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
<%@page pageEncoding="UTF-8" %>
<%@page import="com.urbancode.commons.webext.util.InstalledVersion"%>
<%@page import="com.urbancode.ds.ServerConstants"%>
<%@page import="com.urbancode.air.i18n.TranslateUtil"%>

<%@taglib prefix="c"   uri="http://java.sun.com/jsp/jstl/core"%>
<%@taglib prefix="fn"  uri="http://java.sun.com/jsp/jstl/functions"%>
<%@taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt"%>
<%@taglib prefix="ah3" uri="http://www.urbancode.com/anthill3/tags" %>

<%
  String versionStr = "";
  String versionDisplayStr = "";
  try {
      InstalledVersion version = InstalledVersion.getInstance();
      versionStr = version.getVersion();
      versionDisplayStr = "v. " + versionStr;
      if ("dev".equals(versionStr)) {
        versionDisplayStr = "Development Build";
      }
  }
  catch (Throwable t) {
  }
  response.setHeader("Cache-Control", "no-cache");
  pageContext.setAttribute("webAppVersion", versionStr);
  pageContext.setAttribute("webAppDisplayVersion", versionDisplayStr);
  pageContext.setAttribute("productName", ServerConstants.PRODUCT_NAME_NORMAL);

  String loginErrorMsg = (String)pageContext.getSession().getAttribute("loginErrorMsg");
  pageContext.setAttribute("loginErrorMsg", loginErrorMsg);
%>


<!DOCTYPE html>
<html class="fullHeight">
  <head>
    <title>${productName}: <%= TranslateUtil.getInstance().getValue("Log In") %></title>

    <c:import url="/WEB-INF/jsps/snippets/importResources.jsp" />

    <c:url var="staticBase" value="/static/${fn:escapeXml(webAppVersion)}"/>

    <link rel="shortcut icon" href="${staticBase}/images/uDeploy.ico"/>
    <link rel="stylesheet" type="text/css" href="${staticBase}/css/deploy/login.css" />

    <script type="text/javascript">
    /* <![CDATA[ */
      require(["dojo/ready",
               "dojo/dom-class",
               "dijit/form/TextBox",
               "dijit/form/CheckBox",
               "dijit/form/Button"],
              function(
                      ready,
                      domClass,
                      TextBox,
                      CheckBox,
                      Button) {
        ready(function () {
            var usernameInput = new TextBox({
                name: "username"
            }, "usernameField");
            var passwordInput = new TextBox({
                name: "password",
                type: "password"
            }, "passwordField");
            var rememberMeInput = new CheckBox({
                name: "rememberMe",
                value: "true"
            }, "rememberMe");
            var submitButton = new Button({
                label: "<%= TranslateUtil.getInstance().getValue("Login") %>",
                type: "submit"
            }, "submitButton");
            domClass.add(submitButton.domNode, "idxButtonSpecial");

            document.getElementById("requestedHash").value = window.location.hash;
            usernameInput.focus();
        });
      });
    /* ]]> */
    </script>
  </head>
  <body class="loginPage">
    <div class="loginFramePositioner">
      <div class="leftside">
        <div class="loginbox">
          <h1 class="productName">UrbanCode Deploy</h1>
          <p class="productVersion">${webAppDisplayVersion}</p>

          <c:url var="authenticateUrl" value="/tasks/LoginTasks/login"/>
          <form method="post" action="${fn:escapeXml(authenticateUrl)}" autocomplete="off">
            <c:if test="${loginErrorMsg != null}">
              <div class="loginError">
                <p>
                  <span class="error">${loginErrorMsg}</span>
                </p>
              </div>
            </c:if>

            <div class="form-item">
              <label for="username" class="label"><%= TranslateUtil.getInstance().getValue("Username") %></label>
              <div id="usernameField"></div>
            </div>

            <div class="form-item">
              <label for="password" class="label"><%= TranslateUtil.getInstance().getValue("Password") %></label>
              <div id="passwordField"></div>
            </div>

            <div class="form-item checkbox-wrapper">
              <div id="rememberMe"></div>
              <label for="rememberMe" class="checkbox-label"><%= TranslateUtil.getInstance().getValue("Keep me logged in") %></label>
            </div>

            <div class="form-item loginSubmitWrapper">
              <div id="submitButton"></div>
            </div>

            <input type="hidden" name="requestedHash" value="" id="requestedHash"/>

            <div class="legal">
              <%= TranslateUtil.getInstance().getValue("&copy; Copyright 2017 &nbsp;IBM Corporation.<br/>&copy; Copyright 2018 &nbsp;HCL Technologies Ltd.") %>
            </div>
          </form>
        </div>
      </div>
      <div class="rightside">
        <div class="centered-logo">
          <img src="${staticBase}/images/deploy/urbancode.png"></img>
        </div>
      </div>
    </div>
  </body>
</html>

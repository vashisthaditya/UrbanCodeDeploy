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
<%@tag description="Builds the page content header (navigation, logo)" pageEncoding="UTF-8"%>
<%@attribute name="category" required="true" %>
<%@taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>

<c:url var="baseUrl" value="/"/>
<c:url var="logoutUrl" value="/logout"/>
<c:url var="staticBase" value="/static/${fn:escapeXml(webAppVersion)}"/>
<c:url var="helpUrl" value="${staticBase}/help/content"/>

<c:set var="sectionName" value="UNDEFINED"/>
<c:if test="${pageScope.category == 'home'}">
  <c:set var="sectionName" value="Home"/>
</c:if>
<c:if test="${pageScope.category == 'apps-suites'}">
  <c:set var="sectionName" value="Applications & Suites"/>
</c:if>
<c:if test="${pageScope.category == 'initiatives'}">
  <c:set var="sectionName" value="Initiatives"/>
</c:if>
<c:if test="${pageScope.category == 'changes'}">
  <c:set var="sectionName" value="Changes"/>
</c:if>
<c:if test="${pageScope.category == 'releases'}">
  <c:set var="sectionName" value="Releases & Plans"/>
</c:if>
<c:if test="${pageScope.category == 'deployments'}">
  <c:set var="sectionName" value="Deployments"/>
</c:if>
<c:if test="${pageScope.category == 'environments'}">
  <c:set var="sectionName" value="Environments"/>
</c:if>
<c:if test="${pageScope.category == 'statuses'}">
  <c:set var="sectionName" value="Statuses"/>
</c:if>
<c:if test="${pageScope.category == 'lifecycles'}">
  <c:set var="sectionName" value="Lifecycles"/>
</c:if>
<c:if test="${pageScope.category == 'security'}">
  <c:set var="sectionName" value="Security"/>
</c:if>
<c:if test="${pageScope.category == 'integrations'}">
  <c:set var="sectionName" value="Integrations"/>
</c:if>

<div class="inlineBlock noSelect hidden menu-content" id="headerMainMenuContent">
  <ul class="inlineBlock" id="menu-content-full-width">
    <li><a href="${baseUrl}"><span class="menu-content-icon" id="home-icon"></span>Home</a></li>
  </ul>
  <ul class="inlineBlock" id="menu-content-half-width">
    <li><a href="${baseUrl}application"><span class="menu-content-icon" id="application-icon"></span>Applications &amp; Suites</a></li>
    <li><a href="${baseUrl}initiative"><span class="menu-content-icon" id="initiative-icon"></span>Initiatives</a></li>
    <li><a href="${baseUrl}change"><span class="menu-content-icon" id="change-icon"></span>Changes</a></li>
    <li><a href="${baseUrl}release"><span class="menu-content-icon" id="release-icon"></span>Releases</a></li>
    <li><a href="${baseUrl}scheduledDeployment"><span class="menu-content-icon" id="deployment-icon"></span>Deployments</a></li>
  </ul>
  <ul class="inlineBlock" id="menu-content-half-width">
    <li><a href="${baseUrl}environment"><span class="menu-content-icon" id="environment-icon"></span>Environments</a></li>
    <li><a href="${baseUrl}status"><span class="menu-content-icon" id="status-icon"></span>Statuses</a></li>
    <li><a href="${baseUrl}lifecycleModel"><span class="menu-content-icon" id="lifecycle-icon"></span>Lifecycles</a></li>
    <li><a href="${baseUrl}security"><span class="menu-content-icon" id="security-icon"></span>Security</a></li>
    <li><a href="${baseUrl}integrationProvider"><span class="menu-content-icon" id="integration-icon"></span>Integrations</a></li>
  </ul>
</div>
  
<div class="inlineBlock noSelect page-header-placeholder">
  <div class="inlineBlock page-header">
    <div class="inlineBlock vertical-alignment-sizer"></div>
  
    <a class="inlineBlock logo" href="${baseUrl}"></a>
  
    <div class="inlineBlock header-main-menu" id="headerMainMenu">
      <div class="inlineBlock menu-button" id="headerMainMenuButton">
        <div class="inlineBlock vertical-alignment-sizer"></div>
        <c:if test="${pageScope.category != 'dashboard'}">
          <div class="inlineBlock menu-image">
            <img src="${staticBase}/images/main_menu_nav/icon-${pageScope.category}.png" />
          </div>
        </c:if>
        <div class="inlineBlock">
          ${fn:escapeXml(sectionName)}
        </div>
        <div class="inlineBlock menu-arrow"></div>
      </div>
  
    </div>
  
    <div class="inlineBlock user-links">
      <c:if test="${not empty user}">
        <div class="inlineBlock">${fn:escapeXml(user.actualName)}</div>
        <div class="inlineBlock"><a href="${helpUrl}">help</a></div>
        <div class="inlineBlock"><a href="${logoutUrl}">logout</a></div>
      </c:if>
    </div>
  </div>
</div>

<script>
  require(["dojo/ready", "dojo/dom-style", "dojo/dom-class", "dojo/mouse", "dojo/on", "dojo/dom"],
          function (ready, domStyle, domClass, mouse, on, dom) {
    ready(function () {
      var headerContainer = dom.byId("headerMainMenu")
      var headerButton = dom.byId("headerMainMenuButton")
      var headerContent = dom.byId("headerMainMenuContent")
      var headerContentToggle = true;
      
      on(headerButton, "click", function () {
        if(!!headerContentToggle) {
          domClass.add(headerContainer, "header-main-menu-expanded");
          domClass.remove(headerContent, "hidden");
        } else {
          domClass.remove(headerContainer, "header-main-menu-expanded");
          domClass.add(headerContent, "hidden");
        }
        headerContentToggle = !headerContentToggle;
      });
      
      on(headerContent, mouse.leave, function () {
        domClass.remove(headerContainer, "header-main-menu-expanded");
        domClass.add(headerContent, "hidden");
        headerContentToggle = true;
      });
    });
  });
</script>

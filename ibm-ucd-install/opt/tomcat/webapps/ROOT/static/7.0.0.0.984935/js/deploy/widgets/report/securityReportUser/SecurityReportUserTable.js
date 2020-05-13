/*
* Licensed Materials - Property of IBM* and/or HCL**
* UrbanCode Deploy
* (c) Copyright IBM Corporation 2011, 2017. All Rights Reserved.
* (c) Copyright HCL Technologies Ltd. 2018. All Rights Reserved.
*
* U.S. Government Users Restricted Rights - Use, duplication or disclosure restricted by
* GSA ADP Schedule Contract with IBM Corp.
*
* * Trademark of International Business Machines
* ** Trademark of HCL Technologies Limited
*/
define([
        "dojo/_base/declare",
        "dojo/_base/array",
        "dijit/_Widget",
        "dijit/_TemplatedMixin",
        "deploy/widgets/report/ReportTable",
        "dojox/html/entities",
        "dojo/dom-construct",
        "dojo/on",
        "js/webext/widgets/Dialog",
        "deploy/widgets/security/EditUser",
        "deploy/widgets/security/SetUserPassword",
        "dojo/html"
        ],
function(
        declare,
        array,
        _Widget,
        _TemplatedMixin,
        ReportTable,
        entities,
        domConstruct,
        on,
        Dialog,
        EditUser,
        SetUserPassword,
        html
) {

/**
 *
 */
   return declare(
       [ReportTable],
       {
           reportRestUrlBase: null,
           reportResultTable: null,

           selectableColumns: true,

           constructor: function() {
               var t = this;
               this.reportRestUrlBase = bootstrap.restUrl + "report/";
           },

           reportType: 'com.urbancode.ds.subsys.report.domain.security_report.user.SecurityReportUser',

           formatters: {
               multiNameFormatter : function(item, value) {
                   var div = dojo.create("div");
                   var values = value ? value.split(",") :  null;

                   array.forEach(values, function(it, index) {
                       if (index !== 0) {
                           dojo.create('br', {}, div);
                       }
                       dojo.create('span', {innerHTML:entities.encode(it)}, div);
                   });
                   return div;
               }
           },

           getReportResultLayout: function() {
               var self = this;
               var reportResultLayout = [
                   {
                       name: i18n("User"),
                       field: "name",
                       getRawValue: function(item) {
                           return item.name;
                       },
                       orderField: "name"
                   },{
                       name: i18n("Name"),
                       field: "actualName",
                       getRawValue: function(item) {
                           return item.actualName;
                       },
                       orderField: "actualName"
                   },{
                       name: i18n("Email"),
                       field: "email",
                       orderField: "email",
                       getRawValue: function(item) {
                           return item.email;
                       }
                   },{
                       name: i18n("Authentication Realm"),
                       field: "authRealm",
                       getRawValue: function(item) {
                           return i18n(item.authRealm);
                       },
                       formatter: function(item, value) {
                           return i18n(value);
                       },
                       orderField: "authRealm"
                   },{
                       name: i18n("Groups"),
                       field: "groups",
                       getRawValue: function(item) {
                           return item.groups;
                       }
                   }
               ];

               return reportResultLayout;
           }
       }
   );
});
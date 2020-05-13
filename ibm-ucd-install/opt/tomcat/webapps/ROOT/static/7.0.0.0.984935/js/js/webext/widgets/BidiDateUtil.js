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
        "dojo/date",
        "dojo/date/locale",
        "dojox/date/islamic",
        "dojox/date/islamic/Date",
        "dojox/date/islamic/locale",
        "dojox/date/hebrew",
        "dojox/date/hebrew/Date",
        "dojox/date/hebrew/locale"
        ],
function(
        dg,
        gl,
        di,
        did,
        il,
        dh,
        dhd,
        hl){

        var BidiDateUtil = {
                getCalendar: function(){
                    return util.getCalendar();
                },
                getDatePackage: function(){
                    var datePkg = "";
                    if (this.isHijri()){
                        datePkg = "dojox.date.islamic";
                    }
                    else if (this.isHebrew()){
                        datePkg = "dojox.date.hebrew";
                    }
                    return datePkg;
                },
                getDateClassObj: function(){
                    var dateClassObj = dg.Date;
                    if (this.isHijri()){
                        dateClassObj = did;
                    }
                    else if (this.isHebrew()){
                        dateClassObj = dhd;
                    }
                    return dateClassObj;
                },
                isHijri: function(){
                    if (this.getCalendar() === "Hijri"){
                        return true;
                    }
                    return false;
                },
                isHebrew: function(){
                    if (this.getCalendar() === "Hebrew"){
                        return true;
                    }
                    return false;
                },
                isGregorian:function(){
                    if (!this.isHebrew() && !this.isHijri()){
                        return true;
                    }
                    return false;
                },
                fromGregorian: function(d){
                    var dateM = new Date(d);
                    if (this.isHijri()){
                        dateM = (new did()).fromGregorian(dateM);
                    }
                    else if (this.isHebrew()){
                        dateM = (new dhd()).fromGregorian(d);
                    }
                    return dateM;
                },
                getLocale: function(){
                    var localeModule = gl;
                    if (this.isHijri()){
                        localeModule = il;
                    }
                    else if (this.isHebrew()){
                        localeModule = hl;
                    }
                    return localeModule;
                },
                getNewDate: function(val){
                    if (val){
                        if (this.isHijri()){
                            val = new did(val);
                        }
                        else if (this.isHebrew()){
                            val = new dhd(val);
                        }
                        else{
                            val = new Date(val);
                        }
                    }
                    else{
                        if (this.isHijri()){
                            val = new did();
                        }
                        else if (this.isHebrew()){
                            val = new dhd();
                        }
                        else{
                            val = new Date();
                        }
                    }
                    return val;
                },
                formatBidiDate: function(d, ops){
                    var formattedDate, dateM = new Date(d);
                    if (this.isHijri()){
                        dateM = d instanceof did? d: this.fromGregorian(d);
                        formattedDate = il.format(dateM, ops);
                    }
                    else if (this.isHebrew()){
                        dateM = d instanceof dhd? d: this.fromGregorian(d);
                        formattedDate = hl.format(dateM, ops);
                    }
                    else{
                        formattedDate = gl.format(dateM,ops);
                    }
                    return formattedDate;
                }
            };

        return BidiDateUtil;
});
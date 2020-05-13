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
        "dojo/has",
        "dojo/_base/kernel",
        "dojo/dom-construct"
    ],
    function(has, kernel, domConstruct) {
        var goTo = (function(){

            // IE < 9, create an 'a' element and programmatically click it.
            if (has("ie") < 9) {
                return function(url, win) {
                    var w = win || window;
                    var a = domConstruct.create("a", {
                        "href": url,
                        "style": "display-none"
                    });
                    domConstruct.place(a, w.document.body);
                    a.click();
                };
            }

            // this browser can do a basic url location manipulation while preserving referrer.
            return function (url, win) {
                 (win || window).location = url;
            };
        }());

        return goTo;
    });

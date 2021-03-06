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
/*global define */

define([
        "dijit/_Widget",
        "dojo/_base/declare",
        "js/util/blocker/_BlockerMixin"
        ],
function(
        _Widget,
        declare,
        _BlockerMixin
) {
    /**
     * a stub for a blocker element
     */
    return declare('deploy.widgets.log.Blocker',  [_BlockerMixin, _Widget], {
    });
});

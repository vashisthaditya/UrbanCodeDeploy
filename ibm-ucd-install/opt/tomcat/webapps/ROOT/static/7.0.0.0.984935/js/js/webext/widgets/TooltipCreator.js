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
    "dojo/_base/declare",
    "dojo/dom-construct",
	"dijit/Tooltip"
    ],
function(
    declare,
    domConstruct,
    Tooltip
) {
return declare([], {
    createTooltip: function(container, label) {
        var helpCell = domConstruct.create("div", {
            "class": "labelsAndValues-helpCell"
        }, container);

        var helpToolTip = new Tooltip({
            connectId: [helpCell],
            label: label,
            showDelay: 100,
            position: ["after", "above", "below", "before"]
        });
    }	
});
});

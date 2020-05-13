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
/*global define, require */
define([
        "dojo/_base/declare",
        "dojo/Stateful",
        "dojo/store/Memory",
        "dojo/store/Observable",
        "deploy/widgets/firstDayWizard/DataModel"
        ],
function(
        declare,
        Stateful,
        Memory,
        Observable,
        DataModel
) {
    /**
     * Data model for first-day wizard's application.
     */
    return declare([DataModel], {
        props: {
            name: undefined,
            description: undefined
        }
    });
});

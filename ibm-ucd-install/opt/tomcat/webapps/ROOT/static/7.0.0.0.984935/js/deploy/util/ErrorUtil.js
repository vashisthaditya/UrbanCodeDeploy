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
        "js/webext/widgets/Dialog"
        ],
  function(
        Dialog
  ) {

    return {
      showErrorDialog : function(dialogTitle, errorMessage) {
          var errorDialog = new Dialog({
                               title: dialogTitle,
                               content: errorMessage,
                               closable: true,
                               draggable: true
                          });
          errorDialog.show();
      }
    };

});

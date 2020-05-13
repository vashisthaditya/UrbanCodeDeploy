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
        "dojo/on",
        "dojo/request/xhr",
        "js/webext/widgets/Dialog",
        "js/webext/widgets/GenericConfirm",
        "js/webext/widgets/Alert",
        "deploy/widgets/process/RequiredCommentForm"],

function(
        declare,
        domConstruct,
        on,
        xhr,
        Dialog,
        GenericConfirm,
        Alert,
        RequiredCommentForm) {

    return declare(
        [],
        {

            /**
             * Convert a versioned configuration repository path to a string we can pass through a URL
             * (encodes for URI, and replaces / with &)
             */
            encodeVersionedPath: function(arg) {
                return !!arg ? encodeURIComponent(arg.replace(/\//g, "&")).replace(/%2F/g, "/") : arg;
            },

            /**
             * Produce a div containing controls for versioned objects (to navigate between versions, etc)
             *
             * Arguments expected:
             *  persistent / The object being displayed.
             *               Expects that this object has the following properties:
             *      version: current version
             *      versionCount: total number of versions
             *      path: VC path for this persistent
             *  generateHref / Function to produce the page hash to navigate to when clicking an arrow to
             *                 get to a specific version of the persistent. Takes the version as an argument.
             */
            generateVersionControls: function(persistent, generateHref) {
                var result = domConstruct.create("div", {});
                
                if (persistent.version > 1) {
                    var backLink = domConstruct.create("a", {
                        "href": "#"+generateHref(persistent.version-1)
                    }, result);
                    domConstruct.create("div", {
                        className: "arrow_backwards inlineBlock"
                    }, backLink);
                }
                else {
                    domConstruct.create("div", {
                        className: "arrow_backwards_grey inlineBlock"
                    }, result);
                }
                
                domConstruct.create("span", {
                    "innerHTML": "&nbsp;&nbsp;&nbsp;"
                }, result);
                
    
                if (persistent.version < persistent.versionCount) {
                    var forwardLink = domConstruct.create("a", {
                        "href": "#"+generateHref(persistent.version+1)
                    }, result);
                    domConstruct.create("span", {
                        "innerHTML": "&nbsp;&nbsp;"
                    }, result);
                    var fastForwardLink = domConstruct.create("a", {
                        "href": "#"+generateHref(persistent.versionCount)
                    }, result);

                    domConstruct.create("div", {
                        className: "arrow_forward inlineBlock"
                    }, forwardLink);
                    domConstruct.create("div", {
                        className: "arrow_fastForward inlineBlock"
                    }, fastForwardLink);

                    if (!persistent.security || persistent.security["Edit Basic Settings"]) {
                        var linkContainer = domConstruct.create("div", {
                            style: {
                                paddingTop: "5px"
                            }
                        }, result);
                        var resetLink = domConstruct.create("a", {
                            "class": "linkPointer",
                            "innerHTML": i18n("Reset Latest to This Version")
                        }, linkContainer);
                        on(resetLink, "click", function() {
                            var resetConfirm = new GenericConfirm({
                                "message": i18n("Are you sure you want to reset to version %s?",
                                        persistent.version),
                                "action": function() {
                                    if (config.data.systemConfiguration.requiresCommitComment) {
                                        var commentDialog = new Dialog({
                                            title: i18n("Process Change Comment"),
                                            closable: true
                                        });
                                        var commentForm = new RequiredCommentForm({
                                            callback: function(data) {
                                                var json = {};
                                                if (data.comment) {
                                                    json.comment = data.comment;
                                                }
                                                if (data) {
                                                    xhr.put(bootstrap.restUrl+"vc/persistent/"+util.vc.encodeVersionedPath(persistent.path)+"."+persistent.version+"/setAsLatestWithComment", {
                                                        data: JSON.stringify(json),
                                                        headers: {
                                                            'Content-Type': 'application/json'
                                                        }
                                                    }).then(function(data) {
                                                        navBar.setHash(generateHref(persistent.versionCount+1), false, true);
                                                    }, function(error) {
                                                        var errorAlert = new Alert({
                                                            message: i18n("Error: %s",util.escape(data.responseText))
                                                        });
                                                    });
                                                }
                                                commentDialog.hide();
                                                commentDialog.destroy();
                                            }
                                        });
                                        commentForm.placeAt(commentDialog);
                                        commentDialog.show();
                                    }
                                    else {
                                        dojo.xhrPut({
                                            url: bootstrap.restUrl+"vc/persistent/"+util.vc.encodeVersionedPath(persistent.path)+"."+persistent.version+"/setAsLatest",
                                            load: function() {
                                                navBar.setHash(generateHref(persistent.versionCount+1), false, true);
                                            },
                                            error: function(data) {
                                                var errorAlert = new Alert({
                                                    message: i18n("Error: %s",util.escape(data.responseText))
                                                });
                                            }
                                        });
                                    }
                                }
                            });
                        });
                    }
                }
                else {
                    domConstruct.create("div", {
                        className: "arrow_forward_grey inlineBlock"
                    }, result);
                    domConstruct.create("span", {
                        "innerHTML": "&nbsp;&nbsp;"
                    }, result);
                    domConstruct.create("div", {
                        className: "arrow_fastForward_grey inlineBlock"
                    }, result);
                }
                
                return result;
            }
        }
    );
});

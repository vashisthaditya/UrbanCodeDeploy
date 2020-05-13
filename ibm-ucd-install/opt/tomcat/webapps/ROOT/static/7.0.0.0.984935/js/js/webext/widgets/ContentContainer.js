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
define(["dojo/_base/declare",
        "dojo/dom-attr",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "js/webext/widgets/Util"],
        function (declare, domAttr, domClass, domConstruct, Widget, TemplatedMixin) {
    
        /**
         * A simple widget to show the standard content container dom structure around some block of
         * page content. Must mirror the contentContainer JSP tag. 
         */


        /**
         * Arguments:
         * {
         *     header: String | Widget | domNode
         *     subheader: String | Widget | domNode
         *
         * }
         *
         * Notes:  the attachpoint "externalAttach" is intended to be used as a hook for other widgets to add content to the header probably in inlineBlock form
         *
         */
        return declare("app/widgets/ContentContainer",
                [Widget, TemplatedMixin], {
            
            header: null,
            subheader: null,
            contentId: null,
            templateString: 
                '<div class="content-container">' +
                    '<div class="container-header-box">' +
                        '<div class="header-container inlineBlock" data-dojo-attach-point="headerContainerAttach">' +
                            '<div data-dojo-attach-point="headerAttach" class="container-header"></div>' +
                            '<div data-dojo-attach-point="subheaderAttach" class="container-subheader"></div>' +
                        '</div>' +
                        '<div class="external-container inlineBlock">' +
                            '<div data-dojo-attach-point="externalAttach" class="external-space"></div>' +
                        '</div>' +
                    '</div>' +
                    '<div data-dojo-attach-point="containerAttach" class="container-content"></div>' +
                    '<div class="container-footer"></div>' +
                '</div>',
                
            /**
             * 
             */
            postCreate: function() {
                this.inherited(arguments);
                
                if (!!this.header) {
                    if (this.headerplaceAt instanceof Function) {
                        var headerDiv = domConstruct.create('div',{},this.headerAttach);
                        this.header.placeAt(headerDiv);
                    } else if (this.header.hasOwnProperty('childNodes')) {
                        domConstruct.place(this.header, this.headerAttach);
                    } else {
                        this.headerAttach.innerHTML = '<span class="header">' + this.header.escape() + '</span>';
                    }
                }

                if (!!this.subheader) {
                    if (this.subheader.placeAt instanceof Function) {
                        var subheaderDiv = domConstruct.create('div',{},this.subheaderAttach);
                        this.subheader.placeAt(subheaderDiv);
                    } else if (this.subheader.childNodes) {
                        domConstruct.place(this.subheader, this.subheaderAttach);
                    } else {
                        this.subheaderAttach.innerHTML = '<span class="header">' + this.subheader.escape() + '</span>';
                    }
                }
                // if there is neither a header or subheader, hide the header container, leaving the externalAttach available
                if(!this.headerAttach && !this.subheaderAttach) {
                    domClass.add(this.headerContainerAttach, "hidden");
                }

                if(!!this.contentId) {
                    domAttr.set(this.domNode, "data-container-id", this.contentId);
                }
            }
        }
    );
});

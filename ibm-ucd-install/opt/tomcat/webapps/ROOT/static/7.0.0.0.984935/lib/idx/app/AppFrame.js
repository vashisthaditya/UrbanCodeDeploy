//>>built
require({cache:{"url:idx/app/templates/AppFrame.html":'<div class="${baseClass}">\r\n<div class="${baseClass}Header" data-dojo-attach-point="headerNode"></div>\r\n<div class="${baseClass}Left" data-dojo-attach-point="leftNode"></div>\r\n<div class="${baseClass}Center" data-dojo-attach-point="centerNode"></div>\r\n<div class="${baseClass}Right" data-dojo-attach-point="rightNode"></div>\r\n<div class="${baseClass}Footer" data-dojo-attach-point="footerNode"></div>\r\n</div>\r\n'}});
define("idx/app/AppFrame","dojo/_base/declare,dijit/layout/_LayoutWidget,dijit/_TemplatedMixin,./_A11yAreaProvider,dojo/_base/array,dojo/dom-construct,dojo/dom-attr,dojo/dom-geometry,dojo/query,../a11y,../util,../border/BorderDesign,../border/BorderLayout,dojo/text!./templates/AppFrame.html,dojo/NodeList-dom".split(","),function(k,l,m,n,o,h,i,g,p,u,q,j,r,s){var t=p.NodeList;return k("idx.app.AppFrame",[l,m,n],{baseClass:"idxAppFrame",templateString:s,resources:null,constructor:function(a,b){this.ctorArgs=
a;this.domNode=b},postMixInProperties:function(){this.inherited(arguments);this.set(this.ctorArgs)},_fillContent:function(a){this.isLeftToRight()?(this.leaderNode=this.leftNode,this.trailerNode=this.rightNode):(this.leaderNode=this.rightNode,this.trailerNode=this.leftNode);this.nodeLookup={header:this.headerNode,top:this.headerNode,left:this.leftNode,leader:this.leaderNode,center:this.centerNode,trailer:this.trailerNode,right:this.rightNode,footer:this.footerNode,bottom:this.footerNode};this.marqueeNode=
this.nodeLookup[this.cssOptions.marquee];this.bodyNode=this.nodeLookup[this.cssOptions.body];if(!this.marqueeNode)this.marqueeNode=this.headerNode;if(!this.bodyNode)this.bodyNode=this.centerNode;this.marqueeRegion=h.create("div",{"class":"idxAppFrameMarquee"},this.marqueeNode);this.bodyRegion=h.create("div",{"class":"idxAppFrameBody"},this.bodyNode);this.regionLookup={marquee:this.marqueeRegion,body:this.bodyRegion};this.containerNode=this.bodyRegion;i.set(this.marqueeRegion,"id",this.id+"_banner");
i.set(this.bodyRegion,"id",this.id+"_mainContent");this.inherited(arguments)},getMarqueeChildren:function(){return this.marqueeRegion?dijit.findWidgets(this.marqueeRegion):[]},_getA11yMainNode:function(){return this.bodyRegion},_getA11yBannerNode:function(){return this.marqueeRegion},buildRendering:function(){this.cssOptions=q.getCSSOptions(this.baseClass+"Options",this.domNode);if(!this.cssOptions)this.cssOptions={marquee:"header",body:"center",marqueeSizing:"auto",borderDesign:"headline"};this.marqueeSizing=
this.cssOptions.marqueeSizing;if(!this.marqueeSizing)this.marqueeSizing="auto";if("auto"!=this.marqueeSizing&&"fixed"!=this.marqueeSizing)this.marqueeSizing="auto";this.borderDesign=this.cssOptions.borderDesign;if(!this.borderDesign)this.borderDesign="headline";var a=j.create(this.borderDesign);this.borderDesign=null==a?new j("headline"):a;this.inherited(arguments)},postCreate:function(){this.inherited(arguments)},startup:function(){if(!this._started)this.borderLayout=new r({frameNode:this.domNode,
topNode:this.headerNode,bottomNode:this.footerNode,leftNode:this.leftNode,rightNode:this.rightNode,centerNode:this.centerNode,design:this.borderDesign,leftToRight:this.isLeftToRight()}),this.inherited(arguments),o.forEach(this.getChildren(),this._setupChild,this),this._appFrameStarted=!0,this.a11yStartup(),this.resize()},layout:function(){this.borderLayout.layout()},addChild:function(a,b){this.inherited(arguments);this.resize()},_setupChild:function(a){this.inherited(arguments);var b=a.region;if(null==
b||0==b.length)b="body";b=this.regionLookup[b];if(null==b)b=this.bodyRegion;b!=this.bodyRegion&&((new t(a.domNode)).orphan(),h.place(a.domNode,b,"last"))},resize:function(a,b){if(this._appFrameStarted){this.inherited(arguments);this.borderLayout.layout();for(var c=this.getMarqueeChildren(),d=0;d<c.length;d++){var e=c[d];if(e.resize){if(1==c.length)var f=g.getContentBox(this.marqueeRegion),a={w:f.w,h:f.h};else a=a||g.getMarginBox(e.domNode);e.resize(a,b)}}c=this.getChildren();for(d=0;d<c.length;d++)e=
c[d],e.resize&&(1==c.length?(f=g.getContentBox(this.containerNode),a={w:f.w,h:f.h}):a=a||g.getMarginBox(e.domNode),e.resize(a,b))}}})});
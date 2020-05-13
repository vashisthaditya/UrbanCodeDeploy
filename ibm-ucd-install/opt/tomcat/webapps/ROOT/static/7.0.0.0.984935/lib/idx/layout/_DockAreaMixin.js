//>>built
define("idx/layout/_DockAreaMixin","dojo/_base/declare,dojo/_base/lang,dojo/_base/array,dojo/_base/window,dojo/_base/html,dojo/_base/event,dojo/_base/connect,dojo/keys,dijit/registry,dijit/layout/_LayoutWidget,dijit/layout/ContentPane,idx/html,idx/util".split(","),function(f,g,h,k,c,l,m,n,o,i,j){return f("idx.layout._DockAreaMixin",[i],{collapseEmpty:!0,postMixInProperties:function(){this.inherited(arguments);this._dim="top"==this.region||"bottom"==this.region?"x":"y"},postCreate:function(){this.inherited(arguments);
c.addClass(this.domNode,"idxDockArea");"y"==this._dim?c.addClass(this.domNode,"idxDockAreaVertical"):c.addClass(this.domNode,"idxDockAreaHorizontal")},startup:function(){if(!this._started)this.inherited(arguments),this._mockPane=new j({"class":"idxDockAreaMockPane"})},destroy:function(){this.inherited(arguments);this._mockPane.destroy()},_computeBounds:function(){var a=c.position(this.domNode);this._bounds=[];h.forEach(this.getChildren(),g.hitch(this,function(b){b=c.position(b.domNode);this._bounds.push({x:b.x-
a.x+b.w/2,y:b.y-a.y+b.h/2})}))},dock:function(a,b){a.beforeDock();var d=this._getInsertIndex(b);a.set("dockArea",this.region);c.style(a.domNode,{left:"",top:""});this.addChild(a,d);a.onDock(this.region);this.resetDockArea();this.layout();a.focusNode&&a.focusNode.focus()},showDockArea:function(a,b){var d=this._getInsertIndex(a);this.isDockable()?this.updateDockArea(d):(this._computeBounds(),d=this._getInsertIndex(a),c.addClass(this.domNode,"idxDockAreaDockable"),this.addChild(this._mockPane,d),this._resizeMockPane(b),
this.layout())},_resizeMockPane:function(a){a=c.marginBox(a.domNode);c.style(this._mockPane.domNode,{height:a.h+"px",width:a.w+"px"})},resetDockArea:function(){c.removeClass(this.domNode,"idxDockAreaDockable");if(this._mockPane)try{this.removeChild(this._mockPane)}catch(a){}this.layout()},updateDockArea:function(a){this.getIndexOfChild(this._mockPane)!=a&&(this.removeChild(this._mockPane),this.addChild(this._mockPane,a),this.layout())},isDockable:function(){return c.hasClass(this.domNode,"idxDockAreaDockable")},
_getInsertIndex:function(a){var b=c.position(this.domNode),a={x:a.x-b.x,y:a.y-b.y},b=this._bounds;if(!b)return 0;for(var d=b.length,e=0;e<d;e++)if(a[this._dim]<b[e][this._dim])return e;return d}})});
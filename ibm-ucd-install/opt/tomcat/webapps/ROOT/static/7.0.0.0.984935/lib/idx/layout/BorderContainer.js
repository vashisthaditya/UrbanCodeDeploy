//>>built
require({cache:{"url:idx/layout/templates/_ToggleSplitter.html":'<div class="idxSplitter dijitSplitter"\r\n\tdojoAttachEvent="onkeypress:_onKeyPress,onmousedown:_startDrag,onmouseenter:_onMouse,onmouseleave:_onMouse"\r\n\ttabIndex="-1"\r\n\twaiRole="separator">\r\n\t<div dojoAttachPoint="thumbContainer" class="idxSplitterThumbOuter">\r\n\t\t<div dojoAttachPoint="bartop" class="idxSplitterBarTop"></div>\r\n\t\t<div dojoAttachPoint="thumb" role="button" class="dijitSplitterThumb idxSplitterThumbCollapse" tabIndex="0"></div>\r\n\t\t<div dojoAttachPoint="thumb2" role="button" class="dijitSplitterThumb idxSplitterThumbExpand" tabIndex="0"></div>\r\n\t\t<div dojoAttachPoint="barbottom" class="idxSplitterBarBottom"></div>\r\n\t</div>\r\n</div>\r\n'}});
define("idx/layout/BorderContainer","dojo/_base/declare,dojo/_base/lang,dojo/_base/array,dojo/_base/html,dojo/_base/event,dojo/keys,dojo/dom-geometry,dijit/_base/wai,dijit/layout/BorderContainer,dijit/_CssStateMixin,dijit/_Widget,idx/resources,idx/util,dojo/text!./templates/_ToggleSplitter.html,dojo/i18n!../nls/base,dojo/i18n!./nls/base,dojo/i18n!./nls/BorderContainer".split(","),function(e,f,i,c,j,d,k,l,g,m,n,p,q,r){var h=e("idx.layout.BorderContainer",[g],{_splitterClass:"idx.layout._Splitter",
_toggleSplitterClass:"idx.layout._ToggleSplitter",_locked:!1,liveSplitters:!1,toggleable:!0,_setToggleableAttr:function(a){(this.toggleable=a)?c.addClass(this.domNode,this.idxBaseClass+"Toggle"):c.removeClass(this.domNode,this.idxBaseClass+"Toggle")},toggleTitles:null,_resizeHandle:null,delayResize:!0,idxBaseClass:"idxBorderContainer",postMixInProperties:function(){if(this.toggleable)this._splitterClass=this._toggleSplitterClass;var a=p.getResources("idx/layout/BorderContainer",this.lang);this.toggleTitles=
{expand:a.toggleTitleExpand,collapse:a.toggleTitleCollapse,restore:a.toggleTitleRestore};this.inherited(arguments)},buildRendering:function(){this.inherited(arguments);this._supportingWidgets=[]},resize:function(a,b){var c=q.isIE;this.delayResize&&!(c&&8>=c)?(clearTimeout(this._resizeHandle),this._resizeHandle=setTimeout(f.hitch(this,function(){this._asynchResize(a,b)}),100)):this._asynchResize(a,b)},_asynchResize:function(a,b){this.domNode&&g.prototype.resize.apply(this,arguments)},_setupChild:function(a){this.inherited(arguments);
a.get("splitter")&&!a.get("open")&&this.collapse(a.get("region"))},collapse:function(a){this.toggleable&&a&&this.getSplitter(a)&&(a=this.getSplitter(a))&&a._collapse&&a._collapse()},expand:function(a){if(this.toggleable){if(!a||""==a)a="center";var b=this.getChildren();i.forEach(b,function(b){var b=b.get("region"),c=this.getSplitter(b);b!=a&&c&&c._collapse&&c._collapse()},this);"center"!=a&&(b=this.getSplitter(a))&&b._expand&&b._expand()}},restore:function(a){if(this.toggleable){var b=this.getChildren();
i.forEach(b,function(b){b=b.get("region");if(!a||a==b)(b=this.getSplitter(b))&&b._restore&&b._restore()},this)}},onDragStart:function(){},onDragEnd:function(){},onPanelOpen:function(){},onPanelClose:function(){},lock:function(){if(this.toggleable)this._locked=!0,c.addClass(this.domNode,"idxBorderContainerLocked")},unlock:function(){if(this.toggleable)this._locked=!1,c.removeClass(this.domNode,"idxBorderContainerLocked")}}),o=e("idx.layout._Splitter",[g._Splitter,m],{_onKeyPress:function(a){var b=
this.horizontal;switch(a.charOrCode){case b?d.UP_ARROW:d.LEFT_ARROW:if(this.container._locked){j.stop(a);return}break;case b?d.DOWN_ARROW:d.RIGHT_ARROW:if(this.container._locked){j.stop(a);return}}this.inherited(arguments)}}),e=e("idx.layout._ToggleSplitter",[o,m],{templateString:r,state:"",position:"",_paneSize:0,_styleAttr:"",_resizable:!0,_snap:!1,_snapSize:40,expandThumbMsg:"",collapseThumbMsg:"",baseClass:"idxSplitter",cssStateNodes:{thumb:"idxSplitterThumbCollapse",thumb2:"idxSplitterThumbExpand"},
attributeMap:f.delegate(n.prototype.attributeMap,{expandThumbMsg:{node:"thumb2",type:"attribute",attribute:"title"},collapseThumbMsg:{node:"thumb",type:"attribute",attribute:"title"}}),postCreate:function(){this.inherited(arguments);c.addClass(this.domNode,"idxSplitter"+(this.horizontal?"H":"V"));!0===this.child.get("bidiToggle")&&(c.addClass(this.domNode,"idxSplitterBidiToggle"),c.addClass(this.domNode,"idxSplitterBidiToggle"+(this.horizontal?"H":"V")));this._styleAttr=this.horizontal?"height":"width";
this.connect(this.thumb,"onclick","_toggle");this.connect(this.thumb,"onkeyup","_onThumbKey");this.connect(this.thumb2,"onclick","_toggleExpand");this.connect(this.thumb2,"onkeyup","_onThumbExpandKey");this.connect(this.container,"layout","_positionThumb");if("true"===this.child.get("fixed"))this._resizable=!1,c.addClass(this.domNode,"idxSplitterNoResize");if("true"===this.child.get("snap"))this._snap=!0;var a;if((a=this.child.get("region"))&&0!=a.length)a=a.toLowerCase(),"leading"==a?a=!this.isLeftToRight()?
"right":"left":"trailing"==a&&(a=!this.isLeftToRight()?"left":"right"),a=a.charAt(0).toUpperCase()+a.substring(1);this.position=a;this.set("state","Normal");this.thumbTitles=this.container.toggleTitles;this._updateThumbTitles()},_setStateAttr:function(a){this.state=this.position+a;this._setStateClass();l.setWaiState(this.thumb,"pressed","Collapsed"==a);l.setWaiState(this.thumb2,"pressed","Expanded"==a)},_getStateAttr:function(){return this.state.substring(this.position.length)},_positionThumb:function(){var a=
this.horizontal?"w":"h",a=k.getMarginBox(this.domNode)[a]/2-k.getMarginBox(this.thumbContainer)[a]/2,a=a+"px",b=this.isLeftToRight()?"left":"right";c.style(this.thumbContainer,this.horizontal?b:"top",a)},_onThumbKey:function(a){a=a.keyCode;(a==d.SPACE||a==d.ENTER)&&this._toggle()},_toggle:function(){this.container._locked||("Collapsed"==this.get("state")?this._restore():this._collapse())},_toggleExpand:function(){this.container._locked||("Expanded"==this.get("state")?this._restore():this._expand())},
_onThumbExpandKey:function(a){a=a.keyCode;(a==d.SPACE||a==d.ENTER)&&this._toggleExpand()},_restore:function(){"Normal"!=this.get("state")&&(this.child&&this.child.set("open",!0),c.style(this.child.domNode,this._styleAttr,this._paneSize+"px"),this.container.layout(),this.set("state","Normal"),c.style(this.domNode,"cursor",""),this.container.onPanelOpen(this.region),this._updateThumbTitles())},_collapse:function(a){var b=this.get("state");if("Collapsed"!=b){if(a)this._paneSize=a;else if("Normal"==b)this._paneSize=
c.style(this.child.domNode,this._styleAttr);c.style(this.child.domNode,this._styleAttr,"0px");this.container.layout();this.set("state","Collapsed");c.style(this.domNode,"cursor","default");this.container.onPanelClose(this.region);this._updateThumbTitles()}},_expand:function(){var a=this.get("state");if("Expanded"!=a){this.child&&this.child.set("open",!0);if("Normal"==a)this._paneSize=c.style(this.child.domNode,this._styleAttr);var b=this._computeMaxSize();c.style(this.child.domNode,this._styleAttr,
b+"px");this.set("state","Expanded");this.container.layout();if("Collapsed"==a)this.container.onPanelOpen(this.region);this._updateThumbTitles()}},_updateThumbTitles:function(){var a=this.get("state"),b=this.thumbTitles;"Normal"==a?(this.set("expandThumbMsg",b.expand),this.set("collapseThumbMsg",b.collapse)):"Expanded"==a?(this.set("expandThumbMsg",b.restore),this.set("collapseThumbMsg",b.collapse)):"Collapsed"==a&&(this.set("expandThumbMsg",b.expand),this.set("collapseThumbMsg",b.restore))},_startDrag:function(a){var b=
a.target;if(!(b==this.thumb||b==this.thumb2))if(!("Normal"!=this.get("state")||this.container._locked||!this._resizable))this._startSize=c.style(this.child.domNode,this._styleAttr),this.inherited(arguments),this.container.onDragStart(this.region)},_stopDrag:function(){this.inherited(arguments);c.style(this.child.domNode,this._styleAttr)<=this._snapSize?this._collapse(this._startSize):this.container.layout();delete this._startSize;this.container.onDragEnd(this.region)},_doSnap:function(){}});f.extend(n,
{fixed:!1,bidiToggle:!1,snap:!1,open:!0});h._ToggleSplitter=e;h._Splitter=o;return f.getObject("idx.oneui.layout",!0).ToggleBorderContainer=h});
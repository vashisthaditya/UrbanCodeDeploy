//>>built
require({cache:{"url:idx/form/templates/CheckBoxList.html":'<div class="dijit dijitReset dijitInline dijitLeft idxComposite idxNoOutline" id="widget_${id}" tabIndex="-1"\r\n\t><div class="idxLabel"><span class="idxRequiredIcon">*&nbsp;</span><label dojoAttachPoint="compLabelNode"></label></div\r\n\t><div dojoAttachPoint="stateNode, oneuiBaseNode" role="group" class="idxCompContainer idxNoOutline"\r\n\t\t><input type="hidden" dojoAttachPoint="focusNode, valueNode" class="dijitReset"></input\r\n\t\t><div dojoAttachPoint="containerNode"></div\r\n\t\t><div class="dijitReset dijitValidationContainer dijitInline" dojoAttachPoint="iconNode"\r\n\t\t\t><div class="dijitValidationIcon"><input class="dijitReset dijitInputField dijitValidationInner"\r\n\t\t\t\tvalue="&#935; " type="text" tabIndex="-1" readonly="readonly" role="presentation"\r\n\t\t/></div></div\r\n\t></div\r\n></div>'}});
define("idx/form/CheckBoxList","dojo/_base/declare,dojo/_base/lang,dojo/_base/array,dojo/_base/sniff,dojo/dom-attr,dojo/dom-class,dojo/dom-style,dijit/form/_FormSelectWidget,dijit/_Container,./_CssStateMixin,./_CompositeMixin,./_ValidationMixin,./_InputListMixin,./_CheckBoxListItem,idx/widget/HoverHelpTooltip,dojo/text!./templates/CheckBoxList.html".split(","),function(d,e,f,c,g,h,i,j,k,l,m,n,o,p,r,q){return e.getObject("idx.oneui.form",!0).CheckBoxList=d("idx.form.CheckBoxList",[j,k,l,m,n,o],{templateString:q,
instantValidate:!0,baseClass:"idxCheckBoxListWrap",oneuiBaseClass:"idxCheckBoxList",multiple:!0,_addOptionItem:function(a){var b=new p({_inputId:this.id+"_CheckItem"+f.indexOf(this.options,a),option:a,disabled:a.disabled||this.disabled||!1,readOnly:a.readOnly||this.readOnly||!1,parent:this});h.toggle(b.domNode,"dijitInline","vertical"!=this.groupAlignment);this.addChild(b);7<c("ie")&&!c("quirks")&&this._relayout(this.domNode);this.onAfterAddOptionItem(b,a)},_setNameAttr:function(a){this._set("name",
a);g.set(this.valueNode,"name",a)},_onBlur:function(a){this.mouseFocus=!1;this.inherited(arguments)},displayMessage:function(a,b){this.messageTooltip.set("label",a);a&&this.focused||b?this.messageTooltip.open("hidden"==i.get(this.iconNode,"visibility")?this.oneuiBaseNode:this.iconNode):this.messageTooltip.close()},_setDisabledAttr:function(){this.inherited(arguments);this._refreshState()}})});
//>>built
require({cache:{"url:idx/form/templates/DropDownBox.html":'<div id="widget_${id}" class="dijitInline dijitReset dijitLeft idxComposite"\r\n\t><div class="idxLabel dijitInline dijitHidden"><span class="idxRequiredIcon">*&nbsp</span><label for="${id}" dojoAttachPoint="compLabelNode"></label></div\r\n\t><div class="dijitInline"\r\n\t><div class="dijit dijitInline dijitReset dijitInlineTable dijitLeft" role="combobox" dojoAttachPoint=\'_aroundNode,stateNode,oneuiBaseNode\'\r\n\t\t><div class="dijitReset dijitInputField dijitInputContainer"\r\n\t\t><input class=\'dijitReset dijitInputInner\' ${!nameAttrSetting} type="text" autocomplete="off" dojoAttachPoint="textbox,focusNode" role="textbox" aria-haspopup="true"/\r\n\t></div\r\n\t></div\r\n\t><div class=\'dijitReset dijitInline oneuiIcon\'\r\n\t\tdojoAttachPoint="_buttonNode, _popupStateNode" role="presentation"\r\n\t\t><input class="dijitReset dijitInputField" value="&#9660; " type="text" tabIndex="-1" readonly="readonly" role="presentation" ${_buttonInputDisabled}/\r\n\t></div\r\n\t><div class="idxUnit dijitInline dijitHidden" dojoAttachPoint="compUnitNode"></div\r\n\t><div class=\'dijitReset dijitValidationContainer dijitInline\' dojoAttachPoint="iconNode"\r\n\t\t><div class="dijitValidationIcon"><input class="dijitReset dijitInputField dijitValidationInner" value="&#935; " type="text" tabIndex="-1" readonly="readonly" role="presentation"/\r\n\t></div></div\r\n\t><div class="dijitHidden idxHintOutside" dojoAttachPoint="compHintNode"></div\r\n\t></div\r\n></div>'}});
define("idx/form/_DateTimeTextBox","dojo/_base/declare,dojo/_base/lang,dojo/i18n,dojo/date,dojo/date/locale,dojo/date/stamp,dijit/_base/wai,dijit/form/RangeBoundTextBox,dijit/form/ValidationTextBox,dijit/_HasDropDown,./TextBox,dojo/text!./templates/DropDownBox.html,dojo/i18n!./nls/_DateTimeTextBox".split(","),function(h,e,i,j,k,f,l,m,p,n,g,o){return h("idx.form._DateTimeTextBox",[m,n],{templateString:o,hasDownArrow:!1,openOnClick:!0,regExpGen:k.regexp,datePackage:"dojo.date",compare:function(a,b){var c=
this._isInvalidDate(a),d=this._isInvalidDate(b);return c?d?0:-1:d?1:j.compare(a,b,this._selector)},forceWidth:!0,format:function(a,b){return a?this.dateLocaleModule.format(a,b):""},parse:function(a,b){return this.dateLocaleModule.parse(a,b)||(this._isEmpty(a)?null:void 0)},serialize:function(a,b){a.toGregorian&&(a=a.toGregorian());return f.toISOString(a,b)},dropDownDefaultValue:new Date,value:new Date(""),_blankValue:null,popupClass:"",_selector:"",constructor:function(a){this.dateClassObj=e.getObject(a.datePackage?
a.datePackage+".Date":"Date",!1);this.value=new this.dateClassObj("");this.datePackage=a.datePackage||this.datePackage;this.dateLocaleModule=e.getObject(this.datePackage+".locale",!1);this.regExpGen=this.dateLocaleModule.regexp;this._invalidDate=idx.form._DateTimeTextBox.prototype.value.toString()},postMixInProperties:function(){this._nlsResources=i.getLocalization("idx.form","_DateTimeTextBox",this.lang);this.inherited(arguments)},buildRendering:function(){this.inherited(arguments);if(!this.hasDownArrow)this._buttonNode.style.display=
"none";if(this.openOnClick||!this.hasDownArrow)this._buttonNode=this.oneuiBaseNode,this.oneuiBaseClass+=" dijitComboBoxOpenOnClick"},_setConstraintsAttr:function(a){a.selector=this._selector;a.fullYear=!0;var b=f.fromISOString;if("string"==typeof a.min)a.min=b(a.min);if("string"==typeof a.max)a.max=b(a.max);this.inherited(arguments,[a])},_isInvalidDate:function(a){return!a||isNaN(a)||"object"!=typeof a||a.toString()==this._invalidDate},_setValueAttr:function(a,b,c){void 0!==a&&("string"==typeof a&&
(a=f.fromISOString(a)),this._isInvalidDate(a)&&(a=null),a instanceof Date&&!(this.dateClassObj instanceof Date)&&(a=new this.dateClassObj(a)));l.setWaiState(this.focusNode,"valuenow",a);g.prototype._setValueAttr.apply(this,arguments);this.dropDown&&this.dropDown.set("value",a,!1)},_refreshState:function(){g.prototype._refreshState.apply(this,arguments)},_set:function(a,b){"value"==a&&this.value instanceof Date&&0==this.compare(b,this.value)||this.inherited(arguments)},_setDropDownDefaultValueAttr:function(a){this.dropDownDefaultvalue=
this._isInvalidDate(a)?new this.dateClassObj:a},openDropDown:function(a){this.dropDown&&this.dropDown.destroy();var b=e.getObject(this.popupClass,!1),c=this,d=this.get("value");this.dropDown=new b({autoFocus:!1,onChange:function(a){idx.form._DateTimeTextBox.superclass._setValueAttr.call(c,a,!0)},id:this.id+"_popup",dir:c.dir,lang:c.lang,value:d,currentFocus:!this._isInvalidDate(d)?d:this.dropDownDefaultValue,constraints:c.constraints,filterString:c.filterString,datePackage:c.datePackage,isDisabledDate:function(a){return!c.rangeCheck(a,
c.constraints)}});this.inherited(arguments)},_getDisplayedValueAttr:function(){return this.textbox.value},_setDisplayedValueAttr:function(a,b){this._setValueAttr(this.parse(a,this.constraints),b,a)},_onDropDownMouseUp:function(){this.inherited(arguments);(!this.dropDown.focus||!this.dropDown.autoFocus)&&setTimeout(e.hitch(this,"focus"),0)}})});
//>>built
require({cache:{"url:idx/form/templates/DropDownBox.html":'<div id="widget_${id}" class="dijitInline dijitReset dijitLeft idxComposite"\r\n\t><div class="idxLabel dijitInline dijitHidden"><span class="idxRequiredIcon">*&nbsp</span><label for="${id}" dojoAttachPoint="compLabelNode"></label></div\r\n\t><div class="dijitInline"\r\n\t><div class="dijit dijitInline dijitReset dijitInlineTable dijitLeft" role="combobox" dojoAttachPoint=\'_aroundNode,stateNode,oneuiBaseNode\'\r\n\t\t><div class="dijitReset dijitInputField dijitInputContainer"\r\n\t\t><input class=\'dijitReset dijitInputInner\' ${!nameAttrSetting} type="text" autocomplete="off" dojoAttachPoint="textbox,focusNode" role="textbox" aria-haspopup="true"/\r\n\t></div\r\n\t></div\r\n\t><div class=\'dijitReset dijitInline oneuiIcon\'\r\n\t\tdojoAttachPoint="_buttonNode, _popupStateNode" role="presentation"\r\n\t\t><input class="dijitReset dijitInputField" value="&#9660; " type="text" tabIndex="-1" readonly="readonly" role="presentation" ${_buttonInputDisabled}/\r\n\t></div\r\n\t><div class="idxUnit dijitInline dijitHidden" dojoAttachPoint="compUnitNode"></div\r\n\t><div class=\'dijitReset dijitValidationContainer dijitInline\' dojoAttachPoint="iconNode"\r\n\t\t><div class="dijitValidationIcon"><input class="dijitReset dijitInputField dijitValidationInner" value="&#935; " type="text" tabIndex="-1" readonly="readonly" role="presentation"/\r\n\t></div></div\r\n\t><div class="dijitHidden idxHintOutside" dojoAttachPoint="compHintNode"></div\r\n\t></div\r\n></div>'}});
define("idx/form/DateTextBox","dojo/_base/declare,dojo/_base/lang,dojo/dom-style,dojo/dom-class,dojo/dom-construct,dojo/dom-attr,dijit/Calendar,idx/widget/HoverHelpTooltip,./_CssStateMixin,./_DateTimeTextBox,./_CompositeMixin,dojo/text!./templates/DropDownBox.html".split(","),function(f,a,c,d,e,l,m,g,h,i,j,k){d=a.getObject("idx.oneui.form",!0);return a.getObject("idx.form",!0).DatePicker=d.DateTextBox=f("idx.form.DateTextBox",[i,j,h],{instantValidate:!1,baseClass:"idxDateTextBoxWrap",oneuiBaseClass:"dijitTextBox dijitComboBox dijitDateTextBox",
popupClass:"dijit.Calendar",_selector:"date",templateString:k,value:new Date(""),showPickerIcon:!1,buildRendering:function(){this.inherited(arguments);this.messageTooltip=new g({connectId:[this.iconNode],label:this.message,position:this.tooltipPosition,forceFocus:!1})},postCreate:function(){this.inherited(arguments);this.instantValidate?this.connect(this,"_onInput",function(){this.validate(this.focused)}):(this.connect(this,"_onBlur",function(){this.validate(this.focused)}),this.connect(this,"_onFocus",
function(){this._set("state","");if(""!=this.message)this.displayMessage(this.message),this.message=""}),this.connect(this,"_onInput",function(){this.messageTooltip.close()}));if(this.showPickerIcon){var b=e.create("div",{title:this.iconTitle||this._nlsResources.idxDateIconTitle||"Click to open date picker",className:"dijitInline idxPickerIconLink"},this.oneuiBaseNode);e.create("img",{alt:this.iconAlt||this._nlsResources.idxDateIconTitle||"Click to open date picker",className:"idxPickerIcon idxCalendarIcon",
src:this._blankGif},b);c.set(this.oneuiBaseNode,"position","relative")}},displayMessage:function(b,a){this.messageTooltip.set("label",b);b&&this.focused||a?this.messageTooltip.open("hidden"==c.get(this.iconNode,"visibility")?this.oneuiBaseNode:this.iconNode):this.messageTooltip.close()}})});
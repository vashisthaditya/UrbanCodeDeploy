//>>built
require({cache:{"url:idx/form/templates/ComboBox.html":'<div id="widget_${id}" class="dijitReset dijitInline idxComposite" dojoAttachPoint="_popupStateNode"\r\n\t><div class="idxLabel dijitInline dijitHidden"\r\n\t\t><span class="idxRequiredIcon">*&nbsp</span\r\n\t\t><label for="${id}" dojoAttachPoint="compLabelNode"\r\n\t\t></label\r\n\t></div\r\n\t><div class="dijitInline"\r\n\t\t><div class="dijit dijitInline dijitReset dijitInlineTable dijitLeft" role="combobox" dojoAttachPoint="stateNode,oneuiBaseNode,_aroundNode"\r\n\t\t\t><div class=\'dijitReset dijitRight dijitButtonNode dijitArrowButton dijitDownArrowButton dijitArrowButtonContainer\' dojoAttachPoint="_buttonNode" role="presentation"\r\n\t\t\t><input class="dijitReset dijitInputField dijitArrowButtonInner" value="&#9660; " type="text" tabIndex="-1" readonly="readonly" role="presentation"\r\n\t\t\t${_buttonInputDisabled}\r\n\t\t\t/></div\r\n\t\t\t><div class="dijitReset dijitInputField dijitInputContainer" dojoAttachPoint="inputContainer" dojoAttachEvent="onmouseenter: _onInputContainerEnter, onmouseleave: _onInputContainerLeave"\r\n\t\t\t\t><input class=\'dijitReset dijitInputInner\' ${!nameAttrSetting}  type="text" autocomplete="off" dojoAttachPoint="textbox,focusNode" role="textbox" aria-haspopup="true" \r\n\t\t\t/></div\r\n\t\t></div\r\n\t\t><div class="idxUnit dijitInline dijitHidden" dojoAttachPoint="compUnitNode"\r\n\t\t></div\r\n\t\t><div class=\'dijitReset dijitValidationContainer dijitInline\' dojoAttachPoint="iconNode"\r\n\t\t\t><div class="dijitValidationIcon"\r\n\t\t\t><input class="dijitReset dijitInputField  dijitValidationInner" value="&#935;" type="text" tabIndex="-1" readonly="readonly" role="presentation"/\r\n\t\t></div></div\r\n\t\t><div class="dijitHidden idxHintOutside" dojoAttachPoint="compHintNode"></div\r\n\t></div\r\n></div>'}});
define("idx/form/FilteringSelect","dojo/_base/declare,dojo/_base/lang,dojo/dom-class,dojo/dom-style,dojo/window,dijit/form/FilteringSelect,idx/widget/HoverHelpTooltip,./TextBox,./_CompositeMixin,./_CssStateMixin,dojo/text!./templates/ComboBox.html".split(","),function(h,g,e,i,j,k,l,p,m,n,o){return g.getObject("idx.oneui.form",!0).FilteringSelect=h("idx.form.FilteringSelect",[k,m,n],{baseClass:"idxFilteringSelectWrap",oneuiBaseClass:"dijitTextBox dijitComboBox",templateString:o,selectOnClick:!0,cssStateNodes:{_buttonNode:"dijitDownArrowButton"},
buildRendering:function(){this.inherited(arguments);this.messageTooltip=new l({connectId:[this.iconNode],label:this.message,position:this.tooltipPosition,forceFocus:!1})},isValid:function(){return this.item||!this.required&&""==this.get("displayedValue")},_isEmpty:function(){return/^\s*$/.test(this.textbox.value||"")},_openResultList:function(a,c,d){if(c[this.searchAttr]===this._lastQuery&&(this._fetchHandle=null,!this.disabled&&!(this.readOnly||c[this.searchAttr]!==this._lastQuery))){var e=this.dropDown.getHighlightedOption();
this.dropDown.clearResultList();if(!a.length&&0==d.start)this.closeDropDown();else{this.dropDown.createOptions(a,d,g.hitch(this,"_getMenuLabelFromItem"));a=this.dropDown.containerNode.childNodes;this._showResultList();if(!this._lastInput)for(var f=0;f<a.length;f++){var b=this.dropDown.items[a[f].getAttribute("item")];if(b&&(b=this.store._oldAPI?this.store.getValue(b,this.searchAttr):b[this.searchAttr],b=b.toString(),b==this.displayedValue)){this.dropDown._setSelectedAttr(a[f]);j.scrollIntoView(this.dropDown.selected);
break}}d.direction?(1==d.direction?this.dropDown.highlightFirstOption():-1==d.direction&&this.dropDown.highlightLastOption(),e&&this._announceOption(this.dropDown.getHighlightedOption())):this.autoComplete&&!this._prev_key_backspace&&!/^[*]+$/.test(c[this.searchAttr].toString())&&this._announceOption(a[1]);void 0===this.item&&this.validate(!0)}}},_onInputContainerEnter:function(){e.toggle(this.oneuiBaseNode,"dijitComboBoxInputContainerHover",!0)},_onInputContainerLeave:function(){e.toggle(this.oneuiBaseNode,
"dijitComboBoxInputContainerHover",!1)},displayMessage:function(a,c){this.messageTooltip&&(this.messageTooltip.set("label",a),a&&this.focused||c?this.messageTooltip.open("hidden"==i.get(this.iconNode,"visibility")?this.oneuiBaseNode:this.iconNode):this.messageTooltip.close())}})});
//>>built
define("idx/form/comboButtons","dojo/_base/lang,idx/main,dojo/dom-attr,dojo/dom-class,dijit/form/ComboButton,../widgets".split(","),function(b,h,c,d,a){var b=b.getObject("form.comboButtons",!0,h),a=a.prototype,e=a.openDropDown,f=a.closeDropDown;if(e)a.openDropDown=function(){var a=e.call(this,arguments);this._opened&&d.add(this.domNode,"idxDropDownOpen");return a};if(f)a.closeDropDown=function(a){var b=f.call(this,arguments);d.remove(this.domNode,"idxDropDownOpen");return b};var g=a.idxAfterBuildRendering;
a.idxAfterBuildRendering=function(){g&&g.call(this);this.titleNode&&c.set(this.titleNode,"tabindex",this.tabIndex?""+this.tabIndex:"0");this._buttonNode&&c.set(this._buttonNode,"tabindex",this.tabIndex?""+this.tabIndex:"0")};return b});
//>>built
define("idx/app/_Dock",["dojo/_base/declare","dijit/_Widget","dojo/_base/array","./Workspace"],function(d,e,f){return d("idx.app._Dock",[e],{constructor:function(){this._workspacesByID=[];this._workspaces=[]},startup:function(){},addWorkspace:function(a){!this._workspacesByID[a.workspaceID]&&!1!=this._doAddWorkspace(a)&&(this._workspacesByID[a.workspaceID]=a,this._workspaces.push(a),this.onWorkspaceAdded(a))},_doAddWorkspace:function(){return!1},onWorkspaceAdded:function(){},selectWorkspace:function(a){if(this._selectedWorkspace!=
a){var b=this._selectedWorkspace;if(!1!=this._doSelectWorkspace(a,b))this._selectedWorkspace=a,this.onWorkspaceSelected(a,b)}},_doSelectWorkspace:function(){return!1},onWorkspaceSelected:function(){},removeWorkspace:function(a){if(this._workspacesByID[a.workspaceID]){var b=a==this._selectedWorkspace,c=this._doRemoveWorkspace(a,b);if(!1!=c){if(a==this._selectedWorkspace)this._selectedWorkspace=null;this._workspaces.splice(f.indexOf(this._workspaces,a),1);delete this._workspacesByID[a.workspaceID];
this._doPostRemoveWorkspace(a,b,c);this.onWorkspaceRemoved(a,b)}}},_doRemoveWorkspace:function(){return!1},_doPostRemoveWorkspace:function(){},onWorkspaceRemoved:function(){}})});
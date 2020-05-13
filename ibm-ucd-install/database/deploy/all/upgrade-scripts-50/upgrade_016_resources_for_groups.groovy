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
import groovy.sql.Sql
import java.sql.Clob

def connection = this.binding['CONN'];
def sql = new Sql(connection)


def getAllGroups = '''
    select id, name, parent_resource_group_id, sec_resource_id
    from ds_res_group_static
    where parent_resource_group_id is not null
'''

def createResource = '''
    insert into ds_resource
    (id, version, name, active, sec_resource_id, ghosted_date, impersonation_force)
    values
    (?, 0, ?, 'Y', ?, 0, 'N')
'''

def setResourceParent = '''
    update ds_resource
    set parent_id = ?, agent_id = ?, agent_pool_id = ?
    where id = ?
'''

def getResourceParent = '''
    select id, parent_id, agent_id, agent_pool_id
    from ds_resource
    where id = ?
'''

def getResourceGroupResources = '''
    select res_group_static_id, resource_id
    from ds_res_group_static_to_res
'''

def getResourceParents = '''
    select id, parent_id
    from ds_resource
    where ghosted_date = 0
'''

def getResourceVCs = '''
    select pr.path as path, pr.persistent_data as persistent_data, pr.directory as directory
    from vc_persistent_record pr
    where pr.path like ?
    and pr.relative_version = (select max(pr2.relative_version) from vc_persistent_record pr2 where pr2.path = pr.path)
'''

def getCommit = '''
    select max(id) as max_id from vc_commit
'''

def addCommit = '''
    insert into vc_commit
    (id, commit_time, commit_user, commit_comment)
    values
    (?, ?, 'admin', '')
'''

def addCommitPathEntry = '''
    insert into vc_commit_path_entry
    (id, commit_id, path, entry_type)
    values
    (?, ?, ?, 'MODIFIED')
'''

def addPersistentRecord = '''
    insert into vc_persistent_record
    (id, path, commit_id, relative_version, directory, persistent_data, deleted)
    values
    (?, ?, ?, 1, ?, ?, 'N')
'''

def addSecResource = '''
    insert into sec_resource
    (id, version, name, enabled, sec_resource_type_id)
    values
    (?, 0, ?, 'Y', '20000000000000000000000000000104')
'''

def getSecResourceForTeams = '''
    select sec_team_space_id, sec_resource_role_id
    from sec_resource_for_team
    where sec_resource_id = ?
'''

def addSecResourceForTeam = '''
    insert into sec_resource_for_team
    (id, version, sec_resource_id, sec_team_space_id, sec_resource_role_id)
    values (?, 0, ?, ?, ?)
'''

def getFullResource = '''
    select * from ds_resource
    where id = ?
'''

def addResource = '''
    insert into ds_resource
    (id, version, name, active, description, agent_id, agent_pool_id, parent_id, sec_resource_id,
        ghosted_date, impersonation_user, impersonation_group, impersonation_password,
        impersonation_sudo, impersonation_force)
    values
    (?, 0, ?, 'Y', ?, ?, ?, ?, ?,
        0, ?, ?, ?,
        ?, ?) 
'''

def addResourceRoles = '''
    insert into ds_resource_to_role
    (resource_id, resource_role_id)
    select ?, resource_role_id
    from ds_resource_to_role
    where resource_id = ?
'''

def addTags = '''
    insert into ds_resource_to_tag
    (resource_id, tag_id)
    select ?, tag_id
    from ds_resource_to_tag
    where resource_id = ?
'''

def getCompEnvMappings = '''
    select environment_id, component_id
    from ds_res_grp_cmp_env_mapping
    where res_group_static_id = ?
'''

def addCompEnvMapping = '''
    insert into ds_res_grp_cmp_env_mapping
    (id, version, environment_id, component_id, resource_id)
    values
    (?, 0, ?, ?, ?)
'''

def checkCompEnvMappingExists = '''
    select *
    from ds_res_grp_cmp_env_mapping
    where environment_id = ? and component_id=? and resource_id=?
'''

def getResourceGroupMappings = '''
    select *
    from ds_res_grp_cmp_env_mapping
    where res_group_static_id=?
'''

def deleteCompEnvMapping = '''
   delete from ds_res_grp_cmp_env_mapping
   where environment_id = ? and component_id = ? and resource_id = ?
'''


def customPropSheetData = '''<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<propSheet id="CUSTOM_PS_ID" name="custom" propSheetGroupHandle="resources/RESOURCE_ID/propSheetGroup.-1">
<propValues/>
</propSheet>
'''

def propSheetGroupData = '''<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<propSheetGroup id="PS_GROUP_ID">
<propSheets>
<propSheet propSheetHandle="resources/RESOURCE_ID/propSheetGroup/propSheets/CUSTOM_PS_ID.-1"/>
</propSheets>
<propSheetDefs/>
</propSheetGroup>
'''



def addedResourceIds = []
def resourcesToParentResources = new HashMap<String, String>()
def resourcesToGroupIds = new HashMap<String, Object>()
def resourcesToChildIds = new HashMap<String, Object>()
def resourceIds = []


//
// Add a new commit for any changes we'll be making
//
def commitId = -1
sql.eachRow(getCommit) { commitRow ->
    commitId = commitRow['max_id']+1
}
sql.executeUpdate(addCommit, [commitId, new Date().getTime()])

//
// Get all existing resource->group mapping data
//
sql.eachRow(getResourceGroupResources) { resGroupResourceRow ->
    def groupId = resGroupResourceRow['res_group_static_id']
    def resourceId = resGroupResourceRow['resource_id']
    
    def groupList = resourcesToGroupIds.get(resourceId)
    if (groupList == null) {
        groupList = new ArrayList<String>()
        resourcesToGroupIds.put(resourceId, groupList)
    }
    if (!groupList.contains(groupId)) {
        groupList.add(groupId)
    }
}


//
// Get all existing resource->parent resource mapping data
//
sql.eachRow(getResourceParents) { resourceRow ->
    def resourceId = resourceRow['id']
    def parentId = resourceRow['parent_id']
    
    if (parentId != null) {
        resourcesToParentResources.put(resourceId, parentId)

        def childList = resourcesToChildIds.get(parentId)
        if (childList == null) {
            childList = new ArrayList<String>()
            resourcesToChildIds.put(parentId, childList)
        }
        if (!childList.contains(resourceId)) {
            childList.add(resourceId)
        }
    }
    resourceIds.add(resourceId)
}


//
// Create a resource for every resource group
//
sql.eachRow(getAllGroups) { groupRow ->
    def groupId = groupRow['id']
    def groupName = groupRow['name']
    def groupSecResourceId = groupRow['sec_resource_id']
    
    sql.executeUpdate(createResource, [groupId, groupName, groupSecResourceId])
    addedResourceIds.add(groupId)


    def customPropSheetId = UUID.randomUUID().toString()
    def propSheetGroupId = UUID.randomUUID().toString()
    
    def newCustomPropSheetData = customPropSheetData.replace("CUSTOM_PS_ID", customPropSheetId).replace("PS_GROUP_ID", propSheetGroupId).replace("RESOURCE_ID", groupId)
    def newPropSheetGroupData = propSheetGroupData.replace("CUSTOM_PS_ID", customPropSheetId).replace("PS_GROUP_ID", propSheetGroupId).replace("RESOURCE_ID", groupId)
    
    def propSheetGroupPath = "resources/"+groupId+"/propSheetGroup"
    def propSheetPath = propSheetGroupPath+"/propSheets"
    sql.executeUpdate(addPersistentRecord, [UUID.randomUUID().toString(), propSheetPath+"/"+customPropSheetId, commitId, propSheetPath, newCustomPropSheetData])
    sql.executeUpdate(addCommitPathEntry, [UUID.randomUUID().toString(), commitId, propSheetPath+"/"+customPropSheetId])
    sql.executeUpdate(addPersistentRecord, [UUID.randomUUID().toString(), propSheetGroupPath, commitId, propSheetPath, newPropSheetGroupData])
    sql.executeUpdate(addCommitPathEntry, [UUID.randomUUID().toString(), commitId, "resources/"+groupId])
}


//
// Set group resource parents to match existing group hierarchy
//
sql.eachRow(getAllGroups) { groupRow ->
    def groupId = groupRow['id']
    def groupParent = groupRow['parent_resource_group_id']
    
    if (addedResourceIds.contains(groupParent)) {
        sql.executeUpdate(setResourceParent, [groupParent, sql.VARCHAR(null), sql.VARCHAR(null), groupId])
    }
}

//
// For each resource, determine what group to put it into or whether copies need to be made
//
resourceIds.each() { resourceId ->
    def parentId = resourcesToParentResources.get(resourceId)
    def groupIds = resourcesToGroupIds.get(resourceId)
    def rootAgentId = null
    def rootAgentPoolId = null
    
    if (groupIds != null) {
        // If this resource is a subresource, we need to determine which agent/pool it is using and
        // track that so we can set it on this resource when we move it into the group(s) it belongs
        // to
        if (parentId != null) {
            def rootParentId = parentId
            def rootParentRow = null
            while (rootParentId != null) {
                rootParentRow = sql.firstRow(getResourceParent, [rootParentId])
                rootParentId = rootParentRow['parent_id']
            }
            
            rootAgentId = rootParentRow['agent_id']
            rootAgentPoolId = rootParentRow['agent_pool_id']
        }
        else {
            // This is a top-level resource, and so we simply need to preserve its existing agent
            // (or pool) association
            def thisResourceRow = sql.firstRow(getResourceParent, [resourceId])
            rootAgentId = thisResourceRow['agent_id']
            rootAgentPoolId = thisResourceRow['agent_pool_id']
        }
        
        if (groupIds.size() == 1) {
            // Any top-level resources belonging to only one group just get moved into that group's
            // new resource
            sql.executeUpdate(setResourceParent, [groupIds.get(0), sql.VARCHAR(rootAgentId), sql.VARCHAR(rootAgentPoolId), resourceId])
        }
        else {
            // Any top-level resources belonging to multiple groups: If resource has no children,
            // duplicate the resource (with all properties) into all groups.
            
            // Gather VC data to be copied
            def vcPaths = []
            def vcDatas = []
            def vcDirectories = []
            sql.eachRow(getResourceVCs, ["resources/"+resourceId+"/%"]) { vcRow ->
                def vcPath = vcRow['path']
                def vcData
                if (vcRow['persistent_data'] instanceof Clob) {
                    vcData = vcRow['persistent_data'].getCharacterStream().getText();
                }
                else {
                    vcData = vcRow['persistent_data']
                }
                def vcDirectory = vcRow['directory']
                
                vcPaths.add(vcPath)
                vcDatas.add(vcData)
                vcDirectories.add(vcDirectory)
            }
            
            // Gather full data about the resource
            def resName, resDescription, resAgent, resAgentPool, resIUser, resIGroup
            def resIPassword, resISudo, resIForce, resSecResourceId
            sql.eachRow(getFullResource, [resourceId]) { resourceRow ->
                resName = resourceRow['name']
                resDescription = resourceRow['description']
                resAgent = resourceRow['agent_id']
                resAgentPool = resourceRow['agent_pool_id']
                resIUser = resourceRow['impersonation_user']
                resIGroup = resourceRow['impersonation_group']
                resIPassword = resourceRow['impersonation_password']
                resISudo = resourceRow['impersonation_sudo']
                resIForce = resourceRow['impersonation_force']
                resSecResourceId = resourceRow['sec_resource_id']
            }
            if (parentId != null) {
                resAgent = rootAgentId
                resAgentPool = rootAgentPoolId
            }
            
            // Just move the original resource to the first group
            sql.executeUpdate(setResourceParent, [groupIds.get(0), sql.VARCHAR(rootAgentId), sql.VARCHAR(rootAgentPoolId),
                resourceId])

            // Duplicate the resource for every extra group it belongs to
            for (def i = 1; i < groupIds.size(); i++) {
                def newResourceId = UUID.randomUUID().toString()
                def groupId = groupIds.get(i);

                def secResourceId = UUID.randomUUID().toString()
                sql.executeUpdate(addSecResource, [secResourceId, resName])
                sql.executeUpdate(addResource, [newResourceId, resName, sql.VARCHAR(resDescription),
                    sql.VARCHAR(resAgent), sql.VARCHAR(resAgentPool), sql.VARCHAR(groupId), secResourceId,
                    sql.VARCHAR(resIUser), sql.VARCHAR(resIGroup), sql.VARCHAR(resIPassword),
                    sql.VARCHAR(resISudo), sql.VARCHAR(resIForce)])
                sql.executeUpdate(addTags, [newResourceId, resourceId])
                sql.executeUpdate(addResourceRoles, [newResourceId, resourceId])

                // Duplicate all team membership of the resource we're copying
                def teamIds = []
                def resourceRoleIds = []
                sql.eachRow(getSecResourceForTeams, [resSecResourceId]) { resForTeamRow ->
                    teamIds.add(resForTeamRow['sec_team_space_id'])
                    resourceRoleIds.add(resForTeamRow['sec_resource_role_id'])
                }
                for (int j = 0; j < teamIds.size; j++) {
                    def teamId = teamIds[j];
                    def resourceRoleId = resourceRoleIds[j]
                    
                    sql.executeUpdate(addSecResourceForTeam, [UUID.randomUUID().toString(), secResourceId, teamId,
                        sql.VARCHAR(resourceRoleId)])
                }

                // Copy all property sheets and other versioned objects for this resource
                // Do an initial pass over all VCs collected to generate new IDs and paths
                // Put these modified objects into the newVc<whatever> collections, which is
                // what we'll use to get the data to insert.
                def vcIdMap = new HashMap<String, String>()
                def newVcPaths = []
                def newVcDatas = []
                def newVcDirectories = []
                for (def j = 0; j < vcPaths.size(); j++) {
                    def vcPath = vcPaths[j]
                    def vcData = vcDatas[j]
                    def vcDirectory = vcDirectories[j]

                    def newId = UUID.randomUUID().toString()
                    def idStart = vcData.indexOf("id=\"")+4
                    def oldId = vcData.substring(idStart, idStart+36)
                    vcIdMap.put(oldId, newId)
                    
                    vcData = vcData.replace(oldId, newId)
                    vcData = vcData.replace(resourceId, newResourceId)
                    vcPath = vcPath.replace(oldId, newId)
                    vcPath = vcPath.replace(resourceId, newResourceId)
                    vcDirectory = vcDirectory.replace(resourceId, newResourceId)
                    
                    newVcPaths[j] = vcPath
                    newVcDatas[j] = vcData
                    newVcDirectories[j] = vcDirectory
                }
                
                // We have to do this final pass and replace vcData's IDs because VC data may
                // refer to IDs of other VC objects, and we can only do this once we've seen
                // them all and generated their new IDs.
                for (def j = 0; j < newVcPaths.size(); j++) {
                    def vcPath = newVcPaths[j]
                    def vcData = newVcDatas[j]
                    def vcDirectory = newVcDirectories[j]
                    
                    for (def oldId : vcIdMap.keySet()) {
                        def newId = vcIdMap.get(oldId)
                        vcData = vcData.replace(oldId, newId)
                    }
                    
                    sql.executeUpdate(addPersistentRecord, [UUID.randomUUID().toString(), vcPath, commitId, vcDirectory, vcData])
                    sql.executeUpdate(addCommitPathEntry, [UUID.randomUUID().toString(), commitId, vcPath])
                }
            }
        }

        //we need to remove any mappings the resource may have that the group also has.
        groupIds.each() { groupId ->
            sql.eachRow(getResourceGroupMappings, [groupId]) { mappingRow ->
                if (sql.rows(checkCompEnvMappingExists, [mappingRow['environment_id'],
                                 mappingRow['component_id'], resourceId]).size() == 1) {
                    sql.execute(deleteCompEnvMapping, [mappingRow['environment_id'],
                                 mappingRow['component_id'], resourceId]);
                }
            }
        }
    }
}

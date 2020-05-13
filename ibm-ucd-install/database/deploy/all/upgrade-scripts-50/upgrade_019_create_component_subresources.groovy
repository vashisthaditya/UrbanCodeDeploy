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

def connection = this.binding['CONN'];
def sql = new Sql(connection)


def getAllResourceMappings = '''
    select map.resource_id as resource_id, map.res_group_static_id as group_id,
        role.id as role_id, role.name as role_name, role.prop_sheet_def_id as prop_sheet_def_id,
        res.sec_resource_id as res_sec_id, group_res.sec_resource_id as group_sec_id,
        cmp.id as component_id, map.environment_id as environment_id, map.id as mapping_id
    from ds_res_grp_cmp_env_mapping map
    join ds_component cmp on cmp.id = map.component_id
    join ds_resource_role role on role.name = cmp.name
    left outer join ds_resource res on res.id = map.resource_id
    left outer join ds_resource group_res on group_res.id = map.res_group_static_id
'''

def createSecurityResource = '''
    insert into sec_resource
    (id, version, name, enabled, sec_resource_type_id)
    values
    (?, 0, ?, 'Y', '20000000000000000000000000000104')
'''
def getResourceSecurityTeams = '''
    select sec_team_space_id, sec_resource_role_id
    from sec_resource_for_team
    where sec_resource_id = ?
'''
def addResourceSecurityTeam = '''
    insert into sec_resource_for_team
    (id, version, sec_resource_id, sec_team_space_id, sec_resource_role_id)
    values
    (?, 0, ?, ?, ?)
'''

def getExistingSubresource = '''
    select *
    from ds_resource
    where name = ? and parent_id = ?
'''

def createSubresource = '''
    insert into ds_resource
    (id, version, name, active, parent_id, sec_resource_id, ghosted_date, impersonation_force)
    values
    (?, 0, ?, 'Y', ?, ?, 0, 'N')
'''

def addRoleToResource = '''
    insert into ds_resource_to_role
    (resource_id, resource_role_id)
    values
    (?, ?)
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

def getChildren = '''
    select id, agent_id, agent_pool_id
    from ds_resource
    where parent_id = ?
'''

def updateInventory = '''
    update inv_resource_inventory
    set resource_id = ?
    where resource_id = ? and component_id = ?
'''

def deleteMapping = '''
    delete from ds_res_grp_cmp_env_mapping where id = ?
'''

def insertMapping = '''
    insert into ds_res_grp_cmp_env_mapping
    (id, version, environment_id, component_id, resource_id)
    values
    (?, 0, ?, ?, ?)
'''

def customPropSheetData = '''<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<propSheet id="CUSTOM_PS_ID" name="custom" propSheetGroupHandle="resources/RESOURCE_ID/propSheetGroup.-1">
<propValues/>
</propSheet>
'''

def rolePropSheetData = '''<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<propSheet id="ROLE_PS_ID" name="" propSheetDefId="ROLE_PSD_ID" propSheetGroupHandle="resources/RESOURCE_ID/propSheetGroup.-1">
<propValues/>
</propSheet>
'''

def propSheetGroupData = '''<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<propSheetGroup id="PS_GROUP_ID">
<propSheets>
<propSheet propSheetHandle="resources/RESOURCE_ID/propSheetGroup/propSheets/CUSTOM_PS_ID.-1"/>
<propSheet propSheetHandle="resources/RESOURCE_ID/propSheetGroup/propSheets/ROLE_PS_ID.-1"/>
</propSheets>
<propSheetDefs/>
</propSheetGroup>
'''



//
// Add a new commit for any changes we'll be making
//
def commitId = -1
sql.eachRow(getCommit) { commitRow ->
    commitId = commitRow['max_id']+1
}
sql.executeUpdate(addCommit, [commitId, new Date().getTime()])

def finishedMappings = []

def getChildIds = null
getChildIds = { parentId ->
    def result = []
    def childrenToCheck = []
    
    sql.eachRow(getChildren, [parentId]) { childRow ->
        def agentId = childRow['agent_id']
        def agentPoolId = childRow['agent_pool_id']
        def id = childRow['id']
        
        if (agentId != null || agentPoolId != null) {
            result.add(id)
        }
        else {
            childrenToCheck.add(id)
        }
    }
    
    childrenToCheck.each() { childId ->
        result.addAll(getChildIds(childId))
    }
    
    return result;
}

//
// Get all existing env/res mappings and find resources to create subresources on
//

def mappingIdsToDelete = [];
def newMappingResourceIds = [];
def newMappingComponentIds = [];
def newMappingEnvironmentIds = [];
def createdSubresourceIds = [];

sql.eachRow(getAllResourceMappings) { mappingRow ->
    def parentResourceId = mappingRow['resource_id']
    def groupId = mappingRow['group_id']
    def roleId = mappingRow['role_id']
    def roleName = mappingRow['role_name']
    def rolePropSheetDefId = mappingRow['prop_sheet_def_id']
    def componentId = mappingRow['component_id']
    
    def existingSecResourceId = null
    def resourceIds = []
    def deleteSingleResourceMapping = false;
    
    if (parentResourceId != null) {
        // This mapping is to a single resource. Just add a new subresource to that.
        resourceIds.add(parentResourceId)
        existingSecResourceId = mappingRow['res_sec_id']
        
        // If this mapping is to a resource with subresources, we'll need to change the mappings
        // to point directly to its new children so we don't accidentally target its subresources
        // for deployment.
        sql.eachRow(getChildren, [parentResourceId]) { childRow ->
            if (!createdSubresourceIds.contains(childRow['id'])) {
                deleteSingleResourceMapping = true;
            }
        }
    }
    else {
        // This mapping is to a group. Find all resources in that and add subresources to each.
        existingSecResourceId = mappingRow['group_sec_id']
        
        resourceIds.addAll(getChildIds(groupId))
    }

    if (deleteSingleResourceMapping) {
        mappingIdsToDelete.add(mappingRow['mapping_id'])
    }
    
    resourceIds.each() { resourceId ->
        if (!finishedMappings.contains(resourceId+">"+roleId)) {
            finishedMappings.add(resourceId+">"+roleId)
            
            def secResourceId = UUID.randomUUID().toString()
            def newResourceId = UUID.randomUUID().toString()
            
            sql.executeUpdate(createSecurityResource, [secResourceId, roleName])
            def teamIds = []
            def resourceRoleIds = []
            sql.eachRow(getResourceSecurityTeams, [existingSecResourceId]) { teamRow ->
                teamIds.add(teamRow['sec_team_space_id'])
                resourceRoleIds.add(teamRow['sec_resource_role_id'])
            }
            for (def i = 0; i < teamIds.size(); i++) {
                sql.executeUpdate(addResourceSecurityTeam, [UUID.randomUUID().toString(), secResourceId, teamIds[i], sql.VARCHAR(resourceRoleIds[i])])
            }

            def existingResourceRow = sql.firstRow(getExistingSubresource, [roleName, resourceId]);
            if (existingResourceRow != null) {
                newResourceId = existingResourceRow['id']
            }
            else {
                sql.executeUpdate(createSubresource, [newResourceId, roleName, resourceId, secResourceId])
                createdSubresourceIds.add(newResourceId)
            }
            
            sql.executeUpdate(addRoleToResource, [newResourceId, roleId])
    
    
            def customPropSheetId = UUID.randomUUID().toString()
            def rolePropSheetId = UUID.randomUUID().toString()
            def propSheetGroupId = UUID.randomUUID().toString()
            
            def newCustomPropSheetData = customPropSheetData.replace("CUSTOM_PS_ID", customPropSheetId).replace("ROLE_PS_ID", rolePropSheetId).replace("ROLE_PSD_ID", rolePropSheetDefId).replace("PS_GROUP_ID", propSheetGroupId).replace("RESOURCE_ID", newResourceId)
            def newRolePropSheetData = rolePropSheetData.replace("CUSTOM_PS_ID", customPropSheetId).replace("ROLE_PS_ID", rolePropSheetId).replace("ROLE_PSD_ID", rolePropSheetDefId).replace("PS_GROUP_ID", propSheetGroupId).replace("RESOURCE_ID", newResourceId)
            def newPropSheetGroupData = propSheetGroupData.replace("CUSTOM_PS_ID", customPropSheetId).replace("ROLE_PS_ID", rolePropSheetId).replace("ROLE_PSD_ID", rolePropSheetDefId).replace("PS_GROUP_ID", propSheetGroupId).replace("RESOURCE_ID", newResourceId)
            
            def propSheetGroupPath = "resources/"+newResourceId+"/propSheetGroup"
            def propSheetPath = propSheetGroupPath+"/propSheets"
            sql.executeUpdate(addPersistentRecord, [UUID.randomUUID().toString(), propSheetPath+"/"+customPropSheetId, commitId, propSheetPath, newCustomPropSheetData])
            sql.executeUpdate(addCommitPathEntry, [UUID.randomUUID().toString(), commitId, propSheetPath+"/"+customPropSheetId])
            sql.executeUpdate(addPersistentRecord, [UUID.randomUUID().toString(), propSheetPath+"/"+rolePropSheetId, commitId, propSheetPath, newRolePropSheetData])
            sql.executeUpdate(addCommitPathEntry, [UUID.randomUUID().toString(), commitId, propSheetPath+"/"+rolePropSheetId])
            sql.executeUpdate(addPersistentRecord, [UUID.randomUUID().toString(), propSheetGroupPath, commitId, propSheetPath, newPropSheetGroupData])
            sql.executeUpdate(addCommitPathEntry, [UUID.randomUUID().toString(), commitId, "resources/"+newResourceId])
            
            sql.executeUpdate(updateInventory, [newResourceId, resourceId, componentId])
            
            if (deleteSingleResourceMapping) {
                newMappingResourceIds.add(newResourceId)
                newMappingComponentIds.add(componentId)
                newMappingEnvironmentIds.add(mappingRow['environment_id'])
            }
        }
    }
}

mappingIdsToDelete.each() { mappingId ->
    sql.executeUpdate(deleteMapping, [mappingId])
}
for (def i = 0; i < newMappingResourceIds.size(); i++) {
    def resourceId = newMappingResourceIds[i]
    def environmentId = newMappingEnvironmentIds[i]
    def componentId = newMappingComponentIds[i]
    def mappingId = UUID.randomUUID().toString()
    
    sql.executeUpdate(insertMapping, [mappingId, environmentId, componentId, resourceId])
}

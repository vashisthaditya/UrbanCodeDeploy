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
import groovy.xml.XmlUtil
import com.urbancode.ds.upgrade.upgrade50.*
import java.util.List
import java.util.ArrayList
import java.util.Map
import java.util.HashMap
import java.sql.Clob

def properties = this.binding['ANT_PROPERTIES'];
def installDir = new File((String) properties["install.dir"]);
def confDir = new File(installDir, "conf");
def migrationDir = new File(confDir, "migration");

def connection = this.binding['CONN'];
def sql = new Sql(connection)


String insertResourceForTeam = '''insert into sec_resource_for_team
                    (id, version, sec_resource_id, sec_team_space_id, sec_resource_role_id)
                    values (?, 0, ?, ?, ?)''';

String insertResourceRole = '''insert into sec_resource_role
                    (id, version, name, description, enabled, sec_resource_type_id)
                    values (?, 0, ?, ?, 'Y', ?)''';

String insertRoleAction = '''insert into sec_role_action
                    (id, version, sec_role_id, sec_action_id, sec_resource_role_id)
                    values (?, 0, ?, ?, ?)''';

String insertGroupRoleOnTeam = '''insert into sec_group_role_on_team
                    (id, version, sec_group_id, sec_role_id, sec_team_space_id)
                    values (?, 0, ?, ?, ?)''';

String insertRole = '''insert into sec_role
                    (id, version, name, description, enabled)
                    values (?, 0, ?, ?, 'Y')''';

String insertTeam = '''insert into sec_team_space
                    (id, version, name, description, enabled)
                    values (?, 0, ?, ?, 'Y')''';

String insertUserRoleOnTeam = '''insert into sec_user_role_on_team
                    (id, version, sec_user_id, sec_role_id, sec_team_space_id)
                    values (?, 0, ?, ?, ?)''';

def addPersistentRecord = '''
    insert into vc_persistent_record
    (id, path, commit_id, relative_version, directory, persistent_data, deleted)
    values (?, ?, ?, ?, ?, ?, 'N')
    ''';

def updatePersistentRecord = '''
    update vc_persistent_record
    set persistent_data=?
    where path = ? and relative_version = ?
    ''';

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

MigrationFactory50 migrationFactory = new MigrationFactory50(migrationDir);

List<MigrationRole50> migrationRoles = migrationFactory.getAllRoles();
List<MigrationTeam50> migrationTeams = migrationFactory.getAllTeams();
List<MigrationResourceRole50> migrationResourceRoles = migrationFactory.getAllResourceRoles();
List<MigrationTask50> migrationTasks = migrationFactory.getAllTasks();

for (MigrationRole50 role : migrationRoles) {
    // If the user has defined a role called "Administrator", we need to merge it with the existing
    // Administrator role - delete all action mappings from it.
    if (role.getName() == "Administrator") {
        sql.execute("delete from sec_role_action where sec_role_id = '20000000000000000000000000010001'");
    }
    else {
        sql.execute(insertRole, [role.getId().toString(), role.getName(), ""])
    }
}
for (MigrationResourceRole50 resourceRole : migrationResourceRoles ) {
    typeId = sql.firstRow('select id from sec_resource_type where name = ?', [resourceRole.getResourceTypeName() ])
    sql.execute(insertResourceRole, [resourceRole.getId().toString(), resourceRole.getName(), "", typeId.id])
}

for (MigrationTeam50 team : migrationTeams) {
    String teamId = team.getId().toString()
    sql.execute(insertTeam, [teamId, team.getName(), ""])

    for (MigrationRole50 role : migrationRoles) {
        String roleId = role.getId().toString()
        if (role.getName() == "Administrator") {
            roleId = "20000000000000000000000000010001";
        }

        for (String userId: team.getUserIdsForRoleId(roleId)) {
            sql.execute(insertUserRoleOnTeam, [UUID.randomUUID().toString(), userId, roleId, teamId])
        }

        for (String groupId: team.getGroupIdsForRoleId(roleId)) {
            sql.execute(insertGroupRoleOnTeam, [UUID.randomUUID().toString(), groupId, roleId, teamId])
        }
    }

    for (MigrationResourceTeamMapping50 resourceMapping : team.getResourceMappings() ) {
        if (resourceMapping.getResourceRoleId() != null) {
            sql.execute(insertResourceForTeam, [UUID.randomUUID().toString(), resourceMapping.getResourceId().toString(), teamId, resourceMapping.getResourceRoleId().toString()])
        }
        else {
            if (resourceMapping.getResourceId() != null) {
                sql.executeInsert(insertResourceForTeam, [UUID.randomUUID().toString(), resourceMapping.getResourceId().toString(), teamId, null])
            }
        }
    }
}

for (MigrationRole50 role : migrationRoles) {
    String roleId = role.getId().toString()
    if (role.getName() == "Administrator") {
        roleId = "20000000000000000000000000010001";
    }

    for (MigrationRoleActionMapping50 actionMapping : role.getActionMappings() ) {
        actionId = sql.firstRow('select id from sec_action where name = ?', [actionMapping.getAction().getActionName()])
        if (actionId != null) {
            if (actionMapping.getResourceRoleId() != null) {
                sql.execute(insertRoleAction, [UUID.randomUUID().toString(), roleId, actionId.id, actionMapping.getResourceRoleId().toString()])
            }
            else {
                sql.executeInsert(insertRoleAction, [UUID.randomUUID().toString(), roleId, actionId.id, null])
            }
        }
    }
}


def row = sql.firstRow('select max(id) as id from vc_commit')
def commitId = row.id+1
sql.execute(addCommit, [commitId, System.currentTimeMillis()])
List paths = new ArrayList();

for (MigrationTask50 task: migrationTasks) {
    def roleRestrictions = "";
    for (MigrationTaskSelector50 selector: task.getSelectors()) {
        roleRestrictions += selector.getRoleId() + "|";
        if (selector.getResourceId() != "standard") {
            roleRestrictions += selector.getResourceId();
        }
        roleRestrictions += ",";
    }
    if (roleRestrictions .length() > 0) {
        roleRestrictions = roleRestrictions.substring(0, roleRestrictions.length() -1)
    }

    def path = task.getPath();
    def persistentRecord = sql.firstRow('select max(relative_version) as version from vc_persistent_record where path =?', [path])
    def dataRecord = sql.firstRow('select persistent_data, directory from vc_persistent_record where path =? and relative_version=?', [path, persistentRecord.version])

    def directory = dataRecord.directory;
    String xmlString;
    if (dataRecord.persistent_data instanceof Clob) {
        xmlString = dataRecord.persistent_data.getCharacterStream().getText();
    } else {
        xmlString = dataRecord.persistent_data;
    }
    def version = persistentRecord.version;

    def root = new XmlParser().parseText(xmlString);
    def activity = null;

    // Finds the following types of tasks
    //   Component Process Manual Task
    //   Application Process Manual Task
    //   Approval Process Environment Approval Task
    //   Approval Process Application Approval Task
    def activityList = root?.activityGraph?.activity?.children?.activity.findAll{ it.@name == task.getName() }

    if (activityList != null && activityList.size() > 0) {
        activity = activityList[0]
    }

    if (activity == null) {
        // The desired task was not one of the above but instead a
        //   Approval Process Each Component Approval Task
        // This is nested under a ComponentEnvironmentIteratorActivity
        activityList = root?.activityGraph?.activity?.children?.activity?.children?.activity.findAll{ it.@name == task.getName() }

        if (activityList != null && activityList.size() > 0) {
            activity = activityList[0];
        }
    }

    // If we still couldn't find an activity at this point that means that the task in question
    // was likely deleted after an entry in the task.json migration file was created. We should just
    // skip over this task in this case to avoid failing.
    if (activity != null) {
        def props = activity.properties[0]
        def prop = "ANY";
        if (task.getApprovalType().equals("Env")) {
            prop = "ENVIRONMENT"
        }
        else if (task.getApprovalType().equals("App")) {
            prop = "APPLICATION"
        }
        Map context = new HashMap();
        context.put('name', 'roleRestrictionContextType');
        context.put('value', prop);
        props.appendNode('property', context );

        Map restrictions = new HashMap();
        restrictions.put('name', 'roleRestrictions');
        restrictions.put('value', roleRestrictions);
        props.appendNode('property', restrictions );
        def newRecord = XmlUtil.serialize(root);

        if (!paths.contains(path)) {
            version++;
            sql.execute(addPersistentRecord, [UUID.randomUUID().toString(), path, commitId, version, directory, newRecord])
        }
        else {
            sql.execute(updatePersistentRecord, [newRecord, path, version]);
        }

        if (!paths.contains(path)) {
            paths.add(path);
        }
    }
    else {
        println String.format("Task with name: %s and path: %s was not found. Skipping this task.",
            task.getName(), task.getPath());
    }

}

for (String path: paths) {
    sql.execute(addCommitPathEntry, [UUID.randomUUID().toString(), commitId, path ])
}
-- Licensed Materials - Property of IBM* and/or HCL**
-- UrbanCode Deploy
-- (c) Copyright IBM Corporation 2011, 2017. All Rights Reserved.
-- (c) Copyright HCL Technologies Ltd. 2018. All Rights Reserved.
--
-- U.S. Government Users Restricted Rights - Use, duplication or disclosure restricted by
-- GSA ADP Schedule Contract with IBM Corp.
--
-- * Trademark of International Business Machines
-- ** Trademark of HCL Technologies Limited

-- Inserts for items we no longer have upgrade.xml files for but still put the number in the db so everyone knows
insert into ds_db_version (release_name, ver) values ('0.9', 30);
insert into ds_db_version (release_name, ver) values ('1.0', 4);
insert into ds_db_version (release_name, ver) values ('4.1', 8);
insert into ds_db_version (release_name, ver) values ('4.2', 21);
insert into ds_db_version (release_name, ver) values ('4.3', 2);
insert into ds_db_version (release_name, ver) values ('4.4', 10);
insert into ds_db_version (release_name, ver) values ('4.5', 13);
insert into ds_db_version (release_name, ver) values ('4.6', 11);
insert into ds_db_version (release_name, ver) values ('predep_4.7', 3);
insert into ds_db_version (release_name, ver) values ('4.7', 27);
--End of Non Generated ds_db_version inserts
insert into ds_db_version (release_name, ver) values ('n1_6.2.3', 13);
insert into ds_db_version (release_name, ver) values ('security', 4);
insert into ds_db_version (release_name, ver) values ('n1_6.2.2', 2);
insert into ds_db_version (release_name, ver) values ('n1_6.2.1', 31);
insert into ds_db_version (release_name, ver) values ('n1_6.2.6', 5);
insert into ds_db_version (release_name, ver) values ('n1_7.0.0', 9);
insert into ds_db_version (release_name, ver) values ('n1_6.2', 14);
insert into ds_db_version (release_name, ver) values ('n1_6.0.2', 34);
insert into ds_db_version (release_name, ver) values ('n1_6.1.1', 31);
insert into ds_db_version (release_name, ver) values ('6.1', 26);
insert into ds_db_version (release_name, ver) values ('n1_6.2.5', 8);
insert into ds_db_version (release_name, ver) values ('5.0', 56);
insert into ds_db_version (release_name, ver) values ('n1_6.2.7', 28);
insert into ds_db_version (release_name, ver) values ('n1_6.2.4', 4);
insert into ds_db_version (release_name, ver) values ('4.8', 57);

-- ds_db_version inserts will be created based on the xml files for all other upgrades

-- SCHEMA BRANCH TRANSLATION TABLE
-- ProductVersion  SchemaBranch  UpgradeFile
-- 4.8.x/5.x       4.8           upgrade_sql_4.8.xml
-- 6.0.0.x         5.0           upgrade_sql_5.0.xml
-- 6.0.1.x         6.1           upgrade_sql_6.1.xml
-- 6.1.0.x         n1_6.0.2      upgrade_sql_6.0.2.xml
-- 6.1.1.x         n1_6.1.1      upgrade_sql_6.1.1.xml
-- 6.2.0.x         n1_6.2        upgrade_sql_6.2.xml
-- 6.2.1.x         n1_6.2.1      upgrade_sql_6.2.1.xml
-- 6.2.2.x         n1_6.2.2      upgrade_sql_6.2.2.xml
-- 6.2.3.x         n1_6.2.3      upgrade_sql_6.2.3.xml
-- 6.2.4.x         n1_6.2.4      upgrade_sql_6.2.4.xml
-- 6.2.5.x         n1_6.2.5      upgrade_sql_6.2.5.xml
-- 6.2.7.x         n1_6.2.7      upgrade_sql_6.2.7.xml
-- 6.3.0.x         n1_6.3.0      upgrade_sql_6.3.0.xml

insert into ps_prop_sheet_group (id) values ('00000000-0000-0000-0000-000000000000');

insert into ds_status (id, version, name, description, color, status_type, unique_status, ghosted_date)
values ('061056cc-9433-4036-ac11-b3c0b84e7018', 1, 'Active', 'Currently Deployed', '#B3D66D', 'INVENTORY', 'Y', 0);

insert into ds_notification_scheme (id, version, name, description)
values ('00000000-0000-0000-0000-000000000000', 0, 'Default Notification Scheme', '');


-- "Dynamic Group" resource role
insert into ps_prop_sheet_def (id, version, name, description, prop_sheet_group_id, template_handle, template_prop_sheet_def_id)
values ('1f7febf7-456b-400c-b277-128fd78f55a7', 5, 'Dynamic Group', NULL, NULL, NULL, NULL);
insert into ps_prop_def (id, version, prop_sheet_def_id, name, description, label, default_value, long_default_value, property_type, required, hidden, index_order, allowed_prop_sheet_def_id, pattern)
values ('3ef5c4f8-0ff8-43f0-9636-7ae9aeab8a2d', 0, '1f7febf7-456b-400c-b277-128fd78f55a7', 'rules', '', 'rules', NULL, NULL, 'TEXT', 'N', 'N', 0, NULL, '');
insert into ds_resource_role (id, version, name, description, prop_sheet_def_id, special_type)
values ('4241a880-d5aa-4c0e-ad72-c179fd3af69f', 1, 'Dynamic Group', '', '1f7febf7-456b-400c-b277-128fd78f55a7', 'DYNAMIC_GROUP');

-- "Agent Placeholder" resource role
insert into ps_prop_sheet_def (id, version, name, description, prop_sheet_group_id, template_handle, template_prop_sheet_def_id)
values ('cf105769-2c3f-4482-8f7b-5b1212d20511', 0, 'Agent Placeholder', NULL, NULL, NULL, NULL);
insert into ps_prop_def (id, version, prop_sheet_def_id, name, description, label, default_value, long_default_value, property_type, required, hidden, index_order, allowed_prop_sheet_def_id, pattern)
values ('7cb87cf2-4bad-421c-be9b-57eaa49c6fc8', 0, 'cf105769-2c3f-4482-8f7b-5b1212d20511', 'agentNamePatterns', 'Patterns identifying agents for the prototype to pick up', 'Agent Name Patterns', NULL, NULL, 'TEXT', 'N', 'N', 0, NULL, NULL);
insert into ds_resource_role (id, version, name, description, prop_sheet_def_id, special_type)
values ('e87aa3ff-4307-4167-b6f9-74a58b3b9e6f', 1, 'Agent Placeholder', '', 'cf105769-2c3f-4482-8f7b-5b1212d20511', 'AGENT_PLACEHOLDER');

-- "SmartCloud Logical Node" resource role
insert into ps_prop_sheet_def (id, version, name, description, prop_sheet_group_id, template_handle, template_prop_sheet_def_id)
values ('a44d9ebf-f98f-4a89-a5c0-cc7b366cc4f2', 0, 'SmartCloud Logical Node', NULL, NULL, NULL, NULL);
insert into ps_prop_def (id, version, prop_sheet_def_id, name, description, label, default_value, long_default_value, property_type, required, hidden, index_order, allowed_prop_sheet_def_id, pattern)
values ('8e652769-355c-43b3-a521-8cc3dd1c3c0b', 0, 'a44d9ebf-f98f-4a89-a5c0-cc7b366cc4f2', 'patternId', 'ID of the pattern for this node.', 'Pattern ID', NULL, NULL, 'TEXT', 'Y', 'N', 0, NULL, NULL);
insert into ps_prop_def (id, version, prop_sheet_def_id, name, description, label, default_value, long_default_value, property_type, required, hidden, index_order, allowed_prop_sheet_def_id, pattern)
values ('902682bd-5ca2-4d71-9ae2-39971819f308', 0, 'a44d9ebf-f98f-4a89-a5c0-cc7b366cc4f2', 'partId', 'ID of the OS Part for this node.', 'OS Part ID', NULL, NULL, 'TEXT', 'Y', 'N', 1, NULL, NULL);
insert into ps_prop_def (id, version, prop_sheet_def_id, name, description, label, default_value, long_default_value, property_type, required, hidden, index_order, allowed_prop_sheet_def_id, pattern)
values ('395bd966-3b12-402c-9fdc-682e74c1ff25', 0, 'a44d9ebf-f98f-4a89-a5c0-cc7b366cc4f2', 'cloudId', 'Cloud ID for this node.', 'Cloud ID', NULL, NULL, 'TEXT', 'Y', 'N', 2, NULL, NULL);
insert into ds_resource_role (id, version, name, description, prop_sheet_def_id, special_type)
values ('96a2c9bf-f0e4-4193-ad2f-72be17973c75', 1, 'SmartCloud Logical Node', '', 'a44d9ebf-f98f-4a89-a5c0-cc7b366cc4f2', 'AGENT_PLACEHOLDER');

-- "IPAS Logical Node" resource role
insert into ps_prop_sheet_def (id, version, name, description, prop_sheet_group_id, template_handle, template_prop_sheet_def_id)
values ('19a50000-19a5-19a5-19a5-19a500000000', 0, 'IPAS Logical Node', NULL, NULL, NULL, NULL);
insert into ps_prop_def (id, version, prop_sheet_def_id, name, description, label, default_value, long_default_value, property_type, required, hidden, index_order, allowed_prop_sheet_def_id, pattern)
values ('19a50000-19a5-19a5-19a5-19a500000001', 0, '19a50000-19a5-19a5-19a5-19a500000000', 'patternId', 'ID of the pattern for this node.', 'Pattern ID', NULL, NULL, 'TEXT', 'Y', 'N', 0, NULL, NULL);
insert into ps_prop_def (id, version, prop_sheet_def_id, name, description, label, default_value, long_default_value, property_type, required, hidden, index_order, allowed_prop_sheet_def_id, pattern)
values ('19a50000-19a5-19a5-19a5-19a500000002', 0, '19a50000-19a5-19a5-19a5-19a500000000', 'partId', 'ID of the OS Part for this node.', 'OS Part ID', NULL, NULL, 'TEXT', 'Y', 'N', 1, NULL, NULL);
insert into ps_prop_def (id, version, prop_sheet_def_id, name, description, label, default_value, long_default_value, property_type, required, hidden, index_order, allowed_prop_sheet_def_id, pattern)
values ('19a50000-19a5-19a5-19a5-19a500000003', 0, '19a50000-19a5-19a5-19a5-19a500000000', 'cloudId', 'Cloud ID for this node.', 'Cloud ID', NULL, NULL, 'TEXT', 'Y', 'N', 2, NULL, NULL);
insert into ds_resource_role (id, version, name, description, prop_sheet_def_id, special_type)
values ('19a50000-19a5-19a5-19a5-19a500000004', 1, 'IPAS Logical Node', '', '19a50000-19a5-19a5-19a5-19a500000000', 'AGENT_PLACEHOLDER');


-------------------------------------------------------------------------------
-- DATA FOR SECURITY SERVER
-------------------------------------------------------------------------------

insert into sec_group_mapper (id, version, name)
values ('00000000000000000000000000000000', 0, 'Identity Mapping');

insert into sec_group_mapping (id, version, sec_group_mapper_id, regex, replacement)
values ('00000000000000000000000000000001', 0, '00000000000000000000000000000000', '.*', '$0');

insert into sec_authorization_realm (id, version, name, description, authorization_module, ghosted_date)
values ('20000000000000000000000000000000', 0, 'Internal Security', 'Internal database storage.', 'com.urbancode.security.authorization.internal.InternalAuthorizationModule', 0);

insert into sec_authentication_realm (id, version, name, description, sort_order, enabled, read_only, login_module, ghosted_date, allowed_attempts)
values ('20000000000000000000000000000001', 0, 'Internal Security', 'Internal database storage.', 0, 'Y', 'N', 'com.urbancode.security.authentication.internal.InternalLoginModule', 0, 0);

insert into sec_realm_mapping (authentication_realm_id, authorization_realm_id)
values ('20000000000000000000000000000001', '20000000000000000000000000000000');

insert into sec_resource_type (id, version, name, enabled)
values ('20000000000000000000000000000106', 0, 'Agent', 'Y');
insert into sec_resource_type (id, version, name, enabled)
values ('20000000000000000000000000000107', 0, 'Agent Pool', 'Y');
insert into sec_resource_type (id, version, name, enabled)
values ('20000000000000000000000000000114', 0, 'Agent Relay', 'Y');
insert into sec_resource_type (id, version, name, enabled)
values ('20000000000000000000000000000100', 0, 'Application', 'Y');
insert into sec_resource_type (id, version, name, enabled)
values ('20000000000000000000000000000112', 0, 'Application Template', 'Y');
insert into sec_resource_type (id, version, name, enabled)
values ('20000000000000000000000000000101', 0, 'Component', 'Y');
insert into sec_resource_type (id, version, name, enabled)
values ('20000000000000000000000000000102', 0, 'Component Template', 'Y');
insert into sec_resource_type (id, version, name, enabled)
values ('20000000000000000000000000000103', 0, 'Environment', 'Y');
insert into sec_resource_type (id, version, name, enabled)
values ('20000000000000000000000000000113', 0, 'Environment Template', 'Y');
insert into sec_resource_type (id, version, name, enabled)
values ('20000000000000000000000000000109', 0, 'Process', 'Y');
insert into sec_resource_type (id, version, name, enabled)
values ('20000000000000000000000000000104', 0, 'Resource', 'Y');
insert into sec_resource_type (id, version, name, enabled)
values ('20000000000000000000000000000110', 0, 'Resource Template', 'Y');
insert into sec_resource_type (id, version, name, enabled)
values ('20000000000000000000000000000111', 0, 'Cloud Connection', 'Y');

insert into sec_resource_type (id, version, name, enabled)
values ('20000000000000000000000000000201', 0, 'Server Configuration', 'Y');
insert into sec_resource_type (id, version, name, enabled)
values ('20000000000000000000000000000200', 0, 'Web UI', 'Y');

-- Agent Actions
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000110001', 0, 'View Agents', 'View agents in this team.', 'Y', 'Y', '20000000000000000000000000000106', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000110003', 0, 'Add to Agent Pool', 'Add agents to agent pools.', 'Y', 'Y', '20000000000000000000000000000106', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000110004', 0, 'Create Resources', 'Create resources that are children of agents.', 'Y', 'Y', '20000000000000000000000000000106', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000110005', 0, 'Delete', 'Delete agents.', 'Y', 'Y', '20000000000000000000000000000106', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000110006', 0, 'Edit Basic Settings', 'Edit basic settings for agents.', 'Y', 'Y', '20000000000000000000000000000106', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000110007', 0, 'Manage Impersonation', 'Manage impersonation settings for agents.', 'Y', 'Y', '20000000000000000000000000000106', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000110008', 0, 'Manage Properties', 'Manage properties for agents.', 'Y', 'Y', '20000000000000000000000000000106', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000110009', 0, 'Manage Teams', 'Manage teams for agents.', 'Y', 'Y', '20000000000000000000000000000106', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('2000000000000000000000000011000a', 0, 'Manage Version Imports', 'Manage which agents import component versions.', 'Y', 'Y', '20000000000000000000000000000106', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('2000000000000000000000000011000b', 0, 'Execute on Agents', 'Execute processes on agents.', 'Y', 'Y', '20000000000000000000000000000106', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('2000000000000000000000000011000c', 0, 'Upgrade Agents', 'Upgrade an agent to a new version.', 'Y', 'Y', '20000000000000000000000000000106', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('2000000000000000000000000011000d', 0, 'Install Remote Agents', 'Installing agents via SSH.', 'Y', 'Y', '20000000000000000000000000000106', null);


-- Agent Pool Actions
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000120001', 0, 'Create Agent Pools', 'Create new agent pools for this team.', 'Y', 'Y', '20000000000000000000000000000107', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000120002', 0, 'View Agent Pools', 'View agent pools in this team.', 'Y', 'Y', '20000000000000000000000000000107', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000120004', 0, 'Create Resources', 'Create resources that are children of agent pools.', 'Y', 'Y', '20000000000000000000000000000107', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000120005', 0, 'Delete', 'Delete agent pools.', 'Y', 'Y', '20000000000000000000000000000107', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000120006', 0, 'Edit Basic Settings', 'Edit basic settings for agent pools.', 'Y', 'Y', '20000000000000000000000000000107', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000120007', 0, 'Manage Pool Members', 'Add or remove agents from the agent pool.', 'Y', 'Y', '20000000000000000000000000000107', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000120008', 0, 'Manage Teams', 'Manage teams for agent pools.', 'Y', 'Y', '20000000000000000000000000000107', 'Edit');

-- Agent Relay Actions
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000220001', 0, 'View Agent Relays', 'View agent relays in this team.', 'Y', 'Y', '20000000000000000000000000000114', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000220002', 0, 'Delete', 'Delete agent relays.', 'Y', 'Y', '20000000000000000000000000000114', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000220003', 0, 'Edit Basic Settings', 'Edit basic settings for agent relays.', 'Y', 'Y', '20000000000000000000000000000114', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000220004', 0, 'Manage Teams', 'Manage teams for agent relays.', 'Y', 'Y', '20000000000000000000000000000114', 'Edit');

-- Application Actions
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000130001', 0, 'Create Applications', 'Create new applications for this team.', 'Y', 'Y', '20000000000000000000000000000100', 'Create');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000130002', 0, 'View Applications', 'View applications in this team.', 'Y', 'Y', '20000000000000000000000000000100', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000130004', 0, 'Run Component Processes', 'Run individual component processes outside of an application process.', 'Y', 'Y', '20000000000000000000000000000100', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000130005', 0, 'Manage Snapshots', 'Manage snapshots for applications.', 'Y', 'Y', '20000000000000000000000000000100', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000130006', 0, 'Delete', 'Delete applications.', 'Y', 'Y', '20000000000000000000000000000100', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000130007', 0, 'Edit Basic Settings', 'Edit basic settings for applications.', 'Y', 'Y', '20000000000000000000000000000100', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000130008', 0, 'Manage Blueprints', 'Manage blueprints for applications.', 'Y', 'Y', '20000000000000000000000000000100', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000130009', 0, 'Manage Components', 'Manage components for applications.', 'Y', 'Y', '20000000000000000000000000000100', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('2000000000000000000000000013000a', 0, 'Manage Environments', 'Manage environments for applications.', 'Y', 'Y', '20000000000000000000000000000100', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('2000000000000000000000000013000b', 0, 'Manage Processes', 'Manage processes for applications.', 'Y', 'Y', '20000000000000000000000000000100', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('2000000000000000000000000013000c', 0, 'Manage Properties', 'Manage properties for applications.', 'Y', 'Y', '20000000000000000000000000000100', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('2000000000000000000000000013000d', 0, 'Manage Teams', 'Manage teams for applications.', 'Y', 'Y', '20000000000000000000000000000100', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('2000000000000000000000000013000e', 0, 'Create Applications From Template', 'Create applications from an application template', 'Y', 'Y', '20000000000000000000000000000100', 'Create');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('2000000000000000000000000013000f', 0, 'Delete Snapshots', 'Delete snapshots for applications.', 'Y', 'Y', '20000000000000000000000000000100', 'Edit');


-- Application Template Actions
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000200001', 0, 'Create Application Templates', 'Create new application templates for this team.', 'Y', 'Y', '20000000000000000000000000000112', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000200002', 0, 'View Application Templates', 'View application templates in this team.', 'Y', 'Y', '20000000000000000000000000000112', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000200006', 0, 'Delete', 'Delete application templates.', 'Y', 'Y', '20000000000000000000000000000112', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000200007', 0, 'Edit Basic Settings', 'Edit basic settings for application templates.', 'Y', 'Y', '20000000000000000000000000000112', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000200008', 0, 'Manage Blueprints', 'Manage blueprints for applications.', 'Y', 'Y', '20000000000000000000000000000112', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000200009', 0, 'Manage Component Tags', 'Manage component tags required for applications.', 'Y', 'Y', '20000000000000000000000000000112', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('2000000000000000000000000020000a', 0, 'Manage Environment Templates', 'Manage environments templates for application templates.', 'Y', 'Y', '20000000000000000000000000000112', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('2000000000000000000000000020000b', 0, 'Manage Processes', 'Manage processes for application templates.', 'Y', 'Y', '20000000000000000000000000000112', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('2000000000000000000000000020000c', 0, 'Manage Properties', 'Manage properties for application templates.', 'Y', 'Y', '20000000000000000000000000000112', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('2000000000000000000000000020000d', 0, 'Manage Teams', 'Manage teams for application templates.', 'Y', 'Y', '20000000000000000000000000000112', 'Edit');

-- Component Actions
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000140001', 0, 'Create Components', 'Create new components for this team.', 'Y', 'Y', '20000000000000000000000000000101', 'Create');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000140002', 0, 'View Components', 'View components in this team.', 'Y', 'Y', '20000000000000000000000000000101', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000140003', 0, 'Edit Components', 'Edit components in this team.', 'Y', 'Y', '20000000000000000000000000000101', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000140004', 0, 'Manage Versions', 'Manage versions for components.', 'Y', 'Y', '20000000000000000000000000000101', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000140005', 0, 'Delete', 'Delete components.', 'Y', 'Y', '20000000000000000000000000000101', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000140006', 0, 'Edit Basic Settings', 'Edit basic settings for components.', 'Y', 'Y', '20000000000000000000000000000101', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000140007', 0, 'Manage Configuration Templates', 'Install and manage configuration templates for components.', 'Y', 'Y', '20000000000000000000000000000101', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000140008', 0, 'Manage Processes', 'Manage component processes.', 'Y', 'Y', '20000000000000000000000000000101', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000140009', 0, 'Manage Properties', 'Manage properties for components.', 'Y', 'Y', '20000000000000000000000000000101', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('2000000000000000000000000014000a', 0, 'Manage Teams', 'Manage teams for components.', 'Y', 'Y', '20000000000000000000000000000101', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('2000000000000000000000000014000b', 0, 'Create Components From Template', 'Create components from a component template', 'Y', 'Y', '20000000000000000000000000000101', 'Create');


-- Component Template Actions
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000150001', 0, 'Create Component Templates', 'Create new component templates for this team.', 'Y', 'Y', '20000000000000000000000000000102', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000150002', 0, 'View Component Templates', 'View component templates in this team.', 'Y', 'Y', '20000000000000000000000000000102', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000150004', 0, 'Delete', 'Delete component templates.', 'Y', 'Y', '20000000000000000000000000000102', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000150005', 0, 'Edit Basic Settings', 'Edit basic settings for component templates.', 'Y', 'Y', '20000000000000000000000000000102', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000150006', 0, 'Manage Processes', 'Manage component template processes.', 'Y', 'Y', '20000000000000000000000000000102', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000150007', 0, 'Manage Properties', 'Manage component template properties.', 'Y', 'Y', '20000000000000000000000000000102', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000150008', 0, 'Manage Teams', 'Manage teams for component templates.', 'Y', 'Y', '20000000000000000000000000000102', 'Edit');

-- Environment Actions
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000160001', 0, 'Create Environments', 'Create new environments for this team.', 'Y', 'Y', '20000000000000000000000000000103', 'Create');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000160002', 0, 'View Environments', 'View environments in this team.', 'Y', 'Y', '20000000000000000000000000000103', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000160004', 0, 'Execute on Environments', 'Execute processes on environments.', 'Y', 'Y', '20000000000000000000000000000103', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000160005', 0, 'Delete', 'Delete environments.', 'Y', 'Y', '20000000000000000000000000000103', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000160006', 0, 'Edit Basic Settings', 'Edit basic settings for environments.', 'Y', 'Y', '20000000000000000000000000000103', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000160007', 0, 'Manage Approval Processes', 'Manage approval processes for environments.', 'Y', 'Y', '20000000000000000000000000000103', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000160008', 0, 'Manage Base Resources', 'Add and remove base resources from environments', 'Y', 'Y', '20000000000000000000000000000103', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000160009', 0, 'Manage Properties', 'Manage properties for environments.', 'Y', 'Y', '20000000000000000000000000000103', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('2000000000000000000000000016000a', 0, 'Manage Teams', 'Manage teams for environments.', 'Y', 'Y', '20000000000000000000000000000103', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('2000000000000000000000000016000b', 0, 'Create Environments From Template', 'Create environments from an environment template', 'Y', 'Y', '20000000000000000000000000000103', 'Create');


-- Environment Template Actions
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000210001', 0, 'Create Environment Templates', 'Create new environments for this team.', 'Y', 'Y', '20000000000000000000000000000113', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000210002', 0, 'View Environment Templates', 'View environments in this team.', 'Y', 'Y', '20000000000000000000000000000113', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000210005', 0, 'Delete', 'Delete Environment Templates.', 'Y', 'Y', '20000000000000000000000000000113', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000210006', 0, 'Edit Basic Settings', 'Edit basic settings for environment templates.', 'Y', 'Y', '20000000000000000000000000000113', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000210007', 0, 'Manage Approval Processes', 'Manage approval processes for environment templates.', 'Y', 'Y', '20000000000000000000000000000113', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000210009', 0, 'Manage Properties', 'Manage properties for environment templates.', 'Y', 'Y', '20000000000000000000000000000113', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('2000000000000000000000000021000a', 0, 'Manage Teams', 'Manage teams for environment templates.', 'Y', 'Y', '20000000000000000000000000000113', 'Edit');

-- Process Actions
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000180001', 0, 'Create Processes', 'Create new processes for this team.', 'Y', 'Y', '20000000000000000000000000000109', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000180002', 0, 'View Processes', 'View processes in this team.', 'Y', 'Y', '20000000000000000000000000000109', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000180004', 0, 'Execute Processes', 'Execute processes.', 'Y', 'Y', '20000000000000000000000000000109', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000180005', 0, 'Delete', 'Delete generic processes.', 'Y', 'Y', '20000000000000000000000000000109', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000180006', 0, 'Edit Basic Settings', 'Edit basic settings and workflows for generic processes.', 'Y', 'Y', '20000000000000000000000000000109', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000180007', 0, 'Manage Properties', 'Manage generic process properties.', 'Y', 'Y', '20000000000000000000000000000109', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000180008', 0, 'Manage Teams', 'Manage teams for generic processes.', 'Y', 'Y', '20000000000000000000000000000109', 'Edit');

-- Resource Actions
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000190001', 0, 'Create Resources', 'Create new resources for this team.', 'Y', 'Y', '20000000000000000000000000000104', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000190002', 0, 'View Resources', 'View resources in this team.', 'Y', 'Y', '20000000000000000000000000000104', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000190004', 0, 'Map to Environments', 'Map base resources to environments.', 'Y', 'Y', '20000000000000000000000000000104', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000190005', 0, 'Delete', 'Delete resources.', 'Y', 'Y', '20000000000000000000000000000104', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000190006', 0, 'Edit Basic Settings', 'Edit basic settings for resources.', 'Y', 'Y', '20000000000000000000000000000104', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000190007', 0, 'Manage Children', 'Manage settings of child resources.', 'Y', 'Y', '20000000000000000000000000000104', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000190008', 0, 'Manage Impersonation', 'Manage impersonation settings for resources.', 'Y', 'Y', '20000000000000000000000000000104', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('20000000000000000000000000190009', 0, 'Manage Properties', 'Manage properties for resources.', 'Y', 'Y', '20000000000000000000000000000104', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('2000000000000000000000000019000a', 0, 'Manage Teams', 'Manage teams for resources.', 'Y', 'Y', '20000000000000000000000000000104', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('2000000000000000000000000019000b', 0, 'Execute on Resources', 'Execute processes on resources.', 'Y', 'Y', '20000000000000000000000000000104', null);

-- System Actions
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001b0001', 0, 'Add Team Members', 'Add new members to this team.', 'Y', 'Y', '20000000000000000000000000000201', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001b0002', 0, 'Manage Resource Roles', 'Create and edit resource roles. Roles are loaded for use by certain plugins.', 'Y', 'Y', '20000000000000000000000000000201', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001b0003', 0, 'Manage Security', 'Change general security settings, including roles, authentication, and group membership.', 'Y', 'Y', '20000000000000000000000000000201', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001b0004', 0, 'Manage Plugins', 'Add and remove plugins.', 'Y', 'Y', '20000000000000000000000000000201', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001b0005', 0, 'Read Artifact Set List', 'Read list of all artifact sets.', 'Y', 'Y', '20000000000000000000000000000201', null);
insert into sec_action(id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001b0006', 0, 'Manage Auth Token Restrictions', 'Create and edit all auth token restrictions', 'Y', 'Y', '20000000000000000000000000000201', null);
insert into sec_action(id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001b0008', 0, 'View Basic System Settings', 'View basic system settings', 'Y', 'Y', '20000000000000000000000000000201', null);
insert into sec_action(id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001b0009', 0, 'Edit Basic System Settings', 'Edit basic system settings', 'Y', 'Y', '20000000000000000000000000000201', null);
insert into sec_action(id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001b000b', 0, 'View Locks', 'View locks', 'Y', 'Y', '20000000000000000000000000000201', null);
insert into sec_action(id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001b000c', 0, 'Release Locks', 'Release locks', 'Y', 'Y', '20000000000000000000000000000201', null);
insert into sec_action(id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001b000d', 0, 'Manage Diagnostics', 'Manage diagnostics', 'Y', 'Y', '20000000000000000000000000000201', null);
insert into sec_action(id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001b000e', 0, 'Manage Notification Schemes', 'Create and edit notification schemes', 'Y', 'Y', '20000000000000000000000000000201', null);
insert into sec_action(id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001b000f', 0, 'Manage Statuses', 'Create and edit statuses', 'Y', 'Y', '20000000000000000000000000000201', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001b0010', 0, 'Manage Post Processing Scripts', 'Create and edit post processing scripts.', 'Y', 'Y', '20000000000000000000000000000201', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001b0011', 0, 'View Network Settings', 'View network configurations between servers', 'Y', 'Y', '20000000000000000000000000000201', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001b0012', 0, 'Edit Network Settings', 'Edit network configurations between servers', 'Y', 'Y', '20000000000000000000000000000201', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001b0013', 0, 'View Audit Log', 'View the audit log', 'Y', 'Y', '20000000000000000000000000000201', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001b0014', 0, 'Manage Audit Log', 'Manage audit log configuration and cleanup', 'Y', 'Y', '20000000000000000000000000000201', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001b0015', 0, 'View Output Log', 'View and download server logs', 'Y', 'Y', '20000000000000000000000000000201', null);
insert into sec_action(id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001b0016', 0, 'Manage Blueprint Designer Integrations', 'Manage blueprint designer integrations and configurations', 'Y', 'Y', '20000000000000000000000000000201', null);
insert into sec_action(id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001b0017', 0, 'Manage Logging Settings', 'Manage Log4j logging settings', 'Y', 'Y', '20000000000000000000000000000201', null);
insert into sec_action(id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001b0018', 0, 'Manage System Properties', 'Create, edit, and delete system properties', 'Y', 'Y', '20000000000000000000000000000201', null);

-- Web UI
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001c0001', 0, 'Components Tab', 'Manage components.', 'Y', 'Y', '20000000000000000000000000000200', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001c0002', 0, 'Applications Tab', 'Manage applications.', 'Y', 'Y', '20000000000000000000000000000200', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001c0003', 0, 'Resources Tab', 'Manage resources.', 'Y', 'Y', '20000000000000000000000000000200', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001c0004', 0, 'Deployment Calendar Tab', 'Manage release calendars.', 'Y', 'Y', '20000000000000000000000000000200', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001c0005', 0, 'Work Items Tab', 'Manage work items.', 'Y', 'Y', '20000000000000000000000000000200', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001c0006', 0, 'Settings Tab', 'Manage server settings.', 'Y', 'Y', '20000000000000000000000000000200', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001c0007', 0, 'Dashboard Tab', 'View the dashboard.', 'Y', 'Y', '20000000000000000000000000000200', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001c0008', 0, 'Configuration Tab', 'View the configuration tree.', 'Y', 'Y', '20000000000000000000000000000200', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001c0009', 0, 'Reports Tab', 'View the reports tab.', 'Y', 'Y', '20000000000000000000000000000200', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001c000a', 0, 'Processes Tab', 'View the processes tab.', 'Y', 'Y', '20000000000000000000000000000200', null);

-- Resource Template Actions
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001d0001', 0, 'Create Resource Templates', 'Create new resource templates for this team.', 'Y', 'Y', '20000000000000000000000000000110', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001d0002', 0, 'View Resource Templates', 'View resource templates in this team.', 'Y', 'Y', '20000000000000000000000000000110', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001d000a', 0, 'Delete', 'Delete resource templates.', 'Y', 'Y', '20000000000000000000000000000110', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001d000b', 0, 'Edit Basic Settings', 'Edit basic settings for resource templates.', 'Y', 'Y', '20000000000000000000000000000110', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001d000c', 0, 'Manage Resources', 'Add and remove resources from resource templates.', 'Y', 'Y', '20000000000000000000000000000110', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001d000d', 0, 'Manage Teams', 'Manage teams for resource templates.', 'Y', 'Y', '20000000000000000000000000000110', 'Edit');

-- Cloud Connection Actions
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001d0004', 0, 'Create Cloud Connections', 'Create new cloud connections for this team.', 'Y', 'Y', '20000000000000000000000000000111', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001d0005', 0, 'View Cloud Connections', 'View cloud connections in this team.', 'Y', 'Y', '20000000000000000000000000000111', null);
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001d0007', 0, 'Delete', 'Delete cloud connections.', 'Y', 'Y', '20000000000000000000000000000111', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001d0008', 0, 'Edit Basic Settings', 'Edit basic settings for cloud connections.', 'Y', 'Y', '20000000000000000000000000000111', 'Edit');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id, category)
values ('200000000000000000000000001d0009', 0, 'Manage Teams', 'Manage teams for cloud connections.', 'Y', 'Y', '20000000000000000000000000000111', 'Edit');

insert into sec_role (id, version, name, description, enabled)
values ('20000000000000000000000000010001', 0, 'Administrator', '', 'Y');

insert into sec_role (id, version, name, description, enabled)
values ('979b2e9f-d214-49f6-87c5-6f0403829df1', 0, 'UC Version Import', '', 'Y');

insert into sec_role (id, version, name, description, enabled)
values ('f722b338-01c1-43cb-bc53-853cfb0d2249', 0, 'UC Auto Discovery', '', 'Y');

insert into sec_role (id, version, name, description, enabled)
values ('251a33d3-3e62-47c5-b64e-ad4b0494cecb', 0, 'UC Auto Configure', '', 'Y');

-- Add all actions to Administrator role
-- everything except for viewing configuration tree(because the config tree is bad, mmmkay)
insert into sec_role_action (id, version, sec_role_id, sec_action_id)
select id, 0, '20000000000000000000000000010001', id
from sec_action
where id != '200000000000000000000000001c0008';

-- give the version import role component read/ manage versions actions
insert into sec_role_action (id, version, sec_role_id, sec_action_id)
values ('7f052d31-03b7-406e-bb01-8fde5d1c5667', 0, '979b2e9f-d214-49f6-87c5-6f0403829df1', '20000000000000000000000000140002');
insert into sec_role_action (id, version, sec_role_id, sec_action_id)
values ('9f3419ca-943d-4e59-8847-667c92ad2f00', 0, '979b2e9f-d214-49f6-87c5-6f0403829df1', '20000000000000000000000000140004');

-- give the version import role manage component version properties
insert into sec_role_action (id, version, sec_role_id, sec_action_id)
values ('b483673f-7c54-4a5c-aef0-f6b3eeee0cb9', 0, '979b2e9f-d214-49f6-87c5-6f0403829df1', '20000000000000000000000000140009');

--give the autodiscover create resource action
insert into sec_role_action (id, version, sec_role_id, sec_action_id)
values ('ab5cbda4-33a4-4c35-83c9-96abe0e634bc', 0, 'f722b338-01c1-43cb-bc53-853cfb0d2249', '20000000000000000000000000190001');

--give the autodiscover read resource action
insert into sec_role_action (id, version, sec_role_id, sec_action_id)
values ('fa64dc16-bd23-45a3-967d-9f5ff3130b00', 0, 'f722b338-01c1-43cb-bc53-853cfb0d2249', '20000000000000000000000000190002');

--give the autodiscover manage child resources action
insert into sec_role_action (id, version, sec_role_id, sec_action_id)
values ('0f18c891-6650-42dd-b226-107ec085e359', 0, 'f722b338-01c1-43cb-bc53-853cfb0d2249', '20000000000000000000000000190007');

--give the autodiscover read agent action
insert into sec_role_action (id, version, sec_role_id, sec_action_id)
values ('b2d75913-f497-42dc-a0b2-10e3838f6076', 0, 'f722b338-01c1-43cb-bc53-853cfb0d2249', '20000000000000000000000000110001');

--give the autodiscover manage resource properties
insert into sec_role_action (id, version, sec_role_id, sec_action_id)
values ('b182a200-55a5-4705-9842-8d7a592e5148', 0, 'f722b338-01c1-43cb-bc53-853cfb0d2249', '20000000000000000000000000190009');

--give the autoconfigure create resource action
insert into sec_role_action (id, version, sec_role_id, sec_action_id)
values ('d96f4837-dc04-43fd-9154-99c7d6cb0d1e', 0, '251a33d3-3e62-47c5-b64e-ad4b0494cecb', '20000000000000000000000000190001');

--give the autoconfigure read resource action
insert into sec_role_action (id, version, sec_role_id, sec_action_id)
values ('3d078211-deb2-49e9-ac39-5afedde51632', 0, '251a33d3-3e62-47c5-b64e-ad4b0494cecb', '20000000000000000000000000190002');

--give the autoconfigure manage child resources action
insert into sec_role_action (id, version, sec_role_id, sec_action_id)
values ('8d845240-507d-4fa5-9fa4-33385f70dbb9', 0, '251a33d3-3e62-47c5-b64e-ad4b0494cecb', '20000000000000000000000000190007');

--give the autoconfigure read agent action
insert into sec_role_action (id, version, sec_role_id, sec_action_id)
values ('9fb76e38-efcf-4ebc-af82-5fb1ec6e2980', 0, '251a33d3-3e62-47c5-b64e-ad4b0494cecb', '20000000000000000000000000110001');

--give the autoconfigure manage resource properties
insert into sec_role_action (id, version, sec_role_id, sec_action_id)
values ('921d818f-3c73-494d-9c72-08b6352faee3', 0, '251a33d3-3e62-47c5-b64e-ad4b0494cecb', '20000000000000000000000000190009');

insert into sec_group (id, version, name, enabled, sec_authorization_realm_id)
values ('20000000000000000000000000100000', 0, 'Administrators', 'Y', '20000000000000000000000000000000');

insert into sec_user (id, version, name, enabled, password, sec_authentication_realm_id)
values ('20000000000000000000000001000000', 0, 'admin', 'Y', 'admin', '20000000000000000000000000000001');

insert into sec_user (id, version, name, enabled, sec_authentication_realm_id, is_system)
values ('20000000000000000000000111000000', 0, 'INTERNAL SYSTEM USER FOR URBANCODE DEPLOY', 'Y', '20000000000000000000000000000001', 'Y');

insert into sec_user (id, version, name, enabled, sec_authentication_realm_id, is_system)
values ('20000000000000000000011111000000', 0, 'INTERNAL NOBODY USER FOR URBANCODE DEPLOY', 'Y', '20000000000000000000000000000001', 'Y');

insert into sec_user (id, version, name, enabled, password, sec_authentication_realm_id)
values ('3bc38da4-4811-4aa6-bef3-05d87d34d0b5', 0, 'UC Version Import', 'Y', 'version_import_user', '20000000000000000000000000000001');

insert into sec_user (id, version, name, enabled, password, sec_authentication_realm_id)
values ('fcb9ec26-4f0d-4c8a-83df-2a55afcb7153', 0, 'UC Auto Discovery', 'Y', 'auto_discovery', '20000000000000000000000000000001');

insert into sec_user (id, version, name, enabled, password, sec_authentication_realm_id)
values ('79f349d5-0c10-476b-a8ca-35367cf689c9', 0, 'UC Auto Configure', 'Y', 'auto_configure', '20000000000000000000000000000001');

insert into sec_user (id, version, name, enabled, password, sec_authentication_realm_id)
values ('cb696ca8-108c-4418-8aee-8e8cc7482078', 0, 'UC No Permissions', 'Y', 'no_permissions', '20000000000000000000000000000001');

insert into sec_user_to_group (sec_group_id, sec_user_id)
values ('20000000000000000000000000100000', '20000000000000000000000001000000');

insert into sec_team_space (id, version, enabled, name, description)
values ('20000000000000000000000100000000', 0, 'Y', 'System Team', 'The system team always contains all objects in the system.');

insert into sec_user_role_on_team (id, version, sec_user_id, sec_role_id, sec_team_space_id)
values ('20000000000000000000000011000000', 0, '20000000000000000000000001000000', '20000000000000000000000000010001', '20000000000000000000000100000000');

-- add version import to system team for version import role
insert into sec_user_role_on_team (id, version, sec_user_id, sec_role_id, sec_team_space_id)
values ('d227e456-f6cc-43d6-aa42-6a22b91cd2e5', 0, '3bc38da4-4811-4aa6-bef3-05d87d34d0b5', '979b2e9f-d214-49f6-87c5-6f0403829df1', '20000000000000000000000100000000');

-- add auto_discory to system team for version import role
insert into sec_user_role_on_team (id, version, sec_user_id, sec_role_id, sec_team_space_id)
values ('1ee7629a-4497-448d-bc1d-4c41f7d3e53f', 0, 'fcb9ec26-4f0d-4c8a-83df-2a55afcb7153', 'f722b338-01c1-43cb-bc53-853cfb0d2249', '20000000000000000000000100000000');

-- add auto_configure to system team for version import role
insert into sec_user_role_on_team (id, version, sec_user_id, sec_role_id, sec_team_space_id)
values ('de083d3c-1c4a-4882-b2f4-37d12d96fffe', 0, '79f349d5-0c10-476b-a8ca-35367cf689c9', '251a33d3-3e62-47c5-b64e-ad4b0494cecb', '20000000000000000000000100000000');


insert into cal_calendar (id, version) values ('00000000-0000-0000-0000-000000000000', 0);

-------------------------------------------------------------------------------
-- DATA FOR System Settings
-------------------------------------------------------------------------------
insert into ps_prop_sheet (id, version, name, prop_sheet_group_id, prop_sheet_def_id, prop_sheet_def_handle, template_prop_sheet_id, template_handle)
values ('00000000-0000-0000-0000-000000000001', 0, 'System Settings', null, null, null, null, null);

-- ps_prop_value 00000000-0000-0000-0000-000000000001 is reserved for server.external.web.url --

insert into ps_prop_value (id, version, name, value, long_value, description, secure, prop_sheet_id)
values ('00000000-0000-0000-0000-000000000002', 0, 'com.urbancode.ds.security.onlyGroupsInSecurityRoles', 'False', null, null, 'N', '00000000-0000-0000-0000-000000000001');

insert into ps_prop_value (id, version, name, value, long_value, description, secure, prop_sheet_id)
values ('00000000-0000-0000-0000-000000000003', 0, 'com.urbancode.ds.subsys.deploy.repo.integration.RepoIntegrationService.autoIntegrationPeriod', '300000', null, null, 'N', '00000000-0000-0000-0000-000000000001');

insert into ps_prop_value (id, version, name, value, long_value, description, secure, prop_sheet_id)
values ('00000000-0000-0000-0000-000000000005', 0, 'deploy.mail.host', 'smtp.example.com', null, null, 'N', '00000000-0000-0000-0000-000000000001');

insert into ps_prop_value (id, version, name, value, long_value, description, secure, prop_sheet_id)
values ('00000000-0000-0000-0000-000000000006', 0, 'deploy.mail.password', null, null, null, 'N', '00000000-0000-0000-0000-000000000001');

insert into ps_prop_value (id, version, name, value, long_value, description, secure, prop_sheet_id)
values ('00000000-0000-0000-0000-000000000007', 0, 'deploy.mail.port', '25', null, null, 'N', '00000000-0000-0000-0000-000000000001');

insert into ps_prop_value (id, version, name, value, long_value, description, secure, prop_sheet_id)
values ('00000000-0000-0000-0000-000000000008', 0, 'deploy.mail.secure', 'false', null, null, 'N', '00000000-0000-0000-0000-000000000001');

insert into ps_prop_value (id, version, name, value, long_value, description, secure, prop_sheet_id)
values ('00000000-0000-0000-0000-000000000009', 0, 'deploy.mail.sender', 'sender@example.com', null, null, 'N', '00000000-0000-0000-0000-000000000001');

insert into ps_prop_value (id, version, name, value, long_value, description, secure, prop_sheet_id)
values ('00000000-0000-0000-0000-00000000000a', 0, 'deploy.mail.username', 'username', null, null, 'N', '00000000-0000-0000-0000-000000000001');

insert into ps_prop_value (id, version, name, value, long_value, description, secure, prop_sheet_id)
values ('00000000-0000-0000-0000-00000000000b', 0, 'cleanup.hour.of.day', '0', null, null, 'N', '00000000-0000-0000-0000-000000000001');

insert into ps_prop_value (id, version, name, value, long_value, description, secure, prop_sheet_id)
values ('00000000-0000-0000-0000-00000000000c', 0, 'cleanup.days.to.keep', '-1', null, null, 'N', '00000000-0000-0000-0000-000000000001');

insert into ps_prop_value (id, version, name, value, long_value, description, secure, prop_sheet_id)
values ('00000000-0000-0000-0000-00000000000d', 0, 'cleanup.count.to.keep', '-1', null, null, 'N', '00000000-0000-0000-0000-000000000001');

insert into ps_prop_value (id, version, name, value, long_value, description, secure, prop_sheet_id)
values ('00000000-0000-0000-0000-00000000000e', 0, 'license.automatic.management', 'true', null, null, 'N', '00000000-0000-0000-0000-000000000001');

insert into ps_prop_value (id, version, name, value, long_value, description, secure, prop_sheet_id)
values ('00000000-0000-0000-0000-00000000000f', 0, 'security.complex.passwords', 'false', null, null, 'N', '00000000-0000-0000-0000-000000000001');

insert into ps_prop_value (id, version, name, value, long_value, description, secure, prop_sheet_id)
values ('00000000-0000-0000-0000-000000000010', 0, 'security.min.password.length', '0', null, null, 'N', '00000000-0000-0000-0000-000000000001');

-- ps_prop_value 00000000-0000-0000-0000-000000000011 is reserved for server.external.user.url --

insert into ps_prop_value (id, version, name, value, long_value, description, secure, prop_sheet_id)
values ('00000000-0000-0000-0000-000000000012', 0, 'agent.validate.ip', 'false', null, null, 'N', '00000000-0000-0000-0000-000000000001');

insert into ps_prop_value (id, version, name, value, long_value, description, secure, prop_sheet_id)
values ('00000000-0000-0000-0000-000000000013', 0, 'server.fail.on.unresolved.properties', 'true', null, null, 'N', '00000000-0000-0000-0000-000000000001');

-- ps_prop_value 00000000-0000-0000-0000-000000000014 is reserved for license.server.url --

insert into ps_prop_value (id, version, name, value, long_value, description, secure, prop_sheet_id)
values ('00000000-0000-0000-0000-000000000015', 0, 'server.enforce.deployed.version.integrity', 'true', null, null, 'N', '00000000-0000-0000-0000-000000000001');

insert into ps_prop_value (id, version, name, value, long_value, description, secure, prop_sheet_id)
values ('00000000-0000-0000-0000-000000000016', 0, 'auditLogReadEntriesEnabled', 'true', null, null, 'N', '00000000-0000-0000-0000-000000000001');

--Auto Integration Lock
insert into ds_sync(name, locked, value) values ('HA-AUTO-INTEGRATION-LOCK', 'N', '0');
insert into ds_sync (name, locked) values ('createSecurityResource', 'N');
insert into ds_sync (name, locked) values ('getResourceConfigEntries', 'N');

--codestation lock
insert into ds_ptr_store_lock (id) values (0);
insert into ds_ptr_store_lock (id) values (1);
insert into ds_ptr_store_lock (id) values (2);
insert into ds_ptr_store_lock (id) values (3);
insert into ds_ptr_store_lock (id) values (4);
insert into ds_ptr_store_lock (id) values (5);
insert into ds_ptr_store_lock (id) values (6);
insert into ds_ptr_store_lock (id) values (7);
insert into ds_ptr_store_lock (id) values (8);
insert into ds_ptr_store_lock (id) values (9);
insert into ds_ptr_store_lock (id) values (10);
insert into ds_ptr_store_lock (id) values (11);
insert into ds_ptr_store_lock (id) values (12);
insert into ds_ptr_store_lock (id) values (13);
insert into ds_ptr_store_lock (id) values (14);
insert into ds_ptr_store_lock (id) values (15);

-- Process Locks
insert into ds_sync (name, locked) values ('LOCK-ACQUISITION-LOCK', 'N');

-- HATimer instance used by LicenseCleaner
insert into top_hatimer (id, fired) values ('6fee918b-7254-4bea-8757-72573674ff62', 0);

-- VC upgrade completion
insert into vc_update_tracking (update_name, completed) values ('SourceConfigPropSecurity', 'Y');

-- Add Automation Engineer role
insert into sec_role (id, version, name, description, enabled, ghosted_date) values ('152af02e-1c31-4d8c-95bf-36e20851a83d', 0, 'Automation Engineer', null, 'Y', 0);

-- Add all actions to Automation Engineer role
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-000000110004',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','20000000000000000000000000110004',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-000000110001',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','20000000000000000000000000110001',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-00000011000b',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','2000000000000000000000000011000b',null);

insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-000000130001',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','20000000000000000000000000130001',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-000000130007',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','20000000000000000000000000130007',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-00000013000d',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','2000000000000000000000000013000d',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-00000013000b',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','2000000000000000000000000013000b',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-000000130009',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','20000000000000000000000000130009',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-00000013000a',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','2000000000000000000000000013000a',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-000000130002',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','20000000000000000000000000130002',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-000000130005',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','20000000000000000000000000130005',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-00000013000c',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','2000000000000000000000000013000c',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-00000013000e',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','2000000000000000000000000013000e',null);

insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-000000140001',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','20000000000000000000000000140001',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-000000140006',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','20000000000000000000000000140006',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-00000014000a',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','2000000000000000000000000014000a',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-000000140008',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','20000000000000000000000000140008',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-000000140002',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','20000000000000000000000000140002',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-000000140004',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','20000000000000000000000000140004',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-00000014000b',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','2000000000000000000000000014000b',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-000000140009',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','20000000000000000000000000140009',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-000000140003',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','20000000000000000000000000140003',null);

insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-000000160001',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','20000000000000000000000000160001',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-000000160006',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','20000000000000000000000000160006',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-00000016000a',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','2000000000000000000000000016000a',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-000000160002',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','20000000000000000000000000160002',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-000000160008',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','20000000000000000000000000160008',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-00000016000b',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','2000000000000000000000000016000b',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-000000160009',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','20000000000000000000000000160009',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-000000160007',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','20000000000000000000000000160007',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-000000160004',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','20000000000000000000000000160004',null);

insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-000000180004',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','20000000000000000000000000180004',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-000000180002',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','20000000000000000000000000180002',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-000000180006',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','20000000000000000000000000180006',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-000000180007',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','20000000000000000000000000180007',null);

insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-000000190002',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','20000000000000000000000000190002',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-000000190001',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','20000000000000000000000000190001',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-000000190009',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','20000000000000000000000000190009',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-00000019000a',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','2000000000000000000000000019000a',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-00000019000b',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','2000000000000000000000000019000b',null);

insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-0000001c000a',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','200000000000000000000000001c000a',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-0000001c0007',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','200000000000000000000000001c0007',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-0000001c0003',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','200000000000000000000000001c0003',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-0000001c0002',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','200000000000000000000000001c0002',null);
insert into sec_role_action (id, version, sec_role_id, sec_action_id, sec_resource_role_id) values ('ff56869e-733d-4432-b228-0000001c0001',0,'152af02e-1c31-4d8c-95bf-36e20851a83d','200000000000000000000000001c0001',null);

-- Default Auth Token Restrictions
--              -- System Default
insert into sec_auth_token_restriction(id, version, name, description, ghosted_date) values
('20000001-0001-0001-0001-000000000000', 0, 'System Default', 'Used by default for any plugin steps without a specified token restriction', 0);
insert into sec_verb_to_url(id, version, restriction_id, verb, url) values
('20000001-0001-0001-0001-000000000001', 0, '20000001-0001-0001-0001-000000000000', 'ALL', '/*');

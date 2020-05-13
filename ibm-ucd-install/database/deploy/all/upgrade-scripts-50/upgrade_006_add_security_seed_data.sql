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
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000110001', 0, 'View Agents', 'View agents in this team.', 'Y', 'Y', '20000000000000000000000000000106');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000110002', 0, 'Edit Agents', 'Edit agents in this team.', 'Y', 'Y', '20000000000000000000000000000106');

insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000120001', 0, 'Create Agent Pools', 'Create new agent pools for this team.', 'Y', 'Y', '20000000000000000000000000000107');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000120002', 0, 'View Agent Pools', 'View agent pools in this team.', 'Y', 'Y', '20000000000000000000000000000107');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000120003', 0, 'Edit Agent Pools', 'Edit agent pools in this team.', 'Y', 'Y', '20000000000000000000000000000107');

insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000130001', 0, 'Create Applications', 'Create new applications for this team.', 'Y', 'Y', '20000000000000000000000000000100');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000130002', 0, 'View Applications', 'View applications in this team.', 'Y', 'Y', '20000000000000000000000000000100');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000130003', 0, 'Edit Applications', 'Edit applications in this team.', 'Y', 'Y', '20000000000000000000000000000100');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000130004', 0, 'Run Component Processes', 'Run individual component processes outside of an application process.', 'Y', 'Y', '20000000000000000000000000000100');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000130005', 0, 'Manage Snapshots', 'Manage snapshots for applications.', 'Y', 'Y', '20000000000000000000000000000100');

insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000140001', 0, 'Create Components', 'Create new components for this team.', 'Y', 'Y', '20000000000000000000000000000101');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000140002', 0, 'View Components', 'View components in this team.', 'Y', 'Y', '20000000000000000000000000000101');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000140003', 0, 'Edit Components', 'Edit components in this team.', 'Y', 'Y', '20000000000000000000000000000101');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000140004', 0, 'Manage Versions', 'Manage versions for components.', 'Y', 'Y', '20000000000000000000000000000101');

insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000150001', 0, 'Create Component Templates', 'Create new component templates for this team.', 'Y', 'Y', '20000000000000000000000000000102');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000150002', 0, 'View Component Templates', 'View component templates in this team.', 'Y', 'Y', '20000000000000000000000000000102');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000150003', 0, 'Edit Component Templates', 'Edit component templates in this team.', 'Y', 'Y', '20000000000000000000000000000102');

insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000160001', 0, 'Create Environments', 'Create new environments for this team.', 'Y', 'Y', '20000000000000000000000000000103');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000160002', 0, 'View Environments', 'View environments in this team.', 'Y', 'Y', '20000000000000000000000000000103');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000160003', 0, 'Edit Environments', 'Edit environments in this team.', 'Y', 'Y', '20000000000000000000000000000103');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000160004', 0, 'Execute on Environments', 'Execute processes on environments.', 'Y', 'Y', '20000000000000000000000000000103');

insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000170001', 0, 'Create Licenses', 'Create new licenses for this team.', 'Y', 'Y', '20000000000000000000000000000108');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000170002', 0, 'View Licenses', 'View licenses in this team.', 'Y', 'Y', '20000000000000000000000000000108');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000170003', 0, 'Edit Licenses', 'Edit licenses in this team.', 'Y', 'Y', '20000000000000000000000000000108');

insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000180001', 0, 'Create Processes', 'Create new processes for this team.', 'Y', 'Y', '20000000000000000000000000000109');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000180002', 0, 'View Processes', 'View processes in this team.', 'Y', 'Y', '20000000000000000000000000000109');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000180003', 0, 'Edit Processes', 'Edit processes in this team.', 'Y', 'Y', '20000000000000000000000000000109');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000180004', 0, 'Execute Processes', 'Execute processes.', 'Y', 'Y', '20000000000000000000000000000109');

insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000190001', 0, 'Create Resources', 'Create new resources for this team.', 'Y', 'Y', '20000000000000000000000000000104');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000190002', 0, 'View Resources', 'View resources in this team.', 'Y', 'Y', '20000000000000000000000000000104');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('20000000000000000000000000190003', 0, 'Edit Resources', 'Edit resources in this team.', 'Y', 'Y', '20000000000000000000000000000104');

insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('200000000000000000000000001a0001', 0, 'Create Resource Groups', 'Create new resource groups for this team.', 'Y', 'Y', '20000000000000000000000000000105');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('200000000000000000000000001a0002', 0, 'View Resource Groups', 'View resource groups in this team.', 'Y', 'Y', '20000000000000000000000000000105');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('200000000000000000000000001a0003', 0, 'Edit Resource Groups', 'Edit resource groups in this team.', 'Y', 'Y', '20000000000000000000000000000105');

insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('200000000000000000000000001b0001', 0, 'Add Team Members', 'Add new members to this team.', 'Y', 'Y', '20000000000000000000000000000201');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('200000000000000000000000001b0002', 0, 'Manage Resource Roles', 'Create and edit resource roles.', 'Y', 'Y', '20000000000000000000000000000201');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('200000000000000000000000001b0003', 0, 'Manage Security', 'Change general security settings, including roles, authentication, and group membership.', 'Y', 'Y', '20000000000000000000000000000201');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('200000000000000000000000001b0004', 0, 'Manage Plugins', 'Add and remove plugins.', 'Y', 'Y', '20000000000000000000000000000201');

insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('200000000000000000000000001c0001', 0, 'Components Tab', 'Manage components.', 'Y', 'Y', '20000000000000000000000000000200');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('200000000000000000000000001c0002', 0, 'Applications Tab', 'Manage applications.', 'Y', 'Y', '20000000000000000000000000000200');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('200000000000000000000000001c0003', 0, 'Resources Tab', 'Manage resources.', 'Y', 'Y', '20000000000000000000000000000200');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('200000000000000000000000001c0004', 0, 'Calendar Tab', 'Manage release calendars.', 'Y', 'Y', '20000000000000000000000000000200');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('200000000000000000000000001c0005', 0, 'Work Items Tab', 'Manage work items.', 'Y', 'Y', '20000000000000000000000000000200');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('200000000000000000000000001c0006', 0, 'Settings Tab', 'Manage server settings.', 'Y', 'Y', '20000000000000000000000000000200');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('200000000000000000000000001c0007', 0, 'Dashboard Tab', 'View the dashboard.', 'Y', 'Y', '20000000000000000000000000000200');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('200000000000000000000000001c0008', 0, 'Configuration Tab', 'View the configuration tree.', 'Y', 'Y', '20000000000000000000000000000200');
insert into sec_action (id, version, name, description, enabled, cascading, sec_resource_type_id)
values ('200000000000000000000000001c0009', 0, 'Reports Tab', 'View the reports tab.', 'Y', 'Y', '20000000000000000000000000000200');

insert into sec_role (id, version, name, description, enabled)
values ('20000000000000000000000000010001', 0, 'Administrator', '', 'Y');

insert into sec_role_action (id, version, sec_role_id, sec_action_id)
select id, 0, '20000000000000000000000000010001', id
from sec_action
where id != '200000000000000000000000001c0008'
  and id != '200000000000000000000000001c000a';

insert into sec_team_space (id, version, enabled, name, description)
values ('20000000000000000000000100000000', 0, 'Y', 'System Team', 'The system team always contains all objects in the system.');

insert into sec_user_role_on_team (id, version, sec_user_id, sec_role_id, sec_team_space_id)
values ('20000000000000000000000011000000', 0, '20000000000000000000000001000000', '20000000000000000000000000010001', '20000000000000000000000100000000');

-- Licensed Materials - Property of IBM* and/or HCL**
-- UrbanCode Deploy
-- UrbanCode Build
-- UrbanCode Release
-- AnthillPro
-- (c) Copyright IBM Corporation 2011, 2017. All Rights Reserved.
-- (c) Copyright HCL Technologies Ltd. 2018. All Rights Reserved.
--
-- U.S. Government Users Restricted Rights - Use, duplication or disclosure restricted by
-- GSA ADP Schedule Contract with IBM Corp.
--
-- * Trademark of International Business Machines
-- ** Trademark of HCL Technologies Limited
-- inv_resource_inventory
create index inv_res_inv_resource_id on inv_resource_inventory(resource_id);
create index inv_res_inv_version_id on inv_resource_inventory(version_id);
create index inv_res_inv_component_id on inv_resource_inventory(component_id);
create index inv_res_inv_request_id on inv_resource_inventory(deployment_request_id);
create index inv_res_inv_comp_res on inv_resource_inventory(ghosted_date, component_id, resource_id);

-- inv_desired_inventory
create index inv_des_inv_environment_id on inv_desired_inventory(environment_id, ghosted_date, date_created desc);
create index inv_des_inv_version_id on inv_desired_inventory(version_id);
create index inv_des_inv_component_id on inv_desired_inventory(component_id);
create index inv_des_inv_request_id on inv_desired_inventory(deployment_request_id);
create unique index inv_unique_desired_entry on inv_desired_inventory (environment_id, role_id, version_id, component_id, status, ghosted_date);

-- inv_env_prop_inventory
create index inv_env_prop_environment_id on inv_env_prop_inventory(environment_id);
create index inv_env_prop_component_id on inv_env_prop_inventory(component_id);
create index inv_env_prop_request_id on inv_env_prop_inventory(deployment_request_id);

-- inv_resource_config_inventory
create index inv_res_conf_resource_id on inv_resource_config_inventory(resource_id);
create index inv_res_conf_prop_sheet_path on inv_resource_config_inventory(prop_sheet_path);
create index inv_res_conf_request_id on inv_resource_config_inventory(deployment_request_id);
create index inv_res_conf_resprop on inv_resource_config_inventory(ghosted_date, resource_id, prop_sheet_path);

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
alter table sec_action add constraint sa_sec_resource_type_fk
    foreign key (sec_resource_type_id)
    references sec_resource_type (id)
;

alter table sec_auth_token add constraint set_sec_user_fk
    foreign key (sec_user_id)
    references sec_user (id)
;

alter table sec_authentication_realm_prop add constraint sarp_authentication_realm_fk
    foreign key (sec_authentication_realm_id)
    references sec_authentication_realm (id)
;

alter table sec_authorization_realm_prop add constraint sarp_authorization_realm_fk
    foreign key (sec_authorization_realm_id)
    references sec_authorization_realm (id)
;

alter table sec_group add constraint sg_sec_authorization_realm_fk
    foreign key (sec_authorization_realm_id)
    references sec_authorization_realm (id)
;

alter table sec_group_mapping add constraint sgm_sec_group_mapper_fk
    foreign key (sec_group_mapper_id)
    references sec_group_mapper (id)
;

alter table sec_group_role_on_team add constraint sgrot_sec_group_fk
    foreign key (sec_group_id)
    references sec_group (id)
;

alter table sec_group_role_on_team add constraint sgrot_sec_role_fk
    foreign key (sec_role_id)
    references sec_role (id)
;

alter table sec_group_role_on_team add constraint sgrot_sec_team_space_fk
    foreign key (sec_team_space_id)
    references sec_team_space (id)
;

alter table sec_realm_mapping add constraint srm_authentication_realm_fk
    foreign key (authentication_realm_id)
    references sec_authentication_realm(id)
;

alter table sec_realm_mapping add constraint srm_authorization_realm_fk
    foreign key (authorization_realm_id)
    references sec_authorization_realm(id)
;

alter table sec_resource add constraint sr_sec_resource_type_fk
    foreign key (sec_resource_type_id)
    references sec_resource_type (id)
;

alter table sec_resource_for_team add constraint srft_sec_resource_fk
    foreign key (sec_resource_id)
    references sec_resource (id)
;

alter table sec_resource_for_team add constraint srft_sec_team_space_fk
    foreign key (sec_team_space_id)
    references sec_team_space (id)
;

alter table sec_resource_for_team add constraint srft_sec_resource_role_fk
    foreign key (sec_resource_role_id)
    references sec_resource_role (id)
;

alter table sec_resource_hierarchy add constraint srh_parent_sec_resource_fk
    foreign key (parent_sec_resource_id)
    references sec_resource (id)
;

alter table sec_resource_hierarchy add constraint srh_child_sec_resource_fk
    foreign key (child_sec_resource_id)
    references sec_resource (id)
;

alter table sec_resource_role add constraint srr_sec_resource_type_fk
    foreign key (sec_resource_type_id)
    references sec_resource_type (id)
;

alter table sec_role_action add constraint srar_sec_role_fk
    foreign key (sec_role_id)
    references sec_role (id)
;

alter table sec_role_action add constraint srar_sec_action_fk
    foreign key (sec_action_id)
    references sec_action (id)
;

alter table sec_role_action add constraint srar_sec_resource_role_fk
    foreign key (sec_resource_role_id)
    references sec_resource_role (id)
;

alter table sec_user add constraint su_sec_authentication_realm_fk
    foreign key (sec_authentication_realm_id)
    references sec_authentication_realm (id)
;

alter table sec_user_property add constraint sup_sec_user_fk
    foreign key (sec_user_id)
    references sec_user (id)
;

alter table sec_user_role_on_team add constraint surot_sec_user_fk
    foreign key (sec_user_id)
    references sec_user (id)
;

alter table sec_user_role_on_team add constraint surot_sec_role_fk
    foreign key (sec_role_id)
    references sec_role (id)
;

alter table sec_user_role_on_team add constraint surot_sec_team_space_fk
    foreign key (sec_team_space_id)
    references sec_team_space (id)
;

alter table sec_user_to_group add constraint sutg_sec_user_fk
    foreign key (sec_user_id)
    references sec_user (id)
;

alter table sec_user_to_group add constraint sutg_sec_group_fk
    foreign key (sec_group_id)
    references sec_group (id)
;
create index sec_internal_user_name_ix
    on sec_internal_user (name);

create unique index action_resource_role_mapping
    on sec_role_action(sec_role_id, sec_action_id, sec_resource_role_id);

create index sec_action_name
        on sec_action(name);

create unique index sec_auth_token_uc
        on sec_auth_token(token);

create unique index sec_name_realm_mapping
        on sec_group(name, sec_authorization_realm_id);

create unique index sec_group_role_team_mapping
        on sec_group_role_on_team(sec_group_id, sec_role_id, sec_team_space_id);

create unique index sec_resource_role_name
        on sec_resource_role(name, ghosted_date);

create unique index sec_role_name
        on sec_role(name, ghosted_date);

create unique index sec_team_space_name
        on sec_team_space(name);

create unique index sec_user_uc
        on sec_user(name, sec_authentication_realm_id, ghosted_date);

create unique index sec_user_property_uc
        on sec_user_property(name, sec_user_id);

create unique index sec_user_role_on_team_mapping
        on sec_user_role_on_team(sec_user_id, sec_role_id, sec_team_space_id);

create unique index sec_user_group_mapping
        on sec_user_to_group(sec_user_id, sec_group_id);

create index sec_action_res_type
        on sec_action(sec_resource_type_id);

create index sec_auth_token_exp
        on sec_auth_token(expiration);

create index sec_auth_token_usr
        on sec_auth_token(sec_user_id);

create index sec_group_mapping_group_mapper
        on sec_group_mapping(sec_group_mapper_id);

create index sec_authz_rlm_prop_authz_rlm
        on sec_authorization_realm_prop(sec_authorization_realm_id);

create index sec_authn_rlm_prop_authn_rlm
        on sec_authentication_realm_prop(sec_authentication_realm_id);

create index sec_res_res_type
        on sec_resource(sec_resource_type_id);

create index sec_res_role_res_type
        on sec_resource_role(sec_resource_type_id);

create index sec_grot_role
        on sec_group_role_on_team(sec_role_id);

create index sec_grot_team_space
        on sec_group_role_on_team(sec_team_space_id);

create index sec_group_author_realm
        on sec_group(sec_authorization_realm_id);

create index sec_role_action_sec_action
        on sec_role_action(sec_action_id);

create index sec_role_action_res_role
        on sec_role_action(sec_resource_role_id);

create index sec_rft_res_role
        on sec_resource_for_team(sec_resource_role_id);

create index sec_rft_team_space
        on sec_resource_for_team(sec_team_space_id);

create index sec_res_hier_child_sec_res
        on sec_resource_hierarchy(child_sec_resource_id);

create index sec_user_prop_user_id
        on sec_user_property(sec_user_id);

create index sec_urot_role_id
        on sec_user_role_on_team(sec_role_id);

create index sec_utg_gid
        on sec_user_to_group(sec_group_id);

create index sec_user_auth_realm
        on sec_user(sec_authentication_realm_id);

create unique index action_resource_role_map
        on sec_role_action(sec_action_id, sec_resource_role_id, sec_role_id);

create unique index sec_user_role_on_team_map
        on sec_user_role_on_team(sec_team_space_id, sec_role_id, sec_user_id);

create unique index sec_user_group_map
        on sec_user_to_group(sec_group_id, sec_user_id);

-- the three indexes below use a different column order so we can have better
-- performance of queries that are concerned with different combinations of the columns.
-- With more performance data we might be able to decide which of these are the most necessary.
create unique index team_resource_team_map
        on sec_resource_for_team(sec_team_space_id, sec_resource_role_id, sec_resource_id);
create unique index team_resource_role_mapping
        on sec_resource_for_team(sec_resource_id, sec_team_space_id, sec_resource_role_id);
create unique index team_resource_role_map
        on sec_resource_for_team(sec_resource_role_id, sec_team_space_id, sec_resource_id);

create unique index sec_token_restriction_name_uci
        on sec_auth_token_restriction(name, ghosted_date);
--**************************************************************************************************
-- Calendar
--**************************************************************************************************

-- cal_blackout
create index cal_blackout_calendar_id on cal_blackout(calendar_id);
alter table cal_blackout add constraint cal_blackout_2_cal_calendar foreign key (calendar_id) references cal_calendar (id);

-- cal_entry
create index cal_ce_fired on cal_entry(fired);
create index cal_ce_sched_date on cal_entry(scheduled_date);

-- cal_entry_to_calendar
create index cal_entry_to_calendar_cal_id on cal_entry_to_calendar(calendar_id);
create index cal_entry_to_calendar_entry_id on cal_entry_to_calendar(entry_id);
alter table cal_entry_to_calendar add constraint ce2c_2_entry foreign key(entry_id) references cal_entry(id);
alter table cal_entry_to_calendar add constraint ce2c_2_calendar foreign key(calendar_id) references cal_calendar(id);

-- cal_recurring_entry_to_cal
create index cal_re2c_cal_id on cal_recurring_entry_to_cal(calendar_id);
create index cal_re2c_rec_entry_id on cal_recurring_entry_to_cal(recurring_entry_id);
alter table cal_recurring_entry_to_cal add constraint cre2c_2_recurring_entry foreign key(recurring_entry_id) references cal_recurring_entry(id);
alter table cal_recurring_entry_to_cal add constraint cre2c_2_calendar foreign key(calendar_id) references cal_calendar(id);



--**************************************************************************************************
-- Deploy Server
--**************************************************************************************************

-- ds_tag
create unique index ds_tag_name_uci on ds_tag(name, object_type);
create index ds_tag_object_type on ds_tag(object_type);
create index ds_tag_name on ds_tag(name);

-- ds_agent
create unique index ds_agent_name_uci on ds_agent(name, ghosted_date);
create index ds_agent_endpoint_id on ds_agent(endpoint_id);
create index ds_agent_sec_resource_id on ds_agent(sec_resource_id);
create index ds_agent_relay_id on ds_agent(relay_id, ghosted_date);
create index ds_agn_key_endptid on ds_agent(apikey_id, endpoint_id);
create index ds_agent_ghoststatus on ds_agent(ghosted_date, last_status, id);
alter table ds_agent add constraint agent_2_apikey foreign key(apikey_id) references ds_apikey(id);

-- ds_apikey
create unique index ds_apikey_uci on ds_apikey(apikey);
create index ds_apikey_user_id on ds_apikey(sec_user_id);
alter table ds_apikey add constraint apikey_2_user foreign key(sec_user_id) references sec_user(id);

-- ds_agent_pool
create index ds_agent_pool_sec_resource_id on ds_agent_pool(sec_resource_id);

-- ds_agent_to_pool
create unique index ds_agent_pool_name_uci on ds_agent_pool(name, ghosted_date);
create index ds_a2p_agent_id on ds_agent_to_pool(agent_id);
create index ds_a2p_pool_id on ds_agent_to_pool(pool_id);
alter table ds_agent_to_pool add constraint ds_agent_to_pool_2_agent foreign key(agent_id) references ds_agent(id);
alter table ds_agent_to_pool add constraint ds_agent_to_pool_2_pool foreign key(pool_id) references ds_agent_pool(id);

-- ds_resource
create index ds_resource_agent_id on ds_resource(agent_id);
create index ds_resource_agent_pool_id on ds_resource(agent_pool_id);
create index ds_resource_component_tag_id on ds_resource(component_tag_id);
create index ds_resource_parent_id on ds_resource(parent_id);
create index ds_resource_res_template_id on ds_resource(resource_template_id);
create index ds_resource_sec_resource_id on ds_resource(sec_resource_id);
create index ds_resource_role_id on ds_resource(role_id);
create index ds_res_sec_res on ds_resource(ghosted_date, active, resource_template_id, parent_id, name, sec_resource_id);
create index ds_res_sec_res_no_templ on ds_resource(ghosted_date, active, parent_id, sec_resource_id);
alter table ds_resource add constraint ds_resource_2_agent foreign key(agent_id) references ds_agent(id);
alter table ds_resource add constraint ds_resource_2_agent_pool foreign key(agent_pool_id) references ds_agent_pool(id);
alter table ds_resource add constraint ds_resource_2_component_tag foreign key(component_tag_id) references ds_tag(id);
alter table ds_resource add constraint ds_resource_2_parent foreign key(parent_id) references ds_resource(id);
alter table ds_resource add constraint ds_resource_2_res_template foreign key(resource_template_id) references ds_resource_template(id);
alter table ds_resource add constraint ds_resource_2_role foreign key(role_id) references ds_resource_role(id);

-- ds_resource_template
create index ds_resource_template_sr_id on ds_resource_template(sec_resource_id);
create index ds_resource_template_app_id on ds_resource_template(application_id);
alter table ds_resource_template add constraint ds_resource_template_2_app foreign key(application_id) references ds_application(id);
create index ds_resource_template_prnt_id on ds_resource_template(parent_id);
alter table ds_resource_template add constraint ds_resource_template_2_parent foreign key(parent_id) references ds_resource_template(id);

-- ds_cloud_connection
create unique index ds_cloud_connection_uci on ds_cloud_connection(url, username, ghosted_date);
create index ds_cloud_connection_url on ds_cloud_connection(url);
create index ds_cloud_connection_sr_id on ds_cloud_connection(sec_resource_id);


-- ds_resource_role
create index ds_res_role_psd_id on ds_resource_role(prop_sheet_def_id);

-- ds_res_role_allowed_parent
create index ds_rrap_res_role_id on ds_res_role_allowed_parent(resource_role_id);
create index ds_rrap_allowed_parent_id on ds_res_role_allowed_parent(allowed_parent_id);
create index ds_rrap_foldername on ds_res_role_allowed_parent(foldername);
alter table ds_res_role_allowed_parent add constraint ds_rrap_2_res_role foreign key(resource_role_id) references ds_resource_role(id);
alter table ds_res_role_allowed_parent add constraint ds_rrap_2_allowed_parent foreign key(allowed_parent_id) references ds_resource_role(id);

-- ds_res_role_default_child
create index ds_rrdc_res_role_id on ds_res_role_default_child(resource_role_id);
create index ds_rrdc_child on ds_res_role_default_child(child_folder_name);
alter table ds_res_role_default_child add constraint ds_rrdc_2_res_role foreign key(resource_role_id) references ds_resource_role(id);


-- ds_resource_to_tag
create index ds_r2t_resource_id on ds_resource_to_tag(resource_id);
create index ds_r2t_tag_id on ds_resource_to_tag(tag_id);
alter table ds_resource_to_tag add constraint ds_r2t_2_resource foreign key(resource_id) references ds_resource(id);
alter table ds_resource_to_tag add constraint ds_r2t_2_role foreign key(tag_id) references ds_tag(id);

-- ds_discovery_execution
create index ds_disc_exec_command_id on ds_discovery_execution(command_id);
create index ds_disc_exec_resource_id on ds_discovery_execution(resource_id);
create index ds_disc_exec_agent_id on ds_discovery_execution(agent_id);
create index ds_disc_exec_start_time on ds_discovery_execution(start_time);
alter table ds_discovery_execution add constraint ds_disc_exec_2_command foreign key(command_id) references pl_plugin_command(id);
alter table ds_discovery_execution add constraint ds_disc_exec_2_resource foreign key(resource_id) references ds_resource(id);
alter table ds_discovery_execution add constraint ds_disc_exec_2_agent foreign key(agent_id) references ds_agent(id);

-- ds_component
create unique index ds_component_name_uci on ds_component(name, ghosted_date);
create index ds_cmp_res_role_id on ds_component(resource_role_id);
create index ds_cmp_calendar_id on ds_component(calendar_id);
create index ds_cmp_ver_creation_env_id on ds_component(version_creation_env_id);
alter table ds_component add constraint ds_cmp_2_res_role foreign key(resource_role_id) references ds_resource_role(id);
alter table ds_component add constraint ds_cmp_2_calendar foreign key(calendar_id) references cal_calendar(id);
alter table ds_component add constraint ds_cmp_2_ver_creation_env_id foreign key(version_creation_env_id) references ds_environment(id);

-- ds_component_to_tag
create index ds_cmp_to_tag_comp_id on ds_component_to_tag(component_id);

-- ds_component_process_lock
create unique index ds_proc_lock_uci on ds_process_lock(process_id);

-- ds_version
create unique index ds_version_name_uci on ds_version(component_id, name);
create index ds_version_cmp_id on ds_version(component_id);
create index ds_version_last_mod on ds_version(last_modified);
alter table ds_version add constraint ds_package_2_cmp foreign key(component_id) references ds_component(id);

-- ds_version_status
create unique index ds_ver_status_uci on ds_version_status(version_id, status_name);
create index ds_ver_status_version_id on ds_version_status(version_id);
alter table ds_version_status add constraint ds_ver_status_2_ver foreign key(version_id) references ds_version(id);

-- ds_notification_entry
create index ds_not_entry_not_scheme_id on ds_notification_entry(notification_scheme_id);
alter table ds_notification_entry add constraint ds_not_entry_2_not_scheme foreign key(notification_scheme_id) references ds_notification_scheme(id);

-- ds_application
create unique index ds_application_name_uci on ds_application(name, ghosted_date);
create index ds_app_not_scheme_id on ds_application(notification_scheme_id);
create index ds_application_calendar_id on ds_application(calendar_id);
create index ds_application_template_id on ds_application(template_id);
alter table ds_application add constraint ds_application_2_calendar foreign key(calendar_id) references cal_calendar(id);
alter table ds_application add constraint ds_application_2_not_scheme foreign key(notification_scheme_id) references ds_notification_scheme(id);

-- ds_application_to_component
create index ds_app_to_cmp_application_id on ds_application_to_component(application_id);
create index ds_app_to_cmp_component_id on ds_application_to_component(component_id);
alter table ds_application_to_component add constraint ds_app_cmp_2_app foreign key(application_id) references ds_application(id);
alter table ds_application_to_component add constraint ds_app_cmp_2_cmp foreign key(component_id) references ds_component(id);

-- ds_environment
create unique index ds_env_name_uci on ds_environment(application_id, name, ghosted_date);
create index ds_env_app_id on ds_environment(application_id);
create index ds_env_cal_id on ds_environment(calendar_id);
create index ds_environment_res_template_id on ds_environment(resource_template_id);
create index ds_environment_template_id on ds_environment(template_id);
alter table ds_environment add constraint ds_env_2_application foreign key(application_id) references ds_application(id);
alter table ds_environment add constraint ds_env_2_cal_calendar foreign key(calendar_id) references cal_calendar(id);
alter table ds_environment add constraint ds_environment_2_res_template foreign key(resource_template_id) references ds_resource_template(id);

-- ds_environment_to_resource
create index ds_env_to_res_environment_id on ds_environment_to_resource(environment_id);
create index ds_env_to_res_resource_id on ds_environment_to_resource(resource_id);
alter table ds_environment_to_resource add constraint ds_env_to_res_2_env foreign key(environment_id) references ds_environment(id);
alter table ds_environment_to_resource add constraint ds_env_to_res_2_res foreign key(resource_id) references ds_resource(id);

-- ds_env_ver_condition
alter table ds_env_ver_condition add constraint ds_evc_to_environment foreign key(environment_id) references ds_environment(id);
create index ds_evc_id on ds_env_ver_condition(environment_id);

-- ds_plugin_task_request
create index ds_ptr_lrt on ds_plugin_task_request(acked, last_resend_time);

-- ds_prop_cmp_env_mapping
create unique index ds_pce_map_uci on ds_prop_cmp_env_mapping(environment_id, component_id);
create index ds_pce_map_env_id on ds_prop_cmp_env_mapping(environment_id);
create index ds_pce_map_cmp_id on ds_prop_cmp_env_mapping(component_id);
create index ds_pce_map_prop_sheet_id on ds_prop_cmp_env_mapping(prop_sheet_id);
alter table ds_prop_cmp_env_mapping add constraint ds_pce_map_2_environment foreign key (environment_id) references ds_environment(id);
alter table ds_prop_cmp_env_mapping add constraint ds_pce_map_2_component foreign key (component_id) references ds_component(id);

-- ds_snapshot
create unique index ds_snapshot_uci on ds_snapshot(application_id, name, ghosted_date);
create index ds_snap_app_id on ds_snapshot(application_id);
create index ds_snap_prop_sheet_id on ds_snapshot(prop_sheet_id);
create index ds_snap_last_mod on ds_snapshot(last_modified);
alter table ds_snapshot add constraint ds_snapshot_2_app foreign key(application_id) references ds_application(id);

-- ds_snapshot_to_version
create index ds_snap_to_ver_as_id on ds_snapshot_to_version(snapshot_id);
create index ds_snap_to_ver_pkg_id on ds_snapshot_to_version(version_id);
alter table ds_snapshot_to_version add constraint ds_s2ver_to_snapshot foreign key(snapshot_id) references ds_snapshot(id);
alter table ds_snapshot_to_version add constraint ds_s2ver_to_version foreign key(version_id) references ds_version(id);

-- ds_snapshot_config_version
create unique index ds_scv_alldata on ds_snapshot_config_version(snapshot_id, path, persistent_version);
alter table ds_snapshot_config_version add constraint ds_scv_to_snapshot foreign key(snapshot_id) references ds_snapshot(id);

-- ds_status
create unique index ds_status_uci on ds_status(name, status_type, ghosted_date);
create index ds_status_name on ds_status(name);
create index ds_status_type on ds_status(status_type);

-- ds_external_environment
create index ds_ext_env_env_id on ds_ext_environment(environment_id);
create index ds_ext_env_provider_id on ds_ext_environment(integration_provider_id);
alter table ds_ext_environment add constraint ds_ext_env_2_environment foreign key(environment_id) references ds_environment(id);
alter table ds_ext_environment add constraint ds_ext_env_2_int_provider foreign key(integration_provider_id) references ds_integration_provider(id);

-- ds_server
create unique index ds_server_uci on ds_server(server_id, ghosted_date);

-- rt_property_context
create index rt_pc_prop_sheet_id on rt_property_context(prop_sheet_id);

-- rt_property_context_group_map
create index rt_pcgm_pc_id on rt_property_context_group_map(property_context_id, index_order);
create index rt_pcgm_prop_sheet_id on rt_property_context_group_map(prop_sheet_id);
alter table rt_property_context_group_map add constraint rt_pcgm_to_ds_pc foreign key(property_context_id) references rt_property_context(id);

-- rt_process_request
create index rt_pr_process_path on rt_process_request(process_path);
create index rt_pr_process_version on rt_process_request(process_version);
create index rt_pr_trace_id on rt_process_request(trace_id);
create index rt_pr_prop_context_id on rt_process_request(property_context_id);
alter table rt_process_request add constraint rt_proc_req_to_prop_context foreign key(property_context_id) references rt_property_context(id);

-- rt_app_process_request
create index rt_apr_app_id on rt_app_process_request(application_id);
create index rt_apr_env_id on rt_app_process_request(environment_id);
create index rt_apr_prop_context_id on rt_app_process_request(property_context_id);
create index rt_apr_cal_entry_id on rt_app_process_request(calendar_entry_id);
create index rt_apr_appr_id on rt_app_process_request(approval_id);
create index rt_apr_snap_id on rt_app_process_request(snapshot_id);
create index rt_apr_dr_id on rt_app_process_request(deployment_request_id);
create index rt_apr_trace_id on rt_app_process_request(trace_id);
create index rt_apr_submitted_time on rt_app_process_request(submitted_time);
alter table rt_app_process_request add constraint rt_app_req_to_depl_req foreign key(deployment_request_id) references rt_deployment_request(id);
alter table rt_app_process_request add constraint rt_app_req_to_app foreign key(application_id) references ds_application(id);
alter table rt_app_process_request add constraint rt_app_req_to_env foreign key(environment_id) references ds_environment(id);
alter table rt_app_process_request add constraint rt_app_req_to_prop_context foreign key(property_context_id) references rt_property_context(id);
alter table rt_app_process_request add constraint rt_app_req_to_cal_entry foreign key(calendar_entry_id) references cal_entry(id);
alter table rt_app_process_request add constraint rt_app_req_to_snap foreign key(snapshot_id) references ds_snapshot(id);

-- rt_app_proc_req_to_version
create index rt_apr2ver_apr_id on rt_app_proc_req_to_version(app_process_request_id);
create index rt_apr2ver_ver_id on rt_app_proc_req_to_version(version_id);
alter table rt_app_proc_req_to_version add constraint rt_apr2ver_to_apr foreign key(app_process_request_id) references rt_app_process_request(id);
alter table rt_app_proc_req_to_version add constraint rt_apr2ver_to_version foreign key(version_id) references ds_version(id);

-- rt_version_selector
create index rt_apr2ver_sel_apr_id on rt_version_selector(application_process_request_id);
create index rt_apr2ver_sel_sna_id on rt_version_selector(snapshot_id);
create index rt_apr2ver_sel_cmp_id on rt_version_selector(component_id);
create index rt_apr2ver_sel_env_id on rt_version_selector(environment_id);
alter table rt_version_selector add constraint ver_sel2apr foreign key(application_process_request_id) references rt_app_process_request(id);
alter table rt_version_selector add constraint ver_sel2com foreign key(component_id) references ds_component(id);
alter table rt_version_selector add constraint ver_sel2env foreign key(environment_id) references ds_environment(id);
alter table rt_version_selector add constraint ver_sel2snap foreign key(snapshot_id) references ds_snapshot(id);

-- rt_comp_process_request
create index rt_cpr_app_id on rt_comp_process_request(application_id);
create index rt_cpr_env_id on rt_comp_process_request(environment_id);
create index rt_cpr_prop_context_id on rt_comp_process_request(property_context_id);
create index rt_cpr_cal_entry_id on rt_comp_process_request(calendar_entry_id);
create index rt_cpr_comp_id on rt_comp_process_request(component_id);
create index rt_cpr_version_id on rt_comp_process_request(version_id);
create index rt_cpr_res_id on rt_comp_process_request(resource_id);
create index rt_cpr_agent_id on rt_comp_process_request(agent_id);
create index rt_cpr_par_req_id on rt_comp_process_request(parent_request_id);
create index rt_cpr_appr_id on rt_comp_process_request(approval_id);
create index rt_cpr_trace_id on rt_comp_process_request(trace_id);
create index rt_cpr_submitted_time on rt_comp_process_request(component_id, submitted_time);
alter table rt_comp_process_request add constraint rt_comp_req_to_app foreign key(application_id) references ds_application(id);
alter table rt_comp_process_request add constraint rt_comp_req_to_env foreign key(environment_id) references ds_environment(id);
alter table rt_comp_process_request add constraint rt_comp_req_to_prop_context foreign key(property_context_id) references rt_property_context(id);
alter table rt_comp_process_request add constraint rt_comp_req_to_cal_entry foreign key(calendar_entry_id) references cal_entry(id);
alter table rt_comp_process_request add constraint rt_comp_req_to_comp foreign key(component_id) references ds_component(id);
alter table rt_comp_process_request add constraint rt_comp_req_to_version foreign key(version_id) references ds_version(id);
alter table rt_comp_process_request add constraint rt_comp_req_to_res foreign key(resource_id) references ds_resource(id);
alter table rt_comp_process_request add constraint rt_comp_req_to_agent foreign key(agent_id) references ds_agent(id);

-- rt_stack_execution_record
create index rt_stack_exec_result on rt_stack_execution_record(result);
create index rt_stack_exec_last_updated on rt_stack_execution_record(last_updated);
create index rt_stack_exec_app_request_id on rt_stack_execution_record(app_process_request_id);
alter table rt_stack_execution_record add constraint rt_stackexec_to_apr foreign key(app_process_request_id) references rt_app_process_request(id);
alter table rt_stack_execution_record add constraint rt_stackexec_to_inv_prov foreign key(provider_id) references ds_integration_provider(id);



--**************************************************************************************************
-- Manual Tasks
--**************************************************************************************************

-- tsk_approval
create index tsk_appr_prop_sheet_id on tsk_approval(prop_sheet_id);

-- tsk_task
create index tsk_task_prop_sheet_id on tsk_task(prop_sheet_id);

-- tsk_task_resource_role_map
create index tsk_trr_map_task_id on tsk_task_resource_role_map(task_id);
alter table tsk_task_resource_role_map add constraint tsk_trr_map_2_task foreign key(task_id) references tsk_task(id);

-- tsk_task_member_map
create index tsk_tm_map_task_id on tsk_task_member_map(task_id);
alter table tsk_task_member_map add constraint tsk_tm_map_2_task foreign key(task_id) references tsk_task(id);

-- tsk_approval_to_task
create index tsk_a2t_approval_id on tsk_approval_to_task(approval_id);
create index tsk_a2t_task_id on tsk_approval_to_task(task_id);

-- tsk_promotion
create unique index tsk_promotion_proc_date_ended on tsk_promotion(component_process_id, date_ended);

--**************************************************************************************************
-- Plugin System
--**************************************************************************************************

-- pl_plugin
create unique index pl_plugin_uci on pl_plugin(plugin_id, plugin_version, ghosted_date);
create index pl_plugin_plugin_id on pl_plugin(plugin_id);

-- pl_plugin_command
create unique index pl_plugin_command_uci on pl_plugin_command(plugin_id, name);
create index pl_plg_cmd_plugin_id on pl_plugin_command(plugin_id);
create index pl_plg_cmd_prop_sheet_def_id on pl_plugin_command(prop_sheet_def_id);
alter table pl_plugin_command add constraint pl_plg_cmd_2_plugin foreign key(plugin_id) references pl_plugin(id);

-- pl_plugin_role
create index pl_plg_role_role_id on pl_plugin_role(role_id);

-- pl_command_to_resource_role
create index ds_c2rr_command_id on pl_command_to_resource_role(command_id);
create index ds_c2rr_resource_role_id on pl_command_to_resource_role(resource_role_id);
alter table pl_command_to_resource_role add constraint ds_c2rr_2_command foreign key(command_id) references pl_plugin_command(id);
alter table pl_command_to_resource_role add constraint ds_c2rr_2_resource_role foreign key(resource_role_id) references ds_resource_role(id);

-- pl_source_config_plugin
create unique index pl_source_config_plugin_uci on pl_source_config_plugin(plugin_id, plugin_version, ghosted_date);
create index pl_source_config_plugin_id on pl_source_config_plugin(plugin_id);

-- pl_source_config_execution
create index pl_src_config_exe_comp_id on pl_source_config_execution(component_id);
create index pl_src_config_ag_id on pl_source_config_execution(agent_id);
create index pl_src_config_status on pl_source_config_execution(status);
create index pl_src_config_request_time on pl_source_config_execution(request_time);
create index pl_src_config_start_time on pl_source_config_execution(start_time);


--**************************************************************************************************
-- Network data
--**************************************************************************************************

-- ds_network_relay
create unique index ds_network_relay_name_uci on ds_network_relay(name);



--**************************************************************************************************
-- Reporting
--**************************************************************************************************

-- rp_app_req_plugin
create index rp_app_req_plugin_id on rp_app_req_plugin(app_request_id, plugin_name);
create index rp_app_req_plugin_name on rp_app_req_plugin(plugin_name);


--**************************************************************************************************
-- Auditing
--**************************************************************************************************

-- ds_audit_entry
create index ds_audit_entry_user_id on ds_audit_entry(user_id);
create index ds_audit_entry_user_name on ds_audit_entry(user_name);
create index ds_audit_entry_event_type on ds_audit_entry(event_type);
create index ds_audit_entry_description on ds_audit_entry(description);
create index ds_audit_entry_obj_type on ds_audit_entry(obj_type);
create index ds_audit_entry_obj_name on ds_audit_entry(obj_name);
create index ds_audit_entry_obj_id on ds_audit_entry(obj_id);
create index ds_audit_entry_created_date on ds_audit_entry(created_date);
create index ds_audit_entry_status on ds_audit_entry(status);
create index ds_audit_entry_deletable on ds_audit_entry(deletable);
create index ds_audit_entry_ip on ds_audit_entry(ip_address);

-- ds_request_audit_entry
create index ds_req_audit_user_id on ds_request_audit_entry(user_id);
create index ds_req_audit_short_url on ds_request_audit_entry(short_url);
create index ds_req_audit_duration on ds_request_audit_entry(duration);
create index ds_req_audit_method on ds_request_audit_entry(method);
create index ds_req_audit_date_created on ds_request_audit_entry(date_created);

--**************************************************************************************************
-- Licensing
--**************************************************************************************************

-- ds_agent_usage
create index ds_agent_usage_time on ds_agent_usage(time_stamp);
create index ds_agent_usage_count on ds_agent_usage(count);

--**************************************************************************************************
-- History Cleanup
--**************************************************************************************************

-- ds_history_cleanup_record
create index ds_historycleanup_datestarted on ds_history_cleanup_record(date_cleanup_started);

--**************************************************************************************************
-- VC Metadata
--**************************************************************************************************

-- process plugin usage
create index ds_ppum_command_id on ds_plugin_usage_metadata(command_id);
create index ds_ppum_component_id on ds_plugin_usage_metadata(component_id);
create index ds_ppum_temp_proc_names on ds_plugin_usage_metadata(component_template_name, process_name);
create index ds_ppum_process_name on ds_plugin_usage_metadata(process_name);

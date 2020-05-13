-- licensed materials - property of ibm* and/or hcl**
-- urbancode deploy
-- (c) copyright ibm corporation 2011, 2017. all rights reserved.
-- (c) copyright hcl technologies ltd. 2018. all rights reserved.
--
-- u.s. government users restricted rights - use, duplication or disclosure restricted by
-- gsa adp schedule contract with ibm corp.
--
-- * trademark of international business machines
-- ** trademark of hcl technologies limited
--**************************************************************************************************
-- security schema
--**************************************************************************************************
-- ============================================================================
--  versioning table
-- ============================================================================

create table sec_db_version (
    release_name varchar2(36) not null,
    ver integer default 0 not null
);

insert into sec_db_version (release_name, ver) values ('1.0', 34);

-- ============================================================================
--  security tables
-- ============================================================================

create table sec_action (
    id varchar2(36) not null,
    version integer default 0 not null,
    name varchar2(64) not null,
    description varchar2(1024),
    enabled varchar2(1) default 'Y' not null,
    cascading varchar2(1) default 'N' not null,
    sec_resource_type_id varchar2(36) not null,
    category varchar2(64),
    primary key (id)
);

create table sec_auth_token (
    id varchar2(36) not null,
    version integer default 0 not null,
    sec_user_id varchar2(36) not null,
    token varchar2(255) not null,
    expiration numeric not null,
    description varchar2(1024),
    os_user varchar2(255),
    host varchar2(255),
    date_created numeric default 0 not null,
    primary key (id),
    metadata clob
);

create table sec_auth_token_restriction (
    id varchar2(36) not null,
    version integer default 0 not null,
    name varchar2(255) not null,
    description varchar2(1024),
    ghosted_date numeric default 0 not null
);

create table sec_verb_to_url (
    id varchar2(36) not null,
    version integer default 0 not null,
    restriction_id varchar2(36) not null,
    verb varchar2(10) not null,
    url varchar2(1024) not null
);

create table sec_authentication_realm (
    id varchar2(36) not null,
    version integer default 0 not null,
    name varchar2(64) not null,
    description varchar2(1024),
    sort_order integer not null,
    enabled varchar2(1) default 'N' not null,
    read_only varchar2(1) default 'N' not null,
    login_module varchar2(1024) not null,
    ghosted_date numeric default 0 not null,
    allowed_attempts integer default 0 not null,
    primary key (id)
);

create table sec_authentication_realm_prop (
    sec_authentication_realm_id varchar2(36) not null,
    name varchar2(1024) not null,
    value varchar2(4000)
);

create table sec_authorization_realm (
    id varchar2(36) not null,
    version integer default 0 not null,
    name varchar2(64) not null,
    description varchar2(1024),
    authorization_module varchar2(1024) not null,
    ghosted_date numeric default 0 not null,
    primary key (id)
);

create table sec_authorization_realm_prop (
    sec_authorization_realm_id varchar2(36) not null,
    name varchar2(1024) not null,
    value varchar2(4000)
);

create table sec_group (
    id varchar2(36) not null,
    version integer default 0 not null,
    name varchar2(255) not null,
    sec_authorization_realm_id varchar2(36) not null,
    enabled varchar2(1) default 'Y' not null,
    primary key (id)
);

create table sec_group_mapper (
    id varchar2(36) not null,
    version integer default 0 not null,
    name varchar2(64) not null unique,
    primary key (id)
);

create table sec_group_mapping (
    id varchar2(36) not null,
    version integer default 0 not null,
    sec_group_mapper_id varchar2(36) not null,
    regex varchar2(255) not null,
    replacement varchar2(255) not null,
    primary key (id)
);

create table sec_group_role_on_team (
    id varchar2(36) not null,
    version integer default 0 not null,
    sec_group_id varchar2(36) not null,
    sec_role_id varchar2(36) not null,
    sec_team_space_id varchar2(36) not null,
    primary key (id)
);

create table sec_internal_user (
    id varchar2(36) not null,
    version integer default 0 not null,
    name varchar2(64) not null,
    password varchar2(128) not null,
    encoded smallint default 0 not null,
    primary key (id)
);

create table sec_realm_mapping (
    authentication_realm_id varchar2(36) not null,
    authorization_realm_id varchar2(36) not null
);

create table sec_resource (
    id varchar2(36) not null,
    version integer default 0 not null,
    name varchar2(255) not null,
    enabled varchar2(1) default 'Y' not null,
    sec_resource_type_id varchar2(36) not null,
    primary key (id)
);

create table sec_resource_for_team (
    id varchar2(36) not null,
    version integer default 0 not null,
    sec_resource_id varchar2(36) not null,
    sec_team_space_id varchar2(36) not null,
    sec_resource_role_id varchar2(36),
    primary key (id)
);

create table sec_resource_hierarchy (
    parent_sec_resource_id varchar2(36) not null,
    child_sec_resource_id varchar2(36) not null,
    path_length integer not null,
    primary key (parent_sec_resource_id, child_sec_resource_id)
);

create table sec_resource_role (
    id varchar2(36) not null,
    version integer default 0 not null,
    name varchar2(255) not null,
    description varchar2(1024),
    sec_resource_type_id varchar2(36) not null,
    ghosted_date numeric default 0 not null,
    primary key (id)
);

create table sec_resource_type (
    id varchar2(36) not null,
    version integer default 0 not null,
    name varchar2(255) not null,
    enabled varchar2(1) default 'Y' not null,
    primary key (id)
);

create table sec_role (
    id varchar2(36) not null,
    version integer default 0 not null,
    name varchar2(255) not null,
    description varchar2(1024),
    enabled varchar2(1) default 'Y' not null,
    ghosted_date numeric default 0 not null,
    primary key (id)
);

create table sec_role_action (
    id varchar2(36) not null,
    version integer default 0 not null,
    sec_role_id varchar2(36) not null,
    sec_action_id varchar2(36) not null,
    sec_resource_role_id varchar2(36),
    primary key (id)
);

create table sec_team_space (
    id varchar2(36) not null,
    version integer default 0 not null,
    enabled varchar2(1) default 'Y' not null,
    name varchar2(255) not null,
    description varchar2(4000),
    primary key (id)
);

create table sec_user (
    id varchar2(36) not null,
    version integer default 0 not null,
    name varchar2(255) not null,
    enabled varchar2(1) default 'Y' not null,
    password varchar2(255),
    actual_name varchar2(255),
    email varchar2(255),
    im_id varchar2(255),
    sec_authentication_realm_id varchar2(36) not null,
    ghosted_date numeric default 0 not null,
    failed_attempts integer default 0 not null,
    sec_license_type_id_requested varchar2(36),
    sec_license_type_id_received varchar2(36),
    licensed_session_count integer default 0 not null,
    last_ip_address varchar2(40),
    last_login_date numeric,
    phone_number varchar2(20),
    primary key (id),
    is_system varchar2(1) default 'N' not null
);

create table sec_user_property (
    id varchar2(36) not null,
    version integer default 0 not null,
    name varchar2(255) not null,
    value varchar2(4000),
    sec_user_id varchar2(36) not null,
    primary key (id)
);

create table sec_user_role_on_team (
    id varchar2(36) not null,
    version integer default 0 not null,
    sec_user_id varchar2(36) not null,
    sec_role_id varchar2(36) not null,
    sec_team_space_id varchar2(36) not null,
    primary key (id)
);

create table sec_user_to_group (
    sec_user_id varchar2(36) not null,
    sec_group_id varchar2(36) not null
);

create table sec_license_type (
     id varchar2(36) not null,
     version integer default 0 not null,
     feature varchar2(36) not null,
     is_reservable varchar2(1) default 'N' not null,
     primary key (id));

create table sec_action_to_license_type (
    action_id varchar2(36) not null,
    license_type_id varchar2(36) not null
);

--**************************************************************************************************
-- ucd schema
--**************************************************************************************************

--**************************************************************************************************
-- calendar
--**************************************************************************************************


create table cal_calendar (
    id varchar2(36) not null primary key,
    version integer default 0 not null
);

create table cal_entry (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    name varchar2(255),
    scheduled_date numeric not null,
    fired varchar2(1) not null,
    event_data clob not null,
    cancelled varchar2(1) default 'N' not null
);

create table cal_blackout (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    calendar_id varchar2(36) not null,
    name varchar2(255),
    start_date numeric not null,
    end_date numeric not null
);

create table cal_entry_to_calendar (
    calendar_id varchar2(36) not null,
    entry_id varchar2(36) not null
);

create table cal_recurring_entry (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    name varchar2(255),
    recurrence_pattern varchar2(255),
    scheduled_date numeric not null,
    event_data clob not null
);

create table cal_recurring_entry_to_cal (
    calendar_id varchar2(36) not null,
    recurring_entry_id varchar2(36) not null
);



--**************************************************************************************************
-- deploy server
--**************************************************************************************************

create table ds_db_version (
    release_name varchar2(255) not null,
    ver integer default 0 not null
);

create table ds_tag (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    name varchar2(255) not null,
    description varchar2(255),
    color varchar2(10),
    object_type varchar2(64) not null
);



-----------------------
-- resource
-----------------------

create table ds_agent (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    name varchar2(255) not null,
    active varchar2(1) not null,
    description varchar2(255),
    error_data clob,
    ghosted_date numeric default 0 not null,
    endpoint_id varchar2(64),
    relay_id varchar2(64),
    agent_version varchar2(32),
    last_status varchar2(16),
    working_directory varchar2(255),
    sec_resource_id varchar2(36) not null,
    impersonation_user varchar2(255),
    impersonation_group varchar2(255),
    impersonation_password varchar2(255),
    impersonation_sudo varchar2(1),
    impersonation_force varchar2(1),
    license_type varchar2(16) default 'none' not null,
    last_properties_hash integer,
    last_contact numeric,
    apikey_id varchar2(36),
    jms_cert clob,
    date_created numeric default 0 not null,
    comm_version integer default 0 not null,
    property_cookie varchar2(255)
);

create table ds_apikey (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    apikey varchar2(64) not null,
    secretkey varchar2(255) not null,
    sec_user_id varchar2(36) not null,
    disabled varchar2(1) default 'N' not null,
    date_created numeric not null,
    expiration numeric default 0 not null
);

create table ds_agent_test_result (
    id varchar2(36) not null primary key,
    test_result varchar2(2000)
);

create table ds_agent_request_record (
        id varchar2(36) not null primary key,
        version integer default 0 not null,
        agent_id varchar2(36) not null,
        request_id varchar2(36) not null
);

create table ds_agent_to_tag (
    agent_id varchar2(36) not null,
    tag_id varchar2(36) not null
);

create table ds_agent_pool (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    name varchar2(255) not null,
    active varchar2(1) not null,
    description varchar2(255),
    ghosted_date numeric default 0 not null,
    sec_resource_id varchar2(36) not null
);

create table ds_agent_to_pool (
    agent_id varchar2(36) not null,
    pool_id varchar2(36) not null
);

create table ds_resource (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    name varchar2(255) not null,
    path varchar2(1000) default '/' not null,
    active varchar2(1) not null,
    description varchar2(255),
    agent_id varchar2(36),
    agent_pool_id varchar2(36),
    component_tag_id varchar2(36),
    parent_id varchar2(36),
    resource_template_id varchar2(36),
    role_id varchar2(36),
    sec_resource_id varchar2(36) not null,
    ghosted_date numeric default 0 not null,
    inherit_team varchar2(1) not null,
    impersonation_user varchar2(255),
    impersonation_group varchar2(255),
    impersonation_password varchar2(255),
    impersonation_sudo varchar2(1),
    impersonation_force varchar2(1),
    discovery_failed varchar2(1) default 'N' not null,
    prototype varchar2(1) default 'N' not null
);


create table ds_resource_template (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    name varchar2(255) not null,
    description varchar2(1000),
    parent_id varchar2(36),
    application_id varchar2(36),
    sec_resource_id varchar2(36) not null,
    ghosted_date numeric default 0 not null,
    prop_sheet_id varchar2(36) not null,
    prop_sheet_def_id varchar2(36) not null
);

create table ds_cloud_connection (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    name varchar2(255) not null,
    url varchar2(255) not null,
    username varchar2(255) not null,
    password varchar2(255) not null,
    description varchar2(1000),
    sec_resource_id varchar2(36) not null,
    ghosted_date numeric default 0 not null,
    prop_sheet_id varchar2(36) not null,
    prop_sheet_def_id varchar2(36) not null
);

create table ds_resource_role (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    name varchar2(255) not null,
    special_type varchar2(20),
    description varchar2(255),
    prop_sheet_def_id varchar2(36) not null,
    default_name_property varchar2(255),
    ghosted_date numeric default 0 not null
);

create table ds_res_role_allowed_parent (
    id varchar2(36) not null primary key,
    resource_role_id varchar2(36) not null,
    allowed_parent_id varchar2(36) not null,
    foldername varchar2(255),
    allowed_name varchar2(255)
);

create table ds_res_role_default_child (
  resource_role_id varchar2(36) not null,
  child_folder_name varchar2(255) not null
);

create table ds_resource_to_tag (
    resource_id varchar2(36) not null,
    tag_id varchar2(36) not null
);

create table ds_discovery_execution (
    id varchar2(36) not null primary key,
    command_id varchar2(36),
    resource_id varchar2(36),
    agent_id varchar2(36),
    status varchar2(16),
    start_time numeric,
    end_time numeric,
    auth_token varchar2(255),
    request_time numeric,
    acked varchar2(1) default 'N' not null,
    action varchar2(16)
);

create table ds_agent_relay (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    name varchar2(255),
    endpoint_id varchar2(64) not null,
    description varchar2(255),
    relay_version varchar2(36),
    hostname varchar2(255),
    relay_hostname varchar2(255),
    jms_port int default 0 not null,
    status varchar2(16),
    last_contact numeric,
    sec_resource_id varchar2(36) not null
);


-----------------------
-- components
-----------------------

create table ds_component (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    name varchar2(255) not null,
    active varchar2(1) not null,
    ghosted_date numeric default 0 not null,
    description varchar2(255),
    component_type varchar2(16) default 'standard' not null,
    date_created numeric not null,
    created_by_user varchar2(64) not null,
    resource_role_id varchar2(36) not null,
    source_config_plugin varchar2(36),
    import_automatically varchar2(1) not null,
    use_vfs varchar2(1) not null,
    sec_resource_id varchar2(36) not null,
    calendar_id varchar2(36) not null,
    template_id varchar2(36),
    template_version numeric,
    cleanup_days_to_keep integer default 0 not null,
    cleanup_count_to_keep integer default 0 not null,
    default_version_type varchar2(64) not null,
    version_creation_process_id varchar2(36),
    version_creation_env_id varchar2(36),
    integration_agent_id varchar2(36),
    integration_tag_id varchar2(36),
    integration_failed varchar2(1) not null,
    ignore_qualifiers integer default 0 not null,
    last_modified numeric default 0 not null
);

create table ds_component_to_tag (
    component_id varchar2(36) not null,
    tag_id varchar2(36) not null
);


-----------------------
-- component versions
-----------------------

create table ds_version (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    name varchar2(255) not null,
    active varchar2(1) not null,
    archived varchar2(1) default 'N' not null,
    description varchar2(255),
    component_id varchar2(36) not null,
    date_created numeric not null,
    created_by_user varchar2(64) not null,
    version_type varchar2(64) not null,
    size_on_disk numeric default 0 not null,
    last_modified numeric default 0 not null,
    creation_process_requested varchar2(1) default 'N' not null
);

-------------------------
-- this is just to be consistent with what the upgrade does
-------------------------

create table ds_version_upgrade (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    locked varchar2(1) default 'N' not null,
    upgraded varchar2(1) default 'N' not null
);


-----------------------
-- version statuses
-----------------------

create table ds_version_status (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    version_id varchar2(36) not null,
    status_name varchar2(255) not null,
    date_created numeric not null,
    created_by_user varchar2(64) not null
);


-----------------------
-- notification schemes
-----------------------

create table ds_notification_scheme (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    name varchar2(255) not null,
    description varchar2(255)
);

create table ds_notification_entry (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    resource_type_id varchar2(64) not null,
    resource_role_id varchar2(64),
    role_id varchar2(64) not null,
    entry_type varchar2(64) not null,
    notification_scheme_id varchar2(36) not null,
    template_name varchar2(255)
);

-----------------------
-- applications
-----------------------

create table ds_application (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    name varchar2(255) not null,
    ghosted_date numeric default 0 not null,
    active varchar2(1) not null,
    description varchar2(255),
    enforce_complete_snapshots varchar2(1) default 'Y' not null,
    date_created numeric not null,
    created_by_user varchar2(64) not null,
    calendar_id varchar2(36) not null,
    notification_scheme_id varchar2(36),
    sec_resource_id varchar2(36) not null,
    last_modified numeric default 0 not null,
    template_id varchar2(36),
    template_version numeric
);

create table ds_application_to_component (
    application_id varchar2(36) not null,
    component_id varchar2(36) not null
);

create table ds_application_to_tag (
    application_id varchar2(36) not null,
    tag_id varchar2(36) not null
);


-----------------------
-- environments
-----------------------

create table ds_environment (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    name varchar2(255) not null,
    active varchar2(1) not null,
    index_order integer not null,
    description varchar2(255),
    color varchar2(10),
    application_id varchar2(36) not null,
    calendar_id varchar2(36) not null,
    resource_template_id varchar2(36),
    instance_id varchar2(64),
    require_approvals varchar2(1) not null,
    exempt_process_ids varchar2(4000),
    lock_snapshots varchar2(1) not null,
    snapshot_lock_type varchar2(64),
    approval_process_id varchar2(36),
    sec_resource_id varchar2(36) not null,
    cleanup_days_to_keep integer default 0 not null,
    ghosted_date numeric default 0 not null,
    cleanup_count_to_keep integer default 0 not null,
    history_days_to_keep numeric default 365 not null,
    last_modified numeric default 0 not null,
    template_id varchar2(36),
    template_version numeric,
    enable_process_history_cleanup varchar2(1) default 'N' not null,
    use_system_default_days varchar2(1) default 'Y' not null,
    no_self_approvals varchar2(1) default 'N' not null,
    snapshot_days_to_keep numeric default 0 not null,
    require_snapshot varchar2(1) default 'N' not null,
    allow_process_drafts varchar2(1) default 'N' not null
);

create table ds_environment_draft_usage (
    environment_id varchar2(36) not null,
    component_id varchar2(36) not null
);

create table ds_environment_to_resource (
    environment_id varchar2(36) not null,
    resource_id varchar2(36) not null
);

create table ds_prop_cmp_env_mapping (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    environment_id varchar2(36) not null,
    component_id varchar2(36) not null,
    prop_sheet_id varchar2(36) not null
);

create table ds_env_ver_condition (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    environment_id varchar2(36) not null,
    index_order integer not null,
    value varchar2(255) not null
);



-----------------------
-- snapshots
-----------------------

create table ds_snapshot (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    name varchar2(255) not null,
    active varchar2(1) not null,
    ghosted_date numeric default 0 not null,
    description varchar2(255),
    date_created numeric not null,
    created_by_user varchar2(64) not null,
    application_id varchar2(36) not null,
    calendar_id varchar2(36) not null,
    prop_sheet_id varchar2(36) not null,
    versions_locked varchar2(1) not null,
    config_locked varchar2(1) not null,
    last_modified numeric default 0 not null
);

create table ds_snapshot_to_version (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    snapshot_id varchar2(36) not null,
    version_id varchar2(36) not null,
    role_id varchar2(36),
    index_order integer
);

create table ds_snapshot_config_version (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    snapshot_id varchar2(36) not null,
    path varchar2(255) not null,
    persistent_version integer
);

create table ds_snapshot_status (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    snapshot_id varchar2(36) not null,
    status_name varchar2(255) not null,
    date_created numeric not null,
    created_by_user varchar2(64) not null
);



-----------------------
-- statuses
-----------------------

create table ds_status (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    name varchar2(255) not null,
    ghosted_date numeric default 0 not null,
    description varchar2(255),
    color varchar2(10),
    status_type varchar2(64),
    unique_status varchar2(1) not null,
    role_id varchar2(36)
);



-----------------------
-- processes
-----------------------

create table ds_copied_activity (
    id varchar2(36) not null primary key,
    user_id varchar2(64) not null,
    version integer default 0 not null,
    label varchar2(255),
    activity_data clob not null
);

create table ds_process_lock (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    process_id varchar2(36) not null,
    user_id varchar2(36) not null
);


--**************************************************************************************************
-- runtime classes
--**************************************************************************************************

-----------------------
-- property contexts
-----------------------

create table rt_property_context (
    id varchar2(36) primary key not null,
    version integer default 0 not null,
    prop_sheet_id varchar2(36) not null
);

create table rt_property_context_group_map (
    id varchar2(36) primary key not null,
    version integer default 0 not null,
    property_context_id varchar2(36) not null,
    prefix varchar2(255) not null,
    prop_sheet_id varchar2(36),
    prop_sheet_handle varchar2(255),
    index_order numeric not null
);


-----------------------
-- requests
-----------------------

create table rt_process_request (
    id varchar2(36) primary key not null,
    version integer default 0 not null,
    user_id varchar2(64) not null,
    submitted_time numeric not null,
    property_context_id varchar2(36) not null,
    process_path varchar2(255) not null,
    process_version numeric not null,
    trace_id varchar2(36),
    result varchar2(32)
);

create table rt_deployment_request (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    app_process_request_id varchar2(36) not null
);

create table rt_app_process_request (
    id varchar2(36) primary key not null,
    version integer default 0 not null,
    deployment_request_id varchar2(36),
    user_id varchar2(64) not null,
    submitted_time numeric not null,
    application_id varchar2(36) not null,
    environment_id varchar2(36) not null,
    property_context_id varchar2(36) not null,
    calendar_entry_id varchar2(36) not null,
    approval_id varchar2(36),
    application_process_id varchar2(36) not null,
    application_process_version numeric not null,
    snapshot_id varchar2(36),
    trace_id varchar2(36),
    only_changed varchar2(1) not null,
    description varchar2(255),
    result varchar2(32)
);

create table rt_app_proc_req_to_version (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    app_process_request_id varchar2(36) not null,
    version_id varchar2(36) not null,
    role_id varchar2(36),
    index_order integer
);

create table rt_version_selector (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    value varchar2(255) not null,
    application_process_request_id varchar2(36),
    component_id varchar2(36) not null,
    environment_id varchar2(36) not null,
    role_id varchar2(36),
    snapshot_id varchar2(36)
);

create table rt_comp_process_request (
    id varchar2(36) primary key not null,
    version integer default 0 not null,
    user_id varchar2(64) not null,
    submitted_time numeric not null,
    application_id varchar2(36) not null,
    environment_id varchar2(36) not null,
    property_context_id varchar2(36) not null,
    calendar_entry_id varchar2(36) not null,
    approval_id varchar2(36),
    component_id varchar2(36) not null,
    component_process_id varchar2(36) not null,
    component_process_version numeric not null,
    version_id varchar2(36),
    resource_id varchar2(36) not null,
    agent_id varchar2(36) not null,
    trace_id varchar2(36),
    parent_request_id varchar2(36),
    continuation varchar2(73),
    result varchar2(32),
    is_draft varchar2(1) default 'N' not null
);

create table rt_stack_execution_record (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    resource_data clob,
    last_updated numeric not null,
    result varchar2(32),
    app_process_request_id varchar2(36) not null,
    continuation varchar2(73) not null,
    stack_id varchar2(36) not null,
    provider_id varchar2(36) not null
);

create table rt_deletable_trace (
    id varchar2(36) not null primary key
);

--**************************************************************************************************
-- manual tasks
--**************************************************************************************************

create table tsk_approval (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    name varchar2(255) not null,
    started_by_user_id varchar2(64) not null,
    prop_sheet_id varchar2(36) not null,
    failed varchar2(1) not null,
    failed_by_user varchar2(64),
    failed_comment varchar2(4000),
    date_failed numeric
);

create table tsk_task (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    classname varchar2(255) not null,
    name varchar2(255) not null,
    comment_prompt varchar2(1024),
    comment_required varchar2(1),
    completed_by_user varchar2(64),
    task_comment varchar2(4000),
    date_started numeric,
    date_ended numeric,
    status varchar2(64) not null,
    prop_sheet_id varchar2(36) not null,
    prop_sheet_def_id varchar2(36) not null
);

create table tsk_task_resource_role_map (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    task_id varchar2(36) not null,
    sec_resource_role_id varchar2(64),
    sec_resource_id varchar2(64) not null,
    sec_role_id varchar2(64) not null
);

create table tsk_task_member_map (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    task_id varchar2(36) not null,
    sec_user_id varchar2(64),
    sec_group_id varchar2(64)
);

create table tsk_approval_to_task (
    approval_id varchar2(36) not null,
    task_id varchar2(36) not null
);

create table tsk_promotion (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    component_process_id varchar2(36) not null,
    draft_process_version integer default 0 not null,
    requested_by_user varchar2(36) not null,
    completed_by_user varchar2(36),
    date_requested numeric not null,
    date_ended numeric,
    result varchar2(64)
);

--**************************************************************************************************
-- plugin system
--**************************************************************************************************

create table pl_plugin (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    name varchar2(255),
    tag varchar2(255),
    description varchar2(4000),
    plugin_id varchar2(255) not null,
    plugin_version integer not null,
    ghosted_date numeric default 0 not null,
    plugin_hash varchar2(255),
    release_version varchar2(255)
);

create table pl_plugin_command (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    name varchar2(255),
    sub_tag varchar2(4000),
    description varchar2(4000),
    plugin_id varchar2(36) not null,
    type varchar2(255),
    role_id varchar2(36),
    prop_sheet_def_id varchar2(36) not null
);

create table pl_command_to_resource_role (
    command_id varchar2(36) not null,
    resource_role_id varchar2(36) not null
);

create table pl_plugin_role (
    plugin_id varchar2(36) not null,
    role_id varchar2(36) not null
);

create table ds_plugin_task_request (
    workflow_id varchar2(36) not null,
    activity_trace_id varchar2(36) not null,
    activity_name varchar2(255) not null,
    property_context_id varchar2(36) not null,
    failure_continuation varchar2(73) not null,
    success_continuation varchar2(73) not null,
    dialogue_id varchar2(36) not null primary key,
    version integer default 0 not null,
    agent_id varchar2(36),
    request_time numeric,
    last_resend_time numeric default 0,
    resend_message blob,
    acked varchar2(1) default 'N' not null
);

create table pl_source_config_plugin (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    name varchar2(255),
    tag varchar2(255),
    description varchar2(4000),
    plugin_id varchar2(255) not null,
    plugin_version integer not null,
    ghosted_date numeric default 0 not null,
    plugin_hash varchar2(255),
    release_version varchar2(255),
    comp_prop_sheet_id varchar2(36),
    import_prop_sheet_id varchar2(36)
);

create table pl_source_config_execution (
    id varchar2(36) not null primary key,
    task_info varchar2(255),
    component_id varchar2(36),
    agent_id varchar2(36),
    start_time numeric,
    end_time numeric,
    status varchar2(16),
    auth_token varchar2(255),
    input_properties clob,
    request_time numeric,
    acked varchar2(1) default 'N' not null
);

--**************************************************************************************************
-- licensing and agent data
--**************************************************************************************************

create table ds_agent_data (
    agent_data varchar2(255) not null
);

create table ds_license_log_entry (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    message varchar2(4000) not null,
    violation_time numeric not null,
    dismissed varchar2(1) default 'N' not null
);

create table ds_agent_usage (
    id varchar2(36) not null primary key,
    type varchar2(36) not null,
    time_stamp numeric not null,
    count integer default 0 not null
);

create table ds_agent_usage_tracking (
    id varchar2(36) not null primary key,
    type varchar2(36) not null,
    window_start numeric not null,
    window_end numeric not null,
    watermark integer default 0 not null
);

--**************************************************************************************************
-- network data
--**************************************************************************************************

create table ds_network_relay (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    name varchar2(255) not null,
    active varchar2(1) not null,
    host varchar2(255) not null,
    port integer not null
);


--**************************************************************************************************
-- reporting
--**************************************************************************************************

create table ds_recent_report (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    user_id varchar2(64) not null,
    report_type varchar2(255) not null,
    report_name varchar2(255) not null,
    last_run numeric not null
);

create table rp_app_req_plugin (
    app_request_id varchar2(255) not null,
    plugin_name varchar2(255) not null
);

--**************************************************************************************************
-- locking
--**************************************************************************************************

create table ds_ptr_store_lock(
    id integer not null primary key
);

create table ds_lockable (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    lock_name varchar2(4000) not null,
    max_permits integer default 1 not null
);

create table ds_lock (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    acquirer varchar2(36) not null,
    success_continuation varchar2(73),
    failure_continuation varchar2(73),
    acquired varchar2(1) not null,
    lockable varchar2(36) not null,
    date_created numeric default 0 not null
);

create table ds_comp_ver_int_rec (
   id varchar2(36) not null primary key
);

create table ds_vfs_repo_rec (
   id varchar2(36) not null primary key
);

create table ds_audit_entry (
   id varchar2(36) not null primary key,
   version integer default 0 not null,
   user_id varchar2(64),
   user_name varchar2(255),
   event_type varchar2(255) not null,
   description varchar2(255),
   obj_type varchar2(255),
   obj_name varchar2(255),
   obj_id varchar2(255),
   created_date numeric not null,
   status varchar2(255) not null,
   deletable varchar2(1) default 'Y',
   ip_address varchar2(40)
);

create table ds_request_audit_entry (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    user_id varchar2(36),
    short_url varchar2(255) not null,
    full_url varchar2(4000) not null,
    duration numeric not null,
    method varchar2(10) not null,
    date_created numeric not null
);

create table ds_sync (
    name varchar2(255) not null primary key,
    locked varchar2(1) not null,
    value varchar2(255)
);


--**************************************************************************************************
-- integration
--**************************************************************************************************

create table ds_integration_provider (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    date_created numeric not null,
    classname varchar2(255) not null,
    name varchar2(255) not null,
    description varchar2(4000),
    prop_sheet_id varchar2(36) not null,
    ghosted_date numeric default 0 not null
);

create table ds_ext_environment (
    id varchar2(36) not null primary key,
    ext_id varchar2(36) not null,
    name varchar2(255) not null,
    version integer default 0 not null,
    environment_id varchar2(36) not null,
    date_created numeric not null,
    ext_blueprint_id varchar2(255),
    ext_blueprint_name varchar2(255) not null,
    ext_blueprint_version varchar2(36),
    ext_blueprint_url varchar2(255),
    ext_configuration_id varchar2(255),
    ext_configuration_name varchar2(255),
    ext_configuration_version varchar2(36),
    integration_provider_id varchar2(36),
    prop_sheet_id varchar2(36) not null,
    ghosted_date numeric default 0 not null
);

--**************************************************************************************************
-- history cleanup
--**************************************************************************************************

create table ds_history_cleanup_record (
    id varchar2(36) not null primary key,
    version integer default 0 not null,
    total_deployments_for_cleanup integer not null,
    deployments_deleted integer default 0 not null,
    date_cleanup_started numeric not null,
    date_cleanup_finished numeric
);

--**************************************************************************************************
-- vc metadata
--**************************************************************************************************

create table ds_plugin_usage_metadata (
    id varchar2(36) primary key not null,
    persistent_record_id varchar2(36) not null,
    persistent_record_commit numeric not null,
    command_id varchar2(36) not null,
    process_name varchar2(255) not null,
    process_id varchar2(36) not null,
    component_id varchar2(36),
    component_template_id varchar2(36),
    component_template_name varchar2(255),
    process_type varchar2(64) not null
);

create table rt_command(
    id varchar2(36) not null primary key,
    version integer not null,
    command_state varchar2(64) not null,
    command_state_version integer not null,
    command_outcome varchar2(64) not null,
    command_type varchar2(64) not null,
    agent_id varchar2(64) not null,
    log_streaming_mode varchar2(1) not null,
    command_data blob not null
);

create table ds_server (
    id varchar2(36) not null primary key,
    version int not null,
    created_date numeric not null,
    modified_date numeric not null,
    ghosted_date numeric not null,
    server_id varchar2(64) not null,
    server_uri varchar2(255) not null,
    server_cert clob,
    server_cert_modified_date numeric not null,
    server_pubkey_modified_date numeric not null,
    client_cert clob,
    client_cert_modified_date numeric not null,
    client_pubkey_modified_date numeric not null
);

--**************************************************************************************************
-- ucd db versioning
--**************************************************************************************************

create table ds_database_version (
    id varchar2(36) primary key not null,
    stamp varchar2(36) not null
)

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
    release_name nvarchar(36) not null,
    ver integer default 0 not null
);

insert into sec_db_version (release_name, ver) values ('1.0', 34);

-- ============================================================================
--  security tables
-- ============================================================================

create table sec_action (
    id nvarchar(36) not null,
    version integer default 0 not null,
    name nvarchar(64) not null,
    description nvarchar(1024),
    enabled nvarchar(1) default 'Y' not null,
    cascading nvarchar(1) default 'N' not null,
    sec_resource_type_id nvarchar(36) not null,
    category nvarchar(64),
    primary key (id)
);

create table sec_auth_token (
    id nvarchar(36) not null,
    version integer default 0 not null,
    sec_user_id nvarchar(36) not null,
    token nvarchar(255) not null,
    expiration bigint not null,
    description nvarchar(1024),
    os_user nvarchar(255),
    host nvarchar(255),
    date_created bigint default 0 not null,
    primary key (id),
    metadata ntext
);

create table sec_auth_token_restriction (
    id nvarchar(36) not null,
    version integer default 0 not null,
    name nvarchar(255) not null,
    description nvarchar(1024),
    ghosted_date bigint default 0 not null
);

create table sec_verb_to_url (
    id nvarchar(36) not null,
    version integer default 0 not null,
    restriction_id nvarchar(36) not null,
    verb nvarchar(10) not null,
    url nvarchar(1024) not null
);

create table sec_authentication_realm (
    id nvarchar(36) not null,
    version integer default 0 not null,
    name nvarchar(64) not null,
    description nvarchar(1024),
    sort_order integer not null,
    enabled nvarchar(1) default 'N' not null,
    read_only nvarchar(1) default 'N' not null,
    login_module nvarchar(1024) not null,
    ghosted_date bigint default 0 not null,
    allowed_attempts integer default 0 not null,
    primary key (id)
);

create table sec_authentication_realm_prop (
    sec_authentication_realm_id nvarchar(36) not null,
    name nvarchar(1024) not null,
    value nvarchar(4000)
);

create table sec_authorization_realm (
    id nvarchar(36) not null,
    version integer default 0 not null,
    name nvarchar(64) not null,
    description nvarchar(1024),
    authorization_module nvarchar(1024) not null,
    ghosted_date bigint default 0 not null,
    primary key (id)
);

create table sec_authorization_realm_prop (
    sec_authorization_realm_id nvarchar(36) not null,
    name nvarchar(1024) not null,
    value nvarchar(4000)
);

create table sec_group (
    id nvarchar(36) not null,
    version integer default 0 not null,
    name nvarchar(255) not null,
    sec_authorization_realm_id nvarchar(36) not null,
    enabled nvarchar(1) default 'Y' not null,
    primary key (id)
);

create table sec_group_mapper (
    id nvarchar(36) not null,
    version integer default 0 not null,
    name nvarchar(64) not null unique,
    primary key (id)
);

create table sec_group_mapping (
    id nvarchar(36) not null,
    version integer default 0 not null,
    sec_group_mapper_id nvarchar(36) not null,
    regex nvarchar(255) not null,
    replacement nvarchar(255) not null,
    primary key (id)
);

create table sec_group_role_on_team (
    id nvarchar(36) not null,
    version integer default 0 not null,
    sec_group_id nvarchar(36) not null,
    sec_role_id nvarchar(36) not null,
    sec_team_space_id nvarchar(36) not null,
    primary key (id)
);

create table sec_internal_user (
    id nvarchar(36) not null,
    version integer default 0 not null,
    name nvarchar(64) not null,
    password nvarchar(128) not null,
    encoded smallint default 0 not null,
    primary key (id)
);

create table sec_realm_mapping (
    authentication_realm_id nvarchar(36) not null,
    authorization_realm_id nvarchar(36) not null
);

create table sec_resource (
    id nvarchar(36) not null,
    version integer default 0 not null,
    name nvarchar(255) not null,
    enabled nvarchar(1) default 'Y' not null,
    sec_resource_type_id nvarchar(36) not null,
    primary key (id)
);

create table sec_resource_for_team (
    id nvarchar(36) not null,
    version integer default 0 not null,
    sec_resource_id nvarchar(36) not null,
    sec_team_space_id nvarchar(36) not null,
    sec_resource_role_id nvarchar(36),
    primary key (id)
);

create table sec_resource_hierarchy (
    parent_sec_resource_id nvarchar(36) not null,
    child_sec_resource_id nvarchar(36) not null,
    path_length integer not null,
    primary key (parent_sec_resource_id, child_sec_resource_id)
);

create table sec_resource_role (
    id nvarchar(36) not null,
    version integer default 0 not null,
    name nvarchar(255) not null,
    description nvarchar(1024),
    sec_resource_type_id nvarchar(36) not null,
    ghosted_date bigint default 0 not null,
    primary key (id)
);

create table sec_resource_type (
    id nvarchar(36) not null,
    version integer default 0 not null,
    name nvarchar(255) not null,
    enabled nvarchar(1) default 'Y' not null,
    primary key (id)
);

create table sec_role (
    id nvarchar(36) not null,
    version integer default 0 not null,
    name nvarchar(255) not null,
    description nvarchar(1024),
    enabled nvarchar(1) default 'Y' not null,
    ghosted_date bigint default 0 not null,
    primary key (id)
);

create table sec_role_action (
    id nvarchar(36) not null,
    version integer default 0 not null,
    sec_role_id nvarchar(36) not null,
    sec_action_id nvarchar(36) not null,
    sec_resource_role_id nvarchar(36),
    primary key (id)
);

create table sec_team_space (
    id nvarchar(36) not null,
    version integer default 0 not null,
    enabled nvarchar(1) default 'Y' not null,
    name nvarchar(255) not null,
    description nvarchar(4000),
    primary key (id)
);

create table sec_user (
    id nvarchar(36) not null,
    version integer default 0 not null,
    name nvarchar(255) not null,
    enabled nvarchar(1) default 'Y' not null,
    password nvarchar(255),
    actual_name nvarchar(255),
    email nvarchar(255),
    im_id nvarchar(255),
    sec_authentication_realm_id nvarchar(36) not null,
    ghosted_date bigint default 0 not null,
    failed_attempts integer default 0 not null,
    sec_license_type_id_requested nvarchar(36),
    sec_license_type_id_received nvarchar(36),
    licensed_session_count integer default 0 not null,
    last_ip_address nvarchar(40),
    last_login_date bigint,
    phone_number nvarchar(20),
    primary key (id),
    is_system nvarchar(1) default 'N' not null
);

create table sec_user_property (
    id nvarchar(36) not null,
    version integer default 0 not null,
    name nvarchar(255) not null,
    value nvarchar(4000),
    sec_user_id nvarchar(36) not null,
    primary key (id)
);

create table sec_user_role_on_team (
    id nvarchar(36) not null,
    version integer default 0 not null,
    sec_user_id nvarchar(36) not null,
    sec_role_id nvarchar(36) not null,
    sec_team_space_id nvarchar(36) not null,
    primary key (id)
);

create table sec_user_to_group (
    sec_user_id nvarchar(36) not null,
    sec_group_id nvarchar(36) not null
);

create table sec_license_type (
     id nvarchar(36) not null,
     version integer default 0 not null,
     feature nvarchar(36) not null,
     is_reservable nvarchar(1) default 'N' not null,
     primary key (id));

create table sec_action_to_license_type (
    action_id nvarchar(36) not null,
    license_type_id nvarchar(36) not null
);

--**************************************************************************************************
-- ucd schema
--**************************************************************************************************

--**************************************************************************************************
-- calendar
--**************************************************************************************************


create table cal_calendar (
    id nvarchar(36) not null primary key,
    version integer default 0 not null
);

create table cal_entry (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    name nvarchar(255),
    scheduled_date bigint not null,
    fired nvarchar(1) not null,
    event_data ntext not null,
    cancelled nvarchar(1) default 'N' not null
);

create table cal_blackout (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    calendar_id nvarchar(36) not null,
    name nvarchar(255),
    start_date bigint not null,
    end_date bigint not null
);

create table cal_entry_to_calendar (
    calendar_id nvarchar(36) not null,
    entry_id nvarchar(36) not null
);

create table cal_recurring_entry (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    name nvarchar(255),
    recurrence_pattern nvarchar(255),
    scheduled_date bigint not null,
    event_data ntext not null
);

create table cal_recurring_entry_to_cal (
    calendar_id nvarchar(36) not null,
    recurring_entry_id nvarchar(36) not null
);



--**************************************************************************************************
-- deploy server
--**************************************************************************************************

create table ds_db_version (
    release_name nvarchar(255) not null,
    ver integer default 0 not null
);

create table ds_tag (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    name nvarchar(255) not null,
    description nvarchar(255),
    color nvarchar(10),
    object_type nvarchar(64) not null
);



-----------------------
-- resource
-----------------------

create table ds_agent (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    name nvarchar(255) not null,
    active nvarchar(1) not null,
    description nvarchar(255),
    error_data ntext,
    ghosted_date bigint default 0 not null,
    endpoint_id nvarchar(64),
    relay_id nvarchar(64),
    agent_version nvarchar(32),
    last_status nvarchar(16),
    working_directory nvarchar(255),
    sec_resource_id nvarchar(36) not null,
    impersonation_user nvarchar(255),
    impersonation_group nvarchar(255),
    impersonation_password nvarchar(255),
    impersonation_sudo nvarchar(1),
    impersonation_force nvarchar(1),
    license_type nvarchar(16) default 'none' not null,
    last_properties_hash integer,
    last_contact bigint,
    apikey_id nvarchar(36),
    jms_cert ntext,
    date_created bigint default 0 not null,
    comm_version integer default 0 not null,
    property_cookie nvarchar(255)
);

create table ds_apikey (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    apikey nvarchar(64) not null,
    secretkey nvarchar(255) not null,
    sec_user_id nvarchar(36) not null,
    disabled nvarchar(1) default 'N' not null,
    date_created bigint not null,
    expiration bigint default 0 not null
);

create table ds_agent_test_result (
    id nvarchar(36) not null primary key,
    test_result nvarchar(2000)
);

create table ds_agent_request_record (
        id nvarchar(36) not null primary key,
        version integer default 0 not null,
        agent_id nvarchar(36) not null,
        request_id nvarchar(36) not null
);

create table ds_agent_to_tag (
    agent_id nvarchar(36) not null,
    tag_id nvarchar(36) not null
);

create table ds_agent_pool (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    name nvarchar(255) not null,
    active nvarchar(1) not null,
    description nvarchar(255),
    ghosted_date bigint default 0 not null,
    sec_resource_id nvarchar(36) not null
);

create table ds_agent_to_pool (
    agent_id nvarchar(36) not null,
    pool_id nvarchar(36) not null
);

create table ds_resource (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    name nvarchar(255) not null,
    path nvarchar(1000) default '/' not null,
    active nvarchar(1) not null,
    description nvarchar(255),
    agent_id nvarchar(36),
    agent_pool_id nvarchar(36),
    component_tag_id nvarchar(36),
    parent_id nvarchar(36),
    resource_template_id nvarchar(36),
    role_id nvarchar(36),
    sec_resource_id nvarchar(36) not null,
    ghosted_date bigint default 0 not null,
    inherit_team nvarchar(1) not null,
    impersonation_user nvarchar(255),
    impersonation_group nvarchar(255),
    impersonation_password nvarchar(255),
    impersonation_sudo nvarchar(1),
    impersonation_force nvarchar(1),
    discovery_failed nvarchar(1) default 'N' not null,
    prototype nvarchar(1) default 'N' not null
);


create table ds_resource_template (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    name nvarchar(255) not null,
    description nvarchar(1000),
    parent_id nvarchar(36),
    application_id nvarchar(36),
    sec_resource_id nvarchar(36) not null,
    ghosted_date bigint default 0 not null,
    prop_sheet_id nvarchar(36) not null,
    prop_sheet_def_id nvarchar(36) not null
);

create table ds_cloud_connection (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    name nvarchar(255) not null,
    url nvarchar(255) not null,
    username nvarchar(255) not null,
    password nvarchar(255) not null,
    description nvarchar(1000),
    sec_resource_id nvarchar(36) not null,
    ghosted_date bigint default 0 not null,
    prop_sheet_id nvarchar(36) not null,
    prop_sheet_def_id nvarchar(36) not null
);

create table ds_resource_role (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    name nvarchar(255) not null,
    special_type nvarchar(20),
    description nvarchar(255),
    prop_sheet_def_id nvarchar(36) not null,
    default_name_property nvarchar(255),
    ghosted_date bigint default 0 not null
);

create table ds_res_role_allowed_parent (
    id nvarchar(36) not null primary key,
    resource_role_id nvarchar(36) not null,
    allowed_parent_id nvarchar(36) not null,
    foldername nvarchar(255),
    allowed_name nvarchar(255)
);

create table ds_res_role_default_child (
  resource_role_id nvarchar(36) not null,
  child_folder_name nvarchar(255) not null
);

create table ds_resource_to_tag (
    resource_id nvarchar(36) not null,
    tag_id nvarchar(36) not null
);

create table ds_discovery_execution (
    id nvarchar(36) not null primary key,
    command_id nvarchar(36),
    resource_id nvarchar(36),
    agent_id nvarchar(36),
    status nvarchar(16),
    start_time bigint,
    end_time bigint,
    auth_token nvarchar(255),
    request_time bigint,
    acked nvarchar(1) default 'N' not null,
    action nvarchar(16)
);

create table ds_agent_relay (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    name nvarchar(255),
    endpoint_id nvarchar(64) not null,
    description nvarchar(255),
    relay_version nvarchar(36),
    hostname nvarchar(255),
    relay_hostname nvarchar(255),
    jms_port int default 0 not null,
    status nvarchar(16),
    last_contact bigint,
    sec_resource_id nvarchar(36) not null
);


-----------------------
-- components
-----------------------

create table ds_component (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    name nvarchar(255) not null,
    active nvarchar(1) not null,
    ghosted_date bigint default 0 not null,
    description nvarchar(255),
    component_type nvarchar(16) default 'standard' not null,
    date_created bigint not null,
    created_by_user nvarchar(64) not null,
    resource_role_id nvarchar(36) not null,
    source_config_plugin nvarchar(36),
    import_automatically nvarchar(1) not null,
    use_vfs nvarchar(1) not null,
    sec_resource_id nvarchar(36) not null,
    calendar_id nvarchar(36) not null,
    template_id nvarchar(36),
    template_version bigint,
    cleanup_days_to_keep integer default 0 not null,
    cleanup_count_to_keep integer default 0 not null,
    default_version_type nvarchar(64) not null,
    version_creation_process_id nvarchar(36),
    version_creation_env_id nvarchar(36),
    integration_agent_id nvarchar(36),
    integration_tag_id nvarchar(36),
    integration_failed nvarchar(1) not null,
    ignore_qualifiers integer default 0 not null,
    last_modified bigint default 0 not null
);

create table ds_component_to_tag (
    component_id nvarchar(36) not null,
    tag_id nvarchar(36) not null
);


-----------------------
-- component versions
-----------------------

create table ds_version (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    name nvarchar(255) not null,
    active nvarchar(1) not null,
    archived nvarchar(1) default 'N' not null,
    description nvarchar(255),
    component_id nvarchar(36) not null,
    date_created bigint not null,
    created_by_user nvarchar(64) not null,
    version_type nvarchar(64) not null,
    size_on_disk bigint default 0 not null,
    last_modified bigint default 0 not null,
    creation_process_requested nvarchar(1) default 'N' not null
);

-------------------------
-- this is just to be consistent with what the upgrade does
-------------------------

create table ds_version_upgrade (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    locked nvarchar(1) default 'N' not null,
    upgraded nvarchar(1) default 'N' not null
);


-----------------------
-- version statuses
-----------------------

create table ds_version_status (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    version_id nvarchar(36) not null,
    status_name nvarchar(255) not null,
    date_created bigint not null,
    created_by_user nvarchar(64) not null
);


-----------------------
-- notification schemes
-----------------------

create table ds_notification_scheme (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    name nvarchar(255) not null,
    description nvarchar(255)
);

create table ds_notification_entry (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    resource_type_id nvarchar(64) not null,
    resource_role_id nvarchar(64),
    role_id nvarchar(64) not null,
    entry_type nvarchar(64) not null,
    notification_scheme_id nvarchar(36) not null,
    template_name nvarchar(255)
);

-----------------------
-- applications
-----------------------

create table ds_application (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    name nvarchar(255) not null,
    ghosted_date bigint default 0 not null,
    active nvarchar(1) not null,
    description nvarchar(255),
    enforce_complete_snapshots nvarchar(1) default 'Y' not null,
    date_created bigint not null,
    created_by_user nvarchar(64) not null,
    calendar_id nvarchar(36) not null,
    notification_scheme_id nvarchar(36),
    sec_resource_id nvarchar(36) not null,
    last_modified bigint default 0 not null,
    template_id nvarchar(36),
    template_version bigint
);

create table ds_application_to_component (
    application_id nvarchar(36) not null,
    component_id nvarchar(36) not null
);

create table ds_application_to_tag (
    application_id nvarchar(36) not null,
    tag_id nvarchar(36) not null
);


-----------------------
-- environments
-----------------------

create table ds_environment (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    name nvarchar(255) not null,
    active nvarchar(1) not null,
    index_order integer not null,
    description nvarchar(255),
    color nvarchar(10),
    application_id nvarchar(36) not null,
    calendar_id nvarchar(36) not null,
    resource_template_id nvarchar(36),
    instance_id nvarchar(64),
    require_approvals nvarchar(1) not null,
    exempt_process_ids nvarchar(4000),
    lock_snapshots nvarchar(1) not null,
    snapshot_lock_type nvarchar(64),
    approval_process_id nvarchar(36),
    sec_resource_id nvarchar(36) not null,
    cleanup_days_to_keep integer default 0 not null,
    ghosted_date bigint default 0 not null,
    cleanup_count_to_keep integer default 0 not null,
    history_days_to_keep bigint default 365 not null,
    last_modified bigint default 0 not null,
    template_id nvarchar(36),
    template_version bigint,
    enable_process_history_cleanup nvarchar(1) default 'N' not null,
    use_system_default_days nvarchar(1) default 'Y' not null,
    no_self_approvals nvarchar(1) default 'N' not null,
    snapshot_days_to_keep bigint default 0 not null,
    require_snapshot nvarchar(1) default 'N' not null,
    allow_process_drafts nvarchar(1) default 'N' not null
);

create table ds_environment_draft_usage (
    environment_id nvarchar(36) not null,
    component_id nvarchar(36) not null
);

create table ds_environment_to_resource (
    environment_id nvarchar(36) not null,
    resource_id nvarchar(36) not null
);

create table ds_prop_cmp_env_mapping (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    environment_id nvarchar(36) not null,
    component_id nvarchar(36) not null,
    prop_sheet_id nvarchar(36) not null
);

create table ds_env_ver_condition (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    environment_id nvarchar(36) not null,
    index_order integer not null,
    value nvarchar(255) not null
);



-----------------------
-- snapshots
-----------------------

create table ds_snapshot (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    name nvarchar(255) not null,
    active nvarchar(1) not null,
    ghosted_date bigint default 0 not null,
    description nvarchar(255),
    date_created bigint not null,
    created_by_user nvarchar(64) not null,
    application_id nvarchar(36) not null,
    calendar_id nvarchar(36) not null,
    prop_sheet_id nvarchar(36) not null,
    versions_locked nvarchar(1) not null,
    config_locked nvarchar(1) not null,
    last_modified bigint default 0 not null
);

create table ds_snapshot_to_version (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    snapshot_id nvarchar(36) not null,
    version_id nvarchar(36) not null,
    role_id nvarchar(36),
    index_order integer
);

create table ds_snapshot_config_version (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    snapshot_id nvarchar(36) not null,
    path nvarchar(255) not null,
    persistent_version integer
);

create table ds_snapshot_status (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    snapshot_id nvarchar(36) not null,
    status_name nvarchar(255) not null,
    date_created bigint not null,
    created_by_user nvarchar(64) not null
);



-----------------------
-- statuses
-----------------------

create table ds_status (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    name nvarchar(255) not null,
    ghosted_date bigint default 0 not null,
    description nvarchar(255),
    color nvarchar(10),
    status_type nvarchar(64),
    unique_status nvarchar(1) not null,
    role_id nvarchar(36)
);



-----------------------
-- processes
-----------------------

create table ds_copied_activity (
    id nvarchar(36) not null primary key,
    user_id nvarchar(64) not null,
    version integer default 0 not null,
    label nvarchar(255),
    activity_data ntext not null
);

create table ds_process_lock (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    process_id nvarchar(36) not null,
    user_id nvarchar(36) not null
);


--**************************************************************************************************
-- runtime classes
--**************************************************************************************************

-----------------------
-- property contexts
-----------------------

create table rt_property_context (
    id nvarchar(36) primary key not null,
    version integer default 0 not null,
    prop_sheet_id nvarchar(36) not null
);

create table rt_property_context_group_map (
    id nvarchar(36) primary key not null,
    version integer default 0 not null,
    property_context_id nvarchar(36) not null,
    prefix nvarchar(255) not null,
    prop_sheet_id nvarchar(36),
    prop_sheet_handle nvarchar(255),
    index_order bigint not null
);


-----------------------
-- requests
-----------------------

create table rt_process_request (
    id nvarchar(36) primary key not null,
    version integer default 0 not null,
    user_id nvarchar(64) not null,
    submitted_time bigint not null,
    property_context_id nvarchar(36) not null,
    process_path nvarchar(255) not null,
    process_version bigint not null,
    trace_id nvarchar(36),
    result nvarchar(32)
);

create table rt_deployment_request (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    app_process_request_id nvarchar(36) not null
);

create table rt_app_process_request (
    id nvarchar(36) primary key not null,
    version integer default 0 not null,
    deployment_request_id nvarchar(36),
    user_id nvarchar(64) not null,
    submitted_time bigint not null,
    application_id nvarchar(36) not null,
    environment_id nvarchar(36) not null,
    property_context_id nvarchar(36) not null,
    calendar_entry_id nvarchar(36) not null,
    approval_id nvarchar(36),
    application_process_id nvarchar(36) not null,
    application_process_version bigint not null,
    snapshot_id nvarchar(36),
    trace_id nvarchar(36),
    only_changed nvarchar(1) not null,
    description nvarchar(255),
    result nvarchar(32)
);

create table rt_app_proc_req_to_version (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    app_process_request_id nvarchar(36) not null,
    version_id nvarchar(36) not null,
    role_id nvarchar(36),
    index_order integer
);

create table rt_version_selector (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    value nvarchar(255) not null,
    application_process_request_id nvarchar(36),
    component_id nvarchar(36) not null,
    environment_id nvarchar(36) not null,
    role_id nvarchar(36),
    snapshot_id nvarchar(36)
);

create table rt_comp_process_request (
    id nvarchar(36) primary key not null,
    version integer default 0 not null,
    user_id nvarchar(64) not null,
    submitted_time bigint not null,
    application_id nvarchar(36) not null,
    environment_id nvarchar(36) not null,
    property_context_id nvarchar(36) not null,
    calendar_entry_id nvarchar(36) not null,
    approval_id nvarchar(36),
    component_id nvarchar(36) not null,
    component_process_id nvarchar(36) not null,
    component_process_version bigint not null,
    version_id nvarchar(36),
    resource_id nvarchar(36) not null,
    agent_id nvarchar(36) not null,
    trace_id nvarchar(36),
    parent_request_id nvarchar(36),
    continuation nvarchar(73),
    result nvarchar(32),
    is_draft nvarchar(1) default 'N' not null
);

create table rt_stack_execution_record (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    resource_data ntext,
    last_updated bigint not null,
    result nvarchar(32),
    app_process_request_id nvarchar(36) not null,
    continuation nvarchar(73) not null,
    stack_id nvarchar(36) not null,
    provider_id nvarchar(36) not null
);

create table rt_deletable_trace (
    id nvarchar(36) not null primary key
);

--**************************************************************************************************
-- manual tasks
--**************************************************************************************************

create table tsk_approval (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    name nvarchar(255) not null,
    started_by_user_id nvarchar(64) not null,
    prop_sheet_id nvarchar(36) not null,
    failed nvarchar(1) not null,
    failed_by_user nvarchar(64),
    failed_comment nvarchar(4000),
    date_failed bigint
);

create table tsk_task (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    classname nvarchar(255) not null,
    name nvarchar(255) not null,
    comment_prompt nvarchar(1024),
    comment_required nvarchar(1),
    completed_by_user nvarchar(64),
    task_comment nvarchar(4000),
    date_started bigint,
    date_ended bigint,
    status nvarchar(64) not null,
    prop_sheet_id nvarchar(36) not null,
    prop_sheet_def_id nvarchar(36) not null
);

create table tsk_task_resource_role_map (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    task_id nvarchar(36) not null,
    sec_resource_role_id nvarchar(64),
    sec_resource_id nvarchar(64) not null,
    sec_role_id nvarchar(64) not null
);

create table tsk_task_member_map (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    task_id nvarchar(36) not null,
    sec_user_id nvarchar(64),
    sec_group_id nvarchar(64)
);

create table tsk_approval_to_task (
    approval_id nvarchar(36) not null,
    task_id nvarchar(36) not null
);

create table tsk_promotion (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    component_process_id nvarchar(36) not null,
    draft_process_version integer default 0 not null,
    requested_by_user nvarchar(36) not null,
    completed_by_user nvarchar(36),
    date_requested bigint not null,
    date_ended bigint,
    result nvarchar(64)
);

--**************************************************************************************************
-- plugin system
--**************************************************************************************************

create table pl_plugin (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    name nvarchar(255),
    tag nvarchar(255),
    description nvarchar(4000),
    plugin_id nvarchar(255) not null,
    plugin_version integer not null,
    ghosted_date bigint default 0 not null,
    plugin_hash nvarchar(255),
    release_version nvarchar(255)
);

create table pl_plugin_command (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    name nvarchar(255),
    sub_tag nvarchar(4000),
    description nvarchar(4000),
    plugin_id nvarchar(36) not null,
    type nvarchar(255),
    role_id nvarchar(36),
    prop_sheet_def_id nvarchar(36) not null
);

create table pl_command_to_resource_role (
    command_id nvarchar(36) not null,
    resource_role_id nvarchar(36) not null
);

create table pl_plugin_role (
    plugin_id nvarchar(36) not null,
    role_id nvarchar(36) not null
);

create table ds_plugin_task_request (
    workflow_id nvarchar(36) not null,
    activity_trace_id nvarchar(36) not null,
    activity_name nvarchar(255) not null,
    property_context_id nvarchar(36) not null,
    failure_continuation nvarchar(73) not null,
    success_continuation nvarchar(73) not null,
    dialogue_id nvarchar(36) not null primary key,
    version integer default 0 not null,
    agent_id nvarchar(36),
    request_time bigint,
    last_resend_time bigint default 0,
    resend_message varbinary(max),
    acked nvarchar(1) default 'N' not null
);

create table pl_source_config_plugin (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    name nvarchar(255),
    tag nvarchar(255),
    description nvarchar(4000),
    plugin_id nvarchar(255) not null,
    plugin_version integer not null,
    ghosted_date bigint default 0 not null,
    plugin_hash nvarchar(255),
    release_version nvarchar(255),
    comp_prop_sheet_id nvarchar(36),
    import_prop_sheet_id nvarchar(36)
);

create table pl_source_config_execution (
    id nvarchar(36) not null primary key,
    task_info nvarchar(255),
    component_id nvarchar(36),
    agent_id nvarchar(36),
    start_time bigint,
    end_time bigint,
    status nvarchar(16),
    auth_token nvarchar(255),
    input_properties ntext,
    request_time bigint,
    acked nvarchar(1) default 'N' not null
);

--**************************************************************************************************
-- licensing and agent data
--**************************************************************************************************

create table ds_agent_data (
    agent_data nvarchar(255) not null
);

create table ds_license_log_entry (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    message nvarchar(4000) not null,
    violation_time bigint not null,
    dismissed nvarchar(1) default 'N' not null
);

create table ds_agent_usage (
    id nvarchar(36) not null primary key,
    type nvarchar(36) not null,
    time_stamp bigint not null,
    count integer default 0 not null
);

create table ds_agent_usage_tracking (
    id nvarchar(36) not null primary key,
    type nvarchar(36) not null,
    window_start bigint not null,
    window_end bigint not null,
    watermark integer default 0 not null
);

--**************************************************************************************************
-- network data
--**************************************************************************************************

create table ds_network_relay (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    name nvarchar(255) not null,
    active nvarchar(1) not null,
    host nvarchar(255) not null,
    port integer not null
);


--**************************************************************************************************
-- reporting
--**************************************************************************************************

create table ds_recent_report (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    user_id nvarchar(64) not null,
    report_type nvarchar(255) not null,
    report_name nvarchar(255) not null,
    last_run bigint not null
);

create table rp_app_req_plugin (
    app_request_id nvarchar(255) not null,
    plugin_name nvarchar(255) not null
);

--**************************************************************************************************
-- locking
--**************************************************************************************************

create table ds_ptr_store_lock(
    id integer not null primary key
);

create table ds_lockable (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    lock_name nvarchar(4000) not null,
    max_permits integer default 1 not null
);

create table ds_lock (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    acquirer nvarchar(36) not null,
    success_continuation nvarchar(73),
    failure_continuation nvarchar(73),
    acquired nvarchar(1) not null,
    lockable nvarchar(36) not null,
    date_created bigint default 0 not null
);

create table ds_comp_ver_int_rec (
   id nvarchar(36) not null primary key
);

create table ds_vfs_repo_rec (
   id nvarchar(36) not null primary key
);

create table ds_audit_entry (
   id nvarchar(36) not null primary key,
   version integer default 0 not null,
   user_id nvarchar(64),
   user_name nvarchar(255),
   event_type nvarchar(255) not null,
   description nvarchar(255),
   obj_type nvarchar(255),
   obj_name nvarchar(255),
   obj_id nvarchar(255),
   created_date bigint not null,
   status nvarchar(255) not null,
   deletable nvarchar(1) default 'Y',
   ip_address nvarchar(40)
);

create table ds_request_audit_entry (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    user_id nvarchar(36),
    short_url nvarchar(255) not null,
    full_url nvarchar(4000) not null,
    duration bigint not null,
    method nvarchar(10) not null,
    date_created bigint not null
);

create table ds_sync (
    name nvarchar(255) not null primary key,
    locked nvarchar(1) not null,
    value nvarchar(255)
);


--**************************************************************************************************
-- integration
--**************************************************************************************************

create table ds_integration_provider (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    date_created bigint not null,
    classname nvarchar(255) not null,
    name nvarchar(255) not null,
    description nvarchar(4000),
    prop_sheet_id nvarchar(36) not null,
    ghosted_date bigint default 0 not null
);

create table ds_ext_environment (
    id nvarchar(36) not null primary key,
    ext_id nvarchar(36) not null,
    name nvarchar(255) not null,
    version integer default 0 not null,
    environment_id nvarchar(36) not null,
    date_created bigint not null,
    ext_blueprint_id nvarchar(255),
    ext_blueprint_name nvarchar(255) not null,
    ext_blueprint_version nvarchar(36),
    ext_blueprint_url nvarchar(255),
    ext_configuration_id nvarchar(255),
    ext_configuration_name nvarchar(255),
    ext_configuration_version nvarchar(36),
    integration_provider_id nvarchar(36),
    prop_sheet_id nvarchar(36) not null,
    ghosted_date bigint default 0 not null
);

--**************************************************************************************************
-- history cleanup
--**************************************************************************************************

create table ds_history_cleanup_record (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    total_deployments_for_cleanup integer not null,
    deployments_deleted integer default 0 not null,
    date_cleanup_started bigint not null,
    date_cleanup_finished bigint
);

--**************************************************************************************************
-- vc metadata
--**************************************************************************************************

create table ds_plugin_usage_metadata (
    id nvarchar(36) primary key not null,
    persistent_record_id nvarchar(36) not null,
    persistent_record_commit bigint not null,
    command_id nvarchar(36) not null,
    process_name nvarchar(255) not null,
    process_id nvarchar(36) not null,
    component_id nvarchar(36),
    component_template_id nvarchar(36),
    component_template_name nvarchar(255),
    process_type nvarchar(64) not null
);

create table rt_command(
    id nvarchar(36) not null primary key,
    version integer not null,
    command_state nvarchar(64) not null,
    command_state_version integer not null,
    command_outcome nvarchar(64) not null,
    command_type nvarchar(64) not null,
    agent_id nvarchar(64) not null,
    log_streaming_mode nvarchar(1) not null,
    command_data varbinary(max) not null
);

create table ds_server (
    id nvarchar(36) not null primary key,
    version int not null,
    created_date bigint not null,
    modified_date bigint not null,
    ghosted_date bigint not null,
    server_id nvarchar(64) not null,
    server_uri nvarchar(255) not null,
    server_cert ntext,
    server_cert_modified_date bigint not null,
    server_pubkey_modified_date bigint not null,
    client_cert ntext,
    client_cert_modified_date bigint not null,
    client_pubkey_modified_date bigint not null
);

--**************************************************************************************************
-- ucd db versioning
--**************************************************************************************************

create table ds_database_version (
    id nvarchar(36) primary key not null,
    stamp nvarchar(36) not null
)

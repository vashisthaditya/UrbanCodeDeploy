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
    release_name varchar(36) binary not null,
    ver integer default 0 not null
) engine = innodb;

insert into sec_db_version (release_name, ver) values ('1.0', 34);

-- ============================================================================
--  security tables
-- ============================================================================

create table sec_action (
    id varchar(36) binary not null,
    version integer default 0 not null,
    name varchar(64) binary not null,
    description varchar(1024) binary,
    enabled varchar(1) binary default 'Y' not null,
    cascading varchar(1) binary default 'N' not null,
    sec_resource_type_id varchar(36) binary not null,
    category varchar(64) binary,
    primary key (id)
) engine = innodb;

create table sec_auth_token (
    id varchar(36) binary not null,
    version integer default 0 not null,
    sec_user_id varchar(36) binary not null,
    token varchar(255) binary not null,
    expiration bigint not null,
    description varchar(1024) binary,
    os_user varchar(255) binary,
    host varchar(255) binary,
    date_created bigint default 0 not null,
    primary key (id),
    metadata longtext
) engine = innodb;

create table sec_auth_token_restriction (
    id varchar(36) binary not null,
    version integer default 0 not null,
    name varchar(255) binary not null,
    description varchar(1024) binary,
    ghosted_date bigint default 0 not null
) engine = innodb;

create table sec_verb_to_url (
    id varchar(36) binary not null,
    version integer default 0 not null,
    restriction_id varchar(36) binary not null,
    verb varchar(10) binary not null,
    url varchar(1024) binary not null
) engine = innodb;

create table sec_authentication_realm (
    id varchar(36) binary not null,
    version integer default 0 not null,
    name varchar(64) binary not null,
    description varchar(1024) binary,
    sort_order integer not null,
    enabled varchar(1) binary default 'N' not null,
    read_only varchar(1) binary default 'N' not null,
    login_module varchar(1024) binary not null,
    ghosted_date bigint default 0 not null,
    allowed_attempts integer default 0 not null,
    primary key (id)
) engine = innodb;

create table sec_authentication_realm_prop (
    sec_authentication_realm_id varchar(36) binary not null,
    name varchar(1024) binary not null,
    value varchar(4000) binary
) engine = innodb;

create table sec_authorization_realm (
    id varchar(36) binary not null,
    version integer default 0 not null,
    name varchar(64) binary not null,
    description varchar(1024) binary,
    authorization_module varchar(1024) binary not null,
    ghosted_date bigint default 0 not null,
    primary key (id)
) engine = innodb;

create table sec_authorization_realm_prop (
    sec_authorization_realm_id varchar(36) binary not null,
    name varchar(1024) binary not null,
    value varchar(4000) binary
) engine = innodb;

create table sec_group (
    id varchar(36) binary not null,
    version integer default 0 not null,
    name varchar(255) binary not null,
    sec_authorization_realm_id varchar(36) binary not null,
    enabled varchar(1) binary default 'Y' not null,
    primary key (id)
) engine = innodb;

create table sec_group_mapper (
    id varchar(36) binary not null,
    version integer default 0 not null,
    name varchar(64) binary not null unique,
    primary key (id)
) engine = innodb;

create table sec_group_mapping (
    id varchar(36) binary not null,
    version integer default 0 not null,
    sec_group_mapper_id varchar(36) binary not null,
    regex varchar(255) binary not null,
    replacement varchar(255) binary not null,
    primary key (id)
) engine = innodb;

create table sec_group_role_on_team (
    id varchar(36) binary not null,
    version integer default 0 not null,
    sec_group_id varchar(36) binary not null,
    sec_role_id varchar(36) binary not null,
    sec_team_space_id varchar(36) binary not null,
    primary key (id)
) engine = innodb;

create table sec_internal_user (
    id varchar(36) binary not null,
    version integer default 0 not null,
    name varchar(64) binary not null,
    password varchar(128) binary not null,
    encoded smallint default 0 not null,
    primary key (id)
) engine = innodb;

create table sec_realm_mapping (
    authentication_realm_id varchar(36) binary not null,
    authorization_realm_id varchar(36) binary not null
) engine = innodb;

create table sec_resource (
    id varchar(36) binary not null,
    version integer default 0 not null,
    name varchar(255) binary not null,
    enabled varchar(1) binary default 'Y' not null,
    sec_resource_type_id varchar(36) binary not null,
    primary key (id)
) engine = innodb;

create table sec_resource_for_team (
    id varchar(36) binary not null,
    version integer default 0 not null,
    sec_resource_id varchar(36) binary not null,
    sec_team_space_id varchar(36) binary not null,
    sec_resource_role_id varchar(36) binary,
    primary key (id)
) engine = innodb;

create table sec_resource_hierarchy (
    parent_sec_resource_id varchar(36) binary not null,
    child_sec_resource_id varchar(36) binary not null,
    path_length integer not null,
    primary key (parent_sec_resource_id, child_sec_resource_id)
) engine = innodb;

create table sec_resource_role (
    id varchar(36) binary not null,
    version integer default 0 not null,
    name varchar(255) binary not null,
    description varchar(1024) binary,
    sec_resource_type_id varchar(36) binary not null,
    ghosted_date bigint default 0 not null,
    primary key (id)
) engine = innodb;

create table sec_resource_type (
    id varchar(36) binary not null,
    version integer default 0 not null,
    name varchar(255) binary not null,
    enabled varchar(1) binary default 'Y' not null,
    primary key (id)
) engine = innodb;

create table sec_role (
    id varchar(36) binary not null,
    version integer default 0 not null,
    name varchar(255) binary not null,
    description varchar(1024) binary,
    enabled varchar(1) binary default 'Y' not null,
    ghosted_date bigint default 0 not null,
    primary key (id)
) engine = innodb;

create table sec_role_action (
    id varchar(36) binary not null,
    version integer default 0 not null,
    sec_role_id varchar(36) binary not null,
    sec_action_id varchar(36) binary not null,
    sec_resource_role_id varchar(36) binary,
    primary key (id)
) engine = innodb;

create table sec_team_space (
    id varchar(36) binary not null,
    version integer default 0 not null,
    enabled varchar(1) binary default 'Y' not null,
    name varchar(255) binary not null,
    description varchar(4000) binary,
    primary key (id)
) engine = innodb;

create table sec_user (
    id varchar(36) binary not null,
    version integer default 0 not null,
    name varchar(255) binary not null,
    enabled varchar(1) binary default 'Y' not null,
    password varchar(255) binary,
    actual_name varchar(255) binary,
    email varchar(255) binary,
    im_id varchar(255) binary,
    sec_authentication_realm_id varchar(36) binary not null,
    ghosted_date bigint default 0 not null,
    failed_attempts integer default 0 not null,
    sec_license_type_id_requested varchar(36) binary,
    sec_license_type_id_received varchar(36) binary,
    licensed_session_count integer default 0 not null,
    last_ip_address varchar(40) binary,
    last_login_date bigint,
    phone_number varchar(20) binary,
    primary key (id),
    is_system varchar(1) binary default 'N' not null
) engine = innodb;

create table sec_user_property (
    id varchar(36) binary not null,
    version integer default 0 not null,
    name varchar(255) binary not null,
    value varchar(4000) binary,
    sec_user_id varchar(36) binary not null,
    primary key (id)
) engine = innodb;

create table sec_user_role_on_team (
    id varchar(36) binary not null,
    version integer default 0 not null,
    sec_user_id varchar(36) binary not null,
    sec_role_id varchar(36) binary not null,
    sec_team_space_id varchar(36) binary not null,
    primary key (id)
) engine = innodb;

create table sec_user_to_group (
    sec_user_id varchar(36) binary not null,
    sec_group_id varchar(36) binary not null
) engine = innodb;

create table sec_license_type (
     id varchar(36) binary not null,
     version integer default 0 not null,
     feature varchar(36) binary not null,
     is_reservable varchar(1) binary default 'N' not null,
     primary key (id)) engine = innodb;

create table sec_action_to_license_type (
    action_id varchar(36) binary not null,
    license_type_id varchar(36) binary not null
) engine = innodb;

--**************************************************************************************************
-- ucd schema
--**************************************************************************************************

--**************************************************************************************************
-- calendar
--**************************************************************************************************


create table cal_calendar (
    id varchar(36) binary not null primary key,
    version integer default 0 not null
) engine = innodb;

create table cal_entry (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    name varchar(255) binary,
    scheduled_date bigint not null,
    fired varchar(1) binary not null,
    event_data longtext not null,
    cancelled varchar(1) binary default 'N' not null
) engine = innodb;

create table cal_blackout (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    calendar_id varchar(36) binary not null,
    name varchar(255) binary,
    start_date bigint not null,
    end_date bigint not null
) engine = innodb;

create table cal_entry_to_calendar (
    calendar_id varchar(36) binary not null,
    entry_id varchar(36) binary not null
) engine = innodb;

create table cal_recurring_entry (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    name varchar(255) binary,
    recurrence_pattern varchar(255) binary,
    scheduled_date bigint not null,
    event_data longtext not null
) engine = innodb;

create table cal_recurring_entry_to_cal (
    calendar_id varchar(36) binary not null,
    recurring_entry_id varchar(36) binary not null
) engine = innodb;



--**************************************************************************************************
-- deploy server
--**************************************************************************************************

create table ds_db_version (
    release_name varchar(255) binary not null,
    ver integer default 0 not null
) engine = innodb;

create table ds_tag (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    name varchar(255) binary not null,
    description varchar(255) binary,
    color varchar(10) binary,
    object_type varchar(64) binary not null
) engine = innodb;



-----------------------
-- resource
-----------------------

create table ds_agent (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    name varchar(255) binary not null,
    active varchar(1) binary not null,
    description varchar(255) binary,
    error_data longtext,
    ghosted_date bigint default 0 not null,
    endpoint_id varchar(64) binary,
    relay_id varchar(64) binary,
    agent_version varchar(32) binary,
    last_status varchar(16) binary,
    working_directory varchar(255) binary,
    sec_resource_id varchar(36) binary not null,
    impersonation_user varchar(255) binary,
    impersonation_group varchar(255) binary,
    impersonation_password varchar(255) binary,
    impersonation_sudo varchar(1) binary,
    impersonation_force varchar(1) binary,
    license_type varchar(16) binary default 'none' not null,
    last_properties_hash integer,
    last_contact bigint,
    apikey_id varchar(36) binary,
    jms_cert longtext,
    date_created bigint default 0 not null,
    comm_version integer default 0 not null,
    property_cookie varchar(255) binary
) engine = innodb;

create table ds_apikey (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    apikey varchar(64) binary not null,
    secretkey varchar(255) binary not null,
    sec_user_id varchar(36) binary not null,
    disabled varchar(1) binary default 'N' not null,
    date_created bigint not null,
    expiration bigint default 0 not null
) engine = innodb;

create table ds_agent_test_result (
    id varchar(36) binary not null primary key,
    test_result varchar(2000) binary
) engine = innodb;

create table ds_agent_request_record (
        id varchar(36) binary not null primary key,
        version integer default 0 not null,
        agent_id varchar(36) binary not null,
        request_id varchar(36) binary not null
) engine = innodb;

create table ds_agent_to_tag (
    agent_id varchar(36) binary not null,
    tag_id varchar(36) binary not null
) engine = innodb;

create table ds_agent_pool (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    name varchar(255) binary not null,
    active varchar(1) binary not null,
    description varchar(255) binary,
    ghosted_date bigint default 0 not null,
    sec_resource_id varchar(36) binary not null
) engine = innodb;

create table ds_agent_to_pool (
    agent_id varchar(36) binary not null,
    pool_id varchar(36) binary not null
) engine = innodb;

create table ds_resource (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    name varchar(255) binary not null,
    path varchar(1000) binary default '/' not null,
    active varchar(1) binary not null,
    description varchar(255) binary,
    agent_id varchar(36) binary,
    agent_pool_id varchar(36) binary,
    component_tag_id varchar(36) binary,
    parent_id varchar(36) binary,
    resource_template_id varchar(36) binary,
    role_id varchar(36) binary,
    sec_resource_id varchar(36) binary not null,
    ghosted_date bigint default 0 not null,
    inherit_team varchar(1) binary not null,
    impersonation_user varchar(255) binary,
    impersonation_group varchar(255) binary,
    impersonation_password varchar(255) binary,
    impersonation_sudo varchar(1) binary,
    impersonation_force varchar(1) binary,
    discovery_failed varchar(1) binary default 'N' not null,
    prototype varchar(1) binary default 'N' not null
) engine = innodb;


create table ds_resource_template (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    name varchar(255) binary not null,
    description varchar(1000) binary,
    parent_id varchar(36) binary,
    application_id varchar(36) binary,
    sec_resource_id varchar(36) binary not null,
    ghosted_date bigint default 0 not null,
    prop_sheet_id varchar(36) binary not null,
    prop_sheet_def_id varchar(36) binary not null
) engine = innodb;

create table ds_cloud_connection (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    name varchar(255) binary not null,
    url varchar(255) binary not null,
    username varchar(255) binary not null,
    password varchar(255) binary not null,
    description varchar(1000) binary,
    sec_resource_id varchar(36) binary not null,
    ghosted_date bigint default 0 not null,
    prop_sheet_id varchar(36) binary not null,
    prop_sheet_def_id varchar(36) binary not null
) engine = innodb;

create table ds_resource_role (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    name varchar(255) binary not null,
    special_type varchar(20) binary,
    description varchar(255) binary,
    prop_sheet_def_id varchar(36) binary not null,
    default_name_property varchar(255) binary,
    ghosted_date bigint default 0 not null
) engine = innodb;

create table ds_res_role_allowed_parent (
    id varchar(36) binary not null primary key,
    resource_role_id varchar(36) binary not null,
    allowed_parent_id varchar(36) binary not null,
    foldername varchar(255) binary,
    allowed_name varchar(255) binary
) engine = innodb;

create table ds_res_role_default_child (
  resource_role_id varchar(36) binary not null,
  child_folder_name varchar(255) binary not null
) engine = innodb;

create table ds_resource_to_tag (
    resource_id varchar(36) binary not null,
    tag_id varchar(36) binary not null
) engine = innodb;

create table ds_discovery_execution (
    id varchar(36) binary not null primary key,
    command_id varchar(36) binary,
    resource_id varchar(36) binary,
    agent_id varchar(36) binary,
    status varchar(16) binary,
    start_time bigint,
    end_time bigint,
    auth_token varchar(255) binary,
    request_time bigint,
    acked varchar(1) binary default 'N' not null,
    action varchar(16) binary
) engine = innodb;

create table ds_agent_relay (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    name varchar(255) binary,
    endpoint_id varchar(64) binary not null,
    description varchar(255) binary,
    relay_version varchar(36) binary,
    hostname varchar(255) binary,
    relay_hostname varchar(255) binary,
    jms_port int default 0 not null,
    status varchar(16) binary,
    last_contact bigint,
    sec_resource_id varchar(36) binary not null
) engine = innodb;


-----------------------
-- components
-----------------------

create table ds_component (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    name varchar(255) binary not null,
    active varchar(1) binary not null,
    ghosted_date bigint default 0 not null,
    description varchar(255) binary,
    component_type varchar(16) binary default 'standard' not null,
    date_created bigint not null,
    created_by_user varchar(64) binary not null,
    resource_role_id varchar(36) binary not null,
    source_config_plugin varchar(36) binary,
    import_automatically varchar(1) binary not null,
    use_vfs varchar(1) binary not null,
    sec_resource_id varchar(36) binary not null,
    calendar_id varchar(36) binary not null,
    template_id varchar(36) binary,
    template_version bigint,
    cleanup_days_to_keep integer default 0 not null,
    cleanup_count_to_keep integer default 0 not null,
    default_version_type varchar(64) binary not null,
    version_creation_process_id varchar(36) binary,
    version_creation_env_id varchar(36) binary,
    integration_agent_id varchar(36) binary,
    integration_tag_id varchar(36) binary,
    integration_failed varchar(1) binary not null,
    ignore_qualifiers integer default 0 not null,
    last_modified bigint default 0 not null
) engine = innodb;

create table ds_component_to_tag (
    component_id varchar(36) binary not null,
    tag_id varchar(36) binary not null
) engine = innodb;


-----------------------
-- component versions
-----------------------

create table ds_version (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    name varchar(255) binary not null,
    active varchar(1) binary not null,
    archived varchar(1) binary default 'N' not null,
    description varchar(255) binary,
    component_id varchar(36) binary not null,
    date_created bigint not null,
    created_by_user varchar(64) binary not null,
    version_type varchar(64) binary not null,
    size_on_disk bigint default 0 not null,
    last_modified bigint default 0 not null,
    creation_process_requested varchar(1) binary default 'N' not null
) engine = innodb;

-------------------------
-- this is just to be consistent with what the upgrade does
-------------------------

create table ds_version_upgrade (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    locked varchar(1) binary default 'N' not null,
    upgraded varchar(1) binary default 'N' not null
) engine = innodb;


-----------------------
-- version statuses
-----------------------

create table ds_version_status (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    version_id varchar(36) binary not null,
    status_name varchar(255) binary not null,
    date_created bigint not null,
    created_by_user varchar(64) binary not null
) engine = innodb;


-----------------------
-- notification schemes
-----------------------

create table ds_notification_scheme (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    name varchar(255) binary not null,
    description varchar(255) binary
) engine = innodb;

create table ds_notification_entry (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    resource_type_id varchar(64) binary not null,
    resource_role_id varchar(64) binary,
    role_id varchar(64) binary not null,
    entry_type varchar(64) binary not null,
    notification_scheme_id varchar(36) binary not null,
    template_name varchar(255) binary
) engine = innodb;

-----------------------
-- applications
-----------------------

create table ds_application (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    name varchar(255) binary not null,
    ghosted_date bigint default 0 not null,
    active varchar(1) binary not null,
    description varchar(255) binary,
    enforce_complete_snapshots varchar(1) binary default 'Y' not null,
    date_created bigint not null,
    created_by_user varchar(64) binary not null,
    calendar_id varchar(36) binary not null,
    notification_scheme_id varchar(36) binary,
    sec_resource_id varchar(36) binary not null,
    last_modified bigint default 0 not null,
    template_id varchar(36) binary,
    template_version bigint
) engine = innodb;

create table ds_application_to_component (
    application_id varchar(36) binary not null,
    component_id varchar(36) binary not null
) engine = innodb;

create table ds_application_to_tag (
    application_id varchar(36) binary not null,
    tag_id varchar(36) binary not null
) engine = innodb;


-----------------------
-- environments
-----------------------

create table ds_environment (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    name varchar(255) binary not null,
    active varchar(1) binary not null,
    index_order integer not null,
    description varchar(255) binary,
    color varchar(10) binary,
    application_id varchar(36) binary not null,
    calendar_id varchar(36) binary not null,
    resource_template_id varchar(36) binary,
    instance_id varchar(64) binary,
    require_approvals varchar(1) binary not null,
    exempt_process_ids varchar(4000) binary,
    lock_snapshots varchar(1) binary not null,
    snapshot_lock_type varchar(64) binary,
    approval_process_id varchar(36) binary,
    sec_resource_id varchar(36) binary not null,
    cleanup_days_to_keep integer default 0 not null,
    ghosted_date bigint default 0 not null,
    cleanup_count_to_keep integer default 0 not null,
    history_days_to_keep bigint default 365 not null,
    last_modified bigint default 0 not null,
    template_id varchar(36) binary,
    template_version bigint,
    enable_process_history_cleanup varchar(1) binary default 'N' not null,
    use_system_default_days varchar(1) binary default 'Y' not null,
    no_self_approvals varchar(1) binary default 'N' not null,
    snapshot_days_to_keep bigint default 0 not null,
    require_snapshot varchar(1) binary default 'N' not null,
    allow_process_drafts varchar(1) binary default 'N' not null
) engine = innodb;

create table ds_environment_draft_usage (
    environment_id varchar(36) binary not null,
    component_id varchar(36) binary not null
) engine = innodb;

create table ds_environment_to_resource (
    environment_id varchar(36) binary not null,
    resource_id varchar(36) binary not null
) engine = innodb;

create table ds_prop_cmp_env_mapping (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    environment_id varchar(36) binary not null,
    component_id varchar(36) binary not null,
    prop_sheet_id varchar(36) binary not null
) engine = innodb;

create table ds_env_ver_condition (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    environment_id varchar(36) binary not null,
    index_order integer not null,
    value varchar(255) binary not null
) engine = innodb;



-----------------------
-- snapshots
-----------------------

create table ds_snapshot (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    name varchar(255) binary not null,
    active varchar(1) binary not null,
    ghosted_date bigint default 0 not null,
    description varchar(255) binary,
    date_created bigint not null,
    created_by_user varchar(64) binary not null,
    application_id varchar(36) binary not null,
    calendar_id varchar(36) binary not null,
    prop_sheet_id varchar(36) binary not null,
    versions_locked varchar(1) binary not null,
    config_locked varchar(1) binary not null,
    last_modified bigint default 0 not null
) engine = innodb;

create table ds_snapshot_to_version (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    snapshot_id varchar(36) binary not null,
    version_id varchar(36) binary not null,
    role_id varchar(36) binary,
    index_order integer
) engine = innodb;

create table ds_snapshot_config_version (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    snapshot_id varchar(36) binary not null,
    path varchar(255) binary not null,
    persistent_version integer
) engine = innodb;

create table ds_snapshot_status (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    snapshot_id varchar(36) binary not null,
    status_name varchar(255) binary not null,
    date_created bigint not null,
    created_by_user varchar(64) binary not null
) engine = innodb;



-----------------------
-- statuses
-----------------------

create table ds_status (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    name varchar(255) binary not null,
    ghosted_date bigint default 0 not null,
    description varchar(255) binary,
    color varchar(10) binary,
    status_type varchar(64) binary,
    unique_status varchar(1) binary not null,
    role_id varchar(36) binary
) engine = innodb;



-----------------------
-- processes
-----------------------

create table ds_copied_activity (
    id varchar(36) binary not null primary key,
    user_id varchar(64) binary not null,
    version integer default 0 not null,
    label varchar(255) binary,
    activity_data longtext not null
) engine = innodb;

create table ds_process_lock (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    process_id varchar(36) binary not null,
    user_id varchar(36) binary not null
) engine = innodb;


--**************************************************************************************************
-- runtime classes
--**************************************************************************************************

-----------------------
-- property contexts
-----------------------

create table rt_property_context (
    id varchar(36) binary primary key not null,
    version integer default 0 not null,
    prop_sheet_id varchar(36) binary not null
) engine = innodb;

create table rt_property_context_group_map (
    id varchar(36) binary primary key not null,
    version integer default 0 not null,
    property_context_id varchar(36) binary not null,
    prefix varchar(255) binary not null,
    prop_sheet_id varchar(36) binary,
    prop_sheet_handle varchar(255) binary,
    index_order bigint not null
) engine = innodb;


-----------------------
-- requests
-----------------------

create table rt_process_request (
    id varchar(36) binary primary key not null,
    version integer default 0 not null,
    user_id varchar(64) binary not null,
    submitted_time bigint not null,
    property_context_id varchar(36) binary not null,
    process_path varchar(255) binary not null,
    process_version bigint not null,
    trace_id varchar(36) binary,
    result varchar(32) binary
) engine = innodb;

create table rt_deployment_request (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    app_process_request_id varchar(36) binary not null
) engine = innodb;

create table rt_app_process_request (
    id varchar(36) binary primary key not null,
    version integer default 0 not null,
    deployment_request_id varchar(36) binary,
    user_id varchar(64) binary not null,
    submitted_time bigint not null,
    application_id varchar(36) binary not null,
    environment_id varchar(36) binary not null,
    property_context_id varchar(36) binary not null,
    calendar_entry_id varchar(36) binary not null,
    approval_id varchar(36) binary,
    application_process_id varchar(36) binary not null,
    application_process_version bigint not null,
    snapshot_id varchar(36) binary,
    trace_id varchar(36) binary,
    only_changed varchar(1) binary not null,
    description varchar(255) binary,
    result varchar(32) binary
) engine = innodb;

create table rt_app_proc_req_to_version (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    app_process_request_id varchar(36) binary not null,
    version_id varchar(36) binary not null,
    role_id varchar(36) binary,
    index_order integer
) engine = innodb;

create table rt_version_selector (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    value varchar(255) binary not null,
    application_process_request_id varchar(36) binary,
    component_id varchar(36) binary not null,
    environment_id varchar(36) binary not null,
    role_id varchar(36) binary,
    snapshot_id varchar(36) binary
) engine = innodb;

create table rt_comp_process_request (
    id varchar(36) binary primary key not null,
    version integer default 0 not null,
    user_id varchar(64) binary not null,
    submitted_time bigint not null,
    application_id varchar(36) binary not null,
    environment_id varchar(36) binary not null,
    property_context_id varchar(36) binary not null,
    calendar_entry_id varchar(36) binary not null,
    approval_id varchar(36) binary,
    component_id varchar(36) binary not null,
    component_process_id varchar(36) binary not null,
    component_process_version bigint not null,
    version_id varchar(36) binary,
    resource_id varchar(36) binary not null,
    agent_id varchar(36) binary not null,
    trace_id varchar(36) binary,
    parent_request_id varchar(36) binary,
    continuation varchar(73) binary,
    result varchar(32) binary,
    is_draft varchar(1) binary default 'N' not null
) engine = innodb;

create table rt_stack_execution_record (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    resource_data longtext,
    last_updated bigint not null,
    result varchar(32) binary,
    app_process_request_id varchar(36) binary not null,
    continuation varchar(73) binary not null,
    stack_id varchar(36) binary not null,
    provider_id varchar(36) binary not null
) engine = innodb;

create table rt_deletable_trace (
    id varchar(36) binary not null primary key
) engine = innodb;

--**************************************************************************************************
-- manual tasks
--**************************************************************************************************

create table tsk_approval (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    name varchar(255) binary not null,
    started_by_user_id varchar(64) binary not null,
    prop_sheet_id varchar(36) binary not null,
    failed varchar(1) binary not null,
    failed_by_user varchar(64) binary,
    failed_comment varchar(4000) binary,
    date_failed bigint
) engine = innodb;

create table tsk_task (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    classname varchar(255) binary not null,
    name varchar(255) binary not null,
    comment_prompt varchar(1024) binary,
    comment_required varchar(1) binary,
    completed_by_user varchar(64) binary,
    task_comment varchar(4000) binary,
    date_started bigint,
    date_ended bigint,
    status varchar(64) binary not null,
    prop_sheet_id varchar(36) binary not null,
    prop_sheet_def_id varchar(36) binary not null
) engine = innodb;

create table tsk_task_resource_role_map (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    task_id varchar(36) binary not null,
    sec_resource_role_id varchar(64) binary,
    sec_resource_id varchar(64) binary not null,
    sec_role_id varchar(64) binary not null
) engine = innodb;

create table tsk_task_member_map (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    task_id varchar(36) binary not null,
    sec_user_id varchar(64) binary,
    sec_group_id varchar(64) binary
) engine = innodb;

create table tsk_approval_to_task (
    approval_id varchar(36) binary not null,
    task_id varchar(36) binary not null
) engine = innodb;

create table tsk_promotion (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    component_process_id varchar(36) binary not null,
    draft_process_version integer default 0 not null,
    requested_by_user varchar(36) binary not null,
    completed_by_user varchar(36) binary,
    date_requested bigint not null,
    date_ended bigint,
    result varchar(64) binary
) engine = innodb;

--**************************************************************************************************
-- plugin system
--**************************************************************************************************

create table pl_plugin (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    name varchar(255) binary,
    tag varchar(255) binary,
    description varchar(4000) binary,
    plugin_id varchar(255) binary not null,
    plugin_version integer not null,
    ghosted_date bigint default 0 not null,
    plugin_hash varchar(255) binary,
    release_version varchar(255) binary
) engine = innodb;

create table pl_plugin_command (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    name varchar(255) binary,
    sub_tag varchar(4000) binary,
    description varchar(4000) binary,
    plugin_id varchar(36) binary not null,
    type varchar(255) binary,
    role_id varchar(36) binary,
    prop_sheet_def_id varchar(36) binary not null
) engine = innodb;

create table pl_command_to_resource_role (
    command_id varchar(36) binary not null,
    resource_role_id varchar(36) binary not null
) engine = innodb;

create table pl_plugin_role (
    plugin_id varchar(36) binary not null,
    role_id varchar(36) binary not null
) engine = innodb;

create table ds_plugin_task_request (
    workflow_id varchar(36) binary not null,
    activity_trace_id varchar(36) binary not null,
    activity_name varchar(255) binary not null,
    property_context_id varchar(36) binary not null,
    failure_continuation varchar(73) binary not null,
    success_continuation varchar(73) binary not null,
    dialogue_id varchar(36) binary not null primary key,
    version integer default 0 not null,
    agent_id varchar(36) binary,
    request_time bigint,
    last_resend_time bigint default 0,
    resend_message blob,
    acked varchar(1) binary default 'N' not null
) engine = innodb;

create table pl_source_config_plugin (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    name varchar(255) binary,
    tag varchar(255) binary,
    description varchar(4000) binary,
    plugin_id varchar(255) binary not null,
    plugin_version integer not null,
    ghosted_date bigint default 0 not null,
    plugin_hash varchar(255) binary,
    release_version varchar(255) binary,
    comp_prop_sheet_id varchar(36) binary,
    import_prop_sheet_id varchar(36) binary
) engine = innodb;

create table pl_source_config_execution (
    id varchar(36) binary not null primary key,
    task_info varchar(255) binary,
    component_id varchar(36) binary,
    agent_id varchar(36) binary,
    start_time bigint,
    end_time bigint,
    status varchar(16) binary,
    auth_token varchar(255) binary,
    input_properties longtext,
    request_time bigint,
    acked varchar(1) binary default 'N' not null
) engine = innodb;

--**************************************************************************************************
-- licensing and agent data
--**************************************************************************************************

create table ds_agent_data (
    agent_data varchar(255) binary not null
) engine = innodb;

create table ds_license_log_entry (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    message varchar(4000) binary not null,
    violation_time bigint not null,
    dismissed varchar(1) binary default 'N' not null
) engine = innodb;

create table ds_agent_usage (
    id varchar(36) binary not null primary key,
    type varchar(36) binary not null,
    time_stamp bigint not null,
    count integer default 0 not null
) engine = innodb;

create table ds_agent_usage_tracking (
    id varchar(36) binary not null primary key,
    type varchar(36) binary not null,
    window_start bigint not null,
    window_end bigint not null,
    watermark integer default 0 not null
) engine = innodb;

--**************************************************************************************************
-- network data
--**************************************************************************************************

create table ds_network_relay (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    name varchar(255) binary not null,
    active varchar(1) binary not null,
    host varchar(255) binary not null,
    port integer not null
) engine = innodb;


--**************************************************************************************************
-- reporting
--**************************************************************************************************

create table ds_recent_report (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    user_id varchar(64) binary not null,
    report_type varchar(255) binary not null,
    report_name varchar(255) binary not null,
    last_run bigint not null
) engine = innodb;

create table rp_app_req_plugin (
    app_request_id varchar(255) binary not null,
    plugin_name varchar(255) binary not null
) engine = innodb;

--**************************************************************************************************
-- locking
--**************************************************************************************************

create table ds_ptr_store_lock(
    id integer not null primary key
) engine = innodb;

create table ds_lockable (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    lock_name varchar(4000) binary not null,
    max_permits integer default 1 not null
) engine = innodb;

create table ds_lock (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    acquirer varchar(36) binary not null,
    success_continuation varchar(73) binary,
    failure_continuation varchar(73) binary,
    acquired varchar(1) binary not null,
    lockable varchar(36) binary not null,
    date_created bigint default 0 not null
) engine = innodb;

create table ds_comp_ver_int_rec (
   id varchar(36) binary not null primary key
) engine = innodb;

create table ds_vfs_repo_rec (
   id varchar(36) binary not null primary key
) engine = innodb;

create table ds_audit_entry (
   id varchar(36) binary not null primary key,
   version integer default 0 not null,
   user_id varchar(64) binary,
   user_name varchar(255) binary,
   event_type varchar(255) binary not null,
   description varchar(255) binary,
   obj_type varchar(255) binary,
   obj_name varchar(255) binary,
   obj_id varchar(255) binary,
   created_date bigint not null,
   status varchar(255) binary not null,
   deletable varchar(1) binary default 'Y',
   ip_address varchar(40) binary
) engine = innodb;

create table ds_request_audit_entry (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    user_id varchar(36) binary,
    short_url varchar(255) binary not null,
    full_url varchar(4000) binary not null,
    duration bigint not null,
    method varchar(10) binary not null,
    date_created bigint not null
) engine = innodb;

create table ds_sync (
    name varchar(255) binary not null primary key,
    locked varchar(1) binary not null,
    value varchar(255) binary
) engine = innodb;


--**************************************************************************************************
-- integration
--**************************************************************************************************

create table ds_integration_provider (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    date_created bigint not null,
    classname varchar(255) binary not null,
    name varchar(255) binary not null,
    description varchar(4000) binary,
    prop_sheet_id varchar(36) binary not null,
    ghosted_date bigint default 0 not null
) engine = innodb;

create table ds_ext_environment (
    id varchar(36) binary not null primary key,
    ext_id varchar(36) binary not null,
    name varchar(255) binary not null,
    version integer default 0 not null,
    environment_id varchar(36) binary not null,
    date_created bigint not null,
    ext_blueprint_id varchar(255) binary,
    ext_blueprint_name varchar(255) binary not null,
    ext_blueprint_version varchar(36) binary,
    ext_blueprint_url varchar(255) binary,
    ext_configuration_id varchar(255) binary,
    ext_configuration_name varchar(255) binary,
    ext_configuration_version varchar(36) binary,
    integration_provider_id varchar(36) binary,
    prop_sheet_id varchar(36) binary not null,
    ghosted_date bigint default 0 not null
) engine = innodb;

--**************************************************************************************************
-- history cleanup
--**************************************************************************************************

create table ds_history_cleanup_record (
    id varchar(36) binary not null primary key,
    version integer default 0 not null,
    total_deployments_for_cleanup integer not null,
    deployments_deleted integer default 0 not null,
    date_cleanup_started bigint not null,
    date_cleanup_finished bigint
) engine = innodb;

--**************************************************************************************************
-- vc metadata
--**************************************************************************************************

create table ds_plugin_usage_metadata (
    id varchar(36) binary primary key not null,
    persistent_record_id varchar(36) binary not null,
    persistent_record_commit bigint not null,
    command_id varchar(36) binary not null,
    process_name varchar(255) binary not null,
    process_id varchar(36) binary not null,
    component_id varchar(36) binary,
    component_template_id varchar(36) binary,
    component_template_name varchar(255) binary,
    process_type varchar(64) binary not null
) engine = innodb;

create table rt_command(
    id varchar(36) binary not null primary key,
    version integer not null,
    command_state varchar(64) binary not null,
    command_state_version integer not null,
    command_outcome varchar(64) binary not null,
    command_type varchar(64) binary not null,
    agent_id varchar(64) binary not null,
    log_streaming_mode varchar(1) binary not null,
    command_data blob not null
) engine = innodb;

create table ds_server (
    id varchar(36) binary not null primary key,
    version int not null,
    created_date bigint not null,
    modified_date bigint not null,
    ghosted_date bigint not null,
    server_id varchar(64) binary not null,
    server_uri varchar(255) binary not null,
    server_cert longtext,
    server_cert_modified_date bigint not null,
    server_pubkey_modified_date bigint not null,
    client_cert longtext,
    client_cert_modified_date bigint not null,
    client_pubkey_modified_date bigint not null
) engine = innodb;

--**************************************************************************************************
-- ucd db versioning
--**************************************************************************************************

create table ds_database_version (
    id varchar(36) binary primary key not null,
    stamp varchar(36) binary not null
)

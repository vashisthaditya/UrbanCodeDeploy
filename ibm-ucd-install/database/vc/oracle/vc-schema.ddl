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
create table vc_db_version (
    release_name varchar2(255) not null,
    ver numeric default 0 not null
);

create table vc_commit (
    id numeric not null primary key,
    commit_time numeric not null,
    commit_user varchar2(255),
    commit_comment varchar2(1000)
);

create table vc_commit_path_entry (
    id varchar2(36) not null primary key,
    commit_id numeric not null,
    path varchar2(255),
    entry_type varchar2(32)
);

create table vc_persistent_record (
    id varchar2(36) not null primary key,
    path varchar2(255) not null,
    commit_id numeric not null,
    relative_version numeric not null,
    directory varchar2(255) not null,
    persistent_data clob not null,
    deleted varchar2(1) not null
) lob (persistent_data) store as vc_persist_record_data_clob;

create table vc_latest_version_entry (
    path varchar2(255) primary key not null,
    persistent_record_id varchar2(36) not null,
    relative_version numeric not null,
    deleted varchar2(1) not null,
    directory varchar2(255) not null,
    commit_id numeric not null
);

create table vc_commit_lock (
    name varchar2(36) primary key not null
);

create table vc_persistent_record_metadata (
    id varchar2(36) primary key not null,
    metadata_generator varchar2(255) not null,
    metadata_key varchar2(255) not null,
    metadata_value varchar2(255) not null,
    persistent_record_id varchar2(36) not null,
    persistent_record_commit numeric not null
);

create table vc_persistent_meta_gen_state (
    id varchar2(36) primary key not null,
    metadata_generator varchar2(255) not null,
    metadata_generator_version numeric not null,
    scan_end_commit numeric not null,
    newest_scanned_commit numeric not null
);

create table vc_prop_update (
    id varchar2(36) not null primary key,
    updated varchar2(1) default 'N'
);

create table vc_update_tracking (
    update_name varchar2(255) not null primary key,
    completed varchar2(1) default 'N'
);
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
    release_name nvarchar(255) not null,
    ver int default 0 not null
);

create table vc_commit (
    id bigint not null primary key,
    commit_time bigint not null,
    commit_user nvarchar(255),
    commit_comment nvarchar(1000)
);

create table vc_commit_path_entry (
    id nvarchar(36) not null primary key,
    commit_id bigint not null,
    path nvarchar(255),
    entry_type nvarchar(32)
);

create table vc_persistent_record (
    id nvarchar(36) not null primary key,
    path nvarchar(255) not null,
    commit_id bigint not null,
    relative_version int not null,
    directory nvarchar(255) not null,
    persistent_data ntext not null,
    deleted nvarchar(1) not null
);

create table vc_latest_version_entry (
    path nvarchar(255) primary key not null,
    persistent_record_id nvarchar(36) not null,
    relative_version int not null,
    commit_id bigint not null,
    directory nvarchar(255) not null,
    deleted nvarchar(1) not null
);

create table vc_commit_lock (
    name nvarchar(36) primary key not null
);

create table vc_persistent_record_metadata (
    id nvarchar(36) primary key not null,
    metadata_generator nvarchar(255) not null,
    metadata_key nvarchar(255) not null,
    metadata_value nvarchar(255) not null,
    persistent_record_id nvarchar(36) not null,
    persistent_record_commit bigint not null
);

create table vc_persistent_meta_gen_state (
    id nvarchar(36) primary key not null,
    metadata_generator nvarchar(255) not null,
    metadata_generator_version int not null,
    scan_end_commit bigint not null,
    newest_scanned_commit bigint not null
);

create table vc_prop_update (
    id nvarchar(36) not null primary key,
    updated nvarchar(1) default 'N'
);

create table vc_update_tracking (
    update_name nvarchar(255) not null primary key,
    completed nvarchar(1) default 'N'
);
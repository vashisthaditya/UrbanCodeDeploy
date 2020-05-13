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
    release_name varchar(255) not null,
    ver integer default 0 not null
) engine = innodb;

create table vc_commit (
    id bigint not null primary key,
    commit_time bigint not null,
    commit_user varchar(255),
    commit_comment varchar(1000)
) engine = innodb;

create table vc_commit_path_entry (
    id varchar(36) not null primary key,
    commit_id bigint not null,
    path varchar(255),
    entry_type varchar(32)
) engine = innodb;

create table vc_persistent_record (
    id varchar(36) not null primary key,
    path varchar(255) not null,
    commit_id bigint not null,
    relative_version numeric not null,
    directory varchar(255) not null,
    persistent_data longtext not null,
    deleted varchar(1) not null
) engine = innodb;

create table vc_latest_version_entry (
    path varchar(255) primary key not null,
    persistent_record_id varchar(36) not null,
    relative_version numeric not null,
    deleted varchar(1) not null,
    directory varchar(255) not null,
    commit_id bigint not null
) engine = innodb;

create table vc_commit_lock (
    name varchar(36) primary key not null
) engine = innodb;

create table vc_persistent_record_metadata (
    id varchar(36) primary key not null,
    metadata_generator varchar(255) not null,
    metadata_key varchar(255) not null,
    metadata_value varchar(255) not null,
    persistent_record_id varchar(36) not null,
    persistent_record_commit bigint not null
) engine = innodb;

create table vc_persistent_meta_gen_state (
    id varchar(36) primary key not null,
    metadata_generator varchar(255) not null,
    metadata_generator_version numeric not null,
    scan_end_commit bigint not null,
    newest_scanned_commit bigint not null
) engine = innodb;

create table vc_prop_update (
    id varchar(36) not null primary key,
    updated varchar(1) default 'N'
) engine = innodb;

create table vc_update_tracking (
    update_name varchar(255) not null primary key,
    completed varchar(1) default 'N'
) engine = innodb;
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

create table ps_prop_sheet_group (
    id varchar(36) not null primary key,
    version integer default 0 not null
);


create table ps_prop_sheet_def (
    id varchar(36) not null primary key,
    version integer default 0 not null,
    name varchar(255),
    description varchar(4000),
    prop_sheet_group_id varchar(36),
    template_handle varchar(255),
    template_prop_sheet_def_id varchar(36)
);


create table ps_prop_def (
    id varchar(36) not null primary key,
    version integer default 0 not null,
    prop_sheet_def_id varchar(36) not null,
    name varchar(255) not null,
    description varchar(4000),
    placeholder varchar(4000),
    label varchar(255),
    default_value varchar(4000),
    long_default_value oid,
    default_label varchar(4000),
    long_default_label oid,
    property_type varchar(64),
    required varchar(1) not null,
    hidden varchar(1) not null,
    index_order integer,
    allowed_prop_sheet_def_id varchar(36),
    pattern varchar(255)
);
create rule drop_ps_prop_def_long_default as on delete to ps_prop_def do select lo_unlink(old.long_default_value);
create rule change_ps_prop_def_long_default as on update to ps_prop_def do select lo_unlink(old.long_default_value) where old.long_default_value <> new.long_default_value;
create rule drop_ps_prop_def_long_default_label as on delete to ps_prop_def do select lo_unlink(old.long_default_label);
create rule change_ps_prop_def_long_default_label as on update to ps_prop_def do select lo_unlink(old.long_default_label) where old.long_default_label <> new.long_default_label;

create table ps_http_prop_info (
    id varchar(36) not null primary key,
    version integer default 0 not null,
    prop_def_id varchar(36) not null,
    url varchar(4000) not null,
    username varchar(255),
    password varchar(255),
    data_format varchar(36) not null,
    base_path varchar(4000),
    value_path varchar(4000),
    label_path varchar(4000),
    data_auth_type varchar(36) not null,
    resolve_http_url varchar(4000)
);

create table ps_scripted_prop_info (
    id varchar(36) not null primary key,
    version integer default 0 not null,
    prop_def_id varchar(36) not null,
    source varchar(4000) not null,
    arguments varchar(4000),
    data_source_type varchar(36) not null,
    data_format varchar(36) not null,
    base_path varchar(4000),
    value_path varchar(4000),
    label_path varchar(4000)
);

create table ps_prop_def_allowed_value (
    id varchar(36) not null primary key,
    version integer default 0 not null,
    prop_def_id varchar(36) not null,
    value varchar(4000) not null,
    label varchar(255),
    index_order integer
);


create table ps_prop_sheet_handle (
    id varchar(36) not null primary key,
    version integer default 0 not null,
    prop_sheet_handle varchar(255) not null,
    prop_sheet_def_id varchar(36) not null
);


create table ps_prop_sheet (
    id varchar(36) not null primary key,
    version integer default 0 not null,
    name varchar(255),
    prop_sheet_group_id varchar(36),
    prop_sheet_def_id varchar(36),
    prop_sheet_def_handle varchar(255),
    template_prop_sheet_id varchar(36),
    template_handle varchar(255)
);


create table ps_prop_value (
    id varchar(36) not null primary key,
    version integer default 0 not null,
    name varchar(255) not null,
    value varchar(4000),
    long_value oid,
    label varchar(4000),
    long_label oid,
    description varchar(4000),
    secure varchar(1),
    prop_sheet_id varchar(36) not null
);
create rule drop_ps_prop_val_long_value as on delete to ps_prop_value do select lo_unlink(old.long_value);
create rule change_ps_prop_val_long_value as on update to ps_prop_value do select lo_unlink(old.long_value) where old.long_value <> new.long_value;
create rule drop_ps_prop_val_long_label as on delete to ps_prop_value do select lo_unlink(old.long_label);
create rule change_ps_prop_val_long_label as on update to ps_prop_value do select lo_unlink(old.long_label) where old.long_label <> new.long_label;



create table ps_db_version (
    release_name  varchar(255) not null,
    ver           integer default 0 not null
);

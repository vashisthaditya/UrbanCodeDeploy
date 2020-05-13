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
    id nvarchar(36) not null primary key,
    version integer default 0 not null
);


create table ps_prop_sheet_def (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    name nvarchar(255),
    description nvarchar(4000),
    prop_sheet_group_id nvarchar(36),
    template_handle nvarchar(255),
    template_prop_sheet_def_id nvarchar(36)
);


create table ps_prop_def (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    prop_sheet_def_id nvarchar(36) not null,
    name nvarchar(255) not null,
    description nvarchar(4000),
    placeholder nvarchar(4000),
    label nvarchar(255),
    default_value nvarchar(4000),
    long_default_value ntext,
    default_label nvarchar(4000),
    long_default_label ntext,
    property_type nvarchar(64),
    required nvarchar(1) not null,
    hidden nvarchar(1) not null,
    index_order integer,
    allowed_prop_sheet_def_id nvarchar(36),
    pattern nvarchar(255)
);

create table ps_http_prop_info (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    prop_def_id nvarchar(36) not null,
    url nvarchar(4000) not null,
    username nvarchar(255),
    password nvarchar(255),
    data_format nvarchar(36) not null,
    base_path nvarchar(4000),
    value_path nvarchar(4000),
    label_path nvarchar(4000),
    data_auth_type nvarchar(36) not null,
    resolve_http_url nvarchar(4000)
);

create table ps_scripted_prop_info (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    prop_def_id nvarchar(36) not null,
    source nvarchar(4000) not null,
    arguments nvarchar(4000),
    data_source_type nvarchar(36) not null,
    data_format nvarchar(36) not null,
    base_path nvarchar(4000),
    value_path nvarchar(4000),
    label_path nvarchar(4000)
);

create table ps_prop_def_allowed_value (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    prop_def_id nvarchar(36) not null,
    value nvarchar(4000) not null,
    label nvarchar(255),
    index_order integer
);


create table ps_prop_sheet_handle (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    prop_sheet_handle nvarchar(255) not null,
    prop_sheet_def_id nvarchar(36) not null
);


create table ps_prop_sheet (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    name nvarchar(255),
    prop_sheet_group_id nvarchar(36),
    prop_sheet_def_id nvarchar(36),
    prop_sheet_def_handle nvarchar(255),
    template_prop_sheet_id nvarchar(36),
    template_handle nvarchar(255)
);


create table ps_prop_value (
    id nvarchar(36) not null primary key,
    version integer default 0 not null,
    name nvarchar(255) not null,
    value nvarchar(4000),
    long_value ntext,
    label nvarchar(4000),
    long_label ntext,
    description nvarchar(4000),
    secure nvarchar(1),
    prop_sheet_id nvarchar(36) not null
);


create table ps_db_version (
    release_name  nvarchar(255) not null,
    ver           integer default 0 not null
);

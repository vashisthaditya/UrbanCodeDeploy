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
    id varchar2(36) not null primary key,
    version numeric default 0 not null
);


create table ps_prop_sheet_def (
    id varchar2(36) not null primary key,
    version numeric default 0 not null,
    name varchar2(255),
    description varchar2(4000),
    prop_sheet_group_id varchar2(36),
    template_handle varchar2(255),
    template_prop_sheet_def_id varchar2(36)
);


create table ps_prop_def (
    id varchar2(36) not null primary key,
    version numeric default 0 not null,
    prop_sheet_def_id varchar2(36) not null,
    name varchar2(255) not null,
    description varchar2(4000),
    placeholder varchar2(4000),
    label varchar2(255),
    default_value varchar2(4000),
    long_default_value clob,
    default_label varchar2(4000),
    long_default_label clob,
    property_type varchar2(64),
    required varchar2(1) not null,
    hidden varchar2(1) not null,
    index_order numeric,
    allowed_prop_sheet_def_id varchar2(36),
    pattern varchar2(255)
) lob (long_default_value) store as ps_prop_default_value_lob;

create table ps_http_prop_info (
    id varchar2(36) not null primary key,
    version numeric default 0 not null,
    prop_def_id varchar2(36) not null,
    url varchar2(4000) not null,
    username varchar2(255),
    password varchar2(255),
    data_format varchar2(36) not null,
    base_path varchar2(4000),
    value_path varchar2(4000),
    label_path varchar2(4000),
    data_auth_type varchar2(36) not null,
    resolve_http_url varchar2(4000)
);

create table ps_scripted_prop_info (
    id varchar2(36) not null primary key,
    version numeric default 0 not null,
    prop_def_id varchar2(36) not null,
    source varchar2(4000) not null,
    arguments varchar2(4000),
    data_source_type varchar2(36) not null,
    data_format varchar2(36) not null,
    base_path varchar2(4000),
    value_path varchar2(4000),
    label_path varchar2(4000)
);

create table ps_prop_def_allowed_value (
    id varchar2(36) not null primary key,
    version numeric default 0 not null,
    prop_def_id varchar2(36) not null,
    value varchar2(4000) not null,
    label varchar2(255),
    index_order numeric
);


create table ps_prop_sheet_handle (
    id varchar2(36) not null primary key,
    version numeric default 0 not null,
    prop_sheet_handle varchar2(255) not null,
    prop_sheet_def_id varchar2(36) not null
);


create table ps_prop_sheet (
    id varchar2(36) not null primary key,
    version numeric default 0 not null,
    name varchar2(255),
    prop_sheet_group_id varchar2(36),
    prop_sheet_def_id varchar2(36),
    prop_sheet_def_handle varchar2(255),
    template_prop_sheet_id varchar2(36),
    template_handle varchar2(255)
);


create table ps_prop_value (
    id varchar2(36) not null primary key,
    version numeric default 0 not null,
    name varchar2(255) not null,
    value varchar2(4000),
    long_value clob,
    label varchar2(4000),
    long_label clob,
    description varchar2(4000),
    secure varchar2(1),
    prop_sheet_id varchar2(36) not null
) lob (long_value) store as ps_prop_value_lob;


create table ps_db_version (
    release_name  varchar2(255) not null,
    ver           numeric default 0 not null
);

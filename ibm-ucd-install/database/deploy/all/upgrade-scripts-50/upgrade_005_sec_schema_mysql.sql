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

create table sec_action (
    id varchar(36) binary not null,
    version integer default 0 not null,
    name varchar(64) binary not null,
    description varchar(1024) binary,
    enabled varchar(1) binary default 'y' not null,
    cascading varchar(1) binary default 'n' not null,
    sec_resource_type_id varchar(36) binary not null,
    primary key (id),
    unique (name)
) engine = innodb;

create table sec_group_role_on_team (
    id varchar(36) binary not null,
    version integer default 0 not null,
    sec_group_id varchar(36) binary not null,
    sec_role_id varchar(36) binary not null,
    sec_team_space_id varchar(36) binary not null,
    primary key (id),
    unique (sec_group_id, sec_role_id, sec_team_space_id)
) engine = innodb;

create table sec_resource_for_team (
    id varchar(36) binary not null,
    version integer default 0 not null,
    sec_resource_id varchar(36) binary not null,
    sec_team_space_id varchar(36) binary not null,
    sec_resource_role_id varchar(36) binary,
    primary key (id),
    unique (sec_resource_id, sec_team_space_id, sec_resource_role_id)
) engine = innodb;

create table sec_resource_role (
    id varchar(36) binary not null,
    version integer default 0 not null,
    name varchar(255) binary not null,
    description varchar(1024) binary,
    enabled varchar(1) binary default 'y' not null,
    sec_resource_type_id varchar(36) binary not null,
    primary key (id),
    unique (name)
) engine = innodb;

create table sec_role (
    id varchar(36) binary not null,
    version integer default 0 not null,
    name varchar(255) binary not null,
    description varchar(1024) binary,
    enabled varchar(1) binary default 'y' not null,
    primary key (id),
    unique (name)
) engine = innodb;

create table sec_role_action (
    id varchar(36) binary not null,
    version integer default 0 not null,
    sec_role_id varchar(36) binary not null,
    sec_action_id varchar(36) binary not null,
    sec_resource_role_id varchar(36) binary,
    primary key (id),
    unique (sec_role_id, sec_action_id, sec_resource_role_id)
) engine = innodb;

create table sec_team_space (
    id varchar(36) binary not null,
    version integer default 0 not null,
    enabled varchar(1) binary default 'y' not null,
    name varchar(255) binary not null,
    description varchar(4000) binary,
    primary key (id),
    unique (name)
) engine = innodb;

create table sec_user_role_on_team (
    id varchar(36) binary not null,
    version integer default 0 not null,
    sec_user_id varchar(36) binary not null,
    sec_role_id varchar(36) binary not null,
    sec_team_space_id varchar(36) binary not null,
    primary key (id),
    unique (sec_user_id, sec_role_id, sec_team_space_id)
) engine = innodb;



alter table sec_auth_token drop index sec_auth_token_uc;
alter table sec_user drop index sec_user_uc;

create table sec_auth_token2 (
    id varchar(36) binary not null,
    version integer default 0 not null,
    sec_user_id varchar(36) binary not null,
    token varchar(255) binary not null,
    expiration bigint not null,
    description varchar(1024) binary,
    os_user varchar(255) binary,
    host varchar(255) binary,
    primary key (id),
    constraint sec_auth_token_uc unique (token)
) engine = innodb;

create table sec_authentication_realm2 (
    id varchar(36) binary not null,
    version integer default 0 not null,
    name varchar(64) binary not null,
    description varchar(1024) binary,
    sort_order integer not null,
    enabled varchar(1) binary default 'n' not null,
    read_only varchar(1) binary default 'n' not null,
    login_module varchar(1024) binary not null,
    sec_authorization_realm_id varchar(36) binary not null,
    ghosted_date bigint default 0 not null,
    allowed_attempts integer default 0 not null,
    primary key (id)
) engine = innodb;

create table sec_authentication_realm_prop2 (
    sec_authentication_realm_id varchar(36) binary not null,
    name varchar(1024) binary not null,
    value varchar(4000) binary
) engine = innodb;

create table sec_authorization_realm2 (
    id varchar(36) binary not null,
    version integer default 0 not null,
    name varchar(64) binary not null,
    description varchar(1024) binary,
    authorization_module varchar(1024) binary not null,
    primary key (id)
) engine = innodb;

create table sec_authorization_realm_prop2 (
    sec_authorization_realm_id varchar(36) binary not null,
    name varchar(1024) binary not null,
    value varchar(4000) binary
) engine = innodb;

create table sec_group2 (
    id varchar(36) binary not null,
    version integer default 0 not null,
    name varchar(255) binary not null,
    sec_authorization_realm_id varchar(36) binary not null,
    enabled varchar(1) binary default 'y' not null,
    primary key (id),
    unique (name, sec_authorization_realm_id)
) engine = innodb;

create table sec_group_mapper2 (
    id varchar(36) binary not null,
    version integer default 0 not null,
    name varchar(64) binary not null unique,
    primary key (id)
) engine = innodb;

create table sec_group_mapping2 (
    id varchar(36) binary not null,
    version integer default 0 not null,
    sec_group_mapper_id varchar(36) binary not null,
    regex varchar(256) binary not null,
    replacement varchar(256) binary not null,
    primary key (id)
) engine = innodb;

create table sec_internal_user2 (
    id varchar(36) binary not null,
    version integer default 0 not null,
    name varchar(64) binary not null,
    password varchar(128) binary not null,
    encoded smallint default 0 not null,
    primary key (id)
) engine = innodb;

create table sec_resource2 (
    id varchar(36) binary not null,
    version integer default 0 not null,
    name varchar(256) binary not null,
    enabled varchar(1) binary default 'y' not null,
    sec_resource_type_id varchar(36) binary not null,
    primary key (id)
) engine = innodb;

create table sec_resource_hierarchy2 (
    parent_sec_resource_id varchar(36) binary not null,
    child_sec_resource_id varchar(36) binary not null,
    path_length integer not null,
    primary key (parent_sec_resource_id, child_sec_resource_id)
) engine = innodb;

create table sec_resource_type2 (
    id varchar(36) binary not null,
    version integer default 0 not null,
    name varchar(256) binary not null,
    enabled varchar(1) binary default 'y' not null,
    primary key (id)
) engine = innodb;

create table sec_user2 (
    id varchar(36) binary not null,
    version integer default 0 not null,
    name varchar(255) binary not null,
    enabled varchar(1) binary default 'y' not null,
    password varchar(256) binary,
    actual_name varchar(256) binary,
    email varchar(256) binary,
    im_id varchar(256) binary,
    sec_authentication_realm_id varchar(36) binary not null,
    ghosted_date bigint default 0 not null,
    failed_attempts integer default 0 not null,
    primary key (id),
    constraint sec_user_uc unique (name, sec_authentication_realm_id, ghosted_date)
) engine = innodb;

create table sec_user_to_group2 (
    sec_user_id varchar(36) binary not null,
    sec_group_id varchar(36) binary not null,
    unique (sec_user_id, sec_group_id)
) engine = innodb;


insert into sec_auth_token2
select id, version, sec_user_id, token, expiration, description, os_user, host
from sec_auth_token;

insert into sec_authentication_realm2
select id, version, name, description, sort_order, enabled, read_only, login_module,
sec_authorization_realm_id, ghosted_date, allowed_attempts
from sec_authentication_realm;

insert into sec_authentication_realm_prop2
select sec_authentication_realm_id, name, value
from sec_authentication_realm_prop;

insert into sec_authorization_realm2
select id, version, name, description, authorization_module
from sec_authorization_realm;

insert into sec_authorization_realm_prop2
select sec_authorization_realm_id, name, value
from sec_authorization_realm_prop;

insert into sec_group2
select id, version, name, sec_authorization_realm_id, enabled
from sec_group;

insert into sec_group_mapper2
select id, version, name
from sec_group_mapper;

insert into sec_group_mapping2
select id, version, sec_group_mapper_id, regex, replacement
from sec_group_mapping;

insert into sec_resource2
select id, version, name, enabled, sec_resource_type_id
from sec_resource;

insert into sec_resource_hierarchy2
select parent_sec_resource_id, child_sec_resource_id, path_length
from sec_resource_hierarchy;

insert into sec_resource_type2
select id, version, name, enabled
from sec_resource_type;

insert into sec_user2
select id, version, name, enabled, password, actual_name, email, im_id,
sec_authentication_realm_id, ghosted_date, failed_attempts
from sec_user;

insert into sec_user_to_group2
select sec_user_id, sec_group_id
from sec_user_to_group;


drop table sec_auth_token;
drop table sec_authentication_realm_prop;
drop table sec_authorization_realm_prop;
drop table sec_group_mapping;
drop table sec_group_mapper;
drop table sec_user_to_group;
drop table sec_internal_user;
drop table sec_resource_hierarchy;
drop table sec_resource;
drop table sec_resource_type;
drop table sec_group;
drop table sec_user;
drop table sec_authorization_realm;
drop table sec_authentication_realm;

rename table sec_auth_token2 to sec_auth_token;
rename table sec_authentication_realm2 to sec_authentication_realm;
rename table sec_authentication_realm_prop2 to sec_authentication_realm_prop;
rename table sec_authorization_realm2 to sec_authorization_realm;
rename table sec_authorization_realm_prop2 to sec_authorization_realm_prop;
rename table sec_group2 to sec_group;
rename table sec_group_mapper2 to sec_group_mapper;
rename table sec_group_mapping2 to sec_group_mapping;
rename table sec_internal_user2 to sec_internal_user;
rename table sec_resource2 to sec_resource;
rename table sec_resource_hierarchy2 to sec_resource_hierarchy;
rename table sec_resource_type2 to sec_resource_type;
rename table sec_user2 to sec_user;
rename table sec_user_to_group2 to sec_user_to_group;

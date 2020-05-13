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

-- NOTE: Using double colons as SQL separators due to usage of an Oracle function

--this was added after 5.0 branch was dead.
--it is here in the case we need to backport security upgrade to 4.8.5 to make sure upgrades work
alter table ds_apikey drop constraint apikey_2_user::

create table sec_action (
    id varchar2(36) not null,
    version integer default 0 not null,
    name varchar2(64) not null,
    description varchar2(1024),
    enabled varchar2(1) default 'y' not null,
    cascading varchar2(1) default 'n' not null,
    sec_resource_type_id varchar2(36) not null,
    primary key (id),
    unique (name)
)::

create table sec_group_role_on_team (
    id varchar2(36) not null,
    version integer default 0 not null,
    sec_group_id varchar2(36) not null,
    sec_role_id varchar2(36) not null,
    sec_team_space_id varchar2(36) not null,
    primary key (id),
    unique (sec_group_id, sec_role_id, sec_team_space_id)
)::

create table sec_resource_for_team (
    id varchar2(36) not null,
    version integer default 0 not null,
    sec_resource_id varchar2(36) not null,
    sec_team_space_id varchar2(36) not null,
    sec_resource_role_id varchar2(36),
    primary key (id),
    unique (sec_resource_id, sec_team_space_id, sec_resource_role_id)
)::

create table sec_resource_role (
    id varchar2(36) not null,
    version integer default 0 not null,
    name varchar2(255) not null,
    description varchar2(1024),
    enabled varchar2(1) default 'y' not null,
    sec_resource_type_id varchar2(36) not null,
    primary key (id),
    unique (name)
)::

create table sec_role (
    id varchar2(36) not null,
    version integer default 0 not null,
    name varchar2(255) not null,
    description varchar2(1024),
    enabled varchar2(1) default 'y' not null,
    primary key (id),
    unique (name)
)::

create table sec_role_action (
    id varchar2(36) not null,
    version integer default 0 not null,
    sec_role_id varchar2(36) not null,
    sec_action_id varchar2(36) not null,
    sec_resource_role_id varchar2(36),
    primary key (id),
    unique (sec_role_id, sec_action_id, sec_resource_role_id)
)::

create table sec_team_space (
    id varchar2(36) not null,
    version integer default 0 not null,
    enabled varchar2(1) default 'y' not null,
    name varchar2(255) not null,
    description varchar2(4000),
    primary key (id),
    unique (name)
)::

create table sec_user_role_on_team (
    id varchar2(36) not null,
    version integer default 0 not null,
    sec_user_id varchar2(36) not null,
    sec_role_id varchar2(36) not null,
    sec_team_space_id varchar2(36) not null,
    primary key (id),
    unique (sec_user_id, sec_role_id, sec_team_space_id)
)::



alter table sec_auth_token drop constraint sec_auth_token_uc::
alter table sec_user drop constraint sec_user_uc::

-- Drop indices if they exist
declare
index_not_exists EXCEPTION;
PRAGMA EXCEPTION_INIT(index_not_exists, -1418);
begin
    execute immediate 'drop index sec_auth_token_uc';
exception
    when index_not_exists then null;
end;::

declare
index_not_exists EXCEPTION;
PRAGMA EXCEPTION_INIT(index_not_exists, -1418);
begin
    execute immediate 'drop index sec_user_uc';
exception
    when index_not_exists then null;
end;::

create table sec_auth_token2 (
    id varchar2(36) not null,
    version integer default 0 not null,
    sec_user_id varchar2(36) not null,
    token varchar2(255) not null,
    expiration numeric not null,
    description varchar2(1024),
    os_user varchar2(255),
    host varchar2(255),
    primary key (id),
    constraint sec_auth_token_uc unique (token)
)::

create table sec_authentication_realm2 (
    id varchar2(36) not null,
    version integer default 0 not null,
    name varchar2(64) not null,
    description varchar2(1024),
    sort_order integer not null,
    enabled varchar2(1) default 'n' not null,
    read_only varchar2(1) default 'n' not null,
    login_module varchar2(1024) not null,
    sec_authorization_realm_id varchar2(36) not null,
    ghosted_date numeric default 0 not null,
    allowed_attempts integer default 0 not null,
    primary key (id)
)::

create table sec_authentication_realm_prop2 (
    sec_authentication_realm_id varchar2(36) not null,
    name varchar2(1024) not null,
    value varchar2(4000)
)::

create table sec_authorization_realm2 (
    id varchar2(36) not null,
    version integer default 0 not null,
    name varchar2(64) not null,
    description varchar2(1024),
    authorization_module varchar2(1024) not null,
    primary key (id)
)::

create table sec_authorization_realm_prop2 (
    sec_authorization_realm_id varchar2(36) not null,
    name varchar2(1024) not null,
    value varchar2(4000)
)::

create table sec_group2 (
    id varchar2(36) not null,
    version integer default 0 not null,
    name varchar2(255) not null,
    sec_authorization_realm_id varchar2(36) not null,
    enabled varchar2(1) default 'y' not null,
    primary key (id),
    unique (name, sec_authorization_realm_id)
)::

create table sec_group_mapper2 (
    id varchar2(36) not null,
    version integer default 0 not null,
    name varchar2(64) not null unique,
    primary key (id)
)::

create table sec_group_mapping2 (
    id varchar2(36) not null,
    version integer default 0 not null,
    sec_group_mapper_id varchar2(36) not null,
    regex varchar2(256) not null,
    replacement varchar2(256) not null,
    primary key (id)
)::

create table sec_internal_user2 (
    id varchar2(36) not null,
    version integer default 0 not null,
    name varchar2(64) not null,
    password varchar2(128) not null,
    encoded smallint default 0 not null,
    primary key (id)
)::

create table sec_resource2 (
    id varchar2(36) not null,
    version integer default 0 not null,
    name varchar2(256) not null,
    enabled varchar2(1) default 'y' not null,
    sec_resource_type_id varchar2(36) not null,
    primary key (id)
)::

create table sec_resource_hierarchy2 (
    parent_sec_resource_id varchar2(36) not null,
    child_sec_resource_id varchar2(36) not null,
    path_length integer not null,
    primary key (parent_sec_resource_id, child_sec_resource_id)
)::

create table sec_resource_type2 (
    id varchar2(36) not null,
    version integer default 0 not null,
    name varchar2(256) not null,
    enabled varchar2(1) default 'y' not null,
    primary key (id)
)::

create table sec_user2 (
    id varchar2(36) not null,
    version integer default 0 not null,
    name varchar2(255) not null,
    enabled varchar2(1) default 'y' not null,
    password varchar2(256),
    actual_name varchar2(256),
    email varchar2(256),
    im_id varchar2(256),
    sec_authentication_realm_id varchar2(36) not null,
    ghosted_date numeric default 0 not null,
    failed_attempts integer default 0 not null,
    primary key (id),
    constraint sec_user_uc unique (name, sec_authentication_realm_id, ghosted_date)
)::

create table sec_user_to_group2 (
    sec_user_id varchar2(36) not null,
    sec_group_id varchar2(36) not null,
    unique (sec_user_id, sec_group_id)
)::


insert into sec_auth_token2
select id, version, sec_user_id, token, expiration, description, os_user, host
from sec_auth_token::

insert into sec_authentication_realm2
select id, version, name, description, sort_order, enabled, read_only, login_module,
sec_authorization_realm_id, ghosted_date, allowed_attempts
from sec_authentication_realm::

insert into sec_authentication_realm_prop2
select sec_authentication_realm_id, name, value
from sec_authentication_realm_prop::

insert into sec_authorization_realm2
select id, version, name, description, authorization_module
from sec_authorization_realm::

insert into sec_authorization_realm_prop2
select sec_authorization_realm_id, name, value
from sec_authorization_realm_prop::

insert into sec_group2
select id, version, name, sec_authorization_realm_id, enabled
from sec_group::

insert into sec_group_mapper2
select id, version, name
from sec_group_mapper::

insert into sec_group_mapping2
select id, version, sec_group_mapper_id, regex, replacement
from sec_group_mapping::

insert into sec_resource2
select id, version, name, enabled, sec_resource_type_id
from sec_resource::

insert into sec_resource_hierarchy2
select parent_sec_resource_id, child_sec_resource_id, path_length
from sec_resource_hierarchy::

insert into sec_resource_type2
select id, version, name, enabled
from sec_resource_type::

insert into sec_user2
select id, version, name, enabled, password, actual_name, email, im_id,
sec_authentication_realm_id, ghosted_date, failed_attempts
from sec_user::

insert into sec_user_to_group2
select sec_user_id, sec_group_id
from sec_user_to_group::


drop table sec_auth_token::
drop table sec_authentication_realm_prop::
drop table sec_authorization_realm_prop::
drop table sec_group_mapping::
drop table sec_group_mapper::
drop table sec_user_to_group::
drop table sec_internal_user::
drop table sec_resource_hierarchy::
drop table sec_resource::
drop table sec_resource_type::
drop table sec_group::
drop table sec_user::
drop table sec_authorization_realm::
drop table sec_authentication_realm::

rename sec_auth_token2 to sec_auth_token::
rename sec_authentication_realm2 to sec_authentication_realm::
rename sec_authentication_realm_prop2 to sec_authentication_realm_prop::
rename sec_authorization_realm2 to sec_authorization_realm::
rename sec_authorization_realm_prop2 to sec_authorization_realm_prop::
rename sec_group2 to sec_group::
rename sec_group_mapper2 to sec_group_mapper::
rename sec_group_mapping2 to sec_group_mapping::
rename sec_internal_user2 to sec_internal_user::
rename sec_resource2 to sec_resource::
rename sec_resource_hierarchy2 to sec_resource_hierarchy::
rename sec_resource_type2 to sec_resource_type::
rename sec_user2 to sec_user::
rename sec_user_to_group2 to sec_user_to_group::

--this was added after 5.0 branch was dead.
--it is here in the case we need to backport security upgrade to 4.8.5 to make sure upgrades work
alter table ds_apikey add constraint apikey_2_user foreign key(sec_user_id) references sec_user(id)::

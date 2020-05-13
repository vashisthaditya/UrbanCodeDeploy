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
create table inv_db_version (
    release_name varchar(36) not null,
    ver numeric default 0 not null
) engine = innodb;

create table inv_resource_inventory (
    id varchar(36) not null primary key,
    version numeric default 0 not null,
    resource_id varchar(36) not null,
    version_id varchar(36) not null,
    component_id varchar(36) not null,
    status varchar(255) not null,
    date_created bigint not null,
    deployment_request_id varchar(36) not null,
    ghosted_date bigint default 0 not null
) engine = innodb;

create table inv_desired_inventory (
    id varchar(36) not null primary key,
    version numeric default 0 not null,
    environment_id varchar(36) not null,
    role_id varchar(36) not null,
    version_id varchar(36) not null,
    component_id varchar(36) not null,
    status varchar(255) not null,
    date_created bigint not null,
    deployment_request_id varchar(36),
    ghosted_date bigint default 0 not null
) engine = innodb;

create table inv_env_prop_inventory (
    id varchar(36) not null primary key,
    version numeric default 0 not null,
    environment_id varchar(36) not null,
    component_id varchar(36) not null,
    prop_version bigint not null,
    date_created bigint not null,
    deployment_request_id varchar(36) not null,
    ghosted_date bigint default 0 not null
) engine = innodb;

create table inv_resource_config_inventory (
    id varchar(36) not null primary key,
    version numeric default 0 not null,
    resource_id varchar(36) not null,
    prop_sheet_path varchar(255) not null,
    prop_sheet_version numeric not null,
    date_created bigint not null,
    deployment_request_id varchar(36) not null,
    ghosted_date bigint default 0 not null
) engine = innodb;

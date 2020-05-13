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
create table top_db_version (
    release_name nvarchar(36) not null,
    ver integer default 0 not null
);
create table top_server2server (
    id nvarchar(36) not null primary key,
    from_server_id nvarchar(64) not null,
    to_server_id nvarchar(64) not null
);

create table top_server2relay (
    id nvarchar(36) not null primary key,
    from_server_id nvarchar(64) not null,
    to_relay_id nvarchar(64) not null
);

create table top_server2agent (
    id nvarchar(36) not null primary key,
    from_server_id nvarchar(64) not null,
    to_agent_id nvarchar(64) not null
);

create table top_relay2agent (
    id nvarchar(36) not null primary key,
    from_server_id nvarchar(64),
    from_relay_id nvarchar(64) not null,
    to_agent_id nvarchar(64) not null
);

create table top_hatimer (
    id nvarchar(36) not null primary key,
    fired bigint not null
);

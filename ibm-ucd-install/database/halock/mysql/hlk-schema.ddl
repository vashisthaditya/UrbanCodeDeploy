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
create table hlk_db_version (
    release_name varchar(36) not null,
    ver numeric default 0 not null
) engine = innodb;

create table hlk_lock (
    id varchar(36) primary key,
    locked varchar(1) default 'N' not null,
    owner varchar(36),
    last_locked_heartbeat bigint default 0 not null
) engine = innodb;

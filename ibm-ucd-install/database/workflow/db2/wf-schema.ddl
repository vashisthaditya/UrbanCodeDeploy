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
create table wf_db_version (
    release_name varchar(256) not null,
    ver integer default 0 not null
);

create table wf_workflow (
    id varchar(36) not null primary key,  
    workflow_data blob not null
);

create table wf_dispatched_task (
    id varchar(36) not null primary key,
    workflow_id varchar(36) not null,
    context_id varchar(36) not null,
    dispatched varchar(1) not null,
    method_name varchar(128) not null,
    priority integer not null,
    method_data blob
); 

create table wf_workflow_trace (
    id varchar(36) not null primary key,
    workflow_trace_data clob not null,
    format integer
);

create table wf_workflow_metadata (
    workflow_trace_id varchar(36) not null primary key,
    result varchar(32),
    status varchar(32),
    start_time bigint,
    end_time bigint,
    duration_time bigint,
    paused varchar(1) not null
);

create index wf_disp_task_wfid on wf_dispatched_task(workflow_id);

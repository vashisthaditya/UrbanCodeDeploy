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
    workflow_data oid not null
);
create rule drop_wf_workflow_data as on delete to wf_workflow do select lo_unlink(old.workflow_data);
create rule change_wf_workflow_data as on update to wf_workflow do select lo_unlink(old.workflow_data) where old.workflow_data <> new.workflow_data;

create table wf_dispatched_task (
    id varchar(36) not null primary key,
    workflow_id varchar(36) not null,
    context_id varchar(36) not null,
    dispatched varchar(1) not null,
    method_name varchar(128) not null,
    priority integer not null,  
    method_data oid
); 
create rule drop_wf_method_data as on delete to wf_dispatched_task do select lo_unlink(old.method_data);
create rule change_wf_method_data as on update to wf_dispatched_task do select lo_unlink(old.method_data) where old.method_data <> new.method_data;

create table wf_workflow_trace (
    id varchar(36) not null primary key,
    workflow_trace_data oid not null,
    format integer
);
create rule drop_wf_workflow_trace_data as on delete to wf_workflow_trace do select lo_unlink(old.workflow_trace_data);
create rule change_wf_workflow_trace_data as on update to wf_workflow_trace do select lo_unlink(old.workflow_trace_data) where old.workflow_trace_data <> new.workflow_trace_data;

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

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
drop table wf_dispatched_task;
drop table wf_workflow;
drop table wf_runtime_property;
drop table wf_execution_context;
drop table wf_signal;
drop table wf_event_listener_property;
drop table wf_workflow_event_listener;

update wf_activity_trace set execution_status = 'CLOSED', execution_result = 'CANCELED' where execution_status = 'EXECUTING';

alter table wf_workflow_trace add created_ts bigint default 0 not null;
alter table wf_activity_trace add created_ts bigint default 0 not null;
update wf_activity_trace set created_ts = child_index_order;

DECLARE @constraintName sysname
SELECT @constraintName = (SELECT object_name(CDEFAULT)
    FROM syscolumns
    WHERE ID = object_id('wf_workflow_trace')
    AND NAME = 'version'
)
EXEC('ALTER TABLE wf_workflow_trace DROP ' + @constraintName);

DECLARE @constraintName sysname
SELECT @constraintName = (SELECT object_name(CDEFAULT)
    FROM syscolumns
    WHERE ID = object_id('wf_activity_trace')
    AND NAME = 'version'
)
EXEC('ALTER TABLE wf_activity_trace DROP ' + @constraintName);

alter table wf_activity_trace drop column version;
alter table wf_workflow_trace drop column version;

create table wf_workflow (
    id nvarchar(36) not null primary key,  
    workflow_data varbinary(max) not null
);

create table wf_dispatched_task (
    id nvarchar(36) not null primary key,
    workflow_id nvarchar(36) not null,
    context_id nvarchar(36) not null,
    dispatched nvarchar(1) not null,
    method_name nvarchar(128) not null,
    priority integer not null
); 

create table wf_workflow_trace_pause (
    id nvarchar(36) not null primary key,
    created_ts bigint not null,
    workflow_trace_id nvarchar(36) not null,
    paused integer not null
);

create table wf_workflow_trace_root (
    workflow_trace_id nvarchar(36) not null,
    activity_trace_id nvarchar(36) not null,
    
    constraint wf_wtr_pk primary key (workflow_trace_id, activity_trace_id)
);

create table wf_activity_trace_start (
    id nvarchar(36) not null primary key,
    created_ts bigint not null,
    activity_trace_id nvarchar(36) not null,
    started_ts bigint not null
);

create table wf_activity_trace_end (
    id nvarchar(36) not null primary key,
    created_ts bigint not null,
    activity_trace_id nvarchar(36) not null,
    ended_ts bigint not null
);

create table wf_activity_trace_status (
    id nvarchar(36) not null primary key,
    created_ts bigint not null,
    activity_trace_id nvarchar(36) not null,
    status nvarchar(32) not null
);

create table wf_activity_trace_result (
    id nvarchar(36) not null primary key,
    created_ts bigint not null,
    activity_trace_id nvarchar(36) not null,
    result nvarchar(32) not null
);

DECLARE @constraintName sysname
SELECT @constraintName = (SELECT object_name(CDEFAULT)
    FROM syscolumns
    WHERE ID = object_id('wf_activity_trace_property')
    AND NAME = 'version'
)
EXEC('ALTER TABLE wf_activity_trace_property DROP ' + @constraintName);

exec sp_rename 'wf_activity_trace_property', 'wf_activity_trace_prop';


alter table wf_activity_trace_prop drop column version;
alter table wf_activity_trace_prop drop column property_type;
alter table wf_activity_trace_prop add created_ts bigint;
update wf_activity_trace_prop set created_ts = 0;
alter table wf_activity_trace_prop alter column created_ts bigint not null;


alter table wf_activity_trace_prop add property_deleted nvarchar(1); 
update wf_activity_trace_prop set property_deleted = 'N';
alter table wf_activity_trace_prop alter column property_deleted nvarchar(1) not null;

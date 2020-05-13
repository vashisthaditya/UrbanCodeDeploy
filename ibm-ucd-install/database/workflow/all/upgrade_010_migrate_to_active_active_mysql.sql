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

alter table wf_activity_trace drop column version;
alter table wf_workflow_trace drop column version;

create table wf_workflow (
    id varchar(36) binary not null primary key,  
    workflow_data longblob not null
) engine = innodb;

create table wf_dispatched_task (
    id varchar(36) binary not null primary key,
    workflow_id varchar(36) binary not null,
    context_id varchar(36) binary not null,
    dispatched varchar(1) binary not null,
    method_name varchar(128) binary not null,
    priority integer not null
) engine = innodb; 

create table wf_workflow_trace_pause (
    id varchar(36) binary not null primary key,
    created_ts bigint not null,
    workflow_trace_id varchar(36) binary not null,
    paused integer not null
) engine = innodb;

create table wf_workflow_trace_root (
    workflow_trace_id varchar(36) binary not null,
    activity_trace_id varchar(36) binary not null,
    
    constraint wf_wtr_pk primary key (workflow_trace_id, activity_trace_id)
) engine = innodb;

create table wf_activity_trace_start (
    id varchar(36) binary not null primary key,
    created_ts bigint not null,
    activity_trace_id varchar(36) binary not null,
    started_ts bigint not null
) engine = innodb;

create table wf_activity_trace_end (
    id varchar(36) binary not null primary key,
    created_ts bigint not null,
    activity_trace_id varchar(36) binary not null,
    ended_ts bigint not null
) engine = innodb;

create table wf_activity_trace_status (
    id varchar(36) binary not null primary key,
    created_ts bigint not null,
    activity_trace_id varchar(36) binary not null,
    status varchar(32) binary not null
) engine = innodb;

create table wf_activity_trace_result (
    id varchar(36) binary not null primary key,
    created_ts bigint not null,
    activity_trace_id varchar(36) binary not null,
    result varchar(32) binary not null
) engine = innodb;

rename table wf_activity_trace_property to wf_activity_trace_prop;
alter table wf_activity_trace_prop drop column version;
alter table wf_activity_trace_prop drop column property_type;
alter table wf_activity_trace_prop add created_ts bigint default 0 not null;
alter table wf_activity_trace_prop alter created_ts drop default;
alter table wf_activity_trace_prop add property_deleted varchar(1) binary default 'N' not null; 
alter table wf_activity_trace_prop alter property_deleted drop default;

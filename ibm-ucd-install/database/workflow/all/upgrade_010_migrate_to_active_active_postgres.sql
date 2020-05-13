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

alter table wf_workflow_trace add column created_ts bigint default 0 not null;
alter table wf_activity_trace add column created_ts bigint default 0 not null;
update wf_activity_trace set created_ts = child_index_order;

alter table wf_activity_trace drop column version;
alter table wf_workflow_trace drop column version;

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
    priority integer not null
); 

create table wf_workflow_trace_pause (
    id varchar(36) not null primary key,
    created_ts bigint not null,
    workflow_trace_id varchar(36) not null,
    paused integer not null
);

create table wf_workflow_trace_root (
    workflow_trace_id varchar(36) not null,
    activity_trace_id varchar(36) not null,
    
    constraint wf_wtr_pk primary key (workflow_trace_id, activity_trace_id)
);

create table wf_activity_trace_start (
    id varchar(36) not null primary key,
    created_ts bigint not null,
    activity_trace_id varchar(36) not null,
    started_ts bigint not null
);

create table wf_activity_trace_end (
    id varchar(36) not null primary key,
    created_ts bigint not null,
    activity_trace_id varchar(36) not null,
    ended_ts bigint not null
);

create table wf_activity_trace_status (
    id varchar(36) not null primary key,
    created_ts bigint not null,
    activity_trace_id varchar(36) not null,
    status varchar(32) not null
);

create table wf_activity_trace_result (
    id varchar(36) not null primary key,
    created_ts bigint not null,
    activity_trace_id varchar(36) not null,
    result varchar(32) not null
);

create table wf_activity_trace_prop (
    id varchar(36) not null primary key,
    created_ts bigint not null,
    activity_trace_id varchar(36) not null,
    property_key varchar(256) not null,
    property_value varchar(4000),
    property_value_clob text,
    property_deleted varchar(1) not null
);

alter table wf_activity_trace_property rename to wf_activity_trace_prop;
alter table wf_activity_trace_prop drop column version;
alter table wf_activity_trace_prop drop column property_type;
alter table wf_activity_trace_prop add column created_ts bigint default 0 not null;
alter table wf_activity_trace_prop alter created_ts drop default;
alter table wf_activity_trace_prop add column property_deleted varchar(1) default 'N' not null; 
alter table wf_activity_trace_prop alter property_deleted drop default;

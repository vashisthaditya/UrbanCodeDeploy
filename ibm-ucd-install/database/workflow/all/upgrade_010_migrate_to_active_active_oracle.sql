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

alter table wf_workflow_trace add created_ts numeric default 0 not null;
alter table wf_activity_trace add created_ts numeric default 0 not null;
update wf_activity_trace set created_ts = child_index_order;

alter table wf_activity_trace drop column version;
alter table wf_workflow_trace drop column version;

create table wf_workflow (
    id varchar2(36) not null primary key,  
    workflow_data blob not null
);

create table wf_dispatched_task (
    id varchar2(36) not null primary key,
    workflow_id varchar2(36) not null,
    context_id varchar2(36) not null,
    dispatched varchar2(1) not null,
    method_name varchar2(128) not null,
    priority integer not null
); 

create table wf_workflow_trace_pause (
    id varchar2(36) not null primary key,
    created_ts numeric not null,
    workflow_trace_id varchar2(36) not null,
    paused integer not null
);

create table wf_workflow_trace_root (
    workflow_trace_id varchar2(36) not null,
    activity_trace_id varchar2(36) not null,
    
    constraint wf_wtr_pk primary key (workflow_trace_id, activity_trace_id)
);

create table wf_activity_trace_start (
    id varchar2(36) not null primary key,
    created_ts numeric not null,
    activity_trace_id varchar2(36) not null,
    started_ts numeric not null
);

create table wf_activity_trace_end (
    id varchar2(36) not null primary key,
    created_ts numeric not null,
    activity_trace_id varchar2(36) not null,
    ended_ts numeric not null
);

create table wf_activity_trace_status (
    id varchar2(36) not null primary key,
    created_ts numeric not null,
    activity_trace_id varchar2(36) not null,
    status varchar2(32) not null
);

create table wf_activity_trace_result (
    id varchar2(36) not null primary key,
    created_ts numeric not null,
    activity_trace_id varchar2(36) not null,
    result varchar2(32) not null
);

rename wf_activity_trace_property to wf_activity_trace_prop;
alter table wf_activity_trace_prop drop column version;
alter table wf_activity_trace_prop drop column property_type;
alter table wf_activity_trace_prop add created_ts numeric default 0 not null;
alter table wf_activity_trace_prop modify created_ts default null;
alter table wf_activity_trace_prop add property_deleted varchar2(1) default 'N' not null; 
alter table wf_activity_trace_prop modify property_deleted default null;
alter table wf_activity_trace_prop add prop_value_clob clob lob (prop_value_clob) store as wf_act_trace_pv_clob_lob;
update wf_activity_trace_prop set prop_value_clob = property_value_clob where property_value_clob is not null;
alter table wf_activity_trace_prop drop column property_value_clob;
alter table wf_activity_trace_prop rename column prop_value_clob to property_value_clob;

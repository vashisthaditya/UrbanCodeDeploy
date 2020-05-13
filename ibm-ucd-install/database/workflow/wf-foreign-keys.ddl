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
alter table wf_dispatched_task add constraint wf_fk_tasks_wf foreign key (workflow_id) references wf_workflow(id);
create index wf_metadata_result on wf_workflow_metadata(result);
create index wf_metadata_status on wf_workflow_metadata(status);
create index wf_metadata_start_time on wf_workflow_metadata(start_time);
create index wf_metadata_end_time on wf_workflow_metadata(end_time);
create index wf_metadata_duration_time on wf_workflow_metadata(duration_time);
create index wf_metadata_paused on wf_workflow_metadata(paused);
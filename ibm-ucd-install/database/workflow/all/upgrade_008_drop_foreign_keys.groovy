/*
* Licensed Materials - Property of IBM* and/or HCL**
* UrbanCode Deploy
* UrbanCode Build
* UrbanCode Release
* AnthillPro
* (c) Copyright IBM Corporation 2011, 2017. All Rights Reserved.
* (c) Copyright HCL Technologies Ltd. 2018. All Rights Reserved.
*
* U.S. Government Users Restricted Rights - Use, duplication or disclosure restricted by
* GSA ADP Schedule Contract with IBM Corp.
*
* * Trademark of International Business Machines
* ** Trademark of HCL Technologies Limited
*/
import groovy.sql.Sql;

def connection = this.binding['CONN'];
def sql = new Sql(connection)

def statements = new ArrayList<String>();
statements.add("alter table wf_activity_trace add constraint wf_act_trace_to_act_trace foreign key(parent_activity_trace_id) references wf_activity_trace(id);");
statements.add("alter table wf_activity_trace add constraint wf_act_trace_to_wf_trace foreign key(workflow_trace_id) references wf_workflow_trace(id);");
statements.add("alter table wf_activity_trace_property add constraint wf_act_trace_prop_to_act_trace foreign key(activity_trace_id) references wf_activity_trace(id);");
statements.add("alter table wf_workflow_trace add constraint wf_wf_trace_to_act_trace foreign key(root_activity_trace_id) references wf_activity_trace(id);");
statements.add("alter table wf_execution_context add constraint wf_exec_ctx_to_exec_ctx foreign key(parent_execution_context_id) references wf_execution_context(id);");
statements.add("alter table wf_execution_context add constraint wf_exec_ctx_to_act_trace_id foreign key(activity_trace_id) references wf_activity_trace(id);");
statements.add("alter table wf_runtime_property add constraint wf_runtime_prop_to_exec_ctx foreign key(execution_context_id) references wf_execution_context(id);");
statements.add("alter table wf_workflow add constraint wf_wf_to_exec_ctx foreign key(root_execution_context_id) references wf_execution_context(id);");
statements.add("alter table wf_workflow add constraint wf_wf_to_wf_trace foreign key(workflow_trace_id) references wf_workflow_trace(id);");
statements.add("alter table wf_dispatched_task add constraint wf_dsp_task_to_exec_ctx foreign key(execution_context_id) references wf_execution_context(id);");
statements.add("alter table wf_dispatched_task add constraint wf_dsp_task_to_wf foreign key(workflow_id) references wf_workflow(id);");
statements.add("alter table wf_signal add constraint wf_signal_to_wf foreign key(workflow_id) references wf_workflow(id);");
statements.add("alter table wf_signal add constraint wf_signal_to_dsp_task foreign key(dispatched_task_id) references wf_dispatched_task(id);");
statements.add("alter table wf_workflow_event_listener add constraint wf_wf_evt_lst_to_wf foreign key(workflow_id) references wf_workflow(id);");
statements.add("alter table wf_event_listener_property add constraint wf_evt_lst_prop_to_wf_evt_lst foreign key(workflow_event_listener_id) references wf_workflow_event_listener(id);");

for (String statement : statements) {
    def tableEnd = statement.indexOf(" add constraint");
    def tableStart = "alter table ".length();
    def table = statement.substring(tableStart, tableEnd);
    
    def constraintEnd = statement.indexOf(" foreign key");
    def constraintStart = tableEnd+(" add constraint ".length());
    def constraint = statement.substring(constraintStart, constraintEnd);
    
    try {
        sql.executeUpdate("alter table "+table+" drop constraint "+constraint);
    }
    catch (Exception e) {
        System.out.println("Foreign key "+constraint+" already dropped ("+e.getMessage()+")");
    }
}

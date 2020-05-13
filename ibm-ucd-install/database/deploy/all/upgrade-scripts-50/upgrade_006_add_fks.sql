-- Licensed Materials - Property of IBM* and/or HCL**
-- UrbanCode Deploy
-- (c) Copyright IBM Corporation 2011, 2017. All Rights Reserved.
-- (c) Copyright HCL Technologies Ltd. 2018. All Rights Reserved.
--
-- U.S. Government Users Restricted Rights - Use, duplication or disclosure restricted by
-- GSA ADP Schedule Contract with IBM Corp.
--
-- * Trademark of International Business Machines
-- ** Trademark of HCL Technologies Limited
alter table sec_auth_token add constraint set_sec_user_fk
    foreign key (sec_user_id)
    references sec_user (id)
;

alter table sec_authentication_realm add constraint sar_sec_authorization_realm_fk
    foreign key (sec_authorization_realm_id)
    references sec_authorization_realm (id)
;

alter table sec_authentication_realm_prop add constraint sarp_authentication_realm_fk
    foreign key (sec_authentication_realm_id)
    references sec_authentication_realm (id)
;

alter table sec_authorization_realm_prop add constraint sarp_authorization_realm_fk
    foreign key (sec_authorization_realm_id)
    references sec_authorization_realm (id)
;

alter table sec_group add constraint sg_sec_authorization_realm_fk
    foreign key (sec_authorization_realm_id)
    references sec_authorization_realm (id)
;

alter table sec_group_mapping add constraint sgm_sec_group_mapper_fk
    foreign key (sec_group_mapper_id)
    references sec_group_mapper (id)
;

alter table sec_resource add constraint sr_sec_resource_type_fk
    foreign key (sec_resource_type_id)
    references sec_resource_type (id)
;

alter table sec_resource_hierarchy add constraint srh_parent_sec_resource_fk
    foreign key (parent_sec_resource_id)
    references sec_resource (id)
;

alter table sec_resource_hierarchy add constraint srh_child_sec_resource_fk
    foreign key (child_sec_resource_id)
    references sec_resource (id)
;

alter table sec_user add constraint su_sec_authentication_realm_fk
    foreign key (sec_authentication_realm_id)
    references sec_authentication_realm (id)
;

alter table sec_user_to_group add constraint sutg_sec_user_fk
    foreign key (sec_user_id)
    references sec_user (id)
;

alter table sec_user_to_group add constraint sutg_sec_group_fk
    foreign key (sec_group_id)
    references sec_group (id)
;





alter table sec_action add constraint sa_sec_resource_type_fk
    foreign key (sec_resource_type_id)
    references sec_resource_type (id)
;

alter table sec_group_role_on_team add constraint sgrot_sec_group_fk
    foreign key (sec_group_id)
    references sec_group (id)
;

alter table sec_group_role_on_team add constraint sgrot_sec_role_fk
    foreign key (sec_role_id)
    references sec_role (id)
;

alter table sec_group_role_on_team add constraint sgrot_sec_team_space_fk
    foreign key (sec_team_space_id)
    references sec_team_space (id)
;

alter table sec_resource_for_team add constraint srft_sec_resource_fk
    foreign key (sec_resource_id)
    references sec_resource (id)
;

alter table sec_resource_for_team add constraint srft_sec_team_space_fk
    foreign key (sec_team_space_id)
    references sec_team_space (id)
;

alter table sec_resource_for_team add constraint srft_sec_resource_role_fk
    foreign key (sec_resource_role_id)
    references sec_resource_role (id)
;

alter table sec_resource_role add constraint srr_sec_resource_type_fk
    foreign key (sec_resource_type_id)
    references sec_resource_type (id)
;

alter table sec_role_action add constraint srar_sec_role_fk
    foreign key (sec_role_id)
    references sec_role (id)
;

alter table sec_role_action add constraint srar_sec_action_fk
    foreign key (sec_action_id)
    references sec_action (id)
;

alter table sec_role_action add constraint srar_sec_resource_role_fk
    foreign key (sec_resource_role_id)
    references sec_resource_role (id)
;

alter table sec_user_role_on_team add constraint surot_sec_user_fk
    foreign key (sec_user_id)
    references sec_user (id)
;

alter table sec_user_role_on_team add constraint surot_sec_role_fk
    foreign key (sec_role_id)
    references sec_role (id)
;

alter table sec_user_role_on_team add constraint surot_sec_team_space_fk
    foreign key (sec_team_space_id)
    references sec_team_space (id)
;

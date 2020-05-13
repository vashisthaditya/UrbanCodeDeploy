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
-- ps_prop_sheet_def
create index ps_psd_psg_id on ps_prop_sheet_def(prop_sheet_group_id);
alter table ps_prop_sheet_def add constraint ps_psd_2_psg foreign key(prop_sheet_group_id) references ps_prop_sheet_group(id);
create index ps_psd_tpsd_id on ps_prop_sheet_def(template_prop_sheet_def_id);

-- ps_prop_def
create unique index ps_prop_def_uci on ps_prop_def(prop_sheet_def_id, name);
create index ps_prop_def_psd_id on ps_prop_def(prop_sheet_def_id);
alter table ps_prop_def add constraint ps_prop_def_2_psd foreign key(prop_sheet_def_id) references ps_prop_sheet_def(id);

-- ps_prop_def_allowed_value
create index ps_pdav_prop_def_id on ps_prop_def_allowed_value(prop_def_id);
alter table ps_prop_def_allowed_value add constraint ps_pdav_2_prop_def foreign key(prop_def_id) references ps_prop_def(id);

-- ps_prop_sheet_handle
create unique index ps_prop_sheet_handle_uci on ps_prop_sheet_handle(prop_sheet_def_id, prop_sheet_handle);
create index ps_psh_prop_sheet_def_id on ps_prop_sheet_handle(prop_sheet_def_id);
alter table ps_prop_sheet_handle add constraint ps_psh_2_psd foreign key(prop_sheet_def_id) references ps_prop_sheet_def(id);

-- ps_prop_sheet
create index ps_prop_sheet_psg_id on ps_prop_sheet(prop_sheet_group_id);
create index ps_prop_sheet_psd_id on ps_prop_sheet(prop_sheet_def_id);
alter table ps_prop_sheet add constraint ps_prop_sheet_2_psg foreign key(prop_sheet_group_id) references ps_prop_sheet_group(id);
alter table ps_prop_sheet add constraint ps_prop_sheet_2_psd foreign key(prop_sheet_def_id) references ps_prop_sheet_def(id);

-- ps_prop_value
create unique index ps_prop_val_uci on ps_prop_value(name, prop_sheet_id);
create index ps_prop_val_prop_sheet_id on ps_prop_value(prop_sheet_id);
alter table ps_prop_value add constraint ps_prop_val_to_prop_sheet foreign key(prop_sheet_id) references ps_prop_sheet(id);

-- ps_http_prop_info
create unique index ps_http_prop_info_uci on ps_http_prop_info(prop_def_id, version);
alter table ps_http_prop_info add constraint ps_http_prop_info_fk foreign key(prop_def_id) references ps_prop_def(id);

-- ps_scripted_prop_info
create unique index ps_scripted_prop_info_uci on ps_scripted_prop_info(prop_def_id, version);
alter table ps_scripted_prop_info add constraint ps_scripted_prop_info_fk foreign key(prop_def_id) references ps_prop_def(id);

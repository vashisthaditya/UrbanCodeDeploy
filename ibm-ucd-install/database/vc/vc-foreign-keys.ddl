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
create index vc_commit_path_path on vc_commit_path_entry(path);
create index vc_commit_path_commit_id on vc_commit_path_entry(commit_id);
alter table vc_commit_path_entry add constraint vc_commit_path_to_commit foreign key (commit_id) references vc_commit (id);

create index vc_persistent_rec_path_ver on vc_persistent_record(path, relative_version);
create index vc_persist_rec_commit_path on vc_persistent_record(commit_id, path);
create index vc_persistent_record_version on vc_persistent_record(relative_version);
create index vc_persistent_record_directory on vc_persistent_record(directory);

create index vc_lve_persistent_record_id on vc_latest_version_entry(persistent_record_id);
create index vc_lve_path_commit_rec on vc_latest_version_entry(path, commit_id, persistent_record_id);
create index vc_lve_del_path_ver_rec on vc_latest_version_entry(deleted, path, relative_version, persistent_record_id);
create index vc_lve_del_dir_rec on vc_latest_version_entry(deleted, directory, persistent_record_id);

create index vc_prm_gen_key on vc_persistent_record_metadata(metadata_generator, metadata_key);
create index vc_prm_key on vc_persistent_record_metadata(metadata_key);
create index vc_prm_value on vc_persistent_record_metadata(metadata_value);
create index vc_prm_record_id on vc_persistent_record_metadata(persistent_record_id);
create index vc_prm_record_commit on vc_persistent_record_metadata(persistent_record_commit);

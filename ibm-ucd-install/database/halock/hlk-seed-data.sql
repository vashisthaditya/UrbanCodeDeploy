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
insert into hlk_db_version (release_name, ver) values ('1.0', 1);

-- Instance use by HALockManagerImpl to serialize lock creation
insert into hlk_lock (id, locked, owner, last_locked_heartbeat) values ('e5abd30c-9f7f-4b60-bf8d-5a00ddcaf94d', 'N', NULL, 0);
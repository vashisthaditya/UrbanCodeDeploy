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

create index top_server2server_from on top_server2server(from_server_id);
create index top_server2server_to on top_server2server(to_server_id);
create index top_server2relay_from on top_server2relay(from_server_id);
create index top_server2relay_to on top_server2relay(to_relay_id);
create index top_server2agent_from on top_server2agent(from_server_id);
create index top_server2agent_to on top_server2agent(to_agent_id);
create index top_relay2agent_from on top_relay2agent(from_relay_id);
create index top_relay2agent_to on top_relay2agent(to_agent_id);

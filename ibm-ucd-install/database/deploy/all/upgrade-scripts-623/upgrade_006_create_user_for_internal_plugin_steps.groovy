/*
* Licensed Materials - Property of IBM* and/or HCL**
* UrbanCode Deploy
* (c) Copyright IBM Corporation 2011, 2017. All Rights Reserved.
* (c) Copyright HCL Technologies Ltd. 2018. All Rights Reserved.
*
* U.S. Government Users Restricted Rights - Use, duplication or disclosure restricted by
* GSA ADP Schedule Contract with IBM Corp.
*
* * Trademark of International Business Machines
* ** Trademark of HCL Technologies Limited
*/

import groovy.sql.Sql
import org.apache.commons.codec.binary.Base64;
import com.urbancode.commons.util.crypto.CryptStringUtil

def connection = this.binding['CONN'];
def sql = new Sql(connection)

def createRoleSQL = """
insert into sec_role (id, version, name, description, enabled)
values (?, 0, ?, ?, 'Y')""";

def giveActionToRoleSQL = """
insert into sec_role_action (id, version, sec_role_id, sec_action_id)
values (?, 0, ?, ?)""";

def createUserSQL = """
insert into sec_user (id, version, name, enabled, password, sec_authentication_realm_id)
values (?, 0, ?, 'Y', ?, ?)"""

def addUserToTeamSQL = """
insert into sec_user_role_on_team (id, version, sec_user_id, sec_role_id, sec_team_space_id)
values (?, 0, ?, ?, ?)""";


byte[] randBytes = new byte[128];
Random rand = new Random();
rand.nextBytes(randBytes);
String builtInPassword = Base64.encodeBase64String(randBytes);
builtInPassword = CryptStringUtil.hash(builtInPassword);


def rolesToCreate = [];
rolesToCreate << ['979b2e9f-d214-49f6-87c5-6f0403829df1', 'UC Version Import', ''];
rolesToCreate << ['f722b338-01c1-43cb-bc53-853cfb0d2249', 'UC Auto Discovery', ''];
rolesToCreate << ['251a33d3-3e62-47c5-b64e-ad4b0494cecb', 'UC Auto Configure', ''];

def actions = [];
// Actions for the Version Import Role
actions << ['7f052d31-03b7-406e-bb01-8fde5d1c5667', '979b2e9f-d214-49f6-87c5-6f0403829df1', '20000000000000000000000000140002'];
actions << ['9f3419ca-943d-4e59-8847-667c92ad2f00', '979b2e9f-d214-49f6-87c5-6f0403829df1', '20000000000000000000000000140004'];
actions << ['b483673f-7c54-4a5c-aef0-f6b3eeee0cb9', '979b2e9f-d214-49f6-87c5-6f0403829df1', '20000000000000000000000000140009'];

// Actions for the Auto Discovery Role
actions << ['ab5cbda4-33a4-4c35-83c9-96abe0e634bc', 'f722b338-01c1-43cb-bc53-853cfb0d2249', '20000000000000000000000000190001'];
actions << ['fa64dc16-bd23-45a3-967d-9f5ff3130b00', 'f722b338-01c1-43cb-bc53-853cfb0d2249', '20000000000000000000000000190002'];
actions << ['0f18c891-6650-42dd-b226-107ec085e359', 'f722b338-01c1-43cb-bc53-853cfb0d2249', '20000000000000000000000000190007'];
actions << ['b2d75913-f497-42dc-a0b2-10e3838f6076', 'f722b338-01c1-43cb-bc53-853cfb0d2249', '20000000000000000000000000110001'];
actions << ['bb4771f2-9ba1-4e1b-8108-e4f09dea82a7', '251a33d3-3e62-47c5-b64e-ad4b0494cecb', '20000000000000000000000000190009'];

// Actions for the Auto Configure Role
actions << ['d96f4837-dc04-43fd-9154-99c7d6cb0d1e', '251a33d3-3e62-47c5-b64e-ad4b0494cecb', '20000000000000000000000000190001'];
actions << ['3d078211-deb2-49e9-ac39-5afedde51632', '251a33d3-3e62-47c5-b64e-ad4b0494cecb', '20000000000000000000000000190002'];
actions << ['8d845240-507d-4fa5-9fa4-33385f70dbb9', '251a33d3-3e62-47c5-b64e-ad4b0494cecb', '20000000000000000000000000190007'];
actions << ['9fb76e38-efcf-4ebc-af82-5fb1ec6e2980', '251a33d3-3e62-47c5-b64e-ad4b0494cecb', '20000000000000000000000000110001'];

def users = [];
users << ['3bc38da4-4811-4aa6-bef3-05d87d34d0b5', 'UC Version Import', builtInPassword, '20000000000000000000000000000001'];
users << ['fcb9ec26-4f0d-4c8a-83df-2a55afcb7153', 'UC Auto Discovery', builtInPassword, '20000000000000000000000000000001'];
users << ['79f349d5-0c10-476b-a8ca-35367cf689c9', 'UC Auto Configure', builtInPassword, '20000000000000000000000000000001'];

def teamMaps = [];
teamMaps << ['d227e456-f6cc-43d6-aa42-6a22b91cd2e5', '3bc38da4-4811-4aa6-bef3-05d87d34d0b5', '979b2e9f-d214-49f6-87c5-6f0403829df1', '20000000000000000000000100000000'];
teamMaps << ['1ee7629a-4497-448d-bc1d-4c41f7d3e53f', 'fcb9ec26-4f0d-4c8a-83df-2a55afcb7153', 'f722b338-01c1-43cb-bc53-853cfb0d2249', '20000000000000000000000100000000'];
teamMaps << ['de083d3c-1c4a-4882-b2f4-37d12d96fffe', '79f349d5-0c10-476b-a8ca-35367cf689c9', '251a33d3-3e62-47c5-b64e-ad4b0494cecb', '20000000000000000000000100000000'];


rolesToCreate.each { role ->
    sql.execute(createRoleSQL, role);
}

actions.each { act ->
    sql.execute(giveActionToRoleSQL, act);
}

users.each { user ->
    sql.execute(createUserSQL, user);
}

teamMaps.each { map ->
    sql.execute(addUserToTeamSQL, map);
}

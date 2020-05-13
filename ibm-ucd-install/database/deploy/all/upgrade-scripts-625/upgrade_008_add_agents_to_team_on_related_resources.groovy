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
import com.urbancode.commons.validation.ValidationException
import com.urbancode.commons.validation.ValidationRules
import com.urbancode.commons.validation.format.RequiredValueValidationRule
import com.urbancode.commons.validation.format.YesNoValidationRule

def connection = this.binding['CONN'];
def sql = new Sql(connection)

def yesNoValidator = new ValidationRules()
yesNoValidator.addRule(new RequiredValueValidationRule())
yesNoValidator.addRule(new YesNoValidationRule())

def collectDataForUpdate =
'''
    select
      distinct agn.sec_resource_id, resForTeam.sec_team_space_id
    from
      ds_agent agn
      left join ds_resource res on res.agent_id = agn.id
      left join sec_resource_for_team resForTeam on resForTeam.sec_resource_id = res.sec_resource_id
    where
      agn.ghosted_date = 0
      and res.ghosted_date = 0
      and resForTeam.sec_team_space_id != '20000000000000000000000100000000'
      and agn.id not in (
        select
          agent.id
        from
          ds_agent agent
          left join sec_resource_for_team srft on srft.sec_resource_id = agent.sec_resource_id
        where
          srft.sec_team_space_id != '20000000000000000000000100000000'
      )
'''

def insertData =
'''
    insert into
      sec_resource_for_team
        (id, version, sec_resource_id, sec_resource_role_id, sec_team_space_id)
    values
        (?, 0, ?, null, ?)
'''

def String read(defaultValue) {
    def systemIn = System.in.newReader()
    def line = systemIn.readLine()?.trim()
    return line ?: defaultValue
}

def String prompt(curValue, promptText, defaultValue, validator) {
    def properties = this.getBinding().getVariable("ANT_PROPERTIES");
    def nonInteractive = properties.nonInteractive;

    // use curValue if not null and not empty
    if (curValue != null && curValue.trim()) {
        return curValue
    }

    if (nonInteractive) {
        println(promptText)

        if (validator != null) {
            try {
                validator.validate(defaultValue)
            } catch (ValidationException ve) {
                throw new IllegalArgumentException(
                "Non-Interactive Mode: problem with default value of '${defaultValue}' " +
                "for '${promptText}' - " + ve.getValidationMessageArray().join(' '))
            }
        }
        return defaultValue
    }

    def userValue = null
    def valid = false
    while (!valid) {
        println(promptText)
        userValue = read(defaultValue)

        if (validator != null) {
            try {
                validator.validate(userValue)
                valid = true
            }
            catch (ValidationException ve) {
                for (message in ve.getValidationMessageArray()) {
                    println(message)
                }
            }
        }
        else {
            valid = true
        }
    }

    return userValue
}

String promptString = 'Agent Execute permission is now required to run processes. ' +
                      'Teams can be automatically propagated from resources to the agents associated with them. ' +
                      'Agents that already have teams associated with them will be untouched. ' +
                      'This can be done manually later. Would you like to automatically add teams to agents with no teams? ' +
                      ' default [Y]'
String shouldContinue = prompt('', promptString, 'Y', yesNoValidator)

// Collect all of the necessary data
if (shouldContinue.equalsIgnoreCase('Y')) {
    Map<String, Set<String>> inserts = new HashMap<String, Set<String>>();
    sql.eachRow(collectDataForUpdate) { row ->
        String agentSecResourceId = row[0];
        String teamId = row[1];
        Set<String> teams = inserts.get(agentSecResourceId);
        if (teams == null) {
            teams = new HashSet<String>();
            inserts.put(agentSecResourceId, teams);
        }
        teams.add(teamId);
    }

    // Perform inserts
    for (String agentSecResourceId : inserts.keySet()) {
        Set<String> teamIds = inserts.get(agentSecResourceId);
        for (String teamId : teamIds) {
          sql.executeUpdate(insertData, [UUID.randomUUID().toString(), agentSecResourceId, teamId]);
        }
    }
}
else {
    println("upgrade skipped")
}
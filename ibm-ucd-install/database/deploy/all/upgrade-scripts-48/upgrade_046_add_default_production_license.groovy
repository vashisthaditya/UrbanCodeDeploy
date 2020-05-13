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
def connection = this.binding['CONN'];
def sql = new Sql(connection)

def addLicenseWithoutSecurity = '''
    insert into ds_license (id, version, license_id, license_text, description)
    values ('d3e55c81-5b09-46b6-9337-cf8b926728b4', 1, 4870, 'License-Version=2\nLicense-ID=4870\nLicense-Creation-Date=1369163670231\nLicense-Expiration=01/01/2050\nLicensed-To=IBM Customer\nCustomer-ID=1534\nContact-Name=IBM User <sw_support@us.ibm.com>\nLicense-Product=uDeploy\nLicense-Type=Production\nMax-Agent-Count=999999\nMax-User-Count=999999\nUser-Stale-Days=90\nMax-Distributed-Web-Count=999999\nMax-Relay-Server-Count=999999\nMaintenance-Expiration-Date=05/31/2013\n--signature--\nMCwCFGWWvmFlavd0VYYc9bG2H3x+gm4UAhRe28Wr1ND12D8UMX\nPqc9AFspekkA==', 'Default Production License')
'''


def addLicenseWithSecurity = '''
    insert into ds_license (id, version, license_id, license_text, description, sec_resource_id)
    values ('d3e55c81-5b09-46b6-9337-cf8b926728b4', 1, 4870, 'License-Version=2\nLicense-ID=4870\nLicense-Creation-Date=1369163670231\nLicense-Expiration=01/01/2050\nLicensed-To=IBM Customer\nCustomer-ID=1534\nContact-Name=IBM User <sw_support@us.ibm.com>\nLicense-Product=uDeploy\nLicense-Type=Production\nMax-Agent-Count=999999\nMax-User-Count=999999\nUser-Stale-Days=90\nMax-Distributed-Web-Count=999999\nMax-Relay-Server-Count=999999\nMaintenance-Expiration-Date=05/31/2013\n--signature--\nMCwCFGWWvmFlavd0VYYc9bG2H3x+gm4UAhRe28Wr1ND12D8UMX\nPqc9AFspekkA==', 'Default Production License', 'ab80cbf8-fe1f-43b7-96f5-e265d191db58')
'''
def addLicenseSecurityResource = '''
    insert into sec_resource (id, version, name, sec_resource_type_id, enabled)
    values ('ab80cbf8-fe1f-43b7-96f5-e265d191db58', 0, 'license', '20000000000000000000000000000108', 'Y')
'''

try {
    sql.executeUpdate(addLicenseWithSecurity);
    sql.executeUpdate(addLicenseSecurityResource);
}
catch (Exception e) {
    sql.executeUpdate(addLicenseWithoutSecurity);
}

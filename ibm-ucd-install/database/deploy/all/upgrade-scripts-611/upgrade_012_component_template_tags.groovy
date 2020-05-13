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
import groovy.util.XmlParser

import java.sql.Clob

def connection = this.binding['CONN']
def sql = new Sql(connection)

String selectComponentTemplates =
'''select id, relative_version, persistent_data
    from vc_persistent_record
    where directory='componentTemplates' '''

String insertTagIfNotExists =
    '''insert into ds_component_to_tag (component_id, tag_id)
    select ?, ? from ds_component_to_tag
    where component_id=? and tag_id=? having count(component_id) = 0'''

String getComponentIdsForTemplate =
    '''select id from ds_component
    where template_id=? and template_version=?
    union
        select id from ds_component
            where template_id=? and template_version=-1 and exists
                (select * from vc_latest_version_entry
                    where persistent_record_id=?)'''

sql.eachRow(selectComponentTemplates){ row ->
    def templateAsString = row.persistent_data.toString()
    if (row.persistent_data instanceof Clob) {
        java.sql.Clob clob = (java.sql.Clob) row.persistent_data
        templateAsString = clob.getCharacterStream().getText().toString()
    }
    def templateRecords = new XmlParser().parseText(templateAsString)
    if (templateRecords.tags.tag != null) {
        def templateId = templateRecords.'@id'
        for (def i = 0; i<templateRecords.tags.tag.size(); i++) {
            def tagId = templateRecords.tags.tag[i].'@id'
            sql.eachRow(getComponentIdsForTemplate,
                    [templateId, row.relative_version, templateId, row.id]) {component ->
                sql.execute(insertTagIfNotExists, [component.id, tagId, component.id, tagId])
            }
        }
    }
}
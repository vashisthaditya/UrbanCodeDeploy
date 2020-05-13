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
import groovy.sql.BatchingPreparedStatementWrapper
import java.util.UUID
import java.util.List
import java.util.ArrayList
import java.util.Set
import java.util.HashSet

def MAX_BATCH_SIZE = 50

def connection = this.binding['CONN'];
def sql = new Sql(connection)

def commitId = null
def latestRecordId2deletionId = [:]

// Loads a temporary bridge table with (persistent record, environment) associations
// for the latest version of each persistent object associated with an environment. 
def loadPersistentRecordToEnvironmentBridgeTable = {
     sql.execute('''
         insert into brg_env_id_to_pr_id 
             (pr_id, env_id)
         select 
             lve.persistent_record_id, {fn substring(lve.path,64,36)}
         from 
             vc_latest_version_entry lve
         where 
             lve.path like 'applications/________-____-____-____-____________/environments/________-____-____-____-____________/%'
         ''')
}

// Finds persistent records that need a "deletion" record because
// the associated environment has been ghosted.
def findPersistentRecordsThatNeedDeletionRecord = {
    def select = '''
        select
            pr.id
        from
            ds_environment env
            join brg_env_id_to_pr_id brg on brg.env_id = env.id
            join vc_persistent_record pr on pr.id = brg.pr_id
        where 
            env.ghosted_date != 0
            and pr.deleted = 'N'
        '''
    sql.eachRow(select) { row ->
        latestRecordId2deletionId[row[0]] = UUID.randomUUID().toString()
    }
}


// Creates commit for all the new "deletion" records.
def createCommitRecord = {
    def insert = '''
        insert into vc_commit
            (id, commit_time, commit_user, commit_comment)
        values
            (?, ?, 'admin', '')
        '''
    sql.execute(insert, [commitId, System.currentTimeMillis()]);
}

// Adds "deletion" records for persistent objects associated with
// ghosted environments.
def addDeletionRecords = {
    def insert = '''
        insert into vc_persistent_record
            (id, path, commit_id, relative_version, directory, persistent_data, deleted)
        select
            cast(? as VARCHAR(36)) as id, 
            path, 
            cast(? as BIGINT) as commit_id, 
            relative_version + 1 as relative_version, 
            directory, 
            persistent_data, 
            'Y' as deleted
        from
            vc_persistent_record
        where
            id = ?
        '''
    sql.withBatch(MAX_BATCH_SIZE, insert) { statement ->
        latestRecordId2deletionId.each { latestRecordId, deletionId ->
            statement.addBatch([deletionId, commitId, latestRecordId])
        }
    }
}

// Adds commit path entries for the newly added "deletion" persistent records.
def addCommitsForDeletionRecords = {
    def insert = '''
        insert into vc_commit_path_entry
            (id, commit_id, path, entry_type)
        select
            cast(? as VARCHAR(36)) as id, 
            cast(? as BIGINT) as commit_id, 
            path, 
            'DELETED' as deleted
        from
            vc_persistent_record
        where
            id = ?
        '''
    sql.withBatch(MAX_BATCH_SIZE, insert) { statement ->
        latestRecordId2deletionId.each { latestRecordId, deletionId ->
            statement.addBatch([deletionId, commitId, latestRecordId])
        }
    }
}

// Updates latest version entry table to point the latest version to 
// the newly added "deletion" records.
def pointLatestVersionEntriesToDeletionRecords = {
    def update = '''
        update vc_latest_version_entry
        set persistent_record_id = ? where persistent_record_id = ?
        '''
    sql.withBatch(MAX_BATCH_SIZE, update) { statement ->
        latestRecordId2deletionId.each { oldId, newId ->
            statement.addBatch([newId, oldId])
        }
    }
}

// If maxCommit.id is null then that means there are no entries in vc_commit or vc_persistent_record
// and so we can assert there is no work that needs to be done
def maxCommit = sql.firstRow('select max(id) as id from vc_commit');
if (maxCommit != null && maxCommit.id != null) {
    commitId = String.valueOf(maxCommit.id + 1)
    
    loadPersistentRecordToEnvironmentBridgeTable()
    findPersistentRecordsThatNeedDeletionRecord()

    if (latestRecordId2deletionId.size() > 0) {
        createCommitRecord();
        sql.withTransaction(addDeletionRecords)
        sql.withTransaction(addCommitsForDeletionRecords)
        sql.withTransaction(pointLatestVersionEntriesToDeletionRecords)
    }
}

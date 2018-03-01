var dbUtils = require('./db-utils.js');
const sqlite3 = require('sqlite3').verbose()
let tableCounter = 0;
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let source_configId;
let target_configId

rl.question('Source: ', (answer) => {
    source_configId = answer;
    rl.question('Target: ', (answer) => {
        target_configId = answer;
        compare();
        rl.close();
    });
});

var db;
compare = function(){
    console.log('SOURCE', source_configId, ' TARGET ', target_configId);
    if (!source_configId || !target_configId)
        return;

    db =  dbUtils.connect();
    readRecords('fp', source_configId, target_configId);
    readRecords('fonts', source_configId, target_configId);
    readRecords('plugins', source_configId, target_configId);
    readRecords('ie_plugins', source_configId, target_configId);
    readRecords('requests', source_configId, target_configId);
    readRecords('browser', source_configId, target_configId);
}

var readRecords = function(tableName, sourceId, targetId){
    readFromTable(tableName, sourceId, function(sourceRows){
        readFromTable(tableName, targetId, (targetRows) =>{
            const sourceRow = sourceRows[0];
            const targetRow = targetRows[0];
            if (sourceRow.hash !== targetRow.hash) {
                console.log('@@@@@', tableName)
                for (var w in sourceRow){
                    if (w === 'id' || w === 'configuration_id' || w === 'hash')
                        continue;
                    if (sourceRow[w] !== targetRow[w]){
                        console.log('-----', w);
                    }
                }
            };
            close();
        })
    })
}

function close(){
    tableCounter++;
    if (tableCounter === 6)
        db.close();
}

function readFromTable(table, id,  callback){
    db.serialize(function() {
        db.all("SELECT * FROM " + table + " where configuration_id=" + id, function(err, allRows) {
            if(err != null){
                console.log(err);
                callback(err);
            }

            callback(allRows);
        });
    });
}
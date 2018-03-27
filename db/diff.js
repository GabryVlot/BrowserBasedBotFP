var dbUtils = require('./db-utils.js');
let tableCounter = 0;
let closeCounter = 9;
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

    diffList('navigator', 'navigator', source_configId, target_configId, true);
    // diffList('browser', 'window_keys', source_configId, target_configId);
    // diffList('document', 'document_keys', source_configId, target_configId);
    //
    // readRecords('fp', source_configId, target_configId);
    // readRecords('fonts', source_configId, target_configId);
    // readRecords('swf_fonts', source_configId, target_configId);
    // readRecords('plugins', source_configId, target_configId);
    // readRecords('ie_plugins', source_configId, target_configId);
    // readRecords('requests', source_configId, target_configId);
    // readRecords('browser', source_configId, target_configId);
    // readRecords('document', source_configId, target_configId);
    // readRecords('navigator', source_configId, target_configId);
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

var diffList = function(tableName, listName,sourceId, targetId, compareValue){
    readFromTable(tableName, sourceId, function(sourceRows){
        readFromTable(tableName, targetId, (targetRows) =>{
            const sourceRow = sourceRows[0];
            const targetRow = targetRows[0];
            if (sourceRow.hash !== targetRow.hash) {
                const sourceList = sourceRow[listName].split(',');
                const targetList = targetRow[listName].split(',');
                let missing = [];
                let added = [];
                let modified = [];
                for (var i=0;i<sourceList.length;i++){
                    const sourceItem = sourceList[i];
                    const targetIndex = targetList.indexOf(sourceItem);
                    if (targetIndex === -1) {
                        missing.push(sourceItem);
                    }
                    else if (compareValue)
                    {
                        const targetItem = targetList[targetIndex];
                        if (sourceItem !== targetItem){
                            modified.push(sourceItem + ' #### ' + targetItem);
                        }
                    }
                }

                for (var i=0;i<targetList.length;i++){
                    const targetItem = targetList[i];
                    if (sourceList.indexOf(targetItem) === -1)
                        added.push(targetItem);
                }

                if (missing.length === 0 && added.length === 0)
                    return;

                console.log('\n##### ', listName, ' ###########\n')
                if (missing.length > 0) {
                    console.log('@@Missing@@@', missing.length, ' / sourcelist: ', sourceList.length);
                    console.log(missing.join());
                }
                if (added.length > 0){
                    console.log('@@Added@@@', added.length, ' / targetlist: ', targetList.length);
                    console.log(added.join());
                }

                if (modified.length > 0){
                    console.log('@@Modified@@@', modified.length);
                    console.log(modified.join());
                }
            };

            close();
        })
    })
}

function close(){
    tableCounter++;
    if (tableCounter === closeCounter){
        db.close();
    }
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
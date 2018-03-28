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
    if (!source_configId || !target_configId)
        return;

    db =  dbUtils.connect();

    diffList('navigator', 'navigator', source_configId, target_configId, true);
    //diffList('browser', 'window_keys', source_configId, target_configId);
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

function getObjectProperties(browserObject){
    const keys = [];
    for (var w in browserObject){ keys.push(w);}
    return keys;
}

var diffList = function(tableName, listName,sourceId, targetId, isJSON){
    readFromTable(tableName, sourceId, function(sourceRows){
        readFromTable(tableName, targetId, (targetRows) =>{
            const sourceRow = sourceRows[0];
            const targetRow = targetRows[0];
            const splitter = ',';
            if (sourceRow.hash !== targetRow.hash) {
                let sourceList;
                let targetList;
                let sourceObj;
                let targetObj;
                if (isJSON){
                    sourceObj = JSON.parse(sourceRow[listName]);
                    targetObj = JSON.parse(targetRow[listName]);
                    sourceList = getObjectProperties(sourceObj);
                    targetList = getObjectProperties(targetObj);
                }
                else{
                    sourceList = sourceRow[listName].split(splitter);
                    targetList = targetRow[listName].split(splitter);
                }
                let missing = [];
                let added = [];
                let modified = [];
                for (var i=0;i<sourceList.length;i++){
                    const key = sourceList[i];
                    const targetIndex = targetList.indexOf(key);
                    if (targetIndex === -1) {
                        missing.push(key);
                    }
                    else if (isJSON)
                    {
                        const sourceValue = sourceObj[key] || '';
                        const targetValue = targetObj[key] || '';
                        if (sourceValue.toString() !== targetValue.toString() ){
                            console.log('Compare', sourceValue, targetValue, key)
                            modified.push(key);
                        }
                    }
                }

                for (var i=0;i<targetList.length;i++){
                    const targetItem = targetList[i];
                    if (sourceList.indexOf(targetItem) === -1)
                        added.push(targetItem);
                }

                if (missing.length === 0 && added.length === 0 && modified.length === 0)
                    return;

                console.log('\n##### ', listName, ' ###########\n')
                if (missing.length > 0) {
                    console.log('@@Missing@@@', missing.length, ' / sourcelist: ', sourceList.length);
                    console.log(missing.join('\n'));
                }
                if (added.length > 0){
                    console.log('\n@@Added@@@', added.length, ' / targetlist: ', targetList.length);
                    console.log(added.join('\n'));
                }

                if (modified.length > 0){
                    console.log('\n@@Modified@@@', modified.length);
                    console.log(modified.join('\n'));
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
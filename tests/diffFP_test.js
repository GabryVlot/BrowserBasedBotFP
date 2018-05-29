const diffFP = require('../analyse/diffFP.js');
const testData = require('./test_data');

const start = function(){
    const sourceRow = testData.sourceRow;
    const targetRow = testData.targetRow;

    let result = diffFP.compareRecord('fp', sourceRow, targetRow);

}

start();
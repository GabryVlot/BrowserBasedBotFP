/**********************************************************
 * fingerprint.js
 * Responsible extracting FP properties from HTTP Body originating from Client and persisting them into DB
 *
 * License 2018 Open Source License
 * Written By: Gabry Vlot (https://github.com/GabryVlot)
 * Project: Detecting Web bot Detecting | Fingerprinting (https://github.com/GabryVlot/BrowserBasedBotFP)
 **********************************************************/

const _ = require('underscore');
const hash = require('object-hash');
const dbUtils = require('../db/db-utils.js');

//Extract FP properties from HTTP body (fpProps) object and persist them into the DB
function formatAndPersistFP(fpProps, requestHeaders){
    const db = dbUtils.connect();
    insertTableRecord('configuration', 'value', "'" + fpProps.configuration + "'", db, function(configurationId){
        processFP2Props(fpProps, configurationId, db);
        processBrowserProps(fpProps.browser, configurationId, db);
        processNavigatorProps(fpProps.navigator, configurationId, db)
        processDocumentProps(fpProps.document, configurationId, db);
        processRequestProps(requestHeaders, configurationId, db);
    });
    db.close();
}

//Process FP values originating from fingerprintjs2 library (https://github.com/Valve/fingerprintjs2)
function processFP2Props(fpProps, configurationId, db){
    //fields/values in a separated array to be able to create a SQL insert statement
    //First element is the overall Hash value of the properties
    let fields = ['hash'];
    let values = ["'" + fpProps.hash + "'"];
    const valueTableFields = ['configuration_id', 'hash', 'value'];

    //Separate Table attributes ( Plugins and fonts will be stored in a different table)
    const standaloneTables = ['regular_plugins', 'ie_plugins', 'js_fonts', 'swf_fonts'];

    _.each(fpProps.fp2, function(fingerPrint){
        if (standaloneTables.indexOf(fingerPrint.key) > -1){
            insertTableRecord(fingerPrint.key, getStringFromArray(valueTableFields), configurationId + ',"' + hash(fingerPrint.value) + '","' + fingerPrint.value.toString() + '"', db);
            return;
        }

        //Create fields/values list for remaining FP configuration
        //Switch serves for the separation between numeric and alphanumeric values
        fields.push(fingerPrint.key);
        switch(fingerPrint.key) {
            case "resolution":
            case "available_resolution":
                values.push("'" + fingerPrint.value[0].toString() + 'x' + fingerPrint.value[1].toString() + "'");
                break;
            case "touch_support":
                let touchValue = '';
                _.each(fingerPrint.value, function(value){
                    touchValue += value.toString() + ','
                })
                values.push("'" + touchValue + "'");
                break;
            case "adblock":
            case "has_lied_languages":
            case "has_lied_resolution":
            case "has_lied_os":
            case "has_lied_browser":
                values.push(fingerPrint.value ? 1 : 0);
                break;
            case "user_agent":
            case "language":
            case "cpu_class":
            case "navigator_platform":
            case "do_not_track":
            case "canvas":
            case "webgl":
            case "webgl_vendor":
                values.push("'" + fingerPrint.value + "'");
                break;
            default:
                values.push(typeof fingerPrint.value === 'number' ? fingerPrint.value : -1);
        }
    });

    fields.push('configuration_id');
    values.push(configurationId);
    insertTableRecord('fp', getStringFromArray(fields), getStringFromArray(values), db);
}

function processBrowserProps(props, configurationId, db){
    const browserFields = ['configuration_id', 'hash', 'window_keys', 'missingBindFunction', 'stackTrace', 'webSecurity', 'autoClosePopup', 'missingImage'];
    const browserValues = [configurationId, '"' + hash(props) + '"', '"' + getStringFromArray(props.window) + '"', +
        props.missingBindFunction ? 1 : 0, '"' + props.stackTrace + '"', props.webSecurity ? 1 : 0, props.autoClosePopup ? 1 : 0, props.missingImage ? 1 : 0];

    insertTableRecord('browser', getStringFromArray(browserFields), getStringFromArray(browserValues), db);
}

function processNavigatorProps(props, configurationId, db){
    const navigatorFields = ['configuration_id', 'hash', 'navigator', 'language', 'languages', 'mimeTypes', 'webSocket'];
    const navigatorValues = [configurationId, "'" +  hash(props) + "'", "'" + props.navigator + "'", "'" + props.language + "'", "'" + getStringFromArray(props.languages) + "'", "'" + props.mimeTypes + "'", "'" + props.webSocket + "'"];
    insertTableRecord('navigator', getStringFromArray(navigatorFields), getStringFromArray(navigatorValues), db);
}

function processDocumentProps(props, configurationId, db){
    const documentFields = ['configuration_id', 'hash', 'document_keys', 'documentElement'];
    let elementValue = JSON.stringify(props.documentElement);
    elementValue = elementValue.replace(/'/g, '"');
    const documentValues = [configurationId, "'" + hash(props) + "'", '"' + getStringFromArray(props.docKeys) + '"', "'" + elementValue + "'" ]
    insertTableRecord('document', getStringFromArray(documentFields), getStringFromArray(documentValues), db);
}

function processRequestProps(props, configurationId, db){
    const requestFields = ['configuration_id', 'hash', 'headers'];
    insertTableRecord('requests', getStringFromArray(requestFields), configurationId + ",'" + hash(props) + "','" + props + "'", db);
}

function getStringFromArray(arrayObject){
    return arrayObject ? arrayObject.map((value) =>  value).join(',') : '';
}

function insertTableRecord(tablename, fields, values, db, cb){
    let sqlPlugins = 'INSERT INTO ' + tablename + '(' + fields + ') VALUES ('+ values + ')';
    db.run(sqlPlugins, function(err, result) {
        if (err) {
            return console.error(tablename + ' ' + err.message);
        }
        console.log(tablename + ` Rows inserted ${this.changes}`, this.lastID);
        if (cb)
            cb(this.lastID);
    })
}

module.exports.formatAndPersistFP = formatAndPersistFP;
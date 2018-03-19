const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const _ = require('underscore');
const hash = require('object-hash');

const valueTableFields = ['configuration_id', 'hash', 'value'];
const browserFields = ['configuration_id', 'hash', 'window_keys', 'missingBindFunction', 'stackTrace', 'webSecurity', 'autoClosePopup'];
const documentFields = ['configuration_id', 'hash', 'document_keys', 'documentElement'];
const navigatorFields = ['configuration_id', 'hash', 'navigator', 'language', 'languages', 'mimeTypes'];
const requestFields = ['configuration_id', 'hash', 'headers'];

function initialize(){

    const db = connect();
    db.serialize(function() {

        db.run("CREATE TABLE if not exists configuration (" +
            "id integer PRIMARY KEY AUTOINCREMENT, " +
            "value TEXT)"
        );

        db.run("CREATE TABLE if not exists plugins (" +
            "id integer PRIMARY KEY AUTOINCREMENT, " +
            "configuration_id integer," +
            "hash text," +
            "value TEXT," +
            "FOREIGN KEY (configuration_id) REFERENCES configuration (id)" +
            ")"
        );

        db.run("CREATE TABLE if not exists ie_plugins (" +
            "id integer PRIMARY KEY AUTOINCREMENT, " +
            "hash text," +
            "configuration_id integer," +
            "value TEXT," +
            "FOREIGN KEY (configuration_id) REFERENCES configuration (id)" +
            ")"
        );

        db.run("CREATE TABLE if not exists fonts (" +
            "id integer PRIMARY KEY AUTOINCREMENT, " +
            "configuration_id integer," +
            "hash text," +
            "value TEXT," +
            "FOREIGN KEY (configuration_id) REFERENCES configuration (id)" +
            ")"
        );

        db.run("CREATE TABLE if not exists swf_fonts (" +
            "id integer PRIMARY KEY AUTOINCREMENT, " +
            "configuration_id integer," +
            "hash text," +
            "value TEXT," +
            "FOREIGN KEY (configuration_id) REFERENCES configuration (id)" +
            ")"
        );

        db.run("CREATE TABLE if not exists navigator (" +
            "id integer PRIMARY KEY AUTOINCREMENT, " +
            "configuration_id integer," +
            "hash text," +
            "navigator TEXT," +
            "language," +
            "languages," +
            "mimeTypes," +
            "FOREIGN KEY (configuration_id) REFERENCES configuration (id)" +
            ")"
        );

        db.run("CREATE TABLE if not exists document (" +
            "id integer PRIMARY KEY AUTOINCREMENT, " +
            "configuration_id integer," +
            "hash text," +
            "document_keys TEXT," +
            "documentElement TEXT," +
            "FOREIGN KEY (configuration_id) REFERENCES configuration (id)" +
            ")"
        );

        db.run("CREATE TABLE if not exists browser (" +
            "id integer PRIMARY KEY AUTOINCREMENT, " +
            "configuration_id integer," +
            "hash text," +
            "window_keys TEXT," +
            "missingBindFunction integer," +
            "stackTrace text," +
            "webSecurity integer," +
            "autoClosePopup integer," +
            "FOREIGN KEY (configuration_id) REFERENCES configuration (id)" +
            ")"
        );

        db.run("CREATE TABLE if not exists requests (" +
            "id integer PRIMARY KEY AUTOINCREMENT, " +
            "configuration_id integer," +
            "hash text," +
            "headers TEXT," +
            "FOREIGN KEY (configuration_id) REFERENCES configuration (id)" +
            ")"
        );

        db.run("CREATE TABLE if not exists fp (" +
            "id integer PRIMARY KEY AUTOINCREMENT," +
            "configuration_id integer," +
            "hash text," +
            "user_agent text," +
            "language text," +
            "color_depth integer," +
            "device_memory integer," +
            "pixel_ratio integer," +
            "hardware_concurrency integer," +
            "resolution text," +
            "available_resolution text," +
            "timezone_offset integer," +
            "session_storage integer," +
            "local_storage integer," +
            "indexed_db integer," +
            "open_database integer," +
            "cpu_class text," +
            "navigator_platform text," +
            "do_not_track text," +
            "canvas text," +
            "webgl text," +
            "webgl_vendor text," +
            "adblock integer," +
            "has_lied_languages integer," +
            "has_lied_resolution integer," +
            "has_lied_os integer," +
            "has_lied_browser integer, " +
            "touch_support text," +
            "FOREIGN KEY (configuration_id) REFERENCES configuration (id)" +
            ")"
        );
    });
    db.close();
}

function connect(){
    const dbPath = path.resolve(__dirname, 'fpdb.db')
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error(err.message);
            return;
        }
        console.log('Connected to  database.');
    });
    return db;
}

function insertFP(params, requestHeaders){
    const db = connect();
    let fields = ['hash'];
    let valueArray = ["'" + params.hash + "'"];
    let plugins = '';
    let ie_plugins = '';
    let fonts = '';
    let swfFonts = '';

    let counter = 0;
    _.each(params.fp, function(fingerPrint){
        counter++;
        // if (counter >= 6) {
        //     if (counter === 6)
        //     console.log(fingerPrint.key, fingerPrint.value)
        //     return;
        // }
         if (fingerPrint.key === 'regular_plugins'){
             plugins = fingerPrint.value;
             return;
         }

         if (fingerPrint.key === 'ie_plugins'){
             ie_plugins = fingerPrint.value;
             return;
         }

         if (fingerPrint.key === 'js_fonts') {
             fonts = fingerPrint.value;
             return;
         }

         if (fingerPrint.key === 'swf_fonts') {
             swfFonts = fingerPrint.value;
             return;
         }

         fields.push(fingerPrint.key);
        switch(fingerPrint.key) {
            case "resolution":
            case "available_resolution":
                valueArray.push("'" + fingerPrint.value[0].toString() + 'x' + fingerPrint.value[1].toString() + "'");
                break;
            case "touch_support":
                let touchValue = '';
                _.each(fingerPrint.value, function(value){
                    touchValue += value.toString() + ','
                })
                valueArray.push("'" + touchValue + "'");
                break;
            case "adblock":
            case "has_lied_languages":
            case "has_lied_resolution":
            case "has_lied_os":
            case "has_lied_browser":
                valueArray.push(fingerPrint.value ? 1 : 0);
                break;
            case "user_agent":
            case "language":
            case "cpu_class":
            case "navigator_platform":
            case "do_not_track":
            case "canvas":
            case "webgl":
            case "webgl_vendor":
                valueArray.push("'" + fingerPrint.value + "'");
                break;
            default:
                valueArray.push(typeof fingerPrint.value === 'number' ? fingerPrint.value : -1);
        }
    });

    insertTableRecord('configuration', 'value', "'" + params.configuration + "'", db, function(insertedID){
       //Plugins
       const pluginHash = hash(plugins);
       insertTableRecord('plugins', getStringFromArray(valueTableFields), insertedID + ',"' + pluginHash + '","' + plugins.toString() + '"', db);
        //ie plugins
       const iePluginHash = hash(ie_plugins);
       insertTableRecord('ie_plugins', getStringFromArray(valueTableFields), insertedID + ',"' + iePluginHash + '","' + ie_plugins.toString() + '"', db);
       //Fonts
       const fontsHash = hash(fonts);
       insertTableRecord('fonts', getStringFromArray(valueTableFields), insertedID + ',"' + fontsHash + '","' + fonts.toString() + '"', db);

        const swfFontsHash = hash(swfFonts);
        insertTableRecord('swf_fonts', getStringFromArray(valueTableFields), insertedID + ',"' + swfFontsHash + '","' + swfFonts.toString() + '"', db);

        //Browser
        const browserHash = hash(params.browser);
        const browserValues = [insertedID, '"' + browserHash + '"', '"' + getStringFromArray(params.browser.window) + '"', +
            params.browser.missingBindFunction ? 1 : 0, '"' + params.browser.stackTrace + '"', params.browser.webSecurity ? 1 : 0, params.browser.autoClosePopup ? 1 : 0];

        insertTableRecord('browser', getStringFromArray(browserFields), getStringFromArray(browserValues), db);

        //Navigator
        const navigatorHash = hash(params.navigator);
        const navigatorValues = [insertedID, "'" + navigatorHash + "'", "'" + params.navigator.navigator + "'", "'" + params.navigator.language + "'", "'" + getStringFromArray(params.navigator.languages) + "'", "'" + params.navigator.mimeTypes + "'"];
        insertTableRecord('navigator', getStringFromArray(navigatorFields), getStringFromArray(navigatorValues), db);

        //Document
        const documentHash = hash(params.document);
        let elementValue = JSON.stringify(params.document.documentElement);
        elementValue = elementValue.replace(/'/g, '"');
        const documentValues = [insertedID, "'" + documentHash + "'", '"' + getStringFromArray(params.document.docKeys) + '"', "'" + elementValue + "'" ]
        insertTableRecord('document', getStringFromArray(documentFields), getStringFromArray(documentValues), db);

        //Requests
        const requestHash = hash(requestHeaders);
       insertTableRecord('requests', getStringFromArray(requestFields), insertedID + ",'" + requestHash + "','" + requestHeaders + "'", db);

        //FP
        fields.push('configuration_id');
        valueArray.push(insertedID);

       insertTableRecord('fp', getStringFromArray(fields), getStringFromArray(valueArray), db);
    });
    db.close();
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

module.exports.initialize = initialize;
module.exports.insertFP =insertFP;
module.exports.connect = connect;
